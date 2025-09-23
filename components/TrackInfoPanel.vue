<template>
  <div class="custom-popup-panel" ref="popup" @click.stop>
    <div class="panel-header" @mousedown="startDrag">
      <div class="title">Trajectory Info</div>
      <client-only>
        <n-tooltip trigger="hover">
          <template #trigger>
            <button class="tip-close" @click="emit('close')" aria-label="Close">×</button>
          </template>
          Close this Panel
        </n-tooltip>
      </client-only>
    </div>
    <div id="popup-content" ref="popupContent"></div>
    <div v-if="trackData && Object.keys(trackData).length" style="margin-top: 2px;">
      <n-grid :cols="2" :x-gap="1" :y-gap="4" class="info-grid">
        <n-gi>
          <div class="info-item"><span class="label">Code</span><span class="value">{{ trackData.code ?? '—' }}</span></div>
        </n-gi>
        <n-gi>
          <div class="info-item info-item-time"><span class="label">Time</span><span class="value">{{ trackData.time ?? '—' }}</span></div>
        </n-gi>

      </n-grid>

      <n-grid :cols="3" :x-gap="1" :y-gap="2" class="info-grid">
        <n-gi>
          <div class="info-item"><span class="label">Lon</span><span class="value">{{ trackData.lon ?? '—' }}</span></div>
        </n-gi>
        <n-gi>
          <div class="info-item"><span class="label">Lat</span><span class="value">{{ trackData.lat ?? '—' }}</span></div>
        </n-gi>
        <n-gi >
          <div class="info-item"><span class="label">Area</span><span class="value">{{ trackData.area ?? '—' }}</span></div>
        </n-gi>
      </n-grid>
    </div>

    <n-space justify="space-between" align="center">
      <client-only>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-switch v-model:value="active" size="small" @click.stop @mousedown.stop>
              <template #checked>
                On
              </template>
              <template #unchecked>
                Off
              </template>
            </n-switch>
          </template>
          Open Query Panel
        </n-tooltip>
      </client-only>


    </n-space>

    <div id="queryPanel" v-show="active">
      <client-only>
          <n-space vertical :size="4">
            <span style="font-size: 12px; font-weight: 600">Buffer Radius (5-100km)</span>
            <div class="slider-row" >
              <n-slider
                  v-model:value="bufferDistanceInMeters"
                  :min="5"
                  :step="5"
                  @mousedown.stop
                  @touchstart.stop
                  @pointerdown.stop
                  style="flex: 1;"
              />
              <n-tooltip trigger="hover">
                <template #trigger>
              <n-button strong secondary circle type="primary" size="tiny" @click="handleSearch" >
                <template #icon>
                  <img src="/icons/display.svg" alt="display" style="width: 16px; height: 16px;" />
                </template>
              </n-button>
                </template>
                Display the Sensors inside buffer
              </n-tooltip>
<!--              Here display the sensor inside the buffer-->
            </div>
          </n-space>

        <div v-if="sensors && sensors.length" class="sensor-list">
          <div class="sensor-list-header">
            <span>Sensors in Buffer ({{ sensors.length }})</span>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-checkbox
                    :checked="allChecked"
                    :indeterminate="isIndeterminate"
                    @update:checked="onToggleAll"
                    @mousedown.stop
                    @click.stop
                />
              </template>
              (Un)Check All
            </n-tooltip>


          </div>
          <div class="sensor-scroll" ref="sensorScrollRef">
            <div v-for="(group, type) in groupedSensors" :key="type" :style="{ backgroundColor: getColorForType(type), padding: '4px 6px', marginBottom: '8px', borderRadius: '4px' }">
              <div
                class="sensor-group-title"
                style="font-weight: bold; margin-bottom: 4px; height: 0; overflow: hidden; visibility: hidden;"
              >
                {{ type }}
              </div>
              <div
                v-for="(s, i) in group"
                :key="(s.idsensore || i) + '-' + (s.table || '')"
                class="sensor-row"
              >
                <div class="sensor-row-main" @click="emit('selectSensor', s)">
                  <div class="sensor-name">ID: {{ s.idsensore || '—' }} · {{ s.data_type || '—' }}--{{ s.nomestazione || s.nome_tipologia || s.idsensore }} </div>
                </div>
                <n-checkbox
                  :checked="checkedMap[getKey(s, i)] ?? true"
                  @update:checked="onToggleSensor(s, i, $event)"
                  @mousedown.stop
                  @click.stop
                />
              </div>
            </div>
          </div>
        </div>
        <n-space class="timeQueryBar">
          <n-time-picker v-model:value="startTime" format="HH:mm:ss" size="small" @mousedown.stop />
          <n-time-picker v-model:value="endTime" format="HH:mm:ss" size="small" @mousedown.stop />
          <n-tooltip trigger="hover">
            <template #trigger>
              <!--              Here we should have the query the sensor data chart-->
              <n-button strong secondary circle type="primary" size="tiny" @click="handleQuerySelectedSensors">
                <template #icon>
                  <img src="/icons/search.svg" alt="search" style="width: 16px; height: 16px;" />
                </template>
              </n-button>
            </template>
            Query Sensor's Data Chart
          </n-tooltip>
        </n-space>
      </client-only>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  trackData: {
    type: Object,
    default: () => ({})
  },
  sensors: {
    type: Array,
    default: () => []
  }
})

import { ref, computed, watch } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { NSwitch, NSpace, NTimePicker, NButton, NSlider, NGrid, NGi, NTooltip, NCheckbox } from 'naive-ui'
import { toPgTimestamp } from '~/utils/formats'
import SensorChart from '@/components/SensorChart.vue'
const showChart = ref(false)


const popup = ref(null)
const popupContent = ref(null)

const { startDrag } = useDraggable(popup)


// show on off query panel
const active = ref(false)

const startTime = ref(null)
const endTime = ref(null)

const checkedValue = ref('')

const popupCenter = ref(null)

const emit = defineEmits(['drawBufferCircle', 'querySensors', 'selectSensor', 'toggleSensor', 'toggleAllSensors', 'querySelectedSensors', 'close'])

const bufferDistanceInMeters = ref(5) // kilometers

const checkedMap = ref({})

const timeRange = computed(() => {
  const s = startTime.value
  const e = endTime.value
  if (s == null || e == null) return null
  return {
    startMs: s,
    endMs: e,
    startISO: toPgTimestamp(s),
    endISO: toPgTimestamp(e)
  }
})

const selectedSensors = computed(() =>
  (props.sensors || []).filter((s, i) => checkedMap.value[getKey(s, i)] !== false)
)

const allChecked = computed(() => {
  const list = props.sensors || []
  if (!list.length) return false
  return list.every((s, i) => checkedMap.value[getKey(s, i)] !== false)
})

const isIndeterminate = computed(() => {
  const list = props.sensors || []
  if (!list.length) return false
  const count = list.reduce((acc, s, i) => acc + (checkedMap.value[getKey(s, i)] !== false ? 1 : 0), 0)
  return count > 0 && count < list.length
})

function onToggleAll (checked) {
  const list = props.sensors || []
  const map = { ...checkedMap.value }
  list.forEach((s, i) => { map[getKey(s, i)] = checked })
  checkedMap.value = map
  emit('toggleAllSensors', { checked, sensors: list })
}

function getKey (s, i) {
  return `${s.idsensore ?? i}-${s.table ?? ''}`
}

watch(
  () => props.sensors,
  (list) => {
    const map = { ...checkedMap.value }
    ;(list || []).forEach((s, i) => {
      const k = getKey(s, i)
      if (!(k in map)) map[k] = true
    })
    checkedMap.value = map
  },
  { immediate: true, deep: true }
)

function onToggleSensor (s, i, checked) {
  checkedMap.value[getKey(s, i)] = checked
  emit('toggleSensor', { sensor: s, checked })
}

watch(
  () => props.trackData,
  (val) => {
    if (val && val.lon != null && val.lat != null) {
      popupCenter.value = [Number(val.lon), Number(val.lat)]
    } else {
      popupCenter.value = null
    }
    // ▬ set time range to ±1 hour of track point time
    if (val && val.time) {
      const center = new Date(val.time)
      if (!isNaN(center.getTime())) {
        startTime.value = center.getTime() - 60 * 60 * 1000
        endTime.value = center.getTime() + 60 * 60 * 1000
      }
    }
  },
  { immediate: true }
)

watch(bufferDistanceInMeters, (newVal) => {
  if (!popupCenter.value) return
  emit('drawBufferCircle', { distance: newVal * 1000, center: popupCenter.value })
})

const groupedSensors = computed(() => {
  const groups = {}
  for (const sensor of props.sensors || []) {
    const key = sensor.data_type || 'Unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(sensor)
  }
  return groups
})

function getColorForType(type) {
  const colorMap = {
    temp: '#6D94C5',
    relh: '#00CED1',
    rain: '#8ABB6C',
    pres: '#FAA533',
    winv: '#1C6EA4',
    wind: '#A8BBA3',
    Unknown: '#f8fafc'
  }
  return colorMap[type] || '#f5f5f5'
}

function updateTimeRange(centerTime) {
  const center = new Date(centerTime)
  if (isNaN(center.getTime())) return
  startTime.value = center.getTime() - 60 * 60 * 1000
  endTime.value = center.getTime() + 60 * 60 * 1000

}

function disableNonNearbyTimes(ts) {
  return (startTime.value != null && ts < startTime.value) || (endTime.value != null && ts > endTime.value)
}

function handleSearch() {
  if (!popupCenter.value || !bufferDistanceInMeters.value) return
  emit('querySensors', {
    center: popupCenter.value,
    distance: bufferDistanceInMeters.value*1000  // km → m
  })
}

function onRadiusChange(val) {
  const km = Number(val)
  if (!Number.isFinite(km)) return
  bufferDistanceInMeters.value = km
  if (!popupCenter.value) return
  emit('drawBufferCircle', { distance: km * 1000, center: popupCenter.value })
}

function handleQuerySelectedSensors () {
  emit('querySelectedSensors', {
    selected: selectedSensors.value,
    timeRange: timeRange.value
  })
}

const sensorScrollRef = ref(null)

function scrollToSensorGroup(key) {
  const groupEls = sensorScrollRef.value?.querySelectorAll('.sensor-group-title')
  for (const el of groupEls) {
    if (el.textContent.trim().toLowerCase().includes(key)) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    }
  }


}

defineExpose({
  getElement: () => popup.value,
  setData: (html, pointData) => {
    popupContent.value.innerHTML = html
    popupCenter.value = pointData || null
  },
  updateTimeRange,
  checkedValue,
  getSelectedSensors: () => selectedSensors.value,
  scrollToSensorGroup
})
</script>

<style scoped>
@import '@/assets/css/trackInfoPanel.css';
</style>
