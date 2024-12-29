import axios from "axios";
import { API_CONFIG } from "../config/api";

const request = axios.create({
  baseURL: API_CONFIG.REST_URL,
  timeout: process.env.VUE_APP_API_TIMEOUT || 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权处理
          break;
        case 404:
          // 资源不存在处理
          break;
        default:
          // 其他错误处理
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default request;
