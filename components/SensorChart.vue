<template>
  <div v-if="show && chartId === 1" class="chartPanel" id="chart1" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <button class="close-btn" @click="emit('closeChart', 1)">×</button>
    </div>
    <client-only>
      <div v-if="!option?.chartData1 || !option.chartData1.series || option.chartData1.series.length === 0" class="empty">
        No chart data. Please run a query from Track Info Panel.
      </div>
      <div v-else class="chart-box">
        <v-chart class="chart" :option="option.chartData1" autoresize />
      </div>
    </client-only>
  </div>

  <div v-if="show && chartId === 2" class="chartPanel" id="chart2" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <button class="close-btn" @click="emit('closeChart', 2)">×</button>
    </div>
    <client-only>
      <div v-if="!option?.chartData2 || !option.chartData2.series || option.chartData2.series.length === 0" class="empty">
        No chart data. Please run a query from Track Info Panel.
      </div>
      <div v-else class="chart-box">
        <v-chart class="chart" :option="option.chartData2" autoresize />
      </div>
    </client-only>
  </div>

  <div v-if="show && chartId === 3" class="chartPanel" id="chart3" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <button class="close-btn" @click="emit('closeChart', 3)">×</button>
    </div>
    <client-only>
      <div v-if="!option?.chartData3 || !option.chartData3.series || option.chartData3.series.length === 0" class="empty">
        No chart data. Please run a query from Track Info Panel.
      </div>
      <div v-else class="chart-box">
        <v-chart class="chart" :option="option.chartData3" autoresize />
      </div>
    </client-only>
  </div>
</template>

<script setup>
defineOptions({ ssr: false })

import { ref, watchEffect, defineAsyncComponent } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { buildEchartOption } from '~/utils/echartsHelper'

const VChart = defineAsyncComponent(() => import('vue-echarts'))

const chartPanel = ref(null)
const { startDrag } = useDraggable(chartPanel)

const props = defineProps({
  show: Boolean,
  chartId: [Number, String]
})
const emit = defineEmits([ 'closeChart'])

const option = ref({})
const chartData = useState('sensorChartData', () => null)

watchEffect(() => {
  if (chartData.value && Object.keys(chartData.value).length > 0) {
    console.log(chartData)
    option.value = buildEchartOption(chartData.value)
  }
})
</script>

<style scoped>
.chartPanel {
  background-color: lightblue;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
  width: 500px;
  height: 200px;
  font-size: 12px;
  position: fixed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  pointer-events: auto;
  overflow: hidden;
}

#chart1 {
  top: 20px;
  right: 100px;
}

#chart2 {
  top: 250px;
  right: 100px;
}

#chart3 {
  top: 480px;
  right: 100px;
}

.empty {
  padding: 24px;
  color: #666;
  text-align: center;
}

.chart-box {
  width: 100%;
  height: 100%;
}

.chart {
  width: 100%;
  height: 100%;
}

.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin: 0;
  color: #333;
}
</style>