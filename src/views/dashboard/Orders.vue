<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="orders h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="orders-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">订单</h2>
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
        <div class="orders-scroll-container">
            <div class="orders-content p-4">
                <!-- 订单列表 -->
                <div class="orders-table">
                    <a-table :dataSource="filteredOrders" :columns="columns" :loading="loading" :pagination="{
                        total: filteredOrders.length,
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        showTotal: (total) => `共 ${total} 条`
                    }" size="small" :scroll="{ x: 1200 }">
                        <template #bodyCell="{ column, text, record }">
                            <!-- 订单类型 -->
                            <template v-if="column.dataIndex === 'ordType'">
                                <a-tag :color="getOrderTypeColor(text)">{{ getOrderTypeText(text) }}</a-tag>
                            </template>

                            <!-- 订单方向 -->
                            <template v-else-if="column.dataIndex === 'side'">
                                <template v-if="record.instId.includes('SWAP')">
                                    <span class="font-medium text-sm"
                                        :class="record.posSide === 'long' ? 'buy-color' : 'sell-color'">
                                        {{ text === 'buy' ?
                                            (record.posSide === 'long' ? '开多' : '平空') :
                                            (record.posSide === 'long' ? '平多' : '开空') 
                                        }}
                                    </span>
                                </template>
                                <template v-else>
                                    <span class="font-medium text-sm"
                                        :class="text === 'buy' ? 'buy-color' : 'sell-color'">
                                        {{ text === 'buy' ? '买入' : '卖出' }}
                                    </span>
                                </template>
                            </template>

                            <!-- 杠杆倍数 -->
                            <template v-else-if="column.dataIndex === 'lever'">
                                <span v-if="record.instId.includes('SWAP')"
                                    class="font-mono">{{ parseInt(text) }}X</span>
                                <span v-else>-</span>
                            </template>

                            <!-- 保证金模式 -->
                            <template v-else-if="column.dataIndex === 'tdMode'">
                                <template v-if="record.instId.includes('SWAP')">
                                    <a-tag :color="text === 'cross' ? 'blue' : 'purple'">
                                        {{ text === 'cross' ? '全仓' : '逐仓' }}
                                    </a-tag>
                                </template>
                                <template v-else>
                                    <span>-</span>
                                </template>
                            </template>

                            <!-- 订单状态 -->
                            <template v-else-if="column.dataIndex === 'state'">
                                <a-tag :color="getOrderStateColor(text)">{{ getOrderStateText(text) }}</a-tag>
                            </template>

                            <!-- 价格 -->
                            <template v-else-if="column.dataIndex === 'px'">
                                <span class="font-mono">{{ !text || text === '0' ? '市价' : formatNumber(text) }}</span>
                            </template>

                            <!-- 数量 -->
                            <template v-else-if="['sz', 'accFillSz'].includes(column.dataIndex)">
                                <span class="font-mono">{{ formatNumber(text) }}</span>
                            </template>

                            <!-- 订单来源 -->
                            <template v-else-if="column.dataIndex === 'clOrdId'">
                                <a-tag v-if="text?.includes('YAN')" class="source-tag" color="primary">
                                    <span class="px-1">本平台</span>
                                </a-tag>
                                <a-tag v-else class="source-tag">
                                    <span class="px-1">其他</span>
                                </a-tag>
                            </template>

                            <!-- 创建时间 -->
                            <template v-else-if="column.dataIndex === 'cTime'">
                                <span>{{ formatTime(text) }}</span>
                            </template>

                            <!-- 默认显示 -->
                            <template v-else>
                                <span>{{ text }}</span>
                            </template>
                        </template>
                    </a-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useWebSocketStore } from '@/store/websocket'
import dayjs from 'dayjs'

// 定义组件选项
defineOptions({
    name: 'Orders'
})

// 状态管理
const wsStore = useWebSocketStore()
const loading = ref(false)
const selectedInstType = ref('SPOT') // SPOT 或 SWAP

// 表格列定义
const columns = computed(() => {
    const baseColumns = [
        {
            title: '产品',
            dataIndex: 'instId',
            key: 'instId',
            width: 120,
        },
        {
            title: '方向',
            dataIndex: 'side',
            key: 'side',
            width: 80,
        },
        {
            title: '价格',
            dataIndex: 'px',
            key: 'px',
            width: 120,
        },
        {
            title: '数量',
            dataIndex: 'sz',
            key: 'sz',
            width: 120,
        },
        {
            title: '已成交数量',
            dataIndex: 'accFillSz',
            key: 'accFillSz',
            width: 120,
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            width: 100,
        },
        {
            title: '来源',
            dataIndex: 'clOrdId',
            key: 'clOrdId',
            width: 80,
        },
        {
            title: '创建时间',
            dataIndex: 'cTime',
            key: 'cTime',
            width: 180,
        },
    ]

    // 如果是永续合约，添加杠杆和保证金模式列
    if (selectedInstType.value === 'SWAP') {
        return [
            baseColumns[0],
            baseColumns[1],
            {
                title: '杠杆',
                dataIndex: 'lever',
                key: 'lever',
                width: 80,
            },
            {
                title: '保证金模式',
                dataIndex: 'tdMode',
                key: 'tdMode',
                width: 100,
            },
            ...baseColumns.slice(2)
        ]
    }

    return baseColumns
})

// 获取订单数据
const fetchOrders = async () => {
    loading.value = true
    try {
        await wsStore.subscribeOrders({
            instType: selectedInstType.value,
            onData: (message) => {
                console.log('订单数据更新:', message)
            }
        })
    } catch (error) {
        console.error('获取订单数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 计算过滤后的订单数据
const filteredOrders = computed(() => {
    const ordersData = wsStore.getOrdersData(selectedInstType.value)
    // 合并活跃订单和历史订单
    return [...(ordersData.active || []), ...(ordersData.history || [])]
})

// 格式化数字
const formatNumber = (value) => {
    if (!value) return '0'
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    })
}

// 格式化时间
const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    return dayjs(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss')
}

// 获取订单类型颜色
const getOrderTypeColor = (type) => {
    const colors = {
        market: 'orange',
        limit: 'blue',
        post_only: 'cyan',
        fok: 'purple',
        ioc: 'geekblue',
        optimal_limit_ioc: 'gold'
    }
    return colors[type] || 'default'
}

// 获取订单类型文本
const getOrderTypeText = (type) => {
    const texts = {
        market: '市价',
        limit: '限价',
        post_only: '只做maker',
        fok: 'FOK',
        ioc: 'IOC',
        optimal_limit_ioc: '最优限价'
    }
    return texts[type] || type
}

// 获取订单状态颜色
const getOrderStateColor = (state) => {
    const colors = {
        live: 'processing',
        filled: 'success',
        canceled: 'default',
        partially_filled: 'warning'
    }
    return colors[state] || 'default'
}

// 获取订单状态文本
const getOrderStateText = (state) => {
    const texts = {
        live: '活跃',
        filled: '已完成',
        canceled: '已取消',
        partially_filled: '部分成交'
    }
    return texts[state] || state
}

// 监听产品类型变化
watch(selectedInstType, () => {
    fetchOrders()
})

// 组件挂载时获取订单数据
onMounted(() => {
    fetchOrders()
})
</script>

<style lang="scss" scoped>
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

/* 表格样式自定义 */
:deep(.orders-table) {
    .ant-table {
        background: transparent;
        color: var(--text-color);
    }

    .ant-table-thead>tr>th {
        background-color: var(--dark-500) !important;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-secondary);
        font-weight: 500;

        &::before {
            display: none;
            /* 移除表头的分隔线 */
        }
    }

    .ant-table-tbody>tr>td {
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.3s;
        background-color: transparent;
        color: var(--text-color);
        padding: 8px 16px;
    }

    .ant-table-tbody>tr:hover>td {
        background-color: var(--dark-500) !important;
    }

    .ant-table-cell {
        background-color: transparent !important;
    }

    .ant-table-empty .ant-table-tbody>tr.ant-table-placeholder {
        background-color: transparent;
    }

    .ant-table-empty .ant-table-tbody>tr.ant-table-placeholder:hover>td {
        background-color: transparent;
    }

    .ant-table-empty .ant-empty-description {
        color: var(--text-secondary);
    }

    .ant-table-cell-fix-left,
    .ant-table-cell-fix-right {
        background-color: var(--dark-400) !important;
    }

    .ant-table-container,
    .ant-table-content {
        border-color: var(--border-color);
    }
}

/* 修改文字颜色 */
:deep(.text-dark-100) {
    color: var(--text-color) !important;
}

:deep(.text-dark-200) {
    color: var(--text-secondary) !important;
}

.text-success {
    color: var(--success-color) !important;
}

.text-danger {
    color: var(--danger-color) !important;
}

/* 分页样式覆盖 */
:deep(.ant-pagination) {
    color: var(--text-color);
}

:deep(.ant-pagination-item) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
}

:deep(.ant-pagination-item a) {
    color: var(--text-color);
}

:deep(.ant-pagination-item-active) {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

:deep(.ant-pagination-item-active a) {
    color: #fff;
}

:deep(.ant-pagination-prev button),
:deep(.ant-pagination-next button) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
    color: var(--text-color);
}

:deep(.ant-pagination-options) {
    color: var(--text-color);
}

:deep(.ant-pagination-options-quick-jumper) {
    color: var(--text-color);
}

:deep(.ant-pagination-options-quick-jumper input) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
    color: var(--text-color);
}

:deep(.ant-select-selector) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-select-selection-item) {
    color: var(--text-color) !important;
}

:deep(.ant-select-dropdown) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
}

:deep(.ant-select-item) {
    color: var(--text-color);
}

:deep(.ant-select-item-option-selected) {
    background-color: var(--primary-color);
    color: #fff;
}

:deep(.ant-select-item-option-active) {
    background-color: var(--primary-color-light);
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

/* 来源标签样式 */
:deep(.source-tag) {
    padding: 0;
    line-height: 20px;
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    color: var(--text-color) !important;

    &.ant-tag-primary {
        border-color: var(--primary-color) !important;
        background-color: var(--primary-color) !important;
        color: #fff !important;
    }
}

/* 买卖方向颜色 */
:deep(.buy-color) {
    color: #f5222d !important;
}

:deep(.sell-color) {
    color: #52c41a !important;
}
</style>