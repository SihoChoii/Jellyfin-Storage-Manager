import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { apiGet, apiPost, apiPut } from '../api'
import type { AppConfig, JellyfinStatus, PathEntry } from '../types'
import AppHeader from '../components/AppHeader'

const PATH_BROWSE_ROOT = '/mnt'

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[exponent]}`
}

interface SettingsFormState {
  hot_root: string
  cold_root: string
  libraryPathsText: string
  jellyfin_url: string
  jellyfin_api_key: string
}

const defaultFormState: SettingsFormState = {
  hot_root: '',
  cold_root: '',
  libraryPathsText: '',
  jellyfin_url: '',
  jellyfin_api_key: '',
}

const SettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formState, setFormState] = useState<SettingsFormState>(defaultFormState)

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [pathOptions, setPathOptions] = useState<PathEntry[]>([])
  const [pathsLoading, setPathsLoading] = useState(false)
  const [pathsError, setPathsError] = useState<string | null>(null)
  const [pathPickerTarget, setPathPickerTarget] = useState<'hot' | 'cold' | null>(null)

  const [scanLoading, setScanLoading] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const [jellyfinScanLoading, setJellyfinScanLoading] = useState(false)
  const [jellyfinScanMessage, setJellyfinScanMessage] = useState<string | null>(null)
  const [jellyfinScanError, setJellyfinScanError] = useState<string | null>(null)

  const [jellyfinTestLoading, setJellyfinTestLoading] = useState(false)
  const [jellyfinTestMessage, setJellyfinTestMessage] = useState<string | null>(null)
  const [jellyfinTestError, setJellyfinTestError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const config = await apiGet<AppConfig>('/config')
      setFormState({
        hot_root: config.hot_root,
        cold_root: config.cold_root,
        libraryPathsText: config.library_paths.join('\n'),
        jellyfin_url: config.jellyfin.url,
        jellyfin_api_key: config.jellyfin.api_key,
      })
    } catch (err) {
      console.error('Failed to load configuration', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setLoadError(`Failed to load configuration (${message}).`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleInputChange = (field: keyof SettingsFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const openPathPicker = async (target: 'hot' | 'cold') => {
    setPathPickerTarget(target)
    setPathsError(null)
    setPathsLoading(true)
    try {
      const entries = await apiGet<PathEntry[]>(`/paths?root=${encodeURIComponent(PATH_BROWSE_ROOT)}`)
      setPathOptions(entries)
    } catch (err) {
      console.error('Failed to load directories', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setPathsError(`Failed to load directories (${message}).`)
    } finally {
      setPathsLoading(false)
    }
  }

  const applyPathSelection = (value: string) => {
    if (!pathPickerTarget) return
    handleInputChange(pathPickerTarget === 'hot' ? 'hot_root' : 'cold_root', value)
    setPathPickerTarget(null)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    const hotRoot = formState.hot_root.trim()
    const coldRoot = formState.cold_root.trim()
    const jellyfinUrl = formState.jellyfin_url.trim()
    const jellyfinKey = formState.jellyfin_api_key.trim()
    const libraryPaths = formState.libraryPathsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const payload: AppConfig = {
      hot_root: hotRoot,
      cold_root: coldRoot,
      library_paths: libraryPaths,
      jellyfin: {
        url: jellyfinUrl,
        api_key: jellyfinKey,
      },
    }

    try {
      await apiPut('/config', payload)
      setSaveMessage('Settings saved.')
    } catch (err) {
      console.error('Failed to save settings', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setSaveError(`Failed to save settings. ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const triggerScan = async () => {
    setScanError(null)
    setScanMessage(null)
    setScanLoading(true)
    try {
      await apiPost('/scan')
      setScanMessage('Library rescan kicked off.')
    } catch (err) {
      console.error('Failed to start scan', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setScanError(`Failed to start scan (${message}).`)
    } finally {
      setScanLoading(false)
    }
  }

  const triggerJellyfinScan = async () => {
    setJellyfinScanError(null)
    setJellyfinScanMessage(null)
    setJellyfinScanLoading(true)
    try {
      await apiPost('/jellyfin/rescan')
      setJellyfinScanMessage('Jellyfin rescan requested.')
    } catch (err) {
      console.error('Failed to trigger Jellyfin rescan', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setJellyfinScanError(`Failed to trigger Jellyfin rescan (${message}).`)
    } finally {
      setJellyfinScanLoading(false)
    }
  }

  const testJellyfinConnection = async () => {
    setJellyfinTestError(null)
    setJellyfinTestMessage(null)
    setJellyfinTestLoading(true)
    try {
      const status = await apiGet<JellyfinStatus>('/jellyfin/status')
      if (status.configured && status.server_reachable && status.auth_ok) {
        setJellyfinTestMessage('✓ Connection successful!')
      } else if (!status.configured) {
        setJellyfinTestError('Jellyfin is not configured.')
      } else if (!status.server_reachable) {
        setJellyfinTestError(status.message || 'Server not reachable.')
      } else if (!status.auth_ok) {
        setJellyfinTestError(status.message || 'Authentication failed.')
      }
    } catch (err) {
      console.error('Failed to test Jellyfin connection', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setJellyfinTestError(`Connection test failed (${message}).`)
    } finally {
      setJellyfinTestLoading(false)
    }
  }

  const jellyfinConfigured = Boolean(formState.jellyfin_url.trim() || formState.jellyfin_api_key.trim())

  const renderPathPicker = (target: 'hot' | 'cold') => {
    if (pathPickerTarget !== target) return null

    return (
      <div className="settings-path-picker">
        {pathsLoading && <p className="settings-hint">Loading directories…</p>}
        {pathsError && <p className="settings-error">{pathsError}</p>}
        {!pathsLoading && !pathsError && (
          <select
            className="settings-select"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                applyPathSelection(event.target.value)
              }
            }}
          >
            <option value="">Select a path…</option>
            {pathOptions.map((path) => (
              <option key={path.full_path} value={path.full_path}>
                {path.full_path} — {formatBytes(path.free_bytes)} free / {formatBytes(path.total_bytes)} total
              </option>
            ))}
          </select>
        )}
        <button type="button" className="settings-ghost-button" onClick={() => setPathPickerTarget(null)}>
          Close
        </button>
      </div>
    )
  }

  const headerHint = loading ? 'loading config…' : saving ? 'saving…' : saveMessage ?? 'ready for tweaks'

  let pageBody: ReactNode

  if (loading) {
    pageBody = (
      <section className="settings-card">
        <p className="settings-hint">Loading configuration…</p>
      </section>
    )
  } else if (loadError) {
    pageBody = (
      <section className="settings-card">
        <p className="settings-error">{loadError}</p>
        <button className="setup-button" type="button" onClick={loadConfig}>
          Retry
        </button>
      </section>
    )
  } else {
    pageBody = (
      <section className="settings-page">
        <header className="settings-header">
          <h1>Settings</h1>
          <p>Manage pool paths, Jellyfin integration, and rescans.</p>
        </header>
        <form className="settings-grid" onSubmit={handleSave}>
          <section className="settings-card">
            <h2>Paths & Pools</h2>
            <p className="settings-hint">Configure where JellyMover can find your HOT and COLD pools.</p>

            <div className="settings-field">
              <label htmlFor="hot-root">Hot root path</label>
              <div className="settings-field-row">
                <input
                  id="hot-root"
                  className="settings-input"
                  type="text"
                  value={formState.hot_root}
                  onChange={(event) => handleInputChange('hot_root', event.target.value)}
                />
                <button type="button" className="settings-ghost-button" onClick={() => openPathPicker('hot')}>
                  Browse
                </button>
              </div>
              {renderPathPicker('hot')}
            </div>

            <div className="settings-field">
              <label htmlFor="cold-root">Cold root path</label>
              <div className="settings-field-row">
                <input
                  id="cold-root"
                  className="settings-input"
                  type="text"
                  value={formState.cold_root}
                  onChange={(event) => handleInputChange('cold_root', event.target.value)}
                />
                <button type="button" className="settings-ghost-button" onClick={() => openPathPicker('cold')}>
                  Browse
                </button>
              </div>
              {renderPathPicker('cold')}
            </div>

            <div className="settings-field">
              <label htmlFor="library-paths">Library paths (one per line)</label>
              <textarea
                id="library-paths"
                className="settings-textarea"
                value={formState.libraryPathsText}
                onChange={(event) => handleInputChange('libraryPathsText', event.target.value)}
                rows={4}
                placeholder="/mnt/ssd/media\n/mnt/archive/tv"
              />
            </div>
          </section>

          <section className="settings-card">
            <h2>Jellyfin integration</h2>
            <p className="settings-hint">Optional — provide your Jellyfin URL and API key to sync metadata.</p>

            <div className="settings-field">
              <label htmlFor="jellyfin-url">Jellyfin URL</label>
              <input
                id="jellyfin-url"
                className="settings-input"
                type="url"
                placeholder="https://jellyfin.local:8096"
                value={formState.jellyfin_url}
                onChange={(event) => handleInputChange('jellyfin_url', event.target.value)}
              />
            </div>

            <div className="settings-field">
              <label htmlFor="jellyfin-key">Jellyfin API key</label>
              <input
                id="jellyfin-key"
                className="settings-input"
                type="text"
                placeholder="Optional API key"
                value={formState.jellyfin_api_key}
                onChange={(event) => handleInputChange('jellyfin_api_key', event.target.value)}
              />
            </div>

            <div className="settings-maintenance">
              <button
                type="button"
                className="setup-button"
                onClick={testJellyfinConnection}
                disabled={jellyfinTestLoading || !jellyfinConfigured}
              >
                {jellyfinTestLoading ? 'Testing…' : 'Test Connection'}
              </button>
              {!jellyfinConfigured && (
                <span className="settings-hint">Add Jellyfin details above to test connection.</span>
              )}
              {jellyfinTestMessage && <span className="settings-success">{jellyfinTestMessage}</span>}
              {jellyfinTestError && <span className="settings-error">{jellyfinTestError}</span>}
            </div>
          </section>

          <section className="settings-card">
            <h2>Library maintenance</h2>
            <p className="settings-hint">Kick off manual rescans. These run in the background.</p>

            <div className="settings-maintenance">
              <button type="button" className="setup-button" onClick={triggerScan} disabled={scanLoading}>
                {scanLoading ? 'Rescanning…' : 'Rescan Library'}
              </button>
              {scanMessage && <span className="settings-success">{scanMessage}</span>}
              {scanError && <span className="settings-error">{scanError}</span>}
            </div>

            <div className="settings-maintenance">
              <button
                type="button"
                className="setup-button"
                onClick={triggerJellyfinScan}
                disabled={jellyfinScanLoading || !jellyfinConfigured}
              >
                {jellyfinScanLoading ? 'Contacting Jellyfin…' : 'Rescan Jellyfin Library'}
              </button>
              {!jellyfinConfigured && (
                <span className="settings-hint">Add Jellyfin details above to enable this action.</span>
              )}
              {jellyfinScanMessage && <span className="settings-success">{jellyfinScanMessage}</span>}
              {jellyfinScanError && <span className="settings-error">{jellyfinScanError}</span>}
            </div>
          </section>

          <footer className="settings-actions">
            {saveError && <span className="settings-error">{saveError}</span>}
            {saveMessage && <span className="settings-success">{saveMessage}</span>}
            <button className="setup-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </footer>
        </form>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <AppHeader subtitle="&gt; manage pool roots, rescans, and Jellyfin glue.">
        <>
          <span className="tiny-pill">settings</span>
          <span className="header-hint">{headerHint}</span>
        </>
      </AppHeader>
      {pageBody}
    </div>
  )
}

export default SettingsPage
