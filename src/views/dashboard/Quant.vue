<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="quant h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="quant-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">量化</h2>
                </div>
                <!-- 交易类型选项卡 -->
                <div class="trade-type-tabs">
                    <a-radio-group v-model:value="selectedInstType" size="small">
                        <a-radio-button value="SPOT">
                            <span class="px-4">现货</span>
                        </a-radio-button>
                        <a-radio-button value="SWAP">
                            <span class="px-4">永续</span>
                        </a-radio-button>
                    </a-radio-group>
                </div>
            </div>
        </div>

        <!-- 可滚动的内容区 -->
        <div class="quant-scroll-container">
            <div class="quant-content p-4">
                <!-- 网格布局 -->
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <!-- 参数列表 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">参数列表</h3>
                            </div>
                            <a-button type="primary" size="small" @click="showAddDialog('parameter')">
                                <template #icon>
                                    <plus-outlined />
                                </template>
                                新建参数
                            </a-button>
                        </div>
                        <div class="p-4">
                            <a-table :dataSource="parameterList" :columns="parameterColumns" :loading="loading"
                                :pagination="parameterList.length > 5 ? { pageSize: 5 } : false" size="small">
                                <template v-slot:bodyCell="{ column, record }">
                                    <template v-if="column.key === 'formula'">
                                        <a-tooltip placement="topLeft" :title="record.formula">
                                            <span>{{ record.formula }}</span>
                                        </a-tooltip>
                                    </template>
                                    <template v-if="column.key === 'action'">
                                        <div class="flex justify-center gap-2">
                                            <a-button danger size="small" @click="handleDelete(record, 'parameter')">
                                                删除
                                            </a-button>
                                        </div>
                                    </template>
                                </template>
                            </a-table>
                        </div>
                    </div>

                    <!-- 表达式列表 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">表达式列表</h3>
                            </div>
                            <a-button type="primary" size="small" @click="showAddDialog('expression')">
                                <template #icon>
                                    <plus-outlined />
                                </template>
                                新建表达式
                            </a-button>
                        </div>
                        <div class="p-4">
                            <a-table :dataSource="expressionList" :columns="expressionColumns" :loading="loading"
                                :pagination="expressionList.length > 5 ? { pageSize: 5 } : false" size="small">
                                <template v-slot:bodyCell="{ column, record }">
                                    <template v-if="column.key === 'name'">
                                        <a-tooltip placement="topLeft">
                                            <template #title>
                                                <div>
                                                    <div>转换后公式：{{ record.formula }}</div>
                                                    <div>原始公式：{{ record.originalFormula }}</div>
                                                </div>
                                            </template>
                                            <span>{{ record.name }}</span>
                                        </a-tooltip>
                                    </template>
                                    <template v-if="column.key === 'formula'">
                                        <a-tooltip placement="topLeft" :title="record.formula">
                                            <span>{{ record.formula }}</span>
                                        </a-tooltip>
                                    </template>
                                    <template v-if="column.key === 'action'">
                                        <div class="flex justify-center gap-2">
                                            <a-button danger size="small" @click="handleDelete(record, 'expression')">
                                                删除
                                            </a-button>
                                        </div>
                                    </template>
                                </template>
                            </a-table>
                        </div>
                    </div>

                    <!-- 策略列表 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略列表</h3>
                            </div>
                            <a-button type="primary" size="small" @click="showAddStrategyDialog">
                                <template #icon>
                                    <plus-outlined />
                                </template>
                                新建策略
                            </a-button>
                        </div>
                        <div class="p-4">
                            <a-table :dataSource="strategyList" :columns="strategyColumns" :loading="loading"
                                :pagination="strategyList.length > 5 ? { pageSize: 5 } : false" size="small">
                                <template v-slot:bodyCell="{ column, record }">
                                    <template v-if="column.key === 'status'">
                                        <div class="text-center">
                                            <a-tag :color="record.status === 'running' ? 'success' : 'default'">
                                                {{ record.status === 'running' ? '运行中' : '已停止' }}
                                            </a-tag>
                                        </div>
                                    </template>
                                    <template v-if="column.key === 'action'">
                                        <div class="flex justify-center gap-2">
                                            <a-button :type="record.status === 'running' ? 'danger' : 'primary'"
                                                size="small" @click="handleStrategyAction(record)">
                                                {{ record.status === 'running' ? '停止' : '启动' }}
                                            </a-button>
                                            <a-button danger size="small" @click="handleDeleteStrategy(record)">
                                                删除
                                            </a-button>
                                        </div>
                                    </template>
                                </template>
                            </a-table>
                        </div>
                    </div>

                    <!-- 策略监控 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略监控</h3>
                            </div>
                            <a-radio-group v-model:value="monitorPeriod" size="small" class="monitor-tabs">
                                <a-radio-button value="realtime">实时</a-radio-button>
                                <a-radio-button value="1h">1小时</a-radio-button>
                                <a-radio-button value="1d">1天</a-radio-button>
                            </a-radio-group>
                        </div>
                        <div class="p-4">
                            <!-- 监控图表将在这里实现 -->
                            <div class="flex flex-col items-center justify-center py-8">
                                <line-chart-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">请先选择要监控的策略</p>
                            </div>
                        </div>
                    </div>

                    <!-- 策略日志 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略日志</h3>
                            </div>
                            <a-button type="link" size="small" @click="handleClearLogs">清空日志</a-button>
                        </div>
                        <div class="p-4 h-[300px] overflow-y-auto">
                            <template v-if="strategyLogs.length">
                                <div v-for="(log, index) in strategyLogs" :key="index" class="log-item">
                                    <span class="log-time">{{ formatTime(log.time) }}</span>
                                    <span :class="['log-content', `log-${log.type}`]">{{ log.content }}</span>
                                </div>
                            </template>
                            <template v-else>
                                <div class="flex flex-col items-center justify-center h-full">
                                    <file-text-outlined class="text-4xl text-dark-200 mb-3" />
                                    <p class="text-dark-200">暂无日志记录</p>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- 策略统计 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">策略统计</h3>
                            </div>
                            <a-radio-group v-model:value="statsPeriod" size="small" class="stats-tabs">
                                <a-radio-button value="today">今日</a-radio-button>
                                <a-radio-button value="week">本周</a-radio-button>
                                <a-radio-button value="month">本月</a-radio-button>
                            </a-radio-group>
                        </div>
                        <div class="p-4">
                            <!-- 统计数据将在这里实现 -->
                            <div class="flex flex-col items-center justify-center py-8">
                                <pie-chart-outlined class="text-4xl text-dark-200 mb-3" />
                                <p class="text-dark-200">暂无统计数据</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 新增参数/表达式弹窗 -->
        <formula-dialog v-model:visible="formulaDialogVisible" :type="dialogType" :loading="dialogLoading"
            @submit="handleFormulaSubmit" />

        <!-- 新增策略弹窗 -->
        <strategy-dialog v-model:visible="strategyDialogVisible" :loading="dialogLoading"
            @submit="handleStrategySubmit" />
    </div>
</template>

<script setup>
import { defineOptions } from 'vue'
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
    PlusOutlined,
    LineChartOutlined,
    FileTextOutlined,
    PieChartOutlined
} from '@ant-design/icons-vue'
import FormulaDialog from './components/FormulaDialog.vue'
import StrategyDialog from './components/StrategyDialog.vue'
import dayjs from 'dayjs'

// 定义组件选项
defineOptions({
    name: 'Quant'
})

// 状态管理
const selectedInstType = ref('SPOT') // SPOT 或 SWAP
const loading = ref(false)
const dialogLoading = ref(false)
const formulaDialogVisible = ref(false)
const strategyDialogVisible = ref(false)
const dialogType = ref('parameter') // parameter 或 expression

// 监控和统计周期
const monitorPeriod = ref('realtime')
const statsPeriod = ref('today')

// 列表数据
const parameterList = ref([])
const expressionList = ref([])
const strategyList = ref([])
const strategyLogs = ref([])

// 本地存储的键名
const STORAGE_KEYS = {
    PARAMETERS: 'quant_parameters',
    EXPRESSIONS: 'quant_expressions'
}

// 从本地存储读取数据
const loadFromStorage = () => {
    try {
        const storedParameters = localStorage.getItem(STORAGE_KEYS.PARAMETERS)
        const storedExpressions = localStorage.getItem(STORAGE_KEYS.EXPRESSIONS)

        if (storedParameters) {
            parameterList.value = JSON.parse(storedParameters).map(item => ({
                key: item.id,
                name: item.name,
                description: item.description,
                formula: item.formula
            }))
        }

        if (storedExpressions) {
            expressionList.value = JSON.parse(storedExpressions).map(item => ({
                key: item.id,
                name: item.name,
                description: item.description,
                formula: item.formula
            }))
        }
    } catch (error) {
        console.error('读取本地数据失败:', error)
    }
}

// 表格列定义
const parameterColumns = [
    { title: '参数名称', dataIndex: 'name', key: 'name', width: '25%' },
    { title: '参数说明', dataIndex: 'description', key: 'description', width: '35%' },
    {
        title: '参数公式',
        dataIndex: 'formula',
        key: 'formula',
        width: '30%',
        ellipsis: true,
        customCell: () => ({
            style: {
                whiteSpace: 'nowrap',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }
        })
    },
    { title: '操作', key: 'action', width: '10%', align: 'center' }
]

const expressionColumns = [
    {
        title: '表达式名称',
        dataIndex: 'name',
        key: 'name',
        width: '25%',
        customCell: () => ({
            style: {
                cursor: 'pointer'
            }
        })
    },
    { title: '表达式说明', dataIndex: 'description', key: 'description', width: '35%' },
    {
        title: '表达式公式',
        dataIndex: 'formula',
        key: 'formula',
        width: '30%',
        ellipsis: true,
        customCell: () => ({
            style: {
                whiteSpace: 'nowrap',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }
        })
    },
    { title: '操作', key: 'action', width: '10%', align: 'center' }
]

const strategyColumns = [
    { title: '策略名称', dataIndex: 'name', key: 'name', width: '25%' },
    { title: '策略说明', dataIndex: 'description', key: 'description', width: '35%' },
    { title: '状态', dataIndex: 'status', key: 'status', width: '20%', align: 'center' },
    { title: '操作', key: 'action', width: '20%', align: 'center' }
]

// 方法定义
const showAddDialog = (type) => {
    dialogType.value = type
    formulaDialogVisible.value = true
}

const showAddStrategyDialog = () => {
    strategyDialogVisible.value = true
}

const handleFormulaSubmit = ({ type, data }) => {
    try {
        if (type === 'parameter') {
            parameterList.value = data
            // 更新本地存储
            localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(data))
        } else {
            expressionList.value = data
            // 更新本地存储
            localStorage.setItem(STORAGE_KEYS.EXPRESSIONS, JSON.stringify(data))
        }
        formulaDialogVisible.value = false
        message.success('保存成功')
    } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败')
    }
}

const handleStrategySubmit = async (formData) => {
    dialogLoading.value = true
    try {
        // TODO: 调用API保存策略
        console.log('保存策略数据:', formData)
        strategyList.value.push(formData)
        strategyDialogVisible.value = false
    } catch (error) {
        console.error('保存失败:', error)
    } finally {
        dialogLoading.value = false
    }
}

const handleDelete = async (record, type) => {
    try {
        const storageKey = type === 'parameter' ? STORAGE_KEYS.PARAMETERS : STORAGE_KEYS.EXPRESSIONS
        const list = type === 'parameter' ? parameterList : expressionList

        // 从列表中移除
        list.value = list.value.filter(item => item.id !== record.id)

        // 更新本地存储
        localStorage.setItem(storageKey, JSON.stringify(list.value))

        message.success('删除成功')
    } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败')
    }
}

const handleDeleteStrategy = async (record) => {
    try {
        // TODO: 调用API删除策略
        console.log('删除策略:', record)
        strategyList.value = strategyList.value.filter(item => item.id !== record.id)
    } catch (error) {
        console.error('删除失败:', error)
    }
}

const handleStrategyAction = async (record) => {
    try {
        // TODO: 调用API启动/停止策略
        console.log('策略操作:', record)
        const index = strategyList.value.findIndex(item => item.id === record.id)
        if (index !== -1) {
            strategyList.value[index].status = record.status === 'running' ? 'stopped' : 'running'
        }
    } catch (error) {
        console.error('操作失败:', error)
    }
}

const handleClearLogs = () => {
    strategyLogs.value = []
}

const formatTime = (timestamp) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时加载数据
onMounted(() => {
    loadFromStorage()
})
</script>

<style scoped>
.quant {
    display: flex;
    flex-direction: column;
    min-width: 1200px;
    background-color: var(--bg-color);
}

.quant-header {
    flex-shrink: 0;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
}

.quant-scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background-color: var(--bg-color);
}

/* 内容区最小宽度 */
.quant-content {
    min-width: 1200px;
}

/* 修改模块背景色 */
:deep(.bg-dark-400) {
    background-color: var(--bg-color) !important;
}

:deep(.bg-dark-500) {
    background-color: var(--bg-color) !important;
}

/* 修改边框颜色 */
:deep(.border-dark-300) {
    border-color: var(--border-color) !important;
}

/* 修改文字颜色 */
:deep(.text-dark-100) {
    color: var(--text-color) !important;
}

:deep(.text-dark-200) {
    color: var(--text-secondary) !important;
}

/* 自定义滚动条样式 */
.quant-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.quant-scroll-container::-webkit-scrollbar-track {
    background: var(--bg-color);
}

.quant-scroll-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.quant-scroll-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Firefox 滚动条样式 */
.quant-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) var(--bg-color);
}

/* 交易类型选项卡样式 */
:deep(.trade-type-tabs) {
    .ant-radio-group {
        display: flex;
        border: 1px solid var(--primary-color);
        border-radius: 2px;
        padding: 0;
    }

    .ant-radio-button-wrapper {
        height: 24px;
        line-height: 22px;
        padding: 0;
        background: transparent;
        border: none !important;
        color: var(--primary-color);

        &::before {
            display: none;
        }

        &:hover {
            color: var(--primary-color-light);
        }

        &:first-child {
            border-radius: 1px 0 0 1px;
        }

        &:last-child {
            border-radius: 0 1px 1px 0;
        }
    }

    .ant-radio-button-wrapper-checked {
        background-color: var(--primary-color) !important;
        color: #fff !important;
        box-shadow: none;

        &:hover {
            color: #fff !important;
        }
    }

    .ant-radio-button-wrapper:not(:first-child)::before {
        background-color: var(--primary-color);
        width: 1px;
        height: 100%;
    }
}

/* 日志样式 */
.log-item {
    padding: 4px 8px;
    font-size: 12px;
    line-height: 1.5;
    border-bottom: 1px solid var(--border-color);
}

.log-time {
    color: var(--text-secondary);
    margin-right: 8px;
}

.log-content {
    color: var(--text-color);
}

.log-info {
    color: var(--text-color);
}

.log-success {
    color: var(--success-color);
}

.log-warning {
    color: var(--warning-color);
}

.log-error {
    color: var(--danger-color);
}

/* 表格样式 */
:deep(.ant-table) {
    background: transparent;

    .ant-table-thead>tr>th {
        background-color: var(--bg-color);
        border-bottom: 1px solid var(--border-color);
        color: var(--text-color);
    }

    .ant-table-tbody>tr>td {
        border-bottom: 1px solid var(--border-color);
        background-color: transparent;
        color: var(--text-color);
    }

    .ant-table-tbody>tr:hover>td {
        background-color: var(--bg-hover);
    }
}

/* 按钮样式 */
:deep(.ant-btn-link) {
    color: var(--text-secondary);

    &:hover {
        color: var(--primary-color);
    }
}

/* 标签样式 */
:deep(.ant-tag) {
    border: 1px solid transparent;
}

/* 时间选项卡样式 */
:deep(.monitor-tabs),
:deep(.stats-tabs) {
    .ant-radio-group {
        display: flex;
        background: var(--bg-hover);
        border: none;
        border-radius: 4px;
        padding: 2px;
    }

    .ant-radio-button-wrapper {
        height: 26px;
        line-height: 26px;
        min-width: 60px;
        padding: 0 12px;
        background: transparent;
        border: none !important;
        color: var(--text-color);
        transition: all 0.3s ease;
        text-align: center;

        &::before {
            display: none;
        }

        &:hover {
            color: var(--primary-color);
            background: var(--bg-color);
        }

        &:first-child {
            border-radius: 3px;
        }

        &:last-child {
            border-radius: 3px;
        }
    }

    .ant-radio-button-wrapper-checked {
        background: var(--primary-color) !important;
        color: #fff !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &:hover {
            color: #fff !important;
            opacity: 0.95;
        }
    }

    .ant-radio-button-wrapper:not(:first-child)::before {
        display: none;
    }
}

/* 表单样式 */
:deep(.ant-form) {
    .ant-form-item-label>label {
        color: var(--text-color);
    }

    .ant-input,
    .ant-input-number,
    .ant-select-selector {
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;

        &:hover,
        &:focus {
            border-color: var(--primary-color) !important;
        }
    }

    .ant-input-number-handler-wrap {
        background-color: var(--bg-color);
    }

    .ant-select-arrow {
        color: var(--text-color);
    }

    .ant-select-dropdown {
        background-color: var(--bg-color);
        border: 1px solid var(--border-color);

        .ant-select-item {
            color: var(--text-color);

            &:hover {
                background-color: var(--bg-hover);
            }
        }

        .ant-select-item-option-selected {
            background-color: var(--primary-color);
            color: #fff;
        }
    }
}
</style>