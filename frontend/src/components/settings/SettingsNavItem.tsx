import React from 'react';

interface SettingsNavItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Individual navigation item button for settings sidebar
 * Displays icon, label, and active state with theme-aware styling
 */
export const SettingsNavItem: React.FC<SettingsNavItemProps> = ({
  icon,
  label,
  description,
  active,
  onClick
}) => {
  return (
    <button
      className={`settings-nav-item ${active ? 'settings-nav-item--active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'true' : 'false'}
      title={description}
    >
      <span className="settings-nav-icon">{icon}</span>
      <span className="settings-nav-label">{label}</span>
      {active && <span className="settings-nav-active-indicator" aria-hidden="true" />}
    </button>
  );
};