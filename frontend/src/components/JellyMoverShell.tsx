import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api'
import type { PoolsResponse, Show, SortDirection, SortField } from '../types'
import type { Job } from '../types'
import AppHeader from './AppHeader'
import {
  formatEta,
  formatJobDirection,
  formatJobId,
  formatShowSize,
  formatSpeed,
  getJobProgressPercent,
} from '../utils/formatters'
import useJobsPolling from '../hooks/useJobsPolling'
import { deriveShowTag } from './JellyMoverShell.helpers'
import { useDebounce } from '../utils/debounce'
import SortDropdown from './SortDropdown'

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

const SHOWS_PAGE_SIZE = 50
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

interface ShowPaginationState {
  offset: number
  hasMore: boolean
  loading: boolean
}

const JellyMoverShell = () => {
  const navigate = useNavigate()
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

  // Search and sort state
  const [hotSearchQuery, setHotSearchQuery] = useState('')
  const [coldSearchQuery, setColdSearchQuery] = useState('')
  const [hotSortBy, setHotSortBy] = useState<SortField>('title')
  const [hotSortDir, setHotSortDir] = useState<SortDirection>('asc')
  const [coldSortBy, setColdSortBy] = useState<SortField>('title')
  const [coldSortDir, setColdSortDir] = useState<SortDirection>('asc')

  // Debounced search queries
  const debouncedHotSearch = useDebounce(hotSearchQuery, 300)
  const debouncedColdSearch = useDebounce(coldSearchQuery, 300)

  const jobStatusMapRef = useRef<Map<number, string>>(new Map())

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchShowsPage = useCallback(
    async (
      location: MediaPool,
      options?: {
        reset?: boolean
        search?: string
        sortBy?: SortField
        sortDir?: SortDirection
      },
    ) => {
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

      // Add search parameter if provided
      if (options?.search && options.search.trim()) {
        params.set('search', options.search.trim())
      }

      // Add sort parameters if provided
      if (options?.sortBy) {
        params.set('sort_by', options.sortBy)
      }
      if (options?.sortDir) {
        params.set('sort_dir', options.sortDir)
      }

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

  const loadHotShows = useCallback(
    async (reset: boolean = false) => {
      await fetchShowsPage('hot', {
        reset,
        search: debouncedHotSearch,
        sortBy: hotSortBy,
        sortDir: hotSortDir,
      })
    },
    [fetchShowsPage, debouncedHotSearch, hotSortBy, hotSortDir],
  )

  const loadColdShows = useCallback(
    async (reset: boolean = false) => {
      await fetchShowsPage('cold', {
        reset,
        search: debouncedColdSearch,
        sortBy: coldSortBy,
        sortDir: coldSortDir,
      })
    },
    [fetchShowsPage, debouncedColdSearch, coldSortBy, coldSortDir],
  )

  const reloadShows = useCallback(async () => {
    setIsLoadingShows(true)
    setShowsError(null)
    try {
      await Promise.all([loadHotShows(true), loadColdShows(true)])
    } finally {
      if (isMountedRef.current) {
        setIsLoadingShows(false)
      }
    }
  }, [loadHotShows, loadColdShows])

  // Initial load
  useEffect(() => {
    reloadShows()
  }, [reloadShows])

  // Reload hot shows when search or sort changes
  useEffect(() => {
    loadHotShows(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHotSearch, hotSortBy, hotSortDir])

  // Reload cold shows when search or sort changes
  useEffect(() => {
    loadColdShows(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedColdSearch, coldSortBy, coldSortDir])

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
      setStats((prev) => ({
        cpuPercent: randomInRange(18, 84),
        memPercent: randomInRange(28, 82),
        hotPercent: hotUsagePercent ?? prev.hotPercent,
        coldPercent: coldUsagePercent ?? prev.coldPercent,
      }))
    }, 2000)

    return () => window.clearInterval(interval)
  }, [hotUsagePercent, coldUsagePercent])

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

  return (
    <div className="page-stack">
        <AppHeader />

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

        <main>
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
                    <label className="search-input">
                      <span className="icon">⌕</span>
                      <input
                        type="text"
                        placeholder="filter cold media…"
                        aria-label="Filter cold media"
                        value={coldSearchQuery}
                        onChange={(e) => setColdSearchQuery(e.target.value)}
                      />
                      {coldSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setColdSearchQuery('')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.9rem',
                          }}
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </label>
                    <SortDropdown
                      value={coldSortBy}
                      direction={coldSortDir}
                      onChange={setColdSortBy}
                      onDirectionChange={setColdSortDir}
                    />
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
                        void loadColdShows(false)
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
                    <input
                      type="text"
                      placeholder="filter hot media…"
                      aria-label="Filter hot media"
                      value={hotSearchQuery}
                      onChange={(e) => setHotSearchQuery(e.target.value)}
                    />
                    {hotSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHotSearchQuery('')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.9rem',
                        }}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </label>
                  <SortDropdown
                    value={hotSortBy}
                    direction={hotSortDir}
                    onChange={setHotSortBy}
                    onDirectionChange={setHotSortDir}
                  />
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
                        void loadHotShows(false)
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
                <button className="cli-chip" type="button" onClick={() => navigate('/stats')}>
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
      </div>
  )
}

export default JellyMoverShell
