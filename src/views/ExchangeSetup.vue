<template>
    <div class="exchange-setup">
        <a-card title="交易所设置" :bordered="false" class="setup-card">
            <a-form :model="formState" name="exchangeSetup" @finish="onFinish" autocomplete="off" layout="vertical">
                <a-form-item label="API Key" name="apiKey" :rules="[{ required: true, message: '请输入 API Key' }]">
                    <a-input-password v-model:value="formState.apiKey" placeholder="请输入 API Key" :maxLength="100" />
                </a-form-item>

                <a-form-item label="Secret Key" name="secretKey"
                    :rules="[{ required: true, message: '请输入 Secret Key' }]">
                    <a-input-password v-model:value="formState.secretKey" placeholder="请输入 Secret Key"
                        :maxLength="100" />
                </a-form-item>

                <a-form-item label="Passphrase" name="passphrase"
                    :rules="[{ required: true, message: '请输入 Passphrase' }]">
                    <a-input-password v-model:value="formState.passphrase" placeholder="请输入 Passphrase"
                        :maxLength="100" />
                </a-form-item>

                <a-form-item>
                    <a-space>
                        <a-button type="primary" html-type="submit" :loading="loading">保存配置</a-button>
                        <a-button @click="clearConfig" :disabled="loading">清除配置</a-button>
                        <a-button type="danger" @click="handleLogout" :disabled="loading">退出登录</a-button>
                    </a-space>
                </a-form-item>
            </a-form>

            <template #extra>
                <a-tag :color="hasConfig ? 'success' : 'warning'">
                    {{ hasConfig ? '已配置' : '未配置' }}
                </a-tag>
            </template>
        </a-card>
    </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { storage } from '@/utils/storage'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

export default defineComponent({
    name: 'ExchangeSetupPage',
    setup() {
        const router = useRouter()
        const userStore = useUserStore()
        const hasConfig = ref(false)
        const loading = ref(false)
        const formState = reactive({
            apiKey: '',
            secretKey: '',
            passphrase: ''
        })

        // 检查配置状态
        const checkConfig = () => {
            hasConfig.value = storage.hasApiConfig()
            if (hasConfig.value) {
                const config = storage.getApiConfig()
                formState.apiKey = config.apiKey
                formState.secretKey = config.secretKey
                formState.passphrase = config.passphrase
            }
        }

        // 保存配置
        const onFinish = async (values) => {
            loading.value = true
            try {
                storage.setApiConfig(
                    values.apiKey,
                    values.secretKey,
                    values.passphrase
                )
                message.success('配置保存成功')
                checkConfig()
                // 如果配置成功，跳转到主页
                router.push('/dashboard')
            } catch (error) {
                message.error('配置保存失败')
            } finally {
                loading.value = false
            }
        }

        // 清除配置
        const clearConfig = () => {
            storage.clearApiConfig()
            formState.apiKey = ''
            formState.secretKey = ''
            formState.passphrase = ''
            hasConfig.value = false
            message.success('配置已清除')
        }

        // 退出登录
        const handleLogout = () => {
            userStore.logout()
            message.success('退出登录成功')
            router.push('/auth/login')
        }

        onMounted(() => {
            checkConfig()
        })

        return {
            formState,
            hasConfig,
            onFinish,
            clearConfig,
            handleLogout,
            loading
        }
    }
})
</script>

<style lang="scss" scoped>
.exchange-setup {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--bg-color);
    padding: 20px;
}

.setup-card {
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    background-color: var(--card-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.ant-card-head) {
    border-bottom: 1px solid var(--border-color);
    background-color: var(--card-bg);
}

:deep(.ant-card-head-title) {
    color: var(--text-color);
}

:deep(.ant-form-item-label > label) {
    color: var(--text-color);
}

:deep(.ant-input-affix-wrapper) {
    background-color: var(--input-bg);
    border-color: var(--input-border);
}

:deep(.ant-input-affix-wrapper:hover) {
    border-color: var(--primary-color);
}

:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input-affix-wrapper:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 181, 107, 0.2);
}

:deep(.ant-input) {
    background-color: var(--input-bg);
    color: var(--text-color);
}

:deep(.ant-input-password-icon) {
    color: var(--text-secondary);
}

:deep(.ant-form-item-label) {
    text-align: left;
}
</style>