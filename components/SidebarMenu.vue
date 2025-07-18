<template>
  <div class="sidebar" ref="sidebar" @mousedown="startDrag">
    <div class="filter-row">
      <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          placeholder="Select date range"
          :default-calendar-start-time="new Date('2010-10-01').getTime()"
          class="date-picker"
      />
      <n-button type="primary" class="query-button" size="small"  @click="queryData">query</n-button>
    </div>




    <div class="result-panel" v-if="queryResult.length > 0">
      <div v-for="(item, index) in queryResult" :key="index" class="result-item">
        {{ item.t_id }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { NTree, NDatePicker, NButton } from 'naive-ui'

const sidebar = ref(null)
const { startDrag } = useDraggable(sidebar)
const queryResult = ref([])

const data = ref([])
const dateRange = ref([
  new Date('2010-10-01'),
  new Date('2011-10-01')
])

const treeData = ref([])

// 模拟查询
const queryData = async () => {
  const [startDate, endDate] = dateRange.value

  const startStr = dateRange.value[0].toISOString()
  const endStr = dateRange.value[1].toISOString()
  console.log(startStr)
  const res = await $fetch('/api/query-data',{
    query:{start:startStr,
      end:endStr
    }
  })
  console.log("查询中")
  queryResult.value = res
  console.log('TestPanel 查询结果:', res)
}


const forceUpdatePanel = ref(false)

onMounted(() => {
  dateRange.value = [
    new Date('2010-10-01'),
    new Date('2011-10-01')
  ]
})
</script>

<style scoped>

.sidebar {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 300px;
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
}

.date-picker {
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 8px;
  background: #f9f9f9;
  font-size: 14px;
}

.result-item {
  padding: 4px 0;
  border-bottom: 1px dashed #ccc;
}

</style>