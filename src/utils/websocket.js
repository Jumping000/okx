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
 * 账户频道类型枚举
 */
export const AccountChannelType = {
  ACCOUNT: "account", // 账户频道
  POSITIONS: "positions", // 持仓频道
  ORDERS: "orders", // 订单频道
};

/**
 * 行情频道类型枚举
 */
export const MarketChannelType = {
  TICKERS: "tickers", // 产品行情频道
  TRADES: "trades", // 交易频道
  BOOKS: "books", // 深度频道
  CANDLES: "candle1m", // K线频道，默认1分钟
  // K线周期
  CANDLE_1S: "candle1s", // 1秒
  CANDLE_1M: "candle1m", // 1分钟
  CANDLE_3M: "candle3m", // 3分钟
  CANDLE_5M: "candle5m", // 5分钟
  CANDLE_15M: "candle15m", // 15分钟
  CANDLE_30M: "candle30m", // 30分钟
  CANDLE_1H: "candle1H", // 1小时
  CANDLE_2H: "candle2H", // 2小时
  CANDLE_4H: "candle4H", // 4小时
  // 香港时间开盘价k线
  CANDLE_6H: "candle6H", // 6小时
  CANDLE_12H: "candle12H", // 12小时
  CANDLE_1D: "candle1D", // 1天
  CANDLE_2D: "candle2D", // 2天
  CANDLE_3D: "candle3D", // 3天
  CANDLE_1W: "candle1W", // 1周
  CANDLE_1M_HKT: "candle1M", // 1月
  CANDLE_3M_HKT: "candle3M", // 3月
  // UTC时间开盘价k线
  CANDLE_6H_UTC: "candle6Hutc", // 6小时 UTC
  CANDLE_12H_UTC: "candle12Hutc", // 12小时 UTC
  CANDLE_1D_UTC: "candle1Dutc", // 1天 UTC
  CANDLE_2D_UTC: "candle2Dutc", // 2天 UTC
  CANDLE_3D_UTC: "candle3Dutc", // 3天 UTC
  CANDLE_1W_UTC: "candle1Wutc", // 1周 UTC
  CANDLE_1M_UTC: "candle1Mutc", // 1月 UTC
  CANDLE_3M_UTC: "candle3Mutc", // 3月 UTC
};

/**
 * 行情更新操作类型
 */
export const MarketOperationType = {
  SUBSCRIBE: "subscribe", // 订阅
  UNSUBSCRIBE: "unsubscribe", // 取消订阅
};

/**
 * 产品类型枚举
 */
export const InstrumentType = {
  SPOT: "SPOT", // 币币
  MARGIN: "MARGIN", // 币币杠杆
  SWAP: "SWAP", // 永续合约
  FUTURES: "FUTURES", // 交割合约
  OPTION: "OPTION", // 期权
  ANY: "ANY", // 全部
};

/**
 * 订单状态枚举
 */
export const OrderState = {
  CANCELED: "canceled", // 撤单成功
  LIVE: "live", // 等待成交
  PARTIALLY_FILLED: "partially_filled", // 部分成交
  FILLED: "filled", // 完全成交
  MMP_CANCELED: "mmp_canceled", // 做市商保护机制导致的自动撤单
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
      //   console.log("收到WebSocket消息:", message);

      // 处理订单响应
      if (message.op === "order" && message.data) {
        this.handleOrderResponse(message);
        return;
      }

      // 处理订阅响应
      if (message.event === "subscribe") {
        const { channel } = message.arg;
        const subscriptionKey =
          channel === AccountChannelType.ACCOUNT ||
          channel === AccountChannelType.POSITIONS
            ? channel
            : `${channel}_${message.arg.instId}`;
        const handler = this.messageHandlers.get(subscriptionKey);
        if (handler) {
          handler(message);
        }
        return;
      }

      // 处理取消订阅响应
      if (message.event === "unsubscribe") {
        const { channel, instId } = message.arg;
        console.log(`取消订阅成功: ${channel} - ${instId}`);
        return;
      }

      // 处理错误消息
      if (message.event === "error") {
        console.error("WebSocket error:", message.msg);
        return;
      }

      // 处理数据更新消息
      if (message.arg) {
        const { channel } = message.arg;
        const subscriptionKey =
          channel === AccountChannelType.ACCOUNT ||
          channel === AccountChannelType.POSITIONS
            ? channel
            : `${channel}_${message.arg.instId}`;
        const handler = this.messageHandlers.get(subscriptionKey);
        if (handler) {
          try {
            handler(message);
          } catch (error) {
            console.error(`WebSocket ${this.type} 消息处理错误:`, error);
          }
        } else {
          console.warn(`未找到消息处理函数: ${subscriptionKey}`);
        }
      }
    } catch (error) {
      console.error(`WebSocket ${this.type} 消息解析错误:`, error);
    }
  }

  /**
   * 处理订单响应消息
   * @param {Object} message 订单响应消息
   */
  handleOrderResponse(message) {
    try {
      console.log("处理订单响应:", message);

      if (!message || !message.data || !Array.isArray(message.data)) {
        console.warn("无效的订单响应格式");
        return;
      }

      const orderData = message.data[0];
      if (!orderData) {
        console.warn("订单响应数据为空");
        return;
      }

      // 遍历所有注册的消息处理函数
      for (const [key, handler] of this.messageHandlers.entries()) {
        if (key === "order" && typeof handler === "function") {
          handler(message);
          break;
        }
      }
    } catch (error) {
      console.error("处理订单响应出错:", error);
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
    // 每6秒发送一次心跳
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, 6000); // 6秒
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

  /**
   * 添加消息处理函数
   * @param {string} key 订阅的唯一标识
   * @param {Function} handler 处理函数
   */
  addMessageHandler(key, handler) {
    this.messageHandlers.set(key, handler);
    // console.log(`添加消息处理函数: ${key}`, this.messageHandlers);
  }

  /**
   * 移除消息处理函数
   * @param {string} key 订阅的唯一标识
   */
  removeMessageHandler(key) {
    this.messageHandlers.delete(key);
    // console.log(`移除消息处理函数: ${key}`, this.messageHandlers);
  }

  /**
   * 生成订阅的唯一标识
   * @param {string} channelType 频道类型
   * @param {string} instId 产品ID
   * @returns {string} 订阅的唯一标识
   */
  _getSubscriptionKey(channelType, instId) {
    // 如果是账户频道，直接返回频道类型
    if (
      channelType === AccountChannelType.ACCOUNT ||
      channelType === AccountChannelType.POSITIONS
    ) {
      return channelType;
    }
    // 如果是K线数据，需要特殊处理
    if (channelType.startsWith("candle")) {
      return `${channelType}_${instId}`;
    }
    return `${channelType}_${instId}`;
  }
}

export default WebSocketClient;
