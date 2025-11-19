/**
 * SettingsCard - Enhanced container for grouped settings
 *
 * Provides consistent card styling across settings sections with optional variants.
 * Supports title, description, and different visual styles.
 *
 * @example
 * <SettingsCard title="General Settings" description="Configure app preferences">
 *   <SettingsField ... />
 *   <SettingsField ... />
 * </SettingsCard>
 */
import React from 'react';

export interface SettingsCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Optional card heading (rendered as h3) */
  title?: string;
  /** Optional subtitle/hint text below title */
  description?: string;
  /** Visual variant of the card */
  variant?: 'default' | 'placeholder' | 'highlight';
  /** Additional CSS classes */
  className?: string;
  /** Semantic HTML element to use */
  as?: 'div' | 'section';
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  children,
  title,
  description,
  variant = 'default',
  className = '',
  as: Component = 'div'
}) => {
  const variantClass = variant !== 'default' ? `settings-card--${variant}` : '';
  const classes = `settings-card ${variantClass} ${className}`.trim();

  return (
    <Component className={classes}>
      {title && <h3>{title}</h3>}
      {description && <p className="settings-hint">{description}</p>}
      {children}
    </Component>
  );
};

SettingsCard.displayName = 'SettingsCard';