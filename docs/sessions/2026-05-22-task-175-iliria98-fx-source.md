# Task 175 — M.1: iliria98.com as the single source of truth for FX rates

**Date:** 2026-05-22  
**Sprint:** 9 — Critical Data & Trust Integrity  
**Status:** ✅ Complete

## Problem

`src/lib/getExchangeRate.ts` had an undocumented co-equal dependency:
- EUR/ALL → scraped from iliria98.com ✅
- USD/ALL, GBP/ALL → derived via **open.er-api.com** EUR/USD + EUR/GBP cross-rates

`open.er-api.com` was treated as a silent second source of truth, not a subordinate helper.

## Changes

### `src/lib/getExchangeRate.ts`

- **Removed** `scrapeEurAllRate()` (single-currency).
- **Added** `scrapeIliria98Rates(currencies: string[])` — single HTTP GET to iliria98.com; extracts EUR/ALL, USD/ALL, GBP/ALL in one request using per-currency sanity bounds (`ALL_RATE_BOUNDS`).
- **Demoted** `fetchCrossRates()` to documented derivation helper: called only when a currency is absent from iliria98; provides EUR/USD and EUR/GBP denominators, never an ALL value.
- **Removed** hardcoded stale fallback constants (1.08 for EUR/USD, 0.86 for EUR/GBP) — if both sources fail, function returns `null` rather than serving a stale approximation.
- Public API (`ExchangeRates` type, `getExchangeRates`, `convertPrice`, `getExchangeRate`, 1h cache) unchanged.

### `docs/integrations.md`

- Added "Exchange Rate Pipeline (Task 175 / Epic M.1)" section: canonical source, derivation rule, cache contract, and instructions for adding new currencies.

## Architecture decision (case b)

The iliria98 scraper now attempts USD/ALL and GBP/ALL directly. If iliria98 does not publish those currencies (or parsing fails), the derivation formula `(EUR/ALL) ÷ (EUR/USD cross-rate)` is used — this still pivots through iliria98's EUR/ALL figure, so iliria98 remains the sole origin of the ALL anchor value. open.er-api.com is never the source of the ALL rate itself.

## Verification

- `npx eslint src/lib/getExchangeRate.ts` → 0 errors
- `npx tsc --noEmit` → 0 new errors (2 pre-existing test-stub errors in unrelated files)
- All importers (`useExchangeRate.ts`, `route.ts`, `listing page`, `ListingCard`) use unchanged public exports

## Files changed

- `src/lib/getExchangeRate.ts` — scraper refactored, pipeline documented
- `docs/integrations.md` — Exchange Rate Pipeline section added
- `docs/backlog.md` — last session updated
