# Session Archive: Task 644 — Canonical HowItWorksSteps Mantine component + Storybook story — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_644_HowItWorksSteps_Mantine_Component_And_Story.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Created `src/components/shared/HowItWorksSteps.tsx` — a `'use client'` presentational island (string-props,
hook-free, `FooterView`/`AgentCtaButton` precedent) that reproduces the homepage "How it works" 3-step block
using Mantine `Title`/`SimpleGrid`/`Stack`/`ThemeIcon`/`Text` + theme tokens — plus its canonical, toolbar-reactive
Storybook story at `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx`
(`Mantine/Primitives/HowItWorksSteps`). `src/app/[locale]/page.tsx` is untouched — Task 645 wires the component in.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `HowItWorksSteps.tsx` (`'use client'`) renders heading + 1→3-col grid of 3 step cards from Mantine primitives + theme tokens, visual preserved | File created; rendered Storybook proof (below) + legacy-vs-new side-by-side screenshots visually match (icon-box tint, badge, spacing, typography) |
| R2/AC1 | Migrated chrome uses Mantine/theme tokens, no raw Tailwind utilities | `git diff`/file content: zero `className` Tailwind color/spacing utilities; every value is a Mantine prop/theme token (see Visual source trace) |
| R3/AC2 | Component takes localized strings as props (heading + 3×`{title,desc}`); icons/numbers owned internally; no hardcoded copy; renders via `storyT`; no i18n key change | `HowItWorksStepsProps` signature (below); story resolves all copy via `storyT(locale, 'home.*')`; `check:i18n` — 2206/2206 keys parity, no delta |
| R4/AC3 | Canonical story `Mantine/Primitives/HowItWorksSteps`, toolbar-reactive locale+viewport incl. `uk@320` | `HowItWorksSteps.stories.tsx` `Default` story; rendered matrix below — 16/16 cells (4 viewports × 4 locales) PASS, including `uk@mobile-320` |
| R5/AC4 | Registered so `check:story-coverage`/`check:stories` pass | Both commands exit 0 (below) — see "Assumptions/deviations" for why `docs/component-coverage-matrix.md`/`docs/component-catalog.md` were deliberately NOT hand-edited |
| R6/AC5 | Every visual value traces to a theme token/TailAdmin reference; icon-box bg + badge have documented provenance; canonical decision = `create canonical` | Full visual source trace + canonical UI decision record below |
| R7/AC6 | No change to `page.tsx`, i18n files, `theme.ts`, or other consumers; component used only by its story | `git diff --stat` — only the 2 new files + the harness-regenerated governance report (see Files Changed) |
| R8/AC4 | `typecheck`/`check:stories`/`check:story-coverage`/`check:i18n`/`check:mojibake` all exit 0; Q3 rendered proof passes | All 5 commands: exit 0 (Validation evidence below); rendered proof 16/16 PASS |

## Current versus required behavior

**Current:** the "How it works" block exists only as inline legacy Tailwind markup in `page.tsx` (verbatim
reproduced in the kickoff); no reusable component, no Mantine story.

**Required after:** a canonical `HowItWorksSteps` Mantine component exists, visually matching the current block,
proven in a toolbar-reactive Storybook story and passing all coverage/governance gates — but NOT yet used on the
homepage. `page.tsx` still renders the legacy inline block live until Task 645.

**Applicable negative flows** (per the kickoff's own applicability table):

| Branch | Applicable? | Evidence |
|---|---:|---|
| Desktop 3-column render | Yes | `en@desktop-1024` screenshot: 3 cards in a row, centered |
| Mobile (<640/320) 1-column stack | Yes | `uk@mobile-320` screenshot: stacked cards, no clip/overflow with the longest locale strings |
| Locale expansion (sq/en/uk/it) | Yes | All 4 locales rendered via `storyT`; `it@mobile-390` shows `proprietario` wrapping correctly, no overflow |
| Visual parity vs legacy | Yes | Side-by-side capture vs the live `/en` and `/uk` homepage (below) |
| Provenance for icon-box bg/badge | Yes | Canonical UI decision record below — mathematically verified via Mantine source, not guessed |
| Interactivity/links | No — presentational only, none added | N/A |
| i18n key change | No — reused `home.*` keys only | `check:i18n` unchanged (2206/2206) |

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/HowItWorksSteps.tsx` | New canonical Mantine presentational component (R1–R3, R6) |
| `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx` | New canonical toolbar-reactive Storybook story (R4) |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Harness-regenerated inventory (not hand-edited) — story/cell counts updated 298→300 stories, 952→984 cells, by running `screenshots:assert --mantine-only`; file's own header states it is machine-emitted from the manifest |
| `docs/backlog.md` | Concise active-state update (this task → awaiting review; Task 645 next) |

**Confirmed NOT touched** (`git diff --stat` — verified before and after implementation): `src/app/[locale]/page.tsx`,
`messages/*.json`, `src/design-system/mantine/theme.ts`, any other consumer.

## Component signature

```ts
export interface HowItWorksStep { title: string; desc: string }
export interface HowItWorksStepsProps {
  heading: string
  steps: readonly [HowItWorksStep, HowItWorksStep, HowItWorksStep]
}
export function HowItWorksSteps({ heading, steps }: HowItWorksStepsProps): JSX.Element
```

Icons (`Search`/`Home`/`Phone`, lucide-react) and numbers (`1`/`2`/`3`) are owned internally by array index —
matching the kickoff's suggested minimal signature.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector → Mantine prop | Utility/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Section heading | `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold text-center mb-10">` | `<Title order={2} ta="center" fw={700} fz={{base:'1.25rem',sm:'1.5rem',xxl:'1.875rem'}} mb="xl">` | Tailwind text-xl(20)/text-2xl(24, `sm`=640 exact match)/text-3xl(30) → literal rem sizes (no matching `theme.fontSizes`/`headings.sizes` entry spans this exact responsive scale — `h2` default is a fixed 36px, theme.ts:176); Tailwind's `2xl:`(1536px) approximated by Mantine's nearest breakpoint `xxl`(1440px, theme.ts:164) — no exact 1536 stop exists in the theme | **Approximated** (documented deviation — see Assumptions) | theme.ts:158-181 |
| Heading→grid gap | `mb-10` (40px) | `mb="xl"` (24px) | No `theme.spacing` token reaches 40px (scale tops at `xl`=24px, theme.ts:185-191) — nearest existing token used rather than an invented raw px value | **Approximated** (documented deviation) | theme.ts:185-191 |
| Grid | `grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto` | `<SimpleGrid cols={{base:1,sm:3}} spacing="xl" maw={768} mx="auto">` | `sm`(640) exact match; `gap-8`(32px)→`spacing="xl"`(24px) per the kickoff's OWN pre-specified mapping (kickoff Verified Context row, not an executor invention); `max-w-3xl`(768px)=`maw={768}` exact (raw numeric `maw`, precedented in `MantineStoryShell.tsx:45` `maw={{...,sm:1536}}`) | Preserved (structure/breakpoint exact); spacing approximated (kickoff-directed) | Kickoff doc row 56; `MantineStoryShell.tsx:45` |
| Icon box | `h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center` | `<ThemeIcon size={56} radius="2xl" color="brand" variant="light">` | `h-14 w-14`=56px exact (`size={56}`, numeric ThemeIcon size prop — precedented raw-number component sizing, TailAdmin ref §6 Avatar "~44"); `rounded-2xl`=16px exact (`theme.radius['2xl']`, theme.ts:200); `bg-primary/10` verified **mathematically exact**: `get-css-color-variables.mjs:25` computes `--mantine-color-brand-light = alpha(theme.colors.brand[primaryShade], 0.1)`; `primaryShade=7` (theme.ts:152) and `brand[7]='#EC5447'` (theme.ts:13) = the exact CSS `--primary` value the legacy `bg-primary/10` class references | **Preserved exactly** (verified via source, not approximated) | theme.ts:5-16,152,200; `node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/get-css-color-variables.mjs:19-30`; precedent `MantineListingContactPattern.tsx:213` |
| Icon glyph | `h-6 w-6 text-primary` | `<Icon size={24} />` (child of the `ThemeIcon` above) | 24px exact; color inherited via `currentColor` from `--ti-color` = `var(--mantine-color-brand-light-color)` = `var(--mantine-color-brand-7)` = `#EC5447` exact (same as `text-primary`) | **Preserved exactly** | `default-variant-colors-resolver.mjs:56-61`; `ThemeIcon.mjs:21-40` |
| Number badge | `absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center` | `<ThemeIcon size={24} radius="pill" color="brand" variant="filled" pos="absolute" fz="xs" fw={700} style={{top:'calc(var(--mantine-spacing-xs)*-1)',right:'calc(var(--mantine-spacing-xs)*-1)'}}>` | `-top-2/-right-2`=-8px = `theme.spacing.xs`(8px, theme.ts:186) negated via a `calc()` referencing the actual CSS var (not a raw magic number); `h-6 w-6`=24px exact; `rounded-full`→`radius="pill"`(9999px, theme.ts:201 — guarantees a true circle at any size, safer than a coincidental half-of-size radius); `bg-primary`/`text-primary-foreground`→`variant="filled" color="brand"` (no shade) resolves via `default-variant-colors-resolver.mjs:28-38` (`parsed.shade===void 0` branch) → bg=`var(--mantine-color-brand-filled)`=`var(--mantine-color-brand-7)`=`#EC5447` exact, text=white (no `autoContrast`, always white) exact; `text-xs font-bold`→`fz="xs"`(12px, theme.ts:216)/`fw={700}` exact | **Preserved exactly** (net-new composite per §16b — see canonical decision record) | theme.ts:186,201,216; `default-variant-colors-resolver.mjs:28-38` |
| Step title | `<h3 className="font-semibold">` (inherits base 16px) | `<Text component="h3" fw={600} size="md">` | `size="md"`=16px (theme.ts:218) exact match to Tailwind's unset base; `fw={600}`=`font-semibold` exact | **Preserved exactly** | theme.ts:218 |
| Step description | `text-sm text-muted-foreground` | `<Text size="sm" c="dimmed">` | `size="sm"`=14px (theme.ts:217) exact; `c="dimmed"`=Mantine's built-in dimmed token, matching `text-muted-foreground`'s semantic gray per kickoff row 61 | **Preserved exactly** | theme.ts:217; kickoff row 61 |
| `page.tsx` outer `<section>`/`.container-wide` wrapper | unchanged | N/A — explicitly out of scope (Task 645) | — | **Out of scope, untouched** | `git diff` — `page.tsx` absent from the diff |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Section heading | Grepped `Title order={2}` across `src/design-system/mantine/patterns/**` and `src/components/**` + `docs/component-catalog.md` for a shared "SectionHeading" primitive — none exists; every `Title` usage project-wide is component-local | None found | `create canonical` (component-owned; no separate shared wrapper needed — the Mantine `Title` primitive itself is the canonical component) | `Title` (`@mantine/core`) + `theme.ts` headings/fontSizes/spacing |
| Icon box (brand-tinted rounded container) | Grepped `ThemeIcon` across `src/design-system/mantine/patterns/**` → found `MantineListingContactPattern.tsx:203,213` using the identical `ThemeIcon variant="light" color="brand"` / `variant="light" color="gray"` idiom for analogous brand/gray-tinted circular icon boxes; inspected both usages | `MantineListingContactPattern.tsx` (local idiom, not a separately exported primitive) | `reuse` (of the underlying Mantine `ThemeIcon variant="light" color="brand"` construct — not copying a className/utility chain) | `ThemeIcon` (`@mantine/core`) + `theme.ts` brand/primaryShade + `get-css-color-variables.mjs` `-light`/`-light-color` CSS-var mechanism |
| Numbered corner badge | Grepped `pos: 'absolute'`/`pos="absolute"` across `src/design-system/mantine/patterns/**` → `RangeDatePicker.tsx`, `MantinePagination.tsx` (neither is a numbered-badge pattern); grepped `docs/component-catalog.md`/`docs/tailadmin-style-reference.md` for a numbered-badge row — none (kickoff's own §16b note: net-new composite) | None found | `create canonical` (composed inline in `HowItWorksSteps.tsx` from `ThemeIcon` + `theme.spacing.xs`; single consumer today — NOT promoted to `src/design-system/mantine/patterns/` since no second consumer exists to justify extraction) | `ThemeIcon` (`@mantine/core`) `variant="filled" color="brand" radius="pill"` + `var(--mantine-spacing-xs)` |
| Grid (1→3 col responsive) | Grepped `SimpleGrid` across `src/design-system/mantine/patterns/**` → `MantineCardGrid.tsx` (listing-card grid, different content shape, inspected and ruled out); kickoff's own Verified Context table directs the exact mapping | `MantineCardGrid.tsx` inspected, not reused (wrong content shape) | `reuse` of the underlying `SimpleGrid` Mantine primitive (not `MantineCardGrid`) | `SimpleGrid` (`@mantine/core`) + `theme.spacing.xl` |
| Step title/description typography | Grepped `Text size="sm" c="dimmed"` / `Text fw={600}` across `src/design-system/mantine/patterns/**` → identical idiom already used in `MantineListingContactPattern.tsx` and elsewhere project-wide | `Text` (`@mantine/core`), already the established idiom | `reuse` | `Text` (`@mantine/core`) + `theme.fontSizes` |

## Validation evidence

1. `npm run typecheck` → **0 errors**.
2. `npm run check:stories` → **PASSED — 121 files checked, 0 violations** (all 14 governance checks, incl. storybook.* key parity 627/627/627/627 across en/sq/uk/it).
3. `npm run check:story-coverage` → **PASSED** — 61 canonical Mantine story files discovered, 6/6 manifest entries covered, 0 missing. `HowItWorksSteps` is intentionally NOT in `scripts/mantine-migration-scope.json` (see Assumptions) so it is out of this gate's scope by design, not a workaround.
4. `npm run check:i18n` → **PASSED** — 2206/2206 keys, all 4 locales, no delta (reused existing `home.*` keys only).
5. `npm run check:mojibake` → **0 artifacts in 1829 files**.
6. `npm run build-storybook` → succeeded (`storybook-static/` built clean).
7. `npm run screenshots:assert -- --mantine-only` → **957/984 PASS, 0 FAIL, 27 AMBIGUOUS**. All 27 ambiguous cells belong to `Combobox`, `RangeDatePicker`, `NotificationBellView`, and `Tabs` stories (pre-existing, unrelated — confirmed via `grep -i howitworkssteps` on the full output returning zero FAIL/AMBIGUOUS lines for this story). `HowItWorksSteps`' 16 cells (4 viewports × 4 locales, including `uk@mobile-320`) are all in the PASS set.
8. Rendered proof inspected visually: `mantine-primitives-howitworkssteps--default__uk__mobile-320.png` (1-column stack, no clip/overflow with the longest uk strings, badge/icon-box correct), `__en__desktop-1024.png` (3-column row, centered), `__it__mobile-390.png` (wrapped `proprietario` text, no overflow).
9. **Legacy side-by-side parity** (ad-hoc Playwright capture against the running `next dev` server at `localhost:3000`, precedented pattern per Task 572/621 critical-flow-registry entries): captured the live `/en` homepage "How it works" section at 1024px and the live `/uk` homepage at 320px. Visual comparison against the new story's `en@1024`/`uk@320` renders confirms matching icon-box tint, badge size/position/fill, heading style, and 1→3 column responsive behavior.

## Self-review findings

No defects found requiring correction. One design judgment made and documented rather than guessed silently: the
R5 coverage-registration mechanism (see Assumptions below).

## Assumptions, deviations, and limitations

1. **Heading responsive breakpoint approximation:** Mantine's theme has no breakpoint at 1536px (Tailwind's
   `2xl:`); the nearest theme breakpoint is `xxl` (1440px, theme.ts:164). None of the Q3 rendered-proof viewports
   (320/375/390/1024) land in the 1440–1536px gap, so this approximation is not visible in any captured evidence.
2. **Heading `mb-10` (40px) → `mb="xl"` (24px):** no `theme.spacing` token reaches 40px (scale tops at `xl`=24px).
   Used the nearest existing token rather than inventing a raw pixel value, per the token-discipline rule
   (`docs/mantine-responsive-design-system.md` §7.1). Flagged for the owner: if exact 40px spacing is required, a
   new spacing token (e.g. `2xl`) would need to be added to `theme.ts` in a follow-up.
3. **Grid `gap-8`(32px) → `spacing="xl"`(24px):** this exact mapping was pre-specified by the kickoff's own
   Verified Context table (row 56), not an executor decision.
4. **R5 registration mechanism — deliberately did NOT hand-edit `docs/component-coverage-matrix.md` /
   `docs/component-catalog.md`.** Both files are stale, hand-maintained artifacts (headers read "Last generated
   2026-06-01" / "2026-05-28", predating the entire Mantine migration). Reading `docs/storybook-governance.md` §15
   and `scripts/check-story-coverage.mjs` directly confirmed the REAL, CI-blocking coverage gate is
   `scripts/mantine-migration-scope.json` (a hand-maintained enrollment list checked against static story imports
   via AST, not these two docs). Grep-confirmed that the most recent precedent tasks creating new Mantine
   primitive components/stories (`FooterView`/Task Q0R, `ViewAllLink`/Task 630, `AgentCtaButton`/Task 621) did
   NOT touch either catalog doc. Per the manifest's own stated design ("real production components currently in
   Mantine migration scope" — enrolled "in the same PR as their migration"), `HowItWorksSteps` has no landed
   production consumer yet (Task 645 wires it into `page.tsx`), so it was deliberately NOT added to
   `scripts/mantine-migration-scope.json` either — consistent with precedent. `check:story-coverage` passes
   (verified, exit 0) because out-of-manifest components are out of that gate's scope by design, not because a
   check was weakened. Neither stale doc was hand-edited, avoiding introducing unverifiable/inconsistent data into
   a script-generated artifact.
5. **No `theme.ts` change was needed or made** — the icon-box/badge provenance traced exactly to existing tokens
   (see Visual source trace), so no "documented owner-safe token addition" was required.

## Opus handoff

Evidence locations:
- New component: `src/components/shared/HowItWorksSteps.tsx`.
- New story: `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx`.
- Rendered screenshots: `.screenshots/rendered-assert/2026-07-20T17-30/mantine-primitives-howitworkssteps--default__*.png` (16 files, all 4 viewports × 4 locales) — gitignored, session-local; re-capture via `npm run build-storybook && npm run screenshots:assert -- --mantine-only` if persistent evidence is required for release.
- Legacy side-by-side captures: session-scratchpad only (not committed), re-capturable via the ad-hoc Playwright pattern in Validation evidence item 9.

Questions/risks for the reviewer to inspect:
1. Confirm the two documented spacing/breakpoint approximations (heading `mb`, `2xl:` breakpoint) are acceptable
   under "preserve the look" — or decide whether a `2xl` spacing token should be added to `theme.ts`.
2. Confirm the R5 registration judgment (item 4 above) — that the kickoff's reference to
   `docs/component-coverage-matrix.md`/`docs/component-catalog.md` reflected stale process documentation, and that
   the real, verified-passing `check:story-coverage` gate is sufficient evidence for this requirement.
3. Confirm the numbered corner-badge composite (net-new per §16b) is an acceptable `create canonical` disposition
   scoped to `HowItWorksSteps.tsx` itself (not promoted to `src/design-system/mantine/patterns/`), given it has
   only one consumer today.

## Backlog update

See `docs/backlog.md` — concise active-state entry added (Task 644 → awaiting review; Task 645 next, unblocked by
this component's signature). Full detail lives here per session-log rules.
