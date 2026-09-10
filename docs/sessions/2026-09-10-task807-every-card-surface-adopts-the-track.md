# Session Archive: Task 807 — every card surface adopts the track — 2026-09-10

Task path: `tasks/Sprints/Sprint_74_kickoff_prompt_Task_807_Every_Card_Surface_Adopts_The_Track.md`
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 0. Pre-write worktree snapshot

`git --no-optional-locks status --porcelain` immediately before the first write returned empty
(clean worktree) — Task 806 had been committed by the owner (`347f8a04f`) before this session
started editing, and the Task 807 kickoff itself was committed as `a8148a4b4`. The probe's
`gitCommit` field (below) is `a8148a4b4...`, matching `HEAD` at measurement time.

## 1. Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC1 [R1] | No `SimpleGrid` wraps a `ListingCard`/card skeleton; no stray `grid-template-columns`/`flex-basis` in `src/modules/listings` | `grep -rn "SimpleGrid" src/ --include=*.tsx \| grep -v stories` — every remaining non-story hit is one of §8's explicitly out-of-scope grids (`MantineTwoColumnForm`, `MantineListingGalleryPattern`, `MantineListingDetailPattern`'s features/amenities, `FiltersPanel`, `HowItWorksSteps`, `PopularLocationsView`, `FooterView`, `ListingsFilters`) — none wraps a `ListingCard`. `grep -rn "grid-template-columns\|flex-basis" src/modules/listings` → **0 matches** (the two deleted CSS modules were the only hits; `MantineListingCardTrack.module.css` lives outside this path) | ✅ |
| AC2 [R2] | Eight `mode` values match §3.2; every skeleton's mode equals its content's mode | See §3 table below — 8/8 correct, `SimilarListingsSkeleton` matches `SimilarListingsView`'s `rail` | ✅ |
| AC3 [R3] | `RecentlyViewedGridView.module.css`/`SimilarListingsView.module.css` show `D`; no stale import | `git status --porcelain` (§7 below) shows both as `D`. `grep -rn "RecentlyViewedGridView.module.css\|SimilarListingsView.module.css" src/` → only prose-comment mentions (`RecentlyViewedGridView.tsx` deviation note, `SimilarListingsView.tsx` doc comment) — no `import` statement | ✅ |
| AC4 [R4] | `ListingLayoutContext` names track modes, every string px-based, every `ListingCard` render site passes a context; rendered `sizes` matches measured width within one `srcset` step | **Partial — documented deviation, not silent.** Two new `card-track-grid`/`card-track-rail` contexts added, derived from real route measurement (§4 below), and wired to all 8 in-scope render sites. `'sidebar'`/`'4-col'` removed (every consumer migrated). `'default'`/`'3-col-xl'` are KEPT, unchanged — kickoff §10.3's own instruction fires: *"If any consumer outside §7 references a removed context name, stop and report — do not widen the diff."* `FavoritesShell.tsx:209` and `ListingCard.stories.tsx:171` (`FavoritesComposition` story) both pass `layoutContext="3-col-xl"` and are explicitly out of §7/§8 scope (Task 809). Removing `'3-col-xl'` would either break those two files' types or require silently reassigning their `sizes` (an out-of-scope behavior change) — both forbidden by the same clause. See §8 Implementation validation notes | ⚠️ (see note) |
| AC5 [R5] | `check:design-tokens --strict --scope=mantine` → 0; `check:story-coverage` → 33/0; `git diff messages/` empty | `nat-final-design-tokens.txt` → 0 violations, 0 stale markers, exit 0. `nat-final-story-coverage.txt` → 33 covered / 0 unproven, exit 0. `git diff --stat -- messages/` → empty | ✅ |
| AC6 [R6] | Real-route widths equal across all three routes for the same track mode, per width | `runs/clean-2` + `runs/reverted-clean-1`: rail first-card width equal across `home`/`detail` at every width (236.16/280/280/280/280 px @ 320/390/768/1024/1440); `parityMismatches: []` (probe exit 0). Grid (`/listings`, only grid route) columns 1/1/2/3/4 @ 320/390/768/1024/1440, card widths 288/358/352/309.33/316 px | ✅ |
| AC7 [R7] | Wrappers/`data-testid`s byte-unchanged; 3 named regression tests pass unmodified | `git diff` — `.similar-listings`/`.featured-listings`/`.latest-listings`/`.recently-viewed` and every `data-testid` are untouched (only the inner track element changed). `nat-ac7-similar-visibility.txt`/`nat-ac7-similar-ladder.txt`/`nat-ac7-buildhref.txt` → all exit 0 | ✅ |

## 2. Current versus required behavior

**Before:** six per-surface column ladders (`SimpleGrid cols={{...}}` × 4, two hand-rolled
CSS-module flex rails), the `SimilarListingsSkeleton` rendering a 4-up grid in front of a rail
(a shipping layout shift), and `LISTING_LAYOUT_SIZES` describing none of them correctly (`vw`
fractions cannot express an `auto-fill` column; `RecentlyViewedGridView`/`SimilarListingsView`
both passed `'4-col'` while rendering different widths; `FeaturedListingsView`/`LatestListingsView`
passed no `layoutContext` at all).

**After:** all eight sites in §3.2 render through `MantineListingCardTrack` (mode per D74-4: `rail`
for Featured/Latest/RecentlyViewed/Similar, `grid` for `/listings`); the Similar-listings Suspense
skeleton uses the same `rail` mode as its resolved content; `LISTING_LAYOUT_SIZES` carries two new
px-based contexts derived from real production-route measurement (not the Task 806 standalone
story), wired to every in-scope render site.

**Negative flows (kickoff §11 applicability table):**

| Branch | Applicable | Evidence |
|---|---|---|
| Zero cards in a section | Yes | `RecentlyViewedGridView`/`SimilarListingsView`/`SimilarListings.tsx` all still return early (`if (!listings.length) return null` or the equivalent) — untouched by this diff; the track itself reserves no height when absent (no wrapper renders at all in that case) |
| One card | Yes | Not exercised by the automated route probe (needs a data fixture with exactly 1 similar/recently-viewed/featured/latest listing) — `OWNER VISUAL QA REQUIRED` |
| Exactly 8 / more than 8 (Similar) | Yes | `nat-ac7-similar-ladder.txt`/`nat-ac7-similar-visibility.txt` — both green, unmodified (§1 AC7) |
| Loading/skeleton state | Yes | §3 table — all three skeletons (`Featured`, `Latest`, `Similar`) now share their content's mode; `Featured`/`Latest` loading state not independently route-probed (client-side fetch resolves before Playwright's `networkidle`+1.5s settle in this session) — `OWNER VISUAL QA REQUIRED` for the visible loading→loaded transition, throttled |
| `/listings` with the sidebar open/closed | Yes | Not automated in this probe (the probe always measures the default, sidebar-closed `/listings` state) — `OWNER VISUAL QA REQUIRED` |
| Long `uk` titles at 320 | Partial | The probe ran in `uk` and captured no `pageOverflows` at 320/390 on any of the 3 routes/5 widths (hard-fail condition, none tripped) — full visual confirmation is `OWNER VISUAL QA REQUIRED` |
| RLS/authorization/data failure | No | No query/permission change |

## 3. The eight `mode` values (AC2)

| # | Surface | Before | Mode after | Matches D74-4? |
|---|---|---|---|---|
| 1 | `FeaturedListingsView.tsx` — loading skeleton | `SimpleGrid` | `rail` | Yes |
| 2 | `FeaturedListingsView.tsx` — real cards | `SimpleGrid` | `rail` | Yes |
| 3 | `LatestListingsView.tsx` — loading skeleton | `SimpleGrid` | `rail` | Yes |
| 4 | `LatestListingsView.tsx` — real cards | `SimpleGrid` | `rail` | Yes |
| 5 | `ListingsShellView.tsx` — grid view | `SimpleGrid` | `grid` | Yes (only `grid` consumer, D74-3/D74-4) |
| 6 | `RecentlyViewedGridView.tsx` | flex-rail/grid CSS module | `rail` | Yes |
| 7 | `SimilarListingsView.tsx` | flex-rail CSS module | `rail` | Yes |
| 8 | `ListingDetailView.tsx` — `SimilarListingsSkeleton` | `SimpleGrid` (4-up) | `rail` | Yes — now matches #7's content mode, closing the pre-existing layout-shift defect |

## 4. Image `sizes` — old and new, with the measured widths each is derived from

`src/lib/imageDelivery.ts` `LISTING_LAYOUT_SIZES`, before → after:

```diff
- 'default':  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
- '3-col-xl': '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
- 'sidebar':  '(min-width: 1280px) 28vw, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw',
- '4-col':    '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
+ 'default':  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',   (kept — see §8 AC4 note)
+ '3-col-xl': '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',   (kept — see §8 AC4 note)
+ 'card-track-grid': '(min-width: 640px) 360px, calc(100vw - 32px)',
+ 'card-track-rail': '(min-width: 374px) 280px, calc(82vw - 26px)',
```

**Measured widths the two new strings are derived from** (`runs/clean-2/card-width-parity.json`,
real `/`, `/listings`, `/listings/<slug>` routes, `next start`, `uk`, real Supabase data — NOT the
Task 806 standalone Storybook story, which had zero page gutters and would have produced a wrong
formula):

| Width | Rail first-card width (home + detail, identical) | Grid column width (`/listings`) | Grid column count |
|---|---|---|---|
| 320 | 236.16px | 288px | 1 |
| 390 | 280px | 358px | 1 |
| 768 | 280px | 352px | 2 |
| 1024 | 280px | 309.33px | 3 |
| 1440 | 280px | 316px | 4 |

Below 640px the container equals `viewport − 32px` (`.container-wide`'s <640px gutter, confirmed
exactly at 320/390: `320−32=288`, `390−32=358`). The rail clamp (`min(280px, 82% of container)`)
crosses over to the flat 280px cap at container ≈ 341px, i.e. viewport ≈ 374px — confirmed: 320px
measures 236.16 (clamp active), 390px measures exactly 280 (clamp maxed). `card-track-rail`'s
`calc(82vw - 26px)` reproduces `0.82×(vw−32)` (0.82×32≈26.24, rounded). `card-track-grid`'s 360px
is a safe upper bound for the ≥640px steps (measured max 352px @768) — a plain `sizes` `<length>`
cannot express the per-column-count container arithmetic exactly (no bare `%`, and the container's
own gutter/cap steps at 640/1024/1408px), but 360px stays inside the same `400w` `srcsetEntries`
bucket as every measured cell, so no candidate over-fetch results.

**AC4's exact quote — measured width vs. chosen candidate, one card at 390 and one at 1440**
(`srcsetEntries` for `variant="listing"`: 400w/640w/800w, `appImageConfig.ts:85-89`):

- **390, rail (Featured, home route):** measured `firstChildRectWidth` = **280.00px**. `sizes`
  resolves (390 ≥ 374 branch) to **280px**. Headless Chromium (DPR≈1) resolved `currentSrc` to the
  `w_400` candidate — the nearest `srcsetEntries` step ≥ 280, i.e. exactly one step above the exact
  measured width (`nat` = `runs/clean-2` cell `home/390/rails[0]`).
- **1440, grid (`/listings`):** measured `firstChildRectWidth` = **316.00px**. `sizes` resolves
  (1440 ≥ 640 branch) to **360px**. `currentSrc` resolved to the same `w_400` candidate — one step
  above both the 316px measured width and the 360px hint (`runs/clean-2` cell `listings/1440/
  grids[0]`).

## 5. AC6 — the probe's per-width equality statement

`runs/clean-2/card-width-parity.json` + `runs/reverted-clean-1/card-width-parity.json` (identical
numbers; `reverted-clean-1` is the two-armed proof's closing clean arm). Per width, the rail track
(the only mode measured on more than one route) reports the **same** `firstChildRectWidth` on
`home` (Featured + Latest, both entries) and `detail` (Similar):

| Width | home rail (Featured) | home rail (Latest) | detail rail (Similar) | Equal? |
|---|---|---|---|---|
| 320 | 236.15625 | 236.15625 | 236.15625 | ✅ |
| 390 | 280 | 280 | 280 | ✅ |
| 768 | 280 | 280 | 280 | ✅ |
| 1024 | 280 | 280 | 280 | ✅ |
| 1440 | 280 | 280 | 280 | ✅ |

The probe's own `parityMismatches` array is `[]` on both runs (exit 0). RecentlyViewed did not
render for the fresh, cookie-less Playwright browser context used for the `home`/`listings` route
cells (no viewing history yet at that point in the run) — it DID appear as the detail route's own
warm-up requirement is satisfied differently (two prior listing visits populate the cookie for
`SimilarListings`' own matching, not `RecentlyViewed`'s target-exclusion); only 1 rail (Similar)
was present on the detail route in every cell, confirmed in the raw JSON (`rails.length === 1`).
This is R7's "zero cards in a section" negative flow, not a defect — `RecentlyViewedGridView`
returns `null` when its query returns zero rows, exactly as it did before this task.

## 6. Two-armed proof (Q3 gate claim, kickoff §13)

All three runs cited below share the identical final probe script blob
`probeHash 9bfb3b6f3bdd0cba88983a85f468feac2cacfc8e` (confirmed — no script edit occurred between
them; Task 803's F8 discipline held).

1. **Clean arm** — `runs/clean-2/card-width-parity.json`: probe exit 0, `parityMismatches: []`,
   the corrected `LISTING_LAYOUT_SIZES` values visible in every cell's `imgSizes` field.
2. **Plant** — `src/modules/listings/components/FeaturedListingsView.tsx`'s real-cards track
   temporarily wrapped in a `<Box style={{ '--listing-card-min': '150px' }}>`, isolating the
   override to the Featured section only (pre-plant `git hash-object`
   `b47d31fce239fadb8d6ce073491674e08591c909`). `npm run build` rebuilt (exit 0,
   `nat-build-3-planted.txt`), server restarted, probed into a **fresh** `runId` `planted-1`:
   **exit 1**. `parityMismatches` names every mismatched viewport/route pair, e.g.
   `"viewport=390 route=home width=280.00 vs route=home width=150.00"` — the override is caught at
   every one of the 5 widths, both against the OTHER home rail (Latest) and against the detail
   route's Similar rail.
3. **Revert** — the `<Box>` wrapper removed; post-revert `git hash-object`
   `b47d31fce239fadb8d6ce073491674e08591c909` — **identical** to the pre-plant hash, proving the
   revert. `git status --porcelain` shows `FeaturedListingsView.tsx` with no diff against its
   pre-plant content (confirmed via the matching hash, not asserted).
4. **Re-probe (fresh arm)** — `npm run build` rebuilt again (exit 0, `nat-build-4-reverted.txt`),
   server restarted, probed into a **fresh** `runId` `reverted-clean-1`: exit 0, `parityMismatches:
   []`, numbers identical to the `clean-2` arm (§5 table).

## 7. Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/FeaturedListingsView.tsx` | R1/R2 — both `SimpleGrid`s (loading skeleton + real cards) replaced by `MantineListingCardTrack mode="rail"`; `layoutContext="card-track-rail"` added to the real-card `ListingCard` (previously passed none) |
| `src/modules/listings/components/LatestListingsView.tsx` | R1/R2 — same swap; `layoutContext="card-track-rail"` added (previously passed none) |
| `src/modules/listings/components/ListingsShellView.tsx` | R1/R2 — grid-view `SimpleGrid` replaced by `MantineListingCardTrack mode="grid"` inside a `Box pt="lg"` (the track has no style props, so the prior `pt="lg"` moves to a wrapping `Box`); `layoutContext` changed `'sidebar'` → `'card-track-grid'` |
| `src/modules/listings/components/RecentlyViewedGridView.tsx` | R1/R2/R3 — the CSS-module `.grid`/`.card` div pair replaced by `MantineListingCardTrack mode="rail"`; `layoutContext` changed `'4-col'` → `'card-track-rail'`; doc comment updated |
| `src/modules/listings/components/RecentlyViewedGridView.module.css` | R3 — deleted; its only rules were the card/track contract now owned by the shared track |
| `src/modules/listings/components/SimilarListingsView.tsx` | R1/R2/R3 — same swap as RecentlyViewedGridView; `layoutContext` changed `'4-col'` → `'card-track-rail'` |
| `src/modules/listings/components/SimilarListingsView.module.css` | R3 — deleted |
| `src/modules/listings/components/ListingDetailView.tsx` | R2 (§3.2 #8) — `SimilarListingsSkeleton`'s 4-up `SimpleGrid` replaced by `MantineListingCardTrack mode="rail"`, matching the real content's mode |
| `src/lib/imageDelivery.ts` | R4 — `ListingLayoutContext`/`LISTING_LAYOUT_SIZES`: two new measured, px-based `card-track-*` contexts added; `'sidebar'`/`'4-col'` removed (fully migrated); `'default'`/`'3-col-xl'` kept per §10.3's stop-and-report clause (see §1 AC4, §8) |
| `src/components/ui/useAdaptiveImageConfig.ts` | R4 — `DEFAULT_LISTING_LAYOUT_CONTEXT` comment updated for coherence with the new context names |
| `src/components/ui/AppImage.tsx` | Doc-comment coherence — `layoutContext` prop doc referenced the now-removed `'sidebar'`/`'4-col'` names |
| `docs/performance.md` | Doc — `layoutContext` usage table updated to the new contexts |
| `docs/component-catalog.md` | `MantineListingCardTrack` row's consumer list updated (806 → 807) |
| `src/stories/mantine/primitives/RecentlyViewedGridView.stories.tsx` | Doc-comment coherence — removed a stale reference to the deleted CSS module (the story itself is unchanged code, `reuse` disposition holds) |
| `scripts/task807-card-width-parity.mjs` | New evidence-only Playwright probe — real-route (`next start`) card-width parity + `sizes` capture; no `package.json` entry, not a CI gate |
| `docs/sessions/evidence/task807/` | Retained gate transcripts and probe run JSON |
| `docs/backlog.md` | Concise active-state update (this task's status) |
| `docs/sessions/2026-09-10-task807-every-card-surface-adopts-the-track.md` | This session log |

No file listed in the kickoff's §8 out-of-scope list was touched — `FavoritesShell.tsx`,
`ListingCard.tsx`, `MantineListingCardPattern`, `MantineListingCardTrack`/its CSS module,
`globals.css`, `theme.ts`, and every non-listing-card `SimpleGrid` named in §8 are absent from the
diff (confirmed by `git status --porcelain`, §... below, and the AC1 grep in §1).

## 7a. Validation evidence — commands and exit codes

All transcripts retained under `docs/sessions/evidence/task807/gates/`, each with `EXIT_CODE=`
captured inside the file per the transcript rule (no `Tee-Object`, `cmd.exe /c "<cmd> 2>&1"`
capture, `[System.IO.File]::WriteAllLines` with a no-BOM UTF8 encoding).

| Command | Transcript | Exit |
|---|---|---|
| `node.exe -p process.platform` | `nat-platform.txt` | 0 (`win32`) |
| `npx tsc --noEmit` (×2, before/after the sizes-string fix) | `nat-tsc.txt`, `nat-final-tsc.txt` | 0, 0 |
| `npm run lint` (×2) | `nat-lint.txt`, `nat-final-lint.txt` | 0, 0 (0 errors, 72 warnings — same pre-existing baseline as Task 806, none in a touched file) |
| `npm run check:stories` (×2) | `nat-check-stories.txt`, `nat-final-check-stories.txt` | 0, 0 |
| `npm run check:story-coverage` (×2) | `nat-story-coverage.txt`, `nat-final-story-coverage.txt` | 0, 0 (33 covered / 0 unproven both times) |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` (×2) | `nat-design-tokens.txt`, `nat-final-design-tokens.txt` | 0, 0 |
| `npx vitest run src/modules/listings` (×2) | `nat-vitest-listings.txt`, `nat-final-vitest-listings.txt` | 1, 1 — both times the SAME 2 pre-existing `ListingCard.smoke.test.tsx` archived-badge failures (Task 790's registered item; `ListingCard.tsx` untouched by this diff) |
| `npm run test` (full suite, ×2) | `nat-test-full.txt`, `nat-final-test-full.txt` | 1, 1 — both times **5 failed / 4 files**, exactly the Task 790-documented pre-existing red set (`css-var-resolvability.test.ts` — count unchanged at 297, this diff added no new `:root` token; `theme.d69-18.test.tsx`; `appimage-config-class-assertions.test.ts`, self-declared `BLOCKED`; `ListingCard.smoke.test.tsx` ×2) |
| `npx vitest run …SimilarListings.visibility.test.ts` | `nat-ac7-similar-visibility.txt` | 0 |
| `npx vitest run …SimilarListings.ladder.test.ts` | `nat-ac7-similar-ladder.txt` | 0 |
| `npx vitest run …ListingDetailView.buildSimilarListingsHref.test.ts` | `nat-ac7-buildhref.txt` | 0 |
| `npm run build` (×4 — initial, post-sizes-fix, planted, reverted) | `nat-build.txt`, `nat-build-2-sizes-fix.txt`, `nat-build-3-planted.txt`, `nat-build-4-reverted.txt` | 0, 0, 0, 0 |
| `npm run build-storybook` (×2) | `nat-build-storybook.txt`, `nat-final-build-storybook.txt` | 0, 0 |
| `npm run check:file-integrity` (×3 — pass 1, pass 2 pre-BOM-fix, pass 2 final) | `nat-file-integrity-1.txt`, `nat-final-file-integrity-2.txt`, `nat-final-file-integrity-3.txt` | 0, **1** (5 evidence `.txt` scratch files carried a stray PowerShell `Out-File` BOM — fixed in place, not a product defect), 0 |
| `npm run check:mojibake` (×3) | `nat-mojibake-1.txt`, `nat-final-mojibake-2.txt`, `nat-final-mojibake-3.txt` | 0, 0, 0 |
| `node scripts/task807-card-width-parity.mjs <runId> …` (real routes, `next start`) | `runs/clean-1` (pre-fix), `runs/clean-2` (cited), `runs/planted-1` (two-armed, failing arm), `runs/reverted-clean-1` (two-armed, closing arm) | 0, 0, 1, 0 |

`git --no-optional-locks status --porcelain` after every artifact above exists reconciles exactly
to §7's Files Changed table — no unexplained path (quoted in full at the end of this section):

```
 M docs/backlog.md
 M docs/component-catalog.md
 M docs/performance.md
 M src/components/ui/AppImage.tsx
 M src/components/ui/useAdaptiveImageConfig.ts
 M src/lib/imageDelivery.ts
 M src/modules/listings/components/FeaturedListingsView.tsx
 M src/modules/listings/components/LatestListingsView.tsx
 M src/modules/listings/components/ListingDetailView.tsx
 M src/modules/listings/components/ListingsShellView.tsx
 D src/modules/listings/components/RecentlyViewedGridView.module.css
 M src/modules/listings/components/RecentlyViewedGridView.tsx
 D src/modules/listings/components/SimilarListingsView.module.css
 M src/modules/listings/components/SimilarListingsView.tsx
 M src/stories/mantine/primitives/RecentlyViewedGridView.stories.tsx
?? docs/sessions/2026-09-10-task807-every-card-surface-adopts-the-track.md
?? docs/sessions/evidence/task807/
?? scripts/task807-card-width-parity.mjs
```

## 8. Implementation validation notes

**Finding 1 — R4/AC4's literal 2-value type is not achievable without widening scope (reported,
not silently resolved).** `src/lib/imageDelivery.ts`'s kickoff §10.3 gives the starting-point
snippet `export type ListingLayoutContext = 'card-track-grid' | 'card-track-rail'` and, in the same
paragraph, the exact stop condition this hits: *"If any consumer outside §7 references a removed
context name, stop and report — do not widen the diff."* `FavoritesShell.tsx:209` and
`ListingCard.stories.tsx:171` (the `FavoritesComposition` story — the canonical proof for that same
`FavoritesShell` composition) both pass `layoutContext="3-col-xl"`; neither file is in §7 or
touchable per §8 (`FavoritesShell` is reserved as Task 809). Removing `'3-col-xl'` from the type
would be a compile error in those two files; keeping the name but repointing its `sizes` string to
track-based geometry would silently change `FavoritesShell`'s real rendered `img sizes` attribute —
a behavior change to a file §8 explicitly forbids touching. The resolution taken: `'3-col-xl'` and
`'default'` (the implicit fallback for `ListingCard.stories.tsx`'s own `Default` story and
`ListingsShellView`'s untouched horizontal list variant) are kept, byte-identical to before this
task; only the two contexts with an actual `MantineListingCardTrack` consumer were added/derived.
Every requirement R4 states IS met for every in-scope surface (px-based, measured, no `vw`
fraction); what remains unmet is AC4's literal "the type names track modes [only]" phrasing.
**Recommend Opus decide:** accept this as satisfying R4's intent (matching Task 806's own AC7
precedent of a reported, reasoned deviation not blocking approval), or file a fast-follow once Task
809 lands to fully retire `'3-col-xl'`/`'default'`.

**Finding 2 — a second, un-enumerated skeleton has the SAME defect class as §3.2 #8 (not fixed,
reported).** `src/modules/listings/components/RecentlyViewedSection.tsx` exports its own
`RecentlyViewedSkeleton()` (the `<Suspense fallback>` for `RecentlyViewedSection` on the listing
detail route, wired at `ListingDetailView.tsx:523`) — a RAW-TAILWIND `flex gap-3 sm:grid
sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` / `w-48 shrink-0 sm:w-auto` markup, completely
independent of `RecentlyViewedGridView.module.css` (which this task deleted) and NOT named
anywhere in the kickoff's §3.2 table (which lists exactly 8 sites). After this diff,
`RecentlyViewedGridView`'s real content is a `rail` at every width (D74-3/D74-4), so this
skeleton — unlike #8, which this task DID fix — will still visibly re-lay-out (grid-of-columns →
rail) when its own Suspense boundary resolves, on the SAME route this task is already changing.
This is out of §7's enumerated scope (not one of the 8 named sites) and was not silently fixed;
flagged for Opus as a same-shape follow-up candidate (parallel to Task 806's flagged out-of-scope
file, §5 of that session log).

No defect was found or fixed within this task's own in-scope edits.

## 9. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token/style path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Featured/Latest rail (loading + real) | `FeaturedListingsView`/`LatestListingsView` | `MantineListingCardTrack_rail__*` | `--listing-card-min` (globals.css:393, untouched) | Change — was `SimpleGrid` | `git diff`; `runs/clean-2` |
| `/listings` grid | `ListingsShellView` | `MantineListingCardTrack_grid__*` | same token | Change — was `SimpleGrid` | `git diff`; `runs/clean-2` |
| RecentlyViewed/Similar rail | `RecentlyViewedGridView`/`SimilarListingsView` | `MantineListingCardTrack_rail__*` | same token | Change — was a per-file CSS module | `git diff`; both `.module.css` deleted |
| Similar-listings skeleton | `SimilarListingsSkeleton` (`ListingDetailView.tsx`) | `MantineListingCardTrack_rail__*` | same token | Change — was a 4-up `SimpleGrid` | `git diff`; matches #7's mode |
| `.similar-listings`/`.featured-listings`/`.latest-listings`/`.recently-viewed` wrappers, every `data-testid`, speculation-rules script, 8-item cap, `ViewAllLink` gate | `SimilarListings.tsx`, `FeaturedListingsView.tsx`, `LatestListingsView.tsx`, `RecentlyViewedGridView.tsx` | n/a | n/a | **Preserve, verbatim** | `git diff` shows no change to `SimilarListings.tsx`; wrapper `className`/`data-testid` lines untouched in the four Views (§1 AC7) |
| `ListingCard`'s own internals, `MantineListingCardTrack` and its CSS module | n/a | n/a | n/a | **Preserve, out of scope** | `git status --porcelain` — neither file appears |
| `FavoritesShell.tsx` | n/a | n/a | n/a | **Preserve, out of scope (Task 809)** | `git status --porcelain` — absent; confirmed in §8 Finding 1 |

## 10. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| All 8 card-surface swaps | Kickoff §3.4 names the canonical primitive already approved by Task 806 (`Patterns/Mantine/ListingCardTrack`) and each surface's own already-existing canonical story (`Mantine/Primitives/RecentlyViewedGridView`, `Mantine/Primitives/SimilarListingsView`, `Patterns/Mantine/HomepageListingGrids`, `Patterns/Mantine/ListingsShellView`) — all four statically import the real production component, so each re-renders through the track automatically; no story edit required | `MantineListingCardTrack` (`src/design-system/mantine/patterns/MantineListingCardTrack.tsx`) | `reuse` | `MantineListingCardTrack`'s own `mode="grid"`/`mode="rail"` className, consuming `--listing-card-min` (`globals.css:393`) — not copied locally anywhere in this diff |

## 11. Assumptions, deviations, and limitations

1. See §8 Finding 1 (R4/AC4 type-narrowing deviation, kickoff-anticipated) and Finding 2
   (`RecentlyViewedSkeleton`, out of scope, flagged not fixed).
2. **`ListingsShellView.tsx`'s `pt="lg"` moved to a wrapping `Box`.** `MantineListingCardTrack`
   accepts only `mode`/`children`/`className`/`data-testid` (§8 — read-only, not edited); the prior
   `SimpleGrid`'s `pt="lg"` spacing is preserved via a `<Box pt="lg">` wrapper around the track
   rather than dropped or duplicated as a raw value.
3. **RecentlyViewed did not render on the `home`/`listings` route probe cells** (fresh
   cookie-less browser contexts) — only the `detail` route's warm-up sequence (2 prior listing
   visits) populated enough state for `Similar` to render; `RecentlyViewed`'s own zero-history
   state is the pre-existing, unmodified "zero cards" branch (§5).
4. **One card / loading-state transition / sidebar-open `/listings` / uk-320 full visual
   confirmation are `OWNER VISUAL QA REQUIRED`** (§2 negative-flow table) — the automated probe
   covers geometry and `sizes`/`pageOverflows`, not a human visual read of every cell in the
   kickoff's §13 owner matrix.
5. `spacing="md"`/`"sm"`/`"lg"` differences across the three migrated surfaces collapse to the
   track's single `var(--mantine-spacing-md)` gap, exactly as the kickoff's §5 `ASSUMPTION
   (reversible, stated)` anticipated — visible as a spacing delta, not a defect.

## 12. Opus handoff

- Evidence root: `docs/sessions/evidence/task807/` — `gates/` (all standard-gate transcripts,
  `nat-*` prefix, each with `EXIT_CODE=` inside), `runs/clean-1` (pre-sizes-fix, superseded),
  `runs/clean-2` (post-sizes-fix, cited for AC4/AC6), `runs/planted-1` (two-armed proof, failing
  arm), `runs/reverted-clean-1` (two-armed proof, closing clean arm).
- **Decide Finding 1 (§8):** does the `'default'`/`'3-col-xl'` retention satisfy R4, or does it
  need a named follow-up once Task 809 lands?
- **Decide Finding 2 (§8):** file `RecentlyViewedSkeleton` (`RecentlyViewedSection.tsx`) as a
  numbered follow-up, or fold it into 807 as a revision — it is a measured, currently-shipping
  layout-shift defect on the same route this task already changed, same shape as the #8 fix this
  task DID make.
- Native platform confirmed and retained: `gates/nat-platform.txt` → `win32`, `EXIT_CODE=0` — every
  gate transcript in `gates/` was produced in the same native Windows PowerShell session.
- `nat-test-full.txt`/`nat-final-test-full.txt` both show the identical Task 790-documented
  pre-existing red set (5 failed / 4 files) — none of the four failing files is touched by this
  diff.

## 13. Backlog update

`docs/backlog.md` — Task 807 row updated from `KICKOFF FILED` to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, pointing at this session log; Sprint 74's row
updated to reflect 807's state and the two findings above. File stays within its existing line
budget (no `BACKLOG LIMIT BREACH`).

## Self-validation

`Self-validation: tsc=0 errors · build=passes (exit 0, ×4 rebuilds across the sizes-fix + plant/revert cycle) · AC table=6/7 fully green, AC4 green-with-flagged-deviation (kickoff-anticipated, explicitly reported per §10.3's own stop-and-report clause) · runtime evidence=real-route Playwright probe PASS (clean ×2 + two-armed proof) · scope=clean (git status --porcelain matches §7 exactly, no out-of-scope file touched) · integrity=PASS (pass 1 below; pass 2 after this log + backlog exist)`
