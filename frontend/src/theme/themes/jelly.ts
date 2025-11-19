/**
 * Jelly Theme - Default Dark Theme for JellyMover
 *
 * This theme represents the current production design of JellyMover with its
 * cyberpunk CLI aesthetic, glassmorphism effects, and hot/cold color scheme.
 *
 * All values are extracted from the actual implementation in styles.css
 * and component files. This ensures 100% visual fidelity to the current design.
 *
 * Design Philosophy:
 * - "Terminal/CLI aesthetic but pretty"
 * - Deep space navy backgrounds
 * - Hot (fire/orange) vs Cold (ice/cyan) dichotomy
 * - Glassmorphism with layered gradients
 * - Animated effects and smooth transitions
 * - Uppercase typography for technical feel
 */

import type { Theme } from '../types'

/**
 * Complete Jelly theme object
 * All design tokens for the default JellyMover appearance
 */
export const jellyTheme: Theme = {
  // ===========================================================================
  // Theme Metadata
  // ===========================================================================
  meta: {
    key: 'jelly',
    name: 'Jelly',
    description: 'Dark theme with cyberpunk CLI aesthetic and glassmorphism',
    isDark: true,
    logoTagline: 'FIRE ∧ ICE',
  },

  // ===========================================================================
  // Color System
  // ===========================================================================
  colors: {
    // Background Colors
    background: {
      main: '#020014', // Deep space navy - main background
      panel: 'rgba(5, 5, 20, 0.96)', // Semi-transparent panel background
      overlay: 'rgba(2, 0, 20, 0.8)', // Modal/dialog overlay
      secondary: 'rgba(7, 7, 24, 0.96)', // Secondary surfaces
      tertiary: 'rgba(10, 10, 30, 0.96)', // Tertiary surfaces

      // Phase 4.4: Gradient support for body background
      mainGradientStart: '#071428', // Top-left gradient start (lighter navy)
      mainGradientEnd: '#030014', // Bottom-right gradient end (darker navy)

      // Phase 4.5: Component-specific backgrounds
      inputSearch: 'rgba(10, 12, 35, 0.96)', // Search input dark background
      chip: 'rgba(7, 7, 24, 0.92)', // Chip/tag background
      queueItem: 'rgba(5, 5, 20, 0.96)', // Queue item background
      statsBox: 'rgba(4, 8, 27, 0.96)', // Stats box background
      poolTag: 'rgba(7, 10, 28, 0.96)', // Pool tag background
      controls: 'rgba(6, 8, 24, 0.96)', // Controls panel background
      navBtn: 'rgba(7, 7, 24, 0.92)', // Navigation button background
      navBtnActive: 'rgba(10, 15, 35, 0.98)', // Active nav button background
      terminalHeader: 'rgba(6, 8, 25, 0.96)', // Terminal header background
      statsMini: 'rgba(4, 8, 27, 0.96)', // Mini stats widget background
      mediaThumbInner: 'rgba(1, 3, 20, 0.96)', // Media thumbnail inner background
      progressTrack: 'rgba(255, 255, 255, 0.08)', // Progress bar track
      scrollbarTrack: 'rgba(255, 255, 255, 0.03)', // Scrollbar track
      scrollbarThumb: 'rgba(255, 255, 255, 0.18)', // Scrollbar thumb
      scrollbarThumbHover: 'rgba(255, 255, 255, 0.28)', // Scrollbar thumb hover

      // Background noise texture (SVG)
      noiseTexture:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.16'/%3E%3C/svg%3E\")",
      noiseOpacity: '0.5',
      noiseBlendMode: 'soft-light',
    },

    // Text Colors
    text: {
      primary: '#f7f7ff', // Near white with blue tint
      secondary: '#9ea1c9', // Lavender gray
      tertiary: '#70739b', // Muted purple-gray
      disabled: 'rgba(255, 255, 255, 0.3)',
      inverted: '#020014',
      hotAccent: '#ffb199', // Text on hot backgrounds
      coldAccent: '#a7ebff', // Text on cold backgrounds
      success: '#7fffd4', // Aquamarine
      error: '#ffb199', // Coral pink
    },

    // Accent Colors
    accent: {
      hot: '#ff6b3d', // Fire/SSD - primary hot accent
      hotSoft: 'rgba(255, 107, 61, 0.28)', // Hot with transparency
      cold: '#3dd5ff', // Ice/HDD - primary cold accent
      coldSoft: 'rgba(61, 213, 255, 0.28)', // Cold with transparency
      magenta: '#ff4ced', // Tertiary accent for progress/effects
      primary: '#4a90e2', // Generic primary
      secondary: '#8b5cf6', // Purple
      hotGradientEnd: '#ffd07a', // End color for hot button gradients
      coldGradientEnd: '#aef4ff', // End color for cold button gradients
    },

    // Semantic Colors
    semantic: {
      success: '#7fffd4', // Aquamarine
      error: '#ffb199', // Coral pink
      warning: '#febc2e', // Yellow
      info: '#3b82f6', // Blue
    },

    // Border Colors (Granular opacity levels)
    border: {
      white06: 'rgba(255, 255, 255, 0.06)', // Subtle panel borders
      white08: 'rgba(255, 255, 255, 0.08)', // Cards, standard borders
      white12: 'rgba(255, 255, 255, 0.12)', // Emphasized, badges
      white14: 'rgba(255, 255, 255, 0.14)', // Pool tags
      white16: 'rgba(255, 255, 255, 0.16)', // Chips
      white18: 'rgba(255, 255, 255, 0.18)', // Pills, status indicators
      white22: 'rgba(255, 255, 255, 0.22)', // Active buttons
      white25: 'rgba(255, 255, 255, 0.25)', // Dashed borders
      white45: 'rgba(255, 255, 255, 0.45)', // Active nav links
    },

    // Interaction Colors
    interaction: {
      hover: 'rgba(255, 255, 255, 0.08)',
      active: 'rgba(255, 255, 255, 0.15)',
      focus: '#4a90e2',
      selected: 'rgba(74, 144, 226, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.05)',
    },

    // Gradients
    gradients: {
      // Simple gradients
      primary: 'linear-gradient(135deg, #3dd5ff 0%, #ff6b3d 100%)', // Cold to hot
      secondary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Purple to pink

      // Button gradients
      button: {
        hot: 'linear-gradient(120deg, #ff6b3d, #ffd07a)',
        cold: 'linear-gradient(120deg, #3dd5ff, #aef4ff)',
        primary: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
      },

      // Progress/flow gradients
      progress: {
        bar: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)', // Tri-color
        stat: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
      },

      // Scrollbar gradient
      scrollbar: 'linear-gradient(180deg, #3dd5ff, #ff6b3d)',

      // Text gradients
      text: {
        logo: 'linear-gradient(120deg, #3dd5ff, #ff6b3d)',
        accent: 'linear-gradient(120deg, #3dd5ff, #ff6b3d)',
      },

      // Effect gradients
      effects: {
        shine:
          'linear-gradient(110deg, transparent 0, rgba(255, 255, 255, 0.13) 45%, transparent 55%)',
        hoverGlow: 'radial-gradient(circle at 0 0, rgba(255, 255, 255, 0.12), transparent 55%)',
      },

      // Conic gradient
      conic: {
        mediaThumb:
          'conic-gradient(from 200deg, rgba(61, 213, 255, 0.9), rgba(255, 107, 61, 0.85), rgba(255, 76, 237, 0.76), rgba(61, 213, 255, 0.9))',
        mediaThumbInner:
          'radial-gradient(circle at 0 0, rgba(0, 0, 0, 0.42), transparent 60%)',
      },

      // Phase 4.5: Panel gradients
      panel: {
        base:
          'radial-gradient(circle at top left, rgba(61, 213, 255, 0.12), transparent 65%), radial-gradient(circle at bottom right, rgba(255, 107, 61, 0.08), transparent 65%)',
        topBar: 'none', // Top bar uses solid color + shine effect
        terminalHeader:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.08), transparent 60%)',
        statsMini:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.16), transparent 60%)',
        controls:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.1), transparent 60%)',
        queueItem:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.06), transparent 65%)',
        navActive:
          'linear-gradient(120deg, rgba(61, 213, 255, 0.18), rgba(255, 107, 61, 0.2))',
      },
    },

    // Window Dots (macOS-style)
    windowDots: {
      default: '#3a3a55',
      red: '#ff5f57',
      yellow: '#febc2e',
      green: '#28c840',
    },
  },

  // ===========================================================================
  // Typography System
  // ===========================================================================
  typography: {
    fontFamily: {
      ui: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      mono: '"SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      display: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    },

    fontSize: {
      xs: '0.62rem', // Tiny pills, badges
      sm: '0.7rem', // Small UI elements
      base: '0.9rem', // Body text
      md: '1rem', // Medium text
      lg: '1.2rem', // Large headers
      xl: '1.5rem', // Extra large
      '2xl': '1.75rem', // 2X large
      '3xl': '2rem', // Page headers
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    letterSpacing: {
      tighter: '0.02em',
      tight: '0.08em',
      normal: '0.14em',
      wide: '0.18em',
      wider: '0.22em',
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
  },

  // ===========================================================================
  // Spacing System
  // ===========================================================================
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem', // App shell padding
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },

  // ===========================================================================
  // Border Radius System
  // ===========================================================================
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.8rem', // Jelly uses 0.8rem instead of 0.5rem
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    full: '999px', // Pills/buttons
  },

  // ===========================================================================
  // Shadow System
  // ===========================================================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 30px rgba(0, 0, 0, 0.7)', // --shadow-soft
    xl: '0 24px 60px rgba(0, 0, 0, 0.8)', // --shadow-deep
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // ===========================================================================
  // Transition System
  // ===========================================================================
  transitions: {
    duration: {
      instant: '0ms',
      fast: '0.15s',
      normal: '0.2s',
      slow: '0.35s',
      slower: '0.4s',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      custom: 'cubic-bezier(0.21, 0.96, 0.41, 1)', // Card in animation
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // ===========================================================================
  // Effects System
  // ===========================================================================
  effects: {
    blur: {
      none: '0',
      sm: '4px',
      md: '8px', // Glass light
      lg: '18px', // Glass medium
      xl: '24px', // Glass heavy
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
      glassMedium: 'blur(18px) saturate(130%)', // Top bar
      glassHeavy: 'blur(24px) saturate(150%)',
      header: 'blur(12px) saturate(1.5)', // Phase 4.5: Header specific
    },

    blendMode: {
      normal: 'normal',
      screen: 'screen', // Background gradient
      softLight: 'soft-light', // Background noise
      multiply: 'multiply',
      overlay: 'overlay',
      gradient: 'screen', // Phase 4.5: For .bg-gradient overlay
      noise: 'overlay', // Phase 4.5: For noise texture
    },

    saturation: {
      default: '100%',
      enhanced: '130%', // Backdrop filter
      high: '150%',
    },
  },

  // ===========================================================================
  // Animation System
  // ===========================================================================
  animations: {
    // Background gradient drift (28s infinite alternate)
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

    // Shine sweep animation (6s infinite)
    shineSweep: {
      keyframes: {
        '0%, 60%': { opacity: '0', transform: 'translateX(-60%)' },
        '70%': { opacity: '1', transform: 'translateX(0%)' },
        '100%': { opacity: '0', transform: 'translateX(60%)' },
      },
      duration: '6s',
      iteration: 'infinite',
    },

    // Screen entrance animation (0.35s)
    screenIn: {
      keyframes: {
        from: { opacity: '0', transform: 'translateY(6px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      duration: '0.35s',
      timing: 'ease-out',
    },

    // Card entrance animation (0.32s with stagger)
    cardIn: {
      keyframes: {
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      duration: '0.32s',
      timing: 'cubic-bezier(0.21, 0.96, 0.41, 1)',
      fillMode: 'forwards',
    },

    // Progress bar shift (1.4s infinite)
    progressShift: {
      keyframes: {
        '0%': { backgroundPosition: '0 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      duration: '1.4s',
      timing: 'linear',
      iteration: 'infinite',
    },

    // Stat bar flow (1.6s infinite)
    statFlow: {
      keyframes: {
        '0%': { backgroundPosition: '0 0' },
        '100%': { backgroundPosition: '160% 0' },
      },
      duration: '1.6s',
      timing: 'linear',
      iteration: 'infinite',
    },

    // Stagger delay for list animations
    staggerDelay: '40ms',
  },

  // ===========================================================================
  // Component Tokens
  // ===========================================================================
  components: {
    // Button Tokens
    button: {
      primary: {
        background: '#4a90e2',
        backgroundHover: '#5aa0f2',
        backgroundActive: '#6ab0ff',
        text: '#ffffff',
        border: 'transparent',
        backgroundDisabled: 'rgba(74, 144, 226, 0.3)',
        textDisabled: 'rgba(255, 255, 255, 0.5)',
      },
      secondary: {
        background: '#2a2a2a',
        backgroundHover: '#3a3a3a',
        backgroundActive: '#4a4a4a',
        text: '#f7f7ff',
        border: 'rgba(255, 255, 255, 0.12)',
        backgroundDisabled: 'rgba(42, 42, 42, 0.5)',
        textDisabled: 'rgba(247, 247, 255, 0.5)',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: 'rgba(255, 255, 255, 0.08)',
        backgroundActive: 'rgba(255, 255, 255, 0.15)',
        text: '#f7f7ff',
        border: 'rgba(255, 255, 255, 0.25)',
      },
      hot: {
        background: 'linear-gradient(120deg, #ff6b3d, #ffd07a)',
        backgroundHover: '#ff7d4d',
        backgroundActive: '#ff8f5d',
        text: '#02000f',
        border: 'transparent',
        shadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.7)',
      },
      cold: {
        background: 'linear-gradient(120deg, #3dd5ff, #aef4ff)',
        backgroundHover: '#4dddff',
        backgroundActive: '#5de5ff',
        text: '#02000f',
        border: 'transparent',
        shadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.7)',
      },
      danger: {
        background: '#ef4444',
        backgroundHover: '#f87171',
        backgroundActive: '#f59e9e',
        text: '#ffffff',
        border: 'transparent',
      },
    },

    // Input Tokens
    input: {
      background: 'rgba(7, 8, 25, 0.96)',
      backgroundHover: 'rgba(7, 8, 25, 0.92)',
      backgroundFocus: 'rgba(7, 8, 25, 1)',
      text: '#f7f7ff',
      placeholder: 'rgba(158, 161, 201, 0.6)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
      borderFocus: '#4a90e2',
      borderError: 'rgba(255, 107, 61, 0.6)',
      borderSuccess: '#7fffd4',
    },

    // Card Tokens
    card: {
      background: 'rgba(10, 10, 30, 0.96)',
      backgroundHover: 'rgba(10, 10, 30, 1)',
      border: 'rgba(255, 255, 255, 0.08)',
      shadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
    },

    // Badge Tokens
    badge: {
      default: {
        background: '#2a2a2a',
        text: '#f7f7ff',
        border: 'rgba(255, 255, 255, 0.12)',
      },
      hot: {
        background: 'rgba(255, 107, 61, 0.28)',
        text: '#ffb199',
        border: 'rgba(255, 107, 61, 0.28)',
      },
      cold: {
        background: 'rgba(61, 213, 255, 0.28)',
        text: '#a7ebff',
        border: 'rgba(61, 213, 255, 0.28)',
      },
      success: {
        background: 'rgba(16, 185, 129, 0.2)',
        text: '#7fffd4',
        border: 'rgba(16, 185, 129, 0.3)',
      },
      error: {
        background: 'rgba(239, 68, 68, 0.2)',
        text: '#ffb199',
        border: 'rgba(239, 68, 68, 0.3)',
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.2)',
        text: '#febc2e',
        border: 'rgba(245, 158, 11, 0.3)',
      },
      info: {
        background: 'rgba(59, 130, 246, 0.2)',
        text: '#3b82f6',
        border: 'rgba(59, 130, 246, 0.3)',
      },
      dashedHot: {
        background: 'transparent',
        text: '#ffb199',
        border: 'rgba(255, 107, 61, 0.28)',
      },
      dashedCold: {
        background: 'transparent',
        text: '#a7ebff',
        border: 'rgba(61, 213, 255, 0.28)',
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
      series: ['#f97316', '#06b6d4', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'],
      grid: '#333333',
      axis: '#888888',
      gradients: {
        cpu: { start: '#f97316', end: '#f97316', startOpacity: 0.8, endOpacity: 0.1 },
        memory: { start: '#06b6d4', end: '#06b6d4', startOpacity: 0.8, endOpacity: 0.1 },
      },
      tooltip: {
        background: '#1a1a1a',
        text: '#ffffff',
        border: '#333333',
      },
    },

    // Progress Bar Tokens
    progressBar: {
      background: 'rgba(255, 255, 255, 0.08)',
      fill: 'linear-gradient(90deg, #3dd5ff, #ff6b3d, #ff4ced)',
      height: '4px',
    },

    // Search Input Tokens
    searchInput: {
      background: 'rgba(10, 12, 35, 0.96)',
      border: 'rgba(255, 255, 255, 0.12)',
      iconOpacity: '0.7',
    },

    // Navigation Link Tokens
    navigationLink: {
      background: 'rgba(7, 7, 24, 0.92)',
      backgroundHover: 'rgba(7, 7, 24, 1)',
      backgroundActive:
        'linear-gradient(120deg, rgba(61, 213, 255, 0.18), rgba(255, 107, 61, 0.2)), rgba(10, 15, 35, 0.98)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderActive: 'rgba(255, 255, 255, 0.45)',
      text: '#9ea1c9',
      textActive: '#f7f7ff',
    },

    // Media Thumb Tokens
    mediaThumb: {
      borderGradient:
        'conic-gradient(from 200deg, rgba(61, 213, 255, 0.9), rgba(255, 107, 61, 0.85), rgba(255, 76, 237, 0.76), rgba(61, 213, 255, 0.9))',
      innerBackground: 'radial-gradient(circle at 0 0, rgba(0, 0, 0, 0.42), transparent 60%), rgba(1, 3, 20, 0.96)',
      shadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
      labelGradient: 'linear-gradient(120deg, #3dd5ff, #ff6b3d)',
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
          'radial-gradient(circle at top left, rgba(61, 213, 255, 0.12), transparent 65%), radial-gradient(circle at bottom right, rgba(255, 107, 61, 0.08), transparent 65%), rgba(5, 5, 20, 0.96)',
        border: 'rgba(255, 255, 255, 0.06)',
        shadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      },
      statsMini: {
        background: 'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.16), transparent 60%), rgba(4, 8, 27, 0.96)',
        border: 'rgba(255, 255, 255, 0.12)',
      },
      statsCard: {
        background:
          'radial-gradient(circle at 0 0, rgba(61, 213, 255, 0.13), transparent 65%), radial-gradient(circle at 100% 100%, rgba(255, 107, 61, 0.11), transparent 60%), rgba(5, 5, 20, 0.96)',
        border: 'rgba(255, 255, 255, 0.06)',
        shadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      },
    },
  },
}
