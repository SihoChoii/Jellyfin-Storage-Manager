import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { SettingsCard, SettingsHint } from '../primitives';

/**
 * General settings section placeholder
 * Will contain app preferences and default behaviors
 */
export const GeneralSection: React.FC = () => {
  return (
    <SettingsSection
      title="General"
      description="Configure application preferences and default behaviors"
    >
      <SettingsCard
        title="Application Preferences"
        description="General settings will be available here. Configure default behaviors, notifications, and other app-wide preferences."
        variant="placeholder"
      >
        <div className="settings-placeholder">
          <div className="settings-placeholder-icon">⚙️</div>
          <p className="settings-placeholder-text">General settings coming soon</p>
          <SettingsHint>
            This section will include options for:
          </SettingsHint>
          <ul className="settings-placeholder-list">
            <li>Default transfer behavior</li>
            <li>Notification preferences</li>
            <li>Auto-scan intervals</li>
            <li>Performance tuning</li>
            <li>Logging levels</li>
          </ul>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
};