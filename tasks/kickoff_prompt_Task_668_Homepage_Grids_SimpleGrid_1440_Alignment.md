# Kickoff — Task 668: Homepage Featured/Latest grids → Mantine `SimpleGrid`, aligned on `xxl = 1440px`

> Saved implementation kickoff. A fresh Sonnet session must be able to execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** UI (current Mantine path) — responsive layout migration with an **owner-approved visual change**.
- **Owner directive driving this task (2026-07-26):** the owner reviewed the Mantine-vs-Tailwind breakpoint mismatch
  and ruled: *"мені вже не потрібен 1536 breakpoint, бо у Mantine набагато краща поведінка адаптації"* → **deliberate
  alignment on Mantine `xxl = 1440px`.** Binding decisions, not open questions:
  1. Featured grid steps to **4 columns at 1440px** (was 1536px).
  2. Latest grid steps to **3 columns at 1440px** (was 1536px).
  3. This is an **approved adaptive change, NOT a byte-identical migration**.
  4. A grid difference in the **1440–1535px** band is **expected and is not a regression**.
- **Why this is not merely cosmetic:** it removes a live inconsistency. Mantine-driven headings on the same page
  already step at `xxl` (1440px) while these Tailwind grids waited until `2xl` (1536px) — see §3.4.

## 2. Objective

Replace the raw `<div className="grid grid-cols-… gap-…">` grid containers and the raw `<div>` header row in
`FeaturedListingsView` and `LatestListingsView` with Mantine `SimpleGrid` / `Group`, and move the large-desktop
column step from Tailwind `2xl` (1536px) onto Mantine `xxl` (1440px). All other breakpoints, gaps, card contents,
DOM order, and both non-populated states keep their current rendered behavior.

## 3. Verified context

All facts below were inspected in the repo on 2026-07-26. Do not re-derive; re-verify only where a step says so.

### 3.1 Files in scope (exact current markup)

**`src/modules/listings/components/FeaturedListingsView.tsx`**

| Line | Current markup (verbatim) | Branch |
|---|---|---|
| 47 | `<div className="flex items-center justify-between mb-6">` | `header` (shared by all three branches) |
| 57 | `<div className="featured-listings grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">` | **loading** (3 × `CardSkeleton`) |
| 78 | `<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">` | **populated** |

**`src/modules/listings/components/LatestListingsView.tsx`**

| Line | Current markup (verbatim) | Branch |
|---|---|---|
| 47 | `<div className="latest-listings grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">` | **loading** (4 × `RowSkeleton`) |
| 60 | `<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">` | **populated** |

Both files also contain skeleton sub-components (`CardSkeleton` / `RowSkeleton`) whose Mantine `Box` wrappers still
carry Tailwind chrome (`rounded-xl border bg-card overflow-hidden`, `p-3 space-y-2`, `flex flex-col`). **Those are OUT
of scope here** (§8) — this task changes grid containers only, so the visual delta stays attributable.

### 3.2 Breakpoint provenance (the whole reason for this task)

| Scale | Token | px | Source |
|---|---|---|---|
| Tailwind | `sm` / `md` / `xl` / `2xl` | 640 / 768 / 1280 / **1536** | Tailwind default scale |
| Mantine theme | `sm` / `md` / `xl` / `xxl` | 640 / 768 / 1280 / **1440** | `src/design-system/mantine/theme.ts` L142–150 (`xxl: '90em'`) |

`sm`, `md`, `xl` are **numerically identical** across both scales, so only the large-desktop step moves.
There is **no 1536px breakpoint in the Mantine theme** — this was already documented as a trap in Task 662 §3.3,
where the fix was a CSS-module `@media (min-width:1536px)`. **Task 668 takes the opposite, owner-chosen route:**
drop 1536 and adopt 1440. Do NOT add a 1536px breakpoint to `theme.ts` and do NOT reintroduce a CSS-module media
query to preserve 1536 — that directly contradicts §1.

### 3.3 Gap provenance (must NOT change)

| Grid | Current utility | Computed | Mantine equivalent (verified `theme.ts` L171–177) |
|---|---|---|---|
| Featured | `gap-4` | 16px row + column | `spacing="md"` (`md: '1rem'` = 16px) |
| Latest | `gap-3` | 12px row + column | `spacing="sm"` (`sm: '0.75rem'` = 12px) |

Mantine `SimpleGrid` `spacing` sets **both** axes (like Tailwind `gap`), so a single prop reproduces each. If the
executor finds any computed divergence, use `spacing`/`verticalSpacing` explicitly to hit the exact px — the binding
requirement is the computed value, not the prop shape.

### 3.4 The inconsistency this removes (verified)

`src/app/[locale]/page.tsx` L49 and L77 already render `<Title … fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>`
— a **Mantine** `xxl` step at **1440px**. `FeaturedListingsView` L78 steps its grid at **1536px**. Therefore in the
current production build, at 1440–1535px the section heading has already grown while the grid has not. Task 668
collapses both onto 1440.

### 3.5 Existing Storybook + governance registrations (must keep working)

| Story | `meta.title` | Story ID | Imports |
|---|---|---|---|
| `src/stories/FeaturedListings.stories.tsx` | `System/FeaturedListings` | `system-featuredlistings--default` | real `FeaturedListingsView` (Task 665) |
| `src/stories/LatestListings.stories.tsx` | `System/LatestListings` | `system-latestlistings--default` | real `LatestListingsView` (Task 665) |

Both stories statically import the **real production Views** and expose `Default` / `Loading` / `Empty` /
`LocaleStress`. Story-ID references that break if a story is retitled (verified):

- `scripts/check-stories-rendered.mjs` L173–174 (`ASSERT_STORIES`, anchor `.listing-card`)
- `scripts/responsive-screenshots.mjs` L103–106 (Featured: desktop-1280/1440, huge-2560, mobile-320/375, `uk`)
- `scripts/governance/component-catalog.mjs` L446
- `scripts/task420-qa-grid-step.mjs` L53

**Do not retitle or move these stories in this task** (§8, and see OQ1).

### 3.6 Marker-class asymmetry (verified — preserve as-is)

`.featured-listings` and `.latest-listings` exist **only on the loading-branch grid**, never on the populated grid
(`FeaturedListingsView` L57 vs L78; `LatestListingsView` L47 vs L60). This is documented in
`docs/sessions/2026-07-24-task665-storybook-listing-view-splits.md` §(L203–204), which explicitly warns these are
**not** valid `document.querySelector()` locators for the loaded grid. **Preserve this exact placement.** Do not add
the marker class to the populated grid "for consistency" — that would silently change locator behavior for the
Task 665 §16.1 `classList.contains` predicate and for any future harness.

### 3.7 Migration-scope manifest status (verified)

`scripts/mantine-migration-scope.json` contains 8 entries. **Neither `FeaturedListingsView` nor `LatestListingsView`
is enrolled.** `scripts/check-story-coverage.mjs` (L203–204, and its header comment §4) enrols a component only when
it is in the manifest **and** statically imported by a story whose `meta.title` matches
`MANTINE_STORY_TITLE_PREFIXES` (`Mantine/Primitives/*`, `Patterns/Mantine/*` — `scripts/lib/mantine-story-scope.mjs`).
`System/*` does **not** match. Consequence, and this is a hard constraint: **adding these Views to the manifest in
this task without also retitling their stories would fail the gate** (`enrolled, unproven`). Retitling has the
4-reference blast radius listed in §3.5. Therefore manifest enrolment is deliberately **deferred** — see A1/OQ1.

### 3.8 Critical-flow scan

`docs/critical-flow-registry.md`: the homepage listing-preview render is **not** a registered critical flow (registry
covers auth, RLS/write-path, moderation, reporting, payment). No automated regression-coverage obligation. Profile is
Q3, not Q4.

## 4. Requirements (requirement ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner directive §1.1 | Featured grid (populated **and** loading) renders via Mantine `SimpleGrid` with column steps **1 / 2 @640 / 3 @1280 / 4 @1440**. | P0 | computed `gridTemplateColumns` at the §13 widths | Confirmed |
| R2 | Owner directive §1.2 | Latest grid (populated **and** loading) renders via Mantine `SimpleGrid` with column steps **1 / 2 @768 / 3 @1440**. | P0 | computed `gridTemplateColumns` at the §13 widths | Confirmed |
| R3 | §3.3 | Gaps unchanged: Featured 16px, Latest 12px, on **both** axes, at every width. | P0 | computed `columnGap` + `rowGap` | Confirmed |
| R4 | Owner directive §1.3–1.4 | The 1440–1535px difference vs the pre-change render is recorded as the **approved** outcome, not a defect; every other width band matches the pre-change computed grid. | P0 | before/after table at §13 widths | Confirmed |
| R5 | §3.1 | The Featured header row (`<div className="flex items-center justify-between mb-6">`, L47) renders via Mantine `Group` (`justify="space-between"`, `align="center"`, `mb="xl"` or the value computing to 24px) with `Title` + `ViewAllLink` unchanged. | P1 | computed `display/justify-content/align-items/margin-bottom` | Confirmed |
| R6 | §3.6 | `.featured-listings` / `.latest-listings` remain on the **loading** grid only; the populated grid gains no marker class. | P0 | DOM inspection both branches | Confirmed |
| R7 | agent-contract P0.3/P0.5 | Card count, order, props (`priority`, `displayCurrency`, `rates`, `isFavorited`), `getImagePriority()` index semantics, empty state, and skeleton counts (3 Featured / 4 Latest) are unchanged. | P0 | DOM + `git diff` | Confirmed |
| R8 | agent-contract P0.7 | No user-facing string added or changed. | P0 | `git diff` shows zero `t()` key changes | Confirmed |
| R9 | agent-contract P0.9 | `npx tsc --noEmit` clean and `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R10 | qa-profiles Q3 | Full Q3 rendered proof for `System/FeaturedListings` + `System/LatestListings` across the canonical matrix × 4 locales, in **`Default` and `Loading`** states. | P0 | `screenshots:assert` manifest | Confirmed |
| R11 | §3.5 | Existing story IDs and every governance registration in §3.5 keep working; `check:stories`, `governance:screenshots`, `governance:components` stay exit 0. | P0 | command transcripts | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **A1 (deliberate, owner-visible deviation):** `check-story-coverage.mjs`'s stated governance obligation is that a
  component migrated to Mantine is added to `scripts/mantine-migration-scope.json` in the **same** PR. This task
  **does not** enrol the two Views, because enrolment without a canonical-prefixed story fails the gate, and
  retitling carries the §3.5 blast radius plus it would newly pull these stories into the `--mantine-only` run
  (risking unrelated FAIL/ambiguous rows and conflating two changes). **Owner sign-off on this deferral is required
  at review.** If the owner rejects the deferral, the retitle + re-pointing of all four §3.5 reference sites becomes
  part of this task and the QA profile does not change.
- **A2 (assumption):** `SimpleGrid`'s `cols` accepts the theme breakpoint keys (`base`/`sm`/`md`/`xl`/`xxl`), as used
  today in `HowItWorksSteps` (`cols={{ base: 1, sm: 3 }}`) and `PopularLocationsView` (`cols={{ base: 2, sm: 3, md: 4 }}`).
  Re-verify against the installed `@mantine/core` version before coding; if `xxl` is not accepted in `cols`, STOP and
  report — do not silently substitute a CSS-module media query (that would re-create the 1536-style split this task
  exists to remove).
- **OQ1 (non-blocking, follow-up):** retitling `System/FeaturedListings` / `System/LatestListings` to
  `Patterns/Mantine/*` + manifest enrolment + re-pointing the four §3.5 reference sites. Folded into the Task 667
  inventory, not done here.
- **OQ2 (non-blocking):** the skeleton chrome Tailwind (§3.1) and the remaining homepage Tailwind surfaces
  (`FiltersPanel`, `MobileBottomNav`, Sonner `Toaster`, `HeaderView`/`FooterView` hybrids) are separate tasks
  (669–673). Do not touch them here.
- No blocking open questions.

## 6. Pre-read rule bundle (exact — do not read all docs)

1. `docs/agent-contract.md` (P0 invariants).
2. `docs/mantine-responsive-design-system.md` (breakpoints, responsive props, `SimpleGrid` usage).
3. `docs/component-rules.md` (container/presentational split, no-duplicate).
4. `docs/qa-profiles.md` (Q3 evidence requirements).
5. `docs/storybook-governance.md` §14–§15 (rendered proof + coverage manifest).
6. `docs/qa-rules.md` (validation, encoding, mojibake).
7. This kickoff. Re-verify §3.2 (`theme.ts` breakpoints) and A2 before coding.

## 7. Scope

- `src/modules/listings/components/FeaturedListingsView.tsx` — grid containers (L57, L78) + header row (L47).
- `src/modules/listings/components/LatestListingsView.tsx` — grid containers (L47, L60).
- Story `docs.description` text in `src/stories/FeaturedListings.stories.tsx` and
  `src/stories/LatestListings.stories.tsx` **only where it states the column-step breakpoint** (both currently claim
  `2xl, 1536px` — `LatestListings.stories.tsx` L99 verbatim: *"3 cols (2xl, 1536px)"*). These are Storybook doc
  strings, not user-facing i18n copy, so R8 is unaffected — but leaving them would ship a false canonical claim.
- `docs/backlog.md` (concise current state, respect the 80-line cap) + session log under `docs/sessions/`.

## 8. Out of scope

- Any 1536px preservation mechanism (`theme.ts` breakpoint addition, CSS-module `@media`) — contradicts §1.
- `CardSkeleton` / `RowSkeleton` internal Tailwind chrome (`rounded-xl border bg-card overflow-hidden`,
  `p-3 space-y-2`, `flex flex-col`) — OQ2.
- Retitling / moving either story; editing the four §3.5 governance reference sites; `mantine-migration-scope.json` — A1/OQ1.
- `ListingCard`, `MantineListingCardPattern`, `FavoriteButton`, `AppImage` — untouched.
- The homepage `Group` at `page.tsx` L48 (Latest's own heading row) — already Mantine, leave verbatim.
- `PopularLocations`, `FiltersPanel`, `HeroSearch*`, `MobileBottomNav`, `Toaster` — Tasks 669–673.
- Adding a marker class to the populated grids — §3.6.

## 9. Current and required behavior

**Current:** both Views render raw `<div>` grid containers with Tailwind utilities. Featured: 1 col → 2 @640 → 3 @1280
→ 4 **@1536**, gap 16px. Latest: 1 col → 2 @768 → 3 **@1536**, gap 12px. Featured's header row is a raw
`<div className="flex items-center justify-between mb-6">`.

**Required (after):** the same six render branches use Mantine `SimpleGrid` / `Group`. Featured: 1 → 2 @640 → 3 @1280
→ 4 **@1440**. Latest: 1 → 2 @768 → 3 **@1440**. Gaps, card contents, order, counts, empty/loading states, and marker-class
placement are unchanged. **At 1440–1535px the grid intentionally differs from the pre-change render** (Featured 4 cols
instead of 3; Latest 3 cols instead of 2) — this is the approved outcome per §1.

## 10. Implementation requirements

1. **Featured populated grid (L78)** →
   `<SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">`.
2. **Featured loading grid (L57)** → same `SimpleGrid` props, **plus** `className="featured-listings"` (marker
   preserved on this branch only, §3.6).
3. **Latest populated grid (L60)** → `<SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">`.
4. **Latest loading grid (L47)** → same, **plus** `className="latest-listings"`.
5. **Featured header row (L47)** → `<Group justify="space-between" align="center" mb="xl">` wrapping the existing
   `Title` + conditional `ViewAllLink` verbatim. `mb-6` = 24px; theme `spacing.xl` = `1.5rem` = 24px (`theme.ts` L176),
   so `mb="xl"` is the exact token match — verify the computed `margin-bottom` is 24px, and if it is not, use the
   value that computes to 24px. Note `wrap`: Tailwind `flex` defaults to `nowrap`; Mantine `Group` defaults to
   `wrap="wrap"`. **Pass `wrap="nowrap"`** to preserve current behavior, matching the sibling Latest heading row at
   `page.tsx` L48 which already uses `wrap="nowrap"`.
6. **Imports:** add `SimpleGrid` / `Group` to the existing `@mantine/core` import in each file. Remove now-unused
   imports. Keep both files `'use client'` and hook-free apart from the existing `useTranslations`.
7. **No new tokens, no CSS module, no `theme.ts` change.**
8. **Story doc strings** (§7) — update the breakpoint claim from `2xl, 1536px` to `xxl, 1440px` in both files. Do not
   change `meta.title`, story export names, or story args.
9. **i18n / encoding:** no `t()` key changes; touched files stay UTF-8 no-BOM, no mojibake.

### Canonical UI decision record

| Visible artifact | Search performed | Canonical Mantine Story / source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Featured card grid container | `rg "SimpleGrid"` across `src` → 8 files; opened `HowItWorksSteps.tsx` (`cols={{ base:1, sm:3 }} spacing={32}`), `PopularLocationsView.tsx` (`cols={{ base:2, sm:3, md:4 }} spacing="sm"`), `stories/patterns/mantine/ListingCardPattern.stories.tsx` | Mantine `SimpleGrid` (upstream primitive, already the project's grid mechanism on this same page) | **reuse** | none new — theme `spacing.md` (16px) + theme breakpoints; no manifest change (A1) |
| Latest card grid container | same search | Mantine `SimpleGrid` | **reuse** | none new — theme `spacing.sm` (12px) |
| Featured header row | `page.tsx` L48 already renders the equivalent Latest heading row as `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` — inspected verbatim | Mantine `Group`, with an in-repo precedent on the same page | **reuse** | none new — theme `spacing.xl` (24px) |
| Large-desktop column step | `theme.ts` L142–150 inspected; no 1536px breakpoint exists | theme `xxl` = 1440px | **reuse** | none new |

No `create canonical` disposition is claimed: every artifact maps to an upstream Mantine primitive already used on
this page, so clause 16a (no guessed visual values) is satisfied — the only changed visual value (the 1440px step) is
an explicit owner decision recorded in §1, not an invention.

## 11. Positive and negative flows

**Positive flow:** Load `/[locale]` at 1440px → Featured renders 4 columns and Latest renders 3 columns (previously
3 and 2); at 320/375/640/768/1024/1280/1536/1920 the column counts and both gaps match the pre-change render; cards,
order, favorites, and headings are unchanged.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form/input touched | N/A | — |
| Authorization/RLS | No | Public marketing route, no write path | N/A | — |
| Offline/network | No | No fetch change; container/View split untouched | Existing behavior | — |
| Concurrent writer | No | No mutation | N/A | — |
| **Loading state** | **Yes** | `loading:true` branch has its own grid | Skeleton grid steps at the SAME new breakpoints as the populated grid; 3/4 skeleton count unchanged; marker class still present | `Loading` story at all §13 widths |
| **Empty state** | **Yes** | `!listings.length` branch | Renders `Text` empty message, no grid; unaffected by this diff | `Empty` story |
| **Partial fill at 1440** | **Yes** | 4-col grid with 3 fixtures | Row does not stretch or misalign; trailing cells collapse as `SimpleGrid` does natively | rendered check @1440 |
| Long-locale (uk) @320 | Yes | i18n | No horizontal overflow; single column; gap unchanged | `screenshots:assert` `uk@320` |
| **1439 vs 1440 boundary** | **Yes** | §1.1–1.2 | Column count changes at exactly 1440, not 1439 | computed `gridTemplateColumns` @1439/1440 |
| **1535 vs 1536 boundary** | **Yes** | §1.4 | **No** column change at 1536 (the old step is gone) | computed `gridTemplateColumns` @1535/1536 |

## 12. Acceptance criteria

- **AC1 [R1,R4]** Given the Featured grid, when computed `gridTemplateColumns` is read at
  320 / 640 / 768 / 1024 / 1280 / **1439 / 1440 / 1535 / 1536** / 1920, then the column counts are
  1 / 2 / 2 / 2 / 3 / **3 / 4 / 4 / 4** / 4, and the value does **not** change between 1535 and 1536.
- **AC2 [R2,R4]** Given the Latest grid, at the same widths, then the column counts are
  1 / 1 / 2 / 2 / 2 / **2 / 3 / 3 / 3** / 3, and the value does **not** change between 1535 and 1536.
- **AC3 [R3]** Given both grids at every AC1 width, when computed styles are read, then `columnGap` and `rowGap` are
  16px (Featured) and 12px (Latest) — identical to the pre-change render at every width.
- **AC4 [R1,R2,R7]** Given the **loading** branch of both Views, then its grid computes the SAME
  `gridTemplateColumns` / `columnGap` / `rowGap` as the populated branch at every AC1 width, and renders exactly
  3 (Featured) / 4 (Latest) skeletons.
- **AC5 [R5]** Given the Featured header row, when computed styles are read, then `display:flex`,
  `justify-content:space-between`, `align-items:center`, `flex-wrap:nowrap`, `margin-bottom:24px`, and the
  `Title` + `ViewAllLink` children are unchanged in order and conditional rendering.
- **AC6 [R6]** Given the DOM, then `.featured-listings` / `.latest-listings` appear on the loading grid only and on
  no populated grid.
- **AC7 [R7,R8]** Given `git diff`, then card props, `getImagePriority()` index arguments, skeleton counts, the empty
  branch, and all `t()` keys are unchanged; only grid/header containers, their imports, and the two story
  doc-description breakpoint strings differ.
- **AC8 [R9]** Given the repo, then `npx tsc --noEmit` is clean and `npm run build` exits 0 (transcript included).
- **AC9 [R10]** Given `System/FeaturedListings` and `System/LatestListings`, then `npm run screenshots:assert`
  produces a PASS manifest for `Default` **and** `Loading` across the canonical Q3 widths × sq/en/uk/it, with
  `uk@320` present, and no new FAIL relative to the pre-change baseline.
- **AC10 [R11]** Given the repo, then `npm run check:stories`, `npm run governance:screenshots`, and
  `npm run governance:components` all exit 0, and the four §3.5 story-ID references still resolve.
- **AC11 [R4]** Given the session log, then it contains an explicit **before/after** computed-grid table for both
  grids at all AC1 widths, with the 1440–1535 rows labelled **`APPROVED CHANGE (owner 2026-07-26)`** and every other
  row labelled `UNCHANGED`. Any unlabelled difference outside 1440–1535 is a defect.

## 13. QA profile and verification plan

**Profile: Q3 Full Visual Matrix.** Justification: a migrated Mantine responsive layout on the primary public route
with a deliberate, owner-approved breakpoint change — `docs/qa-profiles.md` L15 covers "high-risk responsive work"
and "any task the owner marks visual-critical". Not Q4: no critical flow, auth, RLS, or data-loss path (§3.8).
Not Q2: the layout genuinely changes at a real viewport band, so targeted evidence is insufficient.

Verification plan (only repo-known commands):

1. `npx tsc --noEmit` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include the `✓ Compiled` + static-pages transcript).
4. `npm run screenshots:assert` → PASS manifest for `System/FeaturedListings` + `System/LatestListings`,
   `Default` **and** `Loading`, × sq/en/uk/it, `uk@320` mandatory. Compare FAIL/AMBIGUOUS counts against the
   pre-change baseline; **no new FAIL** is permitted.
5. `npm run governance:screenshots` and `npm run governance:components` → exit 0 (R11).
6. **Computed-grid before/after capture — the core evidence for this task.** For each of the four grid containers
   (Featured populated, Featured loading, Latest populated, Latest loading), capture at
   **320 / 640 / 768 / 1024 / 1280 / 1439 / 1440 / 1535 / 1536 / 1920**:
   `getComputedStyle(grid).gridTemplateColumns`, `.columnGap`, `.rowGap`.
   Compare pre-change vs post-change and record the AC11 table.
   **Assert on these computed values only — do NOT assert byte-identical DOM.** The DOM is expected to differ:
   `SimpleGrid` emits its own `m-…` class plus inline `--sg-*` custom properties in place of the Tailwind utility
   classes. A DOM diff is expected output, not evidence of a defect, and must not be used as a pass/fail criterion.
   Prefer the Storybook stories (they import the real Views and cover `Loading`) so no seeded DB or dev server is
   needed. If the app route is also captured, use it as corroboration, not as the primary gate.
7. File-integrity/mojibake check on all touched text files.

If any required gate cannot run (sandbox / native-binary / timeout limit), record it as missing evidence with the
exact native PowerShell command and return `PARTIALLY IMPLEMENTED` or `BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-26-task668-*.md`) and the `docs/backlog.md` update must include: a
changed-files table matching the real diff; completed requirement IDs (R1–R11) each with evidence; every command run
with its actual result/exit code (tsc, check:stories, build, screenshots:assert, governance:screenshots,
governance:components); the **AC11 before/after computed-grid table** with explicit `APPROVED CHANGE` /`UNCHANGED`
labels; the screenshots:assert PASS/FAIL/AMBIGUOUS delta vs baseline; confirmation that A1 (deferred manifest
enrolment) is still the chosen path and is flagged for owner sign-off; assumptions/deviations/limitations; and the
acceptance-criteria self-audit (AC1–AC11). Set status to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Do not self-approve. Do not run, emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (files, line numbers, verbatim markup, both breakpoint
  scales, gap tokens, story IDs, governance reference sites all inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R11 → AC1–AC11 + §13).
- Scope protects existing behavior and names what must not change — yes (§8: skeleton chrome, story titles, manifest,
  marker-class placement, 1536 preservation mechanisms, sibling components).
- Current/legacy UI boundary, QA profile, locales, Storybook obligations explicit — yes (current Mantine path, Q3,
  4 locales, existing `System/*` rendered-proof path).
- Each changed visual artifact traced to inspected markup/tokens; the executor can distinguish a column step from a
  gap from a margin — yes (§3.1 verbatim markup, §3.2 breakpoints, §3.3 gaps, §10.5 margin).
- Canonical UI decision record present with search evidence; every disposition is `reuse` with a named in-repo
  precedent — yes.
- The trace's change/preserve classifications agree with owner intent — yes: the 1440 step is the **only** intended
  visual change and is recorded as owner-approved in §1, §9, AC11.
- Negative flows selected by applicability, not a generic checklist — yes (§11: loading, empty, partial fill,
  both breakpoint boundaries, uk@320).
- No uninspected command/file/story/behavior claimed — yes (all paths, line numbers, and script references inspected
  2026-07-26).
- Gates prove the changed behavior — yes: AC1/AC2 assert the moved step at the exact 1439/1440 and 1535/1536
  boundaries, which is precisely what this task changes, and §13.6 forbids the byte-identical-DOM criterion that
  would have made the task unsatisfiable.
- Assumptions and unresolved decisions visible — yes (§5: A1 requires owner sign-off, A2 requires re-verification,
  OQ1/OQ2 deferred).

---

**Task path:** `tasks/kickoff_prompt_Task_668_Homepage_Grids_SimpleGrid_1440_Alignment.md`
**QA profile:** Q3 Full Visual Matrix.
**Ambiguous/conflicting requirements:** none blocking execution.
**Owner decision still needed:** confirm **A1** at review — deferring `mantine-migration-scope.json` enrolment for
`FeaturedListingsView` / `LatestListingsView` to the Task 667 / OQ1 follow-up, rather than retitling both stories and
re-pointing the four §3.5 governance reference sites inside this task.
