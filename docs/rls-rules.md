# Database & Row Level Security (Supabase)

## RLS-Change Test Requirement (Epic RS Slice 1, Task 436, 2026-06-16)

> **Origin:** The Task 270 RLS policy change broke `reportListingAction`'s insert path with no test
> catching it — discovered only via Task 435 days later. This rule closes that class of regression.
> Referenced from `docs/rule-index.md` "DB / server action / RLS" and "Schema / migration" bundles,
> and from `docs/agent-contract.md` clause 15 (regression-coverage P0).

Any task that **changes Supabase RLS policies, DB permissions, SECURITY DEFINER functions,
service_role access, or write-path tables** MUST include ALL of the following in the same diff:

1. **Affected write-path inventory** — every `server-action insert/update/delete` touching the
   changed table (list action name + file path). A "policy looks correct" assertion is NOT enough.
2. **Positive permission test** — the legitimate actor (per role matrix below) can still perform the
   write; a vitest test asserts this AFTER the policy change is in place.
3. **Negative permission test** — an illegitimate actor (e.g. anonymous user, wrong role, another
   user's row) cannot perform the write; a test asserts the action returns a typed error or the RLS
   rejects the insert.
4. **Actor matrix** (where relevant): anonymous / authenticated user / owner / admin / service_role —
   document which actors are tested and which are N/A with a short rationale.
5. **Runtime proof** — existing server actions still work AFTER the policy change; "the SQL looks
   right" is insufficient. The positive-permission test must run against the actual action code
   (not just a raw SQL assertion), because the action can fail even when the policy is correct
   (e.g. wrong client type, missing GRANT, stale column reference).

A task that changes an RLS policy **CANNOT be marked complete or approved** without positive AND
negative test coverage verifiable by CI. The orchestrator review-checklist includes this as a
blocking item.

---

## User Roles
- `admin` — full access, can create/delete any user including moderators.
- `moderator` — manage listings, users (agent/user only), support tickets, conversations. CANNOT create/delete admins. CANNOT delete users. CANNOT change user role.
- `agent` — real estate agent, can be private person or with company.
- `user` — private person, standard access.

## Admin Profile Mutation Matrix (Task 17)

| Action | Admin | Moderator |
|---|---|---|
| View user profile | ✅ | ✅ |
| Edit user profile (name, phone, etc.) | ✅ | ✅ |
| Change user role | ✅ | ❌ (read-only field) |
| Change user status | ✅ | ✅ |
| Delete user (soft-delete) | ✅ | ❌ (button hidden + Server Action rejects) |
| Upload/change avatar | ✅ | ✅ |

## Cabinet Self-Mutation Rules

- Users can only mutate their own row (`users.id = auth.uid()`).
- `deleteOwnAccount`: requires authenticated session; soft-deletes own row + archives own listings. Cannot delete another user's account.
- `updateCabinetProfile`: user-scoped Supabase client enforces RLS.
- `uploadCabinetAvatar`: same user-scoped client.

## user_status_history Access Policy

- SELECT: admin and moderator only.
- INSERT: service-role only (via admin client in Server Actions). No direct user INSERT.

## Email-Change Token Policy

- `email_change_tokens` table: no direct user RLS access.
- All operations via service-role in Server Actions (`initiateEmailChange`, `consumeEmailChangeToken`).
- Token is valid for 24h, single-use (consumed_at set atomically with email mutation).
- Verification landing page (`/[locale]/auth/confirm-email`) uses service-role to validate and consume the token — it is an unauthenticated public route (the token IS the auth credential for the action).

## Security Rules

### Security
- Never expose Supabase service role key in client code.
- Always use RLS policies — never bypass with service role in client.
- Sanitize inputs to prevent XSS.
- Rate limit auth endpoints (Supabase handles this, verify it's enabled).
- Never store sensitive data in localStorage.
- If cookie-based auth, server actions, or custom mutation endpoints are used, ensure CSRF protections are in place; do not assume auth tokens alone are sufficient.
- Content Security Policy headers via Cloudflare.

## Auth & RLS Safety

### Auth & Session Rules
- Always check session expiry before critical actions.
- Handle `AuthSessionMissingError` globally.
- Redirect to login if session expired during user action.
- Show friendly localized message, not raw Supabase auth errors.

### Supabase RLS Checklist
After every new table or policy — verify:
- [ ] Can anonymous users read what they should NOT read?
- [ ] Can user A read/edit user B's private data?
- [ ] Can regular user access admin-only data?
- [ ] Are all insert, update, and delete policies checking `auth.uid()` and role constraints correctly?

---

## Security Definer Views (FORBIDDEN by default)

All new views in the `public` schema MUST be created with `security_invoker = on`.
`SECURITY DEFINER` views run with the **creator's** permissions, which silently bypass RLS
on the underlying tables — this is the most common path to a data-leak regression and is
flagged by Supabase Security Advisor as `0010_security_definer_view` (ERROR level).

### Required migration template

```sql
create view public.<name>
  with (security_invoker = on)
  as
    select <explicit columns>
    from <table>
    where <filter>;
```

- Always list columns explicitly. `select *` in a view is forbidden — schema drift on the
  underlying table silently expands the view's exposed surface.
- The querying user's RLS applies to the underlying tables, so the underlying tables MUST
  have RLS enabled and policies covering the access pattern the view needs.

### `SECURITY DEFINER` exception (public-facade pattern)

`SECURITY DEFINER` is allowed ONLY when ALL of the following hold, and the rationale is
written into the migration as an SQL comment immediately above `CREATE VIEW`:

1. The view exists as a deliberate **public facade** over a private table (e.g., exposing
   only public user-profile fields while the base `users` table stays locked behind RLS).
2. The view's SELECT list contains **only non-PII columns** — never `email`, `phone`,
   raw `auth.uid()` linkage to private data, password hashes, tokens, IP addresses, etc.
3. The view body contains an explicit `WHERE` filter that limits rows to those the public
   is allowed to see (e.g., `where is_public = true and deleted_at is null`).
4. GRANTs on the view are minimal — typically `grant select on <view> to anon, authenticated;`
   and never to roles that don't need it.

If any of (1)–(4) fails, the view MUST be `security_invoker = on` instead.

### Security Advisor triage

If Security Advisor reports `0010_security_definer_view`:
- **P1 fix** if the view is unintentional (default Postgres < 15 behavior, no rationale comment).
  Switch to `security_invoker = on` and verify base-table RLS covers the access pattern.
- **Documented exception** if the view matches the public-facade pattern above. Add the
  rationale comment to the migration if missing; the advisor finding stays but is acknowledged.

### Existing known finding

- `public.public_user_profiles` — flagged `0010_security_definer_view` (2026-05-28).
  Audit task required: read the view DDL, decide intentional-facade vs accidental, and
  apply the matching fix. Must close before 2026-10-30 (Supabase enforcement deadline).

---

## Public Schema GRANT Discipline (Supabase Data API)

**Effective dates** (Supabase rollout):
- 2026-05-30 — default for all new projects.
- 2026-10-30 — enforced on all existing projects, including this one.

After enforcement, a new table in `public` is invisible to `supabase-js`, PostgREST, and
GraphQL until it has explicit GRANTs. PostgREST returns error code `42501` with the missing
GRANT statement in the message — that error code means "missing GRANT," not a code bug.

### Required migration template for every new `public.*` table

```sql
create table public.<name> (
  id uuid primary key default gen_random_uuid(),
  -- ... columns ...
  created_at timestamptz not null default now()
);

alter table public.<name> enable row level security;

-- Data API exposure (tighten per role as needed):
grant select on public.<name> to anon;
grant select, insert, update, delete on public.<name> to authenticated;
grant select, insert, update, delete on public.<name> to service_role;

-- Policies (one CREATE POLICY per access pattern — never a single permissive blanket):
create policy "<name>_select_public" on public.<name>
  for select to anon
  using (<public-visibility predicate>);

create policy "<name>_select_own" on public.<name>
  for select to authenticated
  using (auth.uid() = user_id);

-- ... etc.
```

### Per-role GRANT discipline

- `anon` — `select` only, and only on tables that have a row-level public predicate.
  Never grant `insert/update/delete` to `anon`.
- `authenticated` — DML is fine but every policy MUST check `auth.uid()`.
- `service_role` — full DML, but service-role usage stays server-side (see "Security Rules"
  above). Never expose service-role key to the client.
- Tables that should never be reachable through the Data API (e.g., `email_change_tokens`,
  `user_status_history` per existing rules) get **no GRANTs to `anon`/`authenticated`**, only
  to `service_role`.

### Existing-table audit

Existing tables keep their current grants until 2026-10-30. A separate audit task
(Security Advisor → GRANT review) must run before that date to confirm every `public.*`
table that the app reads via `supabase-js` has the matching GRANTs. This audit is
independent of the migration template above, which governs all new tables from now on.

Audit run on 2026-05-28 as Task 275. See `tasks/Sprints/Sprint_16_task_275_grant_audit.md` for the per-table table and `scripts/grant-discipline-audit.sql` for the emitted SQL. Owner-applied on 2026-05-28.

---

## Function Security: `search_path` discipline

Every new SQL/PLpgsql function in `public` schema MUST set an explicit `search_path` in its
definition. Without it, Supabase Security Advisor reports `0011_function_search_path_mutable`
(WARN). Mutable `search_path` is a function-hijacking surface — a role that can create
objects in any schema on the user's `search_path` can shadow the public schema's
tables/functions and trick the function into calling the malicious version.

### Required function template

```sql
create or replace function public.<name>(<args>)
  returns <type>
  language plpgsql              -- or sql
  security <definer | invoker>
  set search_path = public, pg_temp
as $$
begin
  -- Always fully-qualify table references inside the body: public.<table>, auth.<table>
  -- Never rely on implicit search_path resolution.
  ...
end;
$$;
```

`set search_path = public, pg_temp` is the Supabase-recommended minimum:

- `public` so the function finds its own tables.
- `pg_temp` last so temp tables remain usable but cannot hijack public resolution.

If the function needs `auth.<table>` (e.g. `auth.users`), append `auth` to the search_path
list AND fully-qualify the reference inside the body (`from auth.users` not `from users`).

### Backfill rule for existing functions

When touching any existing function in `public` schema, audit its `search_path` setting:

```sql
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = '<name>';
```

If `proconfig` is NULL (no `SET search_path`), add it in the same migration via
`ALTER FUNCTION public.<name>(<args>) SET search_path = public, pg_temp;` This is
idempotent and zero-runtime-impact.

---

## RPC EXECUTE Discipline (Supabase Data API)

Supabase exposes every `public.*` function via REST as `/rest/v1/rpc/<name>`. By default
`anon` and `authenticated` can `EXECUTE` any function in `public` schema. For `SECURITY
DEFINER` functions this means a public attacker can invoke the function with the creator's
privileges — Supabase Security Advisor flags this as `0028_anon_security_definer_function_executable`
(anon) and `0029_authenticated_security_definer_function_executable` (authenticated), both WARN.

### Default EXECUTE policy by function role

| Function role | Default EXECUTE | Rationale |
|---|---|---|
| **Trigger function** (e.g. `handle_new_user`, `update_*_column`) | `REVOKE FROM anon, authenticated` | Runs only in trigger context — REST exposure is dead surface. |
| **Admin / internal function** (e.g. `admin_search_users_by_email`, `rls_auto_enable`) | `REVOKE FROM anon, authenticated` | Invoked server-side via `createAdminClient()` (service-role bypasses REVOKE). Public REST access is a real attack surface (e.g. email→userId enumeration). |
| **Cron / scheduler function** (e.g. `process_saved_search_notify`) | `REVOKE FROM anon, authenticated` | Invoked by `pg_cron` / scheduler — REST exposure is dead surface. |
| **Sensitive RPC callable by signed-in users only** (e.g. `get_listing_owner_contact`) | `REVOKE FROM anon` (keep for `authenticated`) | UI must already gate the action behind auth; REVOKE is the second line of defense against direct REST POSTs. |
| **Intentionally anon-callable RPC** (e.g. `record_listing_view`, `record_recently_viewed`) | No REVOKE | Function body MUST contain its own guards (rate limit / IP hash / listing-status filter). Add an SQL comment to the DDL documenting why anon access is intentional, then add the function to the "Acknowledged Advisor Exceptions" table below. |

`service_role` always retains EXECUTE — PostgREST bypasses GRANT/REVOKE for service-role.

### Required migration template for a non-public function

```sql
create or replace function public.<name>(<args>)
  returns <type>
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$ ... $$;

-- Default EXECUTE to anon+authenticated is implicit. Revoke it:
revoke execute on function public.<name>(<args>) from anon, authenticated;
-- service_role retains EXECUTE (bypasses GRANT/REVOKE in PostgREST).
```

For an `authenticated`-only RPC, revoke only `anon`:
```sql
revoke execute on function public.<name>(<args>) from anon;
```

### Audit query (run after any function migration)

```sql
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       r.rolname,
       has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join (values ('anon'), ('authenticated'), ('service_role')) r(rolname)
where n.nspname = 'public' and p.proname = '<name>';
```

---

## RLS INSERT Policy Discipline

Supabase Security Advisor flags every `INSERT` policy with `WITH CHECK (true)` as
`0024_permissive_rls_policy` (WARN). The flag is correct — an INSERT policy without a
predicate effectively bypasses RLS for that command, allowing any caller with the role to
insert arbitrary rows.

### Default INSERT policy template

Every new `INSERT` policy on a `public.*` table MUST have a non-trivial `WITH CHECK`
predicate that anchors the insertion to the caller's identity or role:

```sql
-- User-scoped INSERT (user inserts their own rows):
create policy "<table>_insert_own" on public.<table>
  for insert to authenticated
  with check (auth.uid() = <fk_column>);

-- Service-role-only INSERT (system-generated rows, e.g. notifications):
create policy "<table>_insert_system" on public.<table>
  for insert to service_role
  with check (true);  -- service_role policy is fine with `true` because service_role is
                      -- already a trusted boundary; do NOT grant the same policy to anon
                      -- or authenticated.
```

`WITH CHECK (true)` is acceptable ONLY when the policy is scoped to `service_role` (or
another trusted internal role). For `anon` / `authenticated`, the `WITH CHECK` MUST anchor
to `auth.uid()`, a role check, or a per-row predicate (e.g. `status = 'pending'`).

### Acceptable intentional exception

For tables where the insertion is genuinely anonymous-by-design (e.g. anonymous page-view
tracking via `listing_views`), the policy MAY use `WITH CHECK (true)`, but ALL of the
following must hold:

1. The function or API route that performs the INSERT contains its own guards (rate limit,
   IP hash, source validation).
2. The table contains NO sensitive columns the caller could fabricate (e.g. no `reporter_id`
   spoof surface).
3. A rationale comment is attached to the policy via `COMMENT ON POLICY`.
4. The exception is added to the "Acknowledged Advisor Exceptions" table below.

---

## Acknowledged Advisor Exceptions

Supabase Security Advisor findings that are INTENTIONAL design choices and will NOT be
"fixed" by switching to a default-safe configuration. Each entry MUST list: the finding
code, the object, the rationale, and the link to the task/session that established the
exception. New entries require orchestrator approval — the executor cannot unilaterally
silence an advisor finding by appending a row here.

| Code | Object | Rationale | Established by |
|---|---|---|---|
| `0010_security_definer_view` | `public.public_user_profiles` | Public-facade pattern over the narrowed `users` table. See "Security Definer Views (FORBIDDEN by default)" → exception. Switching to invoker mode would break listing-detail public-profile reads (`users_self_read` permits `auth.uid() = id` only). Condition 3 (`WHERE` filter) is met IN SPIRIT, not by a literal `WHERE deleted_at IS NULL`: tombstoned rows are intentionally included because the `deleted_at` column is the publicly-visible signal that drives the `ownerDeleted` UI branch on the listing detail page (`ListingContact.tsx:60`). The view's column restriction (no PII) is the access boundary; the row set is intentionally inclusive of tombstoned users. Adding the literal `WHERE` clause would degrade UX without security gain. Orchestrator decision Option B recorded 2026-05-28. | Task 266 (creation) / Task 268 (acknowledgement + rationale comment, no WHERE per Option B) / Task 272 (sub-rationale doc-gap closure) |
| `0008_rls_enabled_no_policy` | `public.email_change_tokens` | Intentional locked-down pattern — RLS enabled + 0 policies + service-role-only access via `initiateEmailChange` / `consumeEmailChangeToken`. See "Email-Change Token Policy" above. | Established in "Email-Change Token Policy" |
| `0014_extension_in_public` | `pg_net` | Supabase default extension placement. Moving to a dedicated `extensions` schema is non-trivial (touches provisioning + role search_path) and provides marginal hardening on this project. Deferred. | Deferred 2026-05-28 — re-evaluate at next major DB cleanup |
| `0028` / `0029` (anon + authenticated EXECUTE) | `public.record_listing_view`, `public.record_recently_viewed` | Intentionally anon-callable for view tracking and recently-viewed feature. Function bodies contain rate-limit + IP hash + listing-status guards. DDL has rationale comment. | Task 269 (rationale comment + guard inventory) |
| `0024_permissive_rls_policy` (INSERT) | `public.listing_views` ("Anyone can insert a view") | Anonymous page-view tracking is intentional. Guards live in `record_listing_view` RPC (rate limit, IP hash). DDL has rationale comment. | Task 269 (rationale comment) |

This list is the **only** acceptable way to keep an advisor finding open. If a finding
cannot be added here with a documented rationale + linked task, it MUST be fixed.