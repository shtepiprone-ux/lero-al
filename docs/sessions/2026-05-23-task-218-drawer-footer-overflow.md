# Task 218 — Homepage drawer footer buttons overflow (responsive)

**Date:** 2026-05-23  
**Status:** ✅ Done

## Root cause

Footer was `flex gap-3 shrink-0` with two `Button size="xl" flex-1`. On a 320px viewport the
drawer fills the full width → footer inner width ≈ 280px → each button ≈ 134px → text area ≈ 94px.
Ukrainian "Скинути фільтри" / "Застосувати фільтри" (~120px each) overflowed at 320–375px.
`flex-1` without `min-w-0` cannot shrink below content-width, and `size="xl"` (`px-5` = 40px/btn
horizontal padding) left almost no room for Cyrillic text.

## Fix

`src/components/shared/FiltersPanel.tsx` — footer container only (one line change):

**Before:** `flex gap-3 shrink-0`  
**After:** `flex flex-col gap-3 shrink-0`

Additionally reordered: Apply (primary) first, Reset (secondary/outline) below — standard drawer
footer convention (primary action most reachable). Both remain `size="xl"` (`h-11` = 44px) with
`w-full`. The Apply badge (`absolute -top-1.5 -right-1.5`) still works correctly with the `relative`
button.

## Why `flex-col` (not `min-w-0 + truncate`)

The drawer is `max-w-sm` (384px) — it is ALWAYS a narrow panel regardless of viewport width.
Truncating labels would hide the action name on the smallest devices. Stacking is the canonical
drawer-footer pattern (Google Maps, Material Design side panels) and works at every breakpoint
with full label visibility and full 44px touch targets.

## UI pre-flight checklist

1. **Non-canonical dropdowns** — no `<select>` or shadcn `Select` added. ✅
2. **Ad-hoc control heights** — no `h-8/9/10/11/12` on Button added; buttons remain `size="xl"` (h-11). ✅
3. **Z-index** — no `z-` values changed in this file. ✅
4. **Overflow-risk rows** — eliminated: footer is now `flex-col`, each button is `w-full`. No row to overflow. ✅
5. **Same-row height** — N/A (no shared row after the fix). ✅
6. **All 7 breakpoints:**
   - 320px: each button 280px wide, full label visible. ✅
   - 375px: each button 335px wide. ✅
   - 390px: each button 350px wide. ✅
   - 768px: drawer `max-w-sm` = 384px, buttons 344px wide. ✅
   - 1280/1440/2560px: same — drawer fixed at 384px, no regression. ✅
7. **Touch targets** — `size="xl"` = h-11 = 44px. ✅

## tsc
`tsc --noEmit` → 0 errors.
