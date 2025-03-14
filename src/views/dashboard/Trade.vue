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
    </div>
</template>

<script setup>  
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
</script>

<style lang="scss" scoped>
.trade-container {
    width: 100%;
    height: 100%;
}
</style>

