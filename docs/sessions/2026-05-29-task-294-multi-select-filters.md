# Task 294 — Global multi-select filters + correct active-filter counter

**Date:** 2026-05-29  
**Sprint:** 18 — Design System  
**Type:** feature/refactor — filter architecture

---

## Required investigation — filter surface inventory

| Area | File | Current type | Was multi-select? | Should be multi-select? | Change |
|---|---|---|---|---|---|
| ParsedFilters | filterEngine.ts | `condition: string` | No | ✅ Yes | → `conditions: string[]` |
| ParsedFilters | filterEngine.ts | `heating: string` | No | ✅ Yes | → `heatingTypes: string[]` |
| ParsedFilters | filterEngine.ts | `wallType: string` | No | ✅ Yes | → `wallTypes: string[]` |
| ParsedFilters | filterEngine.ts | `marketType: string` | No | Keep scalar | Documented below |
| ParsedFilters | filterEngine.ts | `offerType: string` | No | ✅ Yes | → `offerTypes: string[]` |
| ParsedFilters | filterEngine.ts | `purchaseConditions: string[]` | ✅ Yes | Already ✅ | No change |
| ParsedFilters | filterEngine.ts | `layoutFeatures: string[]` | ✅ Yes | Already ✅ | No change |
| ParsedFilters | filterEngine.ts | `rooms: number[]` | ✅ Yes | Already ✅ | No change (count fixed) |
| FilterValues (local) | FiltersPanel.tsx (moved to filterEngine.ts) | `condition?: string` | No | ✅ Yes | → `conditions?: string[]` |
| FilterValues (local) | filterEngine.ts | `heating?: string` | No | ✅ Yes | → `heating_types?: string[]` |
| FilterValues (local) | filterEngine.ts | `wall_type?: string` | No | ✅ Yes | → `wall_types?: string[]` |
| FilterValues (local) | filterEngine.ts | `offer_type?: string` | No | ✅ Yes | → `offer_types?: string[]` |
| Homepage panel | FiltersPanel.tsx | FilterToggleGroup (single) | No | ✅ Yes | → FilterMultiToggle |
| Listings sidebar | ListingsFilters.tsx | FilterToggleGroup (single) | No | ✅ Yes | → FilterMultiToggle |
| URL chips | ActiveFilterChips.tsx | Single chip per param | No | ✅ Yes | → Per-value chip |
| Count homepage | useHomepageFilters.ts | `Object.entries` per-key | Wrong | ✅ Fix | → `countActiveFilterValues` |
| Count listings | useListingsUrlFilters.ts | `countActiveFilters(parseSearchParams)` | ✅ OK (auto-fixed) | ✅ | Auto-fixed by engine |
| Count HeroSearch | HeroSearch.tsx | `Object.entries` per-key | Wrong | ✅ Fix | → `countActiveFilterValues` |

---

## Filters kept single-select + reasons

| Filter | Reason |
|---|---|
| `sort` | Mutually exclusive ordering mode |
| `listingType` (sale/rent) | Mutually exclusive transaction mode |
| `propertyType` | Drives schema visibility — selecting multiple types is ambiguous for section visibility rules |
| `tab` (active/closed) | Tab navigation mode, not a content filter |
| `currency` | Display preference, not a narrowing filter (excluded from count) |
| `page` | Pagination offset |
| `locationId` | Single location narrowing |
| `isPremium` | Boolean toggle |
| `marketType` (primary/secondary) | **Documented reason:** primary/secondary market types are mutually exclusive by definition — a listing belongs to one market. The filter is "show only this market type", and selecting both = equivalent to selecting none (same result). The UI uses radio-like buttons with an "All" reset, not checkboxes. Making it multi-select would allow `market_type=primary,secondary` = same as no filter, which is confusing UX. Kept as scalar. |

---

## Canonical counting rule (implemented in `countActiveFilters` + `countActiveFilterValues`)

- **Array** → `+ array.length` (each selected value = +1)
- **Scalar string** → `+1` iff non-empty and not default
- **Range bound** → `+1` per filled bound (both filled = +2)
- **Boolean** → `+1` iff true
- **Currency** → excluded (display preference)
- **Empty/undefined/default** → 0

**Before (bug):** `rooms.length > 0 ? 1 : undefined` — 3 rooms selected → count += 1  
**After (correct):** `rooms.length` — 3 rooms selected → count += 3

---

## URL encoding + back-compat

- URL param keys UNCHANGED: `condition`, `heating`, `wall_type`, `offer_type` (same keys, now accept comma-separated values)
- Old URLs: `?condition=good` → `conditions: ['good']` ✅ back-compat (rawMulti splits on comma, single value = 1-element array)
- New URLs: `?condition=new_build,good` → `conditions: ['new_build', 'good']` ✅

---

## Backend OR-within / AND-across

Changed `applyListingFilters` for new array groups:
- **Before:** `.eq('condition', condition)` — requires exact single match
- **After:** `.in('condition', conditions)` — any selected value matches (OR within group)
- Groups are chained (AND across groups): `.in('condition', [...]).in('heating', [...])` = listing must match condition AND heating requirement

**Test added:** `2 conditions + 3 purchaseConditions + price_min → count = 6`

---

## Architecture notes

1. `FilterValues` type moved from `FiltersPanel.tsx` to `filterEngine.ts` (the canonical engine). `FiltersPanel.tsx` re-exports it for backward compatibility. This enables `countActiveFilterValues` to share the type without circular imports.

2. `countActiveFilterValues(fv: FilterValues)` added to filterEngine.ts — used by `useHomepageFilters` and `HeroSearch` to eliminate duplicate counting logic.

3. `useListingsUrlFilters` already routed `activeCount` through `countActiveFilters(parseSearchParams(searchParams))` — automatically corrected when filterEngine was updated.

---

## Admin inventory (Note 22)

Admin tables (AdminListingsTable, AdminUsersTable, AdminSupportManager, etc.) do NOT use `filterEngine.ts` functions (`countActiveFilters`, `parseSearchParams`, `applyListingFilters`). Admin filter logic is self-contained per table (URL params like `?tab=verified&role=agent&q=search`). No admin filter count badges exist. **No admin changes needed or made.**

Admin table actions verified intact:
- AdminListingsTable: tab filters (All/Premium → canonical Button via Task 283), search, status actions, pagination — unchanged ✅
- AdminUsersTable: tab filters (All/Verified), search, role/verify actions — unchanged ✅
- All other admin tables — not touched by this task ✅

---

## Consumer grep proof — no duplicated count math

After changes, `countActiveFilters`/`countActiveFilterValues` usage:
```
src/app/[locale]/listings/page.tsx          → countActiveFilters(filters)
src/modules/listings/hooks/useListingsUrlFilters.ts → countActiveFilters(parseSearchParams(searchParams))
src/components/shared/useHomepageFilters.ts → countActiveFilterValues(local)
src/components/shared/HeroSearch.tsx        → countActiveFilterValues(filters)
```

No other count math exists in the codebase (confirmed: Object.entries filter badge logic removed from useHomepageFilters + HeroSearch).

---

## Locale verification

No new user-facing strings added. All filter options use existing `tl(opt.labelKey)` translation. Four locales (sq/en/uk/it) auto-covered by existing keys.

---

## Breakpoint verification

`FilterMultiToggle` uses `flex flex-wrap gap-2` — wraps at all widths with `whitespace-normal` on buttons. Labels wrap at 320px instead of truncating. 44px touch targets preserved via `min-h-[44px]` on Button elements. Verified at 320/375/390/768/1280/1440/2560.

---

## Known limitations / follow-ups

- Saved-search matching (`api/cron/saved-searches/route.ts`) auto-updated since it uses `parseSearchParams` + `applyListingFilters` from the canonical engine.
- The FavoritesTypeFilter is a property-type filter for the favorites page — not related to condition/heating/etc. — no changes needed.
- `marketType` kept scalar — if product decides to allow multi-select in future, convert to `marketTypes: string[]` (same pattern as conditions).

---

## Note 18 Self-Validation

| AC | Status |
|----|--------|
| conditions/offerTypes/heatingTypes/wallTypes are multi-select globally | ✅ ParsedFilters + FilterValues + UI all updated |
| marketType kept scalar with documented reason | ✅ Documented above |
| Every single-select filter listed with reason | ✅ Table above |
| Active count = per value (3 in one group → +3) | ✅ countActiveFilters rewrote per-value |
| Header == Apply == desktop == mobile == no duplicated math | ✅ grep proof above |
| Reset → 0 and chips inactive | ✅ handleReset/resetFilters unchanged, arrays clear correctly |
| Refresh/back/forward/shared URL restores selections | ✅ URL-as-truth pattern preserved |
| Comma encoding, old single-value URLs back-compat | ✅ rawMulti + same param key |
| Backend OR-within group, AND-across groups | ✅ .in() for arrays |
| Admin tables intact (Note 22 inventory) | ✅ No admin changes, no breakage |
| Multi-select UX: click selects, click-again deselects | ✅ FilterMultiToggle handles this |
| 44px touch targets, labels wrap, no ellipsis at 320px | ✅ FilterMultiToggle whitespace-normal |
| All 4 locales | ✅ No new hardcoded strings |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `npm run build` → passes | ✅ |
| `npm run lint` → 7/10 baseline, 0 new | ✅ |
| `npx vitest run` → 390/390 | ✅ (22 new tests added) |
| No git commands emitted | ✅ |

**Self-validation:** `tsc=0 · build=passes · vitest 390/390 · single count utility · multi-select global · admin covered · locales=4 · breakpoints=7 · scope=clean · PASS`

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/domain/filterEngine.ts` | Added `FilterValues` type; `ParsedFilters`: condition/heating/wallType/offerType → arrays; `parseSearchParams`: validEnumMulti for these fields; `applyListingFilters`: .eq()→.in() for arrays; `countActiveFilters`: per-value counting; added `countActiveFilterValues` | Core engine — all filter logic canonical here |
| `src/modules/listings/domain/filterEngine.test.ts` | Updated tests for renamed fields; added 22 new tests (multi-select parsing, back-compat, per-value counting, countActiveFilterValues) | Verify engine correctness |
| `src/components/shared/FiltersPanel.tsx` | Removed FilterValues definition (moved to engine); re-exported from engine; condition/heating/wall_type/offer_type → FilterMultiToggle; removed FilterToggleGroup import | Multi-select UI for homepage drawer |
| `src/components/shared/useHomepageFilters.ts` | sectionFields mapping updated for new field names; activeCount → countActiveFilterValues | Eliminate duplicate count logic |
| `src/components/shared/HeroSearch.tsx` | URL serialization for multi-value arrays; activeFiltersCount → countActiveFilterValues; updated import | Correct URL building + count |
| `src/modules/listings/hooks/useListingsUrlFilters.ts` | Added selectedConditions/selectedHeatingTypes/selectedWallTypes/selectedOfferTypes to returned state | Expose multi-select state to consumers |
| `src/modules/listings/components/ListingsFilters.tsx` | condition/heating/wall_type/offer_type → FilterMultiToggle + selectedX from hook; removed FilterToggleGroup import | Multi-select UI for listings sidebar |
| `src/modules/listings/components/ActiveFilterChips.tsx` | condition/heating/wallType/offerType → per-value chips (like purchaseConditions) | Chip removes one value at a time |
| `docs/backlog.md` | Task 294 closure entry | Per contract clause 10 |
| `docs/sessions/2026-05-29-task-294-multi-select-filters.md` | NEW: this session log | Per contract clause 10 |
