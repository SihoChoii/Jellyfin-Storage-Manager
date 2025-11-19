/**
 * SettingsHint - Helper/hint text with consistent styling
 *
 * Provides styled helper text for additional context.
 * Uses muted text color and smaller font size.
 *
 * @example
 * <SettingsHint>
 *   Optional — provide your Jellyfin URL and API key to sync metadata.
 * </SettingsHint>
 */
import React from 'react';

export interface SettingsHintProps {
  /** Hint text content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const SettingsHint: React.FC<SettingsHintProps> = ({
  children,
  className = ''
}) => {
  const classes = `settings-hint ${className}`.trim();

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

SettingsHint.displayName = 'SettingsHint';