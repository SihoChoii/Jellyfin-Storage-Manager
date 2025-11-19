/**
 * Theme Type System for JellyMover
 *
 * This file defines the complete type structure for themes in JellyMover.
 * It serves as the contract that all theme implementations must follow.
 *
 * Design Principles:
 * - Modular: Each aspect of the theme is isolated into clear categories
 * - Scalable: Easy to extend with new tokens or theme variants
 * - Type-safe: Leverage TypeScript for compile-time validation
 * - Flexible: Support both simple and complex theme requirements
 *
 * Version: 2.0 - Enhanced for full Jelly theme support
 */

// =============================================================================
// Theme Keys
// =============================================================================

/**
 * Valid theme identifiers.
 * Add new theme keys here as they are implemented.
 */
export type ThemeKey =
  | 'jelly'      // Default dark theme with cyberpunk aesthetic
  | 'light'      // Light mode variant
  | 'dark'       // Standard dark mode
  | 'nord'       // Nord-inspired blue/cyan theme
  | 'dracula'    // Dracula-inspired purple theme
  | 'minimal'    // Minimal theme with reduced effects
  | 'highContrast' // High contrast for accessibility

// =============================================================================
// Gradient System (Enhanced)
// =============================================================================

/**
 * Individual gradient layer definition
 * Supports linear, radial, and conic gradients with full configuration
 */
export interface GradientLayer {
  /** Gradient type */
  type: 'linear' | 'radial' | 'conic'
  /** Color stops with optional opacity */
  colors: Array<{
    color: string
    stop: string
    opacity?: number
  }>
  /** Angle for linear/conic gradients (e.g., '120deg', 'from 200deg') */
  angle?: string
  /** Position for radial gradients (e.g., 'at top left', 'at 50% 0%') */
  position?: string
  /** Size/extent for radial gradients (e.g., '55%', 'closest-side') */
  size?: string
  /** Shape for radial gradients */
  shape?: 'circle' | 'ellipse'
}

/**
 * Multi-layer gradient composition
 * Allows stacking multiple gradient layers for complex effects
 */
export interface MultiLayerGradient {
  /** Array of gradient layers (rendered bottom-to-top) */
  layers: GradientLayer[]
  /** Optional solid color as final layer */
  backgroundColor?: string
}

// =============================================================================
// Animation System
// =============================================================================

/**
 * CSS keyframe definition
 * Maps keyframe percentages/keywords to CSS properties
 */
export type KeyframeDefinition = Record<string, Record<string, string | number>>

/**
 * Animation configuration
 * Defines a complete @keyframes animation with all properties
 */
export interface AnimationConfig {
  /** Keyframe definitions (e.g., { '0%': { opacity: 0 }, '100%': { opacity: 1 } }) */
  keyframes: KeyframeDefinition
  /** Animation duration (e.g., '0.3s', '2s') */
  duration: string
  /** Timing function (e.g., 'ease-out', 'cubic-bezier(0.21, 0.96, 0.41, 1)') */
  timing?: string
  /** Iteration count (e.g., 'infinite', 1, 2) */
  iteration?: string | number
  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  /** Fill mode */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
  /** Animation delay */
  delay?: string
}

/**
 * Complete animation system
 * Defines all keyframe animations used in the theme
 */
export interface Animations {
  /** Background gradient drift animation (28s infinite) */
  bgDrift: AnimationConfig
  /** Panel shimmer/shine animation (6s infinite) */
  shineSweep: AnimationConfig
  /** Page/screen entrance animation (0.35s) */
  screenIn: AnimationConfig
  /** Card/list item entrance animation (0.32s with stagger) */
  cardIn: AnimationConfig
  /** Progress bar animation (1.4s infinite) */
  progressShift: AnimationConfig
  /** Stat bar flow animation (1.6s infinite) */
  statFlow: AnimationConfig
  /** Stagger delay multiplier for list animations (e.g., '40ms') */
  staggerDelay: string
}

// =============================================================================
// Color System (Enhanced)
// =============================================================================

/**
 * Background color tokens for surfaces at different elevations
 * Enhanced with gradient layers and texture support
 */
export interface BackgroundColors {
  /** Primary background color (lowest elevation) */
  main: string
  /** Panel/card background (elevated surface) */
  panel: string
  /** Overlay background for modals/dialogs */
  overlay: string
  /** Secondary surface for nested elements */
  secondary?: string
  /** Tertiary surface for further nesting */
  tertiary?: string
  /** Multi-layer animated background gradient */
  gradientLayers?: MultiLayerGradient
  /** Background noise texture (SVG data URL) */
  noiseTexture?: string
  /** Noise texture opacity */
  noiseOpacity?: string
  /** Noise texture blend mode */
  noiseBlendMode?: string

  // Gradient endpoints for main background
  /** Main background gradient start color */
  mainGradientStart?: string
  /** Main background gradient end color */
  mainGradientEnd?: string

  // Component-specific backgrounds
  /** Search input background */
  inputSearch?: string
  /** Chip/tag background */
  chip?: string
  /** Queue item background */
  queueItem?: string
  /** Stats box background */
  statsBox?: string
  /** Pool tag background */
  poolTag?: string
  /** Controls panel background */
  controls?: string
  /** Navigation button background */
  navBtn?: string
  /** Active navigation button background */
  navBtnActive?: string
  /** Terminal header background */
  terminalHeader?: string
  /** Mini stats widget background */
  statsMini?: string
  /** Media thumbnail inner background */
  mediaThumbInner?: string
  /** Progress bar track background */
  progressTrack?: string
  /** Scrollbar track background */
  scrollbarTrack?: string
  /** Scrollbar thumb background */
  scrollbarThumb?: string
  /** Scrollbar thumb hover background */
  scrollbarThumbHover?: string
}

/**
 * Text color tokens for typography hierarchy
 * Enhanced with semantic color variants
 */
export interface TextColors {
  /** Primary text color (highest emphasis) */
  primary: string
  /** Secondary text color (medium emphasis) */
  secondary: string
  /** Tertiary text color (low emphasis) */
  tertiary: string
  /** Disabled/muted text */
  disabled: string
  /** Inverted text (for use on dark backgrounds in light themes, etc.) */
  inverted?: string
  /** Hot accent text color (for badges/chips on hot backgrounds) */
  hotAccent?: string
  /** Cold accent text color (for badges/chips on cold backgrounds) */
  coldAccent?: string
  /** Success text color */
  success?: string
  /** Error/warning text color */
  error?: string
}

/**
 * Accent colors for semantic and branded elements
 * Enhanced with gradient endpoints and explicit magenta
 */
export interface AccentColors {
  /** Hot pool accent (fire/SSD/fast) */
  hot: string
  /** Hot accent with reduced opacity for backgrounds */
  hotSoft: string
  /** Cold pool accent (ice/HDD/storage) */
  cold: string
  /** Cold accent with reduced opacity for backgrounds */
  coldSoft: string
  /** Magenta/pink accent (progress bars, mixed gradients) */
  magenta?: string
  /** Primary brand accent */
  primary: string
  /** Secondary brand accent */
  secondary?: string
  /** Hot gradient endpoint color (for button gradients) */
  hotGradientEnd?: string
  /** Cold gradient endpoint color (for button gradients) */
  coldGradientEnd?: string
  /** Primary accent soft background */
  primarySoft?: string
  /** Primary accent bright variant */
  primaryBright?: string
}

/**
 * Semantic colors for user feedback
 */
export interface SemanticColors {
  /** Success states and positive actions */
  success: string
  /** Error states and destructive actions */
  error: string
  /** Warning states and caution */
  warning: string
  /** Informational states */
  info: string
}

/**
 * Border color tokens at different emphasis levels
 * Enhanced with granular opacity levels for glass morphism
 */
export interface BorderColors {
  /** Subtle border - 6% opacity (panel borders) */
  white06: string
  /** Light border - 8% opacity (cards, standard borders) */
  white08: string
  /** Medium border - 12% opacity (emphasized, badges) */
  white12: string
  /** Strong border - 14% opacity (pool tags) */
  white14: string
  /** Emphasized border - 16% opacity (chips) */
  white16: string
  /** Active border - 18% opacity (pills, status indicators) */
  white18: string
  /** Strong active - 22% opacity (active buttons) */
  white22: string
  /** Dashed border - 25% opacity (dashed variants) */
  white25: string
  /** Highly emphasized - 45% opacity (active nav links) */
  white45: string
}

/**
 * Interactive state colors for hover, active, focus, etc.
 */
export interface InteractionColors {
  /** Hover state background */
  hover: string
  /** Active/pressed state background */
  active: string
  /** Focus state indicator */
  focus: string
  /** Selected state background */
  selected: string
  /** Disabled state background */
  disabled: string
}

/**
 * Gradient definitions for complex backgrounds and effects
 * Enhanced with multi-layer support and structured definitions
 */
export interface Gradients {
  /** Simple primary gradient (e.g., hot to cold) */
  primary: string
  /** Secondary gradient */
  secondary?: string

  /** Multi-layer gradients for complex effects */
  multiLayer?: {
    /** Top bar gradient (2-layer: linear + solid) */
    topBar: MultiLayerGradient
    /** Panel base gradient (3-layer: 2 radial + solid) */
    panelBase: MultiLayerGradient
    /** Navigation button gradient (2-layer: radial + solid) */
    navButton: MultiLayerGradient
    /** Active navigation button gradient (2-layer: linear + solid) */
    navButtonActive: MultiLayerGradient
    /** Terminal header gradient (2-layer: linear + solid) */
    terminalHeader: MultiLayerGradient
    /** Stats mini panel gradient (2-layer: radial + solid) */
    statsMini: MultiLayerGradient
    /** Stats card gradient (3-layer: 2 radial + solid) */
    statsCard: MultiLayerGradient
    /** Pool tag gradient (2-layer: radial + solid) */
    poolTag: MultiLayerGradient
    /** Media thumb inner gradient (2-layer: radial + solid) */
    mediaThumbInner: MultiLayerGradient
  }

  /** Conic gradients for special effects */
  conic?: {
    /** Media thumbnail border gradient */
    mediaThumb?: string
    /** Media thumbnail inner gradient */
    mediaThumbInner?: string
  }

  /** Text gradients (with background-clip) */
  text?: {
    /** Logo text gradient */
    logo: string
    /** General accent text gradient */
    accent: string
  }

  /** Effect/overlay gradients */
  effects?: {
    /** Shine/shimmer sweep effect */
    shine: string
    /** Hover glow effect */
    hoverGlow: string
  }

  /** Button gradient variants */
  button?: {
    hot: string
    cold: string
    primary?: string
  }

  /** Progress/flow gradients */
  progress?: {
    /** Tri-color progress bar gradient (cold → hot → magenta) */
    bar: string
    /** Stat bar gradient */
    stat: string
  }

  /** Scrollbar gradient */
  scrollbar?: string

  /** Panel-specific gradients */
  panel?: {
    base?: string
    topBar?: string
    terminalHeader?: string
    statsMini?: string
    controls?: string
    queueItem?: string
    navActive?: string
  }
}

/**
 * Window decoration colors (macOS-style traffic lights)
 */
export interface WindowDots {
  /** Default/inactive dot color */
  default: string
  /** Red (close) button */
  red: string
  /** Yellow (minimize) button */
  yellow: string
  /** Green (maximize) button */
  green: string
}

/**
 * Complete color palette for a theme
 */
export interface ColorPalette {
  background: BackgroundColors
  text: TextColors
  accent: AccentColors
  semantic: SemanticColors
  border: BorderColors
  interaction: InteractionColors
  gradients?: Gradients
  windowDots?: WindowDots
}

// =============================================================================
// Typography System (Enhanced)
// =============================================================================

/**
 * Font family tokens for different text contexts
 */
export interface FontFamilies {
  /** Primary UI font (sans-serif) */
  ui: string
  /** Monospace font for code/technical content */
  mono: string
  /** Display font for headings (optional) */
  display?: string
}

/**
 * Font size scale from smallest to largest
 */
export interface FontSizes {
  xs: string      // Extra small (e.g., 0.625rem)
  sm: string      // Small (e.g., 0.75rem)
  base: string    // Base size (e.g., 0.875rem or 1rem)
  md: string      // Medium (e.g., 1rem)
  lg: string      // Large (e.g., 1.125rem)
  xl: string      // Extra large (e.g., 1.25rem)
  '2xl': string   // 2X large (e.g., 1.5rem)
  '3xl': string   // 3X large (e.g., 2rem)
}

/**
 * Font weight tokens for typography hierarchy
 */
export interface FontWeights {
  normal: number    // Regular weight (400)
  medium: number    // Medium weight (500)
  semibold: number  // Semibold (600)
  bold: number      // Bold (700)
  extrabold: number // Extra bold (800)
}

/**
 * Letter spacing tokens for different text styles
 */
export interface LetterSpacing {
  tighter: string  // Tighter than normal
  tight: string    // Slightly tight
  normal: string   // Default spacing
  wide: string     // Slightly wide
  wider: string    // Wider than normal
  widest: string   // Widest spacing
}

/**
 * Line height tokens for vertical rhythm
 */
export interface LineHeights {
  none: number    // 1
  tight: number   // 1.25
  normal: number  // 1.5
  relaxed: number // 1.625
  loose: number   // 2
}

/**
 * Text transform options
 */
export interface TextTransform {
  none: string        // 'none'
  uppercase: string   // 'uppercase'
  lowercase: string   // 'lowercase'
  capitalize: string  // 'capitalize'
}

/**
 * Complete typography system
 * Enhanced with text transform support
 */
export interface Typography {
  fontFamily: FontFamilies
  fontSize: FontSizes
  fontWeight: FontWeights
  letterSpacing: LetterSpacing
  lineHeight: LineHeights
  textTransform: TextTransform
}

// =============================================================================
// Spacing System
// =============================================================================

/**
 * Spacing scale for consistent margins, padding, and gaps
 * Based on a multiplier system (e.g., 0.25rem increments)
 * Enhanced with intermediate value (7: 1.75rem)
 */
export interface Spacing {
  0: string    // No space (0)
  1: string    // Smallest (e.g., 0.25rem)
  2: string    // (e.g., 0.5rem)
  3: string    // (e.g., 0.75rem)
  4: string    // Base unit (e.g., 1rem)
  5: string    // (e.g., 1.25rem)
  6: string    // (e.g., 1.5rem)
  7: string    // (e.g., 1.75rem) - for app shell padding
  8: string    // (e.g., 2rem)
  10: string   // (e.g., 2.5rem)
  12: string   // (e.g., 3rem)
  16: string   // (e.g., 4rem)
  20: string   // (e.g., 5rem)
  24: string   // Largest (e.g., 6rem)
}

// =============================================================================
// Border Radius System
// =============================================================================

/**
 * Border radius tokens for different levels of roundedness
 */
export interface BorderRadius {
  none: string   // No rounding (0)
  sm: string     // Small (e.g., 0.25rem)
  md: string     // Medium (e.g., 0.5rem or 0.8rem)
  lg: string     // Large (e.g., 1rem)
  xl: string     // Extra large (e.g., 1.25rem)
  '2xl': string  // 2X large (e.g., 1.5rem)
  full: string   // Fully rounded (50% or 999px for pills)
}

// =============================================================================
// Shadow System
// =============================================================================

/**
 * Elevation/shadow tokens for depth hierarchy
 */
export interface Shadows {
  none: string   // No shadow
  sm: string     // Small shadow
  md: string     // Medium shadow (default)
  lg: string     // Large shadow
  xl: string     // Extra large shadow
  '2xl': string  // 2X large shadow
  inner?: string // Inner shadow variant
}

// =============================================================================
// Transition System
// =============================================================================

/**
 * Duration tokens for animations and transitions
 */
export interface TransitionDuration {
  instant: string  // Instant (e.g., 0ms)
  fast: string     // Fast (e.g., 150ms)
  normal: string   // Normal (e.g., 250ms)
  slow: string     // Slow (e.g., 350ms)
  slower: string   // Slower (e.g., 500ms)
}

/**
 * Easing function tokens for animation curves
 */
export interface TransitionEasing {
  linear: string
  ease: string
  easeIn: string
  easeOut: string
  easeInOut: string
  custom?: string  // For custom cubic-bezier curves
  spring: string   // Spring-like easing for interactive elements
}

/**
 * Complete transition system
 */
export interface Transitions {
  duration: TransitionDuration
  easing: TransitionEasing
}

// =============================================================================
// Effects System (Enhanced)
// =============================================================================

/**
 * Blur amount tokens for glassmorphism and overlays
 */
export interface BlurLevels {
  none: string   // No blur
  sm: string     // Small blur
  md: string     // Medium blur
  lg: string     // Large blur
  xl: string     // Extra large blur
}

/**
 * Opacity level tokens for transparency
 */
export interface OpacityLevels {
  0: string      // Fully transparent
  5: string      // 5% opacity
  10: string     // 10% opacity
  20: string     // 20% opacity
  30: string     // 30% opacity
  40: string     // 40% opacity
  50: string     // 50% opacity
  60: string     // 60% opacity
  70: string     // 70% opacity
  80: string     // 80% opacity
  90: string     // 90% opacity
  95: string     // 95% opacity
  100: string    // Fully opaque
}

/**
 * Backdrop filter configurations for glass morphism effects
 */
export interface BackdropFilters {
  none: string        // 'none'
  glassLight: string  // 'blur(8px)'
  glassMedium: string // 'blur(18px) saturate(130%)'
  glassHeavy: string  // 'blur(24px) saturate(150%)'
  /** Header-specific backdrop filter */
  header?: string     // Custom header backdrop filter
}

/**
 * CSS mix-blend-mode values
 */
export interface BlendModes {
  normal: string     // 'normal'
  screen: string     // 'screen' - for background gradients
  softLight: string  // 'soft-light' - for background noise
  multiply: string   // 'multiply'
  overlay: string    // 'overlay'
  /** Gradient-specific blend mode */
  gradient?: string  // Blend mode for gradient overlays
  /** Noise texture blend mode */
  noise?: string     // Blend mode for noise texture
}

/**
 * Saturation levels for backdrop-filter
 */
export interface Saturation {
  default: string   // '100%'
  enhanced: string  // '130%'
  high: string      // '150%'
}

/**
 * Visual effects system
 * Enhanced with backdrop-filter, blend modes, and saturation
 */
export interface Effects {
  blur: BlurLevels
  opacity: OpacityLevels
  backdropFilter: BackdropFilters
  blendMode: BlendModes
  saturation: Saturation
}

// =============================================================================
// Component Tokens (Enhanced)
// =============================================================================

/**
 * Button variant styles
 * Enhanced with disabled state
 */
export interface ButtonTokens {
  primary: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
    backgroundDisabled?: string
    textDisabled?: string
  }
  secondary: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
    backgroundDisabled?: string
    textDisabled?: string
  }
  ghost: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
    backgroundDisabled?: string
    textDisabled?: string
  }
  hot: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
    shadow?: string
  }
  cold: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
    shadow?: string
  }
  danger?: {
    background: string
    backgroundHover: string
    backgroundActive: string
    text: string
    border?: string
  }
}

/**
 * Input field styles
 */
export interface InputTokens {
  background: string
  backgroundHover: string
  backgroundFocus: string
  text: string
  placeholder: string
  border: string
  borderHover: string
  borderFocus: string
  borderError?: string
  borderSuccess?: string
}

/**
 * Card/panel styles
 */
export interface CardTokens {
  background: string
  backgroundHover?: string
  border: string
  shadow: string
  gradient?: string
}

/**
 * Badge/pill styles
 * Enhanced with additional variants
 */
export interface BadgeTokens {
  default: {
    background: string
    text: string
    border?: string
  }
  hot: {
    background: string
    text: string
    border?: string
  }
  cold: {
    background: string
    text: string
    border?: string
  }
  success?: {
    background: string
    text: string
    border?: string
  }
  error?: {
    background: string
    text: string
    border?: string
  }
  warning?: {
    background: string
    text: string
    border?: string
  }
  info?: {
    background: string
    text: string
    border?: string
  }
  // Dashed outline variants
  dashedHot?: {
    background: string
    text: string
    border: string
  }
  dashedCold?: {
    background: string
    text: string
    border: string
  }
}

/**
 * Chart semantic color mappings
 * Maps specific chart data types to colors
 */
export interface ChartSemanticColors {
  /** CPU usage color */
  cpu: string
  /** Memory usage color */
  memory: string
  /** Running job status color */
  running: string
  /** Queued job status color */
  queued: string
  /** Completed job status color */
  completed: string
  /** Failed job status color */
  failed: string
  /** Transfer speed line color */
  transferSpeed: string
  /** Pool used space color */
  poolUsed: string
  /** Pool free space color */
  poolFree: string
}

/**
 * Chart gradient fill configuration
 */
export interface ChartGradient {
  /** Start color */
  start: string
  /** End color */
  end: string
  /** Start opacity (0-1) */
  startOpacity: number
  /** End opacity (0-1) */
  endOpacity: number
}

/**
 * Chart/visualization colors
 * Enhanced with semantic mappings and gradients
 */
export interface ChartTokens {
  /** Semantic color mappings for specific chart types */
  semantic: ChartSemanticColors
  /** Generic series colors (fallback/extensibility) */
  series: string[]
  /** Grid line color */
  grid: string
  /** Axis color */
  axis: string
  /** Gradients for area chart fills */
  gradients?: {
    cpu: ChartGradient
    memory: ChartGradient
  }
  /** Tooltip styling */
  tooltip: {
    background: string
    text: string
    border: string
  }
}

/**
 * Progress bar styling
 */
export interface ProgressBarTokens {
  /** Track background */
  background: string
  /** Fill gradient (tri-color: cold → hot → magenta) */
  fill: string
  /** Bar height */
  height: string
}

/**
 * Search input specific styling
 */
export interface SearchInputTokens {
  /** Input background */
  background: string
  /** Input border */
  border: string
  /** Search icon opacity */
  iconOpacity: string
}

/**
 * Navigation link styling
 */
export interface NavigationLinkTokens {
  /** Default background */
  background: string
  /** Hover background */
  backgroundHover: string
  /** Active/selected background */
  backgroundActive: string
  /** Default border */
  border: string
  /** Active border */
  borderActive: string
  /** Default text color */
  text: string
  /** Active text color */
  textActive: string
}

/**
 * Media thumbnail styling
 */
export interface MediaThumbTokens {
  /** Conic gradient border */
  borderGradient: string
  /** Inner background gradient */
  innerBackground: string
  /** Thumbnail shadow */
  shadow: string
  /** Label gradient (HOT/COLD text) */
  labelGradient?: string
}

/**
 * Scrollbar styling
 */
export interface ScrollbarTokens {
  /** Track background */
  track: string
  /** Thumb gradient */
  thumb: string
  /** Scrollbar width */
  width: string
}

/**
 * Panel variant styling
 * Different panel types with specific gradients
 */
export interface PanelTokens {
  /** Standard panel (used for pools, queue) */
  base: {
    background: string | MultiLayerGradient
    border: string
    shadow: string
  }
  /** Mini stats panel */
  statsMini: {
    background: string | MultiLayerGradient
    border: string
  }
  /** Large stats card */
  statsCard: {
    background: string | MultiLayerGradient
    border: string
    shadow: string
  }
}

/**
 * Component-specific token overrides
 * Enhanced with new component categories
 */
export interface ComponentTokens {
  button: ButtonTokens
  input: InputTokens
  card: CardTokens
  badge: BadgeTokens
  chart: ChartTokens
  progressBar: ProgressBarTokens
  searchInput: SearchInputTokens
  navigationLink: NavigationLinkTokens
  mediaThumb: MediaThumbTokens
  scrollbar: ScrollbarTokens
  panel: PanelTokens
}

// =============================================================================
// Main Theme Interface (Enhanced)
// =============================================================================

/**
 * Complete theme definition
 *
 * This is the top-level interface that all theme objects must implement.
 * It contains all design tokens needed to style the entire application.
 *
 * Version 2.0 - Enhanced with animation system and expanded token support
 */
export interface Theme {
  /** Theme metadata */
  meta: {
    /** Unique theme identifier */
    key: ThemeKey
    /** Display name for UI */
    name: string
    /** Theme description */
    description?: string
    /** Whether this is a dark theme (for contrast calculations) */
    isDark: boolean
    /** Optional tagline text displayed in app header (e.g., "FIRE ∧ ICE") */
    logoTagline?: string
  }

  /** Color system tokens */
  colors: ColorPalette

  /** Typography system tokens */
  typography: Typography

  /** Spacing scale tokens */
  spacing: Spacing

  /** Border radius tokens */
  radius: BorderRadius

  /** Shadow/elevation tokens */
  shadows: Shadows

  /** Transition/animation tokens */
  transitions: Transitions

  /** Visual effects tokens (blur, opacity, backdrop-filter, blend modes) */
  effects: Effects

  /** Animation system (keyframes, timing, stagger) */
  animations: Animations

  /** Component-specific token overrides */
  components: ComponentTokens
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Partial theme for merging/extending themes
 * Useful for creating theme variants that only override specific tokens
 */
export type PartialTheme = Partial<Theme> & {
  meta: Theme['meta']
}

/**
 * Theme override configuration
 * Allows deep partial overrides of specific theme tokens
 */
export type ThemeOverride = {
  [K in keyof Theme]?: K extends 'meta'
  ? Theme['meta']
  : DeepPartial<Theme[K]>
}

/**
 * Deep partial utility type for nested objects
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Type guard to check if a value is a valid ThemeKey
 */
export function isValidThemeKey(key: string): key is ThemeKey {
  const validKeys: ThemeKey[] = [
    'jelly',
    'light',
    'dark',
    'nord',
    'dracula',
    'minimal',
    'highContrast'
  ]
  return validKeys.includes(key as ThemeKey)
}

/**
 * Type representing a theme registry/collection
 */
export type ThemeRegistry = Record<ThemeKey, Theme>
