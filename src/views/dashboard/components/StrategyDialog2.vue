<template>
    <CustomDialog :model-value="visible" title="新增策略2" :width="1200" :close-on-click-mask="false"
        @update:model-value="(val) => emit('update:visible', val)" @close="handleCancel">
        <div class="strategy-dialog">
            <div class="dialog-content">
                <!-- 左侧：基础信息区 -->
                <div class="left-panel">
                    <a-form :model="form" layout="vertical">
                        <div class="section-header">
                            <span class="title">基础信息</span>
                        </div>
                        <div class="section-content">
                            <a-form-item label="策略名称" required>
                                <a-input v-model:value="form.name" placeholder="请输入策略名称" />
                            </a-form-item>
                            <a-form-item label="策略描述" required>
                                <a-textarea v-model:value="form.description" placeholder="请输入策略描述" :rows="2" />
                            </a-form-item>
                            <a-form-item label="交易类型" v-show="false">
                                <a-input value="永续" disabled />
                            </a-form-item>
                            <a-form-item label="币种信息" required>
                                <a-select v-model:value="form.currency" 
                                    style="width: 100%" 
                                    placeholder="请选择交易币种"
                                    :options="currencyOptions"
                                    :popup-class-name="'currency-select-dropdown'"
                                    :get-popup-container="(triggerNode) => triggerNode.parentNode"
                                    show-search
                                    :filter-option="filterOption"
                                    search-placeholder="搜索币种"
                                />
                            </a-form-item>
                            <div class="form-row">
                                <a-form-item label="委托数量(张)" required>
                                    <a-input-number v-model:value="form.quantity" :min="1" style="width: 100%" />
                             
                                </a-form-item>
                                <a-form-item label="杠杆倍数" required>
                                    <a-input-number v-model:value="form.leverage" :min="1" :max="100" style="width: 100%" />
                                </a-form-item>
                            </div>
                            <div class="form-row">
                                <a-form-item label="止损比例" required>
                                    <a-input-number v-model:value="form.stopLoss" :min="0" :max="100" :step="0.1"
                                        style="width: 100%" />
                                    <span class="unit">(1%-100%=0.01-1)</span>
                                </a-form-item>
                                <a-form-item label="阈值比例" required>
                                    <a-input-number v-model:value="form.threshold" :min="0" :max="100" :step="0.1"
                                        style="width: 100%" />
                                    <span class="unit">(1%-100%=0.01-1)</span>
                                </a-form-item>
                            </div>
                        </div>
                    </a-form>
                </div>

                <!-- 右侧：策略编辑区 -->
                <div class="right-panel">
                    <div class="section-header">
                        <span class="title">策略编辑</span>
                    </div>
                    <div class="section-content">
                        <!-- 策略模式选择 -->
                        <div class="strategy-mode">
                            <a-form-item label="策略模式" required>
                                <a-radio-group v-model:value="form.strategyMode" button-style="solid">
                                    <a-radio-button value="1">单策略</a-radio-button>
                                    <a-radio-button value="2">双策略</a-radio-button>
                                    <a-radio-button value="4">四策略</a-radio-button>
                                </a-radio-group>
                            </a-form-item>
                        </div>

                        <!-- 策略配置区域 -->
                        <div class="strategy-config">
                            <!-- 1策略模式 -->
                            <template v-if="form.strategyMode === '1'">
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">单策略条件</div>
                                        <a-button type="link" @click="addStrategy1Condition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy1Conditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                            </template>

                            <!-- 2策略模式 -->
                            <template v-if="form.strategyMode === '2'">
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">多仓条件</div>
                                        <a-button type="link" @click="addStrategy2LongCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy2LongConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">空仓条件</div>
                                        <a-button type="link" @click="addStrategy2ShortCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy2ShortConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                            </template>

                            <!-- 4策略模式 -->
                            <template v-if="form.strategyMode === '4'">
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">开多条件</div>
                                        <a-button type="link" @click="addStrategy4OpenLongCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy4OpenLongConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">开空条件</div>
                                        <a-button type="link" @click="addStrategy4OpenShortCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy4OpenShortConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">平多条件</div>
                                        <a-button type="link" @click="addStrategy4CloseLongCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy4CloseLongConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                                <div class="strategy-section">
                                    <div class="strategy-header">
                                        <div class="strategy-label">平空条件</div>
                                        <a-button type="link" @click="addStrategy4CloseShortCondition">
                                            <template #icon><plus-outlined /></template>
                                            添加条件
                                        </a-button>
                                    </div>
                                    <strategy-condition-editor
                                        v-model:conditions="form.strategy4CloseShortConditions"
                                        :expression-options="expressionOptions"
                                    />
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="handleCancel">取消</a-button>
                <a-button type="primary" :loading="loading" @click="handleSubmit">确定</a-button>
            </div>
        </template>
    </CustomDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useCurrencyStore } from '@/store/currency'
import CustomDialog from '@/components/common/CustomDialog.vue'
import StrategyConditionEditor from './StrategyConditionEditor.vue'

// 定义组件属性
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    }
})

// 定义组件事件
const emit = defineEmits(['update:visible', 'submit'])

// 获取币种列表
const currencyStore = useCurrencyStore()

// 监听弹窗显示状态，确保币种数据加载
watch(() => props.visible, (newVal) => {
    if (newVal) {
        currencyStore.fetchCurrencies()
    }
})

const currencyOptions = computed(() => {
    const currencies = currencyStore.currencies?.['SWAP'] || []
    return currencies.map(currency => ({
        label: currency.instId.split('-')[0],
        value: currency.instId
    }))
})

// 币种搜索过滤函数
const filterOption = (input, option) => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
}

// 表单数据
const form = ref({
    name: '',
    description: '',
    currency: undefined,
    quantity: 1,
    leverage: 1,
    stopLoss: 0.05,
    threshold: 0.05,
    strategyMode: '2',
    // 1策略模式数据
    strategy1Conditions: [],
    // 2策略模式数据
    strategy2LongConditions: [],
    strategy2ShortConditions: [],
    // 4策略模式数据
    strategy4OpenLongConditions: [],
    strategy4OpenShortConditions: [],
    strategy4CloseLongConditions: [],
    strategy4CloseShortConditions: []
})

// 表达式选项
const expressionOptions = ref([])

// 加载表达式列表
const loadExpressions = () => {
    try {
        const storedExpressions = localStorage.getItem('quant_expressions')
        if (storedExpressions) {
            const parsedExpressions = JSON.parse(storedExpressions)
            expressionOptions.value = parsedExpressions.map(expr => ({
                label: expr.name,
                value: `(${expr.formula})`
            }))
        }
    } catch (error) {
        console.error('加载表达式失败:', error)
    }
}

// 添加条件的处理方法
const addStrategy1Condition = () => {
    form.value.strategy1Conditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy2LongCondition = () => {
    form.value.strategy2LongConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy2ShortCondition = () => {
    form.value.strategy2ShortConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy4OpenLongCondition = () => {
    form.value.strategy4OpenLongConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy4OpenShortCondition = () => {
    form.value.strategy4OpenShortConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy4CloseLongCondition = () => {
    form.value.strategy4CloseLongConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

const addStrategy4CloseShortCondition = () => {
    form.value.strategy4CloseShortConditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

// 取消处理
const handleCancel = () => {
    emit('update:visible', false)
    form.value = {
        name: '',
        description: '',
        currency: undefined,
        quantity: 1,
        leverage: 1,
        stopLoss: 0.05,
        threshold: 0.05,
        strategyMode: '2',
        strategy1Conditions: [],
        strategy2LongConditions: [],
        strategy2ShortConditions: [],
        strategy4OpenLongConditions: [],
        strategy4OpenShortConditions: [],
        strategy4CloseLongConditions: [],
        strategy4CloseShortConditions: []
    }
}

// 提交处理
const handleSubmit = () => {
    // 表单验证
    if (!form.value.name) {
        message.error('请输入策略名称')
        return
    }
    if (!form.value.description) {
        message.error('请输入策略描述')
        return
    }
    if (!form.value.currency) {
        message.error('请选择交易币种')
        return
    }

    // 验证策略条件
    const validateConditions = () => {
        if (form.value.strategyMode === '1' && form.value.strategy1Conditions.length === 0) {
            message.error('请添加策略条件')
            return false
        }
        if (form.value.strategyMode === '2' && 
            (form.value.strategy2LongConditions.length === 0 || form.value.strategy2ShortConditions.length === 0)) {
            message.error('请完善多空策略条件')
            return false
        }
        if (form.value.strategyMode === '4' && 
            (form.value.strategy4OpenLongConditions.length === 0 || 
             form.value.strategy4OpenShortConditions.length === 0 ||
             form.value.strategy4CloseLongConditions.length === 0 ||
             form.value.strategy4CloseShortConditions.length === 0)) {
            message.error('请完善所有策略条件')
            return false
        }
        return true
    }

    if (!validateConditions()) {
        return
    }

    // 生成策略ID
    const id = `strategy_${Date.now()}`

    // 构造策略数据
    const strategyData = {
        id,
        ...form.value,
        status: 'stopped',
        createTime: new Date().toISOString(),
        positionType: 'cross', // 默认全仓
        type: 'strategy2' // 标记为策略2类型
    }

    // 保存到本地存储
    try {
        const storedStrategies = localStorage.getItem('quant_strategies') || '[]'
        const strategies = JSON.parse(storedStrategies)
        strategies.push(strategyData)
        localStorage.setItem('quant_strategies', JSON.stringify(strategies))

        emit('submit', strategyData)
        message.success('保存成功')
        handleCancel()
    } catch (error) {
        console.error('保存策略失败:', error)
        message.error('保存失败')
    }
}

// 初始化时加载币种列表和表达式
loadExpressions()
</script>

<style lang="scss" scoped>
.strategy-dialog {
    padding: 20px;
    background-color: var(--bg-color);
    color: var(--text-color);
    max-height: calc(100vh - 300px);
    overflow-y: auto;
}

.dialog-content {
    display: flex;
    gap: 20px;
}

.left-panel {
    flex: 0 0 300px;
    background: var(--bg-hover);
    border-radius: 8px;
    padding: 16px;
    height: fit-content;
    border: 1px solid var(--border-color);

    .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }

        :deep(.ant-form-item) {
            flex: 1;
            margin-bottom: 0;
        }
    }

    :deep(.ant-form-item) {
        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }

        .ant-form-item-label {
            padding-bottom: 4px;

            label {
                color: var(--text-color);
                font-size: 14px;
                height: 28px;
                
                &.ant-form-item-required:not(.ant-form-item-required-mark-optional) {
                    &::before {
                        color: var(--error-color);
                    }
                }
            }
        }

        .ant-input,
        .ant-input-number,
        .ant-select:not(.ant-select-customize-input) .ant-select-selector {
            background-color: var(--bg-color);
            border-color: var(--border-color);
            color: var(--text-color);
            transition: all 0.3s;

            &:hover {
                border-color: var(--primary-color);
            }

            &:focus,
            &.ant-input-focused,
            &.ant-input-number-focused,
            &.ant-select-focused {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px var(--primary-color-10);
            }
        }

        .ant-input-number-handler-wrap {
            background-color: var(--bg-color);

            .ant-input-number-handler {
                border-color: var(--border-color);

                &:hover {
                    .ant-input-number-handler-up-inner,
                    .ant-input-number-handler-down-inner {
                        color: var(--primary-color);
                    }
                }
            }
        }

        .ant-select-arrow {
            color: var(--text-color);
        }

        .ant-input-disabled,
        .ant-input-number-disabled,
        .ant-select-disabled .ant-select-selector {
            background-color: var(--bg-hover);
            border-color: var(--border-color);
            color: var(--text-secondary);
            cursor: not-allowed;

            &:hover {
                border-color: var(--border-color);
            }
        }
    }
}

.right-panel {
    flex: 1;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 0 16px;
    padding-left: 10px;
    border-left: 4px solid var(--primary-color);

    .title {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color);
    }
}

.section-content {
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
}

.strategy-mode {
    margin-bottom: 20px;
}

.strategy-section {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--bg-hover);
    border-radius: 8px;
}

.strategy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.strategy-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-color);
    padding-left: 8px;
    border-left: 3px solid var(--primary-color);
    margin-bottom: 0;
}

.unit {
    margin-left: 8px;
    color: var(--text-secondary);
    font-size: 12px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

:deep(.ant-radio-button-wrapper) {
    background: var(--bg-color);
    border-color: var(--border-color);
    color: var(--text-color);

    &:hover {
        color: var(--primary-color);
    }

    &.ant-radio-button-wrapper-checked {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: #fff;
    }
}

// 添加下拉框样式
:deep(.currency-select-dropdown) {
    background-color: var(--bg-color);
    border-color: var(--border-color);
    
    .ant-select-item {
        color: var(--text-color);
        
        &:hover {
            background-color: var(--bg-hover);
        }
        
        &.ant-select-item-option-selected {
            background-color: var(--primary-color);
            color: #fff;
        }
    }
}

// 确保下拉框在对话框之上
:deep(.ant-select-dropdown) {
    z-index: 1100 !important;
}
</style> 