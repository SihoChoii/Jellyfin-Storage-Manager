import { useState, useEffect } from 'react'
import type {
  SystemMetricsHistoryPoint,
  PoolUsageHistoryPoint,
  JobAnalytics,
  DurationOption
} from '../types'

const API_BASE = '/api'

export function useSystemMetricsHistory(duration: DurationOption = '1h') {
  const [data, setData] = useState<SystemMetricsHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/stats/history?duration=${duration}`)
        if (!response.ok) {
          throw new Error('Failed to fetch system metrics history')
        }
        const json = await response.json()
        if (isMounted) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [duration])

  return { data, isLoading, error }
}

export function usePoolUsageHistory(duration: DurationOption = '24h') {
  const [data, setData] = useState<PoolUsageHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/pools/history?duration=${duration}`)
        if (!response.ok) {
          throw new Error('Failed to fetch pool usage history')
        }
        const json = await response.json()
        if (isMounted) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [duration])

  return { data, isLoading, error }
}

export function useJobAnalytics() {
  const [data, setData] = useState<JobAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/jobs/analytics`)
        if (!response.ok) {
          throw new Error('Failed to fetch job analytics')
        }
        const json = await response.json()
        if (isMounted) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return { data, isLoading, error }
}
