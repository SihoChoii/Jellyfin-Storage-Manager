/**
 * Theme Error Boundary
 *
 * Catches errors in the theme system and provides a fallback to the default theme.
 * Prevents theme-related errors from crashing the entire application.
 *
 * Usage:
 * ```tsx
 * <ThemeErrorBoundary>
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * </ThemeErrorBoundary>
 * ```
 */

import type { ReactNode } from 'react'
import { Component } from 'react'
import { DEFAULT_THEME_KEY } from './registry'

interface ThemeErrorBoundaryProps {
  children: ReactNode
}

interface ThemeErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary for Theme System
 *
 * Catches JavaScript errors anywhere in the theme system and displays
 * a fallback UI with the default theme instead of crashing the app.
 */
export class ThemeErrorBoundary extends Component<
  ThemeErrorBoundaryProps,
  ThemeErrorBoundaryState
> {
  constructor(props: ThemeErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ThemeErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console for debugging
    console.error('Theme system error caught by ErrorBoundary:', error, errorInfo)

    // Try to reset to default theme on error
    try {
      localStorage.setItem('jellymover-theme', DEFAULT_THEME_KEY)
    } catch (storageError) {
      console.warn('Failed to reset theme in localStorage:', storageError)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI with inline styles (no theme system)
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#020014',
            color: '#f7f7ff',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              background: 'rgba(5, 5, 20, 0.96)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: '#ff6b3d',
              }}
            >
              Theme System Error
            </h1>
            <p
              style={{
                marginBottom: '1.5rem',
                color: '#9ea1c9',
                lineHeight: '1.6',
              }}
            >
              An error occurred in the theme system. The app has been reset to the default theme.
              Please reload the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(120deg, #ff6b3d, #ffd07a)',
                border: 'none',
                borderRadius: '999px',
                padding: '0.75rem 1.5rem',
                color: '#020014',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Reload Page
            </button>
            {this.state.error && (
              <details
                style={{
                  marginTop: '1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  color: '#70739b',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ThemeErrorBoundary
