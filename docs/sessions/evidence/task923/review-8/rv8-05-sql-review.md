# Task 923 review 8 — Opus review of `proposed-hardening.sql` (2026-10-18)

File reviewed: `docs/sessions/evidence/task923/db-catalog/proposed-hardening.sql`, SHA-256
`E9ECEBBB14CA156C04D007FDC036FD39BC6511844312EA1F8DD7DE93A37F8814` (275 lines), with `proposed-hardening-rollback.sql`, `catalog.json`,
`fingerprint.json` and the application code that writes the guarded tables. **Verdict: NOT APPROVABLE as written.** The structure is sound;
the changes below are required before the owner is asked to approve a file hash. The owner has not been asked to approve this hash.

## What holds (verified)

- One transaction, `lock_timeout 10s`, a preflight that compares the md5 of the four audited function bodies, the `auth.users` trigger count
  and the absence of the new objects; the rollback restores the four audited bodies and their grants exactly as `catalog.json` records them
  and drops every new object (TRUNCATE is deliberately not re-granted).
- The guards trust `service_role`, the table owner and SECURITY DEFINER code. The writers the application needs to keep stay on that side:
  the status gateway writes through `createAdminClient()` (`src/modules/listings/actions/applyListingTransition.ts:193`, `:228`);
  `createListing` inserts `status: 'pending'`, `views_count: 0` and `expires_at = computeExpiresAt()` = 30 days
  (`src/modules/listings/domain/listingConstants.ts:4`), inside the trigger's 61-day bound.
- `users` has no INSERT and no DELETE policy (`catalog.json`: only "Users can update own profile", "Users can view own profile",
  `users_self_read`), so a session cannot insert a profile row with a chosen role today.
- Of the SECURITY DEFINER functions, only `get_listing_owner_contact`, `record_listing_view` and `record_recently_viewed` are executable by
  `authenticated`; the file narrows the last two. The new helpers are created and their EXECUTE set in the same transaction, as the
  PostgreSQL documentation requires.

## Required changes

1. **`search_path` of SECURITY DEFINER functions.** `handle_new_user`, `record_listing_view` and `record_recently_viewed` are written with
   `set search_path = public`. PostgreSQL 18, *Writing SECURITY DEFINER Functions Safely*: the temporary-table schema "is searched first by
   default, and is normally writable by anyone… write `pg_temp` as the last entry in `search_path`". Use `public, pg_temp` in all three.
2. **`caller_is_active()` (owner D25, D26).** Today it is true for `status = 'active'` or an ended suspension, and **true when the profile
   row is missing**; it ignores `deleted_at` and the session. Required: true only when the profile row exists, `deleted_at is null`, the
   status gives access (`active`, or `blocked` with an ended suspension; `inactive` blocks, D23), **and** the JWT's `session_id` names a
   row of `auth.sessions` (Supabase, *User sessions*: "You can check that the `session_id` claim in the JWT corresponds to a row in the
   `auth.sessions` table"). A missing row gives no access: `handle_new_user` creates the row in the same transaction as the Auth user, and
   the browser's own insert is already refused by RLS.
3. **Every account and every role (owner, 2026-10-18: "Це стосується всіх користувачів, а не тільки адміністратора!").** Changes 2 and 4
   apply to every signed-in account (user, agent, moderator, administrator) with no exception. The existing permissive policies that trust
   a role (`users.role = 'admin'` or `'moderator'`, `catalog.json`) are bound by the restrictive policies of change 4, so a blocked or
   deleted moderator or administrator gets nothing through them; `caller_is_admin()` must also require `caller_is_active()`, so the guards
   never trust a blocked or deleted administrator's still-valid token either.
4. **Reads too (D26: "до 0 секунд").** Section 9 adds restrictive policies only for INSERT / UPDATE / DELETE. Add a restrictive
   `for select to authenticated using ((select public.caller_is_active()))` on every table `authenticated` can read. This makes a ban,
   a block and a deletion take effect on the next database request, without relying on the token lifetime (Supabase does not recommend
   a token lifetime below 5 minutes). **Code must change in the same release:** `getBlockedError`
   (`src/lib/auth/blockCheck.ts:25-28`) reads the status through the session client and treats a missing row as "not blocked"; with the
   new policy that read returns nothing, so it must read through `createAdminClient()` and treat a missing row as no access.
5. **`users` guard on INSERT as well** (`before insert or update`): no policy allows an insert today, but the guard should not depend on
   that staying true.
6. **Header and version.** The file says "v2" while its content is the v3 of the session log (section 9); regenerate `proposed-hardening.sql`
   and `proposed-hardening-rollback.sql` from `gen-sql.cjs` with the changes above, a "v4" header, the rollback dropping every new policy
   and function, and a new SHA-256.
7. **File storage too (added 2026-10-18, corrected by the self-audit).** The section 9 loop reads only `table_schema = 'public'`
   (`proposed-hardening.sql:253`). `storage.objects` has three policies, all for the `avatars` bucket and all limited to `admin` or
   `moderator` by role alone (`design-r8/audit-r8-facts.txt`, lines 4–6; live: `design-r8/catalog-premises.txt`), so a blocked or deleted
   administrator or moderator can still write avatar files through the Storage API; other roles cannot write there at all. Add
   restrictive `select` / `insert` / `update` / `delete` policies `to authenticated` on `storage.objects` with
   `(select public.caller_is_active())`, dropped again by the rollback. The function owner `postgres` has `storage` USAGE and may read
   `auth.sessions` (`design-r8/catalog-premises.txt`).
8. **The inactivity state and the session end (owner D28, D29, 2026-10-18).** The inactivity cron marks an account with `deleted_at` and
   status `inactive` (`src/app/api/cron/inactivity/route.ts:84-86`) and `api/presence` restores it within 90 days
   (`src/app/api/presence/route.ts:9`, `:30-40`). Change 2 refuses that state like any other, so add two SECURITY DEFINER functions
   (`public, pg_temp`; EXECUTE revoked from `public, anon` and granted to `authenticated`, in the same transaction):
   `caller_access_state()` returns `active` when `caller_is_active()`, `restorable` when the caller's profile has `deleted_at` within 90
   days, status `inactive` and a live `session_id`, otherwise `none`; `restore_inactive_account()` makes exactly the writes of
   `api/presence/route.ts:35-48` for `auth.uid()` when the state is `restorable` and returns whether it did. The rollback drops both.

## Outside the database (added 2026-10-18, corrected by the self-audit)

The database cannot stop a write the server makes with the service role. Product code reads the caller's role with an exact
`.select('role')` in 28 places in 23 files (`docs/sessions/evidence/task923/design-r8/role-guard-inventory.json`), and once more in a
two-column read (`src/modules/admin/actions/index.ts:47`); 7 of the 28 read through the service role, among them `getStaffRole`
(`src/lib/auth/staff.ts:17`), the guard of the company-logo and popular-location-photo uploads. On the development project a banned
token is refused by `getUser()` but still reads and writes through the REST API (`design-r8/ban-experiment-output.txt`). The kickoff
adds one server check of the account for every role (R44) and ends a refused session on the server (R45).

## Out of this file (separate requirements of the kickoff)

- **Deletion (D25, D28).** The admin panel deletes a person with `hardDeleteUser` (`src/components/admin/AdminUserProfile.tsx:299`;
  `src/modules/admin/actions/index.ts:701`), and a person deletes themself with `deleteOwnAccount`
  (`src/modules/cabinet/actions/index.ts:248`): both archive the listings, delete the `users` row and delete the Auth user.
  `softDeleteUser` (`src/modules/admin/actions/index.ts:605`) writes only `deleted_at` and has no caller in `src`. The recorded
  fingerprint holds 24 constraints of some tables only, four of them foreign keys to a user (`design-r8/audit-r8-facts.txt`, line 3), so
  what a deletion leaves behind cannot be established from the recorded evidence; the read-only inventory of R43 comes first.
- After the revised file: the owner approves its exact SHA-256 in writing, it is applied to the approved development database, and
  `rls-harness.cjs` (extended for changes 2–8) exits 0 with clean-up verified.
