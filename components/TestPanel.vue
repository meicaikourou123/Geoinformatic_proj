<template>
  <div class="test-panel" ref="panelRef" @mousedown="startDrag">
    <button @click="queryData">query data-testing</button>
    <ul v-if="data.length">
      <li v-for="(item, index) in data" :key="index">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDraggable } from '~/composables/useDraggable.js'

const data = ref([])

const panelRef = ref(null)
const { startDrag } = useDraggable(panelRef)

const queryData = async () => {
  const res = await $fetch('/api/query-data')
  data.value = res
  console.log('TestPanel 查询结果:', res)
}
</script>

<style scoped>
.test-panel {
  position: absolute;
  top: 200px;
  left: 120px;
  background: white;
  padding: 12px;
  border: 1px solid #ccc;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
  cursor: move;
}
</style>
