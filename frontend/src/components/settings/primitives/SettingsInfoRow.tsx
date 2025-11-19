/**
 * SettingsInfoRow - Label/value pair for read-only info display
 *
 * Displays information in a consistent label-value format.
 * Commonly used for version info, status displays, etc.
 *
 * @example
 * <SettingsInfoRow label="Version" value="1.0.0" />
 * <SettingsInfoRow label="Status" value={<span className="badge">Active</span>} />
 */
import React from 'react';

export interface SettingsInfoRowProps {
  /** Label text (left side) */
  label: string;
  /** Value content (right side) */
  value: string | React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const SettingsInfoRow: React.FC<SettingsInfoRowProps> = ({
  label,
  value,
  className = ''
}) => {
  const classes = `settings-info-row ${className}`.trim();

  return (
    <div className={classes}>
      <span className="settings-info-label">{label}</span>
      <span className="settings-info-value">{value}</span>
    </div>
  );
};

SettingsInfoRow.displayName = 'SettingsInfoRow';