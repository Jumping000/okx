<template>
    <div class="h-full">
        <router-view></router-view>
    </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'HomePage'
})
</script>

<style lang="scss" scoped>
.home {
    padding: 20px;
}
</style>