<template>
  <n-config-provider>
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
            :theme-overrides="dataTableThemeOverrides"
            :row-props="rowProps"
        />
      </div>
    </div>
  </n-config-provider>
</template>

<script setup>
import { ref,onMounted } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import {formatTimestamp} from "~/utils/formats.ts";
import { NTree, NDatePicker, NButton, NDataTable, NConfigProvider } from 'naive-ui'



const sidebar = ref(null)
const { startDrag } = useDraggable(sidebar)
const queryResult = ref([])

const dataTableThemeOverrides = {
  thPaddingSmall: '4px 8px',  // header becomes narrow
  tdPaddingSmall: '2px 8px',  // unit grid become narrow
  thFontSizeSmall: '8px',
  tdFontSizeSmall: '8px'
}

const rowProps = () => ({
  style: {
    lineHeight: '20px' // row height more compact
  }
})

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

  selected.forEach(row => {
    if (Array.isArray(row.points)) {
      emit('drawTrajectory', {
        code: row.stormcode,
        points: row.points.map(p => ({
          lon: p.lon,
          lat: p.lat,
          area: p.area,
          time: p.time
        })),
        checked: true
      })
    }
  })

  // Handle deselected items
  const unselected = queryResult.value.filter(row => !newKeys.includes(row.stormcode))

  unselected.forEach(row => {
    emit('drawTrajectory', {
      code: row.stormcode,
      area:row.area,
      points: [],
      checked: false
    })
  })
  // console.log("execut here!")
}

const queryData = async () => {
  const [startDate, endDate] = dateRange.value
// if input the date in the datepicker, we need to change it from timestamp into time string
//   console.log(startDate,endDate)
  const startStr = formatTimestamp(dateRange.value[0])
  const endStr =  formatTimestamp(dateRange.value[1])
  const res = await $fetch('/api/storms',{
    query:{
      start:startStr,
      end:endStr
    }
  })
  queryResult.value = res
  // console.log('query result:', res)
}


const forceUpdatePanel = ref(false)

onMounted(() => {
  dateRange.value = [
    // 1277935200000, 1280440800000   //this is the ms timestamp
    // 1262304000000, 1262476800000  // here is 2010-01-01
    1567296000000, 1569801600000     // 2019-09-01-----2019-09-30
  ]
})
</script>

<style>
@import '@/assets/css/sidebar-menu.css';

</style>