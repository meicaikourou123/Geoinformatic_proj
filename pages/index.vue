<template>
  <div id="map" style="width: 100%; height: 100vh;"></div>

</template>

<script setup>
import { onMounted } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Zoom from 'ol/control/Zoom'
import { fromLonLat } from 'ol/proj'
import TestPanel from '@/components/TestPanel.vue'

onMounted(() => {
  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: fromLonLat([8.9, 45.583333]),
      zoom: 10
    }),
    // controls: [] // 去掉默认控件
  })


})
</script>

<style scoped>

</style>