import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { apiGet, apiPost } from '../api'
import type { PoolInfo, PoolsResponse, Show } from '../types'
import type { Job } from '../types'
import AppHeader from './AppHeader'
import {
  formatBytesShort,
  formatEta,
  formatJobDirection,
  formatJobId,
  formatShowSize,
  formatSpeed,
  getJobProgressPercent,
} from '../utils/formatters'
import useJobsPolling from '../hooks/useJobsPolling'
import { deriveShowTag } from './JellyMoverShell.helpers'

type MediaPool = 'cold' | 'hot'

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
const SHOWS_PAGE_SIZE = 50
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

interface ShowPaginationState {
  offset: number
  hasMore: boolean
  loading: boolean
}

const formatPoolSummary = (pool?: PoolInfo | null) => {
  if (!pool) return 'pool unavailable'
  return `${formatBytesShort(pool.used_bytes)} used / ${formatBytesShort(pool.total_bytes)} total`
}

const JellyMoverShell = () => {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'stats'>('dashboard')
  const [coldMedia, setColdMedia] = useState<Show[]>([])
  const [hotMedia, setHotMedia] = useState<Show[]>([])
  const [isLoadingShows, setIsLoadingShows] = useState(false)
  const [showsError, setShowsError] = useState<string | null>(null)
  const [coldPagination, setColdPagination] = useState<ShowPaginationState>(() => ({
    offset: 0,
    hasMore: true,
    loading: false,
  }))
  const [hotPagination, setHotPagination] = useState<ShowPaginationState>(() => ({
    offset: 0,
    hasMore: true,
    loading: false,
  }))
  const [pools, setPools] = useState<PoolsResponse | null>(null)
  const [isLoadingPools, setIsLoadingPools] = useState(false)
  const [poolsError, setPoolsError] = useState<string | null>(null)
  const { jobs, isLoading: isLoadingJobs, error: jobsError } = useJobsPolling({ intervalMs: 2000 })
  const [movingShowIds, setMovingShowIds] = useState<Set<number>>(() => new Set())
  const [moveError, setMoveError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsState>(initialStats)
  const [sparkline, setSparkline] = useState<number[]>(() =>
    Array.from({ length: SPARK_BAR_COUNT }, () => 0.2),
  )
  const [renderTimestamp] = useState(() => new Date().toLocaleTimeString())
  const queueLengthRef = useRef(0)
  const statsRef = useRef(initialStats)
  const jobStatusMapRef = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    const active = jobs.filter((job) => job.status === 'queued' || job.status === 'running').length
    queueLengthRef.current = active
  }, [jobs])

  useEffect(() => {
    statsRef.current = stats
  }, [stats])

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchShowsPage = useCallback(
    async (location: MediaPool, options?: { reset?: boolean }) => {
      const reset = options?.reset ?? false
      const setPagination = location === 'hot' ? setHotPagination : setColdPagination
      const setMedia = location === 'hot' ? setHotMedia : setColdMedia
      let requestOffset = 0

      setPagination((prev) => {
        requestOffset = reset ? 0 : prev.offset
        return {
          offset: reset ? 0 : prev.offset,
          hasMore: reset ? true : prev.hasMore,
          loading: true,
        }
      })

      if (reset) {
        setMedia([])
      }

      const params = new URLSearchParams({
        location,
        limit: SHOWS_PAGE_SIZE.toString(),
        offset: requestOffset.toString(),
      })

      try {
        const data = await apiGet<Show[]>(`/shows?${params.toString()}`)
        if (!isMountedRef.current) return
        setMedia((prev) => (reset ? data : [...prev, ...data]))
        setPagination({
          offset: requestOffset + data.length,
          hasMore: data.length === SHOWS_PAGE_SIZE,
          loading: false,
        })
      } catch (err) {
        if (!isMountedRef.current) return
        console.error(`Failed to load ${location} shows`, err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        setShowsError(`Failed to load shows (${message}).`)
        setPagination((prev) => ({
          ...prev,
          loading: false,
        }))
      }
    },
    [],
  )

  const reloadShows = useCallback(async () => {
    setIsLoadingShows(true)
    setShowsError(null)
    try {
      await Promise.all([fetchShowsPage('hot', { reset: true }), fetchShowsPage('cold', { reset: true })])
    } finally {
      if (isMountedRef.current) {
        setIsLoadingShows(false)
      }
    }
  }, [fetchShowsPage])

  useEffect(() => {
    reloadShows()
  }, [reloadShows])

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

  const hotUsagePercent = pools?.hot && pools.hot.total_bytes > 0
    ? Math.round((pools.hot.used_bytes / pools.hot.total_bytes) * 100)
    : null
  const coldUsagePercent = pools?.cold && pools.cold.total_bytes > 0
    ? Math.round((pools.cold.used_bytes / pools.cold.total_bytes) * 100)
    : null

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      hotPercent: hotUsagePercent ?? prev.hotPercent,
      coldPercent: coldUsagePercent ?? prev.coldPercent,
    }))
  }, [hotUsagePercent, coldUsagePercent])

  const updateMovingState = useCallback((showId: number, moving: boolean) => {
    setMovingShowIds((prev) => {
      const next = new Set(prev)
      if (moving) {
        next.add(showId)
      } else {
        next.delete(showId)
      }
      return next
    })
  }, [])

  const handleMoveClick = async (show: Show, target: MediaPool) => {
    if (movingShowIds.has(show.id)) return
    updateMovingState(show.id, true)
    setMoveError(null)
    try {
      await apiPost(`/shows/${show.id}/move`, { target })
    } catch (err) {
      console.error('Failed to enqueue move', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMoveError(`Failed to enqueue move. ${message}`)
    } finally {
      updateMovingState(show.id, false)
    }
  }

  useEffect(() => {
    const prevStatuses = jobStatusMapRef.current
    const nextStatuses = new Map<number, string>()
    let shouldReload = false
    jobs.forEach((job) => {
      nextStatuses.set(job.id, job.status)
      if (job.status === 'success' && prevStatuses.get(job.id) !== 'success') {
        shouldReload = true
      }
    })
    jobStatusMapRef.current = nextStatuses
    if (shouldReload) {
      reloadShows()
    }
  }, [jobs, reloadShows])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const baseStats = statsRef.current
      const nextStats: StatsState = {
        cpuPercent: randomInRange(18, 84),
        memPercent: randomInRange(28, 82),
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
    }, 2000)

    return () => window.clearInterval(interval)
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

  const busyShowIds = useMemo(() => {
    const set = new Set<number>()
    jobs.forEach((job) => {
      if (job.status === 'queued' || job.status === 'running') {
        set.add(job.show_id)
      }
    })
    return set
  }, [jobs])

  const queueActive = jobs.filter((job) => job.status === 'queued' || job.status === 'running').length
  const queueActiveDisplay = Math.min(queueActive, 3)
  const runningJobs = jobs.filter((job) => job.status === 'running')
  const avgSpeedBytes = runningJobs.reduce((sum, job) => sum + (job.speed_bytes_per_sec ?? 0), 0)
  const avgThroughput = runningJobs.length ? (avgSpeedBytes / runningJobs.length / 1_000_000).toFixed(1) : '0.0'
  const etaValues = runningJobs
    .map((job) => job.eta_seconds)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  const queueDrainEstimate = etaValues.length
    ? (etaValues.reduce((sum, value) => sum + value, 0) / etaValues.length / 60).toFixed(1)
    : '--'

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

  const renderMediaCard = (media: Show, index: number, fromPool: MediaPool) => {
    const toPool: MediaPool = fromPool === 'cold' ? 'hot' : 'cold'
    const isHotTarget = toPool === 'hot'
    const staggerStyle = { '--stagger': index } as CSSProperties
    const sizeLabel = formatShowSize(media.size_bytes)
    const tag = deriveShowTag(media)
    const displayTitle = media.title?.trim() || 'Untitled show'
    const isBusy = movingShowIds.has(media.id) || busyShowIds.has(media.id)
    const thumbnailPath = media.thumbnail_path?.trim()
    const thumbStyle = thumbnailPath
      ? {
          backgroundImage: `url(${thumbnailPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : undefined

    return (
      <article key={`${fromPool}-${media.id}`} className="media-card media-card--in" style={staggerStyle}>
        <div className="media-thumb">
          <div className="media-thumb-inner" style={thumbStyle} />
          <div className="media-thumb-label">
            <span>{fromPool === 'cold' ? 'COLD' : 'HOT'}</span>
          </div>
        </div>
        <div className="media-meta">
          <div className="media-title">{displayTitle}</div>
          <div className="media-subrow">
            <span className="media-size">{sizeLabel}</span>
            <div className="media-flags">
              <span className={`flag-chip ${fromPool === 'cold' ? 'flag-chip-cold' : 'flag-chip-hot'}`}>
                {fromPool === 'cold' ? 'HDD pool' : 'SSD pool'}
              </span>
              <span className="flag-chip">{tag}</span>
            </div>
          </div>
        </div>
        <button
          className={`transfer-btn ${isHotTarget ? 'transfer-btn--to-hot' : 'transfer-btn--to-cold'}`}
          type="button"
          onClick={() => handleMoveClick(media, toPool)}
          disabled={isBusy}
        >
          <span className="icon">{isHotTarget ? '🔥' : '❄️'}</span>
          {isBusy ? 'WORKING…' : `MOVE TO ${toPool.toUpperCase()}`}
        </button>
      </article>
    )
  }

  const renderQueueItem = (job: Job) => {
    const progress = getJobProgressPercent(job)
    const title = showTitleMap.get(job.show_id) || job.destination_path.split('/').pop() || 'Move job'
    const etaLabel = formatEta(job.eta_seconds)

    return (
      <div className="queue-item" key={job.id}>
        <div className="queue-item-title">{title}</div>
        <div className="queue-status-pill">{job.status}</div>
        <div className="queue-item-meta">
          <span>{formatShowSize(job.total_bytes)}</span>
          <span className="queue-direction">{formatJobDirection(job)}</span>
        </div>
        <div className="queue-item-meta">
          <span>{formatJobId(job.id)}</span>
          <span>{formatSpeed(job.speed_bytes_per_sec)}</span>
          {etaLabel && <span>ETA {etaLabel}</span>}
        </div>
        <div className="queue-progress-wrap">
          <div className="queue-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {job.error_message && <div className="queue-sub">{job.error_message}</div>}
      </div>
    )
  }

  const sparklineBars = sparkline.map((value, index) => (
    <div
      key={index}
      className="spark-bar"
      style={{ transform: `scaleY(${value})`, opacity: 0.45 + value * 0.35 }}
    />
  ))

  return (
    <div className="page-stack">
        <AppHeader>
          <nav className="top-nav" aria-label="Dashboard sections">
            <button
              className={`nav-btn ${activeScreen === 'dashboard' ? 'nav-btn-active' : ''}`}
              type="button"
              onClick={() => setActiveScreen('dashboard')}
            >
              <span className="dot" />
              DASHBOARD
            </button>
            <button
              className={`nav-btn ${activeScreen === 'stats' ? 'nav-btn-active' : ''}`}
              type="button"
              onClick={() => setActiveScreen('stats')}
            >
              <span className="dot" />
              STATS / QUEUE
            </button>
          </nav>
        </AppHeader>

        <div className="terminal-header">
          <div className="terminal-header-left">
            <span className="prompt-user">jellymover</span>
            <span className="prompt-host">@truenas</span>
            <span>:</span>
            <span className="prompt-path">~/pools/&lt;cold&gt;/&lt;hot&gt;</span>
            <span>$</span>
            <span>./jellymover --watch --jellyfin=/media/jellyfin</span>
          </div>
          <div className="terminal-header-right">
            <span className="tiny-pill">
              mode: <strong>dark / cli</strong>
            </span>
            <span className="tiny-pill">
              transport: <strong>ssd ↔ hdd</strong>
            </span>
          </div>
        </div>

        <main
          className={`screen ${activeScreen === 'dashboard' ? 'screen-active' : ''}`}
          id="screen-dashboard"
        >
          <section className="main-layout">
            <section className="panel-base pool-panel" data-label="pool: cold">
              <header className="panel-header">
                <div className="panel-title-row">
                  <div className="pool-tag">
                    <span className="dot" />
                    COLD
                  </div>
                  <div className="pool-title">Archive / HDD Pool</div>
                </div>
                <div className="panel-header-tools">
                  <div className="pool-meta">
                    <span className="badge-outline badge-outline-cold">readonly-ish</span>
                    <span className="cli-chip">tail cold.log</span>
                  </div>
                </div>
              </header>
              <div className="media-list" id="cold-media-list">
                {isLoadingShows && !coldMedia.length && <p className="queue-sub">Loading cold media…</p>}
                {showsError && !coldMedia.length && <p className="queue-sub">{showsError}</p>}
                {coldMedia.length > 0
                  ? coldMedia.map((item, index) => renderMediaCard(item, index, 'cold'))
                  : !isLoadingShows && !showsError && (
                      <div className="queue-footer-line">
                        <span>Cold pool is empty</span>
                        <span>queue up a move.</span>
                      </div>
                    )}
              </div>
              {!isLoadingShows && coldMedia.length > 0 && !showsError && (
                <div className="media-list-actions">
                  {coldPagination.hasMore ? (
                    <button
                      className="cli-chip"
                      type="button"
                      onClick={() => {
                        void fetchShowsPage('cold')
                      }}
                      disabled={coldPagination.loading}
                    >
                      {coldPagination.loading ? 'Loading more…' : 'Load more cold shows'}
                    </button>
                  ) : (
                    <span className="queue-sub">End of cold library</span>
                  )}
                </div>
              )}
            </section>

            <section className="panel-base pool-panel" data-label="pool: hot">
              <header className="panel-header">
                <div className="panel-title-row">
                  <div className="pool-tag">
                    <span className="dot" style={{ background: 'var(--accent-hot)' }} />
                    HOT
                  </div>
                  <div className="pool-title">Now Playing / SSD Pool</div>
                </div>
                <div className="panel-header-tools">
                  <label className="search-input">
                    <span className="icon">⌕</span>
                    <input type="text" placeholder="filter hot media…" aria-label="Filter hot media" disabled />
                  </label>
                  <span className="cli-chip">watch hot.log</span>
                </div>
              </header>
              <div className="media-list" id="hot-media-list">
                {isLoadingShows && !hotMedia.length && <p className="queue-sub">Loading hot media…</p>}
                {showsError && !hotMedia.length && <p className="queue-sub">{showsError}</p>}
                {hotMedia.length > 0
                  ? hotMedia.map((item, index) => renderMediaCard(item, index, 'hot'))
                  : !isLoadingShows && !showsError && (
                      <div className="queue-footer-line">
                        <span>Hot pool is empty</span>
                        <span>bring something from cold.</span>
                      </div>
                    )}
              </div>
              {!isLoadingShows && hotMedia.length > 0 && !showsError && (
                <div className="media-list-actions">
                  {hotPagination.hasMore ? (
                    <button
                      className="cli-chip"
                      type="button"
                      onClick={() => {
                        void fetchShowsPage('hot')
                      }}
                      disabled={hotPagination.loading}
                    >
                      {hotPagination.loading ? 'Loading more…' : 'Load more hot shows'}
                    </button>
                  ) : (
                    <span className="queue-sub">End of hot library</span>
                  )}
                </div>
              )}
            </section>

            <aside className="panel-base queue-panel" data-label="queue / stats">
              <header className="panel-header">
                <div className="queue-header-main">
                  <div>
                    <div className="queue-title">Transfer Queue</div>
                    <div className="queue-sub">media flowing between HOT / COLD</div>
                  </div>
                </div>
                <button className="cli-chip" type="button" disabled>
                  view full stats →
                </button>
              </header>

              <div className="queue-body">
                <div className="queue-list" id="queue-list">
                  {isLoadingJobs && !jobs.length && <div className="queue-sub">Loading jobs…</div>}
                  {jobsError && !jobs.length && <div className="queue-sub">{jobsError}</div>}
                  {jobs.length > 0
                    ? jobs.slice(0, 6).map(renderQueueItem)
                    : !isLoadingJobs && !jobsError && <div className="queue-sub">queue is idle</div>}
                </div>

                {moveError && <div className="queue-sub">{moveError}</div>}

                <div className="queue-footer">
                  <div className="queue-footer-line">
                    <span>active transfers</span>
                    <span>
                      <strong id="queue-active-label">{queueActiveDisplay}</strong> /{' '}
                      <span id="queue-total-label">{jobs.length}</span>
                    </span>
                  </div>
                  <div className="queue-footer-line">
                    <span>average throughput</span>
                    <span>
                      <strong id="queue-throughput-label">{avgThroughput}</strong> MB/s
                    </span>
                  </div>
                  {jobsError && <div className="queue-sub">{jobsError}</div>}
                </div>

                <div className="stats-mini">
                  {(
                    [
                      { key: 'cpu', value: stats.cpuPercent },
                      { key: 'mem', value: stats.memPercent },
                      { key: 'cold', value: coldUsagePercent ?? null },
                      { key: 'hot', value: hotUsagePercent ?? null },
                    ] as const
                  ).map(({ key, value }) => (
                    <div className="stat-row" key={key}>
                      <div className="stat-label">{key}</div>
                      <div className="stat-bar">
                        <div
                          className="stat-bar-fill"
                          data-key={key}
                          style={{ width: value !== null ? `${value}%` : '0%' }}
                        />
                      </div>
                      <div className="stat-value" data-key-label={key}>
                        {value !== null ? `${Math.round(value)}%` : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {isLoadingPools && <p className="queue-sub">Updating pool stats…</p>}
                  {poolsError && <p className="queue-sub">{poolsError}</p>}
                </div>
              </div>
            </aside>
          </section>

          <div className="footer-line">
            <span>
              &gt; hint: click a <span className="accent">MOVE</span> button to see queue animation
            </span>
            <span>
              jellyfin integration: <span className="accent-hot">TODO</span> — wire backend / API calls here.
            </span>
          </div>
        </main>

        <section className={`screen ${activeScreen === 'stats' ? 'screen-active' : ''}`} id="screen-stats">
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
                <span>System activity (simulated)</span>
                <span className="sub">Placeholder CPU / memory visualization</span>
              </div>

              <div className="stats-grid">
                <div className="stats-box">
                  <div className="stats-box-label">cpu load</div>
                  <div className="stats-box-value" data-key-label="cpu">
                    {Math.round(stats.cpuPercent)}%
                  </div>
                  <div className="stats-box-sub">synthetic until server metrics arrive</div>
                </div>
                <div className="stats-box">
                  <div className="stats-box-label">memory</div>
                  <div className="stats-box-value" data-key-label="mem">
                    {Math.round(stats.memPercent)}%
                  </div>
                  <div className="stats-box-sub">synthetic until server metrics arrive</div>
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
                  <span className="legend-dot legend-dot-hot" /> I/O (simulated)
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
                      showTitleMap.get(job.show_id) ||
                      job.destination_path.split('/').pop() ||
                      'Move job'
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
                <span>
                  &gt; coming soon: real CPU / memory metrics from the server monitor endpoint.
                </span>
                <span>
                  snapshot captured at <span className="accent-hot" id="render-timestamp">{renderTimestamp}</span>
                </span>
              </div>
        </section>
      </div>
  )
}

export default JellyMoverShell
