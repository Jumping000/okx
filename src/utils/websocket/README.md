# WebSocket 工具类使用文档

## 目录结构

```
src/utils/websocket/
├── websocket.js     # WebSocket 客户端基础类
├── manager.js       # WebSocket 连接管理器
└── README.md        # 使用文档
```

## 功能特性

- ✨ 自动重连机制
- 💗 心跳检测
- 🔄 断线重连
- 🚦 连接状态管理
- 📨 消息发送队列
- 🎯 事件驱动
- 🔒 安全关闭
- 📝 日志记录

## 配置项

### WebSocket 状态枚举 (WS_STATUS)

```javascript
{
  CONNECTING: 0,    // 连接中
  CONNECTED: 1,     // 已连接
  CLOSING: 2,       // 关闭中
  CLOSED: 3,        // 已关闭
  RECONNECTING: 4   // 重连中
}
```

### WebSocket 事件类型 (WS_EVENTS)

```javascript
{
  OPEN: 'open',                    // 连接建立
  MESSAGE: 'message',              // 收到消息
  ERROR: 'error',                  // 发生错误
  CLOSE: 'close',                  // 连接关闭
  RECONNECT: 'reconnect',          // 开始重连
  RECONNECTED: 'reconnected',      // 重连成功
  RECONNECT_ERROR: 'reconnect_error', // 重连失败
  RECONNECT_FAILED: 'reconnect_failed', // 重连次数超限
  HEART_BEAT: 'heart_beat'         // 心跳检测
}
```

## 基本用法

### 1. 初始化连接

```javascript
import { wsManager } from '@/utils/websocket/manager'

// 初始化所有连接
wsManager.initialize({
  publicUrl: 'wss://example.com/public',
  privateUrl: 'wss://example.com/private',
  businessUrl: 'wss://example.com/business'
})
```

### 2. 消息处理

```javascript
// 添加消息处理器
wsManager.addMessageHandler('public', (data) => {
  console.log('收到公共频道消息:', data)
})

// 发送消息
wsManager.send('public', {
  op: 'subscribe',
  args: [{
    channel: 'tickers',
    instId: 'BTC-USDT'
  }]
})
```

### 3. 连接管理

```javascript
// 获取指定连接
const publicWs = wsManager.getConnection('public')

// 关闭指定连接
wsManager.closeConnection('public')

// 关闭所有连接
wsManager.closeAll()
```

### 4. 在 Vue 组件中使用

```javascript
import { defineComponent, onMounted, onUnmounted } from 'vue'
import { wsManager } from '@/utils/websocket/manager'

export default defineComponent({
  setup() {
    // 消息处理函数
    const handleMessage = (data) => {
      console.log('收到消息:', data)
    }

    onMounted(() => {
      // 添加消息处理器
      wsManager.addMessageHandler('public', handleMessage)
    })

    onUnmounted(() => {
      // 移除消息处理器
      wsManager.removeMessageHandler('public', handleMessage)
    })
  }
})
```

## 注意事项

1. **初始化时机**
   - 建议在应用启动时初始化 WebSocket 连接
   - 确保在使用前调用 `initialize` 方法

2. **心跳检测**
   - 默认心跳间隔为 15 秒
   - 心跳超时时间为 5 秒
   - 可通过配置项自定义心跳消息格式

3. **重连机制**
   - 默认最大重连次数为 5 次
   - 重连间隔为 3 秒
   - 超过最大重连次数后需手动重新连接

4. **资源清理**
   - 在组件销毁时记得移除消息处理器
   - 不需要的连接应及时关闭
   - 应用退出时调用 `closeAll` 方法清理所有连接

5. **错误处理**
   - 所有方法都有适当的错误处理
   - 建议监听 ERROR 事件以处理异常情况
   - 网络异常会自动触发重连机制

## 高级配置

### 自定义配置项

```javascript
wsManager.createConnection('custom', 'wss://example.com', {
  heartbeatInterval: 20000,      // 心跳间隔（毫秒）
  heartbeatTimeout: 8000,        // 心跳超时时间（毫秒）
  reconnectInterval: 5000,       // 重连间隔（毫秒）
  reconnectMaxTimes: 10,         // 最大重连次数
  heartbeatMessage: () => ({     // 自定义心跳消息
    type: 'ping',
    timestamp: Date.now()
  })
})
```

### 事件监听

```javascript
const ws = wsManager.getConnection('public')

// 监听连接状态
ws.on(WS_EVENTS.OPEN, () => {
  console.log('连接已建立')
})

ws.on(WS_EVENTS.CLOSE, () => {
  console.log('连接已关闭')
})

ws.on(WS_EVENTS.ERROR, (error) => {
  console.error('连接错误:', error)
})

// 监听重连事件
ws.on(WS_EVENTS.RECONNECT, (times) => {
  console.log(`第 ${times} 次重连`)
})

ws.on(WS_EVENTS.RECONNECTED, () => {
  console.log('重连成功')
})

ws.on(WS_EVENTS.RECONNECT_FAILED, () => {
  console.log('重连失败，已达到最大重试次数')
})
```

## 性能优化建议

1. **消息处理**
   - 避免在消息处理器中执行耗时操作
   - 大量数据建议使用 Web Worker 处理
   - 及时移除不需要的消息处理器

2. **连接管理**
   - 按需创建连接，避免无用连接
   - 及时关闭不需要的连接
   - 合理设置心跳间隔，避免过于频繁

3. **内存管理**
   - 注意清理定时器
   - 组件销毁时移除事件监听
   - 避免循环引用

## 常见问题

1. **连接无法建立**
   - 检查 URL 是否正确
   - 确认网络状态
   - 查看控制台错误信息

2. **消息发送失败**
   - 确认连接状态是否为 CONNECTED
   - 检查消息格式是否正确
   - 查看是否超过服务器限制

3. **频繁断开连接**
   - 检查网络稳定性
   - 适当增加心跳间隔
   - 查看服务器负载情况 