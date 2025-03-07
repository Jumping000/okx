
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
  }

  /**
   * 获取指定币种的仓位信息
   * @param {string} symbol - 币种符号
   * @param {string} posSide -  仓位方向 (long/short)
   * @returns {Object|null} 仓位信息
   */
  getPositionInfo(symbol, posSide) {
    const position = this.wsStore.positionsData.SWAP?.find(
      (p) => p.instId === symbol && p.posSide === posSide
    );
    return position;
  }

  /**
   * 获取指定币种信息
   * @param {string} symbol - 币种符号
   * @param {string} type - 币种类型 (SWAP/SPOT)
   * @returns {Object|null} 币种信息
   */
  getCurrencyInfo(symbol, type = "SWAP") {
    const currency = this.currencyStore.currencies[type]?.find(
      (c) => c.instId === symbol
    );
    return currency
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
  }
  // 临时队列唯一性函数初始化
  queueInitialization(strategy, strategyConditions) {
    this.tempResult[strategy.currency] = {};
    this.tempResult[strategy.currency].state = true;
    // 循环 strategyConditions 数组 创建到this.tempResult[strategy.currency]
    for (let i = 0; i < strategyConditions.length; i++) {
      this.tempResult[strategy.currency][strategyConditions[i].name] = [];
    }
    this.tempResult[strategy.currency].state = false;
  }
  //处理决策
  handleDecisionResult(strategy, strategyCalculationResults) {
    // 区分单独策略还是双策略 还是四策略
    const strategyType = strategy.strategyMode;
    const strategyConditions = this.STRATEGY_CONDITIONS[strategyType];
    //  首次进入初始化内存栈
    if (this.tempResult[strategy.currency] === undefined) {
      // 初始化内存栈
      this.queueInitialization(strategy, strategyConditions);
    }
    // 获取临时数组
    if (this.tempResult[strategy.currency].state === false) {
      this.tempResult[strategy.currency].state = true;
      this.tempResult[strategy.currency][strategyCalculationResults.name].push(strategyCalculationResults.result);
      //[strategyCalculationResults.name] 数组数量要大于三 不然就不往下执行
      if (this.tempResult[strategy.currency][strategyCalculationResults.name].length < 3) {
        this.tempResult[strategy.currency].state = false;
        return;
      }
      const allTrue = this.tempResult[strategy.currency][strategyCalculationResults.name].slice(-3).every(value => value === true);
      // const allFalse = this.tempResult[strategy.currency][strategyCalculationResults.name].slice(-3).every(value => value === false);
      const strategyConditionsItem = strategyConditions.find(item => item.name === strategyCalculationResults.name);
      // 根据strategyType 处理 策略
      switch (strategyType) {
        case "1":
          // 如果是1 策略 直接进行处理 因为单策略不论结果如何都会执行
          this.singleStrategyProcessing(strategyCalculationResults);
          break;
        case "2":
          // 双策略 当三个连续结果都为true时 进行处理
          if (allTrue == true) {
            this.doubleStrategyProcessing(strategyCalculationResults, strategyConditionsItem);
          }
          break;
        case "4":
          // 四策略 当三个连续结果都为true时 进行处理
          if (allTrue == true) {
            this.fourStrategyProcessing(strategyCalculationResults, strategyConditionsItem);
          }
          break;
      }
      this.tempResult[strategy.currency].state = false;
    }
  }
  // strategyCalculationResults={   "expression":{ "1m": [{ "name": "ZG", "value": 2.6674 }]}, "name": "strategy2ShortConditions","result": true,  "tempKlines": [{ "timestamp": 1741254300000, "open": 2.6759, "high": 2.6796, "low": 2.6645, "close": 2.6666, "volume": 142310, "volCcy": 142310, "confirm": false }], "strategy": { "id": "strategy_1741247505593", "name": "测试12312312", "description": "21312321", "currency": "SUI-USDT-SWAP", "quantity": 1, "leverage": 1, "positionType": "cross", "stopLoss": 0.05, "strategyMode": "2", "priceDecimalPlaces": 4, "strategy2LongConditions": "((ZG_1F - KDJ_K_1F + KDJ_K_1F + KDJ_D_3F - KDJ_J_3F - MA_3F_5 - LS_CJ_3F_2 - LS_CJ_5F_2 - LS_SP_5F_1 * EMA_5F_5) > 1 and (+ CJ_15F + MA_15F_5 + EMA_15F_5 + MACD_MACD_15F + KDJ_K_15F) < 1) or (ZG_1F - KDJ_K_1F + KDJ_K_1F + KDJ_D_3F - KDJ_J_3F - MA_3F_5 - LS_CJ_3F_2 - LS_CJ_5F_2 - LS_SP_5F_1 * EMA_5F_5) > 10", "strategy2ShortConditions": "(+ CJ_15F + MA_15F_5 + EMA_15F_5 + MACD_MACD_15F + KDJ_K_15F) != 1" }, "timestamp": 1741254623524 }
  // strategyConditionsItem={"name":"strategy2ShortConditions","posSide":"short","positionAction":"open"}
  // 处理单策略
  singleStrategyProcessing(strategyCalculationResults) {
    // 为true是空仓 为false是空仓 
    const strategyInformation = strategyCalculationResults.strategy;

  }
  // 处理双策略
  doubleStrategyProcessing(strategyCalculationResults, strategyConditionsItem) {
    // 策略
    const strategyInformation = strategyCalculationResults.strategy;
    console.log('strategyInformation',strategyInformation);
    // 仓位
    const currentPosition = this.getPositionInfo(strategyCalculationResults.strategy.currency, strategyConditionsItem.posSide)
    // 判断当前仓位是否为空
    if (currentPosition == null) {
      // 没有仓位 开仓不存在${strategyConditionsItem.posSide}仓位 进行开仓
      this.logger({
  time: new Date(),
  type: 'info',
  content: `触发开仓条件: 建立${strategyConditionsItem.posSide === 'long' ? '多' : '空'}头仓位`
});
      // 开仓
      this.orderExclusiveStorageSpace(strategyInformation, strategyConditionsItem.posSide)
    } else {
      // 有仓位 开仓存在${strategyConditionsItem.posSide}仓位 进行平仓
    }
  }
  // 处理四策略
  fourStrategyProcessing(strategyCalculationResults, strategyConditionsItem) {

  }


  // 下单专属仓位函数
  // @param strategyInformation - 策略信息对象，包含币种、数量、价格精度等信息
  // @param posSide - 仓位方向，'long' 或 'short'
  async orderExclusiveStorageSpace(strategyInformation, posSide) {
    // 防止重复开仓
    if (this.getPositionInfo(strategyInformation.currency, posSide)) {
      this.logger({
  time: new Date(),
  type: 'warning',
  content: '当前已有仓位，取消开仓操作'
})
      return
    }
    // 1. 根据策略结果开仓（多/空），使用市价单
    let orderResult = await this.placeMarketOrder(
      strategyInformation.currency,  // 交易币种
      'open',                        // 开仓操作
      posSide,// 根据结果决定做多还是做空
      'cross',                       // 全仓模式
      strategyInformation.quantity   // 下单数量
    )
    if (orderResult) {
      // 2. 循环查询持仓信息，等待持仓到位（最多等待3秒）
      const position = await this.loopSearchPosition(
        strategyInformation.currency,
        posSide,
        3000
      );

      // 3. 计算止损价格
      // 多仓：持仓均价 * (1 - 止损比例)
      // 空仓：持仓均价 * (1 + 止损比例)
      const stopLossPrice = posSide == 'long' ?
        (position.avgPx * (1 - strategyInformation.stopLoss)).toFixed(strategyInformation.priceDecimalPlaces)
        : (position.avgPx * (1 + strategyInformation.stopLoss)).toFixed(strategyInformation.priceDecimalPlaces)
      // 4. 设置止损单
      const stopLossResult=await this.placeStopLossOrder({
        instId: strategyInformation.currency,      // 交易币种
        posSide: posSide,  // 持仓方向
        marginMode: 'cross',                       // 全仓模式
        size: strategyInformation.quantity,        // 止损数量
        stopLossPrice: stopLossPrice              // 止损价格
      })
      if (!stopLossResult) {
        console.log('止损单设置失败')
      }
    } else {
      console.log('下单失败')
    }
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
      const response = await this.wsStore.placeOrder(orderParams)
      console.log('下单响应:', response)

      // 7. 处理响应
      if (response.code == '0' && response.data[0]?.sCode == '0') {
        return true
      } else {
        throw new Error(response.msg || '下单失败')
      }
    } catch (error) {
      console.error('下单失败:', error)
      return false
    }
  }
  // 循环查找仓位 
  // @param instId - 交易币种
  // @param posSide - 仓位方向，'long' 或'short'
  // @param timeoutPeriod - 超时时间（毫秒）
  async loopSearchPosition(instId, posSide, timeoutPeriod) {
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
            const position = this.getPositionInfo(instId, posSide)
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
      return await Promise.race([searchPromise, timeoutPromise]);
    } catch (error) {
      // console.error('Unexpected error:', error);
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
      const response = await this.postOrderAlgo(algoParams)
      // console.log('止损单响应:', response)

      // 7. 处理响应
      if (response.code === '0' && response.data[0]?.sCode === '0') {
        return response
      } else {
        return false
      }
    } catch (error) {
      // 添加错误日志
      console.error('下止损单失败:', error)
      return false
    }
  }
}

export default StrategyExpressionHandler;
