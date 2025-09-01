<template>
  <div class="layout">
    <client-only>
      <SidebarMenu @drawTrajectory="onDrawTrajectory"/>
    </client-only>
    <NuxtPage />
    <MapPopup ref="mapPopup" @drawBufferCircle="onDrawBufferCircle" />
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
import Overlay from 'ol/Overlay'
import MapPopup from '@/components/MapPopup.vue'
import Circle from 'ol/geom/Circle'

const mapPopup = ref()

let map
let vectorSource
let popupOverlay

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

  popupOverlay = new Overlay({
    element: mapPopup.value.getElement(),
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, 30]
  })
  map.addOverlay(popupOverlay)

  map.on('click', function (evt) {
    const clickedEl = evt.originalEvent.target
    if (mapPopup.value.getElement().contains(clickedEl)) return

    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)

    if (feature && feature.getGeometry().getType() === 'Point') {
      const lon = feature.get('lon')
      const lat = feature.get('lat')
      const time = feature.get('time')
      const area = feature.get('area')
      const code = feature.get('stormcode')
      const coordinate = evt.coordinate

      if (lon && lat) {
        const html = `
          <p><strong>Storm cell Information</strong></p>
          <p><strong>Code:</strong> ${code}</p>
          <p><strong>Lon:</strong> ${lon}</p>
          <p><strong>Lat:</strong> ${lat}</p>
          <p><strong>Area:</strong> ${area}</p>
          <p><strong>Time:</strong> ${time}</p>
        `
        mapPopup.value.setContent(html, [parseFloat(lon), parseFloat(lat)])
        mapPopup.value.updateTimeRange(time)
      }

      popupOverlay.setPosition(coordinate)
    } else {
      popupOverlay.setPosition(undefined)
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

  // Remove previous buffer circles
  const existingBuffers = vectorSource.getFeatures().filter(f => {
    const id = f.getId()
    return id && id.startsWith('buffer-')
  })
  existingBuffers.forEach(f => vectorSource.removeFeature(f))

  const coord = fromLonLat(center)
  const circle = new Circle(coord, distance)
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
</script>

<style>
.layout,
html, body, #__nuxt, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>