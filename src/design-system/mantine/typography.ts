/**
 * Canonical homepage section-heading responsive font-size triad (Task 699). Three tiers —
 * base 1.25rem/20px (<640px), sm 1.5rem/24px (640–1439px), xxl 1.875rem/30px (>=1440px),
 * matching this project's own rebound `xxl` breakpoint (90em/1440px, Task 669), not
 * Mantine's 768px default. Consumed directly by five `<Title fz={SECTION_HEADING_FZ}>`
 * sites: `src/app/[locale]/page.tsx` (`:49`, `:77`), `HowItWorksSteps.tsx`,
 * `FeaturedListingsView.tsx`, `PopularLocationsView.tsx`. Values are preserved from the
 * prior hand-copied literal, not re-derived (§3.7 — the 24px middle step has no named
 * TailAdmin row). This file has no imports and no `'use client'` on purpose: it must be
 * importable from `page.tsx`, a server component. It also sits in
 * `src/design-system/mantine/`, the directory `scripts/design-tokens-allowlist.json`
 * already allowlists as "inputs to the Mantine token system, not bypasses of project CSS
 * custom properties" — the single-source landing zone that removes these findings from
 * `check:design-tokens` instead of relocating them.
 */
export const SECTION_HEADING_FZ = { base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }

/**
 * Responsive font-size scale for every `<Title>` whose static size would be `h1`–`h4` (Task 886,
 * GR-3c). The theme's `headings.sizes` are one fixed value at every width (h1 48 / h2 36 / h3 30 /
 * h4 24px, `theme.ts` `headings.sizes`), so a `Title` with `size="h3"` renders 30px at 320px. Each key
 * here is named for the site's desktop rung and keeps that size at the top step, so desktop is
 * unchanged; below 640px the heading is at most 20px.
 *
 * Built from theme heading keys only (`h2`–`h6`), never px/rem: Mantine's `fz` style prop resolves a
 * heading key to `var(--mantine-<key>-font-size)`. Breakpoints are the theme's own (`sm` 640, `md`
 * 768, `lg` 1024px). Monotonic at every width: `h4` <= `h3` <= `h2`, so a surface keeps its hierarchy.
 * Use as `<Title order={2} size="h4" fz={TITLE_FZ.h4}>` — `size` keeps the line-height, `fz` is the
 * responsive override. Same no-imports / no-`'use client'` contract as `SECTION_HEADING_FZ`.
 *
 *   key | base (<640) | sm (640–767) | md (768–1023) | lg (>=1024)
 *   h2  | h5 20px     | h4 24px      | h3 30px       | h2 36px
 *   h3  | h5 20px     | h4 24px      | h3 30px       | h3 30px
 *   h4  | h6 18px     | h5 20px      | h4 24px       | h4 24px
 *
 * Enforced by `npm run check:type-responsive`. Kickoff: Sprint_83 Task 886, §4.1.
 */
export const TITLE_FZ = {
  h2: { base: 'h5', sm: 'h4', md: 'h3', lg: 'h2' },
  h3: { base: 'h5', sm: 'h4', md: 'h3' },
  h4: { base: 'h6', sm: 'h5', md: 'h4' },
} as const
