<template>
    <CustomDialog :model-value="visible" :title="title" :width="900" :close-on-click-mask="false"
        @update:model-value="(val) => emit('update:visible', val)" @close="handleCancel">
        <div class="formula-dialog">
            <!-- 基础数据展示区 -->
            <div class="basic-data-info">
                <div class="naming-rules">
                    <div class="rule-header">命名规范</div>
                    <div class="rule-item formats">
                        <div class="rule-content">
                            <div class="format-item">
                                <span class="code">数据类型_时间周期</span>
                            </div>
                            <span class="divider" />
                            <div class="format-item">
                                <span class="code">LS_数据类型_时间周期_序号</span>
                            </div>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-title">数据类型说明：</div>
                        <div class="rule-content rule-types">
                            <span>KP - 开盘价</span>
                            <span>SP - 收盘价</span>
                            <span>ZG - 最高价</span>
                            <span>ZD - 最低价</span>
                            <span>CJ - 成交量</span>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-title">时间周期说明：</div>
                        <div class="rule-content rule-times">
                            <span>1F/3F/5F/15F/30F - 分钟</span>
                            <span>1S/2S/4S/6S/12S - 小时</span>
                            <span>1T/2T/3T/5T - 天</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 结果显示区 -->
            <div class="result-area">
                <div class="section-header">
                    <span>{{ type === 'parameter' ? '参数公式' : '表达式公式' }}</span>
                </div>
                <div class="result-display">{{ result || '拖动表达式开始计算' }}</div>
            </div>

            <!-- 拖拽算区 -->
            <div class="expression-area">
                <div class="section-header">拖拽区域</div>
                <draggable v-model="expression" v-bind="dropzoneOptions" class="expression-list"
                    @change="handleExpressionChange">
                    <template #item="{ element, index }">
                        <div v-if="!element.isInput" class="dragged-item" :class="element.type"
                            @dblclick="removeExpressionItem(index)">
                            {{ element.Name }}
                        </div>
                        <div v-else class="dragged-item input" @dblclick="removeExpressionItem(index)">
                            <a-input v-model:value="element.value" size="small" @blur="handleInputBlur" />
                        </div>
                    </template>
                </draggable>
            </div>

            <!-- 功能区域 -->
            <div class="function-area">
                <!-- 基础数据和参数区域 -->
                <div class="combined-section">
                    <!-- 基础数据区 -->
                    <div class="basic-data-section">
                        <div class="section-header">
                            <span>基础数据</span>
                            <div class="filter-group">
                                <a-select v-model:value="filterConditions.selectedTime" placeholder="选择时间" allowClear
                                    size="small" style="width: 120px">
                                    <a-select-option v-for="time in timeCollection" :key="time.Name" :value="time.Name">
                                        {{ time.dis }}
                                    </a-select-option>
                                </a-select>
                                <a-select v-model:value="filterConditions.selectedType" placeholder="选择类型" allowClear
                                    size="small" style="width: 120px">
                                    <a-select-option v-for="type in dataTypeCollection" :key="type.Name"
                                        :value="type.Name">
                                        {{ type.dis }}
                                    </a-select-option>
                                </a-select>
                                <div class="ls-filter">
                                    <span class="ls-label">LS范围:</span>
                                    <a-input-number v-model:value="filterConditions.lsStart" :min="0" :max="300"
                                        size="small" style="width: 80px" />
                                    <span class="ls-separator">-</span>
                                    <a-input-number v-model:value="filterConditions.lsEnd" :min="0" :max="300"
                                        size="small" style="width: 80px" />
                                </div>
                                <a-button type="primary" size="small" ghost @click="resetFilter">重置</a-button>
                            </div>
                        </div>
                        <div class="basic-data">
                            <draggable :list="filteredBasicParameterList" v-bind="dragOptions" :clone="cloneItem"
                                :sort="false" class="data-list">
                                <template #item="{ element }">
                                    <div class="data-item" @mouseenter="handleItemHover(element)"
                                        @mouseleave="handleItemLeave" @click="handleItemClick(element)">
                                        {{ element.Name }}
                                    </div>
                                </template>
                            </draggable>
                        </div>
                    </div>

                    <div class="divider" />

                    <!-- 参数区 -->
                    <div class="parameters-section" v-if="type === 'expression'">
                        <draggable :list="parameterList" v-bind="dragOptions" :clone="cloneItem" :sort="false"
                            class="parameters-list">
                            <template #item="{ element }">
                                <div class="parameter-item" @mouseenter="handleItemHover(element)"
                                    @mouseleave="handleItemLeave" @click="handleItemClick(element)">
                                    {{ element.Name }}
                                </div>
                            </template>
                        </draggable>
                    </div>

                    <div class="divider" v-if="type === 'expression'" />

                    <!-- 运算符区域 -->
                    <div class="operators-container">
                        <draggable :list="operators" v-bind="dragOptions" :clone="cloneItem" :sort="false"
                            class="operators-list">
                            <template #item="{ element }">
                                <div class="dragged-item operator" @click="handleItemClick(element)">
                                    {{ element.Name }}
                                </div>
                            </template>
                        </draggable>

                        <div class="input-divider" />

                        <div class="custom-input-wrapper">
                            <draggable :list="[customInputBtn]" v-bind="dragOptions" :clone="cloneItem" :sort="false"
                                class="custom-input-list">
                                <template #item>
                                    <div class="custom-input-btn">
                                        <a-button class="theme-button"
                                            style="width: 100%; background: var(--bg-color); color: var(--text-color); border: 1px solid var(--text-color);"
                                            @click="handleItemClick(customInputBtn)">输入框</a-button>
                                    </div>
                                </template>
                            </draggable>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部信息和按钮区域 -->
            <div class="dialog-footer">
                <div class="info-area">
                    <div class="info-content">
                        {{ hoverItemInfo || '鼠标悬浮在基础数据或参数上可查看详细信息' }}
                    </div>
                </div>
                <div class="button-group">
                    <a-button @click="handleCancel">取消</a-button>
                    <a-button @click="clearExpression">清除公式</a-button>
                    <a-button type="primary" @click="handleSave">保存</a-button>
                </div>
            </div>
        </div>
    </CustomDialog>

    <!-- 保存弹窗 -->
    <CustomDialog :model-value="saveDialogVisible" :title="type === 'parameter' ? '保存参数' : '保存表达式'" :width="600"
        @update:model-value="(val) => saveDialogVisible = val" @close="saveDialogVisible = false">
        <a-form :model="saveForm" label-width="120px">
            <a-form-item :label="type === 'parameter' ? '参数名称' : '表达式名称'" required>
                <a-input v-model:value="saveForm.name" :placeholder="type === 'parameter' ? '请输入参数名称' : '请输入表达式名称'"
                    allow-clear />
            </a-form-item>
            <a-form-item :label="type === 'parameter' ? '参数描述' : '表达式描述'" required>
                <a-textarea v-model:value="saveForm.description" :rows="3"
                    :placeholder="type === 'parameter' ? '请输入参数描述' : '请输入表达式描述'" />
            </a-form-item>
            <a-form-item label="公式预览">
                <div class="formula-preview">
                    <div class="preview-item">
                        <div class="preview-label">转换后公式：</div>
                        <div class="preview-content">{{ result }}</div>
                    </div>
                    <div class="preview-item">
                        <div class="preview-label">原始公式：</div>
                        <div class="preview-content">{{ originalExpression }}</div>
                    </div>
                </div>
            </a-form-item>
        </a-form>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="saveDialogVisible = false">取 消</a-button>
                <a-button type="primary" @click="confirmSave">确 定</a-button>
            </div>
        </template>
    </CustomDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps, defineEmits } from 'vue'
import draggable from 'vuedraggable'
import { message } from 'ant-design-vue'
import CustomDialog from '@/components/common/CustomDialog.vue'

// 本地存储的键名
const STORAGE_KEYS = {
    PARAMETERS: 'quant_parameters',
    EXPRESSIONS: 'quant_expressions'
}

// 定义组件属性
const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    type: {
        type: String,
        default: 'parameter'
    },
    loading: {
        type: Boolean,
        default: false
    }
})

// 定义组件事件
const emit = defineEmits(['update:visible', 'submit'])

// 计算属性
const title = computed(() => props.type === 'parameter' ? '新增参数' : '新增表达式')

// 状态管理
const expression = ref([])
const result = ref('')
const originalExpression = ref('')
const saveDialogVisible = ref(false)
const saveForm = ref({
    name: '',
    description: ''
})
const hoverItemInfo = ref('')

// 时间集合
const timeCollection = [
    { Name: '1F', dis: '1分钟' },
    { Name: '3F', dis: '3分钟' },
    { Name: '5F', dis: '5分钟' },
    { Name: '15F', dis: '15分钟' },
    { Name: '30F', dis: '30分钟' },
    { Name: '1S', dis: '1小时' },
    { Name: '2S', dis: '2小时' },
    { Name: '4S', dis: '4小时' },
    { Name: '6S', dis: '6小时' },
    { Name: '12S', dis: '12小时' },
    { Name: '1T', dis: '1天' },
    { Name: '2T', dis: '2天' },
    { Name: '3T', dis: '3天' },
    { Name: '5T', dis: '5天' },
    { Name: '1Z', dis: '1周' },
    { Name: '1Y', dis: '1月' },
    { Name: '3Y', dis: '3月' },
]

// 数据类型集合
const dataTypeCollection = [
    { Name: 'KP', dis: '开盘价' },
    { Name: 'SP', dis: '收盘价' },
    { Name: 'ZG', dis: '最高价' },
    { Name: 'ZD', dis: '最低价' },
    { Name: 'CJ', dis: '成交量' },
]

// 运算符列表
const operators = ref([
    { Name: '(', value: '(', type: 'operator' },
    { Name: ')', value: ')', type: 'operator' },
    { Name: '+', value: '+', type: 'operator' },
    { Name: '-', value: '-', type: 'operator' },
    { Name: '*', value: '*', type: 'operator' },
    { Name: '/', value: '/', type: 'operator' }
])

// 自定义输入按钮
const customInputBtn = ref({
    Name: '输入框',
    value: '',
    dis: '自定义输入',
    type: 'input',
    isInput: true
})

// 筛选条件
const filterConditions = ref({
    selectedTime: '1F',
    selectedType: '',
    lsStart: 0,
    lsEnd: 0
})

// 基础数据列表
const basicParameterList = ref([])

// 生成基础数据
const generateBasicData = () => {
    basicParameterList.value = timeCollection.map(time => {
        const data = dataTypeCollection.map(dataType => ({
            Name: `${dataType.Name}_${time.Name}`,
            dis: `${time.dis}${dataType.dis}`,
            value: `${dataType.Name}_${time.Name}`,
            type: 'basic'
        }))
        // 循环 300次 生成数据
        for (let i = 0; i < 300; i++) {
            const newDataItems = dataTypeCollection.map(dataType => ({
                Name: `LS_${dataType.Name}_${time.Name}_${i + 1}`,
                dis: `${time.dis}历史${dataType.dis}`,
                value: `LS_${dataType.Name}_${time.Name}_${i + 1}`,
                type: 'basic'
            }))
            data.push(...newDataItems)
        }
        return data
    }).flat()
}

// 初始化基础数据
generateBasicData()

// 参数列表和表达式列表
const parameterList = ref([])
const expressionList = ref([])

// 从本地存储读取数据
const loadFromStorage = () => {
    try {
        const storedParameters = localStorage.getItem(STORAGE_KEYS.PARAMETERS)
        const storedExpressions = localStorage.getItem(STORAGE_KEYS.EXPRESSIONS)

        if (storedParameters) {
            const parsedParams = JSON.parse(storedParameters)
            parameterList.value = parsedParams.map(param => ({
                Name: param.name,
                dis: param.description,
                value: param.formula,
                type: 'param'
            }))
        }

        if (storedExpressions) {
            const parsedExpressions = JSON.parse(storedExpressions)
            expressionList.value = parsedExpressions.map(expr => ({
                Name: expr.name,
                dis: expr.description,
                value: expr.formula,
                type: 'param'
            }))
        }
    } catch (error) {
        console.error('读取本地数据失败:', error)
    }
}

// 保存到本地存储
const saveToStorage = (type, data) => {
    try {
        const storageKey = type === 'parameter' ? STORAGE_KEYS.PARAMETERS : STORAGE_KEYS.EXPRESSIONS
        const currentData = localStorage.getItem(storageKey)
        let newData = []

        if (currentData) {
            newData = JSON.parse(currentData)
        }

        // 添加新数据
        newData.push({
            ...data,
            id: Date.now(),
            createTime: new Date().toISOString()
        })

        localStorage.setItem(storageKey, JSON.stringify(newData))

        // 通知父组件数据已更新
        emit('submit', { type, data: newData })
        message.success('保存成功')

        return true
    } catch (error) {
        console.error('保存到本地失败:', error)
        return false
    }
}

// 过滤后的基础数据列表
const filteredBasicParameterList = computed(() => {
    let filteredData = basicParameterList.value

    // 按时间筛选
    if (filterConditions.value.selectedTime) {
        filteredData = filteredData.filter(item =>
            item.Name.includes(`_${filterConditions.value.selectedTime}`)
        )
    }

    // 按类型筛选
    if (filterConditions.value.selectedType) {
        filteredData = filteredData.filter(item => {
            if (item.Name.startsWith('LS_')) {
                return item.Name.includes(`_${filterConditions.value.selectedType}_`)
            }
            return item.Name.startsWith(filterConditions.value.selectedType)
        })
    }

    // LS数据范围筛选
    if (filterConditions.value.lsStart === 0 && filterConditions.value.lsEnd === 0) {
        // 当起始和结束都为0时，不显示LS数据
        return filteredData.filter(item => !item.Name.startsWith('LS_'))
    } else {
        return filteredData.filter(item => {
            if (!item.Name.startsWith('LS_')) return true

            // 提取LS数据的序号
            const match = item.Name.match(/LS_.*?_(\d+)$/)
            if (!match) return false

            const index = parseInt(match[1])
            return index >= filterConditions.value.lsStart &&
                index <= filterConditions.value.lsEnd
        })
    }
})

// 重置所有状态
const resetState = () => {
    expression.value = []
    result.value = ''
    originalExpression.value = ''
    saveForm.value = {
        name: '',
        description: ''
    }
    filterConditions.value = {
        selectedTime: '1F',
        selectedType: '',
        lsStart: 0,
        lsEnd: 0
    }
    hoverItemInfo.value = ''
}

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
    if (newVal) {
        resetState()
        // 如果是表达式类型，重新加载参数列表
        if (props.type === 'expression') {
            loadFromStorage()
        }
    }
})

// 方法定义
const handleCancel = () => {
    emit('update:visible', false)
}

const clearExpression = () => {
    expression.value = []
    result.value = ''
    originalExpression.value = ''
}

const handleExpressionChange = () => {
    calculateExpression()
}

const calculateExpression = () => {
    result.value = expression.value.map(item => item.value).join(' ')
    // 生成原始表达式，对于输入框类型直接使用其值
    originalExpression.value = expression.value.map(item => {
        if (item.type === 'input') {
            return item.value
        }
        return item.Name
    }).join(' ')
}

const handleInputBlur = () => {
    calculateExpression()
}

const removeExpressionItem = (index) => {
    expression.value.splice(index, 1)
    calculateExpression()
}

const handleItemHover = (item) => {
    hoverItemInfo.value = `名称：${item.Name} - ${item.dis}\n公式：${item.value}`
}

const handleItemLeave = () => {
    hoverItemInfo.value = ''
}

const resetFilter = () => {
    filterConditions.value = {
        selectedTime: '1F',
        selectedType: '',
        lsStart: 0,
        lsEnd: 0
    }
}

const handleSave = () => {
    if (!result.value) {
        message.warning('请拖拽组合公式')
        return
    }
    // 先关闭主弹窗，再显示保存表单
    emit('update:visible', false)
    setTimeout(() => {
        saveDialogVisible.value = true
    }, 100)
}

// 确认保存
const confirmSave = () => {
    if (!saveForm.value.name || !saveForm.value.description) {
        message.warning('请输入名称和描述')
        return
    }

    const formData = {
        name: saveForm.value.name,
        description: saveForm.value.description,
        formula: result.value,
        originalFormula: originalExpression.value
    }

    // 保存到本地
    if (saveToStorage(props.type, formData)) {
        saveDialogVisible.value = false
        resetState()
    } else {
        message.error('保存失败')
    }
}

// 拖拽选项
const dragOptions = {
    animation: 200,
    group: {
        name: 'formula',
        pull: 'clone',
        put: false
    },
    ghostClass: "ghost",
    itemKey: "Name",
    clone: (original) => {
        return {
            ...original,
            id: Date.now()
        }
    }
}

// 拖拽区域的特殊配置
const dropzoneOptions = {
    animation: 200,
    group: {
        name: 'formula',
        pull: false,
        put: true
    },
    ghostClass: "ghost",
    itemKey: "Name",
    // 添加拖拽放置事件处理
    onAdd: (event) => {
        const item = event.item.__draggable_context.element
        // 如果是在新增表达式时拖入已有表达式，需要在两边添加括号
        if (props.type === 'expression' && item.type === 'param') {
            const index = event.newIndex
            // 移除原始项
            expression.value.splice(index, 1)
            // 添加带括号的表达式
            expression.value.splice(index, 0,
                {
                    Name: '(',
                    value: '(',
                    type: 'operator',
                    id: Date.now()
                },
                {
                    ...item,
                    id: Date.now() + 1
                },
                {
                    Name: ')',
                    value: ')',
                    type: 'operator',
                    id: Date.now() + 2
                }
            )
            calculateExpression()
        }
    }
}

// 添加克隆函数
const cloneItem = (item) => {
    return {
        ...item,
        id: Date.now()
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadFromStorage()
})

// 添加点击处理方法
const handleItemClick = (item) => {
    // 克隆一个新的对象，避免直接修改原对象
    const newItem = {
        ...item,
        id: Date.now() // 确保每个项都有唯一的id
    }

    // 如果是在新增表达式时点击已有表达式，需要在两边添加括号
    if (props.type === 'expression' && item.type === 'param') {
        // 先添加左括号
        expression.value.push({
            Name: '(',
            value: '(',
            type: 'operator',
            id: Date.now()
        })

        // 添加表达式
        expression.value.push(newItem)

        // 添加右括号
        expression.value.push({
            Name: ')',
            value: ')',
            type: 'operator',
            id: Date.now() + 1
        })
    } else {
        // 其他情况直接添加
        expression.value.push(newItem)
    }

    // 如果是输入框类型，需要确保value属性存在
    if (newItem.type === 'input') {
        newItem.value = ''
    }

    // 更新表达式结果
    calculateExpression()
}
</script>

<style scoped>
/* 保存弹窗样式 */
:deep(.ant-form-item:first-child .ant-input),
:deep(.ant-form-item:first-child .ant-input-affix-wrapper) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-form-item:first-child .ant-input::placeholder) {
    color: var(--text-secondary) !important;
}

:deep(.ant-form-item:first-child .ant-input:hover),
:deep(.ant-form-item:first-child .ant-input:focus),
:deep(.ant-form-item:first-child .ant-input-affix-wrapper:hover),
:deep(.ant-form-item:first-child .ant-input-affix-wrapper:focus) {
    background-color: var(--bg-hover) !important;
    border-color: var(--primary-color) !important;
}

:deep(.ant-form-item:first-child .ant-input-affix-wrapper input.ant-input) {
    background-color: transparent !important;
    border: none !important;
}

.formula-dialog {
    background-color: var(--bg-color);
    color: var(--text-color);
}

.basic-data-info {
    margin-bottom: 12px;
}

.naming-rules {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
}

.rule-header {
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 4px;
    font-size: 12px;
}

.rule-item {
    margin-bottom: 4px;
}

.rule-item:last-child {
    margin-bottom: 0;
}

.rule-item.formats .rule-content {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 0;
}

.rule-item.formats .format-item {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
}

.rule-item.formats .divider {
    width: 1px;
    height: 20px;
    background: #dcdfe6;
}

.rule-title {
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 2px;
    font-size: 12px;
}

.rule-content {
    color: var(--text-secondary);
    line-height: 1.3;
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
}

.code {
    background: var(--bg-hover);
    color: var(--primary-color);
    padding: 1px 4px;
    border-radius: 2px;
    font-family: monospace;
    font-size: 12px;
}

.rule-types span,
.rule-times span {
    background: var(--bg-hover);
    color: var(--success-color);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 11px;
}

.result-area {
    margin-bottom: 16px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.result-display {
    padding: 12px;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-height: 24px;
    font-family: monospace;
    font-size: 14px;
    color: var(--text-color);
}

.expression-area {
    min-height: 80px;
    border: 2px dashed var(--border-color);
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 16px;
    background: var(--bg-color);
}

.expression-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 40px;
    align-items: center;
}

.dragged-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: move;
    user-select: none;
    font-size: 12px;
    min-width: 24px;
    text-align: center;
    height: 28px;
}

.dragged-item.basic {
    background: var(--primary-color);
    color: white;
}

.dragged-item.param {
    background: var(--bg-color);
    color: var(--success-color);
    border: 1px solid var(--text-color);
}

.dragged-item.operator {
    background: var(--bg-color);
    color: var(--warning-color);
    border: 1px solid var(--text-color);
}

.dragged-item.input {
    padding: 0;
    width: 80px;
    background: transparent;
}

.combined-section {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 12px;
}

.filter-group {
    display: flex;
    gap: 6px;
    align-items: center;
}

.ls-filter {
    display: flex;
    align-items: center;
    gap: 4px;
}

.ls-label {
    font-size: 12px;
    color: var(--text-secondary);
}

.basic-data {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 8px;
    border-radius: 4px;
}

.data-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.data-item {
    background: var(--primary-color);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: move;
    user-select: none;
    font-size: 12px;
}

.divider {
    height: 1px;
    background: var(--border-color);
    margin: 15px 0;
}

.parameters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.parameter-item {
    background: var(--bg-color);
    color: var(--success-color);
    border: 1px solid var(--text-color);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: move;
    user-select: none;
    font-size: 12px;
}

.operators-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.operators-list {
    width: 75%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
}

.input-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
}

.custom-input-wrapper {
    width: 25%;
}

.custom-input-list {
    width: 100%;
}

.dialog-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0 0 0;
}

.info-area {
    flex: 1;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-height: 32px;
    display: flex;
    align-items: center;
    padding: 0 12px;
}

.info-content {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-line;
    width: 100%;
}

.button-group {
    display: flex;
    gap: 8px;
}

.formula-preview {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.preview-item {
    padding: 8px 12px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid var(--border-color);
}

.preview-label {
    color: var(--text-secondary);
    font-size: 13px;
    white-space: nowrap;
    min-width: 80px;
}

.preview-content {
    color: var(--text-color);
    font-family: monospace;
    font-size: 14px;
    flex: 1;
    word-break: break-all;
}
</style>