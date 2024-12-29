<template>
    <div class="trade">
        <div class="page-header">
            <h2>交易</h2>
        </div>
        <div class="trade-content">
            <a-empty description="交易功能开发中..." />
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'TradePage'
})
</script>

<style scoped>
.trade {
    height: 100%;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
}

.trade-content {
    height: calc(100% - 48px);
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>