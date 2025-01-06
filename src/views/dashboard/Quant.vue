<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="quant h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="quant-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">量化</h2>
                </div>
                <!-- 交易类型选项卡 -->
                <div class="trade-type-tabs">
                    <a-radio-group v-model:value="selectedInstType" size="small">
                        <a-radio-button value="SPOT">
                            <span class="px-4">现货</span>
                        </a-radio-button>
                        <a-radio-button value="SWAP">
                            <span class="px-4">永续</span>
                        </a-radio-button>
                    </a-radio-group>
                </div>
            </div>
        </div>

        <!-- 可滚动的内容区 -->
        <div class="quant-scroll-container">
            <div class="quant-content p-4">
                <!-- 网格布局 -->
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <!-- 策略列表 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略列表</h3>
                                <a-tag color="blue" class="rounded-full">0</a-tag>
                            </div>
                            <a-button type="primary" size="small">
                                <template #icon>
                                    <plus-outlined />
                                </template>
                                新建策略
                            </a-button>
                        </div>
                        <div class="p-4">
                            <!-- 空状态 -->
                            <div class="flex flex-col items-center justify-center py-8">
                                <robot-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">暂无策略，点击右上角创建</p>
                            </div>
                        </div>
                    </div>

                    <!-- 策略监控 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略监控</h3>
                            </div>
                            <a-radio-group v-model:value="monitorPeriod" size="small"
                                class="bg-dark-500 p-[1px] rounded">
                                <a-radio-button value="realtime">实时</a-radio-button>
                                <a-radio-button value="1h">1小时</a-radio-button>
                                <a-radio-button value="1d">1天</a-radio-button>
                            </a-radio-group>
                        </div>
                        <div class="p-4">
                            <!-- 空状态 -->
                            <div class="flex flex-col items-center justify-center py-8">
                                <line-chart-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">请先选择要监控的策略</p>
                            </div>
                        </div>
                    </div>

                    <!-- 策略日志 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略日志</h3>
                            </div>
                            <a-button type="link" size="small">清空日志</a-button>
                        </div>
                        <div class="p-4 h-[300px] overflow-y-auto">
                            <!-- 空状态 -->
                            <div class="flex flex-col items-center justify-center h-full">
                                <file-text-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">暂无日志记录</p>
                            </div>
                        </div>
                    </div>

                    <!-- 策略统计 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略统计</h3>
                            </div>
                            <a-radio-group v-model:value="statsPeriod" size="small" class="bg-dark-500 p-[1px] rounded">
                                <a-radio-button value="today">今日</a-radio-button>
                                <a-radio-button value="week">本周</a-radio-button>
                                <a-radio-button value="month">本月</a-radio-button>
                            </a-radio-group>
                        </div>
                        <div class="p-4">
                            <!-- 空状态 -->
                            <div class="flex flex-col items-center justify-center py-8">
                                <pie-chart-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">暂无统计数据</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineOptions } from 'vue'
import { ref } from 'vue'
import {
    PlusOutlined,
    RobotOutlined,
    LineChartOutlined,
    FileTextOutlined,
    PieChartOutlined
} from '@ant-design/icons-vue'

// 定义组件选项
defineOptions({
    name: 'Quant'
})

// 状态管理
const selectedInstType = ref('SPOT') // SPOT 或 SWAP
const monitorPeriod = ref('realtime') // realtime, 1h, 1d
const statsPeriod = ref('today') // today, week, month
</script>

<style scoped>
.quant {
    display: flex;
    flex-direction: column;
    min-width: 1200px;
    background-color: var(--bg-color);
}

.quant-header {
    flex-shrink: 0;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.quant-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background-color: var(--bg-color);
}

/* 内容区最小宽度 */
.quant-content {
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
.quant-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.quant-scroll-container::-webkit-scrollbar-track {
    background: var(--bg-color);
}

.quant-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.quant-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Firefox 滚动条样式 */
.quant-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--bg-color);
}

/* 交易类型选项卡样式 */
:deep(.trade-type-tabs) {
    .ant-radio-group {
        display: flex;
        border: 1px solid var(--primary-color);
        border-radius: 2px;
        padding: 0;
    }

    .ant-radio-button-wrapper {
        height: 24px;
        line-height: 22px;
        padding: 0;
        background: transparent;
        border: none !important;
        color: var(--primary-color);

        &::before {
            display: none;
        }

        &:hover {
            color: var(--primary-color-light);
        }

        &:first-child {
            border-radius: 1px 0 0 1px;
        }

        &:last-child {
            border-radius: 0 1px 1px 0;
        }
    }

    .ant-radio-button-wrapper-checked {
        background-color: var(--primary-color) !important;
        color: #fff !important;
        box-shadow: none;

        &:hover {
            color: #fff !important;
        }
    }

    .ant-radio-button-wrapper:not(:first-child)::before {
        background-color: var(--primary-color);
        width: 1px;
        height: 100%;
    }
}

/* 单选按钮组样式 */
:deep(.ant-radio-button-wrapper) {
    @apply bg-transparent border-none text-dark-200 !important;

    &:not(:first-child)::before {
        @apply hidden;
    }

    &.ant-radio-button-wrapper-checked {
        @apply bg-dark-300 text-white !important;
    }
}

/* 链接按钮样式 */
:deep(.ant-btn-link) {
    color: var(--text-secondary) !important;

    &:hover {
        color: var(--primary-color) !important;
    }

    &:active {
        color: color-mix(in srgb, var(--primary-color) 80%, black) !important;
    }
}
</style>