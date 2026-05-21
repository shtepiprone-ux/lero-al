# Session Archive: Epic K.2 — Migrate AdminListingsTable to Canonical Pattern — 2026-05-21

## Task 128 — Migrate Listings admin table to canonical pattern

**Status:** COMPLETE

---

## Changes

### `AdminListingsTable.tsx` — rewritten

**Before:**
- Listing title was a `<span>` (not clickable)
- `col_actions` column with Pencil + Trash2 + Star icon buttons in every row
- Delete used `window.confirm()` (blocks main thread, not i18n)
- `PremiumDialog` used custom `div.fixed.inset-0` overlay (governance violation)
- Raw `<button>` elements in PremiumDialog preset buttons

**After (K.1 canonical pattern):**
- Listing title is a `<button>` → opens `ListingPreviewDialog`
- `col_actions` column removed; 8 columns → 7 columns (`colSpan` updated)
- `PremiumDialog` wrapped in canonical `Dialog` from `@/components/ui/dialog`
- `ListingPreviewDialog` (new): shows listing details + Edit/View/Premium/Delete actions
  - Delete shows inline confirmation (state toggle within the dialog — no second Dialog needed)
  - Edit / View are `<Link>` styled with `buttonVariants` (Button asChild not supported)
- All raw `<button>` in PremiumDialog converted to canonical `Button`
- `loadingId` / `withLoading` / `startTransition` removed (actions now in Dialog, not row)

### `messages/*.json` (4 locales)
Added to `admin.listings`:
- `btn_view` — "View listing"
- `delete_dialog_body` — "This action cannot be undone."
- `preview_title` — "Listing details"

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: PASS
