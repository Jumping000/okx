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
  // 通用存储方法
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  // 通用获取方法
  get(key) {
    try {
      const serializedValue = localStorage.getItem(key);
      return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  },

  // 通用删除方法
  remove(key) {
    localStorage.removeItem(key);
  },

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
      secretKey: decrypt(localStorage.getItem(STORAGE_KEYS.API_SECRET)),
      passphrase: decrypt(localStorage.getItem(STORAGE_KEYS.PASSPHRASE)),
    };
  },

  // 清除 API 配置
  clearApiConfig() {
    // localStorage.removeItem(STORAGE_KEYS.API_KEY);
    // localStorage.removeItem(STORAGE_KEYS.API_SECRET);
    // localStorage.removeItem(STORAGE_KEYS.PASSPHRASE);
    localStorage.clear();
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
