// plugins/echarts.ts
import { defineNuxtPlugin } from '#app'
import { use } from 'echarts/core'

// import the render
import { CanvasRenderer } from 'echarts/renderers'

// import the chart we need
import { LineChart, BarChart,ScatterChart,  } from 'echarts/charts'

// import component
import * as echarts from 'echarts/core'
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    PolarComponent,
    MarkPointComponent
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
        TitleComponent,
        MarkPointComponent
    ])
})