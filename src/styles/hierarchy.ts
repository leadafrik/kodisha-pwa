/**
 * Visual Hierarchy Standardization
 * Consistent typography, spacing, and styling across the app
 */

/**
 * Typography scale (Tailwind based)
 */
export const typographyScale = {
  // Display - Hero headlines
  display: {
    className: "text-3xl md:text-4xl lg:text-5xl font-bold",
    size: "48px",
    weight: "bold",
    lineHeight: "1.2",
  },

  // H1 - Page titles
  h1: {
    className: "text-2xl md:text-3xl font-bold",
    size: "32px",
    weight: "bold",
    lineHeight: "1.25",
  },

  // H2 - Section titles
  h2: {
    className: "text-xl md:text-2xl font-bold",
    size: "24px",
    weight: "bold",
    lineHeight: "1.3",
  },

  // H3 - Subsection titles
  h3: {
    className: "text-lg md:text-xl font-semibold",
    size: "20px",
    weight: "semibold",
    lineHeight: "1.4",
  },

  // H4 - Component titles
  h4: {
    className: "text-base md:text-lg font-semibold",
    size: "16px",
    weight: "semibold",
    lineHeight: "1.5",
  },

  // Body - Regular text
  body: {
    className: "text-base text-slate-700",
    size: "16px",
    weight: "normal",
    lineHeight: "1.6",
    color: "rgb(51, 65, 85)",
  },

  // Body small - Secondary text
  bodySmall: {
    className: "text-sm text-slate-600",
    size: "14px",
    weight: "normal",
    lineHeight: "1.5",
    color: "rgb(71, 85, 105)",
  },

  // Caption - Tiny text
  caption: {
    className: "text-xs text-slate-500",
    size: "12px",
    weight: "normal",
    lineHeight: "1.4",
    color: "rgb(100, 116, 139)",
  },

  // Label - Form labels
  label: {
    className: "text-sm font-semibold text-slate-700",
    size: "14px",
    weight: "semibold",
    lineHeight: "1.5",
    color: "rgb(51, 65, 85)",
  },
};

/**
 * Spacing scale (8px base)
 */
export const spacingScale = {
  xs: "4px", // 0.5 * 8px
  sm: "8px", // 1 * 8px
  md: "12px", // 1.5 * 8px
  lg: "16px", // 2 * 8px
  xl: "24px", // 3 * 8px
  "2xl": "32px", // 4 * 8px
  "3xl": "48px", // 6 * 8px
  "4xl": "64px", // 8 * 8px
};

/**
 * Color hierarchy
 */
export const colorHierarchy = {
  // Primary brand colors
  primary: {
    default: "rgb(16, 185, 129)", // Green-600
    light: "rgb(167, 243, 208)", // Green-300
    lighter: "rgb(209, 250, 229)", // Green-100
    dark: "rgb(5, 150, 105)", // Green-700
  },

  // Text hierarchy
  text: {
    primary: "rgb(15, 23, 42)", // Slate-900
    secondary: "rgb(51, 65, 85)", // Slate-700
    tertiary: "rgb(71, 85, 105)", // Slate-600
    disabled: "rgb(148, 163, 184)", // Slate-400
  },

  // Background hierarchy
  background: {
    primary: "rgb(255, 255, 255)",
    secondary: "rgb(248, 250, 252)", // Slate-50
    tertiary: "rgb(241, 245, 249)", // Slate-100
    muted: "rgb(226, 232, 240)", // Slate-200
  },

  // Status colors
  status: {
    success: "rgb(34, 197, 94)", // Green-600
    warning: "rgb(245, 158, 11)", // Amber-500
    error: "rgb(239, 68, 68)", // Red-500
    info: "rgb(59, 130, 246)", // Blue-500
  },
};

/**
 * Shadow scale (for depth hierarchy)
 */
export const shadowScale = {
  // Subtle - Cards, subtle elevation
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",

  // Base - Default cards, buttons
  base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",

  // Medium - Modals, dropdowns
  md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",

  // Large - Hero sections, important modals
  lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

  // Extra large - Prominent elements
  xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",

  // Focus ring
  focus: "0 0 0 3px rgba(59, 130, 246, 0.1), 0 0 0 5px rgba(59, 130, 246, 0.5)",
};

/**
 * Border radius scale
 */
export const borderRadiusScale = {
  none: "0",
  sm: "4px",
  base: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  full: "9999px",
};

/**
 * Component size scale
 */
export const componentSizeScale = {
  // Small buttons, icons
  sm: {
    height: "32px",
    padding: "8px 12px",
    fontSize: "12px",
  },

  // Medium buttons, inputs (standard)
  md: {
    height: "40px",
    padding: "10px 16px",
    fontSize: "14px",
  },

  // Large buttons, inputs
  lg: {
    height: "48px",
    padding: "12px 20px",
    fontSize: "16px",
  },

  // Extra large buttons
  xl: {
    height: "56px",
    padding: "14px 24px",
    fontSize: "18px",
  },
};

/**
 * Breakpoints (Tailwind standard)
 */
export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Consistency utilities
 */
export const consistencyClasses = {
  // Page container
  pageContainer: "max-w-7xl mx-auto px-4 py-8 md:py-12",

  // Section spacing
  sectionSpacing: "mb-8 md:mb-12",

  // Card styling
  card: "bg-white rounded-lg shadow border border-slate-100",
  cardHover: "hover:shadow-md transition-shadow duration-200",

  // Input styling
  input:
    "w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition",

  // Button base
  buttonBase: "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2",

  // Button primary
  buttonPrimary: "bg-green-600 text-white hover:bg-green-700 active:scale-95",

  // Button secondary
  buttonSecondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",

  // Link
  link: "text-green-600 hover:text-green-700 underline cursor-pointer transition",

  // Badge
  badge: "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",

  // Badge success
  badgeSuccess: "bg-green-100 text-green-800",

  // Badge warning
  badgeWarning: "bg-amber-100 text-amber-800",

  // Badge error
  badgeError: "bg-red-100 text-red-800",
};

/**
 * Grid layouts (for consistency)
 */
export const gridLayouts = {
  // Two column on desktop, one on mobile
  twoCol: "grid grid-cols-1 md:grid-cols-2 gap-6",

  // Three column on desktop, one on mobile
  threeCol: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",

  // Four column on desktop, two on tablet
  fourCol: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",

  // Sidebar layout (main + sidebar)
  sidebar: "grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8",

  // List items
  list: "space-y-3 md:space-y-4",
};

/**
 * Text utilities for hierarchy
 */
export const textHierarchy = {
  // Primary action/important
  primary: "text-slate-900 font-semibold",

  // Secondary information
  secondary: "text-slate-600 font-normal",

  // Tertiary/muted information
  tertiary: "text-slate-500 text-sm",

  // Disabled state
  disabled: "text-slate-400",

  // Muted (very light)
  muted: "text-slate-400 text-xs",
};

export default {
  typographyScale,
  spacingScale,
  colorHierarchy,
  shadowScale,
  borderRadiusScale,
  componentSizeScale,
  breakpoints,
  consistencyClasses,
  gridLayouts,
  textHierarchy,
};
