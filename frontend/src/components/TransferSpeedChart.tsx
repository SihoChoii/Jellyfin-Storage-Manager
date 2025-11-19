import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Job } from '../types'
import { useState, useEffect } from 'react'

interface TransferSpeedChartProps {
  jobs: Job[]
}

interface SpeedDataPoint {
  timestamp: number
  time: string
  speed: number
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
  return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function TransferSpeedChart({ jobs }: TransferSpeedChartProps) {
  const [speedHistory, setSpeedHistory] = useState<SpeedDataPoint[]>([])

  useEffect(() => {
    const runningJobs = jobs.filter(job => job.status === 'running' && job.speed_bytes_per_sec !== null)

    if (runningJobs.length === 0) {
      return
    }

    // Calculate average speed from all running jobs
    const totalSpeed = runningJobs.reduce((sum, job) => sum + (job.speed_bytes_per_sec || 0), 0)
    const avgSpeed = totalSpeed / runningJobs.length

    const now = Date.now() / 1000
    const newPoint: SpeedDataPoint = {
      timestamp: now,
      time: new Date(now * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      speed: avgSpeed
    }

    setSpeedHistory(prev => {
      // Keep last 60 data points (approximately 2 minutes at 2-second intervals)
      const updated = [...prev, newPoint]
      if (updated.length > 60) {
        return updated.slice(-60)
      }
      return updated
    })
  }, [jobs])

  if (speedHistory.length === 0) {
    return (
      <div className="chart-container empty">
        <h3>Transfer Speed</h3>
        <div className="chart-empty">No active transfers</div>
      </div>
    )
  }

  // Get theme colors from CSS variables
  const styles = getComputedStyle(document.documentElement)
  const transferSpeedColor = styles.getPropertyValue('--chart-transfer-speed').trim()
  const gridColor = styles.getPropertyValue('--chart-grid').trim()
  const axisColor = styles.getPropertyValue('--chart-axis').trim()
  const tooltipBg = styles.getPropertyValue('--chart-tooltip-bg').trim()
  const tooltipBorder = styles.getPropertyValue('--chart-tooltip-border').trim()

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '4px',
          padding: '8px',
          color: '#fff'
        }}>
          <p style={{ margin: 0 }}>{formatSpeed(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="chart-container">
      <h3>Transfer Speed (Real-time)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={speedHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatSpeed(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="speed"
            stroke={transferSpeedColor}
            strokeWidth={2}
            dot={false}
            name="Avg Speed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
