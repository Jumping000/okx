<template>
    <div ref="chartContainer" class="w-full h-full"></div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import { createChart } from 'lightweight-charts'
import { getHistoryKlines } from '@/api/module/Market'

export default defineComponent({
    name: 'KlineChart',
    props: {
        data: {
            type: Array,
            required: true,
            default: () => []
        },
        theme: {
            type: String,
            default: 'dark'
        },
        instId: {
            type: String,
            required: true
        },
        period: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const chartContainer = ref(null)
        let chart = null
        let candlestickSeries = null
        const historicalData = ref([])
        const isLoading = ref(false)

        // 加载历史K线数据
        const loadHistoryData = async () => {
            if (isLoading.value || !props.instId) return

            try {
                isLoading.value = true
                const response = await getHistoryKlines({
                    instId: props.instId,
                    bar: props.period,
                    limit: '100' // 获取最近100条数据
                })

                if (response.code === '0' && Array.isArray(response.data)) {
                    // OKX返回的数据格式：
                    // [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
                    historicalData.value = response.data.map(item => ({
                        timestamp: parseInt(item[0]),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5]),
                        volCcy: parseFloat(item[6]),
                        volCcyQuote: parseFloat(item[7]),
                        confirm: item[8]
                    }))

                    // 更新图表数据
                    updateChartData()
                }
            } catch (error) {
                console.error('加载历史K线数据失败:', error)
            } finally {
                isLoading.value = false
            }
        }

        // 创建图表
        const initChart = () => {
            if (!chartContainer.value) return

            // 图表配置
            const chartOptions = {
                layout: {
                    background: { color: 'transparent' },
                    textColor: props.theme === 'dark' ? '#D9D9D9' : '#191919',
                },
                grid: {
                    vertLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                    horzLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                },
                crosshair: {
                    mode: 0,
                    vertLine: {
                        color: props.theme === 'dark' ? '#758696' : '#758696',
                        width: 1,
                        style: 1,
                        labelBackgroundColor: props.theme === 'dark' ? '#758696' : '#758696',
                    },
                    horzLine: {
                        color: props.theme === 'dark' ? '#758696' : '#758696',
                        width: 1,
                        style: 1,
                        labelBackgroundColor: props.theme === 'dark' ? '#758696' : '#758696',
                    },
                },
                timeScale: {
                    borderColor: props.theme === 'dark' ? '#404040' : '#E6E6E6',
                    timeVisible: true,
                    secondsVisible: false,
                },
                rightPriceScale: {
                    borderColor: props.theme === 'dark' ? '#404040' : '#E6E6E6',
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true,
                },
                handleScale: {
                    mouseWheel: true,
                    pinch: true,
                    axisPressedMouseMove: true,
                },
                width: chartContainer.value.clientWidth,
                height: chartContainer.value.clientHeight,
            }

            // 创建图表实例
            chart = createChart(chartContainer.value, chartOptions)

            // 添加K线系列
            candlestickSeries = chart.addCandlestickSeries({
                upColor: '#00b96b',
                downColor: '#ff4d4f',
                borderVisible: false,
                wickUpColor: '#00b96b',
                wickDownColor: '#ff4d4f',
            })

            // 创建 ResizeObserver
            const resizeObserver = new ResizeObserver(entries => {
                if (!chart || entries.length === 0 || !entries[0].contentRect) return
                const { width, height } = entries[0].contentRect
                chart.applyOptions({ width, height })
            })

            // 开始观察大小变化
            resizeObserver.observe(chartContainer.value)

            // 在组件卸载时清理 ResizeObserver
            onUnmounted(() => {
                if (chartContainer.value) {
                    resizeObserver.unobserve(chartContainer.value)
                }
                resizeObserver.disconnect()
            })

            // 加载历史数据
            loadHistoryData()
        }

        // 更新图表数据
        const updateChartData = () => {
            if (!candlestickSeries || !chart) return

            // 合并历史数据和实时数据
            const allData = [...historicalData.value]
            if (props.data.length > 0) {
                // 移除重复的数据
                const lastHistoryTs = historicalData.value[historicalData.value.length - 1]?.timestamp
                const newData = props.data.filter(item => item.timestamp > lastHistoryTs)
                allData.push(...newData)
            }

            // 转换数据格式
            const chartData = allData.map(item => ({
                time: item.timestamp / 1000,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
            }))

            // 按时间排序
            chartData.sort((a, b) => a.time - b.time)

            try {
                candlestickSeries.setData(chartData)
            } catch (error) {
                console.error('更新K线数据失败:', error)
            }
        }

        // 监听数据变化
        watch(() => props.data, () => {
            if (chart && candlestickSeries) {
                updateChartData()
            }
        }, { deep: true })

        // 监听交易对和周期变化
        watch([() => props.instId, () => props.period], () => {
            historicalData.value = []
            if (chart && candlestickSeries) {
                loadHistoryData()
            }
        })

        // 监听主题变化
        watch(() => props.theme, () => {
            if (chart) {
                try {
                    chart.applyOptions({
                        layout: {
                            textColor: props.theme === 'dark' ? '#D9D9D9' : '#191919',
                        },
                        grid: {
                            vertLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                            horzLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                        },
                    })
                } catch (error) {
                    console.error('更新主题失败:', error)
                }
            }
        })

        // 组件挂载时初始化图表
        onMounted(() => {
            initChart()
        })

        // 组件卸载时销毁图表
        onUnmounted(() => {
            if (chart) {
                try {
                    chart.remove()
                } catch (error) {
                    console.error('销毁图表失败:', error)
                }
                chart = null
                candlestickSeries = null
            }
        })

        return {
            chartContainer
        }
    }
})
</script>