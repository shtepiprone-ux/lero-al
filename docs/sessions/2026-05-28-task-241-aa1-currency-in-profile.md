# Task 241 — AA.1 Currency picker moves from filters → user profile

**Date:** 2026-05-28  
**Epic:** AA — Currency in Profile (M.7)  
**Executor:** Sonnet 4.6

---

## Summary

Currency Combobox was present in THREE locations (ProfileTab + ListingsFilters drawer + FiltersPanel homepage drawer). This task:
1. Adds the iliria98 exchange-rate disclaimer below the Combobox in `ProfileTab`.
2. Removes the duplicate currency Combobox from `ListingsFilters.tsx` (listings page drawer).
3. Removes the duplicate currency Combobox from `FiltersPanel.tsx` (homepage drawer), and cleans up dead code (priceLabel with currency suffix, exchange rate display).

---

## Current behavior to preserve

- Every price-rendering surface continues to render in the user's `preferred_currency` (already reads from auth context per Task 215 + Task 216 — not from filter state).
- ProfileTab currency Combobox: editable, saves to DB, calls `refreshUser()` after save (Task 248 pattern — already wired).
- Edit-Flow Preservation Rule (Note 23): `preferred_currency` remains editable in ProfileTab; save persists to DB.

## Required after behavior

1. ProfileTab Currency Combobox unchanged; new `currency_rate_disclaimer` text below it in all 4 locales.
2. Filter panels (ListingsFilters + FiltersPanel) no longer show a currency Combobox.
3. No functional regression: prices still render in user's profile currency; filter panels still work.

---

## Positive flow

User opens ProfileTab → sees Currency Combobox → selects EUR → Save → `refreshUser()` → header re-renders prices in EUR → `preferred_currency` persists after reload. Below Combobox: "Exchange rate is approximate (≈), source: iliria98.com — may differ from the final price."

## Negative flow

| Branch | Handling |
|--------|----------|
| Currency selection invalid (not in catalog) | Existing validation guard (Task 216) ✓ |
| DB save fails | `setSaveStatus('error')` → existing error display ✓ |
| Filter panels still rendering currency selector after change | Verified removed (grep proof below) ✓ |
| Mobile (320px) | ProfileTab layout unchanged; disclaimer is a short `text-xs` line → wraps naturally ✓ |
| AA.1 disclaimer missing in one locale | Verified all 4 locale files have `currency_rate_disclaimer` ✓ |

---

## Note 20 — Explicit control removal inventory

| Control removed | From file | Reason |
|-----------------|-----------|--------|
| Currency `Combobox` (options from `currencies`) | `src/modules/listings/components/ListingsFilters.tsx` | Collapsed to ProfileTab; filter-panel duplicate |
| Currency `Combobox` (options from `currencies`) | `src/components/shared/FiltersPanel.tsx` | Collapsed to ProfileTab; filter-panel duplicate |
| `currency`/`rates`/`currencies` from FiltersPanel destructuring | `src/components/shared/FiltersPanel.tsx` | No longer needed after Combobox removal |
| Exchange rate display `{currency !== 'ALL' && ...}` | `src/components/shared/FiltersPanel.tsx` | Dead code — currency always 'ALL' in homepage filters after removal |
| `${currency}` suffix in `priceLabel` | `src/components/shared/FiltersPanel.tsx` | Dead code |

Note: `ListingsFilters.tsx` retains `currency` + `rate` + exchange rate display (they read from URL params which can still be set externally, and the information is still valid).

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/cabinet/components/ProfileTab.tsx` | Added `flex flex-col gap-3` to currency section div; added `<p>{t('currency_rate_disclaimer')}</p>` | iliria98 ≈ rate disclaimer required by task |
| `src/modules/listings/components/ListingsFilters.tsx` | Removed `currencies` from destructuring; removed currency Combobox JSX from Price section | Duplicate currency selector removed |
| `src/components/shared/FiltersPanel.tsx` | Removed `currencies, currency, rates` from destructuring; `priceLabel = t('price_range')`; removed currency Combobox + exchange rate display | Duplicate currency selector + dead code removed |
| `messages/en.json` | Added `"currency_rate_disclaimer"` | Locale parity |
| `messages/sq.json` | Added `"currency_rate_disclaimer"` | Locale parity |
| `messages/uk.json` | Added `"currency_rate_disclaimer"` | Locale parity |
| `messages/it.json` | Added `"currency_rate_disclaimer"` | Locale parity |
| `docs/backlog.md` | Updated Last Session + Next Immediate Tasks | Task 264 contract |
| `docs/sessions/2026-05-28-task-241-aa1-currency-in-profile.md` | New session log | Task 264 contract |

---

## §17 UI Pre-flight Checklist

1. **No non-canonical dropdowns:** Currency uses canonical `Combobox` in ProfileTab; removed from filter panels ✓
2. **No ad-hoc control heights:** No height changes ✓
3. **Z-index:** No z-index changes ✓
4. **Overflow-risk rows:** Disclaimer is `text-xs text-muted-foreground` line — wraps naturally ✓
5. **Same-row height:** No new row-level controls ✓
6. **7 breakpoints:** ProfileTab disclaimer is a short text line; wraps at 320px without issue ✓
7. **Touch targets:** No new interactive controls ✓
8. **4 locales:** `currency_rate_disclaimer` added to sq/en/uk/it ✓

---

## AC self-audit

| AC | Status |
|----|--------|
| Currency Combobox visible in ProfileTab; removed from 3 filter sites → verified 2 (ListingsFilters + FiltersPanel); ListingsFilterBar never had it | ✓ |
| Note 20 control-inventory documenting the removal | ✓ |
| Description text in 4 locales (currency_rate_disclaimer) | ✓ |
| Header reactivity works (Task 248 pattern — `refreshUser()` already wired) | ✓ |
| Edit-Flow Preservation Rule honored | ✓ |
| §17 UI pre-flight output | ✓ |
| 0 new lint/typecheck errors (tsc → 0) | ✓ |
| Locale parity ×4 | ✓ |
| "Files Changed" table per Task 264 | ✓ |
| Self-validation block per Note 18 | ✓ |

---

## Self-validation

- `npx tsc --noEmit` → **0 errors** ✓
- `grep currencies.*filter.*is_active` → 1 hit (ProfileTab only) ✓
- `grep currency_rate_disclaimer messages/` → 4 hits ✓
- `ListingsFilters.tsx` price section: no Combobox; `FilterRangeInputs` is first child ✓
- `FiltersPanel.tsx` price section: no Combobox; priceLabel = `t('price_range')` ✓
- **Self-validation verdict: COMPLETE — all AC met, tsc=0, §17 pre-flight passed**
