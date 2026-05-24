# Task 200 — R.6: Move Delete into the modal for locations & property types

**Date:** 2026-05-24
**Status:** ✅ Complete

## Scope

Moved the Trash2 row-level delete button into the entity modal/dialog for:
- `AdminLocationsManager` (admin/locations page)
- `AdminPropertyTypesManager` (admin/property-types page)

Per §11 canonical pattern: the table row's primary text is the **only** click affordance; all actions (including Delete) live inside the modal opened by clicking that text.

## Changes

### `src/components/admin/AdminLocationsManager.tsx`
- Removed `Trash2` from lucide imports (no longer used in rows)
- Added `onDelete?: () => void` to `LocationModal` props + destructuring
- Added `const tc = useTranslations('common')` inside `LocationModal`
- Added a `variant="destructive"` Delete button in `LocationModal` footer — only visible when `location` is set (edit mode, not create)
- Updated `LocationModal` rendering in parent: passes `onDelete={() => { setModal(null); setDeleteTarget(modal as Location) }}` (only when `modal !== 'create'`)
- Removed the Trash2 `<button>` from the name cell in the table row; the cell now contains only the primary name `<button>`

### `src/components/admin/AdminPropertyTypesManager.tsx`
- Removed `Trash2` from lucide imports (no longer used in rows)
- Added `onDelete?: () => void` to `FormDialogProps` interface + `PropertyTypeFormDialog` destructuring
- Added a `variant="destructive"` Delete button in `PropertyTypeFormDialog` footer with `className="mr-auto"` — only visible when `initial` is set (edit mode)
- Updated `PropertyTypeFormDialog` rendering in parent: passes `onDelete={() => { setEditTarget(undefined); setDeleteTarget(editTarget as DBPropertyType) }}` (guarded by `editTarget !== 'new' && editTarget`)
- Removed the Trash2 `<button>` from the SQ name cell; cell now contains only the primary name `<button>`

## Locale impact

No new locale keys. Existing keys reused:
- `common.delete` — Delete button in `LocationModal`
- `admin.property_types.delete` — Delete button in `PropertyTypeFormDialog` (same key already used in `DeleteDialog`)

## Verification

- `Trash2` no longer referenced in either file (`grep Trash2` → 0 hits in both)
- `onDelete` is typed optional so callers without delete (create mode) are unaffected
- Confirmation dialogs unchanged — they still show as a second dialog after the edit modal closes
- No new SQL, no schema changes, no locale JSON edits
- `tsc --noEmit` → 0 errors (verified below)
