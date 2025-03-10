import { defineStore } from "pinia";
import { useOverviewStore } from "@/store/overview";
import { getHistoryOrders, getPendingOrders } from "@/api/module/Basics";
import WebSocketClient, {
  WebSocketState,
  WebSocketType,
  MarketChannelType,
  MarketOperationType,
  AccountChannelType,
  InstrumentType,
} from "@/utils/websocketUtils";

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

// 操作类型常量
const OperationType = {
  ORDER: "order",
  CANCEL_ORDER: "cancel-order",
  AMEND_ORDER: "amend-order",
  // ... 其他操作类型
};

// 交易模式常量
const TradingMode = {
  CASH: "cash", // 现货模式
  ISOLATED: "isolated", // 逐仓模式
  CROSS: "cross", // 全仓模式
  SPOT_ISOLATED: "spot_isolated", // 现货逐仓
};

// 订单类型常量
const OrderType = {
  MARKET: "market", // 市价单
  LIMIT: "limit", // 限价单
  POST_ONLY: "post_only", // 只做maker单
  FOK: "fok", // 全部成交或立即取消
  IOC: "ioc", // 立即成交并取消剩余
  OPTIMAL_LIMIT_IOC: "optimal_limit_ioc", // 市价委托立即成交并取消剩余
};

// 订单方向常量
const OrderSide = {
  BUY: "buy",
  SELL: "sell",
};

// 持仓方向常量
const PositionSide = {
  LONG: "long",
  SHORT: "short",
};

// 目标币种单位常量
const TargetCurrency = {
  BASE_CCY: "base_ccy", // 交易货币
  QUOTE_CCY: "quote_ccy", // 计价货币
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
    // 是否曾经断开连接
    hasDisconnected: false,
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
    positionsData: {
      SWAP: [], // 永续合约持仓数据
      lastUpdateTime: null,
    },
    // 订单缓存
    orders: new Map(),
    // 订单数据缓存
    ordersData: {
      SPOT: {
        active: [], // 活跃订单（未完成订单）
        history: [], // 历史订单
        lastUpdateTime: null,
      },
      SWAP: {
        active: [], // 活跃订单（未完成订单）
        history: [], // 历史订单
        lastUpdateTime: null,
      },
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

    // 获取永续合约持仓数据
    getPositionsData: (state) => state.positionsData.SWAP,
    getPositionsDataUpdateTime: (state) => state.positionsData.lastUpdateTime,

    // 获取订单数据
    getOrdersData: (state) => (instType) => ({
      active: state.ordersData[instType]?.active || [],
      history: state.ordersData[instType]?.history || [],
      lastUpdateTime: state.ordersData[instType]?.lastUpdateTime,
    }),

    // 获取订单数据最后更新时间
    getOrdersDataUpdateTime: (state) => state.ordersData.lastUpdateTime,
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

      const overviewStore = useOverviewStore();

      // 监听状态变化
      ws.onStateChange((state) => {
        this.connectionStates[type] = state;
        const isConnected = state === WebSocketState.OPEN;
        
        // 如果连接断开或发生错误，设置断开连接标志
        if (state === WebSocketState.CLOSED || state === WebSocketState.ERROR) {
          this.hasDisconnected = true;
        }

        // 更新 overview store 中的连接状态
        switch (type) {
          case WebSocketType.PUBLIC:
            overviewStore.$patch({
              connection: {
                publicChannel: isConnected,
              },
            });
            break;
          case WebSocketType.PRIVATE:
            overviewStore.$patch({
              connection: {
                privateChannel: isConnected,
              },
            });
            break;
          case WebSocketType.BUSINESS:
            overviewStore.$patch({
              connection: {
                businessChannel: isConnected,
              },
            });
            break;
        }

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
        // 设置断开连接标志
        this.hasDisconnected = true;
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
          //   this.accountData.balance = message.data[0];
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

    /**
     * 订阅持仓数据
     * @param {Object} options 订阅选项
     * @param {Function} options.onData 数据回调函数
     */
    async subscribePositions({ onData }) {
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未连接");
      }

      if (!this.isLoggedIn(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未登录");
      }

      const subscriptionKey = AccountChannelType.POSITIONS;

      // 构建订阅消息
      const message = {
        op: "subscribe",
        args: [
          {
            channel: AccountChannelType.POSITIONS,
            instType: "SWAP",
            extraParams: JSON.stringify({
              updateInterval: "2000",
            }),
          },
        ],
      };

      // 创建消息处理函数
      const messageHandler = (message) => {
        // 处理订阅成功消息
        if (
          message.event === "subscribe" &&
          message.arg?.channel === AccountChannelType.POSITIONS
        ) {
          console.log("永续合约持仓订阅成功");
          return;
        }

        // 处理持仓数据更新
        if (
          message?.arg?.channel === AccountChannelType.POSITIONS &&
          message?.arg?.instType === "SWAP" &&
          Array.isArray(message?.data)
        ) {
          // 更新持仓数据
          const newPositions = message.data;
          const currentPositions = [...this.positionsData.SWAP];

          // 遍历新的持仓数据
          newPositions.forEach((newPosition) => {
            const existingIndex = currentPositions.findIndex(
              (pos) => pos.posId === newPosition.posId
            );

            if (existingIndex !== -1) {
              // 如果是清仓操作（pos为0），则删除该持仓
              if (newPosition.pos === "0") {
                console.log(`持仓已清空，删除持仓记录: ${newPosition.instId}`);
                currentPositions.splice(existingIndex, 1);
              } else {
                // 更新已存在的持仓
                currentPositions[existingIndex] = newPosition;
              }
            } else if (newPosition.pos !== "0") {
              // 只有不是清仓的新持仓才添加
              currentPositions.push(newPosition);
            }
          });

          // 更新状态
          this.positionsData = {
            SWAP: currentPositions,
            lastUpdateTime: new Date().getTime(),
            count: currentPositions.length, // 添加仓位数量统计
          };

          // 调用回调函数
          if (typeof onData === "function") {
            onData({
              ...message,
              positionsCount: currentPositions.length,
            });
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
        data: message,
      });
    },

    /**
     * 取消订阅持仓数据
     */
    unsubscribePositions() {
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        return;
      }

      const subscriptionKey = AccountChannelType.POSITIONS;

      // 构建取消订阅消息
      const message = {
        op: "unsubscribe",
        args: [
          {
            channel: AccountChannelType.POSITIONS,
            instType: "SWAP",
          },
        ],
      };

      // 发送取消订阅消息
      this.send({
        type: WebSocketType.PRIVATE,
        data: message,
      });

      // 移除消息处理函数
      this.connections[WebSocketType.PRIVATE].removeMessageHandler(
        subscriptionKey
      );

      // 清空持仓数据
      this.clearPositionsData();
    },

    /**
     * 清空持仓数据
     */
    clearPositionsData() {
      this.positionsData = {
        SWAP: [],
        lastUpdateTime: null,
      };
    },

    /**
     * 生成订单ID
     * @returns {string} 订单ID
     */
    generateOrderId() {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      return `YAN${timestamp}${random}`;
    },

    /**
     * 下单
     * @param {Object} options 下单选项
     * @param {string} options.instId 产品ID，如 BTC-USDT
     * @param {string} options.tdMode 交易模式
     * @param {string} options.side 订单方向 buy/sell
     * @param {string} options.ordType 订单类型
     * @param {string} options.sz 委托数量
     * @param {string} [options.px] 委托价格，市价单不需要
     * @param {string} [options.ccy] 保证金币种，仅适用于现货和合约模式下的全仓杠杆订单
     * @param {string} [options.clOrdId] 客户自定义订单ID
     * @param {string} [options.tag] 订单标签
     * @param {string} [options.posSide] 持仓方向，仅适用于交割/永续
     * @param {boolean} [options.reduceOnly] 是否只减仓
     * @param {string} [options.tgtCcy] 市价单委托数量单位
     * @param {boolean} [options.banAmend] 是否禁止币币市价改单
     * @param {string} [options.expTime] 订单有效期
     * @returns {Promise<Object>} 下单结果
     */
    async placeOrder(options) {
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未连接");
      }

      if (!this.isLoggedIn(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未登录");
      }

      // 参数校验
      if (
        !options.instId ||
        !options.tdMode ||
        !options.side ||
        !options.ordType ||
        !options.sz
      ) {
        throw new Error("缺少必要的下单参数");
      }

      // 验证交易模式
      if (!Object.values(TradingMode).includes(options.tdMode)) {
        throw new Error("无效的交易模式");
      }

      // 验证订单类型
      if (!Object.values(OrderType).includes(options.ordType)) {
        throw new Error("无效的订单类型");
      }

      // 验证订单方向
      if (!Object.values(OrderSide).includes(options.side)) {
        throw new Error("无效的订单方向");
      }

      // 验证持仓方向（如果提供）
      if (
        options.posSide &&
        !Object.values(PositionSide).includes(options.posSide)
      ) {
        throw new Error("无效的持仓方向");
      }

      // 验证目标币种单位（如果提供）
      if (
        options.tgtCcy &&
        !Object.values(TargetCurrency).includes(options.tgtCcy)
      ) {
        throw new Error("无效的目标币种单位");
      }

      // 限价单必须提供价格
      if (options.ordType === OrderType.LIMIT && !options.px) {
        throw new Error("限价单必须提供价格");
      }

      // 生成订单消息ID
      const messageId = this.generateOrderId();

      // 构建下单消息
      const orderMessage = {
        id: messageId,
        op: OperationType.ORDER,
        args: [
          {
            instId: options.instId,
            tdMode: options.tdMode,
            side: options.side,
            ordType: options.ordType,
            sz: options.sz,
            clOrdId: messageId,
            tag: "",
            ...(options.px && { px: options.px }), // 可选参数，仅在限价单时需要
            ...(options.ccy && { ccy: options.ccy }),
            // ...(options.clOrdId && { clOrdId: options.clOrdId }),
            // ...(options.tag && { tag: options.tag }),
            ...(options.posSide && { posSide: options.posSide }),
            ...(options.reduceOnly && { reduceOnly: options.reduceOnly }),
            ...(options.tgtCcy && { tgtCcy: options.tgtCcy }),
            ...(options.banAmend && { banAmend: options.banAmend }),
            ...(options.expTime && { expTime: options.expTime }),
          },
        ],
      };

      // 创建Promise以等待订单响应
      const orderPromise = new Promise((resolve, reject) => {
        // 设置超时处理
        const timeoutId = setTimeout(() => {
          this.orders.delete(messageId);
          reject(new Error("下单请求超时"));
        }, 10000); // 10秒超时

        // 存储订单Promise
        this.orders.set(messageId, {
          resolve,
          reject,
          timeoutId,
        });

        // 添加订单响应处理函数
        this.connections[WebSocketType.PRIVATE].addMessageHandler(
          "order",
          (message) => {
            if (message.id === messageId) {
              const orderData = message.data[0];
              if (message.code === "0" && orderData.sCode === "0") {
                resolve(message);
              } else {
                reject(new Error(orderData.sMsg || message.msg || "下单失败"));
              }
            }
          }
        );
      });

      try {
        // 发送下单消息
        await this.send({
          type: WebSocketType.PRIVATE,
          data: orderMessage,
        });

        // 等待订单响应
        const response = await orderPromise;
        return response;
      } finally {
        // 清理订单Promise和消息处理函数
        const order = this.orders.get(messageId);
        if (order?.timeoutId) {
          clearTimeout(order.timeoutId);
        }
        this.orders.delete(messageId);
        this.connections[WebSocketType.PRIVATE].removeMessageHandler("order");
      }
    },

    /**
     * 获取历史订单和未完结订单
     * @param {string} instType 产品类型
     */
    async fetchOrdersData(instType) {
      try {
        // 获取历史订单
        const historyResponse = await getHistoryOrders({
          instType,
          limit: "100", // 最大获取100条
        });

        // 获取未完结订单
        const pendingResponse = await getPendingOrders({
          instType,
          limit: "100", // 最大获取100条
        });

        if (historyResponse.code === "0" && pendingResponse.code === "0") {
          // 更新订单数据
          this.ordersData[instType] = {
            active: pendingResponse.data || [],
            history: historyResponse.data || [],
            lastUpdateTime: new Date().getTime(),
          };
        } else {
          throw new Error(
            historyResponse.msg || pendingResponse.msg || "获取订单数据失败"
          );
        }
      } catch (error) {
        console.error(`获取${instType}订单数据失败:`, error);
        throw error;
      }
    },

    /**
     * 订阅订单频道
     * @param {Object} options 订阅选项
     * @param {string} options.instType 产品类型
     * @param {Function} options.onData 数据回调函数
     * @returns {Promise<void>}
     */
    async subscribeOrders({ instType = InstrumentType.ANY, onData }) {
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未连接");
      }

      if (!this.isLoggedIn(WebSocketType.PRIVATE)) {
        throw new Error("WebSocket未登录");
      }

      // 验证产品类型
      if (!Object.values(InstrumentType).includes(instType)) {
        throw new Error("无效的产品类型");
      }

      // 先获取历史订单和未完结订单
      await this.fetchOrdersData(instType);

      const subscriptionKey = `${AccountChannelType.ORDERS}_${instType}`;

      // 构建订阅消息
      const message = {
        op: "subscribe",
        args: [
          {
            channel: AccountChannelType.ORDERS,
            instType: instType,
          },
        ],
      };

      // 创建消息处理函数
      const messageHandler = (message) => {
        // 处理订阅成功消息
        if (
          message.event === "subscribe" &&
          message.arg?.channel === AccountChannelType.ORDERS
        ) {
          console.log(`${instType}订单频道订阅成功`);
          return;
        }

        // 处理订单数据更新
        if (
          message?.arg?.channel === AccountChannelType.ORDERS &&
          Array.isArray(message?.data)
        ) {
          // 更新订单数据
          const newOrders = message.data;
          const currentActive = [...(this.ordersData[instType]?.active || [])];
          const currentHistory = [
            ...(this.ordersData[instType]?.history || []),
          ];

          // 遍历新的订单数据
          newOrders.forEach((newOrder) => {
            // 根据订单状态决定是活跃订单还是历史订单
            const isActiveOrder =
              newOrder.state === "live" ||
              newOrder.state === "partially_filled";

            if (isActiveOrder) {
              // 处理活跃订单
              const existingIndex = currentActive.findIndex(
                (order) => order.ordId === newOrder.ordId
              );

              if (existingIndex !== -1) {
                // 更新已存在的订单
                currentActive[existingIndex] = {
                  ...currentActive[existingIndex],
                  ...newOrder,
                };
              } else {
                // 添加新订单
                currentActive.unshift(newOrder);
              }
            } else {
              // 处理历史订单
              const existingIndex = currentHistory.findIndex(
                (order) => order.ordId === newOrder.ordId
              );

              if (existingIndex !== -1) {
                // 更新已存在的订单
                currentHistory[existingIndex] = {
                  ...currentHistory[existingIndex],
                  ...newOrder,
                };
              } else {
                // 添加新订单
                currentHistory.unshift(newOrder);

                // 如果这个订单之前在活跃订单中，需要从活跃订单中移除
                const activeIndex = currentActive.findIndex(
                  (order) => order.ordId === newOrder.ordId
                );
                if (activeIndex !== -1) {
                  currentActive.splice(activeIndex, 1);
                }
              }
            }
          });

          // 更新状态
          this.ordersData[instType] = {
            active: currentActive,
            history: currentHistory,
            lastUpdateTime: new Date().getTime(),
          };

          // 调用回调函数
          if (typeof onData === "function") {
            onData({
              ...message,
              ordersData: this.ordersData[instType],
            });
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
        data: message,
      });

      console.log(`已订阅${instType}订单数据`);
    },

    /**
     * 取消订阅订单频道
     * @param {Object} options 取消订阅选项
     * @param {string} options.instType 产品类型
     */
    unsubscribeOrders({ instType = InstrumentType.ANY }) {
      if (!this.isConnected(WebSocketType.PRIVATE)) {
        return;
      }

      const subscriptionKey = `${AccountChannelType.ORDERS}_${instType}`;

      // 构建取消订阅消息
      const message = {
        op: "unsubscribe",
        args: [
          {
            channel: AccountChannelType.ORDERS,
            instType: instType,
          },
        ],
      };

      // 发送取消订阅消息
      this.send({
        type: WebSocketType.PRIVATE,
        data: message,
      });

      // 移除消息处理函数
      this.connections[WebSocketType.PRIVATE].removeMessageHandler(
        subscriptionKey
      );

      // 清空对应产品类型的订单数据
      this.ordersData[instType] = [];
      this.ordersData.lastUpdateTime = new Date().getTime();

      console.log(`已取消订阅${instType}订单数据`);
    },

    /**
     * 清空订单数据
     * @param {string} [instType] 产品类型，如果不指定则清空所有
     */
    clearOrdersData(instType) {
      if (instType) {
        this.ordersData[instType] = [];
      } else {
        this.ordersData = {
          SPOT: [],
          SWAP: [],
          lastUpdateTime: null,
        };
      }
    },
  },
});
