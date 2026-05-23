# Task 194 — Q.5: Card/list view toggle — smooth active-state rounding

**Date:** 2026-05-23  
**Epic:** Q — Combobox & UI Primitive Single-Source  
**Status:** ✅ Complete

## Pre-read findings

`src/modules/listings/components/ListingsSortBar.tsx` — view toggle:
```tsx
<div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
  <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon"
    className="h-9 w-9 rounded-none" ...>
  <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon"
    className="h-9 w-9 rounded-none" ...>
</div>
```

Root cause of clipped corners: `overflow-hidden` on container clips the active button's background (`variant="default"` = primary fill) at the container corners instead of letting the button have its own border-radius. `rounded-none` on buttons means the button itself has no rounding — it relies entirely on the container's clip.

## Fix

Replaced `overflow-hidden` container + `rounded-none` buttons with segmented-control pattern:

```tsx
<div className="hidden sm:flex items-center bg-muted rounded-xl p-1">
  <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon-sm"
    onClick={() => onViewChange('grid')} aria-label={t('view_grid')}>
    <LayoutGrid className="size-4" />
  </Button>
  <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon-sm"
    onClick={() => onViewChange('list')} aria-label={t('view_list')}>
    <List className="size-4" />
  </Button>
</div>
```

- Container: `bg-muted rounded-xl p-1` — no `border`, no `overflow-hidden`
- `size="icon-sm"` = `size-7` (28px) + built-in `rounded-[min(var(--radius-md),12px)]` ≈ 9.6px
- Icons: `size-4` (explicit `size-*` class prevents `icon-sm`'s `[&_svg:not([class*='size-'])]:size-3` override)
- Outer height: 28 + 4 + 4 = 36px = h-9 (matches sort combobox height)
- Active button has its own border-radius → smooth corners, no clipping

## Verification

- `tsc --noEmit` → 0 errors
