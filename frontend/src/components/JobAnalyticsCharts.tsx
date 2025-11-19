import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { JobAnalytics } from '../types'

interface JobAnalyticsChartsProps {
  analytics: JobAnalytics | null
  isLoading?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function JobAnalyticsCharts({ analytics, isLoading }: JobAnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="chart-container loading">
        <div className="chart-loading">Loading job analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="chart-container empty">
        <div className="chart-empty">No job data available</div>
      </div>
    )
  }

  // Get theme colors from CSS variables
  const styles = getComputedStyle(document.documentElement)
  const STATUS_COLORS = {
    running: styles.getPropertyValue('--chart-running').trim(),
    queued: styles.getPropertyValue('--chart-queued').trim(),
    completed: styles.getPropertyValue('--chart-cpu').trim(),
    failed: styles.getPropertyValue('--accent-hot').trim()
  }
  const tooltipBg = styles.getPropertyValue('--chart-tooltip-bg').trim()
  const tooltipBorder = styles.getPropertyValue('--chart-tooltip-border').trim()

  const statusData = [
    { name: 'Running', value: analytics.running_count, color: STATUS_COLORS.running },
    { name: 'Queued', value: analytics.queued_count, color: STATUS_COLORS.queued },
    { name: 'Completed', value: analytics.completed_count, color: STATUS_COLORS.completed },
    { name: 'Failed', value: analytics.failed_count, color: STATUS_COLORS.failed }
  ].filter(item => item.value > 0)

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
          <p style={{ margin: 0 }}>{data.name}: {data.value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="job-analytics-charts">
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-label">Total Jobs</div>
          <div className="summary-value">{analytics.total_jobs}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Running</div>
          <div className="summary-value" style={{ color: STATUS_COLORS.running }}>
            {analytics.running_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Queued</div>
          <div className="summary-value" style={{ color: STATUS_COLORS.queued }}>
            {analytics.queued_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Completed</div>
          <div className="summary-value" style={{ color: STATUS_COLORS.completed }}>
            {analytics.completed_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Failed</div>
          <div className="summary-value" style={{ color: STATUS_COLORS.failed }}>
            {analytics.failed_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Bytes Moved</div>
          <div className="summary-value">{formatBytes(analytics.total_bytes_moved)}</div>
        </div>
      </div>

      {statusData.length > 0 && (
        <div className="chart-container">
          <h3>Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
