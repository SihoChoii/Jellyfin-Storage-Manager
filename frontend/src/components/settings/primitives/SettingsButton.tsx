/**
 * SettingsButton - Themed button with variant support
 *
 * Provides consistent button styling across settings pages.
 * Supports primary (gradient), ghost (transparent), and danger variants.
 *
 * @example
 * <SettingsButton variant="primary" onClick={handleSave} loading={saving}>
 *   Save settings
 * </SettingsButton>
 */
import React from 'react';

export interface SettingsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: 'primary' | 'ghost' | 'danger';
  /** Loading state - disables button and shows loading text */
  loading?: boolean;
  /** Custom loading text (default: appends "..." to children) */
  loadingText?: string;
  /** Button content */
  children: React.ReactNode;
}

export const SettingsButton = React.forwardRef<HTMLButtonElement, SettingsButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      loadingText,
      children,
      disabled,
      className = '',
      ...rest
    },
    ref
  ) => {
    // Determine base class based on variant
    const baseClass = variant === 'ghost' ? 'settings-ghost-button' : 'setup-button';
    const variantClass = variant === 'danger' ? 'setup-button--danger' : '';
    const classes = `${baseClass} ${variantClass} ${className}`.trim();

    // Determine button text
    const buttonText = loading
      ? loadingText || (typeof children === 'string' ? `${children}...` : 'Loading...')
      : children;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {buttonText}
      </button>
    );
  }
);

SettingsButton.displayName = 'SettingsButton';