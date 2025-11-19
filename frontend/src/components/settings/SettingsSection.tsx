import React from 'react';

interface SettingsSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for individual settings sections
 * Provides consistent layout with header and content area
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  id,
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <section id={id} className={`settings-section ${className}`}>
      <header className="settings-section-header">
        <h2 className="settings-section-title">{title}</h2>
        {description && (
          <p className="settings-section-description">{description}</p>
        )}
      </header>
      <div className="settings-section-body">
        {children}
      </div>
    </section>
  );
};