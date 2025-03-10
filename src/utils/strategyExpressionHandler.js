import { CheckableTag } from "ant-design-vue";

/**
 * 策略表达式处理器
 * 用于查询量化交易策略的数据
 */
class StrategyExpressionHandler {

  /**
   * @param {Object} wsStore - WebSocket store，用于获取持仓信息
   * @param {Object} currencyStore - Currency store，用于获取币种信息.
   * @param {Object} postOrderAlgo - 策略订单算法
   */
  constructor(wsStore, currencyStore, postOrderAlgo, logger) {
    console.log("constructor启动");
    this.logger = logger;
    this.wsStore = wsStore; // WebSocket store，用于持仓信息
    this.currencyStore = currencyStore; // Currency store，用于币种信息
    this.postOrderAlgo = postOrderAlgo;
    // 1. 策略条件配置映射
    this.STRATEGY_CONDITIONS = {
      1: [{ name: "strategy1Conditions" }],
      2: [
        {
          name: "strategy2LongConditions",
          posSide: "long",
          positionAction: "open",
        },
        {
          name: "strategy2ShortConditions",
          posSide: "short",
          positionAction: "open",
        },
      ],
      4: [
        {
          name: "strategy4CloseLongConditions",
          posSide: "long",
          positionAction: "close",
        },
        {
          name: "strategy4CloseShortConditions",
          posSide: "short",
          positionAction: "close",
        },
        {
          name: "strategy4OpenShortConditions",
          posSide: "short",
          positionAction: "open",
        },
        {
          name: "strategy4OpenLongConditions",
          posSide: "long",
          positionAction: "open",
        },
      ],
    };
    // 决策处理结果的暂时储存
    this.tempResult = [];
    console.log("constructor结束");
  }

  /**
   * 获取指定币种的仓位信息
   * @param {string} symbol - 币种符号
   * @param {string} posSide -  仓位方向 (long/short)
   * @returns {Object|null} 仓位信息
   */
  getPositionInfo(symbol, posSide) {
    console.log("getPositionInfo启动");
    const position = this.wsStore.positionsData.SWAP?.find(
      (p) => p.instId === symbol && p.posSide === posSide
    );
    console.log("getPositionInfo结束");
    return position;
  }

  /**
   * 获取指定币种信息
   * @param {string} symbol - 币种符号
   * @param {string} type - 币种类型 (SWAP/SPOT)
   * @returns {Object|null} 币种信息
   */
  getCurrencyInfo(symbol, type = "SWAP") {
    console.log("getCurrencyInfo启动");
    const currency = this.currencyStore.currencies[type]?.find(
      (c) => c.instId === symbol
    );
    const result = currency
      ? {
        symbol: currency.instId,
        price: Number(currency.last) || 0,
        volume24h: Number(currency.volCcy24h) || 0,
        fundingRate: Number(currency.fundingRate) || 0,
        high24h: Number(currency.high24h) || 0,
        low24h: Number(currency.low24h) || 0,
        priceChangePercent24h: Number(currency.priceChangePercent24h) || 0,
        lastUpdateTime: currency.ts || Date.now(),
        lotSize: Number(currency.lotSz) || 0,
        minSize: Number(currency.minSz) || 0,
        maxLeverage: Number(currency.lever) || 0,
      }
      : null;
    console.log("getCurrencyInfo结束");
    return result;
  }
  // 临时队列唯一性函数初始化
  queueInitialization(strategy, strategyConditions) {
    console.log("queueInitialization启动");
    this.tempResult[strategy.currency] = {};
    this.tempResult[strategy.currency].state = true;
    // 循环 strategyConditions 数组 创建到this.tempResult[strategy.currency]
    for (let i = 0; i < strategyConditions.length; i++) {
      this.tempResult[strategy.currency][strategyConditions[i].name] = [];
    }
    this.tempResult[strategy.currency]['long'] = {
      stopLossState: 0,
      stopPrice: 0,
    }
    this.tempResult[strategy.currency]['short'] = {
      stopLossState: 0,
      stopPrice: 0,
    }
    this.tempResult[strategy.currency].state = false;
    console.log("queueInitialization结束");
  }
  //处理决策
  async handleDecisionResult(strategy, strategyCalculationResults) {
    // console.log(JSON.stringify(strategyCalculationResults.result));
    // return; 
    console.log("handleDecisionResult启动");
    // 区分单独策略还是双策略 还是四策略
    const strategyType = strategy.strategyMode;
    const strategyConditions = this.STRATEGY_CONDITIONS[strategyType];
    //  首次进入初始化内存栈
    if (this.tempResult[strategy.currency] === undefined) {
      // 初始化内存栈
      console.log("handleDecisionResult函数启动queueInitialization函数");
      this.queueInitialization(strategy, strategyConditions);
      console.log("handleDecisionResult函数结束queueInitialization函数");
    }

    // 获取临时数组
    if (this.tempResult[strategy.currency].state === false) {
      this.tempResult[strategy.currency].state = true;
      this.tempResult[strategy.currency][strategyCalculationResults.name].push(strategyCalculationResults.result);
      //[strategyCalculationResults.name] 数组数量要大于三 不然就不往下执行
      if (this.tempResult[strategy.currency][strategyCalculationResults.name].length < strategy.thresholdCount) {
        this.tempResult[strategy.currency].state = false;
        console.log("handleDecisionResult结束");
        return;
      }
      const allTrue = this.tempResult[strategy.currency][strategyCalculationResults.name].slice(-strategy.thresholdCount).every(value => value === true);
      const allFalse = this.tempResult[strategy.currency][strategyCalculationResults.name].slice(-strategy.thresholdCount).every(value => value === false);
      const strategyConditionsItem = strategyConditions.find(item => item.name === strategyCalculationResults.name);
      // 根据strategyType 处理 策略
      switch (strategyType) {
        case "1":
          if (allTrue == true || allFalse == true) {
            console.log("handleDecisionResult函数启动singleStrategyProcessing函数");
            await this.singleStrategyProcessing(strategyCalculationResults);
            console.log("handleDecisionResult函数结束singleStrategyProcessing函数");
          }
          break;
        case "2":
          // 双策略 当三个连续结果都为true时 进行处理
          if (allTrue == true) {
            console.log("handleDecisionResult函数启动doubleStrategyProcessing函数");
            await this.doubleStrategyProcessing(strategyCalculationResults, strategyConditionsItem);
            console.log("handleDecisionResult函数结束doubleStrategyProcessing函数");
          }
          break;
        case "4":
          // 四策略 当三个连续结果都为true时 进行处理 或者是平仓的时候 进行处理
          if (allTrue == true || strategyConditionsItem.positionAction == "close") {
            console.log("handleDecisionResult函数启动fourStrategyProcessing函数");
            await this.fourStrategyProcessing(strategyCalculationResults, strategyConditionsItem);
            console.log("handleDecisionResult函数结束fourStrategyProcessing函数");
          }
          break;
      }
      this.tempResult[strategy.currency].state = false;
    }
    console.log("handleDecisionResult结束");
  }
  // strategyCalculationResults={"expression":{ "1m": [{ "name": "ZG", "value": 2.6674 }]}, "name": "strategy2ShortConditions","result": true,  "tempKlines": [{ "timestamp": 1741254300000, "open": 2.6759, "high": 2.6796, "low": 2.6645, "close": 2.6666, "volume": 142310, "volCcy": 142310, "confirm": false }], "strategy": { "id": "strategy_1741247505593", "name": "测试12312312", "description": "21312321", "currency": "SUI-USDT-SWAP", "quantity": 1, "leverage": 1, "positionType": "cross", "stopLoss": 0.05, "strategyMode": "2", "priceDecimalPlaces": 4, "strategy2LongConditions": "((ZG_1F - KDJ_K_1F + KDJ_K_1F + KDJ_D_3F - KDJ_J_3F - MA_3F_5 - LS_CJ_3F_2 - LS_CJ_5F_2 - LS_SP_5F_1 * EMA_5F_5) > 1 and (+ CJ_15F + MA_15F_5 + EMA_15F_5 + MACD_MACD_15F + KDJ_K_15F) < 1) or (ZG_1F - KDJ_K_1F + KDJ_K_1F + KDJ_D_3F - KDJ_J_3F - MA_3F_5 - LS_CJ_3F_2 - LS_CJ_5F_2 - LS_SP_5F_1 * EMA_5F_5) > 10", "strategy2ShortConditions": "(+ CJ_15F + MA_15F_5 + EMA_15F_5 + MACD_MACD_15F + KDJ_K_15F) != 1" }, "timestamp": 1741254623524 }
  // strategyConditionsItem={"name":"strategy2ShortConditions","posSide":"short","positionAction":"open"}
  // 处理单策略
  async singleStrategyProcessing(strategyCalculationResults) {
    console.log("singleStrategyProcessing启动");
    // 为true是空仓 为false是空仓 
    const strategyInformation = strategyCalculationResults.strategy;
    // 检查仓位 
    const posSide = strategyCalculationResults.result == true ? "long" : "short"

    console.log("singleStrategyProcessing函数启动getPositionInfo函数");
    const currentPosition = this.getPositionInfo(strategyInformation.currency, posSide)
    console.log("singleStrategyProcessing函数结束getPositionInfo函数");

    // 相反仓位
    console.log("singleStrategyProcessing函数启动getPositionInfo函数");
    const oppositePosition = this.getPositionInfo(strategyInformation.currency, posSide == "long" ? "short" : "long")
    console.log("singleStrategyProcessing函数结束getPositionInfo函数");

    // 清理相反仓位
    if (oppositePosition) {
      this.logWithStrategy(strategyInformation, 'info',
        `触发平仓条件: 关闭${oppositePosition.posSide === 'long' ? '多' : '空'}头仓位`);
      // 平仓
      console.log("singleStrategyProcessing函数启动closingPositionAndPlacingOrder函数");
      await this.closingPositionAndPlacingOrder(strategyInformation, posSide)
    }
    if (currentPosition == null) {
      // 没有仓位 开仓不存在${strategyConditionsItem.posSide}仓位 进行开仓 
      this.logWithStrategy(strategyInformation, 'info',
        `触发开仓条件: 开${posSide === 'long' ? '多' : '空'}头仓位`);
      // 开仓
      console.log("singleStrategyProcessing函数启动openWarehouseAndPlaceOrder函数");
      await this.openWarehouseAndPlaceOrder(strategyInformation, posSide)
    } else {
      //存在仓位 进行阈值委托
      console.log("singleStrategyProcessing函数启动thresholdCalculation函数");
      await this.thresholdCalculation(strategyInformation, posSide, strategyCalculationResults.tempKlines, currentPosition)
    }
    console.log("singleStrategyProcessing结束");
  }
  // 处理双策略
  async doubleStrategyProcessing(strategyCalculationResults, strategyConditionsItem) {
    console.log("doubleStrategyProcessing启动");
    // 策略
    const strategyInformation = strategyCalculationResults.strategy;
    // 仓位
    console.log("doubleStrategyProcessing函数启动getPositionInfo函数");
    const currentPosition = this.getPositionInfo(strategyInformation.currency, strategyConditionsItem.posSide)
    console.log("doubleStrategyProcessing函数结束getPositionInfo函数");
    // 判断当前仓位是否为空
    if (currentPosition == null) {
      // 没有仓位 开仓不存在${strategyConditionsItem.posSide}仓位 进行开仓
      this.logWithStrategy(strategyInformation, 'info',
        `触发${strategyConditionsItem.positionAction === 'open' ? '开' : '平'}${strategyConditionsItem.posSide === 'long' ? '多' : '空'}条件`);
      // 开仓
      console.log("doubleStrategyProcessing函数启动openWarehouseAndPlaceOrder函数");
      await this.openWarehouseAndPlaceOrder(strategyInformation, strategyConditionsItem.posSide)
    } else {
      // 有仓位 开仓存在${strategyConditionsItem.posSide}仓位 进行平仓
      // console.log("阈值比例or止损比例", strategyInformation.threshold, strategyInformation.stopLoss);
      console.log("doubleStrategyProcessing函数启动thresholdCalculation函数");
      await this.thresholdCalculation(strategyInformation, strategyConditionsItem.posSide, strategyCalculationResults.tempKlines, currentPosition)
    }
    console.log("doubleStrategyProcessing结束");
  }
  // 处理四策略
  async fourStrategyProcessing(strategyCalculationResults, strategyConditionsItem) {
    console.log("fourStrategyProcessing启动");
    // 策略
    const strategyInformation = strategyCalculationResults.strategy;
    // 仓位
    console.log("fourStrategyProcessing函数启动getPositionInfo函数");
    const currentPosition = this.getPositionInfo(strategyInformation.currency, strategyConditionsItem.posSide)
    console.log("fourStrategyProcessing函数结束getPositionInfo函数");
    // 判断当前仓位是否为空
    if (strategyConditionsItem.positionAction === "close" && currentPosition) {
      // 有仓位且是平仓条件 进行平仓
      this.logWithStrategy(strategyInformation, 'info',
        `触发平仓条件: 关闭${strategyConditionsItem.posSide === 'long' ? '多' : '空'}头仓位`);
      // 平仓
      console.log("fourStrategyProcessing函数启动closingPositionAndPlacingOrder函数");
      await this.closingPositionAndPlacingOrder(strategyInformation, strategyConditionsItem.posSide)
    } else if (strategyConditionsItem.positionAction === "open" && !currentPosition) {
      // 没有仓位 开仓条件 进行开仓
      this.logWithStrategy(strategyInformation, 'info',
        `触发开仓条件: 开${strategyConditionsItem.posSide === 'long' ? '多' : '空'}头仓位`);
      // 开仓
      console.log("fourStrategyProcessing函数启动openWarehouseAndPlaceOrder函数");
      await this.openWarehouseAndPlaceOrder(strategyInformation, strategyConditionsItem.posSide)
    } else if (strategyConditionsItem.positionAction === "open" && currentPosition) {
      // 有仓位 开仓条件 进行挂阈值委托
      console.log("fourStrategyProcessing函数启动thresholdCalculation函数");
      await this.thresholdCalculation(strategyInformation, strategyConditionsItem.posSide, strategyCalculationResults.tempKlines, currentPosition)
    }
    console.log("fourStrategyProcessing结束");
  }
  /**
 * 计算阈值比例
 * @param {Object} strategyInformation - 策略信息对象，包含币种、数量、价格精度等信息
 * @param {string} posSide - 仓位方向，'long' 或'short' 
 * @param {object} tempKlines - 临时K线数据
 * @param {Object} position - 当前仓位信息
 * 
 */
  async thresholdCalculation(strategyInformation, posSide, Klines, position) {
    console.log("thresholdCalculation启动");
    if (Klines.length == 0) {
      console.log("thresholdCalculation结束");
      return;
    }
    const tempKlines = Klines[0];

    const priceDecimalPlaces = strategyInformation.priceDecimalPlaces
    const stopLoss = strategyInformation.stopLoss
    const threshold = strategyInformation.threshold
    const currency = strategyInformation.currency

    // tempklines ={timestamp: 1741317480000, open: 2.6907, high: 2.6927, low: 2.6888, close: 2.6888,volCcy: 13923 , volume: 13923}
    const stopLossPrice = posSide === 'long' ?
      (tempKlines.close * (1 - stopLoss)).toFixed(priceDecimalPlaces)
      : (tempKlines.close * (1 + stopLoss)).toFixed(priceDecimalPlaces)
    // 检查是否存在通过阈值挂的止损单
    if (this.tempResult[currency][posSide].stopLossState == 0) {
      // 不存在
      // 计算移动止损价格阈值
      let profitLossPrice = posSide === 'long' ?
        (position.avgPx * (1 + threshold)).toFixed(priceDecimalPlaces)
        : (position.avgPx * (1 - threshold)).toFixed(priceDecimalPlaces)
      // 检查当前价格是否高于或低于移动止损价格阈值
      if ((posSide === 'long' && tempKlines.close >= profitLossPrice) || (posSide === 'short' && tempKlines.close <= profitLossPrice)) {
        // 触发移动止损
        console.log("thresholdCalculation函数启动placeStopLossOrder函数");
        let stopResults = await this.placeStopLossOrder({
          instId: currency,
          posSide: posSide,
          marginMode: 'cross',
          size: strategyInformation.quantity,
          stopLossPrice: stopLossPrice
        });
        console.log("thresholdCalculation函数结束placeStopLossOrder函数");
        if (stopResults.code === "0") {
          // 成功
          // 记录止损单ID
          this.tempResult[currency][posSide].stopLossState = 1
          // 记录止损单价格
          this.tempResult[currency][posSide].stopPrice = tempKlines.close
          this.logWithStrategy(strategyInformation, 'info',
            `更新移动阈值止损价格`);
        } else {
          // 失败
          this.logWithStrategy(strategyInformation, 'warning',
            `错误：移动阈值止损下单失败`);
        }
      }
    } else {
      // 存在
      const stopPrice = this.tempResult[currency][posSide].stopPrice
      let profitLossPrice = posSide === 'long' ?
        (stopPrice * (1 + threshold)).toFixed(priceDecimalPlaces)
        : (stopPrice * (1 - threshold)).toFixed(priceDecimalPlaces)
      if ((posSide === 'long' && tempKlines.close >= profitLossPrice) || (posSide === 'short' && tempKlines.close <= profitLossPrice)) {
        console.log("thresholdCalculation函数启动placeStopLossOrder函数");
        const stopResults = await this.placeStopLossOrder({
          instId: currency,
          posSide: posSide,
          marginMode: 'cross',
          size: strategyInformation.quantity,
          stopLossPrice: stopLossPrice
        })
        console.log("thresholdCalculation函数结束placeStopLossOrder函数");
        if (stopResults.code === "0") {
          // 记录止损单价格
          this.tempResult[currency][posSide].stopPrice = tempKlines.close
          this.logWithStrategy(strategyInformation, 'info',
            `更新移动阈值止损价格`);
        } else {
          // 失败
          this.logWithStrategy(strategyInformation, 'warning',
            `错误：移动阈值止损下单失败`);
        }
      }
    }
    console.log("thresholdCalculation结束");
  }

  // 开仓下单专属仓位函数
  // @param strategyInformation - 策略信息对象，包含币种、数量、价格精度等信息
  // @param posSide - 仓位方向，'long' 或 'short'
  async openWarehouseAndPlaceOrder(strategyInformation, posSide) {
    console.log("openWarehouseAndPlaceOrder启动");
    // 防止重复开仓
    console.log("openWarehouseAndPlaceOrder函数启动getPositionInfo函数");
    if (this.getPositionInfo(strategyInformation.currency, posSide)) {
      console.log("openWarehouseAndPlaceOrder函数结束getPositionInfo函数");
      this.logWithStrategy(strategyInformation, 'warning',
        `错误：已存在相同方向的仓位，请先平仓再进行操作`);
      console.log("openWarehouseAndPlaceOrder结束");
      return
    }
    console.log("openWarehouseAndPlaceOrder函数结束getPositionInfo函数");

    // 1. 根据策略结果开仓（多/空），使用市价单
    console.log("openWarehouseAndPlaceOrder函数启动placeMarketOrder函数");
    let orderResult = await this.placeMarketOrder(
      strategyInformation.currency,  // 交易币种
      'open',                        // 开仓操作
      posSide,// 根据结果决定做多还是做空
      'cross',                       // 全仓模式
      strategyInformation.quantity   // 下单数量
    )
    console.log("openWarehouseAndPlaceOrder函数结束placeMarketOrder函数");

    if (orderResult) {
      // 2. 循环查询持仓信息，等待持仓到位（最多等待3秒）
      console.log("openWarehouseAndPlaceOrder函数启动loopSearchPosition函数");
      const position = await this.loopSearchPosition(
        strategyInformation.currency,
        posSide,
        3000
      );
      console.log("openWarehouseAndPlaceOrder函数结束loopSearchPosition函数");

      // 3. 计算止损价格
      // 多仓：持仓均价 * (1 - 止损比例)
      // 空仓：持仓均价 * (1 + 止损比例)
      const stopLossPrice = posSide == 'long' ?
        (position.avgPx * (1 - strategyInformation.stopLoss)).toFixed(strategyInformation.priceDecimalPlaces)
        : (position.avgPx * (1 + strategyInformation.stopLoss)).toFixed(strategyInformation.priceDecimalPlaces)
      // 4. 设置止损单
      console.log("openWarehouseAndPlaceOrder函数启动placeStopLossOrder函数");
      const stopLossResult = await this.placeStopLossOrder({
        instId: strategyInformation.currency,      // 交易币种
        posSide: posSide,  // 持仓方向
        marginMode: 'cross',                       // 全仓模式
        size: strategyInformation.quantity,        // 止损数量
        stopLossPrice: stopLossPrice              // 止损价格
      })
      console.log("openWarehouseAndPlaceOrder函数结束placeStopLossOrder函数");
      if (!stopLossResult) {
        this.logWithStrategy(strategyInformation, 'warning',
          `错误：设置初始仓位止损单失败`);
      } else {
        this.logWithStrategy(strategyInformation, 'info',
          `设置初始仓位止损单成功`);
      }
    } else {
      this.logWithStrategy(strategyInformation, 'warning',
        `错误：下单失败`);
    }
    console.log("openWarehouseAndPlaceOrder结束");
  }
  // 平仓下单专属仓位函数
  // @param strategyInformation - 策略信息对象，包含币种、数量、价格精度等信息
  // @param posSide - 仓位方向，'long' 或 'short'
  async closingPositionAndPlacingOrder(strategyInformation, posSide) {
    console.log("closingPositionAndPlacingOrder启动");
    // 检查是否存在仓位
    console.log("closingPositionAndPlacingOrder函数启动getPositionInfo函数");
    const position = this.getPositionInfo(strategyInformation.currency, posSide)
    console.log("closingPositionAndPlacingOrder函数结束getPositionInfo函数");
    if (!position) {
      this.logWithStrategy(strategyInformation, 'warning',
        `错误：不存在${posSide === 'long' ? '多' : '空'}头仓位，无法平仓`);
      console.log("closingPositionAndPlacingOrder结束");
      return
    }

    // 1. 执行市价平仓
    console.log("closingPositionAndPlacingOrder函数启动placeMarketOrder函数");
    let orderResult = await this.placeMarketOrder(
      strategyInformation.currency,  // 交易币种
      'close',                       // 平仓操作
      posSide,                       // 仓位方向
      'cross',                       // 全仓模式
      strategyInformation.quantity   // 平仓数量
    )
    console.log("closingPositionAndPlacingOrder函数结束placeMarketOrder函数");

    // 2. 处理下单结果
    if (orderResult) {
      this.logWithStrategy(strategyInformation, 'info',
        `开始执行${posSide === 'long' ? '多' : '空'}头平仓操作`);
      this.logWithStrategy(strategyInformation, 'success',
        `${posSide === 'long' ? '多' : '空'}头仓位平仓成功`);
      // 清除该币种该方向的临时数据
      if (this.tempResult[strategyInformation.currency] &&
        this.tempResult[strategyInformation.currency][posSide]) {
        this.tempResult[strategyInformation.currency][posSide] = {
          stopLossState: 0,
          stopPrice: 0,
        }
      }
    } else {
      this.logWithStrategy(strategyInformation, 'warning',
        `错误：${posSide === 'long' ? '多' : '空'}头仓位平仓失败`);
    }
    console.log("closingPositionAndPlacingOrder结束");
  }
  /**
 * 市价下单函数
 * @param {string} instId 币种ID，如 'BTC-USDT-SWAP'
 * @param {string} positionAction 'open'-开仓 'close'-平仓
 * @param {string} posSide 'long'-多单 'short'-空单
 * @param {string} marginMode 'cross'-全仓 'isolated'-逐仓
 * @param {number} size 下单数量
 * @returns {Promise<boolean>} 下单结果，true-成功 false-失败
 */
  async placeMarketOrder(instId, positionAction, posSide, marginMode, size) {
    console.log("placeMarketOrder启动");
    try {
      // 1. 参数校验
      if (!instId || !positionAction || !posSide || !marginMode || !size) {
        throw new Error('参数不完整')
      }

      // 2. 获取币种信息
      const currentCurrency = this.currencyStore.getCurrencyByName('SWAP', instId)
      if (!currentCurrency) {
        throw new Error('未找到币种信息')
      }

      // 3. 检查数量精度
      const minSz = parseFloat(currentCurrency.minSz) // 最小下单数量
      if (size < minSz) {
        throw new Error(`下单数量不能小于 ${minSz} 张`)
      }

      // 4. 确定买卖方向
      let side = positionAction === 'open' ? 'buy' : 'sell'
      // 如果是空单，买卖方向需要反转
      if (posSide === 'short') {
        side = side === 'buy' ? 'sell' : 'buy'
      }

      // 5. 构建订单参数
      const orderParams = {
        instId: instId, // 币种ID
        tdMode: marginMode, // 保证金模式
        side: side, // 买卖方向
        posSide: posSide, // 持仓方向
        ordType: 'market', // 订单类型
        sz: String(size), // 下单数量
        reduceOnly: positionAction === 'close' // 平仓时设置为只减仓
      }

      // 6. 发送订单
      console.log("placeMarketOrder函数启动placeOrder函数");
      const response = await this.wsStore.placeOrder(orderParams)
      console.log("placeMarketOrder函数结束placeOrder函数");
      console.log('下单响应:', response)

      // 7. 处理响应
      if (response.code == '0' && response.data[0]?.sCode == '0') {
        console.log("placeMarketOrder结束");
        return true
      } else {
        throw new Error(response.msg || '下单失败')
      }
    } catch (error) {
      console.error('下单失败:', error)
      console.log("placeMarketOrder结束");
      return false
    }
  }
  // 循环查找仓位 
  // @param instId - 交易币种
  // @param posSide - 仓位方向，'long' 或'short'
  // @param timeoutPeriod - 超时时间（毫秒）
  async loopSearchPosition(instId, posSide, timeoutPeriod) {
    console.log("loopSearchPosition启动");
    try {
      // 设定超时时间 
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject();
        }, timeoutPeriod);
      });

      // 循环查找仓位的 Promise
      const searchPromise = new Promise(async (resolve) => {
        while (true) {
          try {
            console.log("loopSearchPosition函数启动getPositionInfo函数");
            const position = this.getPositionInfo(instId, posSide)
            console.log("loopSearchPosition函数结束getPositionInfo函数");
            if (position) {
              resolve(position);
              break;
            }
            await new Promise(resolves => setTimeout(resolves, 100));
          } catch (error) {
            console.error('Error while checking position:', error);
            break;
          }
        }
      });

      // 使用 Promise.race 来处理超时
      const result = await Promise.race([searchPromise, timeoutPromise]);
      console.log("loopSearchPosition结束");
      return result;
    } catch (error) {
      // console.error('Unexpected error:', error);
      console.log("loopSearchPosition结束");
      return false;
    }
  };
  /**
 * 下止损单函数
 * @param {Object} params 止损单参数
 * @param {string} params.instId 币种ID，如 'BTC-USDT-SWAP'
 * @param {string} params.posSide 持仓方向 'long'-多单 'short'-空单
 * @param {string} params.marginMode 保证金模式 'cross'-全仓 'isolated'-逐仓
 * @param {number} params.size 下单数量
 * @param {number} params.stopLossPrice 止损价格
 * @returns {Promise<boolean>} 下单结果， 失败返回false 成功返回response
 */
  async placeStopLossOrder(params) {
    console.log("placeStopLossOrder启动");
    try {
      // 1. 参数校验
      const { instId, posSide, marginMode, size, stopLossPrice } = params
      if (!instId || !posSide || !marginMode || !size || !stopLossPrice) {
        throw new Error('参数不完整')
      }

      // 2. 获取币种信息
      const currentCurrency = this.currencyStore.getCurrencyByName('SWAP', instId)
      if (!currentCurrency) {
        throw new Error('未找到币种信息')
      }

      // 3. 检查数量精度
      const minSz = parseFloat(currentCurrency.minSz) // 最小下单数量
      if (size < minSz) {
        throw new Error(`下单数量不能小于 ${minSz} 张`)
      }

      // 4. 确定买卖方向
      // 多单止损 -> 触发价格 <= 设定价格时 卖出平多
      // 空单止损 -> 触发价格 >= 设定价格时 买入平空
      const side = posSide === 'long' ? 'sell' : 'buy'

      // 5. 构建止损单参数
      const algoParams = {
        instId: instId,
        tdMode: marginMode,
        side: side,
        posSide: posSide,
        ordType: 'conditional',
        sz: String(size),
        tpTriggerPx: '', // 止盈触发价，空字符串代表不设置止盈
        tpOrdPx: '', // 止盈委托价，空字符串代表不设置止盈
        slTriggerPx: String(stopLossPrice), // 止损触发价
        slOrdPx: '-1', // 止损委托价，-1代表市价
        reduceOnly: true // 只减仓
      }

      // 6. 发送止损单
      // console.log('发送止损单:', algoParams)
      console.log("placeStopLossOrder函数启动postOrderAlgo函数");
      const response = await this.postOrderAlgo(algoParams)
      console.log("placeStopLossOrder函数结束postOrderAlgo函数");
      console.log('止损单响应:', response)

      // 7. 处理响应
      if (response.code === '0' && response.data[0]?.sCode === '0') {
        console.log("placeStopLossOrder结束");
        return response
      } else {
        console.log("placeStopLossOrder结束");
        return false
      }
    } catch (error) {
      // 添加错误日志
      console.error('下止损单失败:', error)
      console.log("placeStopLossOrder结束");
      return false
    }
  }
  /**
  * 结束决策处理
  * @param {Object} strategy 策略信息
  */
  endDecisionProcessing(strategy) {
    console.log("endDecisionProcessing启动");
    delete this.tempResult[strategy.currency]
    console.log("endDecisionProcessing结束");
  }

  // 记录日志的辅助方法
  logWithStrategy(strategyInfo, type, content) {
    if (this.logger) {
      this.logger({
        time: new Date(),
        type,
        content,
        strategyId: strategyInfo.id
      });
    }
  }
}

export default StrategyExpressionHandler;
