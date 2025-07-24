import {fromLonLat} from "ol/proj.js";
import LineString from "ol/geom/LineString.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";

export function onDrawTrajectory({ code, points, checked,vectorSource}) {
    if (!code) return

    if (checked) {
        if (!Array.isArray(points)) {
            console.error('trajectory data is not array:', points)
            return
        }

        const projectedCoords = points.map(p => fromLonLat([p.lon, p.lat]))
        const line = new LineString(projectedCoords)
        const lineFeature = new Feature({ geometry: line })
        lineFeature.setId(`line-${code}`)
        vectorSource.addFeature(lineFeature)

        points.forEach(p => {
            const coord = fromLonLat([p.lon, p.lat])
            const pointFeature = new Feature({
                geometry: new Point(coord)
            })

            pointFeature.setProperties({
                lon: p.lon?.toFixed(6),
                lat: p.lat?.toFixed(6),
                area: p.area || 'N/A',
                time: p.time || 'N/A',
                stormcode: code
            })

            pointFeature.setId(`point-${code}-${p.lon}-${p.lat}`)
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
    } else {
        const toRemove = vectorSource.getFeatures().filter(f => {
            const id = f.getId()
            return id && id.startsWith(`line-${code}`) || id?.startsWith(`point-${code}-`)
        })
        toRemove.forEach(f => vectorSource.removeFeature(f))
    }
}