import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { apiGet } from '../api'
import useJobsPolling from '../hooks/useJobsPolling'
import type { Job } from '../types'
import {
  formatBytesShort,
  formatEta,
  formatJobDirection,
  formatJobId,
  formatJobTimestamp,
  formatShowSize,
  getJobProgressPercent,
} from '../utils/formatters'

const getTimestampValue = (value?: number | null) => (typeof value === 'number' ? value : 0)
const JOBS_PAGE_SIZE = 50

const JobsPage = () => {
  const {
    jobs: latestJobs,
    isLoading,
    error: jobsError,
    refreshJobs,
    lastUpdated,
  } = useJobsPolling({ intervalMs: 4000, limit: JOBS_PAGE_SIZE, offset: 0 })
  const [historicalJobs, setHistoricalJobs] = useState<Job[]>([])
  const [jobsOffset, setJobsOffset] = useState(JOBS_PAGE_SIZE)
  const [jobsHasMore, setJobsHasMore] = useState(true)
  const [loadingMoreJobs, setLoadingMoreJobs] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && jobsOffset === JOBS_PAGE_SIZE) {
      setJobsHasMore(latestJobs.length === JOBS_PAGE_SIZE)
    }
  }, [isLoading, jobsOffset, latestJobs.length])

  const displayJobs = useMemo(() => {
    const merged = new Map<number, Job>()
    latestJobs.forEach((job) => merged.set(job.id, job))
    historicalJobs.forEach((job) => {
      if (!merged.has(job.id)) {
        merged.set(job.id, job)
      }
    })
    return Array.from(merged.values()).sort(
      (a, b) => getTimestampValue(b.updated_at) - getTimestampValue(a.updated_at),
    )
  }, [historicalJobs, latestJobs])

  const showLoading = isLoading && displayJobs.length === 0
  const isRefreshing = isLoading && displayJobs.length > 0

  const jobStats = useMemo(() => {
    const running = displayJobs.filter((job) => job.status === 'running').length
    const queued = displayJobs.filter((job) => job.status === 'queued').length
    const success = displayJobs.filter((job) => job.status === 'success').length
    const failed = displayJobs.filter((job) => job.status === 'failed').length
    const bytesMoved = displayJobs
      .filter((job) => job.status === 'success')
      .reduce((sum, job) => sum + (job.total_bytes || 0), 0)
    return { running, queued, success, failed, bytesMoved }
  }, [displayJobs])

  const formattedBytesMoved = jobStats.bytesMoved ? formatBytesShort(jobStats.bytesMoved) : '0 B'

  const headerHint = showLoading
    ? 'loading jobs…'
    : isRefreshing
      ? 'refreshing…'
      : lastUpdated
        ? `updated ${lastUpdated.toLocaleTimeString()}`
        : 'waiting for data'

  const loadMoreJobs = async () => {
    if (loadingMoreJobs || !jobsHasMore) return
    setLoadingMoreJobs(true)
    setLoadMoreError(null)
    try {
      const params = new URLSearchParams({
        limit: JOBS_PAGE_SIZE.toString(),
        offset: jobsOffset.toString(),
      })
      const data = await apiGet<Job[]>(`/jobs?${params.toString()}`)
      setHistoricalJobs((prev) => [...prev, ...data])
      setJobsOffset((prev) => prev + data.length)
      if (data.length < JOBS_PAGE_SIZE) {
        setJobsHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more jobs', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setLoadMoreError(`Failed to load more jobs (${message}).`)
    } finally {
      setLoadingMoreJobs(false)
    }
  }

  return (
    <div className="page-stack">
      <AppHeader subtitle="&gt; inspect all transfer jobs, past or present.">
        <>
          <span className="tiny-pill">job monitor</span>
          <span className="header-hint">{headerHint}</span>
          <button className="cli-chip" type="button" onClick={() => void refreshJobs()} disabled={isLoading && !displayJobs.length}>
            Refresh
          </button>
        </>
      </AppHeader>

      <section className="panel-base" data-label="overview">
        <header className="panel-header">
          <div className="panel-title-row">
            <div className="pool-tag">
              <span className="dot" />
              Overview
            </div>
            <div className="pool-title">Jobs snapshot</div>
          </div>
        </header>
        <div className="panel-body">
          <div className="stats-grid stats-grid--wide">
            <div className="stats-box">
              <div className="stats-box-label">running</div>
              <div className="stats-box-value">{jobStats.running}</div>
              <div className="stats-box-sub">actively moving</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">queued</div>
              <div className="stats-box-value">{jobStats.queued}</div>
              <div className="stats-box-sub">waiting their turn</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">completed</div>
              <div className="stats-box-value">{jobStats.success}</div>
              <div className="stats-box-sub">successful transfers</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">failed</div>
              <div className="stats-box-value">{jobStats.failed}</div>
              <div className="stats-box-sub">needs attention</div>
            </div>
            <div className="stats-box">
              <div className="stats-box-label">bytes moved</div>
              <div className="stats-box-value">{formattedBytesMoved}</div>
              <div className="stats-box-sub">successful runs total</div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-base" data-label="history">
        <header className="panel-header">
          <div className="panel-title-row">
            <div className="pool-tag">
              <span className="dot" />
              Jobs
            </div>
            <div className="pool-title">Full transfer history</div>
          </div>
        </header>
        <div className="panel-body jobs-table-wrapper">
          {showLoading && <div className="queue-sub">Loading jobs…</div>}
          {jobsError && !showLoading && (
            <div className="setup-inline-error">
              <span>{jobsError}</span>
              <button type="button" onClick={() => void refreshJobs()}>
                Retry
              </button>
            </div>
          )}
          {!showLoading && !jobsError && displayJobs.length === 0 && (
            <div className="queue-sub">No jobs yet. Trigger a move to see history here.</div>
          )}
          {!showLoading && !jobsError && displayJobs.length > 0 && (
            <>
              <div className="jobs-table-scroll">
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>Show / Path</th>
                      <th>Direction</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayJobs.map((job) => {
                      const title = job.destination_path.split('/').pop() || formatJobId(job.id)
                      const progress = getJobProgressPercent(job)
                      const etaLabel = formatEta(job.eta_seconds)

                      return (
                        <tr key={job.id}>
                          <td>
                            <div className="job-title">{title}</div>
                            <div className="job-subtext">{formatJobId(job.id)}</div>
                          </td>
                          <td>
                            <span className="queue-direction">{formatJobDirection(job)}</span>
                          </td>
                          <td>
                            <span className="queue-status-pill">{job.status}</span>
                            {job.error_message && <div className="queue-sub">{job.error_message}</div>}
                          </td>
                          <td>
                            <div className="jobs-progress">
                              <div className="queue-progress-wrap">
                                <div className="queue-progress-fill" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="jobs-progress-label">{progress.toFixed(0)}%</span>
                              {etaLabel && <span className="jobs-progress-eta">ETA {etaLabel}</span>}
                            </div>
                          </td>
                          <td>{formatShowSize(job.total_bytes)}</td>
                          <td>{formatJobTimestamp(job.created_at)}</td>
                          <td>{formatJobTimestamp(job.updated_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="jobs-table-actions">
                {loadMoreError && <span className="queue-sub">{loadMoreError}</span>}
                {jobsHasMore ? (
                  <button className="cli-chip" type="button" onClick={() => void loadMoreJobs()} disabled={loadingMoreJobs}>
                    {loadingMoreJobs ? 'Loading more…' : 'Load more jobs'}
                  </button>
                ) : (
                  <span className="queue-sub">No more jobs to show.</span>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default JobsPage
