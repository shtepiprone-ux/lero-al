# Task 233 — W.6 — Double vertical gap between filter bar and status tabs

**Date:** 2026-05-28  
**Sprint:** 15  
**Type:** bug fix (spacing)  
**Status:** ✅ Complete

---

## Problem Statement

The `.listings-filter-bar` and `.listings-status-tabs` on `/listings` were pressing against each other. The parent flex container had `gap-0`, so only the filter bar's internal `py-3` bottom padding (12px) provided visual separation before the border-b line, with 0px external gap above the status tabs.

---

## Root Cause

`ListingsShell.tsx` main content div: `<div className="flex-1 min-w-0 flex flex-col gap-0">` — `mt-0` (implicit). Status tabs were the first child, sitting immediately after the filter bar's `border-b`.

---

## Fix

Added `mt-4` (16px) to the main content div in `ListingsShell.tsx`:

```diff
-  <div className="flex-1 min-w-0 flex flex-col gap-0">
+  <div className="flex-1 min-w-0 flex flex-col gap-0 mt-4">
```

`mt-4` = 16px canonical spacing — creates clear visual breathing room between the `border-b` of the filter bar and the top of the status tabs.

---

## Collateral Impact Audit (Note 14)

- `ListingsShell` is only consumed by `src/app/[locale]/listings/page.tsx` — verified with grep.
- No other surface uses `.listings-shell` or depends on the 0-gap layout.
- `gap-0` within the inner div is unchanged — vertical spacing between status tabs, filter chips, sort bar, and listing grid is unaffected.

---

## Positive Flow

- `/listings` renders → filter bar → 16px gap → status tabs → listing grid. No visual crowding.

## Negative Flow

| Branch | Result |
|--------|--------|
| Mobile (320px) | `ListingsFilterBar` is `hidden md:flex` — filter bar not shown; `mt-4` applies but tabs sit directly at top which is expected on mobile |
| Wide desktop (2560px) | `mt-4` is a constant; doesn't scale up — gap stays proportional |
| Locale `uk` (longest strings) | Gap is locale-independent (no text inside the gap) |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `mt-4` added to inner content div | ✅ `ListingsShell.tsx:191` |
| Collateral grep: 0 other consumers | ✅ Only `/listings/page.tsx` uses `ListingsShell` |
| No new locale keys | ✅ Spacing-only change |

**Final verdict:** ✅ PASS — gap doubled from 0 → 16px (mt-4); canonical spacing; tsc=0.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/components/ListingsShell.tsx` | Added `mt-4` to main content div (line 191) | Creates 16px gap between filter bar border-b and status tabs |
