# Sprint 15 — Task 270 kickoff (RLS INSERT policy tightening: notifications / listing_reports / companies)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.
> - **Single-writer SQL rule:** Sonnet does NOT run SQL. Sonnet emits idempotent SQL into the session log; the owner runs it.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md`. No scope change; STOP & ASK on ambiguity; literal AC; self-validate before "complete". This task is SQL-first but has higher runtime risk than Task 269 — tightening an INSERT policy that the code relied on as permissive WILL break runtime. Investigation is the bulk of this task; the SQL is small.

---

## Task 270 — RLS INSERT policy tightening (advisor `0024_permissive_rls_policy`)

```
Hard contract: see top.

Type:        chore (DB / RLS hardening) — runtime-affecting
Priority:    high
Area:        database / RLS / data-access

GOAL: Three production tables have INSERT policies with `WITH CHECK (true)` and are flagged
by Supabase Security Advisor `0024_permissive_rls_policy`:

  - `public.notifications` policy `System can insert notifications` (role `-`)
  - `public.listing_reports` policy `Users can create reports` (role `-`)
  - `public.companies` policy `companies_authenticated_insert` (role `authenticated`)

Each must be tightened to a non-trivial `WITH CHECK` predicate per the new rule in
`docs/rls-rules.md` → "RLS INSERT Policy Discipline".

A fourth flagged policy — `public.listing_views` "Anyone can insert a view" — is an
intentional exception (anonymous page-view tracking) and is already on the
"Acknowledged Advisor Exceptions" table in `rls-rules.md`. This task adds the rationale
COMMENT ON POLICY for it but does NOT change its predicate.

Runtime risk: tightening an INSERT policy WILL break any code path that was inserting rows
the new policy rejects. The bulk of this task is grep + read of the insertion code to
determine, per table:
  - Which client is used (session vs service-role)?
  - Which column anchors the row to the inserting user?
  - Does the code already pass `auth.uid()` (or the equivalent FK)?

If any INSERT path uses a service-role client, the right answer is usually
`to service_role with check (true)` (NOT `to authenticated`) — `service_role` is itself a
trust boundary. Document the decision per-table in the session log.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — Security Advisor triage in the same
session as Tasks 268 and 269.

Pre-read (DB / server action / RLS task bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/rls-rules.md       → "RLS INSERT Policy Discipline" — THE NEW RULE
                          → "Acknowledged Advisor Exceptions" — for the listing_views entry
                          → existing per-table sections for `user_status_history`,
                            `email_change_tokens` (tone reference)
- docs/data-access-rules.md
- docs/domain-rules.md    → user / agent / company / report flows
- docs/qa-rules.md
- src/ insertion call-sites (read, do NOT modify until decision is made per-table):
  - grep for `.from('notifications').insert(`
  - grep for `.from('listing_reports').insert(`
  - grep for `.from('companies').insert(`
  - grep for any RPC that performs the same insert (e.g. `rpc('create_report'`).
- Existing `companies_authenticated_insert` policy DDL (any prior migration file in repo)
- Existing `Users can create reports` policy DDL
- Existing `System can insert notifications` policy DDL
- Existing `Anyone can insert a view` policy DDL

Current behavior to preserve:
- Affected DB objects (4 policies):
  - `public.notifications` policy `System can insert notifications` — INSERT, role `-`,
    WITH CHECK true.
  - `public.listing_reports` policy `Users can create reports` — INSERT, role `-`,
    WITH CHECK true.
  - `public.companies` policy `companies_authenticated_insert` — INSERT,
    role `authenticated`, WITH CHECK true.
  - `public.listing_views` policy `Anyone can insert a view` — INSERT, role `-`,
    WITH CHECK true (KEEP — intentional, only add COMMENT ON POLICY).
- Existing INSERT code paths (must keep working unchanged):
  - Notification creation in Server Actions (e.g. on listing-approval, on new inquiry, …).
  - `listing_reports` insertion when a user reports a listing (Epic V / Task 242 wired the
    UI; the insert call lives in a Server Action).
  - `companies` insertion during agent onboarding (Epic B / Epic O).

Required after behavior (per table):

1. `public.notifications`:
   - Existing policy `System can insert notifications` is DROPPED.
   - New policy added: `notifications_insert_service_role` — `to service_role with check
     (true)`. Rationale: notifications are system-generated; all insert paths must go through
     service-role-backed Server Actions. If the grep reveals a session-client insert path,
     STOP & ASK — that code path must be migrated to `createAdminClient()` BEFORE the
     policy tightens.
   - SQL COMMENT ON POLICY documenting the rationale + Task 270.

2. `public.listing_reports`:
   - Existing policy `Users can create reports` is DROPPED.
   - New policy added: `listing_reports_insert_own` — `to authenticated with check
     (auth.uid() = <reporter_fk_column>)`. The FK column name MUST be confirmed via DB
     inspection (likely `reporter_id` or `user_id` — STOP & ASK if neither exists).
   - SQL COMMENT ON POLICY documenting the rationale + Task 270.

3. `public.companies`:
   - Existing policy `companies_authenticated_insert` is DROPPED.
   - New policy added: `companies_insert_own` — `to authenticated with check
     (auth.uid() = <owner_fk_column>)`. The FK column name MUST be confirmed via DB
     inspection (likely `owner_id` or `user_id` — STOP & ASK if neither exists).
   - SQL COMMENT ON POLICY documenting the rationale + Task 270.

4. `public.listing_views`:
   - Existing policy `Anyone can insert a view` is KEPT unchanged.
   - SQL COMMENT ON POLICY added documenting the rationale (intentional anon-callable view
     tracking; guards live in `record_listing_view` RPC; see Task 269 acknowledgement).
   - NO predicate change.

Positive flow (happy path):
- Owner pastes the new SQL → it runs without error → audit query shows the new policies in
  place → admin approving a listing still creates a notification (service-role path) →
  authenticated user reporting a listing creates a `listing_reports` row → agent
  registration creates a `companies` row → anonymous visitor still records `listing_views`
  → Security Advisor re-scan shows the three warnings cleared and the listing_views one
  acknowledged via comment.

Negative flow (every off-happy-path branch):
- **`notifications` is inserted from a session-client somewhere in `src/`:** STOP & ASK.
  The grep MUST show only service-role inserts. If any session-client insert exists, that
  code path must be migrated to `createAdminClient()` in a separate task BEFORE the policy
  tightens. Do not ship the policy change unilaterally.
- **`listing_reports.reporter_id` does not exist (or has a different name):** STOP & ASK.
  Inspect the live column list via `information_schema.columns` first. Do not invent.
- **`companies.owner_id` does not exist (or has a different name):** STOP & ASK. Same
  pattern — inspect first.
- **An INSERT in `src/` passes a hardcoded user_id different from `auth.uid()`:** the new
  policy will reject the insert. STOP & ASK and document the case — likely the code is wrong
  (impersonation surface) and the fix is in code, not in the policy.
- **A trigger (e.g. on listing approval) inserts a `notifications` row:** verify the trigger
  function runs as `SECURITY DEFINER` (it owns the bypass). If it runs as the invoker, the
  new `to service_role only` policy will reject the insert. STOP & ASK.
- **Admin-side Server Action creates a `companies` row for another user (admin tool):**
  the new `to authenticated with check (auth.uid() = owner_id)` policy would reject this if
  the admin uses a session client. Admin tools MUST use `createAdminClient()` (service-role
  bypasses RLS entirely). Verify via grep; STOP & ASK if any admin-side `from('companies').
  insert(...)` uses a session client.
- **Re-application of the migration:** the SQL MUST be idempotent (`drop policy if exists`
  for the old policy; `create policy` for the new — wrap in `do $$ ... if not exists ...`
  block if needed, OR drop + create unconditionally since policies are not heavy objects).
- **Owner has not applied the SQL yet:** AC are met once Sonnet emits the SQL into the
  session log; runtime verification is the owner's step.

Required investigation (paste outputs into the session log):

1. Inspect current policies on the four tables:
   ```sql
   select polname, polcmd, polroles::regrole[] as roles,
          pg_get_expr(polqual, polrelid) as using_qual,
          pg_get_expr(polwithcheck, polrelid) as with_check
   from pg_policy
   where polrelid in (
     'public.notifications'::regclass,
     'public.listing_reports'::regclass,
     'public.companies'::regclass,
     'public.listing_views'::regclass
   )
   order by polrelid::regclass::text, polname;
   ```
   Paste the full output into the session log.

2. Inspect column names for FK anchors:
   ```sql
   select table_name, column_name, data_type, is_nullable
   from information_schema.columns
   where table_schema = 'public'
     and table_name in ('notifications', 'listing_reports', 'companies')
     and (column_name ilike '%user%' or column_name ilike '%owner%' or column_name ilike '%reporter%' or column_name ilike '%recipient%')
   order by table_name, column_name;
   ```
   Identify, per table, the column that the new WITH CHECK predicate must reference.

3. grep src/ for every insertion call-site:
   ```
   grep -rn "from('notifications').insert" src/
   grep -rn "from('listing_reports').insert" src/
   grep -rn "from('companies').insert" src/
   grep -rn "from('listing_views').insert" src/        (sanity check — should be 0 or 1)
   grep -rn "rpc('record_listing_view'" src/           (sanity check)
   ```
   For each hit, open the file and identify:
   - Which Supabase client is being used (`createClient()` session vs `createAdminClient()`
     service-role)?
   - Which columns are being inserted? Specifically, is the FK column being set to
     `user.id` (where `user` came from `supabase.auth.getUser()`)?
   - Is the call inside a Server Action, an API route, or a client component?

4. Build the per-table decision matrix in the session log:

   | Table | Insert call-sites (file:line) | Client used | FK column for predicate | New policy decision |
   |---|---|---|---|---|
   | notifications | ... | createAdminClient (service-role) | recipient_user_id (TBC) | `to service_role with check (true)` |
   | listing_reports | ... | createClient (session) | reporter_id (TBC) | `to authenticated with check (auth.uid() = reporter_id)` |
   | companies | ... | createClient (session) | owner_id (TBC) | `to authenticated with check (auth.uid() = owner_id)` |
   | listing_views | ... | various | n/a — kept | KEEP + COMMENT ON POLICY |

5. AFTER applying the SQL (owner step; Sonnet emits the verification query):
   ```sql
   -- Same query as §1; expected AFTER state shows each policy with non-trivial
   -- WITH CHECK predicate (or `to service_role` scope), and listing_views with COMMENT
   -- attached.
   ```

Scope (files Sonnet may touch):
1. ONE idempotent SQL migration into the session log:
   a. `DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;`
      + `CREATE POLICY notifications_insert_service_role ON public.notifications FOR INSERT TO service_role WITH CHECK (true);`
      + `COMMENT ON POLICY notifications_insert_service_role ON public.notifications IS '...';`
   b. `DROP POLICY IF EXISTS "Users can create reports" ON public.listing_reports;`
      + `CREATE POLICY listing_reports_insert_own ON public.listing_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = <verified_fk>);`
      + `COMMENT ON POLICY ... IS '...';`
   c. `DROP POLICY IF EXISTS "companies_authenticated_insert" ON public.companies;`
      + `CREATE POLICY companies_insert_own ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = <verified_fk>);`
      + `COMMENT ON POLICY ... IS '...';`
   d. `COMMENT ON POLICY "Anyone can insert a view" ON public.listing_views IS '...';`
      (NO predicate change.)
2. Session log file `docs/sessions/2026-05-28-task-270-rls-insert-tightening.md` with:
   - Policy inventory BEFORE (query §1).
   - Column inventory (§2).
   - grep results for every insert call-site (§3).
   - Decision matrix (§4) signed off — one row per table.
   - In-function-guard evidence reused from Task 269 acknowledgement (cite Task 269 session log).
   - "Files Changed" table per Task 264.
   - Note 18 self-validation block.
3. Update `docs/backlog.md`: advance "Last task number" to 270; add Task 270 entry.

OPTIONAL src/ changes — ONLY if the grep reveals a misaligned call-site:
- If any insert path passes a different user_id than `auth.uid()`, file a separate follow-up
  task (do NOT fix it inline — scope discipline). The current task ships only if all
  insert paths already align with the new predicate.

Out of scope (do NOT touch):
- INSERT policies on tables NOT in the four listed above.
- SELECT/UPDATE/DELETE policies on any of the four tables (out of scope; this task is
  INSERT-only).
- Refactoring any insert call-site to switch clients (session vs admin) — if a switch is
  needed, file a separate task.
- `listing_views` predicate — do NOT tighten; only add COMMENT.
- Anything Task 269 already covers (RPC EXECUTE, search_path, avatar bucket policy).
- `messages/*.json` — locale parity is N/A.
- UI / responsive — N/A.

Acceptance criteria (literal):
- All four policies inventoried (BEFORE state in session log).
- Column inventory done for the three tables being tightened (§2).
- Every src/ insert call-site identified (§3); per-call-site client + FK column documented.
- Per-table decision matrix completed and signed off in the session log (§4).
- Idempotent SQL emitted into session log covering all four blocks (a–d above).
- AFTER-state verification query included (§5).
- If grep reveals a misaligned call-site, the task is BLOCKED and a follow-up filed instead
  of inline fix (scope discipline).
- "Files Changed" table per Task 264.
- AC self-audit table per Note 18.
- Self-validation verdict line: `Self-validation: tsc=0 errors · build=N/A (SQL-only, no src/ changes) · AC table=all green · runtime locale=N/A (no UI) · scope=clean`.
- 0 new lint / typecheck errors.
- `docs/backlog.md` updated.

Final report required from Sonnet:
1. Files changed (the table — expected 2 files, unless src/ misalignment surfaced a follow-up).
2. BEFORE policy inventory (full output).
3. Column inventory.
4. Decision matrix per table.
5. SQL migration (full text, ready for owner to paste).
6. AFTER-state verification query.
7. Confirmation that no src/ code changed (or — if it did — explicit justification with
   orchestrator STOP&ASK record).
8. Self-validation verdict line.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT run SQL.
```
