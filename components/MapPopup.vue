<template>
  <div id="popup" class="ol-popup" ref="popup" @click.stop @mousedown.stop>
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
      <n-button strong secondary circle type="primary" size="tiny">
        <template #icon>
          <img src="/icons/search.svg" alt="search" style="width: 16px; height: 16px;" />
        </template>
      </n-button>
    </n-space>

    <div id="queryPanel" v-show="active">
      <client-only>
        <n-space>
          <n-time-picker v-model:value="startTime" format="HH:mm:ss" size="small" />
          <n-time-picker v-model:value="endTime" format="HH:mm:ss" size="small" />
        </n-space>
          <n-space>
            <n-radio
                :checked="checkedValue === '1 km'"
                value="1 km"
                name="basic-demo"
                @change="handleChange"
            >
              1 km
            </n-radio>
            <n-radio
                :checked="checkedValue === '2 km'"
                value="2 km"
                name="basic-demo"
                @change="handleChange"
            >
              2 km
            </n-radio>

            <n-radio
                :checked="checkedValue === '5 km'"
                value="5 km"
                name="basic-demo"
                @change="handleChange"
            >
              5 km
            </n-radio>
          </n-space>
      </client-only>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { NSwitch, NSpace,NTimePicker,NRadio,NButton } from 'naive-ui'
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

const emit = defineEmits(['drawBufferCircle'])

const bufferDistanceInMeters = computed(() => {
  const value = checkedValue.value
  if (value === '1 km') return 1000
  if (value === '2 km') return 2000
  if (value === '5 km') return 5000
  return 0
})

watch(bufferDistanceInMeters, (newVal) => {
  emit('drawBufferCircle', { distance: newVal, center: startTime.value })
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