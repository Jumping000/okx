<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="quant h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="quant-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">量化</h2>
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
                                    <template v-if="column.key === 'name'">
                                        <a-tooltip placement="topLeft">
                                            <template #title>
                                                <div class="strategy-tooltip">
                                                    <div class="tooltip-item">
                                                        <span class="label">策略名称：</span>
                                                        <span class="value">{{ record.name }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">策略描述：</span>
                                                        <span class="value">{{ record.description }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">交易类型：</span>
                                                        <span class="value">{{ record.currency }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">委托数量：</span>
                                                        <span class="value">{{ record.quantity }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">杠杆倍数：</span>
                                                        <span class="value">{{ record.leverage }}倍</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">仓位类型：</span>
                                                        <span
                                                            class="value">{{ record.positionType === 'cross' ? '全仓' : '逐仓' }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">止损比例：</span>
                                                        <span class="value">{{ record.stopLoss }}%</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">完整表达式：</span>
                                                        <span class="value">{{ record.fullExpression }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">原始表达式：</span>
                                                        <span class="value">{{ record.originalExpression }}</span>
                                                    </div>
                                                    <div class="tooltip-item">
                                                        <span class="label">创建时间：</span>
                                                        <span class="value">{{ formatTime(record.createTime) }}</span>
                                                    </div>
                                                </div>
                                            </template>
                                            <span>{{ record.name }}</span>
                                        </a-tooltip>
                                    </template>
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
import { ref, onMounted, onUnmounted } from 'vue'
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
import WorkerManager from '@/worker/WorkerManager';

// 定义组件选项
defineOptions({
    name: 'Quant'
})

// 状态管理
const loading = ref(false)
const dialogLoading = ref(false)
const formulaDialogVisible = ref(false)
const strategyDialogVisible = ref(false)
const dialogType = ref('parameter') // parameter 或 expression

// 监控和统计周期
const monitorPeriod = ref('realtime')
const statsPeriod = ref('today')

// 列表数据
const parameterList = ref([]) // 参数列表
const expressionList = ref([]) // 表达式列表
const strategyList = ref([]) // 策略列表
const strategyLogs = ref([]) // 策略日志

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
    {
        title: '策略名称',
        dataIndex: 'name',
        key: 'name',
        width: '25%',
        customCell: () => ({
            style: {
                cursor: 'pointer'
            }
        })
    },
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
        strategyList.value.push(formData)
        strategyDialogVisible.value = false
        message.success('保存成功')
    } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败')
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
        strategyList.value = strategyList.value.filter(item => item.id !== record.id)
        // 更新本地存储
        localStorage.setItem('quant_strategies', JSON.stringify(strategyList.value))
        message.success('删除成功')
    } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败')
    }
}

// 初始化线程 
const workerManager = new WorkerManager();

// 初始化策略
const handleStrategyAction = async (record) => {
    try {
        const index = strategyList.value.findIndex(item => item.id === record.id)
        if (index !== -1) {
            const newStatus = record.status === 'running' ? 'stopped' : 'running'

            if (newStatus === 'running') {
                // 启动策略时创建新的 Worker
                await workerManager.start(record.id, '/workers/worker-entry.js')

                // 监听 Worker 消息
                workerManager.onMessage(record.id, (data) => {
                    // 处理 Worker 返回的消息
                    handleWorkerMessage(record.id, data)
                })

                // 准备要发送的数据，只包含必要的可序列化字段
                const workerData = {
                    type: 'init',
                    payload: {
                        strategy: {
                            id: record.id, // 策略ID
                            name: record.name, // 策略名称
                            description: record.description, // 策略描述
                            currency: record.currency, // 策略货币
                            quantity: record.quantity, // 策略数量
                            leverage: record.leverage, // 策略杠杆
                            positionType: record.positionType, // 策略持仓类型
                            stopLoss: record.stopLoss, // 策略止损
                            fullExpression: record.fullExpression, // 策略完整表达式
                            originalExpression: record.originalExpression // 策略原始表达式
                        },
                    }
                }

                // 发送初始化数据给 Worker
                workerManager.postMessage(record.id, workerData)

                // 添加启动日志
                strategyLogs.value.unshift({
                    time: new Date(),
                    type: 'success',
                    content: `策略 ${record.name} 已启动`
                })
            } else {
                // 停止策略时终止 Worker
                workerManager.stop(record.id)

                // 添加停止日志
                strategyLogs.value.unshift({
                    time: new Date(),
                    type: 'warning',
                    content: `策略 ${record.name} 已停止`
                })
            }

            // 更新策略状态
            strategyList.value[index].status = newStatus
            // 更新本地存储
            localStorage.setItem('quant_strategies', JSON.stringify(strategyList.value))
            message.success(newStatus === 'running' ? '策略已启动' : '策略已停止')
        }
    } catch (error) {
        console.error('策略操作失败:', error)
        message.error('策略操作失败')
        // 添加错误日志
        strategyLogs.value.unshift({
            time: new Date(),
            type: 'error',
            content: `策略操作失败: ${error.message}`
        })
    }
}

// 处理 Worker 消息
const handleWorkerMessage = (strategyId, data) => {
    const strategy = strategyList.value.find(item => item.id === strategyId)
    if (!strategy) return

    switch (data.type) {
        case 'init_complete':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'info',
                content: `策略 ${strategy.name} 初始化完成`
            })
            break

        case 'process_complete':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'info',
                content: `策略 ${strategy.name} 执行完成: ${JSON.stringify(data.data)}`
            })
            break

        case 'history_kline_progress':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'info',
                content: `策略 ${strategy.name} 正在获取 ${data.data.timeLevel} K线数据: ${data.data.percentage}% (${data.data.current}/${data.data.total})`
            })
            break

        case 'history_kline_complete':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'info',
                content: `策略 ${strategy.name} 获取 ${data.data.timeLevel} 历史K线数据完成: ${data.data.count} 条`
            })
            break

        case 'all_history_kline_complete':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'success',
                content: `策略 ${strategy.name} 所有历史K线数据获取完成`
            })
            break

        case 'error':
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'error',
                content: `策略 ${strategy.name} 发生错误: ${data.error.message}`
            })
            break

        default:
            console.log(`未处理的消息类型: ${data.type}`, data)
    }
}

// 组件卸载时清理所有 Worker
onUnmounted(() => {
    workerManager.stopAll()
})

const handleClearLogs = () => {
    strategyLogs.value = []
}

const formatTime = (timestamp) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 添加加载策略列表的方法
const loadStrategies = () => {
    try {
        const storedStrategies = localStorage.getItem('quant_strategies')
        if (storedStrategies) {
            // 加载策略并将所有策略状态设置为停止
            strategyList.value = JSON.parse(storedStrategies).map(strategy => ({
                ...strategy,
                status: 'stopped'  // 强制设置状态为停止
            }));

            // 更新本地存储
            localStorage.setItem('quant_strategies', JSON.stringify(strategyList.value))

            // 添加日志记录
            strategyLogs.value.unshift({
                time: new Date(),
                type: 'info',
                content: '页面刷新，所有策略已重置为停止状态'
            })
        }
    } catch (error) {
        console.error('加载策略列表失败:', error)
        message.error('加载策略列表失败')
    }
}

// 组件挂载时加载数据
onMounted(() => {
    loadFromStorage()
    loadStrategies()
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

/* 移除交易类型选项卡样式 */
:deep(.trade-type-tabs) {
    display: none;
}

/* 策略提示框样式 */
.strategy-tooltip {
    padding: 4px;
    max-width: 400px;
}

.tooltip-item {
    margin-bottom: 8px;
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
}

.tooltip-item:last-child {
    margin-bottom: 0;
}

.tooltip-item .label {
    color: var(--text-secondary);
    margin-right: 8px;
    flex-shrink: 0;
}

.tooltip-item .value {
    color: #fff;
    word-break: break-all;
}
</style>