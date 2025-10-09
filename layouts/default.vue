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
    <SensorChart  v-if="showChart" :show="showChart" @closeChart="showChart = false" :data="sensorChartData" @pageChange="scrollToSensorGroupByPage" />
  </div>

</template>

<script setup>
import SidebarMenu from '@/components/SidebarMenu.vue'
import { onMounted, ref } from 'vue'
import 'ol-ext/dist/ol-ext.css';
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
import { useRouter } from '#app'
import SensorChart from '@/components/SensorChart.vue'
import Overlay from 'ol/Overlay'

const router = useRouter()
const sensorChartData = useState('sensorChartData', () => null)
const selectedPoint = ref(null)
const bufferSensors = ref([])
const panelRef = ref(null)

const showChart = ref(false)


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

  const tooltipElement = document.createElement('div')
  tooltipElement.className = 'sensor-tooltip'
  document.body.appendChild(tooltipElement)

  const tooltipOverlay = new Overlay({
    element: tooltipElement,
    offset: [10, 10],
    positioning: 'bottom-left',
    stopEvent: false
  })
  map.addOverlay(tooltipOverlay)

  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
    if (
      feature &&
      feature.getGeometry().getType() === 'Point' &&
      feature.getId()?.startsWith('point-')
    ) {
      const lon = feature.get('lon')
      const lat = feature.get('lat')
      const time = feature.get('time')
      const area = feature.get('area')
      const code = feature.get('stormcode')
      // console.log(code, lon, lat)

      selectedPoint.value = { lon, lat, time, area, code }

      // Add small circular buffer for trajectory point
      const bufferRadius = (Math.sqrt(parseFloat(area)) || 0) / 3.14
      if (bufferRadius > 0) {
        const existingBuffers = vectorSource.getFeatures().filter(f => {
          const id = f.getId()
          return id && id.startsWith(`buffer-${code}-${lon}-${lat}`)
        })
        existingBuffers.forEach(f => vectorSource.removeFeature(f))

        const circle = circular([lon, lat], bufferRadius * 1000).transform('EPSG:4326', 'EPSG:3857')
        const circleFeature = new Feature(circle)
        circleFeature.setId(`buffer-${code}-${lon}-${lat}`)
        circleFeature.setStyle(
          new Style({
            stroke: new Stroke({ color: 'rgba(255,255,255,0.79)', width: 1 }),
            fill: new Fill({ color: 'rgba(238,68,68,0.29)' })
          })
        )
        vectorSource.addFeature(circleFeature)
      }
    }
  })

  map.on('pointermove', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
    if (feature && feature.getGeometry().getType() === 'Point' && feature.getId()?.startsWith('sensor-')) {
      // Show tooltip for all sensor points at the pixel
      const pixel = evt.pixel;
      const features = [];
      map.forEachFeatureAtPixel(pixel, (f) => {
        if (f.getGeometry().getType() === 'Point' && f.getId()?.startsWith('sensor-')) {
          features.push(f);
        }
      });
      const tooltipContent = features.map(f => {
        const p = f.getProperties();
        return `Type: ${p.data_type || 'Unknown'}<br>ID: ${p.idsensore || 'N/A'}`;
      }).join('<hr>');
      tooltipElement.innerHTML = tooltipContent;
      tooltipOverlay.setPosition(evt.coordinate)
      tooltipElement.style.display = 'block'
      map.getTargetElement().style.cursor = 'pointer'
    } else {
      tooltipElement.style.display = 'none'
      tooltipOverlay.setPosition(undefined)
      map.getTargetElement().style.cursor = ''
    }
  })
})

function onDrawTrajectory({ code, points, checked }) {

  if (!code) return;

  if (checked) {
    if (!Array.isArray(points) || points.length === 0) return;

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

  // Remove ALL buffer circles (both trajectory point buffers and manually drawn)
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
      body: JSON.stringify({ lon, lat, radius: distance }) // meters
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
                fill: new Fill({ color: 'white' }),    // here is the style of the sensors
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
  // console.log('Selected sensor for detail:', sensor)
  // TODO: trigger detail query here if needed  here we may do something about tooltip



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
    const color = sensorColorMap[sensor.data_type] || sensorColorMap['Unknown'];
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: 'white', width: 1 })
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
    const color = sensorColorMap[sensor.data_type] || sensorColorMap['Unknown'];
    feature.setStyle(new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: 'white', width: 1 })
      })
    }))
    vectorSource.addFeature(feature)
  })
}

async function onQuerySelectedSensors (payload) {
  const { selected = [], timeRange = null } = payload || {}
  if (!selected.length || !timeRange) {
    console.log('No sensors or timeRange provided')
    return
  }

  try {
    // 1) remove duplicate     use set avoid .value() compatibility problem
    const seen = new Set()
    const uniqueSelected = []
    for (const s of selected) {
      const typeKey = (s.data_type && String(s.data_type)) || (s.table && String(s.table)) || 'unknown'
      const idKey = s.idsensore ?? ''
      const key = `${typeKey}::${idKey}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueSelected.push(s)
      }
    }
    // 2) classify the data into different group
    const grouped = uniqueSelected.reduce((acc, s) => {
      const type = (s.data_type && String(s.data_type)) || (s.table && String(s.table)) || 'unknown'
      if (!acc[type]) acc[type] = []
      acc[type].push({
        id: (s.table).slice(0, -6)+s.idsensore,   // set the id as the sensor id in the pgsql table
      })
      return acc
    }, {})

    // 3) finally payload（type + timerange）
    const payloadBody = {
      groups: grouped,
      start: timeRange.startISO,
      end: timeRange.endISO
    }

    const resp = await $fetch('/api/query-sensor-detail', {
      method: 'POST',
      body: payloadBody
    })
    // console.log('Selected sensors detail:', resp)   //here is the chart data of the sensor
    sensorChartData.value = resp   // resp must be{ pressure: [...], rain: [...], ... }
    showChart.value = true
  } catch (e) {
    console.error('Fetch sensor detail failed:', e)
  }

  // here is to display chart, and I can also call the sensor draw
  scrollToSensorGroupByPage(1)
};
// the order of the table can affect the sensor display on the map
const sensorColorMap = {
  temp: '#6D94C5',
  relh: '#00CED1',
  rain: '#8ABB6C',
  pres: '#FAA533',
  winv: '#1C6EA4',
  wind: '#A8BBA3',
  Unknown: '#f8fafc'
};

function scrollToSensorGroupByPage(page) {
  const panel = panelRef.value
  if (!panel || typeof panel.scrollToSensorGroup !== 'function') return

  // Scroll to the group in the panel
  const map = {
    1: 'rain',
    2: 'relh',
    3: 'temp',
    4: 'pres',
    5: 'winv',
    6: 'wind'
  }
  const key = map[page]
  if (key) panel.scrollToSensorGroup(key)

  // Remove all currently displayed sensor points
  clearSensorPoints();

  // Add only those matching the current sensor type for the given page
  const typeMap = {
    1: 'rain',
    2: 'relh',
    3: 'temp',
    4: 'pres',
    5: 'winv',
    6: 'wind'
  };
  const type = typeMap[page];
  if (!type) return;

  const matchingSensors = bufferSensors.value.filter(s => s.data_type === type);
  for (const sensor of matchingSensors) {
    const lon = parseFloat(sensor.lon);
    const lat = parseFloat(sensor.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const coord = fromLonLat([lon, lat]);
    const feature = new Feature({
      geometry: new Point(coord)
    });
    const table = sensor.table;
    const idsensore = sensor.idsensore;
    feature.setId(`sensor-${table}-${idsensore || `${lon}-${lat}`}`);
    feature.setProperties({ ...sensor, source: table });
    const color = sensorColorMap[sensor.data_type] || sensorColorMap['Unknown'];
    feature.setStyle(new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: 'white', width: 1 })
      })
    }));
    vectorSource.addFeature(feature);
  }
}
</script>

<style>
.layout,
html, body, #__nuxt, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
.ol-zoom {
  left: auto;
  right: 12px;
  top: 12px;
}
.sensor-tooltip {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}
</style>