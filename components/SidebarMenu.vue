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
<!--      <pre>{{ JSON.stringify(dateRange) }}</pre>-->
      <n-button type="primary" class="query-button" size="small"  @click="queryData">query</n-button>
    </div>

    <div class="result-panel" v-if="queryResult.length > 0">
      <div class="summary-row">
        Found {{ queryResult.length }} Strom records.
      </div>
<!--      <div v-for="(item, index) in queryResult" :key="index" class="result-item">-->
<!--        {{ item.t_id }}-->
<!--      </div>-->
      <n-data-table
          :columns="columns"
          :data="queryResult"
          :pagination="false"
          :bordered="true"
          size="small"
          :row-key="row => row.stormcode"
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

<style scoped>

.sidebar {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  height: auto;
  background: white;
  border: 1px solid #ccc;
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: move;
  user-select: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  //resize: vertical;
  overflow: auto;
}

.date-picker {
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #8e8d8d;
}

.date-picker {
  flex-grow: 1;
  min-width: 180px;
}

.query-button {
  flex-shrink: 0;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}

.result-panel {
  max-height: 500px;
  //height: auto;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 8px;
  background: #f9f9f9;
  font-size: 14px;
}

.summary-row {
  font-weight: bold;
  margin-bottom: 8px;
}


</style>