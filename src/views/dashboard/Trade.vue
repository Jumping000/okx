<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="trade h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="trade-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">交易</h2>
                    <a-select v-model:value="selectedCurrency" style="width: 180px" :loading="currencyStore.loading"
                        @change="handleCurrencyChange" show-search :filter-option="filterCurrencyOption"
                        placeholder="搜索币种" class="currency-select">
                        <a-select-option v-for="currency in currentCurrencies" :key="currency.instId"
                            :value="currency.instId">
                            <div class="flex items-center justify-between">
                                <span>{{ currency.instId.replace('-SWAP', '').replace('-USDT', '') }}</span>
                                <span class="text-dark-200 text-xs">
                                    {{ currency.instId.includes('-SWAP') ? '永续' : '现货' }}
                                </span>
                            </div>
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
                <div class="col-span-9 grid grid-cols-7 gap-4">
                    <!-- K线和行情区域 -->
                    <div class="col-span-4 space-y-4">
                        <!-- K线图区域 -->
                        <div class="bg-dark-400 rounded-lg border border-dark-300">
                            <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl font-medium text-dark-100">
                                            {{ selectedCurrency.replace('-SWAP', '').replace('-USDT', '') }}
                                        </span>
                                        <span class="text-sm px-2 py-0.5 rounded bg-dark-300 text-dark-200">
                                            {{ selectedCurrency.includes('-SWAP') ? '永续' : '现货' }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-2 ml-2">
                                        <span class="text-2xl font-semibold" :class="{
                                            'text-primary': Number(marketData.priceChangePercent) >= 0,
                                            'text-red-500': Number(marketData.priceChangePercent) < 0
                                        }">
                                            ${{ marketData.lastPrice }}
                                        </span>
                                        <span class="text-sm px-2 py-0.5 rounded" :class="{
                                            'bg-primary/10 text-primary': Number(marketData.priceChangePercent) >= 0,
                                            'bg-red-500/10 text-red-500': Number(marketData.priceChangePercent) < 0
                                        }">
                                            {{ Number(marketData.priceChangePercent) >= 0 ? '+' : '' }}{{ marketData.priceChangePercent }}%
                                        </span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <!-- K线周期选择 -->
                                    <a-select v-model:value="selectedPeriod" style="width: 120px"
                                        @change="handlePeriodChange" class="period-select">
                                        <a-select-option v-for="period in candlePeriods" :key="period.value"
                                            :value="period.value">
                                            {{ period.label }}
                                        </a-select-option>
                                    </a-select>
                                </div>
                            </div>
                            <div class="h-[400px] px-4 pb-4">
                                <div v-if="candleData.length" class="h-full">
                                    <div class="h-full rounded border border-dark-300 overflow-hidden">
                                        <KlineChart :data="candleData" :theme="theme" :inst-id="selectedCurrency"
                                            :period="selectedPeriod" />
                                    </div>
                                </div>
                                <div v-else class="h-full flex items-center justify-center">
                                    <a-spin />
                                </div>
                            </div>
                        </div>

                        <!-- 当前行情 -->
                        <div class="bg-dark-400 rounded-lg border border-dark-300 p-3">
                            <div class="grid grid-cols-4 gap-6">
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">最新价</div>
                                    <div class="text-xl font-medium text-primary">${{ marketData.lastPrice }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h涨跌</div>
                                    <div class="text-xl font-medium" :class="{
                                        'text-red-500': Number(marketData.priceChangePercent) < 0,
                                        'text-primary': Number(marketData.priceChangePercent) >= 0
                                    }">
                                        {{ marketData.priceChangePercent }}%
                                    </div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h高</div>
                                    <div class="text-xl font-medium text-dark-100">${{ marketData.high24h }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-dark-200 mb-1">24h低</div>
                                    <div class="text-xl font-medium text-dark-100">${{ marketData.low24h }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 交易操作区 -->
                    <div class="col-span-3">
                        <div class="bg-dark-400 rounded-lg border border-dark-300 h-full">
                            <div class="p-4">
                                <div class="flex flex-col gap-4">
                                    <!-- 合约专属设置 -->
                                    <template v-if="tradeType === 'SWAP'">
                                        <!-- 保证金模式 -->
                                        <div class="space-y-2">
                                            <div class="flex items-center justify-between">
                                                <div class="text-sm text-dark-200">保证金模式</div>
                                                <div class="flex-1 ml-4">
                                                    <a-radio-group v-model:value="marginMode" button-style="solid"
                                                        class="w-full">
                                                        <a-radio-button value="cross"
                                                            class="w-1/2 text-center">全仓</a-radio-button>
                                                        <a-radio-button value="isolated"
                                                            class="w-1/2 text-center">逐仓</a-radio-button>
                                                    </a-radio-group>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 杠杆倍数选择器 -->
                                        <div class="space-y-2">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-dark-200">杠杆倍数</span>
                                                <template v-if="marginMode === 'isolated'">
                                                    <!-- 逐仓模式：买卖方向可以设置不同杠杆 -->
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs text-dark-200">买入</span>
                                                        <a-select v-model:value="longLeverage" style="width: 80px"
                                                            class="leverage-select" :options="leverageOptions" />
                                                        <span class="text-xs text-dark-200">卖出</span>
                                                        <a-select v-model:value="shortLeverage" style="width: 80px"
                                                            class="leverage-select" :options="leverageOptions" />
                                                    </div>
                                                </template>
                                                <template v-else>
                                                    <!-- 全仓模式：统一杠杆 -->
                                                    <a-select v-model:value="leverage" style="width: 120px"
                                                        class="leverage-select" :options="leverageOptions" />
                                                </template>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 交易类型选择 -->
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between">
                                            <div class="text-sm text-dark-200">交易类型</div>
                                            <div class="flex-1 ml-4">
                                                <a-radio-group v-model:value="orderType" button-style="solid"
                                                    class="w-full">
                                                    <a-radio-button value="limit"
                                                        class="w-1/3 text-center">限价</a-radio-button>
                                                    <a-radio-button value="market"
                                                        class="w-1/3 text-center">市价</a-radio-button>
                                                    <a-radio-button value="stopLimit"
                                                        class="w-1/3 text-center">止盈止损</a-radio-button>
                                                </a-radio-group>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 止盈止损类型选择 -->
                                    <template v-if="orderType === 'stopLimit'">
                                        <div class="space-y-2">
                                            <div class="flex items-center justify-between">
                                                <div class="text-sm text-dark-200">触发方式</div>
                                                <div class="flex-1 ml-4">
                                                    <a-radio-group v-model:value="stopType" button-style="solid"
                                                        class="w-full">
                                                        <a-radio-button value="single"
                                                            class="w-1/2 text-center">单向止盈止损</a-radio-button>
                                                        <a-radio-button value="double"
                                                            class="w-1/2 text-center">双向止盈止损</a-radio-button>
                                                    </a-radio-group>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 触发方式选择 -->
                                        <div class="space-y-2">
                                            <div class="flex items-center justify-between">
                                                <div class="text-sm text-dark-200">触发类型</div>
                                                <div class="flex-1 ml-4">
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

                                        <!-- 可开数量显示
                                        <div class="flex justify-between items-center text-sm">
                                            <span class="text-dark-200">可开数量</span>
                                            <div class="flex items-center gap-2">
                                                <span class="text-dark-100">14.6</span>
                                                <span class="text-dark-200">张</span>
                                            </div>
                                        </div> -->
                                    </div>

                                    <!-- 交易按钮 -->
                                    <div class="space-y-4">
                                        <!-- 现货交易按钮 -->
                                        <template v-if="tradeType === 'SPOT'">
                                            <div class="grid grid-cols-2 gap-4">
                                                <a-button type="primary" class="h-10"
                                                    style="background-color: #00b96b; border-color: #00b96b;"
                                                    @click="SubmitTrade('SPOT', 'buy', '')" :loading="loading"
                                                    :disabled="orderType === 'stopLimit' || loading">
                                                    {{ orderType === 'stopLimit' ? '止盈' : '买入' }}
                                                </a-button>
                                                <a-button type="primary" danger class="h-10"
                                                    style="background-color: #ff4d4f; border-color: #ff4d4f;"
                                                    @click="SubmitTrade('SPOT', 'sell', '')" :loading="loading"
                                                    :disabled="orderType === 'stopLimit' || loading">
                                                    {{ orderType === 'stopLimit' ? '止损' : '卖出' }}
                                                </a-button>
                                            </div>
                                        </template>

                                        <!-- 合约交易按钮 -->
                                        <template v-else>
                                            <!-- 交易方向选择 -->
                                            <div class="space-y-4">
                                                <div class="grid grid-cols-1 gap-2">
                                                    <!-- 开仓/平仓选择 -->
                                                    <a-radio-group v-model:value="positionType" button-style="solid"
                                                        class="w-full" :disabled="orderType === 'stopLimit'">
                                                        <a-radio-button value="open"
                                                            class="w-1/2 text-center">开仓</a-radio-button>
                                                        <a-radio-button value="close"
                                                            class="w-1/2 text-center">平仓</a-radio-button>
                                                    </a-radio-group>
                                                    <!-- 多空方向选择 -->
                                                    <!-- <a-radio-group v-model:value="direction" button-style="solid"
                                                        class="w-full" :disabled="orderType === 'stopLimit'">
                                                        <a-radio-button value="long" class="w-1/2 text-center">
                                                            <span
                                                                :class="{ 'text-primary': direction === 'long' }">多</span>
                                                        </a-radio-button>
                                                        <a-radio-button value="short" class="w-1/2 text-center">
                                                            <span
                                                                :class="{ 'text-red-500': direction === 'short' }">空</span>
                                                        </a-radio-button>
                                                    </a-radio-group> -->
                                                </div>

                                                <!-- 交易按钮 -->
                                                <!-- <a-button type="primary" class="w-full h-10" :style="{
                                                    backgroundColor: direction === 'long' ? '#00b96b' : '#ff4d4f',
                                                    borderColor: direction === 'long' ? '#00b96b' : '#ff4d4f'
                                                }" @click="SubmitTrade('SWAP', positionType === 'open' ? 'buy' : 'sell', direction)"
                                                    :disabled="orderType === 'stopLimit'">
                                                    {{ positionType === 'open' ? '开' : '平' }}{{ direction === 'long' ? '多' : '空' }}
                                                </a-button> -->
                                                <div class="grid grid-cols-2 gap-4">
                                                    <a-button type="primary" class="h-10"
                                                        style="background-color: #00b96b; border-color: #00b96b;"
                                                        @click="SubmitTrade('SWAP', positionType === 'open' ? 'buy' : 'sell', 'long')"
                                                        :loading="loading" :disabled="loading">
                                                        {{ positionType === 'open' ? '开' : '平' }}多
                                                    </a-button>
                                                    <a-button type="primary" danger class="h-10"
                                                        style="background-color: #ff4d4f; border-color: #ff4d4f;"
                                                        @click="SubmitTrade('SWAP', positionType === 'open' ? 'buy' : 'sell', 'short')"
                                                        :loading="loading" :disabled="loading">
                                                        {{ positionType === 'open' ? '开' : '平' }}空
                                                    </a-button>
                                                </div>
                                            </div>
                                        </template>
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
                                <div class="flex  justify-between items-center">
                                    <span class="text-sm text-dark-200">可用余额</span>
                                    <div class="flex items-baseline gap-2">
                                        <span
                                            class="text-base font-medium text-dark-100">{{ overviewStore.assets.available }}</span>
                                        <span class="text-xs text-dark-200">USDT</span>
                                    </div>
                                </div>
                                <div class="flex  justify-between items-center">
                                    <span class="text-sm text-dark-200">持仓数量</span>
                                    <div class="flex items-baseline gap-2">
                                        <span
                                            class="text-base font-medium text-dark-100">{{ overviewStore.assets.positionCount }}</span>
                                        <span class="text-xs text-dark-200">币种</span>
                                    </div>
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
                            <template v-if="wsStore.positionsData.SWAP.length">
                                <div class="space-y-2">
                                    <div v-for="position in wsStore.positionsData.SWAP" :key="position.posId"
                                        class="flex items-center justify-between p-2.5 rounded-lg border border-dark-300 hover:bg-dark-300 transition-colors">
                                        <div class="flex items-center gap-3">
                                            <div class="flex flex-col">
                                                <div class="flex items-center gap-2">
                                                    <span
                                                        class="font-medium">{{ position.instId.replace('-USDT-SWAP', '') }}</span>
                                                    <a-tag :color="position.posSide === 'long' ? 'success' : 'error'"
                                                        class="m-0 text-xs px-1.5 py-0">
                                                        {{ position.posSide === 'long' ? '多' : '空' }}
                                                    </a-tag>
                                                    <a-tag class="m-0 text-xs px-1.5 py-0">{{ position.lever }}X</a-tag>
                                                </div>
                                                <div class="flex items-center gap-2 mt-1">
                                                    <span class="text-xs text-dark-200">持仓:
                                                        {{ formatNumber(position.pos, 6) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <span class="text-sm font-medium"
                                                :class="parseFloat(position.upl) >= 0 ? 'text-primary' : 'text-red-500'">
                                                {{ formatNumber(position.upl, 6) }} USDT
                                            </span>
                                            <span class="text-xs mt-1"
                                                :class="parseFloat(position.uplRatio) >= 0 ? 'text-primary' : 'text-red-500'">
                                                {{ formatPercent(position.uplRatio) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <a-empty description="暂无持仓" class="text-dark-200" />
                            </template>
                        </div>
                    </div>

                    <!-- 当前资产 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-dark-300">
                            <h3 class="text-base font-medium text-dark-100">当前资产</h3>
                        </div>
                        <div class="p-4">
                            <template
                                v-if="wsStore.getAccountData?.validPositions?.filter(asset => parseFloat(asset.eqUsd) >= 0.01 && asset.ccy !== 'USDT')?.length">
                                <div class="space-y-3">
                                    <div v-for="asset in wsStore.getAccountData.details.filter(asset => parseFloat(asset.eqUsd) >= 0.01 && asset.ccy !== 'USDT')"
                                        :key="asset.ccy"
                                        class="flex items-center justify-between p-3 rounded-lg border border-dark-300 hover:bg-dark-300 transition-colors">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-base">{{ asset.ccy }}</span>
                                            <span class="text-xs text-dark-200">可用</span>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <span
                                                class="text-sm font-medium text-dark-100">{{ formatNumber(asset.eq, 6) }}</span>
                                            <span class="text-xs text-dark-200 mt-0.5">≈ ${{ formatNumber(asset.eqUsd,
                                                2) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <a-empty description="暂无资产" class="text-dark-200" />
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineOptions } from 'vue'
import { useCurrencyStore } from '@/store/currency'
import { useWebSocketStore } from '@/store/websocket'
import { useOverviewStore } from '@/store/overview'
import { MarketChannelType } from '@/utils/websocket'
import KlineChart from '@/components/KlineChart.vue'
import { message } from 'ant-design-vue'

// 定义组件选项
defineOptions({
    name: 'Trade'
})

// K线周期选项
const CANDLE_PERIODS = [
    { label: '1分钟', value: '1m' },
    { label: '3分钟', value: '3m' },
    { label: '5分钟', value: '5m' },
    { label: '15分钟', value: '15m' },
    { label: '30分钟', value: '30m' },
    { label: '1小时', value: '1H' },
    { label: '2小时', value: '2H' },
    { label: '4小时', value: '4H' },
    { label: '6小时', value: '6H' },
    { label: '12小时', value: '12H' },
    { label: '1天', value: '1D' },
    { label: '2天', value: '2D' },
    { label: '3天', value: '3D' },
    { label: '1周', value: '1W' },
    { label: '1月', value: '1M' },
    { label: '3月', value: '3M' },
]

// Store
const currencyStore = useCurrencyStore()
const wsStore = useWebSocketStore()
const overviewStore = useOverviewStore()


// 基础状态
const tradeType = ref('SPOT') // SPOT-现货，SWAP-永续合约
const selectedCurrency = ref('')
const orderType = ref('limit') // limit-限价委托，market-市价委托，stopLimit-止盈止损
const loading = ref(false) // 添加加载状态

// K线相关数据
const selectedPeriod = ref('1m') // 默认使用1分钟K线
const candleData = ref([])

// 交易表单数据
const price = ref(0) // 价格
const amount = ref(0) // 数量

// 止盈止损数据
const stopType = ref('single') // single-单向止盈止损，double-双向止盈止损
const triggerType = ref('mark') // mark-标记价格，new-最新价格，index-指数价格
const triggerPrice = ref(0) // 触发价格
const takeProfitPrice = ref(0) // 止盈触发价格
const stopLossPrice = ref(0) // 止损触发价格

// 合约专属数据
const marginMode = ref('cross') // cross-全仓, isolated-逐仓
const leverage = ref(20) // 全仓杠杆倍数
const longLeverage = ref(20) // 逐仓做多杠杆倍数
const shortLeverage = ref(20) // 逐仓做空杠杆倍数
const positionType = ref('open') // open-开仓, close-平仓
const direction = ref('long') // long-做多, short-做空

// 行情数据
const marketData = ref({
    lastPrice: '0.00',
    priceChangePercent: '0.00',
    high24h: '0.00',
    low24h: '0.00',
    volume24h: '0.00',
    timestamp: 0,
})

// 计算属性
const currentCurrencies = computed(() => {
    return currencyStore.currencies[tradeType.value] || []
})


// WebSocket 处理函数
const handleCandleUpdate = (message) => {
    if (!message.data || !Array.isArray(message.data)) return
    candleData.value = message.data.map(item => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
        volCcy: item[6],
        volCcyQuote: item[7],
        confirm: item[8],
    }))
}

const handleTickerUpdate = (message) => {
    if (!message.data || !Array.isArray(message.data) || !message.data[0]) return

    const ticker = message.data[0]
    marketData.value = {
        lastPrice: ticker.last || '0.00',
        priceChangePercent: ticker.open24h ?
            (((parseFloat(ticker.last) - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h)) * 100).toFixed(2) :
            '0.00',
        high24h: ticker.high24h || '0.00',
        low24h: ticker.low24h || '0.00',
        volume24h: ticker.volCcy24h || '0.00',
        timestamp: Date.now(),
    }
}

// WebSocket 订阅相关函数
const subscribeCandleData = async () => {
    if (!selectedCurrency.value) return

    try {
        await wsStore.subscribeCandleData({
            instId: selectedCurrency.value,
            candlePeriod: selectedPeriod.value,
            onData: handleCandleUpdate,
        })
        console.log(`已订阅 ${selectedCurrency.value} 的K线数据`)
    } catch (error) {
        console.error(`订阅 ${selectedCurrency.value} K线失败:`, error)
    }
}

const unsubscribeCandleData = () => {
    const currentInstId = selectedCurrency.value
    if (!currentInstId) return

    try {
        wsStore.unsubscribeCandleData({
            instId: currentInstId,
            candlePeriod: selectedPeriod.value,
        })
        console.log(`已取消订阅 ${currentInstId} 的K线数据`)
    } catch (error) {
        console.error(`取消订阅 ${currentInstId} K线失败:`, error)
    }
}

// 事件处理函数
const handlePeriodChange = async (period) => {
    const currentInstId = selectedCurrency.value
    if (!currentInstId) return

    try {
        unsubscribeCandleData()
        candleData.value = []
        selectedPeriod.value = period
        await subscribeCandleData()
    } catch (error) {
        console.error(`切换K线周期失败:`, error)
    }
}

const selectDefaultCurrency = async () => {
    if (!currentCurrencies.value.length) {
        await currencyStore.fetchCurrencies()
    }

    const currencies = currentCurrencies.value

    if (currencies.length > 0) {
        const suiCurrency = currencies.find(c =>
            c.instId.startsWith('SUI-') ||
            c.instId.includes('SUI-USDT')
        )

        if (suiCurrency) {
            selectedCurrency.value = suiCurrency.instId
        } else {
            selectedCurrency.value = currencies[0].instId
        }

        console.log('已选择币种:', selectedCurrency.value)
    } else {
        console.warn('当前交易类型下没有可用币种')
        selectedCurrency.value = ''
    }
}

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
        longLeverage.value = 20
        shortLeverage.value = 20
        positionType.value = 'open'
        direction.value = 'long'
    }

    // 选择默认币种
    await selectDefaultCurrency()
}

const handleCurrencyChange = async (value) => {
    console.log('选择的币种:', value)
    selectedCurrency.value = value
}

const filterCurrencyOption = (input, option) => {
    const searchText = input.toLowerCase()
    const currencyId = option.value.toLowerCase()
    const simplifiedId = currencyId
        .replace('-swap', '')
        .replace('-usdt', '')
    return simplifiedId.includes(searchText)
}

// 监听器
watch(selectedCurrency, async (newInstId, oldInstId) => {
    if (!newInstId && !oldInstId) return

    try {
        if (oldInstId) {
            console.log(`开始取消 ${oldInstId} 的所有订阅...`)

            wsStore.unsubscribeMarket({
                instId: oldInstId,
                channelType: MarketChannelType.TICKERS,
            })

            wsStore.unsubscribeCandleData({
                instId: oldInstId,
                candlePeriod: selectedPeriod.value,
            })

            candleData.value = []
            console.log(`已完成取消 ${oldInstId} 的所有订阅`)
        }

        if (newInstId) {
            console.log(`开始订阅 ${newInstId} 的所有数据...`)

            await wsStore.subscribeMarket({
                instId: newInstId,
                channelType: MarketChannelType.TICKERS,
                onData: handleTickerUpdate,
            })

            await wsStore.subscribeCandleData({
                instId: newInstId,
                candlePeriod: selectedPeriod.value,
                onData: handleCandleUpdate,
            })

            console.log(`已完成订阅 ${newInstId} 的所有数据`)
        }
    } catch (error) {
        console.error(`切换币种失败:`, error)
    }
})

// 生命周期钩子
onMounted(async () => {
    await selectDefaultCurrency()
})

onUnmounted(() => {
    const currentInstId = selectedCurrency.value
    if (!currentInstId) return

    try {
        console.log(`组件卸载：开始清理所有订阅...`)

        wsStore.unsubscribeMarket({
            instId: currentInstId,
            channelType: MarketChannelType.TICKERS,
        })

        wsStore.unsubscribeCandleData({
            instId: currentInstId,
            candlePeriod: selectedPeriod.value,
        })

        console.log(`组件卸载：已清理所有订阅`)
    } catch (error) {
        console.error('组件卸载：清理订阅失败:', error)
    }
})

// 杠杆倍数选项
const leverageOptions = [
    { value: 1, label: '1X' },
    { value: 2, label: '2X' },
    { value: 3, label: '3X' },
    { value: 5, label: '5X' },
    { value: 10, label: '10X' },
    { value: 20, label: '20X' },
    { value: 50, label: '50X' },
    { value: 100, label: '100X' },
]

// 主题配置
const theme = 'dark'

// K线周期选项
const candlePeriods = CANDLE_PERIODS
// 格式化数字
const formatNumber = (value, decimals = 2) => {
    if (!value) return '0'
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toFixed(decimals)
}

// 格式化百分比
const formatPercent = (value) => {
    if (!value) return '0%'
    return (parseFloat(value) * 100).toFixed(2) + '%'
}
// 处理精度
const processingAccuracy = (num, formatNum) => {
    try {
        // 将formatNum转换为字符串，并分割成整数部分和小数部分
        let parts = formatNum.toString().split('.');
        // 如果没有小数点，意味着不需要小数部分
        let decimalPlaces = 0;
        if (parts.length > 1) {
            // 否则，计算需要多少个小数位
            decimalPlaces = parts[1].length;
        }
        num = parseFloat(num);
        // 使用 toFixed 方法来格式化数字，确保它有指定数量的小数位
        let formatted = num.toFixed(decimalPlaces);
        // 解析回数字，以便去除不必要的尾随零
        formatted = parseFloat(formatted);
        // 如果结果是0，则直接返回"0"
        if (formatted === 0) {
            return "0";
        }
        // 如果原始的格式化结果是一个整数（即没有小数部分），我们不需要做额外的处理
        return formatted.toString();
    } catch (error) {
        console.error('格式化数字时出错:', error);
        return "0";
    }
}
/**
 * 处理交易
 * @param type 交易类型 SPOT-现货 SWAP-永续合约
 * @param side 方向 buy-买入/开仓 sell-卖出/平仓
 * @param posSide 持仓方向 long-多 short-空
 */
const SubmitTrade = async (type, side, posSide) => {
    if (loading.value) return; // 如果正在加载，直接返回
    loading.value = true; // 开始加载
    try {
        // 处理止盈止损订单
        if (orderType.value === 'stopLimit') {
            // 暂不处理 止盈止损
            return;
        }
        // 参数校验
        if (!selectedCurrency.value) {
            throw new Error('请选择交易币种')
        }
        // 获取当前选中币种的详细信息
        const currentCurrency = currencyStore.getCurrencyByName(type, selectedCurrency.value)
        console.log('当前选中币种:', currentCurrency)
        if (!currentCurrency) {
            throw new Error('未找到币种信息')
        }

        if (orderType.value === 'limit' && !price.value) {
            throw new Error('请输入交易价格')
        }

        if (!amount.value) {
            throw new Error('请输入交易数量')
        }

        // 检查数量精度
        const lotSz = parseFloat(currentCurrency.lotSz) // 下单数量精度
        const minSz = parseFloat(currentCurrency.minSz) // 最小下单数量
        if (type === 'SPOT') {
            if (amount.value <= minSz) {
                throw new Error(`下单数量不能小于等于 ${minSz} 币`)
            }
        } else if (type === 'SWAP') {
            if (amount.value < minSz) {
                throw new Error(`下单数量不能小于 ${minSz} 张`)
            }
        }

        // 检查价格精度
        if (orderType.value === 'limit') {
            const tickSz = Number(currentCurrency.tickSz) // 价格精度
            const priceDecimalPlaces = tickSz.toString().split('.')[1]?.length || 0
            price.value = parseFloat(price.value)
            price.value = price.value.toFixed(priceDecimalPlaces)
            if (price.value.toString().split('.')[1]?.length > priceDecimalPlaces) {
                throw new Error(`价格精度不能超过 ${priceDecimalPlaces} 位小数`)
            }
        }
        console.log(amount.value, lotSz);
        // 处理精度，确保我们能正确地处理小数值
        amount.value = processingAccuracy(amount.value, lotSz)
        console.log('处理后的数量:', amount.value);
        // 生成订单号
        // const ordId = generateOrdId()

        // 构建基础订单参数
        const baseOrderParams = {
            instId: selectedCurrency.value, // 产品ID，如 BTC-USDT
            tdMode: type === 'SWAP' ? marginMode.value : 'cash', // 交易模式 合约模式为marginMode.value（isolated 全仓  cross 逐仓） 现货模式为cash
            sz: String(amount.value), // 委托数量   
            // clOrdId: ordId, // 客户自定义订单ID
            // tag: String(Date.now()), // 订单标签
            side: side, // 订单方向 buy/sell
            ordType: orderType.value === 'limit' ? 'limit' : 'market', // 订单类型 limit-限价单 market-市价单
        }

        // 根据订单类型添加价格参数
        if (orderType.value === 'limit') {
            baseOrderParams.px = String(price.value)
        }

        // 现货交易
        if (type === 'SPOT') {
            // tgtCcy
            baseOrderParams.tgtCcy = 'base_ccy'
            console.log('发送现货交易订单:', baseOrderParams)
            // 调用WebSocket下单
            const response = await wsStore.placeOrder(baseOrderParams)
            console.log('现货下单响应:', response)
            if (response.code === '0') {
                message.success('下单成功')
            } else {
                throw new Error(response.msg || '下单失败')
            }
        }
        // 合约交易
        else if (type === 'SWAP') {
            // 构建合约订单参数
            const swapOrderParams = {
                ...baseOrderParams,
                posSide, // 持仓方向 long/short
                reduceOnly: false,
            }
            // 判断是否是空单 
            if (posSide === 'short') {
                // 空单 需将方向改为反转过来进行买入
                swapOrderParams.side = swapOrderParams.side === 'buy' ? 'sell' : 'buy';
            }
            console.log('发送合约交易订单:', swapOrderParams)
            // 调用WebSocket下单
            const response = await wsStore.placeOrder(swapOrderParams)
            console.log('合约下单响应:', response)
            if (response.code === '0') {
                message.success('下单成功')
            } else {
                throw new Error(response.msg || '下单失败')
            }
        }
    } catch (error) {
        console.error('交易失败:', error)
        message.error(error.message || '交易失败，请重试')
    } finally {
        loading.value = false; // 结束加载
    }
}
</script>

<style scoped>
.trade {
    display: flex;
    flex-direction: column;
    min-width: 1200px;
    background-color: var(--bg-color);
}

.trade-header {
    flex-shrink: 0;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.trade-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background-color: var(--bg-color);
}

/* 内容区最小宽度 */
.trade-content {
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
.trade-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.trade-scroll-container::-webkit-scrollbar-track {
    background: var(--bg-color);
}

.trade-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.trade-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Firefox 滚动条样式 */
.trade-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--bg-color);
}

/* 币种选择器样式优化 */
:deep(.currency-select) {
    .ant-select-selector {
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;
    }

    .ant-select-arrow {
        color: var(--text-secondary) !important;
    }

    .ant-select-selection-search-input {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;

        &::placeholder {
            color: var(--text-secondary) !important;
        }
    }

    .ant-select-selection-placeholder {
        color: var(--text-secondary) !important;
    }

    .ant-select-dropdown {
        background-color: var(--bg-color) !important;
        border: 1px solid var(--border-color) !important;

        .ant-select-item {
            padding: 8px 12px !important;
            color: var(--text-color) !important;

            &:hover {
                background-color: var(--bg-hover) !important;
            }

            &.ant-select-item-option-selected {
                background-color: var(--bg-hover) !important;
                color: var(--primary-color) !important;
            }
        }

        .ant-select-item-empty {
            color: var(--text-secondary) !important;
        }
    }
}

/* 交易输入框样式 */
:deep(.trade-input) {
    .ant-input-number-input {
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;

        &::placeholder {
            color: var(--text-secondary) !important;
        }
    }

    .ant-input-number-handler-wrap {
        background-color: var(--bg-hover) !important;
        border-color: var(--border-color) !important;

        .ant-input-number-handler {
            border-color: var(--border-color) !important;

            &:hover {

                .ant-input-number-handler-up-inner,
                .ant-input-number-handler-down-inner {
                    color: var(--primary-color) !important;
                }
            }

            .ant-input-number-handler-up-inner,
            .ant-input-number-handler-down-inner {
                color: var(--text-secondary) !important;
            }
        }
    }
}

/* Radio按钮组样式 */
:deep(.ant-radio-button-wrapper) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;
    height: 32px;
    line-height: 30px;
    position: relative;
    margin-right: -1px;

    &:not(:first-child)::before {
        content: '';
        @apply absolute left-0 top-0 bottom-0 w-[1px] opacity-50 transition-all;
        background-color: var(--border-color) !important;
        z-index: 1;
    }

    &:hover {
        background-color: var(--bg-hover) !important;
        z-index: 2;

        &::before {
            @apply opacity-0;
        }
    }

    &.ant-radio-button-wrapper-checked {
        background-color: var(--bg-hover) !important;
        color: var(--primary-color) !important;
        z-index: 3;
        border: 1px solid var(--primary-color) !important;

        &::before {
            @apply opacity-0;
        }

        &::after {
            content: '';
            @apply absolute inset-[-1px] border rounded !important;
            border-color: var(--primary-color) !important;
            z-index: 1;
        }

        &+.ant-radio-button-wrapper::before {
            @apply opacity-0;
        }

        &:hover {
            background-color: var(--bg-hover) !important;
            color: var(--primary-color) !important;
        }
    }

    /* 修复最后一个按钮的右边框 */
    &:last-child {
        margin-right: 0;
    }
}

/* 特殊处理触发类型的Radio按钮 */
:deep(.ant-radio-group) {
    @apply flex;

    .ant-radio-button-wrapper {
        @apply flex-1 justify-center;

        &.text-xs {
            height: 28px;
            line-height: 26px;
            padding: 0 4px;
        }
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
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;
    }

    .ant-select-arrow {
        color: var(--text-secondary) !important;
    }

    .ant-select-dropdown {
        background-color: var(--bg-color) !important;
        border: 1px solid var(--border-color) !important;

        .ant-select-item {
            color: var(--text-color) !important;

            &:hover {
                background-color: var(--bg-hover) !important;
            }

            &.ant-select-item-option-selected {
                background-color: var(--bg-hover) !important;
                color: var(--primary-color) !important;
            }
        }
    }
}

/* 移除滑块相关样式 */
:deep(.ant-slider) {
    display: none;
}

/* K线周期选择器样式 */
:deep(.period-select) {
    .ant-select-selector {
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;
        height: 32px !important;

        .ant-select-selection-item {
            line-height: 30px !important;
            color: var(--text-color) !important;
        }
    }

    .ant-select-arrow {
        color: var(--text-secondary) !important;
    }

    .ant-select-dropdown {
        background-color: var(--bg-color) !important;
        border: 1px solid var(--border-color) !important;

        .ant-select-item {
            color: var(--text-color) !important;
            padding: 6px 12px !important;

            &:hover {
                background-color: var(--bg-hover) !important;
            }

            &.ant-select-item-option-selected {
                background-color: var(--bg-hover) !important;
                color: var(--primary-color) !important;
            }
        }
    }
}

/* 图表容器样式 */
.chart-container {
    .market-info {
        border-bottom: 1px solid var(--border-color);
    }

    .market-info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
}

/* 加载状态样式 */
:deep(.ant-spin) {
    .ant-spin-dot-item {
        background-color: var(--primary-color) !important;
    }
}

/* 涨跌色块样式 */
.price-change {
    &.positive {
        @apply bg-primary/10 text-primary;
    }

    &.negative {
        @apply bg-red-500/10 text-red-500;
    }
}
</style>