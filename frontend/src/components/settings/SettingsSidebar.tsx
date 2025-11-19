import React from 'react';
import { SettingsNavItem } from './SettingsNavItem';
import {
  FiSettings,
  FiDroplet,
  FiFolder,
  FiTool,
  FiInfo
} from 'react-icons/fi';

export type SettingsSection = 'general' | 'appearance' | 'library' | 'advanced' | 'about';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const navItems: Array<{
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: 'general',
    label: 'General',
    icon: <FiSettings />,
    description: 'App preferences and defaults'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <FiDroplet />,
    description: 'Theme and visual customization'
  },
  {
    id: 'library',
    label: 'Library & Media',
    icon: <FiFolder />,
    description: 'Paths, pools, and Jellyfin'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <FiTool />,
    description: 'Performance and maintenance'
  },
  {
    id: 'about',
    label: 'About',
    icon: <FiInfo />,
    description: 'Version and system info'
  }
];

/**
 * Settings sidebar navigation component
 * Displays section navigation with icons and active state
 */
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <nav className="settings-nav" role="navigation" aria-label="Settings sections">
      <div className="settings-nav-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-nav-items">
        {navItems.map((item) => (
          <SettingsNavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            description={item.description}
            active={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>
    </nav>
  );
};