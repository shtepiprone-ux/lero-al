import { createTheme, type MantineColorsTuple, type MantineTheme, type ButtonProps, type BadgeProps } from '@mantine/core'

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

  // Font: Open Sans (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506).
  // --font-open-sans: Next.js loader (layout.tsx); Storybook: "Open Sans" literal + CDN link in preview-head.html.
  fontFamily: 'var(--font-open-sans, "Open Sans", system-ui, -apple-system, sans-serif)',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  headings: {
    fontFamily: 'var(--font-open-sans, "Open Sans", system-ui, -apple-system, sans-serif)',
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

  // Shadow: TailAdmin §5 shadow-theme-lg (Task 530) — the ONLY overridden key. Consumed
  // exclusively by Popover/Menu (DropdownMenu/NavigationMenu) desktop dropdown.shadow='lg'
  // defaultProps below; no other component in src/ passes shadow="lg" (grep-verified), and
  // Modal/Drawer default to Mantine's own 'xl' shadow scale, so this override cannot leak
  // onto them or onto the <640 bottom-sheet Drawer.
  shadows: {
    lg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)', // §5 shadow-theme-lg
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
    // TailAdmin control density: 14px text (text-sm/text-theme-sm — the source-of-truth
    // default), NOT Mantine's 16px md. Heights pinned to 44px (TailAdmin h-11) for touch.
    Button: {
      defaultProps: { radius: 'lg', size: 'sm' }, // 14px text (TailAdmin text-sm)
      // rem exemption: minHeight is touch-target, not spacing. fontWeight=500 = TailAdmin font-medium.
      // height:'auto' lets root grow beyond minHeight when label wraps (minHeight still guarantees 44px).
      // label fix: Mantine ships white-space:nowrap on .mantine-Button-label — clips long labels (Task 502).
      // outline/default variant (Task 527 fix #6, §6l Buttons secondary): bg white, text gray-700,
      // border gray-200, shadow-theme-xs, padding 12x16. Overridden as CSS custom properties
      // (--button-bg/--button-color/--button-bd/--button-padding-x), NOT literal background/color,
      // so Mantine's own :hover rule (which reads the same vars) keeps working — a literal inline
      // backgroundColor would permanently block the :hover pseudo-class from ever repainting.
      // Filled/primary variant is untouched (left to Mantine's variantColorResolver).
      styles: (_theme: MantineTheme, props: ButtonProps) => ({
        root: {
          minHeight: '2.75rem',
          fontWeight: '500',
          height: 'auto',
          ...(props.variant === 'outline' || props.variant === 'default'
            ? {
                '--button-bg': 'var(--mantine-color-white)',
                '--button-color': 'var(--mantine-color-gray-7)',
                '--button-bd': '1px solid var(--mantine-color-gray-2)',
                '--button-padding-x': '1rem', // §6l 16px (px-4)
                boxShadow: 'var(--mantine-shadow-xs)',
              }
            : {}),
        },
        label: { whiteSpace: 'normal', overflow: 'visible', wordBreak: 'break-word' },
      }),
    },
    TextInput: {
      // inputWrapperOrder: description below input (owner UX decision, Task 503); Mantine default puts it above.
      defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
      styles: {
        // border/focus/error/placeholder chrome lives in input-chrome.css (Task 505) — inline styles freeze the cascade
        input: {
          minHeight: '2.75rem',                 // ≥44px touch / TailAdmin h-11 (rem — exemption)
          color: 'var(--mantine-color-gray-8)', // §6 text — gray-800 (#1d2939)
        },
      },
    },
    Textarea: {
      // inputWrapperOrder: description below input (Task 503 owner UX decision, matches TextInput)
      defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
      styles: {
        // border/focus/error/placeholder/padding/min-height chrome lives in input-chrome.css (Task 505/527/528)
        // — inline styles freeze the cascade. DO NOT put minHeight here: Mantine's <Textarea> renders via
        // TextareaAutosize, which throws a hard guard on ANY inline style.minHeight ("Using style.minHeight
        // for <TextareaAutosize/> is not supported. Please use minRows.") — Task 528 D1, §18.1/§18.2.
        input: {
          color: 'var(--mantine-color-gray-8)', // §6 text — gray-800
        },
      },
    },
    PasswordInput: {
      // inputWrapperOrder: description below input (Task 503 owner UX decision, matches TextInput/Textarea)
      defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
      styles: {
        // border/focus/error/placeholder chrome lives in input-chrome.css (Task 505) — inline styles freeze the cascade
        input: {
          minHeight: '2.75rem',                 // ≥44px outer div / TailAdmin h-11 (rem — exemption)
          color: 'var(--mantine-color-gray-8)', // §6 text — gray-800
        },
      },
    },
    Select: {
      defaultProps: { radius: 'lg', size: 'sm' }, // 14px text
      styles: { input: { minHeight: '2.75rem' } }, // ≥44px touch / TailAdmin h-11 (rem — exemption)
    },
    Checkbox: {
      // size='xs' → 16px box (sm ≈ 20px, too large per §6f); body min-height 44px touch target;
      // label font-size reset: xs-size defaults to 12px, §6f requires 14px (sm).
      defaultProps: { radius: 'sm', size: 'xs' },
      styles: {
        body:  { minHeight: '2.75rem', alignItems: 'center' }, // ≥44px touch (rem — same exemption as Button/TextInput)
        label: { fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-gray-7)' }, // §6f 14px / gray-7
      },
    },
    Radio: {
      // size='xs' → 16px circle (sm ≈ 20px, too large per §6g); body min-height 44px touch target;
      // label font-size reset: xs-size defaults to 12px, §6g requires 14px (sm).
      defaultProps: { size: 'xs' },
      styles: {
        body:  { minHeight: '2.75rem', alignItems: 'center' }, // ≥44px touch (rem — same exemption as Button/Checkbox)
        label: { fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-gray-7)' }, // §6g 14px / gray-7
      },
    },
    Switch: {
      // size='sm' → 20px track height (closest to source 18.4px); density-correction-approved (Task 499).
      // body min-height 44px touch target; label font-size reset: sm-size may vary, §6h requires 14px.
      defaultProps: { size: 'sm' },
      styles: {
        body:  { minHeight: '2.75rem', alignItems: 'center' }, // ≥44px touch (rem — same exemption as Button/Checkbox)
        label: { fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-gray-7)' }, // §6h 14px / gray-7
      },
    },
    // InputWrapper: §6 label + §6d description treatment + owner no-asterisk policy (Task 503).
    // NOTE: InputLabel and InputDescription both call useStyles({ name: "InputWrapper" }) internally —
    // all three components share the same CSS module slots. theme.components.InputLabel /
    // InputDescription are no-ops; the single-source override is theme.components.InputWrapper.
    // owner decision (2026-06-26): all fields required by default → no `*`; optional fields use
    // a localized "(optional)" suffix inline in the label text instead of a Mantine asterisk.
    InputWrapper: {
      styles: {
        // §6: 14px (text-theme-sm), gray-700 (text-gray-700). Weight 600 (semibold) — owner override of
        // §6's fw500: Open Sans medium (500) is visually near-identical to 400, so labels use 600 for clear distinction.
        label: {
          fontSize: 'var(--mantine-font-size-sm)',
          fontWeight: 600,
          color: 'var(--mantine-color-gray-7)',
          marginBottom: '0.375rem', // §6l Form Elements — label→field gap 6px (Task 527 fix #3)
        },
        // suppress Mantine's red `*` asterisk globally — no asterisk anywhere, even if `required` is passed
        required: { display: 'none' },
        // §6d: 12px secondary text, gray-500
        description: {
          fontSize: 'var(--mantine-font-size-xs)',
          color: 'var(--mantine-color-gray-5)',
        },
      },
    },
    // SegmentedControl: TailAdmin §6c segment toggle (gray track, white active pill, shadow-xs).
    // color NOT set → Mantine varsResolver auto-sets --sc-shadow = var(--mantine-shadow-xs). ✅
    // fullWidth NOT set → content-width on desktop; swipe-scroll via ScrollArea <640 (owner P0, Task 489 precedent).
    // Already matches §6c: track bg gray-1 ✅ | active pill white ✅ | shadow-theme-xs ✅ | fw=500 ✅ | 14px ✅.
    // Added here: border-gray-2 (Mantine has no border by default) | active text gray-9 (--sc-label-color) |
    //             ≥44px label touch-target (2.75rem exemption — same as Button/Tabs).
    // Deferred: inactive label gray.7 vs §6c gray.5 | hover black vs §6c gray.7 —
    //   require [data-active]:not CSS selectors beyond trivial styles block (same boundary as Task 489 Tabs).
    SegmentedControl: {
      defaultProps: { radius: 'lg', size: 'sm' },
      styles: {
        root: {
          border: '1px solid var(--mantine-color-gray-2)',
        },
        label: {
          minHeight: '2.75rem',     // ≥44px touch target (rem exemption — same as Button/Tabs)
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '--sc-label-color': 'var(--mantine-color-gray-9)', // §6c active text = gray-900
        },
      },
    },
    // Avatar: pill radius (TailAdmin rounded-full). Size 40 = standard composite-cell consumer; size 44 = form/input row.
    // Size is NOT baked in here — passed by consumers (40 default, 44 form).
    Avatar: {
      defaultProps: { radius: 'pill' },
    },
    // Badge: pill radius, light variant, sm size, fw=500 (TailAdmin status badge standard).
    // Mantine's OWN Badge CSS hardcodes 10px/uppercase/700/letter-spacing per size, independent of
    // theme.fontSizes. §6l Addendum (Task 528 D2, corrects Task 527 fix #9): the app's STATUS badges
    // (Active/Pending/Blocked/Archived) are the 12px `text-theme-xs` variant (§6b line 62:
    // `text-theme-xs rounded-full px-2 py-0.5 font-medium`), NOT the 14px large variant — our theme
    // default `size='sm'` is the status default, so it must map to 12px/500/padding 2×8/line-height
    // 18px, not 14px. The 14px variant remains reachable via `size='md'` for a consumer that needs
    // it (untouched — no current consumer relies on 'md'/'lg'/'xl' via the 'sm' default).
    Badge: {
      defaultProps: { radius: 'pill', variant: 'light', size: 'sm' },
      styles: (_theme: MantineTheme, props: BadgeProps) => {
        const size = props.size ?? 'sm'
        return {
          root: {
            fontWeight: 500,
            textTransform: 'none',
            letterSpacing: 'normal',
            ...((size === 'sm' || size === 'xs') && {
              fontSize: '0.75rem',           // §6b/§6l Addendum — text-theme-xs 12px
              lineHeight: '1.125rem',        // §6l Addendum — 18px (text-theme-xs cited value)
              height: 'auto',
              padding: '0.125rem 0.5rem',    // §6b px-2 py-0.5 — 2px 8px
            }),
          },
        }
      },
    },
    // Card: flat-border, 2xl radius (16px), lg padding (20px). No shadow (shadow only on popovers).
    // Border color: gray-2 (#e4e7ec) via scoped CSS variable override (Task 527 fix #7, §6l Cards —
    // corrected from gray-1; live TailAdmin /cards is gray-200, not gray-100. Paper intentionally
    // left at gray-1 — not cited in Task 527's scope, kept as previously decided).
    Card: {
      defaultProps: { radius: '2xl', padding: 'lg' },
      styles: {
        root: { '--mantine-color-default-border': 'var(--mantine-color-gray-2)' },
      },
    },
    // Paper: matches Card for consistent admin surface chrome.
    Paper: {
      defaultProps: { radius: '2xl' },
      styles: {
        root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' },
      },
    },
    // Modal desktop radius = 8px (defaultProps.radius='lg', Task 527 fix #11 — the theme's own
    // stated default; MantineModal.tsx no longer overrides it with a hardcoded radius="md").
    // header styles: title→body gap 8px (Task 527 fix #12, §6l composition rhythm) — Mantine's
    // ModalBase header padding defaults to spacing-md (16px) on every side; body's own top padding
    // resets to 0 when a header is present, so header's bottom padding IS the title→body gap.
    Modal: {
      defaultProps: { radius: 'lg', centered: true },
      styles: {
        header: { paddingBottom: '0.5rem' }, // §6l 8px
      },
    },
    // Drawer shares Modal's ModalBase header/body composition — same title→body 8px rhythm (Task 527 fix #12).
    Drawer: {
      defaultProps: {},
      styles: {
        header: { paddingBottom: '0.5rem' }, // §6l 8px
      },
    },
    // Popover / Menu (MantinePopover / MantineDropdownMenu / MantineNavigationMenu desktop panels) —
    // §6l Dropdowns (Task 527 fix #8) + §6l Addendum (Task 528 D3, corrects Popover radius): Popover
    // container radius 12px (`rounded-xl`, measured live on /popovers + /modals) + 1px gray-200 border
    // + padding 12px + shadow-theme-lg. Dropdowns/Menu stay 16px (`rounded-2xl`) — intentionally
    // different container, per the Addendum. Menu items: 14px / gray-700 / padding ~10x12 / radius 8px.
    // shadow:'lg' below now resolves to the CORRECT TailAdmin shadow-theme-lg value — Task 528 left this
    // referencing Mantine's stock 'lg' shadow scale (wrong value, right key); Task 530 closed the gap by
    // overriding theme.shadows.lg itself (see §5), so no change was needed here — single-source fix.
    Popover: {
      defaultProps: { radius: 'xl', shadow: 'lg' }, // §6l Addendum — 12px (was '2xl'/16px)
      styles: {
        dropdown: {
          border: '1px solid var(--mantine-color-gray-2)',
          padding: '0.75rem', // §6l 12px
        },
      },
    },
    Menu: {
      defaultProps: { radius: '2xl', shadow: 'lg' },
      styles: {
        dropdown: {
          border: '1px solid var(--mantine-color-gray-2)',
          padding: '0.75rem', // §6l 12px
        },
        item: {
          fontSize: 'var(--mantine-font-size-sm)',     // §6l 14px
          color: 'var(--mantine-color-gray-7)',         // §6l gray-700
          padding: '0.625rem 0.75rem',                  // §6l ~10x12
          borderRadius: 'var(--mantine-radius-lg)',     // §6l 8px
        },
      },
    },
    // Table: TailAdmin CRM card-wrapped table (§6b) → px-6 py-3 = 24×12 → horizontalSpacing=xl(24) / verticalSpacing=sm(12).
    // Header: 12px text, fw=500, gray-500; NOT uppercase. Row dividers + hover per §6b.
    // §6b style justification (Task 488):
    //   withRowBorders:true     — Mantine default is true (added for explicit self-doc)
    //   --table-border-color    — Mantine default is global border; override to gray-1 (#f2f4f7) per §6b
    //   thead.backgroundColor   — Mantine default is none; add gray-0 (#f9fafb) per §6b thead bg
    //   th.fontSize             — Mantine default is sm (14px); override to xs (12px) per §6b Th
    //   th.fontWeight           — Mantine default is 700; override to 500 per §6b Th
    //   th.color                — Mantine default inherits; set gray-5 (#667085) per §6b Th
    //   th.textTransform        — Mantine default is uppercase on some themes; explicitly 'none' per §6b
    //   td.fontSize             — Mantine default inherits body; set sm (14px) per §6b Td
    //   td.color                — Mantine default inherits; set gray-7 (#344054) per §6b Td
    //   td.whiteSpace           — Mantine default is normal; nowrap per §6b (desktop only; mobile→cards)
    //   highlightOnHover:true   — Mantine default is false; override for §6b row hover gray-0
    //   verticalSpacing/horizontalSpacing — already present (sm=12/xl=24 = §6b px-6 py-3)
    Table: {
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        verticalSpacing: 'sm',
        horizontalSpacing: 'xl',
        withRowBorders: true,
      },
      styles: {
        table: { '--table-border-color': 'var(--mantine-color-gray-1)' },
        thead: { backgroundColor: 'var(--mantine-color-gray-0)' },
        th: {
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 500,
          color: 'var(--mantine-color-gray-5)',
          textTransform: 'none',
        },
        td: {
          fontSize: 'var(--mantine-font-size-sm)',
          color: 'var(--mantine-color-gray-7)',
          whiteSpace: 'nowrap',
        },
      },
    },
    // Tabs: brand active indicator (§6c). color:'brand' is redundant with primaryColor but
    // explicit for single-source self-documentation. Font-size 14px is already Mantine's
    // default (var(--mantine-font-size-sm)). fw=500 + ≥44px mih via styles.tab.
    // list.flexWrap:'nowrap' → tabs always stay in a single horizontal row (owner P0 —
    // never wrap to a second line; consumers wrap Tabs.List in Box overflowX="auto").
    // Inactive/active text-color exact §6c match (inactive gray.5 / active brand text)
    // requires CSS [data-active] selector — beyond trivial styles block; deferred.
    Tabs: {
      defaultProps: { color: 'brand' },
      styles: {
        tab: { fontWeight: 500, minHeight: '2.75rem' },
        list: { flexWrap: 'nowrap' },
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
