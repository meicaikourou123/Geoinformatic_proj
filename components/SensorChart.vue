<template>
  <div v-if="show" class="chartPanel" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <h3>Sensor Chart</h3>
      <button class="close-btn" @click="emit('closeChart')">×</button>
    </div>

    <client-only>
      <div v-if="!chartData || Object.keys(chartData).length === 0" class="empty">
        No chart data. Please run a query from Track Info Panel.
      </div>
      <div v-else class="chart-box">
        <v-chart class="chart" :option="option" autoresize />
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
  show: Boolean
})
const emit = defineEmits([ 'closeChart'])

const option = ref({})
const chartData = useState('sensorChartData', () => null)

watchEffect(() => {
  if (chartData.value && Object.keys(chartData.value).length > 0) {
    option.value = buildEchartOption(chartData.value)
    console.log(option.value)
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
  height: 400px;
  font-size: 12px;
  position: fixed;
  top: 200px;
  right: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  pointer-events: auto;
  overflow: hidden;
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
  justify-content: space-between;
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