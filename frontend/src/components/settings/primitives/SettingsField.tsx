/**
 * SettingsField - Complete field layout with label, control, hint, and error
 *
 * Provides consistent field layout for form controls in settings sections.
 * Handles label association, helper text, and error messages.
 *
 * @example
 * <SettingsField label="API Key" htmlFor="api-key" hint="Your Jellyfin API key">
 *   <SettingsInput id="api-key" type="text" value={apiKey} onChange={...} />
 * </SettingsField>
 */
import React from 'react';

export interface SettingsFieldProps {
  /** Field label text */
  label: string;
  /** HTML for attribute to associate label with input */
  htmlFor?: string;
  /** Helper text displayed below the control */
  hint?: string;
  /** Error message (replaces hint when present) */
  error?: string;
  /** Adds required indicator (*) to label */
  required?: boolean;
  /** The form control (input, select, textarea, etc.) */
  children: React.ReactNode;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Additional CSS classes */
  className?: string;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  direction = 'vertical',
  className = ''
}) => {
  const directionClass = direction === 'horizontal' ? 'settings-field--horizontal' : '';
  const classes = `settings-field ${directionClass} ${className}`.trim();

  // Generate unique IDs for ARIA associations
  const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const describedBy = errorId || hintId;

  // Clone children to add aria-describedby if it's a valid React element
  const enhancedChildren = React.isValidElement(children) && describedBy
    ? React.cloneElement(children as React.ReactElement<any>, {
        'aria-describedby': describedBy,
        'aria-invalid': !!error
      })
    : children;

  return (
    <div className={classes}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="settings-field-required" aria-label="required"> *</span>}
      </label>
      {enhancedChildren}
      {error && (
        <span
          id={errorId}
          className="settings-error"
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && hint && (
        <span
          id={hintId}
          className="settings-hint"
        >
          {hint}
        </span>
      )}
    </div>
  );
};

SettingsField.displayName = 'SettingsField';