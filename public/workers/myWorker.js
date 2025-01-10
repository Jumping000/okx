/**
 * 策略执行 Worker
 */
class StrategyWorker extends self.BaseWorker {
  constructor() {
    super();
    this.strategy = null;
    this.parameters = null;
    this.expressions = null;

    console.log("StrategyWorker 初始化完成");

    // 添加全局错误处理
    self.addEventListener("error", (error) => {
      console.error("Worker 内部错误:", error);
      this.handleError(error);
    });

    // 添加未捕获的 Promise 异常处理
    self.addEventListener("unhandledrejection", (event) => {
      console.error("Worker 未处理的 Promise 异常:", event.reason);
      this.handleError(new Error(event.reason));
    });
  }

  /**
   * 处理接收到的数据
   * @param {Object} data 接收到的数据对象
   */
  processData(data) {
    try {
      console.log("Worker 收到数据:", data);

      switch (data.type) {
        case "init":
          this.handleInit(data.payload);
          break;

        case "process":
          this.handleProcess(data.payload);
          break;
        case "stop":
          this.stop();
          break;
        default:
          throw new Error(`未知的消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error("Worker 处理数据错误:", error);
      this.handleError(error);
    }
  }

  /**
   * 处理初始化数据
   * @param {Object} payload 初始化数据
   */
  handleInit(payload) {
    try {
      console.log("Worker 开始初始化:", payload);

      // 保存策略配置
      this.strategy = payload.strategy;
      this.parameters = payload.parameters;
      this.expressions = payload.expressions;

      // 验证必要数据
      if (!this.strategy || !this.parameters || !this.expressions) {
        throw new Error("初始化数据不完整");
      }

      // 发送初始化完成消息
      this.postMessage({
        type: "init_complete",
        data: {
          strategyId: this.strategy.id,
          status: "initialized",
        },
      });

      console.log("Worker 初始化完成");
    } catch (error) {
      console.error("Worker 初始化错误:", error);
      throw error;
    }
  }

  /**
   * 处理策略执行
   * @param {Object} payload 执行数据
   */
  handleProcess(payload) {
    try {
      console.log("Worker 开始处理:", payload);

      // 这里添加实际的策略执行逻辑

      this.postMessage({
        type: "process_complete",
        data: {
          strategyId: this.strategy.id,
          result: "策略执行结果",
        },
      });
    } catch (error) {
      console.error("Worker 处理错误:", error);
      throw error;
    }
  }

  stop() {
    console.log("Worker 停止");
  }
}

// 创建 Worker 实例
new StrategyWorker();
