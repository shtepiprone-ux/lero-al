# Mantine Responsive UI Design System — Lero.al

**Status:** ACTIVE CANONICAL SOURCE OF TRUTH — all new UI/layout/component work.  
**Established:** 2026-06-24 — Task 482 (Sonnet 4.6 executor, Opus 4.8 orchestrator).  
**Supersedes:** `docs/design-system.md` for future UI work. Legacy Tailwind/Base UI/shadcn rules in
`docs/design-system.md` remain valid ONLY for existing surfaces not yet migrated.

---

## §1 — Executive decision

Owner declared on 2026-06-24:

> "The legacy Tailwind/Base UI/shadcn-style responsive system has FAILED. Mantine is now the source
> of truth for all responsive UI in lero-al."

**This is a hard owner override, not a preference.** All new UI/layout/component work from Task 482
onward must use Mantine. The old `.container-wide` / Tailwind breakpoint / `withCanvas` responsive
proof model is retired for new work.

Task 482 delivers:
- Mantine v9.4.0 installed and wired into the App Router root layout.
- Light-only Mantine theme with brand colors and project breakpoints.
- 14 canonical reusable pattern components in `src/design-system/mantine/patterns/`.
- Mantine-native Storybook proof path: global `withMantine` decorator, `skipCanvas: true`,
  toolbar-driven viewport and locale proof.
- `storybook.mantine.*` i18n namespace in all 4 locales (en/sq/uk/it).
- Governance docs: this document + supersession notices in `docs/design-system.md` and
  `docs/storybook-governance.md`.

---

## §2 — Why the old responsive design system failed

1. **Width-probe proofs were fake.** Storybook `withCanvas` wrapped stories in `.container-wide`
   which does not reproduce real app viewport widths. Stories passed visually at 640px but broke in
   the real app at 320px.
2. **Per-export viewport proliferation.** The old model required N exported stories × M viewports =
   hundreds of story exports, each making the same claim but with no rendered verification.
3. **No canonical layout API.** Developers invented responsive breakpoints ad-hoc using Tailwind
   classes. No shared contract existed for "how does this surface behave at 320px vs 768px."
4. **Base UI Popup/Positioner missed the P0 bottom-sheet rule.** Dialogs and overlays continued to
   render as centered cards on mobile instead of full-width bottom sheets.
5. **Dark mode / auto color scheme conflict.** `defaultColorScheme="auto"` created inconsistent
   appearance across devices without a clear owner decision.
6. **The `docs/design-system.md` rule layer was not enforced.** Surfaces diverged because no runtime
   system enforced the rules.

Mantine addresses these failures:
- Responsive props system (`{ base: X, sm: Y, md: Z }`) is enforced at the component API level.
- The canonical pattern library codifies responsive behavior once and reuses it everywhere.
- The Storybook toolbar model removes fake width-probe exports.
- The Light-only `forceColorScheme="light"` eliminates color scheme ambiguity.

---

## §3 — Mantine as source of truth

> **🔴 SOURCE-OF-TRUTH SPLIT (owner standing rule, restated 2026-06-27 — applies to EVERY UI task):**
> **BEHAVIOR + RESPONSIVE come from Mantine** (built-in component logic, interaction, a11y, and Mantine's responsive
> system — never reimplemented, wrapped, or re-handled). **VISUAL UI comes from TailAdmin** (`docs/tailadmin-style-reference.md`
> §6/§6d + `demo_tailadmin_com.zip` — every color/spacing/border/radius/shadow value; ZERO invented px/colors — if a value
> isn't in the reference, STOP and ASK). In short: **Mantine supplies the mechanism; TailAdmin dictates the look.** We
> only re-skin Mantine with TailAdmin tokens; we do not re-engineer its behavior or responsive handling.

**For all new UI/layout/component work from Task 482 onward:**

| Rule | Requirement |
|---|---|
| New components | Must use Mantine components from `@mantine/core`. |
| New responsive layout | Must use Mantine's responsive prop system (`{ base, xs, sm, md, lg, xl, xxl }`). |
| New Storybook stories | Must use the Mantine-native proof path (this document §8). |
| New popups/overlays | Must follow P0 bottom-sheet rule (Drawer `position="bottom"` on mobile). |
| New button/control touch targets | Must meet ≥44px / 2.75rem minimum (enforced in theme). |
| New i18n text | Must use `storybook.mantine.*` namespace for stories; app code uses `next-intl` as before. |
| Legacy surfaces | May remain on Tailwind/Base UI until migrated (see Phase roadmap §14). |

**Legacy rule coexistence:**  
`docs/design-system.md` rules for `.container-wide`, Tailwind breakpoints, and `withCanvas` remain
valid ONLY for existing legacy surfaces. These rules must NOT be applied to new Mantine surfaces.

---

## §4 — Official evidence

| Official source | Topic | Extracted requirement | Repo decision | Files affected |
|---|---|---|---|---|
| Mantine docs — Next.js App Router | Next.js App Router setup | CSS imports in root server component; `MantineRootProvider` as client boundary | CSS in `src/app/layout.tsx`; provider in `MantineRootProvider.tsx` | `src/app/layout.tsx`, `src/design-system/mantine/MantineRootProvider.tsx` |
| Mantine docs — `MantineProvider` | Provider setup | Single `MantineProvider` wraps the full app once | Root layout wraps once; locale/admin layouts do NOT add duplicate providers | `src/design-system/mantine/MantineRootProvider.tsx` |
| Mantine docs — `ColorSchemeScript` | FOUC prevention | `ColorSchemeScript` in `<head>` before any CSS prevents flash of wrong color scheme | Kept in `<head>` with `defaultColorScheme="light"` (Light-only) | `src/app/layout.tsx` |
| Mantine docs — CSS imports | CSS import order | `@mantine/core/styles.css` before app CSS so Tailwind utilities can override | Both imports in `src/app/layout.tsx`; `@layer mantine` is below Tailwind `@layer utilities` | `src/app/layout.tsx`, `.storybook/preview.tsx` |
| Mantine docs — color scheme | Light-only setup | `defaultColorScheme="light"` disables auto/dark scheme | `MantineProvider defaultColorScheme="light"`, `forceColorScheme="light"` in Storybook | `src/design-system/mantine/MantineRootProvider.tsx`, `.storybook/preview.tsx` |
| Mantine docs — responsive styles | Responsive prop system | `{ base: X, sm: Y }` on size/spacing props; `useMatches` for non-prop responsive | All pattern components use responsive object props | `src/design-system/mantine/patterns/**` |
| Mantine docs — `createTheme` | Theme API | Raw hex and rem values required as input (not CSS custom properties) | `src/design-system/mantine/theme.ts`; allowlisted in `scripts/design-tokens-allowlist.json` | `src/design-system/mantine/theme.ts` |
| Mantine docs — layout components | Layout API | `AppShell`, `Grid`, `SimpleGrid`, `Stack`, `Group`, `Container` | Used in all 14 canonical patterns | `src/design-system/mantine/patterns/**` |
| Mantine docs — `AppShell` | AppShell API | `AppShell.Navbar` collapses to burger on mobile; `opened` + `toggle` control burger state | `MantineAppShellFoundation` uses `useDisclosure` + `AppShell.Navbar` | `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` |
| Storybook 10 docs | Storybook 10+ integration | Viewport via `globals.viewport`; toolbar globals | `withMantine` global decorator; viewport via toolbar; `parameters.skipCanvas` pattern | `.storybook/preview.tsx` |
| npm registry | Package version | `@mantine/core@^9.4.0` requires `react@^19.2.0` | React 19.2.4 installed; no peer conflict | `package.json` |
| MIT license | License | Mantine is MIT-licensed | Compatible with commercial use; no restriction | `package.json` |
| Tailwind v4 docs | CSS layer coexistence | Mantine uses `@layer mantine`; Tailwind v4 uses `@layer base, components, utilities` — separate cascade layers, no conflict | No `postcss-preset-mantine` needed; Mantine CSS imported directly | `postcss.config.mjs` (unchanged), `src/app/layout.tsx` |
| Mantine docs — `useMediaQuery` | SSR/hydration caveat | Returns `initialValue` (`false`) on first render; media query evaluated only in `useEffect` (`getInitialValueInEffect: true` default in v9) | Documented in `MantineDialogDrawerPattern.tsx`; overlay is always closed on SSR so no visible flash | `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` |

---

## §5 — Provider architecture

| Provider concern | Decision | File | Evidence |
|---|---|---|---|
| Single provider boundary | `MantineProvider` wraps the entire app once, in the root layout | `src/design-system/mantine/MantineRootProvider.tsx` | `export function MantineRootProvider` is the only Mantine provider in the app |
| Root layout wiring | `src/app/layout.tsx` (RSC) imports Mantine CSS and renders `<MantineRootProvider>` | `src/app/layout.tsx` | `import '@mantine/core/styles.css'`; `<MantineRootProvider>{children}</MantineRootProvider>` |
| Locale layout — no duplicate provider | `src/app/[locale]/layout.tsx` does NOT add `MantineProvider` | `src/app/[locale]/layout.tsx` | File imports `NextIntlClientProvider`, `AuthProvider`, `Header`, `Footer` — no Mantine |
| Admin layout — no duplicate provider | `src/app/admin/layout.tsx` does NOT add `MantineProvider` | `src/app/admin/layout.tsx` | File imports `AdminShell`, `Toaster` — no Mantine |
| Storybook Mantine context | `.storybook/preview.tsx` declares `withMantine` global decorator wrapping all stories | `.storybook/preview.tsx` | `const withMantine: Decorator = (Story) => <MantineProvider ...>` |
| Light-only theme | App uses one theme: Light. `defaultColorScheme="light"`, `forceColorScheme="light"` in Storybook | `MantineRootProvider.tsx`, `.storybook/preview.tsx` | No dark-mode code path in Task 482 |
| ColorSchemeScript | Kept in `<head>` with `defaultColorScheme="light"` — prevents FOUC even for Light-only | `src/app/layout.tsx` | `<ColorSchemeScript defaultColorScheme="light" />` |
| ModalsProvider | Included in `MantineRootProvider`; also in Storybook `withMantine` decorator for modal stories | `MantineRootProvider.tsx`, `.storybook/preview.tsx` | `<ModalsProvider>` wraps children in both |
| Notifications | `<Notifications position="top-right" />` rendered in `MantineRootProvider` and Storybook `withMantine` | `MantineRootProvider.tsx`, `.storybook/preview.tsx` | Portal renders notifications globally |
| Storybook locale | `withLocale` decorator reads `context.globals.locale` and wraps stories in `NextIntlClientProvider` | `.storybook/preview.tsx`, all `*.stories.tsx` | `const l = (context?.globals?.locale as string) ?? 'en'` |
| Storybook viewport presets | 12 owner-approved widths defined in `VIEWPORTS` object; accessible via toolbar | `.storybook/preview.tsx` | `mobile275` through `desktop1920` IDs |

---

## §6 — Mantine theme architecture

> **Visual reference:** [demo.tailadmin.com](https://demo.tailadmin.com) (structure, spacing, density — owner
> decision 2026-06-25). Brand color stays `#EC5447`; TailAdmin blue is NOT used.

| Theme concern | Decision | Value |
|---|---|---|
| Brand primary color | `#EC5447` (shade 7) | `primaryColor: 'brand', primaryShade: 7` |
| Color palette | Brand + TailAdmin gray + semantic (success/warning/error) | `colors: { brand, gray, green, yellow, red }` |
| Light-only theme | Owner requirement: no dark mode | `defaultColorScheme: 'light'`; `forceColorScheme: 'light'` in Storybook |
| Font family | **Open Sans** (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506) | Next.js font loader; `fontFamily: '"Open Sans", var(--font-sans), system-ui, ...'` |
| Heading scale | h1=3rem(48) → h6=1.125rem(18) — TailAdmin title-* scale | `headings.sizes.*` |
| Spacing (4px base) | **xs=8 / sm=12 / md=16 / lg=20 / xl=24 px** (TailAdmin §1b) | `spacing: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' }` |
| Radius | **xs=2 / sm=4 / md=6 / lg=8 (controls) / xl=12 / 2xl=16 (Card) / pill=9999 px** | `radius: { ..., '2xl': '1rem', pill: '9999px' }`; `defaultRadius: 'lg'` |
| Touch target | ≥44px via `Button styles.root.minHeight: '2.75rem'` | All Buttons ≥44px regardless of `size` prop |
| Theme breakpoints | 6 breakpoints covering the mobile gate and design widths | xs=20em(320), sm=40em(640), md=48em(768), lg=64em(1024), xl=80em(1280), xxl=90em(1440) |
| Tailwind boundary | `@layer mantine` is separate from `@layer utilities` | No conflict |

### §6.1 — TailAdmin token map (§1b — authoritative; Task 484 2026-06-25)

These values are extracted from TailAdmin's compiled `css/style.css` (Tailwind v4 `@theme`) and are the
**single source of truth** for every Mantine-migrated admin surface. Where §1 estimates differ from §1b
real values, §1b wins.

**Spacing scale:**

| Token | rem | px | Typical use |
|---|---|---|---|
| `xs` | 0.5rem | 8 | meta-row gap, badge padding, tight inline gaps |
| `sm` | 0.75rem | 12 | control gaps, card section rhythm, **table `verticalSpacing` (CRM §6b)** |
| `md` | 1rem | 16 | card inner gap, block gaps |
| `lg` | 1.25rem | 20 | card `padding` |
| `xl` | 1.5rem | 24 | page section separation, **table `horizontalSpacing` (CRM §6b px-6=24)** |

**Radius scale:**

| Token | px | Use |
|---|---|---|
| `xs` | 2 | — |
| `sm` | 4 | Checkbox |
| `md` | 6 | — |
| `lg` | 8 | Button / TextInput / Select / SegmentedControl (`defaultRadius`) |
| `xl` | 12 | — |
| `2xl` | 16 | Card / Paper (`rounded-2xl`) |
| `pill` | 9999 | Badge (status pill, `rounded-full`) |

**Color palette (TailAdmin §1b):**

| Scale | 0/50 | 1/100 | 2/200 | 3/300 | 4/400 | 5/500 | 6/600 | 7/700 | 8/800 | 9/900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `gray` | #f9fafb | #f2f4f7 | #e4e7ec | #d0d5dd | #98a2b3 | #667085 | #475467 | #344054 | #1d2939 | #101828 |
| `green` (success) | #ecfdf3 | #d1fadf | #a9f3c3 | #6ce9a6 | #3dd68c | #12b76a | #039855 | #027a48 | #05603a | — |
| `yellow` (warning) | #fffaeb | — | — | — | #fdb022 | #f79009 | #dc6803 | #b54708 | — | — |
| `red` (error) | #fef3f2 | #fee4e2 | — | #fda29b | #f97066 | #f04438 | #d92d20 | #b42318 | #912018 | — |

`Badge variant="light"` uses index 0 for background and index 6 for text (Mantine v8 light mode):
- Active / success: bg `#ecfdf3` / text `#039855` ✅
- Pending / warning: bg `#fffaeb` / text `#dc6803`
- Error / blocked / inactive: bg `#fef3f2` / text `#d92d20` ✅

**Component density defaults (theme.components):**

| Component | defaultProps | styles |
|---|---|---|
| `Button` | `radius='lg', size='md'` | `root.minHeight: '2.75rem'` (44px touch target) |
| `TextInput / Select / Textarea` | `radius='lg', size='md'` | — |
| `SegmentedControl` | `radius='lg', size='sm'` | — |
| `Badge` | `radius='pill', variant='light', size='sm'` | `root.fontWeight: '500'` |
| `Card` | `radius='2xl', padding='lg'` | border color: `--mantine-color-gray-1` (#f2f4f7), no shadow |
| `Paper` | `radius='2xl'` | border color: `--mantine-color-gray-1`, no shadow |
| `Table` | `highlightOnHover, verticalSpacing='sm'(12px), horizontalSpacing='xl'(24px)` | CRM card-wrapped standard §6b — see `docs/tailadmin-style-reference.md §6b` |
| `Modal` | `radius='lg', centered: true` | — |

**Storybook proof viewport widths vs Mantine theme breakpoints:**

The 12 owner-approved Storybook proof widths are toolbar selectors. Only 6 coincide with Mantine theme breakpoints.

| Width px | em at 16px | Mantine theme breakpoint? | Storybook toolbar ID |
|---:|---:|---|---|
| 275 | 17.1875em | no — narrow stress width | `mobile275` |
| 320 | 20em | xs | `mobile320` |
| 390 | 24.375em | no — modern mobile | `mobile390` |
| 480 | 30em | no — wide mobile | `mobile480` |
| 560 | 35em | no — compact canonical | `canonical560` |
| 680 | 42.5em | no — large mobile / small tablet | `canonical680` |
| 768 | 48em | md | `tablet768` |
| 960 | 60em | no — tablet/desktop transition | `canonical960` |
| 1024 | 64em | lg | `desktop1024` |
| 1200 | 75em | no — wide content | `canonical1200` |
| 1440 | 90em | xxl | `desktop1440` |
| 1920 | 120em | no — wide monitor | `desktop1920` |

**Key distinction:** Mantine's `{ base, sm, md, lg }` responsive prop system uses the 6 theme
breakpoints. Storybook proof widths cover all 12 widths via the toolbar without requiring 12 separate
story exports.

---

## §7 — Mantine responsive rules

| Rule | Requirement |
|---|---|
| P0 mobile gate | All tappable text buttons, selects, inputs, tabs, and controls must be full-width below `sm` (40em / 640px) |
| P0 popup gate | All popups (Dialog, Drawer, Select, Menu, Combobox) must render as full-width bottom sheet below `sm`: `position="bottom"`, top-only radius, ≤90dvh, internal scroll, drag handle, closes on backdrop + Esc |
| 🔴 P0 table gate (owner P0, 2026-06-25, restated) | **Every data table MUST collapse to stacked cards below `sm` (40em/640px) — one card per row, via `MantineDataTableToCards`.** Horizontal scrolling of table *content* on mobile is **FORBIDDEN** — neither page-level nor an internal `ScrollArea`/`overflow-x`. The mobile reader never side-scrolls a table; they read cards. At ≥`sm` the desktop §6b card-wrapped table is kept (a desktop-only `ScrollArea` inside the card is acceptable there). **Table-specific** — does NOT override the §7.1 filter-control rule, where `SegmentedControl`/`Tabs` MAY use horizontal swipe-scroll (those are controls, not data tables). A data table left scrolling horizontally on mobile is a TASK FAILURE. |
| Responsive API | Use `{ base: X, sm: Y }` responsive objects on Mantine props (e.g. `w={{ base: '100%', sm: 'auto' }}`) |
| Touch targets | Every mobile-reachable text button: `size="lg"` (50px) or `styles.root.minHeight: '2.75rem'` |
| No Tailwind responsive | New Mantine components must NOT use Tailwind `sm:` / `md:` responsive class prefixes |
| No `.container-wide` | New Mantine pattern components must NOT depend on `.container-wide` for responsive layout |
| `useMediaQuery` caveat | Only use `useMediaQuery` when Mantine responsive props cannot solve the requirement. Always document the SSR/hydration caveat (returns `initialValue=false` until hydration) |

### §7.1 — Spacing rhythm (Task 483 REWORK — codified 2026-06-24)

**All spacing in `src/design-system/mantine/**` and migrated surfaces uses Mantine `theme.spacing` tokens
exclusively. Raw px values for spacing, gap, padding, or margin are forbidden.**

| Concern | Rule | Example |
|---|---|---|
| Vertical padding on rows | Use `py="xs"` / `py="sm"` / `py="md"` | `py="xs"` (8px) not `py={4}` |
| Gap between elements | Use Mantine `gap="xs"` / `gap="sm"` | `gap="sm"` (12px) not `gap={8}`, not `marginRight: 8` |
| Table cell rhythm | Use `verticalSpacing="sm"` (12px) + `horizontalSpacing="xl"` (24px) on `<Table>` — CRM §6b standard (px-6 py-3), comes from `theme.components.Table.defaultProps`; explicit only when overriding | Replaces sparse auto columns |
| Touch-target minimum | `mih="2.75rem"` (rem string) is the ONLY raw-value exemption — it is a touch-target, not spacing | `mih="2.75rem"` ✅ |
| Card meta row layout | `Group justify="space-between"` — label flush LEFT edge, value flush RIGHT edge (`textAlign: 'right'`). NO fixed-percentage columns (38%/62% retracted). Vertical rhythm: `Stack gap="xs"` for meta rows, `gap="md"` on each row Group | Label left · value right |
| Table column alignment | Pass `align?: 'left' \| 'center' \| 'right'` and `width?` through `TableColumn` → applied to `Table.Th`/`Table.Td` | No sparse sparse auto-column sprawl |
| Filter controls | Use `SegmentedControl` (not individual Buttons) for mutually exclusive single-select filters; wrap in `ScrollArea scrollbars="x"` when i18n labels exceed container width at 320px | No full-width gray button bars |

**Rationale:** Raw px values couple layout to pixel counts rather than to the design token scale, producing
inconsistent spacing rhythm across surfaces and breaking Mantine's 4px-base grid. The edge-anchored card row
(`justify="space-between"`) aligns labels to the left padded edge and values to the right padded edge — every
row spans the full card width, no dead space.

**Future-task obligation:** Every Mantine migration task that adds a data table or card list MUST use
`MantineDataTableToCards` and satisfy this rhythm. Reviewer checklist (§16) includes a spacing-token gate.

### §7.2 — Admin data card anatomy (Task 483 REWORK #2 — codified 2026-06-25)

**The `CardConfig<R>` interface on `MantineDataTableToCards` is the ONLY canonical admin card design.**
Generic label:value dumps (every column → a divided row) are NOT acceptable for admin user/listing surfaces.
When providing a `card` prop, the mobile card MUST follow this anatomy:

```
┌─────────────────────────────────────────┐  Card padding="lg" (20px) defines side edges
│ #101 (gray.5 xs)        [actions ≥44px] │  ← Header: Group justify="space-between"
├─────────────────────────────────────────┤  ← Divider color="gray.1"
│ [Avatar]  Name fw=500      [Status badge]│  ← Primary: Group justify="space-between"
│           Company gray.5 xs             │     align="flex-start" (badge top-aligned)
├─────────────────────────────────────────┤  ← Divider color="gray.1" (ONE above meta)
│ Role                     [Role badge] ► │  ← Meta: Stack gap="xs"
│ Phone             +355 69 xxx         ► │     Each row: Group justify="space-between"
│ Date               24 Jun 2026        ► │     label: Text xs gray.5 flexShrink:0
└─────────────────────────────────────────┘     value: div textAlign:'right'
```

Edge-anchoring rule: every card row is `Group justify="space-between"` — label hugs the LEFT padded edge, value hugs the RIGHT padded edge. NO fixed-percentage columns.

| Anatomy zone | Rule |
|---|---|
| Header | `Group justify="space-between" wrap="nowrap" align="center"` → `Text size="xs" c="gray.5"` (id left) \| `Group gap="xs" wrap="nowrap"` (actions right); followed by `<Divider color="gray.1" />` |
| Primary | `Group justify="space-between" wrap="nowrap" align="flex-start"` → `Group gap="sm"(avatar + Stack gap={2}(title, subtitle))` \| badge `div flexShrink:0` |
| Title | Consumer-provided ReactNode (`size="sm" fw={500} c="gray.7"` recommended); pattern does NOT re-style |
| Subtitle | `Text size="xs" c="gray.5" truncate="end"`; omitted if null/undefined |
| Badge | Status badge `div flexShrink:0` top-aligned right; omitted if null/undefined |
| Divider (meta) | `<Divider color="gray.1" />` — ONE above meta block, ONE after header. NOT one per field |
| Meta rows | `Group justify="space-between" wrap="nowrap" align="center" gap="md"` → label `Text size="xs" c="gray.5" flexShrink:0` left \| value `div textAlign:'right' minWidth:0` right. Null returns skipped |
| All spacing | Theme tokens only. `gap={2}` (title/subtitle micro-gap) is the only numeric exemption |
| Actions touch | Card action `ActionIcon`: add `mih="2.75rem" miw="2.75rem"` (touch-target rem exemption). Keep visual `size="sm"` for icon proportions. |
| No generic dump | Providing `card` prop = designed anatomy. Omitting `card` = backward-compatible generic layout |

**Story proof requirement (§16 gate):** Pattern stories that accept `card` MUST demonstrate the anatomy with
avatar/title/subtitle/badge/meta/actions — not a minimal stub. The story is the rendered specification.

---

## §8 — Mantine Storybook proof rules

| Storybook concern | Required Task 482 behavior |
|---|---|
| Story group | `Patterns/Mantine/<PatternName>` |
| Exported stories per group | `Default` only — exactly one |
| Viewport switching | Storybook toolbar (owner selects from 12 proof widths) |
| Locale switching | Storybook toolbar (owner selects en / uk / sq / it) |
| Theme | Light only — `forceColorScheme="light"` in `withMantine` |
| Canvas wrapper | `parameters.skipCanvas: true` — bypasses `withCanvas` / `.container-wide`. **Requires explicit page-gutter Box in the story's `render` fn** (see §8.1 below). Full-bleed is NEVER acceptable for page-content stories. |
| Layout | `parameters.layout: 'fullscreen'` |
| Canonical layout | Imported from `src/design-system/mantine/patterns/**` — not implemented inside the story |
| i18n text | `storyT(locale, 'storybook.mantine.*')` via `src/stories/_storyI18n.ts` |
| Locale reading | `context.globals.locale` in `render` fn |
| Forbidden exports | `Mobile320`, `Mobile390`, `Mobile480`, `Tablet768`, `Desktop1024`, `Desktop1440`, `Wide1920`, `Viewport275`, `Viewport560`, `Viewport680`, `Viewport960`, `Viewport1200`, `Uk`, `Sq`, `It`, `En`, `LongUk`, `Dark`, `Pass`, `Fail` — all forbidden |

**Storybook proof scope statement:**  
Viewport proof for Task 482 is toolbar-driven. Mantine stories do not export viewport variants.
The owner switches viewport through the Storybook toolbar. Locale proof is toolbar-driven. The single
Default story renders translated `storybook.mantine.*` strings for the active locale. Theme is
Light-only — no Dark story exports exist or are required.

### §8.1 — Mantine story page-gutter rule (Task 485 REWORK #2 — owner decision 2026-06-25)

`parameters.skipCanvas: true` bypasses the `withCanvas` decorator (`.container-wide py-6`) entirely,
rendering the story full-bleed (zero horizontal + vertical gutter). **Full-bleed is reserved ONLY for
bottom-sheet popup stories.** Page-content stories (admin tables, card lists, form sections) MUST render
inside an explicit responsive gutter container.

**Required gutter wrapper for all admin/table/card Mantine stories:**

```tsx
export const Default: Story = {
  render: (args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        {/* component here */}
      </Box>
    );
  },
};
```

| Concern | Rule |
|---|---|
| Gutter token | `px={{ base: 'md', sm: 'xl' }}` — 16px mobile / 24px desktop (owner-decided 2026-06-25). `py="md"` (16px). All theme tokens; no raw px. |
| Why responsive | Mirrors the canonical admin page gutter. On mobile the card renders inset from the viewport edge (not full-bleed). On desktop the wider xl gutter matches the admin shell spacing. |
| Out of scope | Full-bleed bottom-sheet popup stories (`Drawer`, dialog-only). Non-admin wide-layout stories may use a different token (decide per case). |
| Migration debt | `/admin/users/page.tsx` still uses Tailwind `p-6 max-w-10xl` — migrating to a Mantine admin shell with this responsive gutter is a separate follow-up task. |

### §8.2 — One section per STATE, never per viewport; interactive overlays must actually open (owner P0 — 2026-06-30, after the Task 513 Popover rejection) 🔴

The owner rejected the Task 513 Popover story for the SAME defect class twice in a row (it had already been removed from Select in Task 511). This is now a HARD rule on every story and every kickoff:

1. **🔴 NO viewport-duplicate sections.** A story MUST NEVER contain two (or more) sections that render the **same component state** and differ only in the **viewport they are meant to be viewed at** — e.g. the rejected Popover's `open anchored — switch toolbar ≥640` + `open bottom sheet — switch toolbar <640`, which are ONE open state shown twice. Responsive behavior is proven by the **Storybook toolbar viewport switcher on a SINGLE section**, never by duplicating the section per breakpoint. **Story sections represent distinct STATES** (resting/closed · error · disabled · loading · empty · long-label), **never distinct breakpoints.** Duplicating a component to demonstrate `<640` vs `≥640` is exactly what spawns the duplicate-component sprawl the owner is eliminating. A kickoff that lists per-viewport sections is a kickoff defect (this was MY error on Task 513).

2. **🔴 NO fake-open via `defaultOpened`/`defaultDropdownOpened` standing in for working interaction.** An overlay's open state MUST be reachable by the **real user gesture** — clicking/tapping the trigger. A permanently-open `defaultOpened` snapshot is NOT acceptable as proof that the overlay "opens", because it hides a broken trigger handler — exactly what shipped on Popover (clicking the trigger did nothing; only the load-time `defaultOpened` render appeared). If an "open" demo is shown at all, it must open via a **real click in the canvas**, and the rendered proof must capture the **click → open transition**, not a baked-open element.

**Consequence for every overlay story (Select · Popover · Menu/DropdownMenu · NavigationMenu · Tooltip · Combobox):** the `Default` story shows the **trigger in its real states only** (closed/resting + disabled, plus error/empty where applicable). The open / anchored-vs-bottom-sheet behavior is verified by **clicking the trigger and switching the toolbar viewport** — ONE trigger, both behaviors — never two baked-open sections. The clause-12 rendered matrix for an overlay MUST be produced from an **actually-clicked-open** overlay; a `defaultOpened` matrix is rejected on sight.

> Candidate machine gate (follow-up): extend `check:stories` to flag (a) any `defaultOpened`/`defaultDropdownOpened` prop in a story and (b) sibling sections whose only delta is a viewport note. Until then this is enforced at orchestrator review with rendered evidence.

---

## §9 — UI migration classification (representative, not exhaustive per-file)

> **Scope note:** This section is a **representative classification**, not a per-file exhaustive inventory.
> The codebase has 263 product UI files + 70 story files. A literal row-per-file table at that scale
> produces an unmaintainable document. Grouped rows represent directories or modules where every file
> in the group shares the same migration class. Groups are labeled honestly (e.g. "≈20 files") and no
> group mixes migration classes. Section 10 reflects this: counts are rows in this table, not individual
> files. Per-file inventory will be produced as part of each migration task's own kickoff/session log.

Discovery scope: `src/app/**/*.tsx`, `src/components/**/*.tsx`, `src/modules/**/*.tsx`,
`src/stories/**/*.tsx`, `.storybook/**/*`, `src/app/globals.css`, `scripts/check-stories*.mjs`,
UI governance docs.

**Approximate file counts:**
- UI product files: ~263 (app ≈45, components ≈137, modules ≈81)
- Story files: ~70 total (14 Mantine + ~56 legacy)
- Storybook config/support: 5 (`.storybook/` dir)
- UI governance docs audited: 7

### Mantine pattern components (Task 482 deliverables — already implemented)

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | App shell / responsive nav | Mantine AppShell + Navbar + Burger | None — P0 compliant | `Patterns/Mantine/AppShellFoundation` Default | REPLACE WITH MANTINE | MantineAppShellFoundation | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx` | Page header with action buttons | Mantine Group + Stack + Button responsive | None — P0 compliant | `Patterns/Mantine/PageHeaderWithActions` Default | REPLACE WITH MANTINE | MantinePageHeaderWithActions | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineFormSectionStack.tsx` | Multi-section stacked form | Mantine Paper + Stack + TextInput | None — full-width | `Patterns/Mantine/FormSectionStack` Default | REPLACE WITH MANTINE | MantineFormSectionStack | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineTwoColumnForm.tsx` | 2-column responsive form | Mantine SimpleGrid + TextInput | None — SimpleGrid responsive | `Patterns/Mantine/TwoColumnForm` Default | REPLACE WITH MANTINE | MantineTwoColumnForm | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineResponsiveActionFooter.tsx` | Sticky action footer | Mantine Stack/Group responsive | None — P0 compliant | `Patterns/Mantine/ResponsiveActionFooter` Default | REPLACE WITH MANTINE | MantineResponsiveActionFooter | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineCardGrid.tsx` | Responsive card grid | Mantine SimpleGrid responsive cols | None — responsive | `Patterns/Mantine/CardGrid` Default | REPLACE WITH MANTINE | MantineCardGrid | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` | Table→cards responsive data | Mantine Table + Stack (mobile) | None — responsive | `Patterns/Mantine/DataTableToCards` Default | REPLACE WITH MANTINE | MantineDataTableToCards | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` | Dialog (desktop) / Drawer (mobile) | Mantine Modal + Drawer, useMediaQuery | useMediaQuery SSR caveat documented | `Patterns/Mantine/DialogDrawerPattern` Default | REPLACE WITH MANTINE | MantineDialogDrawerPattern | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` | Empty / loading / error states | Mantine Loader + Text + Button | None — centered | `Patterns/Mantine/EmptyLoadingErrorState` Default | REPLACE WITH MANTINE | MantineEmptyLoadingErrorState | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` | Notification system | Mantine notifications + showNotification | None | `Patterns/Mantine/NotificationPattern` Default | REPLACE WITH MANTINE | MantineNotificationPattern | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Listing property card | Mantine Card + Badge + Button | None — full-width CTA | `Patterns/Mantine/ListingCardPattern` Default | REPLACE WITH MANTINE | MantineListingCardPattern | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | Listing detail layout | Mantine Grid + Paper + Button | None — stacked on mobile | `Patterns/Mantine/ListingDetailPattern` Default | REPLACE WITH MANTINE | MantineListingDetailPattern | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Admin CRUD surface | Mantine Table + DataTableToCards + Pagination | None — full-width on mobile | `Patterns/Mantine/AdminSurfacePattern` Default | REPLACE WITH MANTINE | MantineAdminSurfacePattern | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` | Auth forms (login/register) | Mantine Paper + TextInput + Button | None — full-width on mobile | `Patterns/Mantine/AuthFormPattern` Default | REPLACE WITH MANTINE | MantineAuthFormPattern | Phase 1 ✅ | None |
| `src/design-system/mantine/theme.ts` | Mantine theme config | createTheme() with brand colors and breakpoints | None | n/a | NON-UI SUPPORT | n/a | Phase 1 ✅ | None |
| `src/design-system/mantine/MantineRootProvider.tsx` | App provider boundary | MantineProvider + ModalsProvider + Notifications | None | n/a | NON-UI SUPPORT | n/a | Phase 1 ✅ | None |
| `src/design-system/mantine/patterns/index.ts` | Pattern barrel export | TypeScript re-export | None | n/a | NON-UI SUPPORT | n/a | Phase 1 ✅ | None |

### UI primitives — `src/components/ui/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/components/ui/button.tsx` | Primary button primitive | shadcn/radix Button | P0 risk: touch target not verified at all breakpoints | Story exists | MIGRATE TO MANTINE | `<Button>` from @mantine/core | Phase 2 | Verify existing usage compat |
| `src/components/ui/input.tsx` | Text input primitive | shadcn/radix Input | Full-width risk on mobile | Story exists | MIGRATE TO MANTINE | `<TextInput>` / `<Textarea>` | Phase 2 | — |
| `src/components/ui/dialog.tsx` | Modal/dialog overlay | shadcn/radix Dialog | P0 risk: centered card on mobile instead of bottom sheet | Story exists | MIGRATE TO MANTINE | `<Modal>` + `<Drawer position="bottom">` | Phase 2 | Owner AC: P0 migration priority |
| `src/components/ui/sheet.tsx` | Sheet / bottom drawer | shadcn/radix Sheet | P0 risk: may not meet bottom-sheet spec exactly | Story exists | MIGRATE TO MANTINE | `<Drawer position="bottom">` | Phase 2 | — |
| `src/components/ui/tabs.tsx` | Tab navigation | shadcn/radix Tabs | P0 risk: tabs may not be full-width on mobile | Story exists | MIGRATE TO MANTINE | `<Tabs>` | Phase 2 | — |
| `src/components/ui/select.tsx` | Dropdown select | shadcn/radix Select | P0 risk: dropdown may not bottom-sheet on mobile | Story exists | MIGRATE TO MANTINE | `<Select>` / `<Combobox>` | Phase 2 | — |
| `src/components/ui/checkbox.tsx` | Checkbox | shadcn/radix Checkbox | Low risk | Story exists | MIGRATE TO MANTINE | `<Checkbox>` | Phase 3 | — |
| `src/components/ui/badge.tsx` | Status badge | shadcn/ui Badge | Low risk | No story | MIGRATE TO MANTINE | `<Badge>` | Phase 3 | — |
| `src/components/ui/card.tsx` | Card container | shadcn/ui Card | Low risk | No story | MIGRATE TO MANTINE | `<Card>` | Phase 3 | — |
| `src/components/ui/command.tsx` | Command palette | shadcn/radix Command | P0 risk: command not bottom-sheet on mobile | Story exists | MIGRATE TO MANTINE | `<Combobox>` with bottom Drawer | Phase 2 | — |
| `src/components/ui/popover.tsx` | Popover overlay | shadcn/radix Popover | P0 risk: popover not bottom-sheet on mobile | Story exists | MIGRATE TO MANTINE | `<Popover>` with mobile Drawer fallback | Phase 2 | — |
| `src/components/ui/dropdown-menu.tsx` | Dropdown menu | shadcn/radix DropdownMenu | P0 risk: not bottom-sheet on mobile | Story exists | MIGRATE TO MANTINE | `<Menu>` with bottom Drawer on mobile | Phase 2 | — |
| `src/components/ui/navigation-menu.tsx` | Nav menu | shadcn/radix NavigationMenu | P0 risk: not bottom-sheet on mobile | Story exists | MIGRATE TO MANTINE | Mantine nav pattern | Phase 3 | — |
| `src/components/ui/skeleton.tsx` | Loading skeleton | shadcn/ui Skeleton | Low risk | Story exists | MIGRATE TO MANTINE | `<Skeleton>` | Phase 3 | — |
| `src/components/ui/sonner.tsx` | Toast notifications (legacy) | Sonner toast library | Low risk | No story | KEEP TEMPORARILY AS LEGACY | `<Notifications>` (Mantine) | Phase 4 | Must replace Toaster in locale/admin layouts |
| `src/components/ui/appImageConfig.ts` | Next/Image config | TypeScript constants | None | n/a | NON-UI SUPPORT | n/a | n/a | — |

### Layout components — `src/components/layout/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/components/layout/Header.tsx` | Public site header | Tailwind + shadcn | P0 risk: mobile nav behavior | No story | MIGRATE TO MANTINE | MantineAppShellFoundation | Phase 3 | Complex: auth state + locale switching |
| `src/components/layout/Footer.tsx` | Public site footer | Tailwind Grid | Low risk | No story | MIGRATE TO MANTINE | Mantine Grid/Stack | Phase 4 | — |
| `src/components/layout/MobileBottomNav.tsx` | Mobile bottom navigation | Tailwind fixed bar | P0 risk: touch targets | No story | MIGRATE TO MANTINE | Mantine fixed Group | Phase 3 | — |
| `src/components/layout/AdminShell.tsx` | Admin app shell | Tailwind sidebar | P0 risk: mobile sidebar | No story | MIGRATE TO MANTINE | MantineAppShellFoundation | Phase 3 | — |

### Admin components — `src/components/admin/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/components/admin/AdminSidebar.tsx` | Admin sidebar nav | Tailwind + shadcn Sheet | P0 risk: mobile drawer | Story exists | MIGRATE TO MANTINE | MantineAppShellFoundation Navbar | Phase 3 | — |
| `src/components/admin/AdminLocaleSwitcher.tsx` | Locale switcher dropdown | shadcn DropdownMenu | P0 risk: dropdown not bottom-sheet | Story exists | MIGRATE TO MANTINE | Mantine Menu + mobile Drawer | Phase 2 | — |
| `src/components/admin/AdminListingsTable.tsx` | Admin listings data table | Custom Tailwind table | P0 risk: horizontal scroll on mobile | Story exists | MIGRATE TO MANTINE | MantineDataTableToCards + MantineAdminSurfacePattern | Phase 3 | Complex — canonical AdminTable |
| `src/components/admin/AdminCurrenciesManager.tsx` | Currency CRUD | shadcn Dialog form | P0 risk: dialog not bottom-sheet | Story exists | MIGRATE TO MANTINE | MantineDialogDrawerPattern + MantineAdminSurfacePattern | Phase 3 | — |
| `src/components/admin/AdminExchangeProvidersManager.tsx` | Provider CRUD | shadcn Dialog form | P0 risk: dialog not bottom-sheet | Story exists | MIGRATE TO MANTINE | MantineDialogDrawerPattern + MantineAdminSurfacePattern | Phase 3 | — |
| `src/components/admin/StatusChangeControl.tsx` | Status change select | shadcn Select | P0 risk: dropdown not bottom-sheet | Story exists | MIGRATE TO MANTINE | `<Select>` (Mantine, bottom-sheet on mobile) | Phase 2 | — |
| `src/components/admin/AdminReportsManager.tsx` | Reports CRUD admin surface | Tailwind + shadcn | P0 risk | No story | MIGRATE TO MANTINE | MantineAdminSurfacePattern | Phase 3 | Task 462/463 in progress |
| Other `src/components/admin/*.tsx` (≈20 files) | Admin UI surfaces | Tailwind + shadcn variants | P0 risk varies | Varies | MIGRATE TO MANTINE | Mantine equivalents per surface | Phase 3 | Per-surface owner review |

### Shared components — `src/components/shared/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/components/shared/WebVitalsReporter.tsx` | CWV reporting | Non-visual | None | n/a | NON-UI SUPPORT | n/a | n/a | — |
| `src/components/shared/PerformanceStoreInit.tsx` | Perf store init | Non-visual | None | n/a | NON-UI SUPPORT | n/a | n/a | — |
| `src/components/shared/PerfDevOverlay.tsx` | Dev overlay | Dev-only fixed overlay | Dev-only | n/a | KEEP TEMPORARILY AS LEGACY | Mantine dev overlay (future) | Phase 6 | Dev-only, low priority |
| Other `src/components/shared/*.tsx` (≈15 files) | Shared non-UI utilities | Non-visual | None | n/a | NON-UI SUPPORT | n/a | n/a | — |

### App pages — `src/app/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/app/layout.tsx` | Root layout | RSC, provider wiring | None (already wired) | n/a | NON-UI SUPPORT | n/a | Phase 1 ✅ | None |
| `src/app/[locale]/layout.tsx` | Locale layout | RSC, i18n + auth | None | n/a | KEEP TEMPORARILY AS LEGACY | No migration needed (auth/i18n layer) | n/a | — |
| `src/app/admin/layout.tsx` | Admin layout | RSC, auth guard | None | n/a | KEEP TEMPORARILY AS LEGACY | No migration needed (auth layer) | n/a | — |
| `src/app/[locale]/page.tsx` | Home page | Tailwind layout | P0 risk: listing grid | No story | MIGRATE TO MANTINE | MantineCardGrid + Mantine layout | Phase 4 | — |
| `src/app/[locale]/listings/page.tsx` | Listings search | Tailwind layout + filters | P0 risk: filter controls | No story | MIGRATE TO MANTINE | MantineAdminSurfacePattern + MantineCardGrid | Phase 4 | Complex: URL state + filters |
| `src/app/[locale]/listings/[id]/page.tsx` | Listing detail | Tailwind 2-col layout | P0 risk: detail layout collapse | No story | MIGRATE TO MANTINE | MantineListingDetailPattern | Phase 4 | — |
| `src/app/[locale]/(auth)/**/*.tsx` | Auth pages | Tailwind centered forms | P0 risk: form width | No story | MIGRATE TO MANTINE | MantineAuthFormPattern | Phase 3 | — |
| `src/app/[locale]/cabinet/**/*.tsx` | Cabinet/profile pages | Tailwind forms | P0 risk: form layout | No story | MIGRATE TO MANTINE | MantineFormSectionStack + MantineTwoColumnForm | Phase 4 | — |
| `src/app/admin/**/*.tsx` (≈15 files) | Admin pages | Tailwind + shadcn | P0 risk varies | Varies | MIGRATE TO MANTINE | MantineAdminSurfacePattern variants | Phase 3–4 | Per-page owner review |
| `src/app/globals.css` | Global CSS | Tailwind v4 base | None | n/a | KEEP TEMPORARILY AS LEGACY | `.container-wide` stays for legacy until Phase 6 | Phase 6 | — |

### Module UI components — `src/modules/`

| Source | UI role | Current impl type | Responsive risk | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|---|
| `src/modules/notifications/components/NotificationCenter.tsx` | Notification center UI | shadcn Sheet (bottom) | P0 risk: may not meet exact spec | Story exists | MIGRATE TO MANTINE | Mantine Drawer + MantineNotificationPattern | Phase 3 | — |
| `src/modules/listings/**/*.tsx` (≈30 files) | Listing module UI | Tailwind + shadcn | P0 risk varies | Varies | MIGRATE TO MANTINE | Mantine listing patterns | Phase 4 | Per-component owner review |
| `src/modules/auth/**/*.tsx` (≈15 files) | Auth module UI | Tailwind + shadcn | P0 risk: forms | Some stories | MIGRATE TO MANTINE | MantineAuthFormPattern | Phase 3 | Auth flow preservation |
| `src/modules/admin/**/*.tsx` (≈20 files) | Admin module UI | Tailwind + shadcn | P0 risk varies | Some stories | MIGRATE TO MANTINE | Admin patterns | Phase 3–4 | Per-module review |
| All other `src/modules/**/*.ts` (non-UI) | Domain/server logic | TypeScript | None | n/a | NON-UI SUPPORT | n/a | n/a | — |

### Storybook stories — existing legacy

| Source | UI role | Current impl type | Storybook status | Migration class | Mantine target | Phase | Blocker |
|---|---|---|---|---|---|---|---|
| `src/stories/Containers.stories.tsx` | Container governance story | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Delete after Phase 6 | Phase 6 | — |
| `src/stories/AdminLayout.stories.tsx` | Admin layout story | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Migrate to Mantine AppShell story | Phase 5 | — |
| `src/stories/EmptyState.stories.tsx` | Empty state story | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | MantineEmptyLoadingErrorState | Phase 5 | — |
| `src/stories/ListingGrid.stories.tsx` | Listing grid story | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | MantineCardGrid | Phase 5 | — |
| `src/stories/FeaturedListings.stories.tsx` | Featured listings | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | MantineCardGrid | Phase 5 | — |
| `src/stories/RecentlyViewedSection.stories.tsx` | Recently viewed | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | MantineCardGrid | Phase 5 | — |
| `src/stories/SimilarListings.stories.tsx` | Similar listings | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | MantineCardGrid | Phase 5 | — |
| `src/stories/VerifiedPage.stories.tsx` | Verified page | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Mantine page pattern | Phase 5 | — |
| `src/stories/PlantedVisualViolations.stories.tsx` | QA violation reference | Governance | Active | KEEP TEMPORARILY AS LEGACY | Update with Mantine violation patterns | Phase 5 | — |
| `src/stories/patterns/mantine/**` (14 files) | Mantine canonical patterns | Mantine native proof | Active — Default export | REPLACE WITH MANTINE | Already done | Phase 1 ✅ | None |
| `src/components/ui/*.stories.tsx` (≈10 files) | UI primitive stories | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Migrate when primitive migrated | Phase 5 | — |
| `src/components/admin/*.stories.tsx` (≈12 files) | Admin component stories | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Migrate when component migrated | Phase 5 | — |
| `src/modules/**/*.stories.tsx` (≈14 files) | Module component stories | withCanvas proof | Active | KEEP TEMPORARILY AS LEGACY | Migrate when component migrated | Phase 5 | — |

### Storybook config/support

| Source | UI role | Current impl type | Migration class | Phase | Notes |
|---|---|---|---|---|---|
| `.storybook/preview.tsx` | Global decorators + viewport config | withMantine + withLocale + withCanvas + withTheme | NON-UI SUPPORT | Phase 1 ✅ | Task 482: mobile275 added, locale labels updated, Light-only |
| `.storybook/main.ts` | Storybook framework config | @storybook/nextjs-vite | NON-UI SUPPORT | n/a | — |
| `.storybook/preview-head.html` | CDN font preload | Geist font CDN link | NON-UI SUPPORT | n/a | — |
| `scripts/story-realmode-allowlist.json` | Check 12/13 allowlist | JSON config | NON-UI SUPPORT | Phase 1 ✅ | Task 482: removed 84 stale Mantine entries |
| `scripts/check-stories.mjs` | Story governance check | Node.js script | NON-UI SUPPORT | n/a | — |

### UI governance docs

| Source | UI role | Migration class | Phase | Notes |
|---|---|---|---|---|
| `docs/mantine-responsive-design-system.md` | Mantine UI governance | NON-UI SUPPORT | Phase 1 ✅ | Active canonical reference (this document) |
| `docs/design-system.md` | Legacy UI governance | NON-UI SUPPORT | Phase 1 ✅ | Demoted to legacy-reference (Task 482 notice added) |
| `docs/storybook-governance.md` | Storybook governance | NON-UI SUPPORT | Phase 1 ✅ | Mantine proof-path notice added |
| `docs/ui-rules.md` | UI coding rules | NON-UI SUPPORT | Phase 2 | Future: add Mantine-specific rules |
| `docs/rule-index.md` | Task pre-read index | NON-UI SUPPORT | Phase 1 ✅ | Mantine freeze block added |
| `docs/tailwind-governance.md` | Tailwind rules | NON-UI SUPPORT | n/a | Stays valid for legacy surfaces |
| `docs/component-rules.md` | Component rules | NON-UI SUPPORT | Phase 2 | Future: add Mantine component rules |

---

## §10 — Migration classification count

> These counts reflect **rows in §9's classification table**, not individual file counts. The
> per-file counts (≈263 product UI files, ≈70 story files) are approximate; exact numbers belong
> in each migration task's kickoff document, not here.

| Metric | Notes |
|---|---|
| Classification rows in §9 | 77 representative rows (not file count) |
| REPLACE WITH MANTINE | 17 rows — Phase 1 Mantine pattern components (complete) |
| MIGRATE TO MANTINE | 34 rows — existing Tailwind/shadcn surfaces, Phases 2–4 |
| WRAP TEMPORARILY | 0 |
| KEEP TEMPORARILY AS LEGACY | 20 rows — layouts, CSS, legacy stories, dev overlay |
| DELETE AFTER MIGRATION | 0 |
| NON-UI SUPPORT | 6 rows — theme.ts, provider, config, governance docs |
| BLOCKED — OWNER DECISION | 0 |

*Approximate product file scope: ~263 tsx files across app/components/modules. Exact file list
per migration phase will be established in each phase's kickoff document.*

---

## §11 — Legacy-to-Mantine component map

| Legacy category | Legacy source paths | Mantine target | Migration action | Product surfaces affected | Phase | Risk |
|---|---|---|---|---|---|---|
| Button | `src/components/ui/button.tsx`, shadcn Button | `<Button>` @mantine/core | Replace import + props | All pages with CTA, forms, admin actions | Phase 2 | Medium — verify touch targets |
| Icon button | `src/components/ui/button.tsx` with icon children | `<ActionIcon>` | Replace Button+icon with ActionIcon | Header, admin tables | Phase 2 | Low |
| Link button | `<Button asChild>` + Next `<Link>` | `<Button component={Link}>` | Swap composition pattern | Public nav, breadcrumbs | Phase 2 | Low |
| Input | `src/components/ui/input.tsx` | `<TextInput>` | Replace with TextInput | All forms | Phase 2 | Low |
| Textarea | shadcn Textarea | `<Textarea>` | Replace | Contact, cabinet | Phase 2 | Low |
| Select | `src/components/ui/select.tsx` | `<Select>` with Drawer on mobile | Replace + add P0 bottom-sheet | Admin, listings filter | Phase 2 | High — P0 compliance |
| Combobox | `src/components/ui/command.tsx` | `<Combobox>` + Drawer on mobile | Replace + P0 bottom-sheet | Global search | Phase 2 | High — P0 compliance |
| Checkbox | `src/components/ui/checkbox.tsx` | `<Checkbox>` | Replace | Cabinet forms, admin | Phase 3 | Low |
| Radio | shadcn RadioGroup | `<Radio>` + `<Radio.Group>` | Replace | Cabinet settings | Phase 3 | Low |
| Switch | shadcn Switch | `<Switch>` | Replace | Admin settings | Phase 3 | Low |
| Badge | `src/components/ui/badge.tsx` | `<Badge>` | Replace | Listing cards, admin tables | Phase 3 | Low |
| Card | `src/components/ui/card.tsx` | `<Card>` | Replace | Listings, cabinet | Phase 3 | Medium |
| Paper | shadcn Card (no header/footer) | `<Paper>` | Replace | Cabinet forms | Phase 3 | Low |
| Dialog | `src/components/ui/dialog.tsx` | `<Modal>` + `<Drawer position="bottom">` | Replace + P0 bottom-sheet | Admin CRUD, confirms | Phase 2 | High — P0 compliance |
| Drawer | `src/components/ui/sheet.tsx` | `<Drawer position="bottom">` for P0 | Replace + verify P0 spec | Mobile nav, admin filters | Phase 2 | High — P0 compliance |
| Sheet | `src/components/ui/sheet.tsx` | `<Drawer>` (position varies) | Replace | Mobile overlays | Phase 2 | High |
| Popover | `src/components/ui/popover.tsx` | `<Popover>` + Drawer on mobile | Replace + P0 for interactive | Admin tooltips | Phase 2 | High — P0 compliance |
| Menu | `src/components/ui/dropdown-menu.tsx` | `<Menu>` + Drawer on mobile | Replace + P0 | Header nav, admin actions | Phase 2 | High |
| Tabs | `src/components/ui/tabs.tsx` | `<Tabs>` | Replace | Cabinet, admin | Phase 2 | Medium — full-width mobile |
| Table | Custom Tailwind tables | `<Table>` + MantineDataTableToCards | Replace + responsive | Admin listings, reports | Phase 3 | High — complex feature |
| Data cards | Custom mobile card fallbacks | MantineDataTableToCards | Replace with canonical pattern | Admin, mobile listings | Phase 3 | Medium |
| Pagination | Custom shadcn Pagination | `<Pagination>` | Replace | Admin tables | Phase 3 | Low |
| Breadcrumbs | Custom Tailwind breadcrumbs | `<Breadcrumbs>` | Replace | Listing detail, admin pages | Phase 3 | Low |
| Header | `src/components/layout/Header.tsx` | MantineAppShellFoundation | Major rewrite | All public pages | Phase 3 | High — auth + locale integration |
| Footer | `src/components/layout/Footer.tsx` | Mantine Grid/Stack | Rewrite | All public pages | Phase 4 | Low |
| App shell | `src/components/layout/AdminShell.tsx` | MantineAppShellFoundation | Replace | All admin pages | Phase 3 | High — admin auth gate |
| Page heading | Various page-level headings | MantinePageHeaderWithActions | Replace | All pages | Phase 3 | Medium |
| Form shell | Various form wrappers | MantineFormSectionStack + MantineTwoColumnForm | Replace | All forms | Phase 3 | Medium |
| Action footer | Inline form submit rows | MantineResponsiveActionFooter | Replace | All forms with actions | Phase 3 | Medium |
| Listing card | `src/modules/listings/components/**` | MantineListingCardPattern | Replace | Public listings | Phase 4 | High — main product surface |
| Listing detail | `src/app/[locale]/listings/[id]/page.tsx` | MantineListingDetailPattern | Replace | Public listing detail | Phase 4 | High |
| Listing gallery | Listing detail image section | BLOCKED — owner architecture decision | Cloudinary integration decision needed | Listing detail | Phase 4 | Blocked |
| Notification center | `src/modules/notifications/**` | MantineNotificationPattern + Mantine Drawer | Replace | All pages | Phase 3 | Medium |
| Auth forms | `src/app/[locale]/(auth)/**` + `src/modules/auth/**` | MantineAuthFormPattern | Replace | Auth pages | Phase 3 | High — auth flow |
| Cabinet forms | `src/app/[locale]/cabinet/**` | MantineFormSectionStack | Replace | Cabinet pages | Phase 4 | Medium |
| Empty state | Inline empty fallbacks | MantineEmptyLoadingErrorState | Replace | All list views | Phase 3 | Low |
| Loading state | Suspense fallbacks | MantineEmptyLoadingErrorState | Replace | All async routes | Phase 3 | Low |
| Error state | Error boundaries | MantineEmptyLoadingErrorState | Replace | All pages | Phase 3 | Low |
| Toast/notification | `src/components/ui/sonner.tsx` + Toaster | `<Notifications>` (Mantine) | Replace Sonner with Mantine | All pages | Phase 3 | Medium |
| Theme | Tailwind dark/light via `withTheme` | Mantine Light-only theme (Task 482) | Task 482 complete for Mantine surfaces | All pages | Phase 1 ✅ | None |
| Storybook canvas/proof | `withCanvas` + `.container-wide` | `withMantine` + `skipCanvas: true` | Task 482 complete; legacy path remains | All stories | Phase 1 ✅ | None |

---

## §12 — Canonical Mantine patterns

| Pattern | Mantine components | Mobile behavior | Tablet behavior | Desktop behavior | Locale behavior | Storybook proof |
|---|---|---|---|---|---|---|
| AppShellFoundation | AppShell, Navbar, Burger, useDisclosure | Burger icon, nav hidden, full-width content | Burger or fixed nav at breakpoint | Fixed sidebar nav | Toolbar selects locale; nav labels from i18n | `Patterns/Mantine/AppShellFoundation` Default — toolbar-driven |
| PageHeaderWithActions | Group, Stack, Button, Title, Text | Title wraps, actions stack full-width | Title + actions begin row layout | Title + actions in a row | Toolbar selects locale; labels from i18n | `Patterns/Mantine/PageHeaderWithActions` Default — toolbar-driven |
| FormSectionStack | Paper, Stack, TextInput, Textarea, Title, Button | All fields full-width stacked | Same as mobile | Max-width container optional | Toolbar selects locale; labels and placeholders from i18n | `Patterns/Mantine/FormSectionStack` Default — toolbar-driven |
| TwoColumnForm | SimpleGrid, TextInput, Textarea, Select, Button | Single column, all fields full-width | Two columns begin | Two columns, fullWidth fields span both | Toolbar selects locale; long UK labels wrap without overflow | `Patterns/Mantine/TwoColumnForm` Default — toolbar-driven |
| ResponsiveActionFooter | Stack, Group, Button | Actions stack vertically, buttons full-width | Actions begin row layout | Actions row (right-aligned or justified) | Toolbar selects locale; action labels from i18n | `Patterns/Mantine/ResponsiveActionFooter` Default — toolbar-driven |
| CardGrid | SimpleGrid, Card | 1 column, cards full-width | 2 columns | 3 columns | Toolbar selects locale; card text from i18n | `Patterns/Mantine/CardGrid` Default — toolbar-driven |
| DataTableToCards | Table, Stack, Card, Badge | Cards view: label/value pairs stacked | Transitions to table view | Table view with hover, sort | Toolbar selects locale; column headers and values from i18n | `Patterns/Mantine/DataTableToCards` Default — toolbar-driven |
| DialogDrawerPattern | Drawer, Modal, Button, Stack, Group | P0 bottom Drawer: top-only radius, drag handle, ≤90dvh, stacked full-width actions | Modal (centered) if width triggers desktop branch | Centered Modal with row actions | Toolbar selects locale; title/body/actions from i18n | `Patterns/Mantine/DialogDrawerPattern` Default — toolbar-driven |
| MantinePopover | Popover, Drawer, Box, Text, useDisclosure | P0 full-width bottom sheet (top-only radius, drag handle, ≤90dvh, backdrop+Esc); consumes Task 509 foundation | Same as desktop | Anchored Mantine Popover at trigger; position/width/arrow configurable | Toolbar selects locale; title + children via storyT() | `Mantine/Primitives/Popover` Default — toolbar-driven |
| EmptyLoadingErrorState | Loader, Text, Button, Stack, Center | Centered content, full-width action button | Same centered layout | Same centered layout | Toolbar selects locale; title/description/action from i18n | `Patterns/Mantine/EmptyLoadingErrorState` Default (all 3 states) — toolbar-driven |
| NotificationPattern | notifications, showNotification | Notifications portal (top-right adapts) | Same | Same | Toolbar selects locale; notification title/message from i18n | `Patterns/Mantine/NotificationPattern` Default — toolbar-driven |
| ListingCardPattern | Card, Image, Badge, Button, Stack | Card full-width, CTA full-width (P0) | 2-column grid | 3-column grid | Toolbar selects locale; price/location/labels from i18n | `Patterns/Mantine/ListingCardPattern` Default — toolbar-driven |
| ListingDetailPattern | Grid, Paper, Image, Group, Stack, Button | Stacked: image → features → CTA full-width (P0) | 2-column: image+content left, contact right | 2-column with sticky contact panel | Toolbar selects locale; features/labels from i18n | `Patterns/Mantine/ListingDetailPattern` Default — toolbar-driven |
| AdminSurfacePattern | TextInput, Button, Group, Stack, DataTableToCards, Pagination | Search full-width, Add button full-width, cards view | Row toolbar, table view begins | Row toolbar, full table view | Toolbar selects locale; all labels from i18n | `Patterns/Mantine/AdminSurfacePattern` Default — toolbar-driven |
| AuthFormPattern | Paper, TextInput, PasswordInput, Button, Anchor, Stack | Full-width paper, all fields + submit full-width | Centered, max-width ~400px | Centered, max-width ~400px | Toolbar selects locale; labels/placeholders from i18n | `Patterns/Mantine/AuthFormPattern` Default (login + register) — toolbar-driven |

---

## §13 — Storybook rebuild plan

| Story group | Canonical component | Exported stories | `skipCanvas`? | Toolbar viewport? | Toolbar locale? | Light-only? | Status |
|---|---|---|---|---|---|---|---|
| `Patterns/Mantine/AppShellFoundation` | `MantineAppShellFoundation` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/PageHeaderWithActions` | `MantinePageHeaderWithActions` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/FormSectionStack` | `MantineFormSectionStack` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/TwoColumnForm` | `MantineTwoColumnForm` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/ResponsiveActionFooter` | `MantineResponsiveActionFooter` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/CardGrid` | `MantineCardGrid` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/DataTableToCards` | `MantineDataTableToCards` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/DialogDrawerPattern` | `MantineDialogDrawerPattern` | Default only | yes | yes | yes | yes | ✅ Task 482 complete; P0 bottom-sheet fixed |
| `Patterns/Mantine/EmptyLoadingErrorState` | `MantineEmptyLoadingErrorState` | Default only | yes | yes | yes | yes | ✅ Default shows all 3 states (empty/loading/error) in a Stack |
| `Patterns/Mantine/NotificationPattern` | `MantineNotificationPattern` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/ListingCardPattern` | `MantineListingCardPattern` | Default only | yes | yes | yes | yes | ✅ Default shows 3-card grid (responsive via SimpleGrid) |
| `Patterns/Mantine/ListingDetailPattern` | `MantineListingDetailPattern` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/AdminSurfacePattern` | `MantineAdminSurfacePattern` | Default only | yes | yes | yes | yes | ✅ Task 482 complete |
| `Patterns/Mantine/AuthFormPattern` | `MantineAuthFormPattern` | Default only | yes | yes | yes | yes | ✅ Default shows both login + register modes in a Stack |

**Storybook rebuild rules:**

1. Every `Patterns/Mantine/*` group exports exactly one story: `Default`.
2. Viewport proof is toolbar-driven — owner selects from 12 proof widths (275–1920px).
3. Locale proof is toolbar-driven — owner selects en / uk / sq / it.
4. Theme is Light-only — `forceColorScheme="light"` in `withMantine`. Task 482 uses a Light-only
   theme. There is no Dark story, no dark mode implementation, and no dark theme in Task 482.
5. `LongUk` story is NOT required or permitted. Ukrainian long-text stress testing uses real
   Cyrillic in the `uk.json` locale file; the owner switches to UA Ukrainian in the toolbar.
6. `Dark` story is NOT required or permitted. Task 482 uses one theme: Light.
7. Per-viewport story exports are NOT required or permitted.
8. Per-locale story exports are NOT required or permitted.
9. `Pass` and `Fail` story exports are NOT required or permitted.
10. 320w rendered proof is owner-reviewed only via toolbar — not a full harness matrix.

---

## §14 — Full UI migration roadmap

| Phase | Deliverables | Dependencies | Acceptance criteria | Storybook proof | Rollback risk |
|---|---|---|---|---|---|
| **Phase 0 — Stop old UI path** | `docs/rule-index.md`, `docs/design-system.md`, `docs/storybook-governance.md` | None | Mantine listed as future source of truth; design-system.md demoted; storybook-governance.md supersession notice | n/a | Zero — docs only |
| **Phase 1 — Mantine foundation** ✅ Task 482 | `src/design-system/mantine/**`, `src/app/layout.tsx`, `.storybook/preview.tsx`, 14 story files, `scripts/story-realmode-allowlist.json`, `messages/*.json` | React 19 (installed), Mantine v9.4.0 | Provider wired, theme complete, 14 patterns + stories, toolbar proof, check:stories=0, typecheck=0, check:i18n=0, build-storybook=0 | 14 `Patterns/Mantine/*` Default stories — toolbar-driven | Low — new files only, no product UI changed |
| **Phase 2 — Primitive replacement** | `src/components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, `sheet.tsx`, `select.tsx`, `tabs.tsx`, `command.tsx`, `popover.tsx`, `dropdown-menu.tsx` | Phase 1 complete; owner AC per primitive | Each UI primitive replaced; P0 popups fixed (bottom-sheet); all consumers compile; `check:stories=0`, `typecheck=0` | Update primitive stories to Mantine-native proof | Medium — UI primitives used everywhere |
| **Phase 3 — Layout migration** | `src/components/layout/**`, `src/components/admin/**`, `src/modules/notifications/**`, auth pages | Phase 2 complete; owner review per component | Header/Footer/AdminShell → Mantine AppShell; admin CRUD → MantineAdminSurfacePattern; auth → MantineAuthFormPattern; notification center → Mantine | Update component stories | High — Header/Admin shell are load-bearing |
| **Phase 4 — Product surface migration** | `src/app/[locale]/**`, `src/modules/listings/**`, `src/app/[locale]/cabinet/**` | Phase 3 complete; owner sign-off per page | All public pages use Mantine patterns; listings index/detail migrated; cabinet pages migrated | Update/add page-level stories | Very high — main product surface |
| **Phase 5 — Storybook rebuild** | All legacy `*.stories.tsx` in `src/stories/`, `src/components/`, `src/modules/` | Phase 4 complete (components migrated) | All stories → Mantine-native proof; `withCanvas` removed from migrated stories; `check:stories=0` | All stories pass check:stories | Low — Storybook only |
| **Phase 6 — Full UI cutover** | `src/app/globals.css` (remove `.container-wide`), `.storybook/preview.tsx` (remove `withCanvas`), `docs/design-system.md` (archive) | Phase 5 complete | No Tailwind responsive classes in product code; no shadcn/radix imports; `withCanvas` removed; `globals.css` cleaned | Final Storybook audit | High — verify nothing regresses |

---

## §15 — Freeze rule for old UI work

**Owner P0 directive (2026-06-24, Task 482):**

> No new Tailwind responsive classes, no new shadcn/radix components, no new `withCanvas` proof
> stories may be created for NEW UI work.

Enforcement:

1. **New components** — must use `@mantine/core`. PR reviewer will reject new shadcn/radix imports.
2. **New responsive behavior** — must use Mantine `{ base, sm, md, lg }` responsive props. No new
   `sm:` / `md:` Tailwind breakpoint classes.
3. **New Storybook stories** — must set `parameters.skipCanvas: true` and use `withMantine`. No new
   `withCanvas` stories.
4. **New popups** — must use Mantine `<Modal>` + `<Drawer position="bottom">` for P0 compliance.
   No new shadcn Sheet/Dialog.
5. **Existing surfaces** — may remain on Tailwind/shadcn until their migration phase.

---

## §16 — Future-task acceptance gates

All future Mantine UI tasks must pass these gates:

| Gate | Requirement |
|---|---|
| Pattern reuse | New component must use or extend a canonical pattern from `src/design-system/mantine/patterns/` |
| Responsive API | Responsive behavior must use Mantine props (`{ base, sm }`) not Tailwind classes |
| P0 mobile gate | All controls full-width below 40em (640px); all popups bottom-sheet below 40em |
| Touch targets | All mobile-reachable text buttons ≥44px (theme enforces `Button styles.root.minHeight = '2.75rem'`) |
| skipCanvas | New Mantine story must set `parameters.skipCanvas: true` |
| Default only | New Mantine story group exports exactly one story: `Default` |
| Toolbar viewport | Viewport proof toolbar-driven; widths: 275, 320, 390, 480, 560, 680, 768, 960, 1024, 1200, 1440, 1920px |
| Toolbar locale | Locale proof toolbar-driven: en / uk / sq / it |
| Light-only | No `Dark` story exports. Task 482 uses one theme: Light |
| No LongUk | No `LongUk` story exports. Long Ukrainian text lives in `uk.json` values |
| No viewport exports | `Mobile320`, `Tablet768`, etc. are forbidden for Mantine stories |
| No locale exports | `Uk`, `Sq`, `It`, `En` exports are forbidden for Mantine stories |
| No Pass/Fail exports | `Pass` and `Fail` exports are forbidden for Mantine stories |
| i18n | `storybook.mantine.*` namespace; all 4 locales identical key sets; uk = real Cyrillic |
| typecheck=0 | No TypeScript errors |
| check:stories=0 | No story governance violations |
| check:i18n=0 | No locale key parity violations |
| check:design-tokens | Mantine design-system files allowlisted; no new raw values outside allowlist |
| No product migration | Foundation tasks must not migrate existing product UI surfaces |
| No DB/security | UI tasks must not touch DB migrations, RLS, or server actions |
| Spacing tokens | No raw px for spacing/gap/padding/margin in `src/design-system/mantine/**` or migrated surfaces. Touch-target `mih="2.75rem"` (rem) is the only exemption. See §7.1 |
| Card meta row rhythm | Each card meta row MUST use `Group justify="space-between"` — label `flexShrink:0` at left edge, value `textAlign:'right'` at right edge. NO fixed `width:'38%'` (retracted). `gap="md"` per row. `Divider color="gray.1"` between sections |
| Table column rhythm | Desktop table must be card-wrapped (`Paper` radius=2xl, gray-2 border) per `docs/tailadmin-style-reference.md §6b`. Table uses `verticalSpacing="sm"` (12px) + `horizontalSpacing="xl"` (24px) from theme defaults. Thead bg-gray-0, border-y gray-1. Th: 12px fw=500 gray-500, NOT uppercase. Td: whitespace-nowrap, 14px gray-700. Each `TableColumn` must declare `align` and `width` for non-trivial surfaces |
| Filter controls | Mutually exclusive single-select filters must use `SegmentedControl`, not individual Button chips. Wrap in `ScrollArea scrollbars="x"` when i18n labels clip at 320px |
| Admin card anatomy | Any surface with `card` prop on `MantineDataTableToCards` MUST use the §7.2 anatomy: header (id + actions), primary (avatar + title + subtitle \| badge), meta (ONE divider + compact rows). Generic label:value dump rejected |
| Card anatomy story proof | Pattern stories with `card` prop must demonstrate the full anatomy (avatar/title/subtitle/badge/meta/actions visible in Default story at 320 mobile viewport) |
| 🔴 One section per STATE (§8.2) | A story MUST NOT contain sibling sections that render the same component state differing only in target viewport (e.g. "open anchored ≥640" + "open bottom sheet <640"). Sections = distinct states; viewport is proven by the toolbar. Per-viewport sections = REJECT |
| 🔴 Overlays open by real click (§8.2) | Overlay open state must be reachable by clicking the trigger. `defaultOpened`/`defaultDropdownOpened` as the ONLY way the overlay appears = REJECT. The clause-12 rendered matrix must be produced from an actually-clicked-open overlay, not a baked-open snapshot |

---

## §17 — Open architecture decisions

| Decision | Status | Owner input needed |
|---|---|---|
| `useMediaQuery` SSR hydration in `DialogDrawerPattern` | RESOLVED — SSR returns `false` (Modal renders), hydrates to Drawer on mobile; overlay is always closed on SSR so no flash | No |
| Dark theme implementation | RESOLVED — NOT REQUIRED. Owner requires Light-only theme. No dark mode in Task 482. | No |
| Listing gallery (Cloudinary integration) in Mantine | BLOCKED — Cloudinary image gallery in listing detail needs owner decision on Mantine implementation vs. keeping current Cloudinary widget | Yes — Phase 4 blocker |
| `src/components/ui/sonner.tsx` vs Mantine Notifications coexistence | RESOLVED for Task 482 — Sonner kept temporarily; migrated to Mantine Notifications in Phase 3 | No |
| Admin table canonical pattern evolution | OPEN — `AdminListingsTable` is a complex surface (sort + hide-column + global search). Migration to MantineAdminSurfacePattern requires owner review of current feature parity | Yes — Phase 3 planning |
| `postcss-preset-mantine` / `postcss-simple-vars` | RESOLVED — NOT needed. Mantine v9 prebuilt CSS imported directly; no Mantine PostCSS plugins required | No |

## §18 — Mantine theming/CSS pitfalls — HARD-WON RULES (do not repeat) 🔴

> **Read this BEFORE writing any Mantine input/theme styling.** Every rule below cost a rejection cycle in
> Sprint 38 (Tasks 494–507). They are not theoretical — each is a bug that shipped, looked green on `tsc`/gates,
> and was caught only by the owner's rendered DevTools check. The root cause of nearly all of them: **`tsc=0` /
> gate-green is NOT proof of rendered correctness.**

### §18.1 — `theme.components.*.styles` are applied as INLINE styles (the #1 trap)

Mantine v8 injects `theme.components.X.styles` (and per-instance `styles`) as **inline `style=` attributes** on each
slot element, NOT as a CSS class. Two consequences:

1. **Flat properties land inline and outrank EVERY stylesheet rule** (including Mantine's own `[data-error]`,
   `:focus`, `:disabled`). Setting `styles.input.borderColor` froze the border gray in ALL states — the error/focus
   CSS could never win (Task 496/505).
2. **Nested/state selectors inside a `styles` object are SILENTLY DROPPED.** `'&:focus'`, `'&::placeholder'`,
   `'&[data-error]'`, `'&[data-disabled]'`, `':has(...)'` cannot exist as inline styles, so Mantine discards them.
   A `styles.input['&[data-error]']` block compiles fine and does nothing (Task 496 `[data-invalid]`, and the
   orchestrator's first `[data-error]` "fix" — both dead for this reason).

**RULE:** state-dependent input chrome (resting/focus/error/disabled border, shadow, placeholder) lives in the
stylesheet **`src/design-system/mantine/input-chrome.css`** (imported after `@mantine/core/styles.css` in
`src/app/layout.tsx` AND `.storybook/preview-head.html`/`preview.tsx`), targeting stable classes — NEVER in inline
`theme.styles`. `theme.components.X.styles.input` may ONLY hold flat, state-independent props (e.g. `minHeight`,
`color`).

### §18.2 — Stable class names + input anatomy

Mantine emits stable `.mantine-{Component}-{slot}` classes alongside the hashed `.m_xxx`. Target these in
`input-chrome.css`:

- TextInput / Textarea / Select: border + state on `.mantine-TextInput-input` / `.mantine-Textarea-input` /
  `.mantine-Select-input`. Placeholder on the same `-input`.
- **PasswordInput is different:** the border + `data-error` + `data-disabled` are on the OUTER box
  `.mantine-PasswordInput-input`; the real `<input>` is `.mantine-PasswordInput-innerInput` (border:0, transparent) —
  **placeholder lives on `-innerInput`**, and the box focuses via **`:focus-within`**, not `:focus`.

### §18.3 — Correct Mantine state attributes (verify in DevTools, don't assume)

- **Error = `data-error`**, NOT `data-invalid` (zero `data-invalid` in `@mantine/core`). `Input.css` error rule sets
  `--input-bd: var(--mantine-color-error)`.
- **Disabled = `:disabled` OR `[data-disabled]`**, plus `:has(input:disabled)` for composites (PasswordInput).
  Mantine's default disabled sets `background-color: var(--input-disabled-bg)` (a solid gray fill) + `opacity:0.6`.
  Source-of-truth (`src/components/ui/input.tsx`: `disabled:opacity-50` + TailAdmin demo) = **faded transparent
  field**: override with `background-color: transparent; opacity: 0.5; cursor: not-allowed`.
- **Border** is `border: … solid var(--input-bd)` (Input.css). To control border per state robustly, set
  `border-color` DIRECTLY on the stable class per state (rest gray-2 / `:focus` brand-3 / `[data-error]` red-6) so
  you bypass the `--input-bd` variable cascade. `[data-error]` (0,2,0) > `:focus` (0,1,1) → error wins on focus.

### §18.4 — CSS custom-property traps (font variables)

- **Never name a `next/font` loader variable the same as an existing `@theme` token.** Naming the loader
  `--font-sans` (an existing token) produced `--font-sans: var(--font-sans), …` — a **self-reference**, which CSS
  treats as invalid → the font never applied (Task 506-R). Use a distinct loader var (`--font-open-sans`).
- **`var()` fallback MUST be inside the parentheses:** `var(--x, "Open Sans", system-ui)` — NOT
  `var(--x), "Open Sans", system-ui`. A `var()` referencing an **undefined** property with **no internal fallback**
  invalidates the WHOLE declaration → `font-family` inherits → renders the default serif (Times New Roman in
  Storybook, where `next/font` vars are undefined). Sibling-comma fonts after the `var()` are NEVER reached. This
  is why Storybook showed Times New Roman with Open Sans loaded-but-unused (orchestrator direct fix, Task 506).

### §18.5 — Project font = Open Sans (Cyrillic), input labels = 600

- **Outfit has NO Cyrillic glyphs** (only latin/latin-ext) → all `uk` text fell back to a system font, hiding the
  medium label weight. This was the real cause of "labels not bold" — the theme was always correct. Project font is
  now **Open Sans** (`subsets: latin, latin-ext, cyrillic, cyrillic-ext`), loaded via `next/font` (app) +
  Google CDN `<link>` (Storybook).
- **Input labels use `fontWeight: 600` (semibold)** in `theme.components.InputWrapper.styles.label` — an owner
  override of §6's medium(500), because Open Sans 500 is visually near-identical to 400.

### §18.6 — Verification discipline (the meta-rule)

`tsc=0`, `check:stories`, `check:design-tokens`, `check:i18n` green is a BASELINE, never rendered proof. Before
claiming any input/theme styling works:

1. **DevTools-confirm the actual rendered result** at `uk@320`: the computed `font-family` / "Fonts Used" panel
   (is it really Open Sans, or a fallback?), and toggle the property off to confirm it's actually driving the render.
2. **Confirm the real selector** carrying the state (`data-error` vs `data-invalid`; `:disabled` vs `[data-disabled]`
   vs `:has`; `:focus` vs `:focus-within`) in the DOM before writing CSS against it.
3. The rendered matrix (breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**) + a planted-violation transcript
   is the verdict (clause 12/13). A green gate that contradicts the render is a fabricated proof.

### §18.7 — Never run git or integrity checks in the Cowork sandbox

Reaffirms `docs/orchestrator-role.md` → "Orchestrator NEVER runs git or integrity checks in the Cowork sandbox":
sandbox `git diff`/`git status` returns a phantom over-dirty tree (and corrupts `.git/index`); sandbox `tsc`/`tr`/
binary-flags serve mount artifacts (e.g. spurious "Invalid character" on an empty line, `.ts` flagged "binary").
Use the **Read tool** for file content and the **owner's NATIVE PowerShell** for all git + the authoritative
integrity/`tsc` verdict.
| `@mantine/form` scope | RESOLVED for Task 482 — installed and used in `MantineTwoColumnForm`. Future auth/cabinet forms will use it in Phase 3 migration | No |

---

## §19 — Canonical responsive Select: `MantineSelect` (Tasks 509 + 510)

> **Decision 2026-06-28 (Task 509):** build the bottom-sheet FOUNDATION first, before migrating individual overlays.
> Reference-implemented on `Select`. Batch C overlays consume this foundation.
>
> **Decision 2026-06-28 (Task 510):** ONE canonical Select — responsive by default. There is no
> "plain Select vs bottom-sheet Select" choice. `MantineSelect` IS the Select primitive.

### §19.1 — Core mechanism

**Foundation location (Task 514 — single source):** `src/design-system/mantine/patterns/responsiveBottomSheet.tsx`
**Select consumer:** `src/design-system/mantine/patterns/MantineSelect.tsx`

**Foundation exports (shared by all Batch C overlays — import from `src/design-system/mantine/patterns`):**

| Export | Type | Purpose |
|---|---|---|
| `useResponsiveDropdown()` | Hook | Returns `{ isMobile, drawerOpened, openDrawer, closeDrawer }`. Single source of truth for mobile detection + Drawer state. |
| `bottomSheetDrawerStyles` | Const | `styles` object for Mantine `<Drawer>` matching the P0 bottom-sheet treatment (top-only radius, ≤90dvh, internal scroll, inner padding 0). |
| `DragHandle` | Component | ONE definition of the centered 2.5rem × 0.25rem gray-3 swipe affordance. |
| `ResponsiveBottomSheet` | Component | Canonical P0 full-width bottom-sheet wrapper: bottom-anchored Drawer with fixed chrome (DragHandle, optional title, ≤90dvh, returnFocus, backdrop+Esc). Props: `opened`, `onClose`, `title?`, `children`. |
| `MantineSelect` | Component | Canonical P0-compliant responsive Select. Anchored dropdown at ≥640; full-width bottom sheet at <640 via `ResponsiveBottomSheet`. ONE component — no dual-path imports. |

**How the dropdown interception works:**

1. `useResponsiveDropdown()` returns `isMobile` from `useMediaQuery('(max-width: 40em)')` + `useDisclosure()` Drawer state.
2. On mobile, Select is rendered with `dropdownOpened={false}` (prevents the Mantine anchored dropdown from showing) + `onDropdownOpen={openDrawer}` (fires when user clicks/keyboard-opens → opens Drawer instead).
3. The mobile sheet is `<ResponsiveBottomSheet>` (edge-to-edge, top-only radius, DragHandle, ≤90dvh, internal scroll, `returnFocus`).
4. Desktop: `dropdownOpened={undefined}` + `onDropdownOpen={undefined}` → normal Select dropdown behavior unchanged.

**Batch C adoption pattern (DropdownMenu/NavigationMenu/Tooltip):**
```tsx
import { useResponsiveDropdown, ResponsiveBottomSheet } from '@/design-system/mantine/patterns'

// In your overlay component:
const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()

// Wire the trigger to openDrawer on mobile; normal dropdown on desktop
// Render <ResponsiveBottomSheet opened={drawerOpened} onClose={closeDrawer} title={...}>
//   {content}
// </ResponsiveBottomSheet>
// inside the same component (always closed on SSR)
```

### §19.2 — SSR/hydration caveat

Same documented trade-off as `MantineDialogDrawerPattern` (§4 table row): `useMediaQuery` returns `false` on first render (evaluated in `useEffect`). The Drawer is always closed on SSR so no flash occurs. The trigger renders as the desktop path server-side and switches to the mobile path after hydration. Acceptable — both paths use the same `<Select>` trigger chrome so there is no visible change.

### §19.3 — Storybook proof location

`src/stories/mantine/primitives/Select.stories.tsx` → `Default` — toolbar-driven. **ALL 6 sections use `MantineSelect`** — every section is a bottom sheet at <640 toolbar width and an anchored dropdown at ≥640. No section uses the raw `@mantine/core` Select as a rendered control.

Sections: resting / open / error / disabled / long-uk-stress / disabled-no-open-sheet (negative flow).

### §19.4 — P0 gate

At `<640px`:
- Trigger: `w={{ base: '100%', sm: 'auto' }}` (P0 full-width)
- Dropdown: full-width bottom Drawer (NOT an anchored mini-dropdown)
- Option rows: `mih="2.75rem"` (≥44px touch target), `whitespace: normal`, `wordBreak: break-word`
- No horizontal scroll at 320px

At `≥640px`:
- Standard Mantine Select anchored dropdown — §6d chrome unchanged (gray-2 border, shadow-xs, brand focus, 44px, disabled fade)

---

## §20 — Canonical responsive Popover: `MantinePopover` (Task 513)

> **Decision 2026-06-30 (Task 513):** first Batch C overlay to consume the Task 509 foundation.
> `MantinePopover` = ONE canonical Popover — no "plain Popover vs bottom-sheet Popover" choice.

### §20.1 — Core mechanism

| Export | Kind | Description |
|---|---|---|
| `MantinePopover` | Component | Canonical P0-compliant responsive Popover. Anchored Mantine Popover at ≥640; full-width bottom sheet at <640. Consumes `useResponsiveDropdown` + `ResponsiveBottomSheet` from `responsiveBottomSheet.tsx` (Task 514 single source) — same foundation as `MantineSelect`, no duplicated DragHandle or Drawer block. |

**How the Popover interception works (Task 513 REWORK — span-wrapper pattern; Task 514 — single source):**

1. `useResponsiveDropdown()` (from `responsiveBottomSheet.tsx`) returns `isMobile` + Drawer `openDrawer`/`closeDrawer`/`drawerOpened`.
2. At mobile (`isMobile=true`): the trigger is wrapped in an `inline-block` `Box` span that captures the click event (bubbled from the trigger button) → calls `openDrawer()`. No Mantine Popover `opened`/`onChange` involved on this path. This avoids Mantine v8's controlled-mode `onChange` behaviour where `onChange` fires with the *current* value (not `!current`), making controlled-suppressed-dropdown interception unreliable.
3. At desktop (`isMobile=false`): standard Mantine `Popover` in uncontrolled mode — no `opened` prop; Mantine manages its own open/close state.
4. Mobile sheet rendered via `<ResponsiveBottomSheet>` (single source from `responsiveBottomSheet.tsx`) — edge-to-edge, top-only radius, `DragHandle`, ≤90dvh, `returnFocus`.

Note: `defaultOpened` prop does NOT exist on `MantinePopover` — it was removed in the Task 513 rework after the first pass proved that auto-open via `defaultOpened` masks a broken trigger handler (per §8.2).

### §20.2 — SSR/hydration caveat

Same as §19.2 (MantineSelect): `isMobile=false` on first render (Mantine v8 `getInitialValueInEffect=true`). On SSR and initial client render the desktop Popover path renders. After hydration `useMediaQuery` resolves and the mobile path mounts. No user interaction is possible before this switch — transition is imperceptible. Drawer always closed on SSR; no flash.

### §20.3 — Storybook proof location

`src/stories/mantine/primitives/Popover.stories.tsx` → `Default` — toolbar-driven. **Three sections (§8.2): trigger (closed/resting) · disabled · icon-only (clause-11 exempt).** All strings via `storyT()` against `storybook.mantine.pop_*` keys. The open/bottom-sheet behavior is verified by clicking the trigger and switching the toolbar viewport on the ONE closed/resting section.

### §20.4 — P0 gate

At `<640px`:
- Dropdown: full-width bottom Drawer (NOT an anchored mini-popover, NOT a centered card)
- Sheet: edge-to-edge, top-only radius, drag handle, ≤90dvh internal scroll
- Content: `whiteSpace: normal`, `wordBreak: break-word`, no h-scroll at 320px
- Disabled: trigger tap is a no-op

At `≥640px`:
- Standard Mantine `Popover` anchored to trigger — position/width/arrow configurable

### §20.5 — Trigger-width contract (Task 516 corrective, 2026-07-01)

**The component guarantees trigger width — consumers do not set it per-use.**

| Context | Trigger width |
|---|---|
| `<640px`, text trigger (default: `iconOnlyTrigger=false`) | **Full-width edge-to-edge** — mobile wrapper is a `flex-column` container; `align-items:stretch` pulls the trigger to 100% of the container |
| `<640px`, icon-only trigger (`iconOnlyTrigger=true`) | **Compact** (clause-11 exemption) — wrapper is `inline-block`; trigger stays at natural content size |
| `≥640px`, any trigger | **Natural/content width** — desktop path wraps `<Popover>` in `alignSelf:flex-start` Box, preventing `Stack align="stretch"` from over-stretching the trigger |

**Root cause this corrects (verified 2026-07-01):** Task 513 shipped a mobile wrapper of `display:inline-block` (span), which absorbed the flex-stretch from the parent, leaving the trigger compact at <640. Simultaneously the bare Popover was a direct Stack child at ≥640 and got stretched full-width. The fix inverts both: flex-column mobile wrapper → stretch; `alignSelf:flex-start` desktop wrapper → natural. Prop: `iconOnlyTrigger?: boolean` (default `false`).

---

## §21 — Canonical responsive DropdownMenu: `MantineDropdownMenu` (Task 515)

> **Decision 2026-06-30 (Task 515):** first Batch C overlay after Popover to consume the Task 514 single source.
> `MantineDropdownMenu` = ONE canonical DropdownMenu — no "plain Menu vs bottom-sheet Menu" choice.

### §21.1 — Core mechanism

| Export | Kind | Description |
|---|---|---|
| `MantineDropdownMenu` | Component | Canonical P0-compliant responsive DropdownMenu. Anchored Mantine Menu at ≥640; full-width bottom sheet at <640. Consumes `useResponsiveDropdown` + `ResponsiveBottomSheet` from `responsiveBottomSheet.tsx` (Task 514 single source) — no DragHandle copy, no Drawer block copy. |

**API:** `items: DropdownMenuItemDef[]` (each: `label`, `onClick?`, `icon?`, `color?`, `disabled?`, `separator?`). ONE items source for both paths — no duplication.

**How the Menu interception works:**

1. `useResponsiveDropdown()` (from `responsiveBottomSheet.tsx`) returns `isMobile` + `openDrawer`/`closeDrawer`/`drawerOpened`.
2. At mobile (`isMobile=true`): trigger wrapped in `inline-block` span → click → `openDrawer()`. No Mantine `Menu` on mobile path. Items rendered as ≥44px `UnstyledButton` rows inside `ResponsiveBottomSheet`. Tapping an item fires its `onClick` + `closeDrawer()`.
3. At desktop (`isMobile=false`): standard uncontrolled Mantine `Menu` — `Menu.Target` + `Menu.Dropdown` + `Menu.Item`s. No `opened` prop.
4. Same span-onClick mechanism as `MantinePopover` — avoids Mantine v8 controlled-mode onChange quirk.

### §21.2 — SSR/hydration caveat

Same as §19.2 and §20.2: `isMobile=false` on first render (Mantine v8 `getInitialValueInEffect=true`). Desktop Menu path on SSR + initial client; mobile path mounts after hydration. No flash, no interaction possible before switch.

### §21.3 — Storybook proof location

`src/stories/mantine/primitives/DropdownMenu.stories.tsx` → `Default` — toolbar-driven. **Three sections (§8.2): trigger (closed/resting) · disabled · icon-only (clause-11 exempt).** All strings via `storyT()` against `storybook.mantine.dm_*` keys. Open behavior proven by clicking the trigger and switching the toolbar viewport on the ONE section.

### §21.4 — P0 gate

At `<640px`:
- Menu: full-width bottom sheet via `ResponsiveBottomSheet` (NOT anchored mini-menu, NOT centered card)
- Sheet: edge-to-edge, top-only radius, drag handle (from Task 514 source), ≤90dvh internal scroll
- Rows: ≥44px touch target (`mih="2.75rem"`), label wraps (`whitespace-normal break-word`), no h-scroll@320
- Destructive: `color='red'` → red text + icon on both paths
- Disabled trigger: tap is a no-op
- Disabled item: dimmed (opacity 0.5), no action on tap

At `≥640px`:
- Standard Mantine `Menu` anchored to trigger — §6d item chrome, separators, destructive color unchanged

### §21.5 — Trigger-width contract (Task 516 corrective, 2026-07-01)

**The component guarantees trigger width — consumers do not set it per-use.**

Same contract as §20.5 (MantinePopover). Applies identically to `MantineDropdownMenu`:

| Context | Trigger width |
|---|---|
| `<640px`, text trigger (default: `iconOnlyTrigger=false`) | **Full-width edge-to-edge** — flex-column mobile wrapper; `align-items:stretch` → trigger fills 100% |
| `<640px`, icon-only trigger (`iconOnlyTrigger=true`) | **Compact** (clause-11 exemption) — `inline-block` wrapper; trigger stays content-sized |
| `≥640px`, any trigger | **Natural/content width** — `<Menu>` wrapped in `alignSelf:flex-start` Box; no stretch from parent Stack |

Prop: `iconOnlyTrigger?: boolean` (default `false`). Proof: `src/stories/mantine/primitives/DropdownMenu.stories.tsx` — three sections: `trigger (resting)` · `disabled` · `icon-only (exempt)`. Root cause corrected: see §20.5.
