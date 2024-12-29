import request from "../request";

// 获取币种列表
export const getAssetCurrencies = async () => {
  return await request.get("/api/v5/asset/currencies", {});
};
