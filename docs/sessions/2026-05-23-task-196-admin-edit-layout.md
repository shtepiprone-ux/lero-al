# Task 196 — R.2: Admin edit-screen side-panel actions pattern

**Date:** 2026-05-23  
**Status:** ✅ Complete  
**`tsc --noEmit`:** 0 errors

## What changed

### New file: `src/components/admin/AdminEditLayout.tsx`
Reusable two-column wrapper for admin edit screens.
- `flex-col lg:flex-row gap-6 items-start`
- `main` slot: `flex-1 min-w-0 flex flex-col gap-6`
- `sidebar` slot: `w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-20`

### `src/app/admin/users/[id]/page.tsx`
- Container widened: `max-w-3xl` → `max-w-5xl`

### `src/components/admin/AdminUserProfile.tsx`
Full render section restructured around `AdminEditLayout`:

**Above layout:**
- Back button (`ChevronLeft`) row
- Error banner

**`main` slot:**
- Header card (avatar, name, user ID)
- Location access request card (if pending)
- BasicInfo — profile type always `mode="view"` (editable version moved to sidebar)
- Contact, Location, Business sections
- PasswordInfo
- ChangeLog, StatusHistory

**`sidebar` slot — view mode (`sidebarView`):**
- **Actions card:** Edit profile button, Deactivate profile button (admin only), Delete permanently button (admin only)
- **Account Status card:** profile type badge, status badge, block info

**`sidebar` slot — edit/create mode (`sidebarEdit`):**
- **Actions card:** Save button, Cancel button
- **Role & Status card:** profile type Combobox (disabled if not admin), status Combobox (hidden in create mode), block reason Input (if blocked), DatePicker for suspended_until (if blocked)

AccountStatus section removed from main (its edit controls now live in the sidebar).

### Locale files (`sq/en/uk/it`)
New keys added under `admin.user_profile`:

| key | sq | en | uk | it |
|-----|----|----|----|----|
| `sections.actions` | Veprimet | Actions | Дії | Azioni |
| `sections.role_status` | Roli & Statusi | Role & Status | Роль і статус | Ruolo e stato |
| `actions.delete_permanently` | Fshi përgjithmonë | Delete permanently | Видалити назавжди | Elimina definitivamente |

## Decisions

- No dedicated admin listing-edit page exists (listing edit goes through `/{locale}/listings/{slug}/edit`). `AdminEditLayout` applied to `AdminUserProfile` only for this task. Documented here for future Epic R tasks.
- Profile type field in BasicInfo set to always `mode="view"` — avoids duplicate editable controls (sidebar has the authoritative editable version in Role & Status card).
- Dialogs (CancelConfirm, DeleteConfirm, UnsavedChanges) remain outside `AdminEditLayout` (they're portaled anyway).
