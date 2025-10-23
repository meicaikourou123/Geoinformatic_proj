<template>
  <div v-if="show" class="chartPanel" ref="chartPanel">
    <div class="header" @mousedown="startDrag">
      <span style="font-weight: bold">{{ pageTitle }}</span>
      <button
        class="close-btn"
        @click="handleCloseChart"
      >×</button>
    </div>
    <client-only>
      <div v-if="!currentOption || !currentOption.series || currentOption.series.length === 0" class="empty">
        No Sensor Data for chart display.
      </div>
      <div class="chart-box">
        <v-chart class="chart" :option="currentOption" autoresize />
        <div class="sensor-right">
          <h4 style="margin: 1px 0;">Selected Sensors</h4>
          <div class="sensor-list">
            <ul v-if="selectedSensors && selectedSensors.length" class="sensor-list-items">
              <li v-for="(sensor, index) in selectedSensors" :key="index">
                {{ sensor.data_type || 'Unknown' }} - {{ sensor.idsensore || 'N/A' }}
              </li>
            </ul>
            <div v-else class="sensor-list-empty" style="color: #999; font-size: 12px;">
              No sensors selected on map.
            </div>

          </div>

<!--          Here I will add the analysis result, also control its display-->



          <!-- footer with action buttons -->
          <div class="sensor-list-button">
            <div style="flex:1"></div>
            <n-button class="btn btn-sm" strong secondary circle type="primary" size="tiny" @click="clearSelectedSensors">
              <template #icon>
                <img src="/icons/clear.svg" alt="display" style="width: 13px; height: 13px;" />
              </template>
            </n-button>
            <n-button class="btn btn-sm" strong secondary circle type="primary" size="tiny" @click="analyzeSelectedSensors">
              <template #icon>
                <img src="/icons/analysis.svg" alt="display" style="width: 13px; height: 13px;" />
              </template>
            </n-button>
            <n-button class="btn btn-sm" strong secondary circle type="primary" size="tiny" @click="downloadSelectedSensors">
              <template #icon>
                <img src="/icons/download.svg" alt="display" style="width: 13px; height: 13px;" />
              </template>
            </n-button>
          </div>
        </div>
      </div>
      <div class="pager">
        <button @click="goPrevPage" :disabled="currentPage === 1">Pre</button>
        <span>{{ currentPage }}</span>
        <button @click="goNextPage" :disabled="currentPage === 6">Next</button>
      </div>
    </client-only>
  </div>
</template>

<script setup>
defineOptions({ ssr: false })
import { NButton} from 'naive-ui'
import { ref, watchEffect, defineAsyncComponent, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { buildEchartOption } from '~/utils/echartsHelper'

const VChart = defineAsyncComponent(() => import('vue-echarts'))
const selectedSensors = useState('selectedSensorsOnMap', () => [])
const chartPanel = ref(null)
const { startDrag } = useDraggable(chartPanel)

const props = defineProps({
  show: Boolean
})
const emit = defineEmits([ 'closeChart', 'pageChange' ])

const option = ref({})
const chartData = useState('sensorChartData', () => null)

const currentPage = ref(1)

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

function goPrevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('pageChange', currentPage.value)
  }
}
function goNextPage() {
  if (currentPage.value < 6) {
    currentPage.value++
    emit('pageChange', currentPage.value)
  }
}

watchEffect(() => {
  if (chartData.value && Object.keys(chartData.value).length > 0) {
    // console.log(chartData)
    option.value = buildEchartOption(chartData.value)
    emit('pageChange', 1)  // 初始时触发一次 chartPage 为 1 的事件
  }
})

onMounted(() => {
  const updateSelectedSensors = (e) => {
    selectedSensors.value = e.detail || []
  }
  window.addEventListener('sensor-selected', updateSelectedSensors)
  onBeforeUnmount(() => {
    window.removeEventListener('sensor-selected', updateSelectedSensors)
  })
})

function handleCloseChart() {
  selectedSensors.value = []
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clear-highlighted-sensors'))
  }
  emit('closeChart')
}

function clearSelectedSensors(){
  selectedSensors.value = []
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clear-highlighted-sensors'))
  }
}

function analyzeSelectedSensors(){

}

function downloadSelectedSensors(){

}
</script>

<style scoped>
@import '@/assets/css/sensor-chart.css';
</style>