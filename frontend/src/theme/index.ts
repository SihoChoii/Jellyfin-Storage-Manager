/**
 * Theme System - Barrel Export
 *
 * This module serves as the single entry point for the JellyMover theme system.
 * Import everything you need from this module instead of individual files.
 *
 * @example
 * // Types
 * import type { Theme, ThemeKey } from '@/theme'
 *
 * // Registry functions
 * import {
 *   getTheme,
 *   getThemeOrDefault,
 *   getDefaultTheme,
 *   getProductionThemes,
 *   isProductionTheme,
 *   DEFAULT_THEME_KEY
 * } from '@/theme'
 *
 * // Basic usage
 * const theme = getTheme('jelly')
 * const defaultTheme = getDefaultTheme()
 * const safeTheme = getThemeOrDefault('invalid') // Falls back to default
 *
 * // Filter production themes for UI
 * const productionThemes = getProductionThemes()
 * const isProduction = isProductionTheme('jelly') // true
 */

// =============================================================================
// Registry Exports
// =============================================================================

export {
  // Constants
  DEFAULT_THEME_KEY,
  // Registry
  themes,
  // Lookup functions
  getTheme,
  getThemeOrDefault,
  getDefaultTheme,
  getAvailableThemeKeys,
  getAvailableThemes,
  // Status and filtering functions
  isProductionTheme,
  getProductionThemes,
} from './registry'

// =============================================================================
// Context Exports
// =============================================================================

export {
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './context'

// =============================================================================
// Error Boundary Exports
// =============================================================================

export { ThemeErrorBoundary } from './ThemeErrorBoundary'

// =============================================================================
// Persistence Exports
// =============================================================================

export {
  // Constants
  THEME_STORAGE_KEY,
  // localStorage helpers
  getStoredTheme,
  setStoredTheme,
  clearStoredTheme,
  // Backend integration hooks (stubs)
  fetchUserThemePreference,
  saveUserThemePreference,
} from './persistence'

// =============================================================================
// CSS Variable Bridge Exports
// =============================================================================

export {
  applyThemeToCSSVariables,
  removeThemeCSSVariables,
  getCSSVariableValue,
} from './cssVariables'

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core types
  Theme,
  ThemeKey,
  ThemeRegistry,
  PartialTheme,
  ThemeOverride,
  // Color system
  ColorPalette,
  BackgroundColors,
  TextColors,
  AccentColors,
  SemanticColors,
  BorderColors,
  InteractionColors,
  Gradients,
  // Typography system
  Typography,
  FontFamilies,
  FontSizes,
  FontWeights,
  LetterSpacing,
  LineHeights,
  // Spacing & Layout
  Spacing,
  BorderRadius,
  // Effects
  Shadows,
  Transitions,
  TransitionDuration,
  TransitionEasing,
  Effects,
  BlurLevels,
  OpacityLevels,
  // Component tokens
  ComponentTokens,
  ButtonTokens,
  InputTokens,
  CardTokens,
  BadgeTokens,
  ChartTokens,
} from './types'

// Re-export type guard
export { isValidThemeKey } from './types'
