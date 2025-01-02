import request from "../request";

/**
 * 获取历史K线数据
 * @param {Object} params 请求参数
 * @param {string} params.instId 产品ID，如 BTC-USDT
 * @param {string} [params.after] 请求此时间戳之前的数据
 * @param {string} [params.before] 请求此时间戳之后的数据
 * @param {string} [params.bar] 时间粒度，默认1m
 * @param {string} [params.limit] 返回结果数量，默认100
 * @returns {Promise} 返回历史K线数据
 */
export const getHistoryKlines = (params) => {
  return request({
    url: "/api/v5/market/history-candles",
    method: "get",
    params,
  });
};
