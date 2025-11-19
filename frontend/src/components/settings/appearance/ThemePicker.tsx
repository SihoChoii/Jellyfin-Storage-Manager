/**
 * ThemePicker - Main container for theme selection UI
 *
 * Manages theme selection state and displays available themes.
 * Integrates with ThemeProvider for immediate theme switching.
 */
import React, { useCallback } from 'react';
import { useTheme } from '../../../theme/context';
import { ThemeCard } from './ThemeCard';
import type { ThemeKey } from '../../../theme/types';

export interface ThemePickerProps {
  /** Optional className for styling */
  className?: string;
  /** Callback when theme changes */
  onChange?: (themeKey: ThemeKey) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({
  className = '',
  onChange
}) => {
  const { productionThemes, themeKey, setThemeKey, theme, isDarkMode } = useTheme();

  const handleThemeSelect = useCallback((newThemeKey: ThemeKey) => {
    setThemeKey(newThemeKey);
    onChange?.(newThemeKey);
  }, [setThemeKey, onChange]);

  return (
    <div className={`theme-picker ${className}`.trim()}>
      <div className="theme-picker-grid">
        {productionThemes.map((themeMeta) => (
          <ThemeCard
            key={themeMeta.key}
            meta={themeMeta}
            theme={theme} // Pass the current theme for styling reference
            isActive={themeMeta.key === themeKey}
            onClick={() => handleThemeSelect(themeMeta.key)}
          />
        ))}
      </div>

      {/* Theme mode indicator */}
      <div className="theme-picker-info">
        <p className="theme-picker-info-text">
          Theme changes apply immediately across the entire application.
        </p>
        <div className="theme-picker-current">
          Current: <strong>{theme.meta.name || themeKey}</strong>
          <span className="theme-picker-mode">
            {isDarkMode ? '🌙 Dark' : '☀️ Light'}
          </span>
        </div>
      </div>
    </div>
  );
};

ThemePicker.displayName = 'ThemePicker';