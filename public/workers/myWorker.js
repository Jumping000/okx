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
        // 策略表达式数组
        this.strategyExpression = [];
        // 价格精度
        this.priceDecimalPlaces = 0;
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
        // 时间级别
        this.timeLevel = [
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
            this.priceDecimalPlaces = payload.strategy.priceDecimalPlaces;
            // 分解表达式
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
    async handleKlineData(data) {
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
            this.calculateIndicators(this.strategyExpression[timeLevel], timeLevel);
            // 计算表达式
            this.calculateExpression(
                this.strategyExpression,
                this.strategy.fullExpression,
                tempKlines
            );
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
        this.strategyExpression = matches;

        let variables = matches ? [...new Set(matches)] : []; // Remove duplicates if there are any
        let klineTimeLevels = [];
        let formatText = [];
        variables.forEach(async (variable) => {
            const klineTimeLevel = variable.split("_");
            // 查找是否存在相同的时间级别 klineTimeLevel = ['LS', 'SP', '1F', '3'] timeLevel
            // 循环 klineTimeLevel
            klineTimeLevel.forEach((item, index) => {
                // item 匹配 timeLevel 的 Name
                const isExist = this.timeLevel.find((items) => items.Name === item);
                if (isExist) {
                    //   将时间单位存起来
                    klineTimeLevels.push(isExist.exchange);
                    klineTimeLevel[index] = isExist.exchange;
                }
            });
            // klineTimeLevel 将当前的 使用 exchange 拼成一个新的
            formatText.push(klineTimeLevel);
        });
        this.strategyExpression = this.classificationOfStrategyValues(formatText);

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
                            total: 500,
                        },
                    });

                    const klines = await this.getHistoryKlines(
                        this.strategy.currency,
                        timeLevel,
                        500
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
    async getHistoryKlines(instId, bar, limit = 500) {
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
     * 策略值归类
     */
    classificationOfStrategyValues(value) {
        let arr = {};
        value.forEach((item) => {
            if (
                arr[
                item[
                item[0] == "LS" ||
                    item[0] == "BOLL" ||
                    item[0] == "MACD" ||
                    item[0] == "KDJ"
                    ? 2
                    : 1
                ]
                ] == undefined
            ) {
                arr[
                    item[
                    item[0] == "LS" ||
                        item[0] == "BOLL" ||
                        item[0] == "MACD" ||
                        item[0] == "KDJ"
                        ? 2
                        : 1
                    ]
                ] = [];
            }
            switch (item[0]) {
                case "LS":
                    arr[item[2]].push({
                        name: item[0] + "_" + item[1] + "_" + item[3],
                        value: "",
                    });
                    break;
                case "EMA":
                    arr[item[1]].push({
                        name: item[0] + "_" + item[2],
                        value: "",
                    });
                    break;
                case "MA":
                    arr[item[1]].push({
                        name: item[0] + "_" + item[2],
                        value: "",
                    });
                    break;
                case "MACD":
                    arr[item[2]].push({
                        name: item[0] + "_" + item[1],
                        value: "",
                    });
                    break;
                case "KDJ":
                    arr[item[2]].push({
                        name: item[0] + "_" + item[1],
                        value: "",
                    });
                    break;
                case "BOLL":
                    arr[item[2]].push({
                        name: item[0] + "_" + item[1],
                        value: "",
                    });
                    break;
                default:
                    arr[item[1]].push({
                        name: item[0],
                        value: "",
                    });
                    break;
            }
        });
        return arr;
    }

    /**
     * 计算指标入口
     * @param {Array} strategyExpression - 策略表达式数组，包含需要计算的指标
     * @param {string} timeLevel - 时间级别
     */
    calculateIndicators(strategyExpression, timeLevel) {
        try {
            // 获取当前和历史K线数据
            const currentKlines = this.klines.get(timeLevel) || [];
            const historyKlines = this.historyKlines.get(timeLevel) || [];

            // 合并并按时间排序（从旧到新）
            const allKlines = [...historyKlines, ...currentKlines].sort(
                (a, b) => a.timestamp - b.timestamp
            );

            // 如果没有K线数据，直接返回
            if (allKlines.length === 0) {
                console.warn(`${timeLevel} 没有K线数据`);
                return;
            }

            // 计算所有需要的指标
            const indicators = {};
            const maPeriods = [];
            const emaPeriods = [];

            // 遍历策略表达式，预处理需要计算的指标
            strategyExpression.forEach((item) => {
                const { name } = item;
                // 处理历史数据 (LS_类型_序号)
                if (name.startsWith("LS_")) {
                    const [history, type, index] = name.split("_");
                    const position = parseInt(index) - 1;
                    // 获取指定位置的历史数据 拿到的长度是是从一开始的但是数组下标是从0开始的 所以 长度-1 等于最大下标 继续减一 是拿到历史数据最新一条
                    const targetKline = allKlines[allKlines.length - 2 - position];
                    if (targetKline) {
                        switch (type) {
                            case "KP":
                                indicators[name] = targetKline.open;
                                break;
                            case "SP":
                                indicators[name] = targetKline.close;
                                break;
                            case "ZG":
                                indicators[name] = targetKline.high;
                                break;
                            case "ZD":
                                indicators[name] = targetKline.low;
                                break;
                            case "CJ":
                                indicators[name] = targetKline.volume;
                                break;
                        }
                    }
                }
                // 处理当前K线数据
                else if (["KP", "SP", "ZG", "ZD", "CJ"].includes(name)) {
                    const currentKline = allKlines[allKlines.length - 1];
                    if (currentKline) {
                        switch (name) {
                            case "KP":
                                indicators[name] = currentKline.open;
                                break;
                            case "SP":
                                indicators[name] = currentKline.close;
                                break;
                            case "ZG":
                                indicators[name] = currentKline.high;
                                break;
                            case "ZD":
                                indicators[name] = currentKline.low;
                                break;
                            case "CJ":
                                indicators[name] = currentKline.volume;
                                break;
                        }
                    }
                }
                // 处理MA指标
                else if (name.startsWith("MA_")) {
                    const period = parseInt(name.split("_")[1]);
                    if (!isNaN(period)) {
                        maPeriods.push(period);
                    }
                }
                // 处理EMA指标
                else if (name.startsWith("EMA_")) {
                    const period = parseInt(name.split("_")[1]);
                    if (!isNaN(period)) {
                        emaPeriods.push(period);
                    }
                }
            });

            // 计算MA指标（如果需要）
            if (maPeriods.length > 0) {
                const maResults = this.calculateMA(allKlines, maPeriods);
                for (const period of maPeriods) {
                    const maValues = maResults[`ma${period}`];
                    if (maValues && maValues.length > 0) {
                        indicators[`MA_${period}`] = maValues[maValues.length - 1];
                    }
                }
            }

            // 计算EMA指标（如果需要）
            if (emaPeriods.length > 0) {
                const emaResults = this.calculateEMA(allKlines, emaPeriods);
                for (const period of emaPeriods) {
                    const emaValues = emaResults[`ema${period}`];
                    if (emaValues && emaValues.length > 0) {
                        indicators[`EMA_${period}`] = emaValues[emaValues.length - 1];
                    }
                }
            }

            // 检查是否需要计算MACD
            if (strategyExpression.some((item) => item.name.startsWith("MACD_"))) {
                const macdResult = this.calculateMACD(allKlines);
                indicators["MACD_DIF"] = macdResult.dif[macdResult.dif.length - 1];
                indicators["MACD_DEA"] = macdResult.dea[macdResult.dea.length - 1];
                indicators["MACD_MACD"] = macdResult.macd[macdResult.macd.length - 1];
            }

            // 检查是否需要计算KDJ
            if (strategyExpression.some((item) => item.name.startsWith("KDJ_"))) {
                const kdjResult = this.calculateKDJ(allKlines);
                indicators["KDJ_K"] = kdjResult.k[kdjResult.k.length - 1];
                indicators["KDJ_D"] = kdjResult.d[kdjResult.d.length - 1];
                indicators["KDJ_J"] = kdjResult.j[kdjResult.j.length - 1];
            }

            // 检查是否需要计算BOLL
            if (strategyExpression.some((item) => item.name.startsWith("BOLL_"))) {
                const bollResult = this.calculateBOLL(allKlines);
                indicators["BOLL_UP"] = bollResult.upper[bollResult.upper.length - 1];
                indicators["BOLL_MID"] =
                    bollResult.middle[bollResult.middle.length - 1];
                indicators["BOLL_LOW"] = bollResult.lower[bollResult.lower.length - 1];
            }

            // 更新策略表达式中的值
            strategyExpression.forEach((item) => {
                item.value = this.formatNumber(indicators[item.name]);
            });
            this.strategyExpression[timeLevel] = strategyExpression;
            // 发送指标计算结果
            this.postMessage({
                type: "indicators_updated",
                data: {
                    timeLevel,
                    indicators: strategyExpression,
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
     * 计算表达式
     * @param {Object} strategyExpression - 策略表达式对象，包含各个时间级别的指标值
     * @param {string} expression - 原始表达式
     */
    calculateExpression(strategyExpression, expression, tempKlines) {
        // 检查空值
        for (const timeLevel in strategyExpression) {
            for (const item of strategyExpression[timeLevel]) {
                if (item.value === "") {
                    console.log(JSON.stringify(item), "有空值");
                    return false;
                }
            }
        }
        try {
            // 创建时间级别映射表（从 exchange 格式转换为 Name 格式）
            const timeLevelMap = {};
            this.timeLevel.forEach((level) => {
                timeLevelMap[level.exchange] = level.Name;
            });
            // 复制一份表达式用于替换
            let calculatedExpression = expression;

            // 遍历所有时间级别的指标
            Object.entries(strategyExpression).forEach(([timeLevel, indicators]) => {
                // 获取对应的时间级别格式（例如：将 "1m" 转换为 "1F"）
                const formattedTimeLevel = timeLevelMap[timeLevel];
                if (!formattedTimeLevel) return;
                console.log(calculatedExpression);
                // 遍历该时间级别下的所有指标
                indicators.forEach((indicator) => {
                    let searchPattern;
                    if (indicator.name.startsWith("LS_")) {
                        // 处理历史数据指标（例如：LS_CJ_2）
                        const [prefix, type, index] = indicator.name.split("_");
                        searchPattern = `${prefix}_${type}_${formattedTimeLevel}_${index}`;
                    } else if (
                        indicator.name.startsWith("MA_") ||
                        indicator.name.startsWith("EMA_")
                    ) {
                        // 处理 MA 和 EMA 指标（例如：MA_5）
                        const [type, period] = indicator.name.split("_");
                        searchPattern = `${type}_${formattedTimeLevel}_${period}`;
                    } else if (
                        indicator.name.startsWith("MACD_") ||
                        indicator.name.startsWith("KDJ_") ||
                        indicator.name.startsWith("BOLL_")
                    ) {
                        // 处理其他复合指标（例如：MACD_DIF, KDJ_K, BOLL_UP）
                        const [type, subType] = indicator.name.split("_");
                        searchPattern = `${type}_${subType}_${formattedTimeLevel}`;
                    } else {
                        // 处理基础指标（例如：SP, ZG）
                        searchPattern = `${indicator.name}_${formattedTimeLevel}`;
                    }
                    // 在表达式中查找并替换匹配的指标
                    const regex = new RegExp(searchPattern, "g");
                    console.log(searchPattern, regex, indicator.value);
                    console.log(calculatedExpression);
                    calculatedExpression = calculatedExpression.replace(
                        regex,
                        ` ${indicator.value} `
                    );
                    console.log(calculatedExpression);
                });
            });

            // 处理逻辑运算符
            calculatedExpression = calculatedExpression
                .replace(/\band\b/g, "&&") // 将 and 替换为 &&
                .replace(/\bor\b/g, "||") // 将 or 替换为 ||
                .replace(/！=/g, "!=") // 处理全角不等号
                .replace(/＝=/g, "==") // 处理全角等号
                .replace(/！/g, "!") // 处理全角感叹号
                .replace(/（/g, "(") // 处理全角左括号
                .replace(/）/g, ")") // 处理全角右括号
                .replace(/＞=/g, ">=") // 处理全角大于等于
                .replace(/＜=/g, "<=") // 处理全角小于等于
                .replace(/＞/g, ">") // 处理全角大于号
                .replace(/＜/g, "<"); // 处理全角小于号
            calculatedExpression = calculatedExpression.replace(/LS_|_\d+/g, "");
            // 记录转换后的表达式
            //   console.log("原始表达式:", expression);
            //   console.log("转换后的表达式:", calculatedExpression);
            // strategyExpression;
            //   console.log("strategyExpression", strategyExpression);
            // 尝试计算表达式
            try {
                // console.log(calculatedExpression);
                // eslint-disable-next-line no-eval
                const result = eval(calculatedExpression);
                // console.log("表达式计算结果:", result);

                // 发送计算结果
                this.postMessage({
                    type: "expression_result",
                    data: {
                        expression: calculatedExpression,
                        strategy: this.strategy,
                        result: result,
                        tempKlines: tempKlines,
                        timestamp: Date.now(),
                    },
                });

                return result;
            } catch (evalError) {
                console.error("表达式计算错误:", evalError);
                return null;
            }
        } catch (error) {
            this.handleError(error, "表达式计算失败");
            return null;
        }
    }

    /**
     * 格式化数字到指定精度
     * @param {number} value - 要格式化的数值
     * @returns {number} 格式化后的数值
     */
    formatNumber(value) {
        if (typeof value !== "number" || isNaN(value)) return value;
        return Number(value.toFixed(this.priceDecimalPlaces));
        // let num = parseFloat(value);
        // if (typeof num !== "number" || isNaN(num)) return num;
        // // 乘以 10 的 decimalPlaces 次幂
        // let factor = Math.pow(10, this.priceDecimalPlaces);
        // // 向下取整
        // let result = Math.floor(num * factor) / factor;
        // return value;
    }

    /**
     * 计算移动平均线
     * @param {Array} klines - K线数据
     * @param {Array} periods - 计算周期 [5, 10, 20, 30, 60]
     * @returns {Object} MA指标数据
     */
    calculateMA(klines, periods) {
        try {
            //   const periods = [5, 10, 20, 30, 60];
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
                    result[`ma${period}`].push(this.formatNumber(sum / period));
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
     * @param {Array} periods - 计算周期 [5, 10, 20, 30, 60]
     * @returns {Object} EMA指标数据
     */
    calculateEMA(klines, periods) {
        try {
            //   const periods = [5, 10, 20, 30, 60];
            const result = {};

            periods.forEach((period) => {
                result[`ema${period}`] = [];
                const multiplier = 2 / (period + 1);
                const prices = klines.map((k) => k.close);
                // 从第一个数据开始计算
                let ema = [prices[0]]; // 初始EMA值使用第一个价格

                // 从第二个数据开始向后计算
                for (let i = 1; i < prices.length; i++) {
                    const currentPrice = this.formatNumber(prices[i]);
                    const previousEMA = this.formatNumber(ema[ema.length - 1]);
                    const currentEMA = this.formatNumber(
                        (currentPrice - previousEMA) * multiplier + previousEMA
                    );
                    ema.push(currentEMA);
                }

                // 将计算结果存入结果对象
                result[`ema${period}`] = ema;
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

            const prices = klines.map((k) => k.close);

            // 计算快速EMA
            const shortEMA = [prices[0]];
            const shortMultiplier = 2 / (shortPeriod + 1);
            for (let i = 1; i < prices.length; i++) {
                const currentPrice = prices[i];
                const previousEMA = shortEMA[shortEMA.length - 1];
                shortEMA.push(
                    (currentPrice - previousEMA) * shortMultiplier + previousEMA
                );
            }

            // 计算慢速EMA
            const longEMA = [prices[0]];
            const longMultiplier = 2 / (longPeriod + 1);
            for (let i = 1; i < prices.length; i++) {
                const currentPrice = prices[i];
                const previousEMA = longEMA[longEMA.length - 1];
                longEMA.push(
                    (currentPrice - previousEMA) * longMultiplier + previousEMA
                );
            }

            // 计算DIF
            for (let i = 0; i < prices.length; i++) {
                result.dif.push(this.formatNumber(shortEMA[i] - longEMA[i]));
            }

            // 计算DEA (DIF的EMA)
            result.dea = [result.dif[0]];
            const signalMultiplier = 2 / (signalPeriod + 1);
            for (let i = 1; i < result.dif.length; i++) {
                const currentDIF = result.dif[i];
                const previousDEA = result.dea[result.dea.length - 1];
                result.dea.push(
                    this.formatNumber(
                        (currentDIF - previousDEA) * signalMultiplier + previousDEA
                    )
                );
            }

            // 计算MACD
            for (let i = 0; i < prices.length; i++) {
                result.macd.push(this.formatNumber(result.dif[i] - result.dea[i]) * 2);
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
                const rsv = this.formatNumber(
                    ((klines[i].close - lowestLow) / (highestHigh - lowestLow)) * 100
                );

                // 计算KDJ
                const k =
                    i === period - 1
                        ? rsv
                        : this.formatNumber((2 / 3) * result.k[i - 1] + (1 / 3) * rsv);
                const d =
                    i === period - 1
                        ? k
                        : this.formatNumber((2 / 3) * result.d[i - 1] + (1 / 3) * k);
                const j = this.formatNumber(3 * k - 2 * d);

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
                const upper = this.formatNumber(
                    middle + multiplier * standardDeviation
                );
                const lower = this.formatNumber(
                    middle - multiplier * standardDeviation
                );

                result.middle.push(this.formatNumber(middle));
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
                result.volumeMA.push(this.formatNumber(sum / volumePeriod));
            }

            // 计算价格波动范围
            for (let i = 0; i < klines.length; i++) {
                result.priceRange.push(
                    this.formatNumber(klines[i].high - klines[i].low)
                );
            }

            // 计算动量指标（10周期）
            const momentumPeriod = 10;
            for (let i = 0; i < klines.length; i++) {
                if (i < momentumPeriod) {
                    result.momentum.push(null);
                    continue;
                }
                result.momentum.push(
                    this.formatNumber(klines[i].close - klines[i - momentumPeriod].close)
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
