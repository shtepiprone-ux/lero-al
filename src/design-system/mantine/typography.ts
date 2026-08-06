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
