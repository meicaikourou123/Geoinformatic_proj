// composables/useMap.js
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Zoom from 'ol/control/Zoom'
import { fromLonLat } from 'ol/proj'

export function initMap(targetId = 'map') {
    const map = new Map({
        target: targetId,
        layers: [
            new TileLayer({
                source: new OSM()
            })
        ],
        view: new View({
            center: fromLonLat([8.9, 45.583333]),
            zoom: 10
        }),
        controls: [new Zoom()]
    })

    return map
}