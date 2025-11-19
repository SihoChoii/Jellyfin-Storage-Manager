/**
 * SettingsTextarea - Themed textarea with consistent styling
 *
 * Provides a styled textarea that uses theme CSS variables.
 * Extends native HTML textarea attributes for full flexibility.
 *
 * @example
 * <SettingsTextarea
 *   id="library-paths"
 *   value={libraryPaths}
 *   onChange={(e) => setLibraryPaths(e.target.value)}
 *   rows={4}
 *   placeholder="/mnt/ssd/media\n/mnt/archive/tv"
 * />
 */
import React from 'react';

export interface SettingsTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Adds error border color */
  error?: boolean;
  /** Adds success border color */
  success?: boolean;
}

export const SettingsTextarea = React.forwardRef<HTMLTextAreaElement, SettingsTextareaProps>(
  ({ error = false, success = false, className = '', ...rest }, ref) => {
    const stateClass = error
      ? 'settings-textarea--error'
      : success
      ? 'settings-textarea--success'
      : '';
    const classes = `settings-textarea ${stateClass} ${className}`.trim();

    return (
      <textarea
        ref={ref}
        className={classes}
        {...rest}
      />
    );
  }
);

SettingsTextarea.displayName = 'SettingsTextarea';