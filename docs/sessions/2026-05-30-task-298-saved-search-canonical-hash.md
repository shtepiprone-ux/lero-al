# Task 298 — Saved-search canonical hash: align with Task 294 multi-select

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** bugfix (saved-search canonical hash order-stability)

---

## Investigation

**Bug confirmed:** `condition`, `heating`, `wallType`, `offerType` were typed as `string` in `CanonicalFilters` and read via `s(key)` which returned the full comma-string as one value (e.g. `'good,new_build'`). Two identical searches with differently-ordered multi-select values produced different hashes → dedup failed silently.

**Precedent for fix:** `rooms`, `layoutFeatures`, `purchaseConditions` already typed as `string[]` / `number[]` with `.sort()` — same pattern applied to the 4 new fields.

**Consumers of canonicalize functions:**
- `src/modules/cabinet/actions/index.ts` — `saveSavedSearch` (dedup write path) ✅ no edit needed
- `src/app/api/cron/saved-searches/route.ts` — `canonicalToSearchParams` (cron matcher read path) ✅ no edit needed
- `src/modules/cabinet/components/SavedSearchesTab.tsx` — `canonicalToSearchParams` (URL restore) ✅ no edit needed
- `src/modules/listings/components/SaveSearchButton.tsx` — `canonicalizeFilters` ✅ no edit needed

**Migration path: Option A approved** (orchestrator 2026-05-30) — leave existing `saved_searches` rows untouched. Only new saves from this point forward use the corrected hash. Known cost: a user who re-saves an identical multi-select search that was saved under the OLD hash will create one duplicate. Acceptable given that saved_searches is a fresh feature with low row counts.

**Option A legacy-shape compatibility (micro-fix, 2026-05-30):** `canonicalToSearchParams` must handle both `string[]` (new rows) and `string` (legacy DB rows with old scalar canonical shape like `condition: "good,new_build"`). Without this, `SavedSearchesTab` and the cron route would throw `TypeError: filters.condition.join is not a function` when reading old rows. A `normalizeMultiValueForParams(value: unknown)` helper was added inside `canonicalToSearchParams` — it accepts both shapes and always produces a sorted, comma-joined string. The exported `CanonicalFilters` type stays `string[]` (correct for new saves).

---

## CanonicalFilters BEFORE → AFTER

```diff
- condition?:          string
- heating?:            string
- wallType?:           string
+ condition?:          string[]
+ heating?:            string[]
+ wallType?:           string[]
  marketType?:         string      ← stays scalar (Task 294 decision)
  layoutFeatures?:     string[]    ← unchanged
- offerType?:          string
+ offerType?:          string[]
  purchaseConditions?: string[]    ← unchanged
```

## canonicalizeFilters BEFORE → AFTER (4 fields)

```diff
- const condition = s('condition'); if (condition) canonical.condition = condition
- const heating = s('heating'); if (heating) canonical.heating = heating
- const wallType = s('wall_type'); if (wallType) canonical.wallType = wallType
- const offerType = s('offer_type'); if (offerType) canonical.offerType = offerType
+ function ms(key: string): string[] {
+   return s(key).split(',').map(v => v.trim()).filter(Boolean).sort()
+ }
+ const condition = ms('condition'); if (condition.length) canonical.condition = condition
+ const heating = ms('heating'); if (heating.length) canonical.heating = heating
+ const wallType = ms('wall_type'); if (wallType.length) canonical.wallType = wallType
+ const offerType = ms('offer_type'); if (offerType.length) canonical.offerType = offerType
```

## canonicalToSearchParams BEFORE → AFTER (4 fields, including micro-fix)

```diff
+ // Module-private helper — handles string[] (new) and string (legacy DB shape)
+ function normalizeMultiValueForParams(value: unknown): string | undefined {
+   if (value == null) return undefined
+   if (typeof value === 'string') {
+     const vals = value.split(',').map(v => v.trim()).filter(Boolean).sort()
+     return vals.length ? vals.join(',') : undefined
+   }
+   if (Array.isArray(value)) {
+     const sorted = (value as string[]).filter(Boolean).sort()
+     return sorted.length ? sorted.join(',') : undefined
+   }
+   return undefined
+ }

- if (filters.condition)    p.set('condition', filters.condition)
- if (filters.heating)      p.set('heating', filters.heating)
- if (filters.wallType)     p.set('wall_type', filters.wallType)
- if (filters.offerType)    p.set('offer_type', filters.offerType)
+ const cond = normalizeMultiValueForParams(filters.condition); if (cond) p.set('condition', cond)
+ const heat = normalizeMultiValueForParams(filters.heating);   if (heat) p.set('heating', heat)
+ const wall = normalizeMultiValueForParams(filters.wallType);  if (wall) p.set('wall_type', wall)
+ const offr = normalizeMultiValueForParams(filters.offerType); if (offr) p.set('offer_type', offr)
```

---

## Hash equality proof (test output)

```
Test Files  1 passed (1)
Tests  29 passed (29)
```

Key equality tests:
- `condition=good,new_build` ≡ `condition=new_build,good` → same hash ✅
- `heating=gas,electric` ≡ `heating=electric,gas` → same hash ✅
- `wall_type=panel,brick` ≡ `wall_type=brick,panel` → same hash ✅
- `offer_type=rent,sale` ≡ `offer_type=sale,rent` → same hash ✅
- Combined all 4 fields reversed → same hash ✅
- Precedent fields (rooms, layoutFeatures, purchaseConditions) still pass ✅

## Dedup test proof

```
Test Files  1 passed (1)
Tests  2 passed (2)
```

- Re-saving `condition=new_build,good` when `condition=good,new_build` already exists → `{ code: 'already_exists' }` ✅
- New search (no existing row) → proceeds to insert ✅

## Cron matcher unchanged

`api/cron/saved-searches/route.ts` uses `canonicalToSearchParams` to reconstruct URL params from stored canonical, then calls `parseSearchParams` + `applyListingFilters`. After this change:
- `canonicalToSearchParams({condition: ['good', 'new_build']})` → `?condition=good,new_build`
- `parseSearchParams(...)` comma-splits `condition` → `conditions: ['good', 'new_build']`
- `applyListingFilters` uses `.in()` → identical behavior to before ✅

---

## Migration path

**Option A — approved.** Existing `saved_searches` rows keep their stale hash. No DB changes. No backfill script. No SQL emitted.

Known migration cost: if a user re-saves a search that contains one of the 4 multi-select fields (condition/heating/wallType/offerType) and that same search was previously saved under the OLD hash, the dedup check will miss the old row → one duplicate created. After that duplicate exists, the new-hash dedup prevents further duplicates.

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/lib/savedSearchCanonicalize.ts` | `condition/heating/wallType/offerType`: `string` → `string[]`; `canonicalizeFilters` uses `ms()` helper; `canonicalToSearchParams` uses `normalizeMultiValueForParams` (backward-compat with legacy scalar DB rows) | Core bugfix + Option A legacy-shape compatibility |
| `src/modules/listings/lib/savedSearchCanonicalize.test.ts` | 29 pure-function tests + 7 legacy scalar backward-compat tests = 36 total | Hash order-stability + old-row crash-safety |
| `src/modules/cabinet/actions/__tests__/saveSavedSearch.dedup.test.ts` | NEW — 2 dedup tests | AC: saveSavedSearch dedup test |
| `docs/sessions/2026-05-30-task-298-saved-search-canonical-hash.md` | This file | Session log |
| `docs/backlog.md` | Updated | Clause 10 |

---

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 |
| `npx vitest run` | ✅ 428 passed (390 pre-existing + 29 pure-function + 2 dedup + 7 legacy backward-compat = 428) |
| `governance:tailwind` | ✅ C0/H0/M0 |
| `governance:primitives` | ✅ C0/H0/M0 |
| Hash order-stable for 4 new fields | ✅ confirmed by tests |
| Legacy scalar shape does not crash | ✅ 7 backward-compat tests: `string` → sorted comma-join; empty string → omit; mixed shapes handled |
| Cron matcher unchanged | ✅ no edits to cron route; round-trip verified |
| Option A migration approved | ✅ orchestrator 2026-05-30 |
| No DB migration / SQL emitted | ✅ |

## Self-validation verdict

`Self-validation: tsc=0 · build=passes · lint=0/0 · vitest=428/428 · hash order-stable for 4 fields · legacy scalar backward-compat · cron matcher unchanged · Option A migration · governance=C0/H0/M0 · scope=clean · UNCOMMITTED · PASS`
