<template>
    <a-modal v-model:visible="visible" title="偏好设置" :footer="null" @cancel="handleCancel">
        <div class="space-y-6">
            <!-- 主题设置 -->
            <div class="setting-section">
                <h3 class="text-base font-medium mb-3">主题设置</h3>
                <a-radio-group v-model:value="settings.theme" class="w-full">
                    <a-radio value="dark" class="block mb-2">深色模式</a-radio>
                    <a-radio value="light" class="block">浅色模式</a-radio>
                </a-radio-group>
            </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex justify-end gap-3 mt-6">
            <a-button @click="handleCancel">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
        </div>
    </a-modal>
</template>

<script>
import { defineComponent, ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { storage } from '@/utils/storage'

export default defineComponent({
    name: 'PreferenceSettings',
    setup() {
        const visible = ref(false)
        const settings = reactive({
            theme: 'dark'
        })

        // 加载保存的设置
        const loadSettings = () => {
            const savedSettings = storage.get('userPreferences')
            if (savedSettings) {
                Object.assign(settings, savedSettings)
            }
        }

        // 应用主题
        const applyTheme = (theme) => {
            const root = document.documentElement
            const body = document.body
            if (theme === 'light') {
                root.classList.remove('dark')
                root.classList.add('light')
                body.setAttribute('data-theme', 'light')
            } else {
                root.classList.remove('light')
                root.classList.add('dark')
                body.setAttribute('data-theme', 'dark')
            }
        }

        // 监听主题变化
        watch(() => settings.theme, (newTheme) => {
            applyTheme(newTheme)
        })

        // 打开设置
        const showModal = () => {
            loadSettings()
            visible.value = true
        }

        // 取消
        const handleCancel = () => {
            // 恢复之前保存的设置
            loadSettings()
            visible.value = false
        }

        // 保存设置
        const handleSave = () => {
            storage.set('userPreferences', settings)
            applyTheme(settings.theme)
            message.success('设置已保存')
            visible.value = false
        }

        // 初始化主题
        loadSettings()
        applyTheme(settings.theme)

        return {
            visible,
            settings,
            showModal,
            handleCancel,
            handleSave
        }
    }
})
</script>