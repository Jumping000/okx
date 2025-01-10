/**
 * Worker 基类
 * 用于处理 Worker 内的消息接收和数据处理
 */
class BaseWorker {
  constructor() {
    // 初始化 Worker 上下文
    this.ctx = self;

    // 绑定消息处理函数
    this.ctx.onmessage = this.handleMessage.bind(this);

    // 绑定错误处理函数
    this.ctx.onerror = this.handleError.bind(this);

    console.log("BaseWorker 初始化完成");
  }

  /**
   * 处理接收到的消息
   * @param {MessageEvent} event - 消息事件对象
   */
  handleMessage(event) {
    try {
      console.log("BaseWorker 收到消息:", event.data);
      this.processData(event.data);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 处理数据的具体实现（需要在子类中重写）
   * @param {any} data - 接收到的数据
   */
  processData(data) {
    console.warn("BaseWorker: processData 方法需要在子类中实现", data);
  }

  /**
   * 向主线程发送数据
   * @param {any} data - 要发送的数据
   */
  postMessage(data) {
    console.log("BaseWorker 发送消息:", data);
    this.ctx.postMessage(data);
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   */
  handleError(error) {
    console.error("Worker 错误:", error);
    // 向主线程报告错误
    this.postMessage({
      type: "error",
      error: {
        message: error.message || "未知错误",
        stack: error.stack,
      },
    });
  }
}

// 暴露给全局
self.BaseWorker = BaseWorker;
