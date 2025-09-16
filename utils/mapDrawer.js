import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { Style, Stroke, Circle, Fill } from 'ol/style';
import { fromLonLat } from 'ol/proj';

/**
 * draw trajectory abd point
 */
export function drawTrajectory({ code, points, vectorSource }) {
    const lineCoords = points.map(p => fromLonLat([p.lon, p.lat]));

    // 添加 Line
    const lineFeature = new Feature({
        geometry: new LineString(lineCoords),
        code
    });
    lineFeature.setStyle(new Style({
        stroke: new Stroke({
            color: '#0077cc',
            width: 2
        })
    }));
    vectorSource.addFeature(lineFeature);

    // 添加每个点
    points.forEach(p => {
        const pointFeature = new Feature({
            geometry: new Point(fromLonLat([p.lon, p.lat])),
            lon: p.lon,
            lat: p.lat,
            area: p.area,
            time: p.time,
            code
        });

        pointFeature.setStyle(new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({ color: '#f00' }),
                stroke: new Stroke({ color: '#fff', width: 1 })
            })
        }));

        vectorSource.addFeature(pointFeature);
    });
}
