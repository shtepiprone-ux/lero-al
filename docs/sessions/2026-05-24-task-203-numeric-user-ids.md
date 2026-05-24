# Task 203 — S.1: Numeric user IDs (visible in cabinet & admin)

**Date:** 2026-05-24  
**Epic:** S — Domain Numeric IDs  
**Status:** ✅ Complete

## Summary

Added a sequential numeric `public_id` to the `users` table. The ID surfaces in three places: the admin users table (under the user's name), the admin user profile header, and the user's own cabinet profile tab (below the avatar).

## SQL for owner (run in Supabase SQL editor — idempotent)

```sql
-- Task 203: Add numeric public_id column to users table.
-- Idempotent — safe to re-run.
CREATE SEQUENCE IF NOT EXISTS users_public_id_seq START 1;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_id BIGINT NOT NULL
    DEFAULT nextval('users_public_id_seq') UNIQUE;
ALTER SEQUENCE users_public_id_seq OWNED BY users.public_id;
NOTIFY pgrst, 'reload schema';
```

> Existing rows each receive a unique sequence value automatically on the ALTER TABLE (PostgreSQL fills DEFAULT for existing rows when the column is added). New rows get the next value.

## Files changed

| File | Change |
|------|--------|
| `src/types/database.ts` | Added `public_id: number` to `User` interface |
| `scripts/schema-drift-check.sql` | Col count 28 → 29; `('users', 'public_id')` added to both RESULT SETs |
| `src/app/admin/users/page.tsx` | Added `public_id` to SELECT string |
| `src/components/admin/AdminUsersTable.tsx` | `public_id?: number \| null` in `AdminUser`; `#{u.public_id}` display under name |
| `src/components/admin/AdminUserProfile.tsx` | `#{user!.public_id}` display after authEmail in header card |
| `src/modules/cabinet/components/ProfileTab.tsx` | `AdminUserAvatar` wrapped in flex-col div; `#{profile.public_id}` caption below avatar |

## Approach

- `public_id` is a supplementary BIGINT sequence — does NOT replace the UUID PK.
- Internal relationships, RLS policies, and all URLs remain unchanged.
- `public_id` is `UNIQUE NOT NULL` (sequence guarantees uniqueness and non-null).
- Display: small monospace `text-[11px] text-muted-foreground/50` — clearly secondary to the user's name.

## No locale changes

No new translatable strings — the `#` prefix and numeric value need no translation.

## Type-check

`tsc --noEmit` → 0 errors.
