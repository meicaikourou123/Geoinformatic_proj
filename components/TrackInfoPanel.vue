<template>
  <div class="custom-popup-panel" ref="popup" @click.stop @mousedown="startDrag">
    <button class="tip-close" @click="emit('close')" aria-label="Close">×</button>
    <div id="popup-content" ref="popupContent"></div>
    <div v-if="trackData && Object.keys(trackData).length" style="margin-top: 8px;">
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
      <n-switch v-model:value="active" @click.stop>
        <template #checked>
          On
        </template>
        <template #unchecked>
          Off
        </template>
      </n-switch>
      <n-button strong secondary circle type="primary" size="tiny"  @click="handleSearch">
        <template #icon>
          <img src="/icons/search.svg" alt="search" style="width: 16px; height: 16px;" />
        </template>
      </n-button>
    </n-space>

    <div id="queryPanel" v-show="active">
      <client-only>
        <n-space >
          <n-time-picker v-model:value="startTime" format="HH:mm:ss" size="small" />
          <n-time-picker v-model:value="endTime" format="HH:mm:ss" size="small" />
        </n-space>
          <n-space vertical>
            <span style="font-size: 12px;">Buffer Distance (5-100km)</span>
            <n-input-number
              v-model:value="bufferDistanceInMeters"
              size="small"
              :min="1"
              :max="200"
              :step="1"
              @update:value="onRadiusChange"
            />
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
  }
})

import { ref, computed, watch } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { NSwitch, NSpace, NTimePicker, NRadio, NButton, NSlider, NInputNumber, NGrid, NGi } from 'naive-ui'

const popup = ref(null)
const popupContent = ref(null)

const { startDrag } = useDraggable(popup)


// show on off query panel
const active = ref(false)

const startTime = ref(null)
const endTime = ref(null)

const checkedValue = ref('')

const popupCenter = ref(null)

const emit = defineEmits(['drawBufferCircle', 'querySensors'])

const bufferDistanceInMeters = ref(10) // kilometers

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


function updateTimeRange(centerTime) {
  const center = new Date(centerTime)
  if (isNaN(center.getTime())) return
  startTime.value = center.getTime() - 60 * 60 * 1000
  endTime.value = center.getTime() + 60 * 60 * 1000
}

function disableNonNearbyTimes(ts) {
  return ts < startTime.value?.getTime() || ts > endTime.value?.getTime()
}

function handleSearch() {
  console.log("Searching sensors within buffer zone")

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

defineExpose({
  getElement: () => popup.value,
  setData: (html, pointData) => {
    popupContent.value.innerHTML = html
    popupCenter.value = pointData || null
  },
  updateTimeRange,
  checkedValue
})
</script>

<style scoped>
.custom-popup-panel {
  background-color: lightblue;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
  width: 320px;
  height: 180px;
  font-size: 12px;
  position: fixed;
  bottom: 5px;
  left: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 999;
  pointer-events: auto;
}
.tip-close {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 24px;
  height: 24px;
  line-height: 22px;
  text-align: center;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
}
.tip-close:hover {
  color: #111;
}
#queryPanel {
  margin-top: 10px;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.info-grid { margin-top: 8px; }
.info-item { display: flex; gap: 1px; align-items: baseline; line-height: 1.6; }
.info-item-time { margin-left: -55px; }
.label { font-weight: 600;min-width: 30px; font-size: 12px; color: #222;  word-break: break-all; }
.value {  color: #666;}
</style>
