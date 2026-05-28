# Sprint 15 — Task 268 kickoff (Security Advisor remediation: `public.public_user_profiles`)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255). This task MUST contain `Positive flow (happy path)` and `Negative flow (every off-happy-path branch)` sections — they are below. A diff that ships only the happy path is INCOMPLETE.
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands. The orchestrator (Opus) emits explicit-path commit commands during review.
> - **Single-writer SQL rule:** Sonnet does NOT run SQL. Sonnet emits idempotent SQL into the session log; the owner runs it in Supabase SQL Editor.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` task-type bundles — never "read all docs". No scope change; no invented architecture (STOP & ASK if ambiguous); literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check in `uk` 320px if UI touched); preserve UX flow + existing controls; update `docs/backlog.md` + add session log with Files Changed table; 0 new lint/typecheck errors; `npm run build` passes if non-trivial; locale parity ×4 (only if UI text changes — likely N/A for this task); 7 breakpoints (only if UI changes — likely N/A). Owner runs SQL; executor never runs git or SQL.

---

## Task 268 — Security Advisor remediation: `public.public_user_profiles` SECURITY DEFINER view audit + rationale

```
Hard contract: see top.

Type:        chore (DB / RLS audit)
Priority:    high
Area:        database / RLS / data-access

GOAL: Supabase Security Advisor flagged `public.public_user_profiles` with
`0010_security_definer_view` (ERROR). The view was created INTENTIONALLY by Task 266 with
`security_invoker = false` as a public-facade pattern over the now-narrowed `users` table
(RLS policy `users_self_read` = `auth.uid() = id` only). The new rule in
`docs/rls-rules.md` → "Security Definer Views (FORBIDDEN by default)" → "SECURITY DEFINER
exception (public-facade pattern)" allows this pattern ONLY IF all four conditions hold and
a rationale comment lives in the migration. This task verifies the four conditions, adds the
rationale + a defensive WHERE filter as required, and documents the Security Advisor finding
as an accepted exception. The Security Advisor finding STAYS — it is acknowledged, not fixed
by switching to invoker mode.

DO NOT switch this view to `security_invoker = on`. Doing so will BREAK the listing-detail
public-profile read for any user looking at another user's listing — `users_self_read` only
permits `auth.uid() = id`. The orchestrator has confirmed this. If you believe invoker mode
is the right answer, STOP & ASK.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — Security Advisor finding triaged after
new `rls-rules.md` rule "Security Definer Views (FORBIDDEN by default)" was published.

Pre-read (DB / server action / RLS task bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/rls-rules.md       → "Security Definer Views (FORBIDDEN by default)" — THE NEW RULE
                          → "Public Schema GRANT Discipline" — sibling rule (NOT changed by this task)
                          → existing "user_status_history Access Policy" / "Email-Change Token Policy" for tone match
- docs/data-access-rules.md → "Supabase Views (Recommended)" — updated cross-ref
- docs/domain-rules.md    → user / listing visibility model
- docs/qa-rules.md
- docs/sessions/2026-05-28-task-266-t8-users-rls-narrowing.md  ← THIS IS THE PRIOR ART
  - Confirms the view was intentionally `security_invoker = false`
  - Confirms exposed columns (id, name, avatar, slug, has_phone, has_whatsapp, …) — no PII
  - Confirms GRANT was `authenticated` only (not anon)
  - Confirms the "deleted-owner skip" lives in the RPC, NOT in the view body
- Task 263 session log (the prior `USING (true)` policy that 266 replaced) — context only

Current behavior to preserve:
- Affected DB object: `public.public_user_profiles` view (created by Task 266, owner SQL applied 2026-05-28).
- Existing GRANT: `GRANT SELECT ON public.public_user_profiles TO authenticated;` — preserve.
- Existing column set in the view (per Task 266 session log): id, name, avatar, slug,
  has_phone (boolean), has_whatsapp (boolean), created_at, … — exact list to be inventoried
  in the session log from the live DB definition.
- Existing consumers (must keep working unchanged):
  - `src/app/[locale]/listings/[slug]/page.tsx` — `from('public_user_profiles').select(...).eq('id', listing.user_id)`
  - `src/types/database.ts` → `PublicUserProfile` interface
  - `scripts/check-schema-drift.mjs` → `INTERFACE_TABLE_MAP` entry
  - `get_listing_owner_contact(listing_id_param)` RPC (separate object — not touched by this task)
- Existing RLS on base `users` table: `users_self_read` (`auth.uid() = id`) — preserve, do NOT widen.
- Existing Security Advisor finding: `0010_security_definer_view` on `public.public_user_profiles`
  — this finding will REMAIN after this task; it is being acknowledged as an accepted
  exception per the new rule, not "fixed" by switching to invoker mode.

Required after behavior:
1. The view body has an SQL comment IMMEDIATELY above `CREATE OR REPLACE VIEW`
   documenting why `security_invoker = false` is the deliberate access boundary, referencing
   Task 266 and the four conditions of the public-facade exception in `rls-rules.md`.
2. The view body contains an explicit `WHERE` filter that scopes rows to those a public
   consumer is allowed to see — at minimum `WHERE deleted_at IS NULL` (Task 266's RPC has
   this; the view itself currently does NOT — the new rule requires it on the view too).
   STOP & ASK if `users.deleted_at` does not exist or has a different name; do not invent.
3. The exposed column list is verified to contain ONLY non-PII columns. If you find
   `email`, raw `phone`, raw `whatsapp`, password fields, tokens, IP addresses, or any other
   PII in the view's SELECT list, STOP & ASK — Task 266 should already have excluded these,
   but verify against the live DB definition.
4. GRANTs are verified to be minimal — `authenticated` only, NOT `anon`. If `anon` somehow
   has SELECT on this view, STOP & ASK (it would contradict Task 266).
5. A short note is added to the session log under "Security Advisor acknowledgement" linking
   the finding (`0010_security_definer_view` on `public.public_user_profiles`) to the
   `rls-rules.md` "SECURITY DEFINER exception (public-facade pattern)" rule, with the four
   conditions ticked off based on the live DB inspection.

Positive flow (happy path):
- Owner pastes the new SQL (rationale comment + WHERE filter on the view) into Supabase SQL Editor → it runs idempotently → `npm run check:schema-drift` still passes (29 tables / 272 cols, unchanged column count for the view) → listing detail still shows owner avatar/name for an authenticated user looking at any active listing → Cabinet ProfileTab still shows self-row (RLS on base table unchanged) → Security Advisor still reports the finding (expected) but it is now documented as an accepted exception in the session log.

Negative flow (every off-happy-path branch):
- **Owner has NOT applied the new SQL yet:** the view definition in DB is the pre-task version
  (no WHERE, no comment). Sonnet's job is to emit the SQL into the session log only — the
  acceptance criteria do NOT require runtime verification after owner-apply on the same day;
  the kickoff is complete once SQL is emitted and the session log documents the gate.
- **`users.deleted_at` is missing or differently named:** STOP & ASK — do not invent the
  column. Inspect the live `users` table DDL first.
- **A consumer of the view relies on rows where `deleted_at IS NOT NULL`** (e.g., showing
  "this user has deleted their account" placeholder): the WHERE filter would hide those rows.
  Sonnet MUST grep every `from('public_user_profiles')` consumer and verify none of them
  expect tombstoned rows. If any do, STOP & ASK — the WHERE filter design needs orchestrator
  input.
- **The view's exposed columns include PII** (email, raw phone digits, raw whatsapp digits,
  …) — STOP & ASK. This would be a Task 266 regression bug to file separately, not a fix
  attempted here.
- **`anon` somehow has SELECT on the view** — STOP & ASK. Same reason as above.
- **Switching to `security_invoker = on` is tempting** — DO NOT. This would break Task 266
  (see the goal note). The Security Advisor finding STAYS as an accepted exception.
- **A separate Security Advisor finding appears for another view** (e.g., another
  `0010_security_definer_view` row) — out of scope for this task. File a follow-up; do not
  attempt a multi-view fix here.

Required investigation (paste outputs into the session log):
1. Inspect the live view definition:
   ```sql
   select pg_get_viewdef('public.public_user_profiles', true);
   select c.relname,
          (case when c.relkind = 'v'
                then (select option_value
                      from pg_options_to_table(c.reloptions)
                      where option_name = 'security_invoker')
                else null end) as security_invoker
   from pg_class c
   where c.relname = 'public_user_profiles' and c.relnamespace = 'public'::regnamespace;
   ```
   Confirm `security_invoker` is `false` or absent (default = definer semantics).
2. Inspect GRANTs:
   ```sql
   select grantee, privilege_type
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'public_user_profiles';
   ```
   Confirm `authenticated` has SELECT; confirm `anon` does NOT.
3. Inspect base `users` columns to confirm `deleted_at` exists and is `timestamptz`:
   ```sql
   select column_name, data_type, is_nullable
   from information_schema.columns
   where table_schema = 'public' and table_name = 'users' and column_name = 'deleted_at';
   ```
4. grep consumers:
   ```
   grep -rn "from('public_user_profiles')" src/
   grep -rn "PublicUserProfile" src/
   ```
   Verify none of them filter on `deleted_at IS NOT NULL` or otherwise expect tombstoned rows.
5. Inspect the `users_self_read` policy on the base table:
   ```sql
   select polname, polcmd, pg_get_expr(polqual, polrelid) as qual
   from pg_policy
   where polrelid = 'public.users'::regclass;
   ```
   This is INFORMATIONAL — do not modify the policy. Confirms why `security_invoker = on`
   is not an option.

Scope (files Sonnet may touch):
1. Emit the new idempotent SQL into the session log. The SQL MUST:
   - Use `CREATE OR REPLACE VIEW public.public_user_profiles` (idempotent).
   - Preserve the existing column list verbatim (copy from `pg_get_viewdef` output).
   - Add `WITH (security_invoker = false)` explicitly (no relying on defaults).
   - Add a multi-line SQL comment immediately above `CREATE OR REPLACE VIEW` referencing
     Task 268 and Task 266, listing the four facade-exception conditions from
     `rls-rules.md` and ticking each one for this view.
   - Add `WHERE deleted_at IS NULL` (or the verified equivalent) to the view body.
   - Preserve the existing GRANT (no GRANT change in this task).
2. Optional: if the live DB inspection reveals the view definition differs from what Task
   266 documented, append a "Drift note" subsection to the session log — but DO NOT
   "correct" anything else in the same migration. File a follow-up task instead.
3. Update `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` with:
   - The investigation outputs (queries above).
   - The "Security Advisor acknowledgement" subsection.
   - The "Files Changed" table per Task 264.
   - The Note 18 self-validation block (most lines are N/A for a SQL-only task — be explicit
     about which lines are N/A and why; do NOT skip the block).

Out of scope (do NOT touch):
- `users` table RLS policy (`users_self_read`) — preserve verbatim.
- The `get_listing_owner_contact` RPC — separate object; this task is the view only.
- Any other Security Advisor finding (file follow-up if you spot one; do not bundle fixes).
- Application code in `src/` — the view definition is the only change. No TypeScript types
  change (column list unchanged); no consumers change.
- `messages/*.json` — no user-facing text changes; locale parity is N/A.
- UI / responsive — no UI changes; breakpoint coverage is N/A.
- The `Public Schema GRANT Discipline` sibling rule from `rls-rules.md` — that is a separate
  existing-table audit task to be filed for Sprint 16+ (before 2026-10-30).

Acceptance criteria (literal):
- Live view definition inspected and inventoried in the session log (column list + GRANTs +
  security_invoker flag + base-table policy snapshot).
- Idempotent SQL emitted into the session log:
  - rationale SQL comment above `CREATE OR REPLACE VIEW`;
  - `WITH (security_invoker = false)` explicit;
  - `WHERE deleted_at IS NULL` (or verified equivalent) in the view body;
  - column list unchanged from current view;
  - GRANT preserved (no GRANT change in this task);
  - is re-runnable (CREATE OR REPLACE).
- All four facade-exception conditions from `rls-rules.md` are ticked in the session log
  with concrete evidence (column list = non-PII; WHERE filter present; GRANTs minimal;
  rationale comment present).
- `from('public_user_profiles')` consumers grep'd; none rely on tombstoned rows (or follow-up
  filed if any do).
- Session log file added at `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md`.
- "Files Changed" table per Task 264 (in this task: likely 2 files — the session log + the
  backlog update line).
- `docs/backlog.md` updated: Task 268 appears in "Last Session" or "Session Archive"; "Last
  task number" advanced to 268.
- Self-validation verdict line per Note 18 (tsc=0, AC table green, scope clean; build / runtime
  / locale / breakpoint lines marked N/A with reason where applicable).
- 0 new lint / typecheck errors.

Final report required from Sonnet:
1. Files changed (the table).
2. Inventory of live view definition (queries 1-5 from "Required investigation").
3. SQL migration (full text, ready for owner to paste into Supabase SQL Editor).
4. Four-condition facade-exception checklist with evidence per row.
5. Confirmation that no `src/` code changed.
6. Confirmation that the Security Advisor finding is being acknowledged, NOT switched to
   invoker mode.
7. Self-validation verdict line.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT run SQL. The
orchestrator will emit commit commands during review; the owner will run the SQL.
```

---

## Orchestrator decision — 2026-05-28 (post-STOP&ASK on condition 3)

The 2026-05-28 session log for Task 268 raised a STOP & ASK on the kickoff's
condition 3 (the literal `WHERE deleted_at IS NULL` filter). Three options were laid out:

- **Option A** — add `WHERE deleted_at IS NULL` to the view AND update `page.tsx` +
  `ListingContact.tsx` to derive `ownerDeleted` from a different signal (e.g.,
  `ownerRaw === null && !isGuest`). Requires coupled `src/` changes → out of Task 268
  SQL-only scope.
- **Option B** — keep tombstoned rows in the view; document condition 3 as
  "met in spirit" via a sub-rationale in `docs/rls-rules.md` → "Acknowledged Advisor
  Exceptions". No `src/` changes; closes Task 268 within its original SQL-only scope.
- **Option C** — remove `deleted_at` from the view SELECT list AND add
  `WHERE deleted_at IS NULL`. Same code-coupling problem as Option A.

**Decision: Option B.** Rationale:

1. **The `deleted_at` column is publicly-visible by design.** The listing-detail UI
   (`ListingContact.tsx:60` computes `ownerDeleted = !!(owner.deleted_at)`) uses it
   to render a distinct "account deleted" state. The signal is non-PII (a timestamp
   only) and is the correct public information to expose to an authenticated viewer
   of a listing whose seller has deleted their account.

2. **Adding `WHERE deleted_at IS NULL` would degrade UX without security gain.**
   Deleted owners would silently disappear from the view → `ownerRaw = null` → the
   `ownerDeleted` UI branch never fires → viewer sees the generic
   `ownerDataUnavailable` error instead of the accurate "account deleted" state.

3. **Condition 3's underlying principle is "limit rows to those the public is
   allowed to see".** Tombstoned rows ARE publicly-visible in this domain model.
   The literal example `WHERE deleted_at IS NULL` in the rule is the common case,
   not the only valid form. The view's column restriction (no email / no phone
   digits / no whatsapp digits / no tokens) is the access boundary; the row set is
   intentionally inclusive of tombstoned users to support the `ownerDeleted` UI.

4. **Option A would require coupled code changes** (file follow-up to update
   `page.tsx` + `ListingContact.tsx` to derive `ownerDeleted` from a different
   signal), which is out of Task 268's SQL-only scope and not justified by any
   security gain.

### Required follow-through (this completes Task 268)

1. **Update `docs/rls-rules.md`** → "Acknowledged Advisor Exceptions" → the
   `public.public_user_profiles` row → refine the "Rationale" column to add Option B
   sub-rationale. Concretely, append to that cell (after the existing rationale text):

   > Condition 3 (`rls-rules.md` "SECURITY DEFINER exception" → WHERE filter) is met
   > IN SPIRIT, not by a literal `WHERE deleted_at IS NULL`: tombstoned rows are
   > intentionally included because the `deleted_at` column is the publicly-visible
   > signal that drives the `ownerDeleted` UI branch on the listing detail page
   > (`ListingContact.tsx:60`). The view's column restriction (no PII) is the access
   > boundary; the row set is intentionally inclusive. Adding the literal WHERE
   > clause would degrade UX without security gain. Orchestrator decision recorded
   > 2026-05-28 in `tasks/Sprints/Sprint_15_kickoff_prompt_Task_268.md` (this file).

2. **Emit the FINAL SQL migration into the session log.** Same as the PARTIAL SQL
   already in the log, but with the inline rationale comment updated:
   - The line currently reading
     `-- 3. Explicit WHERE filter ......................................... ⚠️ STOP & ASK`
     becomes
     `-- 3. Explicit WHERE filter ......................................... ✅ MET IN SPIRIT (Option B)`
   - The two follow-up lines explaining the STOP & ASK rationale are replaced with
     a single line:
     `--    No literal WHERE clause — tombstoned rows kept for ownerDeleted UI.`
     `--    Sub-rationale documented in rls-rules.md "Acknowledged Advisor Exceptions".`
   - The trailing `-- WHERE deleted_at IS NULL: DEFERRED` comment in the view body
     is replaced with `-- (intentionally no WHERE — see rationale comment above)`.
   - Use `CREATE OR REPLACE VIEW` (idempotent — safe for owner to re-run; net delta
     vs the already-applied partial is only the comment text in the DDL).
   - `NOTIFY pgrst, 'reload schema';` may be omitted since the schema shape is
     unchanged (only DDL comments differ). Keep it if it makes the migration easier
     to reason about; it's harmless.

3. **Update the four-condition checklist in the session log:** condition 3 flips
   from `⚠️ STOP & ASK` to `✅ MET IN SPIRIT (Option B per orchestrator)`. Update
   the "Self-Validation" table likewise.

4. **Self-validation verdict line** flips from
   `⚠️ PARTIAL — … STOP & ASK on condition 3 blocks full SQL finalization`
   to
   `Self-validation: tsc=0 errors · build=N/A (SQL-only) · AC table=all green · runtime locale=N/A (no UI) · scope=clean`.

5. **`docs/backlog.md`** reflects Task 268 as closed (Sonnet's standard workflow —
   not the orchestrator's territory).

6. **"Files Changed" table** now lists three entries:
   - `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md`
     (existing session log — append the orchestrator-decision section + final SQL
     + updated checklist).
   - `docs/rls-rules.md` (the rationale-column refinement in §1 above).
   - `docs/backlog.md` (standard task-closure update).

### Out of scope for this amendment

- Any code change in `src/`. (Option A's coupled `page.tsx` + `ListingContact.tsx`
  rework is explicitly rejected.)
- Switching the view to `security_invoker = on`. (Would break listing-detail reads
  for any authenticated user looking at another user's listing — Task 266 design
  depends on definer semantics.)
- Adding the literal `WHERE deleted_at IS NULL` clause.
- Filing a separate follow-up task for Option A. Option B is the final decision; no
  follow-up.
- Cleanup of the duplicate base-table SELECT policy
  (`"Users can view own profile"` + `"users_self_read"` — Sonnet noted this in the
  §5 owner-provided investigation results). File a separate housekeeping kickoff
  if owner wants this collapsed; do NOT bundle it here.
- Backlog hygiene / rollback of orchestrator's earlier direct `docs/backlog.md`
  edits in the 2026-05-28 session. Separate housekeeping kickoff if needed.

Orchestrator: Opus 4.7. Decision recorded: 2026-05-28.

