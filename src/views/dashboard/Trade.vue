<template>
    <div class="trade h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="trade-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">交易</h2>
                    <a-select v-model:value="selectedCurrency" style="width: 180px" :loading="currencyStore.loading"
                        @change="handleCurrencyChange" class="currency-select">
                        <a-select-option v-for="currency in currentCurrencies" :key="currency.instId"
                            :value="currency.instId">
                            {{ currency.instId.replace('-SWAP', '') }}
                        </a-select-option>
                    </a-select>
                </div>
                <div class="trade-type-selector">
                    <a-radio-group v-model:value="tradeType" button-style="solid" @change="handleTradeTypeChange">
                        <a-radio-button value="SPOT">现货交易</a-radio-button>
                        <a-radio-button value="SWAP">永续合约</a-radio-button>
                    </a-radio-group>
                </div>
            </div>
        </div>

        <!-- 可滚动的内容区 -->
        <div class="trade-scroll-container">
            <div class="trade-content grid grid-cols-12 gap-4 p-4">
                <!-- 左侧主区域：K线和交易区 -->
                <div class="col-span-9 grid grid-cols-4 gap-4">
                    <!-- K线和行情区域 -->
                    <div class="col-span-3 space-y-4">
                        <!-- K线图区域 -->
                        <div class="bg-dark-400 rounded-lg border border-dark-300">
                            <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl font-medium text-dark-100">{{ selectedCurrency }}</span>
                                    <span class="text-sm text-dark-200">实时行情</span>
                                </div>
                                <div class="flex items-center gap-4">
                                    <span class="text-sm text-dark-200">刷新频率: 1s</span>
                                </div>
                            </div>
                            <div class="h-[560px] p-4">
                                <div
                                    class="h-full flex items-center justify-center border border-dashed border-dark-300 rounded">
                                    <span class="text-dark-200">K线图区域</span>
                                </div>
                            </div>
                        </div>

                        <!-- 当前行情 -->
                        <div class="bg-dark-400 rounded-lg border border-dark-300 p-4">
                            <div class="grid grid-cols-4 gap-6">
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">最新价</div>
                                    <div class="text-xl font-medium text-primary">$0.00</div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h涨跌</div>
                                    <div class="text-xl font-medium text-red-500">0.00%</div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h高</div>
                                    <div class="text-xl font-medium text-dark-100">$0.00</div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h低</div>
                                    <div class="text-xl font-medium text-dark-100">$0.00</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 交易操作区 -->
                    <div class="col-span-1">
                        <div class="bg-dark-400 rounded-lg border border-dark-300 h-full">
                            <div class="p-4">
                                <div class="flex flex-col gap-4">
                                    <!-- 合约专属设置 -->
                                    <template v-if="tradeType === 'SWAP'">
                                        <!-- 保证金模式 -->
                                        <div class="space-y-2">
                                            <div class="text-sm text-dark-200">保证金模式</div>
                                            <a-radio-group v-model:value="marginMode" button-style="solid"
                                                class="w-full">
                                                <a-radio-button value="cross"
                                                    class="w-1/2 text-center">全仓</a-radio-button>
                                                <a-radio-button value="isolated"
                                                    class="w-1/2 text-center">逐仓</a-radio-button>
                                            </a-radio-group>
                                        </div>

                                        <!-- 杠杆倍数选择器 -->
                                        <div class="space-y-2">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-dark-200">杠杆倍数</span>
                                                <a-select v-model:value="leverage" style="width: 120px"
                                                    class="leverage-select" :options="[
                                                        { value: 1, label: '1X' },
                                                        { value: 2, label: '2X' },
                                                        { value: 3, label: '3X' },
                                                        { value: 5, label: '5X' },
                                                        { value: 10, label: '10X' },
                                                        { value: 20, label: '20X' },
                                                        { value: 50, label: '50X' },
                                                        { value: 100, label: '100X' },
                                                    ]" />
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 交易类型选择 -->
                                    <div class="space-y-2">
                                        <div class="text-sm text-dark-200">交易类型</div>
                                        <div class="flex gap-2">
                                            <a-radio-group v-model:value="orderType" button-style="solid"
                                                class="flex-1">
                                                <a-radio-button value="limit"
                                                    class="flex-1 text-center">限价</a-radio-button>
                                                <a-radio-button value="market"
                                                    class="flex-1 text-center">市价</a-radio-button>
                                                <a-radio-button value="stopLimit"
                                                    class="flex-1 text-center">止盈止损</a-radio-button>
                                            </a-radio-group>
                                        </div>
                                    </div>

                                    <!-- 止盈止损类型选择 -->
                                    <template v-if="orderType === 'stopLimit'">
                                        <div class="space-y-2">
                                            <div class="text-sm text-dark-200">触发方式</div>
                                            <div class="flex gap-2">
                                                <a-radio-group v-model:value="stopType" button-style="solid"
                                                    class="w-full">
                                                    <a-radio-button value="single"
                                                        class="w-1/2 text-center">单向止盈止损</a-radio-button>
                                                    <a-radio-button value="double"
                                                        class="w-1/2 text-center">双向止盈止损</a-radio-button>
                                                </a-radio-group>
                                            </div>
                                        </div>

                                        <!-- 触发方式选择 -->
                                        <div class="space-y-2">
                                            <div class="text-sm text-dark-200">触发类型</div>
                                            <div class="flex gap-2">
                                                <a-radio-group v-model:value="triggerType" button-style="solid"
                                                    class="w-full">
                                                    <a-radio-button value="mark"
                                                        class="w-1/3 text-center text-xs">标记价格</a-radio-button>
                                                    <a-radio-button value="new"
                                                        class="w-1/3 text-center text-xs">最新价格</a-radio-button>
                                                    <a-radio-button value="index"
                                                        class="w-1/3 text-center text-xs">指数价格</a-radio-button>
                                                </a-radio-group>
                                            </div>
                                        </div>

                                        <!-- 止盈止损价格输入 -->
                                        <template v-if="stopType === 'single'">
                                            <div>
                                                <div class="flex justify-between items-center mb-1">
                                                    <span class="text-sm text-dark-200">触发价格</span>
                                                    <span class="text-sm text-dark-200">USDT</span>
                                                </div>
                                                <a-input-number v-model:value="triggerPrice" class="w-full trade-input"
                                                    :min="0" placeholder="请输入触发价格" />
                                                <div class="mt-1">
                                                    <span class="text-xs text-dark-200">触发后以市价委托</span>
                                                </div>
                                            </div>
                                        </template>

                                        <template v-else>
                                            <!-- 双向止盈止损价格输入 -->
                                            <div>
                                                <div class="flex justify-between items-center mb-1">
                                                    <span class="text-sm text-dark-200">止盈触发价格</span>
                                                    <span class="text-sm text-dark-200">USDT</span>
                                                </div>
                                                <a-input-number v-model:value="takeProfitPrice"
                                                    class="w-full trade-input" :min="0" placeholder="请输入止盈触发价格" />
                                                <div class="mt-1">
                                                    <span class="text-xs text-dark-200">触发后以市价委托</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="flex justify-between items-center mb-1">
                                                    <span class="text-sm text-dark-200">止损触发价格</span>
                                                    <span class="text-sm text-dark-200">USDT</span>
                                                </div>
                                                <a-input-number v-model:value="stopLossPrice" class="w-full trade-input"
                                                    :min="0" placeholder="请输入止损触发价格" />
                                                <div class="mt-1">
                                                    <span class="text-xs text-dark-200">触发后以市价委托</span>
                                                </div>
                                            </div>
                                        </template>
                                    </template>

                                    <!-- 价格和数量输入 -->
                                    <div class="space-y-3">
                                        <!-- 限价单价格输入 -->
                                        <template v-if="orderType === 'limit'">
                                            <div>
                                                <div class="flex justify-between items-center mb-1">
                                                    <span class="text-sm text-dark-200">价格</span>
                                                    <span class="text-sm text-dark-200">USDT</span>
                                                </div>
                                                <a-input-number v-model:value="price" class="w-full trade-input"
                                                    :min="0" placeholder="请输入价格" />
                                            </div>
                                        </template>

                                        <!-- 数量输入 -->
                                        <div>
                                            <div class="flex justify-between items-center mb-1">
                                                <span class="text-sm text-dark-200">数量</span>
                                                <span
                                                    class="text-sm text-dark-200">{{ tradeType === 'SWAP' ? '张' : selectedCurrency?.split('-')[0] }}</span>
                                            </div>
                                            <a-input-number v-model:value="amount" class="w-full trade-input" :min="0"
                                                placeholder="请输入数量" />
                                        </div>

                                        <!-- 可开数量显示 -->
                                        <div class="flex justify-between items-center text-sm">
                                            <span class="text-dark-200">可开数量</span>
                                            <div class="flex items-center gap-2">
                                                <span class="text-dark-100">14.6</span>
                                                <span class="text-dark-200">张</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 交易按钮 -->
                                    <div class="grid grid-cols-2 gap-4">
                                        <a-button type="primary" class="h-10"
                                            style="background-color: #00b96b; border-color: #00b96b;">
                                            {{ orderType === 'stopLimit' ? '止盈' : '买入' }}{{ tradeType === 'SWAP' ? '做多' : '' }}
                                        </a-button>
                                        <a-button type="primary" danger class="h-10">
                                            {{ orderType === 'stopLimit' ? '止损' : '卖出' }}{{ tradeType === 'SWAP' ? '做空' : '' }}
                                        </a-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧资产和订单区 -->
                <div class="col-span-3 space-y-4">
                    <!-- 资产信息 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                            <h3 class="text-base font-medium text-dark-100">账户资产</h3>
                            <a-button type="link" size="small" class="text-dark-200 hover:text-primary">
                                刷新
                            </a-button>
                        </div>
                        <div class="p-4">
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-dark-200">可用余额</span>
                                    <span class="text-base font-medium text-dark-100">0.00 USDT</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-dark-200">冻结金额</span>
                                    <span class="text-base font-medium text-dark-100">0.00 USDT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 持仓信息 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                            <h3 class="text-base font-medium text-dark-100">当前持仓</h3>
                        </div>
                        <div class="p-4">
                            <a-empty description="暂无持仓" class="text-dark-200" />
                        </div>
                    </div>

                    <!-- 订单信息 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                            <h3 class="text-base font-medium text-dark-100">当前订单</h3>
                        </div>
                        <div class="p-4">
                            <a-empty description="暂无订单" class="text-dark-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useCurrencyStore } from '@/store/currency'

export default defineComponent({
    name: 'TradePage',
    setup() {
        const currencyStore = useCurrencyStore()
        const tradeType = ref('SPOT') // SPOT-现货，SWAP-永续合约
        const selectedCurrency = ref('')
        const orderType = ref('limit') // limit-限价委托，market-市价委托，stopLimit-止盈止损

        // 交易表单数据
        const price = ref(0) // 价格
        const amount = ref(0) // 数量

        // 止盈止损数据
        const stopType = ref('single') // single-单向止盈止损，double-双向止盈止损
        const triggerType = ref('mark') // mark-标记价格，new-最新价格，index-指数价格

        // 单向止盈止损
        const triggerPrice = ref(0) // 触发价格

        // 双向止盈止损
        const takeProfitPrice = ref(0) // 止盈触发价格
        const stopLossPrice = ref(0) // 止损触发价格

        // 合约专属数据
        const marginMode = ref('cross') // cross-全仓, isolated-逐仓
        const leverage = ref(20) // 杠杆倍数

        // 获取当前交易类型下的所有币种
        const currentCurrencies = computed(() => {
            return currencyStore.currencies[tradeType.value] || []
        })

        // 选择默认币种
        const selectDefaultCurrency = async () => {
            // 如果当前交易类型下没有币种数据，先获取数据
            if (!currentCurrencies.value.length) {
                await currencyStore.fetchCurrencies()
            }

            // 获取当前交易类型的币种列表
            const currencies = currentCurrencies.value

            if (currencies.length > 0) {
                // 优先选择 BTC
                const btcCurrency = currencies.find(c =>
                    c.instId.startsWith('BTC-') ||
                    c.instId.includes('BTC-USDT')
                )

                if (btcCurrency) {
                    selectedCurrency.value = btcCurrency.instId
                } else {
                    // 如果没有BTC，则选择第一个币种
                    selectedCurrency.value = currencies[0].instId
                }

                console.log('已选择币种:', selectedCurrency.value)
            } else {
                console.warn('当前交易类型下没有可用币种')
                selectedCurrency.value = ''
            }
        }

        // 处理交易类型变化
        const handleTradeTypeChange = async () => {
            console.log('交易类型切换为:', tradeType.value)
            // 重置表单数据
            price.value = 0
            amount.value = 0
            orderType.value = 'limit'

            // 重置止盈止损数据
            stopType.value = 'single'
            triggerType.value = 'mark'
            triggerPrice.value = 0
            takeProfitPrice.value = 0
            stopLossPrice.value = 0

            // 重置合约专属数据
            if (tradeType.value === 'SWAP') {
                marginMode.value = 'cross'
                leverage.value = 20
            }

            // 选择默认币种
            await selectDefaultCurrency()
        }

        // 处理币种选择变化
        const handleCurrencyChange = (value) => {
            console.log('选择的币种:', value)
            // 这里可以添加获取选中币种的行情数据等操作
        }

        // 初始化数据
        onMounted(async () => {
            await selectDefaultCurrency()
        })

        return {
            currencyStore,
            tradeType,
            selectedCurrency,
            currentCurrencies,
            orderType,
            price,
            amount,
            stopType,
            triggerType,
            triggerPrice,
            takeProfitPrice,
            stopLossPrice,
            marginMode,
            leverage,
            handleTradeTypeChange,
            handleCurrencyChange
        }
    }
})
</script>

<style scoped>
.trade {
    display: flex;
    flex-direction: column;
}

.trade-header {
    flex-shrink: 0;
    background-color: #1a1a1a;
}

.trade-scroll-container {
    flex: 1;
    overflow-y: auto;
}

/* 自定义滚动条样式 */
.trade-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.trade-scroll-container::-webkit-scrollbar-track {
    background: #1a1a1a;
}

.trade-scroll-container::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
}

.trade-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #444;
}

/* Firefox 滚动条样式 */
.trade-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: #333 #1a1a1a;
}

/* 币种选择器样式 */
:deep(.currency-select) {
    .ant-select-selector {
        @apply bg-dark-400 border-dark-300 text-dark-100 !important;
    }

    .ant-select-arrow {
        @apply text-dark-200;
    }
}

/* 交易输入框样式 */
:deep(.trade-input) {
    .ant-input-number-input {
        @apply bg-dark-400 border-dark-300 text-dark-100 !important;
    }

    .ant-input-number-handler-wrap {
        @apply bg-dark-300 border-dark-300;
    }
}

/* Radio按钮组样式 */
:deep(.ant-radio-button-wrapper) {
    @apply bg-dark-400 border-dark-300 text-dark-200 transition-all !important;
    height: 32px;
    line-height: 30px;

    &:hover {
        @apply bg-dark-300 !important;
    }

    &.ant-radio-button-wrapper-checked {
        @apply bg-dark-300 text-primary border-primary shadow-none !important;

        &::before {
            @apply bg-primary !important;
        }

        &:hover {
            @apply bg-dark-300 text-primary !important;
        }
    }
}

/* 特殊处理触发类型的Radio按钮 */
:deep(.ant-radio-group .ant-radio-button-wrapper) {
    &.text-xs {
        height: 28px;
        line-height: 26px;
        padding: 0 4px;
    }
}

/* Checkbox样式 */
:deep(.ant-checkbox-wrapper) {
    @apply text-dark-200 !important;

    .ant-checkbox-checked .ant-checkbox-inner {
        @apply bg-primary border-primary !important;
    }
}

/* Empty状态样式 */
:deep(.ant-empty) {
    .ant-empty-image {
        @apply opacity-50;
    }

    .ant-empty-description {
        @apply text-dark-200;
    }
}

/* 添加杠杆选择器样式 */
:deep(.leverage-select) {
    .ant-select-selector {
        @apply bg-dark-400 border-dark-300 text-dark-100 !important;
    }

    .ant-select-arrow {
        @apply text-dark-200;
    }
}

/* 移除滑块相关样式 */
:deep(.ant-slider) {
    display: none;
}
</style>