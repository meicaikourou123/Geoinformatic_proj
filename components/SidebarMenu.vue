<template>
  <div class="sidebar" ref="sidebar" @mousedown="startDrag">
    <div class="filter-row">
      <n-date-picker
          v-model:value="dateRange"
          type="datetimerange"
          clearable
          placeholder="Select date range"
          class="date-picker"
      />

      <n-button type="primary" class="query-button" size="small"  @click="queryData">query</n-button>
    </div>
    <div class="result-panel" v-if="queryResult.length > 0">
      <div class="summary-row">
        Found {{ queryResult.length }} Strom records.
      </div>
      <n-data-table
          :columns="columns"
          :data="queryResult"
          :pagination="false"
          :bordered="true"
          size="small"
          :row-key="row => row.stormcode"
          :checked-row-keys="selectedKeys"
          @update:checked-row-keys="onCheckboxChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import {formatTimestamp} from "~/utils/formats.ts";
import { NTree, NDatePicker, NButton,NDataTable } from 'naive-ui'



const sidebar = ref(null)
const { startDrag } = useDraggable(sidebar)
const queryResult = ref([])

const columns = [

  {
    title: 'Storm code',
    key: 'stormcode'
  },
  {
    title: 'Start time',
    key: 'start_time'
  },
  {
    title: 'end time',
    key: 'end_time'
  },
  {
    type: 'selection'
  },
]
const dateRange = ref([
  1183135260000, Date.now()
])

const selectedKeys = ref([])
const selectedRows = ref([])

const emit = defineEmits(['drawTrajectory'])
const onCheckboxChange = (newKeys) => {
  selectedKeys.value = newKeys
  const selected = queryResult.value.filter(row => newKeys.includes(row.stormcode))

  // 遍历每一条被勾选的数据，提取 points 并发射事件
  selected.forEach(row => {
    if (Array.isArray(row.points)) {
      const coordinates = row.points.map(p => [p.lon, p.lat])
      emit('drawTrajectory', coordinates)
    }
  })
}

const queryData = async () => {
  const [startDate, endDate] = dateRange.value
// if input the date in the datepicker, we need to change it from timestamp into time string
  console.log(startDate,endDate)
  const startStr = formatTimestamp(dateRange.value[0])
  const endStr =  formatTimestamp(dateRange.value[1])
  console.log(startStr)
  console.log(endStr)
  const res = await $fetch('/api/storms',{
    query:{start:startStr,
      end:endStr
    }
  })
  queryResult.value = res
  console.log('query result:', res)
}


const forceUpdatePanel = ref(false)

onMounted(() => {
  dateRange.value = [
    1277935200000, 1280440800000   //this is the ms timestamp
  ]
})
</script>

<style>
@import '@/assets/css/sidebar-menu.css';
</style>