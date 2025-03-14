<template>
    <div class="trade-container">
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
        <div class="trade-content px-4 py-3">
            <a-row :gutter="[16,16]">
                <a-col :span="20">
                    <!-- K线图区域 -->
                    <div class="kline-chart-container">
                        <div class="kline-charts-header flex justify-between items-center mb-2">
                            <div class="chart-count">
                                <span class="text-dark-100">K线图窗口 ({{ klineCharts.length }}/9)</span>
                            </div>
                            <div class="chart-actions">
                                <a-button 
                                    type="primary" 
                                    size="small" 
                                    @click="addKlineChart" 
                                    :disabled="klineCharts.length >= 9"
                                >
                                    <template #icon><plus-outlined /></template>
                                    新增窗口
                                </a-button>
                            </div>
                        </div>
                        <div class="kline-charts-container" :class="chartLayoutClass">
                            <transition-group name="chart-transition">
                                <div 
                                    v-for="(chart, index) in klineCharts" 
                                    :key="chart.id" 
                                    class="kline-chart-item"
                                    :class="{ 'fullscreen-item': chart.isFullscreen, 'hidden-item': hasFullscreenChart && !chart.isFullscreen }"
                                >
                                    <div class="kline-chart-header flex justify-between items-center p-2 border-b border-dark-300">
                                        <div class="flex items-center">
                                            <span class="text-sm mr-2">K线图 #{{ index + 1 }}</span>
                                            <a-tag color="blue" v-if="selectedCurrency">
                                                {{ formatCurrencyName(selectedCurrency) }}
                                            </a-tag>
                                        </div>
                                        <div class="flex items-center">
                                            <a-tooltip title="全屏查看">
                                                <a-button 
                                                    type="text" 
                                                    size="small" 
                                                    class="mr-1"
                                                    @click="toggleFullscreen(index)"
                                                >
                                                    <template #icon>
                                                        <fullscreen-outlined v-if="!chart.isFullscreen" />
                                                        <fullscreen-exit-outlined v-else />
                                                    </template>
                                                </a-button>
                                            </a-tooltip>
                                            <a-tooltip title="关闭窗口">
                                                <a-button 
                                                    type="text" 
                                                    danger 
                                                    size="small" 
                                                    @click="removeKlineChart(index)"
                                                    :disabled="klineCharts.length === 1"
                                                >
                                                    <template #icon><close-outlined /></template>
                                                </a-button>
                                            </a-tooltip>
                                        </div>
                                    </div>
                                    <div class="kline-chart-forms" :class="{ 'fullscreen': chart.isFullscreen }"></div>
                                </div>
                            </transition-group>
                        </div>
                    </div>
                </a-col>
                <a-col :span="4">
                    <!--交易区 -->
                    <div class="trade-forms"></div>
                </a-col>
            </a-row>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCurrencyStore } from '@/store/currency'
import { 
    PlusOutlined, 
    CloseOutlined, 
    FullscreenOutlined, 
    FullscreenExitOutlined 
} from '@ant-design/icons-vue'

// 定义组件选项
defineOptions({
    name: 'Trade'
})

const currencyStore = useCurrencyStore()
const tradeType = ref('SPOT') // SPOT-现货，SWAP-永续合约
const selectedCurrency = ref('') // 选中的币种 
const klineCharts = ref([{ id: 1, isFullscreen: false }]) // 初始化一个K线图窗口
const nextChartId = ref(2) // 下一个窗口ID

// 计算属性 - 币种列表的获取
const currentCurrencies = computed(() => {
    return currencyStore.currencies[tradeType.value] || []
});

// 计算属性 - 根据K线图数量确定布局类
const chartLayoutClass = computed(() => {
    // 如果有全屏窗口，则使用全屏布局
    if (klineCharts.value.some(chart => chart.isFullscreen)) {
        return 'chart-layout-fullscreen'
    }
    
    const count = klineCharts.value.length
    if (count <= 3) {
        return `chart-layout-row-${count}`
    } else if (count <= 6) {
        return 'chart-layout-row-3 chart-layout-rows-2'
    } else {
        return 'chart-layout-row-3 chart-layout-rows-3'
    }
})

// 计算属性 - 是否有全屏窗口
const hasFullscreenChart = computed(() => {
    return klineCharts.value.some(chart => chart.isFullscreen)
})

// 格式化币种名称
const formatCurrencyName = (instId) => {
    return instId
        .replace('-SWAP', '')
        .replace('-USDT', '')
}

// 添加K线图窗口
const addKlineChart = () => {
    if (klineCharts.value.length < 9) {
        // 先计算新的布局类，以便在添加窗口前调整现有窗口大小
        const newCount = klineCharts.value.length + 1
        
        // 使用递增的ID确保唯一性
        const newId = nextChartId.value
        nextChartId.value++
        
        // 添加新窗口
        klineCharts.value.push({ id: newId, isFullscreen: false })
        
        // 如果从3个窗口变为4个，或从6个变为7个，需要调整布局
        if (newCount === 4 || newCount === 7) {
            // 给DOM一点时间更新
            setTimeout(() => {
                // 触发布局重新计算
                const tempCharts = [...klineCharts.value]
                klineCharts.value = tempCharts
            }, 10)
        }
    }
}

// 移除K线图窗口
const removeKlineChart = (index) => {
    if (klineCharts.value.length > 1) {
        const oldCount = klineCharts.value.length
        
        // 移除指定窗口
        klineCharts.value.splice(index, 1)
        
        // 如果从4个窗口变为3个，或从7个变为6个，需要调整布局
        if (oldCount === 4 || oldCount === 7) {
            // 给DOM一点时间更新
            setTimeout(() => {
                // 触发布局重新计算
                const tempCharts = [...klineCharts.value]
                klineCharts.value = tempCharts
            }, 10)
        }
    }
}

// 切换全屏模式
const toggleFullscreen = (index) => {
    // 先将所有窗口设为非全屏
    klineCharts.value.forEach(chart => {
        chart.isFullscreen = false
    })
    
    // 切换当前窗口的全屏状态
    klineCharts.value[index].isFullscreen = !klineCharts.value[index].isFullscreen
}

// handleCurrencyChange - 币种选择
const handleCurrencyChange = (value) => {
    selectedCurrency.value = value
};

// handleTradeTypeChange - 交易类型选择
const handleTradeTypeChange = async (item) => {
    console.log('交易类型切换为:', item.target.value)
    tradeType.value = item.target.value
    await selectDefaultCurrency()
};
// filterCurrencyOption - 搜索币种 
const filterCurrencyOption = (input, option) => {
    const searchText = input.toLowerCase()
    const currencyId = option.value.toLowerCase()
    const simplifiedId = currencyId
        .replace('-swap', '')
        .replace('-usdt', '')
    return simplifiedId.includes(searchText)
};

// selectDefaultCurrency - 选择默认币种
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
};

// 生命周期钩子
onMounted(async () => {
    await selectDefaultCurrency()
    
    // 监听窗口数量变化，确保布局正确更新
    watch(() => klineCharts.value.length, (newCount, oldCount) => {
        // 当窗口数量变化时，可能需要调整布局
        if ((oldCount <= 3 && newCount > 3) || 
            (oldCount > 3 && newCount <= 3) ||
            (oldCount <= 6 && newCount > 6) || 
            (oldCount > 6 && newCount <= 6)) {
            // 给DOM一点时间更新
            setTimeout(() => {
                // 触发布局重新计算
                const tempCharts = [...klineCharts.value]
                klineCharts.value = tempCharts
            }, 10)
        }
    })
})
</script>

<style lang="scss" scoped>
.kline-chart-container {
    width: 100%;
    height: 100%;
}

.kline-charts-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    height: 780px;
    // 超出高度时，出现滚动条
    overflow-y: auto;
    // 美化滚动条
    scrollbar-width: thin;
    scrollbar-color: #202020 #000000;
    
    // 1-3个窗口时的布局
    &.chart-layout-row-1 .kline-chart-item {
        width: 100%;
        height: 90%;

    }
    
    &.chart-layout-row-2 .kline-chart-item {
        width: calc(50% - 6px);
        height: 70%;

    }
    
    &.chart-layout-row-3 .kline-chart-item {
        width: calc(33.333% - 8px);
        height: 50%;
    }

    // 多行布局时的高度调整
    &.chart-layout-rows-2.chart-layout-row-3 .kline-chart-item  {
        height: 320px;
    }
    
    &.chart-layout-rows-3.chart-layout-row-3 .kline-chart-item  {
        height: 220px;
    }
    
    // 全屏模式
    &.chart-layout-fullscreen {
        .kline-chart-item {
            width: 100%;
            
            &.hidden-item {
                display: none;
            }
            
            &.fullscreen-item {
                display: block;
            }
        }
    }
}

.kline-chart-item {
    border: 1px solid #303030;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    
    .kline-chart-forms {
        width: 100%;
        height: calc(100% - 40px);
        transition: height 0.3s ease;
        
        &.fullscreen {
            height: 600px;
        }
    }
    
    .kline-chart-header {
        background-color: #1a1a1a;
    }
}

.trade-forms {
    width: 100%;
    height: 500px;
    border: 1px solid #303030;
}

// 添加动画效果
.kline-charts-container {
    .kline-chart-item {
        animation: fadeIn 0.3s ease;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 添加过渡动画
.chart-transition-enter-active,
.chart-transition-leave-active {
    transition: all 0.3s ease;
}

.chart-transition-enter-from {
    opacity: 0;
    transform: translateY(30px);
}

.chart-transition-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.chart-transition-move {
    transition: transform 0.3s ease;
}
</style>
