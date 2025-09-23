export function buildEchartOption(results: Record<string, any[]>) {
    // because we need to display the data on 3 charts, we need to divide the data
    // 1 rain
    // 2 humidity[0-100]
    // 3 temperature[0-50]
    // 4 pressure[]
    // 5 wind-velocity  [0-50]
    // 6 wind-direction[0-360] degree
    const series1: any[] = []
    const series2: any[] = []
    const series3: any[] = []
    const series4: any[] = []
    const series5: any[] = []
    const series6: any[] = []
    const legends1: string[] = []
    const legends2: string[] = []
    const legends3: string[] = []
    const legends4: string[] = []
    const legends5: string[] = []
    const legends6: string[] = []
    // console.log(results.data)
    for (const [groupType, sensors] of Object.entries(results.data)) {
        for (const sensor of sensors) {
            const name = `${sensor.id}`
            const data = sensor.data.map((row: any) => [row.date_time, row.data])
            const seriesItem={
                    name,
                    type: 'line',
                    showSymbol: false,
                    data: data
            }

            // const name = `${groupType}_${sensor.id}`
           if(groupType=='rain'){
                legends1.push(name)
                series1.push(seriesItem)
            }else if(groupType=='relh'){
               legends2.push(name)
               series2.push(seriesItem)
           }else if(groupType=='temp'){
               legends3.push(name)
               series3.push(seriesItem)
           }
           else if(groupType=='pres'){
               legends4.push(name)
               series4.push(seriesItem)
           }else if(groupType=='winv'){
               legends5.push(name)
               series5.push(seriesItem)
           }
           else if(groupType=='wind'){
               seriesItem.type='scatter'
               legends6.push(name)
               series6.push(seriesItem)
           }
        }
    }
    const timeSet = new Set<string>()
    for (const s of series6) {
        for (const d of s.data) {
            if (d && d[0]) {
                timeSet.add(d[0])
            }
        }
    }
    const timeIndex = Array.from(timeSet).sort()
    return {
        chartData1: {
            tooltip: { trigger: 'axis' },
            grid: {
                top: '20%',
                bottom: '10%'
            },
            legend: { data: legends1 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series1
        },
        chartData2: {
            tooltip: { trigger: 'axis' },
            grid: {
                top: '20%',
                bottom: '10%'
            },
            legend: { data: legends2 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series2
        },
        chartData3: {
            tooltip: {
                trigger: 'axis',
                position: function (point) {
                    return [point[0], point[1]-50];
                }
            },
            grid: {
                    top: '25%',
                    bottom: '10%'
            },
            legend: {
                data: legends3,
                type: 'scroll', //can ensure scroll
                orient: 'horizontal',
                top: 5,
                bottom: 20,
                itemWidth: 14,
                itemHeight: 14,
                itemGap: 12,
                width: '90%',
            },
            xAxis: { type: 'time' },
            yAxis: {
                type: 'value',
                scale: true
            },
            series: series3
        },
        chartData4: {
            tooltip: { trigger: 'axis' },
            grid: {
                top: '20%',
                bottom: '10%'
            },
            legend: { data: legends4 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value',
            scale:true
            },
            series: series4
        },
        chartData5: {
            tooltip: { trigger: 'axis' },
            grid: {
                top: '20%',
                bottom: '10%'
            },
            legend: { data: legends5 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series5
        },

        chartData6: {
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => `
      Time: ${params.value[2]}<br/>
      Direction: ${params.value[1]}°
    `
            },

            legend: {
                data: legends6,
                left: 'left',
                orient: 'vertical',
                itemWidth: 15,
                itemHeight: 15,
                itemGap: 12,

            },
            grid: {
                top: '20%',
                bottom: '10%',
                right:'10%'
            },
            polar: {},
            angleAxis: {
                type: 'value',
                min: 0,
                max: 360,
                boundaryGap: false,
                splitLine: { show: true },
                axisLine: { show: false }
            },
            radiusAxis: {
                type: 'category',
                data: timeIndex,
                axisLabel: { show: false },
                axisTick: { show: true },
                splitNumber: 12
            },
            series: series6.map(s => ({
                name: s.name,
                type: 'scatter',
                coordinateSystem: 'polar',
                symbolSize: 8,
                data: s.data
                    .map((d: any) => {
                        const windDir = Number(d[1])
                        const timeStr = d[0]
                        if (isNaN(windDir)) return null
                        const radiusIndex = timeIndex.indexOf(timeStr)
                        if (radiusIndex === -1) return null
                        // [time_index, wind_direction, timestr]
                        return [ radiusIndex,windDir, timeStr]
                    })
                    .filter(Boolean)
            }))
        }
    }
}