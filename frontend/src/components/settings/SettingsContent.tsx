import React from 'react';
import type { SettingsSection as SectionType } from './SettingsSidebar';

// Import section components
import { GeneralSection } from './sections/GeneralSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { LibrarySection } from './sections/LibrarySection';
import { AdvancedSection } from './sections/AdvancedSection';
import { AboutSection } from './sections/AboutSection';

interface SettingsContentProps {
  activeSection: SectionType;
  onSave?: () => void;
}

/**
 * Settings content area that displays the active section
 * Handles section switching with smooth transitions
 */
export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeSection,
  onSave
}) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'library':
        return <LibrarySection onSave={onSave} />;
      case 'advanced':
        return <AdvancedSection />;
      case 'about':
        return <AboutSection />;
      default:
        return <GeneralSection />;
    }
  };

  return (
    <div className="settings-content-area">
      <div className="settings-section-container" key={activeSection}>
        {renderSection()}
      </div>
    </div>
  );
};