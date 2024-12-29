/**
 * WebSocket 连接状态枚举
 */
export const WS_STATUS = {
  CONNECTING: 0, // 连接中
  CONNECTED: 1, // 已连接
  CLOSING: 2, // 关闭中
  CLOSED: 3, // 已关闭
  RECONNECTING: 4, // 重连中
};

/**
 * WebSocket 事件类型枚举
 */
export const WS_EVENTS = {
  OPEN: "open", // 连接建立
  MESSAGE: "message", // 收到消息
  ERROR: "error", // 发生错误
  CLOSE: "close", // 连接关闭
  RECONNECT: "reconnect", // 开始重连
  RECONNECTED: "reconnected", // 重连成功
  RECONNECT_ERROR: "reconnect_error", // 重连失败
  RECONNECT_FAILED: "reconnect_failed", // 重连次数超限
};

class WebSocketClient {
  /**
   * @param {string} url WebSocket 服务器地址
   * @param {Object} options 配置选项
   * @param {number} [options.reconnectInterval=3000] 重连间隔时间(ms)
   * @param {number} [options.reconnectMaxTimes=5] 最大重连次数
   * @param {number} [options.heartbeatInterval=10000] 心跳间隔时间(ms)
   * @param {number} [options.heartbeatTimeout=5000] 心跳超时时间(ms)
   */
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000,
      reconnectMaxTimes: 5,
      heartbeatInterval: 10000, // 10秒发送一次心跳
      heartbeatTimeout: 5000, // 5秒超时
      ...options,
    };

    this.ws = null;
    this.status = WS_STATUS.CLOSED;
    this.reconnectTimer = null;
    this.reconnectTimes = 0;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.listeners = new Map();

    // 绑定方法的 this 上下文
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.close = this.close.bind(this);
    this.send = this.send.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * 检查是否已连接
   * @returns {boolean} 是否已连接
   */
  isConnected() {
    return this.status === WS_STATUS.CONNECTED;
  }

  /**
   * 建立 WebSocket 连接
   */
  connect() {
    if (
      this.status === WS_STATUS.CONNECTING ||
      this.status === WS_STATUS.CONNECTED
    ) {
      return;
    }

    this.status = WS_STATUS.CONNECTING;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = this.handleOpen;
    this.ws.onmessage = this.handleMessage;
    this.ws.onerror = this.handleError;
    this.ws.onclose = this.handleClose;
  }

  /**
   * 重新连接
   */
  reconnect() {
    if (this.status === WS_STATUS.RECONNECTING) return;
    if (this.reconnectTimes >= this.options.reconnectMaxTimes) {
      this.emit(WS_EVENTS.RECONNECT_FAILED);
      return;
    }

    this.status = WS_STATUS.RECONNECTING;
    this.reconnectTimes++;
    this.emit(WS_EVENTS.RECONNECT, this.reconnectTimes);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.status === WS_STATUS.CLOSED) return;

    this.status = WS_STATUS.CLOSING;
    this.clearHeartbeat(); // 清除心跳检测
    this.clearReconnect();

    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * 发送消息
   * @param {string|object} data 要发送的数据
   * @returns {boolean} 是否发送成功
   */
  send(data) {
    if (this.status !== WS_STATUS.CONNECTED) {
      console.error("WebSocket is not connected");
      return false;
    }

    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }

  /**
   * 清除重连定时器
   */
  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.clearHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.status === WS_STATUS.CONNECTED) {
        // 发送纯文本 ping
        this.ws.send("ping");

        // 设置超时检测
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.warn("Heartbeat timeout, reconnecting...");
          this.reconnect();
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 清除心跳检测
   */
  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * 处理连接打开事件
   */
  handleOpen() {
    this.status = WS_STATUS.CONNECTED;
    this.reconnectTimes = 0;
    this.startHeartbeat(); // 开始心跳检测

    if (this.status === WS_STATUS.RECONNECTING) {
      this.emit(WS_EVENTS.RECONNECTED);
    } else {
      this.emit(WS_EVENTS.OPEN);
    }
  }

  /**
   * 处理消息事件
   * @param {MessageEvent} event 消息事件对象
   */
  handleMessage(event) {
    // 处理心跳响应
    if (event.data === "pong") {
      // 收到 pong 响应，清除超时定时器
      if (this.heartbeatTimeoutTimer) {
        clearTimeout(this.heartbeatTimeoutTimer);
        this.heartbeatTimeoutTimer = null;
      }
      return;
    }

    // 处理其他消息
    this.emit(WS_EVENTS.MESSAGE, event.data);
  }

  /**
   * 处理错误事件
   * @param {Event} event 错误事件对象
   */
  handleError(event) {
    this.emit(WS_EVENTS.ERROR, event);
    if (this.status === WS_STATUS.RECONNECTING) {
      this.emit(WS_EVENTS.RECONNECT_ERROR, event);
    }
  }

  /**
   * 处理连接关闭事件
   * @param {CloseEvent} event 关闭事件对象
   */
  handleClose(event) {
    this.status = WS_STATUS.CLOSED;
    this.clearHeartbeat(); // 清除心跳检测
    this.emit(WS_EVENTS.CLOSE, event);

    // 非主动关闭时，尝试重连
    if (event.code !== 1000) {
      this.reconnect();
    }
  }
}

export default WebSocketClient;
