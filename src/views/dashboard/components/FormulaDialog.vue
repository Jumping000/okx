<template>
    <CustomDialog :model-value="visible" :title="title" :width="900" :z-index="2000" :close-on-click-mask="false"
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
                            <span class="divider" />
                            <div class="format-item">
                                <span class="code">指标类型_时间周期_参数值</span>
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
                    <!-- 指标 -->
                    <div class="rule-item">
                        <div class="rule-title">指标说明：</div>
                        <div class="rule-content rule-times">
                            <span>MA - 移动平均线</span>
                            <span>EMA - 指数移动平均线</span>
                            <span>BOLL - 布林带</span>
                            <span>MACD - 移动平均线收敛/发散指标</span>
                            <span>KDJ - 随机指标</span>
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
                <draggable v-model="expression" v-bind="dropzoneOptions" @change="handleExpressionChange" item-key="id">
                    <template #item="{ element, index }">
                        <div :class="['dragged-item', element?.type]" :data-is-input="!!element?.isInput"
                            @dblclick="removeExpressionItem(index)">
                            <template v-if="element?.type === 'input'">
                                <a-input v-model:value="element.value" style="width: 100%" @blur="handleInputBlur" />
                            </template>
                            <template v-else>
                                {{ element?.Name || '' }}
                            </template>
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
                                <el-select v-model="filterConditions.selectedTime" placeholder="选择时间" clearable
                                    size="small" style="width: 120px">
                                    <el-option v-for="time in timeCollection" :key="time.Name" :label="time.dis"
                                        :value="time.Name" />
                                </el-select>
                                <el-select v-model="filterConditions.selectedType" placeholder="选择类型" clearable
                                    size="small" style="width: 120px">
                                    <el-option v-for="type in dataTypeCollection" :key="type.Name" :label="type.dis"
                                        :value="type.Name" />
                                    <el-option v-for="indicator in indicatorCollection" :key="indicator.Name"
                                        :label="indicator.dis" :value="indicator.Name" />
                                </el-select>
                                <div class="ls-filter">
                                    <span class="ls-label">LS范围:</span>
                                    <el-input-number v-model="filterConditions.lsStart" :min="0" :max="300" size="small"
                                        style="width: 80px" />
                                    <span class="ls-separator">-</span>
                                    <el-input-number v-model="filterConditions.lsEnd" :min="0" :max="300" size="small"
                                        style="width: 80px" />
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
        :height="400" :z-index="2100" @update:model-value="(val) => saveDialogVisible = val"
        @close="saveDialogVisible = false">
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

    <!-- 周期输入弹窗 -->
    <CustomDialog :model-value="periodInputVisible" :title="`请输入${currentIndicator?.dis || ''}的周期值`" :width="400"
        :z-index="2200" @update:model-value="(val) => periodInputVisible = val" @close="periodInputVisible = false">
        <div class="period-input-content">
            <a-input-number v-model:value="periodInputValue" :min="1" :max="1000" style="width: 100%"
                placeholder="请输入周期值" @pressEnter="handlePeriodInputConfirm" />
            <div class="period-input-tip">
                请输入1-1000之间的整数
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="periodInputVisible = false">取 消</a-button>
                <a-button type="primary" :loading="periodInputLoading" @click="handlePeriodInputConfirm">
                    确 定
                </a-button>
            </div>
        </template>
    </CustomDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps, defineEmits } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
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
const periodInputVisible = ref(false)
const periodInputValue = ref('5')
const currentIndicator = ref(null)
const periodInputLoading = ref(false)

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

// 指标集合 
const indicatorCollection = [
    { Name: 'MA', dis: '移动平均线', isCustomPeriod: true },
    { Name: 'EMA', dis: '指数移动平均线', isCustomPeriod: true },
    { Name: 'BOLL_UP', dis: '布林带' },
    { Name: 'BOLL_MID', dis: '布林带' },
    { Name: 'BOLL_LOW', dis: '布林带' },
    { Name: 'MACD_DIF', dis: '移动平均线收敛/发散指标' },
    { Name: 'MACD_DEA', dis: '移动平均线收敛/发散指标' },
    { Name: 'MACD_MACD', dis: '移动平均线收敛/发散指标' },
    { Name: 'KDJ_K', dis: '随机指标' },
    { Name: 'KDJ_D', dis: '随机指标' },
    { Name: 'KDJ_J', dis: '随机指标' },
]

// 运算符列表
const operators = ref([
    { Name: '(', value: '(', type: 'operator', isInput: false },
    { Name: ')', value: ')', type: 'operator', isInput: false },
    { Name: '+', value: '+', type: 'operator', isInput: false },
    { Name: '-', value: '-', type: 'operator', isInput: false },
    { Name: '*', value: '*', type: 'operator', isInput: false },
    { Name: '/', value: '/', type: 'operator', isInput: false }
].map(op => ({ ...op, id: `operator-${op.Name}` })))

// 自定义输入按钮
const customInputBtn = ref({
    Name: '输入框',
    value: '',
    dis: '自定义输入',
    type: 'input',
    isInput: true,
    id: 'custom-input'
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
        let data = []

        // 添加基础数据类型
        data.push(...dataTypeCollection.map(dataType => ({
            Name: `${dataType.Name}_${time.Name}`,
            dis: `${time.dis}${dataType.dis}`,
            value: `${dataType.Name}_${time.Name}`,
            type: 'basic'
        })))

        // 添加指标数据
        data.push(...indicatorCollection.map(indicator => {
            if (indicator.isCustomPeriod) {
                // 对于 MA 和 EMA，添加输入框组合
                return {
                    Name: `${indicator.Name}_${time.Name}`,
                    dis: `${time.dis}${indicator.dis}`,
                    value: `${indicator.Name}_${time.Name}`,
                    type: 'indicator',
                    needInput: true,
                    baseIndicator: indicator.Name
                }
            } else {
                // 其他普通指标
                return {
                    Name: `${indicator.Name}_${time.Name}`,
                    dis: `${time.dis}${indicator.dis}`,
                    value: `${indicator.Name}_${time.Name}`,
                    type: 'indicator'
                }
            }
        }))

        // 循环 300次 生成历史数据
        for (let i = 0; i < 300; i++) {
            data.push(...dataTypeCollection.map(dataType => ({
                Name: `LS_${dataType.Name}_${time.Name}_${i + 1}`,
                dis: `${time.dis}历史${dataType.dis}`,
                value: `LS_${dataType.Name}_${time.Name}_${i + 1}`,
                type: 'basic'
            })))
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
        ElMessage.success('保存成功')

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
                // 对于历史数据，使用包含匹配
                return item.Name.includes(`_${filterConditions.value.selectedType}_`)
            }

            // 检查是否是指标类型
            const isIndicator = indicatorCollection.some(ind => ind.Name === filterConditions.value.selectedType)
            if (isIndicator) {
                // 使用精确的指标类型匹配，确保不会匹配到其他指标
                const parts = item.Name.split('_')
                return parts[0] === filterConditions.value.selectedType
            }

            // 对于基础数据类型，使用精确的前缀匹配
            return item.Name.startsWith(`${filterConditions.value.selectedType}_`)
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
    // 过滤掉无效的表达式项
    const validExpressions = expression.value.filter(item => item && item.value !== undefined && item.value !== null);

    // 计算结果表达式
    result.value = validExpressions.map(item => item.value).join(' ');

    // 生成原始表达式，对于输入框类型直接使用其值
    originalExpression.value = validExpressions.map(item => {
        if (item.type === 'input') {
            return item.value || '';
        }
        return item.Name || '';
    }).join(' ');
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
        ElMessage.warning('请拖拽组合公式')
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
        ElMessage.warning('请输入名称和描述')
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
        ElMessage.success('保存成功')
    } else {
        ElMessage.error('保存失败')
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
    if (!item) return null;

    const baseItem = {
        ...item,
        id: Date.now(),
        value: item.value || item.Name || '',
        Name: item.Name || '',
        type: item.type || 'basic',
        isInput: item.type === 'input'
    };

    if (item.needInput) {
        currentIndicator.value = item;
        periodInputValue.value = '5';
        periodInputVisible.value = true;
        return null;
    }

    return baseItem;
}

// 添加周期输入处理函数
const handlePeriodInputConfirm = () => {
    if (!currentIndicator.value) return;

    periodInputLoading.value = true;
    try {
        const period = parseInt(periodInputValue.value);
        if (isNaN(period) || period <= 0) {
            ElMessage.error('请输入有效的周期值');
            return;
        }

        const timePart = currentIndicator.value.Name.split('_')[1] || '';
        if (!timePart) {
            ElMessage.error('无效的时间周期');
            return;
        }

        const newItem = {
            ...currentIndicator.value,
            Name: `${currentIndicator.value.baseIndicator}_${timePart}_${period}`,
            value: `${currentIndicator.value.baseIndicator}_${timePart}_${period}`,
            id: Date.now()
        };

        if (props.type === 'expression' && currentIndicator.value.type === 'param') {
            expression.value.push(
                { Name: '(', value: '(', type: 'operator', id: Date.now() },
                newItem,
                { Name: ')', value: ')', type: 'operator', id: Date.now() + 1 }
            );
        } else {
            expression.value.push(newItem);
        }

        calculateExpression();
        periodInputVisible.value = false;
        currentIndicator.value = null;
    } finally {
        periodInputLoading.value = false;
    }
}

// 修改点击处理方法
const handleItemClick = (item) => {
    if (!item) return;

    if (item.needInput) {
        currentIndicator.value = item;
        periodInputValue.value = '5';
        periodInputVisible.value = true;
        return;
    }

    const newItem = {
        ...item,
        id: Date.now(),
        value: item.value || item.Name || '',
        Name: item.Name || '',
        type: item.type || 'basic',
        isInput: item.type === 'input'
    };

    if (props.type === 'expression' && item.type === 'param') {
        expression.value.push(
            { Name: '(', value: '(', type: 'operator', id: Date.now(), isInput: false },
            newItem,
            { Name: ')', value: ')', type: 'operator', id: Date.now() + 1, isInput: false }
        );
    } else {
        expression.value.push(newItem);
    }

    calculateExpression();
}

// 组件挂载时加载数据
onMounted(() => {
    loadFromStorage()
})
</script>

<style lang="scss" scoped>
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
    display: inline-block;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    background: var(--primary-color);
    color: white;
}

.dragged-item[data-is-input="true"] {
    padding: 0;
    width: 80px;
    background: transparent;
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

/* 添加周期输入弹窗样式 */
.period-input-content {
    padding: 20px 0;
}

.period-input-tip {
    margin-top: 8px;
    color: var(--text-secondary);
    font-size: 12px;
}

:deep(.ant-input-number) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
}

:deep(.ant-input-number:hover),
:deep(.ant-input-number:focus) {
    border-color: var(--primary-color) !important;
}

:deep(.ant-input-number-input) {
    background-color: transparent !important;
    color: var(--text-color) !important;
}

:deep(.ant-modal-content),
:deep(.ant-modal-header) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
}

:deep(.ant-modal-title) {
    color: var(--text-color) !important;
}

:deep(.ant-modal-close-x) {
    color: var(--text-color) !important;
}

/* 确保遮罩层样式正确 */
:deep(.period-input-modal .ant-modal-mask) {
    background-color: rgba(0, 0, 0, 0.45);
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

/* 调整弹窗容器样式 */
:deep(.period-input-modal .ant-modal-wrap) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
    outline: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 100px;
}

/* 添加 Element Plus 组件的样式覆盖 */
:deep(.el-select) {
    --el-select-border-color-hover: var(--primary-color);
}

:deep(.el-select .el-input__wrapper) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
}

:deep(.el-select .el-input__wrapper:hover) {
    border-color: var(--primary-color);
}

:deep(.el-select .el-input__inner) {
    color: var(--text-color);
}

:deep(.el-select .el-input__inner::placeholder) {
    color: var(--text-secondary);
}

:deep(.el-input-number) {
    --el-input-number-border-color: var(--border-color);
    --el-input-number-hover-border-color: var(--primary-color);
}

:deep(.el-input-number .el-input__wrapper) {
    background-color: var(--bg-color);
}

:deep(.el-input-number .el-input__inner) {
    color: var(--text-color);
}

:deep(.el-select-dropdown) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
}

:deep(.el-select-dropdown__item) {
    color: var(--text-color);
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
    background-color: var(--bg-hover);
}

:deep(.el-select-dropdown__item.selected) {
    color: var(--primary-color);
    background-color: var(--bg-hover);
}
</style>