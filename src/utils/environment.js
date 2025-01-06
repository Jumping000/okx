/**
 * 判断是否运行在 Electron 环境中
 * @returns {boolean}
 */
export const isElectron = () => {
  return window?.electronAPI !== undefined;
};

/**
 * 判断是否运行在开发环境
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

/**
 * 获取当前运行环境
 * @returns {'electron' | 'browser'}
 */
export const getEnvironment = () => {
  return isElectron() ? "electron" : "browser";
};
