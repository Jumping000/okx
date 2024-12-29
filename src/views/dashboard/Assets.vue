<template>
    <div class="assets">
        <div class="page-header">
            <h2>资产</h2>
        </div>
        <div class="assets-content">
            <a-empty description="资产功能开发中..." />
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'AssetsPage'
})
</script>

<style scoped>
.assets {
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

.assets-content {
    height: calc(100% - 48px);
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>