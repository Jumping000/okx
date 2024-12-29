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
                            <span class="text-2xl text-white font-mono">{{ assets.total }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">可用余额</span>
                                <span class="text-sm text-dark-100 font-mono">{{ assets.available }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">持仓数量</span>
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
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <h3 class="text-base font-medium text-dark-100">最近交易</h3>
                        <a-button type="link" size="small">查看更多</a-button>
                    </div>
                    <div class="p-4">
                        <div class="space-y-4">
                            <div v-for="(trade, index) in recentTrades" :key="index"
                                class="flex justify-between items-center">
                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium text-dark-100">{{ trade.symbol }}</span>
                                    <span class="text-xs text-dark-200">{{ trade.time }}</span>
                                </div>
                                <div class="flex flex-col items-end gap-1">
                                    <span class="text-sm font-mono"
                                        :class="trade.type === 'buy' ? 'text-primary' : 'text-red-500'">
                                        {{ trade.type === 'buy' ? '买入' : '卖出' }} {{ trade.amount }}
                                    </span>
                                    <span class="text-xs text-dark-200">{{ trade.price }} USDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 账户统计 -->
                <div class="bg-dark-400 rounded-lg border border-dark-300">
                    <div class="flex justify-between items-center p-4 border-b border-dark-300">
                        <h3 class="text-base font-medium text-dark-100">账户统计</h3>
                        <div class="flex items-center gap-2">
                            <a-radio-group v-model:value="statsPeriod" size="small" class="bg-dark-500 p-[1px] rounded"
                                @change="handlePeriodChange">
                                <a-radio-button value="today">今日</a-radio-button>
                                <a-radio-button value="week">本周</a-radio-button>
                                <a-radio-button value="month">本月</a-radio-button>
                            </a-radio-group>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">交易次数</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg text-dark-100 font-mono">{{ stats.tradeCount }}</span>
                                    <span class="text-xs text-dark-200">次</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">交易金额</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg text-dark-100 font-mono">{{ stats.tradeVolume }}</span>
                                    <span class="text-xs text-dark-200">USDT</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">盈亏金额</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg font-mono"
                                        :class="stats.pnl >= 0 ? 'text-primary' : 'text-red-500'">
                                        {{ stats.pnl >= 0 ? '+' : '' }}{{ stats.pnl }}
                                    </span>
                                    <span class="text-xs text-dark-200">USDT</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">胜率</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg text-dark-100 font-mono">{{ stats.winRate }}</span>
                                    <span class="text-xs text-dark-200">%</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">平均持仓时间</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg text-dark-100 font-mono">{{ stats.avgHoldTime }}</span>
                                    <span class="text-xs text-dark-200">分钟</span>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm text-dark-200">手续费支出</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-lg text-dark-100 font-mono">{{ stats.fees }}</span>
                                    <span class="text-xs text-dark-200">USDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <div class="currency-grid">
                            <div v-for="item in filteredSpotCurrencies" :key="item.instId" class="currency-item"
                                :title="item.instId">
                                <span class="currency-symbol">{{ item.instId.replace('-USDT', '') }}</span>
                                <span class="currency-pair text-dark-200">/ USDT</span>
                            </div>
                        </div>
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
                        <div class="currency-grid">
                            <div v-for="item in filteredSwapCurrencies" :key="item.instId" class="currency-item"
                                :title="item.instId">
                                <span class="currency-symbol">{{ item.instId.replace('-USDT-SWAP', '') }}</span>
                                <span class="currency-pair text-dark-200">永续</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
    LockOutlined,
    WifiOutlined,
    CloudOutlined,
    ApiOutlined,
    SyncOutlined
} from '@ant-design/icons-vue'
import { useOverviewStore } from '@/store/overview'
import { useCurrencyStore } from '@/store/currency'

export default defineComponent({
    name: 'DashboardOverview',
    components: {
        LockOutlined,
        WifiOutlined,
        CloudOutlined,
        ApiOutlined,
        SyncOutlined,
    },
    setup() {
        const store = useOverviewStore()
        const currencyStore = useCurrencyStore()
        const { assets, connection, recentTrades, statistics, currentPeriod } = storeToRefs(store)
        const isRefreshing = ref(false)
        const spotSearch = ref('')
        const swapSearch = ref('')

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
            return statistics.value[currentPeriod.value]
        })

        // 时间段切换
        const handlePeriodChange = (period) => {
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

        return {
            // 资产数据
            assets,
            // 通信状态
            networkStatus,
            publicChannelStatus,
            privateChannelStatus,
            businessChannelStatus,
            isAllConnected,
            // 交易数据
            recentTrades,
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
        }
    }
})
</script>

<style scoped>
:deep(.ant-btn-link) {
    @apply text-dark-200 hover:text-white !important;
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
}

:deep(.refresh-btn .anticon) {
    @apply text-base;
}

/* 自定义滚动条样式 */
.h-full {
    &::-webkit-scrollbar {
        @apply w-2;
    }

    &::-webkit-scrollbar-track {
        @apply bg-dark-500;
    }

    &::-webkit-scrollbar-thumb {
        @apply bg-dark-300 rounded-full;

        &:hover {
            @apply bg-dark-200;
        }
    }
}

/* 币种列表容器样式 */
.currency-list-container {
    @apply h-[300px] overflow-y-auto px-4 py-2;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
        @apply w-1;
    }

    &::-webkit-scrollbar-track {
        @apply bg-dark-400 rounded-full;
    }

    &::-webkit-scrollbar-thumb {
        @apply bg-dark-300 rounded-full;

        &:hover {
            @apply bg-dark-200;
        }
    }

    /* Firefox 滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: theme('colors.dark.300') theme('colors.dark.400');
}

/* 币种网格布局 */
.currency-grid {
    @apply grid grid-cols-3 gap-3;
}

/* 币种项样式 */
.currency-item {
    @apply flex items-center gap-1.5 px-3 py-2 rounded-md bg-dark-500 hover:bg-dark-300 transition-all cursor-pointer;

    &:hover {
        @apply shadow-lg shadow-black/20 transform scale-[1.02];

        .currency-symbol {
            @apply text-primary;
        }
    }
}

.currency-symbol {
    @apply text-sm font-medium text-dark-100 transition-colors;
}

.currency-pair {
    @apply text-xs text-dark-200;
}

/* 搜索框样式 */
:deep(.ant-input-search) {
    .ant-input {
        @apply bg-dark-500 border-dark-300 text-dark-100;
    }

    .ant-input-search-button {
        @apply bg-dark-300 border-dark-300 text-dark-100;
    }
}
</style>