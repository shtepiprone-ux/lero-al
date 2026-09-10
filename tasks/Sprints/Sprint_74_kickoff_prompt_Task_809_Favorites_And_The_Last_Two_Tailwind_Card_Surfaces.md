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
- **Out of scope:** `ListingCard.tsx`'s composition · `MantineListingCardPattern` · the track · `CollectionsSection`,
  `FavoritesTypeFilter`, `ListingsPagination`, `SaveToCollectionButton`'s own internals · `useFavoritesRealtime` ·
  the `/favorites` route file · Tasks 808's files.

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
