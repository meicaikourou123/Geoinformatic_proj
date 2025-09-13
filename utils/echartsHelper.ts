export function buildEchartOption(results: Record<string, any[]>) {
    // because we need to display the data on 3 charts, we need to divide the data
    // 1 rain & wind-velocity  [0-50]
    // 2 humidity[0-100] & temperature[0-50] & pressure[]
    // 3 wind-direction[0-360] degree
    const series1: any[] = []
    const series2: any[] = []
    const series3: any[] = []
    const series4: any[] = []
    const series5: any[] = []
    const legends1: string[] = []
    const legends2: string[] = []
    const legends3: string[] = []
    const legends4: string[] = []
    const legends5: string[] = []
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
           if(groupType=='rain'||groupType=='winv'){
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
           }
           else if(groupType=='wind'){
               legends5.push(name)
               series5.push(seriesItem)
           }


        }
    }
    return {
        chartData1: {
            tooltip: { trigger: 'axis' },
            legend: { data: legends1 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series1
        },
        chartData2: {
            tooltip: { trigger: 'axis' },
            legend: { data: legends2 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series2
        },
        chartData3: {
            tooltip: { trigger: 'axis' },
            legend: { data: legends3 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value',
                scale:true},
            series: series3
        },
        chartData4: {
            tooltip: { trigger: 'axis' },
            legend: { data: legends4 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value',
            scale:true
            },
            series: series4
        },
        chartData5: {
            tooltip: { trigger: 'axis' },
            legend: { data: legends5 },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: series5
        }
    }
}