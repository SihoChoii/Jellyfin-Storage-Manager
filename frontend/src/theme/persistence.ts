/**
 * Theme Persistence Layer
 *
 * Provides an abstraction for persisting theme preferences across sessions.
 * Implements both localStorage and backend API persistence with graceful degradation.
 *
 * Architecture:
 * - localStorage: Immediate, synchronous persistence (survives page reload)
 * - Backend API: Cross-device sync via user settings endpoint
 *
 * Priority order for theme initialization:
 * 1. Backend user preference (fetchUserThemePreference)
 * 2. localStorage preference (getStoredTheme)
 * 3. Default theme
 *
 * @example
 * // Read stored theme
 * const storedTheme = getStoredTheme()
 * if (storedTheme) {
 *   setThemeKey(storedTheme)
 * }
 *
 * @example
 * // Save theme preference
 * setStoredTheme('dark')
 */

import { isValidThemeKey, type ThemeKey } from './types'
import { apiGet, apiPatch } from '../api'
import type { UserSettings } from '../types'

// =============================================================================
// Constants
// =============================================================================

/**
 * localStorage key for theme preference
 * @internal
 */
export const THEME_STORAGE_KEY = 'jellymover-theme'

// =============================================================================
// localStorage Helpers
// =============================================================================

/**
 * Read the stored theme preference from localStorage
 *
 * Returns null if:
 * - No theme is stored
 * - Stored value is invalid (not a valid ThemeKey)
 * - localStorage is unavailable (privacy mode, etc.)
 * - An error occurs during read
 *
 * @returns The stored ThemeKey, or null if unavailable/invalid
 *
 * @example
 * const storedTheme = getStoredTheme()
 * if (storedTheme) {
 *   console.log('User previously selected:', storedTheme)
 * } else {
 *   console.log('No stored theme, using default')
 * }
 */
export function getStoredTheme(): ThemeKey | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)

    // No stored value
    if (!stored) {
      return null
    }

    // Validate stored value is a valid ThemeKey
    if (isValidThemeKey(stored)) {
      return stored as ThemeKey
    }

    // Invalid value stored - clear it
    console.warn(
      `Invalid theme key "${stored}" found in localStorage. Clearing.`
    )
    clearStoredTheme()
    return null
  } catch (error) {
    // localStorage unavailable (privacy mode, quota exceeded, etc.)
    console.warn('Failed to read theme from localStorage:', error)
    return null
  }
}

/**
 * Persist the theme preference to localStorage
 *
 * This is a fire-and-forget operation. Errors are logged but do not
 * interrupt the theme switching flow. The UI will update immediately
 * regardless of persistence success.
 *
 * @param themeKey - The theme key to persist
 *
 * @example
 * // Save user's theme choice
 * setStoredTheme('dark')
 */
export function setStoredTheme(themeKey: ThemeKey): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeKey)
  } catch (error) {
    // localStorage write failed (privacy mode, quota exceeded, etc.)
    // Log but don't throw - theme is still applied in memory
    console.warn('Failed to persist theme to localStorage:', error)
  }
}

/**
 * Clear the stored theme preference from localStorage
 *
 * This is useful for:
 * - Resetting to default behavior
 * - Cleaning up invalid stored values
 * - Testing
 *
 * @example
 * // Reset theme preference
 * clearStoredTheme()
 * window.location.reload() // Will now use default theme
 */
export function clearStoredTheme(): void {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear theme from localStorage:', error)
  }
}

// =============================================================================
// Backend Integration Hooks (Stubs)
// =============================================================================

/**
 * Fetch the user's theme preference from the backend
 *
 * Endpoint: GET /api/me/settings
 * Response: { theme: string }
 *
 * Priority order for theme initialization:
 * 1. Backend user preference (this function)
 * 2. localStorage preference (getStoredTheme)
 * 3. Default theme
 *
 * @returns Promise resolving to the user's theme preference, or null if not set or on error
 *
 * @example
 * // Fetch and apply user's saved theme
 * const userTheme = await fetchUserThemePreference()
 * if (userTheme) {
 *   setThemeKey(userTheme)
 *   setStoredTheme(userTheme) // Sync to localStorage
 * }
 */
export async function fetchUserThemePreference(): Promise<ThemeKey | null> {
  try {
    const settings = await apiGet<UserSettings>('/me/settings')

    if (settings.theme && isValidThemeKey(settings.theme)) {
      return settings.theme as ThemeKey
    }

    return null
  } catch (error) {
    // Backend unavailable - gracefully fall back to localStorage
    console.warn('Failed to fetch user theme preference from backend:', error)
    return null
  }
}

/**
 * Save the user's theme preference to the backend
 *
 * Endpoint: PATCH /api/me/settings
 * Payload: { theme: ThemeKey }
 *
 * This is a fire-and-forget operation. The UI should update immediately
 * when the user changes themes, not wait for backend confirmation.
 *
 * @param themeKey - The theme key to save to the backend
 *
 * @example
 * // Update theme and sync to backend
 * async function handleThemeChange(newTheme: ThemeKey) {
 *   // Update UI immediately
 *   setThemeKey(newTheme)
 *   setStoredTheme(newTheme)
 *
 *   // Sync to backend in background (fire-and-forget)
 *   saveUserThemePreference(newTheme).catch(error => {
 *     console.warn('Failed to sync theme to backend:', error)
 *   })
 * }
 */
export async function saveUserThemePreference(
  themeKey: ThemeKey
): Promise<void> {
  try {
    await apiPatch<UserSettings>('/me/settings', { theme: themeKey })
  } catch (error) {
    // Log but don't throw - theme is already applied locally
    console.warn('Failed to save theme preference to backend:', error)
  }
}
