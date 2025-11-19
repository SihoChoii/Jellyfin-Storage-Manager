/**
 * SettingsPathPicker - Path browser component with disk info
 *
 * Provides a complete path selection UI with browse functionality.
 * Shows available mount points with disk space information.
 *
 * @example
 * <SettingsPathPicker
 *   value={hotRoot}
 *   onChange={(path) => setHotRoot(path)}
 *   label="Hot root path"
 *   hint="Path to your fast storage pool (SSD/NVMe)"
 * />
 */
import React, { useState, useCallback } from 'react';
import { apiGet } from '../../../api';
import type { PathEntry } from '../../../types';
import { SettingsField } from './SettingsField';
import { SettingsFieldRow } from './SettingsFieldRow';
import { SettingsInput } from './SettingsInput';
import { SettingsButton } from './SettingsButton';
import { SettingsSelect } from './SettingsSelect';
import { SettingsHint } from './SettingsHint';
import { SettingsFeedback } from './SettingsFeedback';

const PATH_BROWSE_ROOT = '/mnt';

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[exponent]}`;
};

export interface SettingsPathPickerProps {
  /** Current path value */
  value: string;
  /** Callback when path changes */
  onChange: (path: string) => void;
  /** Field label */
  label: string;
  /** Helper text */
  hint?: string;
  /** Field ID for label association */
  id?: string;
  /** Root path for browsing (default: /mnt) */
  rootPath?: string;
  /** Whether field is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const SettingsPathPicker: React.FC<SettingsPathPickerProps> = ({
  value,
  onChange,
  label,
  hint,
  id,
  rootPath = PATH_BROWSE_ROOT,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pathOptions, setPathOptions] = useState<PathEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPicker = useCallback(async () => {
    setIsOpen(true);
    setError(null);
    setLoading(true);
    try {
      const entries = await apiGet<PathEntry[]>(`/paths?root=${encodeURIComponent(rootPath)}`);
      setPathOptions(entries);
    } catch (err) {
      console.error('Failed to load directories', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load directories (${message}).`);
    } finally {
      setLoading(false);
    }
  }, [rootPath]);

  const handleSelection = (selectedPath: string) => {
    if (selectedPath) {
      onChange(selectedPath);
      setIsOpen(false);
      setPathOptions([]);
      setError(null);
    }
  };

  const closePicker = () => {
    setIsOpen(false);
    setPathOptions([]);
    setError(null);
  };

  return (
    <SettingsField
      label={label}
      htmlFor={id}
      hint={!isOpen ? hint : undefined}
      required={required}
      className={className}
    >
      <SettingsFieldRow>
        <SettingsInput
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g., ${rootPath}/ssd/media`}
        />
        <SettingsButton
          type="button"
          variant="ghost"
          onClick={openPicker}
        >
          Browse
        </SettingsButton>
      </SettingsFieldRow>

      {isOpen && (
        <div className="settings-path-picker">
          {loading && <SettingsHint>Loading directories…</SettingsHint>}

          <SettingsFeedback type="error" message={error} />

          {!loading && !error && (
            <SettingsSelect
              defaultValue=""
              onChange={(e) => handleSelection(e.target.value)}
            >
              <option value="">Select a path…</option>
              {pathOptions.map((path) => (
                <option key={path.full_path} value={path.full_path}>
                  {path.full_path} — {formatBytes(path.free_bytes)} free / {formatBytes(path.total_bytes)} total
                </option>
              ))}
            </SettingsSelect>
          )}

          <SettingsButton
            type="button"
            variant="ghost"
            onClick={closePicker}
          >
            Close
          </SettingsButton>
        </div>
      )}
    </SettingsField>
  );
};

SettingsPathPicker.displayName = 'SettingsPathPicker';