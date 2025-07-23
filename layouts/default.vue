<template>
  <div class="layout">
    <client-only>
      <SidebarMenu @drawTrajectory="onDrawTrajectory"/>
    </client-only>
    <NuxtPage />
  </div>
</template>

<script setup>
import SidebarMenu from '@/components/SidebarMenu.vue'
import { onMounted } from 'vue'
import 'ol/ol.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Stroke, Style } from 'ol/style'

let map
let vectorSource

onMounted(() => {
  vectorSource = new VectorSource()
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3
      })
    })
  })

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      }),
        vectorLayer
    ],
    view: new View({
      center: fromLonLat([8.9, 45.583333]),
      zoom: 10
    }),
  })
})


function onDrawTrajectory(coords) {
  const projected = coords.map(coord => fromLonLat(coord))

  // 创建轨迹线
  const line = new LineString(projected)
  const lineFeature = new Feature({ geometry: line })

  // 清除原有内容
  vectorSource.clear()

  // 添加轨迹线
  vectorSource.addFeature(lineFeature)

  // 添加每一个轨迹点为单独的 feature
  projected.forEach(coord => {
    const pointFeature = new Feature({
      geometry: new Point(coord)
    })

    pointFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 4,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 1 })
          })
        })
    )

    vectorSource.addFeature(pointFeature)
  })
}
</script>

<style>
.layout,
html, body, #__nuxt, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>