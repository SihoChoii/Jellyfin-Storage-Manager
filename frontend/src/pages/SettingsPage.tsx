import React, { useState } from 'react';
import AppHeader from '../components/AppHeader';
import { SettingsLayout } from '../components/settings/SettingsLayout';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import type { SettingsSection as SectionType } from '../components/settings/SettingsSidebar';
import { SettingsContent } from '../components/settings/SettingsContent';

/**
 * Settings Page - Phase 5.1
 * Modern, multi-section settings hub with two-pane layout
 * Features categorized navigation and theme-aware styling
 */
const SettingsPage: React.FC = () => {
  // Track active settings section
  const [activeSection, setActiveSection] = useState<SectionType>('library');

  // Handle save callback from sections
  const handleSave = () => {
    // This could trigger a global notification or other actions
    console.log('Settings saved');
  };

  // Section metadata for header
  const getSectionMeta = () => {
    switch (activeSection) {
      case 'general':
        return { title: 'General', hint: 'configure app preferences' };
      case 'appearance':
        return { title: 'Appearance', hint: 'customize the look and feel' };
      case 'library':
        return { title: 'Library & Media', hint: 'manage pools and Jellyfin' };
      case 'advanced':
        return { title: 'Advanced', hint: 'performance and maintenance' };
      case 'about':
        return { title: 'About', hint: 'version and system info' };
      default:
        return { title: 'Settings', hint: 'configure JellyMover' };
    }
  };

  const sectionMeta = getSectionMeta();

  return (
    <div className="page-stack">
      <AppHeader subtitle="&gt; modern settings hub for complete control.">
        <>
          <span className="tiny-pill">settings</span>
          <span className="tiny-pill">{sectionMeta.title.toLowerCase()}</span>
          <span className="header-hint">{sectionMeta.hint}</span>
        </>
      </AppHeader>

      <SettingsLayout
        sidebar={
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        }
        content={
          <SettingsContent
            activeSection={activeSection}
            onSave={handleSave}
          />
        }
      />
    </div>
  );
};

export default SettingsPage;