/**
 * SettingsSelect - Themed dropdown/select with consistent styling
 *
 * Provides a styled select element that uses theme CSS variables.
 * Can render options from an array or accept children for full control.
 *
 * @example
 * <SettingsSelect
 *   id="theme"
 *   value={selectedTheme}
 *   onChange={(e) => setSelectedTheme(e.target.value)}
 *   options={[
 *     { value: 'jelly', label: 'Jelly (Default)' },
 *     { value: 'light', label: 'Light' },
 *     { value: 'dark', label: 'Dark' }
 *   ]}
 * />
 */
import React from 'react';

export interface SettingsSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SettingsSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Adds error border color */
  error?: boolean;
  /** Adds success border color */
  success?: boolean;
  /** Options array for convenience */
  options?: SettingsSelectOption[];
  /** Custom option elements (alternative to options prop) */
  children?: React.ReactNode;
}

export const SettingsSelect = React.forwardRef<HTMLSelectElement, SettingsSelectProps>(
  ({ error = false, success = false, options, children, className = '', ...rest }, ref) => {
    const stateClass = error
      ? 'settings-select--error'
      : success
      ? 'settings-select--success'
      : '';
    const classes = `settings-select ${stateClass} ${className}`.trim();

    return (
      <select
        ref={ref}
        className={classes}
        {...rest}
      >
        {options
          ? options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

SettingsSelect.displayName = 'SettingsSelect';