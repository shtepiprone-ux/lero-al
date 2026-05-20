# Session Archive: Task 110 — Mobile Drawer Padding Fix — 2026-05-20

**Sprint:** Sprint 3 — UI Primitive & Drawer Cleanup  
**Task:** 110  
**Type:** Responsive UI bug  
**Status:** ✅ CLOSED

---

## Bug

Mobile side drawer (hamburger menu) content was flush against the drawer edges — no horizontal padding. The content wrapper `<div className="flex flex-col gap-6 pt-6">` had `pt-6` (top) but no `px-` (horizontal). `SheetContent` has no default horizontal padding.

## Root Cause

`src/components/layout/Header.tsx` line 225: content wrapper set only vertical padding.

## Fix

Added `px-4` to the drawer content wrapper, matching SheetHeader/SheetFooter canonical `p-4` padding:

```diff
- <div className="flex flex-col gap-6 pt-6">
+ <div className="flex flex-col gap-6 pt-6 px-4">
```

**Why `px-4`:** `SheetHeader` = `p-4`; `SheetFooter` = `p-4`. Using `px-4` (16px) ensures the whole drawer panel reads consistently at the canonical padding level.

## Verification

- **Both drawer states confirmed:** unauthenticated (nav links + auth buttons) and authenticated (user info + nav + logout) both gain consistent horizontal padding from the single wrapper change.
- **Mobile locale switcher (Task 106):** Lives in the header bar (the `Combobox` with `className="w-24 sm:hidden"` at line 139), NOT inside the Sheet drawer. Unaffected.
- **`governance:tailwind`** ✅ PASS (C0/H0/M15 — no new violations)
- **`governance:responsive`** ✅ PASS (C0/H0/M18 — no new violations)
- **ESLint** ✅ 0 errors / 0 warnings

## Acceptance Criteria Checklist

- [x] Drawer content has canonical horizontal padding (`px-4`) — nothing flush against edges
- [x] Consistent padding for both authenticated and unauthenticated states (single wrapper fix)
- [x] Mobile locale switcher (Task 106) still aligned — it's in the header bar, not the drawer
- [x] No arbitrary spacing values — only canonical `px-4`
- [x] `governance:tailwind` PASS at baseline
- [x] `governance:responsive` PASS at baseline
- [x] 0 new lint errors / 0 new warnings
- [ ] `npm run build` — user's manual step

## Out of Scope

- Primitive substitution (Task 109 — done)
- AuthSheet internal layout (Task 108 — done)
- Any drawer redesign beyond the padding fix
