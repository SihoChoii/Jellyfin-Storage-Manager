export interface JellyfinSettings {
  url: string
  api_key: string
}

export interface AppConfig {
  hot_root: string
  cold_root: string
  library_paths: string[]
  jellyfin: JellyfinSettings
}

export interface PathEntry {
  name: string
  full_path: string
  total_bytes: number
  used_bytes: number
  free_bytes: number
}

export interface Show {
  id: number
  title: string | null
  path: string
  location: string | null
  size_bytes: number | null
  season_count: number | null
  episode_count: number | null
  thumbnail_path?: string | null
}

export interface PoolInfo {
  path: string
  total_bytes: number
  used_bytes: number
  free_bytes: number
}

export interface PoolsResponse {
  hot: PoolInfo | null
  cold: PoolInfo | null
}

export interface Job {
  id: number
  show_id: number
  source_path: string
  destination_path: string
  status: string
  progress_bytes: number | null
  total_bytes: number | null
  speed_bytes_per_sec: number | null
  eta_seconds: number | null
  error_message: string | null
  created_at: number | null
  updated_at: number | null
}

export interface ScanStatus {
  state: 'Idle' | 'Running'
  last_started: number | null
  last_finished: number | null
  last_error: string | null
}

export interface JellyfinStatus {
  configured: boolean
  server_reachable: boolean
  auth_ok: boolean
  message: string | null
}

export type SortField = 'title' | 'size' | 'date' | 'seasons' | 'episodes'
export type SortDirection = 'asc' | 'desc'
