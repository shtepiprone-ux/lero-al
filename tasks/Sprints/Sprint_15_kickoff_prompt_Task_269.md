# Sprint 15 — Task 269 kickoff (RPC EXECUTE hardening + search_path + storage policy)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands. The orchestrator (Opus) emits explicit-path commit commands during review.
> - **Single-writer SQL rule:** Sonnet does NOT run SQL. Sonnet emits idempotent SQL into the session log; the owner runs it in Supabase SQL Editor.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` task-type bundles — never "read all docs". No scope change; no invented architecture (STOP & ASK if ambiguous); literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review). This is a SQL-only task — locale/breakpoint coverage = N/A (document N/A reason in self-validation block, do NOT skip the block). Owner runs SQL; executor never runs git or SQL.

---

## Task 269 — RPC EXECUTE hardening + function `search_path` backfill + avatar bucket policy cleanup

```
Hard contract: see top.

Type:        chore (DB / RLS hardening)
Priority:    high
Area:        database / RLS / data-access / storage

GOAL: Close Supabase Security Advisor warnings in three related families with ONE
idempotent SQL migration:

  (a) `0028` / `0029` — `SECURITY DEFINER` functions executable by anon/authenticated.
      REVOKE EXECUTE from non-public functions; preserve EXECUTE only where intentional.

  (b) `0011_function_search_path_mutable` — three trigger functions without explicit
      `SET search_path`. Backfill via ALTER FUNCTION (idempotent).

  (c) `0025_public_bucket_allows_listing` — `avatars` bucket has a redundant SELECT policy
      on `storage.objects` enabling LIST. Drop the policy (direct URL access continues to
      work for public buckets).

The new rules in `docs/rls-rules.md` → "RPC EXECUTE Discipline" + "Function Security:
search_path discipline" + "Acknowledged Advisor Exceptions" govern this task. Read them
first.

Runtime impact: expected ZERO. All admin RPCs are called from `src/` via
`createAdminClient()` (service-role bypasses REVOKE). Trigger functions run in trigger
context. Cron functions are invoked by `pg_cron` (service-role). The avatar bucket is
public — direct URL access (e.g. `<bucket>/<path>`) does NOT require a SELECT policy on
`storage.objects`. STOP & ASK if any code path contradicts this assumption.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — Security Advisor triage after
new `rls-rules.md` rules "RPC EXECUTE Discipline" + "Function Security: search_path
discipline" + "Acknowledged Advisor Exceptions" were published in the same session.

Pre-read (DB / server action / RLS task bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/rls-rules.md       → "RPC EXECUTE Discipline" — THE NEW RULE (table of default
                            EXECUTE policies by function role)
                          → "Function Security: search_path discipline" — THE NEW RULE
                          → "Acknowledged Advisor Exceptions" — running list of intentional
                            advisor findings (will be appended by this task)
                          → existing "Email-Change Token Policy" / "user_status_history
                            Access Policy" for tone reference
- docs/data-access-rules.md
- docs/domain-rules.md    → context for `listing_views` / `record_listing_view`
- docs/qa-rules.md
- docs/sessions/2026-05-28-task-266-t8-users-rls-narrowing.md — prior art for
  `get_listing_owner_contact` (Task 266 established the SECURITY DEFINER + UI-gate design;
  this task ADDS the second-line REVOKE FROM anon)
- Existing call-site code (read, do NOT modify):
  - `src/modules/listings/actions/getListingOwnerContact.ts` — uses session client
    (`createClient()`), not service-role; authenticated callers only. UI gate via
    `has_phone` / `has_whatsapp` booleans from view.
  - `src/app/admin/listings/page.tsx:27` — uses `createAdminClient()` (service-role) for
    `admin_search_users_by_email` RPC.
  - `src/modules/listings/actions/recentlyViewedActions.ts` — RPC `record_recently_viewed`
    (intentionally anon-callable; verify in-function guards).
  - `src/app/api/listings/[slug]/view/route.ts` — RPC `record_listing_view` (intentionally
    anon-callable; verify in-function guards).

Current behavior to preserve:
- Affected DB objects (functions):
  - `public.admin_search_users_by_email(q text)` — currently `SECURITY DEFINER`, EXECUTE
    granted to anon + authenticated (default).
  - `public.get_listing_owner_contact(listing_id_param uuid)` — created by Task 266 as
    `SECURITY DEFINER` with `search_path = public, pg_temp`; EXECUTE granted to anon +
    authenticated (default).
  - `public.handle_new_user()`, `public.handle_new_user_notifications()` — trigger functions.
  - `public.process_saved_search_notify(p_now timestamptz)` — cron-style notify.
  - `public.rls_auto_enable()` — admin/dev utility.
  - `public.record_listing_view(p_listing_id uuid, p_user_id uuid, p_ip_hash text)` —
    intentionally anon-callable; verify in-function guards.
  - `public.record_recently_viewed(p_listing_id uuid, p_cap integer)` — intentionally
    anon-callable; verify in-function guards.
  - `public.update_updated_at()` — trigger function, no explicit `search_path`.
  - `public.update_listing_search_vector()` — trigger function, no explicit `search_path`.
  - `public.update_updated_at_column()` — trigger function, no explicit `search_path`.
- Affected DB objects (storage):
  - `avatars` public bucket — SELECT policy `"Public read avatars"` on `storage.objects`
    (redundant for public buckets).
- Existing consumers (must keep working unchanged):
  - `src/app/admin/listings/page.tsx` (admin email search via service-role).
  - `src/modules/listings/actions/getListingOwnerContact.ts` (authenticated callers via
    session client).
  - `src/app/api/listings/[slug]/view/route.ts` + `recentlyViewedActions.ts` (anon-callable
    paths preserved).
  - Any trigger that calls `update_updated_at` / `update_listing_search_vector` /
    `update_updated_at_column` (table-level triggers; not touched by this task).
  - Avatar image rendering (Cloudinary CDN URLs / direct Supabase URLs) — direct URL access
    continues to work.

Required after behavior:
1. `admin_search_users_by_email`, `handle_new_user`, `handle_new_user_notifications`,
   `process_saved_search_notify`, `rls_auto_enable`: EXECUTE revoked from `anon` AND
   `authenticated`. `service_role` retains EXECUTE.
2. `get_listing_owner_contact`: EXECUTE revoked from `anon`. EXECUTE preserved for
   `authenticated` AND `service_role`. (This is the "sensitive RPC callable by signed-in
   users only" case from `rls-rules.md`.)
3. `record_listing_view`, `record_recently_viewed`: EXECUTE for anon + authenticated is
   PRESERVED. SQL comment added to each function's DDL via `COMMENT ON FUNCTION` documenting
   why anon access is intentional, referencing Task 269.
4. `update_updated_at`, `update_listing_search_vector`, `update_updated_at_column`:
   `search_path = public, pg_temp` set via `ALTER FUNCTION`. (Trigger functions; no other
   changes to the function body.)
5. `avatars` bucket policy `"Public read avatars"` on `storage.objects` is dropped. Direct
   URL access to objects continues to work.
6. `docs/rls-rules.md` → "Acknowledged Advisor Exceptions" table already contains the
   `record_listing_view`, `record_recently_viewed`, and `listing_views` entries (added by
   the orchestrator in this session). No further docs changes needed.

Positive flow (happy path):
- Owner pastes the idempotent SQL into Supabase SQL Editor → it runs without error → audit
  query (see "Required investigation" §6) shows the expected EXECUTE matrix → admin /listings
  search by email still works (service-role bypass) → authenticated listing detail still
  fetches owner contact → anonymous listing visit still records `record_listing_view` →
  avatar images still render on every page that uses them → Security Advisor re-scan shows
  the relevant warnings cleared OR documented as acknowledged exceptions.

Negative flow (every off-happy-path branch):
- **`get_listing_owner_contact` is unexpectedly called from an anonymous code path:** STOP &
  ASK. The grep in §4 of "Required investigation" must show only authenticated callers. If
  any anon path exists, the REVOKE will break that path. Do not ship.
- **`admin_search_users_by_email` is called from a non-service-role path:** STOP & ASK.
  The grep in §4 must show only `createAdminClient()` usage. If a session-client call exists
  somewhere, ship a separate task to migrate it to admin client first.
- **`record_listing_view` / `record_recently_viewed` lack in-function guards:** STOP & ASK.
  Inspect each function body (query §1). If guards (rate limit / IP hash / status filter)
  are missing, the acknowledgement-exception is unjustified — file a follow-up task instead.
- **A trigger function is referenced as an explicit RPC call somewhere in `src/`:** STOP &
  ASK. The grep in §4 must return zero hits for `supabase.rpc('handle_new_user'...)` and
  similar. If any code calls a trigger function via RPC, that call needs to be re-architected
  before REVOKE.
- **`avatars` bucket policy drop breaks image rendering:** must not happen — public buckets
  serve direct URLs without policies. Document the test step in the session log (load any
  page that renders avatars after owner-apply; visual check). If avatars stop rendering,
  STOP — the policy may be doing something non-obvious; do not "fix forward".
- **`pg_cron` is configured to call `process_saved_search_notify` as a non-service-role:**
  unlikely (Supabase pg_cron uses service-role by default), but verify. STOP & ASK if cron
  job DDL is unclear.
- **Owner has NOT applied the SQL yet:** Sonnet emits SQL into session log; AC are met once
  SQL is emitted. Runtime verification is the owner's step (paste into Supabase SQL Editor,
  re-scan advisor, confirm targeted warnings cleared).
- **Re-run of the migration:** the SQL MUST be idempotent (`drop policy if exists`,
  `revoke execute on function ... from ...` is naturally idempotent in Postgres,
  `alter function ... set search_path = ...` is idempotent). Verify by re-running each block
  on paper.

Required investigation (paste outputs into the session log):

1. Inspect each function's body, security setting, and config:
   ```sql
   select p.proname,
          pg_get_function_identity_arguments(p.oid) as args,
          p.prosecdef as is_security_definer,
          p.proconfig as config,
          pg_get_functiondef(p.oid) as body
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in (
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
   order by p.proname;
   ```
   Confirm `prosecdef = true` for the SECURITY DEFINER ones; capture the function bodies of
   `record_listing_view` and `record_recently_viewed` and quote the guard clauses in the
   session log (rate limit, IP hash, status filter).

2. Inspect current EXECUTE matrix (BEFORE state):
   ```sql
   select p.proname,
          pg_get_function_identity_arguments(p.oid) as args,
          r.rolname,
          has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   cross join (values ('anon'), ('authenticated'), ('service_role')) r(rolname)
   where n.nspname = 'public'
     and p.proname in (
       'admin_search_users_by_email','get_listing_owner_contact','handle_new_user',
       'handle_new_user_notifications','process_saved_search_notify','rls_auto_enable',
       'record_listing_view','record_recently_viewed'
     )
   order by p.proname, r.rolname;
   ```
   Paste full BEFORE matrix into session log.

3. Inspect avatars bucket policies on `storage.objects`:
   ```sql
   select polname, polcmd, pg_get_expr(polqual, polrelid) as qual,
          pg_get_expr(polwithcheck, polrelid) as with_check
   from pg_policy
   where polrelid = 'storage.objects'::regclass
     and polname ilike '%avatar%';
   ```

4. grep src/ for any caller that would break:
   ```
   grep -rn "rpc('admin_search_users_by_email'" src/
   grep -rn "rpc('handle_new_user" src/                  (no expected hits — triggers)
   grep -rn "rpc('process_saved_search_notify'" src/     (no expected hits — cron)
   grep -rn "rpc('rls_auto_enable'" src/                 (no expected hits — admin util)
   grep -rn "rpc('get_listing_owner_contact'" src/       (1 expected hit; verify it uses createClient(), not anon)
   grep -rn "rpc('record_listing_view'" src/             (≥1 hit; verify guards)
   grep -rn "rpc('record_recently_viewed'" src/          (≥1 hit; verify guards)
   grep -rn "Public read avatars" src/                   (no expected hits — policy name)
   ```
   Paste hits and confirm each is on the expected client type (createAdminClient for admin
   RPCs; createClient (session) for authenticated RPCs; createClient (session, anon) for
   record_* paths).

5. Inspect any explicit `GRANT EXECUTE` statements in repo migrations:
   ```
   grep -rn "GRANT EXECUTE" src/ supabase/ migrations/ 2>/dev/null || true
   grep -rn "grant execute" src/ supabase/ migrations/ 2>/dev/null || true
   ```
   If a previous migration explicitly granted EXECUTE to anon/authenticated, the new SQL
   must REVOKE that explicit grant (the REVOKE pattern handles both implicit-default and
   explicit grants).

6. AFTER applying the SQL (owner does this — Sonnet emits the verification query into the
   session log for the owner to run):
   ```sql
   -- Same matrix as §2; expected AFTER state:
   --   admin_search_users_by_email         anon=false  auth=false  svc=true
   --   get_listing_owner_contact           anon=false  auth=true   svc=true
   --   handle_new_user                     anon=false  auth=false  svc=true
   --   handle_new_user_notifications       anon=false  auth=false  svc=true
   --   process_saved_search_notify         anon=false  auth=false  svc=true
   --   rls_auto_enable                     anon=false  auth=false  svc=true
   --   record_listing_view                 anon=true   auth=true   svc=true  (unchanged)
   --   record_recently_viewed              anon=true   auth=true   svc=true  (unchanged)
   ```

Scope (files Sonnet may touch):
1. Emit ONE idempotent SQL migration into the session log, containing in order:
   a. EXECUTE revokes for non-public functions (5 functions).
   b. EXECUTE revoke from anon only for `get_listing_owner_contact` (preserve authenticated).
   c. `COMMENT ON FUNCTION` rationale comments for `record_listing_view`,
      `record_recently_viewed` (referencing Task 269 + the
      `rls-rules.md` "Acknowledged Advisor Exceptions" entry).
   d. `ALTER FUNCTION ... SET search_path = public, pg_temp` for the 3 trigger functions.
   e. `DROP POLICY IF EXISTS "Public read avatars" ON storage.objects` (idempotent).
2. Update session log file at `docs/sessions/2026-05-28-task-269-rpc-execute-hardening.md`
   with:
   - BEFORE / AFTER EXECUTE matrices (queries §1, §2, §6).
   - Function-body excerpts showing in-function guards for
     `record_listing_view` + `record_recently_viewed`.
   - grep outputs from §4 confirming no breaking call-site.
   - The "Files Changed" table per Task 264 (in this task: 2 files — the session log + the
     backlog update line; no src/ files).
   - Note 18 self-validation block (with N/A reasons clearly stated for the lines that don't
     apply — locale, breakpoints, runtime UI, build).
3. Update `docs/backlog.md`:
   - Advance "Last task number" to 269.
   - Add Task 269 to Sprint 15 closure list once owner applies + Sonnet self-validates.

Out of scope (do NOT touch):
- Function bodies of `record_listing_view` / `record_recently_viewed` — only adding a
  COMMENT, NOT modifying the body. If a guard is missing, STOP & ASK; do not "fix" inline.
- Any change to `users` RLS, `public_user_profiles` view, or the get_listing_owner_contact
  function body (those are Task 266 / 268 surface).
- INSERT-policy tightening on `notifications`, `listing_reports`, `companies` — that is
  Task 270 (separate kickoff).
- Moving `pg_net` extension out of `public` — deferred (see
  `rls-rules.md` "Acknowledged Advisor Exceptions").
- Enabling Leaked Password Protection in Auth dashboard — that is an owner dashboard toggle
  (not a SQL task).
- Any `src/` code change. The new EXECUTE matrix must not require code changes (verified in
  the grep step).
- `messages/*.json` — locale parity is N/A.
- UI / responsive — N/A.

Acceptance criteria (literal):
- All 11 functions from §1 inspected; bodies + security settings + config captured in session log.
- BEFORE EXECUTE matrix captured (§2).
- avatars bucket policy inventoried (§3).
- src/ grep (§4) shows no breaking call-site; results pasted into session log.
- Idempotent SQL emitted into session log, ready for owner to paste into Supabase SQL Editor.
- SQL covers ALL of: (a) 5 REVOKEs from anon+authenticated, (b) 1 REVOKE from anon only,
  (c) 2 COMMENTs on intentionally-public functions, (d) 3 ALTER FUNCTION search_path,
  (e) 1 DROP POLICY on storage.objects.
- AFTER-state verification query included for owner to run (§6).
- AC-by-AC self-audit table in session log (Note 18).
- "Files Changed" table per Task 264.
- Self-validation verdict line: `Self-validation: tsc=0 errors · build=N/A (SQL-only) · AC table=all green · runtime locale=N/A (no UI) · scope=clean`.
- 0 new lint / typecheck errors (no src/ changes — `npx tsc --noEmit` still passes baseline).
- `docs/backlog.md` updated: Task 269 entry; "Last task number" advanced.

Final report required from Sonnet:
1. Files changed (the table — expected 2 files).
2. BEFORE EXECUTE matrix (full query output).
3. SQL migration (full text, ready for owner to paste).
4. AFTER-state verification query.
5. In-function guard evidence for `record_listing_view` + `record_recently_viewed`.
6. Confirmation that no `src/` code changed.
7. Self-validation verdict line.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT run SQL. The
orchestrator will emit commit commands during review; the owner will run the SQL.
```
