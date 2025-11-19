/**
 * CSS Variable Injection Bridge
 *
 * Maps theme tokens to CSS custom properties and applies them to the DOM.
 * This bridge enables dynamic theming by updating CSS variables when the theme changes.
 *
 * Phase 4.1 - Core injection bridge implementation
 */

import type { Theme } from './types'

/**
 * Mapping of theme tokens to CSS variable names
 *
 * This centralized mapping makes it easy to:
 * - See all token → CSS variable connections at a glance
 * - Add new mappings as needed
 * - Maintain consistency across the app
 *
 * Format: CSS variable name → Theme token accessor function
 */
const CSS_VARIABLE_MAP: Record<string, (theme: Theme) => string> = {
  // =========================================================================
  // Background Colors
  // =========================================================================
  '--bg-main': (theme) => theme.colors.background.main,
  '--bg-panel': (theme) => theme.colors.background.panel,
  '--bg-secondary': (theme) => theme.colors.background.secondary ?? theme.colors.background.panel,
  '--bg-tertiary': (theme) => theme.colors.background.tertiary ?? theme.colors.background.panel,
  '--bg-overlay': (theme) => theme.colors.background.overlay,

  // Background gradient support (for body radial gradient)
  '--bg-main-gradient-start': (theme) =>
    theme.colors.background.mainGradientStart ?? theme.colors.background.main,
  '--bg-main-gradient-end': (theme) =>
    theme.colors.background.mainGradientEnd ?? theme.colors.background.main,

  // Ambient gradient colors (for .bg-gradient overlays)
  '--bg-gradient-cold': (theme) => theme.colors.accent.coldSoft,
  '--bg-gradient-hot': (theme) => theme.colors.accent.hotSoft,
  '--bg-gradient-magenta': (theme) => {
    if (!theme.colors.accent.magenta) return 'transparent'
    // Convert magenta hex color to rgba with 0.22 opacity to match other soft gradients
    const hex = theme.colors.accent.magenta.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.22)`
  },

  // Component-specific backgrounds
  '--bg-input-search': (theme) =>
    theme.colors.background.inputSearch ?? theme.colors.background.panel,
  '--bg-chip': (theme) =>
    theme.colors.background.chip ?? theme.colors.background.secondary ?? theme.colors.background.panel,
  '--bg-queue-item': (theme) =>
    theme.colors.background.queueItem ?? theme.colors.background.panel,
  '--bg-stats-box': (theme) =>
    theme.colors.background.statsBox ?? theme.colors.background.panel,
  '--bg-pool-tag': (theme) =>
    theme.colors.background.poolTag ?? theme.colors.background.secondary ?? theme.colors.background.panel,
  '--bg-controls': (theme) =>
    theme.colors.background.controls ?? theme.colors.background.panel,
  '--bg-nav-btn': (theme) =>
    theme.colors.background.navBtn ?? theme.colors.background.secondary ?? theme.colors.background.panel,
  '--bg-nav-btn-active': (theme) =>
    theme.colors.background.navBtnActive ?? theme.colors.background.panel,
  '--bg-terminal-header': (theme) =>
    theme.colors.background.terminalHeader ?? theme.colors.background.secondary ?? theme.colors.background.panel,
  '--bg-stats-mini': (theme) =>
    theme.colors.background.statsMini ?? theme.colors.background.panel,
  '--bg-media-thumb-inner': (theme) =>
    theme.colors.background.mediaThumbInner ?? 'rgba(0, 0, 0, 0.35)',
  '--bg-progress-track': (theme) =>
    theme.colors.background.progressTrack ?? 'rgba(255, 255, 255, 0.08)',
  '--bg-scrollbar-track': (theme) =>
    theme.colors.background.scrollbarTrack ?? 'rgba(255, 255, 255, 0.03)',
  '--bg-scrollbar-thumb': (theme) =>
    theme.colors.background.scrollbarThumb ?? 'rgba(255, 255, 255, 0.18)',
  '--bg-scrollbar-thumb-hover': (theme) =>
    theme.colors.background.scrollbarThumbHover ?? 'rgba(255, 255, 255, 0.28)',

  // =========================================================================
  // Border Colors (All opacity levels)
  // =========================================================================
  '--border-subtle': (theme) => theme.colors.border.white06,
  '--border-08': (theme) => theme.colors.border.white08,
  '--border-12': (theme) => theme.colors.border.white12,
  '--border-14': (theme) => theme.colors.border.white14,
  '--border-16': (theme) => theme.colors.border.white16,
  '--border-18': (theme) => theme.colors.border.white18,
  '--border-22': (theme) => theme.colors.border.white22,
  '--border-25': (theme) => theme.colors.border.white25,
  '--border-45': (theme) => theme.colors.border.white45,

  // =========================================================================
  // Accent Colors
  // =========================================================================
  '--accent-hot': (theme) => theme.colors.accent.hot,
  '--accent-hot-soft': (theme) => theme.colors.accent.hotSoft,
  '--accent-hot-end': (theme) => theme.colors.accent.hotGradientEnd ?? '#ffd07a',
  '--accent-cold': (theme) => theme.colors.accent.cold,
  '--accent-cold-soft': (theme) => theme.colors.accent.coldSoft,
  '--accent-cold-end': (theme) => theme.colors.accent.coldGradientEnd ?? '#aef4ff',
  '--accent-magenta': (theme) => theme.colors.accent.magenta ?? '#ff4ced',

  // Primary accent for focus rings and key interactions
  '--accent-primary': (theme) =>
    theme.colors.accent.primary ?? (theme.meta.isDark ? '#4a90e2' : '#2563eb'),

  // =========================================================================
  // Text Colors
  // =========================================================================
  '--text-main': (theme) => theme.colors.text.primary,
  '--text-soft': (theme) => theme.colors.text.secondary,
  '--text-muted': (theme) => theme.colors.text.tertiary,
  '--text-hot-accent': (theme) => theme.colors.text.hotAccent ?? '#ffb199',
  '--text-cold-accent': (theme) => theme.colors.text.coldAccent ?? '#a7ebff',
  '--text-inverted': (theme) => theme.colors.text.inverted ?? '#020014',

  // =========================================================================
  // Window Dots (macOS-style)
  // =========================================================================
  '--dot-default': (theme) => theme.colors.windowDots?.default ?? '#3a3a55',
  '--dot-red': (theme) => theme.colors.windowDots?.red ?? '#ff5f57',
  '--dot-yellow': (theme) => theme.colors.windowDots?.yellow ?? '#febc2e',
  '--dot-green': (theme) => theme.colors.windowDots?.green ?? '#28c840',

  // =========================================================================
  // Gradients
  // =========================================================================
  '--gradient-logo': (theme) => theme.colors.gradients?.text?.logo ?? 'linear-gradient(120deg, #3dd5ff, #ff6b3d)',
  '--gradient-button-hot': (theme) => theme.colors.gradients?.button?.hot ?? 'linear-gradient(120deg, #ff6b3d, #ffd07a)',
  '--gradient-button-cold': (theme) => theme.colors.gradients?.button?.cold ?? 'linear-gradient(120deg, #3dd5ff, #aef4ff)',
  '--gradient-progress': (theme) => theme.colors.gradients?.progress?.bar ?? 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
  '--gradient-scrollbar': (theme) => theme.colors.gradients?.scrollbar ?? 'linear-gradient(180deg, #3dd5ff, #ff6b3d)',

  // Media thumbnail conic gradient
  '--gradient-media-thumb': (theme) =>
    theme.colors.gradients?.conic?.mediaThumb ??
    'conic-gradient(from 200deg, rgba(61, 213, 255, 0.9), rgba(255, 107, 61, 0.85), rgba(255, 76, 237, 0.76), rgba(61, 213, 255, 0.9))',

  // Component-specific gradients
  '--gradient-panel-base': (theme) =>
    theme.colors.gradients?.panel?.base ?? 'none',
  '--gradient-top-bar': (theme) =>
    theme.colors.gradients?.panel?.topBar ?? 'none',
  '--gradient-nav-active': (theme) =>
    theme.colors.gradients?.panel?.navActive ?? 'none',
  '--gradient-terminal-header': (theme) =>
    theme.colors.gradients?.panel?.terminalHeader ?? 'none',
  '--gradient-stats-mini': (theme) =>
    theme.colors.gradients?.panel?.statsMini ?? 'none',
  '--gradient-media-thumb-inner': (theme) =>
    theme.colors.gradients?.conic?.mediaThumbInner ?? 'none',
  '--gradient-controls': (theme) =>
    theme.colors.gradients?.panel?.controls ?? 'none',
  '--gradient-queue-item': (theme) =>
    theme.colors.gradients?.panel?.queueItem ?? 'none',

  // Shine effect colors (theme-aware opacity)
  '--shine-color': (theme) =>
    theme.meta.isDark ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.4)',
  '--shine-color-button': (theme) =>
    theme.meta.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.35)',

  // Visual effects
  '--backdrop-filter-header': (theme) =>
    theme.effects.backdropFilter.header ?? 'blur(12px) saturate(1.5)',
  '--blend-mode-gradient': (theme) =>
    theme.effects.blendMode.gradient ?? 'normal',
  '--blend-mode-noise': (theme) =>
    theme.effects.blendMode.noise ?? 'overlay',

  // Interaction states
  '--interaction-hover': (theme) =>
    theme.colors.interaction.hover ?? 'rgba(255, 255, 255, 0.08)',
  '--interaction-active': (theme) =>
    theme.colors.interaction.active ?? 'rgba(255, 255, 255, 0.12)',

  // =========================================================================
  // Chart Colors
  // =========================================================================
  '--chart-cpu': (theme) => theme.components.chart.semantic.cpu,
  '--chart-memory': (theme) => theme.components.chart.semantic.memory,
  '--chart-running': (theme) => theme.components.chart.semantic.running,
  '--chart-queued': (theme) => theme.components.chart.semantic.queued,
  '--chart-transfer-speed': (theme) => theme.components.chart.semantic.transferSpeed,
  '--chart-pool-used': (theme) => theme.components.chart.semantic.poolUsed,
  '--chart-pool-free': (theme) => theme.components.chart.semantic.poolFree,
  '--chart-grid': (theme) => theme.components.chart.grid,
  '--chart-axis': (theme) => theme.components.chart.axis,
  '--chart-tooltip-bg': (theme) => theme.components.chart.tooltip.background,
  '--chart-tooltip-border': (theme) => theme.components.chart.tooltip.border,

  // =========================================================================
  // Border Radius
  // =========================================================================
  '--radius-sm': (theme) => theme.radius.sm,
  '--radius-md': (theme) => theme.radius.md,
  '--radius-lg': (theme) => theme.radius.lg,
  '--radius-xl': (theme) => theme.radius.xl,
  '--radius-2xl': (theme) => theme.radius['2xl'],
  '--radius-full': (theme) => theme.radius.full,

  // =========================================================================
  // Shadows
  // =========================================================================
  '--shadow-sm': (theme) => theme.shadows.sm,
  '--shadow-md': (theme) => theme.shadows.md,
  '--shadow-soft': (theme) => theme.shadows.lg,
  '--shadow-deep': (theme) => theme.shadows.xl,
  '--shadow-2xl': (theme) => theme.shadows['2xl'],

  // =========================================================================
  // Typography - Font Families
  // =========================================================================
  '--font-ui': (theme) => theme.typography.fontFamily.ui,
  '--font-mono': (theme) => theme.typography.fontFamily.mono,
  '--font-display': (theme) => theme.typography.fontFamily.display ?? theme.typography.fontFamily.ui,

  // =========================================================================
  // Typography - Font Sizes
  // =========================================================================
  '--font-size-xs': (theme) => theme.typography.fontSize.xs,
  '--font-size-sm': (theme) => theme.typography.fontSize.sm,
  '--font-size-base': (theme) => theme.typography.fontSize.base,
  '--font-size-md': (theme) => theme.typography.fontSize.md,
  '--font-size-lg': (theme) => theme.typography.fontSize.lg,
  '--font-size-xl': (theme) => theme.typography.fontSize.xl,
  '--font-size-2xl': (theme) => theme.typography.fontSize['2xl'],
  '--font-size-3xl': (theme) => theme.typography.fontSize['3xl'],

  // =========================================================================
  // Typography - Font Weights
  // =========================================================================
  '--font-weight-normal': (theme) => String(theme.typography.fontWeight.normal),
  '--font-weight-medium': (theme) => String(theme.typography.fontWeight.medium),
  '--font-weight-semibold': (theme) => String(theme.typography.fontWeight.semibold),
  '--font-weight-bold': (theme) => String(theme.typography.fontWeight.bold),
  '--font-weight-extrabold': (theme) => String(theme.typography.fontWeight.extrabold),

  // =========================================================================
  // Typography - Letter Spacing
  // =========================================================================
  '--letter-spacing-tight': (theme) => theme.typography.letterSpacing.tight,
  '--letter-spacing-normal': (theme) => theme.typography.letterSpacing.normal,
  '--letter-spacing-wide': (theme) => theme.typography.letterSpacing.wide,
  '--letter-spacing-wider': (theme) => theme.typography.letterSpacing.wider,
  '--letter-spacing-widest': (theme) => theme.typography.letterSpacing.widest,

  // =========================================================================
  // Typography - Line Heights
  // =========================================================================
  '--line-height-tight': (theme) => String(theme.typography.lineHeight.tight),
  '--line-height-normal': (theme) => String(theme.typography.lineHeight.normal),
  '--line-height-relaxed': (theme) => String(theme.typography.lineHeight.relaxed),

  // =========================================================================
  // Transitions
  // =========================================================================
  '--transition-fast': (theme) => theme.transitions.duration.fast,
  '--transition-normal': (theme) => theme.transitions.duration.normal,
  '--transition-slow': (theme) => theme.transitions.duration.slow,
  '--ease-out': (theme) => theme.transitions.easing.easeOut,
  '--ease-in-out': (theme) => theme.transitions.easing.easeInOut,
  '--ease-spring': (theme) => theme.transitions.easing.spring,

  // =========================================================================
  // Animation Durations
  // =========================================================================
  '--anim-bg-drift': (theme) => theme.animations.bgDrift.duration,
  '--anim-shine-sweep': (theme) => theme.animations.shineSweep.duration,
  '--anim-screen-in': (theme) => theme.animations.screenIn.duration,
  '--anim-card-in': (theme) => theme.animations.cardIn.duration,
  '--anim-progress-shift': (theme) => theme.animations.progressShift.duration,
  '--anim-stat-flow': (theme) => theme.animations.statFlow.duration,
  '--anim-stagger-delay': (theme) => theme.animations.staggerDelay,

  // =========================================================================
  // Spacing Scale
  // =========================================================================
  '--spacing-1': (theme) => theme.spacing[1],
  '--spacing-2': (theme) => theme.spacing[2],
  '--spacing-3': (theme) => theme.spacing[3],
  '--spacing-4': (theme) => theme.spacing[4],
  '--spacing-5': (theme) => theme.spacing[5],
  '--spacing-6': (theme) => theme.spacing[6],
  '--spacing-7': (theme) => theme.spacing[7],
  '--spacing-8': (theme) => theme.spacing[8],
}

/**
 * Apply theme tokens to CSS custom properties
 *
 * Converts all mapped theme tokens to CSS variables and injects them into the
 * document root (:root). This allows existing CSS to respond to theme changes
 * without requiring component refactoring.
 *
 * Updates are batched in a single requestAnimationFrame for optimal performance,
 * ensuring theme switches complete within a single frame (<16ms).
 *
 * @param theme - The active theme object to apply
 * @param root - Optional root element (defaults to document.documentElement)
 * @param onComplete - Optional callback when CSS variables are applied
 *
 * @example
 * ```ts
 * const theme = getThemeOrDefault('dark')
 * applyThemeToCSSVariables(theme, document.documentElement, () => {
 *   console.log('Theme applied!')
 * })
 * // Now all CSS using var(--bg-main) will use the dark theme background
 * ```
 */
export function applyThemeToCSSVariables(
  theme: Theme,
  root: HTMLElement = document.documentElement,
  onComplete?: () => void
): void {
  // Safety check: ensure we have a valid root element
  if (!root || !root.style) {
    console.warn('applyThemeToCSSVariables: Invalid root element provided')
    onComplete?.()
    return
  }

  // Batch all CSS variable updates in a single animation frame
  // This ensures all updates happen together, preventing jank
  requestAnimationFrame(() => {
    const updates: Array<[string, string]> = []

    // Collect all valid CSS variable updates
    for (const [cssVar, accessor] of Object.entries(CSS_VARIABLE_MAP)) {
      try {
        const value = accessor(theme)

        // Fallback to a safe default if token is missing
        if (value === undefined || value === null) {
          console.warn(
            `Theme token for "${cssVar}" is missing in theme "${theme.meta.key}". Skipping.`
          )
          continue
        }

        updates.push([cssVar, value])
      } catch (error) {
        console.error(
          `Failed to get value for CSS variable "${cssVar}" in theme "${theme.meta.key}":`,
          error
        )
      }
    }

    // Apply all updates at once (browser optimizes batched style changes)
    for (const [cssVar, value] of updates) {
      root.style.setProperty(cssVar, value)
    }

    // Notify completion
    onComplete?.()
  })
}

/**
 * Remove all theme-related CSS variables from the DOM
 *
 * Useful for cleanup or reset scenarios.
 *
 * @param root - Optional root element (defaults to document.documentElement)
 */
export function removeThemeCSSVariables(
  root: HTMLElement = document.documentElement
): void {
  if (!root || !root.style) {
    return
  }

  for (const cssVar of Object.keys(CSS_VARIABLE_MAP)) {
    root.style.removeProperty(cssVar)
  }
}

/**
 * Get the current value of a CSS variable from the theme
 *
 * Useful for debugging or reading theme values in JavaScript.
 *
 * @param cssVar - The CSS variable name (e.g., '--bg-main')
 * @param theme - The theme to read from
 * @returns The value of the CSS variable, or undefined if not found
 */
export function getCSSVariableValue(cssVar: string, theme: Theme): string | undefined {
  const accessor = CSS_VARIABLE_MAP[cssVar]
  return accessor ? accessor(theme) : undefined
}
