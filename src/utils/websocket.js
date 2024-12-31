import CryptoJS from "crypto-js";

/**
 * WebSocket 连接状态枚举
 */
export const WebSocketState = {
  CONNECTING: 0, // 连接中
  OPEN: 1, // 已连接
  CLOSING: 2, // 关闭中
  CLOSED: 3, // 已关闭
};

/**
 * WebSocket 连接类型枚举
 */
export const WebSocketType = {
  PUBLIC: "PUBLIC", // 公共频道
  PRIVATE: "PRIVATE", // 私有频道
  BUSINESS: "BUSINESS", // 业务频道
};

/**
 * WebSocket 管理类
 */
class WebSocketClient {
  /**
   * @param {string} url WebSocket 服务器地址
   * @param {Object} options 配置选项
   * @param {number} options.heartbeatInterval 心跳间隔时间(ms)
   * @param {number} options.reconnectInterval 重连间隔时间(ms)
   * @param {number} options.reconnectMaxTimes 最大重连次数
   * @param {Function} options.onBeforeConnect 连接前的钩子函数
   */
  constructor(url, options = {}) {
    // WebSocket 服务器地址
    this.url = url;
    // WebSocket 实例
    this.ws = null;
    // 配置选项
    this.options = {
      heartbeatInterval: options.heartbeatInterval || 30000,
      reconnectInterval: options.reconnectInterval || 5000,
      reconnectMaxTimes: options.reconnectMaxTimes || 5,
      onBeforeConnect: options.onBeforeConnect || null,
    };
    // 当前重连次数
    this.reconnectCount = 0;
    // 心跳定时器
    this.heartbeatTimer = null;
    // 重连定时器
    this.reconnectTimer = null;
    // 消息处理函数集合
    this.messageHandlers = new Map();
    // 连接状态处理函数集合
    this.stateHandlers = new Set();
    // 是否是人为关闭
    this.manualClosed = false;
    // 连接类型
    this.type = options.type || WebSocketType.PUBLIC;
    // 登录状态
    this.isLoggedIn = false;
  }

  /**
   * 初始化 WebSocket 连接
   */
  async connect() {
    if (this.ws && this.ws.readyState === WebSocketState.OPEN) {
      console.warn("WebSocket 已连接");
      return;
    }

    this.manualClosed = false;

    try {
      // 执行连接前钩子
      if (this.options.onBeforeConnect) {
        await this.options.onBeforeConnect();
      }

      this.ws = new WebSocket(this.url);

      // 绑定事件处理函数
      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
    } catch (error) {
      console.error("WebSocket 连接失败:", error);
      this._handleError(error);
    }
  }

  /**
   * 关闭 WebSocket 连接
   */
  disconnect() {
    this.manualClosed = true;
    this._clearTimers();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 重新连接
   * @private
   */
  _reconnect() {
    if (
      this.manualClosed ||
      this.reconnectCount >= this.options.reconnectMaxTimes
    ) {
      return;
    }

    this.reconnectCount++;
    console.log(`WebSocket ${this.type} 尝试第 ${this.reconnectCount} 次重连`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 发送消息
   * @param {Object} data 要发送的数据
   * @returns {boolean} 是否发送成功
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocketState.OPEN) {
      console.error(`WebSocket ${this.type} 未连接`);
      return false;
    }

    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error(`WebSocket ${this.type} 发送消息失败:`, error);
      return false;
    }
  }

  /**
   * 订阅消息
   * @param {string} channel 频道名称
   * @param {Function} handler 消息处理函数
   */
  subscribe(channel, handler) {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }
    this.messageHandlers.get(channel).add(handler);

    // 如果已连接，发送订阅消息
    if (this.ws && this.ws.readyState === WebSocketState.OPEN) {
      this.send({
        op: "subscribe",
        args: [{ channel }],
      });
    }
  }

  /**
   * 取消订阅消息
   * @param {string} channel 频道名称
   * @param {Function} handler 消息处理函数
   */
  unsubscribe(channel, handler) {
    if (this.messageHandlers.has(channel)) {
      if (handler) {
        this.messageHandlers.get(channel).delete(handler);
      } else {
        this.messageHandlers.delete(channel);
      }

      // 如果已连接，发送取消订阅消息
      if (this.ws && this.ws.readyState === WebSocketState.OPEN) {
        this.send({
          op: "unsubscribe",
          args: [{ channel }],
        });
      }
    }
  }

  /**
   * 监听连接状态变化
   * @param {Function} handler 状态处理函数
   */
  onStateChange(handler) {
    this.stateHandlers.add(handler);
  }

  /**
   * 移除状态监听
   * @param {Function} handler 状态处理函数
   */
  offStateChange(handler) {
    this.stateHandlers.delete(handler);
  }

  /**
   * 处理连接打开事件
   * @private
   */
  _handleOpen() {
    console.log(`WebSocket ${this.type} 连接成功`);
    this.reconnectCount = 0;
    this._startHeartbeat();
    this._notifyStateChange(WebSocketState.OPEN);
  }

  /**
   * 处理连接关闭事件
   * @private
   */
  _handleClose() {
    console.log(`WebSocket ${this.type} 连接关闭`);
    this._clearTimers();
    this._notifyStateChange(WebSocketState.CLOSED);

    if (!this.manualClosed) {
      this._reconnect();
    }
  }

  /**
   * 处理错误事件
   * @private
   * @param {Event} event 错误事件对象
   */
  _handleError(event) {
    console.error(`WebSocket ${this.type} 错误:`, event);
    this._notifyStateChange(WebSocketState.CLOSED);
  }

  /**
   * 处理收到的消息
   * @private
   * @param {MessageEvent} event 消息事件对象
   */
  _handleMessage(event) {
    try {
      // 如果是心跳响应，直接返回
      if (event.data === "pong") {
        return;
      }

      // 处理其他消息
      const message = JSON.parse(event.data);

      // 处理订阅消息
      const channel = message.arg?.channel || message.channel;
      if (channel && this.messageHandlers.has(channel)) {
        this.messageHandlers.get(channel).forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error(`WebSocket ${this.type} 消息处理错误:`, error);
          }
        });
      }
    } catch (error) {
      console.error(`WebSocket ${this.type} 消息解析错误:`, error);
    }
  }

  /**
   * 开始心跳检测
   * @private
   */
  _startHeartbeat() {
    this._clearHeartbeat();
    // 立即发送一次心跳
    this.send("ping");
    // 每10秒发送一次心跳
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, 10000); // 10秒
  }

  /**
   * 清除心跳定时器
   * @private
   */
  _clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 清除所有定时器
   * @private
   */
  _clearTimers() {
    this._clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 通知所有状态监听器
   * @private
   * @param {number} state 连接状态
   */
  _notifyStateChange(state) {
    this.stateHandlers.forEach((handler) => {
      try {
        handler(state);
      } catch (error) {
        console.error(`WebSocket ${this.type} 状态处理错误:`, error);
      }
    });
  }

  /**
   * 获取当前连接状态
   * @returns {number} 连接状态
   */
  getState() {
    return this.ws ? this.ws.readyState : WebSocketState.CLOSED;
  }

  /**
   * 生成登录签名
   * @param {string} timestamp - 时间戳
   * @param {string} secretKey - 密钥
   * @returns {string} 生成的签名
   * @private
   */
  _generateLoginSign(timestamp, secretKey) {
    const method = "GET";
    const requestPath = "/users/self/verify";
    const message = timestamp + method + requestPath;

    const hmac = CryptoJS.HmacSHA256(message, secretKey);
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  /**
   * 执行WebSocket登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.apiKey - API密钥
   * @param {string} credentials.secretKey - 密钥
   * @param {string} credentials.passphrase - 密码短语
   * @returns {Promise<boolean>} 登录是否成功
   * @throws {Error} 登录失败时抛出错误
   */
  async login({ apiKey, secretKey, passphrase }) {
    if (!apiKey || !secretKey || !passphrase) {
      throw new Error("缺少登录凭证参数");
    }

    if (!this.ws || this.ws.readyState !== WebSocketState.OPEN) {
      throw new Error("WebSocket 未连接");
    }

    return new Promise((resolve, reject) => {
      try {
        // 生成登录消息
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const sign = this._generateLoginSign(timestamp, secretKey);

        const loginMessage = {
          op: "login",
          args: [
            {
              apiKey,
              passphrase,
              timestamp,
              sign,
            },
          ],
        };

        // 设置登录响应处理器
        const loginResponseHandler = (event) => {
          try {
            const response = JSON.parse(event.data);

            // 移除临时消息处理器
            this.ws.removeEventListener("message", loginResponseHandler);

            if (response.event === "login" && response.code === "0") {
              this.isLoggedIn = true;
              resolve(true);
            } else {
              this.isLoggedIn = false;
              reject(new Error(`登录失败: ${JSON.stringify(response)}`));
            }
          } catch (error) {
            reject(error);
          }
        };

        // 添加临时消息处理器
        this.ws.addEventListener("message", loginResponseHandler);

        // 发送登录消息
        this.send(loginMessage);

        // 设置登录超时
        setTimeout(() => {
          this.ws.removeEventListener("message", loginResponseHandler);
          reject(new Error("登录超时"));
        }, 10000); // 10秒超时
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default WebSocketClient;
