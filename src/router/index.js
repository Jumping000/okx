import { createRouter, createWebHistory } from "vue-router";
import { storage } from "@/utils/storage";
import { useWebSocketStore } from "@/store/websocket";
import { useCurrencyStore } from "@/store/currency";
import { useOverviewStore } from "@/store/overview";
import { WebSocketType, InstrumentType } from "@/utils/websocket";
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
      {
        path: "quant",
        name: "Quant",
        component: () => import("../views/dashboard/Quant.vue"),
        meta: {
          title: "量化",
        },
      },
      {
        path: "orders",
        name: "Orders",
        component: () => import("../views/dashboard/Orders.vue"),
        meta: {
          title: "订单",
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
      const overviewStore = useOverviewStore();
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
            // 订阅现货订单数据
            await wsStore.subscribeOrders({
              instType: InstrumentType.SPOT,
              onData: (message) => {
                if (
                  message?.arg?.channel === "orders" &&
                  Array.isArray(message?.data)
                ) {
                  console.log("现货订单数据更新:", message.data);
                }
              },
            });
            // 订阅永续合约订单数据
            await wsStore.subscribeOrders({
              instType: InstrumentType.SWAP,
              onData: (message) => {
                if (
                  message?.arg?.channel === "orders" &&
                  Array.isArray(message?.data)
                ) {
                  console.log("永续合约订单数据更新:", message.data);
                }
              },
            });

            // 订阅账户数据
            if (!wsStore.getAccountData) {
              await wsStore.subscribeAccount({
                onData: (message) => {
                  if (
                    message?.arg?.channel == "account" &&
                    message?.data?.length > 0
                  ) {
                    // 账户数据更新
                    const accountData = message.data[0];
                    const details = accountData.details || [];
                    //   getAccountData
                    const originalDetails = wsStore.getAccountData?.details;
                    if (
                      originalDetails != undefined &&
                      originalDetails.length > 0
                    ) {
                      // 比对之前数据 数组对象循环 originalDetails
                      originalDetails.forEach((originalItem) => {
                        const detailItem = details.find(
                          (item) => item.ccy === originalItem.ccy
                        );
                        if (detailItem) {
                          // 融合数据
                          // 使用 Object.assign 将 originalItem 的属性合并到 detailItem 中
                          Object.assign(originalItem, detailItem);
                          // 更新到 details 中
                          details[details.indexOf(detailItem)] = originalItem;
                        } else {
                          // 如果 details 中没有对应的币种，则添加
                          details.push(originalItem);
                        }
                      });
                    }
                    // 可用余额 (USDT)
                    const availableBalance =
                      details.find((item) => item.ccy === "USDT")?.availBal ||
                      "0";

                    // 总资产 (USDT)
                    const totalBalance = accountData.totalEq || "0";

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

                    // 更新到 websocket store 中
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

                    // 更新到 overview store 中
                    overviewStore.$patch({
                      assets: {
                        total: totalBalance,
                        available: availableBalance,
                        positionCount: validPositionCount,
                      },
                    });
                  }
                },
              });
            }

            // 订阅持仓数据
            if (!wsStore.getPositionsData?.length) {
              await wsStore.subscribePositions({
                onData: (message) => {
                  if (
                    message?.arg?.channel === "positions" &&
                    message?.arg?.instType === "SWAP" &&
                    Array.isArray(message?.data)
                  ) {
                    // console.log("永续合约持仓数据更新:", message.data);
                    // console.log("当前持仓数量:", message.positionsCount);

                    // 更新到 overview store 中
                    overviewStore.$patch({
                      positions: {
                        SWAP: message.data,
                        lastUpdateTime: new Date().getTime(),
                        count: message.positionsCount,
                      },
                    });
                  }
                },
              });
            }
          } catch (error) {
            console.error("订阅数据失败:", error);
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
