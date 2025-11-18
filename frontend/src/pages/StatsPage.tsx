import { useEffect, useMemo, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { apiGet } from '../api'
import useJobsPolling from '../hooks/useJobsPolling'
import type { PoolInfo, PoolsResponse, Show, SystemStats } from '../types'
import {
  formatBytesShort,
  formatJobDirection,
  formatShowSize,
  getJobProgressPercent,
} from '../utils/formatters'

interface StatsState {
  cpuPercent: number
  memPercent: number
  hotPercent: number
  coldPercent: number
}

const initialStats: StatsState = {
  cpuPercent: 34,
  memPercent: 48,
  hotPercent: 62,
  coldPercent: 51,
}

const SPARK_BAR_COUNT = 18

const formatPoolSummary = (pool?: PoolInfo | null) => {
  if (!pool) return 'pool unavailable'
  return `${formatBytesShort(pool.used_bytes)} used / ${formatBytesShort(pool.total_bytes)} total`
}

const StatsPage = () => {
  const [pools, setPools] = useState<PoolsResponse | null>(null)
  const [isLoadingPools, setIsLoadingPools] = useState(false)
  const [poolsError, setPoolsError] = useState<string | null>(null)
  const { jobs, isLoading: isLoadingJobs, error: jobsError } = useJobsPolling({ intervalMs: 2000 })
  const [stats, setStats] = useState<StatsState>(initialStats)
  const [sparkline, setSparkline] = useState<number[]>(() =>
    Array.from({ length: SPARK_BAR_COUNT }, () => 0.2),
  )
  const [renderTimestamp] = useState(() => new Date().toLocaleTimeString())
  const [coldMedia, setColdMedia] = useState<Show[]>([])
  const [hotMedia, setHotMedia] = useState<Show[]>([])

  const queueLengthRef = useRef(0)
  const statsRef = useRef(initialStats)

  useEffect(() => {
    const active = jobs.filter((job) => job.status === 'queued' || job.status === 'running').length
    queueLengthRef.current = active
  }, [jobs])

  useEffect(() => {
    statsRef.current = stats
  }, [stats])

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

    return () => {
      cancelled = true
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

  const hotUsagePercent =
    pools?.hot && pools.hot.total_bytes > 0
      ? Math.round((pools.hot.used_bytes / pools.hot.total_bytes) * 100)
      : null
  const coldUsagePercent =
    pools?.cold && pools.cold.total_bytes > 0
      ? Math.round((pools.cold.used_bytes / pools.cold.total_bytes) * 100)
      : null

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      hotPercent: hotUsagePercent ?? prev.hotPercent,
      coldPercent: coldUsagePercent ?? prev.coldPercent,
    }))
  }, [hotUsagePercent, coldUsagePercent])

  useEffect(() => {
    let cancelled = false

    const loadSystemStats = async () => {
      try {
        const data = await apiGet<SystemStats>('/stats')
        if (cancelled) return

        const baseStats = statsRef.current
        const nextStats: StatsState = {
          cpuPercent: data.cpu_percent,
          memPercent: data.memory_percent,
          hotPercent: baseStats.hotPercent,
          coldPercent: baseStats.coldPercent,
        }

        setStats(nextStats)
        const ioSource = (hotUsagePercent ?? nextStats.hotPercent) / 100
        setSparkline(() =>
          Array.from({ length: SPARK_BAR_COUNT }, () => {
            const base = nextStats.cpuPercent / 100
            const queueFactor = Math.min(queueLengthRef.current / 10, 1)
            const jitter = 0.3 + Math.random() * 0.7
            const weight = 0.4 * base + 0.3 * ioSource + 0.3 * queueFactor
            return Math.min(1.4, Math.max(0.18, weight * 1.3 * jitter))
          }),
        )
      } catch (err) {
        console.error('Failed to load system stats', err)
      }
    }

    loadSystemStats()
    const interval = window.setInterval(() => {
      if (!cancelled) loadSystemStats()
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [hotUsagePercent])

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

  const jobStats = useMemo(() => {
    const running = jobs.filter((job) => job.status === 'running').length
    const queued = jobs.filter((job) => job.status === 'queued').length
    const success = jobs.filter((job) => job.status === 'success').length
    const failed = jobs.filter((job) => job.status === 'failed').length
    const bytesMoved = jobs
      .filter((job) => job.status === 'success')
      .reduce((sum, job) => sum + (job.total_bytes || 0), 0)
    return { running, queued, success, failed, bytesMoved }
  }, [jobs])

  const formattedBytesMoved = jobStats.bytesMoved ? formatBytesShort(jobStats.bytesMoved) : '0 B'

  const runningJobs = jobs.filter((job) => job.status === 'running')
  const etaValues = runningJobs
    .map((job) => job.eta_seconds)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  const queueDrainEstimate = etaValues.length
    ? (etaValues.reduce((sum, value) => sum + value, 0) / etaValues.length / 60).toFixed(1)
    : '--'

  const sparklineBars = sparkline.map((value, index) => (
    <div
      key={index}
      className="spark-bar"
      style={{ transform: `scaleY(${value})`, opacity: 0.45 + value * 0.35 }}
    />
  ))

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
        <section className="stats-card">
          <div className="stats-card-title">
            <span>Pool &amp; transfer stats</span>
            <span className="sub">
              {isLoadingPools || isLoadingJobs ? 'Refreshing data…' : 'Snapshots from live APIs'}
            </span>
          </div>

          <div className="stats-grid stats-grid--wide">
            <div className="stats-box">
              <div className="stats-box-label">hot usage</div>
              <div className="stats-box-value">{hotUsagePercent !== null ? `${hotUsagePercent}%` : 'N/A'}</div>
              <div className="stats-box-sub">{formatPoolSummary(pools?.hot)}</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">cold usage</div>
              <div className="stats-box-value">{coldUsagePercent !== null ? `${coldUsagePercent}%` : 'N/A'}</div>
              <div className="stats-box-sub">{formatPoolSummary(pools?.cold)}</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">jobs running</div>
              <div className="stats-box-value">{jobStats.running}</div>
              <div className="stats-box-sub">actively copying</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">jobs queued</div>
              <div className="stats-box-value">{jobStats.queued}</div>
              <div className="stats-box-sub">waiting for bandwidth</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">jobs completed</div>
              <div className="stats-box-value">{jobStats.success}</div>
              <div className="stats-box-sub">since server start</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">jobs failed</div>
              <div className="stats-box-value">{jobStats.failed}</div>
              <div className="stats-box-sub">needs attention</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">bytes moved</div>
              <div className="stats-box-value">{formattedBytesMoved}</div>
              <div className="stats-box-sub">successful transfers</div>
            </div>
          </div>

          {(poolsError || jobsError) && (
            <div className="queue-sub">
              {poolsError && <span>{poolsError}</span>} {jobsError && <span>{jobsError}</span>}
            </div>
          )}
        </section>

        <section className="stats-card">
          <div className="stats-card-title">
            <span>System activity</span>
            <span className="sub">Real-time CPU &amp; memory metrics</span>
          </div>

          <div className="stats-grid">
            <div className="stats-box">
              <div className="stats-box-label">cpu load</div>
              <div className="stats-box-value" data-key-label="cpu">
                {Math.round(stats.cpuPercent)}%
              </div>
              <div className="stats-box-sub">live server metrics</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">memory</div>
              <div className="stats-box-value" data-key-label="mem">
                {Math.round(stats.memPercent)}%
              </div>
              <div className="stats-box-sub">live server metrics</div>
            </div>
          </div>

          <div className="sparkline" id="sparkline">
            {sparklineBars}
          </div>

          <div className="stats-legend">
            <span className="legend-pill">
              <span className="legend-dot" /> CPU
            </span>
            <span className="legend-pill">
              <span className="legend-dot legend-dot-hot" /> I/O activity
            </span>
            <span className="legend-pill">
              <span className="legend-dot legend-dot-queue" /> Queue depth
            </span>
          </div>
        </section>

        <section className="stats-card">
          <div className="stats-card-title">
            <span>Transfer queue (expanded)</span>
            <span className="sub">top 10 moves across HOT / COLD</span>
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
        <span>&gt; live system metrics refreshing every 2 seconds.</span>
        <span>
          snapshot captured at <span className="accent-hot" id="render-timestamp">{renderTimestamp}</span>
        </span>
      </div>
    </div>
  )
}

export default StatsPage
