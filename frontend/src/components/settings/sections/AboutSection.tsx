import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { SettingsCard, SettingsInfoRow, SettingsHint } from '../primitives';

/**
 * About settings section
 * Contains version info, credits, and system information
 */
export const AboutSection: React.FC = () => {
  // These would normally come from the backend or build metadata
  const version = '1.0.0';
  const buildDate = new Date().toLocaleDateString();

  return (
    <SettingsSection
      title="About"
      description="Version information and system details"
    >
      <SettingsCard
        title="JellyMover"
        description="Intelligent media library management for Jellyfin"
      >
        <div className="settings-info-grid">
          <SettingsInfoRow label="Version" value={version} />
          <SettingsInfoRow label="Build Date" value={buildDate} />
          <SettingsInfoRow label="Theme Engine" value="v2.0" />
        </div>

        <div className="settings-placeholder">
          <div className="settings-placeholder-icon">ℹ️</div>
          <p className="settings-placeholder-text">Full system info coming soon</p>
          <ul className="settings-placeholder-list">
            <li>Backend version and status</li>
            <li>Database statistics</li>
            <li>Storage pool health</li>
            <li>System resources</li>
            <li>Update checker</li>
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Credits"
        description="JellyMover is an open-source project designed to optimize media storage for Jellyfin servers, providing intelligent hot/cold pool management."
      >
        <div className="settings-placeholder">
          <p className="settings-placeholder-text">
            Created with React, TypeScript, and Rust
          </p>
          <SettingsHint>
            Special thanks to the Jellyfin community
          </SettingsHint>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
};