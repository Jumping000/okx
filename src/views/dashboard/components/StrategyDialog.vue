<template>
    <CustomDialog :model-value="visible" title="新增策略" :width="900" :close-on-click-mask="false"
        @update:model-value="(val) => emit('update:visible', val)" @close="handleCancel">
        <div class="strategy-dialog">
            <a-form :model="formData" layout="vertical">
                <!-- 基本信息 -->
                <a-form-item label="策略名称" required :rules="[{ required: true, message: '请输入策略名称' }]">
                    <a-input v-model:value="formData.name" placeholder="请输入策略名称" />
                </a-form-item>

                <a-form-item label="策略描述" required :rules="[{ required: true, message: '请输入策略描述' }]">
                    <a-textarea v-model:value="formData.description" placeholder="请输入策略描述" :rows="3" />
                </a-form-item>

                <!-- 交易设置 -->
                <div class="section-title">交易设置</div>
                <div class="grid grid-cols-2 gap-4">
                    <a-form-item label="交易方向">
                        <a-select v-model:value="formData.direction" placeholder="请选择交易方向">
                            <a-select-option value="long">做多</a-select-option>
                            <a-select-option value="short">做空</a-select-option>
                            <a-select-option value="both">双向</a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="保证金模式">
                        <a-select v-model:value="formData.marginMode" placeholder="请选择保证金模式">
                            <a-select-option value="cross">全仓</a-select-option>
                            <a-select-option value="isolated">逐仓</a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="杠杆倍数">
                        <a-input-number v-model:value="formData.leverage" :min="1" :max="100" style="width: 100%" />
                    </a-form-item>

                    <a-form-item label="开仓数量">
                        <a-input-number v-model:value="formData.size" :min="0" style="width: 100%" />
                    </a-form-item>
                </div>

                <!-- 策略参数 -->
                <div class="section-title">策略参数</div>
                <div class="strategy-params">
                    <div class="param-list">
                        <div v-for="(param, index) in formData.params" :key="index" class="param-item">
                            <div class="param-content">
                                <span class="param-name">{{ param.name }}</span>
                                <span class="param-desc">{{ param.description }}</span>
                            </div>
                            <div class="param-value">
                                <a-input-number v-model:value="param.value" :min="param.min" :max="param.max"
                                    style="width: 120px" />
                            </div>
                            <a-button type="text" danger @click="removeParam(index)">
                                <template #icon>
                                    <delete-outlined />
                                </template>
                            </a-button>
                        </div>
                    </div>
                    <div class="add-param">
                        <a-button type="dashed" block @click="showParamSelect">
                            <template #icon>
                                <plus-outlined />
                            </template>
                            添加参数
                        </a-button>
                    </div>
                </div>

                <!-- 触发条件 -->
                <div class="section-title">触发条件</div>
                <div class="trigger-conditions">
                    <div class="condition-list">
                        <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-item">
                            <div class="condition-content">
                                <span class="condition-name">{{ condition.name }}</span>
                                <span class="condition-desc">{{ condition.description }}</span>
                            </div>
                            <a-button type="text" danger @click="removeCondition(index)">
                                <template #icon>
                                    <delete-outlined />
                                </template>
                            </a-button>
                        </div>
                    </div>
                    <div class="add-condition">
                        <a-button type="dashed" block @click="showConditionSelect">
                            <template #icon>
                                <plus-outlined />
                            </template>
                            添加条件
                        </a-button>
                    </div>
                </div>

                <!-- 风控设置 -->
                <div class="section-title">风控设置</div>
                <div class="grid grid-cols-2 gap-4">
                    <a-form-item label="止损比例">
                        <a-input-number v-model:value="formData.stopLoss" :min="0" :max="100" style="width: 100%"
                            addon-after="%" />
                    </a-form-item>

                    <a-form-item label="止盈比例">
                        <a-input-number v-model:value="formData.takeProfit" :min="0" :max="1000" style="width: 100%"
                            addon-after="%" />
                    </a-form-item>

                    <a-form-item label="最大持仓时间">
                        <a-input-number v-model:value="formData.maxHoldingTime" :min="0" style="width: 100%"
                            addon-after="分钟" />
                    </a-form-item>

                    <a-form-item label="最大回撤">
                        <a-input-number v-model:value="formData.maxDrawdown" :min="0" :max="100" style="width: 100%"
                            addon-after="%" />
                    </a-form-item>
                </div>
            </a-form>

            <!-- 底部按钮 -->
            <div class="dialog-footer">
                <a-button @click="handleCancel">取消</a-button>
                <a-button type="primary" :loading="loading" @click="handleSubmit">确定</a-button>
            </div>
        </div>
    </CustomDialog>

    <!-- 参数选择弹窗 -->
    <CustomDialog :model-value="paramSelectVisible" title="选择参数" :width="600"
        @update:model-value="(val) => paramSelectVisible = val" @close="() => paramSelectVisible = false">
        <div class="param-select">
            <a-table :columns="paramColumns" :dataSource="availableParams" :rowSelection="paramSelection"
                :pagination="false" size="small">
                <template v-slot:bodyCell="{ column, text }">
                    <template v-if="column.dataIndex === 'formula'">
                        <span class="font-mono">{{ text }}</span>
                    </template>
                </template>
            </a-table>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="paramSelectVisible = false">取 消</a-button>
                <a-button type="primary" @click="handleParamSelect">确 定</a-button>
            </div>
        </template>
    </CustomDialog>

    <!-- 条件选择弹窗 -->
    <CustomDialog :model-value="conditionSelectVisible" title="选择条件" :width="600"
        @update:model-value="(val) => conditionSelectVisible = val" @close="() => conditionSelectVisible = false">
        <div class="condition-select">
            <a-table :columns="expressionColumns" :dataSource="availableExpressions" :rowSelection="expressionSelection"
                :pagination="false" size="small">
                <template v-slot:bodyCell="{ column, text }">
                    <template v-if="column.dataIndex === 'formula'">
                        <span class="font-mono">{{ text }}</span>
                    </template>
                </template>
            </a-table>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <a-button @click="conditionSelectVisible = false">取 消</a-button>
                <a-button type="primary" @click="handleConditionSelect">确 定</a-button>
            </div>
        </template>
    </CustomDialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import CustomDialog from '@/components/common/CustomDialog.vue'

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单数据
const formData = ref({
    name: '',
    description: '',
    direction: 'long',
    marginMode: 'cross',
    leverage: 1,
    size: 1,
    params: []
})

// 参数选择相关
const paramSelectVisible = ref(false)
const selectedParams = ref([])
const availableParams = ref([
    {
        id: 1,
        name: 'MA周期',
        description: '移动平均线周期',
        formula: 'MA_PERIOD',
        value: 20,
        min: 1,
        max: 1000
    },
    {
        id: 2,
        name: 'RSI周期',
        description: 'RSI指标周期',
        formula: 'RSI_PERIOD',
        value: 14,
        min: 1,
        max: 100
    }
])

const paramColumns = [
    { title: '参数名称', dataIndex: 'name' },
    { title: '参数说明', dataIndex: 'description' },
    { title: '参数公式', dataIndex: 'formula' }
]

const selectedParamKeys = computed(() => selectedParams.value.map(item => item.id))

const paramSelection = {
    selectedRowKeys: selectedParamKeys,
    onChange: (selectedRowKeys, selectedRows) => {
        selectedParams.value = selectedRows
    }
}

// 条件选择相关
const conditionSelectVisible = ref(false)
const selectedExpressions = ref([])
const availableExpressions = ref([
    {
        id: 1,
        name: '金叉',
        description: 'MA5上穿MA10',
        formula: 'CROSS(MA5, MA10)'
    },
    {
        id: 2,
        name: '死叉',
        description: 'MA5下穿MA10',
        formula: 'CROSS(MA10, MA5)'
    }
])

const expressionColumns = [
    { title: '条件名称', dataIndex: 'name' },
    { title: '条件说明', dataIndex: 'description' },
    { title: '条件公式', dataIndex: 'formula' }
]

const selectedExpressionKeys = computed(() => selectedExpressions.value.map(item => item.id))

const expressionSelection = {
    selectedRowKeys: selectedExpressionKeys,
    onChange: (selectedRowKeys, selectedRows) => {
        selectedExpressions.value = selectedRows
    }
}

// 方法定义
const handleCancel = () => {
    emit('update:visible', false)
}

const showParamSelect = () => {
    selectedParams.value = []
    paramSelectVisible.value = true
}

const showConditionSelect = () => {
    selectedExpressions.value = []
    conditionSelectVisible.value = true
}

const handleParamSelect = () => {
    if (!selectedParams.value.length) {
        message.warning('请选择参数')
        return
    }
    formData.value.params.push(...selectedParams.value)
    paramSelectVisible.value = false
}

const handleConditionSelect = () => {
    if (!selectedExpressions.value.length) {
        message.warning('请选择条件')
        return
    }
    formData.value.conditions.push(...selectedExpressions.value)
    conditionSelectVisible.value = false
}

const removeParam = (index) => {
    formData.value.params.splice(index, 1)
}

const removeCondition = (index) => {
    formData.value.conditions.splice(index, 1)
}

const handleSubmit = () => {
    // 验证表单
    if (!formData.value.name || !formData.value.description) {
        message.warning('请填写必填项')
        return
    }

    if (props.loading) {
        return
    }

    emit('submit', formData.value)
}
</script>

<style>
/* 全局样式，不使用 scoped */
.strategy-dialog {
    background: var(--bg-color);
    color: var(--text-color);
}
</style>

<style scoped>
.strategy-dialog {
    padding: 20px;
}

.section-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
    margin: 24px 0 16px;
    padding-left: 10px;
    border-left: 4px solid var(--primary-color);
}

.strategy-params,
.trigger-conditions {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 16px;
}

.param-item,
.condition-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--bg-hover);
    border-radius: 4px;
    margin-bottom: 8px;
}

.param-content,
.condition-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.param-name,
.condition-name {
    font-weight: 500;
    color: var(--text-color);
}

.param-desc,
.condition-desc {
    font-size: 12px;
    color: var(--text-secondary);
}

.add-param,
.add-condition {
    margin-top: 16px;
}

.dialog-footer {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>