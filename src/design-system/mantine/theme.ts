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

// TailAdmin gray scale (Task 484 §1b — source of truth for neutral tones)
const gray: MantineColorsTuple = [
  '#f9fafb', // 0 — gray-50
  '#f2f4f7', // 1 — gray-100 (card/table border)
  '#e4e7ec', // 2 — gray-200
  '#d0d5dd', // 3 — gray-300
  '#98a2b3', // 4 — gray-400
  '#667085', // 5 — gray-500 (secondary text)
  '#475467', // 6 — gray-600
  '#344054', // 7 — gray-700 (primary text)
  '#1d2939', // 8 — gray-800
  '#101828', // 9 — gray-900
]

// TailAdmin semantic: success / warning / error (Task 484 §1b)
// Badge variant="light" uses index 0 for bg, index 6 for text (Mantine v8 light mode).
const green: MantineColorsTuple = [
  '#ecfdf3', // 0 — success-50 (Badge light bg: #ecfdf3)
  '#d1fadf', // 1 — success-100
  '#a9f3c3', // 2
  '#6ce9a6', // 3 — success-300
  '#3dd68c', // 4
  '#12b76a', // 5 — success-500
  '#039855', // 6 — success-600 (Badge light text: #039855)
  '#027a48', // 7 — success-700
  '#05603a', // 8 — success-800
  '#054f32', // 9
]

const yellow: MantineColorsTuple = [
  '#fffaeb', // 0 — warning-50 (Badge light bg: #fffaeb)
  '#fef3d0', // 1
  '#fee3a2', // 2
  '#fdc848', // 3
  '#fdb022', // 4 — warning-400
  '#f79009', // 5 — warning-500
  '#dc6803', // 6 — warning-600 (Badge light text)
  '#b54708', // 7 — warning-700
  '#93370d', // 8
  '#7a2e0e', // 9
]

const red: MantineColorsTuple = [
  '#fef3f2', // 0 — error-50 (Badge light bg: #fef3f2)
  '#fee4e2', // 1 — error-100
  '#fecdca', // 2
  '#fda29b', // 3 — error-300
  '#f97066', // 4 — error-400
  '#f04438', // 5 — error-500
  '#d92d20', // 6 — error-600 (Badge light text: #d92d20)
  '#b42318', // 7 — error-700
  '#912018', // 8 — error-800
  '#7a271a', // 9
]

export const theme = createTheme({
  // Primary color: maps to brand-700 (#EC5447) at primaryShade 7.
  primaryColor: 'brand',
  primaryShade: 7,
  colors: { brand, gray, green, yellow, red },

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

  // Font: Outfit (TailAdmin standard, Task 484 §1b — owner decision 2026-06-25).
  // Loaded via Next.js font loader in layout.tsx; Storybook: Google Fonts CDN in preview-head.html.
  fontFamily: 'Outfit, var(--font-outfit), system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono, "Courier New", monospace)',
  headings: {
    fontFamily: 'Outfit, var(--font-outfit), system-ui, -apple-system, sans-serif',
    // Heading scale: TailAdmin title-* sizes (§1b). Line heights ~1.25 per TailAdmin titles.
    sizes: {
      h1: { fontSize: '3rem',     lineHeight: '1.25', fontWeight: '700' }, // title-lg 48px
      h2: { fontSize: '2.25rem',  lineHeight: '1.25', fontWeight: '700' }, // title-md 36px
      h3: { fontSize: '1.875rem', lineHeight: '1.27', fontWeight: '600' }, // title-sm 30px
      h4: { fontSize: '1.5rem',   lineHeight: '1.33', fontWeight: '600' }, // title-xs 24px
      h5: { fontSize: '1.25rem',  lineHeight: '1.4',  fontWeight: '600' }, // xl 20px
      h6: { fontSize: '1.125rem', lineHeight: '1.4',  fontWeight: '600' }, // lg 18px
    },
  },

  // Spacing: TailAdmin 4px grid (§1b). xs=8/sm=12/md=16/lg=20/xl=24 px.
  spacing: {
    xs: '0.5rem',    //  8px — meta-row gap, badge padding, tight inline gaps
    sm: '0.75rem',   // 12px — control gaps, card section rhythm
    md: '1rem',      // 16px — card inner gap, table vertical spacing
    lg: '1.25rem',   // 20px — card padding, table horizontal spacing, block gaps
    xl: '1.5rem',    // 24px — page section separation
  },

  // Radius: TailAdmin real values (§1b). lg=8px for controls, 2xl=16px for Card/Paper.
  radius: {
    xs:   '0.125rem', //  2px
    sm:   '0.25rem',  //  4px
    md:   '0.375rem', //  6px
    lg:   '0.5rem',   //  8px — Button / Input / Select / SegmentedControl
    xl:   '0.75rem',  // 12px
    '2xl': '1rem',    // 16px — Card / Paper (TailAdmin rounded-2xl)
    pill:  '9999px',  // Badge pill (TailAdmin rounded-full)
  },
  defaultRadius: 'lg', // 8px default for all controls

  // Line heights: body=1.5 (§1b base/24 ÷ 16), headings set per-size above.
  lineHeights: {
    xs: '1.5',
    sm: '1.43',
    md: '1.5',
    lg: '1.56',
    xl: '1.5',
  },

  // Font sizes: TailAdmin type scale (§1b) — xs12/sm14/md16/lg18/xl20 px.
  fontSizes: {
    xs: '0.75rem',   // 12px — labels, meta, table headers
    sm: '0.875rem',  // 14px — body, table cells, inputs
    md: '1rem',      // 16px — emphasized body
    lg: '1.125rem',  // 18px — card/section title
    xl: '1.25rem',   // 20px — page heading
  },

  // Touch target: ≥44px (P0 mobile gate). 2.75rem = 44px.
  // Storybook proof viewport px→em reference (16px root):
  // 275px=17.1875em | 320px=20em | 390px=24.375em | 480px=30em | 560px=35em |
  // 680px=42.5em | 768px=48em | 960px=60em | 1024px=64em | 1200px=75em |
  // 1440px=90em | 1920px=120em
  other: {
    touchTarget: '2.75rem',  // 44px minimum
    mobileGate: '40em',      // 640px — P0 full-width gate
  },

  // Component-level defaults aligned to TailAdmin density (§1.4 / §1b).
  components: {
    Button: {
      defaultProps: { radius: 'lg', size: 'md' },
      styles: { root: { minHeight: '2.75rem' } }, // ≥44px touch target (rem — exemption)
    },
    TextInput: {
      defaultProps: { radius: 'lg', size: 'md' },
    },
    Textarea: {
      defaultProps: { radius: 'lg', size: 'md' },
    },
    Select: {
      defaultProps: { radius: 'lg', size: 'md' },
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
    SegmentedControl: {
      defaultProps: { radius: 'lg', size: 'sm' },
    },
    // Avatar: pill radius (TailAdmin rounded-full). Size 40 = standard composite-cell consumer; size 44 = form/input row.
    // Size is NOT baked in here — passed by consumers (40 default, 44 form).
    Avatar: {
      defaultProps: { radius: 'pill' },
    },
    // Badge: pill radius, light variant, sm size, fw=500 (TailAdmin status badge standard).
    Badge: {
      defaultProps: { radius: 'pill', variant: 'light', size: 'sm' },
      styles: { root: { fontWeight: '500' } },
    },
    // Card: flat-border, 2xl radius (16px), lg padding (20px). No shadow (shadow only on popovers).
    // Border color: gray-1 (#f2f4f7) via scoped CSS variable override.
    Card: {
      defaultProps: { radius: '2xl', padding: 'lg' },
      styles: {
        root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' },
      },
    },
    // Paper: matches Card for consistent admin surface chrome.
    Paper: {
      defaultProps: { radius: '2xl' },
      styles: {
        root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' },
      },
    },
    Modal: {
      defaultProps: { radius: 'lg', centered: true },
    },
    Drawer: {
      defaultProps: {},
    },
    // Table: TailAdmin CRM card-wrapped table (§6b) → px-6 py-3 = 24×12 → horizontalSpacing=xl(24) / verticalSpacing=sm(12).
    // Header: 12px text, fw=500, gray-500; NOT uppercase. Row dividers + hover per §6b.
    Table: {
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        verticalSpacing: 'sm',
        horizontalSpacing: 'xl',
      },
    },
    Alert: {
      defaultProps: { radius: 'lg' },
    },
    Notification: {
      defaultProps: { radius: 'lg' },
    },
  },
})
