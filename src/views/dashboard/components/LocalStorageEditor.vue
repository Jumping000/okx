<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <a-modal :visible="modelValue" title="本地存储编辑" width="800px" @ok="handleSave" @cancel="handleCancel"
        :maskClosable="false">
        <div class="storage-editor">
            <div class="mb-4">
                <a-alert type="warning" show-icon>
                    <template #message>
                        警告：直接编辑本地存储可能会导致数据不一致。请确保您知道您在做什么。
                    </template>
                </a-alert>
            </div>
            <div class="storage-list">
                <div v-for="(item, key) in storageItems" :key="key" class="storage-item mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-base font-medium storage-title">{{ getStorageKeyName(key) }}</span>
                        <div class="flex gap-2">
                            <a-tooltip :title="getStorageHelp(key)" placement="left">
                                <a-button type="link" size="small">
                                    <template #icon><info-circle-outlined /></template>
                                </a-button>
                            </a-tooltip>
                            <a-button size="small" @click="formatJson(key)">格式化</a-button>
                            <a-button size="small" type="primary" @click="saveItem(key)"
                                :disabled="!isJsonValid(storageItems[key])">保存</a-button>
                        </div>
                    </div>
                    <a-textarea v-model:value="storageItems[key]" :rows="8" :status="isJsonValid(storageItems[key]) ? '' : 'error'" />
                    <div class="mt-1">
                        <span class="text-xs" :class="isJsonValid(storageItems[key]) ? 'text-success' : 'text-error'">
                            {{ isJsonValid(storageItems[key]) ? 'JSON格式正确' : 'JSON格式错误' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { InfoCircleOutlined } from '@ant-design/icons-vue'

// 获取路由实例
const router = useRouter()

// 定义属性
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'save'])

// 存储项
const storageItems = ref({})

// 存储键名映射
const storageKeyMap = {
    'quant_parameters': '量化参数',
    'quant_expressions': '量化表达式',
    'quant_strategies': '量化策略'
}

// 存储帮助说明
const storageHelpMap = {
    'quant_parameters': `量化参数说明：
1. id: 参数唯一标识
2. name: 参数名称
3. description: 参数描述
4. formula: 参数计算公式
示例：
[{
  "id": "uuid",
  "name": "MA5",
  "description": "5日均线",
  "formula": "MA(C,5)"
}]`,
    'quant_expressions': `量化表达式说明：
1. id: 表达式唯一标识
2. name: 表达式名称
3. description: 表达式描述
4. formula: 表达式计算公式
示例：
[{
  "id": "uuid",
  "name": "金叉死叉",
  "description": "MACD金叉死叉",
  "formula": "CROSS(MACD,0)"
}]`,
    'quant_strategies': `量化策略说明：
1. id: 策略唯一标识
2. name: 策略名称
3. description: 策略描述
4. currency: 交易币种
5. quantity: 交易数量
6. leverage: 杠杆倍数
7. stopLoss: 止损比例
8. threshold: 阈值比例
9. strategyMode: 策略模式(1-单策略/2-双策略/4-四策略)
10. conditions: 策略条件
示例：
{
  "id": "uuid",
  "name": "MACD策略",
  "description": "MACD金叉做多死叉做空",
  "currency": "BTC-USDT-SWAP",
  "quantity": 1,
  "leverage": 10,
  "stopLoss": 0.02,
  "threshold": 0.01,
  "strategyMode": "2",
  "strategy2LongConditions": [...],
  "strategy2ShortConditions": [...]
}`
}

// 获取存储键名的显示名称
const getStorageKeyName = (key) => {
    return storageKeyMap[key] || key
}

// 获取存储帮助说明
const getStorageHelp = (key) => {
    return storageHelpMap[key] || '暂无说明'
}

// 初始化数据
const initStorageData = () => {
    const keys = ['quant_parameters', 'quant_expressions', 'quant_strategies']
    keys.forEach(key => {
        try {
            const value = localStorage.getItem(key)
            storageItems.value[key] = value ? JSON.stringify(JSON.parse(value), null, 2) : ''
        } catch (error) {
            console.error(`读取${key}失败:`, error)
            storageItems.value[key] = ''
        }
    })
}

// 检查JSON格式是否有效
const isJsonValid = (str) => {
    if (!str) return true
    try {
        JSON.parse(str)
        return true
    } catch (error) {
        return false
    }
}

// 格式化JSON
const formatJson = (key) => {
    try {
        const value = storageItems.value[key]
        if (value) {
            storageItems.value[key] = JSON.stringify(JSON.parse(value), null, 2)
        }
    } catch (error) {
        message.error('JSON格式错误，无法格式化')
    }
}

// 保存单个项目
const saveItem = async (key) => {
    Modal.confirm({
        title: '确认保存',
        content: '保存后将刷新页面以应用更改，是否继续？',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
            try {
                const value = storageItems.value[key]
                if (!value) {
                    localStorage.removeItem(key)
                } else {
                    // 验证JSON格式
                    const parsedValue = JSON.parse(value)
                    localStorage.setItem(key, JSON.stringify(parsedValue))
                }
                message.success(`${getStorageKeyName(key)}保存成功`)
                emit('save', key)
                // 刷新当前路由页面
                router.go(0)
            } catch (error) {
                message.error(`保存失败: ${error.message}`)
            }
        }
    })
}

// 保存所有更改
const handleSave = async () => {
    // 首先验证所有数据格式
    try {
        for (const [key, value] of Object.entries(storageItems.value)) {
            if (value && !isJsonValid(value)) {
                throw new Error(`${getStorageKeyName(key)}的JSON格式错误`)
            }
        }

        // 显示确认对话框
        Modal.confirm({
            title: '确认保存',
            content: '保存所有更改后将刷新页面以应用更改，是否继续？',
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    // 保存所有数据
                    for (const [key, value] of Object.entries(storageItems.value)) {
                        if (!value) {
                            localStorage.removeItem(key)
                        } else {
                            localStorage.setItem(key, JSON.stringify(JSON.parse(value)))
                        }
                    }

                    message.success('保存成功')
                    emit('save')
                    emit('update:modelValue', false)
                    // 刷新当前路由页面
                    router.go(0)
                } catch (error) {
                    message.error(`保存失败: ${error.message}`)
                }
            }
        })
    } catch (error) {
        message.error(`保存失败: ${error.message}`)
    }
}

// 取消编辑
const handleCancel = () => {
    emit('update:modelValue', false)
}

// 监听显示状态变化，当显示时初始化数据
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        // 初始化数据
        initStorageData()
    }
})

// 组件挂载时初始化数据
onMounted(() => {
    if (props.modelValue) {
        // 初始化数据
        initStorageData()
    }
})
</script>

<style lang="scss" scoped>
.storage-editor {
    max-height: 600px;
    overflow-y: auto;
    padding-right: 8px;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
        border-radius: 3px;
    }
}

.storage-item {
    .storage-title {
        color: var(--text-color) !important;
    }

    :deep(.ant-input) {
        font-family: monospace;
        font-size: 14px;
        background-color: var(--bg-color);
        border-color: var(--border-color);
        color: var(--text-color);

        &:hover,
        &:focus {
            border-color: var(--primary-color);
        }

        &.ant-input-status-error {
            border-color: var(--error-color);
        }
    }
}

.text-success {
    color: var(--success-color) !important;
}

.text-error {
    color: var(--error-color) !important;
}

:deep(.ant-tooltip) {
    max-width: 500px;
}

:deep(.ant-tooltip-inner) {
    white-space: pre-line;
    font-family: monospace;
    font-size: 12px;
}

:deep(.ant-btn-link) {
    padding: 0 4px;
    
    &:hover {
        color: var(--primary-color);
        background: transparent;
    }
}

/* 确保所有文本颜色正确 */
:deep(.ant-modal-title) {
    color: var(--text-color) !important;
}

:deep(.ant-modal-content) {
    background-color: var(--bg-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-modal-body) {
    color: var(--text-color) !important;
}

/* 确保文本颜色在任何情况下都正确 */
span, div, p {
    color: var(--text-color) !important;
}
</style> 