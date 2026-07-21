# Session — Task 647: Featured/Latest skeleton + Featured heading → Mantine (block C)

**Task path:** `tasks/kickoff_prompt_Task_647_FeaturedLatest_Skeleton_And_Heading_Mantine.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement ledger (restated pre-implementation)

- R1 — replace every legacy `@/components/ui/skeleton` `<Skeleton>` in `CardSkeleton` (Featured) and `RowSkeleton` (Latest) with `@mantine/core` `Skeleton` using the mapped `height`/`width`/aspect props; remove the legacy import from both files.
- R2 — migrate `FeaturedListings`' inline `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">` to `<Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }}>`, identical to the Task-646/`page.tsx` `Latest`/agent-CTA heading treatment; preserve the `flex items-center justify-between mb-6` row and the conditional `ViewAllLink`.
- R3 — loading skeletons and the Featured heading render visually equivalent to before (bar sizes, card wrapper, grid, heading scale), incl. uk@320.
- R4 — no change to loaded-card rendering, data hooks, grid/section layout, `LatestListings` heading (`page.tsx`), i18n, or `theme.ts`.
- R5 — `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all exit 0, no i18n key change.

**Current behavior to preserve:** Featured/Latest loading states render legacy `@/components/ui/skeleton` bars; `FeaturedListings` renders a raw-Tailwind `<h2>`; loaded cards render `ListingCard`/`MantineListingCardPattern` unchanged.
**Required after behavior:** both loading states use `@mantine/core` `Skeleton`; the Featured heading is `Title order={2}`; loading appearance and heading are visually unchanged; legacy `Skeleton` import is gone from both files; loaded cards and all layout untouched.

## Canonical UI decision record

| Visible artifact | Search performed | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| Skeleton bars (Featured `CardSkeleton`, Latest `RowSkeleton`) | Opened `src/stories/mantine/primitives/Skeleton.stories.tsx` (text-line/block/circle/composite variants) + `theme.ts` `Skeleton` block (Task 550 §6n-LIVE: `defaultProps.radius:'xl'`, `styles.root.border` gray-200) + `src/design-system/mantine/skeleton-chrome.css` (`::after` pulse fill gray-50) + compiled `Skeleton.module.css.mjs` rule (`.m_18320242{height:var(--skeleton-height,auto);width:var(--skeleton-width,100%)…}`) confirming default width 100%/height auto (so `aspectRatio` style computes a correct height from full width with no fixed px). | `@mantine/core` `Skeleton` | **reuse** | `import { Skeleton } from '@mantine/core'`; `height`/`width` props per the task's Tailwind→Mantine size map; `style={{ aspectRatio: '4 / 3' }}` for the image placeholder. No story or theme edit. |
| `FeaturedListings` section heading | Opened `src/app/[locale]/page.tsx:51` (Task 646, committed `c6c169592`) — the live `Latest` heading precedent: `<Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{tl('latest')}</Title>`, byte-identical prop set reused at `page.tsx:83` for the agent-CTA heading. | `page.tsx`'s own `Title order={2}` treatment (Task 646) | **reuse** | Same `Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }}` applied in `FeaturedListings.tsx`; import added from `@mantine/core`. |

No new canonical primitive, story, or theme change was required or made.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Featured card image placeholder | `CardSkeleton` (`FeaturedListings.tsx`) | legacy `Skeleton className="aspect-[4/3] w-full"` | `@/components/ui/skeleton` Tailwind `animate-pulse bg-muted` | **change** → `@mantine/core Skeleton style={{aspectRatio:'4 / 3'}}` | rendered `loading-en1280.png`/`loading-uk320.png` |
| Featured card text bars (×5) | `CardSkeleton` | legacy `Skeleton className="h-3/4/5 w-…"` | Tailwind fixed px/percent widths | **change** → `Skeleton height={…} width={…}` per size map | same |
| Latest row image placeholder | `RowSkeleton` (`LatestListings.tsx`) | legacy `Skeleton className="w-full aspect-[4/3]"` | same legacy primitive | **change** → Mantine `Skeleton style={{aspectRatio:'4 / 3'}}` | same |
| Latest row text bars (×4) | `RowSkeleton` | legacy `Skeleton className="h-3/4/5 w-…"` | same | **change** → mapped props | same |
| Card wrapper divs (`rounded-xl border bg-card overflow-hidden`, `p-3 space-y-2`) | both skeleton fns | Tailwind utility classes | not migrated (layout scaffolding, task scope) | **preserve** | diff — untouched |
| Featured heading | `FeaturedListings.tsx` header | legacy `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">` | raw Tailwind responsive font-size | **change** → `Title order={2} fw={700} fz={{base:'1.25rem',sm:'1.5rem',xxl:'1.875rem'}}` (Task-646 scale) | `loading-*`/`loaded-*` screenshots, "Featured"/"Преміум" heading |
| Featured header row + `ViewAllLink` | `header` const | `flex items-center justify-between mb-6` + conditional `ViewAllLink` | out of scope | **preserve** | diff — untouched; rendered proof shows `View all`/`Переглянути всі` present when loaded, absent while loading (unchanged conditional) |
| `LatestListings` section heading (`page.tsx`) | `page.tsx:51` | `Title order={2}` (Task 646) | already migrated | **preserve, out of scope** | diff — `page.tsx` untouched; rendered proof shows "Latest"/"Останні" unchanged |
| Loaded `ListingCard` rendering | `FeaturedListings`/`LatestListings` non-loading branch | — | out of scope | **preserve** | diff — untouched; `loaded-en1280.png`/`loaded-uk320.png` show real card unaffected |

## Files Changed

| File | Reason |
|---|---|
| `src/modules/listings/components/FeaturedListings.tsx` | R1: `CardSkeleton`'s 6 legacy `Skeleton`s → `@mantine/core Skeleton` (mapped props); R2: inline `<h2>` → `Title order={2}`; import swap (`@/components/ui/skeleton` → `Skeleton, Title` from `@mantine/core`). |
| `src/modules/listings/components/LatestListings.tsx` | R1: `RowSkeleton`'s 5 legacy `Skeleton`s → `@mantine/core Skeleton` (mapped props); import swap (`@/components/ui/skeleton` → `Skeleton` from `@mantine/core`). |
| `docs/backlog.md` | Moved Task 647 from "Designed" to "Implemented — awaiting orchestrator review"; updated numbering note. |
| `docs/sessions/2026-07-20-task647-featured-latest-skeleton-heading-mantine.md` | This session log. |

`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` shows as modified in `git status` but was **not touched by this session** (pre-existing working-tree state at session start) — classified `EXCLUDED AS UNRELATED`.

## Before/after — skeletons and heading

### `FeaturedListings.tsx` `CardSkeleton`

```tsx
// before
<Skeleton className="aspect-[4/3] w-full" />
<Skeleton className="h-3 w-20" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-5 w-32" />
<Skeleton className="h-3 w-full" />

// after
<Skeleton style={{ aspectRatio: '4 / 3' }} />
<Skeleton height={12} width={80} />
<Skeleton height={16} />
<Skeleton height={16} width="75%" />
<Skeleton height={20} width={128} />
<Skeleton height={12} />
```

`w-full` bars omit `width` — Mantine `Skeleton`'s own compiled default (`width: var(--skeleton-width, 100%)`, confirmed in `Skeleton.module.css.mjs`) already renders full width with no prop needed.

### `LatestListings.tsx` `RowSkeleton`

```tsx
// before
<Skeleton className="w-full aspect-[4/3]" />
<Skeleton className="h-3 w-20" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-5 w-28" />
<Skeleton className="h-3 w-full" />

// after
<Skeleton style={{ aspectRatio: '4 / 3' }} />
<Skeleton height={12} width={80} />
<Skeleton height={16} />
<Skeleton height={20} width={112} />
<Skeleton height={12} />
```

### `FeaturedListings.tsx` heading

```tsx
// before
<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>

// after
<Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{t('featured')}</Title>
```

### Tailwind → Mantine `Skeleton` size map applied

| Legacy class | Mantine prop used |
|---|---|
| `h-3` | `height={12}` |
| `h-4` | `height={16}` |
| `h-5` | `height={20}` |
| `w-20` | `width={80}` |
| `w-28` | `width={112}` |
| `w-32` | `width={128}` |
| `w-3/4` | `width="75%"` |
| `w-full` | omitted (Mantine default 100%) |
| `aspect-[4/3] w-full` | `style={{ aspectRatio: '4 / 3' }}` |

## Validation evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0, 0 errors |
| Storybook governance | `npm run check:stories` | `✅ check:stories PASSED — 121 files checked, 0 violations.` |
| i18n parity | `npm run check:i18n` | `✅ Parity PASSED — all 4 locale files have identical key sets (2206 keys).` No key change (task adds no new i18n keys — reuses `listing.featured`). |
| Mojibake/encoding | `npm run check:mojibake` | `check:mojibake: 0 artifacts in 1835 files` |

### Rendered proof (Q3)

Method: started `next dev --turbopack` locally (port 3000, real `.env.local` Supabase creds), then used a throwaway Playwright script (outside the tracked tree, under `node_modules/.tmp-task647/`, deleted after the run — no repo pollution) to:

1. **Loading state** — `page.route()` intercepted only requests to the Supabase REST host and delayed them 6s, holding `useFeaturedListings`/`useLatestListings` in `loading:true` long enough to screenshot the real `/{locale}` homepage route (not a story fixture).
2. **Loaded state** — normal navigation, waited for `.mantine-Skeleton-root` to disappear from the DOM, then screenshotted.

Captured at `en@1280` (desktop) and `uk@320` (mobile, longest-copy locale):

- `loading-en1280.png` / `loading-uk320.png` — Featured heading ("Featured"/"Преміум") renders at the Task-646 scale; `CardSkeleton`/`RowSkeleton` bars render with the mapped relative widths (short label bar, full-width bars, 75%-width bar, medium price-width bar) and the 4:3 image-placeholder box, matching the legacy bar proportions; `ViewAllLink` correctly absent during loading (unchanged conditional `!loading && listings.length > 0`); no horizontal overflow/clipping at uk@320.
- `loaded-en1280.png` / `loaded-uk320.png` — real `ListingCard` renders with photo/price/location unaffected; Featured/Latest headings and `ViewAllLink`/`View all`↔`Переглянути всі` render correctly once loaded; only 1 seeded listing exists in the dev DB so remaining grid slots are empty (pre-existing data fact, not a defect).

Screenshots are in the session's scratchpad (not committed — this repo does not commit ad hoc screenshot evidence); described above with per-viewport/per-state observations for the reviewer.

**One rendering caveat for the reviewer:** the loading-state image-placeholder fill (`gray-50`, `#F9FAFB`, per Task 550 §6n-LIVE) reads as very light/near-white against the white card background at a single captured animation frame — this is the documented, intentional theme token (not a regression); the 1px gray-200 border and 12px radius are visible around each placeholder in both captures.

**Unrelated pre-existing drift noted, not fixed (out of scope):** `src/stories/FeaturedListings.stories.tsx` (`System/FeaturedListings`) is a separate hand-built fixture (not importing the real `FeaturedListings` component) that still renders its own local `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">` and has no loading-state story — it predates this task and Task 646 (which only touched `page.tsx`). It was not in this task's scope and was left unchanged; it's the reason the kickoff's "use the FeaturedListings story if it exercises the loading branch" fallback wasn't usable — that story never exercises the loading branch. Flagging for the orchestrator in case a follow-up story-parity task is warranted.

### Git scope

```
git status --short
 M docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md   ← EXCLUDED AS UNRELATED (pre-existing, not touched this session)
 M src/modules/listings/components/FeaturedListings.tsx
 M src/modules/listings/components/LatestListings.tsx
```
Plus the two new/updated doc files (`docs/backlog.md`, this session log) — matches the task's expected diff scope exactly.

## Self-review findings

- Confirmed via `grep` that `@/components/ui/skeleton` no longer appears in either target file (only `@mantine/core` `Skeleton`/`Title` imports remain).
- Confirmed Mantine `Skeleton`'s compiled default (`width:100%`, `height:auto`) makes the `aspectRatio` style expression correctly size the image placeholder from the full-width parent — verified in `Skeleton.module.css.mjs`'s compiled rule before using it, not assumed.
- Confirmed the `Title` prop set is byte-identical to `page.tsx`'s already-approved (Task 646) `Latest`/agent-CTA heading treatment, not a new value.
- Confirmed `LatestListings.tsx` has no heading of its own (unaffected, per task) and `page.tsx` was not touched.
- No defects found requiring rework.

## Assumptions, deviations, and limitations

- No deviations from the kickoff's size map or heading spec.
- Rendered evidence was captured via a locally-run dev server against the project's real (dev) Supabase credentials already present in `.env.local`, using a throwaway, non-committed Playwright script for the loading-state timing — the sandbox was capable of forcing the loading state, so no "missing evidence" fallback was needed.
- Only 2 of the profile's suggested viewports were captured (uk@320, en@1280) rather than the full multi-locale matrix, since the loading-state text is skeleton bars (no locale-dependent copy) and the heading-scale parity was already established at these two extremes (narrowest mobile + desktop); the Featured/Latest heading *strings* themselves are unchanged copy (`t('featured')`, reused key), so locale-string risk is effectively covered by `check:i18n`, not by additional screenshots.

## Opus handoff

- Diff: `src/modules/listings/components/FeaturedListings.tsx`, `src/modules/listings/components/LatestListings.tsx` (16/12 lines changed respectively, no line-count growth of concern).
- Please verify: (1) the `aspectRatio` style expression is an acceptable "Mantine prop" interpretation of the task's `Skeleton` size map (task explicitly allowed `style={{aspectRatio:...}}` as one of two named options); (2) whether the noted `System/FeaturedListings` story drift (never exercises loading, still uses a local `<h2>`) warrants a follow-up task; (3) the `docs/governance-reports/...` pre-existing modified file should remain excluded from this task's commit scope.
- `docs/backlog.md` is at 79 physical lines (within the 80-line hard limit) — no `BACKLOG LIMIT BREACH`.

## Backlog update

`docs/backlog.md` — moved the Task 647 entry from "Designed" to "Implemented — awaiting orchestrator review" with a one-line current-state summary (gates green, Q3 rendered proof captured); updated the task-numbering note to reflect 647's new status. Resulting file: **79 physical lines** (≤ 80-line hard limit; no breach).
