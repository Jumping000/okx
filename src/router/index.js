import { createRouter, createWebHistory } from "vue-router";
import { storage } from "@/utils/storage";

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

  console.log(hasConfig);

  // 其他情况正常访问
  next();
});

// 路由错误处理
router.onError((error) => {
  console.error("路由错误:", error);
});

export default router;
