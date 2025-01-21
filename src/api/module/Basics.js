import request from "../request";

// 获取全部币种列表
// export const getAssetCurrencies = async () => {
//   return await request.get("/api/v5/asset/currencies", {});
// };

// 获取账户币种列表
export const getAccountInstruments = async (data) => {
  return await request.get("/api/v5/account/instruments", data);
};

// 获取杠杆倍数
export const getLeverageInfo = async (data) => {
  return await request.get("/api/v5/account/leverage-info", data);
};

// 设置杠杆倍数
export const setLeverage = async (data) => {
  return await request.post("/api/v5/account/set-leverage", data);
};

// 获取历史订单记录（近三个月）
export const getHistoryOrders = async (data) => {
  return await request.get("/api/v5/trade/orders-history-archive", data);
};

// 获取未成交订单列表
export const getPendingOrders = async (data) => {
  return await request.get("/api/v5/trade/orders-pending", data);
};
// POST /api/v5/trade/order-algo 策略订单
export const postOrderAlgo = async (data) => {
  return await request.post("/api/v5/trade/order-algo", data);
};
