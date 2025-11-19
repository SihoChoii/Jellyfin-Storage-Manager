import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { SystemMetricsChart } from '../components/SystemMetricsChart'
import { PoolUsageCharts } from '../components/PoolUsageCharts'
import { JobAnalyticsCharts } from '../components/JobAnalyticsCharts'
import { TransferSpeedChart } from '../components/TransferSpeedChart'
import { apiGet } from '../api'
import useJobsPolling from '../hooks/useJobsPolling'
import { useSystemMetricsHistory, useJobAnalytics } from '../hooks/useMetrics'
import type { PoolsResponse, Show, DurationOption } from '../types'
import {
  formatJobDirection,
  formatShowSize,
  getJobProgressPercent,
} from '../utils/formatters'

const StatsPage = () => {
  const [pools, setPools] = useState<PoolsResponse | null>(null)
  const [isLoadingPools, setIsLoadingPools] = useState(false)
  const [poolsError, setPoolsError] = useState<string | null>(null)
  const { jobs, isLoading: isLoadingJobs, error: jobsError } = useJobsPolling({ intervalMs: 2000 })
  const [coldMedia, setColdMedia] = useState<Show[]>([])
  const [hotMedia, setHotMedia] = useState<Show[]>([])
  const [duration, setDuration] = useState<DurationOption>('1h')

  // Fetch historical metrics
  const { data: systemHistory, isLoading: isLoadingSystemHistory } = useSystemMetricsHistory(duration)
  const { data: jobAnalytics, isLoading: isLoadingAnalytics } = useJobAnalytics()

  useEffect(() => {
    let cancelled = false

    const loadPools = async () => {
      setIsLoadingPools(true)
      setPoolsError(null)
      try {
        const data = await apiGet<PoolsResponse>('/pools')
        if (cancelled) return
        setPools(data)
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load pools', err)
          const message = err instanceof Error ? err.message : 'Unknown error'
          setPoolsError(`Failed to load pool usage (${message}).`)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPools(false)
        }
      }
    }

    loadPools()
    const interval = setInterval(loadPools, 60000) // Refresh every minute

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadMedia = async () => {
      try {
        const [coldData, hotData] = await Promise.all([
          apiGet<Show[]>('/shows?location=cold&limit=1000'),
          apiGet<Show[]>('/shows?location=hot&limit=1000'),
        ])
        if (cancelled) return
        setColdMedia(coldData)
        setHotMedia(hotData)
      } catch (err) {
        console.error('Failed to load media for title mapping', err)
      }
    }

    loadMedia()

    return () => {
      cancelled = true
    }
  }, [])

  const showTitleMap = useMemo(() => {
    const map = new Map<number, string>()
    coldMedia.forEach((show) => {
      const safeTitle = show.title?.trim() || 'Untitled show'
      map.set(show.id, safeTitle)
    })
    hotMedia.forEach((show) => {
      const safeTitle = show.title?.trim() || 'Untitled show'
      map.set(show.id, safeTitle)
    })
    return map
  }, [coldMedia, hotMedia])

  const runningJobs = jobs.filter((job) => job.status === 'running')
  const etaValues = runningJobs
    .map((job) => job.eta_seconds)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  const queueDrainEstimate = etaValues.length
    ? (etaValues.reduce((sum, value) => sum + value, 0) / etaValues.length / 60).toFixed(1)
    : '--'

  return (
    <div className="page-stack">
      <AppHeader subtitle="&gt; pool stats, job analytics, and system activity.">
        <>
          <span className="tiny-pill">statistics &amp; queue</span>
          <span className="header-hint">
            {isLoadingPools || isLoadingJobs ? 'refreshing data…' : 'live snapshots'}
          </span>
        </>
      </AppHeader>

      <section className="stats-layout">
        {/* System Metrics Chart */}
        <section className="stats-card stats-card-full">
          <div className="stats-card-title">
            <span>System Metrics</span>
            <div className="duration-selector">
              <button
                className={duration === '1h' ? 'active' : ''}
                onClick={() => setDuration('1h')}
              >
                1h
              </button>
              <button
                className={duration === '6h' ? 'active' : ''}
                onClick={() => setDuration('6h')}
              >
                6h
              </button>
              <button
                className={duration === '24h' ? 'active' : ''}
                onClick={() => setDuration('24h')}
              >
                24h
              </button>
              <button
                className={duration === '7d' ? 'active' : ''}
                onClick={() => setDuration('7d')}
              >
                7d
              </button>
            </div>
          </div>
          <SystemMetricsChart data={systemHistory} isLoading={isLoadingSystemHistory} />
        </section>

        {/* Pool Usage Charts */}
        <section className="stats-card stats-card-full">
          <div className="stats-card-title">
            <span>Pool Storage Usage</span>
            <span className="sub">Current capacity breakdown</span>
          </div>
          {poolsError && <div className="chart-error">{poolsError}</div>}
          <PoolUsageCharts pools={pools} isLoading={isLoadingPools} />
        </section>

        {/* Job Analytics */}
        <section className="stats-card stats-card-full">
          <div className="stats-card-title">
            <span>Job Analytics</span>
            <span className="sub">Transfer statistics and status distribution</span>
          </div>
          <JobAnalyticsCharts analytics={jobAnalytics} isLoading={isLoadingAnalytics} />
        </section>

        {/* Transfer Speed Chart */}
        <section className="stats-card stats-card-full">
          <TransferSpeedChart jobs={jobs} />
        </section>

        {/* Transfer Queue */}
        <section className="stats-card stats-card-full">
          <div className="stats-card-title">
            <span>Transfer Queue</span>
            <span className="sub">top 10 active/queued moves</span>
          </div>

          <div className="stats-queue-list" id="stats-queue-list">
            {isLoadingJobs && !jobs.length && <div className="queue-sub">Loading jobs…</div>}
            {jobsError && !jobs.length && <div className="queue-sub">{jobsError}</div>}
            {jobs.length > 0 ? (
              jobs.slice(0, 10).map((job) => {
                const statsTitle =
                  showTitleMap.get(job.show_id) || job.destination_path.split('/').pop() || 'Move job'
                return (
                  <div className="queue-item" key={`stats-${job.id}`}>
                    <div className="queue-item-title">{statsTitle}</div>
                    <div className="queue-status-pill">{job.status}</div>
                    <div className="queue-item-meta">
                      <span>{formatShowSize(job.total_bytes)}</span>
                      <span className="queue-direction">{formatJobDirection(job)}</span>
                    </div>
                    <div className="queue-progress-wrap">
                      <div className="queue-progress-fill" style={{ width: `${getJobProgressPercent(job)}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              !isLoadingJobs && !jobsError && <div className="queue-sub">queue is empty</div>
            )}
          </div>

          <div className="queue-footer" style={{ marginTop: '0.5rem' }}>
            <div className="queue-footer-line">
              <span>queue size</span>
              <span>
                <strong id="queue-size-big">{jobs.length}</strong> items
              </span>
            </div>
            <div className="queue-footer-line">
              <span>est. drain time</span>
              <span>
                <strong id="queue-drain-big">{queueDrainEstimate}</strong> min
              </span>
            </div>
          </div>
          {jobsError && <div className="queue-sub">{jobsError}</div>}
        </section>
      </section>

      <div className="footer-line">
        <span>&gt; live system metrics with historical data visualization.</span>
        <span>
          refreshing every 2-30 seconds
        </span>
      </div>
    </div>
  )
}

export default StatsPage
