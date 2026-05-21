# Session Archive: Epic C.5 — Account Blocking / Suspension Tools — 2026-05-21

## Task 126 — Account blocking / suspension tools

**Status:** COMPLETE (code shipped; owner must run DB migration)

---

## DB Migration SQL (owner runs in Supabase Dashboard → SQL Editor)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
```

---

## What was already done (no change needed)

- Status dropdown (active/blocked/inactive) + `block_reason` input in AdminUserProfile
- `block_reason` required when status = 'blocked' (zod refine)
- Status history logged in `updateUserProfileFull` when status changes
- Status history displayed in admin profile (section.status_history)
- Status badge (active=success, blocked=destructive, inactive=warning)
- ListingContact: `ownerDeleted` already handled (Task 84 regression OK — no change needed)

---

## What was missing and is now implemented

### 1. `suspended_until` — temporary suspension with expiry date

**Logic:** `status = 'blocked'` + `suspended_until = DATE` → temporary suspension; `suspended_until = NULL` → permanent block.

Admin sets the date via a DatePicker that appears in the Account Status section when status = 'blocked'. Leaving it empty = permanent block.

### 2. Server-side enforcement in `createListing`

Blocked users (status = 'blocked') cannot create new listings. The action queries the user's profile before any DB write and returns `{ error: 'account_blocked' }` if blocked.

### 3. Admin UI — `suspended_until` DatePicker

Shown in the Account Status section when `status = 'blocked'`. Status badge view shows "suspended until DATE" when `suspended_until` is set.

---

## Files Modified

### `src/types/database.ts`
`User.suspended_until: string | null` added.

### `src/modules/admin/actions/index.ts`
`updateUserProfileFull`: accepts `suspendedUntil?: string | null`; sets `suspended_until` in DB (cleared when status ≠ 'blocked').

### `src/modules/listings/actions/createListing.ts`
Checks `user.status === 'blocked'` before creating a listing. Returns `{ error: 'account_blocked' }`.

### `src/components/admin/AdminUserProfile.tsx`
- DatePicker import added
- `suspendedUntil` added to FormValues, zod schema, defaultValues
- `suspended_until` read from user on form init
- DatePicker shown in Account Status section when blocking
- Status badge view shows suspension date

### `messages/*.json` (sq/en/uk/it)
`admin.user_profile.fields`: `suspended_until`, `block_type`, `block_permanent`, `block_temporary`, `suspended_badge`
`listing`: `error_account_blocked`

---

## RLS enforcement (documented, not yet applied)

To enforce at DB level that blocked users cannot INSERT into listings, the following RLS policy should be added:

```sql
-- Prevent blocked/inactive users from inserting listings
CREATE POLICY "listings_insert_active_users_only" ON listings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.status = 'active'
    )
  );
```

This is complementary to the server-side guard in `createListing.ts`.

---

## Validation

- lint: 0 errors (1 pre-existing warning in index.ts — unrelated)
- typecheck: 0 new errors
- governance:localization: PASS
