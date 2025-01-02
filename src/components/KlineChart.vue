<template>
    <div ref="chartContainer" class="w-full h-full"></div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import { createChart } from 'lightweight-charts'

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
        }
    },
    setup(props) {
        const chartContainer = ref(null)
        let chart = null
        let candlestickSeries = null

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

            // 自适应容器大小
            const resizeObserver = new ResizeObserver(entries => {
                if (entries.length === 0 || !entries[0].contentRect) return
                const { width, height } = entries[0].contentRect
                chart.applyOptions({ width, height })
            })

            resizeObserver.observe(chartContainer.value)

            // 更新数据
            updateChartData()
        }

        // 更新图表数据
        const updateChartData = () => {
            if (!candlestickSeries || !props.data.length) return

            const chartData = props.data.map(item => ({
                time: item.timestamp / 1000,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
            }))

            candlestickSeries.setData(chartData)
        }

        // 监听数据变化
        watch(() => props.data, () => {
            updateChartData()
        }, { deep: true })

        // 监听主题变化
        watch(() => props.theme, () => {
            if (chart) {
                chart.applyOptions({
                    layout: {
                        textColor: props.theme === 'dark' ? '#D9D9D9' : '#191919',
                    },
                    grid: {
                        vertLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                        horzLines: { color: props.theme === 'dark' ? '#404040' : '#E6E6E6' },
                    },
                })
            }
        })

        // 组件挂载时初始化图表
        onMounted(() => {
            initChart()
        })

        // 组件卸载时销毁图表
        onUnmounted(() => {
            if (chart) {
                chart.remove()
                chart = null
            }
        })

        return {
            chartContainer
        }
    }
})
</script>