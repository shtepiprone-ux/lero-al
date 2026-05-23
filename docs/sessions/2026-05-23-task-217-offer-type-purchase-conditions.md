# Task 217 — Listings 500 (42703): `offer_type` + `purchase_conditions` columns + form

**Date:** 2026-05-23  
**Status:** ✅ Done

## Root cause

`applyListingFilters` in `filterEngine.ts` queries `offer_type` (`.eq`) and
`purchase_conditions` (`.overlaps`) on the `listings` table, but neither column existed in the DB
→ every `GET /listings?...` that touched either filter returned Postgres 42703.

Both fields were also marked `componentType: 'filter-only'` in the schema engine → not rendered in
create/edit form → no data to match against even once the columns are added.

## Changes

### `src/types/database.ts`
Added `offer_type: string | null` and `purchase_conditions: string[]` to `Listing`.

### `src/modules/listings/types/form.ts`
Added `offer_type?: string` and `purchase_conditions?: string[]` to `FormValues`.

### `src/modules/listings/domain/listingFields.ts`
Added `'multi-toggle'` to `FieldComponentType` (canonical reusable multi-select chip row).

### `src/modules/listings/domain/propertyTypeSchema.ts`
- Changed `offer_type` `componentType`: `'filter-only'` → `'button-group'`
- Changed `purchase_conditions` `componentType`: `'filter-only'` → `'multi-toggle'`
- Added both to `makeFields(visible)` for every property type that already listed them in `filters`:
  - `offer_type` visible in: apartment, house, room, land, commercial, office, garage, parking, warehouse, other
  - `purchase_conditions` visible in: apartment, house, land, commercial, office, warehouse
  - (mirrors filter visibility exactly — same gate)

### `src/modules/listings/components/form/ButtonGroupField.tsx`
Added `offer_type → OFFER_TYPES` to `FIELD_OPTIONS`; added `offer_type → 'offer_type'` to `LABEL_KEYS`.
Reuses existing `listing.offer_type` locale key.

### `src/modules/listings/components/form/MultiToggleField.tsx` *(new)*
Canonical multi-select chip row renderer for array fields. Handles `purchase_conditions` today;
extensible to other array fields via `FIELD_OPTIONS`/`LABEL_KEYS` maps. Reuses existing
`listing.purchase_conditions` locale key.

### `src/modules/listings/components/form/fieldRegistry.ts`
Registered `'multi-toggle': MultiToggleField`.

### `src/modules/listings/components/ListingFormShell.tsx`
- `handlePropertyTypeChange`: added clearing for `offer_type` and `purchase_conditions` when
  the new type doesn't have them visible.
- `submitPayload`: included both fields, gated by `isVisible()`. Casts match Zod enum literals.

### `src/modules/listings/validations/index.ts`
Added:
```typescript
offer_type: z.enum(['owner', 'agency', 'developer']).optional(),
purchase_conditions: z.array(z.enum(['installment', 'mortgage', 'assignment', 'negotiable', 'no_commission'])).optional(),
```

### `src/app/[locale]/listings/[slug]/edit/page.tsx`
Added `offer_type, purchase_conditions` to the SELECT query and to `initialValues` mapping for edit
pre-fill.

### `scripts/schema-drift-check.sql`
Added `('listings', 'offer_type')` and `('listings', 'purchase_conditions')` to both result sets
(38 → 40 cols for `Listing`).

## SQL for owner to run

```sql
-- Task 217: Add offer_type + purchase_conditions columns to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS offer_type text NULL
    CHECK (offer_type IN ('owner', 'agency', 'developer')),
  ADD COLUMN IF NOT EXISTS purchase_conditions text[] NOT NULL DEFAULT '{}';

-- Optional indexes (match market_type / layout_features conventions):
CREATE INDEX IF NOT EXISTS listings_offer_type_idx         ON public.listings (offer_type) WHERE offer_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_purchase_conditions_idx ON public.listings USING GIN (purchase_conditions);
```

## Global change verification

- `offer_type` grep → filterEngine (existing, safe), FiltersPanel (existing, safe),
  new form fields above. No stale hardcoded values.
- `purchase_conditions` grep → filterEngine (existing, safe), FiltersPanel (existing, safe),
  new form fields above.
- Filter operators unchanged: `.eq('offer_type', ...)` and `.overlaps('purchase_conditions', ...)`.

## Locale
No new keys needed — `listing.offer_type` and `listing.purchase_conditions` already exist in all 4
locale files and are reused as form field labels.

## tsc
`tsc --noEmit` → 0 errors.
