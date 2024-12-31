<template>
    <div class="trade h-full overflow-hidden">
        <!-- 固定头部 -->
        <div class="trade-header">
            <div class="page-header flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <h2>交易</h2>
                    <a-select
                        v-model:value="selectedCurrency"
                        style="width: 200px"
                        :loading="currencyStore.loading"
                        @change="handleCurrencyChange"
                    >
                        <a-select-option 
                            v-for="currency in currentCurrencies" 
                            :key="currency.instId" 
                            :value="currency.instId"
                        >
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
            <div class="trade-content grid grid-cols-12 gap-4">
                <!-- 左侧K线和交易区 -->
                <div class="col-span-9">
                    <div class="grid grid-cols-4 gap-4">
                        <!-- K线和行情区域 -->
                        <div class="col-span-3">
                            <!-- K线图区域 -->
                            <div class="bg-white p-4 rounded-lg h-[600px]">
                                <div class="h-full flex items-center justify-center border border-dashed border-gray-300 rounded">
                                    <span class="text-gray-500">K线图区域</span>
                                </div>
                            </div>
                            
                            <!-- 当前行情 -->
                            <div class="bg-white p-4 rounded-lg mt-4">
                                <h3 class="text-lg font-medium mb-4">当前行情</h3>
                                <div class="grid grid-cols-4 gap-4">
                                    <div class="text-center">
                                        <div class="text-gray-500">最新价</div>
                                        <div class="text-xl font-semibold text-green-500">$0.00</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-gray-500">24h涨跌</div>
                                        <div class="text-xl font-semibold text-red-500">0.00%</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-gray-500">24h高</div>
                                        <div class="text-xl font-semibold">$0.00</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-gray-500">24h低</div>
                                        <div class="text-xl font-semibold">$0.00</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 交易操作区 -->
                        <div class="col-span-1">
                            <div class="bg-white p-4 rounded-lg h-full">
                                <div class="flex gap-4 mb-4">
                                    <a-radio-group v-model:value="orderType" button-style="solid">
                                        <a-radio-button value="limit">限价</a-radio-button>
                                        <a-radio-button value="market">市价</a-radio-button>
                                    </a-radio-group>
                                </div>

                                <div class="space-y-4">
                                    <!-- 买入面板 -->
                                    <div class="space-y-4">
                                        <h4 class="text-green-600 font-medium">买入</h4>
                                        <div v-if="orderType === 'limit'">
                                            <div class="mb-2">
                                                <div class="text-gray-500 mb-1">价格</div>
                                                <a-input-number 
                                                    v-model:value="buyPrice"
                                                    style="width: 100%"
                                                    :min="0"
                                                    placeholder="输入价格"
                                                    addon-after="USDT"
                                                />
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <div class="text-gray-500 mb-1">数量</div>
                                            <a-input-number 
                                                v-model:value="buyAmount"
                                                style="width: 100%"
                                                :min="0"
                                                placeholder="输入数量"
                                            />
                                        </div>
                                        <a-button type="primary" class="w-full" style="background-color: #52c41a; border-color: #52c41a;">
                                            买入
                                        </a-button>
                                    </div>

                                    <div class="border-t border-gray-100 my-4"></div>

                                    <!-- 卖出面板 -->
                                    <div class="space-y-4">
                                        <h4 class="text-red-600 font-medium">卖出</h4>
                                        <div v-if="orderType === 'limit'">
                                            <div class="mb-2">
                                                <div class="text-gray-500 mb-1">价格</div>
                                                <a-input-number 
                                                    v-model:value="sellPrice"
                                                    style="width: 100%"
                                                    :min="0"
                                                    placeholder="输入价格"
                                                    addon-after="USDT"
                                                />
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <div class="text-gray-500 mb-1">数量</div>
                                            <a-input-number 
                                                v-model:value="sellAmount"
                                                style="width: 100%"
                                                :min="0"
                                                placeholder="输入数量"
                                            />
                                        </div>
                                        <a-button type="primary" danger class="w-full">
                                            卖出
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
                    <div class="bg-white p-4 rounded-lg">
                        <h3 class="text-lg font-medium mb-4">账户资产</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">可用余额</span>
                                <span class="font-medium">0.00 USDT</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">冻结金额</span>
                                <span class="font-medium">0.00 USDT</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 持仓信息 -->
                    <div class="bg-white p-4 rounded-lg">
                        <h3 class="text-lg font-medium mb-4">当前持仓</h3>
                        <a-empty description="暂无持仓" />
                    </div>
                    
                    <!-- 订单信息 -->
                    <div class="bg-white p-4 rounded-lg">
                        <h3 class="text-lg font-medium mb-4">当前订单</h3>
                        <a-empty description="暂无订单" />
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
        const orderType = ref('limit') // limit-限价委托，market-市价委托

        // 交易表单数据
        const buyPrice = ref(0)
        const buyAmount = ref(0)
        const sellPrice = ref(0)
        const sellAmount = ref(0)

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
            buyPrice.value = 0
            buyAmount.value = 0
            sellPrice.value = 0
            sellAmount.value = 0
            
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
            buyPrice,
            buyAmount,
            sellPrice,
            sellAmount,
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
    background-color: #f0f2f5;
}

.trade-header {
    flex-shrink: 0;
    padding: 24px 24px 0;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
}

.trade-scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px;
}

/* 自定义滚动条样式 */
.trade-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.trade-scroll-container::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 3px;
}

.trade-scroll-container::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}

.trade-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #999;
}

/* Firefox 滚动条样式 */
.trade-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: #ccc #f0f0f0;
}
</style>