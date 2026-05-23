# Task 193 — Q.4: Listings status tabs — canonical Tabs + remove stray border

**Date:** 2026-05-23  
**Epic:** Q — Combobox & UI Primitive Single-Source  
**Status:** ✅ Complete

## Pre-read findings

- `src/modules/listings/components/ListingsStatusTabs.tsx`: parallel tab implementation — custom `TabButton` wrapper around `Button`, container `<div className="listings-status-tabs flex border-b">` with full-width `border-b`. Each `TabButton` has `border-b-2 -mb-px rounded-none` for underline — manual active state via `cn()`. Does NOT use `Tabs/TabsList/TabsTrigger`.
- `src/components/ui/tabs.tsx`: canonical Tabs with `variant="default"` (pill) and `variant="line"` (underline indicator via `::after` pseudo-element at `bottom-[-5px]`). `TabsList variant="line"` = `bg-transparent gap-1`, no border across the container.

## Changes

### `src/modules/listings/components/ListingsStatusTabs.tsx` — full rewrite

Removed: `Button` import, `cn` import, local `TabButton` component, `<div className="... border-b">` container.

New implementation:
```tsx
<Tabs
  value={activeTab}
  onValueChange={switchTab}
  className="listings-status-tabs"
>
  <TabsList variant="line">
    <TabsTrigger value="active">{t('tab_active')}</TabsTrigger>
    <TabsTrigger value="closed">{t('tab_closed')}</TabsTrigger>
  </TabsList>
</Tabs>
```

- `variant="line"` → underline indicator only on active tab (no full-width `border-b`)
- Controlled: `value={activeTab}` / `onValueChange={switchTab}` — URL navigation unchanged
- `switchTab` kept as-is: deletes/sets `?tab=closed`, deletes `?page`

## Verification

- `tsc --noEmit` → 0 errors
- Stray `border-b` removed; active tab indicator is a narrow per-tab underline from `::after`
