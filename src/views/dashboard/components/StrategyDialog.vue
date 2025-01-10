<template>
    <CustomDialog :model-value="visible" title="新增策略" :width="800" :close-on-click-mask="false"
        @update:model-value="(val) => emit('update:visible', val)" @close="handleCancel">
        <div class="strategy-dialog">
            <a-form :model="form" layout="vertical">
                <!-- 基本信息 -->
                <div class="section-header">
                    <span class="title">基本信息</span>
                </div>
                <div class="section-content">
                    <a-form-item label="策略名称" required>
                        <a-input v-model:value="form.name" placeholder="请输入策略名称" />
                    </a-form-item>
                    <a-form-item label="策略描述" required>
                        <a-textarea v-model:value="form.description" placeholder="请输入策略描述" :rows="2" />
                    </a-form-item>
                    <a-form-item label="交易类型" required>
                        <a-radio-group v-model:value="form.tradeType" @change="handleTradeTypeChange">
                            <a-radio value="SPOT">现货</a-radio>
                            <a-radio value="SWAP">永续</a-radio>
                        </a-radio-group>
                    </a-form-item>
                </div>

                <!-- 交易设置 -->
                <div class="section-header">
                    <span class="title">交易设置</span>
                </div>
                <div class="section-content">
                    <div class="currency-settings">
                        <div class="settings-row">
                            <a-form-item label="币种" required>
                                <el-select v-model="form.currency" placeholder="请选择币种" filterable style="width: 120px">
                                    <el-option v-for="currency in currentCurrencies" :key="currency.instId"
                                        :label="currency.instId.replace('-SWAP', '').replace('-USDT', '')"
                                        :value="currency.instId">
                                        <div class="flex items-center justify-between">
                                            <span>{{ currency.instId.replace('-SWAP', '').replace('-USDT', '') }}</span>
                                            <span class="text-dark-200 text-xs">
                                                {{ currency.instId.includes('-SWAP') ? '永续' : '现货' }}
                                            </span>
                                        </div>
                                    </el-option>
                                </el-select>
                            </a-form-item>
                            <a-form-item label="委托数量" required>
                                <a-input-number v-model:value="form.quantity" :min="0" :precision="4" :step="0.0001"
                                    style="width: 120px" />
                            </a-form-item>
                            <template v-if="form.tradeType === 'SWAP'">
                                <a-form-item label="杠杆倍数" required>
                                    <a-input-number v-model:value="form.leverage" :min="1" :max="125"
                                        style="width: 100px" />
                                </a-form-item>
                                <a-form-item label="仓位类型" required>
                                    <el-select v-model="form.positionType" style="width: 100px">
                                        <el-option value="cross" label="全仓" />
                                        <el-option value="isolated" label="逐仓" />
                                    </el-select>
                                </a-form-item>
                            </template>
                            <a-form-item label="止损比例" required>
                                <a-input-number v-model:value="form.stopLoss" :min="0" :max="100" :step="0.1"
                                    style="width: 100px" />
                                <span class="unit">%</span>
                            </a-form-item>
                        </div>
                    </div>
                </div>

                <!-- 触发条件 -->
                <div class="section-header">
                    <span class="title">触发条件</span>
                    <a-button type="link" @click="addCondition">
                        <template #icon><plus-outlined /></template>
                        添加条件
                    </a-button>
                </div>
                <div class="section-content">
                    <div v-if="form.conditions.length === 0" class="empty-tip">
                        请添加触发条件
                    </div>
                    <div v-else class="conditions-list">
                        <div v-for="(condition, index) in form.conditions" :key="index" class="condition-item">
                            <div class="condition-content">
                                <el-select v-model="condition.expression" placeholder="选择表达式" style="width: 200px">
                                    <el-option v-for="expr in expressionOptions" :key="expr.value" :label="expr.label"
                                        :value="expr.value" />
                                </el-select>
                                <el-select v-model="condition.compareType" placeholder="比较类型" style="width: 120px">
                                    <el-option v-for="type in compareTypes" :key="type.value" :label="type.label"
                                        :value="type.value" />
                                </el-select>
                                <a-input-number v-model:value="condition.value" placeholder="比较值"
                                    style="width: 120px" />
                                <template v-if="index < form.conditions.length - 1">
                                    <el-select v-model="condition.relation" placeholder="关系" style="width: 80px">
                                        <el-option value="and" label="并且" />
                                        <el-option value="or" label="或者" />
                                    </el-select>
                                </template>
                                <a-button type="link" danger @click="removeCondition(index)">
                                    <template #icon><delete-outlined /></template>
                                </a-button>
                            </div>
                        </div>
                    </div>
                </div>
            </a-form>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="handleCancel">取消</a-button>
                <a-button type="primary" @click="handleSave">确定</a-button>
            </div>
        </template>
    </CustomDialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import CustomDialog from '@/components/common/CustomDialog.vue'
import { useCurrencyStore } from '@/store/currency'

// Props 定义
const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    }
})

// Emits 定义
const emit = defineEmits(['update:visible', 'submit'])

// Store
const currencyStore = useCurrencyStore()

// 表单数据
const form = ref({
    name: '',
    description: '',
    tradeType: 'SPOT',
    currency: '',
    quantity: 0,
    leverage: 1,
    positionType: 'cross',
    stopLoss: 0,
    conditions: []
})

// 币种列表
const currentCurrencies = computed(() => {
    return currencyStore.currencies[form.value.tradeType] || []
})

// 表达式选项
const expressionOptions = ref([])

// 比较类型选项
const compareTypes = [
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' },
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' }
]

// 交易类型变更处理
const handleTradeTypeChange = () => {
    form.value.currency = ''
}

// 添加触发条件
const addCondition = () => {
    form.value.conditions.push({
        expression: '',
        compareType: '',
        value: null,
        relation: 'and'
    })
}

// 删除触发条件
const removeCondition = (index) => {
    form.value.conditions.splice(index, 1)
}

// 取消处理
const handleCancel = () => {
    emit('update:visible', false)
}

// 保存处理
const handleSave = () => {
    // 表单验证
    if (!form.value.name || !form.value.description) {
        message.warning('请填写必填项')
        return
    }

    if (!form.value.currency || !form.value.quantity) {
        message.warning('请完善币种设置信息')
        return
    }

    if (form.value.conditions.length === 0) {
        message.warning('请至少添加一个触发条件')
        return
    }

    // 验证触发条件
    for (const condition of form.value.conditions) {
        if (!condition.expression || !condition.compareType || condition.value === null) {
            message.warning('请完善触发条件信息')
            return
        }
    }

    // 提交数据
    emit('submit', form.value)
    // 关闭弹窗
    emit('update:visible', false)
}

// 加载表达式列表
const loadExpressions = () => {
    try {
        const storedExpressions = localStorage.getItem('quant_expressions')
        if (storedExpressions) {
            const parsedExpressions = JSON.parse(storedExpressions)
            expressionOptions.value = parsedExpressions.map(expr => ({
                label: expr.name,
                value: expr.formula
            }))
        }
    } catch (error) {
        console.error('加载表达式失败:', error)
    }
}

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadExpressions()
    }
})

// 初始化时加载币种列表
currencyStore.fetchCurrencies()
</script>

<style scoped>
.strategy-dialog {
    padding: 20px;
    background-color: var(--bg-color);
    color: var(--text-color);
    max-height: calc(100vh - 300px);
    overflow-y: auto;
    position: static !important;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0 12px;
    padding-left: 10px;
    border-left: 4px solid var(--primary-color);
    position: sticky;
    top: 0;
    background-color: var(--bg-color);
    z-index: 1;
}

.section-header .title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
}

.section-content {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 16px;
    position: static !important;
}

.currency-settings .settings-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .ant-form-item {
        margin-bottom: 0;
        min-width: 120px;
        position: static !important;
    }
}

.empty-tip {
    text-align: center;
    color: var(--text-secondary);
    padding: 24px;
    background: var(--bg-hover);
    border-radius: 4px;
}

.conditions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.condition-item {
    background: var(--bg-hover);
    border-radius: 4px;
    padding: 12px;
}

.condition-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.unit {
    margin-left: 4px;
    color: var(--text-secondary);
}

:deep(.ant-form-item) {
    margin-bottom: 16px;
}

:deep(.ant-form-item:last-child) {
    margin-bottom: 0;
}

/* 输入框样式 */
:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-input:hover),
:deep(.ant-input-number:hover),
:deep(.ant-select:hover .ant-select-selector) {
    border-color: var(--primary-color) !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-number-focused),
:deep(.ant-select-focused .ant-select-selector) {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 2px var(--primary-color-10) !important;
}

:deep(.ant-input::placeholder),
:deep(.ant-input-number-input::placeholder) {
    color: var(--text-secondary) !important;
}

:deep(.ant-input-number),
:deep(.ant-select) {
    width: 100%;
}

:deep(.ant-select-dropdown) {
    background-color: var(--bg-color) !important;
    border: 1px solid var(--border-color) !important;
    z-index: 9999 !important;
    position: fixed !important;
}

:deep(.ant-form-item) {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
}

:deep(.ant-form-item-label) {
    text-align: left;
    line-height: 1.5;
    margin-bottom: 4px;
}

:deep(.ant-form-item-control) {
    width: 100%;
    position: static !important;
}

:deep(.ant-form-item-control-input) {
    position: static !important;
}

:deep(.ant-form-item-control-input-content) {
    position: static !important;
}

:deep(.ant-select-selection-search-input) {
    background-color: var(--bg-color) !important;
    color: var(--text-color) !important;
}

:deep(.ant-select-arrow) {
    color: var(--text-secondary) !important;
}

:deep(.ant-select-selection-item) {
    color: var(--text-color) !important;
}

/* 修复下拉菜单样式 */
:deep(.ant-select-dropdown) {
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    position: fixed !important;
    z-index: 9999 !important;
}

/* 调整表单项样式 */
.currency-settings .settings-row {
    .ant-form-item {
        margin-bottom: 0;
        min-width: 120px;
        position: static !important;
    }
}

:deep(.ant-select) {
    position: static !important;
}

:deep(.ant-form-item-control) {
    position: static !important;
}

:deep(.ant-form-item-control-input) {
    position: static !important;
}

:deep(.ant-form-item-control-input-content) {
    position: static !important;
}

/* 调整下拉选项样式 */
:deep(.ant-select-item) {
    padding: 8px 12px !important;
    border-radius: 4px !important;
    transition: all 0.3s !important;
    color: var(--text-color) !important;
}

:deep(.ant-select-item-option-active) {
    background-color: var(--bg-hover) !important;
    color: var(--text-color) !important;
}

:deep(.ant-select-item-option-selected) {
    background-color: var(--primary-color-10) !important;
    color: var(--primary-color) !important;
}

/* 调整下拉框触发器样式 */
:deep(.ant-select-selector) {
    cursor: pointer !important;
    user-select: none !important;
}

/* 确保弹窗内容不遮挡下拉框 */
.strategy-dialog {
    position: static !important;
}

.section-content {
    position: static !important;
}

/* 确保所有下拉框和输入框高度一致 */
:deep(.ant-select-selector),
:deep(.ant-input-number) {
    height: 32px !important;
    line-height: 32px !important;
}

:deep(.ant-select-selection-search-input) {
    height: 30px !important;
    line-height: 30px !important;
}

:deep(.ant-select-selection-item) {
    line-height: 30px !important;
}

/* 调整表达式下拉框样式 */
.condition-content {
    :deep(.ant-select) {
        flex: 1;
        min-width: 120px;
    }

    :deep(.ant-input-number) {
        flex: 1;
        min-width: 100px;
    }
}

/* 自定义滚动条样式 */
.strategy-dialog::-webkit-scrollbar {
    width: 6px;
}

.strategy-dialog::-webkit-scrollbar-track {
    background: var(--bg-color);
}

.strategy-dialog::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.strategy-dialog::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Element Plus 下拉框样式 */
:deep(.el-select) {
    width: 100%;
}

:deep(.el-select .el-input__wrapper) {
    background-color: var(--bg-color) !important;
    border-color: var(--border-color) !important;
    box-shadow: none !important;
    padding: 0 8px !important;
}

:deep(.el-select .el-input__wrapper:hover) {
    border-color: var(--primary-color) !important;
}

:deep(.el-select .el-input__wrapper.is-focus) {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 1px var(--primary-color) !important;
}

:deep(.el-select-dropdown) {
    background-color: var(--bg-color) !important;
    border: 1px solid var(--border-color) !important;
    padding: 4px !important;
}

:deep(.el-select-dropdown__item) {
    color: var(--text-color) !important;
    padding: 8px 12px !important;
    height: 36px !important;
    line-height: 20px !important;
}

:deep(.el-select-dropdown__item.hover) {
    background-color: var(--bg-hover) !important;
}

:deep(.el-select-dropdown__item.selected) {
    background-color: var(--primary-color) !important;
    color: #fff !important;
}

:deep(.el-input__wrapper) {
    background-color: var(--bg-color) !important;
}

:deep(.el-input__inner) {
    color: var(--text-color) !important;
    height: 32px !important;
    font-size: 14px !important;
}

:deep(.el-input__suffix) {
    color: var(--text-secondary) !important;
}

/* 确保下拉框和输入框高度一致 */
:deep(.el-input__wrapper),
:deep(.ant-input-number) {
    height: 32px !important;
    line-height: 32px !important;
}

/* 下拉框选项分组样式 */
:deep(.el-select-dropdown__list) {
    padding: 4px !important;
}

:deep(.el-select-dropdown__wrap) {
    max-height: 274px !important;
}

/* 下拉框搜索框样式 */
:deep(.el-select .el-input__wrapper input::placeholder) {
    color: var(--text-secondary) !important;
}

:deep(.el-select-dropdown.is-multiple .el-select-dropdown__item.selected) {
    background-color: var(--primary-color) !important;
    color: #fff !important;
}

:deep(.el-select-dropdown.is-multiple .el-select-dropdown__item.selected.hover) {
    background-color: var(--primary-color) !important;
}

/* 下拉框空状态样式 */
:deep(.el-select-dropdown__empty) {
    color: var(--text-secondary) !important;
    padding: 8px 12px !important;
}
</style>