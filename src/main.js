import { createApp } from "vue";
import Antd from "ant-design-vue";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import App from "./App.vue";
import router from "./router";
import pinia from "./store";
import "ant-design-vue/dist/antd.css";
import "element-plus/dist/index.css";
import "./styles/tailwind.css";
import "./styles/theme.css";
import "./styles/ant-theme.css";

// 设置文档标题
document.title = process.env.VUE_APP_TITLE;

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(Antd);
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 初始化主题
const initTheme = () => {
  const savedSettings = localStorage.getItem("userPreferences");
  if (savedSettings) {
    try {
      const { theme } = JSON.parse(savedSettings);
      document.documentElement.classList.add(theme);
      document.body.setAttribute("data-theme", theme);
    } catch (error) {
      document.documentElement.classList.add("dark");
      document.body.setAttribute("data-theme", "dark");
    }
  } else {
    document.documentElement.classList.add("dark");
    document.body.setAttribute("data-theme", "dark");
  }
};

initTheme();

app.mount("#app");
