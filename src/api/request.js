import axios from "axios";
import { getAuthHeaders } from "@/utils/signature";
import { storage } from "@/utils/storage";

// 创建 axios 实例
const request = axios.create({
  baseURL: process.env.VUE_APP_OKX_REST_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    // 检查是否需要认证
    const needAuth = !config.headers?.noAuth;
    if (needAuth) {
      try {
        // 构建请求路径（包含查询参数）
        const requestPath =
          config.url +
          (config.params
            ? "?" + new URLSearchParams(config.params).toString()
            : "");

        // 获取认证头
        const authHeaders = getAuthHeaders(
          config.method,
          requestPath,
          ["POST", "PUT", "PATCH"].includes(config.method?.toUpperCase())
            ? JSON.stringify(config.data || "")
            : ""
        );

        // 合并认证头
        config.headers = {
          ...config.headers,
          ...authHeaders,
        };
      } catch (error) {
        console.error("Failed to generate auth headers:", error);
        // 如果获取认证头失败，可能是未配置 API，重定向到配置页面
        if (error.message === "API configuration not found") {
          storage.clearApiConfig();
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 如果响应码不为 0，说明请求出错
    if (res.code !== "0") {
      // 处理特定错误码
      switch (res.code) {
        case "50001": // 示例：token 过期
          storage.clearApiConfig();
          window.location.href = "/";
          break;
        default:
          console.error("API Error:", res.msg);
          break;
      }
      return Promise.reject(new Error(res.msg || "请求失败"));
    }

    return res;
  },
  (error) => {
    console.error("Response error:", error);

    // 处理网络错误
    if (!error.response) {
      return Promise.reject(new Error("网络错误，请检查您的网络连接"));
    }

    // 处理 HTTP 状态码错误
    switch (error.response.status) {
      case 401:
        // storage.clearApiConfig();
        // window.location.href = "/";
        break;
      case 403:
        return Promise.reject(new Error("没有权限访问该资源"));
      case 404:
        return Promise.reject(new Error("请求的资源不存在"));
      case 500:
        return Promise.reject(new Error("服务器错误，请稍后重试"));
      default:
        return Promise.reject(error);
    }
  }
);

/**
 * GET 请求
 * @param {string} url 请求地址
 * @param {Object} [params] 查询参数
 * @param {Object} [config] 额外配置
 * @returns {Promise} 请求Promise
 */
request.get = (url, params = {}, config = {}) => {
  return request({
    method: "get",
    url,
    params,
    ...config,
  });
};

/**
 * POST 请求
 * @param {string} url 请求地址
 * @param {Object} [data] 请求数据
 * @param {Object} [config] 额外配置
 * @returns {Promise} 请求Promise
 */
request.post = (url, data = {}, config = {}) => {
  return request({
    method: "post",
    url,
    data,
    ...config,
  });
};

export default request;
