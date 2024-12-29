export const API_CONFIG = {
  // REST API
  REST_URL: process.env.VUE_APP_OKX_REST_URL,

  // WebSocket URLs
  WS: {
    PUBLIC: process.env.VUE_APP_OKX_WS_PUBLIC_URL,
    PRIVATE: process.env.VUE_APP_OKX_WS_PRIVATE_URL,
    BUSINESS: process.env.VUE_APP_OKX_WS_BUSINESS_URL,
  },
};

// API 版本
export const API_VERSION = "v5";

// WebSocket 配置
export const WS_CONFIG = {
  reconnectLimit: 5, // 最大重连次数
  reconnectInterval: 3000, // 重连间隔（毫秒）
  heartbeatInterval: 15000, // 心跳间隔（毫秒）
};
