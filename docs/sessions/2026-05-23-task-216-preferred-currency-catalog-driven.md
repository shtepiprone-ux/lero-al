# Task 216 — Profile save dead: catalog-driven `preferred_currency`

**Date:** 2026-05-23  
**Status:** ✅ Done

## Root cause

`users.preferred_currency` had a frozen CHECK constraint `users_preferred_currency_check` enforcing
`('ALL','EUR','USD','GBP')`. The currency selector in ProfileTab is catalog-driven (reads all active
rows from the `currencies` table via `useCurrencies()`). Any admin-added catalog currency (e.g. 'CHF')
appeared in the dropdown, was selected by the user, then rejected by Postgres with 23514 → the action
returned `'save_failed'` → UI showed generic "Error saving profile".

`PreferredCurrency` in `src/types/database.ts` was also a frozen 4-value union (`'ALL'|'EUR'|'USD'|'GBP'`),
inconsistent with the catalog-driven selector.

## Changes

### `src/types/database.ts`
- `PreferredCurrency = 'ALL' | 'EUR' | 'USD' | 'GBP'` → `PreferredCurrency = string`
- All imports and uses remain valid; no narrowing/switch statements depended on the union.

### `src/modules/cabinet/actions/index.ts`
- Added catalog validation guard before the `UPDATE` query: queries `currencies` for active codes,
  rejects unknown codes with `{ error: 'save_failed' }`. Guard is a no-op if the catalog query fails
  (empty set → skip guard) so an unavailable DB doesn't break saves for existing values.
- Parameter type `preferredCurrency: PreferredCurrency` stays (now `string` — no change needed).

### `src/modules/cabinet/components/ProfileTab.tsx`
- Removed redundant `currency as PreferredCurrency` cast (now `string`, cast was a no-op).
- Removed unused `PreferredCurrency` import.

## Global change verification

Grep `preferred_currency` across `src/` — all writers:
- `cabinet/actions/index.ts` — the only DB writer; now guarded. ✅
- All readers (`SimilarListings`, `ListingsShell`, `FeaturedListings`, `LatestListings`,
  `RecentlyViewedGrid`, `FavoritesShell`, `listings/[slug]/page.tsx`) — read-only; `?? 'ALL'` fallback
  is unaffected by the type widening. ✅
- Test fixtures (`AuthContext.test.tsx`, `controller.test.ts`) — `'ALL'` literal satisfies `string`. ✅

Grep `'ALL'|'EUR'|'USD'|'GBP'` for frozen currency list → none remain for `preferred_currency` field.
`ListingCurrency = 'ALL' | 'EUR'` in `database.ts` is a separate, still-correct type for listing prices.

## SQL for owner to run

> ⚠️ Verify `SELECT code FROM currencies WHERE code = 'ALL';` returns a row before adding the FK.
> 'ALL' must exist in the catalog (it is the default and pivot value). Task 177 seeded it; if missing,
> insert it first.

```sql
-- Task 216: Drop frozen CHECK; add FK to currency catalog
-- Prerequisite check:
SELECT code FROM public.currencies WHERE code = 'ALL';

-- 1. Drop the frozen CHECK constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_preferred_currency_check;

-- 2. Add FK so only catalog codes are valid; auto-cascades on code rename
ALTER TABLE public.users
  ADD CONSTRAINT users_preferred_currency_fkey
  FOREIGN KEY (preferred_currency)
  REFERENCES public.currencies(code)
  ON UPDATE CASCADE;
```

No `schema-drift-check.sql` update required (no new columns added; the constraint change is not tracked).

## tsc
`tsc --noEmit` → 0 errors.
