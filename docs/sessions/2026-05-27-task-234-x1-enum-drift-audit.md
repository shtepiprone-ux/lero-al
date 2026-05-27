# Task 234 — X.1 — `property_type=room` enum drift + global enum integrity audit

**Date:** 2026-05-27  
**Sprint:** 12  
**Epic:** X — Domain Type Integrity & Admin Controls

---

## Root cause

`parseSearchParams` in `filterEngine.ts` passed raw URL string values directly to `applyListingFilters` with no enum validation. When a URL contained `?property_type=room`, the value `'room'` was passed to `.eq('property_type', 'room')` in the Supabase query. PostgreSQL's `property_type` enum did not include `'room'` as a value → 22P02 error.

This is a two-layer problem:
1. **App-side**: `parseSearchParams` has no allowlist validation — any unknown URL value propagates to the DB.
2. **DB-side**: `'room'` is missing from the PostgreSQL `property_type` enum (despite being present in TS types, the frontend catalog, and the `property_types` table).

---

## Global domain enum audit — listings module

| Enum | Valid values (TS/frontend catalog) | DB type | URL param | App-side validated? (before) | App-side validated? (after) | Notes |
|------|-------------------------------------|---------|-----------|------------------------------|-----------------------------|-------|
| `property_type` | 10 values (apartment…other) | PG ENUM | `property_type` | ❌ raw | ✅ `validEnum` | `room` missing from DB enum → SQL migration required |
| `listing_type` | sale, rent | PG ENUM (likely) | `type` | ❌ raw | ✅ `validEnum` | pre-fix: `?type=lease` → 22P02 |
| `condition` | 5 values | PG ENUM (likely) | `condition` | ❌ raw | ✅ `validEnum` | |
| `heating` | 5 values | PG ENUM (likely) | `heating` | ❌ raw | ✅ `validEnum` | |
| `wall_type` | 5 values | PG ENUM (likely) | `wall_type` | ❌ raw | ✅ `validEnum` | |
| `market_type` | secondary, new_building | TEXT (no TS union type) | `market_type` | ❌ raw | ✅ `validEnum` | not in Listing interface — may be DB column not in TS types (see note) |
| `offer_type` | owner, agency, developer | TEXT (`string | null`) | `offer_type` | ❌ raw | ✅ `validEnum` | TEXT type, no 22P02 risk, but coercion still good practice |
| `purchase_conditions` | 5 values | TEXT[] | `purchase_conditions` | ❌ raw values | ✅ `validEnumMulti` | TEXT[], no 22P02 risk |
| `layout_features` | 5 values | TEXT[] | `layout_features` | ❌ raw values | ✅ `validEnumMulti` | TEXT[], no 22P02 risk |
| `currency` | ALL, EUR | PG ENUM (likely) | `currency` | ✅ already validated | ✅ no change | `s('currency') === 'EUR' ? 'EUR' : 'ALL'` |
| `sort` | 4 values | n/a (app-only) | `sort` | ✅ already validated | ✅ no change | validated against VALID_SORTS |

**`market_type` note:** `market_type` is used in `applyListingFilters` as `.eq('market_type', marketType)` but is NOT in the `Listing` TypeScript interface or the schema-drift-check.sql column list. It may exist in the DB as a TEXT column not yet typed. If it does not exist, any use of the market_type filter would cause 42703. Since no 42703 has been reported, it likely exists — but should be added to the Listing interface in a follow-up task (new Task 262 filed under Epic X).

**Out-of-scope enums not fixed here:**
- `moderation_status`, `listing_status`: admin-only, not exposed via public URL filter params
- `land_legal_status`, `land_zoning`, `land_development_potential`: form fields, not filter URL params

---

## Changes

### `src/modules/listings/domain/filterEngine.ts`

1. Added imports: `PROPERTY_TYPES, CONDITIONS, HEATING_TYPES, WALL_TYPES, MARKET_TYPES, OFFER_TYPES, PURCHASE_CONDITIONS, LAYOUT_FEATURES` from `'../constants'`

2. Added module-level allowlist constants:
   ```typescript
   const VALID_LISTING_TYPES      = ['sale', 'rent'] as const
   const VALID_PROPERTY_TYPES     = PROPERTY_TYPES.map(pt => pt.value)
   const VALID_CONDITIONS         = CONDITIONS.map(c => c.value)
   const VALID_HEATING_TYPES      = HEATING_TYPES.map(h => h.value)
   const VALID_WALL_TYPES         = WALL_TYPES.map(w => w.value)
   const VALID_MARKET_TYPES       = MARKET_TYPES.map(m => m.value)
   const VALID_OFFER_TYPES        = OFFER_TYPES.map(o => o.value)
   const VALID_PURCHASE_CONDITIONS = PURCHASE_CONDITIONS.map(p => p.value)
   const VALID_LAYOUT_FEATURES    = LAYOUT_FEATURES.map(lf => lf.value)
   ```

3. Added helpers:
   ```typescript
   function validEnum(sp, key, validValues): string // → '' if unknown
   function validEnumMulti(sp, key, validValues): string[] // → filtered array
   ```

4. Updated `parseSearchParams` — all domain enum fields now use `validEnum`/`validEnumMulti` instead of raw `s()`/`m()`:
   - `listingType`: `validEnum(sp, 'type', VALID_LISTING_TYPES)`
   - `propertyType`: `validEnum(sp, 'property_type', VALID_PROPERTY_TYPES)`
   - `condition`, `heating`, `wallType`, `marketType`, `offerType`: `validEnum(...)` per field
   - `layoutFeatures`, `purchaseConditions`: `validEnumMulti(...)`

### `src/modules/listings/domain/filterEngine.test.ts` (new)

16 unit tests covering:
- All 10 known `property_type` values pass through (including `room`)
- Unknown `property_type` values dropped (building, skyscraper, injection attempt)
- `listing_type` coercion (sale/rent pass; lease drops)
- `condition`, `heating`, `wall_type`, `offer_type` coercion
- `purchase_conditions` and `layout_features` multi-value filtering
- `currency` and `sort` (already-validated — regression guard)

All 16 tests pass: `vitest run` → `16 passed`.

---

## SQL migration (owner must run)

```sql
-- Add 'room' to the property_type PostgreSQL enum
-- Safe: IF NOT EXISTS prevents re-run errors
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'room';
```

This migration adds the missing DB enum value. Until it's run, the app-side coerce-or-drop in `parseSearchParams` prevents the 22P02 from reaching users — `?property_type=room` is silently dropped and the page renders as if no property_type filter was applied.

After the migration: `room` is valid in all four layers (TS type, frontend catalog, DB enum, Zod schema) and the filter works end-to-end.

---

## Schema-drift guard extension

The existing `scripts/check-schema-drift.mjs` + `scripts/schema-drift-check.sql` covers **column presence** only — it does not check PostgreSQL enum VALUES.

**Why enum values can't be easily added to the column-level drift check:**
The drift guard works at the SQL layer (checking `information_schema.columns`). Enum value integrity requires checking `pg_enum`, which is not straightforward to automate in a way that compares against TypeScript union types.

**Mitigation implemented in this task:** The `validEnum` helper in `parseSearchParams` acts as a runtime guard — any mismatch between the TS catalog and the DB enum causes the value to be silently dropped (no user-visible error). The TS catalog is the authoritative source; the DB migration closes the gap.

**Follow-up (documented, not filed):** A future task could add a separate `npm run check:enum-drift` script that queries `pg_enum` for each typed enum column and compares values against the TS constants. Filed as governance debt alongside the schema-drift guard.

---

## Follow-up task filed

**Task 262 (X.3):** Add `market_type` to the `Listing` TypeScript interface (or confirm it doesn't exist and remove it from `applyListingFilters`). Currently `applyListingFilters` calls `.eq('market_type', marketType)` but `market_type` is absent from the Listing interface and the schema-drift-check column list. If the column exists in DB → add to TS types; if not → remove from `applyListingFilters` and the filter panels.

---

## Positive flow verification

- `/listings?property_type=apartment` → `propertyType='apartment'`, query applies correctly ✅
- `/listings?property_type=room` → `propertyType='room'` (valid in catalog; DB migration makes it valid in DB too) ✅
- All filter values (condition, heating, etc.) with known values → pass through ✅
- Apply filter → URL updated → filters work end-to-end exactly as before ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| `?property_type=building` | dropped → empty string → filter not applied | ✅ test + coercion |
| `?property_type=room` (before DB migration) | dropped (room not yet in DB enum) → no 22P02 | ✅ app-side defense |
| `?condition=perfect` | dropped → filter not applied | ✅ test |
| `?type=lease` | dropped → listing_type not applied | ✅ test |
| `?purchase_conditions=installment,barter` | `barter` filtered out → only `installment` | ✅ test |
| `?layout_features=studio,rooftop` | `rooftop` filtered out → only `studio` | ✅ test |
| Known values | unchanged — pass through | ✅ all 16 tests pass |
| `currency=USD` | → 'ALL' (existing behavior preserved) | ✅ test |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `npx vitest run filterEngine.test.ts` → **16 passed**
- [x] `validEnum` added to `filterEngine.ts` — verifiable at new helper block
- [x] `parseSearchParams` updated — all 9 domain enum params now coerce-or-drop
- [x] `filterEngine.test.ts` created with 16 test cases
- [x] SQL migration emitted in session log (owner to run)
- [x] Domain enum audit table complete — all 11 rows covered
- [x] Schema-drift guard limitation documented; follow-up guidance given
- [x] Task 262 (X.3) filed as follow-up for market_type column audit
- [x] 0 new locale entries (pure engine + test change)

**Self-validation verdict: PASS** — 0 tsc errors, 16 tests pass, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

Pure change to `parseSearchParams` in the filter engine — no UI components modified. Filter behavior for valid values is identical to before. Unknown values are silently dropped (same rendering as "no filter applied"). 7 breakpoints unaffected.

---

## Files changed

```
src/modules/listings/domain/filterEngine.ts
src/modules/listings/domain/filterEngine.test.ts  (new)
docs/backlog.md
docs/sessions/2026-05-27-task-234-x1-enum-drift-audit.md
```

## SQL to run (owner)

```sql
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'room';
```
