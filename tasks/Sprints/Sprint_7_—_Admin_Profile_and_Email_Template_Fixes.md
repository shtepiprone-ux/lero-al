# Sprint 7 — Admin Profile & Email-Template Fixes

> Opened 2026-05-22 by the Opus 4.7 orchestrator after smoke-testing the admin user-profile + email
> templates. Three issues surfaced; one is an owner DB step, two are scoped Sonnet tasks.

## Issues & disposition

| # | Issue | Root cause | Fix owner |
|---|---|---|---|
| A | Profile save → toast "Помилка збереження профілю" | `users.suspended_until` column missing in **live DB** (PGRST204); code + types are correct | **Owner** — run migration in Supabase (below) |
| B (Task 170) | Raw key `admin.user_profile.validation.error_phone_invalid` shown on save | `admin.user_profile.validation` has `phone_format` but is missing `error_phone_invalid` + `error_phone_no_country_code` (they exist only in another namespace) | Sonnet |
| C (Task 171) | Moderator sees Edit + Delete on email templates | UI never gates actions by role. Server-side delete IS admin-only (`assertAdmin`, Task 161) so the boundary holds — but the Delete button must be hidden for non-admins | Sonnet |

## Issue A — owner migration (not a code change)

The UPDATE in `updateUserProfileFull` writes `suspended_until` (+ `block_reason`, `company_logo_url`);
the live `users` table is missing at least `suspended_until`. Run in Supabase SQL Editor:

```sql
-- diagnose which written columns are actually missing
select v.col, (ic.column_name is not null) as exists_in_db
from (values ('suspended_until'),('block_reason'),('company_logo_url'),('user_type'),('year_started')) v(col)
left join information_schema.columns ic
  on ic.table_schema='public' and ic.table_name='users' and ic.column_name=v.col
order by exists_in_db, v.col;

-- add the missing ones (idempotent), then reload PostgREST cache
alter table public.users
  add column if not exists suspended_until  timestamptz,
  add column if not exists block_reason     text,
  add column if not exists company_logo_url text;
notify pgrst, 'reload schema';
```

> Systemic note: `types/database.ts` and the live schema drifted. Consider a tracked-migrations
> process so this is caught at deploy time rather than at runtime.

## Out of scope

The deeper question of *why* a stored phone is judged invalid on edit (possible rehydration bug) —
investigate only if a known-valid phone is still rejected after Task 170 localizes the message.

## Orchestrator verdict — 2026-05-22 — ✅ APPROVED (Tasks 170 & 171), Sprint CLOSED

Reviewed commit `2ca144c2a` (object-store blobs, not the working tree).

- **Task 170**: `error_phone_invalid` + `error_phone_no_country_code` present in
  `admin.user_profile.validation` in **all 4** catalogs with verbatim values; `phone_format`
  preserved; all 4 JSON parse. `AdminUserCreate` uses the **same** `admin.user_profile` namespace
  (line 102) → automatically covered. Locale parity holds.
- **Task 171**: `email-templates/page.tsx` resolves the viewer role via the canonical pattern
  (`getUser()` → `users.role` → `isAdmin`) and passes `isAdmin` to the manager.
  `AdminEmailTemplatesManager` now takes `isAdmin` and wraps the Delete (Trash2) button in
  `{isAdmin && …}`; Edit (Pencil) stays for both roles (matches RLS matrix: UPDATE = admin+moderator,
  DELETE = admin). Server `assertAdmin()` untouched (defense-in-depth intact). Only caller updated,
  so no type gap.
- **Issue A**: resolved by the `suspended_until` migration (owner). Verify a profile save now succeeds.

No governance anti-patterns. Both approved; no follow-ups.
