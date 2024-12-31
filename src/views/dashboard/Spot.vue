<template>
  <div class="h-full p-5">
    <h2 class="text-xl font-medium text-dark-100 mb-5">现货交易</h2>
    <!-- 临时占位内容 -->
    <div class="flex items-center justify-center h-[calc(100%-2rem)] bg-dark-400 rounded-lg border border-dark-300">
      <div class="text-center">
        <inbox-outlined class="text-4xl text-dark-300 mb-4" />
        <p class="text-dark-200">现货交易功能开发中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'SpotTrading',
  components: {
    InboxOutlined
  }
})
</script> 