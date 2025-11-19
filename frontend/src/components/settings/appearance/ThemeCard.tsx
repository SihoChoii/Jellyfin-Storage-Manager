/**
 * ThemeCard - Individual theme selection card
 *
 * Displays a theme option with preview, metadata, and selection state.
 * Handles theme switching on click with visual feedback.
 */
import React from 'react';
import type { Theme } from '../../../theme/types';
import { ThemePreview } from './ThemePreview';

export interface ThemeCardProps {
  /** Theme metadata */
  meta: Theme['meta'];
  /** Full theme object for color preview */
  theme: Theme;
  /** Whether this theme is currently active */
  isActive: boolean;
  /** Handler for theme selection */
  onClick: () => void;
}

const ThemeCardComponent: React.FC<ThemeCardProps> = ({
  meta,
  theme,
  isActive,
  onClick
}) => {
  // Handle keyboard activation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`theme-card ${isActive ? 'theme-card--active' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-pressed={isActive}
      aria-label={`Select ${meta.name} theme`}
      tabIndex={0}
    >
      {/* Color preview swatches */}
      <ThemePreview colors={theme.colors} />

      {/* Theme information */}
      <div className="theme-card-content">
        {/* Header with name and badges */}
        <div className="theme-card-header">
          <h4 className="theme-card-name">{meta.name}</h4>
          <div className="theme-card-badges">
            {isActive && (
              <span className="theme-badge theme-badge--active">
                ✓ Active
              </span>
            )}
            <span className={`theme-badge theme-badge--${meta.isDark ? 'dark' : 'light'}`}>
              {meta.isDark ? '🌙' : '☀️'}
            </span>
          </div>
        </div>

        {/* Description */}
        {meta.description && (
          <p className="theme-card-description">
            {meta.description}
          </p>
        )}

        {/* Tagline (e.g., "FIRE ∧ ICE", "PRO MODE") */}
        {meta.logoTagline && (
          <div className="theme-card-tagline">
            {meta.logoTagline}
          </div>
        )}
      </div>

      {/* Active indicator checkmark */}
      {isActive && (
        <div className="theme-card-active-indicator" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
              d="M17 8L10 15L7 12"
              stroke="var(--text-inverted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Memoized ThemeCard component
 * Only re-renders when theme key or active state changes
 * Prevents unnecessary re-renders during theme switches
 */
export const ThemeCard = React.memo(ThemeCardComponent, (prevProps, nextProps) => {
  // Only re-render if:
  // - Theme key changed (meta.key is the unique identifier)
  // - Active state changed
  // - onClick handler reference changed (unlikely but possible)
  return (
    prevProps.meta.key === nextProps.meta.key &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onClick === nextProps.onClick
  );
});

ThemeCard.displayName = 'ThemeCard';