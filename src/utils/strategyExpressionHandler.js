/**
 * 策略表达式处理器
 * 用于查询量化交易策略的数据
 */
class StrategyExpressionHandler {
  /**
   * @param {Object} wsStore - WebSocket store，用于获取持仓信息
   * @param {Object} currencyStore - Currency store，用于获取币种信息
   */
  constructor(wsStore, currencyStore) {
    this.wsStore = wsStore; // WebSocket store，用于持仓信息
    this.currencyStore = currencyStore; // Currency store，用于币种信息
    // 1. 策略条件配置映射
    this.STRATEGY_CONDITIONS = {
      1: [{ name: "strategy1Conditions" }],
      2: [{ name: "strategy2LongConditions", posSide: "long" ,positionAction: "open"},
        { name: "strategy2ShortConditions", posSide: "short" ,positionAction: "open"}],
      4: [{ name: "strategy4CloseLongConditions", posSide: "long" ,positionAction: "close"},
        { name: "strategy4CloseShortConditions", posSide: "short" ,positionAction: "close"},
        { name: "strategy4OpenShortConditions", posSide: "short" ,positionAction: "open"},
        { name: "strategy4OpenLongConditions", posSide: "long" ,positionAction: "open"}],
    };
  }

  /**
   * 获取指定币种的仓位信息
   * @param {string} symbol - 币种符号
   * @returns {Object|null} 仓位信息
   */
  getPositionInfo(symbol) {
    const position = this.wsStore.positionsData.SWAP?.find(
      (p) => p.instId === symbol
    );
    return position
      ? {
          symbol: position.instId,
          size: Number(position.pos) || 0,
          side: position.posSide, // long or short
          entryPrice: Number(position.avgPx) || 0,
          leverage: Number(position.lever) || 1,
          margin: Number(position.margin) || 0,
          unrealizedPnl: Number(position.upl) || 0,
          unrealizedPnlRatio: Number(position.uplRatio) || 0,
          marginRatio: Number(position.mgnRatio) || 0,
          lastUpdateTime: position.uTime || Date.now(),
        }
      : null;
  }

  /**
   * 获取所有仓位信息
   * @returns {Array} 仓位信息数组
   */
  getAllPositions() {
    return (this.wsStore.positionsData.SWAP || []).map((position) => ({
      symbol: position.instId,
      size: Number(position.pos) || 0,
      side: position.posSide,
      entryPrice: Number(position.avgPx) || 0,
      leverage: Number(position.lever) || 1,
      margin: Number(position.margin) || 0,
      unrealizedPnl: Number(position.upl) || 0,
      unrealizedPnlRatio: Number(position.uplRatio) || 0,
      marginRatio: Number(position.mgnRatio) || 0,
      lastUpdateTime: position.uTime || Date.now(),
    }));
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

  /**
   * 获取所有币种信息
   * @param {string} type - 币种类型 (SWAP/SPOT)
   * @returns {Array} 币种信息数组
   */
  getAllCurrencies(type = "SWAP") {
    return (this.currencyStore.currencies[type] || []).map((currency) => ({
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
    }));
  }

  /**
   * 获取指定币种的完整信息（包含仓位和币种数据）
   * @param {string} symbol - 币种符号
   * @returns {Object} 完整信息
   */
  getSymbolFullInfo(symbol) {
    return {
      position: this.getPositionInfo(symbol),
      currency: this.getCurrencyInfo(symbol, "SWAP"),
    };
  }

  //
}

export default StrategyExpressionHandler;
