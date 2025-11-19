import React, { useState, useCallback, useEffect } from 'react';
import { SettingsSection } from '../SettingsSection';
import { apiGet, apiPost, apiPut } from '../../../api';
import type { AppConfig, JellyfinStatus, ScanStatus } from '../../../types';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsTextarea,
  SettingsButton,
  SettingsFeedback,
  SettingsHint,
  SettingsPathPicker,
  SettingsInfoRow
} from '../primitives';

interface LibrarySectionProps {
  onSave?: () => void;
}

interface SettingsFormState {
  hot_root: string;
  cold_root: string;
  libraryPathsText: string;
  jellyfin_url: string;
  jellyfin_api_key: string;
}

const defaultFormState: SettingsFormState = {
  hot_root: '',
  cold_root: '',
  libraryPathsText: '',
  jellyfin_url: '',
  jellyfin_api_key: '',
};

const formatScanTimestamp = (timestamp?: number | null) => {
  if (!timestamp) {
    return 'Never';
  }
  try {
    return new Date(timestamp * 1000).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

/**
 * Library & Media settings section
 * Contains paths, pools, Jellyfin integration, and library maintenance
 */
export const LibrarySection: React.FC<LibrarySectionProps> = ({ onSave }) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formState, setFormState] = useState<SettingsFormState>(defaultFormState);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scanStatusError, setScanStatusError] = useState<string | null>(null);

  const [jellyfinScanLoading, setJellyfinScanLoading] = useState(false);
  const [jellyfinScanMessage, setJellyfinScanMessage] = useState<string | null>(null);
  const [jellyfinScanError, setJellyfinScanError] = useState<string | null>(null);
  const [jellyfinScanStatus, setJellyfinScanStatus] = useState<ScanStatus | null>(null);
  const [jellyfinScanStatusError, setJellyfinScanStatusError] = useState<string | null>(null);

  const [jellyfinTestLoading, setJellyfinTestLoading] = useState(false);
  const [jellyfinTestMessage, setJellyfinTestMessage] = useState<string | null>(null);
  const [jellyfinTestError, setJellyfinTestError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const config = await apiGet<AppConfig>('/config');
      setFormState({
        hot_root: config.hot_root,
        cold_root: config.cold_root,
        libraryPathsText: config.library_paths.join('\n'),
        jellyfin_url: config.jellyfin.url,
        jellyfin_api_key: config.jellyfin.api_key,
      });
    } catch (err) {
      console.error('Failed to load configuration', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLoadError(`Failed to load configuration (${message}).`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const loadScanStatus = useCallback(async () => {
    try {
      const status = await apiGet<ScanStatus>('/scan/status');
      setScanStatus(status);
      setScanStatusError(null);
      return status;
    } catch (err) {
      console.error('Failed to load scan status', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setScanStatusError(`Failed to load scan status (${message}).`);
      return null;
    }
  }, []);

  const loadJellyfinScanStatus = useCallback(async () => {
    // Only try to load if we have some config
    if (!formState.jellyfin_url && !formState.jellyfin_api_key) {
      return null;
    }

    try {
      const status = await apiGet<ScanStatus>('/jellyfin/scan/status');
      setJellyfinScanStatus(status);
      setJellyfinScanStatusError(null);
      return status;
    } catch (err) {
      // Don't spam errors if just not configured yet
      if (!formState.jellyfin_url || !formState.jellyfin_api_key) {
        return null;
      }
      console.error('Failed to load Jellyfin scan status', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setJellyfinScanStatusError(`Failed to load Jellyfin scan status (${message}).`);
      return null;
    }
  }, [formState.jellyfin_url, formState.jellyfin_api_key]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) {
        return;
      }
      await Promise.all([
        loadScanStatus(),
        loadJellyfinScanStatus()
      ]);
    };

    poll();
    const interval = window.setInterval(poll, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadScanStatus, loadJellyfinScanStatus]);

  const handleInputChange = (field: keyof SettingsFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const hotRoot = formState.hot_root.trim();
    const coldRoot = formState.cold_root.trim();
    const jellyfinUrl = formState.jellyfin_url.trim();
    const jellyfinKey = formState.jellyfin_api_key.trim();
    const libraryPaths = formState.libraryPathsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: AppConfig = {
      hot_root: hotRoot,
      cold_root: coldRoot,
      library_paths: libraryPaths,
      jellyfin: {
        url: jellyfinUrl,
        api_key: jellyfinKey,
      },
    };

    try {
      await apiPut('/config', payload);
      setSaveMessage('Settings saved.');
      onSave?.();
    } catch (err) {
      console.error('Failed to save settings', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSaveError(`Failed to save settings. ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const triggerScan = async () => {
    setScanError(null);
    setScanMessage(null);
    setScanLoading(true);
    try {
      await apiPost('/scan');
      setScanMessage('Library rescan kicked off.');
      await loadScanStatus();
    } catch (err) {
      console.error('Failed to start scan', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setScanError(`Failed to start scan (${message}).`);
    } finally {
      setScanLoading(false);
    }
  };

  const triggerJellyfinScan = async () => {
    setJellyfinScanError(null);
    setJellyfinScanMessage(null);
    setJellyfinScanLoading(true);
    try {
      await apiPost('/jellyfin/rescan');
      setJellyfinScanMessage('Jellyfin rescan requested.');
      await loadJellyfinScanStatus();
    } catch (err) {
      console.error('Failed to trigger Jellyfin rescan', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setJellyfinScanError(`Failed to trigger Jellyfin rescan (${message}).`);
    } finally {
      setJellyfinScanLoading(false);
    }
  };

  const testJellyfinConnection = async () => {
    setJellyfinTestError(null);
    setJellyfinTestMessage(null);
    setJellyfinTestLoading(true);
    try {
      const status = await apiGet<JellyfinStatus>('/jellyfin/status');
      if (status.configured && status.server_reachable && status.auth_ok) {
        setJellyfinTestMessage('✓ Connection successful!');
      } else if (!status.configured) {
        setJellyfinTestError('Jellyfin is not configured.');
      } else if (!status.server_reachable) {
        setJellyfinTestError(status.message || 'Server not reachable.');
      } else if (!status.auth_ok) {
        setJellyfinTestError(status.message || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Failed to test Jellyfin connection', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setJellyfinTestError(`Connection test failed (${message}).`);
    } finally {
      setJellyfinTestLoading(false);
    }
  };

  const jellyfinConfigured = Boolean(formState.jellyfin_url.trim() || formState.jellyfin_api_key.trim());

  if (loading) {
    return (
      <SettingsSection title="Library & Media" description="Configure pools, paths, and Jellyfin integration">
        <SettingsCard>
          <SettingsHint>Loading configuration…</SettingsHint>
        </SettingsCard>
      </SettingsSection>
    );
  }

  if (loadError) {
    return (
      <SettingsSection title="Library & Media" description="Configure pools, paths, and Jellyfin integration">
        <SettingsCard>
          <SettingsFeedback type="error" message={loadError} />
          <SettingsButton type="button" variant="primary" onClick={loadConfig}>
            Retry
          </SettingsButton>
        </SettingsCard>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Library & Media" description="Configure pools, paths, and Jellyfin integration">
      <form className="settings-grid" onSubmit={handleSave}>
        <SettingsCard title="Paths & Pools" description="Configure where JellyMover can find your HOT and COLD pools.">
          <SettingsPathPicker
            id="hot-root"
            label="Hot root path"
            hint="Path to your fast storage pool (SSD/NVMe)"
            value={formState.hot_root}
            onChange={(value) => handleInputChange('hot_root', value)}
          />

          <SettingsPathPicker
            id="cold-root"
            label="Cold root path"
            hint="Path to your large capacity storage pool (HDD)"
            value={formState.cold_root}
            onChange={(value) => handleInputChange('cold_root', value)}
          />

          <SettingsField
            label="Library paths (one per line)"
            htmlFor="library-paths"
            hint="Paths to your media libraries that JellyMover should manage"
          >
            <SettingsTextarea
              id="library-paths"
              value={formState.libraryPathsText}
              onChange={(event) => handleInputChange('libraryPathsText', event.target.value)}
              rows={4}
              placeholder="/mnt/ssd/media\n/mnt/archive/tv"
            />
          </SettingsField>
        </SettingsCard>

        <SettingsCard title="Jellyfin Integration" description="Optional — provide your Jellyfin URL and API key to sync metadata.">
          <SettingsField
            label="Jellyfin URL"
            htmlFor="jellyfin-url"
            hint="The URL of your Jellyfin server"
          >
            <SettingsInput
              id="jellyfin-url"
              type="url"
              placeholder="https://jellyfin.local:8096"
              value={formState.jellyfin_url}
              onChange={(event) => handleInputChange('jellyfin_url', event.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Jellyfin API key"
            htmlFor="jellyfin-key"
            hint="Your Jellyfin API key for authentication"
          >
            <SettingsInput
              id="jellyfin-key"
              type="text"
              placeholder="Optional API key"
              value={formState.jellyfin_api_key}
              onChange={(event) => handleInputChange('jellyfin_api_key', event.target.value)}
            />
          </SettingsField>

          <div className="settings-maintenance">
            <SettingsButton
              type="button"
              variant="primary"
              onClick={testJellyfinConnection}
              disabled={!jellyfinConfigured}
              loading={jellyfinTestLoading}
              loadingText="Testing..."
            >
              Test Connection
            </SettingsButton>
            {!jellyfinConfigured && (
              <SettingsHint>Add Jellyfin details above to test connection.</SettingsHint>
            )}
            <SettingsFeedback type="success" message={jellyfinTestMessage} />
            <SettingsFeedback type="error" message={jellyfinTestError} />
          </div>
        </SettingsCard>

        <SettingsCard title="Library Maintenance" description="Kick off manual rescans. These run in the background.">
          <div className="settings-maintenance">
            <SettingsButton
              type="button"
              variant="primary"
              onClick={triggerScan}
              loading={scanLoading}
              loadingText="Rescanning..."
            >
              Rescan Library
            </SettingsButton>
            <div className="settings-info-stack">
              <SettingsInfoRow
                label="Scan status"
                value={scanStatus ? (
                  <span className={`scan-status-badge scan-status-badge--${scanStatus.state.toLowerCase()}`}>
                    <span className="scan-status-dot" aria-hidden="true" />
                    {scanStatus.state}
                  </span>
                ) : 'Loading…'}
              />
              <SettingsInfoRow
                label="Last started"
                value={formatScanTimestamp(scanStatus?.last_started)}
              />
              <SettingsInfoRow
                label="Last finished"
                value={formatScanTimestamp(scanStatus?.last_finished)}
              />
            </div>
            <SettingsFeedback type="success" message={scanMessage} />
            <SettingsFeedback type="error" message={scanError} />
            <SettingsFeedback type="error" message={scanStatusError} />
            {scanStatus?.last_error && (
              <SettingsFeedback type="error" message={`Last scan error: ${scanStatus.last_error}`} />
            )}
          </div>

          <div className="settings-maintenance">
            <SettingsButton
              type="button"
              variant="primary"
              onClick={triggerJellyfinScan}
              disabled={!jellyfinConfigured}
              loading={jellyfinScanLoading}
              loadingText="Contacting Jellyfin..."
            >
              Rescan Jellyfin Library
            </SettingsButton>
            <div className="settings-info-stack">
              <SettingsInfoRow
                label="Scan status"
                value={jellyfinScanStatus ? (
                  <span className={`scan-status-badge scan-status-badge--${jellyfinScanStatus.state.toLowerCase()}`}>
                    <span className="scan-status-dot" aria-hidden="true" />
                    {jellyfinScanStatus.state}
                  </span>
                ) : 'Loading…'}
              />
              <SettingsInfoRow
                label="Last started"
                value={formatScanTimestamp(jellyfinScanStatus?.last_started)}
              />
              <SettingsInfoRow
                label="Last finished"
                value={formatScanTimestamp(jellyfinScanStatus?.last_finished)}
              />
            </div>
            {!jellyfinConfigured && (
              <SettingsHint>Add Jellyfin details above to enable this action.</SettingsHint>
            )}
            <SettingsFeedback type="success" message={jellyfinScanMessage} />
            <SettingsFeedback type="error" message={jellyfinScanError} />
            <SettingsFeedback type="error" message={jellyfinScanStatusError} />
            {jellyfinScanStatus?.last_error && (
              <SettingsFeedback type="error" message={`Last scan error: ${jellyfinScanStatus.last_error}`} />
            )}
          </div>
        </SettingsCard>

        <footer className="settings-actions">
          <SettingsFeedback type="error" message={saveError} />
          <SettingsFeedback type="success" message={saveMessage} />
          <SettingsButton
            type="submit"
            variant="primary"
            loading={saving}
            loadingText="Saving..."
          >
            Save settings
          </SettingsButton>
        </footer>
      </form>
    </SettingsSection>
  );
};
