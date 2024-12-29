import { createRouter, createWebHistory } from "vue-router";
import { storage } from "@/utils/storage";
import { wsManager } from "../utils/websocket/manager";
import { API_CONFIG } from "@/config/api";
import { WS_EVENTS } from "../utils/websocket/client";

const routes = [
  {
    path: "/",
    name: "ExchangeSetup",
    component: () => import("../views/ExchangeSetup.vue"),
    meta: {
      title: "交易所设置",
      allowNoConfig: true,
    },
  },
  {
    path: "/dashboard",
    component: () => import("../layouts/DashboardLayout.vue"),
    redirect: "/dashboard/overview",
    meta: {
      requiresConfig: true,
      requiresWebSocket: true,
    },
    children: [
      {
        path: "overview",
        name: "Overview",
        component: () => import("../views/dashboard/Overview.vue"),
        meta: {
          title: "概览",
          requiresConfig: true,
          requiresWebSocket: true,
        },
      },
      {
        path: "trade",
        name: "Trade",
        component: () => import("../views/dashboard/Trade.vue"),
        meta: {
          title: "交易",
          requiresConfig: true,
          requiresWebSocket: true,
        },
      },
      {
        path: "assets",
        name: "Assets",
        component: () => import("../views/dashboard/Assets.vue"),
        meta: {
          title: "资产",
          requiresConfig: true,
          requiresWebSocket: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// WebSocket 连接状态
let wsInitialized = false;
let wsInitializing = false;
let wsConnectAttempts = 0;
const MAX_CONNECT_ATTEMPTS = 3;

// 初始化 WebSocket 连接
async function initializeWebSocket() {
  if (wsInitialized) return true;
  if (wsInitializing) return false;
  if (wsConnectAttempts >= MAX_CONNECT_ATTEMPTS) {
    console.error("WebSocket 连接尝试次数过多");
    return false;
  }

  wsInitializing = true;
  wsConnectAttempts++;

  try {
    // 初始化 WebSocket 连接
    wsManager.initialize({
      publicUrl: API_CONFIG.WS.PUBLIC,
      privateUrl: API_CONFIG.WS.PRIVATE,
      businessUrl: API_CONFIG.WS.BUSINESS,
    });

    // 等待所有连接建立
    const publicWs = wsManager.getConnection("public");
    const privateWs = wsManager.getConnection("private");
    const businessWs = wsManager.getConnection("business");

    if (!publicWs || !privateWs || !businessWs) {
      throw new Error("WebSocket 连接创建失败");
    }

    // 创建一个 Promise 数组来等待所有连接
    const connections = [
      new Promise((resolve, reject) => {
        let timeout;
        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };
        publicWs.on(WS_EVENTS.OPEN, onOpen);
        timeout = setTimeout(() => {
          publicWs.off(WS_EVENTS.OPEN, onOpen);
          reject(new Error("Public WebSocket 连接超时"));
        }, 5000);
      }),
      new Promise((resolve, reject) => {
        let timeout;
        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };
        privateWs.on(WS_EVENTS.OPEN, onOpen);
        timeout = setTimeout(() => {
          privateWs.off(WS_EVENTS.OPEN, onOpen);
          reject(new Error("Private WebSocket 连接超时"));
        }, 5000);
      }),
      new Promise((resolve, reject) => {
        let timeout;
        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };
        businessWs.on(WS_EVENTS.OPEN, onOpen);
        timeout = setTimeout(() => {
          businessWs.off(WS_EVENTS.OPEN, onOpen);
          reject(new Error("Business WebSocket 连接超时"));
        }, 5000);
      }),
    ];

    // 等待所有连接建立
    await Promise.all(connections);

    // 验证连接状态
    if (
      !publicWs.isConnected() ||
      !privateWs.isConnected() ||
      !businessWs.isConnected()
    ) {
      throw new Error("部分 WebSocket 连接未成功建立");
    }

    wsInitialized = true;
    wsInitializing = false;
    wsConnectAttempts = 0;
    return true;
  } catch (error) {
    console.error("WebSocket 初始化失败:", error);
    wsManager.closeAll();
    wsInitialized = false;
    wsInitializing = false;
    throw error;
  }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${process.env.VUE_APP_TITLE}`;
  }

  // 检查是否已配置
  const hasConfig = storage.hasApiConfig();

  // 如果未配置且访问需要配置的页面，重定向到设置页面
  if (!hasConfig && to.meta.requiresConfig) {
    next({ name: "ExchangeSetup" });
    return;
  }

  // 如果已配置且访问的是设置页面，自动跳转到首页
  if (hasConfig && to.name === "ExchangeSetup") {
    next({ name: "Overview" });
    return;
  }

  // 如果页面需要 WebSocket 连接
  if (to.meta.requiresWebSocket && hasConfig) {
    try {
      const initialized = await initializeWebSocket();
      if (!initialized) {
        console.error("WebSocket 连接未成功，重定向到设置页面");
        next({ name: "ExchangeSetup" });
        return;
      }
      next();
    } catch (error) {
      console.error("WebSocket 连接失败，重定向到设置页面");
      next({ name: "ExchangeSetup" });
    }
    return;
  }

  // 其他情况正常访问
  next();
});

// 路由错误处理
router.onError((error) => {
  console.error("路由错误:", error);
  wsManager.closeAll();
  wsInitialized = false;
  wsInitializing = false;
  wsConnectAttempts = 0;
});

export default router;
