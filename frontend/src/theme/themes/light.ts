/**
 * Light Theme - Professional Light Mode for JellyMover
 *
 * This theme provides a clean, professional light mode optimized for bright
 * environments and corporate/office settings. It maintains JellyMover's hot/cold
 * design language but with subdued, minimal aesthetics.
 *
 * Design Philosophy:
 * - Clean and minimal with subtle effects
 * - High contrast for excellent readability
 * - Professional typography (Inter font)
 * - Subdued hot/cold accents
 * - Light shadows instead of heavy glows
 * - Tighter letter spacing for modern look
 * - No aggressive branding (no tagline)
 *
 * Key Differences from Jelly:
 * - Light backgrounds vs dark
 * - Inverted border logic (dark on light)
 * - Inter font vs system fonts
 * - Reduced glassmorphism
 * - Subtle gradients vs intense
 * - Tighter letter spacing (0.01-0.04em vs 0.14-0.28em)
 */

import type { Theme } from '../types'

/**
 * Complete Light theme object
 * Professional light mode with Inter typography
 */
export const lightTheme: Theme = {
  // ===========================================================================
  // Theme Metadata
  // ===========================================================================
  meta: {
    key: 'light',
    name: 'Light',
    description: 'Professional light theme for corporate environments',
    isDark: false,
    logoTagline: undefined, // No tagline for clean professional look
  },

  // ===========================================================================
  // Color System
  // ===========================================================================
  colors: {
    // Background Colors
    background: {
      main: '#fafafa', // Soft gray-white, easier on eyes than pure white
      panel: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white panels
      overlay: 'rgba(250, 250, 250, 0.9)', // Light overlay for modals
      secondary: 'rgba(248, 248, 250, 0.95)', // Slightly cooler secondary
      tertiary: 'rgba(245, 247, 250, 0.95)', // Subtle blue tint

      // Phase 4.4: No dramatic gradients for light theme (keep solid)
      mainGradientStart: '#fafafa', // Same as main for solid background
      mainGradientEnd: '#fafafa', // Same as main for solid background

      // Phase 4.5: Component-specific backgrounds (light theme - mostly white/near-white)
      inputSearch: 'rgba(248, 248, 250, 0.95)', // Light search input
      chip: 'rgba(243, 244, 246, 0.9)', // Light chip background
      queueItem: 'rgba(255, 255, 255, 0.85)', // Queue item white
      statsBox: 'rgba(250, 251, 252, 0.95)', // Stats box near-white
      poolTag: 'rgba(245, 247, 250, 0.95)', // Pool tag light blue tint
      controls: 'rgba(248, 248, 250, 0.95)', // Controls panel light
      navBtn: 'rgba(248, 248, 250, 0.8)', // Navigation button light
      navBtnActive: 'rgba(255, 255, 255, 0.95)', // Active nav white
      terminalHeader: 'rgba(248, 250, 252, 0.95)', // Terminal header light
      statsMini: 'rgba(250, 251, 252, 0.95)', // Mini stats light
      mediaThumbInner: 'rgba(248, 250, 252, 0.95)', // Media thumbnail inner light
      progressTrack: 'rgba(10, 10, 15, 0.08)', // Progress bar track (dark on light)
      scrollbarTrack: 'rgba(10, 10, 15, 0.03)', // Scrollbar track subtle
      scrollbarThumb: 'rgba(10, 10, 15, 0.18)', // Scrollbar thumb
      scrollbarThumbHover: 'rgba(10, 10, 15, 0.28)', // Scrollbar thumb hover

      // Background noise texture (same SVG but for light backgrounds)
      noiseTexture:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.16'/%3E%3C/svg%3E\")",
      noiseOpacity: '0.3', // Lower opacity for light theme
      noiseBlendMode: 'multiply', // Multiply darkens slightly
    },

    // Text Colors
    text: {
      primary: '#0a0a0f', // Near-black with blue undertone (15.8:1 contrast)
      secondary: '#4a4a60', // Medium dark purple-gray (7.2:1 contrast)
      tertiary: '#7a7a90', // Light purple-gray (4.5:1 contrast - WCAG AA minimum)
      disabled: 'rgba(10, 10, 15, 0.3)', // Disabled text
      inverted: '#fafafa', // For dark backgrounds
      hotAccent: '#c44820', // Darker hot for text on light
      coldAccent: '#1a7a9a', // Darker cold for text on light
      success: '#047857', // Dark green (WCAG AA compliant)
      error: '#c44820', // Warm error red
    },

    // Accent Colors
    accent: {
      hot: '#ff6b3d', // Keep original hot (works on light)
      hotSoft: 'rgba(255, 107, 61, 0.12)', // Much lighter soft variant
      cold: '#3dd5ff', // Keep original cold
      coldSoft: 'rgba(61, 213, 255, 0.12)', // Much lighter soft variant
      magenta: '#ff4ced', // Keep original magenta
      primary: '#2563eb', // Richer blue for light mode
      secondary: '#7c3aed', // Deeper purple
      hotGradientEnd: '#ff8f5d', // Lighter hot gradient end
      coldGradientEnd: '#5de5ff', // Lighter cold gradient end
    },

    // Semantic Colors
    semantic: {
      success: '#059669', // Emerald green
      error: '#dc2626', // Clean red
      warning: '#d97706', // Amber
      info: '#2563eb', // Blue
    },

    // Border Colors (inverted logic - dark borders on light backgrounds)
    border: {
      white06: 'rgba(10, 10, 15, 0.06)', // Darkened borders
      white08: 'rgba(10, 10, 15, 0.08)',
      white12: 'rgba(10, 10, 15, 0.12)',
      white14: 'rgba(10, 10, 15, 0.14)',
      white16: 'rgba(10, 10, 15, 0.16)',
      white18: 'rgba(10, 10, 15, 0.18)',
      white22: 'rgba(10, 10, 15, 0.22)',
      white25: 'rgba(10, 10, 15, 0.25)',
      white45: 'rgba(10, 10, 15, 0.45)',
    },

    // Interaction Colors
    interaction: {
      hover: 'rgba(10, 10, 15, 0.05)', // Subtle dark overlay on hover
      active: 'rgba(10, 10, 15, 0.1)', // Slightly stronger on active
      focus: '#2563eb', // Primary blue for focus
      selected: 'rgba(37, 99, 235, 0.1)', // Light blue selection
      disabled: 'rgba(10, 10, 15, 0.03)', // Very subtle disabled
    },

    // Gradients
    gradients: {
      // Simple gradients
      primary: 'linear-gradient(135deg, #3dd5ff 0%, #ff6b3d 100%)',
      secondary: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',

      // Button gradients
      button: {
        hot: 'linear-gradient(120deg, #ff6b3d, #ff8f5d)',
        cold: 'linear-gradient(120deg, #3dd5ff, #5de5ff)',
        primary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      },

      // Progress gradients
      progress: {
        bar: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
        stat: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
      },

      // Scrollbar gradient
      scrollbar: 'linear-gradient(180deg, #3dd5ff, #ff6b3d)',

      // Text gradients (darker for visibility)
      text: {
        logo: 'linear-gradient(120deg, #1a7a9a, #c44820)',
        accent: 'linear-gradient(120deg, #3dd5ff, #ff6b3d)',
      },

      // Effect gradients
      effects: {
        shine:
          'linear-gradient(110deg, transparent 0, rgba(255, 255, 255, 0.4) 45%, transparent 55%)',
        hoverGlow:
          'radial-gradient(circle at 0 0, rgba(10, 10, 15, 0.06), transparent 55%)',
      },

      // Conic gradient
      conic: {
        mediaThumb:
          'conic-gradient(from 200deg, rgba(61, 213, 255, 0.7), rgba(255, 107, 61, 0.65), rgba(255, 76, 237, 0.6), rgba(61, 213, 255, 0.7))',
        mediaThumbInner:
          'radial-gradient(circle at 0 0, rgba(255, 255, 255, 0.3), transparent 60%)',
      },

      // Phase 4.5: Panel gradients (light theme - minimal/none for clean professional look)
      panel: {
        base: 'none', // No gradient overlays for light theme
        topBar: 'none', // Solid color only
        terminalHeader: 'none', // Clean solid backgrounds
        statsMini: 'none',
        controls: 'none',
        queueItem: 'none',
        navActive:
          'linear-gradient(120deg, rgba(61, 213, 255, 0.08), rgba(255, 107, 61, 0.1))', // Subtle active state
      },
    },

    // Window Dots (macOS-style window controls)
    windowDots: {
      default: '#d1d5db', // Light gray
      red: '#ef4444', // Slightly muted red
      yellow: '#f59e0b', // Amber
      green: '#10b981', // Emerald
    },
  },

  // ===========================================================================
  // Typography System (Inter font for professional look)
  // ===========================================================================
  typography: {
    fontFamily: {
      // Primary UI font - Inter for modern professional look
      ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

      // Monospace - JetBrains Mono for better code readability
      mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace',

      // Display/headings - Same as UI for consistency
      display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    fontSize: {
      xs: '0.6875rem', // 11px - Slightly smaller for professional UIs
      sm: '0.8125rem', // 13px
      base: '0.9375rem', // 15px - Slightly larger base for readability
      md: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.375rem', // 22px
      '2xl': '1.75rem', // 28px
      '3xl': '2.25rem', // 36px - Larger headings
    },

    fontWeight: {
      normal: 400, // Regular - default body text
      medium: 500, // Medium - slightly emphasized
      semibold: 600, // Semibold - headings, labels
      bold: 700, // Bold - primary headings
      extrabold: 800, // Use sparingly - only for hero text
    },

    letterSpacing: {
      tighter: '-0.015em', // Tighter for large headings
      tight: '0em', // Normal for most text
      normal: '0.01em', // Slight spacing for clarity (vs 0.14em in Jelly)
      wide: '0.025em', // Subtle wide spacing (vs 0.18em in Jelly)
      wider: '0.04em', // For labels/small caps (vs 0.22em in Jelly)
      widest: '0.08em', // Use sparingly (vs 0.28em in Jelly)
    },

    lineHeight: {
      none: 1,
      tight: 1.35, // Tighter for headings
      normal: 1.6, // More generous for readability
      relaxed: 1.75, // Very comfortable reading
      loose: 2,
    },

    textTransform: {
      none: 'none', // DEFAULT for light theme (vs uppercase in Jelly)
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
  },

  // ===========================================================================
  // Spacing System (reuse from Jelly - theme-agnostic)
  // ===========================================================================
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // ===========================================================================
  // Border Radius (reuse from Jelly)
  // ===========================================================================
  radius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // ===========================================================================
  // Shadows System (lighter for light theme)
  // ===========================================================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.12)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.15)', // Lighter than Jelly
    xl: '0 20px 40px rgba(0, 0, 0, 0.2)', // Lighter than Jelly
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
  },

  // ===========================================================================
  // Transitions (reuse from Jelly - universal)
  // ===========================================================================
  transitions: {
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
    },
  },

  // ===========================================================================
  // Effects System (reduced for professional look)
  // ===========================================================================
  effects: {
    blur: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px', // Reduced from 18px
      xl: '16px', // Reduced from 24px
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
      glassMedium: 'blur(12px) saturate(110%)', // Less blur, less saturation
      glassHeavy: 'blur(16px) saturate(120%)', // Less intense
      header: 'blur(8px) saturate(1.1)', // Phase 4.5: Header specific (less intense than dark)
    },

    blendMode: {
      normal: 'normal',
      screen: 'screen',
      softLight: 'soft-light',
      multiply: 'multiply', // Better for light backgrounds
      overlay: 'overlay',
      gradient: 'normal', // Phase 4.5: No blend mode needed for light theme
      noise: 'multiply', // Phase 4.5: Multiply darkens noise texture
    },

    saturation: {
      default: '100%',
      enhanced: '110%', // Reduced from 130%
      high: '120%', // Reduced from 150%
    },
  },

  // ===========================================================================
  // Animation System (reuse from Jelly)
  // ===========================================================================
  animations: {
    bgDrift: {
      keyframes: {
        '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
        '100%': { transform: 'translate3d(-12px, -18px, 0) scale(1.05)' },
      },
      duration: '28s',
      timing: 'ease-in-out',
      iteration: 'infinite',
      direction: 'alternate',
    },

    shineSweep: {
      keyframes: {
        '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
        '100%': { transform: 'translateX(200%) skewX(-15deg)' },
      },
      duration: '1.2s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
    },

    screenIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'scale(0.98)' },
        '100%': { opacity: 1, transform: 'scale(1)' },
      },
      duration: '0.6s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
    },

    cardIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(12px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      duration: '0.4s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
    },

    progressShift: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '200% 50%' },
      },
      duration: '2.5s',
      timing: 'linear',
      iteration: 'infinite',
    },

    statFlow: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '200% 50%' },
      },
      duration: '3s',
      timing: 'linear',
      iteration: 'infinite',
    },

    staggerDelay: '40ms',
  },

  // ===========================================================================
  // Component Tokens
  // ===========================================================================
  components: {
    // Button Tokens
    button: {
      primary: {
        background: '#2563eb',
        backgroundHover: '#1d4ed8',
        backgroundActive: '#1e40af',
        text: '#ffffff',
        border: 'transparent',
        backgroundDisabled: 'rgba(37, 99, 235, 0.3)',
        textDisabled: 'rgba(255, 255, 255, 0.6)',
      },
      secondary: {
        background: '#f3f4f6',
        backgroundHover: '#e5e7eb',
        backgroundActive: '#d1d5db',
        text: '#0a0a0f',
        border: 'rgba(10, 10, 15, 0.12)',
        backgroundDisabled: 'rgba(243, 244, 246, 0.5)',
        textDisabled: 'rgba(10, 10, 15, 0.4)',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: 'rgba(10, 10, 15, 0.05)',
        backgroundActive: 'rgba(10, 10, 15, 0.1)',
        text: '#0a0a0f',
        border: 'rgba(10, 10, 15, 0.2)',
      },
      hot: {
        background: 'linear-gradient(120deg, #ff6b3d, #ff8f5d)',
        backgroundHover: '#ff7d4d',
        backgroundActive: '#ff8f5d',
        text: '#ffffff',
        border: 'transparent',
        shadow:
          '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(255, 107, 61, 0.3)',
      },
      cold: {
        background: 'linear-gradient(120deg, #3dd5ff, #5de5ff)',
        backgroundHover: '#4dddff',
        backgroundActive: '#5de5ff',
        text: '#0a0a0f',
        border: 'transparent',
        shadow:
          '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(61, 213, 255, 0.3)',
      },
      danger: {
        background: '#dc2626',
        backgroundHover: '#b91c1c',
        backgroundActive: '#991b1b',
        text: '#ffffff',
        border: 'transparent',
      },
    },

    // Input Tokens
    input: {
      background: 'rgba(255, 255, 255, 0.9)',
      backgroundHover: 'rgba(255, 255, 255, 0.95)',
      backgroundFocus: 'rgba(255, 255, 255, 1)',
      text: '#0a0a0f',
      placeholder: 'rgba(74, 74, 96, 0.5)',
      border: 'rgba(10, 10, 15, 0.12)',
      borderHover: 'rgba(10, 10, 15, 0.2)',
      borderFocus: '#2563eb',
      borderError: 'rgba(220, 38, 38, 0.6)',
      borderSuccess: '#059669',
    },

    // Card Tokens
    card: {
      background: 'rgba(255, 255, 255, 0.9)',
      backgroundHover: 'rgba(255, 255, 255, 1)',
      border: 'rgba(10, 10, 15, 0.08)',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },

    // Badge Tokens
    badge: {
      default: {
        background: '#f3f4f6',
        text: '#0a0a0f',
        border: 'rgba(10, 10, 15, 0.12)',
      },
      hot: {
        background: 'rgba(255, 107, 61, 0.12)',
        text: '#c44820',
        border: 'rgba(255, 107, 61, 0.3)',
      },
      cold: {
        background: 'rgba(61, 213, 255, 0.12)',
        text: '#1a7a9a',
        border: 'rgba(61, 213, 255, 0.3)',
      },
      success: {
        background: 'rgba(5, 150, 105, 0.12)',
        text: '#047857',
        border: 'rgba(5, 150, 105, 0.3)',
      },
      error: {
        background: 'rgba(220, 38, 38, 0.12)',
        text: '#b91c1c',
        border: 'rgba(220, 38, 38, 0.3)',
      },
      warning: {
        background: 'rgba(217, 119, 6, 0.12)',
        text: '#b45309',
        border: 'rgba(217, 119, 6, 0.3)',
      },
      info: {
        background: 'rgba(37, 99, 235, 0.12)',
        text: '#1d4ed8',
        border: 'rgba(37, 99, 235, 0.3)',
      },
      dashedHot: {
        background: 'transparent',
        text: '#c44820',
        border: 'rgba(255, 107, 61, 0.4)',
      },
      dashedCold: {
        background: 'transparent',
        text: '#1a7a9a',
        border: 'rgba(61, 213, 255, 0.4)',
      },
    },

    // Chart Tokens
    chart: {
      semantic: {
        cpu: '#f97316', // Orange
        memory: '#06b6d4', // Cyan
        running: '#10b981', // Green
        queued: '#3b82f6', // Blue
        completed: '#06b6d4', // Cyan
        failed: '#ef4444', // Red
        transferSpeed: '#10b981', // Green
        poolUsed: '#f97316', // Orange
        poolFree: '#06b6d4', // Cyan
      },
      series: [
        '#f97316',
        '#06b6d4',
        '#10b981',
        '#3b82f6',
        '#ef4444',
        '#8b5cf6',
        '#ec4899',
      ],
      grid: '#e5e7eb', // Light gray grid
      axis: '#9ca3af', // Medium gray axis
      gradients: {
        cpu: {
          start: '#f97316',
          end: '#f97316',
          startOpacity: 0.4, // Reduced from 0.8
          endOpacity: 0.05, // Reduced from 0.1
        },
        memory: {
          start: '#06b6d4',
          end: '#06b6d4',
          startOpacity: 0.4,
          endOpacity: 0.05,
        },
      },
      tooltip: {
        background: '#ffffff',
        text: '#0a0a0f',
        border: '#e5e7eb',
      },
    },

    // Progress Bar Tokens
    progressBar: {
      background: 'rgba(10, 10, 15, 0.08)',
      fill: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
      height: '4px',
    },

    // Search Input Tokens
    searchInput: {
      background: 'rgba(248, 248, 250, 0.95)',
      border: 'rgba(10, 10, 15, 0.12)',
      iconOpacity: '0.5',
    },

    // Navigation Link Tokens
    navigationLink: {
      background: 'rgba(248, 248, 250, 0.8)',
      backgroundHover: 'rgba(248, 248, 250, 1)',
      backgroundActive:
        'linear-gradient(120deg, rgba(61, 213, 255, 0.08), rgba(255, 107, 61, 0.1)), rgba(255, 255, 255, 0.95)',
      border: 'rgba(10, 10, 15, 0.12)',
      borderActive: 'rgba(10, 10, 15, 0.35)',
      text: '#4a4a60',
      textActive: '#0a0a0f',
    },

    // Media Thumbnail Tokens
    mediaThumb: {
      borderGradient:
        'conic-gradient(from 200deg, rgba(61, 213, 255, 0.7), rgba(255, 107, 61, 0.65), rgba(255, 76, 237, 0.6), rgba(61, 213, 255, 0.7))',
      innerBackground:
        'radial-gradient(circle at 0 0, rgba(255, 255, 255, 0.3), transparent 60%), rgba(248, 250, 252, 0.95)',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      labelGradient: 'linear-gradient(120deg, #1a7a9a, #c44820)',
    },

    // Scrollbar Tokens
    scrollbar: {
      track: 'transparent',
      thumb: 'linear-gradient(180deg, #3dd5ff, #ff6b3d)',
      width: '6px',
    },

    // Panel Tokens
    panel: {
      base: {
        background:
          'radial-gradient(circle at top left, rgba(61, 213, 255, 0.06), transparent 65%), radial-gradient(circle at bottom right, rgba(255, 107, 61, 0.04), transparent 65%), rgba(255, 255, 255, 0.9)',
        border: 'rgba(10, 10, 15, 0.06)',
        shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      statsMini: {
        background:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.08), transparent 60%), rgba(250, 251, 252, 0.95)',
        border: 'rgba(10, 10, 15, 0.12)',
      },
      statsCard: {
        background:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.07), transparent 65%), radial-gradient(circle at 100% 100%, rgba(255, 107, 61, 0.06), transparent 60%), rgba(255, 255, 255, 0.9)',
        border: 'rgba(10, 10, 15, 0.06)',
        shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
}
