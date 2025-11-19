import React from 'react';

interface SettingsLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Two-pane layout wrapper for the Settings Hub
 * Provides responsive grid layout with sidebar navigation and content area
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ sidebar, content }) => {
  return (
    <div className="settings-hub">
      <aside className="settings-sidebar">
        {sidebar}
      </aside>
      <main className="settings-content">
        {content}
      </main>
    </div>
  );
};