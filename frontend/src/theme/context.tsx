/**
 * Theme Context and Provider
 *
 * Provides theme state and switching functionality to the entire application.
 * Must wrap the app tree with <ThemeProvider> to use theming.
 *
 * @example
 * // In main.tsx or App.tsx
 * import { ThemeProvider } from '@/theme'
 *
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * @example
 * // In any component
 * import { useTheme } from '@/theme'
 *
 * function MyComponent() {
 *   const { theme, themeKey, setThemeKey, isDarkMode } = useTheme()
 *
 *   return (
 *     <button
 *       onClick={() => setThemeKey('light')}
 *       style={{ color: theme.colors.text.primary }}
 *     >
 *       Switch to Light Mode
 *     </button>
 *   )
 * }
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Theme, ThemeKey } from './types'
import {
  getThemeOrDefault,
  getAvailableThemes,
  getProductionThemes,
  isProductionTheme,
  DEFAULT_THEME_KEY,
} from './registry'
import {
  getStoredTheme,
  setStoredTheme,
  fetchUserThemePreference,
  saveUserThemePreference,
} from './persistence'
import { applyThemeToCSSVariables } from './cssVariables'

// =============================================================================
// Context Value Interface
// =============================================================================

/**
 * ThemeContext value interface
 *
 * Provides theme state and actions to all components in the tree.
 * Access via the useTheme() hook.
 */
export interface ThemeContextValue {
  /**
   * Currently active theme key
   * @example 'jelly' | 'light' | 'dark'
   */
  themeKey: ThemeKey

  /**
   * Resolved Theme object from the registry
   * Contains all design tokens (colors, typography, spacing, etc.)
   */
  theme: Theme

  /**
   * Change the active theme
   *
   * @param key - Valid theme key to switch to
   *
   * @example
   * setThemeKey('dark')  // Switch to dark theme
   * setThemeKey('light') // Switch to light theme
   */
  setThemeKey: (key: ThemeKey) => void

  /**
   * Reset to the default theme (jelly)
   *
   * @example
   * resetTheme() // Back to jelly theme
   */
  resetTheme: () => void

  /**
   * Quick boolean check if current theme is dark mode
   * Derived from theme.meta.isDark
   *
   * @example
   * const icon = isDarkMode ? <MoonIcon /> : <SunIcon />
   */
  isDarkMode: boolean

  /**
   * Check if current theme is production-ready (not a placeholder)
   *
   * Production themes: jelly, light, dark
   * Placeholder themes: nord, dracula, minimal, highContrast
   *
   * @example
   * {!isProductionTheme && <span className="badge">BETA</span>}
   */
  isProductionTheme: boolean

  /**
   * List of all available theme metadata
   * Useful for building theme picker UI
   *
   * @example
   * availableThemes.map(meta => (
   *   <button key={meta.key} onClick={() => setThemeKey(meta.key)}>
   *     {meta.name}
   *   </button>
   * ))
   */
  availableThemes: Array<Theme['meta']>

  /**
   * List of only production-ready theme metadata
   * Excludes placeholder themes
   *
   * @example
   * // Show only fully implemented themes in UI
   * productionThemes.map(meta => <ThemeOption {...meta} />)
   */
  productionThemes: Array<Theme['meta']>
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Theme context - undefined by default to enforce provider usage
 * @internal Use the useTheme hook instead of accessing directly
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Set display name for React DevTools
ThemeContext.displayName = 'ThemeContext'

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access theme context
 *
 * Provides access to current theme state and actions for switching themes.
 * Must be used within a ThemeProvider component.
 *
 * @throws Error if used outside ThemeProvider
 * @returns ThemeContextValue with current theme state and actions
 *
 * @example
 * function MyComponent() {
 *   const { theme, setThemeKey, isDarkMode } = useTheme()
 *
 *   return (
 *     <div style={{ color: theme.colors.text.primary }}>
 *       {isDarkMode ? 'Dark Mode' : 'Light Mode'}
 *     </div>
 *   )
 * }
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
        'Wrap your app with <ThemeProvider> in main.tsx or App.tsx.'
    )
  }

  return context
}

// =============================================================================
// Provider Component
// =============================================================================

export interface ThemeProviderProps {
  /**
   * Child components that will have access to theme context
   */
  children: ReactNode

  /**
   * Optional initial theme key
   * Defaults to 'jelly' if not provided
   *
   * @example
   * <ThemeProvider initialTheme="dark">
   *   <App />
   * </ThemeProvider>
   */
  initialTheme?: ThemeKey
}

/**
 * ThemeProvider component
 *
 * Provides theme context to all child components.
 * Must wrap your app tree to enable theming functionality.
 *
 * The provider manages theme state and makes it available via the useTheme() hook.
 * In Phase 3.2, this will be enhanced with localStorage persistence.
 *
 * @example
 * // Basic usage with default theme (jelly)
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * @example
 * // With initial theme
 * <ThemeProvider initialTheme="dark">
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  initialTheme,
}: ThemeProviderProps) {
  // Track if this is the initial mount to prevent race conditions
  const isInitialMount = useRef(true)

  // Initialize theme with priority cascade:
  // 1. localStorage (persisted user preference)
  // 2. initialTheme prop (programmatic override)
  // 3. DEFAULT_THEME_KEY (fallback)
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }
    return initialTheme ?? DEFAULT_THEME_KEY
  })

  // Fetch user's theme preference from backend on mount only
  // This overrides localStorage if the backend has a different preference
  // Ensures consistent theme across devices when user settings are synced
  useEffect(() => {
    let cancelled = false

    fetchUserThemePreference()
      .then((backendTheme) => {
        if (cancelled) return

        if (backendTheme && backendTheme !== themeKey) {
          setThemeKey(backendTheme)
          setStoredTheme(backendTheme)
        }
      })
      .catch((error) => {
        console.warn('Failed to fetch theme preference from backend:', error)
      })

    return () => {
      cancelled = true
    }
    // Only run once on mount to fetch backend preference
    // Safe to disable: setThemeKey and setStoredTheme are stable setState functions
    // themeKey is intentionally excluded to prevent re-running on theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist theme changes to localStorage and backend
  // Skip persistence on initial mount (already loaded from storage)
  // This runs after every theme change, ensuring preference survives page reload
  useEffect(() => {
    // Skip persistence on initial mount to avoid unnecessary writes
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    setStoredTheme(themeKey)

    // Sync to backend (fire-and-forget)
    saveUserThemePreference(themeKey).catch((error) => {
      console.warn('Failed to sync theme to backend:', error)
    })
  }, [themeKey])

  // Apply theme to CSS custom properties
  // This effect runs whenever the theme changes and injects CSS variables
  // into the document root, enabling dynamic theming without component changes
  useEffect(() => {
    const theme = getThemeOrDefault(themeKey)
    const root = document.documentElement
    let fallbackTimer: ReturnType<typeof setTimeout>

    // Add transition class for smooth theme changes
    root.classList.add('theme-transitioning')

    // Sync data-theme attribute for potential CSS targeting
    root.setAttribute('data-theme', themeKey)

    // Remove transition class after CSS transition completes
    // Use transitionend event for accuracy, with setTimeout fallback
    const handleTransitionEnd = (e: TransitionEvent) => {
      // Only remove class when the transition on root element completes
      if (e.target === root) {
        root.classList.remove('theme-transitioning')
        root.removeEventListener('transitionend', handleTransitionEnd)
        if (fallbackTimer) clearTimeout(fallbackTimer)
      }
    }

    // Apply CSS variables with requestAnimationFrame batching
    applyThemeToCSSVariables(theme, root, () => {
      // After CSS variables are applied, set up transition end handling
      root.addEventListener('transitionend', handleTransitionEnd)

      // Fallback timeout in case transitionend doesn't fire
      fallbackTimer = setTimeout(() => {
        root.classList.remove('theme-transitioning')
        root.removeEventListener('transitionend', handleTransitionEnd)
      }, 300) // Slightly longer than CSS transition duration
    })

    // Cleanup function removes event listener and timeout
    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      root.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [themeKey])

  // Memoize the context value to prevent unnecessary re-renders
  // Only re-compute when themeKey changes
  const value = useMemo<ThemeContextValue>(() => {
    const theme = getThemeOrDefault(themeKey)

    return {
      themeKey,
      theme,
      setThemeKey,
      resetTheme: () => setThemeKey(DEFAULT_THEME_KEY),
      isDarkMode: theme.meta.isDark,
      isProductionTheme: isProductionTheme(themeKey),
      availableThemes: getAvailableThemes(),
      productionThemes: getProductionThemes(),
    }
  }, [themeKey])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
