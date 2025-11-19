/**
 * SettingsFeedback - Success/error message display
 *
 * Conditionally renders feedback messages with appropriate styling.
 * Returns null if message is empty/null for clean DOM.
 *
 * @example
 * <SettingsFeedback type="success" message={saveMessage} />
 * <SettingsFeedback type="error" message={errorMessage} />
 */
import React from 'react';

export interface SettingsFeedbackProps {
  /** Type of feedback message */
  type: 'success' | 'error';
  /** Message to display (null/empty = no render) */
  message?: string | null;
  /** Additional CSS classes */
  className?: string;
}

export const SettingsFeedback: React.FC<SettingsFeedbackProps> = ({
  type,
  message,
  className = ''
}) => {
  // Don't render if no message
  if (!message) {
    return null;
  }

  const baseClass = type === 'success' ? 'settings-success' : 'settings-error';
  const classes = `${baseClass} ${className}`.trim();

  return (
    <span className={classes} role={type === 'error' ? 'alert' : 'status'}>
      {message}
    </span>
  );
};

SettingsFeedback.displayName = 'SettingsFeedback';