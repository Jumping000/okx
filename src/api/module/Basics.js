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
