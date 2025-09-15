<template>
  <div v-if="show" class="chartPanel" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <span style="font-weight: bold">{{ pageTitle }}</span>
      <button class="close-btn" @click="emit('closeChart')">×</button>
    </div>
    <client-only>
      <div v-if="!currentOption || !currentOption.series || currentOption.series.length === 0" class="empty">
        No Sensor Data for chart display.
      </div>
      <div v-else class="chart-box">
        <v-chart class="chart" :option="currentOption" autoresize />
      </div>
      <div class="pager">
        <button @click="currentPage > 1 && (currentPage--)" :disabled="currentPage === 1">Pre</button>
        <span>{{ currentPage }}</span>
        <button @click="currentPage < 6 && (currentPage++)" :disabled="currentPage === 6">Next</button>
      </div>
    </client-only>
  </div>
</template>

<script setup>
defineOptions({ ssr: false })

import { ref, watchEffect, defineAsyncComponent, computed } from 'vue'
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

const currentPage = ref(3)

const currentOption = computed(() => {
  if (!option.value) return null
  if (currentPage.value === 1) return option.value.chartData1
  if (currentPage.value === 2) return option.value.chartData2
  if (currentPage.value === 3) return option.value.chartData3
  if (currentPage.value === 4) return option.value.chartData4
  if (currentPage.value === 5) return option.value.chartData5
  if (currentPage.value === 6) return option.value.chartData6
  return null
})
const pageTitle = computed(() => {
  switch (currentPage.value) {
    case 1:
      return "Rain";
    case 2:
      return " Relative humidity";
    case 3:
      return "Temperature";
    case 4:
      return "Pressure";
    case 5:
      return "Wind velocity";
    case 6:
    return "Wind Direction";

    default:
      return "Sensor Chart";
  }
})

watchEffect(() => {
  if (chartData.value && Object.keys(chartData.value).length > 0) {
    // console.log(chartData)
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
  height: 350px;
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
  height: calc(100% - 40px);
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

.pager {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}
</style>