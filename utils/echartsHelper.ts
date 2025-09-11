export function buildEchartOption(results: Record<string, any[]>) {
    const series: any[] = []
    const legends: string[] = []
    // console.log(results)
    for (const [groupType, sensors] of Object.entries(results.data)) {
        // console.log(sensors)
        for (const sensor of sensors) {
            const name = `${groupType}_${sensor.id}`
            legends.push(name)
            const data = sensor.data.map((row: any) => [row.date_time, row.data])

            series.push({
                name,
                type: 'line',
                showSymbol: false,
                data: data   // ← 这里需要冒号
            })
        }
    }
console.log(series)
    return {
        tooltip: { trigger: 'axis' },
        legend: { data: legends },
        xAxis: { type: 'time' },
        yAxis: { type: 'value' },
        series
    }
}