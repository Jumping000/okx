/**
 * WebSocket 客户端工具类
 */
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.messageHandlers = new Map();
    this.isConnected = false;
    this.heartbeatInterval = null;
    this.heartbeatTimer = null;
  }

  /**
   * 连接 WebSocket
   * @returns {Promise} 连接结果
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket 连接成功");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          // 启动心跳
          this.startHeartbeat();
          resolve();
        };

        this.ws.onclose = () => {
          console.log("WebSocket 连接关闭");
          this.isConnected = false;
          // 停止心跳
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket 错误:", error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          // 处理心跳消息
          if (event.data === "pong") {
            this.handlePong();
            return;
          }
          this.handleMessage(event.data);
        };
      } catch (error) {
        console.error("WebSocket 连接失败:", error);
        reject(error);
      }
    });
  }

  /**
   * 启动心跳
   * @private
   */
  startHeartbeat() {
    // 清除可能存在的旧定时器
    this.stopHeartbeat();

    // 每隔 5 秒发送一次心跳
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        try {
          // 发送纯文本 ping
          this.ws.send("ping");
          //   console.log("发送心跳: ping");
        } catch (error) {
          console.error("发送心跳失败:", error);
        }
      }
    }, 5000);
  }

  /**
   * 停止心跳
   * @private
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 处理服务器发来的 ping 消息
   * @private
   */
  handlePong() {
    try {
      //   // 发送纯文本 pong
      //   this.ws.send("pong");
      //   console.log("响应 ping 消息");
    } catch (error) {
      console.error("响应 ping 消息失败:", error);
    }
  }

  /**
   * 重新连接
   * @private
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("WebSocket 重连次数超过最大限制");
      return;
    }

    this.reconnectAttempts++;
    console.log(`WebSocket 尝试第 ${this.reconnectAttempts} 次重连`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("WebSocket 重连失败:", error);
      });
    }, this.reconnectInterval);
  }

  /**
   * 处理接收到的消息
   * @param {string} data
   * @private
   */
  handleMessage(data) {
    try {
      // 解析 JSON 消息
      const message = JSON.parse(data);
      //   console.log("收到消息:", message);

      // 处理订阅频道的消息
      if (message.event === "subscribe") {
        console.log("订阅成功:", message);
        return;
      }

      // 处理错误消息
      if (message.event === "error") {
        console.error("WebSocket 错误:", message);
        return;
      }

      // 处理数据消息
      if (message.arg && message.data) {
        const { channel } = message.arg;
        const handler = this.messageHandlers.get(channel);
        if (handler) {
          handler(message);
        } else {
          console.warn("未找到消息处理器:", channel);
        }
      }
    } catch (error) {
      console.error("处理 WebSocket 消息失败:", error);
    }
  }

  /**
   * 注册消息处理器
   * @param {string} type 消息类型
   * @param {Function} handler 处理函数
   */
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 发送消息
   * @param {Object} data 要发送的数据
   */
  send(data) {
    if (!this.isConnected) {
      throw new Error("WebSocket 未连接");
    }

    try {
      const message = JSON.stringify(data);
      this.ws.send(message);
    } catch (error) {
      console.error("发送消息失败:", error);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  close() {
    // 停止心跳
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.messageHandlers.clear();
    }
  }
}

// 暴露给全局
self.WebSocketClient = WebSocketClient;
