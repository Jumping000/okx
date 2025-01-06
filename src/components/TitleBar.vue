<template>
    <div v-if="isElectronEnv" class="title-bar select-none">
        <!-- 左侧图标和标题 -->
        <div class="title-left">
            <img src="/favicon.ico" alt="logo" class="w-4 h-4 mr-2" />
            <span class="title-text">{{ props.title }}</span>
        </div>

        <!-- 右侧按钮组 -->
        <div class="title-right">
            <div class="title-button" @click="handleMinimize">
                <MinusOutlined />
            </div>
            <div class="title-button" @click="handleMaximize">
                <BorderOutlined v-if="!isMaximized" />
                <SwitcherOutlined v-else />
            </div>
            <div class="title-button close-button" @click="handleClose">
                <CloseOutlined />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue';
import { MinusOutlined, BorderOutlined, SwitcherOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { isElectron } from '@/utils/environment';

// 定义属性
const props = defineProps({
    title: {
        type: String,
        default: process.env.VUE_APP_TITLE || 'OKX Desktop'
    }
});

// 环境判断
const isElectronEnv = ref(false);

// 窗口状态
const isMaximized = ref(false);

// 初始化环境检查
onMounted(() => {
    isElectronEnv.value = isElectron();
});

// 窗口控制方法
const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
};

const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    isMaximized.value = !isMaximized.value;
};

const handleClose = () => {
    window.electronAPI?.closeWindow();
};
</script>

<style scoped>
.title-bar {
    @apply h-8 flex justify-between items-center px-3;
    background-color: var(--ant-primary-color);
    -webkit-app-region: drag;
}

.title-left {
    @apply flex items-center;
}

.title-text {
    @apply text-sm font-medium text-white;
}

.title-right {
    @apply flex items-center -mr-3;
    -webkit-app-region: no-drag;
}

.title-button {
    @apply flex items-center justify-center w-11 h-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors;
}

.close-button:hover {
    @apply bg-red-500 text-white;
}

/* 适配暗色主题 */
:root[data-theme='dark'] .title-bar {
    background-color: var(--ant-primary-7);
}
</style>