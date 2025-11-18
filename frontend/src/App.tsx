import { useEffect, useState } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { apiGet } from './api.ts'
import SetupWizard from './components/SetupWizard.tsx'
import JobsPage from './pages/JobsPage.tsx'
import LibraryPage from './pages/LibraryPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import type { AppConfig } from './types.ts'

const needsConfigSetup = (config: AppConfig | null) => {
  if (!config) return true
  const hotMissing = !config.hot_root.trim()
  const coldMissing = !config.cold_root.trim()
  return hotMissing || coldMissing
}

function AppLayout() {
  return (
    <div className="app-frame">
      <div className="bg-gradient" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <div className="app-shell">
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  const [configLoading, setConfigLoading] = useState(true)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadConfig = async () => {
      try {
        const data = await apiGet<AppConfig>('/config')
        if (cancelled) return
        setConfig(data)
        setNeedsSetup(needsConfigSetup(data))
      } catch (err) {
        if (cancelled) return
        // Treat failures as needing setup to keep user moving.
        setConfig(null)
        setNeedsSetup(true)
        console.error('Failed to load config', err)
      } finally {
        if (!cancelled) {
          setConfigLoading(false)
        }
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  if (configLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <p>Loading configuration…</p>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <SetupWizard
        initialConfig={config}
        onComplete={(newConfig) => {
          setConfig(newConfig)
          setNeedsSetup(false)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
