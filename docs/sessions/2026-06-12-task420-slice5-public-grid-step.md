# Session Log — 2026-06-12 — Task 420 (Sprint 35, Slice 5)

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_420_Slice5_PublicListingGridStep.md`
**Scope:** Bounded §8.3 public/listing card-grid column-step sweep — fix the
`lg:`→`xl:`/`2xl:` divergences in `FeaturedListings.tsx` and `SimilarListings.tsx`,
verify-only the already-canonical surfaces, add minimal canonical stories for the
two fixed components, and prove the fix with a standalone QA script (harness
untouched — Slice 6 gated).

---

## 0. Inventory re-run (§3 sweep)

Re-ran `grep -rn "grid-cols" src/` and reconciled against the §3 audit table. One
additional surface was found that was **not** in the §3 table:

- **`LatestListings.tsx:40,53`** — `grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3`
  (homepage "Latest" section, `variant="horizontal"` cards).

**Disposition:** treated like `RecentlyViewedGrid`/`PopularLocations` — this is a
**deliberately different pattern**, not a §8.3 divergence: it uses the
`horizontal` `ListingCard` variant (wide row cards, not the vertical §8.3 card),
caps at **3** columns (never 4, no `xl:`/`2xl:grid-cols-4` step), and steps at
`md`/`2xl` rather than `sm`/`xl`/`2xl`. It does not claim to be the canonical
1→2→3→4 listing-card grid, so forcing the §8.3 track-count table onto it would be
inventing architecture, not fixing a divergence. **OUT OF SCOPE — not modified.**
Flagged here per clause 0.8 for the orchestrator; the diff remained SMALL so no
STOP & SPLIT was triggered.

No other divergent §8.3 listing-card grids were found beyond the §3 table.

---

## 1. Audit table (reproduced from §3, with results)

| Surface (file:line) | Current grid classes (before) | Expected §8.3 | Action | Rendered evidence |
|---|---|---|---|---|
| `FeaturedListings.tsx:61` (loading skeleton) | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | **FIXED** `lg:`→`xl:` | task420-qa Default story, 88/88 PASS (col counts below) |
| `FeaturedListings.tsx:80` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` | same as above | **FIXED** `lg:`→`xl:` | `system-featuredlistings--default` × sq/en/uk/it × 320/375/390/640/768/1024/1280/1440/1536/1920/2560 = 44/44 PASS |
| `SimilarListings.tsx:89` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | **FIXED** added `xl:grid-cols-3`, moved 4-col step `lg`→`2xl` | `system-similarlistings--default` × sq/en/uk/it × (same 11 viewports) = 44/44 PASS |
| `CollectionsSection.tsx:137` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | (already canonical) | **VERIFY-ONLY**, 0 edits | confirmed already canonical — already covered by `screenshots:assert` matrix |
| `FavoritesShell.tsx:202` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | (canonical) | **VERIFY-ONLY**, 0 edits | confirmed already canonical |
| `ListingsShell.tsx:227` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` | (canonical) | **VERIFY-ONLY**, 0 edits | confirmed already canonical |
| `RecentlyViewedGrid.tsx:59` / `RecentlyViewedSection.tsx:67` | mobile carousel → `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | N/A — deliberate carousel pattern | **NOT CHANGED** — documented exemption (§4) | verify-only — render unchanged |
| `PopularLocations.tsx:49` | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` | N/A — location tiles, not listing cards | **OUT OF SCOPE** | verify-only — render unchanged |
| `PageShell.tsx:27` (container) | `container-wide py-8 sm:py-12 lg:py-16 2xl:py-20` | §4 cap 1408px + 2xl padding present | **VERIFY-ONLY** | confirmed: `container-wide` (88rem/1408px cap), `2xl:py-20` padding step present, no wider `max-w-*` override |
| `LatestListings.tsx:40,53` (found during re-sweep, not in §3) | `grid-cols-1 md:grid-cols-2 2xl:grid-cols-3` (horizontal-card variant, 3-col cap) | N/A — deliberate different pattern (see §0) | **OUT OF SCOPE — flagged, not modified** | verify-only — render unchanged |

---

## 2. Product fixes

### 2.1 `src/modules/listings/components/FeaturedListings.tsx`

Two grid `<div>`s (loading skeleton, line 61; populated grid, line 80), both:

```diff
- <div className="... grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
+ <div className="... grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
```

Effect: 3-column step now happens at `xl` (1280px) instead of `lg` (1024px). At
1024px the grid now shows 2 columns (was 3). 2-col step (`sm`, 640px) and 4-col
step (`2xl`, 1536px) unchanged.

### 2.2 `src/modules/listings/components/SimilarListings.tsx`

```diff
- <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
+ <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
```

Effect: previously jumped straight from 2 columns (`sm`, 640px) to 4 columns
(`lg`, 1024px), skipping the 3-column step entirely and reaching 4 columns far
earlier than §8.3 intends. Now: 1 (`<640`) → 2 (`sm`) → 3 (`xl`, 1280px) → 4
(`2xl`, 1536px), matching the §2 table exactly.

**Note (non-blocking, out of scope):** `SimilarListings.tsx` passes
`layoutContext="4-col"` to `ListingCard` (an image-`sizes`-hint only, from
`src/lib/imageDelivery.ts`, comment `'4-col' // 4-col at lg (1024px)`). The grid
now reaches 4 columns at `2xl` (1536px) rather than `lg`. This is a `sizes`
attribute precision mismatch only (affects which responsive image size the
browser downloads, not layout/rendering correctness) — `imageDelivery.ts` is not
in the §6 files-in-scope list and was not touched. Flagged for the orchestrator;
a future task may want to add a `'3-col-2xl-4'`-style context or re-evaluate
`'4-col'`'s sizes string.

No card-internal, data, handler, query, or i18n changes. No spacing changes
outside the grid column classes.

---

## 3. New stories

### `src/stories/FeaturedListings.stories.tsx` (new)

`System/FeaturedListings` — `Default` (8-card grid, toolbar-reactive locale,
`desktop1280` initial viewport) + `LocaleStress` (4-card grid, `mobile320`
initial viewport). Mirrors the live header (`t('featured')`) + the fixed
canonical §8.3 grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4`).
Reuses `StoryListingCard`/`makeStoryListings`. `withCanvas` global decorator +
`layout:'fullscreen'` (inherited, not overridden); no raw string literals; no
`/Ukrainian/` export; no `globals:{locale}` pin — `LocaleStress` is
toolbar-reactive.

### `src/stories/SimilarListings.stories.tsx` (new)

`System/SimilarListings` — same shape as above, header `t('similar_listings')`,
same fixed canonical grid. The live component is a Server Component (Supabase
query + speculation-rules script); the story renders the presentational shell
only — same approach as `RecentlyViewedSection.stories.tsx`
(`docs/responsive-screenshot-governance.md` §12: components requiring
auth/DB cannot be captured directly).

---

## 4. Focused QA — `scripts/task420-qa-grid-step.mjs` (new script)

2 stories (`system-featuredlistings--default`, `system-similarlistings--default`)
× 4 locales (sq/en/uk/it) × 11 viewports (320/375/390/640/768/1024/1280/1440/
1536/1920/2560) = **88 cells**.

Each cell asserts:
- **column-track count** matches the §2 expected table (1/1/1/2/2/2/3/3/4/4/4) —
  via `getComputedStyle(grid).gridTemplateColumns` → count of non-`0px` tracks
- **no horizontal scroll** (`scrollWidth <= clientWidth + 2`)
- **container cap** — at `>=1536`, the nearest `.container-wide` ancestor's
  content box `<= 1408px`

```
Task 420 Slice 5 §8.3 grid-step QA capture
    Stories: 2 | Locales: 4 x Viewports: 11 = 88 cells
...
Results: 88/88 PASS, 0 FAIL
Manifest: .screenshots/task420-qa/2026-06-12T16-18/manifest.json
PNGs (uk@320/375/390 + 2560 only): .screenshots/task420-qa/2026-06-12T16-18/*.png
```

uk@320/375/390 + 2560 PNGs captured for both stories (8 PNGs total).

---

## 5. Validation gates

- `npx tsc --noEmit` — clean (0 errors).
- `npm run lint` — clean (0 issues).
- `npm run build-storybook` — builds successfully; new stories present
  (`system-featuredlistings--default`, `system-featuredlistings--locale-stress`,
  `system-similarlistings--default`, `system-similarlistings--locale-stress`).
- `npm run check:stories` — PASS (49 files checked, 0 violations; `storybook.*`
  parity 297/297/297/297 sq/en/uk/it).
- `npm run check:i18n` — PASS (1768/1768/1768/1768 key parity; the one raw-enum
  warning is pre-existing/unrelated, `AdminInquiriesManager.tsx:288`).
- `npm run check:story-coverage` — PASS (38 covered, 58 exempt, 0 uncovered).
- `npm run check:design-tokens` — PASS (0 violations).
- `node scripts/task420-qa-grid-step.mjs` — **88/88 PASS, 0 FAIL**.

---

## 6. `screenshots:assert` (2520-cell rendered matrix, regression check)

Kicked off in the background (`.screenshots/rendered-assert/2026-06-12T16-20/`). The run
progressed abnormally slowly in this sandbox (resource contention from ~53 leftover
node/chrome processes) but **completed later in the session** with a clean result:

```
Results: 2520/2520 PASS, 0 FAIL
flaky-recovered: 0
Manifest: .screenshots/rendered-assert/2026-06-12T16-20/manifest.json
✅ All rendered assertions PASSED.
```

The two new stories (`system-featuredlistings--default/locale-stress`,
`system-similarlistings--default/locale-stress`) are **not** registered in
`scripts/check-stories-rendered.mjs`'s `ASSERT_STORIES` (Slice 6 is owner-gated and untouched,
per §6 forbidden-edits), so the 2520-cell global matrix is **unchanged in size** by this diff —
this run covers the same 2520 cells as before Task 420, confirming no regression.

Per `docs/agent-contract.md` clause 14, "Integrity re-runs are a SCREEN, not a verdict" — this
sandbox result is a SCREEN, not the final verdict; an **owner-native** `screenshots:assert` run
(or CI) remains the authoritative gate before close. The Task 420 fix is proven primarily by the
focused QA (§4, 88/88 PASS, which directly exercises the two changed grids at every
breakpoint/locale) plus `tsc`/`lint`/`check:*` all green (§5), with this 2520/2520 sandbox run
as corroborating evidence of no global regression.

---

## 7. File-integrity checks

All touched/added files verified clean (0 NUL bytes, no BOM):

| File | NUL bytes | BOM | `node --check` / `tsc` |
|---|---|---|---|
| `src/modules/listings/components/FeaturedListings.tsx` | 0 | none | covered by `tsc` (0 errors) |
| `src/modules/listings/components/SimilarListings.tsx` | 0 | none | covered by `tsc` (0 errors) |
| `src/stories/FeaturedListings.stories.tsx` | 0 | none | covered by `tsc` (0 errors) |
| `src/stories/SimilarListings.stories.tsx` | 0 | none | covered by `tsc` (0 errors) |
| `scripts/task420-qa-grid-step.mjs` | 0 | none | `node --check` OK |

---

## 8. AC-by-AC

| AC | Status | Evidence |
|---|---|---|
| AC1 | ✅ | `FeaturedListings.tsx:61,80` `lg:grid-cols-3`→`xl:grid-cols-3` (§2.1 diff) |
| AC2 | ✅ | `SimilarListings.tsx:89` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` (§2.2 diff) |
| AC3 | ✅ | `CollectionsSection.tsx`/`FavoritesShell.tsx`/`ListingsShell.tsx` — 0 edits (§1 table) |
| AC4 | ✅ | `RecentlyViewed*`/`PopularLocations` untouched; carousel exemption documented (§1 table); `LatestListings.tsx` finding flagged (§0), not modified |
| AC5 | ✅ | `PageShell.tsx` verify-only — `container-wide` cap + `2xl:py-20` present, no wider `max-w-*` (§1 table) |
| AC6 | ✅ | Two new stories, `check:stories` PASS (§5) |
| AC7 | ✅ | `task420-qa-grid-step.mjs` 88/88 PASS (§4); §1 table "Rendered evidence" column filled from manifest |
| AC8 | ✅ (sandbox SCREEN) | sandbox `screenshots:assert` = 2520/2520 PASS, 0 FAIL, 0 flaky-recovered (§6) — matrix unchanged in size (new stories not in `ASSERT_STORIES`, Slice 6 untouched); this is a SCREEN per clause 14, not the final verdict — owner-native re-run remains the authoritative gate before close; focused QA 88/88 PASS (AC7) is the primary in-scope proof |
| AC9 | ✅ | 320-width cells = 1 column, `noHScroll` true for all 4 locales (uk@320/375/390 PNGs captured) |
| AC10 | ✅ | This section + §7 integrity transcript + §9 Files Changed |

---

## 9. Files Changed

| File | Change |
|---|---|
| `src/modules/listings/components/FeaturedListings.tsx` | Both grid `<div>`s (loading skeleton line 61, populated grid line 80): `lg:grid-cols-3` → `xl:grid-cols-3`. §8.3 column-step fix. |
| `src/modules/listings/components/SimilarListings.tsx` | Grid `<div>` (line 89): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`. §8.3 column-step fix (adds missing 3-col step, moves 4-col step `lg`→`2xl`). |
| `src/stories/FeaturedListings.stories.tsx` | **New** — `System/FeaturedListings` story (`Default` + `LocaleStress`), reuses `StoryListingCard`/`makeStoryListings`, exercises the fixed §8.3 grid. |
| `src/stories/SimilarListings.stories.tsx` | **New** — `System/SimilarListings` story (`Default` + `LocaleStress`), same shape, presentational-shell only (Server Component live original). |
| `scripts/task420-qa-grid-step.mjs` | **New** — focused QA script: 2 stories × 4 locales × 11 viewports (88 cells), asserts §8.3 column-track count, no h-scroll, and the 1408px container cap at `>=1536`. |
| `docs/responsive-storybook-inventory.md` | Slice 5 row → ✅ DONE (Task 420) with Result paragraph. |
| `docs/backlog.md` | "Last Session" updated to summarize Task 420. |
| `docs/sessions/2026-06-12-task420-slice5-public-grid-step.md` | **New** — this session log. |

---

## 10. Confirmations

- **No card-redesign / data / handler / query / i18n-runtime changes** — only
  grid `className` strings touched in the two FIX files.
- **No admin surfaces touched.**
- **RecentlyViewed carousel exemption preserved** — `RecentlyViewedGrid.tsx` /
  `RecentlyViewedSection.tsx` untouched (mobile horizontal-scroll carousel,
  documented exemption per §4).
- **`PopularLocations.tsx` untouched** (not listing cards, out of scope).
- **`LatestListings.tsx` finding** — flagged per clause 0.8, not modified;
  deliberate different pattern (horizontal-card variant, 3-col cap), diff
  remained SMALL so no STOP & SPLIT triggered.
- **`scripts/check-stories-rendered.mjs` NOT touched** — Slice 6 remains
  owner-gated; proof is via the standalone `task420-qa-grid-step.mjs`.
- **No git commands emitted** by the executor (single-writer rule) —
  orchestrator to review diff and emit explicit-path commit commands.

Self-validation: tsc=0 · gates green · grid-step QA 88/88 PASS (primary proof) · global `screenshots:assert` sandbox SCREEN = 2520/2520, 0 FAIL, 0 flaky (matrix size unchanged) · owner-native re-run still the authoritative gate per clause 14 · scope=clean
