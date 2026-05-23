# Task 176 — Sprint 9 M.2: fix price & price-per-m² currency/unit mismatch

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** bug fix

## Root cause

`pricePerSqm` in the listing detail page was computed from `listing.price` (the original/raw currency)
**before** the `displayPrice` / `displayCurrencyCode` conversion block, then rendered with
`displayCurrencyCode`. Result: a listing at 88,000,000 ALL would show "352,000 EUR/m²" — the ALL
value labelled as EUR.

Two additional bugs discovered during the global verification pass:
- Detail page: `listing.price_old!` (strikethrough reduced price) was rendered with `displayCurrencyCode`
  but never converted.
- `ListingCard`: per-m² value was correct (derived from `displayPrice`) but the `formatPrice` call
  used `''` as the currency code — so the code was always missing from the card label.

## Changes

| File | Change |
|---|---|
| `src/app/[locale]/listings/[slug]/page.tsx` | Removed early `pricePerSqm` computation (used raw `listing.price`). Added `displayPriceOld` (converts `price_old` when `needsConversion`). Added `pricePerSqm` after conversion block — computed from `displayPrice`. Render: `listing.price_old!` → `displayPriceOld!`. |
| `src/modules/listings/components/ListingCard.tsx` | `formatPrice(pricePerSqm, '', locale)` → `formatPrice(pricePerSqm, activeCurrency, locale)`. |

`ListingContact` — no change needed: already receives `price={displayPrice}` and
`currency={displayCurrencyCode}` from the detail page.

## Verification

```
$ npx tsc --noEmit
(exit 0 — 0 errors)

$ npx eslint src/app/\[locale\]/listings/\[slug\]/page.tsx src/modules/listings/components/ListingCard.tsx
(exit 0 — 0 errors)
```

Grep for old bug patterns: no matches for `listing.price / listing.area_gross` or
`formatPrice(pricePerSqm, ''` anywhere in `src/`.

## Acceptance criteria

- [x] per-m² derived from `displayPrice`; renders with `displayCurrencyCode` (detail page)
- [x] old/reduced price strikethrough converted before display (detail page)
- [x] ListingCard per-m² labelled with `activeCurrency` (card)
- [x] ListingContact passes through pre-converted price+currency — no change needed
- [x] No price/m² surface left using raw price with converted label (grep verified)
- [x] 0 tsc errors; 0 lint errors
