<template>
    <!-- 内容区容器 -->
    <div class="h-full overflow-auto p-5">
        <!-- 内容区 -->
        <div class="space-y-5">
            <!-- 账户概览卡片 -->
            <div class="grid gap-5 grid-cols-1 lg:grid-cols-2">
                <!-- 资产概览 -->
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <h3 class="text-base font-medium text-dark-100">资产概览</h3>
                        <a-button type="link" size="small" @click="handleRefresh" class="refresh-btn">
                            <sync-outlined :spin="isRefreshing" />
                        </a-button>
                    </div>
                    <div class="p-4">
                        <div class="flex flex-col gap-1 mb-4">
                            <span class="text-sm text-dark-200">总资产 (USDT)</span>
                            <span class="text-2xl font-mono total-assets">{{ assets.total }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">可用余额</span>
                                <span class="text-sm text-dark-100 font-mono">{{ assets.available }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">资产数量</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-dark-100 font-mono">{{ assets.positionCount }}</span>
                                    <span class="text-xs text-dark-200">币种</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 通信状态 -->
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <h3 class="text-base font-medium text-dark-100">通信状态</h3>
                        <a-tag :color="isAllConnected ? 'success' : 'error'">{{ isAllConnected ? '正常' : '异常' }}</a-tag>
                    </div>
                    <div class="p-4">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <wifi-outlined class="text-primary" />
                                    <span class="text-sm text-dark-100">网络状态</span>
                                </div>
                                <a-tag :color="networkStatus ? 'success' : 'error'">
                                    {{ networkStatus ? '正常' : '异常' }}
                                </a-tag>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <cloud-outlined class="text-primary" />
                                    <span class="text-sm text-dark-100">公共通道</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="heartbeat" :class="{ active: publicChannelStatus }"></span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <lock-outlined class="text-primary" />
                                    <span class="text-sm text-dark-100">私有通道</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="heartbeat" :class="{ active: privateChannelStatus }"></span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <api-outlined class="text-primary" />
                                    <span class="text-sm text-dark-100">业务通道</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="heartbeat" :class="{ active: businessChannelStatus }"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 最近交易 -->
                <!-- <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <h3 class="text-base font-medium text-dark-100">最近交易</h3>
                        <a-button type="link" size="small" @click="router.push('/dashboard/orders')">查看更多</a-button>
                    </div>
                    <div class="orders-table" style="height: 200px;">
                        <a-table :dataSource="filteredOrders.slice(0, 50)" :columns="columns" :loading="loading"
                            :pagination="false" size="small" :scroll="{ y: 160 }">
                            <template #bodyCell="{ column, text, record }">
                                <template v-if="column.dataIndex === 'instId'">
                                    <div class="flex items-center gap-1">
                                        <span class="font-medium text-sm">{{ text.split('-')[0] }}</span>
                                        <a-tag :color="record.instId.includes('SWAP') ? 'purple' : 'blue'"
                                            class="m-0 text-xs px-1">
                                            {{ record.instId.includes('SWAP') ? '永续' : '现货' }}
                                        </a-tag>
                                    </div>
                                </template>

<template v-else-if="column.dataIndex === 'side'">
                                    <span :class="text === 'buy' ? 'text-success' : 'text-danger'">
                                        {{ text === 'buy' ? '买入' : '卖出' }}
                                    </span>
                                </template>

<template v-else-if="column.dataIndex === 'px'">
                                    <span
                                        class="font-mono">{{ !text || text === '0' ? '市价' : formatNumber(text) }}</span>
                                </template>

<template v-else-if="['sz', 'accFillSz'].includes(column.dataIndex)">
                                    <span class="font-mono">{{ formatNumber(text) }}</span>
                                </template>

<template v-else-if="column.dataIndex === 'cTime'">
                                    <span>{{ formatTime(text) }}</span>
                                </template>

<template v-else>
                                    <span>{{ text }}</span>
                                </template>
</template>
</a-table>
</div>
</div> -->
            </div>

            <!-- 币种信息区 -->
            <div class="grid gap-5 grid-cols-1 lg:grid-cols-2">
                <!-- 现货币种 -->
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <div class="flex items-center gap-2">
                            <h3 class="text-base font-medium text-dark-100">现货币种</h3>
                            <a-tag color="blue" class="rounded-full">{{ currencyStore.currencies.SPOT.length }}</a-tag>
                        </div>
                        <a-input-search v-model:value="spotSearch" placeholder="搜索币种" class="w-32" size="small" />
                    </div>
                    <div class="currency-list-container">
                        <!-- 加载状态 -->
                        <template v-if="currencyStore.loading">
                            <div class="flex flex-col items-center justify-center h-full">
                                <a-spin />
                                <span class="mt-2 text-sm text-dark-200">加载中...</span>
                            </div>
                        </template>
                        <!-- 空数据状态 -->
                        <template v-else-if="!filteredSpotCurrencies.length">
                            <div class="flex flex-col items-center justify-center h-full">
                                <inbox-outlined class="text-2xl text-dark-300" />
                                <span class="mt-2 text-sm text-dark-200">
                                    {{ spotSearch ? '未找到匹配的币种' : '暂无币种数据' }}
                                </span>
                            </div>
                        </template>
                        <!-- 数据列表 -->
                        <template v-else>
                            <div class="currency-grid">
                                <div v-for="item in filteredSpotCurrencies" :key="item.instId" class="currency-item"
                                    :title="item.instId">
                                    <span class="currency-symbol">{{ item.instId.replace('-USDT', '') }}</span>
                                    <span class="currency-pair text-dark-200">/ USDT</span>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- 合约币种 -->
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <div class="flex items-center gap-2">
                            <h3 class="text-base font-medium text-dark-100">合约币种</h3>
                            <a-tag color="purple"
                                class="rounded-full">{{ currencyStore.currencies.SWAP.length }}</a-tag>
                        </div>
                        <a-input-search v-model:value="swapSearch" placeholder="搜索币种" class="w-32" size="small" />
                    </div>
                    <div class="currency-list-container">
                        <!-- 加载状态 -->
                        <template v-if="currencyStore.loading">
                            <div class="flex flex-col items-center justify-center h-full">
                                <a-spin />
                                <span class="mt-2 text-sm text-dark-200">加载中...</span>
                            </div>
                        </template>
                        <!-- 空数据状态 -->
                        <template v-else-if="!filteredSwapCurrencies.length">
                            <div class="flex flex-col items-center justify-center h-full">
                                <inbox-outlined class="text-2xl text-dark-300" />
                                <span class="mt-2 text-sm text-dark-200">
                                    {{ swapSearch ? '未找到匹配的币种' : '暂无币种数据' }}
                                </span>
                            </div>
                        </template>
                        <!-- 数据列表 -->
                        <template v-else>
                            <div class="currency-grid">
                                <div v-for="item in filteredSwapCurrencies" :key="item.instId" class="currency-item"
                                    :title="item.instId">
                                    <span class="currency-symbol">{{ item.instId.replace('-USDT-SWAP', '') }}</span>
                                    <span class="currency-pair text-dark-200">永续</span>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
    LockOutlined,
    WifiOutlined,
    CloudOutlined,
    ApiOutlined,
    SyncOutlined,
    InboxOutlined
} from '@ant-design/icons-vue'
import { useOverviewStore } from '@/store/overview'
import { useCurrencyStore } from '@/store/currency'
import { useWebSocketStore } from '@/store/websocket'
import dayjs from 'dayjs'

export default defineComponent({
    name: 'DashboardOverview',
    components: {
        LockOutlined,
        WifiOutlined,
        CloudOutlined,
        ApiOutlined,
        SyncOutlined,
        InboxOutlined
    },
    setup() {
        const router = useRouter()
        const store = useOverviewStore()
        const currencyStore = useCurrencyStore()
        const wsStore = useWebSocketStore()
        const { assets, connection, statistics, currentPeriod } = storeToRefs(store)
        const isRefreshing = ref(false)
        const spotSearch = ref('')
        const swapSearch = ref('')
        const loading = ref(false)

        // 表格列定义
        const columns = [
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
                width: 60,
            },
            {
                title: '价格',
                dataIndex: 'px',
                key: 'px',
                width: 100,
            },
            {
                title: '数量',
                dataIndex: 'sz',
                key: 'sz',
                width: 100,
            },
            {
                title: '创建时间',
                dataIndex: 'cTime',
                key: 'cTime',
                width: 160,
            },
        ]

        // 获取订单数据
        const filteredOrders = computed(() => {
            const spotOrders = wsStore.getOrdersData('SPOT')
            const swapOrders = wsStore.getOrdersData('SWAP')
            const allOrders = [
                ...(spotOrders.active || []),
                ...(spotOrders.history || []),
                ...(swapOrders.active || []),
                ...(swapOrders.history || [])
            ]
            // 按时间倒序排序
            return allOrders.sort((a, b) => Number(b.cTime) - Number(a.cTime))
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

        // 网络状态的引用
        const networkStatus = computed(() => connection.value.network)
        const publicChannelStatus = computed(() => connection.value.publicChannel)
        const privateChannelStatus = computed(() => connection.value.privateChannel)
        const businessChannelStatus = computed(() => connection.value.businessChannel)

        // 计算所有通道是否连接
        const isAllConnected = computed(() => {
            return networkStatus.value &&
                publicChannelStatus.value &&
                privateChannelStatus.value &&
                businessChannelStatus.value
        })

        // 过滤后的现货币种列表
        const filteredSpotCurrencies = computed(() => {
            if (!spotSearch.value) return currencyStore.currencies.SPOT;
            const searchText = spotSearch.value.toLowerCase();
            return currencyStore.currencies.SPOT.filter(item =>
                item.instId.toLowerCase().includes(searchText)
            );
        });

        // 过滤后的合约币种列表
        const filteredSwapCurrencies = computed(() => {
            if (!swapSearch.value) return currencyStore.currencies.SWAP;
            const searchText = swapSearch.value.toLowerCase();
            return currencyStore.currencies.SWAP.filter(item =>
                item.instId.toLowerCase().includes(searchText)
            );
        });

        // 获取当前时间段的统计数据
        const stats = computed(() => {
            const defaultStats = {
                tradeCount: 0,
                tradeVolume: 0,
                pnl: 0,
                winRate: 0,
                avgHoldTime: 0,
                fees: 0
            }
            return statistics.value?.[currentPeriod.value] || defaultStats
        })

        // 时间段切换
        const handlePeriodChange = (e) => {
            const period = e.target.value
            currentPeriod.value = period
            // 这里可以添加其他逻辑，比如获取新时间段的数据
        }

        // 刷新数据
        const handleRefresh = async () => {
            isRefreshing.value = true
            try {
                // TODO: 调用 API 获取最新数据
                // const data = await api.getOverviewData()
                // 更新 store 中的数据
                // store.$patch({
                //   assets: data.assets,
                //   statistics: {
                //     ...statistics.value,
                //     [currentPeriod.value]: data.statistics
                //   }
                // })

                // 模拟 API 调用延迟
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                console.error('刷新数据失败:', error)
            } finally {
                isRefreshing.value = false
            }
        }

        // 获取订单数据
        const fetchOrders = async () => {
            loading.value = true
            try {
                await wsStore.subscribeOrders({
                    instType: 'SPOT',
                    onData: (message) => {
                        console.log('现货订单数据更新:', message)
                    }
                })
                await wsStore.subscribeOrders({
                    instType: 'SWAP',
                    onData: (message) => {
                        console.log('永续订单数据更新:', message)
                    }
                })
            } catch (error) {
                console.error('获取订单数据失败:', error)
            } finally {
                loading.value = false
            }
        }

        // 组件挂载时获取订单数据
        onMounted(() => {
            fetchOrders()
        })

        return {
            // 资产数据
            assets,
            // 通信状态
            networkStatus,
            publicChannelStatus,
            privateChannelStatus,
            businessChannelStatus,
            isAllConnected,
            // 统计数据
            statsPeriod: currentPeriod,
            stats,
            // 币种数据
            currencyStore,
            // 方法
            handlePeriodChange,
            handleRefresh,
            isRefreshing,
            spotSearch,
            swapSearch,
            filteredSpotCurrencies,
            filteredSwapCurrencies,
            router,
            columns,
            loading,
            filteredOrders,
            formatNumber,
            formatTime,
            getOrderTypeColor,
            getOrderTypeText,
        }
    }
})
</script>

<style lang="scss" scoped>
:deep(.ant-btn-link) {
    color: var(--text-secondary) !important;

    &:hover {
        color: var(--primary-color) !important;
    }

    &:active {
        color: color-mix(in srgb, var(--primary-color) 80%, black) !important;
    }
}

:deep(.ant-radio-button-wrapper) {
    @apply bg-transparent border-none text-dark-200 !important;

    &:not(:first-child)::before {
        @apply hidden;
    }

    &.ant-radio-button-wrapper-checked {
        @apply bg-dark-300 text-white !important;
    }
}

.heartbeat {
    @apply w-2 h-2 rounded-full bg-dark-300;
    animation: none;
}

.heartbeat.active {
    @apply bg-primary;
    animation: heartbeat 1s ease-in-out infinite;
}

@keyframes heartbeat {
    0% {
        transform: scale(0.75);
        opacity: 0.8;
    }

    20% {
        transform: scale(1);
        opacity: 1;
    }

    40% {
        transform: scale(0.75);
        opacity: 0.8;
    }

    60% {
        transform: scale(1);
        opacity: 1;
    }

    80% {
        transform: scale(0.75);
        opacity: 0.8;
    }

    100% {
        transform: scale(0.75);
        opacity: 0.8;
    }
}

.refresh-btn {
    @apply w-8 h-8 flex items-center justify-center !important;

    &:hover .anticon {
        color: var(--primary-color) !important;
    }
}

:deep(.refresh-btn .anticon) {
    @apply text-base;
    color: var(--text-secondary);
    transition: color 0.3s ease;
}

/* 自定义滚动条样式 */
.h-full {
    &::-webkit-scrollbar {
        @apply w-2;
    }

    &::-webkit-scrollbar-track {
        background-color: var(--bg-color);
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
        @apply rounded-full;

        &:hover {
            background-color: var(--text-secondary);
        }
    }
}

/* 币种列表容器样式 */
.currency-list-container {
    @apply h-[300px] overflow-y-auto px-4 py-2 relative;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
        @apply w-1;
    }

    &::-webkit-scrollbar-track {
        background-color: var(--card-bg);
        @apply rounded-full;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
        @apply rounded-full;

        &:hover {
            background-color: var(--text-secondary);
        }
    }

    /* Firefox 滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--card-bg);
}

/* 加载和空状态容器 */
.flex.flex-col.items-center.justify-center.h-full {
    @apply animate-fade-in;
}

/* 加载动画 */
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}

/* 搜索框样式 */
:deep(.ant-input-search) {
    .ant-input {
        @apply bg-dark-500 border-dark-300 text-dark-100;

        &::placeholder {
            @apply text-dark-200;
        }

        &:hover,
        &:focus {
            @apply border-primary;
        }
    }

    .ant-input-search-button {
        @apply bg-dark-300 border-dark-300 text-dark-100 transition-colors;

        &:hover {
            @apply bg-dark-200 border-dark-200;
        }
    }
}

/* 空状态图标动画 */
.text-2xl.text-dark-300 {
    @apply transition-transform;

    &:hover {
        @apply transform scale-110;
    }
}

/* 加载状态自定义 */
:deep(.ant-spin) {
    .ant-spin-dot-item {
        @apply bg-primary;
    }
}

/* 币种网格布局 */
.currency-grid {
    @apply grid grid-cols-3 gap-3;
}

/* 币种项样式 */
.currency-item {
    @apply flex items-center gap-1.5 px-3 py-2 rounded-md transition-all cursor-pointer;
    background-color: var(--currency-item-bg);

    &:hover {
        @apply shadow-lg shadow-black/20 transform scale-[1.02];
        background-color: var(--currency-item-hover);

        .currency-symbol {
            color: var(--primary-color);
        }
    }
}

.currency-symbol {
    @apply text-sm font-medium transition-colors;
    color: var(--text-color);
}

.currency-pair {
    @apply text-xs;
    color: var(--text-secondary);
}

/* 搜索框样式 */
:deep(.ant-input-search) {
    .ant-input {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;

        &::placeholder {
            color: var(--input-placeholder) !important;
        }

        &:hover,
        &:focus {
            border-color: var(--primary-color) !important;
        }
    }

    .ant-input-search-button {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--text-color) !important;

        &:hover {
            background-color: var(--bg-hover) !important;
            border-color: var(--primary-color) !important;
            color: var(--primary-color) !important;
        }
    }
}

/* 总资产数字样式 */
.total-assets {
    color: var(--text-color) !important;
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
        padding: 8px 16px !important;
        position: sticky;
        top: 0;
        z-index: 2;

        &::before {
            display: none;
        }
    }

    .ant-table-tbody>tr>td {
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.3s;
        background-color: transparent;
        color: var(--text-color);
        padding: 8px 16px !important;
    }

    .ant-table-tbody>tr:hover>td {
        background-color: var(--dark-500) !important;
    }
}

/* 隐藏滚动条占位列 */
:deep(.orders-table) {
    .ant-table-cell-scrollbar {
        display: none !important;
    }

    .ant-table-header {
        margin-right: 0 !important;
        overflow-y: hidden !important;
    }

    .ant-table-body {
        overflow-y: auto !important;
    }
}

/* 自定义滚动条样式 */
.orders-table {
    :deep(.ant-table-body) {
        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-track {
            background: var(--bg-color);
        }

        &::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 3px;

            &:hover {
                background: var(--text-secondary);
            }
        }
    }
}

.text-success {
    color: var(--success-color) !important;
}

.text-danger {
    color: var(--danger-color) !important;
}
</style>