# Task 198 — R.4: Profile deactivation correctness + history + hard delete

**Date:** 2026-05-24  
**Status:** ✅ DONE  
**Branch:** main

## Problem

"Deactivate profile" called `softDeleteUser()` which set `deleted_at`, causing the user to disappear from the admin table (query filters `.is('deleted_at', null)`). No mandatory reason was captured. No per-profile status history was recorded. Hard delete existed but had no dedicated UI path.

## Solution

- New `deactivateUser` action sets `status = 'inactive'` (NOT `deleted_at`) — profile stays visible.
- New `reactivateUser` action sets `status = 'active'`.
- Both actions insert a row into `user_status_history` and require a non-empty reason string.
- Status filter added to the admin users table (All / Active / Inactive / Blocked).

## No New SQL Required

`user_status_history` table was confirmed to already exist (created in Task 197 session). Only new server-side inserts are made via the actions. No ALTER TABLE or CREATE TABLE needed.

## Files Changed

### `src/modules/admin/actions/index.ts`
- Added `deactivateUser(userId, reason)`: guard `hasPermission('users.soft_delete')`, validate reason, update `status='inactive'`, insert `user_status_history` row, `revalidatePath`.
- Added `reactivateUser(userId, reason)`: same pattern, sets `status='active'`.

### `src/components/admin/AdminUserProfile.tsx`
- Added `RotateCcw` import.
- Changed import: `softDeleteUser` → `deactivateUser, reactivateUser`.
- Added `import { Textarea } from '@/components/ui/textarea'`.
- New state: `showDeactivateDialog`, `showReactivateDialog`, `deactivateReason`, `reactivateReason`, `deactivating`.
- Removed `deleteMode` state.
- New `DeactivateReasonDialog` component: Dialog with Textarea, mandatory reason, destructive confirm.
- New `ReactivateReasonDialog` component: Dialog with Textarea, mandatory reason, green confirm.
- Updated `DeleteConfirmDialog`: removed `mode` prop, hard-delete variant only.
- Added `handleDeactivate()` + `handleReactivate()` handlers.
- Sidebar: "Deactivate profile" button when `status !== 'inactive'`; "Reactivate profile" (RotateCcw, green) when `status === 'inactive'`.

### `src/app/admin/users/page.tsx`
- Added `status = sp.status ?? ''` param.
- Added `if (status) query = query.eq('status', status)`.
- Passes `activeStatus={status}` to `AdminUsersTable`.

### `src/components/admin/AdminUsersTable.tsx`
- Added `STATUS_FILTERS = ['', 'active', 'inactive', 'blocked'] as const`.
- Added `activeStatus?: string` prop.
- Added status filter button row below role filter.

### `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`
- `admin.users.filter_status_all/active/inactive/blocked`
- `admin.user_profile.actions.reactivate_profile`
- `admin.user_profile.dialogs.deactivate_title/about/reason_label/reason_placeholder/confirm/cancel`
- `admin.user_profile.dialogs.reactivate_title/about/reason_label/reason_placeholder/confirm/cancel`
- `admin.user_profile.feedback.deactivate_success/reactivate_success/reason_required`

## TypeScript
`tsc --noEmit` → 0 errors.
