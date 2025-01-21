module.exports = {
  globals: {
    defineOptions: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2020, // 支持可选链操作符
    sourceType: "module", // 支持 ES6 模块
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  // 其他配置
  rules: {
    // 其他规则
  },
};
