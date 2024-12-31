/**
 * WebSocket 连接管理器
 * @class WebSocketManager
 */
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectLimit: 3, // 重连次数限制
      reconnectInterval: 3000, // 重连间隔时间
      heartbeatInterval: 30000, // 心跳间隔时间
      heartbeatMessage: "ping", // 心跳消息内容
      ...options,
    };

    this.ws = null;
    this.reconnectCount = 0;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.messageListeners = new Map();
    this.status = "CLOSED"; // CONNECTING, OPEN, CLOSING, CLOSED
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    if (this.status === "CONNECTING" || this.status === "OPEN") {
      console.warn("WebSocket 已经连接或正在连接中");
      return;
    }

    this.status = "CONNECTING";
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.status = "OPEN";
      this.reconnectCount = 0;
      this.startHeartbeat();
      this.emit("open");
    };

    this.ws.onclose = () => {
      this.status = "CLOSED";
      this.stopHeartbeat();
      this.emit("close");
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      this.emit("error", error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit("message", data);
      } catch (error) {
        this.emit("message", event.data);
      }
    };
  }

  /**
   * 重新连接
   */
  reconnect() {
    if (this.reconnectCount >= this.options.reconnectLimit) {
      console.error("WebSocket 重连次数超过限制");
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.status === "OPEN") {
        this.send(this.options.heartbeatMessage);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送消息
   * @param {string|object} data
   */
  send(data) {
    if (this.status !== "OPEN") {
      console.error("WebSocket 未连接");
      return;
    }

    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  }

  /**
   * 监听事件
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(event, new Set());
    }
    this.messageListeners.get(event).add(callback);
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (this.messageListeners.has(event)) {
      const listeners = this.messageListeners.get(event);
      if (callback) {
        listeners.delete(callback);
      } else {
        listeners.clear();
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    if (this.messageListeners.has(event)) {
      this.messageListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件 ${event} 处理错误:`, error);
        }
      });
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.status === "CLOSED") {
      return;
    }

    this.status = "CLOSING";
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * 获取当前连接状态
   */
  getStatus() {
    return this.status;
  }
}

// 导出单例模式的 WebSocket 管理器
let instance = null;

export const createWebSocket = (url, options) => {
  if (!instance) {
    instance = new WebSocketManager(url, options);
  }
  return instance;
};

export default WebSocketManager;
