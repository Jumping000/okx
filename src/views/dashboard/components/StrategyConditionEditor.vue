<template>
    <div class="condition-editor">
   
        <div class="editor-content">
            <div v-if="conditions.length === 0" class="empty-tip">
                请添加触发条件
            </div>
            <div v-else class="conditions-list">
                <div v-for="(condition, index) in conditions" :key="index" class="condition-item">
                    <div class="condition-content">
                        <div class="condition-bracket" :class="{ active: condition.leftBracket }"
                            @click="handleBracketClick(index, 'left')">(</div>
                        <a-select v-model:value="condition.expression" 
                            placeholder="选择表达式" 
                            style="width: 200px"
                            :options="localExpressionOptions"
                            :popup-class-name="'strategy-select-dropdown'"
                            :get-popup-container="(triggerNode) => triggerNode.parentNode"
                        />
                        <a-select v-model:value="condition.compareType" 
                            placeholder="比较类型" 
                            style="width: 120px"
                            :options="compareTypes"
                            @change="handleCompareTypeChange(index)"
                            :popup-class-name="'strategy-select-dropdown'"
                            :get-popup-container="(triggerNode) => triggerNode.parentNode"
                        />
                        <a-input-number :disabled="condition.compareType === 'is_null'" v-model:value="condition.value" placeholder="比较值" style="width: 120px" />
                        <div class="condition-bracket" :class="{ active: condition.rightBracket }"
                            @click="handleBracketClick(index, 'right')">)</div>
                        <template v-if="index < conditions.length - 1">
                            <a-select v-model:value="condition.relation" 
                                placeholder="关系" 
                                style="width: 80px"
                                :options="relationOptions"
                                :popup-class-name="'strategy-select-dropdown'"
                                :get-popup-container="(triggerNode) => triggerNode.parentNode"
                            />
                        </template>
                        <a-button type="link" danger @click="removeCondition(index)">
                            <template #icon><delete-outlined /></template>
                        </a-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// Props 定义
const props = defineProps({
    conditions: {
        type: Array,
        default: () => []
    },
    expressionOptions: {
        type: Array,
        default: () => []
    }
})

// Emits 定义
const emit = defineEmits(['update:conditions'])

// 本地表达式选项
const localExpressionOptions = ref([])

// 比较类型选项
const compareTypes = [
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: 'is_null', label: '空' },
]

// 关系选项
const relationOptions = [
    { value: 'and', label: '并且' },
    { value: 'or', label: '或者' }
]

// 添加括号激活状态
const activeBrackets = ref({})

// 处理括号点击
const handleBracketClick = (index, position) => {
    const newConditions = [...props.conditions]
    const condition = newConditions[index]
    if (position === 'left') {
        condition.leftBracket = !condition.leftBracket
    } else {
        condition.rightBracket = !condition.rightBracket
    }
    emit('update:conditions', newConditions)
}

// 加载表达式列表
const loadExpressions = () => {
    try {
        const storedExpressions = localStorage.getItem('quant_expressions')
        if (storedExpressions) {
            const parsedExpressions = JSON.parse(storedExpressions)
            localExpressionOptions.value = parsedExpressions.map(expr => ({
                label: expr.name,
                value: `(${expr.formula})`
            }))
        }
    } catch (error) {
        console.error('加载表达式失败:', error)
    }
}

// 监听组件挂载
onMounted(() => {
    loadExpressions()
})

// 监听表达式选项变化
watch(() => props.expressionOptions, (newOptions) => {
    localExpressionOptions.value = newOptions
}, { immediate: true })

// 删除条件
const removeCondition = (index) => {
    const newConditions = [...props.conditions]
    newConditions.splice(index, 1)
    emit('update:conditions', newConditions)
}
// handleCompareTypeChange 处理比较类型变化
const handleCompareTypeChange = (index) => {
    // 清空输入值的值
    const newConditions = [...props.conditions]
    newConditions[index].value = null
    emit('update:conditions', newConditions)
}
</script>

<style lang="scss" scoped>
.condition-editor {
    width: 100%;
}

.editor-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
}

.empty-tip {
    text-align: center;
    color: var(--text-secondary);
    padding: 24px;
    background: var(--bg-color);
    border-radius: 4px;
    border: 1px dashed var(--border-color);
}

.conditions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.condition-item {
    background: var(--bg-color);
    border-radius: 4px;
    border: 1px solid var(--border-color);
}

.condition-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
}

.condition-bracket {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    padding: 0 4px;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;

    &:hover {
        color: var(--primary-color);
    }

    &.active {
        color: var(--primary-color);
        text-shadow: 0 0 8px var(--primary-color-10);
    }
}

:deep(.ant-select-selector) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
}

:deep(.ant-input-number) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;

    .ant-input-number-input {
        color: var(--text-color) !important;
    }

    &:hover {
        border-color: var(--primary-color) !important;
    }

    &.ant-input-number-focused {
        border-color: var(--primary-color) !important;
        box-shadow: 0 0 0 2px var(--primary-color-10) !important;
    }
}

:deep(.ant-form-item-label > label) {
    color: var(--text-color) !important;
}

:deep(.ant-select-selection-item) {
    color: var(--text-color) !important;
}

:deep(.strategy-select-dropdown),
:deep(.ant-select-dropdown) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    z-index: 1100 !important;

    .ant-select-dropdown-content,
    .ant-select-dropdown-menu,
    .ant-select-dropdown-menu-item-group,
    .ant-select-dropdown-menu-item-group-list,
    .ant-select-dropdown-menu-item,
    .ant-select-dropdown-menu-item-selected {
        background-color: var(--bg-color) !important;
    }

    .ant-select-empty,
    .ant-select-item-empty,
    .ant-select-item-option,
    .ant-select-item {
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;

        &:hover {
            background-color: var(--bg-hover) !important;
        }

        &.ant-select-item-option-selected {
            background-color: var(--primary-color) !important;
            color: #fff !important;
        }
    }

    .ant-select-item-option-content {
        color: var(--text-color) !important;
    }
}

// 确保下拉框内容区域也有正确的背景色
:deep(.ant-select-dropdown-menu-vertical) {
    background-color: var(--bg-color) !important;
}

// 确保无数据时的空状态也有正确的背景色
:deep(.ant-empty) {
    background-color: var(--bg-color) !important;
    color: var(--text-color) !important;
}
</style> 