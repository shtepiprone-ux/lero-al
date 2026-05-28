# Task 242 — BB.1 — Listing report button broken on detail page

**Date:** 2026-05-28  
**Sprint:** 14  
**Type:** bug fix (UI wiring)  
**Status:** ✅ Complete

---

## Problem Statement

The "Поскаржитись" / "Raporto njoftimin" button on the public listing detail page was visible but clicking it did nothing.

---

## Root Cause

In `src/app/[locale]/listings/[slug]/page.tsx` (left column, below the map):

```tsx
{/* Report */}
<div className="flex justify-end">
  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
    <Flag className="h-3.5 w-3.5" />
    {t('report_listing')}
  </button>
</div>
```

This was a **raw `<button>` with NO `onClick` handler** — a placeholder never wired to `ListingReportDialog`. The Dialog component existed and worked (`ListingReportDialog` is used in `ListingContact` sidebar on desktop), but the content-column button had no connection to it.

**Additional finding:** `ListingReportDialog` was already used in `ListingContact.tsx` (desktop sidebar, `hidden lg:block`) with `canReport` gating. The dialog backend (`reportListingAction`) was fully functional. Only the content-column button was broken.

---

## UX Flow Trace (Note 19)

**Before:**
- Authenticated non-owner user → listing detail → clicks "Поскаржитись" in left column → nothing happens
- The sidebar Report button in `ListingContact` (desktop) worked, but wasn't the button users found

**After:**
- Authenticated non-owner user → listing detail → clicks "Поскаржитись" in left column → `ListingReportDialog` opens → picks reason → Submit → `reportListingAction` creates DB row → `toast.success(t('report_success'))` → dialog closes
- Guest / owner: button not rendered (canReport = false)

---

## Control Inventory (Note 20 — preserved)

| Control | Before | After |
|---------|--------|-------|
| "Поскаржитись" button in left column | Dead `<button>` (no onClick) | Wired to `ListingReportDialog` (conditional on canReport) |
| `ListingReportDialog` in ListingContact sidebar | Unchanged — still present for desktop | Unchanged |
| All other listing detail controls | Unchanged | Unchanged |
| `canReport` gating | Inline expression in `LazyListingContact` prop | Extracted to `const canReport` variable; shared between left-column dialog and sidebar |

---

## Changes Made

### `src/app/[locale]/listings/[slug]/page.tsx`

1. **Removed `Flag` from lucide import** — only used in the dead button; `ListingReportDialog` renders its own `Flag` icon.

2. **Added `ListingReportDialog` import.**

3. **Extracted `canReport` as a variable** (was inline in `LazyListingContact` prop):
   ```typescript
   const canReport = !isGuest && !!authUser && authUser.id !== listing.user_id
   ```

4. **Replaced dead button with wired dialog:**
   ```tsx
   {/* Report — authenticated non-owner only */}
   {canReport && (
     <div className="flex justify-end">
       <ListingReportDialog listingId={listing.id} />
     </div>
   )}
   ```

5. **Updated `LazyListingContact` to use the variable:** `canReport={canReport}`.

---

## Negative Flow

| Branch | Handler |
|--------|---------|
| Guest viewer (canReport=false) | Button NOT rendered — existing gating preserved |
| Owner viewer (canReport=false) | Button NOT rendered |
| Cancel/Esc in dialog | No DB write; dialog closes (setOpen(false)) |
| No reason selected | Submit button disabled (`!reason`) |
| `reportListingAction` returns `already_reported` | `toast.info(t('report_already_reported'))` → dialog closes |
| `reportListingAction` returns other error | `toast.error(t('report_error'))` — form preserved |
| Double-submit | `isPending` guard (existing in `ListingReportDialog`) |

**Duplicate-report note:** `reportListingAction` in `reportListing.ts` returns `{ error: 'already_reported' }` and the dialog handles it with `toast.info` — verified in `ListingReportDialog.tsx:55-58`.

---

## Locale Keys Audit

All required keys already exist in all 4 locale files (×4 parity confirmed):
- `listing.report_listing` ✅
- `listing.report_dialog_title` ✅
- `listing.report_reason_label` + all 6 reason keys ✅
- `listing.report_comment_label` + `report_comment_placeholder` ✅
- `listing.report_submit` ✅
- `listing.report_success` ✅
- `listing.report_already_reported` ✅
- `listing.report_error` ✅

No new locale keys added.

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| Dead button removed | ✅ Raw `<button>` with no onClick gone |
| `ListingReportDialog` wired in left column | ✅ Conditional on `canReport` |
| canReport gating | ✅ `!isGuest && !!authUser && authUser.id !== listing.user_id` |
| `ListingContact` sidebar report button | ✅ Unchanged (still present for desktop) |
| All locale keys exist × 4 | ✅ Verified |
| No new locale keys needed | ✅ |

**Final verdict:** ✅ PASS — dead button replaced with wired dialog, tsc=0, canReport gating correct.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/app/[locale]/listings/[slug]/page.tsx` | Removed `Flag` import; added `ListingReportDialog` import; extracted `canReport` variable; replaced dead `<button>` with `{canReport && <ListingReportDialog listingId={listing.id} />}`; updated prop in LazyListingContact | Wire the broken report button to the existing dialog component |
