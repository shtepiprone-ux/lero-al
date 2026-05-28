# Task 270 — RLS INSERT policy tightening

**Date:** 2026-05-28  
**Type:** chore (DB / RLS hardening — runtime-affecting)  
**Executor:** Sonnet 4.6

---

## Investigation Queries for Owner (§1 — BEFORE state)

```sql
SELECT polname, polcmd, polroles::regrole[] AS roles,
       pg_get_expr(polqual, polrelid) AS using_qual,
       pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid IN (
  'public.notifications'::regclass,
  'public.listing_reports'::regclass,
  'public.companies'::regclass,
  'public.listing_views'::regclass
)
ORDER BY polrelid::regclass::text, polname;
```

Expected BEFORE: all four INSERT policies have `WITH CHECK (true)` and broad roles.

## Column Inventory Query (§2)

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'listing_reports', 'companies')
  AND (column_name ILIKE '%user%' OR column_name ILIKE '%owner%'
       OR column_name ILIKE '%reporter%' OR column_name ILIKE '%recipient%')
ORDER BY table_name, column_name;
```

From `src/types/database.ts` type inference:
- `notifications`: `user_id string` (recipient FK) ✓
- `listing_reports`: `user_id string | null` (reporter FK) ✓
- `companies`: NO `user_id`, `owner_id`, or `reporter_id` column — only `id, name, logo_url, created_at`

---

## Insert Call-Site Analysis (§3)

### `notifications`

| File | Line | Client | Insert columns |
|------|------|--------|----------------|
| `src/modules/notifications/lib/mutations.ts:23` | `createNotification()` | `createAdminClient()` ← **service-role** | `user_id, type, title, body, link` |

Comment on file: "Creation (service-role — bypasses RLS)". Confirmed: all notification inserts go through service-role.

**No session-client insert path exists.** ✅ No STOP & ASK.

### `listing_reports`

| File | Line | Client | Insert columns |
|------|------|--------|----------------|
| `src/modules/listings/actions/reportListing.ts:50` | `reportListingAction()` | `createClient()` ← **session/authenticated** | `listing_id, user_id: user.id, reason, comment, status` |

The insert passes `user_id: user.id` where `user = await getUser()` (authenticated user, guarded by `if (!user) return { error: 'unauthorized' }`). The FK column for the CHECK predicate is `user_id`.

**No service-role insert path exists.** ✅ No STOP & ASK.

### `companies`

| File | Line | Client | Insert columns |
|------|------|--------|----------------|
| `src/modules/companies/actions.ts:29` | `createCompanyAction()` | `createAdminClient()` ← **service-role** | `{ name: trimmed }` only |

Comment on function: "Uses the service-role client so it can be called during agent registration (before the user has a session)." The `companies` table has NO `owner_id` or `user_id` column. The insert via service-role bypasses RLS entirely.

**No `owner_id`/`user_id` FK column exists** → `auth.uid() = <owner_fk>` predicate is not possible. But this is NOT a STOP & ASK because the insert is via **service-role**, making `TO service_role WITH CHECK (true)` the correct decision regardless.

✅ No STOP & ASK — service-role is the correct policy scope.

### `listing_views`

No `from('listing_views').insert(...)` in `src/` — confirmed 0 hits.  
All inserts go via `record_listing_view` SECURITY DEFINER RPC (Task 269 confirmed guards).  
Policy kept unchanged; COMMENT ON POLICY added.

---

## Decision Matrix (§4)

| Table | Insert call-sites | Client | FK column for predicate | Decision |
|-------|-----------------|--------|-------------------------|---------|
| `notifications` | `mutations.ts:23` | service-role (`createAdminClient`) | `user_id` = recipient (not caller) | `TO service_role WITH CHECK (true)` |
| `listing_reports` | `reportListing.ts:50` | authenticated (`createClient`) | `user_id` = `auth.uid()` | `TO authenticated WITH CHECK (auth.uid() = user_id)` |
| `companies` | `companies/actions.ts:29` | service-role (`createAdminClient`) | ❌ no FK column | `TO service_role WITH CHECK (true)` |
| `listing_views` | RPC only (record_listing_view SECURITY DEFINER) | n/a | n/a | KEEP unchanged + COMMENT ON POLICY |

---

## Owner-Provided Investigation Results (2026-05-28)

### §1 BEFORE — Policy inventory

Key findings:
- `listing_reports_insert_own` already EXISTS with `with_check: "(user_id = auth.uid())"` — created before this session. `"Users can create reports"` (WITH CHECK true) also still present.
- `"System can insert notifications"` (WITH CHECK true, roles `-`) — present, needs replacement.
- `"companies_authenticated_insert"` (WITH CHECK true, roles `{authenticated}`) — present, needs replacement.
- `"Anyone can insert a view"` — present, unchanged.

### §2 — Column inventory

Owner-run result:
- `listing_reports.user_id` uuid, nullable ✓ (FK column confirmed)
- `notifications.user_id` uuid, NOT NULL ✓
- `companies` — no `user_id`/`owner_id` column ✓ (confirmed our analysis)

### Migration Error

Migration failed: `ERROR: 42710: policy "listing_reports_insert_own" for table "listing_reports" already exists`

Root cause: `listing_reports_insert_own` was already created in a prior partial run. The `DROP POLICY IF EXISTS "Users can create reports"` ran, then the CREATE hit the duplicate. Because Supabase SQL Editor runs in a single transaction, the entire migration was rolled back — all tables returned to BEFORE state.

Fix: Add `DROP POLICY IF EXISTS listing_reports_insert_own ON public.listing_reports;` before the CREATE. Applied to all new policies for full idempotency.

---

## ⚠️ CORRECTED Idempotent SQL Migration (v2 — fully idempotent)

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- Task 270 v2: RLS INSERT policy tightening (fully idempotent)
-- 2026-05-28 — DROP IF EXISTS on both old and new policy names before CREATE
-- ══════════════════════════════════════════════════════════════════════════════

-- ── (a) notifications — system-only inserts, service-role ─────────────────────

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_service_role ON public.notifications;

CREATE POLICY notifications_insert_service_role
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON POLICY notifications_insert_service_role ON public.notifications IS
  'System-generated notifications only via createAdminClient() Server Actions.
   No authenticated-client insert path exists in src/. TO service_role closes
   the Advisory 0024 finding without a user_id predicate (service_role IS the
   trust boundary). Task 270 (2026-05-28).';

-- ── (b) listing_reports — authenticated reporter, anchored to auth.uid() ──────

DROP POLICY IF EXISTS "Users can create reports" ON public.listing_reports;
DROP POLICY IF EXISTS listing_reports_insert_own ON public.listing_reports;

CREATE POLICY listing_reports_insert_own
  ON public.listing_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY listing_reports_insert_own ON public.listing_reports IS
  'Authenticated users may report listings. WITH CHECK anchors user_id to
   auth.uid() — prevents impersonation (users cannot file reports as other users).
   Call-site: reportListingAction in reportListing.ts (createClient session,
   user_id set to user.id). Task 270 (2026-05-28).';

-- ── (c) companies — service-role only (no owner FK column exists) ─────────────

DROP POLICY IF EXISTS "companies_authenticated_insert" ON public.companies;
DROP POLICY IF EXISTS companies_insert_service_role ON public.companies;

CREATE POLICY companies_insert_service_role
  ON public.companies
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON POLICY companies_insert_service_role ON public.companies IS
  'Company creation goes through createAdminClient() (service-role) to support
   pre-session agent registration. No owner_id/user_id column in companies table.
   Service-role IS the trust boundary; TO service_role is the correct scope.
   Task 270 (2026-05-28).';

-- ── (d) listing_views — intentional exception; COMMENT only, no predicate change

COMMENT ON POLICY "Anyone can insert a view" ON public.listing_views IS
  'Intentional anon-callable INSERT policy for anonymous page-view tracking.
   Actual inserts go through the record_listing_view SECURITY DEFINER RPC
   (guards: 24h dedup window, ip_hash dedup, status filter on listings join).
   This policy enables the RPC to INSERT inside its SECURITY DEFINER context.
   Acknowledged Advisor exception: docs/rls-rules.md → Acknowledged Advisor
   Exceptions. Task 269 acknowledgement + Task 270 rationale (2026-05-28).';

-- ── Reload PostgREST schema ───────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
```

---

## Migration v2 Applied + AFTER-State Verified (owner, 2026-05-28)

Owner ran Task 270 v2 migration. Result: **Success. No rows returned.**

**AFTER-state verification (INSERT policies only) — ✅ ALL CORRECT:**

| Table | Policy | Roles | WITH CHECK | Status |
|-------|--------|-------|------------|--------|
| `companies` | `companies_insert_service_role` | `{service_role}` | `true` | ✅ |
| `listing_reports` | `listing_reports_insert_own` | `{authenticated}` | `(auth.uid() = user_id)` | ✅ |
| `listing_views` | `Anyone can insert a view` | `{-}` | `true` (unchanged) | ✅ |
| `notifications` | `notifications_insert_service_role` | `{service_role}` | `true` | ✅ |

Old policies `"System can insert notifications"`, `"Users can create reports"`, `"companies_authenticated_insert"` — absent ✅

**Task 270 FULLY COMPLETE ✅**

---

## AFTER-State Verification Query (§5 — owner to run)

```sql
SELECT polname, polcmd, polroles::regrole[] AS roles,
       pg_get_expr(polqual, polrelid) AS using_qual,
       pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid IN (
  'public.notifications'::regclass,
  'public.listing_reports'::regclass,
  'public.companies'::regclass,
  'public.listing_views'::regclass
)
ORDER BY polrelid::regclass::text, polname;
```

Expected AFTER:

| Table | Policy name | Roles | WITH CHECK |
|-------|-------------|-------|------------|
| `companies` | `companies_insert_service_role` | `{service_role}` | `true` |
| `listing_reports` | `listing_reports_insert_own` | `{authenticated}` | `(auth.uid() = user_id)` |
| `listing_views` | `Anyone can insert a view` | (unchanged) | `true` (+ COMMENT) |
| `notifications` | `notifications_insert_service_role` | `{service_role}` | `true` |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `docs/sessions/2026-05-28-task-270-rls-insert-tightening.md` | New session log | Task 264 contract + Task 270 investigation |
| `docs/backlog.md` | Updated Last Session + Next Immediate Tasks | Task 264 contract |

No `src/` code changed. No locale keys changed. No UI changes.

---

## AC Self-Audit

| AC | Status |
|----|--------|
| All four policies inventoried (BEFORE state in session log) | ✅ investigation query provided |
| Column inventory done for three tables | ✅ from types/database.ts + code analysis |
| Every src/ insert call-site identified | ✅ 3 tables × 1 call-site each; listing_views = RPC only |
| Per-table decision matrix completed and signed off | ✅ |
| Idempotent SQL emitted | ✅ covering all four blocks (a–d) |
| AFTER-state verification query included | ✅ |
| No misaligned call-sites found | ✅ (service-role paths confirmed; authenticated path anchored to auth.uid()) |
| "Files Changed" table per Task 264 | ✅ |
| 0 new lint/typecheck errors | ✅ (no src/ changes) |
| backlog.md updated | ✅ |

---

## Self-Validation (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors (no src/ changes) |
| Build | N/A — SQL-only task |
| Locale parity ×4 | N/A — no user-facing text changes |
| 7 breakpoints | N/A — no UI changes |
| Runtime impact | ✅ Zero expected — service-role INSERT paths (notifications, companies) continue via createAdminClient() which bypasses RLS; authenticated path (listing_reports) already sets user_id = auth.uid() |
| Scope clean | ✅ No src/ changes; no SELECT/UPDATE/DELETE policies touched |
| **Self-validation verdict** | `tsc=0 errors · build=N/A (SQL-only) · AC table=all green · runtime/locale/breakpoints=N/A (no UI) · scope=clean` |
