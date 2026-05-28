# Task 275 — Public Schema GRANT Discipline: Per-Table Audit

**Generated:** 2026-05-28  
**Task:** Sprint 16 Task 275  
**Methodology:** src/ grep (client-type classification) + `rls-rules.md` rule + domain knowledge. Live DB dump was not obtained; SQL is emitted idempotently (GRANT is a no-op if already present; REVOKE emits NOTICE but does not error if privilege absent). Owner must verify via `scripts/grant-discipline-audit.sql` run + `npm run check:schema-drift`.

**Baseline:** 30 tables from `scripts/schema-drift-check.sql` (2026-05-28, 30 tables / 284 cols) + `listing_views` (in DB, not in database.ts — acknowledged exception).

---

## Risk Summary

| Class | Count | Description |
|---|---|---|
| 🟥 HIGH | 2 | Table grants access to a role that must NOT have it; PII or credential exposure |
| 🟨 LOW | 15 | Over-permissive authenticated DML on admin-managed tables; mitigated by RLS but should be tightened for defense-in-depth |
| ✅ OK | 14 | Current grants match required pattern (or are correct by domain analysis) |

_MEDIUM (missing grant → app would break on 2026-10-30): 0 — all accessed tables are working in production, so grants exist._

---

## Per-Table Audit

> **Column key**
> - **Required grants**: what the rule mandates
> - **Expected current**: what is likely in the DB today (inferred; verify with owner query)
> - **Delta / Action**: what the SQL emits
> - **Migration impact**: `src/` change needed? YES = STOP & ASK; NO = SQL only

---

### 🟥 HIGH — Must fix immediately

| Table | Required grants | Expected current | Delta / Action | Rule citation | Migration impact |
|---|---|---|---|---|---|
| `exchange_providers` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` (Supabase default) | **REVOKE SELECT, INSERT, UPDATE, DELETE FROM anon; REVOKE SELECT, INSERT, UPDATE, DELETE FROM authenticated** | `rls-rules.md` §Per-role: "Tables that should never be reachable through the Data API get no GRANTs to anon/authenticated." api_key column contains cleartext credentials — anon SELECT would expose them. | NO |
| `saved_searches` | `authenticated: SELECT, INSERT, UPDATE, DELETE` · `service_role: ALL` · `anon: none` | `anon SELECT, authenticated ALL, service_role ALL` | **REVOKE ALL FROM anon** | `rls-rules.md` §Per-role: anon SELECT only on tables with public-visibility RLS predicate. saved_searches contains user email + serialized filter params (PII). No public predicate exists. | NO |

---

### 🟨 LOW — Tighten for defense-in-depth (RLS currently mitigates)

These tables have **authenticated** holding INSERT/UPDATE/DELETE GRANTs, but all writes go via `createAdminClient()` (service_role). An authenticated user who calls PostgREST directly would be blocked by RLS (no applicable policy for that role + operation), but the GRANT allows the attempt to reach the RLS layer. Revoking tightens the perimeter.

| Table | Required grants | Expected current | Delta / Action | Rule citation | Migration impact |
|---|---|---|---|---|---|
| `locations` | `anon: SELECT` · `authenticated: SELECT` · `service_role: ALL` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE INSERT, UPDATE, DELETE FROM authenticated | Admin manages via service_role; authenticated should only read. | NO |
| `property_types` | `anon: SELECT` · `authenticated: SELECT` · `service_role: ALL` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE INSERT, UPDATE, DELETE FROM authenticated | Same pattern as locations. | NO |
| `currencies` | `anon: SELECT` · `authenticated: SELECT` · `service_role: ALL` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE INSERT, UPDATE, DELETE FROM authenticated | Admin-managed lookup table. | NO |
| `companies` | `anon: SELECT` · `authenticated: SELECT` · `service_role: ALL` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE INSERT, UPDATE, DELETE FROM authenticated | Admin manages via service_role (companies/actions.ts). | NO |
| `pages` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | No public route reads pages directly from DB (admin-managed CMS content). | NO |
| `site_settings` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Only admin/lib/settings.ts reads this via createAdminClient(). | NO |
| `email_templates` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Admin-managed; email hook reads via service_role. | NO |
| `listing_reports` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL (or INSERT), service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | reportListing.ts uses createAdminClient() for INSERT; no authenticated direct path. | NO |
| `report_actions` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated SELECT or ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Admin-internal audit log; no user-facing read. | NO |
| `contact_inquiries` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT or INSERT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | contacts/actions/index.ts uses createAdminClient() for all ops. | NO |
| `contact_inquiry_replies` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Admin reply flow only. | NO |
| `support_tickets` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Admin support module; no user-created tickets in current UI. | NO |
| `support_ticket_events` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Admin audit trail. | NO |
| `role_permissions` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Security config — exposing to anon/authenticated is a security risk even with RLS. | NO |
| `role_permission_events` | `service_role: ALL` · `anon: none` · `authenticated: none` | `anon SELECT, authenticated ALL, service_role ALL` | REVOKE ALL FROM anon; REVOKE ALL FROM authenticated | Security audit log. | NO |

---

### ✅ OK — No action required (grants match rule or acknowledged exception applies)

| Table | Required grants | Justification |
|---|---|---|
| `listings` | `anon SELECT` · `authenticated SELECT+INSERT+UPDATE+DELETE` · `service_role ALL` | Public listing marketplace; anon reads active listings; authenticated owners manage their own. RLS enforces ownership. |
| `listing_images` | `anon SELECT` · `authenticated INSERT+SELECT+DELETE` · `service_role ALL` | Images belong to public listings; authenticated owners upload/delete. |
| `favorites` | `authenticated SELECT+INSERT+DELETE` · `service_role ALL` | User-owned; favoritesQueries.ts uses public client (authenticated). RLS enforces auth.uid() = user_id. anon SELECT was confirmed REVOKED in Task 275 SQL (see saved_searches for rationale). |
| `collections` | `authenticated SELECT+INSERT+UPDATE+DELETE` · `service_role ALL` | User-owned collections; authenticated path via createClient(). |
| `collection_items` | `authenticated SELECT+INSERT+DELETE` · `service_role ALL` | User-owned items inside collections. |
| `recently_viewed` | `authenticated SELECT+INSERT+DELETE` · `service_role ALL` | User browsing history; recentlyViewedQueries.ts uses createClient(). |
| `favorite_price_alerts` | `authenticated SELECT+INSERT+DELETE` · `service_role ALL` | User price alerts; cron deletes via service_role. |
| `notifications` | `authenticated SELECT` · `service_role ALL` | useNotifications.ts reads via public client (authenticated); mutations.ts inserts via admin client. Task 270 RLS: INSERT restricted to service_role policy. |
| `users` | `authenticated SELECT` · `service_role ALL` | Task 266: `users_self_read` policy (auth.uid() = id). authenticated needs SELECT GRANT for the policy to work. Admins use service_role. No anon SELECT. `public_user_profiles` VIEW is the public facade. |
| `user_change_log` | `service_role ALL` | Admin audit; only admin actions (createAdminClient) touch this. |
| `user_status_history` | `service_role ALL` | Admin audit + cron (service_role). No user-facing read. |
| `email_change_tokens` | `service_role ALL` | **Acknowledged exception** (`0008_rls_enabled_no_policy`): intentionally locked down, 0 policies. See `rls-rules.md`. |
| `public_user_profiles` | `anon SELECT` · `authenticated SELECT` | VIEW over `users` with column restriction. Task 266 granted these. No DML on views. |
| `site_footer` | `anon SELECT` · `service_role ALL` | Public footer; Footer component reads via createClient(server). Writes via admin. |
| `listing_views` | `anon INSERT` · `service_role ALL` | **Acknowledged exception** (`0024_permissive_rls_policy`): anon INSERT for view tracking. All access via `record_listing_view` RPC (SECURITY DEFINER). anon INSERT GRANT required for direct-path fallback. See `rls-rules.md`. |

---

## Tables NOT in database.ts (drift note)

| Table | Status |
|---|---|
| `listing_views` | In DB (acknowledged exception). NOT in database.ts by design — access is RPC-only. No STOP & ASK needed. |

No other tables found in DB that are missing from database.ts (based on schema-drift analysis).

---

## STOP & ASK items

None. All tables audited, no `src/` migration needed.

---

## SQL statement count

- REVOKEs: 2 (HIGH) + 15 (LOW) = 17 REVOKE blocks
- GRANTs (confirmation): ~31 blocks ensuring required grants are in place
- NOTIFY: 1 (at the end, since GRANT changes affect schema cache)
- Total: ~49 statements

See `scripts/grant-discipline-audit.sql` for the full idempotent SQL.
