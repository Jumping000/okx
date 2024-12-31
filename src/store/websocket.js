import { defineStore } from "pinia";
import WebSocketClient, {
  WebSocketState,
  WebSocketType,
} from "@/utils/websocket";

// WebSocket 配置
const WS_CONFIG = {
  [WebSocketType.PUBLIC]: {
    url: process.env.VUE_APP_OKX_WS_PUBLIC_URL,
    options: {
      reconnectInterval: 3000,
      reconnectMaxTimes: 3,
    },
  },
  [WebSocketType.PRIVATE]: {
    url: process.env.VUE_APP_OKX_WS_PRIVATE_URL,
    options: {
      reconnectInterval: 2000,
      reconnectMaxTimes: 5,
    },
  },
  [WebSocketType.BUSINESS]: {
    url: process.env.VUE_APP_OKX_WS_BUSINESS_URL,
    options: {
      reconnectInterval: 3000,
      reconnectMaxTimes: 3,
    },
  },
};

export const useWebSocketStore = defineStore("websocket", {
  state: () => ({
    // 存储所有 WebSocket 连接实例
    connections: {},
    // 存储所有连接状态
    connectionStates: {
      [WebSocketType.PUBLIC]: WebSocketState.CLOSED,
      [WebSocketType.PRIVATE]: WebSocketState.CLOSED,
      [WebSocketType.BUSINESS]: WebSocketState.CLOSED,
    },
    // 存储订阅信息
    subscriptions: {
      [WebSocketType.PUBLIC]: new Map(),
      [WebSocketType.PRIVATE]: new Map(),
      [WebSocketType.BUSINESS]: new Map(),
    },
    // 存储登录状态
    loginStates: {
      [WebSocketType.PRIVATE]: false,
      [WebSocketType.BUSINESS]: false,
    },
  }),

  getters: {
    // 获取指定类型连接的状态
    getConnectionState: (state) => (type) => state.connectionStates[type],

    // 检查指定类型的连接是否已连接
    isConnected: (state) => (type) =>
      state.connectionStates[type] === WebSocketState.OPEN,

    // 获取指定类型的所有订阅
    getSubscriptions: (state) => (type) =>
      Array.from(state.subscriptions[type].keys()),

    // 获取指定类型的登录状态
    isLoggedIn: (state) => (type) => state.loginStates[type] || false,
  },

  actions: {
    /**
     * 初始化指定类型的 WebSocket 连接
     * @param {string} type 连接类型
     */
    initializeConnection(type) {
      if (!WS_CONFIG[type]) {
        throw new Error(`未知的 WebSocket 连接类型: ${type}`);
      }

      if (this.connections[type]) {
        console.warn(`${type} WebSocket 连接已初始化`);
        return;
      }

      const { url, options } = WS_CONFIG[type];
      const ws = new WebSocketClient(url, {
        ...options,
        type,
      });

      // 监听状态变化
      ws.onStateChange((state) => {
        this.connectionStates[type] = state;

        // 如果重新连接成功，重新订阅所有频道
        if (state === WebSocketState.OPEN) {
          this.resubscribeAll(type);
        }
      });

      this.connections[type] = ws;
    },

    /**
     * 初始化所有 WebSocket 连接
     */
    initializeAll() {
      Object.values(WebSocketType).forEach((type) => {
        this.initializeConnection(type);
      });
    },

    /**
     * 连接指定类型的 WebSocket
     * @param {string} type 连接类型
     */
    async connect(type) {
      const ws = this.connections[type];
      if (!ws) {
        this.initializeConnection(type);
      }
      await this.connections[type].connect();
    },

    /**
     * 连接所有 WebSocket
     */
    async connectAll() {
      await Promise.all(
        Object.values(WebSocketType).map((type) => this.connect(type))
      );
    },

    /**
     * 断开指定类型的 WebSocket 连接
     * @param {string} type 连接类型
     */
    disconnect(type) {
      const ws = this.connections[type];
      if (ws) {
        ws.disconnect();
        delete this.connections[type];
        this.connectionStates[type] = WebSocketState.CLOSED;
      }
    },

    /**
     * 断开所有 WebSocket 连接
     */
    disconnectAll() {
      Object.values(WebSocketType).forEach((type) => {
        this.disconnect(type);
      });
    },

    /**
     * 订阅频道
     * @param {Object} options 订阅选项
     * @param {string} options.type 连接类型
     * @param {string} options.channel 频道名称
     * @param {Function} options.callback 消息处理函数
     */
    subscribe({ type, channel, callback }) {
      const ws = this.connections[type];
      if (!ws) {
        throw new Error(`${type} WebSocket 未初始化`);
      }

      // 存储订阅信息
      if (!this.subscriptions[type].has(channel)) {
        this.subscriptions[type].set(channel, new Set());
      }
      this.subscriptions[type].get(channel).add(callback);

      // 订阅频道
      ws.subscribe(channel, callback);
    },

    /**
     * 取消订阅频道
     * @param {Object} options 取消订阅选项
     * @param {string} options.type 连接类型
     * @param {string} options.channel 频道名称
     * @param {Function} options.callback 消息处理函数
     */
    unsubscribe({ type, channel, callback }) {
      const ws = this.connections[type];
      if (!ws) return;

      // 移除订阅信息
      if (this.subscriptions[type].has(channel)) {
        const handlers = this.subscriptions[type].get(channel);
        if (callback) {
          handlers.delete(callback);
          if (handlers.size === 0) {
            this.subscriptions[type].delete(channel);
          }
        } else {
          this.subscriptions[type].delete(channel);
        }
      }

      // 取消订阅频道
      ws.unsubscribe(channel, callback);
    },

    /**
     * 重新订阅指定类型的所有频道
     * @param {string} type 连接类型
     */
    resubscribeAll(type) {
      const subscriptions = this.subscriptions[type];
      subscriptions.forEach((handlers, channel) => {
        handlers.forEach((callback) => {
          this.connections[type].subscribe(channel, callback);
        });
      });
    },

    /**
     * 发送消息
     * @param {Object} options 发送选项
     * @param {string} options.type 连接类型
     * @param {Object} options.data 要发送的数据
     */
    send({ type, data }) {
      const ws = this.connections[type];
      if (!ws) {
        throw new Error(`${type} WebSocket 未初始化`);
      }
      return ws.send(data);
    },

    /**
     * 执行WebSocket登录
     * @param {Object} options 登录选项
     * @param {string} options.type 连接类型
     * @param {string} options.apiKey API密钥
     * @param {string} options.secretKey 密钥
     * @param {string} options.passphrase 密码短语
     * @returns {Promise<boolean>} 登录是否成功
     */
    async login({ type, apiKey, secretKey, passphrase }) {
      if (type === WebSocketType.PUBLIC) {
        throw new Error("公共频道无需登录");
      }

      const ws = this.connections[type];
      if (!ws) {
        throw new Error(`${type} WebSocket 未初始化`);
      }

      try {
        const success = await ws.login({ apiKey, secretKey, passphrase });
        this.loginStates[type] = success;
        return success;
      } catch (error) {
        this.loginStates[type] = false;
        throw error;
      }
    },

    /**
     * 登出指定类型的连接
     * @param {string} type 连接类型
     */
    logout(type) {
      if (type === WebSocketType.PUBLIC) return;

      this.loginStates[type] = false;
      // 断开连接，这样重连时需要重新登录
      this.disconnect(type);
    },

    /**
     * 登出所有需要认证的连接
     */
    logoutAll() {
      [WebSocketType.PRIVATE, WebSocketType.BUSINESS].forEach((type) => {
        this.logout(type);
      });
    },
  },
});
