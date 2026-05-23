# Task 219 — Homepage drawer overlapped by sticky header: z-index layering scale

**Date:** 2026-05-23  
**Status:** ✅ Done

## Root cause

`Header.tsx` was `sticky top-0 z-50`. `FiltersPanel.tsx` panel is `z-50` and its backdrop `z-40`.
Because the header and panel share `z-50`, DOM paint order is undefined — header wins depending on
stacking context → header shows through/above the drawer. `MobileBottomNav.tsx` was `z-40`
(same layer as the scrim, so the bottom nav showed through the backdrop when the drawer opened on mobile).

## Fix

Canonical z-index scale adopted (per `docs/ui-rules.md §16`):

| Layer | Value | Elements |
|---|---|---|
| Chrome | `z-30` | Sticky site header, fixed bottom nav |
| Scrim | `z-40` | Drawer/panel backdrops (FiltersPanel already correct) |
| Floating surfaces | `z-50` | Drawer panel, dialogs, sheets, popovers, comboboxes, dropdowns, toasts |

### `src/components/layout/Header.tsx`
`z-50` → `z-30`

### `src/components/layout/MobileBottomNav.tsx`
`z-40` → `z-30`

### `src/components/shared/FiltersPanel.tsx`
No change needed — backdrop already `z-40`, panel already `z-50`. ✅

### UI primitives (`dialog.tsx`, `sheet.tsx`, `popover.tsx`, `select.tsx`, `dropdown-menu.tsx`)
No change. These are all `z-50` (floating surfaces — correct per scale). Their backdrops use
`isolate z-50` which places the full dialog/sheet stacking context at `z-50`; with the header now
at `z-30`, dialogs/sheets correctly appear above the header. Changing the internal `z-50` backdrop
to `z-40` within these components would require verifying the `isolate` stacking context model
across all consumers — deferred per the CAVEAT in the task brief.

## Stacking order after fix

```
z-30  site header (sticky), mobile bottom nav (fixed)
z-40  FiltersPanel backdrop (scrim/overlay)
z-50  FiltersPanel panel, AuthSheet, dialogs, popovers, comboboxes, dropdowns
```

Opening the homepage drawer:
- backdrop `z-40` > header `z-30` → header is FULLY DIMMED by the scrim ✅
- panel `z-50` > backdrop `z-40` → panel renders above the scrim ✅
- Portaled comboboxes inside the drawer also render at `z-50` via DOM order (same z-level, later in DOM) ✅

## UI pre-flight checklist

1. **Non-canonical dropdowns** — no changes to dropdown components. ✅
2. **Ad-hoc control heights** — no changes to any controls. ✅
3. **Z-index on the scale** — grep `Header.tsx`/`MobileBottomNav.tsx`: both now `z-30`. FiltersPanel: backdrop `z-40`, panel `z-50`. UI primitives: `z-50` (floating surfaces). All on-scale. ✅
4. **Overflow-risk rows** — no new flex rows introduced. ✅
5. **Same-row height** — N/A. ✅
6. **All 7 breakpoints** — z-index is viewport-independent; stacking verified by the layer analysis above for all sizes. MobileBottomNav visible only below `md` (768px). ✅
7. **Touch targets** — no changes. ✅

## tsc
`tsc --noEmit` → 0 errors.
