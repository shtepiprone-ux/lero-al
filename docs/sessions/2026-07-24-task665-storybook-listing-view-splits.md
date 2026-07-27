# Session Log — Task 665: Storybook listing/grid story cleanup via Container/Presentational View splits

**Date:** 2026-07-24
**Kickoff:** `tasks/kickoff_prompt_Task_665_Storybook_Listing_Story_Cleanup_View_Splits.md`
**QA profile:** Q3 Full Visual Matrix.
**Status:** `PARTIALLY IMPLEMENTED` — all code/story/deletion requirements are implemented and evidenced; the
§13.7 pre/after live-route byte-identical DOM/computed-style baseline (AC1, AC8) could not be captured in this
sandbox (no routable dev server, no frozen/seeded local/test Supabase DB, no browser automation tool available).
Per the kickoff's own instruction ("no fixture/stand-in fallback... return `PARTIALLY IMPLEMENTED`"), this is
reported honestly rather than claimed.

**Owner-added requirement (this session, verbal amendment to the kickoff):** in the loaded `Default` stories for
`FeaturedListings`/`LatestListings`, `favoriteIds` must contain at least one fixture listing id and a fixed
signed-in `AuthContext.Provider` must be used, so the real favorited path renders (not only the guest button look).
Implemented — see §5.

**§16 update (2026-07-24, second executor pass — post-review revision):** the orchestrator's review found the
first pass's governance gate broken (`governance:screenshots` failing on the deleted `ListingGrid.stories.tsx`
existence guard) and that R12/AC8/§13.7 asserted unverifiable/false conditions. Kickoff §16 (R13, R14, §16.1,
§16.4) is now fully implemented and evidenced — see §13 below. The §13.7 pre/after live-route byte-identical
DOM/computed-style baseline (AC1, AC8) remains the one unmet requirement, still blocked on the same sandbox
limitations as the first pass (no routable dev server, no frozen/seeded local/test Supabase DB, no browser
automation tool). Status remains `PARTIALLY IMPLEMENTED` for that reason alone — every in-repo gate now passes.

## 1. Summary

Split each of the 4 data/auth-bearing containers (`FeaturedListings`, `LatestListings`, `RecentlyViewedGrid`,
`SimilarListings`) into a container (keeps hooks/query) + a new sibling `*View.tsx` presentational component
(receives everything via props, no hooks/network/auth). Rebuilt the 4 `System/*` stories to statically import the
real Views with a fixed `CardListingData[]` fixture (new `src/stories/fixtures/cardListingData.fixture.ts`, reusing
existing `storybook.listing.grid_0..7` message keys — no new i18n keys). Deleted the fake-card cluster
(`StoryListingCard.tsx`, `System/ListingGrid` story) and the unused `MantineCardGrid` pattern + its story + barrel
exports + doc/comment mentions.

## 2. Files Changed

| File | Change |
|---|---|
| `src/modules/listings/components/FeaturedListingsView.tsx` | NEW — presentational View (props: listings, loading, rates, displayCurrency, favoriteIds, locale); owns `CardSkeleton` internally (not exported — no external consumer needs it once stories drive `loading:true`). |
| `src/modules/listings/components/FeaturedListings.tsx` | Container now only computes hooks (`useFeaturedListings`, `useLocale`, `useExchangeRate`, `useAuth`) and renders `<FeaturedListingsView …/>`. Public API (`favoriteIds` prop) unchanged. |
| `src/modules/listings/components/LatestListingsView.tsx` | NEW — presentational View (props: listings, loading, rates, displayCurrency, favoriteIds); owns `RowSkeleton` internally. |
| `src/modules/listings/components/LatestListings.tsx` | Container now only computes hooks and renders `<LatestListingsView …/>`. Public API unchanged. |
| `src/modules/listings/components/RecentlyViewedGridView.tsx` | NEW — presentational View (props: listings, rates, displayCurrency, showEmptyState, clearSlot). |
| `src/modules/listings/components/RecentlyViewedGrid.tsx` | Container now only computes `useExchangeRate`/`useAuth` and renders `<RecentlyViewedGridView …/>`. Public API (`listings`/`showEmptyState`/`clearSlot`) unchanged. |
| `src/modules/listings/components/SimilarListingsView.tsx` | NEW — presentational View (props: heading, listings, rates, displayCurrency), no `useTranslations` (server container passes the translated heading). |
| `src/modules/listings/components/SimilarListings.tsx` | Server container keeps query/headers/speculation-script + the `.similar-listings` wrapper div, renders `<SimilarListingsView …/>` inside it (keeps the speculation `<script>` a sibling inside the same wrapper — byte-identical DOM order to the pre-split render). |
| `src/stories/fixtures/cardListingData.fixture.ts` | NEW — `makeCardListingFixtures(locale): CardListingData[]`, 8 fixed listings, reuses `storybook.listing.grid_0..7` keys. |
| `src/stories/FeaturedListings.stories.tsx` | Rebuilt: statically imports `FeaturedListingsView`; `Default`/`LocaleStress` wrap `<AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>` (fixed signed-in fixture, same mechanism as `ListingCard.stories.tsx`) and mark `listings[0]` favorited; `Loading`/`Empty` pass `loading:true`/`listings:[]` to the same View. |
| `src/stories/LatestListings.stories.tsx` | Same rebuild pattern for `LatestListingsView`. |
| `src/stories/RecentlyViewedSection.stories.tsx` | Rebuilt: statically imports `RecentlyViewedGridView` + the real `ClearRecentlyViewedButton` as `clearSlot` (no stub). No favorite fixture — production never wires `isFavorited` for this surface (see §7 negative-flow table). |
| `src/stories/SimilarListings.stories.tsx` | Rebuilt: statically imports `SimilarListingsView`; heading resolved via `storyT(locale, 'listing.similar_listings')` — the same real production message key the server container passes. |
| `src/stories/ListingGrid.stories.tsx` | DELETED (R7). |
| `src/stories/StoryListingCard.tsx` | DELETED (R8) — after `rg "StoryListingCard" src` confirmed 0 importers post-comment-cleanup. |
| `src/app/globals.css` | Removed the comment-only `StoryListingCard` mention (line 228). |
| `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` | Removed the comment-only `StoryListingCard.tsx` mention (line 22). |
| `src/design-system/mantine/patterns/MantineCardGrid.tsx` | DELETED (R9) — zero production consumers. |
| `src/stories/patterns/mantine/CardGrid.stories.tsx` | DELETED (R9) — its story. |
| `src/design-system/mantine/patterns/index.ts` | Removed `MantineCardGrid`/`CardGridItem` barrel exports. |
| `src/design-system/mantine/theme.ts` | Removed `MantineCardGrid` from the "4 existing pattern consumers" comment list (line ~708, now 3). |
| `docs/mantine-responsive-design-system.md` | Removed the `MantineCardGrid` catalog row (414) and story-coverage-table row (647); removed the dangling `MantineCardGrid` migration-target mentions in the `page.tsx`/`listings/page.tsx` and 3 story rows (486, 487, 511–514) — replaced with "grid pattern TBD" (no new architecture invented) and updated the 3 story rows' Storybook-status column to reflect the real View import. |
| `scripts/check-stories-rendered.mjs` | **Self-review fix (not in original kickoff scope):** removed the `system-listinggrid--default` (`ListingGrid/Default`) entry from `ASSERT_STORIES` — left in place after deleting the story it pointed to, it produced 12 spurious FAILs (story-not-found) in every `screenshots:assert` run. Updated the `// ── System (5) ──` count comment to 4. |

`listing.fixture.ts` (`src/stories/fixtures/listing.fixture.ts`) is now orphaned (its only consumer, `StoryListingCard.tsx`, is deleted) but was **not** deleted — not named by the kickoff's R7/R8/R9 deletion list, so left for an explicit owner/orchestrator decision (flagged in §9).

## 3. Current vs required behavior

**Current (before):** `System/FeaturedListings`/`LatestListings`/`RecentlyViewedSection`/`SimilarListings`/`ListingGrid`
`Default` states rendered `StoryListingCard` (a shadcn re-implementation of `ListingCard`) — divergent stand-ins;
`MantineCardGrid` was unused dead code.

**Required (after):** each of the 4 surfaces renders its real production View in Storybook (fixed `CardListingData`
fixtures + fixed `AuthContext.Provider` where favorite state is exercised); production output of each container is
byte-identical (container→View split only, no restyle); `ListingGrid`, `StoryListingCard`, and the `MantineCardGrid`
cluster are gone; no mocks/aliases introduced.

## 4. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility/token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Featured grid + header | `FeaturedListingsView` (was inline in `FeaturedListings`) | `.featured-listings grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4` | Tailwind utilities, unchanged | **Preserve verbatim** — moved, not restyled | Diff: identical JSX/classes moved from container to View |
| Featured skeleton | `CardSkeleton` (moved into View) | `rounded-xl border bg-card overflow-hidden` + Mantine `Skeleton` | Mantine `Skeleton` + existing Tailwind card classes | **Preserve verbatim** | Diff: byte-identical function body relocated |
| Latest grid | `LatestListingsView` | `.latest-listings grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3` | Tailwind utilities, unchanged | **Preserve verbatim** | Diff |
| Latest skeleton | `RowSkeleton` (moved into View) | same as before | Mantine `Skeleton` | **Preserve verbatim** | Diff |
| Recently-viewed grid | `RecentlyViewedGridView` | `.recently-viewed`, `flex … sm:grid sm:grid-cols-2 … lg:grid-cols-4` | Tailwind utilities, unchanged | **Preserve verbatim** | Diff |
| Similar-listings grid | `SimilarListingsView` (heading+grid only) | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4` | Tailwind utilities, unchanged | **Preserve verbatim** | Diff |
| `.similar-listings` wrapper + speculation `<script>` | Stays in `SimilarListings.tsx` (server container) | `.similar-listings` | n/a | **Preserve** — kept in container so the View split doesn't move the script out of its original parent (DOM-order safety) | Diff |
| `ListingCard` internals (badges, price block, favorite button, copy-id) | Unchanged — `ListingCard`/`MantineListingCardPattern` | n/a | n/a | **Out of scope, unchanged** (kickoff §8 KEEP) | No diff in these files |

## 5. Canonical UI decision record

| Changed visible artifact | Search performed | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| Signed-in favorited-card fixture mechanism (Default stories, owner-added requirement) | Read `src/stories/mantine/primitives/ListingCard.stories.tsx` (cited by kickoff §3.3 as the template) | `AuthContext.Provider` (`@/modules/auth/context/AuthContext`) + fixed `User`/`ExchangeRates` fixture | **Reuse** — identical mechanism copied into `FeaturedListings.stories.tsx`/`LatestListings.stories.tsx` (not shared via a new module — `ListingCard.stories.tsx` is explicitly KEEP/out-of-scope, and no existing shared auth-fixture module exists; duplicating the same ~30-line fixture object matches the established per-file convention) | `AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}` |
| Grid/skeleton Tailwind classes | Diffed byte-for-byte against the pre-existing container source | The containers themselves (already-established production markup) | **Reuse verbatim** — no new value invented, no restyle | Moved as-is into the new Views |
| `RecentlyViewedGridView` clear-history slot | Grepped `ClearRecentlyViewedButton` production usage in `RecentlyViewedSection.tsx` | `@/modules/listings/components/ClearRecentlyViewedButton` (real production component) | **Reuse** — statically imported in the story, replacing the old fake `StoryClrButton` stub | `clearSlot={<ClearRecentlyViewedButton />}` |

No new visible artifact, primitive, or raw style value was created by this task — it is a mechanism-only split, per
kickoff §1/§8.

## 6. Requirement / acceptance-criteria evidence

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R1 | `FeaturedListingsView` extracted; container renders it; byte-identical | VERIFIED (static) | `src/modules/listings/components/FeaturedListingsView.tsx` + `FeaturedListings.tsx`; JSX/classes identical to pre-split, only relocated |
| R2 | `LatestListingsView` extracted; container renders it | VERIFIED (static) | same files |
| R3 | `RecentlyViewedGridView` extracted; container keeps `useAuth`/`useExchangeRate` | VERIFIED (static) | `RecentlyViewedGridView.tsx` / `RecentlyViewedGrid.tsx` |
| R4 | `SimilarListingsView` extracted; no `useTranslations`; server container passes heading, keeps query/headers/speculation | VERIFIED (static) | `SimilarListingsView.tsx` has no `useTranslations` import; `SimilarListings.tsx` passes `t('similar_listings')` |
| R4a | No View→container cycle; skeletons live in the View | VERIFIED | `rg "from '\./FeaturedListings'\|from '\./LatestListings'"` inside the two View files → 0; `CardSkeleton`/`RowSkeleton` are private functions inside the Views |
| R5 | Stories statically import the exact View; fixed `AuthContext.Provider` where favorite state shown; Default renders loaded grid | VERIFIED | 4 rebuilt story files; `AuthContext.Provider` used in Featured/Latest (favorite state applicable) — see §7 for why RVS/Similar are N/A |
| R6 | Fixed `CardListingData[]` fixture, no `StoryCardData` UI | VERIFIED | `cardListingData.fixture.ts`; `tsc` clean |
| R7 | `System/ListingGrid` deleted | VERIFIED | file removed; confirmed absent from rebuilt `storybook-static/index.json` |
| R8 | `StoryListingCard` deleted only after `rg`=0 | VERIFIED | `rg "StoryListingCard" src` → 0 (transcript §8 below) |
| R9 | `MantineCardGrid` cluster deleted; `rg` → session-logs-only | VERIFIED | `rg "MantineCardGrid"` repo-wide → only `docs/sessions/*` and `tasks/kickoff_prompt_Task_{482,550,644}...` (historical task records, not the governance doc) remain (transcript §8) |
| R10 | Views not added to `mantine-migration-scope.json`; no `--mantine-only` claim | VERIFIED | `git diff scripts/mantine-migration-scope.json` → empty |
| R11 | `tsc --noEmit` clean; `build` exit 0 | VERIFIED | transcripts §8 |
| R12 | Full `screenshots:assert` PASS 0-new-FAIL for the 4 stories; `check:story-coverage`/`check:stories` pass; **pre/after route-parity baseline** | **PARTIALLY VERIFIED** — rendered-proof done and clean (§8); route-parity baseline NOT captured (no dev server/DB/browser tool in this sandbox) |
| AC1 | Byte-identical production route output before/after (§13.7 matrix) | **NOT VERIFIABLE in this sandbox** — see §9/§10 owner-native handoff |
| AC2 | Stories import exact View, Default shows loaded grid, fixed `AuthContext.Provider` for favorite state | VERIFIED |
| AC3 | Fixtures typed `CardListingData`; no `StoryListingCard`/`StoryCardData` in any story | VERIFIED — `tsc` clean, `rg` 0 |
| AC4 | `ListingGrid` deleted; `rg "StoryListingCard"` → 0 | VERIFIED |
| AC5 | `rg "MantineCardGrid"` → only historical session-log matches | VERIFIED |
| AC6 | No new `mantine-migration-scope.json` entries | VERIFIED |
| AC7 | `tsc` clean; `build` exit 0 | VERIFIED |
| AC8 | Full `screenshots:assert` PASS 0 new FAIL + route-parity baseline | **PARTIALLY VERIFIED** — screenshots:assert evidenced clean; route-parity baseline not captured |

## 7. Positive / negative flows

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Favorited-card render (signed-in) — Featured/Latest | Yes | Fixed `AuthContext.Provider` + `favoriteIds` containing a fixture id renders the real `FavoriteButton` filled state | `FeaturedListings.stories.tsx`/`LatestListings.stories.tsx` `Default`/`LocaleStress` |
| Favorited-card render — RecentlyViewedGrid/SimilarListings | **No** — production never passes `isFavorited` to `ListingCard` on these two surfaces (verified in `RecentlyViewedGrid.tsx`/`SimilarListings.tsx` pre-existing code: the `ListingCard` calls there omit the prop, defaulting to `false`) | N/A — adding favorite wiring here would be new behavior, out of scope | Source inspection, both container files |
| Loading state (Featured/Latest) | Yes | Real View's own loading branch renders the skeleton grid, no fake markup | `Loading` story passes `loading:true` to the real View |
| Empty state (Featured/Latest/RVS) | Yes | Real View's own empty branch | `Empty`/`EmptyState` stories pass `listings:[]` |
| `StoryListingCard` still imported somewhere | Yes (gate) | Must be 0 before deletion | `rg` transcript §8 |
| `MantineCardGrid` referenced outside session logs | Yes (gate) | Must be 0 outside session logs | `rg` transcript §8 |
| Deleted-story dangling harness registration | Yes (found, not in original scope) | A hardcoded `ASSERT_STORIES` entry pointing at a deleted story must not silently break the rendered-proof gate | Found via first `screenshots:assert:fast` run (12/12 fail on `ListingGrid/Default`); fixed in `check-stories-rendered.mjs` (§2); confirmed 0 fails after fix (§8) |

## 8. Validation evidence

1. **`rg "StoryListingCard" src`** — before: 8 hits (UI + 2 comment-only + 4 real importers). After comment cleanup
   + deletion: **0 hits** (re-run confirmed).
2. **`rg "MantineCardGrid"`** (repo-wide) — before: 7 files incl. `docs/mantine-responsive-design-system.md` (6 rows)
   and `theme.ts`. After: **only historical files remain** — `tasks/kickoff_prompt_Task_{482,550,644,665}...md` and
   `docs/sessions/{2026-06-24-task482,2026-07-05-task550,2026-07-20-task644}...md`. `docs/mantine-responsive-design-system.md`
   and all `src/` files → 0.
3. **`npx tsc --noEmit`** → exit 0, no output.
4. **`npm run check:story-coverage`** → `✅ PASSED — 8/8 covered` (manifest unchanged, Views correctly not enrolled).
5. **`npm run check:stories`** → `✅ PASSED — 124 files checked, 0 violations` (all 14 checks, incl. storybook.*
   key parity 636/636/636/636 across sq/en/uk/it).
6. **`npm run build`** → `✓ Compiled successfully`, 40/40 static pages generated, exit 0.
7. **`npm run build-storybook`** → rebuilt `storybook-static/` (the first `screenshots:assert:fast` run had been
   against a **stale pre-change build** still containing the deleted `ListingGrid` story — caught via cross-checking
   `storybook-static/index.json`, rebuilt, and the assertion re-run against the fresh build. This is documented as
   a self-review finding, §10).
8. **`npm run screenshots:assert:fast`** (final, post-fix run): `1791/2080 PASS, 219 FAIL, 12 OUT-OF-RANGE, 58 AMBIGUOUS`
   — **219 FAIL matches the pre-existing baseline exactly** (per Task 663/664 session logs); **zero** matches for
   `FeaturedListings`/`LatestListings`/`RecentlyViewedSection`/`SimilarListings`/`ListingGrid` in the failed-cells
   list — the 4 rebuilt stories and the deletion both introduce 0 regressions. (First run against the stale build
   showed 220/231 FAIL incl. 12 spurious `ListingGrid/Default` fails from the dangling harness registration — not
   real evidence, superseded by this run.)
9. **`npm run check:file-integrity`** → `✅ PASSED — 23 file(s) clean` (git-changed + untracked, incl. the
   `check-stories-rendered.mjs` fix).
10. **`npm run check:mojibake`** → **crashed** (`ENOENT` reading `src/design-system/mantine/patterns/MantineCardGrid.tsx`)
    — this script enumerates via `git ls-files` (tracked set), not the live filesystem; since Sonnet cannot run
    `git rm`/`git add` (owner-only mutating git), the deleted-but-still-git-tracked files break its file read. Not
    a defect in the diff — `check:file-integrity` (which correctly scans git-changed + untracked, tolerant of
    deletions) already passed clean on the same file set. Owner-native re-run after staging, see §10.

## 9. Assumptions, deviations, limitations

- **A1/A2/A3 (kickoff §5)** applied as written: `useTranslations` lives in the client Views (not `SimilarListingsView`,
  which takes `heading` as a prop); skeletons moved into the Views; favorite/`AuthContext.Provider` only where the
  surface actually exercises favorite state.
- **Deviation (justified):** `SimilarListingsView` does not include the `.similar-listings` wrapper div or the
  speculation-rules `<script>` — both stay in the server container (`SimilarListings.tsx`), which now renders
  `<div className="similar-listings"><SimilarListingsView …/>{script}</div>`. This preserves the exact pre-split DOM
  child order/count under `.similar-listings` (byte-identical structurally); giving the View the wrapper instead
  would have forced the script to become an external sibling, changing `.similar-listings`'s child count — a
  concrete parity risk the kickoff's own AC1 forbids.
- **`listing.fixture.ts` now orphaned** (zero consumers after `StoryListingCard.tsx` deletion) — not deleted; not
  named by R7/R8/R9, left for an explicit owner/orchestrator decision rather than unrequested cleanup.
- **Found + fixed (not originally in kickoff scope):** `scripts/check-stories-rendered.mjs`'s `ASSERT_STORIES` had a
  hardcoded `system-listinggrid--default` entry pointing at the deleted story — left in place it would have
  permanently broken `screenshots:assert` (12 spurious FAILs every run). Removed; verified 0 residual fails.
- **Found, NOT fixed (flagged for the owner/orchestrator — out of this task's explicit R7 scope and QA-profile
  command list):** three more tooling references to the deleted `ListingGrid` story remain stale:
  `scripts/responsive-screenshots.mjs` (4 `system-listinggrid--*` capture-matrix entries + a `ListingGrid.stories.tsx`
  existence check used by `--check` mode), `scripts/governance/component-catalog.mjs` (a `'ListingGrid'` string in
  a `SCREENSHOT_TARGETS` set + several generated-report prose lines), and
  `scripts/governance/tailwind-entropy.allowlist.json` (one allowlist entry citing the deleted file path). None of
  these are invoked by this task's Q3 validation plan (§13) or by any command run in §8, so they were left
  untouched per the P0 "change only what the task requires" rule rather than expanded as drive-by cleanup.
- **AC1/AC8 route-parity baseline: NOT captured.** This sandbox has no routable dev server, no frozen/seeded
  local/test Supabase DB, no test-user session, and no browser-automation tool available to this executor session —
  none of the prerequisites the kickoff's §13.7 procedure requires. Per the kickoff's explicit instruction, this is
  reported as missing evidence rather than assumed clean; see §10 for the exact owner-native procedure.

## 10. Owner-native validation handoff

**1. Route-parity baseline (§13.7, selectors corrected per kickoff §16.1) — REQUIRED for AC1/AC8, not run (no dev
server/DB/browser in this sandbox):**

`.similar-listings` and `.recently-viewed` remain valid raw `document.querySelector()` selectors. `.featured-listings`
and `.latest-listings` do **NOT** — those classes exist only in each View's loading branch, not the loaded grid
route-parity actually captures, and the grid's own Tailwind classes contain digit-leading tokens (`2xl:grid-cols-4`)
that throw `SyntaxError` if used as a raw CSS selector. Use the kickoff §16.1 JS locator predicate instead (no
`data-*` attribute added to production DOM — these classes are byte-stable before/after the split):

```js
// Featured (/{locale}) — inside the Featured MantineHomeSection (page.tsx:42)
const featured = Array.from(document.querySelectorAll('div.grid')).find(
  (el) =>
    ['grid-cols-1', 'sm:grid-cols-2', 'xl:grid-cols-3', '2xl:grid-cols-4', 'gap-4']
      .every((className) => el.classList.contains(className)) &&
    el.querySelector('.listing-card'),
)

// Latest (/{locale}) — inside the Latest MantineHomeSection (page.tsx:47)
const latest = Array.from(document.querySelectorAll('div.grid')).find(
  (el) =>
    ['grid-cols-1', 'md:grid-cols-2', '2xl:grid-cols-3', 'gap-3']
      .every((className) => el.classList.contains(className)) &&
    el.querySelector('.listing-card'),
)
```

```powershell
# 1. On a branch/checkout BEFORE this diff (or use git stash), start a local dev server against a frozen/seeded
#    local or test Supabase project, then capture getComputedStyle + DOM (element count/order/classes,
#    grid-template-columns, gap, padding/margin, background) for each §13.7 matrix cell — using the JS locator
#    predicate above for Featured/Latest, raw selectors for Similar/RecentlyViewed:
npm.cmd run dev
# In a second terminal / browser devtools, for each locale (sq/en/uk/it) x viewport
# (375/768/1440/1536/1920) x surface (featured/latest via the predicate above, .similar-listings, .recently-viewed
# on both /{locale}/listings/{FIXED_SLUG} and /{locale}/cabinet), record the computed style + DOM snapshot.
# 2. Apply this diff (or move back to this branch), restart the dev server, repeat the capture identically.
# 3. Diff the two snapshot sets — expect 0 differences. Record the exact {FIXED_SLUG}, test-user session id,
#    seeded rv_listings ids, and DB freeze/seed/teardown steps in the session log per the kickoff's §13.7/§14 contract.
```

Expected result: 0 diffs across all matrix cells (structural mechanism-split only, no restyle).

**2. `check:mojibake` — blocked by tracked-but-deleted files (resolves after the owner stages this diff's deletions):**

```powershell
npm.cmd run check:mojibake
```

Expected result after `git add` stages the 4 deletions (`MantineCardGrid.tsx`, `ListingGrid.stories.tsx`,
`StoryListingCard.tsx`, `CardGrid.stories.tsx`): exit 0, no artifacts (all touched files are plain ASCII/UTF-8
source; `check:file-integrity` already confirmed encoding cleanliness on the same file set).

## 11. Opus handoff

- Evidence locations: this session log (§8) for command transcripts; `.screenshots/rendered-assert/2026-07-23T21-20/`
  and `.../2026-07-23T21-3x/` (the corrected + final confirmation runs) for rendered PNGs/manifest.
- Key risk to inspect: the `SimilarListings.tsx` wrapper-div decision (§9 deviation) — please independently confirm
  the `.similar-listings` DOM child order is unchanged by reading the diff directly.
- Please decide: (a) whether `listing.fixture.ts` should be deleted in a follow-up task now that it is orphaned,
  and (b) whether the 3 stale `ListingGrid` tooling references found in §9 warrant a follow-up task.
- This task cannot be approved as fully `IMPLEMENTED` — AC1/AC8's route-parity requirement is unmet pending the
  owner-native capture in §10.

## 13. §16 post-review revision — R13, R14, §16.1, §16.4 (second pass, 2026-07-24)

### 13.1 R13 — re-pointed ListingGrid screenshot-governance coverage (not just deleted)

| Sub | What was done | Evidence |
|---|---|---|
| R13.1 | The 4-column responsive-grid proof is re-pointed at `System/FeaturedListings/Default` (the surviving story's single export — no `--desktop`/`--mobile`/etc IDs exist for it, per the kickoff's explicit warning). Coverage preserved: desktop-1280/1440, huge-2560, mobile-320/375, and the `uk` stress cell — same viewport/locale set as the 4 deleted `system-listinggrid--*` entries. | `scripts/responsive-screenshots.mjs` diff |
| R13.2 | Replaced the 4 `system-listinggrid--*` `STORY_TARGETS` entries (was lines ~99-102) with 4 entries all using story ID `system-featuredlistings--default` (only `label`/`viewports`/`locales` differ — the story has one `Default` export, no invented `--desktop`/`--mobile` IDs). Replaced the `existsSync(... 'ListingGrid.stories.tsx')` existence guard (`--check` mode, was line ~159) with `FeaturedListings.stories.tsx`. | `git diff scripts/responsive-screenshots.mjs` |
| R13.3 | `scripts/governance/component-catalog.mjs` `SCREENSHOT_TARGETS` (was line ~132): `'ListingGrid'` → `'FeaturedListings'` — the token the generator derives from a story's filename (`basename(rel,'.tsx').replace('.stories','')`), confirmed NOT `'FeaturedListingsView'` (verified by reading `analyzeFile()`'s `name` computation before editing). Updated the 3 generated matrix/prose rows referencing `listinggrid`/`system-listinggrid--*` (was ~442/460/463/465) to `featuredlistings`/`system-featuredlistings--default`. | `git diff scripts/governance/component-catalog.mjs` |
| R13.4 | Removed the `tailwind-entropy.allowlist.json` entry (was line ~198) citing the deleted `src/stories/ListingGrid.stories.tsx` (`text-[10px]` photo-count-badge exemption). Verified no surviving file (incl. the 4 rebuilt stories) uses that pattern, so nothing needed re-pointing — the entry was purely dead. `node -e "JSON.parse(...)"` confirmed the file is still valid JSON after the edit. | `git diff scripts/governance/tailwind-entropy.allowlist.json`; `rg "text-\[10px\]" src/stories src/modules/listings/components` → 0 |
| R13.5 | `npm run catalog:components -- --write` → regenerated `docs/component-catalog.md`, `docs/component-coverage-matrix.md`, `docs/component-risk-register.md`. Reviewed the diff: the Storybook-coverage table's `system-listinggrid--*` row → `system-featuredlistings--default`; the breakpoint-coverage prose (`listinggrid`→`featuredlistings`, `listinggrid-huge`→`featuredlistings-huge`) updated as expected. The rest of the large diff (many unrelated primitive/story rows shifting) is pre-existing drift since this doc's last generation (2026-05-28, per its own header) — not caused by this task; confirmed by reading the full diff before accepting it. | `git diff docs/component-coverage-matrix.md` |
| R13.6 | Updated every **current** doc naming `ListingGrid`/`system-listinggrid--*` as a live target: `docs/storybook-governance.md` (§6 reference stories, folder-tree example, §Global-category-coverage System list), `docs/responsive-storybook-inventory.md` (top per-file inventory table + detailed per-story audit table — both rows, file/ID/notes replaced; deliberately left the deeper Task-412-dated (2026-06-08) point-in-time discovery-count block, e.g. "43 total"/"45 ASSERT_STORIES IDs", untouched as historical audit-run output, same rationale as not editing session logs — a full resync of that count block is a pre-existing multi-task drift problem, not something this task's ListingGrid deletion created), `docs/responsive-screenshot-matrix.md` (§ System Stories table 4 rows, §6 huge-desktop row, §7 locale-stress row, §8 filename example), `docs/responsive-screenshot-governance.md`, `docs/maintenance-playbook.md`, `docs/governance-enforcement.md` (all 3: filename-example line). `docs/component-coverage-matrix.md` covered by R13.5's regen. Confirmed `docs/governance-enforcement.md` had exactly the 1 filename-example hit (no other refs). Did NOT edit `docs/sessions/*`, `docs/governance-reports/*`, `docs/chat-gpt-reports/*`, or `docs/backlog.md`'s historical Last-Session narrative (immutable history). | `grep -rl "ListingGrid\|listinggrid" docs/` before/after (transcript below) |
| R13.7 | Fresh `npm run build-storybook` (48s, succeeded). Confirmed via `storybook-static/index.json`: `system-featuredlistings--default` present (title `System/FeaturedListings`, name `Default`), `system-latestlistings--default` and `system-similarlistings--default` also present, `system-listinggrid--*` absent (0 matches). Ran the real capture (`npm run screenshots:responsive`, fast 6-viewport matrix): `✅ Captured 296 screenshots (0 failed)`. Confirmed `system-featuredlistings--default__uk__*.png` (incl. `tablet-768` from the base fast matrix) and `system-featuredlistings--default__*__huge-2560.png` (en/it/sq/uk) all present in `.screenshots/responsive/2026-07-24/`. | index.json grep transcript below; `.screenshots/responsive/2026-07-24/` file listing |
| R13.8 | `npm run governance:screenshots` → `✅ Screenshot infrastructure ready.` exit 0. `npm run governance:components` → `✅ Component catalog infrastructure ready.` exit 0. | Transcripts below |

**`grep -rl "ListingGrid" docs/` — before (31 files) → after:** `docs/storybook-governance.md`, `docs/responsive-screenshot-matrix.md`, `docs/responsive-screenshot-governance.md`, `docs/maintenance-playbook.md`, `docs/governance-enforcement.md` all now 0 live-target hits. `docs/responsive-storybook-inventory.md` retains only the deliberately-untouched historical Task-412 count block (see R13.6 note above). `docs/backlog.md` retains only its own historical Last-Session narrative bullets (both this task's and Task 420's). All other remaining hits are `docs/sessions/*`/`docs/governance-reports/*` (immutable) or this kickoff file itself.

**`storybook-static/index.json` transcript (fresh build):**
```
system-featuredlistings--default | System/FeaturedListings | Default
system-latestlistings--default | System/LatestListings | Default
system-recentlyviewedsection--populated | System/RecentlyViewedSection | Populated
system-similarlistings--default | System/SimilarListings | Default
```
(`system-listinggrid--*` → 0 matches, confirming R13.7's presence/absence requirement.)

### 13.2 R14 — rendered-proof for Featured/Latest/Similar (previously absent)

Added 3 real `ASSERT_STORIES` entries to `scripts/check-stories-rendered.mjs` (the "── System (7) ──" block):
`system-featuredlistings--default`, `system-latestlistings--default`, `system-similarlistings--default`, each
anchored `{ type: 'selector', value: '.listing-card' }`. Verified before adding that all 3 rebuilt Views
(`FeaturedListingsView.tsx`, `LatestListingsView.tsx`, `SimilarListingsView.tsx`) statically import and render the
real `ListingCard` (which carries the `.listing-card` class at `ListingCard.tsx:201`/`297`) in their Default/loaded
branch — confirmed via `grep -n "ListingCard" <each View file>`.

**R14.2 — full `npm run screenshots:assert:fast` re-run** (fast/mobile mode — 320/375/390 × sq/en/uk/it, the same
mode this repo's `219 FAIL` baseline (Task 663/664) and the first Task 665 pass were measured in; matches the
kickoff's own §16.4 "219 historical FAIL" framing, not an absolute-zero claim):

```
Assert stories: 89 (was 86 before R14: +3)
Results: 1827/2116 PASS, 219 FAIL, 12 OUT-OF-RANGE, 58 AMBIGUOUS
```

- Total cells: 2116 (was 2080 in the first-pass session, +36 = exactly 3 new stories × 3 viewports × 4 locales).
- PASS: 1791 → 1827 (+36, exactly the new cell count).
- FAIL: 219 → 219 (**unchanged** — matches the owner-approved historical baseline exactly, 0 new FAIL).
- OUT-OF-RANGE: 12 → 12 (unchanged). AMBIGUOUS: 58 → 58 (unchanged).
- `grep "FeaturedListings\|LatestListings\|SimilarListings"` over the full run transcript (failed-cells list +
  ambiguous/out-of-range listings) → **0 matches** — none of the 3 newly-registered stories appear anywhere in a
  non-PASS bucket; all 36 of their cells resolved (found + `.listing-card` anchor matched) with 0 FAIL among them.
- `RVS/Populated` (the pre-existing 4th System entry) is unaffected — same failed-cell set as the first pass
  (`offscreen-control` on the "Add to favorites"/copy-ID controls at 320/375/390 — pre-existing, not touched by
  this diff).

R14.1/R14.2 (AC-level: "0 FAIL among the newly-registered Featured/Latest/Similar cells") — **satisfied**.

### 13.3 §16.1 — route-parity selector correction (documentation-only; capture itself still owner-native)

The kickoff's §16.1 JS `classList.contains` locator predicate (for `.featured-listings`/`.latest-listings`, which
only exist in the loading branch, not the loaded grids route-parity actually captures) is a correction to the
**owner-native capture procedure** in §10 below, not a code change — no production selector/data-attribute was
added (per the kickoff's explicit "without adding any `data-*` attribute" constraint). §10's owner-native command
block has been updated to reference the corrected predicate instead of a raw CSS selector.

### 13.4 §16.4 — AC8 restatement acknowledged

AC8 is satisfied on its restated terms: "0 NEW FAIL vs the 219 baseline AND 0 FAIL among the newly-registered
Featured/Latest/Similar cells (R14) and the RVS cell" — both conditions hold per §13.2 above. The absolute-zero-FAIL
framing from the original R12/AC8 wording is explicitly not claimed.

### 13.5 Full validation gate re-run (post-R13/R14)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Exit 0, no output |
| `npm run check:story-coverage` | `✅ PASSED — 8/8 covered` (unchanged — Views still correctly not enrolled, R10 intact) |
| `npm run check:stories` | `✅ PASSED — 124 files checked, 0 violations` (storybook.* key parity 636/636/636/636 sq/en/uk/it) |
| `npm run build` | `✓ Compiled successfully in 111s`, 40/40 static pages, exit 0 |
| `npm run build-storybook` | Succeeded (48s) — see §13.1 R13.7 |
| `npm run screenshots:responsive` | `✅ Captured 296 screenshots (0 failed)` — see §13.1 R13.7 |
| `npm run governance:screenshots` | `✅ Screenshot infrastructure ready.` exit 0 |
| `npm run governance:components` | `✅ Component catalog infrastructure ready.` exit 0 |
| `npm run screenshots:assert:fast` | `1827/2116 PASS, 219 FAIL, 12 OUT-OF-RANGE, 58 AMBIGUOUS` — see §13.2 |
| `npm run check:file-integrity` | `✅ PASSED — all 41 file(s) clean` (git-changed + untracked, this session's full diff) |
| `npm run check:mojibake` | Still **crashes** on the same pre-existing blocker as the first pass (`ENOENT` on git-tracked-but-disk-deleted `MantineCardGrid.tsx`) — unchanged root cause (Sonnet cannot `git add`/stage deletions); `check:file-integrity` above already confirms encoding cleanliness on the live file set. |

### 13.6 Files changed (this second pass, in addition to §2's first-pass table)

| File | Change |
|---|---|
| `scripts/responsive-screenshots.mjs` | R13.2 — 4 `system-listinggrid--*` `STORY_TARGETS` entries → 4 `system-featuredlistings--default` entries (label/viewport/locale-differentiated); `--check` existence guard repointed to `FeaturedListings.stories.tsx`. |
| `scripts/governance/component-catalog.mjs` | R13.3 — `SCREENSHOT_TARGETS` token + 3 generated matrix/prose lines: `ListingGrid`/`listinggrid` → `FeaturedListings`/`featuredlistings`. |
| `scripts/governance/tailwind-entropy.allowlist.json` | R13.4 — removed the dead allowlist entry citing the deleted `ListingGrid.stories.tsx`. |
| `scripts/check-stories-rendered.mjs` | R14.1 — added 3 `ASSERT_STORIES` entries (Featured/Latest/Similar `--default`, anchored `.listing-card`); comment count updated to "System (7)". |
| `docs/component-catalog.md`, `docs/component-coverage-matrix.md`, `docs/component-risk-register.md` | R13.5 — regenerated via `catalog:components --write`. |
| `docs/storybook-governance.md`, `docs/responsive-storybook-inventory.md`, `docs/responsive-screenshot-matrix.md`, `docs/responsive-screenshot-governance.md`, `docs/maintenance-playbook.md`, `docs/governance-enforcement.md` | R13.6 — replaced live `ListingGrid`/`system-listinggrid--*` references with `FeaturedListings`/`system-featuredlistings--default`. |

### 13.7 Self-review findings (second pass)

- **No new defects found.** The 3 new `ASSERT_STORIES` anchors were verified against actual View source (not
  assumed) before being added — each View's `ListingCard` import was grepped directly.
- **Bounded scope decision:** `docs/responsive-storybook-inventory.md`'s deep Task-412 (2026-06-08) point-in-time
  discovery-count block (story-file totals, the 45-ID `ASSERT_STORIES` snapshot list) was left untouched — treating
  it as historical output tied to that specific audit run rather than a live table, consistent with not editing
  session logs. Only the two clearly-current per-file inventory rows (top table + detailed audit table) were
  corrected. Flagging for the orchestrator in case a fuller resync of that doc is wanted as separate follow-up
  (it was already ~6 weeks stale on unrelated stories before this task).
- **`check:mojibake`** remains blocked by the same pre-existing tracked-but-deleted-file issue as the first pass —
  not a new defect, not caused by this session's edits; resolves after the owner's `git add` stages the 4 deletions
  (`MantineCardGrid.tsx`, `ListingGrid.stories.tsx`, `StoryListingCard.tsx`, `CardGrid.stories.tsx`).

## 14. Backlog update

See `docs/backlog.md` — updated the existing Task 665 `Last Session (2026-07-24)` bullet in place to record the
§16 (R13/R14) second pass. Resulting file length recorded in the backlog diff itself; **`BACKLOG LIMIT BREACH`**
(flagged in the first pass, still applicable) remains for orchestrator consolidation into the archive.
