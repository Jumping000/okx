import { createApp } from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import router from "./router";
import pinia from "./store";
import "ant-design-vue/dist/antd.css";
import "./styles/tailwind.css";
import "./styles/theme.css";
import "./styles/ant-theme.css";
import { storage } from "@/utils/storage";

// 设置文档标题
document.title = process.env.VUE_APP_TITLE;

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(Antd);

// 初始化主题
const initTheme = () => {
  const savedSettings = storage.get("userPreferences");
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
