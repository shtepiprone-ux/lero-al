# Task 647 — Migrate the Featured/Latest loading skeletons from the legacy `@/components/ui/skeleton` to the canonical Mantine `Skeleton`, and migrate `FeaturedListings`' inline `<h2>` heading to Mantine `Title` (completing the homepage-chrome migration for these two components)

- **Task number:** 647
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage completion; **block C of the homepage-migration plan**).
- **Parent / origin:** Homepage Mantine-migration audit (2026-07-20). `FeaturedListings.tsx` and `LatestListings.tsx` render their loading state with a local skeleton built on the legacy `@/components/ui/skeleton` primitive; `FeaturedListings.tsx` also renders its own inline raw-Tailwind `<h2>` heading (not covered by Task 646, which only touched `page.tsx`). This task swaps both skeletons to the canonical Mantine `Skeleton` and migrates that heading, matching the block-A (Task 646) heading treatment.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine chrome migration in two `'use client'` components. Two concerns: (1) **reuse** the canonical Mantine `Skeleton` (`@mantine/core`) in both `CardSkeleton`/`RowSkeleton` (no new story — Mantine `Skeleton` already has `Mantine/Primitives/Skeleton` + theme chrome from Task 550); (2) migrate `FeaturedListings`' inline `<h2>` → `Title order={2}` (same treatment as Task 646). Visual target = **preserve the look**.

## Objective

- In `src/modules/listings/components/FeaturedListings.tsx` and `src/modules/listings/components/LatestListings.tsx`: replace every legacy `<Skeleton className="…">` (from `@/components/ui/skeleton`) with the canonical `@mantine/core` `Skeleton`, mapping the Tailwind sizing classes to Mantine `height`/`width`/aspect props; remove the legacy `Skeleton` import from both.
- In `FeaturedListings.tsx`: migrate the inline `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>` to `<Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }}>` (identical to Task 646's Latest/Agent-CTA heading treatment).
- Preserve the loading-state layout and appearance; keep the skeleton card wrapper divs and grid wrappers (layout) as-is.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 646 committed `c6c169592`). Both components are `'use client'`.

### `FeaturedListings.tsx` — current skeleton + heading

```tsx
import { Skeleton } from '@/components/ui/skeleton'
…
function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}
…
const header = (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>
    {!loading && listings.length > 0 && (<ViewAllLink … />)}
  </div>
)
…
{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
```

### `LatestListings.tsx` — current skeleton (heading lives in `page.tsx`, already migrated by 646)

```tsx
import { Skeleton } from '@/components/ui/skeleton'
…
function RowSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="… p-… space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}
…
{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
```

- `LatestListings` has **no inline `<h2>`** (its section heading is in `page.tsx`, migrated by Task 646) — only its skeleton changes.

### Canonical Mantine `Skeleton` (reuse — already exists)

- `@mantine/core` `Skeleton`; story `src/stories/mantine/primitives/Skeleton.stories.tsx`; theme chrome in `theme.ts` (`Skeleton` block, Task 550 §6n-LIVE) + `src/design-system/mantine/skeleton-chrome.css`. Props: `height`/`h`, `width`/`w`, `radius`, `circle`, `animate`. Do **not** add a new story or override the theme chrome — reuse the primitive.

### Tailwind → Mantine `Skeleton` size map

| Legacy class | Mantine prop | px |
|---|---|---|
| `h-3` | `height={12}` | 12 |
| `h-4` | `height={16}` | 16 |
| `h-5` | `height={20}` | 20 |
| `w-20` | `width={80}` | 80 |
| `w-28` | `width={112}` | 112 |
| `w-32` | `width={128}` | 128 |
| `w-3/4` | `width="75%"` | 75% |
| `w-full` | (default full width) | 100% |
| `aspect-[4/3] w-full` | image placeholder — preserve 4:3 (e.g. `<Skeleton style={{ aspectRatio: '4 / 3' }} />` or a `Box` wrapper with `aspectRatio` containing a full-size `Skeleton`); verify rendered | — |

- Mantine `Skeleton` renders its own radius from the theme (Task 550) — do not pass a Tailwind rounded class. Keep the card wrapper `div`s (`rounded-xl border bg-card overflow-hidden`) and inner `p-3 space-y-2` layout as-is.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Skeleton swap | Every legacy `<Skeleton>` in `CardSkeleton` (Featured) and `RowSkeleton` (Latest) is replaced by `@mantine/core` `Skeleton` with the mapped `height`/`width`/aspect; the `@/components/ui/skeleton` import is removed from both files | P0 | `git diff`; `grep "@/components/ui/skeleton"` → no match in either file; rendered loading state | Confirmed |
| R2 | Heading swap | `FeaturedListings`' inline `<h2>` → `<Title order={2} fw={700} fz={{base:'1.25rem',sm:'1.5rem',xxl:'1.875rem'}}>` (Task-646 treatment); the surrounding `flex items-center justify-between mb-6` header row + `ViewAllLink` are preserved | P0 | `git diff`; rendered Featured header | Confirmed |
| R3 | Preserve look | Loading skeletons and the Featured heading render visually equivalent to before (bar sizes, card wrapper, grid, heading scale) | P0 | Rendered loading state + heading before/after | Confirmed |
| R4 | Isolation | No change to the loaded (non-loading) card rendering (`ListingCard`/`MantineListingCardPattern`), the data hooks, the grid/section layout, `LatestListings` heading (in `page.tsx`), i18n, or `theme.ts` | P0 | `git diff` scope | Confirmed |
| R5 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green; no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Reuse, not create:** Mantine `Skeleton` is canonical — swap the primitive, no new story, no theme change.
- **Card wrapper + grid layout stay Tailwind** (`rounded-xl border bg-card`, `grid grid-cols-…`, `p-3 space-y-2`) — layout scaffolding, not migrated here (mirrors the real card container + grid). Only the `Skeleton` bars and the Featured `<h2>` change.
- **Aspect-ratio image placeholder:** preserve the 4:3 placeholder — verify the chosen Mantine expression (aspectRatio style or Box wrapper) renders the same height as the legacy `aspect-[4/3] w-full`. Do not hardcode a fixed pixel height that breaks responsiveness.
- **`FeaturedListings` imports `Title`** from `@mantine/core` for the heading (client component — fine). `LatestListings` imports only `Skeleton`.
- No behavior/interactivity change; the skeleton only renders during `loading`.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 12 rendered evidence, 13 no-hardcode, 14 file integrity, 16 TailAdmin).
- `docs/rule-index.md` (current-Mantine chrome migration).
- `docs/qa-profiles.md` (Q2/Q3 — loading-state visual) + viewport policy.
- `docs/mantine-responsive-design-system.md` (§6n Skeleton + Title), `docs/component-rules.md`.
- Source: `src/modules/listings/components/FeaturedListings.tsx` + `LatestListings.tsx` (targets), `src/stories/mantine/primitives/Skeleton.stories.tsx` + `theme.ts` `Skeleton` block + `skeleton-chrome.css` (canonical, reused), `src/components/shared/HowItWorksSteps.tsx` / Task 646 `page.tsx` (heading-scale precedent).

## Scope

1. `FeaturedListings.tsx`: swap `CardSkeleton`'s legacy `Skeleton`s → Mantine `Skeleton` (mapped props); migrate the inline `<h2>` → `Title order={2}`; add `Title, Skeleton` to a `@mantine/core` import; remove the `@/components/ui/skeleton` import.
2. `LatestListings.tsx`: swap `RowSkeleton`'s legacy `Skeleton`s → Mantine `Skeleton`; import `Skeleton` from `@mantine/core`; remove the legacy import.
3. Produce the rendered proof (loading skeleton state both sections + the Featured heading parity, viewports incl. uk@320).
4. Write the session log + a concise `docs/backlog.md` entry (block C; note the newly-migrated Featured `<h2>`). Keep ≤80 lines.

## Out of scope

- The loaded card rendering (`ListingCard`/`MantineListingCardPattern`), data hooks, grid/section layout, card-wrapper divs.
- `LatestListings` heading (already in `page.tsx`, Task 646), `PopularLocations` (Tasks 648/649), `HeroSearch` (Phase-2), i18n keys, `theme.ts`, the Skeleton story/chrome.

## Current and required behavior

- **Current:** Featured/Latest loading states use the legacy `@/components/ui/skeleton`; `FeaturedListings` renders a raw-Tailwind `<h2>`.
- **Required after:** both loading states use the canonical Mantine `Skeleton`; `FeaturedListings`' heading is Mantine `Title order={2}`; the loading appearance and heading are visually unchanged; the legacy `Skeleton` import is gone from both files; the loaded cards and all layout are untouched.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Featured loading state (3 skeleton cards) | **Yes** | R1/R3 | Mantine `Skeleton` bars, same sizes/layout as legacy | Rendered loading (forced or story) |
| Latest loading state (4 skeleton cards) | **Yes** | R1/R3 | same | Rendered loading |
| Featured heading | **Yes** | R2/R3 | `Title order={2}`, same scale as Latest/CTA (646) | Rendered Featured header |
| Aspect-ratio image placeholder | **Yes** | R1 | 4:3 placeholder preserved, responsive | Rendered |
| Loaded (non-loading) cards unchanged | **Yes (regression)** | R4 | `MantineListingCardPattern` cards render as before | Rendered loaded homepage |
| Mobile uk@320 | **Yes** | R3 | skeletons + heading no clip/overflow | Rendered uk@320 |
| i18n key change | No | reuse `listing.featured` etc. | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then no `@/components/ui/skeleton` import remains in either file and every skeleton bar is `@mantine/core` `Skeleton` with the mapped size; the loading state renders equivalently.
- `AC2 [R2]` Given the diff, then `FeaturedListings`' `<h2>` is `Title order={2}` with the Task-646 scale, and the header row + `ViewAllLink` are preserved.
- `AC3 [R3]` Given the rendered loading state + Featured heading at viewports incl. uk@320, then they are visually equivalent to before.
- `AC4 [R4]` Given the diff, then the loaded cards, hooks, grid/section layout, `LatestListings` heading, i18n, and `theme.ts` are unchanged.
- `AC5 [R5]` Given the repo, then typecheck + check:stories + check:i18n + check:mojibake all exit 0 with no i18n key change.

## QA profile and verification plan

**Profile: Q3 Visual (homepage loading chrome + a visible heading).** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. **Rendered proof:** capture the Featured + Latest **loading skeleton** state (force `loading` / throttle / use the `FeaturedListings` story if it exercises the loading branch) showing Mantine `Skeleton` bars equivalent to legacy, and the Featured **heading** on the real `/{locale}` route, before/after, viewports incl. `uk@320` × the locales where copy differs. If the sandbox cannot force the loading state, record it as missing evidence with the exact owner-native command/steps + expected result and request the owner's confirmation.
6. `git status --short` / `git diff --stat` → only `FeaturedListings.tsx`, `LatestListings.tsx`, `docs/backlog.md`, and the session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

Q3 cannot be approved without the rendered loading-state + heading parity evidence incl. uk@320.

## Completion report contract

Write `docs/sessions/2026-07-20-task647-featured-latest-skeleton-heading-mantine.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R5 with evidence; the before/after of each skeleton + the Featured heading + the Tailwind→Mantine size map applied; typecheck/check:stories/check:i18n/mojibake results; the rendered loading-state + heading parity (incl. uk@320); explicit confirmation that the loaded cards, hooks, layout, `LatestListings` heading, i18n, and `theme.ts` are unchanged; and a note that this is block C (PopularLocations 648/649 + HeroSearch Phase-2 remain). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: both skeletons verbatim, the Tailwind→Mantine `Skeleton` size map, the canonical `Skeleton` reuse (no new story), the Featured `<h2>`→`Title` mapping (Task-646 scale), the preserved wrappers/layout, and the Q3 loading-state render matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope protects the loaded cards, hooks, layout, and the already-migrated `LatestListings` heading; names what must not change. ✅
- Reuse (not create) is explicit — Mantine `Skeleton` already has a story + theme chrome; no i18n change. ✅
- Negative flows selected by applicability (Featured/Latest loading, heading, aspect placeholder, loaded-cards regression, mobile in; i18n-change out). ✅
