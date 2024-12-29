import request from "../request";

// 获取全部币种列表
// export const getAssetCurrencies = async () => {
//   return await request.get("/api/v5/asset/currencies", {});
// };

// 获取账户币种列表
export const getAccountInstruments = async (data) => {
  return await request.get("/api/v5/account/instruments", data);
};
