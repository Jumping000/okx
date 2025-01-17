<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="quant h-full overflow-hidden bg-dark-500">
        <!-- 固定头部 -->
        <div class="quant-header border-b border-dark-300">
            <div class="page-header flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-4">
                    <h2 class="text-dark-100">量化</h2>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-dark-200 text-sm">公式列表</span>
                    <a-switch v-model:checked="showFormulaLists" size="small" :checked-children="'开'"
                        :un-checked-children="'关'" />
                </div>
            </div>
        </div>

        <!-- 可滚动的内容区 -->
        <div class="quant-scroll-container">
            <div class="quant-content p-4">
                <!-- 网格布局 -->
                <div class="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <!-- 参数列表 -->
                    <div class="bg-dark-400 rounded-lg border border-dark-300" v-show="showFormulaLists">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">参数列表</h3>
                            </div>
                            <a-button type="primary" size="small" @click="showAddDialog('parameter')">
                                <!-- <template #icon>
                                    <plus-outlined />
                                </template> -->
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
                    <div class="bg-dark-400 rounded-lg border border-dark-300" v-show="showFormulaLists">
                        <div class="flex justify-between items-center p-4 border-b border-dark-300">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-medium text-dark-100">表达式列表</h3>
                            </div>
                            <a-button type="primary" size="small" @click="showAddDialog('expression')">
                                <!-- <template #icon>
                                    <plus-outlined />
                                </template> -->
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
                                <!-- <template #icon>
                                    <plus-outlined />
                                </template> -->
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
                                                size="small" :loading="record.loading"
                                                @click="handleStrategyAction(record)">
                                                {{ record.status === 'running' ? '停止' : '启动' }}
                                            </a-button>
                                            <a-button danger size="small" :disabled="record.loading"
                                                @click="handleDeleteStrategy(record)">
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
                            <div class="flex items-center gap-2">
                                <a-select v-model:value="selectedStrategy" placeholder="选择策略" style="width: 200px"
                                    :options="runningStrategies" :field-names="{ label: 'name', value: 'id' }" />
                            </div>
                        </div>
                        <div class="p-4">
                            <template v-if="selectedStrategy && strategyIndicators[selectedStrategy]">
                                <div class="mb-4">
                                    <a-radio-group v-model:value="selectedTimeLevel" size="small"
                                        class="time-level-tabs">
                                        <a-radio-button
                                            v-for="timeLevel in Object.keys(strategyIndicators[selectedStrategy])"
                                            :key="timeLevel" :value="timeLevel">
                                            {{ getTimeLevelName(timeLevel) }}
                                        </a-radio-button>
                                    </a-radio-group>
                                </div>

                                <template
                                    v-if="selectedTimeLevel && strategyIndicators[selectedStrategy][selectedTimeLevel]">
                                    <div class="grid grid-cols-4 gap-4">
                                        <template
                                            v-for="(indicator, index) in strategyIndicators[selectedStrategy][selectedTimeLevel]"
                                            :key="index">
                                            <div v-if="indicator && indicator.name"
                                                class="indicator-card bg-dark-300 p-3 rounded">
                                                <div class="text-dark-200 text-sm mb-1">
                                                    {{ getIndicatorName(indicator.name) }}
                                                </div>
                                                <div class="text-dark-100 font-mono">{{ indicator.value || '-' }}</div>
                                            </div>
                                        </template>
                                    </div>
                                </template>
                            </template>
                            <template v-else>
                                <div class="flex flex-col items-center justify-center py-8">
                                    <line-chart-outlined class="text-4xl text-dark-200 mb-3" />
                                    <p class="text-dark-200">{{ selectedStrategy ? '暂无监控数据' : '请选择要监控的策略' }}</p>
                                </div>
                            </template>
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
                        <div class="p-4 h-[400px] overflow-y-auto">
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
                        </div>
                        <div class="p-4">
                            <!-- 订单表格 -->
                            <a-table :dataSource="swapOrders" :columns="orderColumns" :loading="loading"
                                :pagination="{ pageSize: 5, showSizeChanger: false }" size="small">
                                <template #bodyCell="{ column, text, record }">
                                    <!-- 产品名称 -->
                                    <template v-if="column.dataIndex === 'instId'">
                                        <span class="font-medium">{{ text.split('-')[0].toUpperCase() }}</span>
                                    </template>

                                    <!-- 订单方向 -->
                                    <template v-if="column.dataIndex === 'side'">
                                        <a-tag :color="text === 'buy' ?
                                            (record.posSide === 'long' ? 'success' : 'error') :
                                            (record.posSide === 'long' ? 'error' : 'success')">
                                            {{ text === 'buy' ?
                                                (record.posSide === 'long' ? '开多' : '平空') :
                                                (record.posSide === 'long' ? '平多' : '开空') 
                                            }}
                                        </a-tag>
                                    </template>

                                    <!-- 杠杆倍数 -->
                                    <template v-else-if="column.dataIndex === 'lever'">
                                        <span class="font-mono">{{ parseInt(text) }}X</span>
                                    </template>

                                    <!-- 保证金模式 -->
                                    <template v-else-if="column.dataIndex === 'tdMode'">
                                        <a-tag :color="text === 'cross' ? 'blue' : 'purple'">
                                            {{ text === 'cross' ? '全仓' : '逐仓' }}
                                        </a-tag>
                                    </template>

                                    <!-- 订单状态 -->
                                    <template v-else-if="column.dataIndex === 'state'">
                                        <a-tag :color="getOrderStateColor(text)">{{ getOrderStateText(text) }}</a-tag>
                                    </template>

                                    <!-- 数量 -->
                                    <template v-else-if="['sz', 'accFillSz'].includes(column.dataIndex)">
                                        <span class="font-mono">{{ formatNumber(text) }}</span>
                                    </template>

                                    <!-- 创建时间 -->
                                    <template v-else-if="column.dataIndex === 'cTime'">
                                        <span>{{ formatTime(text) }}</span>
                                    </template>
                                </template>
                            </a-table>
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
    // PlusOutlined,
    LineChartOutlined,
    FileTextOutlined
} from '@ant-design/icons-vue'
import FormulaDialog from './components/FormulaDialog.vue'
import StrategyDialog from './components/StrategyDialog.vue'
import dayjs from 'dayjs'
import WorkerManager from '@/worker/WorkerManager'
import { useWebSocketStore } from '@/store/websocket'
import { useCurrencyStore } from '@/store/currency'

// 定义组件选项
defineOptions({
    name: 'Quant'
})

// Store
const wsStore = useWebSocketStore()
const currencyStore = useCurrencyStore()

// 状态管理
const loading = ref(false)
const dialogLoading = ref(false)
const formulaDialogVisible = ref(false)
const strategyDialogVisible = ref(false)
const dialogType = ref('parameter') // parameter 或 expression
const showFormulaLists = ref(true) // 控制公式列表显示/隐藏

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

// 在 script setup 中添加新的状态管理
const selectedStrategy = ref(null); // 当前选中的策略
const strategyIndicators = ref({}); // 存储策略指标数据
const selectedTimeLevel = ref(null); // 当前选中的时间周期

// 添加计算属性：运行中的策略列表
const runningStrategies = computed(() => {
    return strategyList.value.filter(strategy => strategy.status === 'running');
});

// 添加时间级别名称映射函数
const getTimeLevelName = (timeLevel) => {
    const timeLevelMap = {
        '1m': '1分钟',
        '3m': '3分钟',
        '5m': '5分钟',
        '15m': '15分钟',
        '30m': '30分钟',
        '1H': '1小时',
        '2H': '2小时',
        '4H': '4小时',
        '6H': '6小时',
        '12H': '12小时',
        '1D': '1天',
        '1W': '1周',
        '1M': '1月',
    };
    return timeLevelMap[timeLevel] || timeLevel;
};

// 添加指标名称映射函数
const getIndicatorName = (name) => {
    // 添加数据验证
    if (!name) return '未知指标';

    const indicatorMap = {
        'KP': '开盘价',
        'SP': '收盘价',
        'ZG': '最高价',
        'ZD': '最低价',
        'CJ': '成交量',
        'MACD_DIF': 'MACD DIF',
        'MACD_DEA': 'MACD DEA',
        'MACD_MACD': 'MACD',
        'KDJ_K': 'KDJ K',
        'KDJ_D': 'KDJ D',
        'KDJ_J': 'KDJ J',
        'BOLL_UPPER': 'BOLL 上轨',
        'BOLL_MIDDLE': 'BOLL 中轨',
        'BOLL_LOWER': 'BOLL 下轨',
    };

    // 处理 MA 和 EMA 的特殊情况
    if (name.startsWith('MA_')) {
        const period = name.split('_')[1];
        return `MA(${period})`;
    }
    if (name.startsWith('EMA_')) {
        const period = name.split('_')[1];
        return `EMA(${period})`;
    }
    if (name.startsWith('LS_')) {
        const parts = name.split('_');
        if (parts.length >= 3) {
            const [, type, index] = parts;
            return `${indicatorMap[type] || type}[${index}]`;
        }
    }

    return indicatorMap[name] || name;
};

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
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: '20%',
        align: 'center',
        customCell: (record) => ({
            style: {
                cursor: record.loading ? 'wait' : 'default'
            }
        })
    },
    {
        title: '操作',
        key: 'action',
        width: '20%',
        align: 'center'
    }
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

// 等待时间窗口函数
const waitForTimeWindow = async (strategyName) => {
    const now = new Date()
    const seconds = now.getSeconds()

    if (seconds < 10 || seconds > 30) {
        // 计算等待时间
        const waitSeconds = seconds < 10 ?
            10 - seconds :
            70 - seconds // 等待到下一分钟的10秒

        // 添加等待日志
        strategyLogs.value.unshift({
            time: now,
            type: 'info',
            content: `策略 ${strategyName} 等待进入时间窗口（${waitSeconds}秒后启动）`
        })

        // 等待到下一个时间窗口
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
        return true
    }
    return false
}

// 初始化策略
const handleStrategyAction = async (record) => {
    try {
        const currentCurrency = currencyStore.getCurrencyByName('SWAP', record.currency)
        if (!currentCurrency) {
            throw new Error('未找到币种信息')
        }
        const index = strategyList.value.findIndex(item => item.id === record.id)
        if (index !== -1) {
            const newStatus = record.status === 'running' ? 'stopped' : 'running'

            if (newStatus === 'running') {
                // 设置加载状态
                strategyList.value[index].loading = true

                // 等待时间窗口
                await waitForTimeWindow(record.name)

                // 启动策略时创建新的 Worker
                await workerManager.start(record.id, '/workers/worker-entry.js')

                // 监听 Worker 消息
                workerManager.onMessage(record.id, (data) => {
                    // 处理 Worker 返回的消息
                    handleWorkerMessage(record.id, data)
                })
                const tickSz = currentCurrency.tickSz.toString() // 价格精度
                const priceDecimalPlaces = tickSz.toString().split('.')[1]?.length || 0

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
                            originalExpression: record.originalExpression, // 策略原始表达式
                            priceDecimalPlaces: priceDecimalPlaces // 价格精度
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

                // 取消该策略的所有K线订阅
                const strategy = strategyList.value[index]
                if (strategy.subscribedLevels) {
                    for (const timeLevel of strategy.subscribedLevels) {
                        try {
                            await wsStore.unsubscribeCandleData({
                                instId: strategy.currency,
                                candlePeriod: timeLevel
                            })
                            console.log(`已取消订阅 ${strategy.currency} ${timeLevel} K线数据`)
                        } catch (error) {
                            console.error(`取消订阅 ${timeLevel} K线数据失败:`, error)
                        }
                    }
                }

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
    } finally {
        // 重置加载状态
        const index = strategyList.value.findIndex(item => item.id === record.id)
        if (index !== -1) {
            strategyList.value[index].loading = false
        }
    }
}

// 处理 Worker 消息
const handleWorkerMessage = (strategyId, data) => {
    const strategy = strategyList.value.find(item => item.id === strategyId)
    if (!strategy) return

    switch (data.type) {
        case "subscribe_klines":
            // 处理订阅K线数据的请求
            handleSubscribeKlines(data.data)
            break

        case "init_complete":
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

        case 'indicators_updated':
            // 更新指标数据
            if (data.data && data.data.timeLevel && Array.isArray(data.data.indicators)) {
                console.log('收到指标数据更新:', data.data);
                if (!strategyIndicators.value[strategyId]) {
                    strategyIndicators.value[strategyId] = {};
                }
                strategyIndicators.value[strategyId][data.data.timeLevel] = data.data.indicators;

                // 强制更新视图
                strategyIndicators.value = { ...strategyIndicators.value };
            }
            break

        default:
            console.log(`未处理的消息类型: ${data.type}`, data)
    }
}

// 监听策略选择变化
watch(selectedStrategy, (newVal) => {
    if (newVal) {
        console.log('选中策略:', newVal);
        console.log('当前指标数据:', strategyIndicators.value[newVal]);
        // 如果有数据，默认选中第一个时间级别
        if (strategyIndicators.value[newVal]) {
            const timeLevels = Object.keys(strategyIndicators.value[newVal]);
            if (timeLevels.length > 0) {
                selectedTimeLevel.value = timeLevels[0];
            }
        }
    } else {
        selectedTimeLevel.value = null;
    }
});

// 处理订阅K线数据
const handleSubscribeKlines = async (data) => {
    try {
        const { strategyId, currency, timeLevels } = data
        const strategy = strategyList.value.find(item => item.id === strategyId)
        if (!strategy) {
            throw new Error('未找到策略')
        }

        // 记录订阅的时间级别
        const index = strategyList.value.findIndex(item => item.id === strategyId)
        if (index !== -1) {
            strategyList.value[index].subscribedLevels = timeLevels
            // 更新本地存储
            localStorage.setItem('quant_strategies', JSON.stringify(strategyList.value))
        }

        // 记录日志
        strategyLogs.value.unshift({
            time: new Date(),
            type: 'info',
            content: `策略 ${strategy.name} 开始订阅K线数据: ${timeLevels.join(', ')}`
        })

        // 遍历每个时间级别进行订阅
        for (const timeLevel of timeLevels) {
            try {
                // 订阅K线数据
                await wsStore.subscribeCandleData({
                    instId: currency,
                    candlePeriod: timeLevel,
                    onData: (message) => {
                        if (!message.data || !Array.isArray(message.data)) return

                        // 将K线数据转换为Worker需要的格式
                        const klineData = message.data.map(item => ({
                            ts: item[0],
                            o: item[1],
                            h: item[2],
                            l: item[3],
                            c: item[4],
                            vol: item[5],
                            volCcy: item[6],
                            confirm: item[8]
                        }))

                        // 推送数据给Worker
                        workerManager.postMessage(strategyId, {
                            type: 'kline_data',
                            payload: {
                                timeLevel,
                                klineData
                            }
                        })
                    }
                })

                strategyLogs.value.unshift({
                    time: new Date(),
                    type: 'success',
                    content: `策略 ${strategy.name} 订阅 ${timeLevel} K线数据成功`
                })
            } catch (error) {
                console.error(`订阅 ${timeLevel} K线数据失败:`, error)
                strategyLogs.value.unshift({
                    time: new Date(),
                    type: 'error',
                    content: `策略 ${strategy.name} 订阅 ${timeLevel} K线数据失败: ${error.message}`
                })
            }
        }
    } catch (error) {
        console.error('订阅K线数据失败:', error)
        strategyLogs.value.unshift({
            time: new Date(),
            type: 'error',
            content: `订阅K线数据失败: ${error.message}`
        })
    }
}

// 在组件卸载前停止所有策略的方法
const stopAllStrategies = async () => {
    try {
        const runningStrategies = strategyList.value.filter(strategy => strategy.status === 'running')
        for (const strategy of runningStrategies) {
            await handleStrategyAction(strategy)
        }
        return true
    } catch (error) {
        console.error('停止所有策略失败:', error)
        message.error('停止所有策略失败')
        return false
    }
}

// 在 script setup 中添加路由实例
const router = useRouter()

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
    // 只有当从量化页面离开时才进行检查
    if (from.path === '/dashboard/quant') {
        const runningStrategies = strategyList.value.filter(strategy => strategy.status === 'running')

        if (runningStrategies.length > 0) {
            try {
                await new Promise((resolve, reject) => {
                    Modal.confirm({
                        title: '确认离开',
                        content: '当前有正在运行的策略，离开页面将停止所有策略，是否确认离开？',
                        okText: '确认',
                        cancelText: '取消',
                        async onOk() {
                            try {
                                const success = await stopAllStrategies()
                                if (success) {
                                    resolve()
                                } else {
                                    reject(new Error('停止策略失败'))
                                }
                            } catch (error) {
                                reject(error)
                            }
                        },
                        onCancel() {
                            reject(new Error('用户取消'))
                        }
                    })
                })
                next()
            } catch (error) {
                next(false)
            }
        } else {
            next()
        }
    } else {
        next()
    }
})

// 修改原有的组件卸载逻辑
onUnmounted(() => {
    // 由于已经在路由守卫中处理了策略停止，这里只需要清理 Worker
    workerManager.stopAll()
})

const handleClearLogs = () => {
    strategyLogs.value = []
}

// 格式化时间
const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    // OKX API 返回的时间戳是字符串格式，需要转换为数字并处理为毫秒级时间戳
    const timeMs = Number(timestamp)
    if (isNaN(timeMs)) return '-'
    return dayjs(timeMs).format('YYYY-MM-DD HH:mm:ss')
}

// 添加加载策略列表的方法
const loadStrategies = () => {
    try {
        const storedStrategies = localStorage.getItem('quant_strategies')
        if (storedStrategies) {
            // 加载策略并将所有策略状态设置为停止
            strategyList.value = JSON.parse(storedStrategies).map(strategy => ({
                ...strategy,
                status: 'stopped',  // 强制设置状态为停止
                loading: false      // 初始化loading状态
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

// 监听 selectedStrategy 变化，只在有数据时自动选择第一个时间周期
watch([selectedStrategy, () => strategyIndicators.value], ([newStrategyId, indicators]) => {
    if (newStrategyId && indicators[newStrategyId]) {
        const timeLevels = Object.keys(indicators[newStrategyId]);
        // 只在有数据且没有选中时间周期时，才选中第一个时间周期
        if (timeLevels.length > 0 && (!selectedTimeLevel.value || !indicators[newStrategyId][selectedTimeLevel.value])) {
            selectedTimeLevel.value = timeLevels[0];
        } else if (timeLevels.length === 0) {
            selectedTimeLevel.value = null;
        }
    } else {
        selectedTimeLevel.value = null;
    }
}, { deep: true });

// 在 script setup 中添加订单相关的状态和方法
// 订单列定义
const orderColumns = [
    {
        title: '产品',
        dataIndex: 'instId',
        key: 'instId',
        width: 100,
    },
    {
        title: '方向',
        dataIndex: 'side',
        key: 'side',
        width: 80,
    },
    {
        title: '杠杆',
        dataIndex: 'lever',
        key: 'lever',
        width: 80,
    },
    {
        title: '模式',
        dataIndex: 'tdMode',
        key: 'tdMode',
        width: 100,
    },
    {
        title: '数量',
        dataIndex: 'sz',
        key: 'sz',
        width: 100,
    },
    {
        title: '状态',
        dataIndex: 'state',
        key: 'state',
        width: 100,
    },
    {
        title: '创建时间',
        dataIndex: 'cTime',
        key: 'cTime',
        width: 160,
    },
]

// 获取永续合约订单数据
const swapOrders = computed(() => {
    const ordersData = wsStore.getOrdersData('SWAP')
    return [...(ordersData.active || []), ...(ordersData.history || [])]
})

// 获取订单状态颜色
const getOrderStateColor = (state) => {
    const colors = {
        live: 'processing',
        filled: 'success',
        canceled: 'default',
        partially_filled: 'warning'
    }
    return colors[state] || 'default'
}

// 获取订单状态文本
const getOrderStateText = (state) => {
    const texts = {
        live: '活跃',
        filled: '已完成',
        canceled: '已取消',
        partially_filled: '部分成交'
    }
    return texts[state] || state
}

// 格式化数字
const formatNumber = (value) => {
    if (!value) return '0'
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    })
}

// 在组件挂载时订阅永续合约订单数据
onMounted(async () => {
    try {
        await wsStore.subscribeOrders({
            instType: 'SWAP',
            onData: (message) => {
                console.log('永续合约订单数据更新:', message)
            }
        })
    } catch (error) {
        console.error('订阅永续合约订单数据失败:', error)
    }
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

/* 在 style 部分添加以下样式 */
.indicator-group {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px;
}

.indicator-group .grid>div {
    background-color: var(--bg-hover);
    transition: all 0.3s ease;
}

.indicator-group .grid>div:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 数值颜色 */
.text-positive {
    color: var(--success-color);
}

.text-negative {
    color: var(--danger-color);
}

/* Select 组件样式 */
:deep(.ant-select) {
    .ant-select-selector {
        background-color: var(--bg-color) !important;
        border-color: var(--border-color) !important;
    }

    .ant-select-selection-placeholder {
        color: var(--text-secondary);
    }

    .ant-select-arrow {
        color: var(--text-secondary);
    }

    &:not(.ant-select-disabled):hover .ant-select-selector {
        border-color: var(--primary-color) !important;
    }
}

:deep(.ant-select-dropdown) {
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

/* 滚动条样式 */
.indicator-group {
    max-height: 600px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;

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

/* 在 style 部分添加时间周期选项卡样式 */
.time-level-tabs {
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

:deep(.time-level-tabs) {
    .ant-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .ant-radio-button-wrapper {
        height: 28px;
        line-height: 26px;
        padding: 0 12px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-color);
        transition: all 0.3s ease;

        &:hover {
            color: var(--primary-color);
            border-color: var(--primary-color);
        }

        &::before {
            display: none;
        }
    }

    .ant-radio-button-wrapper-checked {
        background: var(--primary-color) !important;
        color: #fff !important;
        border-color: var(--primary-color) !important;

        &:hover {
            opacity: 0.9;
        }
    }
}

.indicators-container {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 8px;
}

.indicator-card {
    transition: all 0.3s ease;
}

.indicator-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.indicator-card .text-dark-100 {
    font-size: 1.1em;
    letter-spacing: 0.5px;
}

/* Switch 组件样式 */
:deep(.ant-switch) {
    background-color: var(--border-color);

    &.ant-switch-checked {
        background-color: var(--primary-color);
    }

    &:hover:not(.ant-switch-disabled) {
        background-color: var(--primary-color);
    }
}

:deep(.ant-switch-checked) {
    .ant-switch-inner {
        color: #fff;
    }
}

:deep(.ant-switch:not(.ant-switch-checked)) {
    .ant-switch-inner {
        color: var(--text-secondary);
    }
}
</style>