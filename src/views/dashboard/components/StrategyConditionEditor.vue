<template>
    <div class="condition-editor">
   
        <div class="editor-content">
            <div v-if="conditions.length === 0" class="empty-tip">
                请添加触发条件
            </div>
            <div v-else class="conditions-list">
                <div v-for="(condition, index) in conditions" :key="index" class="condition-item">
                    <div class="condition-content">
                        <div class="condition-bracket" :class="{ active: activeBrackets[`${index}-left`] }"
                            @click="handleBracketClick(index, 'left')">(</div>
                        <a-select v-model:value="condition.expression" placeholder="选择表达式" style="width: 200px">
                            <a-select-option v-for="expr in expressionOptions" :key="expr.value" :label="expr.label"
                                :value="expr.value">
                                {{ expr.label }}
                            </a-select-option>
                        </a-select>
                        <a-select v-model:value="condition.compareType" placeholder="比较类型" style="width: 120px">
                            <a-select-option v-for="type in compareTypes" :key="type.value" :label="type.label"
                                :value="type.value">
                                {{ type.label }}
                            </a-select-option>
                        </a-select>
                        <a-input-number v-model:value="condition.value" placeholder="比较值" style="width: 120px" />
                        <div class="condition-bracket" :class="{ active: activeBrackets[`${index}-right`] }"
                            @click="handleBracketClick(index, 'right')">)</div>
                        <template v-if="index < conditions.length - 1">
                            <a-select v-model:value="condition.relation" placeholder="关系" style="width: 80px">
                                <a-select-option value="and">并且</a-select-option>
                                <a-select-option value="or">或者</a-select-option>
                            </a-select>
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
import { ref, defineProps, defineEmits, watch } from 'vue'
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

// 比较类型选项
const compareTypes = [
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' }
]

// 添加括号激活状态
const activeBrackets = ref({})

// 处理括号点击
const handleBracketClick = (index, position) => {
    const key = `${index}-${position}`
    activeBrackets.value[key] = !activeBrackets.value[key]
}

// 添加条件
const addCondition = () => {
    const newConditions = [...props.conditions]
    newConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
    emit('update:conditions', newConditions)
}

// 删除条件
const removeCondition = (index) => {
    const newConditions = [...props.conditions]
    newConditions.splice(index, 1)
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
}

:deep(.ant-select-selection-item) {
    color: var(--text-color) !important;
}
</style> 