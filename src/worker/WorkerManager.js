/**
 * Worker 管理器类
 * 用于管理多个 Web Worker 的生命周期和数据传递
 */
class WorkerManager {
  constructor() {
    // 使用 Map 存储所有的 worker 实例
    this.workers = new Map();
  }

  /**
   * 创建并启动一个新的 Worker
   * @param {string} workerId - Worker 的唯一标识
   * @param {string} workerPath - Worker 文件的路径
   * @returns {Promise<void>}
   */
  async start(workerId, workerPath) {
    if (this.workers.has(workerId)) {
      console.warn(`Worker ${workerId} 已经存在`);
      return;
    }

    try {
      const worker = new Worker(workerPath);

      // 设置增强的错误处理
      worker.onerror = (error) => {
        const errorInfo = {
          message: error.message || "未知错误",
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error: error.error,
        };

        console.error(`Worker ${workerId} 发生错误:`, errorInfo);

        // 触发自定义错误消息
        if (worker.onmessage) {
          worker.onmessage({
            data: {
              type: "error",
              error: errorInfo,
            },
          });
        }

        this.stop(workerId);
      };

      // 添加未捕获异常处理
      worker.addEventListener("unhandledrejection", (event) => {
        console.error(
          `Worker ${workerId} 未捕获的 Promise 异常:`,
          event.reason
        );
        this.stop(workerId);
      });

      this.workers.set(workerId, {
        instance: worker,
        status: "running",
      });

      console.log(`Worker ${workerId} 启动成功`);
    } catch (error) {
      console.error(`启动 Worker ${workerId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 停止指定的 Worker
   * @param {string} workerId - Worker 的唯一标识
   */
  stop(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.warn(`Worker ${workerId} 不存在`);
      return;
    }

    try {
      // 移除所有事件监听器
      worker.instance.onerror = null;
      worker.instance.onmessage = null;

      // 终止 Worker
      worker.instance.terminate();
      this.workers.delete(workerId);
      console.log(`Worker ${workerId} 已停止`);
    } catch (error) {
      console.error(`停止 Worker ${workerId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 停止所有 Worker
   */
  stopAll() {
    for (const workerId of this.workers.keys()) {
      this.stop(workerId);
    }
  }

  /**
   * 向指定的 Worker 发送数据
   * @param {string} workerId - Worker 的唯一标识
   * @param {any} data - 要发送的数据
   */
  postMessage(workerId, data) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} 不存在，无法发送数据`);
    }

    try {
      worker.instance.postMessage(data);
    } catch (error) {
      console.error(`发送数据到 Worker ${workerId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 广播消息给所有 Worker
   * @param {any} data - 要广播的数据
   */
  broadcast(data) {
    for (const [workerId, worker] of this.workers) {
      try {
        worker.instance.postMessage(data);
      } catch (error) {
        console.error(`广播消息到 Worker ${workerId} 失败:`, error);
      }
    }
  }

  /**
   * 监听指定 Worker 的消息
   * @param {string} workerId - Worker 的唯一标识
   * @param {Function} callback - 消息处理回调函数
   */
  onMessage(workerId, callback) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} 不存在，无法监听消息`);
    }

    worker.instance.onmessage = (event) => {
      callback(event.data);
    };
  }

  /**
   * 获取所有运行中的 Worker ID
   * @returns {string[]} Worker ID 数组
   */
  getRunningWorkers() {
    return Array.from(this.workers.keys());
  }

  /**
   * 检查指定的 Worker 是否正在运行
   * @param {string} workerId - Worker 的唯一标识
   * @returns {boolean}
   */
  isWorkerRunning(workerId) {
    return this.workers.has(workerId);
  }

  /**
   * 获取当前运行的 Worker 数量
   * @returns {number}
   */
  getWorkerCount() {
    return this.workers.size;
  }
}

export default WorkerManager;
