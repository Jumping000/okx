// 存储键名
const STORAGE_KEYS = {
  API_KEY: "okx_api_key",
  API_SECRET: "okx_api_secret",
  PASSPHRASE: "okx_passphrase",
};

// 加密存储
const encrypt = (value) => {
  // 这里可以添加加密逻辑，目前为了简单直接存储
  return value;
};

// 解密存储
const decrypt = (value) => {
  // 这里可以添加解密逻辑，目前为了简单直接返回
  return value;
};

export const storage = {
  // 设置 API 配置
  setApiConfig(apiKey, apiSecret, passphrase) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, encrypt(apiKey));
    localStorage.setItem(STORAGE_KEYS.API_SECRET, encrypt(apiSecret));
    localStorage.setItem(STORAGE_KEYS.PASSPHRASE, encrypt(passphrase));
  },

  // 获取 API 配置
  getApiConfig() {
    return {
      apiKey: decrypt(localStorage.getItem(STORAGE_KEYS.API_KEY)),
      apiSecret: decrypt(localStorage.getItem(STORAGE_KEYS.API_SECRET)),
      passphrase: decrypt(localStorage.getItem(STORAGE_KEYS.PASSPHRASE)),
    };
  },

  // 清除 API 配置
  clearApiConfig() {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.API_SECRET);
    localStorage.removeItem(STORAGE_KEYS.PASSPHRASE);
  },

  // 检查是否已配置
  hasApiConfig() {
    return !!(
      localStorage.getItem(STORAGE_KEYS.API_KEY) &&
      localStorage.getItem(STORAGE_KEYS.API_SECRET) &&
      localStorage.getItem(STORAGE_KEYS.PASSPHRASE)
    );
  },
};
