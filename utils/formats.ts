export function formatTimestamp(ts: number | string | Date): string {
    const date = new Date(ts)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// server/utils/format.ts

/**
 * 格式化时间为 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDateTime(date: Date | string): string {
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')

    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    const seconds = pad(d.getSeconds())

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatToPgTimestamp(iso: string) {
    return iso.replace('T', ' ').replace('Z', '')
}

export function toPgTimestamp(ms: number) {
    const d = new Date(ms)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}