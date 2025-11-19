/**
 * Dark Theme - Minimal High-Contrast PRO MODE for JellyMover
 *
 * This theme provides a focused, minimal dark mode optimized for long work
 * sessions and late-night coding. Maximum contrast, zero distractions.
 *
 * Design Philosophy:
 * - "PRO MODE" - Ruthless clarity and focus
 * - Inky black backgrounds (not grey)
 * - Bold white text for maximum contrast
 * - Single electric blue accent (no visual noise)
 * - No decorative gradients (crisp edges)
 * - Minimal effects and animations
 * - Professional Inter typography
 * - Terminal/dashboard aesthetic
 *
 * Inspiration: VS Code Dark+, GitHub dark mode, modern IDEs
 *
 * Key Differences from Jelly/Light:
 * - Inky black (#0a0a0a) vs navy/white
 * - Single accent (blue) vs multi-accent
 * - No gradients (except functional)
 * - Tightest letter spacing (0em)
 * - Fastest transitions (120-200ms)
 * - No decorative animations
 */

import type { Theme } from '../types'

/**
 * Complete Dark theme object
 * PRO MODE - Minimal high-contrast for focused work
 */
export const darkTheme: Theme = {
  // ===========================================================================
  // Theme Metadata
  // ===========================================================================
  meta: {
    key: 'dark',
    name: 'Dark',
    description: 'Minimal high-contrast dark theme for focused work',
    isDark: true,
    logoTagline: 'PRO MODE', // Positions Dark as serious work theme
  },

  // ===========================================================================
  // Color System
  // ===========================================================================
  colors: {
    // Background Colors - Inky blacks (not grey)
    background: {
      main: '#0a0a0a', // Inky black - true "lights off" experience
      panel: 'rgba(13, 13, 13, 0.98)', // Near-black panels, slight transparency
      overlay: 'rgba(10, 10, 10, 0.95)', // Modal overlays
      secondary: 'rgba(15, 15, 15, 0.98)', // Secondary surfaces
      tertiary: 'rgba(18, 18, 18, 0.98)', // Tertiary surfaces

      // Phase 4.4: No gradients for minimal dark theme (keep solid black)
      mainGradientStart: '#0a0a0a', // Same as main for solid background
      mainGradientEnd: '#0a0a0a', // Same as main for solid background

      // Phase 4.5: Component-specific backgrounds (dark theme - solid greys, no fancy effects)
      inputSearch: 'rgba(18, 18, 18, 0.98)', // Search input dark grey
      chip: 'rgba(20, 20, 20, 0.95)', // Chip background
      queueItem: 'rgba(13, 13, 13, 0.98)', // Queue item near-black
      statsBox: 'rgba(15, 15, 15, 0.98)', // Stats box dark grey
      poolTag: 'rgba(18, 18, 18, 0.98)', // Pool tag
      controls: 'rgba(15, 15, 15, 0.98)', // Controls panel
      navBtn: 'rgba(13, 13, 13, 0.95)', // Navigation button
      navBtnActive: 'rgba(14, 165, 233, 0.1)', // Active nav with blue tint
      terminalHeader: 'rgba(13, 13, 13, 0.98)', // Terminal header
      statsMini: 'rgba(15, 15, 15, 0.98)', // Mini stats widget
      mediaThumbInner: 'rgba(13, 13, 13, 0.98)', // Media thumbnail inner
      progressTrack: 'rgba(255, 255, 255, 0.08)', // Progress bar track
      scrollbarTrack: 'rgba(255, 255, 255, 0.03)', // Scrollbar track
      scrollbarThumb: 'rgba(14, 165, 233, 0.8)', // Scrollbar thumb (electric blue)
      scrollbarThumbHover: '#0ea5e9', // Scrollbar thumb hover (solid blue)

      // No noise texture - keep it clean
      noiseTexture: undefined,
      noiseOpacity: undefined,
      noiseBlendMode: undefined,
    },

    // Text Colors - Bold whites and neutral greys
    text: {
      primary: '#ffffff', // Pure white - maximum contrast (19.3:1 AAA)
      secondary: '#a8a8a8', // Medium grey for secondary text (9.8:1 AAA)
      tertiary: '#6b6b6b', // Darker grey for tertiary/muted (5.2:1 AA)
      disabled: 'rgba(255, 255, 255, 0.25)', // Disabled text
      inverted: '#0a0a0a', // For light-on-dark scenarios
      hotAccent: '#ff8f6b', // Softer hot for readability on dark
      coldAccent: '#6dd5ff', // Softer cold for readability on dark
      success: '#4ade80', // Green-400 for success text
      error: '#f87171', // Red-400 for error text
    },

    // Accent Colors - Single electric blue for focus
    accent: {
      // PRIMARY ACCENT - Electric Blue (only accent used in UI)
      primary: '#0ea5e9', // Sky-500 - electric blue (6.8:1 AA)
      primarySoft: 'rgba(14, 165, 233, 0.15)', // Soft background variant
      primaryBright: '#38bdf8', // Sky-400 - brighter variant for hover

      // HOT/COLD - Preserved for data visualization only (not decorative)
      hot: '#ff6b3d', // Only used in charts/pools
      hotSoft: 'rgba(255, 107, 61, 0.15)',
      cold: '#3dd5ff', // Only used in charts/pools
      coldSoft: 'rgba(61, 213, 255, 0.15)',

      // Minimal theme: magenta and secondary use primary blue, gradients same as base colors
      magenta: '#0ea5e9', // Use primary blue for minimal design consistency
      secondary: '#0ea5e9', // Use primary blue
      hotGradientEnd: '#ff6b3d', // No gradients - same as hot for solid buttons
      coldGradientEnd: '#3dd5ff', // No gradients - same as cold for solid buttons
    },

    // Semantic Colors - Vivid but not neon
    semantic: {
      success: '#10b981', // Emerald-500 (vivid on black)
      error: '#ef4444', // Red-500 (clear, not scary)
      warning: '#f59e0b', // Amber-500 (visible on black)
      info: '#0ea5e9', // Same as primary accent
    },

    // Border Colors - Subtle but visible
    border: {
      white06: 'rgba(255, 255, 255, 0.06)', // Barely visible dividers
      white08: 'rgba(255, 255, 255, 0.08)', // Subtle panel borders
      white12: 'rgba(255, 255, 255, 0.12)', // Default borders
      white14: 'rgba(255, 255, 255, 0.14)', // Cards
      white16: 'rgba(255, 255, 255, 0.16)', // Emphasized
      white18: 'rgba(255, 255, 255, 0.18)', // Inputs
      white22: 'rgba(255, 255, 255, 0.22)', // Active states
      white25: 'rgba(255, 255, 255, 0.25)', // Strong borders
      white45: 'rgba(255, 255, 255, 0.45)', // Active navigation
    },

    // Interaction Colors - Minimal feedback
    interaction: {
      hover: 'rgba(255, 255, 255, 0.05)', // Barely-there hover
      active: 'rgba(255, 255, 255, 0.1)', // Subtle active
      focus: '#0ea5e9', // Electric blue focus ring
      selected: 'rgba(14, 165, 233, 0.15)', // Blue selection
      disabled: 'rgba(255, 255, 255, 0.03)', // Disabled bg
    },

    // Gradients - Minimal (only functional, NOT decorative)
    gradients: {
      // NO primary/secondary gradients
      primary: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', // Use simple blue gradient
      secondary: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',

      // Button gradients - NO gradients for buttons
      button: {
        hot: '#ff6b3d',
        cold: '#3dd5ff',
        primary: '#0ea5e9',
      },

      // Progress bars - Simple blue gradient
      progress: {
        bar: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', // Blue gradient
        stat: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
      },

      // Scrollbar - Solid blue (not gradient)
      scrollbar: '#0ea5e9',

      // Text gradients - NONE (keep text solid)
      text: {
        logo: 'linear-gradient(90deg, #ffffff, #ffffff)', // Solid white logo
        accent: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
      },

      // Effects - Minimal
      effects: {
        shine: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)', // Minimal shine
        hoverGlow:
          'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.1), transparent 70%)',
      },

      // No conic gradients
      conic: {
        mediaThumb: 'conic-gradient(from 0deg, #0ea5e9, #0ea5e9)',
        mediaThumbInner:
          'radial-gradient(circle at 0 0, rgba(14, 165, 233, 0.15), transparent 60%)', // Subtle blue glow
      },

      // Phase 4.5: Panel gradients (dark theme - NO decorative gradients, solid backgrounds only)
      panel: {
        base: 'none', // Solid backgrounds, no gradients
        topBar: 'none', // Keep it clean
        terminalHeader: 'none', // No effects
        statsMini: 'none',
        controls: 'none',
        queueItem: 'none',
        navActive: 'none', // Active state uses solid blue tint from background color
      },
    },

    // Window Dots
    windowDots: {
      default: '#404040', // Dark grey (subtle on black)
      red: '#ef4444', // Red-500
      yellow: '#f59e0b', // Amber-500
      green: '#10b981', // Emerald-500
    },
  },

  // ===========================================================================
  // Typography System - Inter for professional look
  // ===========================================================================
  typography: {
    fontFamily: {
      // Inter for professional, readable UI
      ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

      // JetBrains Mono for technical/code elements
      mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Monaco, monospace',

      // Same as UI for consistency
      display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    fontSize: {
      xs: '0.6875rem', // 11px
      sm: '0.8125rem', // 13px
      base: '0.9375rem', // 15px - slightly larger for readability
      md: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.375rem', // 22px
      '2xl': '1.75rem', // 28px
      '3xl': '2.25rem', // 36px
    },

    fontWeight: {
      normal: 400, // Regular body text
      medium: 500, // Medium emphasis
      semibold: 600, // Headings, labels
      bold: 700, // Primary headings
      extrabold: 800, // Rare, only for hero text
    },

    // CRITICAL: Tightest spacing for maximum density
    letterSpacing: {
      tighter: '-0.02em', // Large headings
      tight: '-0.01em', // Headings
      normal: '0em', // DEFAULT - no extra spacing (tightest of all themes)
      wide: '0.02em', // Labels
      wider: '0.04em', // Small caps
      widest: '0.08em', // Use sparingly
    },

    lineHeight: {
      none: 1,
      tight: 1.35, // Headings
      normal: 1.6, // Body text
      relaxed: 1.75, // Comfortable reading
      loose: 2,
    },

    textTransform: {
      none: 'none', // DEFAULT - no uppercase by default
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
  // Border Radius - Sharper corners than Jelly
  // ===========================================================================
  radius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px (sharper than Jelly's 0.8rem)
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // ===========================================================================
  // Shadows System - Dark blacks + subtle glows
  // ===========================================================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.6)',
    md: '0 2px 4px 0 rgba(0, 0, 0, 0.7)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.8)', // Darker shadows on black
    xl: '0 8px 24px rgba(0, 0, 0, 0.9)', // Deep blacks
    '2xl': '0 12px 32px rgba(0, 0, 0, 0.95)',
    inner: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  },

  // ===========================================================================
  // Transitions - Faster, snappier
  // ===========================================================================
  transitions: {
    duration: {
      instant: '0ms',
      fast: '120ms', // Faster than Jelly (150ms)
      normal: '200ms', // Snappier than Jelly (250ms)
      slow: '300ms', // Faster than Jelly (350ms)
      slower: '450ms', // Faster than Jelly (500ms)
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      custom: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth modern easing
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // ===========================================================================
  // Effects System - Minimal blur, no saturation
  // ===========================================================================
  effects: {
    blur: {
      none: '0',
      sm: '2px', // Reduced from Jelly/Light
      md: '4px', // Minimal blur
      lg: '8px', // Use sparingly
      xl: '12px', // Rare
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
      glassLight: 'blur(4px)', // Minimal blur
      glassMedium: 'blur(8px) saturate(100%)', // No saturation boost
      glassHeavy: 'blur(12px) saturate(100%)', // Clean, no enhancement
      header: 'blur(6px) saturate(1)', // Phase 4.5: Header specific (minimal, no saturation)
    },

    blendMode: {
      normal: 'normal',
      screen: 'screen',
      softLight: 'soft-light',
      multiply: 'multiply',
      overlay: 'overlay',
      gradient: 'normal', // Phase 4.5: No special blend modes for dark theme
      noise: 'normal', // Phase 4.5: No noise texture in dark theme
    },

    saturation: {
      default: '100%', // No saturation boost
      enhanced: '100%', // Keep it neutral
      high: '100%',
    },
  },

  // ===========================================================================
  // Animation System - Remove decorative, keep functional
  // ===========================================================================
  animations: {
    // NO background drift - static backgrounds
    bgDrift: {
      keyframes: {},
      duration: '0ms',
    },

    // NO shine sweep - too decorative
    shineSweep: {
      keyframes: {},
      duration: '0ms',
    },

    // Screen entrance - keep for UX (faster)
    screenIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(8px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      duration: '0.25s', // Faster than Jelly
      timing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth ease
    },

    // Card entrance - keep for UX (faster)
    cardIn: {
      keyframes: {
        '0%': { opacity: 0, transform: 'translateY(6px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
      },
      duration: '0.2s', // Fast and snappy
      timing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },

    // Progress bar - simple shift
    progressShift: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '100% 50%' },
      },
      duration: '2s',
      timing: 'linear',
      iteration: 'infinite',
    },

    // Stat flow - simple
    statFlow: {
      keyframes: {
        '0%': { backgroundPosition: '0% 50%' },
        '100%': { backgroundPosition: '100% 50%' },
      },
      duration: '2.5s',
      timing: 'linear',
      iteration: 'infinite',
    },

    staggerDelay: '30ms', // Faster stagger
  },

  // ===========================================================================
  // Component Tokens
  // ===========================================================================
  components: {
    // Button Tokens
    button: {
      primary: {
        background: '#0ea5e9', // Electric blue
        backgroundHover: '#38bdf8', // Lighter blue
        backgroundActive: '#0284c7', // Darker blue
        text: '#ffffff',
        border: 'transparent',
        backgroundDisabled: 'rgba(14, 165, 233, 0.3)',
        textDisabled: 'rgba(255, 255, 255, 0.4)',
      },
      secondary: {
        background: '#1a1a1a', // Dark grey
        backgroundHover: '#242424',
        backgroundActive: '#2e2e2e',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.12)',
        backgroundDisabled: 'rgba(26, 26, 26, 0.5)',
        textDisabled: 'rgba(255, 255, 255, 0.3)',
      },
      ghost: {
        background: 'transparent',
        backgroundHover: 'rgba(255, 255, 255, 0.05)',
        backgroundActive: 'rgba(255, 255, 255, 0.1)',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.18)',
      },
      hot: {
        background: '#ff6b3d',
        backgroundHover: '#ff7d4f',
        backgroundActive: '#ff8f61',
        text: '#ffffff',
        border: 'transparent',
        shadow:
          '0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(255, 107, 61, 0.3)',
      },
      cold: {
        background: '#3dd5ff',
        backgroundHover: '#4dddff',
        backgroundActive: '#5de5ff',
        text: '#0a0a0a', // Black text on cyan
        border: 'transparent',
        shadow:
          '0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(61, 213, 255, 0.3)',
      },
      danger: {
        background: '#ef4444',
        backgroundHover: '#f87171',
        backgroundActive: '#dc2626',
        text: '#ffffff',
        border: 'transparent',
      },
    },

    // Input Tokens
    input: {
      background: 'rgba(18, 18, 18, 0.98)', // Slightly raised from bg
      backgroundHover: 'rgba(20, 20, 20, 0.98)',
      backgroundFocus: 'rgba(22, 22, 22, 1)',
      text: '#ffffff',
      placeholder: 'rgba(168, 168, 168, 0.5)', // Muted grey
      border: 'rgba(255, 255, 255, 0.12)',
      borderHover: 'rgba(255, 255, 255, 0.18)',
      borderFocus: '#0ea5e9', // Blue focus
      borderError: 'rgba(239, 68, 68, 0.6)',
      borderSuccess: '#10b981',
    },

    // Card Tokens
    card: {
      background: 'rgba(13, 13, 13, 0.98)', // Subtle elevation
      backgroundHover: 'rgba(15, 15, 15, 1)',
      border: 'rgba(255, 255, 255, 0.08)',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.8)', // Dark shadow
    },

    // Badge Tokens
    badge: {
      default: {
        background: '#1a1a1a',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.12)',
      },
      hot: {
        background: 'rgba(255, 107, 61, 0.15)',
        text: '#ff8f6b',
        border: 'rgba(255, 107, 61, 0.3)',
      },
      cold: {
        background: 'rgba(61, 213, 255, 0.15)',
        text: '#6dd5ff',
        border: 'rgba(61, 213, 255, 0.3)',
      },
      success: {
        background: 'rgba(16, 185, 129, 0.15)',
        text: '#4ade80',
        border: 'rgba(16, 185, 129, 0.3)',
      },
      error: {
        background: 'rgba(239, 68, 68, 0.15)',
        text: '#f87171',
        border: 'rgba(239, 68, 68, 0.3)',
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.15)',
        text: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.3)',
      },
      info: {
        background: 'rgba(14, 165, 233, 0.15)',
        text: '#38bdf8',
        border: 'rgba(14, 165, 233, 0.3)',
      },
      dashedHot: {
        background: 'transparent',
        text: '#ff8f6b',
        border: 'rgba(255, 107, 61, 0.4)',
      },
      dashedCold: {
        background: 'transparent',
        text: '#6dd5ff',
        border: 'rgba(61, 213, 255, 0.4)',
      },
    },

    // Chart Tokens
    chart: {
      semantic: {
        cpu: '#f97316', // Orange (warm)
        memory: '#06b6d4', // Cyan (cool)
        running: '#10b981', // Green (active)
        queued: '#0ea5e9', // Blue (waiting)
        completed: '#06b6d4', // Cyan (done)
        failed: '#ef4444', // Red (error)
        transferSpeed: '#10b981', // Green (speed)
        poolUsed: '#f97316', // Orange (hot)
        poolFree: '#06b6d4', // Cyan (cold)
      },
      series: [
        '#f97316',
        '#06b6d4',
        '#10b981',
        '#0ea5e9',
        '#ef4444',
        '#8b5cf6',
        '#ec4899',
      ],
      grid: '#1a1a1a', // Subtle grid lines
      axis: '#6b6b6b', // Medium grey axis
      gradients: {
        cpu: {
          start: '#f97316',
          end: '#f97316',
          startOpacity: 0.6,
          endOpacity: 0.05,
        },
        memory: {
          start: '#06b6d4',
          end: '#06b6d4',
          startOpacity: 0.6,
          endOpacity: 0.05,
        },
      },
      tooltip: {
        background: '#0d0d0d',
        text: '#ffffff',
        border: '#2a2a2a',
      },
    },

    // Progress Bar Tokens
    progressBar: {
      background: 'rgba(255, 255, 255, 0.08)', // Subtle track
      fill: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', // Blue gradient
      height: '4px',
    },

    // Search Input Tokens
    searchInput: {
      background: 'rgba(18, 18, 18, 0.98)',
      border: 'rgba(255, 255, 255, 0.12)',
      iconOpacity: '0.6',
    },

    // Navigation Link Tokens
    navigationLink: {
      background: 'rgba(13, 13, 13, 0.95)',
      backgroundHover: 'rgba(15, 15, 15, 1)',
      backgroundActive: 'rgba(14, 165, 233, 0.1)', // Blue tint when active
      border: 'rgba(255, 255, 255, 0.08)',
      borderActive: 'rgba(14, 165, 233, 0.5)', // Blue border
      text: '#a8a8a8',
      textActive: '#ffffff',
    },

    // Media Thumbnail Tokens
    mediaThumb: {
      // Keep hot/cold gradient for visual interest on thumbnails
      borderGradient:
        'conic-gradient(from 200deg, rgba(61, 213, 255, 0.8), rgba(255, 107, 61, 0.7), rgba(61, 213, 255, 0.8))',
      innerBackground:
        'radial-gradient(circle at 0 0, rgba(14, 165, 233, 0.15), transparent 60%), rgba(13, 13, 13, 0.98)',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.9)',
      labelGradient: undefined, // Solid white text instead
    },

    // Scrollbar Tokens
    scrollbar: {
      track: 'transparent',
      thumb: '#0ea5e9', // Solid blue (not gradient)
      width: '6px',
    },

    // Panel Tokens
    panel: {
      base: {
        background: 'rgba(13, 13, 13, 0.98)', // Simple solid, no gradients
        border: 'rgba(255, 255, 255, 0.06)',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
      },
      statsMini: {
        background: 'rgba(15, 15, 15, 0.98)',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      statsCard: {
        background: 'rgba(13, 13, 13, 0.98)',
        border: 'rgba(255, 255, 255, 0.06)',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
      },
    },
  },
}
