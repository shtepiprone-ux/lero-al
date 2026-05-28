# Session Log — Task 275: Public Schema GRANT Discipline existing-table audit

**Date:** 2026-05-28  
**Sprint:** 16  
**Executor:** Sonnet 4.6  
**Type:** audit + SQL emission (no src/ change)

---

## Audit Methodology

**Baseline table list:** `scripts/schema-drift-check.sql` (generated 2026-05-28) → 30 tables, 284 cols. One additional table (`listing_views`) is in the DB but not in database.ts — it has an acknowledged exception in `rls-rules.md` and is included in the audit.

**Live DB grant dump:** NOT obtained (Cowork sandbox cannot reach Supabase DB). This is a known limitation per the Task 275 negative-flow rule. The audit proceeds using:
1. **src/ grep** — `grep -rn "\.from("` across all `.ts/.tsx` files to classify each table as accessed via `createClient()` (public/authenticated) vs `createAdminClient()` (service_role).
2. **`rls-rules.md`** §Per-role GRANT discipline — defines the required state.
3. **Domain knowledge** — public-visibility predicates (active listings visible to anon; user-owned data not visible to anon; admin-internal tables not visible at all).
4. **Recent session logs** — Task 266 (users RLS), Task 269 (RPC REVOKEs), Task 270 (INSERT policy tightening), Task 271 (no DB changes), Task 272 (no DB changes).

**Idempotency guarantee:** Postgres `REVOKE` emits NOTICE (not ERROR) for non-existent privileges. `GRANT` is a no-op if the privilege already exists. The SQL is safe to run on any current grant state.

**Rule applied:** `rls-rules.md` §Per-role GRANT discipline:
- `anon` → SELECT only, only on tables with public-visibility RLS predicate.
- `authenticated` → DML fine, but only where the app actually uses it (public client path).
- `service_role` → full DML; trusted server-side boundary.
- Tables never reachable via Data API (PII-only, admin-internal, security config) → NO grants to anon/authenticated.

---

## Summary Statistics

| Metric | Value |
|---|---|
| Tables audited | 31 (30 in database.ts + listing_views) |
| 🟥 HIGH | 2 |
| 🟨 LOW | 15 |
| ✅ OK | 14 |
| 🟧 MEDIUM | 0 |
| REVOKE statements | 17 blocks |
| GRANT statements | ~33 blocks |
| NOTIFY statements | 1 |

---

## Top Findings — HIGH Risk

### 1. `exchange_providers` — API credentials exposed
- **Risk:** `api_key` column stores cleartext third-party API credentials. If `anon` or `authenticated` has SELECT GRANT (likely default), any unauthenticated request can read the API key via PostgREST.
- **Action:** `REVOKE SELECT, INSERT, UPDATE, DELETE FROM anon; REVOKE ... FROM authenticated`
- **Rule:** `rls-rules.md` §Per-role: tables with sensitive internal data get no GRANTs to anon/authenticated.

### 2. `saved_searches` — PII exposure
- **Risk:** `saved_searches` stores serialized filter params + user email reference. If `anon` has SELECT, unauthenticated requests can read saved search data.
- **Action:** `REVOKE SELECT, INSERT, UPDATE, DELETE FROM anon`
- **Rule:** anon SELECT only permitted with public-visibility predicate; saved_searches has none.

---

## LOW Risk Summary (15 tables)

Admin-managed lookup and operational tables that likely have `authenticated ALL` from Supabase defaults, but all writes go via `createAdminClient()` (service_role). RLS mitigates (no applicable policy for authenticated DML), but defense-in-depth says REVOKE excess.

Tables: `locations`, `property_types`, `currencies`, `companies`, `pages`, `site_settings`, `email_templates`, `listing_reports`, `report_actions`, `contact_inquiries`, `contact_inquiry_replies`, `support_tickets`, `support_ticket_events`, `role_permissions`, `role_permission_events`.

Action: `REVOKE INSERT, UPDATE, DELETE FROM authenticated` (or `REVOKE ALL FROM anon + authenticated` for fully-internal tables).

---

## Investigation Query Outputs

> **Note:** Live DB query outputs were NOT pasted into this session log because the owner has not yet run the three queries. The audit is based on src/ analysis and domain knowledge (see Methodology above). To verify the actual current grant state, the owner should run:
>
> ```sql
> -- Query 1: table list
> select tablename from pg_tables
> where schemaname = 'public' order by tablename;
>
> -- Query 2: current grants
> select grantee, table_name, privilege_type
> from information_schema.role_table_grants
> where table_schema = 'public'
>   and grantee in ('anon', 'authenticated', 'service_role')
> order by table_name, grantee, privilege_type;
>
> -- Query 3: RLS policies
> select tablename, policyname, roles, cmd
> from pg_policies
> where schemaname = 'public'
> order by tablename, policyname;
> ```
>
> The SQL in `scripts/grant-discipline-audit.sql` is idempotent regardless of what the queries show.

---

## Cross-reference

Full per-table audit: `tasks/Sprints/Sprint_16_task_275_grant_audit.md`  
SQL: `scripts/grant-discipline-audit.sql`

---

## Owner Action

1. Open Supabase SQL Editor.
2. Paste and run `scripts/grant-discipline-audit.sql`.
3. Review any NOTICE messages (expected for non-existent privileges being revoked — not errors).
4. Run `npm run check:schema-drift` → confirm 0 rows (schema structure unchanged; GRANTs don't affect column drift).
5. Update `docs/rls-rules.md` §Existing-table audit: fill in `<DATE>` with today's date.

---

## AC Self-audit

| AC | Status |
|---|---|
| `tasks/Sprints/Sprint_16_task_275_grant_audit.md` exists with one row per public.* table | ✅ |
| `scripts/grant-discipline-audit.sql` exists with REVOKE→GRANT order, idempotent, comments | ✅ |
| Session log exists with methodology, stats, top findings, owner action, Files Changed | ✅ |
| `docs/rls-rules.md` §Existing-table audit has audit-date note + cross-references | ✅ |
| `docs/backlog.md` updated: Last task number 275, Session Archive row | ✅ |
| Stats consistency (audit doc rows = SQL statement count in session log) | ✅ (17 REVOKE + ~33 GRANT + 1 NOTIFY) |
| NO `src/` files touched | ✅ |
| NO SQL execution (emission only) | ✅ |
| STOP & ASK items: 0 | ✅ |

---

## Files Changed

| File | Change |
|---|---|
| `tasks/Sprints/Sprint_16_task_275_grant_audit.md` | NEW — per-table audit (31 tables, HIGH/LOW/OK classification) |
| `scripts/grant-discipline-audit.sql` | NEW — idempotent REVOKE+GRANT SQL (17 revoke blocks, 33 grant blocks, 1 NOTIFY) |
| `docs/rls-rules.md` | UPDATED — §Existing-table audit: added audit-date sentence + cross-references |
| `docs/sessions/2026-05-28-task-275-grant-discipline-audit.md` | NEW — this file |
| `docs/backlog.md` | UPDATED — Last task number: 275; Last Session note; Session Archive row |

---

## Self-validation verdict

`Self-validation: tsc=N/A (no src/) · build=N/A (no src/) · AC table=all green · runtime=N/A (SQL emission only) · scope=clean`
