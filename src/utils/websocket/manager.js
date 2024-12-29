import WebSocketClient, { WS_EVENTS } from "./client";
import { useOverviewStore } from "@/store/overview";

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.initialized = false;
    this.overviewStore = useOverviewStore();

    // 监听网络状态变化
    window.addEventListener("online", () => this.updateOverviewConnection());
    window.addEventListener("offline", () => this.updateOverviewConnection());
  }

  /**
   * 更新连接状态到 overview store
   * @private
   */
  updateOverviewConnection() {
    const publicWs = this.connections.get("public");
    const privateWs = this.connections.get("private");
    const businessWs = this.connections.get("business");

    this.overviewStore.$patch({
      connection: {
        network: navigator.onLine,
        publicChannel: publicWs?.isConnected() || false,
        privateChannel: privateWs?.isConnected() || false,
        businessChannel: businessWs?.isConnected() || false,
      },
    });
  }

  /**
   * 初始化所有 WebSocket 连接
   * @param {Object} config WebSocket 配置
   */
  initialize(config) {
    if (this.initialized) return;

    // 创建公共频道连接
    this.createConnection("public", config.publicUrl);

    // 创建私有频道连接
    this.createConnection("private", config.privateUrl);

    // 创建业务频道连接
    this.createConnection("business", config.businessUrl);

    this.initialized = true;
  }

  /**
   * 创建 WebSocket 连接
   * @param {string} name 连接名称
   * @param {string} url WebSocket URL
   * @param {Object} options 配置选项
   */
  createConnection(name, url, options = {}) {
    if (this.connections.has(name)) {
      console.warn(`WebSocket connection '${name}' already exists`);
      return;
    }

    const ws = new WebSocketClient(url, options);

    // 添加通用事件处理
    ws.on(WS_EVENTS.OPEN, () => {
      console.log(`WebSocket '${name}' connected`);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.CLOSE, () => {
      console.log(`WebSocket '${name}' closed`);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.ERROR, (error) => {
      console.error(`WebSocket '${name}' error:`, error);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.RECONNECT, (times) => {
      console.log(`WebSocket '${name}' reconnecting... (${times})`);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.RECONNECTED, () => {
      console.log(`WebSocket '${name}' reconnected`);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.RECONNECT_FAILED, () => {
      console.error(`WebSocket '${name}' reconnect failed`);
      this.updateOverviewConnection();
    });

    ws.on(WS_EVENTS.MESSAGE, (data) => {
      try {
        const message = JSON.parse(data);
        if (message.event === "error") {
          console.error(`Channel error:`, message);
          this.updateOverviewConnection();
        }
      } catch (error) {
        // 非 JSON 消息，可能是心跳响应等
      }
    });

    this.connections.set(name, ws);
    this.updateOverviewConnection();
    ws.connect();
  }

  /**
   * 获取指定的 WebSocket 连接
   * @param {string} name 连接名称
   * @returns {WebSocketClient|undefined}
   */
  getConnection(name) {
    return this.connections.get(name);
  }

  /**
   * 关闭指定的 WebSocket 连接
   * @param {string} name 连接名称
   */
  closeConnection(name) {
    const ws = this.connections.get(name);
    if (ws) {
      ws.close();
      this.connections.delete(name);
      this.updateOverviewConnection();
    }
  }

  /**
   * 关闭所有 WebSocket 连接
   */
  closeAll() {
    this.connections.forEach((ws) => {
      ws.close();
    });
    this.connections.clear();
    this.initialized = false;
    this.updateOverviewConnection();
  }

  /**
   * 添加消息处理器
   * @param {string} name 连接名称
   * @param {Function} handler 消息处理函数
   */
  addMessageHandler(name, handler) {
    const ws = this.connections.get(name);
    if (ws) {
      ws.on(WS_EVENTS.MESSAGE, handler);
    }
  }

  /**
   * 移除消息处理器
   * @param {string} name 连接名称
   * @param {Function} handler 消息处理函数
   */
  removeMessageHandler(name, handler) {
    const ws = this.connections.get(name);
    if (ws) {
      ws.off(WS_EVENTS.MESSAGE, handler);
    }
  }

  /**
   * 发送消息
   * @param {string} name 连接名称
   * @param {Object} data 消息数据
   * @returns {boolean} 是否发送成功
   */
  send(name, data) {
    const ws = this.connections.get(name);
    return ws ? ws.send(data) : false;
  }
}

// 创建单例
export const wsManager = new WebSocketManager();

export default wsManager;
