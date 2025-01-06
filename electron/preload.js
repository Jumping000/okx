const { contextBridge, ipcRenderer } = require("electron");

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.send("window-min"),
  maximizeWindow: () => ipcRenderer.send("window-max"),
  closeWindow: () => ipcRenderer.send("window-close"),

  // 获取版本信息
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
});

// 页面加载完成后的处理
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
