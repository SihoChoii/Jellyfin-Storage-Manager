import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { PoolsResponse } from '../types'

interface PoolUsageChartsProps {
  pools: PoolsResponse | null
  isLoading?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

interface PoolChartProps {
  title: string
  pool: { total_bytes: number; used_bytes: number; free_bytes: number } | null
}

function PoolChart({ title, pool }: PoolChartProps) {
  if (!pool) {
    return (
      <div className="pool-chart">
        <h3>{title}</h3>
        <div className="chart-empty">No pool configured</div>
      </div>
    )
  }

  // Get theme colors from CSS variables
  const styles = getComputedStyle(document.documentElement)
  const COLORS = {
    used: styles.getPropertyValue('--chart-pool-used').trim(),
    free: styles.getPropertyValue('--chart-pool-free').trim()
  }
  const tooltipBg = styles.getPropertyValue('--chart-tooltip-bg').trim()
  const tooltipBorder = styles.getPropertyValue('--chart-tooltip-border').trim()

  const usedPercent = (pool.used_bytes / pool.total_bytes) * 100
  const freePercent = (pool.free_bytes / pool.total_bytes) * 100

  const data = [
    { name: 'Used', value: pool.used_bytes, percent: usedPercent },
    { name: 'Free', value: pool.free_bytes, percent: freePercent }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          backgroundColor: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '4px',
          padding: '8px',
          color: '#fff'
        }}>
          <p style={{ margin: 0 }}>{data.name}: {formatBytes(data.value)}</p>
          <p style={{ margin: 0 }}>({formatPercent(data.percent)})</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="pool-chart">
      <h3>{title}</h3>
      <div className="pool-stats">
        <div className="stat-item">
          <span className="label">Used:</span>
          <span className="value" style={{ color: COLORS.used }}>
            {formatBytes(pool.used_bytes)} ({formatPercent(usedPercent)})
          </span>
        </div>
        <div className="stat-item">
          <span className="label">Free:</span>
          <span className="value" style={{ color: COLORS.free }}>
            {formatBytes(pool.free_bytes)} ({formatPercent(freePercent)})
          </span>
        </div>
        <div className="stat-item">
          <span className="label">Total:</span>
          <span className="value">{formatBytes(pool.total_bytes)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell fill={COLORS.used} />
            <Cell fill={COLORS.free} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PoolUsageCharts({ pools, isLoading }: PoolUsageChartsProps) {
  if (isLoading) {
    return (
      <div className="chart-container loading">
        <div className="chart-loading">Loading pool usage...</div>
      </div>
    )
  }

  return (
    <div className="pool-usage-charts">
      <PoolChart title="Hot Pool" pool={pools?.hot || null} />
      <PoolChart title="Cold Pool" pool={pools?.cold || null} />
    </div>
  )
}
