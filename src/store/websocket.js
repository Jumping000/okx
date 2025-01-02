import { defineStore } from "pinia";
import WebSocketClient, {
  WebSocketState,
  WebSocketType,
  MarketChannelType,
  MarketOperationType,
  AccountChannelType,
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

// 生成订阅的唯一标识
const getSubscriptionKey = (channelType, instId) => {
  // 如果是账户频道，直接返回频道类型
  if (channelType === AccountChannelType.ACCOUNT) {
    return channelType;
  }
  // 如果是K线数据，需要特殊处理
  if (channelType.startsWith("candle")) {
    return `${channelType}_${instId}`;
  }
  return `${channelType}_${instId}`;
};

// 将 WebSocket 频道名称转换为 API 参数
const convertChannelToBar = (channel) => {
  // 如果已经是正确的格式，直接返回
  if (!channel.startsWith("candle")) {
    return channel;
  }
  // 移除 'candle' 前缀
  return channel.replace("candle", "");
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
    // 市场数据缓存
    marketData: {
      tickers: new Map(), // 产品行情数据
      trades: new Map(), // 最新成交数据
      books: new Map(), // 深度数据
      candles: new Map(), // K线数据
    },
    // 市场数据更新时间
    marketDataUpdateTime: {
      tickers: new Map(),
      trades: new Map(),
      books: new Map(),
      candles: new Map(),
    },
    // 账户数据缓存
    accountData: {
      balance: null, // 账户余额信息
      lastUpdateTime: null, // 最后更新时间
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

    // 获取指定币种的行情数据
    getTickerData: (state) => (instId) => state.marketData.tickers.get(instId),

    // 获取指定币种的最新成交数据
    getTradeData: (state) => (instId) => state.marketData.trades.get(instId),

    // 获取指定币种的深度数据
    getBookData: (state) => (instId) => state.marketData.books.get(instId),

    // 获取指定币种的K线数据
    getCandleData: (state) => (instId) => state.marketData.candles.get(instId),

    // 获取指定币种的行情数据更新时间
    getMarketDataUpdateTime: (state) => (channelType, instId) =>
      state.marketDataUpdateTime[channelType].get(instId),

    // 获取账户数据
    getAccountData: (state) => state.accountData.balance,

    // 获取账户数据最后更新时间
    getAccountDataUpdateTime: (state) => state.accountData.lastUpdateTime,
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

    /**
     * 订阅市场行情
     * @param {Object} options 订阅选项
     * @param {string} options.instId 产品ID
     * @param {string} options.channelType 频道类型
     * @param {Function} options.onData 数据回调函数
     * @returns {Promise<void>}
     */
    async subscribeMarket({ instId, channelType, onData }) {
      if (!instId || !channelType) {
        throw new Error("缺少必要的订阅参数");
      }

      // 确保连接已建立
      if (!this.isConnected(WebSocketType.PUBLIC)) {
        await this.connect(WebSocketType.PUBLIC);
      }

      const subscriptionKey = getSubscriptionKey(channelType, instId);

      // 构建订阅消息
      const subscribeMessage = {
        op: MarketOperationType.SUBSCRIBE,
        args: [
          {
            channel: channelType,
            instId: instId,
          },
        ],
      };

      // 创建消息处理函数
      const messageHandler = (message) => {
        // 更新市场数据缓存
        if (message.data) {
          this.marketData[channelType].set(instId, message.data);
          this.marketDataUpdateTime[channelType].set(
            instId,
            new Date().getTime()
          );
        }

        // 调用回调函数
        if (onData) {
          onData(message);
        }
      };

      // 添加消息处理函数
      this.connections[WebSocketType.PUBLIC].addMessageHandler(
        subscriptionKey,
        messageHandler
      );

      // 发送订阅消息
      this.send({
        type: WebSocketType.PUBLIC,
        data: subscribeMessage,
      });
    },

    /**
     * 取消订阅市场行情
     * @param {Object} options 取消订阅选项
     * @param {string} options.instId 产品ID
     * @param {string} options.channelType 频道类型
     */
    unsubscribeMarket({ instId, channelType }) {
      if (!instId || !channelType) {
        throw new Error("缺少必要的取消订阅参数");
      }

      const subscriptionKey = getSubscriptionKey(channelType, instId);

      // 构建取消订阅消息
      const unsubscribeMessage = {
        op: MarketOperationType.UNSUBSCRIBE,
        args: [
          {
            channel: channelType,
            instId: instId,
          },
        ],
      };

      // 发送取消订阅消息
      this.send({
        type: WebSocketType.PUBLIC,
        data: unsubscribeMessage,
      });

      // 移除消息处理函数
      this.connections[WebSocketType.PUBLIC].removeMessageHandler(
        subscriptionKey
      );

      // 清除市场数据缓存
      this.marketData[channelType].delete(instId);
      this.marketDataUpdateTime[channelType].delete(instId);
    },

    /**
     * 批量订阅市场行情
     * @param {Array<Object>} subscriptions 订阅配置数组
     * @returns {Promise<void>}
     */
    async batchSubscribeMarket(subscriptions) {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        throw new Error("订阅配置不能为空");
      }

      // 确保连接已建立
      if (!this.isConnected(WebSocketType.PUBLIC)) {
        await this.connect(WebSocketType.PUBLIC);
      }

      // 构建批量订阅消息
      const subscribeMessage = {
        op: MarketOperationType.SUBSCRIBE,
        args: subscriptions.map(({ instId, channelType }) => ({
          channel: channelType,
          instId: instId,
        })),
      };

      // 为每个订阅创建处理函数
      subscriptions.forEach(({ instId, channelType, onData }) => {
        const subscriptionKey = getSubscriptionKey(channelType, instId);
        const messageHandler = (message) => {
          if (message.data) {
            this.marketData[channelType].set(instId, message.data);
            this.marketDataUpdateTime[channelType].set(
              instId,
              new Date().getTime()
            );
          }

          if (onData) {
            onData(message.data);
          }
        };

        this.subscriptions[WebSocketType.PUBLIC].set(
          subscriptionKey,
          messageHandler
        );
      });

      // 发送批量订阅消息
      this.send({
        type: WebSocketType.PUBLIC,
        data: subscribeMessage,
      });
    },

    /**
     * 批量取消订阅市场行情
     * @param {Array<Object>} subscriptions 要取消的订阅配置数组
     */
    batchUnsubscribeMarket(subscriptions) {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        throw new Error("取消订阅配置不能为空");
      }

      // 构建批量取消订阅消息
      const unsubscribeMessage = {
        op: MarketOperationType.UNSUBSCRIBE,
        args: subscriptions.map(({ instId, channelType }) => ({
          channel: channelType,
          instId: instId,
        })),
      };

      // 发送批量取消订阅消息
      this.send({
        type: WebSocketType.PUBLIC,
        data: unsubscribeMessage,
      });

      // 清理每个订阅
      subscriptions.forEach(({ instId, channelType }) => {
        const subscriptionKey = getSubscriptionKey(channelType, instId);
        this.subscriptions[WebSocketType.PUBLIC].delete(subscriptionKey);
        this.marketData[channelType].delete(instId);
        this.marketDataUpdateTime[channelType].delete(instId);
      });
    },

    /**
     * 清除所有市场数据缓存
     */
    clearMarketData() {
      Object.values(MarketChannelType).forEach((channelType) => {
        this.marketData[channelType].clear();
        this.marketDataUpdateTime[channelType].clear();
      });
    },

    /**
     * 订阅K线数据
     * @param {Object} options 订阅选项
     * @param {string} options.instId 产品ID
     * @param {string} options.candlePeriod K线周期
     * @param {Function} options.onData 数据回调函数
     * @returns {Promise<void>}
     */
    async subscribeCandleData({
      instId,
      candlePeriod = MarketChannelType.CANDLE_1M,
      onData,
    }) {
      if (!instId) {
        throw new Error("缺少必要的订阅参数");
      }

      // 确保连接已建立
      if (!this.isConnected(WebSocketType.BUSINESS)) {
        await this.connect(WebSocketType.BUSINESS);
      }

      // 构建频道名称
      const channelName = `candle${convertChannelToBar(candlePeriod)}`;
      const subscriptionKey = getSubscriptionKey(channelName, instId);

      // 构建订阅消息
      const subscribeMessage = {
        op: MarketOperationType.SUBSCRIBE,
        args: [
          {
            channel: channelName,
            instId: instId,
          },
        ],
      };

      // 创建消息处理函数
      const messageHandler = (message) => {
        // 更新K线数据缓存
        if (message.data) {
          // K线数据格式转换
          const candleData = message.data.map((item) => ({
            timestamp: parseInt(item[0]),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            volCcy: parseFloat(item[6]),
            volCcyQuote: parseFloat(item[7]),
            confirm: item[8],
          }));

          this.marketData.candles.set(instId, candleData);
          this.marketDataUpdateTime.candles.set(instId, new Date().getTime());
        }

        // 调用回调函数
        if (onData) {
          onData(message);
        }
      };

      // 添加消息处理函数
      this.connections[WebSocketType.BUSINESS].addMessageHandler(
        subscriptionKey,
        messageHandler
      );

      // 发送订阅消息
      this.send({
        type: WebSocketType.BUSINESS,
        data: subscribeMessage,
      });
    },

    /**
     * 取消订阅K线数据
     * @param {Object} options 取消订阅选项
     * @param {string} options.instId 产品ID
     * @param {string} options.candlePeriod K线周期
     */
    unsubscribeCandleData({
      instId,
      candlePeriod = MarketChannelType.CANDLE_1M,
    }) {
      if (!instId) {
        throw new Error("缺少必要的取消订阅参数");
      }

      // 构建频道名称
      const channelName = `candle${convertChannelToBar(candlePeriod)}`;
      const subscriptionKey = getSubscriptionKey(channelName, instId);

      // 构建取消订阅消息
      const unsubscribeMessage = {
        op: MarketOperationType.UNSUBSCRIBE,
        args: [
          {
            channel: channelName,
            instId: instId,
          },
        ],
      };

      // 发送取消订阅消息
      this.send({
        type: WebSocketType.BUSINESS,
        data: unsubscribeMessage,
      });

      // 移除消息处理函数
      this.connections[WebSocketType.BUSINESS].removeMessageHandler(
        subscriptionKey
      );

      // 清除K线数据缓存
      this.marketData.candles.delete(instId);
      this.marketDataUpdateTime.candles.delete(instId);
    },

    /**
     * 批量订阅K线数据
     * @param {Array<Object>} subscriptions 订阅配置数组
     * @returns {Promise<void>}
     */
    async batchSubscribeCandleData(subscriptions) {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        throw new Error("订阅配置不能为空");
      }

      // 确保连接已建立
      if (!this.isConnected(WebSocketType.BUSINESS)) {
        await this.connect(WebSocketType.BUSINESS);
      }

      // 构建批量订阅消息
      const subscribeMessage = {
        op: MarketOperationType.SUBSCRIBE,
        args: subscriptions.map(
          ({ instId, candlePeriod = MarketChannelType.CANDLE_1M }) => {
            const channelName = `candle${convertChannelToBar(candlePeriod)}`;
            return {
              channel: channelName,
              instId: instId,
            };
          }
        ),
      };

      // 为每个订阅创建处理函数
      subscriptions.forEach(
        ({ instId, candlePeriod = MarketChannelType.CANDLE_1M, onData }) => {
          const channelName = `candle${convertChannelToBar(candlePeriod)}`;
          const subscriptionKey = getSubscriptionKey(channelName, instId);
          const messageHandler = (message) => {
            if (message.data) {
              // K线数据格式转换
              const candleData = message.data.map((item) => ({
                timestamp: item[0],
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5],
                volCcy: item[6],
                volCcyQuote: item[7],
                confirm: item[8],
              }));

              this.marketData.candles.set(instId, candleData);
              this.marketDataUpdateTime.candles.set(
                instId,
                new Date().getTime()
              );
            }

            if (onData) {
              onData(message);
            }
          };

          this.connections[WebSocketType.BUSINESS].addMessageHandler(
            subscriptionKey,
            messageHandler
          );
        }
      );

      // 发送批量订阅消息
      this.send({
        type: WebSocketType.BUSINESS,
        data: subscribeMessage,
      });
    },

    /**
     * 批量取消订阅K线数据
     * @param {Array<Object>} subscriptions 要取消的订阅配置数组
     */
    batchUnsubscribeCandleData(subscriptions) {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        throw new Error("取消订阅配置不能为空");
      }

      // 构建批量取消订阅消息
      const unsubscribeMessage = {
        op: MarketOperationType.UNSUBSCRIBE,
        args: subscriptions.map(
          ({ instId, candlePeriod = MarketChannelType.CANDLE_1M }) => {
            const channelName = `candle${convertChannelToBar(candlePeriod)}`;
            return {
              channel: channelName,
              instId: instId,
            };
          }
        ),
      };

      // 发送批量取消订阅消息
      this.send({
        type: WebSocketType.BUSINESS,
        data: unsubscribeMessage,
      });

      // 清理每个订阅
      subscriptions.forEach(
        ({ instId, candlePeriod = MarketChannelType.CANDLE_1M }) => {
          const channelName = `candle${convertChannelToBar(candlePeriod)}`;
          const subscriptionKey = getSubscriptionKey(channelName, instId);
          this.connections[WebSocketType.BUSINESS].removeMessageHandler(
            subscriptionKey
          );
          this.marketData.candles.delete(instId);
          this.marketDataUpdateTime.candles.delete(instId);
        }
      );
    },

    /**
     * 订阅账户数据
     * @param {Object} options 订阅选项
     * @param {Function} options.onData 数据回调函数
     * @returns {Promise<void>}
     */
    async subscribeAccount({ onData }) {
      // 确保连接已建立且已登录
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        await this.connect(WebSocketType.PRIVATE);
      }

      if (!this.isLoggedIn(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未登录，请先登录");
      }

      const subscriptionKey = AccountChannelType.ACCOUNT;

      // 构建订阅消息
      const subscribeMessage = {
        op: MarketOperationType.SUBSCRIBE,
        args: [
          {
            channel: AccountChannelType.ACCOUNT,
          },
        ],
      };

      // 创建消息处理函数
      const messageHandler = (message) => {
        // 检查消息格式
        if (
          message.event === "subscribe" &&
          message.arg?.channel === AccountChannelType.ACCOUNT
        ) {
          console.log("账户频道订阅成功");
          return;
        }

        if (
          message.arg?.channel === AccountChannelType.ACCOUNT &&
          message.data?.[0]
        ) {
          // 更新账户数据缓存
          this.accountData.balance = message.data[0];
          this.accountData.lastUpdateTime = new Date().getTime();

          // 调用回调函数
          if (onData) {
            onData(message);
          }
        }
      };

      // 添加消息处理函数
      this.connections[WebSocketType.PRIVATE].addMessageHandler(
        subscriptionKey,
        messageHandler
      );

      // 发送订阅消息
      this.send({
        type: WebSocketType.PRIVATE,
        data: subscribeMessage,
      });

      console.log("已订阅账户数据");
    },

    /**
     * 取消订阅账户数据
     */
    unsubscribeAccount() {
      const subscriptionKey = AccountChannelType.ACCOUNT;

      // 构建取消订阅消息
      const unsubscribeMessage = {
        op: MarketOperationType.UNSUBSCRIBE,
        args: [
          {
            channel: AccountChannelType.ACCOUNT,
          },
        ],
      };

      // 发送取消订阅消息
      this.send({
        type: WebSocketType.PRIVATE,
        data: unsubscribeMessage,
      });

      // 移除消息处理函数
      this.connections[WebSocketType.PRIVATE].removeMessageHandler(
        subscriptionKey
      );

      // 清除账户数据缓存
      this.accountData.balance = null;
      this.accountData.lastUpdateTime = null;

      console.log("已取消订阅账户数据");
    },

    /**
     * 清除账户数据缓存
     */
    clearAccountData() {
      this.accountData.balance = null;
      this.accountData.lastUpdateTime = null;
    },
  },
});
