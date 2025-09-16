// plugins/echarts.ts
import { defineNuxtPlugin } from '#app'
import { use } from 'echarts/core'

// import the render
import { CanvasRenderer } from 'echarts/renderers'

// import the chart we need
import { LineChart, BarChart,ScatterChart,  } from 'echarts/charts'

// import component
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    PolarComponent,

    TitleComponent
} from 'echarts/components'

export default defineNuxtPlugin(() => {
    use([
        CanvasRenderer, // ✅ render
        LineChart,
        BarChart,
        GridComponent,
        TooltipComponent,
        LegendComponent,
        PolarComponent,
        ScatterChart,
        TitleComponent
    ])

    // console.log('✅ ECharts plugin registered')
})