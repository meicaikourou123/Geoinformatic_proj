<template>
  <div class="layout">
    <client-only>
      <SidebarMenu @drawTrajectory="onDrawTrajectory"/>
    </client-only>
    <NuxtPage />
    <TrackInfoPanel
      ref="panelRef"
      v-show="!!selectedPoint"
      :track-data="selectedPoint"
      :sensors="bufferSensors"
      @querySensors="handleQuerySensors"
      @drawBufferCircle="onDrawBufferCircle"
      @selectSensor="handleSelectSensor"
      @toggleSensor="handleToggleSensor"
      @toggleAllSensors="handleToggleAllSensors"
      @querySelectedSensors="onQuerySelectedSensors"
      @close="handleClosePanel"
    />
  </div>
</template>

<script setup>
import SidebarMenu from '@/components/SidebarMenu.vue'
import { onMounted, ref } from 'vue'
import 'ol/ol.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Stroke, Style, Fill, Circle as CircleStyle } from 'ol/style'
import Point from 'ol/geom/Point'
import TrackInfoPanel from '@/components/TrackInfoPanel.vue'
import { circular } from 'ol/geom/Polygon'

const selectedPoint = ref(null)
const bufferSensors = ref([])
const panelRef = ref(null)

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

  map = new Map({
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
    })
  })

  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
    if (feature && feature.getGeometry().getType() === 'Point') {
      const lon = feature.get('lon')
      const lat = feature.get('lat')
      const time = feature.get('time')
      const area = feature.get('area')
      const code = feature.get('stormcode')
      // console.log(code, lon, lat)

      selectedPoint.value = { lon, lat, time, area, code }
    }
  })
})

function onDrawTrajectory({ code, points, checked }) {
  if (!code || !Array.isArray(points) || points.length === 0) return;

  if (checked) {
    const projectedCoords = points.map(p => fromLonLat([p.lon, p.lat]));
    const line = new LineString(projectedCoords);

    const lineFeature = new Feature({ geometry: line });
    lineFeature.setId(`line-${code}`);
    lineFeature.setStyle(new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3,
      })
    }));
    vectorSource.addFeature(lineFeature);

    // === Add points: first is green, rest are red ===
    points.forEach((p, index) => {
      const coord = fromLonLat([p.lon, p.lat]);
      const pointFeature = new Feature({
        geometry: new Point(coord),
      });

      pointFeature.setProperties({
        lon: p.lon?.toFixed(6),
        lat: p.lat?.toFixed(6),
        area: p.area || 'N/A',
        time: p.time || 'N/A',
        stormcode: code,
      });

      pointFeature.setId(`point-${code}-${p.lon}-${p.lat}`);
      pointFeature.setStyle(new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({ color: index === 0 ? 'green' : 'red' }),
          stroke: new Stroke({ color: 'white', width: 1 }),
        })
      }));

      vectorSource.addFeature(pointFeature);
    });

  } else {
    const toRemove = vectorSource.getFeatures().filter(f => {
      const id = f.getId();
      return id && (
          id.startsWith(`line-${code}`) ||
          id.startsWith(`point-${code}-`)
      );
    });
    toRemove.forEach(f => vectorSource.removeFeature(f));
  }
}


function onDrawBufferCircle({ distance, center }) {
  if (!distance || !center || !Array.isArray(center)) return

  const existingBuffers = vectorSource.getFeatures().filter(f => {
    const id = f.getId()
    return id && id.startsWith('buffer-')
  })
  existingBuffers.forEach(f => vectorSource.removeFeature(f))

  const [lon, lat] = center
  const circle = circular([lon, lat], distance).transform('EPSG:4326', 'EPSG:3857')

  const circleFeature = new Feature(circle)
  circleFeature.setId(`buffer-${center.join('-')}-${distance}`)

  circleFeature.setStyle(
    new Style({
      stroke: new Stroke({
        color: 'rgba(0,0,255,0.5)',
        width: 2
      }),
      fill: new Fill({
        color: 'rgba(0,0,255,0.2)'
      })
    })
  )

  vectorSource.addFeature(circleFeature)
}

function clearBufferCircles () {
  if (!vectorSource) return
  const buffers = vectorSource.getFeatures().filter(f => {
    const id = f.getId()
    return id && id.startsWith('buffer-')
  })
  buffers.forEach(f => vectorSource.removeFeature(f))
}
function clearSensorPoints () {
  if (!vectorSource) return
  const sensors = vectorSource.getFeatures().filter(f => {
    const id = f.getId()
    return id && id.startsWith('sensor-')
  })
  sensors.forEach(f => vectorSource.removeFeature(f))
}

function handleClosePanel () {
  // close panel
  selectedPoint.value = null
  // remove the buffer and sensor points
  clearBufferCircles()
  clearSensorPoints()
}

async function handleQuerySensors({ center, distance }) {
  const [lon, lat] = center
  try {
    const res = await fetch('/api/sensors-in-buffer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lon, lat, radius: distance }) // 转为米
    })

    const data = await res.json()
    // console.log('query result：', data)// Here is the sensor's basic data

    // clear the old sensor points on map
    const existingSensors = vectorSource.getFeatures().filter(f => {
      const id = f.getId()
      return id && String(id).startsWith('sensor-')
    })
    existingSensors.forEach(f => vectorSource.removeFeature(f))

    // add new sensor's points
    Object.entries(data).forEach(([tableName, sensors]) => {
      sensors.forEach(sensor => {
        const lon = parseFloat(sensor.lon)
        const lat = parseFloat(sensor.lat)
        if (isNaN(lon) || isNaN(lat)) return

        const coord = fromLonLat([lon, lat])
        const feature = new Feature({
          geometry: new Point(coord)
        })

        feature.setId(`sensor-${tableName}-${sensor.idsensore || Math.random()}`)
        feature.setProperties({
          ...sensor,
          source: tableName
        })

        feature.setStyle(
            new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: 'orange' }),
                stroke: new Stroke({ color: 'black', width: 1 })
              })
            })
        )

        vectorSource.addFeature(feature)
      })
    })

    // flatten sensors for list display in panel
    const list = []
    Object.entries(data).forEach(([tableName, sensors]) => {
      sensors.forEach(sensor => list.push({ ...sensor, table: tableName }))
    })
    bufferSensors.value = list

  } catch (error) {
    console.error('query fail：', error)
  }
}

function handleSelectSensor (sensor) {
  console.log('Selected sensor for detail:', sensor)
  // TODO: trigger detail query here if needed
}

function handleToggleSensor ({ sensor, checked }) {
  if (!sensor) return
  const table = sensor.table
  const idsensore = sensor.idsensore
  const lon = parseFloat(sensor.lon)
  const lat = parseFloat(sensor.lat)

  const matchesSensor = (f) => {
    const id = f.getId()
    if (!id || typeof id !== 'string') return false
    if (!id.startsWith('sensor-')) return false
    const props = f.getProperties()
    const sameTable = props.source === table
    const sameId = idsensore ? props.idsensore === idsensore : false
    const sameCoord = (!sameId && props.lon == sensor.lon && props.lat == sensor.lat)
    return sameTable && (sameId || sameCoord)
  }

  if (!checked) {
    const toRemove = vectorSource.getFeatures().filter(matchesSensor)
    toRemove.forEach(f => vectorSource.removeFeature(f))
    return
  }

  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    const coord = fromLonLat([lon, lat])
    const feature = new Feature({ geometry: new Point(coord) })
    feature.setId(`sensor-${table}-${idsensore || `${lon}-${lat}`}`)
    feature.setProperties({ ...sensor, source: table })
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: 'orange' }),
          stroke: new Stroke({ color: 'black', width: 1 })
        })
      })
    )
    vectorSource.addFeature(feature)
  }
}

function handleToggleAllSensors ({ checked, sensors }) {
  if (!vectorSource) return
  if (!checked) {
    const existing = vectorSource.getFeatures().filter(f => {
      const id = f.getId()
      return id && String(id).startsWith('sensor-')
    })
    existing.forEach(f => vectorSource.removeFeature(f))
    return
  }
  ;(sensors || []).forEach(sensor => {
    const lon = parseFloat(sensor.lon)
    const lat = parseFloat(sensor.lat)
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return
    const coord = fromLonLat([lon, lat])
    const feature = new Feature({ geometry: new Point(coord) })
    const table = sensor.table
    const idsensore = sensor.idsensore
    feature.setId(`sensor-${table}-${idsensore || `${lon}-${lat}`}`)
    feature.setProperties({ ...sensor, source: table })
    feature.setStyle(new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: 'orange' }),
        stroke: new Stroke({ color: 'black', width: 1 })
      })
    }))
    vectorSource.addFeature(feature)
  })
}

async function onQuerySelectedSensors () {
  const selected = panelRef.value?.getSelectedSensors?.() || []
  console.log('Selected sensors for detail:', selected)

  // TODO: before query the api, we should reformat the data
  //
  // const resp = await $fetch('/api/sensor-detail', {
  //   method: 'POST',
  //   body: selected.map(s => ({ table: s.table, id: s.idsensore }))
  // })

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