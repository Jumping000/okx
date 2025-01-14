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

      // 计算指标
      this.calculateIndicators(timeLevel);
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

  /**
   * 计算指标入口
   * @param {string} timeLevel - 时间级别
   */
  calculateIndicators(timeLevel) {
    try {
      // 获取完整的K线数据
      const currentKlines = this.klines.get(timeLevel) || [];
      const historyKlines = this.historyKlines.get(timeLevel) || [];
      const allKlines = [...historyKlines, ...currentKlines].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // 计算各类指标
      const indicators = {
        ma: this.calculateMA(allKlines),
        ema: this.calculateEMA(allKlines),
        macd: this.calculateMACD(allKlines),
        kdj: this.calculateKDJ(allKlines),
        rsi: this.calculateRSI(allKlines),
        boll: this.calculateBOLL(allKlines),
        customIndicators: this.calculateCustomIndicators(allKlines),
      };

      // 发送指标计算结果
      this.postMessage({
        type: "indicators_updated",
        data: {
          timeLevel,
          indicators,
          timestamp: Date.now(),
        },
      });

      return indicators;
    } catch (error) {
      this.handleError(error, "指标计算失败");
      return null;
    }
  }

  /**
   * 计算移动平均线
   * @param {Array} klines - K线数据
   * @returns {Object} MA指标数据
   */
  calculateMA(klines) {
    try {
      const periods = [5, 10, 20, 30, 60];
      const result = {};

      periods.forEach((period) => {
        result[`ma${period}`] = [];
        for (let i = 0; i < klines.length; i++) {
          if (i < period - 1) {
            result[`ma${period}`].push(null);
            continue;
          }

          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += klines[i - j].close;
          }
          result[`ma${period}`].push(sum / period);
        }
      });

      return result;
    } catch (error) {
      this.handleError(error, "MA计算失败");
      return {};
    }
  }

  /**
   * 计算指数移动平均线
   * @param {Array} klines - K线数据
   * @returns {Object} EMA指标数据
   */
  calculateEMA(klines) {
    try {
      const periods = [5, 10, 20, 30, 60];
      const result = {};

      periods.forEach((period) => {
        result[`ema${period}`] = [];
        const multiplier = 2 / (period + 1);

        for (let i = 0; i < klines.length; i++) {
          if (i === 0) {
            result[`ema${period}`].push(klines[i].close);
            continue;
          }

          const prevEMA = result[`ema${period}`][i - 1];
          const currentClose = klines[i].close;
          const currentEMA = (currentClose - prevEMA) * multiplier + prevEMA;
          result[`ema${period}`].push(currentEMA);
        }
      });

      return result;
    } catch (error) {
      this.handleError(error, "EMA计算失败");
      return {};
    }
  }

  /**
   * 计算MACD指标
   * @param {Array} klines - K线数据
   * @returns {Object} MACD指标数据
   */
  calculateMACD(klines) {
    try {
      const shortPeriod = 12;
      const longPeriod = 26;
      const signalPeriod = 9;
      const result = {
        dif: [],
        dea: [],
        macd: [],
      };

      // 计算快速和慢速EMA
      const shortEMA = [];
      const longEMA = [];
      const shortMultiplier = 2 / (shortPeriod + 1);
      const longMultiplier = 2 / (longPeriod + 1);

      // 计算DIF
      for (let i = 0; i < klines.length; i++) {
        if (i === 0) {
          shortEMA[i] = klines[i].close;
          longEMA[i] = klines[i].close;
          result.dif[i] = 0;
        } else {
          shortEMA[i] =
            (klines[i].close - shortEMA[i - 1]) * shortMultiplier +
            shortEMA[i - 1];
          longEMA[i] =
            (klines[i].close - longEMA[i - 1]) * longMultiplier +
            longEMA[i - 1];
          result.dif[i] = shortEMA[i] - longEMA[i];
        }
      }

      // 计算DEA和MACD
      const signalMultiplier = 2 / (signalPeriod + 1);
      for (let i = 0; i < klines.length; i++) {
        if (i === 0) {
          result.dea[i] = result.dif[i];
        } else {
          result.dea[i] =
            (result.dif[i] - result.dea[i - 1]) * signalMultiplier +
            result.dea[i - 1];
        }
        // MACD = (DIF - DEA) * 2
        result.macd[i] = (result.dif[i] - result.dea[i]) * 2;
      }

      return result;
    } catch (error) {
      this.handleError(error, "MACD计算失败");
      return {};
    }
  }

  /**
   * 计算KDJ指标
   * @param {Array} klines - K线数据
   * @returns {Object} KDJ指标数据
   */
  calculateKDJ(klines) {
    try {
      const period = 9;
      const result = {
        k: [],
        d: [],
        j: [],
      };

      for (let i = 0; i < klines.length; i++) {
        if (i < period - 1) {
          result.k.push(50);
          result.d.push(50);
          result.j.push(50);
          continue;
        }

        // 计算RSV
        let highestHigh = -Infinity;
        let lowestLow = Infinity;
        for (let j = i - period + 1; j <= i; j++) {
          highestHigh = Math.max(highestHigh, klines[j].high);
          lowestLow = Math.min(lowestLow, klines[j].low);
        }
        const rsv =
          ((klines[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;

        // 计算KDJ
        const k =
          i === period - 1 ? rsv : (2 / 3) * result.k[i - 1] + (1 / 3) * rsv;
        const d =
          i === period - 1 ? k : (2 / 3) * result.d[i - 1] + (1 / 3) * k;
        const j = 3 * k - 2 * d;

        result.k.push(k);
        result.d.push(d);
        result.j.push(j);
      }

      return result;
    } catch (error) {
      this.handleError(error, "KDJ计算失败");
      return {};
    }
  }

  /**
   * 计算RSI指标
   * @param {Array} klines - K线数据
   * @returns {Object} RSI指标数据
   */
  calculateRSI(klines) {
    try {
      const periods = [6, 12, 24];
      const result = {};

      periods.forEach((period) => {
        result[`rsi${period}`] = [];
        let gains = [];
        let losses = [];

        // 计算涨跌幅
        for (let i = 1; i < klines.length; i++) {
          const change = klines[i].close - klines[i - 1].close;
          gains.push(Math.max(0, change));
          losses.push(Math.max(0, -change));
        }

        // 计算RSI
        for (let i = 0; i < klines.length; i++) {
          if (i < period) {
            result[`rsi${period}`].push(null);
            continue;
          }

          let avgGain =
            gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
          let avgLoss =
            losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

          if (avgLoss === 0) {
            result[`rsi${period}`].push(100);
          } else {
            const rs = avgGain / avgLoss;
            result[`rsi${period}`].push(100 - 100 / (1 + rs));
          }
        }
      });

      return result;
    } catch (error) {
      this.handleError(error, "RSI计算失败");
      return {};
    }
  }

  /**
   * 计算布林带指标
   * @param {Array} klines - K线数据
   * @returns {Object} BOLL指标数据
   */
  calculateBOLL(klines) {
    try {
      const period = 20;
      const multiplier = 2;
      const result = {
        middle: [],
        upper: [],
        lower: [],
      };

      for (let i = 0; i < klines.length; i++) {
        if (i < period - 1) {
          result.middle.push(null);
          result.upper.push(null);
          result.lower.push(null);
          continue;
        }

        // 计算中轨（20日移动平均线）
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += klines[i - j].close;
        }
        const middle = sum / period;

        // 计算标准差
        let squareSum = 0;
        for (let j = 0; j < period; j++) {
          squareSum += Math.pow(klines[i - j].close - middle, 2);
        }
        const standardDeviation = Math.sqrt(squareSum / period);

        // 计算上下轨
        const upper = middle + multiplier * standardDeviation;
        const lower = middle - multiplier * standardDeviation;

        result.middle.push(middle);
        result.upper.push(upper);
        result.lower.push(lower);
      }

      return result;
    } catch (error) {
      this.handleError(error, "BOLL计算失败");
      return {};
    }
  }

  /**
   * 计算自定义指标
   * @param {Array} klines - K线数据
   * @returns {Object} 自定义指标数据
   */
  calculateCustomIndicators(klines) {
    try {
      const result = {
        volumeMA: [], // 成交量移动平均
        priceRange: [], // 价格波动范围
        momentum: [], // 动量指标
      };

      // 计算成交量移动平均
      const volumePeriod = 5;
      for (let i = 0; i < klines.length; i++) {
        if (i < volumePeriod - 1) {
          result.volumeMA.push(null);
          continue;
        }

        let sum = 0;
        for (let j = 0; j < volumePeriod; j++) {
          sum += klines[i - j].volume;
        }
        result.volumeMA.push(sum / volumePeriod);
      }

      // 计算价格波动范围
      for (let i = 0; i < klines.length; i++) {
        result.priceRange.push(klines[i].high - klines[i].low);
      }

      // 计算动量指标（10周期）
      const momentumPeriod = 10;
      for (let i = 0; i < klines.length; i++) {
        if (i < momentumPeriod) {
          result.momentum.push(null);
          continue;
        }
        result.momentum.push(
          klines[i].close - klines[i - momentumPeriod].close
        );
      }

      return result;
    } catch (error) {
      this.handleError(error, "自定义指标计算失败");
      return {};
    }
  }
}

// 创建 Worker 实例
new StrategyWorker();
