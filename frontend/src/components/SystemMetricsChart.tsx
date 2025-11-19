import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SystemMetricsHistoryPoint } from '../types'

interface SystemMetricsChartProps {
  data: SystemMetricsHistoryPoint[]
  isLoading?: boolean
}

export function SystemMetricsChart({ data, isLoading }: SystemMetricsChartProps) {
  if (isLoading) {
    return (
      <div className="chart-container loading">
        <div className="chart-loading">Loading metrics...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container empty">
        <div className="chart-empty">No historical data available yet. Metrics will appear shortly.</div>
      </div>
    )
  }

  // Get theme colors from CSS variables
  const styles = getComputedStyle(document.documentElement)
  const cpuColor = styles.getPropertyValue('--chart-cpu').trim()
  const memoryColor = styles.getPropertyValue('--chart-memory').trim()
  const gridColor = styles.getPropertyValue('--chart-grid').trim()
  const axisColor = styles.getPropertyValue('--chart-axis').trim()
  const tooltipBg = styles.getPropertyValue('--chart-tooltip-bg').trim()
  const tooltipBorder = styles.getPropertyValue('--chart-tooltip-border').trim()

  // Transform data for display
  const chartData = data.map(point => ({
    time: new Date(point.timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    cpu: Number(point.cpu_percent.toFixed(1)),
    memory: Number(point.memory_percent.toFixed(1)),
    timestamp: point.timestamp
  }))

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cpuColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={cpuColor} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={memoryColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={memoryColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: '% Usage', angle: -90, position: 'insideLeft', style: { fill: axisColor } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '4px',
              padding: '8px'
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="cpu"
            stroke={cpuColor}
            fillOpacity={1}
            fill="url(#colorCpu)"
            name="CPU %"
          />
          <Area
            type="monotone"
            dataKey="memory"
            stroke={memoryColor}
            fillOpacity={1}
            fill="url(#colorMemory)"
            name="Memory %"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
