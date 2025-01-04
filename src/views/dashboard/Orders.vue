<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="orders h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="orders-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">订单</h2>
                    <a-tag color="warning">开发中</a-tag>
                </div>
            </div>
        </div>

        <!-- 可滚动的内容区 -->
        <div class="orders-scroll-container">
            <div class="orders-content p-4">
                <div class="flex flex-col items-center justify-center h-[400px]">
                    <code-outlined class="text-[80px] text-dark-200 opacity-50" />
                    <p class="mt-4 text-dark-200">功能开发中，敬请期待...</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineOptions } from 'vue'
import { CodeOutlined } from '@ant-design/icons-vue'

// 定义组件选项
defineOptions({
    name: 'Orders'
})
</script>

<style scoped>
.orders {
    display: flex;
    flex-direction: column;
    min-width: 1200px;
    background-color: var(--bg-color);
}

.orders-header {
    flex-shrink: 0;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.orders-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background-color: var(--bg-color);
}

/* 内容区最小宽度 */
.orders-content {
    min-width: 1200px;
}

/* 修改模块背景色 */
:deep(.bg-dark-400) {
    background-color: var(--bg-color) !important;
}

:deep(.bg-dark-500) {
    background-color: var(--bg-color) !important;
}

/* 修改边框颜色 */
:deep(.border-dark-300) {
    border-color: var(--border-color) !important;
}

/* 修改文字颜色 */
:deep(.text-dark-100) {
    color: var(--text-color) !important;
}

:deep(.text-dark-200) {
    color: var(--text-secondary) !important;
}

/* 自定义滚动条样式 */
.orders-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.orders-scroll-container::-webkit-scrollbar-track {
    background: var(--bg-color);
}

.orders-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.orders-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Firefox 滚动条样式 */
.orders-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--bg-color);
}
</style>