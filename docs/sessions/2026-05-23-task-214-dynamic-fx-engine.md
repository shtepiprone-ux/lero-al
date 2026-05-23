# Task 214 — M.5: Dynamic FX Engine over the Currency Catalog

**Date:** 2026-05-23  
**Epic:** M — Currency & Exchange-Rate Integrity  
**Status:** ✅ Complete

## What changed

### `src/lib/getExchangeRate.ts` (full rewrite of engine layer)

- **`ExchangeRates` type**: `{ EUR: number; USD: number; GBP: number }` → `Record<string, number>`. Extensible; keyed by ISO currency code; ALL per 1 unit of each foreign code.
- **`getActiveCurrencyCodes()`** (new): reads `is_active = true, code != 'ALL'` from the `currencies` DB table using `createAdminClient()` (dynamic import to keep it out of the client bundle — `convertPrice` is imported by `ListingCard.tsx`). Falls back to `['EUR', 'USD', 'GBP']` if DB unavailable.
- **`scrapeIliria98Rates()`**: already generic over any list; no changes to scraping logic. `ALL_RATE_BOUNDS` retains known bounds for EUR/USD/GBP; new `DEFAULT_BOUNDS = [0, 9999]` used for unknown currencies.
- **`fetchCrossRates()`**: was `() => { usd, gbp }`, now `(codes: string[]) => Record<string, number | null>`. Single open.er-api.com request covers all missing currencies at once.
- **`fetchAllRates()`**: drives scrape from DB catalog; after scrape, currencies not found on iliria98 go into `needsCrossRate`; derivation fires once for the batch; currencies where both sources fail are excluded (not faked).
- **`convertPrice()`**: removed `as keyof ExchangeRates` casts — now plain string index access, compatible with `Record<string, number>`.
- **`getExchangeRates`** cache contract intact: `unstable_cache`, key `['exchange-rates']`, `revalidate: 3600`.

### `docs/integrations.md`

- "Exchange Rate Pipeline" section updated with catalog-driven pipeline, the "not on iliria98" policy, and the "Adding a new currency" instruction (enable in admin → picked up in next cache refresh, no code change).

## Policy decision: currencies not on iliria98

Derivation fallback via open.er-api.com (same as existing USD/GBP behaviour) applies to all active catalog currencies. If both fail, the currency is excluded from `rates` silently. The card layer (Task 215) handles `rates[code] === undefined` by showing the original listing currency. Documented in `docs/integrations.md`.

## Out of scope

- Card/homepage wiring (`1.08`/`0.86` hardcode remains in `ListingCard.tsx:114`) — Task 215.
- Admin "not on iliria98" flag UI — deferred.

## Verification

- `tsc --noEmit` → 0 errors.
- No hardcoded currency list in `fetchAllRates` (grep `'EUR', 'USD', 'GBP'` now only in `FALLBACK_CODES`).
- No `1.08`/`0.86` in FX engine layer.
