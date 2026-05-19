# Task 86 — Fix currency label translation issue

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

The task reported that the currency code `ALL` (Albanian lek) was being displayed as a translated Ukrainian UI word such as "Всього" instead of the literal code `ALL`. The root concern: currency codes must be treated as stable domain identifiers (ISO 4217-style), never as i18n translation keys. Specifically, if `ALL` were lowercased to `all` and passed through `t('all')`, it would match the `common.all` translation key and display a locale-specific word instead of the currency code.

---

## Root cause

**Investigation findings:**

1. **Translation key audit:** Only `common.all` (lowercase) exists as a potential collision point. Values:
   - `sq`: `Të gjitha` | `en`: `All` | `uk`: `Усі` | `it`: `Tutti`
   - No keys named `ALL`, `EUR`, `USD`, or `GBP` exist in any namespace.

2. **Active code audit — all currency display paths are safe:**
   - `src/lib/formatters.ts::formatPrice` — appends currency code directly via string concatenation, no `t()` call
   - `src/components/shared/FiltersPanel.tsx:220` — `{cur.code}` displayed directly
   - `src/modules/listings/components/ListingsFilters.tsx:180` — `{cur.code}` displayed directly
   - `src/modules/listings/components/ListingFormShell.tsx:383` — `{cur}` displayed directly
   - `src/modules/cabinet/components/ProfileTab.tsx:458-461` — uses explicit `t('currency_ALL')`, `t('currency_EUR')` etc., never dynamic currency code lookup
   - `src/modules/listings/components/ListingCard.tsx` — `formatPrice(displayPrice, activeCurrency, locale)` only

3. **Existing cabinet.filter_ALL pattern:** `ListingsTab.tsx:183` uses `t(\`filter_${key}\`)` where `key='ALL'` → `cabinet.filter_ALL = 'Всі'`. This is the **listing visibility filter** ("All listings"), not the currency code. This is correct and intentional.

4. **Naming collision risk:** The string `'ALL'` is shared between:
   - Currency code: Albanian lek (`ALL`)
   - Visibility group: `VALID_VISIBILITY_GROUPS = ['ALL', 'VISIBLE', 'HIDDEN', 'ARCHIVED', 'CLOSED']`
   - Default/sentinel value in `HeroSearch.tsx:61` and `filterEngine.ts:122`: `currency !== 'ALL'` used as a "no currency filter" guard

5. **The "Всього" example in the task:** The word "Всього" appears in admin-only keys (`admin.dashboard.stat_total_listings`) and does not appear in any currency display path. The task description used this as an approximate example of what COULD happen if `ALL` were accidentally translated — the actual Ukrainian word that would appear from `common.all` is `'Усі'`, not `'Всього'`.

**Conclusion:** No current code path incorrectly translates the currency code `ALL`. The bug described is a potential/preventive concern: if a future developer called `t(currency.toLowerCase())` thinking they were translating "all currencies," they would get `common.all = 'Усі'` instead of the currency code. The `formatPrice` function was already safe but lacked an explicit guard.

---

## Implementation summary

**`src/lib/formatters.ts`**

Added `normalizeCurrencyCode(code: string): string` — a documented utility that:
- Makes the "currency codes are domain identifiers, never i18n keys" contract explicit
- Returns `code.toUpperCase()` to ensure the code is always rendered in canonical uppercase form
- Is now called by `formatPrice` for consistency

Updated `formatPrice` to use `normalizeCurrencyCode(currency)` in its return value, guaranteeing that even if a currency code is accidentally passed in lowercase, it is displayed in its canonical uppercase form (`'ALL'`, `'EUR'`, `'USD'`).

No other files changed — all existing display paths were already safe.

---

## Files changed

- `src/lib/formatters.ts` — added `normalizeCurrencyCode`, used in `formatPrice`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-86-currency-label-translation-issue.md` (this file)

---

## Affected components/helpers

| Component/Helper | Currency display path | Status |
|---|----|---|
| `src/lib/formatters.ts::formatPrice` | Appends `normalizeCurrencyCode(currency)` directly | ✅ Now explicitly safe |
| `FiltersPanel.tsx:220` | `{cur.code}` | ✅ Safe (direct) |
| `ListingsFilters.tsx:180` | `{cur.code}` | ✅ Safe (direct) |
| `ListingFormShell.tsx:383` | `{cur}` | ✅ Safe (direct) |
| `ProfileTab.tsx CurrencySelector` | `{cur}` for code, `labels[value]` for name | ✅ Safe (explicit keys) |
| `ListingCard.tsx` | `formatPrice(displayPrice, activeCurrency, locale)` | ✅ Safe via formatters |
| `ListingContact.tsx` | `formatPrice(price, currency, locale)` | ✅ Safe via formatters |
| `ListingsTab.tsx:183` | `t('filter_ALL')` for listing visibility | ✅ Intentional (not currency) |

---

## Currency rendering before vs after

| Scenario | Before | After |
|----------|--------|-------|
| `formatPrice(100, 'ALL', 'it')` | `"100 ALL"` ✅ | `"100 ALL"` ✅ (unchanged) |
| `formatPrice(100, 'eur', 'it')` | `"100 eur"` ⚠️ lowercase | `"100 EUR"` ✅ canonical uppercase |
| Currency code in filter button | `"ALL"` displayed directly ✅ | `"ALL"` displayed directly ✅ (unchanged) |
| Cabinet currency selector | Shows code + localized name ✅ | Shows code + localized name ✅ (unchanged) |

---

## Translation key structure (documented)

| Key | Namespace | Purpose |
|-----|-----------|---------|
| `common.all` | `common` | UI "all/everything" label — NOT currency |
| `cabinet.filter_ALL` | `cabinet` | Listing visibility filter "All listings" — NOT currency |
| `cabinet.currency_ALL` | `cabinet` | Currency name label: "Albanian Lek (ALL)" |
| `cabinet.currency_EUR` | `cabinet` | Currency name label: "Euro (EUR)" |
| `cabinet.currency_USD` | `cabinet` | Currency name label: "US Dollar (USD)" |
| `cabinet.currency_GBP` | `cabinet` | Currency name label: "British Pound (GBP)" |

Currency codes themselves (`ALL`, `EUR`, `USD`, `GBP`) do not exist as standalone translation keys and must not be added as such.

---

## Locales checked

- `sq` ✅ — `common.all` = `"Të gjitha"`, `cabinet.filter_ALL` = `"Të gjitha"`, `cabinet.currency_ALL` = `"Lek Shqiptar (ALL)"`
- `en` ✅ — `common.all` = `"All"`, `cabinet.filter_ALL` = `"All"`, `cabinet.currency_ALL` = `"Albanian Lek (ALL)"`
- `uk` ✅ — `common.all` = `"Усі"`, `cabinet.filter_ALL` = `"Всі"`, `cabinet.currency_ALL` = `"Албанський лек (ALL)"`
- `it` ✅ — `common.all` = `"Tutti"`, `cabinet.filter_ALL` = `"Tutti"`, `cabinet.currency_ALL` = `"Lek albanese (ALL)"`

All locales have equal key counts (855 each). No keys were added or removed.

---

## Breakpoints checked

`formatPrice` is a pure formatting function — no layout, no breakpoints. Price display components (ListingCard, ListingContact, ListingsTab) use `formatPrice` consistently across all breakpoints:

- `320` / `375` / `390` — mobile: price in card and mobile bar, `"100,000 ALL"` or `"1,500 EUR"` format
- `768` — tablet transition
- `1280` / `1440` / `2560` — desktop: same format, no currency overflow

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:primitives` | ✅ PASS — 0C/57H/8M, at baseline |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run governance:tailwind` | ✅ PASS — at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in test files (`@testing-library/react` missing exports). Pre-existing.
- **Lint warnings (6)**: All pre-existing — same as after Task 85.
- **`cabinet.filter_ALL` overload risk**: The string `'ALL'` is shared between the currency code and the visibility group domain constant. This is intentional — the translation keys are correctly prefixed (`filter_ALL` vs `currency_ALL`) and no code mixes them. Documented for awareness.

---

## Remaining risks or follow-up items

- **`waText` Albanian hardcode in `ListingMobileCTA`**: The WhatsApp pre-fill message `Pershendetje! Jam i interesuar për: ${listingTitle}` is hardcoded Albanian. Separate task.
- **`ListingContact.tsx:56` Albanian hardcode**: `Përshëndetje, jam i interesuar për:` — same pattern as above. Separate task.
- **Currency code `'ALL'` as both currency and "default/no filter" sentinel**: In `HeroSearch.tsx` and `filterEngine.ts`, `ALL` is used to mean "use default / Albanian lek" and as the sentinel for "no currency filter". This is safe in current code but is an overloaded semantic. Could be separated to `''` (empty = default) vs `'ALL'` (explicit currency) in a future cleanup.
