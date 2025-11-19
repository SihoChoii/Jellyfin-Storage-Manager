import React, { useState } from 'react';
import { SettingsSection } from '../SettingsSection';
import { SettingsCard, SettingsFeedback } from '../primitives';
import { ThemePicker } from '../appearance';
import type { ThemeKey } from '../../../theme/types';

/**
 * Appearance settings section
 * Contains theme selection, visual preferences, and appearance options
 */
export const AppearanceSection: React.FC = () => {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleThemeChange = (newThemeKey: ThemeKey) => {
    setSaveMessage(`Theme changed to ${newThemeKey}`);
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <SettingsSection
      title="Appearance"
      description="Customize the look and feel of JellyMover"
    >
      <SettingsCard
        title="Theme Selection"
        description="Choose a theme that suits your style. Changes apply immediately."
      >
        <ThemePicker onChange={handleThemeChange} />
        <SettingsFeedback type="success" message={saveMessage} />
      </SettingsCard>

      <SettingsCard
        title="Visual Preferences"
        description="Fine-tune animations, effects, and other visual settings."
      >
        <div className="settings-placeholder">
          <p className="settings-placeholder-text">Visual settings coming soon</p>
          <ul className="settings-placeholder-list">
            <li>Animation speed</li>
            <li>Reduced motion option</li>
            <li>Glassmorphism effects</li>
            <li>Color contrast</li>
          </ul>
        </div>

        {/* Structure ready for visual preferences
        <SettingsField label="Animation Speed">
          <SettingsSelect
            options={[
              { value: 'fast', label: 'Fast' },
              { value: 'normal', label: 'Normal' },
              { value: 'slow', label: 'Slow' }
            ]}
          />
        </SettingsField>

        <SettingsField label="Reduced Motion">
          <SettingsSwitch checked={prefersReducedMotion} onChange={...} />
        </SettingsField>
        */}
      </SettingsCard>

      <SettingsCard
        title="Advanced Appearance"
        description="Additional customization options for power users."
        variant="placeholder"
      >
        <div className="settings-placeholder">
          <div className="settings-placeholder-icon">⚙️</div>
          <p className="settings-placeholder-text">Advanced appearance options coming soon</p>
          <ul className="settings-placeholder-list">
            <li>Custom CSS overrides</li>
            <li>Font selection</li>
            <li>Compact mode</li>
            <li>High contrast mode</li>
          </ul>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
};