// plugins/echarts.ts
import { defineNuxtPlugin } from '#app'
import { use } from 'echarts/core'

// 引入渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 引入常用图表
import { LineChart, BarChart } from 'echarts/charts'

// 引入组件
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent
} from 'echarts/components'

export default defineNuxtPlugin(() => {
    use([
        CanvasRenderer, // ✅ 渲染器
        LineChart,
        BarChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        TitleComponent
    ])

    console.log('✅ ECharts plugin registered')
})