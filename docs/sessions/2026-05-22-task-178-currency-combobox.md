# Task 178 — M.4: currency selector = canonical Combobox everywhere

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** UI refactor / governance

## Goal

Replace every button-based currency selector with the canonical `Combobox` primitive (docs/ui-rules.md §0).
All surfaces now consume the Task 177 catalog via `useCurrencies()`.

## Changes

| File | Change |
|---|---|
| `src/components/shared/FiltersPanel.tsx` | Added `Combobox` import. Currency button-row in Price `SectionHeader right` removed. Replaced with `<Combobox variant="button" size="sm" portal>` below SectionHeader, options from `currencies.filter(c => c.is_active)`. |
| `src/modules/listings/components/ListingsFilters.tsx` | Added `Combobox` import. `<div className="flex gap-1.5 mb-2">{currencies.map(Button)}` in Price accordion replaced with `<Combobox variant="button" size="sm" portal>`. `onChange` preserves existing behavior: removes `currency` URL param when default is selected (`cur.is_default ? null : code`). |
| `src/modules/cabinet/components/ProfileTab.tsx` | `CurrencySelector` button grid (`grid-cols-4` with per-button symbol + code) replaced with `<Combobox variant="button" size="sm">`, options include `description: c.symbol` for context in dropdown. `useMemo` used to memoize the options array. |

## Combobox options shape

All three surfaces use the same pattern:
```ts
currencies.filter(c => c.is_active).map(c => ({ value: c.code, label: c.code }))
```
Currency codes render literally (never via `t()`). ProfileTab additionally passes `description: c.symbol`.

## Active-filter count invariant (no regression)

Both filter hooks (`useHomepageFilters`, `useListingsUrlFilters`) exclude `currency` from `activeCount`:
```ts
if (key === 'currency') return false
```
This rule is unchanged. No new `currency` counter added anywhere.

## Verification — grep: zero currency button-rows remain

Pattern `currencies\.map.*button|currencies\.map.*Button` → **0 matches** after change.

## Acceptance criteria

- [x] All three currency selectors replaced with canonical `Combobox`
- [x] Options fed by `useCurrencies()` catalog (all active currencies, not hardcoded 2)
- [x] `variant="button"` chosen (≤8 static items, no search needed)
- [x] `portal` on filter panels (inside fixed sidebars with overflow)
- [x] Currency excluded from active-filter counts (unchanged)
- [x] Currency codes rendered literally in `label` field — never via `t()`
- [x] 0 new tsc / lint errors
