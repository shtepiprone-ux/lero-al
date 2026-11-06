# Kickoff prompt — Task 176 (Sprint 9 — M.2: fix price & price-per-m² currency/unit mismatch)

> Reproduced from the code: in `src/app/[locale]/listings/[slug]/page.tsx`, line ~253
> `const pricePerSqm = listing.area_gross ? Math.round(listing.price / listing.area_gross) : null`
> computes per-m² from `listing.price` (the ORIGINAL currency), but line ~387 renders it with
> `displayCurrencyCode` (the CONVERTED code). So a listing at `88,000,000 ALL` shows `352,000 EUR`/m²
> — the ALL value labelled EUR. The per-m² value must come from the DISPLAYED price and carry the
> DISPLAYED currency. The same convert-then-divide rule must hold on listing cards
> (`ListingCard.tsx` already imports `convertPrice as convertPriceMulti`) — fix every price/m² surface,
> not just the detail page (Global Change Verification Rule).

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope. This is the price + price-per-m² DISPLAY correctness only — not the rate source
  (Task 175), not the currency selector (Task 178).
- Do NOT invent architecture. Reuse the existing convertPrice() / formatPrice() / useExchangeRate().
- Global Change Verification Rule: fix EVERY place that shows price or price/m² (detail page, listing
  cards, contact card, anywhere else). Grep to find them; do not leave one surface diverging.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-176-price-per-sqm-currency-fix.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/app/[locale]/listings/[slug]/page.tsx — lines ~253 (pricePerSqm), ~262-269 (needsConversion,
  displayPrice, displayCurrencyCode, originalPriceStr), ~383-390 (render block incl. the per-sqm <span>)
- src/lib/getExchangeRate.ts (convertPrice), src/lib/formatters.ts (formatPrice, normalizeCurrencyCode)
- src/modules/listings/components/ListingCard.tsx (convertPriceMulti usage — its price + any per-m²)
- src/modules/listings/components/ListingContact.tsx (price line)
- docs/ai-behavior.md (i18n: currency codes are literals, never t()), docs/ui-rules.md

Scope:
1. Detail page: derive per-m² from the DISPLAYED price and label it with the DISPLAYED currency.
   i.e. compute pricePerSqm AFTER conversion: `Math.round(displayPrice / listing.area_gross)` and render
   with `displayCurrencyCode`. (Equivalently: convert the raw per-m² with the same convertPrice call.)
   Ensure price, original/old price, and per-m² are ALL in displayCurrencyCode consistently.
2. Listing cards + contact card + any other price/m² surface: apply the identical convert-then-derive
   rule so value and label always match. Grep `area_gross`, `convertPrice`, `formatPrice`, per-sqm/`m²`.
3. Verify the conversion gating: today detail conversion is `needsConversion = !!exchangeRates &&
   !!authUser && preferredCurrency !== listing.currency`. Do NOT expand the gating model in this task
   (the site-wide selector is Task 178) — but make sure that WITHIN the current model the displayed
   price and per-m² never disagree on currency in any state (guest = original currency; authed+preferred
   = converted). If fixing the unit bug forces a gating decision you're unsure about, STOP and ask.

Acceptance criteria:
- For 88,000,000 ALL: per-m² shows the ALL value labelled ALL (not EUR) in the default/guest state; when
  converted, both price and per-m² show the same target currency and consistent values.
- Price, old/original price, and per-m² always share one currency on every surface (detail, cards, contact).
- No price/m² surface left using the raw price with a converted label (grep proves it).
- 0 new lint/typecheck errors; npm run build passes; all four locales render; all 7 breakpoints OK.

Out of scope:
- Rate source (Task 175); currency selector / site-wide currency switch (Task 178); admin table (Task 177).
```
