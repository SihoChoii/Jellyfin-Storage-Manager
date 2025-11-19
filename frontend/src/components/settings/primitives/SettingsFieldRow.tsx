/**
 * SettingsFieldRow - Horizontal layout for input + button combos
 *
 * Provides a flex container for horizontal field layouts.
 * First child (typically an input) expands to fill available space.
 *
 * @example
 * <SettingsFieldRow>
 *   <SettingsInput value={path} onChange={...} />
 *   <SettingsButton variant="ghost" onClick={openBrowser}>
 *     Browse
 *   </SettingsButton>
 * </SettingsFieldRow>
 */
import React from 'react';

export interface SettingsFieldRowProps {
  /** Input and button elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const SettingsFieldRow: React.FC<SettingsFieldRowProps> = ({
  children,
  className = ''
}) => {
  const classes = `settings-field-row ${className}`.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

SettingsFieldRow.displayName = 'SettingsFieldRow';