// 导入模块
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV !== "production";

// 创建主窗口
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440, // 窗口宽度
    height: 800, // 窗口高度
    minWidth: 1200, // 最小宽度
    minHeight: 700, // 最小高度
    frame: false, // 无边框窗口
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本
      nodeIntegration: true, // 启用Node.js集成
      contextIsolation: true, // 启用上下文隔离
      enableRemoteModule: true, // 启用远程模块
      webSecurity: false, // 禁用跨域检查
      allowRunningInsecureContent: true, // 允许运行不安全的代码
    },
  });

  // 根据环境加载不同的URL
  if (isDev) {
    mainWindow.loadURL("http://localhost:604");
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 窗口控制事件
  ipcMain.on("window-min", () => mainWindow.minimize());
  ipcMain.on("window-max", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on("window-close", () => mainWindow.close());

  // 处理白屏
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
};

// 应用准备就绪，加载窗口
app.whenReady().then(() => {
  createWindow();

  // mac 上默认保留一个窗口
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 关闭所有窗口 ： 程序退出 ： windows & linux
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 防止程序多开
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length) {
      if (windows[0].isMinimized()) {
        windows[0].restore();
      }
      windows[0].focus();
    }
  });
}
