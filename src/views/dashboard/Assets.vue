<template>
    <div class="assets h-full overflow-auto p-5">
        <!-- 页面标题 -->
        <div class="page-header mb-5">
            <h2 class="text-xl font-medium text-dark-100">资产</h2>
        </div>

        <!-- 资产概览卡片 -->
        <div class="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
            <!-- 总资产 -->
            <div class="bg-dark-400 rounded-lg border border-dark-300 p-4">
                <div class="flex flex-col gap-1">
                    <span class="text-sm text-dark-200">总资产 (USDT)</span>
                    <span class="text-2xl font-mono text-dark-100">{{ formatNumber(assets.total) }}</span>
                </div>
            </div>

            <!-- 可用余额 -->
            <div class="bg-dark-400 rounded-lg border border-dark-300 p-4">
                <div class="flex flex-col gap-1">
                    <span class="text-sm text-dark-200">可用余额 (USDT)</span>
                    <span class="text-2xl font-mono text-dark-100">{{ formatNumber(assets.available) }}</span>
                </div>
            </div>

            <!-- 持仓数量 -->
            <div class="bg-dark-400 rounded-lg border border-dark-300 p-4">
                <div class="flex flex-col gap-1">
                    <span class="text-sm text-dark-200">资产数量</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-2xl font-mono text-dark-100">{{ positionsData.count || 0 }}</span>
                        <span class="text-xs text-dark-200">个</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 资产列表 -->
        <div class="bg-dark-400 rounded-lg border border-dark-300 mb-5">
            <div class="flex justify-between items-center p-4 border-b border-dark-300">
                <h3 class="text-base font-medium text-dark-100">资产列表</h3>
                <div class="flex items-center gap-2">
                    <a-input-search v-model:value="assetSearchText" placeholder="搜索币种" class="w-40 search-btn"
                        size="small" />
                </div>
            </div>

            <!-- 资产列表内容 -->
            <div class="assets-table">
                <a-table :dataSource="filteredAssets" :columns="assetColumns" :loading="isLoading" :pagination="false"
                    size="small">
                    <template #bodyCell="{ column, record }">
                        <!-- 币种列 -->
                        <template v-if="column.key === 'ccy'">
                            <span class="font-medium">{{ record.ccy }}</span>
                        </template>

                        <!-- 总额列 -->
                        <template v-if="column.key === 'eq'">
                            <span class="font-mono">{{ formatNumber(record.eq, 8) }}</span>
                        </template>

                        <!-- 可用余额列 -->
                        <template v-if="column.key === 'availBal'">
                            <span class="font-mono">{{ formatNumber(record.availBal, 8) }}</span>
                        </template>

                        <!-- 冻结金额列 -->
                        <template v-if="column.key === 'frozenBal'">
                            <span class="font-mono">{{ formatNumber(record.frozenBal, 8) }}</span>
                        </template>

                        <!-- 美元价值列 -->
                        <template v-if="column.key === 'eqUsd'">
                            <span class="font-mono">{{ formatNumber(record.eqUsd, 2) }} USDT</span>
                        </template>
                    </template>
                </a-table>
            </div>
        </div>

        <!-- 持仓列表 -->
        <div class="bg-dark-400 rounded-lg border border-dark-300">
            <div class="flex justify-between items-center p-4 border-b border-dark-300">
                <h3 class="text-base font-medium text-dark-100">永续合约持仓</h3>
                <div class="flex items-center gap-2">
                    <a-input-search v-model:value="searchText" placeholder="搜索币种" class="w-40 search-btn"
                        size="small" />
                    <a-button type="link" size="small" @click="handleRefresh" class="refresh-btn">
                        <template #icon>
                            <sync-outlined :spin="isRefreshing" />
                        </template>
                    </a-button>
                </div>
            </div>

            <!-- 持仓列表内容 -->
            <div class="positions-table">
                <a-table :dataSource="filteredPositions" :columns="columns" :loading="isLoading" :pagination="false"
                    size="small">
                    <template #bodyCell="{ column, record }">
                        <!-- 币种列 -->
                        <template v-if="column.key === 'instId'">
                            <span class="font-medium">{{ record.instId.replace('-USDT-SWAP', '') }}</span>
                            <span class="text-xs text-dark-200 ml-1">永续</span>
                        </template>

                        <!-- 持仓方向列 -->
                        <template v-if="column.key === 'posSide'">
                            <a-tag :color="record.posSide === 'long' ? 'success' : 'error'">
                                {{ record.posSide === 'long' ? '多' : '空' }}
                            </a-tag>
                        </template>

                        <!-- 持仓数量列 -->
                        <template v-if="column.key === 'pos'">
                            <span class="font-mono">{{ formatNumber(record.pos) }}</span>
                        </template>

                        <!-- 开仓均价列 -->
                        <template v-if="column.key === 'avgPx'">
                            <span class="font-mono">{{ formatNumber(record.avgPx, 4) }}</span>
                        </template>

                        <!-- 未实现盈亏列 -->
                        <template v-if="column.key === 'upl'">
                            <span class="font-mono"
                                :class="parseFloat(record.upl) >= 0 ? 'text-primary' : 'text-red-500'">
                                {{ formatNumber(record.upl, 4) }}
                            </span>
                        </template>

                        <!-- 收益率列 -->
                        <template v-if="column.key === 'uplRatio'">
                            <span class="font-mono"
                                :class="parseFloat(record.uplRatio) >= 0 ? 'text-primary' : 'text-red-500'">
                                {{ formatPercent(record.uplRatio) }}
                            </span>
                        </template>

                        <!-- 杠杆倍数列 -->
                        <template v-if="column.key === 'lever'">
                            <span class="font-mono">{{ record.lever }}x</span>
                        </template>

                        <!-- 保证金率列 -->
                        <template v-if="column.key === 'mgnRatio'">
                            <span class="font-mono">{{ formatPercent(record.mgnRatio) }}</span>
                        </template>

                        <!-- 强平价格列 -->
                        <template v-if="column.key === 'liqPx'">
                            <span class="font-mono">{{ formatNumber(record.liqPx, 4) }}</span>
                        </template>
                    </template>
                </a-table>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useWebSocketStore } from '@/store/websocket'
import { useOverviewStore } from '@/store/overview'
import { SyncOutlined } from '@ant-design/icons-vue'

export default defineComponent({
    name: 'AssetsPage',
    components: {
        SyncOutlined
    },
    setup() {
        const wsStore = useWebSocketStore()
        const overviewStore = useOverviewStore()
        const searchText = ref('')
        const assetSearchText = ref('')
        const isRefreshing = ref(false)
        const isLoading = ref(false)

        // 资产列表列定义
        const assetColumns = [
            {
                title: '币种',
                key: 'ccy',
                width: 100,
                fixed: 'left',
            },
            {
                title: '总额',
                key: 'eq',
                width: 150,
            },
            {
                title: '可用余额',
                key: 'availBal',
                width: 150,
            },
            {
                title: '冻结金额',
                key: 'frozenBal',
                width: 150,
            },
            {
                title: '美元价值',
                key: 'eqUsd',
                width: 150,
            }
        ]

        // 持仓列表列定义
        const columns = [
            {
                title: '币种',
                key: 'instId',
                width: 120,
            },
            {
                title: '方向',
                key: 'posSide',
                width: 80,
            },
            {
                title: '持仓数量',
                key: 'pos',
                width: 120,
            },
            {
                title: '开仓均价',
                key: 'avgPx',
                width: 120,
            },
            {
                title: '未实现盈亏',
                key: 'upl',
                width: 120,
            },
            {
                title: '收益率',
                key: 'uplRatio',
                width: 100,
            },
            {
                title: '杠杆',
                key: 'lever',
                width: 80,
            },
            {
                title: '保证金率',
                key: 'mgnRatio',
                width: 100,
            },
            {
                title: '强平价格',
                key: 'liqPx',
                width: 120,
            }
        ]

        // 资产数据
        const assets = computed(() => overviewStore.assets)

        // 账户资产列表
        const assetsList = computed(() => {
            const accountData = wsStore.getAccountData;
            return accountData?.details || [];
        })

        // 过滤后的资产列表
        const filteredAssets = computed(() => {
            if (!assetSearchText.value) {
                return assetsList.value;
            }
            const search = assetSearchText.value.toLowerCase();
            return assetsList.value.filter(item =>
                item.ccy.toLowerCase().includes(search)
            );
        })

        // 持仓数据
        const positionsData = computed(() => wsStore.positionsData)

        // 过滤后的持仓列表
        const filteredPositions = computed(() => {
            if (!searchText.value) {
                return positionsData.value.SWAP
            }
            const search = searchText.value.toLowerCase()
            return positionsData.value.SWAP.filter(item =>
                item.instId.toLowerCase().includes(search)
            )
        })

        // 刷新数据
        const handleRefresh = async () => {
            isRefreshing.value = true
            try {
                // TODO: 实现数据刷新逻辑
                await new Promise(resolve => setTimeout(resolve, 1000))
            } finally {
                isRefreshing.value = false
            }
        }

        // 格式化数字
        const formatNumber = (value, decimals = 2) => {
            if (!value) return '0'
            return parseFloat(value).toFixed(decimals)
        }

        // 格式化百分比
        const formatPercent = (value) => {
            if (!value) return '0%'
            return (parseFloat(value) * 100).toFixed(2) + '%'
        }

        return {
            searchText,
            assetSearchText,
            isRefreshing,
            isLoading,
            columns,
            assetColumns,
            assets,
            assetsList,
            filteredAssets,
            positionsData,
            filteredPositions,
            handleRefresh,
            formatNumber,
            formatPercent
        }
    }
})
</script>

<style lang="scss" scoped>
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

/* 刷新按钮样式 */
:deep(.refresh-btn) {
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

/* 表格样式自定义 */
:deep(.positions-table),
:deep(.assets-table) {
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
        @apply bg-dark-300 border-dark-300 text-dark-100;

        &:hover {
            @apply bg-dark-200 border-dark-200;
        }
    }
}

/* 搜索按钮样式 */
:deep(.search-btn) {
    .ant-input-search-button {
        background-color: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        color: #fff !important;

        &:hover {
            background-color: var(--primary-color-light) !important;
            border-color: var(--primary-color-light) !important;
        }
    }
}
</style>