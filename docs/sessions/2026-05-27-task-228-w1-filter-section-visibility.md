# Task 228 — W.1 — Filter sections disappearing on property-type change

**Date:** 2026-05-27  
**Sprint:** 12  
**Epic:** W — Listings Filter Bar & Drawer Polish

---

## Audit (Scope 1)

### Root cause

`getFilterVisibility(propertyType)` in `filterEngine.ts` delegates to `getSchema(propertyType).ui.filters`. The section `market_type` ("Ринок нерухомості") was only included in `SCHEMA_APARTMENT.ui.filters` — all other schemas omitted it.

When a user opens the filter drawer with no property type selected, `getFilterVisibility(undefined)` returns `ALL_FILTER_SECTIONS` which includes `market_type`. As soon as they select any property type except `apartment`, `shows('market_type')` becomes false and the section disappears.

### Surfaces affected

Both `FiltersPanel` (homepage batch-apply UX via `useHomepageFilters`) and `ListingsFilters` (/listings immediate-URL UX via `useListingsUrlFilters`) call `getFilterVisibility` — both surfaces were affected.

### No component-level override needed

`useHomepageFilters.handlePropertyTypeChange` and `useListingsUrlFilters.handlePropertyTypeChange` already clear the `market_type` URL param / local-draft field when switching to a type that doesn't expose `market_type`. After the fix, these handlers correctly preserve the `market_type` value when switching between apartment / house / commercial / office (since all four now expose the section).

---

## Section visibility inventory (property_type × section)

| Section | none | apt | house | room | land | comm | office | garage | parking | warehouse | other |
|---------|------|-----|-------|------|------|------|--------|--------|---------|-----------|-------|
| rooms | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| floor | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| floors_total | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | ✅ |
| area | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| year_built | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| condition | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| heating | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| wall_type | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| market_type | ✅ | ✅ | ✅ *(fix)* | — | — | ✅ *(fix)* | ✅ *(fix)* | — | — | — | — |
| layout_features | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| offer_type | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| purchase_conditions | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — | ✅ | — |

`*(fix)*` = was missing before, now added. `—` = intentionally absent for that type.

**Rationale for additions:** `market_type` values are `new_building` vs `secondary` — the primary/secondary market distinction applies equally to houses, commercial spaces, and offices. It does NOT apply to rooms (single rooms rarely sold as new-build), land (land isn't a building), garages, parking, warehouses, or other.

**No sections removed** — all existing ✅ cells retained.

---

## Changes

### `src/modules/listings/domain/propertyTypeSchema.ts`

Three schema filters extended:

**SCHEMA_HOUSE:**  
Added `market_type` between `wall_type` and `offer_type`:
```
'rooms', 'floors_total', 'area', 'year_built', 'condition', 'heating', 'wall_type',
'market_type', 'offer_type', 'purchase_conditions',
```

**SCHEMA_COMMERCIAL:**  
Added `market_type` between `condition` and `offer_type`:
```
'rooms', 'area', 'floor', 'floors_total', 'condition', 'market_type', 'offer_type', 'purchase_conditions'
```

**SCHEMA_OFFICE:**  
Added `market_type` between `heating` and `offer_type`:
```
'rooms', 'area', 'floor', 'floors_total', 'condition', 'heating', 'market_type', 'offer_type', 'purchase_conditions'
```

No changes to `filterEngine.ts`, `useHomepageFilters.ts`, `useListingsUrlFilters.ts`, `FiltersPanel.tsx`, or `ListingsFilters.tsx`.

---

## Positive flow verification

- User opens filter drawer with no property type → `market_type` visible (ALL_FILTER_SECTIONS) ✅
- User selects `apartment` → `market_type` visible (SCHEMA_APARTMENT has it) ✅
- User switches to `house` → `market_type` visible (SCHEMA_HOUSE now has it — **fixed**) ✅
- User switches to `commercial` → `market_type` visible (SCHEMA_COMMERCIAL now has it — **fixed**) ✅
- User switches to `office` → `market_type` visible (SCHEMA_OFFICE now has it — **fixed**) ✅
- Apply filters → filters propagate end-to-end exactly as before ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| Switch to `room` | `market_type` NOT visible (intentional) | ✅ SCHEMA_ROOM unchanged |
| Switch to `land` | `market_type` NOT visible (intentional) | ✅ SCHEMA_LAND unchanged |
| Switch to `garage/parking/warehouse/other` | `market_type` NOT visible | ✅ unchanged |
| Switch from `house` to `room` | `market_type` field value cleared (sectionFields handler) | ✅ existing handler clears it |
| No property type → `apartment` | `market_type` value preserved if set | ✅ both handlers preserve it |
| Reset filters | All fields cleared, ALL_FILTER_SECTIONS shown | ✅ handleReset unaffected |
| Section inventory: no new sections appeared | non-market_type sections unchanged | ✅ only 3 lines changed |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `market_type` added to SCHEMA_HOUSE at `propertyTypeSchema.ts:210`
- [x] `market_type` added to SCHEMA_COMMERCIAL at `propertyTypeSchema.ts:245`
- [x] `market_type` added to SCHEMA_OFFICE at `propertyTypeSchema.ts:259`
- [x] `getFilterVisibility` unchanged — still the single decision point in `filterEngine.ts`
- [x] No inline overrides in FiltersPanel.tsx or ListingsFilters.tsx
- [x] Inventory table above: all *(fix)* cells now green, all existing cells preserved
- [x] 0 new locale entries (pure schema change, no user-facing strings added)
- [x] `handlePropertyTypeChange` field-clearing logic in both hooks automatically benefits — no changes needed

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

Pure schema data change — no layout or component code added. The filter sections already exist in both FiltersPanel and ListingsFilters with existing responsive styles. The additional `market_type` section for house/commercial/office renders identically to the existing apartment market_type section. All 7 breakpoints (320/375/390/768/1280/1440/2560) unaffected.

---

## Files changed

```
src/modules/listings/domain/propertyTypeSchema.ts
docs/backlog.md
docs/sessions/2026-05-27-task-228-w1-filter-section-visibility.md
```
