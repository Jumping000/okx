import { createRouter, createWebHistory } from "vue-router";
import { storage } from "@/utils/storage";
import { useWebSocketStore } from "@/store/websocket";
import { WebSocketType } from "@/utils/websocket";

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
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${process.env.VUE_APP_TITLE}`;
  }

  // 检查是否已配置
  const hasConfig = storage.hasApiConfig();
  if (hasConfig && to.name === "ExchangeSetup") {
    next({ name: "overview" });
  }
  if (!hasConfig && to.name !== "ExchangeSetup") {
    // 如果未配置且访问的是设置页面，自动跳转到首页
    next({ name: "ExchangeSetup" });
    return;
  } else if (hasConfig && to.name !== "ExchangeSetup") {
    // 如果已配置且不是设置页面，则确保 WebSocket 已登录
    const wsStore = useWebSocketStore();
    const { apiKey, secretKey, passphrase } = storage.getApiConfig();
    try {
      // 检查私有频道和业务频道的连接和登录状态
      const channels = [WebSocketType.PRIVATE, WebSocketType.BUSINESS];

      for (const type of channels) {
        // 如果未连接，先连接
        if (!wsStore.isConnected(type)) {
          //写一个等待 wsStore.isConnected(type)等待变 ture
          await new Promise((resolve) => {
            const interval = setInterval(() => {
              if (wsStore.isConnected(type)) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
          });
        }

        // 如果未登录，进行登录
        if (!wsStore.isLoggedIn(type)) {
          // 延迟 两秒登录
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await wsStore.login({
            type,
            apiKey,
            secretKey,
            passphrase,
          });
        }
      }
    } catch (error) {
      console.error("WebSocket 登录失败:", error);
      // 如果登录失败，跳转到设置页面
      next({ name: "ExchangeSetup" });
      return;
    }
  }

  // 其他情况正常访问
  next();
});

// 路由错误处理
router.onError((error) => {
  console.error("路由错误:", error);
});

export default router;
