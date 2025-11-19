/**
 * ThemePreview - Visual color swatch preview for themes
 *
 * Displays the signature colors of a theme as interactive swatches.
 * Provides a quick visual identity for each theme option.
 */
import React from 'react';
import type { Theme } from '../../../theme/types';

export interface ThemePreviewProps {
  /** Theme colors to display */
  colors: Theme['colors'];
  /** Optional size variant */
  size?: 'small' | 'medium' | 'large';
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  colors,
  size = 'medium'
}) => {
  // Extract key colors for preview
  const swatches = [
    {
      color: colors.accent.hot,
      title: 'Hot Accent',
      label: 'HOT'
    },
    {
      color: colors.accent.cold,
      title: 'Cold Accent',
      label: 'COLD'
    },
    {
      color: colors.accent.primary,
      title: 'Primary Accent',
      label: 'PRIMARY'
    }
  ];

  return (
    <div className={`theme-preview theme-preview--${size}`}>
      {swatches.map((swatch, index) => (
        <div
          key={index}
          className="theme-preview-swatch"
          style={{ backgroundColor: swatch.color }}
          title={swatch.title}
          aria-label={swatch.title}
        >
          <span className="theme-preview-swatch-label">
            {swatch.label}
          </span>
        </div>
      ))}
    </div>
  );
};

ThemePreview.displayName = 'ThemePreview';