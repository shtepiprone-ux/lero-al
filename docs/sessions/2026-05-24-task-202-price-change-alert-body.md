# Task 202 — R.8: price_change_alert email template body

**Date:** 2026-05-24
**Status:** ✅ Complete (covered by Task 166)

## Findings

Task 166 (2026-05-22) already authored and seeded the `price_change_alert` HTML bodies for all 4 locales. The SQL was confirmed applied in the Supabase dashboard on 2026-05-22.

See: `docs/sessions/2026-05-22-task-166-seed-email-templates.md`

## Variable audit (cron ↔ template parity)

Call-site in `src/app/api/cron/price-alerts/route.ts` (line 165–176):

```ts
variables: {
  listingTitle: listing.title,        // ✓ used as {{listingTitle}}
  oldPrice: oldPriceStr,              // ✓ used as {{oldPrice}}
  newPrice: newPriceStr,              // ✓ used as {{newPrice}}
  currency: listing.currency,         // ✓ used as {{currency}}
  listingUrl,                         // ✓ used as {{listingUrl}}
}
```

All 5 variables appear in every locale's body. No orphaned placeholders. No missing variables.

Note: `currency` appears inline in the price comparison table cells as `{{oldPrice}} {{currency}}` and `{{newPrice}} {{currency}}`. This is intentional — `oldPrice`/`newPrice` are already formatted numeric strings (e.g. `"85 000"`) and `currency` appends the code (e.g. `"EUR"`). The display matches `fmtPrice()` output: `"85 000 EUR"`.

## Bodies (reference — from Task 166 SQL, already in DB)

**sq:** "Ulje çmimi për njoftimin tuaj!" — old/new price comparison table → "Shiko njoftimin" CTA  
**en:** "Price has dropped on your favorite!" — same layout → "View listing" CTA  
**uk:** "Ціна знизилась на ваш улюблений!" — same layout → "Переглянути оголошення" CTA  
**it:** "Il prezzo è sceso sul tuo preferito!" — same layout → "Vedi annuncio" CTA

Design: branded frame from `brandEmailLayout()` wraps inner HTML. Inner HTML uses an HTML table to render a struck-through old price (bg `#f4f4f5`, color `#71717a`, `text-decoration:line-through`) → arrow → new price (bg `#EC5447`, bold, white text). Consistent with the `saved_search_alert` design in the same seed.

## Idempotent SQL

The SQL is already documented and applied in Task 166. If a re-run is ever needed, use the identical SQL block from `docs/sessions/2026-05-22-task-166-seed-email-templates.md` (the `price_change_alert` section). It uses `ON CONFLICT (key, locale) DO UPDATE` — safe to re-run at any time.

## No code changes

This task produces no source-file changes. `tsc --noEmit` and `npm run build` are unaffected.
