/**
 * Theme Registry
 *
 * Central registry for all available themes in JellyMover.
 * Provides type-safe access to themes with fallback mechanisms.
 *
 * Usage:
 *   import { getTheme, DEFAULT_THEME_KEY } from '@/theme'
 *   const theme = getTheme('jelly')
 *   const defaultTheme = getThemeOrDefault()
 */

import type {
  Theme,
  ThemeKey,
  ThemeRegistry,
  ColorPalette,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Transitions,
  Effects,
  ComponentTokens,
} from './types'
import { isValidThemeKey } from './types'
import { jellyTheme } from './themes/jelly'
import { lightTheme } from './themes/light'
import { darkTheme } from './themes/dark'

// =============================================================================
// Placeholder Theme Factory
// =============================================================================

/**
 * Creates a placeholder theme with sensible neutral defaults.
 * These themes are structurally complete and fully functional.
 * FUTURE ENHANCEMENT: Replace with brand-specific custom implementations when designs are ready.
 *
 * Placeholder themes use generic color schemes but satisfy the complete Theme interface.
 * They can be safely used for development, testing, and theme switching infrastructure.
 *
 * @param key - Theme identifier
 * @param name - Human-readable theme name
 * @param isDark - Whether this is a dark theme
 * @param description - Optional description for the theme
 * @returns Complete Theme object with placeholder values
 */
function createPlaceholderTheme(
  key: ThemeKey,
  name: string,
  isDark: boolean,
  description?: string
): Theme {
  // FUTURE ENHANCEMENT: Replace these generic values with brand-specific designs
  const baseBackground = isDark ? '#0a0a0a' : '#ffffff'
  const baseForeground = isDark ? '#ffffff' : '#0a0a0a'
  const subtleBackground = isDark ? '#1a1a1a' : '#f5f5f5'
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  const colors: ColorPalette = {
    background: {
      main: baseBackground,
      panel: subtleBackground,
      overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      secondary: isDark ? '#252525' : '#eeeeee',
      tertiary: isDark ? '#303030' : '#e5e5e5',
    },
    text: {
      primary: baseForeground,
      secondary: isDark ? '#a0a0a0' : '#606060',
      tertiary: isDark ? '#707070' : '#909090',
      disabled: isDark ? '#505050' : '#c0c0c0',
      inverted: isDark ? '#0a0a0a' : '#ffffff',
    },
    accent: {
      hot: '#ff6b3d',
      hotSoft: 'rgba(255, 107, 61, 0.28)',
      cold: '#3dd5ff',
      coldSoft: 'rgba(61, 213, 255, 0.28)',
      primary: isDark ? '#4a90e2' : '#2563eb',
      secondary: '#8b5cf6',
      magenta: '#ec4899',
    },
    semantic: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    border: {
      white06: borderColor,
      white08: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      white12: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      white14: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.14)',
      white16: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)',
      white18: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)',
      white22: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)',
      white25: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
      white45: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
    },
    interaction: {
      hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      active: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
      focus: '#4a90e2',
      selected: isDark ? 'rgba(74, 144, 226, 0.2)' : 'rgba(37, 99, 235, 0.15)',
      disabled: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3dd5ff 0%, #ff6b3d 100%)',
      secondary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      panel: {
        base: isDark
          ? 'radial-gradient(circle at 50% 0%, rgba(61, 213, 255, 0.15) 0%, transparent 50%)'
          : 'radial-gradient(circle at 50% 0%, rgba(61, 213, 255, 0.1) 0%, transparent 50%)',
      },
      button: {
        hot: 'linear-gradient(135deg, #ff6b3d 0%, #ff8c5d 100%)',
        cold: 'linear-gradient(135deg, #3dd5ff 0%, #5de0ff 100%)',
        primary: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
      },
    },
  }

  const typography: Typography = {
    fontFamily: {
      ui: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      display: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    fontSize: {
      xs: '0.625rem',
      sm: '0.75rem',
      base: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '0.02em',
      normal: '0.08em',
      wide: '0.14em',
      wider: '0.18em',
      widest: '0.28em',
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    textTransform: {
      none: 'none',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
  }

  const spacing: Spacing = {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  }

  const radius: BorderRadius = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  }

  const shadows: Shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  }

  const transitions: Transitions = {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      custom: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  }

  const effects: Effects = {
    blur: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '20px',
    },
    opacity: {
      0: '0',
      5: '0.05',
      10: '0.1',
      20: '0.2',
      30: '0.3',
      40: '0.4',
      50: '0.5',
      60: '0.6',
      70: '0.7',
      80: '0.8',
      90: '0.9',
      95: '0.95',
      100: '1',
    },
    backdropFilter: {
      none: 'none',
      glassLight: 'blur(8px)',
      glassMedium: 'blur(18px) saturate(130%)',
      glassHeavy: 'blur(24px) saturate(150%)',
    },
    blendMode: {
      normal: 'normal',
      screen: 'screen',
      softLight: 'soft-light',
      multiply: 'multiply',
      overlay: 'overlay',
    },
    saturation: {
      default: '100%',
      enhanced: '130%',
      high: '150%',
    },
  }

  const components: ComponentTokens = {
    button: {
      primary: {
        background: colors.accent.primary,
        backgroundHover: isDark ? '#5aa0f2' : '#1d4ed8',
        backgroundActive: isDark ? '#6ab0ff' : '#1e40af',
        text: '#ffffff',
        border: 'transparent',
      },
      secondary: {
        background: isDark ? '#2a2a2a' : '#e5e7eb',
        backgroundHover: isDark ? '#3a3a3a' : '#d1d5db',
        backgroundActive: isDark ? '#4a4a4a' : '#c0c4cc',
        text: baseForeground,
        border: borderColor,
      },
      ghost: {
        background: 'transparent',
        backgroundHover: colors.interaction.hover,
        backgroundActive: colors.interaction.active,
        text: baseForeground,
        border: borderColor,
      },
      hot: {
        background: colors.accent.hot,
        backgroundHover: '#ff7d4d',
        backgroundActive: '#ff8f5d',
        text: '#ffffff',
        border: 'transparent',
      },
      cold: {
        background: colors.accent.cold,
        backgroundHover: '#4dddff',
        backgroundActive: '#5de5ff',
        text: '#0a0a0a',
        border: 'transparent',
      },
      danger: {
        background: colors.semantic.error,
        backgroundHover: '#f87171',
        backgroundActive: '#f59e9e',
        text: '#ffffff',
        border: 'transparent',
      },
    },
    input: {
      background: isDark ? '#1a1a1a' : '#ffffff',
      backgroundHover: isDark ? '#202020' : '#f9f9f9',
      backgroundFocus: isDark ? '#252525' : '#ffffff',
      text: baseForeground,
      placeholder: isDark ? '#606060' : '#a0a0a0',
      border: borderColor,
      borderHover: isDark
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.2)',
      borderFocus: colors.accent.primary,
      borderError: colors.semantic.error,
      borderSuccess: colors.semantic.success,
    },
    card: {
      background: subtleBackground,
      backgroundHover: isDark ? '#202020' : '#eeeeee',
      border: borderColor,
      shadow: shadows.md,
    },
    badge: {
      default: {
        background: isDark ? '#2a2a2a' : '#e5e7eb',
        text: baseForeground,
        border: borderColor,
      },
      hot: {
        background: colors.accent.hotSoft,
        text: colors.accent.hot,
        border: colors.accent.hot,
      },
      cold: {
        background: colors.accent.coldSoft,
        text: colors.accent.cold,
        border: colors.accent.cold,
      },
      success: {
        background: isDark
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(16, 185, 129, 0.1)',
        text: colors.semantic.success,
        border: colors.semantic.success,
      },
      error: {
        background: isDark
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(239, 68, 68, 0.1)',
        text: colors.semantic.error,
        border: colors.semantic.error,
      },
      warning: {
        background: isDark
          ? 'rgba(245, 158, 11, 0.2)'
          : 'rgba(245, 158, 11, 0.1)',
        text: colors.semantic.warning,
        border: colors.semantic.warning,
      },
      info: {
        background: isDark
          ? 'rgba(59, 130, 246, 0.2)'
          : 'rgba(59, 130, 246, 0.1)',
        text: colors.semantic.info,
        border: colors.semantic.info,
      },
    },
    chart: {
      semantic: {
        cpu: '#f97316',
        memory: '#06b6d4',
        running: '#10b981',
        queued: '#3b82f6',
        completed: '#06b6d4',
        failed: '#ef4444',
        transferSpeed: '#10b981',
        poolUsed: '#f97316',
        poolFree: '#06b6d4',
      },
      series: [
        '#f97316', // Orange (CPU, pool used)
        '#06b6d4', // Cyan (Memory, pool free)
        '#10b981', // Green (Running, transfer speed)
        '#3b82f6', // Blue (Queued)
        '#ef4444', // Red (Failed)
        '#8b5cf6', // Purple
        '#ec4899', // Pink
      ],
      grid: isDark ? '#333333' : '#e5e5e5',
      axis: isDark ? '#666666' : '#a0a0a0',
      tooltip: {
        background: isDark ? '#1a1a1a' : '#ffffff',
        text: baseForeground,
        border: borderColor,
      },
    },
    progressBar: {
      background: 'rgba(255, 255, 255, 0.08)',
      fill: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
      height: '4px',
    },
    searchInput: {
      background: isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      border: borderColor,
      iconOpacity: '0.6',
    },
    navigationLink: {
      background: 'transparent',
      backgroundHover: colors.interaction.hover,
      backgroundActive: colors.interaction.selected,
      border: borderColor,
      borderActive: colors.accent.primary,
      text: colors.text.secondary,
      textActive: colors.text.primary,
    },
    mediaThumb: {
      borderGradient: 'conic-gradient(from 200deg, #3dd5ff, #ff6b3d, #3dd5ff)',
      innerBackground: 'rgba(0, 0, 0, 0.35)',
      shadow: shadows.lg,
    },
    scrollbar: {
      track: 'transparent',
      thumb: colors.accent.primary,
      width: '8px',
    },
    panel: {
      base: {
        background: subtleBackground,
        border: borderColor,
        shadow: shadows.md,
      },
      statsMini: {
        background: subtleBackground,
        border: borderColor,
      },
      statsCard: {
        background: subtleBackground,
        border: borderColor,
        shadow: shadows.lg,
      },
    },
  }

  const animations = {
    bgDrift: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      duration: '28s',
      timing: 'ease-in-out',
      iteration: 'infinite',
    },
    shineSweep: {
      keyframes: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      duration: '6s',
      timing: 'ease-in-out',
      iteration: 'infinite',
    },
    screenIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      duration: '0.35s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
    },
    cardIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(8px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      duration: '0.32s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
    },
    progressShift: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '100% 50%' },
      },
      duration: '1.4s',
      timing: 'linear',
      iteration: 'infinite',
    },
    statFlow: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '100% 50%' },
      },
      duration: '1.6s',
      timing: 'linear',
      iteration: 'infinite',
    },
    staggerDelay: '40ms',
  }

  return {
    meta: {
      key,
      name,
      description: description
        ? `${description} (placeholder implementation)`
        : `${name} theme (placeholder implementation)`,
      isDark,
    },
    colors,
    typography,
    spacing,
    radius,
    shadows,
    transitions,
    effects,
    animations,
    components,
  }
}

// =============================================================================
// Theme Registry
// =============================================================================

/**
 * Default theme key used when no theme is specified
 */
export const DEFAULT_THEME_KEY: ThemeKey = 'jelly'

/**
 * Central theme registry containing all available themes.
 * Each theme is a complete Theme object satisfying the type contract.
 *
 * Production Themes (fully implemented with brand-specific designs):
 * - jelly: Default dark theme with cyberpunk CLI aesthetic and glassmorphism
 * - light: Professional light mode for bright environments
 * - dark: Minimal high-contrast dark mode ("PRO MODE")
 *
 * Placeholder Themes (structurally complete, generic implementations):
 * - nord: Nordic blue/cyan inspired theme
 * - dracula: Purple/pink dark theme
 * - minimal: Minimal light theme with reduced visual effects
 * - highContrast: High contrast dark theme for accessibility
 *
 * Placeholder themes use sensible defaults and can be safely used for development.
 * Replace with custom implementations when brand-specific designs are ready.
 */
export const themes: ThemeRegistry = {
  jelly: jellyTheme,
  light: lightTheme,
  dark: darkTheme,
  nord: createPlaceholderTheme(
    'nord',
    'Nord',
    true,
    'Nordic blue/cyan inspired theme'
  ),
  dracula: createPlaceholderTheme(
    'dracula',
    'Dracula',
    true,
    'Purple/pink dark theme'
  ),
  minimal: createPlaceholderTheme(
    'minimal',
    'Minimal',
    false,
    'Minimal light theme with reduced visual effects'
  ),
  highContrast: createPlaceholderTheme(
    'highContrast',
    'High Contrast',
    true,
    'High contrast dark theme for accessibility'
  ),
} satisfies ThemeRegistry

// =============================================================================
// Theme Lookup Functions
// =============================================================================

/**
 * Get a theme by its key with type safety.
 * Throws an error if the theme key is invalid.
 *
 * @param key - Theme identifier
 * @returns Theme object
 * @throws Error if theme key is invalid
 *
 * @example
 * const jellyTheme = getTheme('jelly')
 */
export function getTheme(key: ThemeKey): Theme {
  if (!isValidThemeKey(key)) {
    throw new Error(
      `Invalid theme key: "${key}". Valid keys are: ${getAvailableThemeKeys().join(', ')}`
    )
  }
  return themes[key]
}

/**
 * Get a theme by its key, falling back to the default theme if:
 * - No key is provided
 * - The provided key is invalid
 *
 * This is the safest way to get a theme and is recommended for most use cases.
 *
 * @param key - Optional theme identifier
 * @returns Theme object (default theme if key is invalid/missing)
 *
 * @example
 * const theme = getThemeOrDefault() // Returns default (jelly)
 * const theme = getThemeOrDefault('light') // Returns light theme
 * const theme = getThemeOrDefault('invalid') // Returns default (jelly)
 */
export function getThemeOrDefault(key?: ThemeKey | string): Theme {
  if (!key || !isValidThemeKey(key)) {
    return themes[DEFAULT_THEME_KEY]
  }
  return themes[key]
}

/**
 * Get an array of all available theme keys.
 * Useful for building theme selectors or validation.
 *
 * @returns Array of valid theme keys
 *
 * @example
 * const keys = getAvailableThemeKeys()
 * // ['jelly', 'light', 'dark', 'nord', 'dracula', 'minimal', 'highContrast']
 */
export function getAvailableThemeKeys(): ThemeKey[] {
  return Object.keys(themes) as ThemeKey[]
}

/**
 * Get metadata for all available themes.
 * Useful for building theme selection UI.
 *
 * @returns Array of theme metadata objects
 *
 * @example
 * const themeMeta = getAvailableThemes()
 * // [{ key: 'jelly', name: 'Jelly', isDark: true }, ...]
 */
export function getAvailableThemes(): Array<Theme['meta']> {
  return getAvailableThemeKeys().map((key) => themes[key].meta)
}

// =============================================================================
// Theme Status and Filtering Functions
// =============================================================================

/**
 * Check if a theme is fully implemented (production-ready) or a placeholder.
 * Useful for filtering themes in UI or showing implementation status badges.
 *
 * Production themes have brand-specific, fully designed implementations.
 * Placeholder themes use generic defaults but are structurally complete.
 *
 * @param key - Theme identifier to check
 * @returns true if production-ready, false if placeholder
 *
 * @example
 * isProductionTheme('jelly') // true
 * isProductionTheme('nord') // false (placeholder)
 *
 * // Filter to show only production themes in UI
 * const productionThemes = getAvailableThemeKeys().filter(isProductionTheme)
 */
export function isProductionTheme(key: ThemeKey): boolean {
  const productionThemes: ThemeKey[] = ['jelly', 'light', 'dark']
  return productionThemes.includes(key)
}

/**
 * Get metadata for only production-ready themes (excludes placeholders).
 * Useful for theme selection UI where you want to show only fully implemented themes.
 *
 * This returns themes with brand-specific designs (Jelly, Light, Dark),
 * excluding generic placeholder implementations (Nord, Dracula, etc.).
 *
 * @returns Array of production theme metadata objects
 *
 * @example
 * const productionThemes = getProductionThemes()
 * // [
 * //   { key: 'jelly', name: 'Jelly', isDark: true, ... },
 * //   { key: 'light', name: 'Light', isDark: false, ... },
 * //   { key: 'dark', name: 'Dark', isDark: true, ... }
 * // ]
 */
export function getProductionThemes(): Array<Theme['meta']> {
  return getAvailableThemeKeys()
    .filter(isProductionTheme)
    .map((key) => themes[key].meta)
}

/**
 * Get the default theme object directly.
 * Convenience function that returns the theme specified by DEFAULT_THEME_KEY.
 *
 * @returns The default Theme object (currently Jelly theme)
 *
 * @example
 * const defaultTheme = getDefaultTheme()
 * // Returns jellyTheme object
 */
export function getDefaultTheme(): Theme {
  return themes[DEFAULT_THEME_KEY]
}
