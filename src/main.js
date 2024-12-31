import { createApp } from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import router from "./router";
import pinia from "./store";
import "ant-design-vue/dist/antd.css";
import "./styles/tailwind.css";

// 设置文档标题
document.title = process.env.VUE_APP_TITLE;

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(Antd);

app.mount("#app");
