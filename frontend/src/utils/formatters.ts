import type { Job } from '../types'

const GB_IN_BYTES = 1024 ** 3

export const formatBytesShort = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** power
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[power]}`
}

export const formatShowSize = (bytes: number | null | undefined) => {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '0 GB'
  const gb = bytes / GB_IN_BYTES
  return `${gb.toFixed(gb >= 100 ? 0 : 1)} GB`
}

export const formatJobId = (id: number) => `#${id.toString().padStart(4, '0')}`

export const getJobProgressPercent = (job: Job) => {
  if (!job.total_bytes || job.total_bytes <= 0) return 0
  const progress = job.progress_bytes ?? 0
  return Math.min(100, (progress / job.total_bytes) * 100)
}

export const formatJobDirection = (job: Job) => {
  const src = job.source_path.toLowerCase()
  const dest = job.destination_path.toLowerCase()
  if (src === dest) return 'MOVE'
  if (src.includes('hot') && dest.includes('cold')) return 'HOT → COLD'
  if (src.includes('cold') && dest.includes('hot')) return 'COLD → HOT'
  if (dest.includes('hot')) return 'TO HOT'
  if (dest.includes('cold')) return 'TO COLD'
  return 'MOVE'
}

export const formatSpeed = (speed?: number | null) => {
  if (!speed || speed <= 0) return '--'
  return `${(speed / 1_000_000).toFixed(1)} MB/s`
}

export const formatEta = (eta?: number | null) => {
  if (!eta || eta <= 0) return null
  const minutes = Math.floor(eta / 60)
  const seconds = Math.max(0, Math.round(eta % 60))
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
}

export const formatJobTimestamp = (timestamp?: number | null) => {
  if (typeof timestamp !== 'number') return '—'
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}
