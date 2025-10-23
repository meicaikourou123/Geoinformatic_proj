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
              No sensors selected on map. <br>Please select sensor from map then analyze them.
            </div>

          </div>

          <!-- Analysis Result Panel -->
          <div v-if="showAnalysis" class="analysis-result">
            <h4 style="margin: 0px 0;">Analysis Result</h4>
            <div class="analysis-table">
              <div class="analysis-row header">
                <div class="cell type">Type</div>
                <div class="cell max">Max</div>
                <div class="cell min">Min</div>
                <div class="cell mean">Mean</div>
              </div>
              <div v-for="(result, index) in analysisResults" :key="index" class="analysis-row">
                <div class="cell type">{{ result.type }}</div>
                <div class="cell max">{{ result.max }}</div>
                <div class="cell min">{{ result.min }}</div>
                <div class="cell mean">{{ result.mean }}</div>
              </div>
            </div>
          </div>


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
import * as XLSX from 'xlsx'

const VChart = defineAsyncComponent(() => import('vue-echarts'))
const selectedSensors = useState('selectedSensorsOnMap', () => [])
const analysisResults = ref([])
const chartPanel = ref(null)
const { startDrag } = useDraggable(chartPanel)
const showAnalysis = ref(false)

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
  showAnalysis.value=false
}

function analyzeSelectedSensors() {
  if (!selectedSensors.value.length || !chartData.value) {
    analysisResults.value = []
    return
  }
  const typeStats = {}
  Object.entries(chartData.value.data).forEach(([type, sensorsData]) => {
    if (!Array.isArray(sensorsData)) return
    sensorsData.forEach(sensorData => {
      const sensorId = sensorData.id
      if (!sensorId) return
      const isSelected = selectedSensors.value.some(sel =>
        (sel.data_type + '_' + sel.idsensore) === sensorId
      )
      if (!isSelected) return

      console.log(sensorData.data)
      const values = (sensorData.data || [])
        .map(d => typeof d === 'object' ? parseFloat(d.data) : d)
        .filter(v => typeof v === 'number' && !isNaN(v))
      if (!values.length) return
      if (!typeStats[type]) {
        typeStats[type] = []
      }
      typeStats[type].push(...values)
    })
  })
  const result = Object.entries(typeStats).map(([type, values]) => {
    const max = Math.max(...values)
    const min = Math.min(...values)
    const mean = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    return { type, max, min, mean }
  })
  showAnalysis.value=true
  analysisResults.value = result
}
function downloadSelectedSensors() {
  if (!selectedSensors.value.length || !chartData.value || !chartData.value.data) return;

  const workbook = XLSX.utils.book_new();

  // Iterate over each sensor type
  for (const [type, sensors] of Object.entries(chartData.value.data)) {
    const rows = [];

    sensors.forEach(sensor => {
      const sensorId = sensor.id;
      const isSelected = selectedSensors.value.some(sel =>
        (sel.data_type + '_' + sel.idsensore) === sensorId
      );
      if (!isSelected || !sensor.data) return;

      sensor.data.forEach(entry => {
        if (entry && typeof entry === 'object') {
          rows.push([sensorId, entry.date_time|| '', entry.data]);
        }
      });
    });

    if (rows.length) {
      const worksheet = XLSX.utils.aoa_to_sheet([['ID', 'Time', 'Data'], ...rows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, type);
    }
  }

  XLSX.writeFile(workbook, 'selected_sensors.xlsx');
}
</script>

<style scoped>
@import '@/assets/css/sensor-chart.css';
</style>