/**
 * SettingsInput - Themed text input with consistent styling
 *
 * Provides a styled text input that uses theme CSS variables.
 * Extends native HTML input attributes for full flexibility.
 *
 * @example
 * <SettingsInput
 *   id="api-key"
 *   type="text"
 *   value={apiKey}
 *   onChange={(e) => setApiKey(e.target.value)}
 *   placeholder="Enter API key"
 * />
 */
import React from 'react';

export interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Adds error border color */
  error?: boolean;
  /** Adds success border color */
  success?: boolean;
}

export const SettingsInput = React.forwardRef<HTMLInputElement, SettingsInputProps>(
  ({ error = false, success = false, className = '', ...rest }, ref) => {
    const stateClass = error
      ? 'settings-input--error'
      : success
      ? 'settings-input--success'
      : '';
    const classes = `settings-input ${stateClass} ${className}`.trim();

    return (
      <input
        ref={ref}
        className={classes}
        {...rest}
      />
    );
  }
);

SettingsInput.displayName = 'SettingsInput';