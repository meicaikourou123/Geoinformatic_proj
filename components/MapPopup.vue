<template>
  <div id="popup" class="ol-popup" ref="popup" @click.stop @mousedown.stop @dblclick.stop>
    <div id="popup-content" ref="popupContent"></div>

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
        <n-space vertical>
          <n-time-picker v-model:value="startTime" format="HH:mm:ss" size="small" />
          <n-time-picker v-model:value="endTime" format="HH:mm:ss" size="small" />
        </n-space>
          <n-space vertical>
            <span style="font-size: 12px;">Buffer Distance (5-100km)</span>
            <n-input-number v-model:value="bufferDistanceInMeters" size="small" @dblclick.stop.prevent />
          </n-space>

      </client-only>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { NSwitch, NSpace, NTimePicker, NRadio, NButton,NSlider,NInputNumber  } from 'naive-ui'
// popup refs
const popup = ref(null)
const popupContent = ref(null)
const popupRef = ref(null)

// show on off query panel
const active = ref(false)

const startTime = ref(null)
const endTime = ref(null)

const checkedValue = ref('')

const popupCenter = ref(null)

const emit = defineEmits(['drawBufferCircle', 'querySensors'])

const bufferDistanceInMeters = ref(10) // kilometers

watch(bufferDistanceInMeters, (newVal) => {
  if (!popupCenter.value) return
  emit('drawBufferCircle', { distance: newVal * 1000, center: popupCenter.value })
})

function handleChange(event) {
  checkedValue.value = event.target.value
  if (!popupCenter.value) return

  emit('drawBufferCircle', {
    distance: bufferDistanceInMeters.value,
    center: popupCenter.value
  })
}

function updateTimeRange(centerTime) {
  const center = new Date(centerTime)
  if (isNaN(center.getTime())) return

  startTime.value = new Date(center.getTime() - 60 * 60 * 1000)
  endTime.value = new Date(center.getTime() + 60 * 60 * 1000)
  console.log(startTime, endTime)

}

function disableNonNearbyTimes(ts) {
  return ts < startTime.value?.getTime() || ts > endTime.value?.getTime()
}
// Emits the 'querySensors' event with an object containing:
//   - center: the popup center coordinates
//   - distance: the buffer distance in meters
function handleSearch() {
  console.log("Searching sensors within buffer zone")

  if (!popupCenter.value || !bufferDistanceInMeters.value) return
  emit('querySensors', {
    center: popupCenter.value,
    distance: bufferDistanceInMeters.value*1000  // km → m
  })
}

defineExpose({
  getElement: () => popup.value,
  setContent: (html, pointData) => {
    popupContent.value.innerHTML = html
    popupCenter.value = pointData || null
  },
  updateTimeRange,
  checkedValue
})
</script>

<style scoped>
.ol-popup {
  background-color: white;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 240px;
  font-size: 12px;
  position: absolute;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 999;
  pointer-events: auto;
}

#queryPanel {
  margin-top: 10px;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>