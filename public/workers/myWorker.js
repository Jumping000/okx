/**
 * 策略执行 Worker
 */
class StrategyWorker extends self.BaseWorker {
  constructor() {
    super();
    this.strategy = null;
    this.wsClient = null;
    this.klines = [];
    this.historyKlines = [];
    this.klineTimeLevels = [];
    console.log("StrategyWorker 初始化完成");

    // 添加全局错误处理
    self.addEventListener("error", (error) => {
      console.error("Worker 内部错误:", error);
      this.handleError(error);
    });

    // 添加未捕获的 Promise 异常处理
    self.addEventListener("unhandledrejection", (event) => {
      console.error("Worker 未处理的 Promise 异常:", event.reason);
      this.handleError(new Error(event.reason));
    });
  }

  /**
   * 处理接收到的数据
   * @param {Object} data 接收到的数据对象
   */
  processData(data) {
    try {
      console.log("Worker 收到数据:", data);

      switch (data.type) {
        case "init":
          this.handleInit(data.payload);
          break;
        case "stop":
          this.stop();
          break;

        default:
          throw new Error(`未知的消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error("Worker 处理数据错误:", error);
      this.handleError(error);
    }
  }

  /**
   * 处理初始化数据
   * @param {Object} payload 初始化数据
   */
  async handleInit(payload) {
    try {
      console.log("Worker 开始初始化:", payload);

      // 保存策略配置
      this.strategy = payload.strategy;

      // 分解表达式需要的K线时间级别
      this.klineTimeLevels = await this.handleKlineTimeLevel(
        this.strategy.fullExpression
      );
      console.log("用到的时间级别：", this.klineTimeLevels);
      // 验证必要数据
      if (!this.strategy) {
        throw new Error("初始化数据不完整");
      }
      // 订阅历史K线
      await this.handleHistoryKline(this.klineTimeLevels);
      // 初始化 WebSocket 连接
      //   await this.initWebSocket();

      // 发送初始化完成消息
      this.postMessage({
        type: "init_complete",
        data: {
          strategyId: this.strategy.id,
          status: "initialized",
        },
      });

      console.log("Worker 初始化完成");
    } catch (error) {
      console.error("Worker 初始化错误:", error);
      throw error;
    }
  }

  /**
   * 初始化 WebSocket 连接
   * @private
   */
  async initWebSocket() {
    // 创建 WebSocket 客户端
    this.wsClient = new self.WebSocketClient(
      "wss://ws.okx.com:8443/ws/v5/public",
      {
        maxReconnectAttempts: 5,
        reconnectInterval: 3000,
      }
    );

    // // 注册消息处理器
    this.wsClient.onMessage("tickers", (data) => {
      this.handleTickerData(data);
    });

    // this.wsClient.onMessage("candle1m", (data) => {
    //   this.handleKlineData(data);
    // });

    // this.wsClient.onMessage("books", (data) => {
    //   this.handleDepthData(data);
    // });

    // this.wsClient.onMessage("trades", (data) => {
    //   this.handleTradeData(data);
    // });

    // 连接 WebSocket
    await this.wsClient.connect();

    // 订阅历史K线
    await this.handleHistoryKline(this.klineTimeLevels);
    // TODO:接下来要进行内容 完善 历史k线 然后循环订阅多个K线频道 通过状态判断是否完结完结存入历史 不然则为最新的

    // // 订阅行情数据
    // const subscribeMessage = {
    //   op: "subscribe",
    //   args: [
    //     {
    //       channel: "tickers",
    //       //       instId: this.strategy.currency,
    //       //     },
    //       //     {
    //       //       channel: "candle1m",
    //       //       instId: this.strategy.currency,
    //       //     },
    //       //     {
    //       //       channel: "books",
    //       //       instId: this.strategy.currency,
    //       //     },
    //       //     {
    //       //       channel: "trades",
    //       instId: this.strategy.currency,
    //     },
    //   ],
    // };

    // console.log("发送订阅请求:", subscribeMessage);
    // this.wsClient.send(subscribeMessage);
  }
  //   handleTickerData(data) {
  //     this.klines.push(data);
  //     console.log(this.klines);
  //   }

  // 分解表达式
  async handleKlineTimeLevel(expression) {
    //   expression((SP_1F + ( SP_1F + ZD_1F ) + ( SP_1F + ZD_1F )) >= 3 and (SP_1F + ( SP_1F + ZD_1F ) + ( SP_1F + ZD_1F )) <= 2) or (SP_1F + ( SP_1F + ZD_1F ) + ( SP_1F + ZD_1F )) != 1
    const improvedRegex = /\b([A-Z]+(?:_[A-Z0-9]+)*)\b/g;
    let matches = expression.match(improvedRegex);
    let variables = matches ? [...new Set(matches)] : []; // Remove duplicates if there are any
    let timeLevel = [
      { Name: "1F", dis: "1分钟", exchange: "1m" },
      { Name: "3F", dis: "3分钟", exchange: "3m" },
      { Name: "5F", dis: "5分钟", exchange: "5m" },
      { Name: "15F", dis: "15分钟", exchange: "15m" },
      { Name: "30F", dis: "30分钟", exchange: "30m" },
      { Name: "1S", dis: "1小时", exchange: "1H" },
      { Name: "2S", dis: "2小时", exchange: "2H" },
      { Name: "4S", dis: "4小时", exchange: "4H" },
      { Name: "6S", dis: "6小时", exchange: "6H" },
      { Name: "12S", dis: "12小时", exchange: "12H" },
      { Name: "1T", dis: "1天", exchange: "1D" },
      { Name: "2T", dis: "2天", exchange: "2D" },
      { Name: "3T", dis: "3天", exchange: "3D" },
      { Name: "5T", dis: "5天", exchange: "5D" },
      { Name: "1Z", dis: "1周", exchange: "1W" },
      { Name: "1Y", dis: "1月", exchange: "1M" },
      { Name: "3Y", dis: "3月", exchange: "3M" },
    ];
    let klineTimeLevels = [];
    variables.forEach(async (variable) => {
      const klineTimeLevel = variable.split("_");
      // 查找是否存在相同的时间级别 klineTimeLevel = ['LS', 'SP', '1F', '3'] timeLevel
      // 循环 klineTimeLevel
      klineTimeLevel.forEach((item) => {
        // item 匹配 timeLevel 的 Name
        const isExist = timeLevel.find((items) => items.Name === item);
        if (isExist) {
          klineTimeLevels.push(isExist.exchange);
        }
      });
    });

    klineTimeLevels = [...new Set(klineTimeLevels)];
    return klineTimeLevels;
  }
  /**
   * 处理历史K线数据获取
   * @param {Array} klineTimeLevels K线时间级别数组
   */
  async handleHistoryKline(klineTimeLevels) {
    if (klineTimeLevels.length > 0) {
      try {
        for (const timeLevel of klineTimeLevels) {
          console.log(
            `开始获取 ${this.strategy.currency} ${timeLevel} K线数据`
          );
          const klines = await this.getHistoryKlines(
            this.strategy.currency, // 交易对
            timeLevel // K线周期
          );
          console.log(klines);
          // 存储K线数据
          this.historyKlines[timeLevel] = klines;

          console.log(`${timeLevel} K线数据获取完成，数量:`, klines.length);

          // 通知主线程
          this.postMessage({
            type: "history_kline_complete",
            data: {
              timeLevel,
              count: klines.length,
            },
          });

          // 延迟一下，避免请求太频繁
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // 所有K线数据获取完成
        this.postMessage({
          type: "all_history_kline_complete",
          data: {
            timeLevels: klineTimeLevels,
          },
        });
      } catch (error) {
        console.error("获取历史K线数据失败:", error);
        this.handleError(error);
      }
    } else {
      console.log("没有需要获取的K线时间级别");
    }
  }
  /**
   * 停止策略
   */
  stop() {
    console.log("Worker 停止");
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
  }
  /**
   * 获取历史K线数据
   * @param {string} instId 交易对
   * @param {string} bar K线周期
   * @param {number} limit 获取数量
   * @returns {Promise} K线数据
   */
  async getHistoryKlines(instId, bar) {
    try {
      const url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}`;
      const data = await this.fetchData(url);

      if (data.code === "0" && Array.isArray(data.data)) {
        // OKX K线数据格式转换
        const klines = data.data.map((item) => ({
          timestamp: parseInt(item[0]), // 开始时间
          open: parseFloat(item[1]), // 开盘价
          high: parseFloat(item[2]), // 最高价
          low: parseFloat(item[3]), // 最低价
          close: parseFloat(item[4]), // 收盘价
          volume: parseFloat(item[5]), // 交易量
          volCcy: parseFloat(item[6]), // 交易额
        }));

        return klines;
      } else {
        throw new Error("获取K线数据失败: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("获取历史K线失败:", error);
      throw error;
    }
  }
  // 工具函数
  /**
   * 发送 HTTP 请求
   * @param {string} url 请求地址
   * @param {Object} options 请求选项
   * @returns {Promise} 请求结果
   */
  async fetchData(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.data ? JSON.stringify(options.data) : undefined,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("请求失败:", error);
      throw error;
    }
  }
}

// 创建 Worker 实例
new StrategyWorker();
