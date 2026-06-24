import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Brand color scale derived from globals.css oklch palette (EC5447 primary)
// Mapped to hex approximations for Mantine's 10-shade color array.
const brand: MantineColorsTuple = [
  '#FDEEED', // 0 — brand-50
  '#FBDDDA', // 1 — brand-100
  '#F9CCC8', // 2 — brand-200
  '#F7BBB5', // 3 — brand-300
  '#F6AAA3', // 4 — brand-400
  '#F2877E', // 5 — brand-500
  '#F0766C', // 6 — brand-600
  '#EC5447', // 7 — brand-700 (primary)
  '#BD4339', // 8 — brand-800 (hover)
  '#8E322B', // 9 — brand-900
]

export const theme = createTheme({
  // Primary color: maps to brand-700 (#EC5447) at primaryShade 7.
  primaryColor: 'brand',
  primaryShade: 7,
  colors: { brand },

  // Breakpoints aligned to the project's mobile gate (<640px) and canonical widths.
  // xs=320, sm=640 (the critical full-width gate), md=768, lg=1024, xl=1280, xxl=1440.
  // Mantine breakpoints are em-based (assuming 16px root font).
  breakpoints: {
    xs: '20em',   // 320px — mobile minimum
    sm: '40em',   // 640px — P0 mobile gate (< sm = full-width required)
    md: '48em',   // 768px — tablet
    lg: '64em',   // 1024px — desktop
    xl: '80em',   // 1280px — desktop wide
    xxl: '90em',  // 1440px — large desktop
  },

  // Font family: Geist (project-wide, loaded via Next.js font loader).
  // CSS variable set by Next.js; Storybook injects it via preview-head.html.
  fontFamily: 'var(--font-geist-sans, system-ui, -apple-system, sans-serif)',
  fontFamilyMonospace: 'var(--font-geist-mono, "Courier New", monospace)',
  headings: {
    fontFamily: 'var(--font-geist-sans, system-ui, -apple-system, sans-serif)',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '1.875rem', lineHeight: '1.25', fontWeight: '700' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3', fontWeight: '600' },
      h4: { fontSize: '1.25rem', lineHeight: '1.35', fontWeight: '600' },
      h5: { fontSize: '1.125rem', lineHeight: '1.4', fontWeight: '600' },
      h6: { fontSize: '1rem', lineHeight: '1.5', fontWeight: '600' },
    },
  },

  // Spacing: 4px base scale matching the project's --space-* tokens.
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },

  // Radius: aligned to the project's --radius-* scale.
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  defaultRadius: 'md',

  // Line heights matching --text-*--line-height tokens.
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.5',
    lg: '1.6',
    xl: '1.65',
  },

  // Font sizes aligned to the project's --text-* scale.
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
  },

  // Touch target: ≥44px (P0 mobile gate — all tappable text buttons must reach 2.75rem / 44px).
  // Mantine Button size="md" yields ~42px in Mantine v8. We enforce ≥44px via styles.root.minHeight.
  //
  // Storybook proof viewport px→em reference (16px root):
  // 275px=17.1875em | 320px=20em | 390px=24.375em | 480px=30em | 560px=35em |
  // 680px=42.5em | 768px=48em | 960px=60em | 1024px=64em | 1200px=75em |
  // 1440px=90em | 1920px=120em
  // Theme breakpoints (xs=20em, sm=40em, md=48em, lg=64em, xl=80em, xxl=90em) are a subset
  // of the 12 Storybook proof widths; proof widths are switched via the Storybook toolbar.
  other: {
    touchTarget: '2.75rem',  // 44px minimum
    controlHeightSm: '2rem',     // 32px — compact
    controlHeightMd: '2.25rem',  // 36px — desktop dense
    controlHeightLg: '2.75rem',  // 44px — mobile-safe
    mobileGate: '40em',          // 640px — P0 full-width gate
  },

  // Component-level defaults.
  components: {
    Button: {
      defaultProps: { radius: 'md', size: 'md' },
      // Enforce ≥44px minimum height: Mantine md=~42px, lg=50px.
      // styles.root.minHeight bumps md to 44px without changing visual density.
      styles: { root: { minHeight: '2.75rem' } },
    },
    TextInput: {
      defaultProps: { radius: 'md', size: 'md' },
    },
    Textarea: {
      defaultProps: { radius: 'md', size: 'md' },
    },
    Select: {
      defaultProps: { radius: 'md', size: 'md' },
    },
    Checkbox: {
      defaultProps: { radius: 'sm' },
    },
    Radio: {
      defaultProps: {},
    },
    Switch: {
      defaultProps: { size: 'md' },
    },
    Badge: {
      defaultProps: { radius: 'sm', size: 'md' },
    },
    Card: {
      defaultProps: { radius: 'md', padding: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'md', p: 'md' },
    },
    Modal: {
      defaultProps: { radius: 'md', centered: true },
    },
    Drawer: {
      defaultProps: {},
    },
    Table: {
      defaultProps: { striped: false, highlightOnHover: true },
    },
    Alert: {
      defaultProps: { radius: 'md' },
    },
    Notification: {
      defaultProps: { radius: 'md' },
    },
  },
})
