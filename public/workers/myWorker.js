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
        case "kline_data":
          this.handleKlineData(data.payload);
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

      // 初始化K线数据存储
      this.klines = {};
      this.historyKlines = {};
      this.klineTimeLevels.forEach((timeLevel) => {
        this.klines[timeLevel] = [];
        this.historyKlines[timeLevel] = [];
      });

      // 先获取历史K线数据
      console.log("开始获取历史K线数据");
      await this.handleHistoryKline(this.klineTimeLevels);
      console.log("历史K线数据获取完成");

      // 通知主进程需要订阅的时间级别
      this.postMessage({
        type: "subscribe_klines",
        data: {
          strategyId: this.strategy.id,
          currency: this.strategy.currency,
          timeLevels: this.klineTimeLevels,
        },
      });

      // 发送初始化完成消息
      this.postMessage({
        type: "init_complete",
        data: {
          strategyId: this.strategy.id,
          status: "initialized",
          timeLevels: this.klineTimeLevels,
          historyKlines: this.historyKlines, // 添加历史K线数据到返回信息中
        },
      });

      console.log("Worker 初始化完成");
    } catch (error) {
      console.error("Worker 初始化错误:", error);
      throw error;
    }
  }

  /**
   * 处理K线数据
   * @param {Object} data K线数据
   */
  handleKlineData(data) {
    try {
      console.log("收到K线数据:", data);
      const { timeLevel, klineData } = data;

      if (!timeLevel || !klineData || !Array.isArray(klineData)) {
        console.warn("无效的K线数据格式:", data);
        return;
      }

      // 确保存储数组已初始化
      if (!this.klines[timeLevel]) {
        this.klines[timeLevel] = [];
      }
      if (!this.historyKlines[timeLevel]) {
        this.historyKlines[timeLevel] = [];
      }

      // 处理每一根K线
      klineData.forEach((item) => {
        const kline = {
          timestamp: parseInt(item.ts),
          open: parseFloat(item.o),
          high: parseFloat(item.h),
          low: parseFloat(item.l),
          close: parseFloat(item.c),
          volume: parseFloat(item.vol),
          volCcy: parseFloat(item.volCcy),
          confirm: item.confirm === "1", // K线是否已完结
        };

        console.log(`[${timeLevel}] 处理K线数据:`, kline);

        if (kline.confirm) {
          // 已完结的K线存入历史数据
          console.log(`[${timeLevel}] K线已完结，存入历史数据:`, kline);
          this.historyKlines[timeLevel].push(kline);

          // 维护历史K线数量上限
          const maxHistoryKlines = 1000;
          if (this.historyKlines[timeLevel].length > maxHistoryKlines) {
            console.log(`[${timeLevel}] 历史K线数量超过限制，删除最早的K线`);
            this.historyKlines[timeLevel].shift();
          }

          // 如果这根K线在当前K线数组中，需要移除
          const index = this.klines[timeLevel].findIndex(
            (k) => k.timestamp === kline.timestamp
          );
          if (index !== -1) {
            console.log(`[${timeLevel}] 从当前K线数组中移除已完结的K线`);
            this.klines[timeLevel].splice(index, 1);
          }
        } else {
          // 未完结的K线更新或添加到当前K线数组
          const index = this.klines[timeLevel].findIndex(
            (k) => k.timestamp === kline.timestamp
          );
          if (index !== -1) {
            console.log(`[${timeLevel}] 更新现有K线数据`);
            this.klines[timeLevel][index] = kline;
          } else {
            console.log(`[${timeLevel}] 添加新的K线数据`);
            this.klines[timeLevel].push(kline);
          }

          // 维护当前K线数量上限
          const maxKlines = 1000;
          if (this.klines[timeLevel].length > maxKlines) {
            console.log(`[${timeLevel}] 当前K线数量超过限制，删除最早的K线`);
            this.klines[timeLevel].shift();
          }
        }
      });

      // 打印当前状态
      console.log(`[${timeLevel}] 当前状态:`, {
        currentKlines: this.klines[timeLevel].length,
        historyKlines: this.historyKlines[timeLevel].length,
      });
    } catch (error) {
      console.error("处理K线数据失败:", error);
      this.handleError(error);
    }
  }

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

          // 通知进度开始
          this.postMessage({
            type: "history_kline_progress",
            data: {
              timeLevel,
              percentage: 0,
              current: 0,
              total: 300, // 默认获取300根K线
            },
          });

          const klines = await this.getHistoryKlines(
            this.strategy.currency, // 交易对
            timeLevel, // K线周期
            300 // 获取300根K线用于计算指标
          );

          // 存储K线数据并按时间排序
          this.historyKlines[timeLevel] = klines.sort(
            (a, b) => a.timestamp - b.timestamp
          );

          console.log(`${timeLevel} K线数据获取完成，数量:`, klines.length);

          // 通知获取完成
          this.postMessage({
            type: "history_kline_complete",
            data: {
              timeLevel,
              count: klines.length,
              klines: klines, // 可以选择是否需要传递K线数据到主线程
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
            historyKlines: this.historyKlines,
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
  async getHistoryKlines(instId, bar, limit = 300) {
    try {
      let allKlines = [];
      let lastTs = ""; // 用于分页的时间戳

      // 计算需要请求多少次
      const batchSize = 100; // 每次请求100条
      const batchCount = Math.ceil(limit / batchSize);

      for (let i = 0; i < batchCount; i++) {
        // 构建请求URL
        let url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${batchSize}`;
        if (lastTs) {
          url += `&after=${lastTs}`;
        }

        // 请求数据
        const data = await this.fetchData(url);

        if (
          data.code === "0" &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          // OKX K线数据格式转换
          const klines = data.data.map((item) => ({
            timestamp: parseInt(item[0]), // 开始时间
            open: parseFloat(item[1]), // 开盘价
            high: parseFloat(item[2]), // 最高价
            low: parseFloat(item[3]), // 最低价
            close: parseFloat(item[4]), // 收盘价
            volume: parseFloat(item[5]), // 交易量
            volCcy: parseFloat(item[6]), // 交易额
            confirm: true, // 历史数据都是已完结的
          }));

          // 更新最后一条数据的时间戳，用于下次请求
          lastTs = data.data[data.data.length - 1][0];

          // 合并数据
          allKlines = allKlines.concat(klines);

          // 发送进度通知
          this.postMessage({
            type: "history_kline_progress",
            data: {
              timeLevel: bar,
              percentage: Math.round((allKlines.length / limit) * 100),
              current: allKlines.length,
              total: limit,
            },
          });

          // 如果返回的数据少于100条，说明没有更多数据了
          if (data.data.length < batchSize) {
            break;
          }

          // 延迟100ms，避免触发频率限制
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          throw new Error("获取K线数据失败: " + JSON.stringify(data));
        }

        // 如果已经获取足够的数据，就停止
        if (allKlines.length >= limit) {
          allKlines = allKlines.slice(0, limit); // 只保留需要的数量
          break;
        }
      }

      return allKlines;
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
