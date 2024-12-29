import CryptoJS from "crypto-js";
import { storage } from "./storage";

/**
 * 生成 ISO 格式的时间戳
 * @returns {string} ISO 格式的时间戳
 */
export const generateTimestamp = () => {
  return new Date().toISOString();
};

/**
 * 生成签名
 * @param {string} timestamp ISO 格式的时间戳
 * @param {string} method 请求方法 (GET/POST)
 * @param {string} requestPath 请求路径
 * @param {string} [body] 请求体
 * @returns {string} Base64 编码的签名
 */
export const generateSignature = (
  timestamp,
  method,
  requestPath,
  body = ""
) => {
  const { secretKey } = storage.getApiConfig() || {};
  console.log(storage.getApiConfig());
  if (!secretKey) {
    throw new Error("Secret key not found");
  }

  const signStr = timestamp + method.toUpperCase() + requestPath + body;
  const hash = CryptoJS.HmacSHA256(signStr, secretKey);
  return CryptoJS.enc.Base64.stringify(hash);
};

/**
 * 获取认证请求头
 * @param {string} method 请求方法 (GET/POST)
 * @param {string} requestPath 请求路径
 * @param {string} [body] 请求体
 * @returns {Object} 包含认证信息的请求头
 */
export const getAuthHeaders = (method, requestPath, body = "") => {
  const { apiKey, passphrase } = storage.getApiConfig() || {};
  if (!apiKey || !passphrase) {
    throw new Error("API configuration not found");
  }

  const timestamp = generateTimestamp();
  const signature = generateSignature(timestamp, method, requestPath, body);

  return {
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
  };
};
