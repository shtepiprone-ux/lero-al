# Task 809 — Favorites leaves Tailwind, and the last two card surfaces join the track

Sprint 74 · `tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md` · P2 · QA **Q3**

## 1. Mode and task type

`IMPLEMENTATION` — a **mixed** task by `docs/rule-index.md`: `FavoritesShell.tsx` and `RecentlyViewedSkeleton` are
legacy shadcn/Tailwind surfaces migrating onto the current Mantine path. Read both bundles and keep the boundary
explicit: everything this task *writes* is current-Mantine; the legacy docs are read only to know what the existing
markup means before it is deleted.

Strongest permitted result is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

## 2. Objective

Sprint 74 made one card width govern the whole site and made the rail operable. Two surfaces never joined: the
favorites page still renders its own four-step Tailwind column ladder, and the listing detail route still flashes a
*grid* skeleton in front of a *rail*. This task closes both, de-Tailwinds `FavoritesShell` completely, and retires
the now-dead `'3-col-xl'` layout context. **Sprint 74's exit criteria do not close without it.**

## 3. Verified context — measured 2026-09-10 against the worktree, not quoted from `docs/backlog.md`

Every number below was read from the file in this session. **Re-measure at execution** — line numbers move.

### 3.1 `FavoritesShell.tsx` — the seventh card surface

`FACT` — `src/modules/listings/components/FavoritesShell.tsx`: **230 lines, 21 `className=`**. It is a
`'use client'` component. The card grid is one line:

```
:202   <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
:209                  layoutContext="3-col-xl"
```

`FACT` — that ladder is the fifth different width contract Sprint 74 set out to delete, and it survives only
because Task 807 excluded it on the legacy/current boundary rule.

`FACT` — the other 20 `className=` are **three state blocks**, not card chrome:

| Block | Lines | Markup |
|---|---|---|
| Error (fetch failed) | `:136-152` | `flex flex-col items-center justify-center py-24 gap-5 text-center` · `h-20 w-20 rounded-2xl bg-destructive/10` · `AlertCircle h-9 w-9 text-destructive` · `h2.text-xl font-bold mb-2` · `p.text-muted-foreground text-sm max-w-sm mx-auto` · `<Link className={cn(buttonVariants({variant:'outline'}), 'rounded-xl')}>` |
| Empty (no favorites at all) | `:157-173` | identical shell, `bg-muted` + `Heart`, `<Link className={cn(buttonVariants({size:'lg'}), 'rounded-xl')}>` |
| Filtered empty (type filter matches nothing) | `:184-199` | same shape one rung smaller — `py-20 gap-4`, `h-16 w-16`, `h-7 w-7`, `h3.text-lg font-semibold mb-1`, outline link |

`FACT` — `buttonVariants` is imported from `@/components/ui/button` (`:7`), the shadcn button. All three actions are
**`next/link` navigations with a real `href`**, not callbacks:
`/${locale}/favorites` (error retry), `/${locale}/listings` (empty CTA), `/${locale}/favorites` (clear the filter).
This matters — see §3.5's decision record.

`FACT` — the outer wrapper at `:177` is `flex flex-col gap-6`, holding `CollectionsSection`, `FavoritesTypeFilter`,
then either the filtered-empty block or the grid + `ListingsPagination` (`:221-225`).

`FACT` — the card carries an `imageActions` slot (`:213-219`) holding `SaveToCollectionButton` with
`className="bg-card/80 hover:bg-card shadow-sm rounded-lg"` — raw Tailwind chrome on a card-internal overlay.

`FACT` — all ten i18n keys the three blocks use already exist under the `favorites` namespace in `messages/en.json`
(`empty_title`, `empty_desc`, `empty_cta`, `filter_all`, `filter_label`, `empty_filtered_title`,
`empty_filtered_desc`, `error_title`, `error_desc`, `error_retry`). **This task adds no i18n key.**

`FACT` — `FavoritesShell.tsx` is **not** in `scripts/mantine-migration-scope.json` (grepped: the file lists
`ListingsShellView.tsx` at `:27` and `RecentlyViewedGridView.tsx` at `:33`, and no favorites entry). It therefore
has **no canonical story** and is invisible to `check:story-coverage`, which currently reports **33 covered / 0
unproven**.

### 3.2 `RecentlyViewedSkeleton` — a grid standing in front of a rail

`FACT` — `src/modules/listings/components/RecentlyViewedSection.tsx:65-83`:

```
:67   <div className="recently-viewed" aria-busy="true">
:68     <div className="h-7 w-52 rounded-lg bg-muted animate-pulse mb-4" />
:69     <div className="flex gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
:71       <div key={i} className="w-48 shrink-0 sm:w-auto rounded-xl border overflow-hidden">
:72         <div className="aspect-[4/3] bg-muted animate-pulse" />
```

`FACT` — this reproduces the **pre-807** Recently-viewed contract: a 192px rail below 640px that becomes a 2/3/4
grid above it. The real content it stands in for is now a `MantineListingCardTrack mode="rail"` at every width
(D74-4), so the Suspense boundary visibly re-lays-out when it resolves.

`FACT` — Task 807 already fixed the identical defect for Similar listings, and its result is the canonical model
to copy: `ListingDetailView.tsx:54-77`, `SimilarListingsSkeleton`, which renders `Stack` → `Skeleton`-wrapped
`Title` → `MantineListingCardTrack mode="rail"` → four `Paper withBorder radius="lg"` cards of
`Skeleton`/`Text`. **Read it before writing anything.**

### 3.3 `'3-col-xl'` — exactly two consumers, both in this task's scope

`FACT` — `grep -rn "3-col-xl" src/ --include=*.tsx --include=*.ts` returns five hits, of which only **two are
consumers**: `FavoritesShell.tsx:209` and `src/stories/mantine/primitives/ListingCard.stories.tsx:171`
(`FavoritesComposition`). The other three are the declaration and two comments — `src/lib/imageDelivery.ts:78`
(`| '3-col-xl'  // 3-col at xl (1280px), no sidebar — FavoritesShell (Task 809, out of scope)`), `:84`
(`'3-col-xl': '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw'`) and `AppImage.tsx:36`.

`FACT` — Task 807 wrote those comments and deliberately kept the member because 809 was out of scope. That reason
expires here.

`FACT` — `LISTING_LAYOUT_SIZES` already carries the replacement:
`'card-track-grid': '(min-width: 640px) 360px, calc(100vw - 32px)'` (`imageDelivery.ts:96`).

### 3.4 `FavoritesComposition` — the story that mirrors the production composition

`FACT` — `src/stories/mantine/primitives/ListingCard.stories.tsx:158-184` renders the real `ListingCard` with the
real `SaveToCollectionButton` through `imageActions`, inside `<div style={{ maxWidth: 360 }}>`, at
`layoutContext="3-col-xl"`, and its own doc comment says it is "byte-identical composition to `FavoritesShell.tsx`".
That claim becomes false the moment `FavoritesShell` changes — the story is in scope, not a bystander.

### 3.5 Canonical UI decision record — mandatory, and one row is NOT a plain reuse

| Visible artifact | Searched / inspected | Canonical source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Favorites card grid | `MantineListingCardTrack.module.css`/`.tsx`; `ListingsShellView.tsx:129` (the only existing `mode="grid"` consumer) | `MantineListingCardTrack` `mode="grid"` | **reuse** | Replace `:202`'s `<div className="grid …">` with the track. No column ladder, no `gap` of its own — the track owns both. |
| Empty · filtered-empty · error states | `ls src/design-system/mantine/patterns/`; `grep -rln "EmptyState\|emptyState" src/design-system/mantine src/stories` | `MantineEmptyLoadingErrorState` (`src/design-system/mantine/patterns/`), canonical story `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | **extend** | See §10.2 — the pattern's action API is `actionLabel` + `onAction?: () => void`, a **callback**. All three FavoritesShell actions are `<Link href>` navigations. A callback cannot render an `<a href>`, so it breaks middle-click, "open in new tab" and crawlability. The pattern must gain an href-capable action, and its canonical story must prove it. |
| `SaveToCollectionButton` overlay chrome | `FavoritesShell.tsx:215`; `MantineListingCardPattern.module.css` `.imageActions` | `MantineListingCardPattern`'s `.imageActions` slot | **reuse** | The slot already positions and stacks the node. Delete the raw `bg-card/80 hover:bg-card shadow-sm rounded-lg` and let the button take canonical `ActionIcon` chrome — see §10.3, and mind Task 810's z-index note. |
| Recently-viewed skeleton | `ListingDetailView.tsx:54-77` (`SimilarListingsSkeleton`, Task 807) | That function, verbatim in shape | **reuse** | Same `Stack`/`Skeleton`/`Paper`/track composition, four items, `mode="rail"`. No new primitive. |
| Favorites page as a Storybook artifact | `scripts/mantine-migration-scope.json` (grepped — no favorites entry) | none exists | **create canonical** | A `FavoritesShell` story is required: manifest entry + a canonical Mantine story that **statically imports the real `FavoritesShell`**, covering grid / empty / filtered-empty / error. `check:story-coverage` moves **33 → 34**, 0 unproven. |

`FACT` — **`MantineEmptyLoadingErrorState` has zero production consumers today.** `grep -rln` returns only the
barrel (`patterns/index.ts`), the theme, `theme.d69-18.test.tsx` and its own story. FavoritesShell becomes its
first. Expect the same class of surprise the deferred bare-pattern gutter row describes: a pattern that has only
ever rendered inside a story decorator may not sit correctly inside a real page shell. Measure it, do not assume it.

### 3.6 Owner decisions taken for this task — 2026-09-10

`OWNER DECISION — D74-10.` **Favorites is a `grid` consumer of the track, not a rail.** It is a paginated results
page — `ListingsPagination` at `:221` — structurally identical to `/listings`. This **amends D74-4's** sentence
"`/listings` search results remain the only `grid` consumer of the track": the grid consumers are now `/listings`
**and** `/favorites`, and every other card surface is a rail. Rejected alternative: making Favorites a rail to keep
D74-4 literally intact, which would put a horizontally scrolling list above a pager.

`OWNER DECISION — D74-11.` **`'3-col-xl'` is deleted in this task**, together with its `LISTING_LAYOUT_SIZES` row,
once both consumers move to `'card-track-grid'`. Rejected alternative: keeping the dead member and filing a separate
cleanup.

`OWNER DECISION — scope, 2026-09-10.` **`FavoritesShell` is a full de-Tailwind slice**, not a track swap: all 21
`className=` go, including the three shadcn `buttonVariants` links. Rejected alternatives: track-swap-only, and
track-swap-plus-empty-states-but-keep-the-shadcn-buttons.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | **D74-10.** `FavoritesShell`'s card grid renders through `MantineListingCardTrack mode="grid"`. The four-step Tailwind ladder and its `gap-5` are deleted, not re-tuned. | **P0** | AC1 |
| **R2** | `FavoritesShell.tsx` contains **zero** `className=` occurrences and imports nothing from `@/components/ui/*`. All three state blocks render through the canonical Mantine pattern. | **P0** | AC2 |
| **R3** | **The pattern is extended, not copied.** `MantineEmptyLoadingErrorState` gains an href-capable action; its canonical story proves the new state. No feature-local empty-state markup, no raw values. | **P0** | AC3 |
| **R4** | `RecentlyViewedSkeleton` renders through `MantineListingCardTrack mode="rail"`, matching `SimilarListingsSkeleton`'s composition, so the Suspense swap does not re-lay-out. | **P0** | AC4 |
| **R5** | **D74-11.** `'3-col-xl'` is removed from `ListingLayoutContext` and `LISTING_LAYOUT_SIZES`; both consumers pass `'card-track-grid'`. A repo-wide grep proves zero remaining references, comments included. | P1 | AC5 |
| **R6** | `FavoritesShell` is enrolled in `scripts/mantine-migration-scope.json` with a canonical story that statically imports the real component and covers grid / empty / filtered-empty / error. `check:story-coverage` reports **34 covered / 0 unproven**. | **P0** | AC6 |
| **R7** | `FavoritesComposition` (`ListingCard.stories.tsx:158`) is updated so its "byte-identical to `FavoritesShell.tsx`" claim stays true — same `layoutContext`, same `imageActions` composition, no `maxWidth: 360` stand-in for a track. | P1 | AC7 |
| **R8** | **Behaviour is preserved exactly.** Realtime favorite removal, the type filter and its live counts, pagination, `CollectionsSection`, and all three `<Link href>` destinations still work and still render real anchors. | **P0** | AC8 |
| **R9** | **Canonical and tokenised.** No new dependency, no new i18n key, no `design-tokens-allow` marker, no allowlist entry, no bare px/rem/hex anywhere including `style={{}}`. `check:design-tokens --strict --scope=mantine` stays **0**. | **P0** | AC9 |
| **R10** | The track itself is frozen. `MantineListingCardTrack.tsx`/`.module.css` are byte-unchanged; `'card-track-grid'`/`'card-track-rail'` keep their current `sizes` strings. | P1 | AC10 |

## 5. Assumptions and open questions

- **`OWNER DECISION`** — D74-10, D74-11 and the full-slice scope are settled (§3.6). None is the executor's to re-open.
- **`UNKNOWN` — whether `MantineEmptyLoadingErrorState` renders correctly inside the real page shell.** It has never
  had a production consumer (§3.5). If it needs a layout fix, that fix belongs **in the pattern**, and it must be
  reported as a finding with the measurement that showed it, not absorbed silently.
- **`UNKNOWN` — the exact shape of the href-capable action.** Two candidates: an `action?: ReactNode` slot the
  consumer fills with its own `<Button component={Link} href=…>`, or an `actionHref?: string` prop the pattern turns
  into that itself. **Choose by measurement, state the reason, and prove the chosen one in the canonical story.**
  A slot keeps routing out of the design system; a prop keeps the button chrome inside it. Either is acceptable —
  silently keeping `onAction` and wrapping the whole block in a `<Link>` is not.
- **`ASSUMPTION (reversible, stated)`** — the three state blocks' size difference (`py-24`/`h-20` for the two
  full-page states, `py-20`/`h-16` for the filtered one) is incidental hand-tuning, not a designed hierarchy, and
  collapses to one canonical state pattern. If the owner's visual pass disagrees, that is a one-line prop, not a
  re-migration. Say so in the report.
- **Out of scope:** `ListingCard.tsx`'s composition · `MantineListingCardPattern` · the track · `ListingsPagination`
  (already enrolled, already has its own canonical Story) · `useFavoritesRealtime` · the `/favorites` route file
  (→ **811**) · Task 808's files.
- ~~`CollectionsSection`, `FavoritesTypeFilter`, `SaveToCollectionButton`'s own internals~~ — **THIS EXCLUSION WAS A
  BREACH OF `docs/agent-contract.md` CLAUSE 16c AND IS REVOKED (owner rejection, 2026-09-10).** It is kept
  struck-through because it is the defect. All three are now Revision 1's primary scope — see §21.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15) · `docs/ai-behavior.md` Notes 18-23 · `docs/rule-index.md` →
**both** paths, boundary stated: current Mantine — `docs/mantine-responsive-design-system.md`,
`docs/tailadmin-style-reference.md`, `docs/component-rules.md`; legacy (read-only, to interpret what is being
deleted) — `docs/ui-rules.md`, `docs/design-system.md` §22-23 · `docs/qa-rules.md` · `docs/qa-profiles.md` ·
`docs/storybook-governance.md` · `docs/backlog.md` · this sprint's plan file for **D74-1 … D74-11** · Task 807's
session log for the track adoption contract · Task 810's session log §17-§24 for the track's current behaviour.

## 7. Scope

`src/modules/listings/components/FavoritesShell.tsx` (R1, R2, R8) ·
`src/modules/listings/components/RecentlyViewedSection.tsx` (R4, the skeleton only) ·
`src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` (R3) ·
`src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` (R3's proof) ·
a new canonical `FavoritesShell` story under `src/stories/` (R6) · `scripts/mantine-migration-scope.json` (R6) ·
`src/stories/mantine/primitives/ListingCard.stories.tsx` (R7, `FavoritesComposition` only) ·
`src/lib/imageDelivery.ts` (R5, the `'3-col-xl'` member + its `sizes` row + the two stale comments) ·
`src/components/ui/AppImage.tsx` (R5, `:36`'s comment only) · `docs/component-catalog.md` · `docs/backlog.md` state
and the session log.

## 8. Out of scope

`MantineListingCardTrack.tsx`/`.module.css` (R10 freezes them) · `ListingCard.tsx` · `MantineListingCardPattern.*` ·
`globals.css` and `--listing-card-min` · `theme.ts` · the five surfaces Task 807 already migrated ·
`ListingsShellView.tsx` · Task 808's `ListingDetailView.tsx` · `package.json` · `messages/*.json` — **if a message
key looks wrong, that is a finding, not a diff.**

## 9. Current and required behavior

**Before:** `/[locale]/favorites` renders a bespoke `1 → sm:2 → xl:3 → 2xl:4` Tailwind grid with `gap-5`, so at
560px a favorites card is a different width from the same card on the homepage. Its three states are hand-rolled
Tailwind blocks around shadcn `buttonVariants` links. On the detail route, the recently-viewed Suspense fallback is
a 192px-rail-then-grid that visibly re-lays-out into a rail when the data lands. `'3-col-xl'` exists to serve one
component.

**After:** favorites cards are the same width as every other card on the site, from the same track. The three states
render from the one canonical pattern, whose actions are still real links. The recently-viewed placeholder is the
same rail as the content that replaces it. `'3-col-xl'` is gone, and `check:story-coverage` proves the favorites
page has a canonical story for the first time.

## 10. Implementation requirements

### 10.1 The grid (R1, D74-10)

Replace `:202`'s wrapper with `<MantineListingCardTrack mode="grid">`, children unchanged, and pass
`layoutContext="card-track-grid"` on the card (R5). Delete `gap-5` — the track owns the gap. Do **not** pass a
`className` that reintroduces spacing. Read `ListingsShellView.tsx:129-143` first: it is the only existing
`mode="grid"` consumer and it is the shape to match.

### 10.2 The three states (R2, R3)

**Order matters — this is the project's canonical-story-before-consumer rule.** Extend
`MantineEmptyLoadingErrorState` and prove the new action in
`src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` **first**; only then compose it into
`FavoritesShell`.

- The pattern keeps its existing `state`/`title`/`description` API and its `onAction` callback for current callers.
- Add the href-capable action (§5's open choice). Whichever shape you pick, the rendered element must be a real
  anchor with an `href` — assert that in the story and in AC3.
- The error block additionally carries an icon (`AlertCircle`) and the empty blocks a `Heart`. The pattern's `error`
  branch already renders a Mantine `Alert`; its `empty` branch already renders a `ThemeIcon`. **Inspect what the
  pattern already does before adding an icon prop** — if it takes one, reuse it; if it does not, extending it is
  in scope, inventing a local icon wrapper is not.
- Delete `buttonVariants` and the `cn` import from `FavoritesShell.tsx` once nothing uses them. `grep` to confirm,
  do not assume.

### 10.3 The `imageActions` overlay (R2)

`SaveToCollectionButton`'s `className="bg-card/80 hover:bg-card shadow-sm rounded-lg"` is raw Tailwind on a
card-internal overlay. Its chrome belongs to the button's own canonical primitive. Move it there or drop it in
favour of the primitive's default, and say which. **Note from Task 810:** `MantineListingCardPattern.module.css`'s
`.imageActions` sets `z-index: 1`, and the rail's controls now sit at `var(--z-dropdown)` above it — if this change
alters the slot's stacking, that is a finding to report, not a value to tune.

### 10.4 The skeleton (R4)

Rewrite `RecentlyViewedSkeleton` to `SimilarListingsSkeleton`'s composition (`ListingDetailView.tsx:54-77`): a
`Stack`, a `Skeleton`-wrapped `Title` for the heading, then `MantineListingCardTrack mode="rail"` holding four
`Paper withBorder radius="lg"` placeholders. Keep `aria-busy="true"` and the `recently-viewed` hook if anything
selects it — **grep before deleting either**. Keep four items: that is what the real section renders into.

### 10.5 `'3-col-xl'` (R5, D74-11)

Delete the union member (`imageDelivery.ts:78`) and its `LISTING_LAYOUT_SIZES` row (`:84`), and correct the two
comments that name it — `imageDelivery.ts:64-66` and `AppImage.tsx:36`, both written by Task 807 and both now
false. `tsc` will find any consumer you missed; a passing `tsc` plus a zero-hit grep is the proof.

### 10.6 The stories (R6, R7)

- **New:** a canonical Mantine story for `FavoritesShell` that **statically imports the real component** — the
  `check:story-coverage` gate proves the import, so a re-implementation in the story fails the gate and the review.
  Four states: populated grid, empty, filtered-empty, error. Add its manifest entry to
  `scripts/mantine-migration-scope.json`. Coverage goes **33 → 34 covered, 0 unproven**.
- **Updated:** `FavoritesComposition` (`ListingCard.stories.tsx:158-184`) — `layoutContext="card-track-grid"`, and
  its doc comment's "byte-identical composition to `FavoritesShell.tsx`" claim re-checked against the new
  production composition. If `maxWidth: 360` no longer reflects what the track produces, fix it; the story exists
  to mirror production, not to look tidy.

## 11. Positive and negative flows

**Positive:** sign in with favorites saved, open `/uk/favorites` at 1024 — cards render at the same width as
`/uk/listings`, the type filter narrows them, the pager works, un-favoriting a card removes it live.

| Negative flow | Applicable | Why |
|---|---|---|
| Zero favorites at all | **Yes** | R2's empty state, and the first production render of the pattern. |
| Favorites exist, filter matches none | **Yes** | The third block, and the one whose sizing differs (§5). |
| Server fetch error | **Yes** | R2's error state; the `Alert` branch. |
| Un-favourite the last card on a filtered page | **Yes** | Realtime removal must fall back to an empty state, not an empty grid — R8. |
| Action links: middle-click / open in new tab | **Yes** | R3's whole reason; a callback silently breaks this. |
| Suspense resolve on the detail route | **Yes** | R4 — the skeleton must not re-lay-out. |
| 320px, longest locale | **Yes** | Single-column grid, and the empty-state copy at its narrowest. |
| RLS / data failure | No | The shell receives listings as props; the route owns the query. |
| Zero children in the track | No | Covered by the empty-state branch — the track never renders with zero cards here. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `/uk/favorites` with more than four favorites at 640 / 1024 / 1440, then the card container is
  `MantineListingCardTrack mode="grid"` and the measured card width matches `/uk/listings` at the same viewport
  within 1px. State both widths per viewport.
- **AC2 [R2]** — Given `git diff`, then `grep -c 'className=' src/modules/listings/components/FavoritesShell.tsx`
  returns **0** and `grep -c "@/components/ui/" ` on that file returns **0**. Quote both.
- **AC3 [R3]** — Given the extended pattern's canonical story, then the action renders as an `<a>` carrying the
  expected `href` (assert `tagName` and `getAttribute('href')`, not the label). Given `FavoritesShell`'s three
  states, then each action's rendered element is an `<a href>` pointing at the destination §3.1 records.
- **AC4 [R4]** — Given the detail route with the recently-viewed Suspense boundary pending, then the placeholder's
  container is the track in `rail` mode; and given the resolved state, then the first card's
  `getBoundingClientRect().width` differs from the placeholder's first item by **≤2px** at 320 / 768 / 1440. State
  all six numbers.
- **AC5 [R5]** — Given `grep -rn "3-col-xl" src/ scripts/ docs/`, then **zero** hits in `src/` and `scripts/`
  (a historical mention in `docs/sessions/` is fine); and `npm run typecheck` exits 0.
- **AC6 [R6]** — `check:story-coverage` reports **34 covered / 0 unproven**, and the new story's source contains a
  static `import { FavoritesShell }` from the production path.
- **AC7 [R7]** — Given `FavoritesComposition`, then it passes `layoutContext="card-track-grid"` and its doc comment
  describes the composition the production file now has.
- **AC8 [R8]** — Given a favorited card and a click on its favorite control, then the card leaves the grid without a
  reload and the type-filter counts update; given the last card of a filtered view, then the filtered-empty state
  renders. Given the pager, then page 2 loads. State each as observed, not inferred.
- **AC9 [R9]** — `check:design-tokens --strict --scope=mantine` **0 violations, 0 stale markers, 0 missing-reason
  errors**; `git diff package.json` and `git diff messages/` both empty; no `design-tokens-allow` marker added; and
  `grep -nE '[0-9]+(px|rem|em)|#[0-9a-fA-F]{3,8}|rgba?\(' ` over every changed `.tsx` returns only matches inside a
  `calc()`/`min()` anchored to a `var(--…)`. Quote the grep.
- **AC10 [R10]** — Given `git status --porcelain`, then `MantineListingCardTrack.tsx` and
  `MantineListingCardTrack.module.css` are absent, and `LISTING_LAYOUT_SIZES`'s `'card-track-grid'` and
  `'card-track-rail'` rows are unchanged in `git diff`.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** A migrated Mantine surface with four visible states, a pattern extension
consumed in production for the first time, and a responsive contract shared with the rest of the site. Not Q4: no
file in `docs/critical-flow-registry.md` is edited — its one favorites-related row (`:63`) governs
`ListingCard.tsx` and `MantineListingCardPattern`, both out of scope, and `ListingCard.smoke.test.tsx` must stay
green either way.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 · lint 0 errors with no touched file named · `check:stories` pass ·
`check:story-coverage` **34 covered / 0 unproven** · design-tokens 0/0/0 · `npm run test` at the Task **790**
baseline — **five** deterministic failures (`css-var-resolvability`, `theme.d69-18`, `appimage-config-class-assertions`,
`ListingCard.smoke` ×2); Task 810 measured a second, **non-deterministic** group (`filtersPanelShell.smoke`,
`filtersRangeDatePicker.smoke`, `heroSearch.smoke`, 5/9/9/10 failures over four runs with no source change), so if
those appear, name them and re-run those two files in isolation rather than reporting a changed baseline ·
`build-storybook` and `build` exit 0 · both hygiene gates 0. Read every exit code from **inside** its transcript.

**Rendered measurement (AC1, AC4, AC8).** Write `scripts/task809-favorites-parity-probe.mjs` following
`scripts/task810-rail-controls-probe.mjs`'s conventions (playwright chromium, `BASE_URL`, `probeHash`/`gitCommit`
via `execFileSync` with no shell, one immutable run directory per invocation via `flag: 'wx'`, exit 1 on hard fail,
2 on usage error, every assertion a hard fail with a diagnosable message). **Read that script first** — and note
its two known weaknesses so you do not copy them: its hit-test skips when `inViewport` is false, and its rung
thresholds are px against the CSS's `em`.

Against `npm run start`, locale `uk`, widths **320, 390, 480, 640, 768, 1024, 1440**, signed in as a user with
favorites, record per width: the favorites grid's container width, first-card width, column count, and the same
three for `/uk/listings`; and on the detail route the recently-viewed placeholder's first-item width against the
resolved first card. Hard-fail on: a non-OK response · a missing track on either page · a favorites card width
differing from `/listings` by more than 1px · a placeholder/content width delta above 2px · any `className` survivor
detected in the rendered favorites DOM.

**Two-armed proof (Q3 gate claim).** Plant a change the probe must catch — restore the `2xl:grid-cols-4` ladder on
the favorites container so its card width diverges from `/listings` — rebuild, re-probe into a planted `runId`, show
exit **1** naming the diverging cell. Revert, prove it with `git hash-object`, re-probe into a fresh `runId`, quote
both hashes. **Both arms must be fired by the same final probe blob.**

**Transcript rule.** No `Tee-Object`. `[Console]::OutputEncoding` set before the first capture, capture with
`& cmd.exe /c "<command> 2>&1"`, write with `[System.IO.File]::WriteAllLines(path, lines, (New-Object
System.Text.UTF8Encoding($false)))`, append `EXIT_CODE=$LASTEXITCODE` **inside** each file, retain everything under
`docs/sessions/evidence/task809/`. **All evidence in native Windows PowerShell.**

**`OWNER VISUAL QA REQUIRED`:**

| Surface | State | Locale | Viewport |
|---|---|---|---|
| `/favorites` | populated grid — card width matches `/listings` side by side | uk, sq | 390, 768, 1024, 1440 |
| `/favorites` | empty (no favorites) | uk | **320**, 1024 |
| `/favorites` | filtered-empty | uk | 320, 1024 |
| `/favorites` | error state | uk | 1024 |
| Detail route | recently-viewed placeholder → resolved, no re-layout | uk | 390, 1024 |
| Storybook | the new `FavoritesShell` story, all four states, and `EmptyLoadingErrorState`'s extended action | uk, sq | 390, 1440 |

Resize the browser rather than using the viewport toolbar — Task **799** records that the addon does not resize the
preview.

## 14. Completion report contract

Files changed · requirement IDs completed · the favorites-vs-`/listings` card width per viewport · the
placeholder-vs-content width per viewport · the `className` and `@/components/ui/` grep counts · the chosen
href-action shape and **why**, with the rendered `<a href>` evidence · whether
`MantineEmptyLoadingErrorState` needed a layout fix for its first production consumer, and the measurement that
showed it · the `'3-col-xl'` removal grep · `check:story-coverage` 34/0 · the probe's full JSON · the
planted/reverted pair with `git hash-object` and the shared probe blob · confirmation that the track,
`ListingCard.tsx`, `package.json` and `messages/*.json` are untouched · commands run with real exit codes and
transcript paths · assumptions · deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Does this re-open the width standard? | No. R10 freezes the track and AC10 greps for it. Favorites *adopts* the existing grid contract; the only new thing is a sixth consumer. |
| Is making Favorites a grid a D74-4 violation? | No — **D74-10** amends D74-4 explicitly, on the measured ground that Favorites is paginated. The decision is recorded in the sprint file, not invented here. |
| Is the empty-state pattern a `reuse`? | **No, it is an `extend`,** and the kickoff says why: its action is a callback and all three real actions are `<Link href>` navigations. A reviewer who sees a `reuse` here should reject it. |
| Can the executor invent an empty-state layout? | No. The canonical source exists; §10.2 orders pattern-then-story-then-consumer. Local markup is the finding the canonical-first gate exists to catch. |
| Is a new permanent story justified? | Yes — `FavoritesShell` is an in-scope **production** consumer with no canonical story and no manifest entry (grepped, §3.1). That is `create canonical` by the rule, not a gate probe. |
| Does the probe assert something the gates cannot? | Yes — cross-surface card-width parity and the Suspense placeholder delta. Neither `tsc`, `lint`, `check:design-tokens` nor `check:story-coverage` can see either, and the planted arm restores the exact ladder this task deletes. |
| Does it touch Task 808? | No. 808 owns `ListingDetailView.tsx`; this task edits only `RecentlyViewedSection.tsx`'s skeleton. If both are in flight, they do not overlap. |
| Are the `npm test` expectations honest? | Yes — five deterministic failures are the Task 790 baseline, and the non-deterministic group is named in advance so a 9-failure run is not misreported as a regression. |

---

# Task 809 — Revision 1

`NEEDS REVISION`, **owner rejection 2026-09-10**, on sight, from the Storybook screenshots. The verdict is not a
quality judgement of the executor's work: Revision 0 obeyed the kickoff it was given, and the kickoff was in breach
of `docs/agent-contract.md` clause **16c**. This revision is the correction of that breach.

## 21. The clause-16d census — transitive, run 2026-09-10, every node classified

`FACT` — walked from `FavoritesShell.tsx` through every component it renders, and everything those render, to depth
4. **Fifteen nodes.** `d` = depth, `cn` = `className` count, `man` = present in `scripts/mantine-migration-scope.json`
(34 entries today), "own Story" = a canonical Story that imports **this** component, not its parent.

| # | Component | d | via | lines | cn | shadcn | man | own Story | Tier |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `FavoritesShell` | 0 | — | 206 | 0 | — | YES | `FavoritesShell.stories.tsx` | ✅ done (Rev 0) |
| 2 | `MantineListingCardTrack` | 1 | FavoritesShell | 170 | 5 | — | YES | `ListingCardTrack.stories.tsx` | ✅ |
| 3 | `ListingCard` | 1 | FavoritesShell | 338 | 8 | `AppImage` | YES | `ListingCard.stories.tsx` | ✅ |
| 4 | `ListingsPagination` | 1 | FavoritesShell | 45 | 0 | — | YES | `ListingsPagination.stories.tsx` | ✅ |
| 5 | **`MantineEmptyLoadingErrorState`** | 1 | FavoritesShell | 156 | 0 | — | **no** | `EmptyLoadingErrorState.stories.tsx` | **1 — enrol** |
| 6 | **`CollectionsSection`** | 1 | FavoritesShell | 249 | **28** | `button`,`dialog`,`input` | **no** | **NONE** | **1 — migrate** |
| 7 | **`SaveToCollectionButton`** | 1 | FavoritesShell | 246 | **20** | `button`,`dialog`,`input` | **no** | **NONE** (composition only) | **1 — migrate** |
| 8 | **`FavoritesTypeFilter`** | 1 | FavoritesShell | 63 | **5** | `button` | **no** | **NONE** | **1 — migrate** |
| 9 | `ui/button` | 2 | FavoritesTypeFilter, CollectionsSection, SaveToCollectionButton | 66 | 1 | — | no | NONE | **2 — stop importing** |
| 10 | `ui/input` | 2 | CollectionsSection, SaveToCollectionButton | 30 | 1 | — | no | NONE | **2 — stop importing** |
| 11 | `ui/dialog` | 2 | CollectionsSection, SaveToCollectionButton | 176 | **11** | `button` | no | NONE | **2 — stop importing** |
| 12 | `AppImage` | 2 | ListingCard | 161 | 2 | — | no | **NONE** | 3 — **file it** |
| 13 | `ListingFeatureIcon` | 2 | ListingCard | 27 | 1 | — | no | **NONE** | 3 — **file it** |
| 14 | `FavoriteButton` | 2 | ListingCard | 184 | 0 | — | no | composition only | 3 — **file it** |
| 15 | `MantinePagination` | 2 | ListingsPagination | 302 | 0 | — | no | `Pagination.stories.tsx` | 3 — has its own Story |

`FACT` — **53 `className` and two shadcn `Dialog`s** sit on `/favorites` across rows 6-8, against the 21 `className`
Revision 0 removed from `FavoritesShell.tsx`. The migration removed less than it left.

`FACT` — **row 5 is the sharpest one, and Revision 0 is what exposed it.** `MantineEmptyLoadingErrorState` is the
pattern this task *extended*, it has a canonical Story, and it is **not in the manifest** — so
`check:story-coverage`'s 34/34 never checked it either. Two independent instances of the same blind spot inside one
task. Feeds **812**.

`FACT` — **the overlay census is complete, and its absences are verified, not assumed.** Exactly **two** overlays
exist on this surface, both shadcn: `CollectionsSection.tsx:174` (`<Dialog open={createOpen}>`, create-collection)
and `SaveToCollectionButton.tsx:172` (`<Dialog open={open}>`, save-to-collection). A grep for
`Popover|Menu|Drawer|Tooltip|Modal|Sheet|AlertDialog` across all four surface files returns **zero** hits. The only
other overlay-ish surface is `toast()` from `@/lib/toast` (R16). **Owner instruction, 2026-09-10: «обов'язково
включаючи всі компоненти, попапи, діалогові вікна на сторінці» — both dialogs become canonical Mantine, and the page
ends with zero `@/components/ui/dialog` imports (AC19).**

`FACT` — **tier 3 is filed, not waved past.** `AppImage`, `ListingFeatureIcon` and `FavoriteButton` (rows 12-14) are
rendered here, owned elsewhere, and have no Story of their own. Filed as **813** in the same response that produced
this census, per 16d tier 3. They are out of 809's scope and **in** its census — that distinction is the rule.

`FACT` — the owner's screenshots show the consequence: in `FavoritesShell/Populated` the "Collections" block renders
its own bespoke empty state and its own "New collection" button, directly above the canonical
`MantineEmptyLoadingErrorState` this task did migrate. Two empty-state designs on one page.

**Root cause is this kickoff's.** §5 and §8 declared rows 6-8 out of scope. `agent-contract` **16c** forbids
declaring a *Story* out of scope; this declared the *components* out of scope and arrived at the same forbidden
place. Closed by clause **16d**, whose three-tier boundary is what the `Tier` column above applies. The exclusion is
struck through in §5, not deleted — it is the defect.

## 22. Re-entry mode — `remediation`

Revision 0's diff stays. **Nothing verified in it is re-done:** the track grid (`cardWidthDiff: 0` at six of seven
widths), the 0px skeleton delta, the `actionHref`/`icon` extension, the `'3-col-xl'` retirement, the
`FavoritesShell` story and its manifest entry, and every green gate. Preserve `docs/sessions/evidence/task809/runs/`
and its transcripts; Revision 1 writes to new `rev1-*` run ids and transcript names.

## 23. Requirements — Revision 1

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R11** | `CollectionsSection.tsx` renders entirely through canonical Mantine: **0** `className`, **0** `@/components/ui/*` imports. Its dialog becomes the canonical Mantine dialog source; its empty state becomes `MantineEmptyLoadingErrorState`; its "New collection" control becomes the canonical button. | **P0** | AC11 |
| **R12** | `SaveToCollectionButton.tsx` — same contract: 0 `className`, 0 shadcn imports, canonical dialog, canonical inputs. | **P0** | AC12 |
| **R13** | `FavoritesTypeFilter.tsx` — same contract. Its chips/toggles use the canonical Mantine control; if the repo has no canonical chip-row, that is `create canonical`, not a local one. | **P0** | AC13 |
| **R14** | **Each of the three gains its own canonical Mantine Story and its own manifest entry.** A state per branch: `CollectionsSection` empty / populated / dialog-open; `SaveToCollectionButton` closed / dialog-open / saving; `FavoritesTypeFilter` each selected state. `check:story-coverage` goes **34 → 38 covered / 0 unproven** — the three migrated components **plus** `MantineEmptyLoadingErrorState`, which row 5 shows has a Story but no manifest row. | **P0** | AC14 |
| **R15** | The two shadcn `Dialog`s are replaced by the canonical Mantine dialog source. **Inspect `MantineDialogDrawerPattern` and `MantineModal` first** (`src/design-system/mantine/patterns/`) — if one fits, `reuse`; if one is close, `extend`; only a proven absence permits `create canonical`. Record the search. | **P0** | AC15 |
| **R16** | `toast` from `@/lib/toast` — trace what it renders. If it is not the canonical Mantine notification source, that is a **finding to report**, not a silent swap: it is used well beyond `/favorites`. | P2 | AC16 |
| **R18** | **Tier 2 boundary.** `src/modules/listings/` stops importing `@/components/ui/button`, `/input`, `/dialog` entirely. The three primitive **files** are NOT migrated here — they are consumed repo-wide; name the separate task instead. | **P0** | AC19 |
| **R17** | Everything Revision 0 verified still holds, re-measured once: card-width parity, the 0px skeleton delta, `actionHref`, `'3-col-xl'` zero consumers. | P1 | AC17 |

## 24. Acceptance criteria — Revision 1

- **AC11-AC13** — for each of the three files: `grep -c 'className=' <file>` returns **0** and
  `grep -c '@/components/ui/' <file>` returns **0**. Quote all six numbers.
- **AC14** — `check:story-coverage` reports **38 covered / 0 unproven**, and each new Story statically imports its
  real production component. Quote the manifest diff.
- **AC15** — `grep -rn "@/components/ui/dialog" src/modules/listings/` returns **zero** hits, and the canonical
  dialog decision (`reuse` / `extend` / `create canonical`) is recorded with the paths searched.
- **AC16** — the `toast` trace is stated with its verdict; no silent replacement.
- **AC17** — the Revision 0 measurements reproduce.
- **AC19 [R18]** — `grep -rn "@/components/ui/\(button\|input\|dialog\)" src/modules/listings/` returns **zero** hits, and `src/components/ui/{button,input,dialog}.tsx` are absent from `git status --porcelain`.
- **AC18 [clause 16d]** — the §21 census is re-run against the **shipped** surface and every tier-1 node in
  §21 has a manifest entry and a Story of its own, every tier-2 import is gone, and every tier-3 node is listed with
  its status and its filed task number. A node passed over silently fails this criterion.
  **This is the criterion the reviewer runs first.**

## 25. Verification plan — Revision 1

Every gate from §13 re-runs, into `rev1-*` transcripts, plus:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
Select-String -Path src\modules\listings\components\CollectionsSection.tsx -Pattern 'className=|@/components/ui/' | Measure-Object
Select-String -Path src\modules\listings\components\SaveToCollectionButton.tsx -Pattern 'className=|@/components/ui/' | Measure-Object
Select-String -Path src\modules\listings\components\FavoritesTypeFilter.tsx -Pattern 'className=|@/components/ui/' | Measure-Object
Select-String -Path src\modules\listings -Pattern '@/components/ui/dialog' -Recurse
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npm.cmd run build
```

Expected: `win32`; the first three counts **0**; the dialog search returns **nothing**; coverage **38 / 0**;
design-tokens 0; build exit 0. Return every count and exit code.

**`OWNER VISUAL QA REQUIRED`** — the three new Stories at every state, uk and sq, 390 / 1440, **and** the live
`/favorites` page with a collection dialog open and the save-to-collection dialog open. The owner rejected Revision 0
from the Storybook screenshots; Revision 1 is not submitted until those Stories exist for him to reject or accept.

## 26. Revision 1 quality gate

| Question | Required answer |
|---|---|
| May any of the three be deferred to a later task? | **No.** Clause **16d**. If one genuinely cannot land, the task stops as `BLOCKED — CLAUSE 16d` and the owner decides — the executor does not narrow it, and the reviewer does not approve around it. |
| Is a green `check:story-coverage` evidence that this is done? | **No, and that is why 812 exists.** It cannot see an unenrolled component. AC18's census is the evidence. |
| Is `FavoritesShell.stories.tsx` proof for these three? | **No.** A composition Story is not a component Story. Each needs its own. |
| May a local dialog/chip be written because none exists? | Only after an evidenced search proves absence — then it is `create canonical`, registered in the shared library with its own Story, per 16b. |
| Is Revision 0 being re-done? | No. §22 preserves it; R17 re-measures it once. |

---

# Task 809 — Revision 2

**`SUPERSEDED` by Revision 3 (§41+), 2026-09-10 — third owner rejection.** R19-R21 (the `.imageActions`/badge
collision fix and its Story proof) are **carried forward unchanged** into Revision 3's requirement set as R24-R26;
they were correct and remain required. What Revision 2 got wrong: it treated the CTA buttons as already-correct and
did not question `MantineEmptyLoadingErrorState`'s own API, which the owner's third rejection (§41) shows hardcodes
variant/color per `state` regardless of the actual action's semantics. Do not re-implement anything below this
notice from Revision 2's own text without cross-checking it against Revision 3.

`NEEDS REVISION`, **second owner rejection, 2026-09-10, on sight of the live page — quoted verbatim, this response's
only authorization for touching a file Revision 1 correctly left out of scope**:

> «я не приймаю задачу. Міграція сторінки /favorites на Mantine, обов'язково включаючи всі компоненти, попапи,
> діалогові вікна на сторінці. Наразі не всі компоненти, елементи, кнопки мігровані. Вони просто криво виглядають
> як і до того, коли ти почала робити цю задачу.»

Translation for the record: *"I do not accept the task. Migration of the /favorites page to Mantine, necessarily
including all components, popups, dialog windows on the page. Currently not all components, elements, buttons are
migrated. They just look crooked, same as before you started this task."*

`OWNER DECISION — D74-13, 2026-09-10, quoted above.` **"на сторінці" = "on the page."** This is the owner's own
scoping, not an inference: the migration obligation is the `/favorites` page — the `FavoritesShell` render tree —
not `src/modules/listings/` as a directory. It closes Revision 1's own flagged gap 1 (session log §23, point 1) in
favor of the narrower reading. See R22.

## 27. Root cause — verified this session, not asserted

Revision 1's own handoff (session log §23, point 2) flagged that no live rendered evidence was captured for the
three migrated components. This is the direct consequence.

`FACT` — Storybook was built (`npm run build-storybook`, exit 0, already-retained artifact from Revision 1's own
evidence pass) and served locally (`python3 -m http.server` on `storybook-static/`); a Playwright script navigated
to `iframe.html?id=patterns-mantine-listingcardpattern--default&globals=locale:uk`, moved the mouse over the first
grid card (data: badge `Нова`, `withImageActions=true` — `ListingCardPattern.stories.tsx:157-169,198-202`), and
screenshotted it. **The save-to-collection folder icon renders directly on top of the "Нова" badge — both pinned to
the same top-left corner — and the badge text is illegible behind it.** Reproduced a second time on
`Mantine/Primitives/ListingCard → Favorites Composition` (the story that mirrors `/favorites`'s real composition,
`ListingCard.stories.tsx:161-184`) at 900px and again at 390px — same collision, width-independent.

`FACT` — `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`:

```
216  .badgesGrid {
217    position: absolute;
218    top: var(--homepage-runtime-space-2);
219    left: var(--homepage-runtime-space-2);
...
243  .imageActions {
244    position: absolute;
245    top: var(--homepage-runtime-space-2);
246    left: var(--homepage-runtime-space-2);
247    z-index: 1;
```

`.imageActions` and `.badgesGrid` are pinned to the **identical** `top`/`left` offset. `.imageActions`'s own header
comment (`:226-232`) says this is deliberate: *"Reproduces the retired `FavoritesShell.tsx` sibling-overlay div's
own declarations exactly: `absolute top-2 left-2` (same offsets as `.badgesGrid` above...)"*.

`FACT` — `git show 61afe64b0^:src/modules/listings/components/FavoritesShell.tsx` (the commit immediately before
Task 654 first migrated the trigger) shows the pre-Mantine markup: `<div className="absolute top-2 left-2 z-10
opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">` wrapping `<SaveToCollectionButton>`.
**The collision is not a Task 809 regression — it was already in the legacy Tailwind markup**, faithfully reproduced
by Task 764's CSS-module migration, and has been shippable ever since. It was never customer-visible before because
`imageActions` had **zero production consumers** until Task 809 wired `SaveToCollectionButton` into `/favorites`
(confirmed: `grep -rn "imageActions" src/ --include=*.tsx`, excluding stories/tests, returns exactly
`MantineListingCardPattern.tsx` the definition, `ListingCard.tsx` the pass-through, and `FavoritesShell.tsx` — the
only caller).

`FACT` — the **existing canonical Story** for this exact component, `Patterns/Mantine/ListingCardPattern → Default`
(`src/stories/patterns/mantine/ListingCardPattern.stories.tsx`), already renders a card with `badge=new` **and**
`withImageActions=true` together (its own comment, `:225`: *"new badge, photo counter, real SaveToCollectionButton
in imageActions"*) — and reproduces the identical collision on hover. **Nobody has ever hovered that story cell and
looked.** This is the same class of gap GR-2/GR-3 exist to name: a Story existing is not evidence its states were
inspected.

`INFERENCE` — this is what "криво" (crooked) refers to: the migrated components are not visually broken in
isolation (Revision 1's new Storybook stories for `CollectionsSection`/`SaveToCollectionButton`/`FavoritesTypeFilter`
were screenshotted this session too — `Populated`, `CreateDialogOpen`, `DialogOpen` — and render cleanly, correctly
styled, no defect found). The defect is specifically in the shared card chrome every favorited card renders through,
and it reads as "nothing changed" because the same illegible-badge collision was already there before Task 809 —
the owner is seeing the same broken corner he saw before, unaware it predates this task, which is consistent with
his exact wording ("as before, before you started").

## 28. Re-entry mode — `remediation`

Revision 0 and Revision 1's diffs both stand, verified, **not re-done**: `FavoritesShell`, `CollectionsSection`,
`SaveToCollectionButton`, `FavoritesTypeFilter`, the manifest (38 entries), and their four new/fixed Stories. This
revision's entire scope is the three items below. Preserve `docs/sessions/evidence/task809/` and its `runs/`; this
revision's evidence goes under new `rev2-*` names.

## 29. Requirements — Revision 2

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R19** | `MantineListingCardPattern.module.css`'s `.imageActions` slot renders with **zero bounding-rect intersection** against `.badgesGrid`, the `favorite` slot (`FavoriteButton`'s self-positioned `top:8px;right:8px`), and `.photoCountGrid`/`.photoCountList`, in both the default (`opacity:0`) and revealed (`hover`/`:focus-within`, `opacity:1`) states, at every card width. Attempt a **CSS-only** fix first (move `.imageActions`'s `top`/`left` off the occupied corner — grid variant's bottom-left is unoccupied today, confirmed: `.photoCountGrid` is bottom-**right**, `.photoCountList` is bottom-left but is the **list**-variant-only counterpart and `imageActions` has no live list-variant consumer today — verify this before relying on it). Do **not** change `FavoriteButton.tsx`'s own positioning contract — it is correct, used sitewide, and out of scope. | **P0** | AC20 |
| **R20** | `ListingCardPattern.stories.tsx`'s existing `Default` story — the one that already combines a badge with `withImageActions=true` (`:157-169,198-202`) — gets a `play` function (or equivalent Storybook interaction) that hovers/focuses that card and asserts the badge and imageActions elements' rendered `getBoundingClientRect()`s do not intersect. This is the proof that the fix holds in the canonical source, not just in a screenshot taken once by hand. | **P0** | AC21 |
| **R21** | `ListingCardPattern.stories.tsx:200`'s `className="bg-card/80 hover:bg-card shadow-sm rounded-lg"` passed to the demo `SaveToCollectionButton` is deleted. It mirrors a prop `FavoritesShell.tsx` stopped passing in Revision 1 (§17 of this file, the `SaveToCollectionButton.tsx` comment correction) — the chrome is now owned entirely by `SaveToCollectionButton.module.css`'s `[data-shape='icon']` rule, unconditionally. The story currently misrepresents production. | P2 | AC22 |
| **R22** | **D74-13.** `AC19` is corrected: the zero-shadcn-import assertion binds exactly `FavoritesShell.tsx`, `CollectionsSection.tsx`, `SaveToCollectionButton.tsx`, `FavoritesTypeFilter.tsx` — already 0/0/0/0, re-quote, do not re-derive from scratch. The directory-wide `src/modules/listings/` grep is **not** a Task 809 acceptance criterion; state its current count for the record (**27**, per Revision 1's session log §23) and confirm **814** is filed (it is — `docs/backlog.md`, 2026-09-10) so the count is not silently dropped. | P1 | AC23 |
| **R23** | **The completion report may not claim `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` without rendered hover/focus-within screenshots** for the fixed composition at 320, 768, 1440 (uk), covering both `Patterns/Mantine/ListingCardPattern → Default` (the badge+imageActions card) and `Mantine/Primitives/ListingCard → Favorites Composition`. This is the exact gate whose absence produced both rejections. | **P0** | AC24 |

## 30. Assumptions and open questions

- **`OWNER DECISION`** — D74-13 (§ above) is settled; not the executor's to re-open.
- **`ASSUMPTION` (reversible, stated)** — bottom-left is the free corner for `.imageActions` in grid mode. The
  executor must verify this against the real rendered DOM (not assume it from reading the CSS) before committing to
  it, and must check the list variant too: if `imageActions` is ever passed with `layout="list"`, `.photoCountList`
  already occupies bottom-left there. If a collision-free single position cannot serve both variants, that is a
  finding to report — do not silently restrict the fix to grid-only without saying so.
- **Out of scope:** everything in Revision 0/1's own out-of-scope lists, plus `FavoriteButton.tsx`, plus the 27
  shadcn imports named in R22 (→ **814**).

## 31. Pre-read rule bundle

Unchanged from §6 of this file, plus: re-open
`src/design-system/mantine/patterns/MantineListingCardPattern.module.css` and `.tsx` in full (this revision's only
new source scope) and `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` in full.

## 32. Scope

`src/design-system/mantine/patterns/MantineListingCardPattern.module.css` (the `.imageActions` rule only — R19) ·
`src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (only if the CSS-only approach proves
insufficient — attempt CSS-only first, and say so either way) · `src/stories/patterns/mantine/
ListingCardPattern.stories.tsx` (R20, R21) · `docs/backlog.md` state and the session log.

## 33. Out of scope

Everything Revision 0/1 already shipped (verified, not re-done) · `FavoriteButton.tsx` and its positioning contract
· `MantineListingCardTrack.*` · `ListingCard.tsx`'s own composition logic (only its Story, `Favorites Composition`,
is touched, and only for R23's screenshot evidence, not a source edit) · the 27 shadcn imports named in R22 (→
**814**) · any new feature work.

## 34. Current and required behavior

**Before:** hovering or keyboard-focusing a favorited card on `/favorites` that also carries a status badge (new,
price-reduced, sold, archived) renders the save-to-collection folder icon directly on top of the badge — both
anchored at the identical `top:8px;left:8px` — illegible, "crooked." Present since Task 654; exposed for the first
time by Task 809 wiring a real `imageActions` consumer into production.

**After:** the badge and the save-to-collection action render in visually distinct positions at every width, proven
by an interaction test in the canonical Story and by rendered screenshots at 320/768/1440.

## 35. Positive and negative flows

**Positive:** hover/focus a `/favorites` card with an active badge — both the badge and the save-to-collection icon
are independently legible.

| Negative flow | Applicable | Why |
|---|---|---|
| Card with a badge, no `imageActions` (every other card surface today) | Yes | Must render unchanged — R19 touches only the `imageActions` rule, not `.badgesGrid` |
| Card with `imageActions`, no badge (a favorited card with no status badge) | Yes | Must still render `imageActions` in its new position, not conditionally |
| Multiple stacked badges (`.badgesGrid` wraps) + `imageActions` | Yes | The existing story's `sold`/`archived`/`reduced` cells combined with `withImageActions` — check at least one multi-badge case if the fixture supports it |
| List-variant card with `imageActions` | **Yes — verify, do not assume absent** | See §30's stated assumption; `.photoCountList` already occupies bottom-left there |
| 320px, longest locale | Yes | Confirm the collision-free position holds at the narrowest supported width |

## 36. Acceptance criteria

- **AC20 [R19]** — Given the `Patterns/Mantine/ListingCardPattern → Default` story's first grid card
  (badge=new, `withImageActions=true`) at 320/768/1440, uk, hovered or `:focus-within`, then the badge's and the
  imageActions button's rendered `getBoundingClientRect()`s do not intersect. State all six rects (two per width).
- **AC21 [R20]** — Given the story's `play` function, then it programmatically asserts the same
  non-intersection and the story passes under `npm run build-storybook` / the project's story test path.
- **AC22 [R21]** — `grep -n 'bg-card/80' src/stories/patterns/mantine/ListingCardPattern.stories.tsx` → **0** hits.
  Quote it.
- **AC23 [R22]** — `grep -c 'className='`/`'@/components/ui/'` on exactly the four FavoritesShell-tree files → all
  **0** (re-quote from Revision 1, do not re-derive). State the `src/modules/listings/`-wide count (**27**) as a
  non-blocking record, and confirm task **814** exists in `docs/backlog.md`.
- **AC24 [R23]** — Rendered hover/focus-within screenshots exist under
  `docs/sessions/evidence/task809/rev2-*` for both named stories at 320/768/1440, uk, showing no visual collision.
  Quote their paths in the completion report.

## 37. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`** — unchanged from Revision 0/1: overlay/popup positioning on a shared card
pattern consumed by every listing-card surface in the product.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
Select-String -Path src\stories\patterns\mantine\ListingCardPattern.stories.tsx -Pattern 'bg-card/80'
```

Expected: `win32` · typecheck 0 · lint 0 errors on touched files · `check:stories` pass · `check:story-coverage`
**38 covered / 0 unproven** (unchanged — this revision enrolls nothing new) · design-tokens 0/0/0 · `npm run test` at
the Task 790 baseline (5 deterministic failures, named in Revision 0's §13) · `build-storybook` and `build` exit 0 ·
both hygiene gates 0 · the `bg-card/80` search returns nothing.

**Rendered evidence (AC20, AC24) — the gate this revision exists to add.** Serve `storybook-static/` locally
(`python -m http.server <port>` or equivalent), use Playwright to navigate to
`iframe.html?id=patterns-mantine-listingcardpattern--default&viewMode=story&globals=locale:uk` and to
`iframe.html?id=mantine-primitives-listingcard--favorites-composition&viewMode=story&globals=locale:uk`, move the
mouse over the badge-carrying card's thumbnail to trigger `:hover`, and screenshot at 320/768/1440. Retain every
screenshot under `docs/sessions/evidence/task809/rev2-*`. Hard-fail (BLOCKED, not a soft note) if any two of
badge/imageActions/favorite/photoCount bounding rects intersect at any captured width.

**`OWNER VISUAL QA REQUIRED`:**

| Surface | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingCardPattern` | `Default`, first grid card, hovered | uk, sq | 320, 768, 1440 |
| `Mantine/Primitives/ListingCard` | `Favorites Composition`, hovered | uk, sq | 320, 768, 1440 |
| Live `/uk/favorites` | a favorited listing that carries a status badge, hovered | uk | 390, 1024 |

## 38. Completion report contract

Files changed · requirement IDs completed · the six bounding-rect pairs from AC20 · the story `play` function's
pass/fail result · the `bg-card/80` grep (0) · the FavoritesShell-tree grep re-quote (0/0/0/0) and the directory-wide
count (27, non-blocking, → 814) · every rendered screenshot's path · commands run with real exit codes and
transcript paths · assumptions (the bottom-left/list-variant question from §30, resolved one way or the other) ·
deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED` — **never** `IMPLEMENTED` without the AC24 screenshots attached; that omission is what produced this
revision.

## 39. Task quality gate

| Question | Required answer |
|---|---|
| Is this a Task 809 defect or a pre-existing one? | **Pre-existing** (§27, `git show 61afe64b0^`) — but it renders on `/favorites` today because Task 809 is what gave `imageActions` its first production consumer, and the owner's acceptance is of the whole page, not a diff attribution. |
| Does this reopen `MantineListingCardPattern.*`'s frozen-scope boundary from Revision 0/1? | **Yes, narrowly, by explicit owner authorization** (D74-13, quoted). Scope stays the one CSS rule (§32) unless proven insufficient. |
| Could this have been caught earlier? | Yes — the existing `ListingCardPattern → Default` story already combined the two elements; nobody hovered it. R20 makes that check machine-enforced going forward, not just a one-time screenshot. |
| Does R22 silently drop the 27 remaining shadcn imports? | No — filed as **814**, named in the backlog, owner-scoped out by his own words, not by executor narrowing. |
| Is a new permanent Story needed? | No — `ListingCardPattern → Default` already exists and already exercises the broken combination; R20 adds an interaction assertion to it, not a new Story. |

## 40. Git handoff — task design (owner-run, do not execute)

```powershell
git add "tasks/Sprints/Sprint_74_kickoff_prompt_Task_809_Favorites_And_The_Last_Two_Tailwind_Card_Surfaces.md" "docs/backlog.md"
git commit -m "docs(Task809): Revision 2 — imageActions/badge collision root-caused and scoped, D74-13 closes the R18/AC19 ambiguity, 814 filed"
```

---

# Task 809 — Revision 3

`NEEDS REVISION`, **third owner rejection, 2026-09-10, on `MantineEmptyLoadingErrorState.tsx`'s own API — quoted and
translated below.** Revision 2's own findings (§27) stand and are absorbed here as R24-R26. This section is a
superset, not a patch.

## 41. The owner's finding — verified against source, not accepted on assertion

`FACT` — `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx`'s `error` branch (`:84-107`)
unconditionally renders `variant="light" color="red"` for **any** error-state action, and its `empty` branch
(`:134-151`) unconditionally renders `color="brand"` (filled) for **any** empty-state action. Both branches also
unconditionally set `w={{ base: '100%', sm: 'auto' }}`.

`FACT` — `src/modules/listings/components/FavoritesShell.tsx` calls this pattern at **three** sites that are not
semantically equivalent, and two of them share `state="empty"`:

| Call site | Lines | `state` | Action label | What the action actually is |
|---|---|---|---|---|
| Error (fetch failed) | `:138-145` | `error` | "Try again" | A neutral retry — not destructive, not an alarm |
| True empty (zero favorites) | `:152-159` | `empty` | "Browse listings" | The page's one primary CTA |
| Filtered empty (type filter matches nothing) | `:172-179` | `empty` | "All" | A secondary filter-reset — the same `state="empty"` as the primary CTA above, but not the same action importance |

`FACT` — because the pattern hardcodes button chrome by `state` rather than accepting it from the caller, "Browse
listings" and "All" — two actions with different importance — render **identically** (both filled brand), and "Try
again" renders as a red/light action despite being a neutral retry, not a destructive one. `CONTRADICTION`, my own
prior response: I verified the *button's* radius/height/color individually against the theme and called it
canonical. That check was real but answered the wrong question — it never asked whether the *pattern* had the
authority to assign that variant/color to this action in the first place. It did not. The owner's rejection is
correct.

`FACT` — `grep -rln "MantineEmptyLoadingErrorState" src/ --include=*.tsx`, excluding stories/tests, returns exactly
two files: `CollectionsSection.tsx` (passes no action at all) and `FavoritesShell.tsx` (all three sites above). The
pattern's own doc comment (`:38`, *"All three variants are used across product surfaces (listings, admin,
cabinet)"*) is **stale/false** — there is no other production consumer today. This means the API can be changed with
**zero** risk to a consumer outside this task's own scope, and R27 corrects the comment.

## 42. Re-entry mode — `remediation`, widened

Revision 0 and Revision 1's diffs stand, verified, not re-done. Revision 2's root-cause finding on the
`.imageActions`/badge collision (§27) also stands and is carried forward as R24-R26 below, **unimplemented** — no
code for it has been written yet. This revision's scope is: the pattern's action-slot API (R28-R31), the three
`FavoritesShell` call sites (R32), the `.imageActions` collision (R24-R26, unchanged from Revision 2), and the
comprehensive regression sweep the owner specified in place of a three-screenshot proof (R33).

## 43. Requirements — Revision 3

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R24** | (= Revision 2's R19, unchanged) `MantineListingCardPattern.module.css`'s `.imageActions` slot renders with zero bounding-rect intersection against `.badgesGrid`, the `favorite` slot, and `.photoCountGrid`/`.photoCountList`, default and revealed states, every width. CSS-only attempt first. | **P0** | AC25 |
| **R25** | (= Revision 2's R20, unchanged) `ListingCardPattern.stories.tsx`'s existing badge+`withImageActions` card gets a `play` function asserting non-intersection. | **P0** | AC26 |
| **R26** | (= Revision 2's R21, unchanged) `ListingCardPattern.stories.tsx:200`'s stale `className="bg-card/80 hover:bg-card shadow-sm rounded-lg"` is deleted. | P2 | AC27 |
| **R28** | `MantineEmptyLoadingErrorState`'s `actionLabel`/`onAction`/`actionHref` props are **removed** and replaced with a single `action?: ReactNode` slot. The pattern places `{action}` inside its existing layout (the error branch's `Stack`, the empty branch's `Stack`) and applies **only layout** (alignment) to it — never a color, variant, or width. Confirmed safe: zero other production consumers (§41). | **P0** | AC28 |
| **R29** | The error branch's `Stack` takes `align="flex-start"` directly (replacing the per-button `style={{alignSelf:'flex-start'}}` hack at the old `:92,103`) so **any** consumer-supplied action — regardless of its own width — aligns correctly without duplicating that fix at every call site. The empty branch's existing `align="center"` is unchanged (already correct for a centered auto-width button). | P1 | AC28 |
| **R27** | The pattern's stale doc comment (`:38`, "used across listings, admin, cabinet") is corrected to state its actual current consumers. | P3 | AC28 |
| **R32** | `FavoritesShell.tsx`'s three call sites each construct their own canonical `Button`, passed via `action`, with the semantics the owner specified — not inherited from the pattern: | **P0** | AC29 |

| State | Label | Required chrome | Href |
|---|---|---|---|
| Error | "Try again" | `variant="outline" color="gray"` (neutral secondary — same convention as `SaveSearchButton.tsx`'s Cancel button and `MantineDialogDrawerPattern`'s Cancel, both already `variant="outline"`/`"default"` `color="gray"` in this codebase) | `/${locale}/favorites` |
| True empty | "Browse listings" | `color="brand"` (filled, default variant — primary CTA, unchanged from today) | `/${locale}/listings` |
| Filtered empty | "All" | `variant="outline" color="gray"` (neutral secondary — it resets a filter, it is not the page's primary CTA) | `/${locale}/favorites` |

All three: `component={Link} href={...}` (real anchor, unchanged requirement from Revision 0's R3) and an **explicit**
`w={{ base: '100%', sm: 'auto' }}` written at each call site — not inherited from the pattern, per the owner's
requirement #4 that each action states its own width policy even where the value happens to match.

## 44. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated)** — "neutral secondary outline" = `variant="outline" color="gray"`. This is the
  exact convention already used for `Cancel`/secondary actions in `SaveSearchButton.tsx` and
  `MantineDialogDrawerPattern.tsx` in this codebase (cited, not invented) — chosen over inventing a new visual
  treatment. If the owner wants a different concrete look, that is a one-line prop change, not a re-design.
- **`ASSUMPTION` (reversible, stated)** — all three actions share the identical width policy
  (`w={{base:'100%',sm:'auto'}}`), matching every other mobile-full-width CTA already in this codebase
  (`SaveSearchButton`, `CollectionsSection`'s own dialog buttons). The owner's requirement is that each state its own
  policy explicitly, not that the values differ — writing the same literal value three times, once per call site,
  satisfies "not inherited" without inventing three different mobile behaviors nobody asked for.
- **Out of scope, unchanged from Revision 0-2:** `MantineListingCardTrack.*`, `ListingCard.tsx`'s own composition,
  `FavoriteButton.tsx`'s positioning, the 27 shadcn imports outside the FavoritesShell tree (→ **814**).
- **In scope, newly, by this revision:** `MantineEmptyLoadingErrorState.tsx`'s prop surface (was frozen/reuse-only in
  Revision 0-2; the owner's rejection is the authorization to change it, and §41 proves zero blast radius).

## 45. Pre-read rule bundle

Unchanged from §6/§31, plus: re-open `MantineEmptyLoadingErrorState.tsx` in full (already done, §41) and
`SaveSearchButton.tsx`/`MantineDialogDrawerPattern.tsx` for the "neutral secondary outline" precedent (already done,
§43).

## 46. Scope

`src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` (R28, R29, R27 — full prop-surface rewrite) ·
`src/modules/listings/components/FavoritesShell.tsx` (R32 — three call sites only, no other change) ·
`src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` (update every existing story to the new `action`
slot API — it currently uses the removed `actionLabel`/`onAction`/`actionHref` props and will not compile otherwise)
· `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` (R24, unchanged scope from Revision 2) ·
`src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (only if CSS-only proves insufficient) ·
`src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (R25, R26) · the new regression-sweep script (R33) ·
`docs/backlog.md` and the session log.

## 47. Out of scope

Everything Revision 0-2 already correctly shipped and verified · `CollectionsSection.tsx`'s own dialog buttons and
`SaveToCollectionButton.tsx` (already reviewed live this session, §6 of the prior chat turn — rendering correctly,
not touched by the pattern-API change since neither passes an `action` today) · `FavoriteButton.tsx` · the 27
shadcn imports (→ **814**) · any new i18n key (none needed — same three existing labels, same three existing hrefs).

## 48. Current and required behavior

**Before:** `MantineEmptyLoadingErrorState` decides a caller's button color/variant from its own `state` prop. Two
semantically different actions ("Browse listings", primary; "All", secondary) share `state="empty"` and therefore
render identically; "Try again" is forced into a red/light treatment regardless of whether retrying is actually an
alarming action.

**After:** the pattern has no opinion on button semantics. It renders whatever `action` element the caller supplies,
in the correct layout position. `FavoritesShell` supplies three distinct, owner-specified buttons. The `.imageActions`
badge collision (R24-R26) is also fixed, unchanged from Revision 2.

## 49. Positive and negative flows

**Positive:** each of the three CTA states renders its own correct button chrome; clicking/tapping/keyboard-activating
each navigates correctly; the populated-state card's save-to-collection icon no longer collides with its badge on
hover/focus.

| Negative flow | Applicable | Why |
|---|---|---|
| `CollectionsSection`'s empty state (no `action` passed) | Yes | Must still render with no action slot — the pattern must not require `action` |
| Keyboard-only navigation to each of the three CTAs | Yes | Owner requirement #6 (focus-visible, keyboard activation) |
| Middle-click / open-in-new-tab on each of the three CTAs | Yes | Real `<a href>` requirement, unchanged since Revision 0 |
| Every named breakpoint boundary, −1px/exact/+1px | Yes | Owner's explicit regression-gate requirement |
| 2560px (post-`xxl` fluid range) | Yes | Owner's explicit requirement — must confirm no runaway width/overflow above the largest named breakpoint |
| All four Favorites states × the full sweep | Yes | Owner's explicit requirement — not just the CTA states, the populated grid too |

## 50. Acceptance criteria

- **AC25-AC27 [R24-R26]** — unchanged from Revision 2's AC20-AC22; re-quote here when satisfied.
- **AC28 [R27-R29]** — `grep -n 'actionLabel\|onAction\|actionHref' src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` → **0** hits. The pattern's doc comment no longer claims admin/cabinet consumers. `CollectionsSection`'s no-action call still renders (render it, confirm no crash, no rogue action element).
- **AC29 [R32]** — Given each of the three `FavoritesShell` states rendered (live or Storybook), then: Error's button computed `variant`/`color` matches `outline`/`gray` (not `light`/`red`); True-empty's matches `filled`/`brand`; Filtered-empty's matches `outline`/`gray`. Quote all three `getComputedStyle()` reads (background-color, border, color) — not a source-only claim, per the owner's explicit rejection of "imports Mantine" as evidence.
- **AC30 [R33]** — the regression sweep (§51) is retained under `docs/sessions/evidence/task809/` as a runnable script plus its actual output, and its output shows zero failures at every required width/state combination, or names every failure as a still-open finding — not silently passed over.

## 51. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`**, widened to match the owner's explicit regression-gate specification — this is
no longer satisfied by three story screenshots.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
Select-String -Path src\design-system\mantine\patterns\MantineEmptyLoadingErrorState.tsx -Pattern 'actionLabel|onAction|actionHref'
```

Expected: `win32` · typecheck 0 (the story file must be updated to the new `action` API or this fails — that failure
is the compiler proving R28 propagated) · lint 0 on touched files · `check:story-coverage` **38 covered / 0
unproven** (unchanged — no new manifest entries) · design-tokens 0/0/0 · `npm run test` at the Task 790 baseline ·
`build-storybook`/`build` exit 0 · both hygiene gates 0 · the `actionLabel|onAction|actionHref` search returns
nothing.

**The regression sweep — the owner's own specification, transcribed exactly, not softened.** Build
`scripts/task809-favorites-regression-sweep.mjs` (Playwright, following `scripts/task810-rail-controls-probe.mjs`'s
conventions: `execFileSync` with no shell for hashes, one immutable run directory per invocation, hard-fail exit
codes, every assertion carries a diagnosable message):

1. **Boundary matrix** — for each of `320, 480, 640, 768, 1024, 1280, 1440`, test at `width−1`, `width`, `width+1`
   (21 exact pixel widths).
2. **Dense sweep** — `320` to `1920` at a stated, justified step (state the chosen increment and why it's dense
   enough to catch a one-pixel-triggered layout break without an impractical run time — do not silently pick a step
   coarser than the boundary matrix's own ±1px resolution without saying so), plus **2560** as a discrete extra
   check for the post-`xxl` fluid range.
3. For **all four** Favorites states (error, true-empty, filtered-empty, populated) at every width in 1-2, assert:
   - the action button's/buttons' computed `variant`/`color`/`size`/`border-radius` match the table in §43;
   - `height >= 44px` on every interactive control on the page (CTA, New collection, Create/Rename/Delete, the
     save-to-collection icon, the SegmentedControl segments, pagination controls, the favorite heart);
   - each CTA's own width policy (`100%` at `<640`, intrinsic at `≥640`) holds — not merely "some width";
   - `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (no horizontal overflow);
   - every button's bounding rect is fully contained within its immediate surface/card;
   - **zero intersection** between the badge and the save-to-collection icon on the populated state (R24's own
     assertion, re-run here as part of the full sweep, not only in the isolated Story);
   - each CTA's resolved `href` matches the table in §43;
   - `:focus-visible` is reachable via `Tab` and the element activates via `Enter`/`Space`;
   - opening and closing every modal/drawer/confirm dialog (`New collection`, `Rename`, `Delete confirm`,
     `Save to collection`) via both pointer and keyboard.
4. Retain the full JSON result set and a human-readable failure summary under
   `docs/sessions/evidence/task809/rev3-sweep/`. A failing cell is a **finding**, not a note absorbed into a passing
   summary — R33/AC30 requires every failure named, not zero unexplained.

**`OWNER VISUAL QA REQUIRED`** — narrowed compared to Revision 0-2 because the sweep above is now the primary proof;
the owner's role is confirming the *design* choice, not catching layout defects the sweep already covers:

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Live `/uk/favorites` | error, true-empty, filtered-empty | uk | 390, 1024 |
| `Patterns/Mantine/EmptyLoadingErrorState` | new action-slot stories for all three semantics | uk, sq | 390, 1440 |
| Live `/uk/favorites` | populated, hovering a badge-carrying card | uk | 390, 1024 |

## 52. Completion report contract

Files changed · requirement IDs completed · the three `getComputedStyle()` reads from AC29, quoted in full · the
`.imageActions` bounding-rect pairs (AC25) · the regression sweep's chosen dense-sweep step and its justification ·
the sweep's full pass/fail output, every failure named · the `actionLabel|onAction|actionHref` grep (0) ·
`check:story-coverage` (38/0, unchanged) · commands run with real exit codes and transcript paths · assumptions ·
deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED` — never `IMPLEMENTED` without the sweep's actual output attached.

## 53. Task quality gate

| Question | Required answer |
|---|---|
| Does removing `actionLabel`/`onAction`/`actionHref` break another consumer? | **No** — verified §41: exactly two production consumers exist, one passes no action at all, the other is this task's own three call sites. |
| Is "neutral secondary outline" invented? | No — cited precedent: `SaveSearchButton.tsx`'s Cancel, `MantineDialogDrawerPattern`'s Cancel, both already `color="gray"` with an outline/default variant in this codebase. |
| Does this reopen a frozen file from Revision 0-2? | Yes, `MantineEmptyLoadingErrorState.tsx` — by the owner's explicit rejection of its API, which is the authorization; `MantineListingCardPattern.*` stays narrowly scoped as in Revision 2. |
| Is a three-screenshot proof sufficient this time? | **No — explicitly rejected by the owner.** The regression sweep (§51) is the proof; Storybook screenshots are supplementary, not primary. |
| Does this re-litigate R24-R26? | No — carried forward unchanged from Revision 2, still unimplemented, still required. |

## 54. Git handoff — task design (owner-run, do not execute)

```powershell
git add "tasks/Sprints/Sprint_74_kickoff_prompt_Task_809_Favorites_And_The_Last_Two_Tailwind_Card_Surfaces.md" "docs/backlog.md"
git commit -m "docs(Task809): Revision 3 — MantineEmptyLoadingErrorState stops hardcoding action semantics per state; FavoritesShell supplies three canonical action buttons; Revision 2 superseded, R19-R21 carried forward"
```

---

# Task 809 — Revision 4

`NEEDS REVISION`, **fourth owner rejection, 2026-09-10, on the rendered CTA buttons** ("вони не канонічні, вони
зламані"). Revision 3's semantic fix (R27-R29, R32) is correct and stands — the buttons now carry the right
variant/color/href. What Revision 3 never measured is where the *label sits inside the button*, and it sits at the
top. This section is a superset of Revision 3, not a patch: R33 is carried forward still-open and amended by R38.

## 55. Root cause — measured this session against `node_modules`, not asserted

`FACT` — `node_modules/@mantine/core/styles/Button.css` (v8.3.18). The Button **root** `.m_77c9d27d` is
`display: inline-block` with `height: var(--button-height, var(--button-height-sm))`. It carries **no** vertical
centring of its own. All of it lives in the **inner** `.m_80f1301b`:

```css
.m_80f1301b { display: flex; align-items: center; justify-content: var(--button-justify, center); height: 100%; }
```

`FACT` — `src/design-system/mantine/theme.ts:562-566`, `components.Button.styles.root`, sets both:

```ts
minHeight: '2.75rem',
height: 'auto',      // Task 502 — lets the root grow when a long label wraps
```

`INFERENCE`, from those two facts — `height: 'auto'` is an **inline** style on the root, so the inner's `height: 100%`
resolves against an indefinite height, computes to `auto`, and the inner collapses to the text's line box. In an
`inline-block` root the collapsed inner sits at the **top**; `minHeight: 2.75rem` then pads the remaining ~26px in
underneath it. The label is top-pinned, which is exactly what the owner's three screenshots show at 320px for
"Browse listings", "All" and "Try again".

`FACT` — why this survived three rejections and every gate. A `<button>` element gets vertical centring of its
anonymous content box from the UA, which masks the defect entirely; **`CollectionsSection`'s "New collection" button
in the owner's own second screenshot is correctly centred**, in the same viewport, in the same session. `Button
component={Link}` renders an `<a>`, which gets no such centring. `FACT`, measured —
`grep -rn 'Button[^>]*component={Link}\|Button[^>]*component="a"' src --include=*.tsx` returns **7 hits in exactly 3
files**: `FavoritesShell.tsx`, `EmptyLoadingErrorState.stories.tsx`, and the pattern's own doc comment. All three are
this task's own artifacts. The theme line dates to Task 502 (`a2601b741`), but Task 809 is what first rendered a
Mantine `Button` as an anchor in this repo, so **this is 809's defect surface, not a pre-existing out-of-scope one**,
and `orchestrator-ui-review.md`'s preserved-artifact rule applies: a `preserve` classification requires positive
evidence it cannot cause the defect, and here it demonstrably does.

`FACT` — **no gate in this repo can see it, and Revision 3's own evidence structurally could not.** Revision 3
measured `background-color`, `border`, `color`, `height: 44px`, `border-radius: 8px` and a real `<a href>` via
`getComputedStyle` — every one correct, none of them the defect, because none of them is the geometry of the label
*inside* the root. `check:story-coverage` (38/0), `check:stories`, `build-storybook`, `typecheck`, `lint` and
`check:design-tokens` inspect enrollment, static imports, parse validity and token classes; **none inspects intra-
component text position.** The visual criterion for this task is therefore closed only by the owner's matrix, and it
has now returned `rejected` four times.

`FACT` — the pattern's own canonical Story,
`src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx:35, 54, 72`, renders the same three anchor buttons
and therefore renders the same defect. GR-3 is satisfied on paper (the Story exists and statically imports the real
pattern) while the canonical visual source of truth certifies a broken control. That is why R35 puts the assertion
**in that Story**, not only in the consumer.

`FACT` — second, unrelated defect found in the same screenshots.
`src/stories/mantine/primitives/FavoritesShell.stories.tsx:111-124` (`TypeFilterNoMatches`) passes
`typeCounts={{ apartment: 3 }}`; `src/modules/listings/components/FavoritesTypeFilter.tsx:28` returns `null` when
`availableTypes.length <= 1`. So the Story named for the filtered-empty branch renders **no type filter at all**,
while the empty state it does render tells the user to "try selecting a different property type". Confirmed in the
owner's second screenshot: nothing between the collections block and the heart icon.

## 56. Re-entry mode — `remediation`

Revisions 0-3 all stand and are **not re-done**: the track grid, the 0px skeleton delta, `'3-col-xl'`'s retirement,
the tier-1 migrations and their Stories (coverage 38/0), the `.imageActions` → bottom-left move and its two-armed
`play` proof, the `action?: ReactNode` slot and the three FavoritesShell call sites. Revision 4 adds the theme fix,
its proof, and the two Story-fixture corrections. Preserve every `rev3-*` artifact; Revision 4 writes to `rev4-*`
run ids and transcript names.

## 57. Requirements — Revision 4

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R34** | A Mantine `Button`'s label is vertically centred in the root's used height for **every** element type the project renders it as (`<button>` and `<a>` alike), while Task 502's wrap growth (`height:'auto'` + `minHeight`) is preserved. Fixed once, at `theme.ts` `components.Button.styles` — never per call site, never in a feature-local CSS module. | **P0** | AC31 |
| **R35** | `EmptyLoadingErrorState.stories.tsx` asserts that centring itself, in a `play` function, for all three of its action semantics, using the mechanism already proven at `ListingCardPattern.stories.tsx:264-320`; and the fix is proven two-armed. | **P0** | AC32 |
| **R36** | The theme change does not regress the two Button behaviours it structurally touches: `fullWidth`/`[data-block]` (block-level, container-width) and `justify` (`--button-justify`, read by the inner). Both are measured at their real production consumers, not asserted. | **P1** | AC33, AC34 |
| **R37** | `FavoritesShell.stories.tsx`'s `TypeFilterNoMatches` renders the `SegmentedControl` the state is named for, so the Story proves the filtered-empty branch rather than a second copy of the empty state. | P2 | AC35 |
| **R33** | (carried forward from Revision 3, still **unimplemented**) `scripts/task809-favorites-regression-sweep.mjs` and its retained output, per §51. | P1 | AC36 |
| **R38** | R33's sweep gains two assertion classes it did not have: the label-centring assertion from R34 for every interactive control it already visits, and the `fullWidth`/`justify` assertions from R36. A control whose label is not centred is a **failing cell**, not a note. | P1 | AC36 |

## 58. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated, orchestrator-taken) — the fix is a flex root gated on `fullWidth`, not an
  inherited `min-height` on the inner.** In `theme.ts` `components.Button.styles`, root gains
  `display: props.fullWidth ? 'flex' : 'inline-flex'`, `alignItems: 'center'`, `justifyContent: 'center'`, keeping
  `minHeight` and `height: 'auto'` exactly as they are; `inner` gains `width: '100%'` and `height: 'auto'`.
  **Why gated:** `.m_77c9d27d:where([data-block]) { display: block; width: 100% }` is what `fullWidth` relies on; an
  ungated inline `inline-flex` would override its `display` and make a full-width button inline-level. Only `display`
  is overridden — that rule's `width: 100%` still applies, so `fullWidth` keeps its width from Mantine's own CSS.
  **Why `inner: { width: '100%' }` is not optional:** with a flex root the inner becomes a flex item and would shrink
  to its content, which would silently neutralise `justify-content: var(--button-justify)` and make every
  `justify="flex-start"` button look centred. **Rejected alternative:** `styles.inner = { minHeight: 'inherit' }` —
  one line and it does centre, but it inherits a border-box `min-height` onto the inner, so `outline`/`default`
  variants grow by their 2px border. If the owner prefers that trade, it is a one-line prop change and R36's
  measurements are the instrument that decides it.
- **`FACT`, not an assumption — no CSS module or stylesheet in `src/` sets `display` on `.mantine-Button-root`**
  (`grep -rn 'mantine-Button-root' src --include=*.css` returns one comment line in
  `FavoriteButton.module.css:13` and no declaration), so the new inline `display` overrides nothing that exists today.
- **`UNKNOWN`, and R36 is what resolves it** — whether any of the 429 `<Button` call sites depends on the root being
  `inline-block` for inline-flow layout (baseline alignment inside a text run). `vertical-align: middle` is set by
  Mantine on the root and is unaffected by the change; no call site was found relying on baseline behaviour, but the
  census was not exhaustive.
- **Out of scope, unchanged:** `MantineListingCardTrack.*`, `FavoriteButton.tsx`, the 27 shadcn imports outside the
  FavoritesShell tree (→ **814**), `ListingsPageFrame`'s 1440 width (→ **811**), the coverage detector (→ **812**),
  the tier-3 components (→ **813**).

## 59. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` clauses **11, 13, 16, 16b, 16c, 16d** · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6l (Buttons secondary) ·
`docs/design-system.md` §18 (inline style vs state selector) · this kickoff §41-§54 (Revision 3) and §55-§64 · plus,
opened in full before writing code: `node_modules/@mantine/core/styles/Button.css`,
`src/design-system/mantine/theme.ts:495-580`, `src/stories/patterns/mantine/ListingCardPattern.stories.tsx:260-325`
(the `play`/`sb-show-errordisplay` mechanism to copy).

## 60. Scope

`src/design-system/mantine/theme.ts` — `components.Button.styles` only (R34) ·
`src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` — add the `play` assertion (R35) ·
`src/stories/mantine/primitives/FavoritesShell.stories.tsx` — the `TypeFilterNoMatches` fixture (R37) ·
`scripts/task809-favorites-regression-sweep.mjs` — new (R33, R38) · `docs/backlog.md` and the session log.

**Not** `FavoritesShell.tsx` and **not** `MantineEmptyLoadingErrorState.tsx`: Revision 3 left both correct, and R34 is
a theme-level fix by definition. If either file needs a change to satisfy R34, that is evidence the fix was applied at
the wrong layer — stop and report it rather than patching the call site.

## 61. Out of scope

Everything Revisions 0-3 shipped and verified · any per-call-site or per-component centring workaround · any change
to `--button-height`, `size`, `radius`, `padding-x`, or the variant colour resolvers · `MantineCountButton`'s own
wrapper · re-litigating the outline/gray vs filled/brand semantics settled in Revision 3.

## 62. Acceptance criteria

- **AC31 [R34]** — Given `Mantine/Primitives/FavoritesShell → Empty`, `→ Type Filter No Matches`, `→ Error` and
  `Patterns/Mantine/EmptyLoadingErrorState → Default` rendered at 320, 390, 768 and 1440 in sq, en, uk and it, when
  the `getBoundingClientRect()` of each action's `.mantine-Button-label` and of its `.mantine-Button-root` ancestor is
  read, then `|labelCentreY − rootCentreY| ≤ 1px` in every cell. Quote the measured centre pair for at least one cell
  per story per viewport.
- **AC32 [R35]** — Given `EmptyLoadingErrorState.stories.tsx`'s `play` function, then it asserts AC31's inequality for
  all three actions and the story renders clean under `npm run build-storybook` and `check:stories`. Two-armed proof:
  with the pre-fix `theme.ts` root restored, the story sets `sb-show-errordisplay` and the render check reports it;
  with the fix restored the check is clean and `git hash-object` on the story file equals its pre-plant value. Quote
  both arms and both hashes.
- **AC33 [R36]** — Given the five measured `justify="flex-start"` consumers — `MobileNavDrawer.tsx:111` and `:128`,
  `FiltersPanel.tsx:139` and `:148`, `ListingsFilters.tsx:186`, plus `NotificationCenter.tsx:68` — rendered at 320 and
  1440, then each label's rendered left edge is within 1px of its button's content-box left edge, i.e. still
  left-aligned rather than centred. Quote one measured pair per consumer.
- **AC34 [R36]** — Given the `fullWidth` consumers `MobileNavDrawer.tsx:100`, `FiltersPanel.tsx:115`,
  `MantineAuthFormPattern.tsx:107` and `AdminUsersTable.tsx:483` rendered at 320, then each button's rendered width is
  within 1px of its parent's content-box width. Quote the four measured pairs.
- **AC35 [R37]** — Given `Mantine/Primitives/FavoritesShell → Type Filter No Matches` at 320 and 768, then a
  `SegmentedControl` with two or more segments renders above the empty state, and the empty state's reset action still
  renders below it. State the segment count and the fixture that produces it.
- **AC36 [R33, R38]** — Given `scripts/task809-favorites-regression-sweep.mjs` run per §51, then its retained output
  under `docs/sessions/evidence/task809/rev4-sweep/` includes the §51 assertion set **plus** AC31's centring
  inequality and AC33/AC34's alignment and width checks, and every failing cell is named individually in the
  completion report rather than absorbed into a summary count.

**GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: none.** Every geometric criterion carries
an explicit ±1px tolerance; AC32's hash equality is a restoration witness for a file the executor itself planted and
reverted, not an absolute about a correct implementation.

## 63. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** A theme-level change to the shared Button primitive reaches all 429 `<Button`
call sites in `src/`; that is the definition of a migrated-primitive change under `docs/qa-profiles.md`.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/design-system src/components/shared src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 · lint 0 errors on touched files · `check:stories` pass · `check:story-coverage`
**38 covered / 0 unproven** (unchanged — this revision enrolls nothing new) · design-tokens 0/0/0 ·
`filterLeafComponents.smoke.test.tsx`'s `justify="flex-start" is forwarded to every rendered Button` still passes
(it asserts the var on the root, which R34 does not touch — if it fails, R34 was applied wrongly) · `npm run test` at
the Task 790 baseline (5 deterministic failures, named in Revision 0 §13; report any new failure individually) ·
`build-storybook` and `build` exit 0 · both hygiene gates 0.

**Rendered evidence (AC31-AC35).** Serve `storybook-static/` locally and drive it with Playwright, following
`scripts/task810-rail-controls-probe.mjs`'s conventions. Read the label/root rects with
`getBoundingClientRect()` — **not** `getComputedStyle` alone: computed height, colour and radius were all correct in
Revision 3 and are what let this defect through twice. Retain every measurement and screenshot under
`docs/sessions/evidence/task809/rev4-*`.

**`OWNER VISUAL QA REQUIRED`:**

| Surface | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/EmptyLoadingErrorState` | `Default` — all three action semantics | uk, sq | 320, 1440 |
| `Mantine/Primitives/FavoritesShell` | `Empty`, `Type Filter No Matches`, `Error` | uk, sq | 320, 768 |
| `Mantine/Primitives/MobileNavDrawer` or live `/uk` mobile nav | the `justify="flex-start"` full-width buttons | uk | 320 |
| Live `/uk/favorites` | populated, hovering a badge-carrying card | uk | 390, 1024 |

Task **799** (the Storybook viewport switcher does not resize the preview) is still open — set the width with the
browser window or a URL viewport parameter, not the toolbar.

## 64. Completion report contract

Files changed · requirement IDs completed · AC31's measured label/root centre pairs · AC32's two arms and both
`git hash-object` values · AC33's six alignment pairs and AC34's four width pairs · AC35's segment count and fixture ·
the sweep's chosen dense-sweep step with its justification and its full pass/fail output, every failure named ·
commands run with real exit codes and transcript paths · assumptions (including whether the flex-root fix or the
rejected `min-height: inherit` alternative was used, and why) · deviations · limitations. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` — never `IMPLEMENTED` without
AC31's measured rects attached. A source-only claim that the theme was edited is not evidence that a label moved.

## 65. Task quality gate

| Question | Required answer |
|---|---|
| Is this 809's defect or a pre-existing theme bug? | **809's defect surface.** The `height:'auto'` line is from Task 502, but 809 is what introduced the only anchor-rendered Buttons in `src/` (7 hits, 3 files, all 809's), which is what exposes it. `orchestrator-ui-review.md`: a preserved artifact that remains a plausible cause is in scope. |
| Why not fix it in `FavoritesShell.tsx`? | Because it is not a Favorites defect. It reaches every Button rendered as an anchor, now and later. A call-site fix would leave the next anchor Button broken and would violate 16b (no feature-local recreation of a child's visual contract). |
| Does this need a new Story? | **No.** `Patterns/Mantine/EmptyLoadingErrorState` already exists and already renders all three broken actions; R35 adds an interaction assertion to it. R37 corrects an existing fixture. Nothing permanent is added to manufacture evidence. |
| Is the owner being asked to choose the fix? | No — §58 takes the decision as a reversible, stated assumption and names the rejected alternative with its measurable cost. One active route, per `create-task`'s execution-contract rule. |
| What stops a fifth rejection of the same class? | AC31/AC32: the assertion lives in the canonical Story and fails the render gate, so the next agent that breaks label geometry gets a red gate instead of an owner screenshot. |

## 66. Git handoff — task design (owner-run, do not execute)

```powershell
git add "tasks/Sprints/Sprint_74_kickoff_prompt_Task_809_Favorites_And_The_Last_Two_Tailwind_Card_Surfaces.md" "tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md" "docs/backlog.md"
git commit -m "docs(Task809): Revision 4 - Button label top-pinned by theme height:auto vs Mantine inner height:100%; theme-level fix, canonical Story assertion, TypeFilterNoMatches fixture"
```
