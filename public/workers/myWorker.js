/**
 * 策略执行 Worker
 */
class StrategyWorker extends self.BaseWorker {
  constructor() {
    super();
    // 初始化核心数据结构
    this.strategy = null;
    this.wsClient = null;
    // 使用 Map 替代普通对象，提高性能
    this.klines = new Map();
    this.historyKlines = new Map();
    this.klineTimeLevels = [];

    // 配置参数
    this.config = {
      maxKlineCount: 1000, // 最大K线数量
      maxHistoryKlineCount: 1000, // 最大历史K线数量
      cleanupInterval: 60 * 1000, // 清理间隔（1分钟）
      batchSize: 100, // 批处理大小
      retryCount: 3, // 重试次数
      retryDelay: 1000, // 重试延迟
    };

    // 初始化性能监控
    this.performance = {
      lastCleanup: Date.now(),
      processCount: 0,
      errorCount: 0,
    };

    this.initErrorHandlers();
    this.startPeriodicCleanup();

    console.log("StrategyWorker 初始化完成");
  }

  /**
   * 初始化错误处理器
   */
  initErrorHandlers() {
    self.addEventListener("error", (error) => {
      this.handleError(error, "全局错误");
    });

    self.addEventListener("unhandledrejection", (event) => {
      this.handleError(new Error(event.reason), "未处理的Promise异常");
    });
  }

  /**
   * 启动定期清理任务
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupOldData();
    }, this.config.cleanupInterval);
  }

  /**
   * 清理旧数据
   */
  cleanupOldData() {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      for (const [timeLevel, klines] of this.historyKlines) {
        const validKlines = klines.filter(
          (kline) => now - kline.timestamp < maxAge
        );
        this.historyKlines.set(timeLevel, validKlines);
      }

      this.performance.lastCleanup = now;
    } catch (error) {
      this.handleError(error, "数据清理失败");
    }
  }

  /**
   * 处理接收到的数据
   */
  processData(data) {
    try {
      this.performance.processCount++;
      //   console.log("Worker 收到数据:", data);

      switch (data.type) {
        case "init":
          return this.handleInit(data.payload);
        case "kline_data":
          return this.handleKlineData(data.payload);
        case "stop":
          return this.stop();
        default:
          throw new Error(`未知的消息类型: ${data.type}`);
      }
    } catch (error) {
      this.handleError(error, "数据处理失败");
    }
  }

  /**
   * 处理初始化数据
   */
  async handleInit(payload) {
    try {
      console.log("Worker 开始初始化:", payload);

      // 验证必要数据
      if (!payload?.strategy) {
        throw new Error("初始化数据不完整");
      }

      this.strategy = payload.strategy;
      this.klineTimeLevels = await this.handleKlineTimeLevel(
        this.strategy.fullExpression
      );

      // 初始化数据存储
      this.initializeDataStructures();

      // 获取历史数据
      await this.handleHistoryKline(this.klineTimeLevels);

      // 发送订阅请求
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
          historyKlines: Object.fromEntries(this.historyKlines),
        },
      });

      console.log("Worker 初始化完成");
    } catch (error) {
      this.handleError(error, "初始化失败");
    }
  }

  /**
   * 初始化数据结构
   */
  initializeDataStructures() {
    this.klines.clear();
    this.historyKlines.clear();
    this.klineTimeLevels.forEach((timeLevel) => {
      this.klines.set(timeLevel, []);
      this.historyKlines.set(timeLevel, []);
    });
  }

  /**
   * 处理K线数据
   */
  handleKlineData(data) {
    try {
      const { timeLevel, klineData } = data;
      if (!this.validateKlineData(timeLevel, klineData)) {
        return;
      }

      // 使用临时数组进行批处理
      const tempKlines = [...(this.klines.get(timeLevel) || [])];
      const tempHistoryKlines = [...(this.historyKlines.get(timeLevel) || [])];

      klineData.forEach((item) => {
        const kline = this.normalizeKlineData(item);
        this.processKline(kline, timeLevel, tempKlines, tempHistoryKlines);
      });

      // 原子性更新数据
      this.klines.set(timeLevel, tempKlines);
      this.historyKlines.set(timeLevel, tempHistoryKlines);
    } catch (error) {
      this.handleError(error, "K线数据处理失败");
    }
  }

  /**
   * 验证K线数据
   */
  validateKlineData(timeLevel, klineData) {
    if (!timeLevel || !Array.isArray(klineData)) {
      console.warn("无效的K线数据格式");
      return false;
    }
    return true;
  }

  /**
   * 标准化K线数据
   */
  normalizeKlineData(item) {
    return {
      timestamp: parseInt(item.ts),
      open: parseFloat(item.o),
      high: parseFloat(item.h),
      low: parseFloat(item.l),
      close: parseFloat(item.c),
      volume: parseFloat(item.vol),
      volCcy: parseFloat(item.volCcy),
      confirm: item.confirm === "1",
    };
  }

  /**
   * 处理单个K线
   */
  processKline(kline, timeLevel, tempKlines, tempHistoryKlines) {
    if (kline.confirm) {
      this.handleConfirmedKline(
        kline,
        timeLevel,
        tempKlines,
        tempHistoryKlines
      );
    } else {
      this.handleUnconfirmedKline(kline, timeLevel, tempKlines);
    }
  }

  /**
   * 处理已确认的K线
   */
  handleConfirmedKline(kline, timeLevel, tempKlines, tempHistoryKlines) {
    // 添加到历史数据
    tempHistoryKlines.push(kline);

    // 维护历史数据上限
    while (tempHistoryKlines.length > this.config.maxHistoryKlineCount) {
      tempHistoryKlines.shift();
    }

    // 从当前数据中移除
    const index = tempKlines.findIndex((k) => k.timestamp === kline.timestamp);
    if (index !== -1) {
      tempKlines.splice(index, 1);
    }
  }

  /**
   * 处理未确认的K线
   */
  handleUnconfirmedKline(kline, timeLevel, tempKlines) {
    const index = tempKlines.findIndex((k) => k.timestamp === kline.timestamp);
    if (index !== -1) {
      tempKlines[index] = kline;
    } else {
      tempKlines.push(kline);
    }

    // 维护当前数据上限
    while (tempKlines.length > this.config.maxKlineCount) {
      tempKlines.shift();
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
              total: 300,
            },
          });

          const klines = await this.getHistoryKlines(
            this.strategy.currency,
            timeLevel,
            300
          );

          // 存储K线数据并按时间排序
          this.historyKlines.set(
            timeLevel,
            klines.sort((a, b) => a.timestamp - b.timestamp)
          );

          // 通知获取完成
          this.postMessage({
            type: "history_kline_complete",
            data: {
              timeLevel,
              count: klines.length,
              klines: klines,
            },
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // 所有K线数据获取完成
        this.postMessage({
          type: "all_history_kline_complete",
          data: {
            timeLevels: klineTimeLevels,
            historyKlines: Object.fromEntries(this.historyKlines),
          },
        });
      } catch (error) {
        this.handleError(error, "获取历史K线数据失败");
      }
    }
  }

  /**
   * 获取历史K线数据
   */
  async getHistoryKlines(instId, bar, limit = 300) {
    let allKlines = [];
    let retryCount = 0;

    while (retryCount < this.config.retryCount) {
      try {
        let lastTs = "";
        const batchCount = Math.ceil(limit / this.config.batchSize);

        for (let i = 0; i < batchCount; i++) {
          let url = `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${this.config.batchSize}`;
          if (lastTs) {
            url += `&after=${lastTs}`;
          }

          const data = await this.fetchData(url);

          if (
            data.code === "0" &&
            Array.isArray(data.data) &&
            data.data.length > 0
          ) {
            const klines = data.data.map((item) => ({
              timestamp: parseInt(item[0]),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
              volCcy: parseFloat(item[6]),
              confirm: true,
            }));

            lastTs = data.data[data.data.length - 1][0];
            allKlines = allKlines.concat(klines);

            this.postMessage({
              type: "history_kline_progress",
              data: {
                timeLevel: bar,
                percentage: Math.round((allKlines.length / limit) * 100),
                current: allKlines.length,
                total: limit,
              },
            });

            if (data.data.length < this.config.batchSize) {
              break;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
          } else {
            throw new Error("获取K线数据失败: " + JSON.stringify(data));
          }

          if (allKlines.length >= limit) {
            allKlines = allKlines.slice(0, limit);
            break;
          }
        }

        return allKlines;
      } catch (error) {
        retryCount++;
        if (retryCount === this.config.retryCount) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay * retryCount)
        );
      }
    }

    return allKlines;
  }

  /**
   * 发送HTTP请求的包装方法
   */
  async fetchData(url, options = {}) {
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

    return await response.json();
  }

  /**
   * 错误处理增强版
   */
  handleError(error, context = "") {
    this.performance.errorCount++;
    console.error(`${context}:`, error);

    this.postMessage({
      type: "error",
      error: {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * 停止策略
   */
  stop() {
    try {
      if (this.wsClient) {
        this.wsClient.close();
        this.wsClient = null;
      }
      // 清理数据
      this.klines.clear();
      this.historyKlines.clear();
      this.strategy = null;

      console.log("Worker 已停止");
    } catch (error) {
      this.handleError(error, "停止策略失败");
    }
  }
}

// 创建 Worker 实例
new StrategyWorker();
