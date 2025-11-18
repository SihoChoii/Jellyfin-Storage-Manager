import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet } from '../api'
import type { Job } from '../types'

interface UseJobsPollingOptions {
  intervalMs?: number
  activeIntervalMs?: number
  idleIntervalMs?: number
  limit?: number
  offset?: number
}

interface UseJobsPollingResult {
  jobs: Job[]
  isLoading: boolean
  error: string | null
  refreshJobs: () => Promise<void>
  lastUpdated: Date | null
}

const useJobsPolling = (options: UseJobsPollingOptions = {}): UseJobsPollingResult => {
  const {
    intervalMs,
    activeIntervalMs,
    idleIntervalMs,
    limit,
    offset = 0,
  } = options
  const busyInterval = activeIntervalMs ?? intervalMs ?? 2000
  const idleInterval = idleIntervalMs ?? intervalMs ?? 10_000
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const cancelRef = useRef(false)
  const isFetchingRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const delayRef = useRef(busyInterval)

  const clearScheduledFetch = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const fetchJobs = useCallback(
    async (silent = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      clearScheduledFetch()
      if (!silent) {
        setIsLoading(true)
      }

      try {
        const params = new URLSearchParams()
        if (typeof limit === 'number') {
          params.set('limit', limit.toString())
        }
        if (offset > 0) {
          params.set('offset', offset.toString())
        }
        const query = params.toString()
        const url = query ? `/jobs?${query}` : '/jobs'
        const data = await apiGet<Job[]>(url)
        if (!cancelRef.current) {
          setJobs(data)
          setLastUpdated(new Date())
          setError(null)
          const hasActive = data.some((job) => job.status === 'queued' || job.status === 'running')
          delayRef.current = hasActive ? busyInterval : idleInterval
        }
      } catch (err) {
        if (!cancelRef.current) {
          console.error('Failed to load jobs', err)
          const message = err instanceof Error ? err.message : 'Unknown error'
          setError(`Failed to load jobs (${message}).`)
        }
      } finally {
        if (!silent && !cancelRef.current) {
          setIsLoading(false)
        }
        isFetchingRef.current = false
        if (!cancelRef.current) {
          timeoutRef.current = window.setTimeout(() => {
            void fetchJobs(true)
          }, delayRef.current)
        }
      }
    },
    [busyInterval, idleInterval, clearScheduledFetch, limit, offset],
  )

  useEffect(() => {
    cancelRef.current = false
    delayRef.current = busyInterval
    void fetchJobs(false)
    return () => {
      cancelRef.current = true
      clearScheduledFetch()
    }
  }, [busyInterval, clearScheduledFetch, fetchJobs])

  const refreshJobs = useCallback(() => fetchJobs(false), [fetchJobs])

  return {
    jobs,
    isLoading,
    error,
    refreshJobs,
    lastUpdated,
  }
}

export default useJobsPolling
