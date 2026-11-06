# Sprint 18 — Task 298 kickoff (Saved-search canonical hash: align with Task 294 multi-select)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **DB / server action / filter-engine** task — pre-read: `docs/data-access-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md`, `docs/ai-behavior.md` Note 14 (Global change). No scope change; STOP & ASK if ambiguous.

---

```
Type:        bugfix (saved-search canonical hash order-stability)
Priority:    HIGH (real duplicate-creation bug introduced by Task 294 multi-select)
Area:        savedSearchCanonicalize.ts + saveSavedSearch action + tests
```

## Why this task exists (2026-05-29 orchestrator review of Task 294)

Task 294 made `condition`, `heating`, `wall_type`, `offer_type` comma-separated multi-select URL params + arrays in `ParsedFilters` and `applyListingFilters`. The cron saved-search matcher (`api/cron/saved-searches/route.ts`) auto-picked-up the change because it routes through `parseSearchParams` + `applyListingFilters`.

**The canonical hash path was NOT updated:**

- `src/modules/listings/lib/savedSearchCanonicalize.ts` keeps `CanonicalFilters.condition: string` (scalar) + `heating: string` + `wallType: string` + `offerType: string`.
- `canonicalizeFilters()` reads each via `s(key)` — which returns the whole comma-string as ONE value (e.g. `'good,new_build'`).
- `computeFiltersHash()` hashes JSON of canonical — so `{condition: 'good,new_build'}` ≠ `{condition: 'new_build,good'}` even though they describe the same set.
- `saveSavedSearch()` (in `src/modules/cabinet/actions/index.ts`) deduplicates by `filters_hash`. Two URLs with the same multi-select values in DIFFERENT ORDER produce DIFFERENT hashes → the user can save the same search twice without the dedup catching it.

**Confirmed scope of the bug** (orchestrator verified 2026-05-29):
- `rooms`, `layout_features`, `purchase_conditions` are ALREADY array-typed in `CanonicalFilters` AND already canonicalized with `.sort()` → those four fields are not affected.
- The four new multi-select fields (`condition`, `heating`, `wallType`, `offerType`) are affected.
- The matcher works "accidentally": `canonicalToSearchParams` re-emits `condition=good,new_build` as a single param value, which `parseSearchParams` then comma-splits into an array, which `applyListingFilters` correctly uses with `.in()`. So **listing matching works**; **only deduplication is broken**.
- `marketType` stays scalar (Task 294 decision); leave it as `string`.

## Goal

Update `savedSearchCanonicalize.ts` (and its consumers) so that the four new multi-select fields participate in canonicalization the same way `purchase_conditions` and `layout_features` already do: as **sorted arrays**, producing an order-stable hash.

After this task:
- `condition=good,new_build` and `condition=new_build,good` produce IDENTICAL `filters_hash`.
- `saveSavedSearch` dedup correctly rejects the second save attempt.
- The cron matcher's behavior is unchanged (still correct).

## Required investigation (PASTE in session log)

```
sed -n '1,120p' src/modules/listings/lib/savedSearchCanonicalize.ts
sed -n '75,120p' src/modules/cabinet/actions/index.ts
grep -rn "computeFiltersHash\|canonicalizeFilters\|canonicalToSearchParams\|filters_hash" src/
# Existing tests if any:
find src -iname "*savedSearchCanonicalize*test*" -o -iname "*savedSearch*test*"
# Confirm rooms / layout_features / purchase_conditions are the precedent for sorted-array canonicalization:
grep -n "sort\b" src/modules/listings/lib/savedSearchCanonicalize.ts
# Verify cron matcher's path (read-only — no edits in cron):
sed -n '20,120p' src/app/api/cron/saved-searches/route.ts
```

## Scope (files Sonnet may touch)

- `src/modules/listings/lib/savedSearchCanonicalize.ts` — change four fields to arrays + add `.sort()` + update `canonicalizeFilters` (use comma-split via the same `s` helper then sort) + update `canonicalToSearchParams` (write comma-joined values for the four fields).
- `src/modules/listings/lib/savedSearchCanonicalize.test.ts` (NEW if missing; extend if exists) — tests proving order-independence of hash for the four fields + the precedent `purchase_conditions` / `layout_features` / `rooms` order-independence stays intact.
- **DATA MIGRATION (STOP & ASK first):** existing rows in `saved_searches` table have `filters_hash` computed under the OLD canonical shape (scalar comma-string). After this change, the same URL would produce a DIFFERENT hash → existing rows' hashes become stale. Options:
  - (A) Leave existing rows alone — only NEW saves use the new hash. Old saves keep their stale hash; dedup against an old save will fail if the user re-saves the same URL (creates a duplicate). Acceptable if `saved_searches` table is small / freshly-launched feature.
  - (B) Backfill: write a one-time `node` migration script that re-canonicalizes every existing row's `filters` field, recomputes `filters_hash`, and updates the row. Drop duplicates in the process.
  - **STOP & ASK** which path the orchestrator wants; do not migrate without explicit approval.
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-298-saved-search-canonical-hash.md` (NEW).

## Out of scope (do NOT touch)

- `src/modules/listings/domain/filterEngine.ts` — already correct (Task 294).
- `src/app/api/cron/saved-searches/route.ts` — matcher works, do not edit.
- `src/modules/cabinet/components/SavedSearchesTab.tsx` — UI renders existing rows; works regardless of canonical shape change (canonicalToSearchParams round-trips).
- The 4 new multi-select fields' URL convention — keep comma-separated (Task 294 decision).
- `marketType` — stays scalar.
- Other admin/public filter logic.
- New features.

## Positive flow (happy path)

Actor: user saves a search.
1. User opens listings with `?condition=good,new_build&heating=gas`.
2. Clicks Save Search → `saveSavedSearch(searchParams, name)` → `canonicalizeFilters` reads the four fields as sorted arrays: `{condition: ['good', 'new_build'], heating: ['gas'], ...}`.
3. `computeFiltersHash` hashes JSON of the sorted-keys, sorted-arrays object → stable hash H1.
4. Insert into `saved_searches` with `filters` + `filters_hash = H1`.
5. User opens a different URL `?condition=new_build,good&heating=gas` (same intent, different order).
6. Clicks Save Search → `canonicalizeFilters` sorts again → same arrays → same hash H1 → `.eq('filters_hash', H1).maybeSingle()` finds existing → returns `already_exists` error.

## Negative flow (every off-happy-path branch)

- **Empty multi-select:** `?condition=` (empty value) → `s('condition')` returns `''` → `''.split(',').filter(Boolean) = []` → `condition` field is omitted from canonical (matches the existing `if (rooms.length)` pattern). No `condition: []` in canonical (would mean "filter applied but no values" = same as no filter).
- **Single value:** `?condition=good` → `['good']` → still produces an array; hash differs from pre-Task-298 scalar hash for the same URL (acceptable — Option A's known consequence).
- **Unknown enum value:** the canonicalizer should NOT validate enums (it just normalizes shape — enum validation happens in `parseSearchParams` downstream). Preserve current behavior.
- **Round-trip:** `canonicalToSearchParams({condition: ['good', 'new_build']})` writes `?condition=good,new_build` (comma-joined, sorted). When fed back to `parseSearchParams` → `conditions: ['good', 'new_build']`. Matcher behavior unchanged.
- **Existing row with stale hash:** if a user re-saves the same URL that's already saved under the OLD hash → CURRENT dedup misses it → duplicate created. Document this in the session log as the Option-A migration cost; orchestrator decides A vs B.
- **Backfill failure (Option B only):** if the backfill script can't reach the DB / encounters a row whose `filters` is malformed → log + skip that row, do not abort the whole migration. Document each skipped row.

## Acceptance criteria (literal)

- `CanonicalFilters.condition`, `heating`, `wallType`, `offerType` are typed as `string[]` (optional, omitted when empty).
- `canonicalizeFilters` produces sorted arrays for the four new multi-select fields (matching the existing `rooms.sort` / `layoutFeatures.sort` / `purchaseConditions.sort` pattern).
- `canonicalToSearchParams` writes comma-joined sorted values for the four fields (preserving the Task-294 URL convention).
- `computeFiltersHash({condition: ['good', 'new_build'], ...}) === computeFiltersHash({condition: ['new_build', 'good'], ...})` — verified in a test.
- Existing tests for `rooms` / `layout_features` / `purchase_conditions` order-stability still pass.
- New tests cover: (a) hash equality across value orderings for each of the four new fields; (b) round-trip canonicalToSearchParams → parseSearchParams produces the same `ParsedFilters` as the original URL; (c) empty multi-select → field omitted from canonical (not `[]`); (d) single value → 1-element array.
- `saveSavedSearch` dedup test (mock the supabase client): re-saving an order-reversed multi-select returns `already_exists`.
- Migration path approved by orchestrator (A leave-as-is OR B backfill); if B, script is in `scripts/migrations/` and is idempotent.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npx vitest run` → all green (new tests added). `npm run lint` → no new errors/warnings vs current baseline.
- `npm run governance:primitives` and `npm run governance:tailwind` → no regression.
- Note 18 self-validation + AC self-audit + "Files Changed" table in session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · vitest green · hash order-stable for 4 fields · cron matcher unchanged · scope=clean · PASS`.

## Final report required

1. Files Changed table. 2. BEFORE/AFTER `CanonicalFilters` type. 3. Hash equality proof (test output). 4. Cron matcher unchanged confirmation (re-paste the cron route's flow trace). 5. Migration path chosen + orchestrator approval reference. 6. (If B) backfill script output + rows updated + duplicates dropped. 7. Confirmation no production code outside scope touched.

Do NOT emit git commands. Do NOT run git. STOP & ASK on migration path (A vs B) before editing data.
