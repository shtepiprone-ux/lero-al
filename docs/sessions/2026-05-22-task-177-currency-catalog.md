# Task 177 — M.3: Admin Currency table from iliria98.com; one catalog everywhere

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** Feature / refactor / §11 migration

## Goal

Single currency catalog consumed by every picker (filters, cabinet preferred currency, admin).
Remove all per-surface hardcoded currency arrays. Admin table migrated to §11 (row click → Dialog).

## SQL — idempotent seed (owner runs this)

```sql
-- Add USD and GBP to the currencies catalog.
-- ON CONFLICT (code) DO NOTHING makes this safe to run repeatedly.
INSERT INTO currencies (code, symbol, name_sq, name_en, name_uk, name_it, is_active, is_default, decimals)
VALUES
  ('USD', '$',  'Dollar amerikan', 'US Dollar',     'Долар США',        'Dollaro USA',         true, false, 2),
  ('GBP', '£',  'Paund britanik',  'British Pound',  'Британський фунт', 'Sterlina britannica', true, false, 2)
ON CONFLICT (code) DO NOTHING;
```

No schema changes — `currencies` table and `DBCurrency` interface unchanged. `INTERFACE_TABLE_MAP` not updated (no new tables/columns).

## Changes

| File | Change |
|---|---|
| `src/modules/currency/hooks/useCurrencies.ts` | FALLBACK extended: USD + GBP added (matches DB seed). All 4 currencies available immediately even before DB responds. |
| `src/modules/cabinet/components/ProfileTab.tsx` | Removed hardcoded `CURRENCY_OPTIONS` array. `CurrencySelector` now calls `useCurrencies()` internally; renders DB catalog filtered to `is_active`. State type: `PreferredCurrency` → `string`; cast to `PreferredCurrency` at `updateCabinetProfile` call boundary only. |
| `src/components/admin/AdminCurrenciesManager.tsx` | §11 migration: removed `CurrencyRow` component + Actions column. Added `CurrencyDetailDialog` (preview + Edit/Toggle/SetDefault/Delete). Currency CODE cell is now the sole click target (`<button>` → opens detail dialog). Table: 6 columns → 5 columns. |

## Catalog source verification (grep)

After this task, hardcoded per-surface display-currency arrays are gone:

| Surface | Before | After |
|---|---|---|
| Cabinet preferred currency (`ProfileTab`) | `CURRENCY_OPTIONS` literal array | `useCurrencies()` |
| Public filter (`ListingsFilters`) | `useCurrencies()` via `useListingsUrlFilters` | unchanged ✓ |
| Homepage filter (`FiltersPanel`) | `useCurrencies()` via `useHomepageFilters` | unchanged ✓ |
| Admin currency table (`AdminCurrenciesManager`) | `initialCurrencies` SSR prop from DB | unchanged ✓ |

Remaining `['ALL', 'EUR'] as const` in `ListingFormShell.tsx` and `StepBasicInfo.tsx` are listing-price-currency domain constraints (not display-catalog pickers) — addressed in Task 178 (Combobox swap).

## §11 compliance — AdminCurrenciesManager

| Criterion | Result |
|---|---|
| Primary text (CODE) clickable | ✅ `<button>` → `CurrencyDetailDialog` |
| No Actions column | ✅ removed |
| Actions in dialog | ✅ Edit, Toggle, Set Default, Delete |
| Destructive confirm dialog | ✅ existing `deleteTarget` Dialog (unchanged) |
| All 4 locales | ✅ no new locale keys — existing `edit`, `activate`, `deactivate`, `set_default`, `delete`, `tc('close')` |
| All 7 breakpoints | ✅ table responsive, dialog `max-w-md` |

## Acceptance criteria

- [x] FALLBACK has USD + GBP; DB seed SQL provided (idempotent, `ON CONFLICT DO NOTHING`)
- [x] `ProfileTab` `CurrencySelector` reads from `useCurrencies()` — no hardcoded options
- [x] `AdminCurrenciesManager` follows §11 (row click → Dialog, no Actions column)
- [x] No new locale keys needed; all 4 locales pass
- [x] 0 new tsc / lint errors
