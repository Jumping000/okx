<template>
    <Teleport to="body">
        <Transition name="dialog-fade">
            <div v-if="modelValue" class="custom-dialog-container" :class="{ 'no-mask': !showMask }" @click="handleMaskClick">
                <div class="custom-dialog" :style="{ width: width + 'px' }" @click.stop>
                    <!-- 头部 -->
                    <div class="dialog-header">
                        <h3 class="dialog-title">{{ title }}</h3>
                        <button v-if="showClose" class="close-btn" @click="handleClose">
                            <svg viewBox="0 0 1024 1024" width="16" height="16">
                                <path d="M512 456.310154L94.247385 38.557538a39.542154 39.542154 0 0 0-55.689847 0 39.542154 39.542154 0 0 0 0 55.689847L456.310154 512 38.557538 929.752615a39.542154 39.542154 0 0 0 0 55.689847 39.542154 39.542154 0 0 0 55.689847 0L512 567.689846l417.752615 417.752616c15.163077 15.163077 40.526769 15.163077 55.689847 0s15.163077-40.526769 0-55.689847L567.689846 512 985.442462 94.247385a39.542154 39.542154 0 0 0 0-55.689847 39.542154 39.542154 0 0 0-55.689847 0L512 456.310154z" fill="currentColor"></path>
                            </svg>
                        </button>
                    </div>
                    <!-- 内容区 -->
                    <div class="dialog-body">
                        <slot></slot>
                    </div>
                    <!-- 底部 -->
                    <div v-if="$slots.footer" class="dialog-footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    width: {
        type: Number,
        default: 500
    },
    showClose: {
        type: Boolean,
        default: true
    },
    showMask: {
        type: Boolean,
        default: true
    },
    closeOnClickMask: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['update:modelValue', 'close'])

const handleClose = () => {
    emit('update:modelValue', false)
    emit('close')
}

const handleMaskClick = () => {
    if (props.closeOnClickMask) {
        handleClose()
    }
}
</script>

<style scoped>
.custom-dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 100px;
    z-index: 2000;
}

.custom-dialog-container.no-mask {
    background: transparent;
    pointer-events: none;
}

.custom-dialog {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-hover);
}

.dialog-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
    line-height: 1;
}

.close-btn {
    border: none;
    background: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    color: var(--text-color);
    background: var(--bg-color);
}

.dialog-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
    background: var(--bg-color);
}

.dialog-footer {
    padding: 10px 20px 20px;
    text-align: right;
    background: var(--bg-hover);
    border-top: 1px solid var(--border-color);
}

/* 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

.dialog-fade-enter-active .custom-dialog {
    animation: dialog-zoom-in 0.3s ease;
}

.dialog-fade-leave-active .custom-dialog {
    animation: dialog-zoom-out 0.3s ease;
}

@keyframes dialog-zoom-in {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes dialog-zoom-out {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(0.9);
        opacity: 0;
    }
}
</style> 