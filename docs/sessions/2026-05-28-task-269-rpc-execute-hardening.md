# Task 269 — RPC EXECUTE hardening + search_path backfill + avatars bucket policy

**Date:** 2026-05-28  
**Type:** chore (DB / RLS hardening)  
**Executor:** Sonnet 4.6

---

## Investigation Queries (owner to run in Supabase SQL Editor)

### §1 — Function body + security setting + config

```sql
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS is_security_definer,
       p.proconfig AS config,
       pg_get_functiondef(p.oid) AS body
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'admin_search_users_by_email',
    'get_listing_owner_contact',
    'handle_new_user',
    'handle_new_user_notifications',
    'process_saved_search_notify',
    'rls_auto_enable',
    'record_listing_view',
    'record_recently_viewed',
    'update_updated_at',
    'update_listing_search_vector',
    'update_updated_at_column'
  )
ORDER BY p.proname;
```

Owner must verify `record_listing_view` and `record_recently_viewed` function bodies contain guards (rate limit / IP hash / status filter / dedup window). If guards are absent, STOP — do not apply this migration; file a follow-up.

### §2 — BEFORE EXECUTE matrix

```sql
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       r.rolname,
       has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(rolname)
WHERE n.nspname = 'public'
  AND p.proname IN (
    'admin_search_users_by_email','get_listing_owner_contact','handle_new_user',
    'handle_new_user_notifications','process_saved_search_notify','rls_auto_enable',
    'record_listing_view','record_recently_viewed'
  )
ORDER BY p.proname, r.rolname;
```

Expected BEFORE (all functions default PUBLIC grant):

| Function | anon | auth | svc |
|----------|------|------|-----|
| admin_search_users_by_email | true | true | true |
| get_listing_owner_contact | false* | true* | true | ← already revoked by Task 266 |
| handle_new_user | true | true | true |
| handle_new_user_notifications | true | true | true |
| process_saved_search_notify | true | true | true |
| rls_auto_enable | true | true | true |
| record_listing_view | true | true | true |
| record_recently_viewed | true | true | true |

### §3 — Avatars bucket policies

```sql
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS qual,
       pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
  AND polname ILIKE '%avatar%';
```

Expected: `"Public read avatars"` SELECT policy (to be dropped).

---

## src/ Grep Analysis (§4)

```
grep "rpc('admin_search_users_by_email'" src/
→ src/app/admin/listings/page.tsx:42  ← createAdminClient() (line 27) ✅ service-role

grep "rpc('handle_new_user'" src/
→ (no hits) ✅ trigger only

grep "rpc('process_saved_search_notify'" src/
→ (no hits) ✅ cron only (pg_cron uses service-role)

grep "rpc('rls_auto_enable'" src/
→ (no hits) ✅ admin utility only

grep "rpc('get_listing_owner_contact'" src/
→ src/modules/listings/actions/getListingOwnerContact.ts ← createClient() (session/authenticated) ✅

grep "rpc('record_listing_view'" src/
→ src/app/api/listings/[slug]/view/route.ts:60 ← createAdminClient() (line 23) ✅ service-role

grep "rpc('record_recently_viewed'" src/
→ src/modules/listings/actions/recentlyViewedActions.ts:26 ← createClient() (session); called ONLY inside `if (user)` block (line 24) ✅ authenticated callers only

grep "Public read avatars" src/
→ (no hits) ✅ no src/ code references the policy name
```

**No STOP & ASK conditions found.** All call-sites match the expected client types. Migration is safe to apply.

**Notes:**
- `record_listing_view` is called via service-role (`createAdminClient()`). Preserving anon EXECUTE is per kickoff spec (forward-looking flexibility + Acknowledged Advisor Exception).
- `record_recently_viewed` is called via session client ONLY when authenticated (`if (user)`). Preserving anon EXECUTE is per kickoff spec.

---

## Owner-Provided Investigation Results (2026-05-28)

### §1 — Function bodies + security config

Key findings from owner-run query:

| Function | security_definer | search_path (config) | Notes |
|----------|-----------------|----------------------|-------|
| admin_search_users_by_email | ✅ true | `search_path=auth, public` | Already has explicit search_path |
| get_listing_owner_contact | ✅ true | `search_path=public, pg_temp` | Task 266 — correct |
| handle_new_user | ✅ true | `search_path=public` | Already has explicit search_path |
| handle_new_user_notifications | ✅ true | `search_path=public` | Already has explicit search_path |
| process_saved_search_notify | ✅ true | `search_path=public` | Already has explicit search_path |
| record_listing_view | ✅ true | `search_path=public` | Guards: 24h dedup + ip_hash + listings status filter ✓ |
| record_recently_viewed | ✅ true | `search_path=public` | Guards: `auth.uid() IS NULL → RAISE EXCEPTION 'unauthenticated'` ✓ |
| rls_auto_enable | ✅ true | `search_path=pg_catalog` | Already has explicit search_path |
| **update_listing_search_vector** | ❌ false | **null** ← needs ALTER | 0011 target |
| **update_updated_at** | ❌ false | **null** ← needs ALTER | 0011 target |
| **update_updated_at_column** | ❌ false | **null** ← needs ALTER | 0011 target |

In-function guards confirmed:
- `record_listing_view`: 24h dedup window via `listing_views` check + ip_hash + user_id ✓
- `record_recently_viewed`: `v_user_id := auth.uid(); IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'` ✓

### §2 — BEFORE EXECUTE matrix

All functions had anon=true, auth=true, svc=true before migration (default PUBLIC grant).

### §3 — Avatars bucket policies

- `"Public read avatars"` SELECT policy: `bucket_id = 'avatars'` ✓ (target for DROP)
- Admin/moderator upload/update/delete policies present (not affected by this task)

### Migration Applied — PARTIAL SUCCESS

Owner applied full Task 269 SQL migration. Result: **Success. No rows returned.**

### AFTER-State Verification — CRITICAL FINDING

Owner ran verification query (§6). Results show:

| Function | anon AFTER | auth AFTER | svc AFTER | Expected | Status |
|----------|-----------|-----------|---------|----------|--------|
| admin_search_users_by_email | **true** | **true** | true | false / false / true | ❌ MISMATCH |
| get_listing_owner_contact | **false** | true | true | false / true / true | ✅ CORRECT |
| handle_new_user | **true** | **true** | true | false / false / true | ❌ MISMATCH |
| handle_new_user_notifications | **true** | **true** | true | false / false / true | ❌ MISMATCH |
| process_saved_search_notify | **true** | **true** | true | false / false / true | ❌ MISMATCH |
| record_listing_view | true | true | true | true / true / true | ✅ CORRECT (preserved) |
| record_recently_viewed | true | true | true | true / true / true | ✅ CORRECT (preserved) |
| rls_auto_enable | **true** | **true** | true | false / false / true | ❌ MISMATCH |

**Corrected SQL applied (owner, 2026-05-28):** Owner ran the `REVOKE FROM PUBLIC` + `GRANT TO service_role` block for all 5 functions. Result: **Success. No rows returned.**

**AFTER-state verification (owner, 2026-05-28) — ✅ ALL CORRECT:**

| Function | anon | auth | svc | Expected | Status |
|----------|------|------|-----|----------|--------|
| admin_search_users_by_email | false | false | true | false/false/true | ✅ |
| get_listing_owner_contact | false | true | true | false/true/true | ✅ |
| handle_new_user | false | false | true | false/false/true | ✅ |
| handle_new_user_notifications | false | false | true | false/false/true | ✅ |
| process_saved_search_notify | false | false | true | false/false/true | ✅ |
| rls_auto_enable | false | false | true | false/false/true | ✅ |
| record_listing_view | true | true | true | true/true/true (preserved) | ✅ |
| record_recently_viewed | true | true | true | true/true/true (preserved) | ✅ |

**Task 269 FULLY COMPLETE ✅**

**Root cause of mismatches:** The original SQL used `REVOKE FROM anon, authenticated` which only removes EXPLICIT role grants. These functions have EXECUTE via the PostgreSQL `PUBLIC` grant (default for all functions). Revoking from individual roles does NOT revoke the PUBLIC grant — `has_function_privilege` still returns TRUE via PUBLIC.

**`get_listing_owner_contact` is CORRECT** because Task 266 already ran `REVOKE FROM public` + `GRANT TO authenticated` — the PUBLIC grant was already removed. The Task 269 `REVOKE FROM anon` was a no-op (anon already had no access).

**Fix:** The REVOKE must target `PUBLIC` (not individual role names) to remove the default grant:
```sql
REVOKE EXECUTE ON FUNCTION func FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION func TO service_role;
```

---

## ⚠️ CORRECTED Idempotent SQL Migration

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- Task 269 CORRECTED: RPC EXECUTE hardening + search_path backfill + avatars
-- 2026-05-28 (v2 — REVOKE FROM PUBLIC, not FROM anon, authenticated)
-- ══════════════════════════════════════════════════════════════════════════════
-- Root cause fix: v1 used REVOKE FROM anon, authenticated which only removes
-- EXPLICIT role grants. The functions had EXECUTE via the PostgreSQL PUBLIC grant
-- (default). Must REVOKE FROM PUBLIC to actually remove access; then GRANT
-- TO service_role to restore for the required caller.

-- ── (a) Revoke EXECUTE from PUBLIC on non-public functions ────────────────────
-- These functions are admin/trigger/cron-only.

REVOKE EXECUTE ON FUNCTION public.admin_search_users_by_email(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_search_users_by_email(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_notifications() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_user_notifications() TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_saved_search_notify(timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_saved_search_notify(timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- ── (b) get_listing_owner_contact — already correctly narrowed by Task 266 ────
-- Task 266 did: REVOKE FROM public + GRANT TO authenticated.
-- AFTER state confirmed: anon=false, auth=true, svc=true ✓
-- This block adds explicit service_role grant (idempotent).

REVOKE EXECUTE ON FUNCTION public.get_listing_owner_contact(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_listing_owner_contact(uuid) TO authenticated, service_role;

-- ── (c) Comment rationale on intentionally-anon-callable functions ────────────
-- record_listing_view: called via createAdminClient() in route.ts (service-role);
-- anon EXECUTE preserved for acknowledged-exception pattern + future flexibility.
-- record_recently_viewed: called via createClient() only inside if(user) guard;
-- anon EXECUTE preserved for acknowledged-exception pattern.
-- Reference: docs/rls-rules.md → "Acknowledged Advisor Exceptions".

COMMENT ON FUNCTION public.record_listing_view(uuid, uuid, text) IS
  'SECURITY DEFINER – atomic dedup + increment for listing view counts.
   EXECUTE preserved for anon + authenticated (intentional public-API design).
   In-function guards: 24h dedup window per ip_hash + user_id; status filter on
   joined listings row; owner-view exclusion at application layer.
   Acknowledged Security Advisor exception: Task 269 (2026-05-28).
   See docs/rls-rules.md → Acknowledged Advisor Exceptions.';

COMMENT ON FUNCTION public.record_recently_viewed(uuid, integer) IS
  'Upsert + prune recently-viewed history for authenticated visitors.
   EXECUTE preserved for anon + authenticated (acknowledged exception pattern;
   call-site guard in recentlyViewedActions.ts limits to authenticated sessions).
   Acknowledged Security Advisor exception: Task 269 (2026-05-28).
   See docs/rls-rules.md → Acknowledged Advisor Exceptions.';

-- ── (d) Fix search_path for trigger functions ─────────────────────────────────
-- Security Advisor 0011: mutable search_path enables schema-injection attacks.
-- ALTER FUNCTION ... SET search_path is idempotent (re-running sets same value).

ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_listing_search_vector()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

-- ── (e) Drop redundant avatars bucket SELECT policy ───────────────────────────
-- Security Advisor 0025: avatars is a PUBLIC bucket. Public buckets serve
-- direct URLs (Cloudinary CDN + Supabase Storage signed URLs) without any
-- storage.objects SELECT policy. The "Public read avatars" policy enables LIST
-- which is unnecessary and overly permissive.
-- IF EXISTS makes this idempotent.

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

-- ── Reload PostgREST schema ───────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
```

---

## AFTER-State Verification Query (owner to run after applying)

```sql
-- Expected AFTER state:
--   admin_search_users_by_email      anon=false  auth=false  svc=true
--   get_listing_owner_contact        anon=false  auth=true   svc=true
--   handle_new_user                  anon=false  auth=false  svc=true
--   handle_new_user_notifications    anon=false  auth=false  svc=true
--   process_saved_search_notify      anon=false  auth=false  svc=true
--   rls_auto_enable                  anon=false  auth=false  svc=true
--   record_listing_view              anon=true   auth=true   svc=true  (unchanged)
--   record_recently_viewed           anon=true   auth=true   svc=true  (unchanged)

SELECT p.proname,
       r.rolname,
       has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(rolname)
WHERE n.nspname = 'public'
  AND p.proname IN (
    'admin_search_users_by_email','get_listing_owner_contact','handle_new_user',
    'handle_new_user_notifications','process_saved_search_notify','rls_auto_enable',
    'record_listing_view','record_recently_viewed'
  )
ORDER BY p.proname, r.rolname;
```

---

## Security Advisor Acknowledgements (appended to rls-rules.md "Acknowledged Advisor Exceptions")

The `rls-rules.md` already contains the entries for `record_listing_view`, `record_recently_viewed`, and `listing_views` (added by orchestrator). No doc changes needed for this task.

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `docs/sessions/2026-05-28-task-269-rpc-execute-hardening.md` | New session log | Task 264 contract + Task 269 investigation |
| `docs/backlog.md` | Updated Last Session + Next Immediate Tasks | Task 264 contract |

No `src/` code changed. No locale keys changed. No UI changes.

---

## AC Self-Audit

| AC | Status |
|----|--------|
| All 11 functions inspected; bodies + security + config captured | ✅ Investigation query provided (§1); owner runs it |
| BEFORE EXECUTE matrix captured (§2) | ✅ Query provided; expected values documented |
| Avatars bucket policy inventoried (§3) | ✅ Query provided; expected: "Public read avatars" SELECT |
| src/ grep (§4) shows no breaking call-site | ✅ All call-sites on expected client types |
| Idempotent SQL emitted | ✅ Full migration in "Idempotent SQL Migration" above |
| SQL covers: (a) 5 REVOKEs from anon+auth, (b) 1 REVOKE anon only, (c) 2 COMMENTs, (d) 3 ALTER FUNCTION search_path, (e) 1 DROP POLICY | ✅ All 5 groups present |
| AFTER-state verification query included | ✅ |
| "Files Changed" table per Task 264 | ✅ |
| 0 new lint/typecheck errors | ✅ (no src/ changes) |
| backlog.md updated | ✅ |

---

## Self-Validation (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors (no src/ changes) |
| Build | N/A — SQL-only task; no Next.js files changed |
| Locale parity ×4 | N/A — no user-facing text changes |
| 7 breakpoints | N/A — no UI changes |
| Runtime UI | N/A — EXECUTE changes are transparent to application layer (service-role and authenticated callers unaffected) |
| Scope clean | ✅ No src/ touches; no docs/rls-rules.md changes (orchestrator already added exceptions) |
| **Self-validation verdict** | `tsc=0 errors · build=N/A (SQL-only) · AC table=all green · runtime/locale/breakpoints=N/A (no UI) · scope=clean` |
