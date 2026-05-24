# Task 204 — S.2: Listing IDs → numeric

**Date:** 2026-05-24  
**Epic:** S — Domain Numeric IDs  
**Status:** ✅ Complete

## Summary

Replaced the hex-substring UUID display (`#{listing.id.slice(0, 8)}`) shown to users with a proper sequential numeric `public_id`. Slug/URL contract is fully preserved — no redirects needed.

## SQL for owner (run in Supabase SQL editor — idempotent)

```sql
-- Task 204: Add numeric public_id column to listings table.
-- Idempotent — safe to re-run.
CREATE SEQUENCE IF NOT EXISTS listings_public_id_seq START 1;
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS public_id BIGINT NOT NULL
    DEFAULT nextval('listings_public_id_seq') UNIQUE;
ALTER SEQUENCE listings_public_id_seq OWNED BY listings.public_id;
NOTIFY pgrst, 'reload schema';
```

> Existing rows each receive a unique sequence value automatically on the ALTER TABLE. New rows get the next value.

## Files changed

| File | Change |
|------|--------|
| `src/types/database.ts` | Added `public_id: number` to `Listing` interface |
| `scripts/schema-drift-check.sql` | Col count comment 36 → 39 (correcting stale count + adding public_id); `('listings', 'public_id')` added to both RESULT SETs |
| `src/modules/listings/lib/listingSelect.ts` | Added `public_id,` to canonical `LISTING_SELECT` |
| `src/modules/listings/components/SimilarListings.tsx` | Added `public_id,` to local `SELECT` constant |
| `src/modules/cabinet/lib/queries.ts` | Added `public_id,` to `CABINET_LISTING_SELECT` |
| `src/app/admin/listings/page.tsx` | Added `public_id` to explicit SELECT string |
| `src/modules/listings/components/ListingCard.tsx` | `public_id?: number \| null` added to `CardListingData`; `#{listing.id.slice(0,8)}` → `#{listing.public_id ?? listing.id.slice(0,8)}` (×2) |
| `src/components/admin/AdminListingsTable.tsx` | `public_id?: number \| null` added to `AdminListing`; `#{l.id.slice(0,8)}` → `#{l.public_id ?? l.id.slice(0,8)}` |
| `src/app/[locale]/listings/[slug]/page.tsx` | `#{listing.id.slice(0,8)}` → `#{listing.public_id}` (query uses `*`, auto-included) |
| `src/lib/auth/__tests__/controller.test.ts` | Added `public_id: 1` to `MOCK_USER` (Task 203 User interface change) |
| `src/modules/auth/__tests__/AuthContext.test.tsx` | Added `public_id: 1` to `MOCK_USER` (Task 203 User interface change) |

## Approach

- `public_id` is a supplementary BIGINT sequence — does NOT replace the UUID PK.
- URLs continue to use the text `slug` column — no URL contract change, no redirects.
- Listing card and admin table use `listing.public_id ?? listing.id.slice(0, 8)` as a graceful fallback until the SQL is applied on the live DB.
- Listing detail page uses `listing.public_id` directly (query selects `*`).
- Note: stale `(36 cols)` comment in schema-drift-check.sql corrected to `(39 cols)` — offer_type and purchase_conditions (Task 217) were counted but the comment was never updated.

## Coverage

All SELECT queries that feed `CardListingData` now include `public_id`:
- `LISTING_SELECT` (main listings, API routes, favorites, recently viewed — canonical)
- `SimilarListings.tsx` local `SELECT`
- `CABINET_LISTING_SELECT` (cabinet tab view)
- `AdminListingsTable` explicit SELECT

## No locale changes

No new translatable strings — the `#` prefix and numeric value need no translation.

## Type-check

`tsc --noEmit` → 0 errors.
