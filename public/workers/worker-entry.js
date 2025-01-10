// Worker 入口文件
console.log("Worker 入口文件加载");

// 加载基础类
self.importScripts("./BaseWorker.js");
console.log("BaseWorker 加载完成");

// 加载策略 Worker
self.importScripts("./myWorker.js");
console.log("StrategyWorker 加载完成");
