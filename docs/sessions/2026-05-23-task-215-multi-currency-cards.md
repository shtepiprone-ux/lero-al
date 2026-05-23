# Task 215 — M.6: Multi-Currency Conversion on Every Card Surface

**Date:** 2026-05-23  
**Epic:** M — Currency & Exchange-Rate Integrity  
**Status:** ✅ Complete

## What changed

### `src/components/shared/useHomepageFilters.ts`
- `const { rate } = useExchangeRate()` → `const { rates } = useExchangeRate()`
- Return value `rate` → `rates`

### `src/components/shared/FiltersPanel.tsx`
- Destructuring `rate` → `rates`
- Exchange-rate hint: `rate != null` → `rates?.[currency] != null`; display `rates[currency].toFixed(2)` (now works for every active catalog currency, not just EUR)

### `src/modules/listings/components/FeaturedListings.tsx`
- Added `useExchangeRate`, `useAuth` imports
- `const { rates } = useExchangeRate()`, `const { user } = useAuth()`
- `displayCurrency = user?.preferred_currency ?? 'ALL'`
- Passed `displayCurrency` + `rates` to every `ListingCard`

### `src/modules/listings/components/LatestListings.tsx`
- Same as FeaturedListings

### `src/modules/listings/components/RecentlyViewedGrid.tsx`
- Added `useExchangeRate`, `useAuth` imports and hooks
- `displayCurrency = user?.preferred_currency ?? 'ALL'`
- Passed `displayCurrency` + `rates` to every `ListingCard`

### `src/modules/listings/components/SimilarListings.tsx` (Server Component)
- Added `getUser`, `getExchangeRates` imports
- Parallelized init: `Promise.all([getTranslations, getLocale, createClient, getExchangeRates, getUser])`
- Added preferred_currency query for authenticated users
- Passed `displayCurrency` + `rates={exchangeRates}` to each `ListingCard`

### `src/modules/listings/components/ListingCard.tsx`
- Removed deprecated `exchangeRate?: number | null` prop
- Replaced `effectiveRates` fallback `{ EUR, USD: rate/1.08, GBP: rate/0.86 }` with `rates ?? null`
- All conversion now goes through real iliria98 rates from Task 214

## Architecture decision
Homepage `FeaturedListings`/`LatestListings` are `'use client'` components — no STOP needed. Currency = user's `preferred_currency` (same pattern as `FavoritesShell`). Homepage filter-drawer currency drives navigation to `/listings?currency=X` (unchanged — that's by design).

## Verification
- `grep '1\.08\|0\.86' src/` → no matches
- `tsc --noEmit` → 0 errors
- Epic M fully closed: 175 · 214 · 176 · 177 · 178 · 215 all done
