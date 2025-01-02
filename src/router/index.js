import { createRouter, createWebHistory } from "vue-router";
import { storage } from "@/utils/storage";
import { useWebSocketStore } from "@/store/websocket";
import { useCurrencyStore } from "@/store/currency";
import { WebSocketType } from "@/utils/websocket";
import { message } from "ant-design-vue";

const routes = [
  {
    path: "/",
    name: "ExchangeSetup",
    component: () => import("../views/ExchangeSetup.vue"),
    meta: {
      title: "交易所设置",
    },
  },
  {
    path: "/dashboard",
    component: () => import("../layouts/DashboardLayout.vue"),
    redirect: "/dashboard/overview",
    meta: {},
    children: [
      {
        path: "overview",
        name: "Overview",
        component: () => import("../views/dashboard/Overview.vue"),
        meta: {
          title: "概览",
        },
      },
      {
        path: "trade",
        name: "Trade",
        component: () => import("../views/dashboard/Trade.vue"),
        meta: {
          title: "交易",
        },
      },
      {
        path: "assets",
        name: "Assets",
        component: () => import("../views/dashboard/Assets.vue"),
        meta: {
          title: "资产",
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 显示加载效果
  const hide = message.loading("页面加载中...", 0);

  try {
    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - ${process.env.VUE_APP_TITLE}`;
    }

    // 检查是否已配置
    const hasConfig = storage.hasApiConfig();
    if (hasConfig && to.name === "ExchangeSetup") {
      next({ name: "Overview" });
      return;
    }
    if (!hasConfig && to.name !== "ExchangeSetup") {
      next({ name: "ExchangeSetup" });
      return;
    } else if (hasConfig && to.name !== "ExchangeSetup") {
      const wsStore = useWebSocketStore();
      const currencyStore = useCurrencyStore();
      const { apiKey, secretKey, passphrase } = storage.getApiConfig();

      try {
        // 确保已获取币种信息
        if (
          !currencyStore.currencies.SPOT.length ||
          !currencyStore.currencies.SWAP.length
        ) {
          await currencyStore.fetchCurrencies();
        }

        // WebSocket登录逻辑...
        const channels = [WebSocketType.PRIVATE, WebSocketType.BUSINESS];
        for (const type of channels) {
          if (!wsStore.isConnected(type)) {
            await new Promise((resolve) => {
              const interval = setInterval(() => {
                if (wsStore.isConnected(type)) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
            });
          }

          if (!wsStore.isLoggedIn(type)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await wsStore.login({
              type,
              apiKey,
              secretKey,
              passphrase,
            });
          }
        }

        // 登录成功后，订阅账户数据
        if (wsStore.isLoggedIn(WebSocketType.PRIVATE)) {
          try {
            if (!wsStore.getAccountData) {
              await wsStore.subscribeAccount({
                onData: (message) => {
                  if (
                    message?.arg?.channel == "account" &&
                    message?.data?.length > 0
                  ) {
                    console.log("账户数据更新:", message);
                    const accountData = message.data[0];
                    const details = accountData.details || [];

                    // 可用余额 (USDT)
                    const availableBalance =
                      details.find((item) => item.ccy === "USDT")?.availBal ||
                      "0";
                    console.log("可用余额(USDT):", availableBalance);

                    // 总资产 (USDT)
                    const totalBalance = accountData.totalEq || "0";
                    console.log("总资产(USDT):", totalBalance);

                    // 计算有效持仓数量
                    const validPositions = details.filter((item) => {
                      // 排除USDT
                      if (item.ccy === "USDT") return false;

                      // 检查是否有持仓数量
                      const hasPosition = parseFloat(item.cashBal) > 0;
                      if (!hasPosition) return false;

                      // 获取该币种的现货最小下单量信息
                      const spotCurrency = currencyStore.currencies.SPOT.find(
                        (c) => c.instId === `${item.ccy}-USDT`
                      );

                      // 如果找不到对应的现货交易对，则视为无效持仓
                      if (!spotCurrency) return false;

                      // 比较持仓数量和最小下单量
                      const currentSize = parseFloat(item.cashBal);
                      const minimumSize = parseFloat(spotCurrency.minSz);

                      return currentSize >= minimumSize;
                    });

                    // 有效持仓数量
                    const validPositionCount = validPositions.length;
                    console.log("有效持仓数量:", validPositionCount);

                    // 持仓详情
                    validPositions.forEach((position) => {
                      // 获取该币种的现货最小下单量信息
                      const spotCurrency = currencyStore.currencies.SPOT.find(
                        (c) => c.instId === `${position.ccy}-USDT`
                      );

                      console.log("持仓详情:", {
                        币种: position.ccy,
                        数量: position.cashBal,
                        最小下单量: spotCurrency?.minSz || "未知",
                        估值: `${position.eqUsd} USDT (≈ ${(
                          parseFloat(position.eqUsd) * 1
                        ).toFixed(2)} USD)`,
                        可用: position.availBal,
                        冻结: position.frozenBal,
                      });
                    });

                    // 更新到store中
                    wsStore.$patch({
                      accountData: {
                        balance: {
                          ...accountData,
                          availableBalance,
                          totalBalance,
                          validPositionCount,
                          validPositions,
                        },
                        lastUpdateTime: new Date().getTime(),
                      },
                    });
                  }
                },
              });
            }
          } catch (error) {
            console.error("订阅账户数据失败:", error);
          }
        }
      } catch (error) {
        console.error("WebSocket 登录失败:", error);
        next({ name: "ExchangeSetup" });
        return;
      }
    }

    next();
  } finally {
    hide();
  }
});

// 路由错误处理
router.onError((error) => {
  console.error("路由错误:", error);
});

export default router;
