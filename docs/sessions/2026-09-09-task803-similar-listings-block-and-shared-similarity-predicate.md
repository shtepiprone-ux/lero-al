# Task 803 — the similar-listings block becomes a real entry point into search

**Sprint:** 72 · **QA profile:** Q4 Release/Critical Flow · **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Kickoff:** `tasks/Sprints/Sprint_72_kickoff_prompt_Task_803_Similar_Listings_Block_And_Shared_Similarity_Predicate.md`
**Precondition verified before starting:** Task 792 `APPROVED WITH NOTES` (`docs/backlog.md`, commit `ce7ef1ff1`).

**This log covers three rounds:** the original implementation (Revision 0, sections below down to the first "Backlog
update"), **Revision 1** (kickoff §16) — owner-directed remediation of review findings F1/F3/F4/F6/F7 (comment)/two
NOTEs — and **Revision 2** (kickoff §17, appended at the end) — orchestrator-directed remediation of the 2026-09-10
review's F8/F9/F10/F11, documentation and evidence only. Revision 0's AC1/AC2/AC4/AC5/AC8/AC9/AC10 and the full AC6
pair (§16.1), plus Revision 1's AC11/R11, AC14/R13, AC16/R15 and AC15/R14's code half (§17.1), remain frozen and are
**not** re-described below; only what each revision changed or re-proved is new.

## Requirement and acceptance-criteria evidence

| AC | Requirement | Verified by | Result |
|---|---|---|---|
| AC1 [R1] | One ordered structure, two renderers, no second **similarity** field↔param mapping | `similarity.test.ts` (16 tests, →18 in Revision 1); `grep -rn "location_id\|area_gross" src/modules/listings/components/` finds only `SimilarListings.tsx`'s prop-to-`SimilarityListingInput` assembly — **not** "no hit at all": `ListingDetailView.tsx:410` builds `` `/${locale}/listings?location_id=${listing.location.id}` `` for the pre-existing location breadcrumb, an unrelated, out-of-scope, non-similarity mapping (R15/NOTE 2, corrected from Revision 0's imprecise phrasing) | ✅ |
| AC2 [R2] | `buildSimilarListingsHref` test unchanged, still green | `git diff --stat` empty for that path; `npx vitest run .../ListingDetailView.buildSimilarListingsHref.test.ts` → 3/3 PASS | ✅ |
| AC3 [R3] | Query 9, render exactly 8 | `SimilarListings.ladder.test.ts` — `resolveSimilarListingsPresentation` given 9 rows → `rendered.length === 8` | ✅ |
| AC4 [R4] | `ViewAllLink` only on a 9th row, href = settled predicate's URL, asserted not eyeballed | `SimilarListings.ladder.test.ts` — 9 rows → `hasMore:true`, `viewAllHref` equals the exact expected string; 8 rows → `hasMore:false`, `viewAllHref:undefined` | ✅ |
| AC5 [R5] | ≤4 attempts, stops at first non-empty, widest rung renders | `SimilarListings.ladder.test.ts` — mocked `fetchAttempt` asserts `toHaveBeenCalledTimes(4)`/`(1)` and the exact per-attempt argument sequence | ✅ |
| AC6 [R6] | Visibility predicate present at every rung + planted-violation proof | `SimilarListings.visibility.test.ts` (6 tests) + real plant/revert (below) | ✅ |
| AC7 [R7] | `.similar-listings` present, speculation script = first 2 rendered URLs, flex/overflow-x at <40em, grid nowhere (D72-5: no grid at all) | Live-route capture (below) shows `.similar-listings`, 1-URL speculation script (1 rendered card); `SimilarListingsView.module.css` — `display:flex;overflow-x:auto` unconditional, no `display:grid` anywhere in the file | ✅ (computed-style width sweep is `OWNER VISUAL QA REQUIRED`, not self-certified — see below) |
| AC8 [R8] | `listing_type` narrows every rung; `type=sale` in every URL | `similarity.test.ts`/`ladder.test.ts` fixtures use `listingType:'sale'`; `buildSimilarityHref` always sets `type` first when truthy; `SimilarListings.tsx` passes `core.listingType` into every rung via `buildSimilarityRungQuery` | ✅ |
| AC9 [R9] | Story extended (not replaced): 8+control / <8 / empty | `SimilarListingsView.stories.tsx` — `Default` (8 fixtures + `viewAllHref`/`viewAllLabel`), `FewerThanEight` (4 fixtures, no control props), `Empty` (`listings={[]}`); real component still statically imported | ✅ |
| AC10 [R10] | No new i18n/token/allowlist; `--strict --scope=mantine` = 0 | `node scripts/check-design-tokens.mjs --strict --scope=mantine` → 0 violations, exit 0; `git diff --stat messages/` empty | ✅ |

## Current versus required behavior

**Before (Task 792 state):** up to 4 cards, `SimpleGrid` responsive grid, no "view more" path, query narrowed only by `property_type` + optional `location_id`, rentals could appear under a sale listing, block vanished entirely when the narrow query returned nothing.

**After:** up to 8 cards in a horizontal scroll at every width (D72-5), a "view all" control when a 9th match exists pointing at `/{locale}/listings` carrying exactly the settled rung's parameters, a 4-rung relaxation ladder (full → drop amenities → drop numerics → core only) so the block populates far more often, `listing_type` narrows every rung, and attempt 4 reproduces exactly the pre-803 query (no regression on the empty case — `if (!listings?.length) return null` unchanged in spirit, now reached only after 4 rungs instead of 1).

**Negative flows (from the kickoff's applicability table):**
- Empty at every rung → `return null` — reached via `runSimilarityLadder` returning `listings:null`, container's `if (!listings?.length) return null` unchanged.
- Fewer than 9 matches → cards render, no control — `SimilarListings.ladder.test.ts`.
- Exactly 9+ matches → 8 cards + control — `SimilarListings.ladder.test.ts`.
- Null optional columns → param/predicate omitted — `similarity.test.ts` "omits every field whose source column is null/empty".
- Relaxation fired → href carries only the settled tier — `similarity.test.ts` "never carries an amenity param when attempt 3 settled" + `ladder.test.ts` equivalent.
- Public visibility → `SimilarListings.visibility.test.ts` + planted-violation proof.
- Locale/small-viewport → `OWNER VISUAL QA REQUIRED` (below); not self-certifiable per `docs/qa-profiles.md`.
- Authorization/RLS → unchanged; `applyPublicVisibility` remains the sole boundary, no new RLS surface.

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/listings/domain/similarity.ts` (new) | R1 — the one shared similarity source: entries, ladder tiers, Supabase applier, URL builder |
| `src/modules/listings/domain/__tests__/similarity.test.ts` (new) | Unit coverage for the structure/renderers (AC1) |
| `src/modules/listings/components/SimilarListings.tsx` | Container: relaxation ladder (`buildSimilarityRungQuery`, `runSimilarityLadder`), render-cap/view-all gating (`resolveSimilarListingsPresentation`), new `listingType`+similarity-field props, speculation slice now reads the rendered 8 |
| `src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts` (new) | AC6 — per-rung visibility invariant + planted-violation proof |
| `src/modules/listings/components/__tests__/SimilarListings.ladder.test.ts` (new) | AC3/AC4/AC5 — render cap, view-all gating, attempt-count bound, asserted not eyeballed |
| `src/modules/listings/components/SimilarListingsView.tsx` | `SimpleGrid` removed for the D72-5 scroll row; `viewAllHref`/`viewAllLabel` props; own `!listings.length` guard (R9's empty-branch story state) |
| `src/modules/listings/components/SimilarListingsView.module.css` (new) | D72-5 mechanics: flex/overflow-x/scrollbar-hide/scroll-snap, percentage `flex-basis` peek at 4 breakpoints |
| `src/modules/listings/components/ListingDetailView.tsx` | `buildSimilarListingsHref` re-implemented as a thin caller of R1 (R2); `SimilarListings` call site gains `listingType` + the similarity fields |
| `src/stories/mantine/primitives/SimilarListingsView.stories.tsx` | R9 — extended with `FewerThanEight`/`Empty`, `Default` gains `viewAllHref`/`viewAllLabel` |
| `docs/component-catalog.md` | `SimilarListingsView` row note extended for Task 803 |
| `scripts/task803-similar-row-computed.mjs` (new) | R12 (Revision 1) — evidence-only computed-style probe, modelled on `scripts/task775-listings-frame-route-probe.mjs`; no `package.json` entry |
| `docs/sessions/2026-09-09-task803-similar-listings-block-and-shared-similarity-predicate.md` (new) | This session log itself |
| `docs/sessions/evidence/task803/` (evidence root) | Every retained transcript and probe run for Revisions 0/1/2 — named once as the evidence root, not enumerated file-by-file |

**R18 reconciliation (Revision 2, closes F10):** `docs/backlog.md` is removed from this table — it is no longer part
of the uncommitted diff (`git --no-optional-locks status --short` does not list it; its Revision-1/Revision-2 edits
are already committed at `HEAD`, `19046730020b87a60f2ff0e8dd2cfd566cdedc4e`). The two rows added above
(`scripts/task803-similar-row-computed.mjs` and this session log) were the omission F10 named. A fresh
`git --no-optional-locks status --short` run during Revision 2 shows 13 entries (5 modified, 8 untracked, the
evidence directory counted once); every one of them is represented in this table exactly once — 9 named source/test
rows, the probe script, this log, and the evidence-root row.

## The similarity structure as actually emitted

**Full listing** (`location_id:5, condition:'good', heating:'central', wall_type:'brick', market_type:'primary', offer_type:'developer', purchase_conditions:['cash','mortgage'], rooms:3, area_gross:100, floor:4, year_built:2010`) → **14 entries**: `location_id`(A/eq/5) · `condition`(B/in/['good']) · `heating`(B/in) · `wall_type`(B/in) · `market_type`(B/eq) · `offer_type`(B/in) · `purchase_conditions`(B/overlaps/`urlValue:"cash,mortgage"`) · `rooms`(C/eq/3) · `area_min`(C/gte/75) · `area_max`(C/lte/125) · `floor_min`(C/gte/4) · `floor_max`(C/lte/4) · `year_built_min`(C/gte/2005) · `year_built_max`(C/lte/2015).

**Same listing with `condition`/`floor`/`year_built` nulled (3 null columns)** → **9 entries** — exactly the 5 entries sourced from those 3 columns (`condition`, `floor_min`, `floor_max`, `year_built_min`, `year_built_max`) are absent; every other entry is byte-identical. Full JSON for both → `docs/sessions/evidence/task803/scratch-structure-output.txt`.

## The four rungs' built predicates (same full listing)

- Attempt 1 (14 entries): `location_id, condition, heating, wall_type, market_type, offer_type, purchase_conditions, rooms, area_min, area_max, floor_min, floor_max, year_built_min, year_built_max`
- Attempt 2 (8 entries, tier B dropped): `location_id, rooms, area_min, area_max, floor_min, floor_max, year_built_min, year_built_max`
- Attempt 3 (1 entry, tier A only): `location_id`
- Attempt 4 (0 entries, core only): `(none)`

## The settled href for a relaxed case (AC5)

Attempt 3 settled (tier A only), locale `uk`, `type:sale`, `property_type:apartment`, `location_id:5`:

```
/uk/listings?type=sale&property_type=apartment&location_id=5
```

## AC6 planted-violation proof (quoted) — Revision 0, `SUPERSEDED` by Revision 1 §16.9④

**Marked `SUPERSEDED` in Revision 1** (kickoff §16.1): R13 rewrote `buildSimilarityRungQuery`'s body (inline
`switch (entry.op)` loop → `applySimilarityEntries` call), so this plant proves a function that no longer exists in
that form. Kept as the record for Revision 0's code; the re-plant against the rewritten function is under "Revision
1" → "AC6 re-plant" below, and that pair (`ac6-rev1-planted-violation-FAIL.txt` / `ac6-rev1-reverted-PASS.txt`) is
the current evidence for AC6/R6.

Violation: `SimilarListings.tsx`'s `buildSimilarityRungQuery` line
`let q: any = applyPublicVisibility(baseQuery() as any)` temporarily changed to `let q: any = baseQuery()`.

**FAIL** (`docs/sessions/evidence/task803/ac6-planted-violation-FAIL.txt`):
```
 ❯ src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts (6 tests | 4 failed) 8ms
     × rung 1 contains the visibility predicate, neq(id), property_type and listing_type
     × rung 2 contains the visibility predicate, neq(id), property_type and listing_type
     × rung 3 contains the visibility predicate, neq(id), property_type and listing_type
     × rung 4 contains the visibility predicate, neq(id), property_type and listing_type
AssertionError: expected false to be true
 Test Files  1 failed (1)
      Tests  4 failed | 2 passed (6)
EXIT_CODE=1
```

**PASS** (reverted, `docs/sessions/evidence/task803/ac6-reverted-PASS.txt`):
```
 Test Files  1 passed (1)
      Tests  6 passed (6)
EXIT_CODE=0
```

## Story-coverage before/after

Manifest entries: **32 → 32** (unchanged — `SimilarListingsView` extends its existing Task 792 manifest entry; no new component enters the manifest). `check:story-coverage` → `32 covered / 0 unproven`, exit 0, both before and after.

## Validation evidence

All commands run from repo root, `node -p process.platform` → `win32`. Transcripts under `docs/sessions/evidence/task803/`.

| Command | Result | Transcript |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | (inline, re-run 3× during the session) |
| `npm run lint` | **SUPERSEDED (`i-lint.txt` and `rev1-lint.txt` both)** — `i-lint.txt` was captured 18:13, before `SimilarListings.tsx`'s final 18:24:38 write; `rev1-lint.txt` was captured 21:11:31, before the §16.9④ AC6 re-plant/revert write at 21:19:58 (Revision 1). **`rev2-lint.txt` is the final lint artifact** (Revision 2, R17/AC18): 0 errors, 72 warnings, neither `SimilarListings.tsx` nor `similarity.ts` named, `EXIT_CODE=0` written inside the file, captured with `[Console]::OutputEncoding` set to UTF-8 first so the summary glyph reads `✖` (U+2716) rather than the `Ô£û` mojibake the two earlier native-console captures carried | `i-lint.txt` (superseded), `rev1-lint.txt` (superseded), `rev2-lint.txt` (final) |
| `npm run check:stories` | 139 files, 0 violations | `i-check-stories.txt` |
| `npm run check:story-coverage` | 32/32 covered, 0 unproven | `i-story-coverage.txt` |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations, exit 0 | `i-design-tokens-strict-mantine.txt` |
| `node scripts/check-design-tokens.mjs` (unscoped) | 63 (unchanged pre-existing baseline), report-mode exit 0 | `i-design-tokens-unscoped.txt` |
| `npx vitest run src/modules/listings` | 27 files, 591 passed, 2 failed (both pre-existing, see below) | `i2-vitest-listings.txt` |
| `npm run test` (full suite, run 1) | **SUPERSEDED** — captured 18:15, before the 18:24:38 final write; the owner's 22:38-22:44 native run and Revision 1's own `rev1-full-test-suite.txt` (below) are the final artifacts | `i-full-test-suite.txt` (superseded) |
| `npm run test` (full suite, run 2, immediate re-run) | Exactly 5 failures / 4 files — the pre-existing Task 790 baseline, transient failures gone | `i3-full-test-suite-rerun.txt` |
| `npm run build-storybook` | Success | `i-build-storybook.txt` |
| `npm run build` (`.next` deleted first, per `docs/qa-rules.md` hygiene note) | Success, `ƒ /[locale]/listings/[slug]` present | `i-build.txt`, `i2-build.txt` |
| `npm run check:file-integrity` | 20 files clean | `i-file-integrity-pass1.txt` |
| `npm run check:mojibake` | 3990 files, 0 artifacts | `i-mojibake-pass1.txt` |

**Pre-existing full-suite baseline (Task 790), reproduced identically, not caused by this diff:** `css-var-resolvability.test.ts`, `theme.d69-18.test.tsx`, `appimage-config-class-assertions.test.ts` (self-declared BLOCKED), `ListingCard.smoke.test.tsx` ×2 (archived-badge selector) — cross-checked against `docs/sessions/evidence/task792/i8-vitest-listings.txt`/`v2-vitest-listings.txt`, both captured before this session and showing the identical 2 `ListingCard` failures with the identical error text; none of the 4 files were touched by this task (`git status --porcelain` confirms).

**Transient full-suite flake (run 1 only):** `filtersRangeDatePicker.smoke.test.tsx` and `heroSearch.smoke.test.tsx` — neither file is touched by this task. Re-run in isolation immediately after: `2 files, 20/20 PASS`. A second complete full-suite run reproduced exactly the 5/4 baseline with no trace of either failure. Recorded as environment noise, not a regression; not caused by this diff.

## Live-route evidence

`$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"` (the kickoff's named slug) **no longer resolves in this dev DB** — `Invoke-WebRequest` returned `StatusCode 200` over a `NEXT_HTTP_ERROR_FALLBACK;404` body (the exact Task 792 AC8 hazard the current `docs/qa-rules.md` "Production-build hygiene" rule warns about). Confirmed via `/uk/listings` index: the DB now seeds `11-mr7ucly4`, `shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3`, `apartament-pogradec-rruga-rinia-mtubphkq`, `test1-mqidv5is` — none match the kickoff's slug. Re-ran against `shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3`:

- `NEXT_HTTP_ERROR_FALLBACK` match set: **empty** (both locales) — `body-uk.txt`, `body-sq.txt`.
- `data-testid="listing-detail-view"` match set: **non-empty** (both locales).
- `.similar-listings` wrapper: present.
- Resolved RSC chunk (not the Suspense skeleton) shows: heading "Схожі оголошення", 1 rendered card (`apartament-pogradec-rruga-rinia-mtubphkq`) inside `SimilarListingsView_row__RKk0t`/`SimilarListingsView_card__nEGhc` (confirms the new CSS module is wired), `ViewAllLink`'s slot is `"$undefined"` (correct — only 1 match, `hasMore:false`), speculation script carries exactly 1 URL (the 1 rendered card — `.slice(0,2)` of 1).
- `start.txt`: clean, no `⨯ Error`.

**Known limitation:** this dev DB is too sparse (4-5 total listings) to naturally produce a 9-row match and observe the `ViewAllLink`/8-card-cap branches live. Those branches are covered by assertion-based unit tests instead (`SimilarListings.ladder.test.ts`, AC3/AC4) rather than left unverified — per the kickoff's own AC4 instruction ("Assert the href in a test, not by eye").

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Header row (title + control) | `SimilarListingsView` `Group` | inline Mantine props, no CSS module | `gap="sm"` (spacing token), Mantine `Group` wrap behavior | Change (composition copied from `FeaturedListingsView.tsx:59-66` per kickoff §3.3, sizing kept at Task 792's `size="h4"`) | Live-route chunk shows `data-size="h4" data-order="2"` |
| Card row scroll/grid | `SimilarListingsView` wrapper `div` | `.row`/`.card` (new `SimilarListingsView.module.css`) | `var(--mantine-spacing-md)` gap, percentage `flex-basis` (no raw px) | Change (D72-5 — `SimpleGrid` removed) | `check-design-tokens.mjs --strict --scope=mantine` 0; live-route class names confirmed |
| `ViewAllLink` control | `@/components/shared/ViewAllLink` | canonical, reused unmodified | Mantine `Button variant="transparent"` | Reuse (no new control, D72-1/AC4) | `ViewAllLink.tsx` unmodified (`git status` confirms) |
| `.similar-listings` wrapper, speculation script | `SimilarListings.tsx` container | unchanged selector | n/a | Preserve verbatim (§10.5) | Live-route: wrapper present, script carries exactly the rendered slice |
| `RecentlyViewedGridView`/its CSS module | out of scope (§8) | n/a | n/a | Preserve, not edited | `git status --porcelain` shows no change to either file |

## Canonical UI decision record

| Visible artifact | Search performed | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| "View all" header control | `docs/component-catalog.md`, `@/components/shared/ViewAllLink.tsx` (kickoff §3.3, already cited with path) | `ViewAllLink` | **Reuse** | `@/components/shared/ViewAllLink` — no local button, no copied class chain |
| Horizontal-scroll row mechanics | `RecentlyViewedGridView.module.css` (kickoff §3.4/§10.4, already cited with path) | That file's mechanics (gap/scrollbar-hide/flex-shrink) | **Reuse the mechanism, not the file** — a new `SimilarListingsView.module.css` was required because D72-5's responsive SHAPE (scroll at every width, percentage peek) differs from that file's own breakpointed contract, and §8 forbids editing/importing it cross-component | `SimilarListingsView.module.css` (new) |
| Similar-listings card | `ListingCard`/`MantineListingCardPattern` (unchanged, out of scope §8) | n/a | Reuse, unmodified | `@/modules/listings/components/ListingCard` |

## Assumptions, deviations, and limitations

- **Assumption (stated, reversible, per kickoff §5/§10.4):** area ±25%, year_built ±5, rooms/floor exact, `.2` peek fraction — similarity/UX heuristics, not measured product rules.
- **Deviation (reported, not silent):** `similarity.ts`'s Supabase renderer uses `.overlaps()` for `purchase_conditions` in addition to the kickoff §10.1 text's named `.eq()/.gte()/.lte()/.in()` set. `purchase_conditions` is a `text[]` column; `filterEngine.ts:325` itself uses `.overlaps()` for the identical column, and `.in()` would produce the wrong Postgrest semantics against an array column (array-literal equality, not membership/overlap). Matching `filterEngine.ts`'s own operator is required for correctness and for genuine query/URL parity (D72-1) — treated as the kickoff's illustrative list being non-exhaustive, not as license to invent behavior.
- **Deviation (reported):** `buildSimilarityRungQuery`/`applySimilarityEntries` use an unconstrained generic `Q` + internal `any`, not the originally-considered `SimilarityQueryBuilder` structural-interface bound. This matches the existing `applyListingFilters`/`applyPublicVisibility` convention exactly (cited in-code) and was adopted after the structural-interface version produced friction assigning the real Postgrest builder type; behavior is identical, only the generic-bound mechanism changed.
- **Limitation:** the live route could not exercise the ≥9-row/`ViewAllLink` branch (dev DB too sparse) — closed instead by `SimilarListings.ladder.test.ts`'s assertion-based AC3/AC4 coverage, not left unverified.
- **Out of scope, confirmed untouched:** `filterEngine.ts`, `bedrooms`/`bathrooms`/`toilets` and the three control-less parameters (804), `ListingsFilters.tsx`, `ActiveFilterChips.tsx`, `ListingCard`/`MantineListingCardPattern`, the status banner's own href (unchanged from Task 792), `RecentlyViewedGridView` and its CSS module.

## Opus handoff

Evidence root: `docs/sessions/evidence/task803/`. Specific things to inspect:
1. `similarity.ts`'s `.overlaps()` deviation (reported above) — confirm this reading of D72-1/D72-3's intent, since the kickoff's own operator list under-named it.
2. The generic-bound simplification in `buildSimilarityRungQuery`/`applySimilarityEntries` (unconstrained `Q` + internal `any`) versus the kickoff's more literal "chains `.eq()`/`.gte()`/`.lte()`/`.in()` calls" phrasing.
3. `OWNER VISUAL QA REQUIRED` matrix (kickoff §13 table) — none of it was self-certified; needs the owner's live-route pass at the listed viewport/locale/state tuples, including the mandatory `uk@320` header-overflow row and the D72-5 "peek" affordance at every width.
4. The transient 2-file full-suite flake (`filtersRangeDatePicker`/`heroSearch`) — confirmed non-reproducing and unrelated by file scope, but worth a second look given it surfaced during this specific session.

**`OWNER VISUAL QA REQUIRED`** (kickoff §13 table, unchanged from the kickoff — reproduced here for the handoff):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Similar-listings block | 8 cards + view-all control, row scrolls **and a next card peeks** at every width | uk, sq | 320, 390, 768, 1024, 1440 |
| Similar-listings block | fewer than 8, no control | uk | 320, 1440 |
| Similar-listings block | empty (block absent) | uk | 390 |
| View-all control | click through | uk, sq | 390 |
| Header row | long `uk` heading + control, no overflow | uk | **320 (mandatory)** |

## Self-validation

`tsc=0 errors · build=passes (BUILD_ID present, real routes-manifest) · AC table=all 10 green · runtime locale=uk PASS (live-route capture above) · scope=clean (git status matches the kickoff's §7 scope exactly) · integrity=PASS`

## Revision 1 — 2026-09-09 (kickoff §16, owner-directed remediation)

Origin: the implementation review's findings **F1** (P1) and **F3** (P2), extended by owner instruction the same
day to fold in **F4** (P2), **F6** (P0/D72-6) and the two review `NOTE`s. Re-entry mode `remediation`. Frozen from
Revision 0 per §16.1: AC1/AC2/AC4/AC5/AC8/AC9/AC10, the critical-flow registry row, and the Task 790 full-suite
baseline. F7's behavioural half stays with **804**; the owner visual matrix (§13) is unchanged and still owed.

### R11 [AC11] — `purchase_conditions` null/undefined guard (closes F1)

Three edits, exactly as specified:

1. `src/modules/listings/domain/similarity.ts:39` — `SimilarityListingInput.purchase_conditions` widened
   `string[]` → `string[] | null | undefined`.
2. `similarity.ts` — one normalisation site, before the tier-B read:
   `const purchaseConditions = listing.purchase_conditions ?? []`, used for both `.length` and `.join(',')` (was:
   direct unguarded `listing.purchase_conditions.length` / `.join(',')`).
3. `src/modules/listings/components/SimilarListings.tsx` — `Props.purchaseConditions` widened to match
   (`string[] | null | undefined`).

Preserved, confirmed by `git status --porcelain`: `src/types/database.ts` and
`ListingDetailView.buildSimilarListingsHref.test.ts` both **absent** from the changed-file list.
`buildSimilarListingsHref`'s own literal `purchase_conditions: []` in `ListingDetailView.tsx` is untouched. A
non-empty array still emits `op:'overlaps', column:'purchase_conditions'`, byte-identical to Revision 0.

One comment added on the `rooms` entry (F7, §16.3d) — no behaviour change — recording that `/listings` reads
`rooms=N` as "N or more" while this predicate is exact-`eq`, and that reconciling the two is Task 804's scope.

**Test growth (AC11):** `similarity.test.ts` 16 → **18** cases. New, by name (verbose reporter,
`rev1-similarity-suites-verbose.txt`):
- `buildSimilarityEntries > does not throw and omits the purchase_conditions entry when the column is null (R11/AC11)`
- `buildSimilarityEntries > does not throw and omits the purchase_conditions entry when the column is undefined (R11/AC11)`

Both assert `not.toThrow()` and that no `purchase_conditions` entry is emitted.

### R12 [AC12] — computed-style probe (closes F3)

New `scripts/task803-similar-row-computed.mjs`, modelled on `scripts/task775-listings-frame-route-probe.mjs`
(`git hash-object`/`git rev-parse` identity via `child_process`, no shell; `writeFile(..., {flag:'wx'})`; evidence
tooling only, no `package.json` entry, nothing in CI depends on it). Locale `uk`, widths 320/390/768/1024/1440,
selectors `.similar-listings [class*="SimilarListingsView_row"]` / `[class*="SimilarListingsView_card"]` (hash-suffixed
class names, confirmed against `body-uk.txt` from Revision 0).

**`runs/task803-rev1` and `runs/task803-rev1-planted` are `SUPERSEDED` (Revision 2, R16/AC17, closes F8).** Both
carry `probeHash: "28a109b5ea42de2c54bb6f3b61cb6bc417e27adc"` — a script blob different from the one that shipped
(`git hash-object scripts/task803-similar-row-computed.mjs` → `cb42864ef632415aab7a6e77486f741cb3fc27a2`, unchanged
throughout Revisions 1 and 2). `git cat-file -p 28a109b5…` → `fatal: Not a valid object name`: the blob that produced
these two runs is unrecoverable. `runs/task803-rev1-planted`'s cells carry the verbatim, duplicated
`"failReason": "rowDisplay: grid; rowDisplay: grid"` — not the single-string form this log originally quoted.
`runs/task803-rev1-reverted` (`probeHash cb42864e…`, the shipped blob) stays valid as a clean-arm record but is no
longer the *cited* clean arm, because it does not pair with a failing arm fired from the same blob. **Both
directories are kept, not deleted** — they remain the record for blob `28a109b5…`.

**The authoritative two-armed proof is the owner's native 2026-09-10 run (R16, `runs/task803-rev2-planted` +
`runs/task803-rev2-clean`), both `probeHash: "cb42864ef632415aab7a6e77486f741cb3fc27a2"`, `gitCommit:
"e67a4bbc63bdbe3b0aab165f2c128ab01e019336"` — attributed to the owner, not to this session.**

`runs/task803-rev2-clean/similar-row-computed.json` (slug `shitje-apartamenti-tek-rruga-rinia-ne-krye-mtud87k3`,
`capturedAt 2026-09-10T05:46:04.306Z`), all 5 cells:

| Width | rowDisplay | rowOverflowX | cardFlexBasis |
|---|---|---|---|
| 320 | flex | auto | 83.3333% |
| 390 | flex | auto | 83.3333% |
| 768 | flex | auto | 31.25% |
| 1024 | flex | auto | 23.8095% |
| 1440 | flex | auto | 23.8095% |

`pageOverflows: false` at every width (320/390 included); `cardCount: 1` at every width (dev DB still sparse — the
same limitation Revision 0 recorded), so `overflowAssertionApplicable: false` at every cell — both arms of §16.4d's
fail-closed contract are visible in the JSON. Probe exit **0** (`CLEAN_EXIT_CODE=0`). `start-rev2-clean.txt` — no
`⨯ Error`.

**Two-armed proof the probe can actually fail (§16.9③):** `display: grid;` planted on `.row` in
`SimilarListingsView.module.css`, rebuilt, re-started, re-probed into `runs/task803-rev2-planted/`
(`capturedAt 2026-09-10T05:44:29.832Z`):

```
"rowDisplay": "grid", ... "failReason": "rowDisplay: grid"
```

— the single, non-duplicated form — on all 5 cells; probe exit **1** (`PLANTED_EXIT_CODE=1`). CSS reverted;
`git hash-object src/modules/listings/components/SimilarListingsView.module.css` → `5486641b37c23c9297835f1ff2bad8a80fbf8461`,
identical before the plant and after the revert. `start-rev2-plant.txt` / `start-rev2-clean.txt` — no `⨯ Error`.
`npm run check:file-integrity` / `check:mojibake` after both runs — 66 files clean, 0 artifacts in 4033 files.

**That JSON quotation is what closes AC7** — Revision 0's AC7 row is corrected from a source-only declaration to
this measured result; §13's owner matrix remains separately owed (rendered-pixel judgement, not computed style).

**Corrected deviation bullet (Revision 2, R16 item 4, replaces the Revision 1 bullet below):** the fail-reason
simplification (collapsing a duplicated `rowDisplay: grid; rowDisplay: grid` string to a single `rowDisplay: grid`)
landed **after** `runs/task803-rev1-planted` was captured, not before it as Revision 1's deviation bullet stated —
evidenced by that run's `probeHash 28a109b5…` and its duplicated `failReason`, contrasted with the shipped blob
`cb42864e…`. The pre-simplification blob (`28a109b5…`) is unrecoverable (`git cat-file -p 28a109b5…` →
`fatal: Not a valid object name`), which is why the arms were re-fired natively by the owner on 2026-09-10 rather
than re-derived from the stale blob. The previous bullet asserted the opposite ordering; it is superseded, not
softened.

### R13 [AC14] — one applier, not two (closes F4)

`buildSimilarityRungQuery` (`SimilarListings.tsx`) no longer contains an inline `switch (entry.op)`/`case 'overlaps'`
dispatch. It now calls `applySimilarityEntries(q, entriesForAttempt(entries, attempt))` from `similarity.ts` — the
same applier `similarity.test.ts` already exercises — after the core four predicates
(`applyPublicVisibility`, `.eq('property_type', …)`, `.eq('listing_type', …)`, `.neq('id', …)`), which stay in the
caller, outside the ladder, per D72-2 (unchanged by this edit — order preserved by construction).

`grep -rn "applySimilarityEntries" src/` now hits its definition, its doc comment, `similarity.test.ts`, **and**
`SimilarListings.tsx` — the dead-code condition F4 named is closed. The `// eslint-disable-next-line
@typescript-eslint/no-explicit-any` above `let q: any` is still load-bearing (the variable is still typed `any`) and
was not removed; fresh lint confirms 0 errors, 72 warnings, neither touched file named.

**AC6 re-plant, mandatory per §16.9④** (Revision 0's plant/revert pair described the pre-R13 function and is now
`SUPERSEDED`, per the note added above): `let q: any = applyPublicVisibility(baseQuery() as any)` →
`let q: any = baseQuery()`, then reverted.

`ac6-rev1-planted-violation-FAIL.txt`:
```
❯ src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts (6 tests | 4 failed) 9ms
 Test Files  1 failed (1)
      Tests  4 failed | 2 passed (6)
```

`ac6-rev1-reverted-PASS.txt`:
```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

`git --no-optional-locks diff --stat src/modules/listings/components/SimilarListings.tsx` afterwards shows only the
cumulative R11+R13 diff against `HEAD` (150 insertions / 34 deletions across the whole session, both revisions) —
no residual plant hunk; the file matches its intended final state (confirmed by re-reading it).

### R14 [AC15] — header adopts the Featured shape, `Flex` not `Group` (closes F6, D72-6)

`SimilarListingsView.tsx`'s header `<Group gap="sm" wrap="wrap" align="center" mb="lg">` replaced with:

```tsx
<Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} justify="space-between" gap="sm" mb="lg">
```

— the mechanism `MantinePageHeaderWithActions.tsx:55-66` and `AuthSheet.tsx:518` already use for an identical
Mantine limitation (`Group` has no responsive `direction`), not a copied CSS module. `Group` import dropped from
`@mantine/core`, `Flex` added. `Title order={2} size="h4"` unchanged; `ViewAllLink` consumed unmodified;
`SimilarListingsView.module.css` gained no header rule; `mb="lg"`/`gap="sm"` unchanged; the
`{viewAllHref && viewAllLabel && …}` gate unchanged.

`check:story-coverage` re-run: **32/32** covered, 0 unproven, no manifest delta (`rev1-story-coverage.txt`).
`node scripts/check-design-tokens.mjs --strict --scope=mantine` re-run: **0** violations (`rev1-design-tokens-strict-mantine.txt`)
— the `Flex` responsive props introduce no raw value. `git status --porcelain` confirms `FeaturedListingsView.module.css`,
`page.tsx` and `filterEngine.ts` are all absent (none touched).

### R15 [AC16] — the two review NOTEs

1. `similarity.test.ts`'s stale comment citing `SimilarListings.regression.test.ts` (a file that never existed) now
   names the real files: `SimilarListings.visibility.test.ts` and `SimilarListings.ladder.test.ts`.
   `grep -rn "SimilarListings.regression.test.ts" src/` → **0 hits**.
2. This log's AC1 row (above) restated: the grep finds no second **similarity** field-to-parameter mapping, and
   `ListingDetailView.tsx:410`'s pre-existing location-breadcrumb href is named as the one unrelated hit, instead of
   Revision 0's imprecise "no second mapping" phrasing.

### Verification — Revision 1 (§16.9), all transcripts under `docs/sessions/evidence/task803/`

**Block ① — code change:**

| Command | Result | Transcript |
|---|---|---|
| `node -p process.platform` | `win32` | inline |
| `npx tsc --noEmit` | 0 errors | `rev1-tsc.txt`, re-confirmed `rev1-tsc-final.txt` |
| `npm run lint` | 0 errors, 72 warnings, neither `SimilarListings.tsx` nor `similarity.ts` named | `rev1-lint.txt` — **SUPERSEDED in Revision 2** (captured 21:11:31, before the 21:19:58 AC6 re-plant/revert write); `rev2-lint.txt` is the final artifact (see Revision 2 §) |
| `npx vitest run` (similarity + visibility + ladder) | **31 passed (31)** — 18+6+7, both new AC11 cases visible by name | `rev1-similarity-suites.txt`, `rev1-similarity-suites-verbose.txt`, re-confirmed `rev1-similarity-suites-final.txt` |
| `npx vitest run ListingDetailView.buildSimilarListingsHref.test.ts` | 3/3 PASS, `git diff --stat` empty for that path | `rev1-buildSimilarListingsHref.txt` |
| `npm run test` (full suite) | **4 failed \| 84 passed (88 files)**, **5 failed \| 1562 passed (1567 tests)** — exactly the Task 790 baseline (same 4 files/5 named tests as §16.1's frozen owner run), +2 tests vs. the 1560 baseline count = the two new AC11 cases | `rev1-full-test-suite.txt` |
| `npm run build` | exit 0, `✓ Compiled successfully`, `ƒ /[locale]/listings/[slug]` present | `rev1-build.txt`, re-confirmed after the plant/revert cycle in `rev1-build-final.txt` |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations | `rev1-design-tokens-strict-mantine.txt` |
| `npm run check:story-coverage` | 32/32 covered, 0 unproven | `rev1-story-coverage.txt` |

**Block ② — probe (clean):** `runs/task803-rev1/similar-row-computed.json`, exit 0 — **SUPERSEDED in Revision 2**
(`probeHash 28a109b5…`, unrecoverable blob; see R12/R16 above). The cited clean arm is now
`runs/task803-rev2-clean/similar-row-computed.json` (`probeHash cb42864e…`, the shipped blob), exit 0.

**Block ③ — probe two-armed proof:** planted `runs/task803-rev1-planted/` exit 1 (all 5 cells `rowDisplay:grid`),
reverted + hash-matched + re-probed `runs/task803-rev1-reverted/` exit 0 — **SUPERSEDED in Revision 2**: the planted
arm's `probeHash 28a109b5…` does not match the shipped blob and its `failReason` is the duplicated form (see R12/R16
above). The authoritative two-armed proof is `runs/task803-rev2-planted/` exit 1 + `runs/task803-rev2-clean/` exit 0,
both `probeHash cb42864e…`, fired natively by the owner on 2026-09-10 — quoted above under R12/R16.

**Block ④ — AC6 re-plant:** `ac6-rev1-planted-violation-FAIL.txt` (4 failed/2 passed), `ac6-rev1-reverted-PASS.txt`
(6 passed) — quoted above under R13.

### Evidence-hygiene note — Revision 1

`npm run check:file-integrity`/`npm run check:mojibake` (not part of §16.9's required blocks, run as general
pre-handoff hygiene) initially failed on three pre-existing evidence `.txt` files carrying a stray UTF-8 BOM
(`ac6-rev1-planted-violation-FAIL.txt`/`ac6-rev1-reverted-PASS.txt`, both captured this session via the kickoff's own
`Set-Content -Encoding utf8` command, which writes UTF-8-with-BOM in Windows PowerShell 5.1; and the owner-authored
`i-check-listing-visibility.txt`, which additionally carried CP1252-of-UTF-8 mojibake on its ✅/— characters,
pre-dating this session). All three were re-saved as clean UTF-8 (no BOM), content otherwise byte-identical — the
owner's `i-check-listing-visibility.txt` PASSED/self-test result text is unchanged, only its encoding was corrected.
`rev1-file-integrity.txt`/`rev1-mojibake.txt` re-run clean (exit 0) after the fix.

**R19 note (Revision 2, closes F9/F11/AC20):** the in-place re-encode above was performed on the owner's own
Revision-0 transcript with **no pre-image retained** — there is no byte-for-byte proof, only this log's assertion,
that the PASSED/self-test text is otherwise unchanged. `docs/sessions/evidence/task803/rev2-check-listing-visibility.txt`
is a fresh, independently-captured native run of the same gate (Revision 2, `[Console]::OutputEncoding` set to UTF-8
first): `✅ Listing public-visibility invariant gate PASSED — 0 violations.` · `Allowlist: 7 entries, 0 stale.` ·
`Scanned 632 files.` · `EXIT_CODE=0` written inside the file. Cite both files: `i-check-listing-visibility.txt` (the
owner's original result, re-encoded with no pre-image) and `rev2-check-listing-visibility.txt` (a clean, independently
verifiable re-run of the same gate, same PASS/0-violations/632-files outcome).

### Deviations and limitations — Revision 1

- **Deviation bullet — `SUPERSEDED` by Revision 2 (R16/AC17, closes F8).** The original text below asserted the
  fail-reason simplification landed *before* the planted-violation run was captured. The artifacts show the
  opposite: `runs/task803-rev1-planted` carries `probeHash 28a109b5…` (not the shipped `cb42864e…`) and its
  `failReason` is the duplicated `"rowDisplay: grid; rowDisplay: grid"` string, so the simplification landed **after**
  that capture, and the pre-simplification blob is unrecoverable (`git cat-file -p 28a109b5…` →
  `fatal: Not a valid object name`). The corrected bullet is under R12/R16 above; this one is retained, marked
  superseded, for the record rather than deleted.
  ~~the probe script's fail-reason collection initially pushed the same `rowDisplay: grid` string twice per cell (two
  separate conditions both matching the grid case); simplified to one condition before the planted-violation run was
  captured, so the quoted evidence already reflects the corrected script. No functional effect — the fail-closed
  outcome and exit code were identical either way.~~
- **Limitation (carried over from Revision 0, unchanged):** the dev DB still seeds only 1 similar-listing match for
  the probed slug, so `cardCount`/`rowOverflows` could not be observed on a genuinely overflowing row; both arms of
  §16.4d's `overflowAssertionApplicable` contract are nonetheless visible in the JSON (`false` here), and the ≥9-row
  branch stays covered by `SimilarListings.ladder.test.ts` (AC3/AC4), not left unverified.
- **Confirmed untouched (git status --porcelain):** `FeaturedListingsView.module.css`, `page.tsx`, `filterEngine.ts`,
  `src/types/database.ts`, `ListingDetailView.buildSimilarListingsHref.test.ts`.

## Revision 2 — 2026-09-10 (kickoff §17, orchestrator-directed remediation of the 2026-09-10 review)

**Re-entry mode: `remediation`. Documentation and evidence only — no product code, no test, no script changes**, per
§17.1. Origin: the 2026-09-10 implementation review, decision `NEEDS REVISION`, findings F8 (`P2`) and F9/F10/F11
(`P3`). Frozen per §17.1: AC11/R11, AC14/R13, AC16/R15, AC15/R14's code half, AC7's computed-style half (closed by
`runs/task803-rev2-clean`), AC13 — none re-run, none re-verified. Every file under `src/` and `scripts/` stayed out
of scope; `git --no-optional-locks status --short` before and after this revision is identical (13 entries, same
paths) and `git hash-object scripts/task803-similar-row-computed.mjs` still returns
`cb42864ef632415aab7a6e77486f741cb3fc27a2`.

### R16 [AC17, closes F8] — the probe evidence record becomes true

`runs/task803-rev1` and `runs/task803-rev1-planted` are now labelled `SUPERSEDED` in the R12 section and in the
Revision-1 validation table (Block ② / ③ rows) — both directories are **retained**, not deleted, as the record for
the unrecoverable script blob `probeHash 28a109b5ea42de2c54bb6f3b61cb6bc417e27adc`
(`git cat-file -p 28a109b5…` → `fatal: Not a valid object name`). `runs/task803-rev1-planted`'s verbatim
`failReason` is the duplicated `"rowDisplay: grid; rowDisplay: grid"` string, not the single-string form this log
originally quoted. The owner's native 2026-09-10 run — `runs/task803-rev2-planted` (exit 1, all 5 cells
`"failReason": "rowDisplay: grid"`, single form) and `runs/task803-rev2-clean` (exit 0), both
`probeHash cb42864ef632415aab7a6e77486f741cb3fc27a2` — is now cited as **the** two-armed proof, attributed to the
owner, not to this session. The CSS `git hash-object` identity (`5486641b37c23c9297835f1ff2bad8a80fbf8461` before the
plant and after the revert) is added to the R12 evidence. The Revision-1 deviation bullet is marked `SUPERSEDED` in
place (struck through, retained) and replaced with the corrected ordering: the fail-reason simplification landed
**after** `runs/task803-rev1-planted` was captured, evidenced by that run's blob/duplicated-string mismatch against
the shipped script, and the pre-simplification blob is unrecoverable.

### R17 [AC18, closes F9] — the final lint artifact, correctly encoded

`rev1-lint.txt` (captured 21:11:31, before the 21:19:58 AC6 re-plant/revert write) is marked `SUPERSEDED` in the
Revision-1 validation table. This session re-captured the gate with `[Console]::OutputEncoding` set to UTF-8 first:
`docs/sessions/evidence/task803/rev2-lint.txt` reads **`✖ 72 problems (0 errors, 72 warnings)`** (the correct glyph,
not the `Ô£û` mojibake `rev1-lint.txt`/the owner's first native run carried), `EXIT_CODE=0` written inside the file,
neither `SimilarListings.tsx` nor `similarity.ts` named. The 72-warning result itself is unchanged from every prior
capture — only the transcript's encoding was wrong.

### R18 [AC19, closes F10] — the `Files Changed` table matches the worktree

The table above now carries `scripts/task803-similar-row-computed.mjs` and this session log itself as their own
rows, and names `docs/sessions/evidence/task803/` once as the evidence root instead of leaving it unlisted.
`docs/backlog.md` is removed from the table — a fresh `git --no-optional-locks status --short` (13 entries: 5
modified, 8 untracked) no longer lists it, because its Revision-1/Revision-2 edits are already committed at `HEAD`
(`19046730020b87a60f2ff0e8dd2cfd566cdedc4e`, "docs(Task803): file Revision 2 kickoff (R16-R19)"). Every one of the
13 current worktree paths now appears in the table exactly once.

### R19 [AC20, closes F11] — the owner-authored gate transcript, independently re-verified

`i-check-listing-visibility.txt` (the owner's Revision 0 transcript) was re-encoded in place during Revision 1's
evidence-hygiene pass with **no pre-image retained** — recorded as a limitation in the Evidence-hygiene note above,
not fixed retroactively (fixing it further would only compound the same problem). `rev2-check-listing-visibility.txt`
is a fresh, independently-captured native run of `docs/critical-flow-registry.md:70`'s gate:
`✅ Listing public-visibility invariant gate PASSED — 0 violations.`, `Allowlist: 7 entries, 0 stale.`,
`Scanned 632 files.`, `EXIT_CODE=0` inside the file — the same PASS/0-violations/632-files result as the owner's
transcript, captured independently of it.

### Verification — Revision 2 (§17.8)

All commands from repo root, `[Console]::OutputEncoding` set to UTF-8 first. `node -p process.platform` → `win32`.

| Command | Result | Transcript |
|---|---|---|
| `git hash-object scripts/task803-similar-row-computed.mjs` | `cb42864ef632415aab7a6e77486f741cb3fc27a2` — unchanged | inline |
| `npm run lint` | `✖ 72 problems (0 errors, 72 warnings)`, glyph correct, `EXIT_CODE=0` | `rev2-lint.txt` |
| `npm run check:listing-visibility` | PASSED, 0 violations, 7 allowlist entries / 0 stale, 632 files, `EXIT_CODE=0` | `rev2-check-listing-visibility.txt` |
| `npm run build` (`.next` deleted first) | `✓ Compiled successfully in 87s`, `ƒ /[locale]/listings/[slug]` present, `EXIT_CODE=0` | `rev2-build.txt` |
| `npm run check:file-integrity` | 67 files clean, exit 0 (run after every new transcript above was written) | inline |
| `npm run check:mojibake` | 4035 files scanned, 0 artifacts, exit 0 (run after every new transcript above was written) | inline |
| `git --no-optional-locks status --short` | 13 entries, identical to Revision 2's start — no `src/` or `scripts/` path added, removed or modified | inline |
| `docs/backlog.md` line count | 79 (baseline `git show HEAD:docs/backlog.md \| wc -l` = 79; unchanged after this revision's edits — no `BACKLOG LIMIT BREACH`) | inline |

### Deviations and limitations — Revision 2

- None beyond what R16-R19 already state. No `src/`, `scripts/`, test, or story file was touched; the only writes
  were to this session log, `docs/backlog.md` (existing single-line rows only), and new evidence transcripts under
  `docs/sessions/evidence/task803/`.
- **Confirmed untouched (`git --no-optional-locks status --short`):** every `src/` and `scripts/` path from
  Revisions 0/1, unchanged; `scripts/task803-similar-row-computed.mjs`'s blob hash unchanged.
- **Still owed, unchanged by this revision:** the `OWNER VISUAL QA REQUIRED` matrix (kickoff §13) — not part of
  Revision 2 and cannot be closed by it.

## Backlog update

`docs/backlog.md` Last Session row, Sprint 72 row and the `803 · 804` task-registry row updated to
`803 IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` reflecting Revision 2's R16-R19 closure. Baseline physical line
count (`git show HEAD:docs/backlog.md | wc -l`, HEAD = `19046730020b87a60f2ff0e8dd2cfd566cdedc4e`): **79**. Resulting
line count after this revision's edits: **79** (unchanged — every edit replaced an existing single-line row; none
added a new line). No `BACKLOG LIMIT BREACH`.
