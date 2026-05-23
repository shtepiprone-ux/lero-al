# Task 220 — `/listings` toolbar height/spacing/combobox consistency

**Date:** 2026-05-23  
**Status:** ✅ Done

## Root cause

Three compounding height inconsistencies in the `/listings` toolbar:

1. **LocationCombobox had no `size` prop** — the wrapper delegated to `Combobox` without forwarding `size`, so it always rendered at the default `h-11` (44px). Every other control in the FilterBar was h-9 (36px), making the location field visibly taller.

2. **All filter/sort buttons used `size="sm"` + `className="h-9 ..."` override** — non-canonical pattern. `Button size="sm"` natively gives h-7 (28px); callers were forcing h-9 via a className override, which §15 and §3 both prohibit. The canonical Button size for h-9 is `size="lg"`.

3. **SortBar mobile filters button** — same `size="sm" h-9` pattern.

## Fix

### `src/components/shared/LocationCombobox.tsx`
Added optional `size?: 'default' | 'sm' | 'xs'` prop to the `Props` interface; passes it through to the inner `<Combobox size={size}>`. Default is `undefined` → Combobox defaults to `'default'` (h-11) — all existing callers (form fields, admin, etc.) unchanged.

### `src/modules/listings/components/ListingsFilterBar.tsx`
- **LocationCombobox**: added `size="sm"` → now h-9, matching all other controls in the row.
- **Sale/rent type buttons**: `size="sm" className="h-9 rounded-xl text-xs px-3 shrink-0"` → `size="lg" className="rounded-xl text-xs px-3 shrink-0"`. `size="lg"` natively provides h-9; the `h-9` override removed.
- **Reset button**: `size="sm" className="h-9 text-xs ..."` → `size="lg" className="text-xs ..."`. `h-9` override removed.
- **Advanced filters button**: `size="sm" className="h-9 rounded-xl text-xs gap-1.5 shrink-0 relative"` → `size="lg" className="rounded-xl text-xs gap-1.5 shrink-0 relative"`. `h-9` override removed.
- No change to Property type `Combobox size="sm"` — already canonical.

### `src/modules/listings/components/ListingsSortBar.tsx`
- **Mobile filters button**: `size="sm" className="md:hidden h-9 px-3 rounded-xl relative gap-1.5"` → `size="lg" className="md:hidden px-3 rounded-xl relative gap-1.5"`. `h-9` override removed.
- No change to Sort `Combobox size="sm"` or view toggle `size="icon-sm"` — already canonical.

## Height alignment after fix

| Control | Before | After |
|---|---|---|
| Sale/rent buttons | `size="sm" h-9` (override) | `size="lg"` (h-9 natively) |
| Property type Combobox | `size="sm"` (h-9) | `size="sm"` (h-9) ← unchanged |
| Location Combobox | no size (h-11!) | `size="sm"` (h-9) |
| Reset button | `size="sm" h-9` (override) | `size="lg"` (h-9 natively) |
| Advanced filters button | `size="sm" h-9` (override) | `size="lg"` (h-9 natively) |
| Sort Combobox | `size="sm"` (h-9) | `size="sm"` (h-9) ← unchanged |
| Mobile filters button | `size="sm" h-9` (override) | `size="lg"` (h-9 natively) |
| View toggle (icon-sm in p-1 container) | 28px button + 8px padding = 36px | unchanged |

All controls in both bars: **h-9 (36px)** — consistent and canonical.

## Spacing

Both bars already used `py-3 border-b` (canonical toolbar rhythm, §1). No spacing changes needed — the height inconsistency was the root cause of the "cramped" look, not the padding.

## UI pre-flight checklist §17

1. **Non-canonical dropdowns** — no `<select>` or shadcn `Select` in touched files; all selectors use canonical `Combobox`. ✅
2. **No ad-hoc control heights on Button** — all `h-9` overrides on Button removed. Remaining `text-xs px-3 gap-1 rounded-xl` are non-height style overrides (valid per §3). `size="lg"` natively provides h-9. ✅
3. **Z-index on the scale** — no `z-` values changed in any touched file. ✅
4. **Overflow-risk rows** — FilterBar has `overflow-x-auto flex-nowrap`; individual buttons and comboboxes have `shrink-0`. No new overflow risk. ✅
5. **Same-row height** — every control in FilterBar (md+) and SortBar now at h-9. View toggle: icon-sm (28px) inside `bg-muted p-1` = 36px outer height, same row rhythm. ✅
6. **All 7 breakpoints** — height changes are viewport-independent. FilterBar `hidden md:flex` (invisible below 768px). SortBar visible all widths; mobile filters button `md:hidden` (not present on desktop). ✅
7. **Touch targets** — FilterBar is desktop-only (`hidden md:flex`). SortBar mobile filters button: h-9=36px — below 44px but was already 36px before (no regression). Primary mobile navigation uses MobileBottomNav (h-14 with full touch targets). Filter access on mobile uses the Sheet via the sort bar button. ✅
8. **4 locales** — no new i18n strings added; size changes don't affect locale text rendering. sq/en/uk/it unaffected. ✅

## Out-of-scope offenders spotted for Task 221

During the read phase the following were noted for the global audit:
- `ListingFormShell.tsx:433` — `LocationCombobox` has no `size` prop (form field, correct at h-11).
- `src/components/admin/AdminUserCreate.tsx:276` — `LocationCombobox` no size (admin form, correct at h-11).
- Any remaining `Button size="sm" h-9` patterns elsewhere in the codebase (see Task 221 grep scope).

## tsc
`tsc --noEmit` → 0 errors (pure optional-prop addition + Button size variant change, both type-safe).
