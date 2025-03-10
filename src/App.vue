<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useWebSocketStore } from '@/store/websocket';
import { WebSocketType } from '@/utils/websocketUtils';

const wsStore = useWebSocketStore();

// 初始化并连接公共频道
const initPublicChannel = async () => {
    try {
        wsStore.initializeConnection(WebSocketType.PUBLIC);
        await wsStore.connect(WebSocketType.PUBLIC);
        console.log('公共频道连接成功');
    } catch (error) {
        console.error('公共频道连接失败:', error);
    }
};

// 初始化并连接私有频道
const initPrivateChannel = async () => {
    try {
        wsStore.initializeConnection(WebSocketType.PRIVATE);
        await wsStore.connect(WebSocketType.PRIVATE);
        console.log('私有频道连接成功');
    } catch (error) {
        console.error('私有频道连接失败:', error);
    }
};

// 初始化并连接业务频道
const initBusinessChannel = async () => {
    try {
        wsStore.initializeConnection(WebSocketType.BUSINESS);
        await wsStore.connect(WebSocketType.BUSINESS);
        console.log('业务频道连接成功');
    } catch (error) {
        console.error('业务频道连接失败:', error);
    }
};

// 组件挂载时初始化连接
onMounted(async () => {
    // 分别初始化三个通道
    await initPublicChannel();
    await initPrivateChannel();
    await initBusinessChannel();
});

// 组件卸载时断开连接
onUnmounted(() => {
    wsStore.disconnectAll();
});
</script>

<style>
#app {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
        'Noto Color Emoji';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: rgba(0, 0, 0, 0.85);
    min-height: 100vh;
}
</style>
