import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { apiGet, apiPost, apiPut } from '../api'
import type { AppConfig, PathEntry } from '../types'

const DEFAULT_PATH_ROOT = '/media'

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, power)
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[power]}`
}

interface SetupWizardProps {
  initialConfig: AppConfig | null
  onComplete: (config: AppConfig) => void
}

const SetupWizard = ({ initialConfig, onComplete }: SetupWizardProps) => {
  const [availablePaths, setAvailablePaths] = useState<PathEntry[]>([])
  const [pathsLoading, setPathsLoading] = useState(false)
  const [pathsError, setPathsError] = useState<string | null>(null)
  const [pathRootInput, setPathRootInput] = useState(DEFAULT_PATH_ROOT)
  const [pathsRoot, setPathsRoot] = useState(DEFAULT_PATH_ROOT)
  const [hotRoot, setHotRoot] = useState(initialConfig?.hot_root ?? '')
  const [coldRoot, setColdRoot] = useState(initialConfig?.cold_root ?? '')
  const [jellyfinUrl, setJellyfinUrl] = useState(initialConfig?.jellyfin.url ?? '')
  const [jellyfinApiKey, setJellyfinApiKey] = useState(initialConfig?.jellyfin.api_key ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [pendingConfig, setPendingConfig] = useState<AppConfig | null>(null)

  const fetchPaths = useCallback(async (root: string) => {
    const trimmedRoot = root.trim() || DEFAULT_PATH_ROOT
    setPathsLoading(true)
    setPathsError(null)
    try {
      const data = await apiGet<PathEntry[]>(`/paths?root=${encodeURIComponent(trimmedRoot)}`)
      setAvailablePaths(data)
      setPathsRoot(trimmedRoot)
    } catch (err) {
      console.error('Failed to load available paths', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setPathsError(`Unable to load available paths from '${trimmedRoot}' (${message}).`)
    } finally {
      setPathsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPaths(DEFAULT_PATH_ROOT)
  }, [fetchPaths])

  const handleRefreshPaths = useCallback(() => {
    void fetchPaths(pathRootInput)
  }, [fetchPaths, pathRootInput])

  const disableForm = isSaving || isScanning

  const selectedHotMeta = useMemo(() => availablePaths.find((p) => p.full_path === hotRoot), [availablePaths, hotRoot])
  const selectedColdMeta = useMemo(
    () => availablePaths.find((p) => p.full_path === coldRoot),
    [availablePaths, coldRoot],
  )

  const runInitialScan = useCallback(
    async (config: AppConfig) => {
      setScanError(null)
      setIsScanning(true)
      try {
        await apiPost('/scan')
        setIsScanning(false)
        onComplete(config)
      } catch (err) {
        console.error('Initial library scan failed', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        setScanError(
          `Initial library scan failed (${message}). You can retry now or run a scan later from Settings.`,
        )
        setIsScanning(false)
      }
    },
    [onComplete],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedHot = hotRoot.trim()
    const trimmedCold = coldRoot.trim()

    if (!trimmedHot || !trimmedCold) {
      setError('Please choose both Hot and Cold paths to continue.')
      return
    }

    if (trimmedHot === trimmedCold) {
      setError('Hot and Cold paths must be different.')
      return
    }

    const trimmedJellyfinUrl = jellyfinUrl.trim()
    const trimmedJellyfinApiKey = jellyfinApiKey.trim()

    const payload: AppConfig = {
      hot_root: trimmedHot,
      cold_root: trimmedCold,
      library_paths: [],
      jellyfin: {
        url: trimmedJellyfinUrl,
        api_key: trimmedJellyfinApiKey,
      },
    }

    setError(null)
    setScanError(null)
    setIsSaving(true)

    try {
      await apiPut('/config', payload)
    } catch (err) {
      console.error('Failed to save configuration', err)
      setIsSaving(false)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to save configuration. ${message}`)
      return
    }

    setPendingConfig(payload)
    setIsSaving(false)
    await runInitialScan(payload)
  }

  const handleRetryScan = useCallback(() => {
    if (!pendingConfig || isScanning) return
    void runInitialScan(pendingConfig)
  }, [isScanning, pendingConfig, runInitialScan])

  const handleSkipScan = useCallback(() => {
    if (!pendingConfig) return
    onComplete(pendingConfig)
  }, [onComplete, pendingConfig])

  const renderPathOptions = () => (
    <>
      <option value="">Select a path…</option>
      {availablePaths.map((path) => (
        <option key={path.full_path} value={path.full_path}>
          {path.full_path} — {formatBytes(path.free_bytes)} free / {formatBytes(path.total_bytes)} total
        </option>
      ))}
    </>
  )

  return (
    <div className="setup-wizard">
      <div className="setup-panel">
        <header className="setup-header">
          <p className="setup-eyebrow">First-run setup</p>
          <h1>Welcome to JellyMover</h1>
          <p>
            We need to know where your HOT (fast) and COLD (archive) pools live before we can orchestrate
            transfers. Choose the directories that back each pool and optionally connect Jellyfin.
          </p>
        </header>

        <form className="setup-form" onSubmit={handleSubmit}>
          <section className="setup-section">
            <h2>Storage pools</h2>
            <p className="setup-hint">
              HOT lives on SSDs for playback. COLD is your deep storage archive. Pick directories that map to those
              pools.
            </p>

            <div className="setup-field">
              <label htmlFor="path-root">Directory root</label>
              <div className="setup-path-browser">
                <input
                  id="path-root"
                  className="setup-input"
                  type="text"
                  value={pathRootInput}
                  onChange={(event) => setPathRootInput(event.target.value)}
                  disabled={pathsLoading}
                  placeholder="/media"
                />
                <button type="button" className="setup-button" onClick={handleRefreshPaths} disabled={pathsLoading}>
                  {pathsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <p className="setup-hint">Currently browsing: {pathsRoot}</p>
            </div>

            <div className="setup-field">
              <label htmlFor="hot-root">Hot pool path</label>
              <select
                id="hot-root"
                className="setup-select"
                value={hotRoot}
                onChange={(event) => setHotRoot(event.target.value)}
                disabled={pathsLoading || disableForm}
              >
                {renderPathOptions()}
              </select>
              <input
                type="text"
                className="setup-input"
                value={hotRoot}
                onChange={(event) => setHotRoot(event.target.value)}
                placeholder="…or enter a custom path (/media/ssd_pool)"
                disabled={disableForm}
              />
              {selectedHotMeta && (
                <p className="setup-path-meta">
                  {formatBytes(selectedHotMeta.free_bytes)} free of {formatBytes(selectedHotMeta.total_bytes)} on
                  {selectedHotMeta.full_path}
                </p>
              )}
            </div>

            <div className="setup-field">
              <label htmlFor="cold-root">Cold pool path</label>
              <select
                id="cold-root"
                className="setup-select"
                value={coldRoot}
                onChange={(event) => setColdRoot(event.target.value)}
                disabled={pathsLoading || disableForm}
              >
                {renderPathOptions()}
              </select>
              <input
                type="text"
                className="setup-input"
                value={coldRoot}
                onChange={(event) => setColdRoot(event.target.value)}
                placeholder="…or enter a custom path (/media/archive_pool)"
                disabled={disableForm}
              />
              {selectedColdMeta && (
                <p className="setup-path-meta">
                  {formatBytes(selectedColdMeta.free_bytes)} free of {formatBytes(selectedColdMeta.total_bytes)} on
                  {selectedColdMeta.full_path}
                </p>
              )}
            </div>

            {pathsLoading && <p className="setup-hint">Loading directories…</p>}
            {pathsError && (
              <div className="setup-inline-error">
                <span>{pathsError}</span>
                <button type="button" onClick={handleRefreshPaths} disabled={pathsLoading}>
                  Retry
                </button>
              </div>
            )}
          </section>

          <section className="setup-section">
            <h2>Optional Jellyfin settings</h2>
            <p className="setup-hint">Provide these now or connect Jellyfin later in Settings.</p>

            <div className="setup-field">
              <label htmlFor="jellyfin-url">Jellyfin server URL</label>
              <input
                id="jellyfin-url"
                className="setup-input"
                type="url"
                placeholder="https://jellyfin.local:8096"
                value={jellyfinUrl}
                onChange={(event) => setJellyfinUrl(event.target.value)}
                disabled={disableForm}
              />
            </div>

            <div className="setup-field">
              <label htmlFor="jellyfin-key">Jellyfin API key</label>
              <input
                id="jellyfin-key"
                className="setup-input"
                type="text"
                placeholder="Optional API key"
                value={jellyfinApiKey}
                onChange={(event) => setJellyfinApiKey(event.target.value)}
                disabled={disableForm}
              />
            </div>
          </section>

          {error && <div className="setup-error">{error}</div>}
          {scanError && (
            <div className="setup-inline-error">
              <span>{scanError}</span>
              <div>
                <button type="button" onClick={handleRetryScan} disabled={!pendingConfig || isScanning}>
                  Retry scan
                </button>
                <button type="button" onClick={handleSkipScan} disabled={!pendingConfig || isScanning}>
                  Skip for now
                </button>
              </div>
            </div>
          )}

          <footer className="setup-actions">
            <button className="setup-button" type="submit" disabled={disableForm}>
              {isSaving ? 'Saving…' : isScanning ? 'Scanning…' : 'Finish setup'}
            </button>
            <p className="setup-hint">We’ll kick off an initial scan right after this step.</p>
          </footer>
        </form>

        {isScanning && (
          <div className="setup-overlay">
            <div className="setup-overlay-card">
              <p className="setup-eyebrow">Setting up your library</p>
              <p>We’re cataloging your pools. This may take a minute.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SetupWizard
