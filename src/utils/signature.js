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
 * @param {string} requestPath 请求路径（包含查询参数）
 * @param {string} [body] 请求体（仅 POST 等方法需要）
 * @returns {string} Base64 编码的签名
 */
export const generateSignature = (
  timestamp,
  method,
  requestPath,
  body = ""
) => {
  const { secretKey } = storage.getApiConfig() || {};
  if (!secretKey) {
    throw new Error("Secret key not found");
  }

  // 1. 确保 method 是大写
  const upperMethod = method.toUpperCase();
  // 2. 拼接签名字符串：timestamp + method + requestPath + body
  const signStr = timestamp + upperMethod + requestPath + body;

  // 3. 使用 HMAC SHA256 加密
  const hash = CryptoJS.HmacSHA256(signStr, secretKey);

  // 4. Base64 编码
  return CryptoJS.enc.Base64.stringify(hash);
};

/**
 * 获取认证请求头
 * @param {string} method 请求方法 (GET/POST)
 * @param {string} requestPath 请求路径
 * @param {string} [body] 请求体（仅 POST 等方法需要）
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
