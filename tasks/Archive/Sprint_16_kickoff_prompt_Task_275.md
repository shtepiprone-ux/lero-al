# Sprint 16 — Task 275 kickoff (Public Schema GRANT Discipline existing-table audit — SQL emission only)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: **"DB / server action / RLS task" bundle + "Schema / migration task" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0` if any `src/` touched — this task is SQL emission only, so tsc is N/A unless types change). Owner runs git; executor never runs git.

---

## Task 275 — Public Schema GRANT Discipline existing-table audit (SQL emission only)

```
Hard contract: see top.

Type:        audit + SQL emission (no src/ change unless drift surfaces)
Priority:    high (closes Supabase rollout deadline 2026-10-30 for existing-project enforcement)
Area:        DB / RLS / GRANT discipline / Supabase Data API exposure surface

GOAL: Audit every `public.*` table in the live DB against the per-role
GRANT discipline rule in `docs/rls-rules.md` → "Public Schema GRANT
Discipline" + "Per-role GRANT discipline". Emit a single SQL file with
all REVOKE / GRANT adjustments needed to bring existing tables into
compliance with the rule, in dependency-safe order. Do NOT apply the SQL —
the owner applies it in the Supabase SQL editor and re-runs
`npm run check:schema-drift` to confirm a clean tree.

This task closes the "existing-table audit" deadline embedded in
`docs/rls-rules.md` ("Existing tables keep their current grants until
2026-10-30. A separate audit task (Security Advisor → GRANT review)
must run before that date to confirm every `public.*` table that the
app reads via `supabase-js` has the matching GRANTs"). Supabase's
2026-10-30 enforcement makes a public.* table invisible to `supabase-js`
unless it has explicit GRANTs — so any table the app reads that is
missing the GRANT will start returning `42501` errors on enforcement day.
Conversely, any table that has OVER-permissive GRANTs (e.g. `select` to
`anon` when the table contains PII / private rows) is an exposure surface
that should be tightened NOW, not on enforcement day.

This is purely a DB audit + SQL emission task. Sonnet does NOT modify
`src/` unless the audit surfaces a query that depends on an
over-permissive GRANT and must be migrated to an RPC / view — in which
case STOP & ASK before making any `src/` change (separate kickoff likely).

Filed by: orchestrator (Opus 4.7) on 2026-05-28. Filed alongside
Task 273 (Cabinet reauth) and Task 274 (Captcha) as Sprint 16 Auth
Security Hardening + GRANT Discipline batch.

Pre-read (DB / server action / RLS + Schema / migration bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/data-access-rules.md → DB access patterns, RPC vs direct-select
                              conventions.
- docs/rls-rules.md       → THE canonical source:
                              - "Public Schema GRANT Discipline" section
                                (lines 122-176 as of 2026-05-28).
                              - "Per-role GRANT discipline" subsection
                                (lines 160-169).
                              - "Existing-table audit" subsection
                                (lines 171-176).
                              - "RPC EXECUTE Discipline" section (already
                                addressed in Task 269 — DO NOT re-audit
                                functions here; this task is about TABLE
                                grants).
                              - "Acknowledged Advisor Exceptions" table
                                (use this to skip exceptions already
                                acknowledged in Tasks 268/272 etc.).
- docs/domain-rules.md    → public-visibility predicates by table.
- docs/qa-rules.md        → schema-drift check workflow + when to run.
- docs/architecture.md    → module boundaries (helps decide whether a
                              table should be RPC-only).
- src/types/database.ts   → the canonical list of tables the app KNOWS
                              about. Cross-reference with the DB
                              `information_schema.tables` snapshot.
- scripts/schema-drift-check.sql → most recent drift snapshot the
                                    owner ran (per Task 247: 30 tables /
                                    284 cols as of 2026-05-28). Use as
                                    the baseline ground truth for the
                                    audit.

Current behavior to preserve:
- ALL existing GRANTs that the app actively depends on. The audit MUST
  NOT recommend REVOKING a GRANT that an existing `src/` query depends
  on UNLESS the kickoff explicitly authorises migrating that query to
  an RPC / view (this task does NOT authorise that — STOP & ASK if
  discovered).
- ALL existing RLS policies. This task is about GRANTs, not RLS.
- ALL existing data. SQL is REVOKE / GRANT only — no DML.
- The Acknowledged Advisor Exceptions table in `rls-rules.md` —
  exceptions listed there are intentional and stay as-is.

Required after behavior:

1. NEW audit document at
   `tasks/Sprints/Sprint_16_task_275_grant_audit.md` listing, for every
   `public.*` table in the DB:
   - Table name.
   - Current grants per role (`anon` / `authenticated` / `service_role`)
     — as observed in the DB via `information_schema.role_table_grants`.
   - Required grants per role (per `rls-rules.md` rule).
   - Delta: what needs to REVOKE / GRANT.
   - Risk classification:
     - 🟥 **HIGH** — table currently grants to a role that should NOT
       have access (e.g. `anon SELECT` on a PII-containing table that
       lacks a public-visibility RLS predicate).
     - 🟧 **MEDIUM** — table is missing a grant the app needs (will
       break on 2026-10-30 enforcement day).
     - 🟨 **LOW** — table has extra grant that is currently mitigated by
       RLS but should still be tightened for defense in depth.
     - ✅ **OK** — current grants match the rule; no action needed.
   - Justification — one sentence per table explaining the
     classification, with the rule citation.
   - Migration impact — does the audit recommend any `src/` change? If
     YES, the row says **STOP & ASK** in the action column.

2. NEW SQL file at `scripts/grant-discipline-audit.sql`:
   - Header comment block:
     - Date generated.
     - Source: Task 275 audit.
     - Table count audited.
     - Statement count.
     - Order: REVOKEs first (tightening), then GRANTs (loosening) — so
       the DB never enters an unsafe transient state.
   - One section per affected table, in order: HIGH → MEDIUM → LOW →
     (OK tables omitted; one summary comment at the bottom listing them).
   - Each statement explicit (no `GRANT ALL`; no wildcards).
   - Each statement preceded by a one-line comment citing the table +
     the classification + the rule.
   - Idempotent: every REVOKE / GRANT statement uses syntax that does
     not error on re-run.
   - Includes the necessary `NOTIFY pgrst, 'reload schema';` calls if
     any GRANT changes affect the schema cache.

3. NEW session log at
   `docs/sessions/2026-05-28-task-275-grant-discipline-audit.md`:
   - Audit methodology: how `information_schema.role_table_grants` was
     queried; what the baseline tree count was (28-30 tables per recent
     drift checks); how exceptions were skipped.
   - Summary stats: total tables audited, count per risk class,
     count of statements in the emitted SQL.
   - Top findings: which 5 tables are HIGH risk and why.
   - Cross-reference to `tasks/Sprints/Sprint_16_task_275_grant_audit.md`
     for the full per-table table.
   - Owner action: "Run `scripts/grant-discipline-audit.sql` in the
     Supabase SQL editor; then run `npm run check:schema-drift` to
     confirm a clean tree."
   - Files Changed table per Task 264.
   - Note 18 self-validation block (with N/A markers for runtime / UI
     / locale / breakpoint lines and reasons).

4. `docs/rls-rules.md` → "Existing-table audit" subsection updated:
   - Add a sentence at the end: "Audit run on 2026-05-28 as Task 275.
     See `tasks/Sprints/Sprint_16_task_275_grant_audit.md` for the
     per-table table and `scripts/grant-discipline-audit.sql` for the
     emitted SQL. Owner-applied on <DATE — leave blank for the owner to
     fill in when they apply the SQL>."

5. `docs/backlog.md` updated per standard task-closure workflow
   (advance "Last task number" to 275; add Last Session note; add
   Session Archive row).

Positive flow (happy path):
- Sonnet queries the DB (read-only, via `npm run check:schema-drift`
  output OR via Supabase SQL editor query — owner-provided dump). For
  every table, captures current grants per role.
- Sonnet cross-references each table against the rule:
  - `anon` should have SELECT only, and only if the table has a public-visibility RLS predicate.
  - `authenticated` should have the GRANTs matching its access pattern (read-only OR DML, depending on the table's role in the app).
  - `service_role` always full.
  - Tables that should be RPC/view-only (e.g. tables with PII whose access goes through `get_listing_owner_contact` per Task 266/269) should REVOKE all `anon` / `authenticated` grants.
- For each delta, Sonnet emits the corresponding REVOKE / GRANT statement.
- Sonnet writes the audit doc + the SQL file + the session log + the rls-rules.md update + the backlog entry.
- All deliverables consistent: stats in session log = row count in audit doc = statement count in SQL.

Negative flow (every off-happy-path branch):
- **A table's audit reveals the app depends on an over-permissive GRANT** (e.g. an admin component selects from a PII table directly with the `anon` role, somehow). STOP & ASK. Capture the dependency, list the affected `src/` file:line, do NOT emit a REVOKE that would break the app. Open the discussion in the session log with the orchestrator for a follow-up decision (likely: migrate the query to an RPC in a separate task, then re-emit the REVOKE).
- **A table is listed in Acknowledged Advisor Exceptions** (e.g. `email_change_tokens` is intentionally locked down with no GRANTs to anon/authenticated — already correct). Mark as ✅ OK; do NOT recommend changes; cite the exception row in the audit.
- **A table exists in the DB but is missing from `src/types/database.ts`** (drift). STOP & ASK. This is a schema-drift issue that pre-dates this task; report it separately so it can be fixed in a dedicated task. Do NOT auto-add missing types.
- **A table exists in `src/types/database.ts` but NOT in the DB** (negative drift). STOP & ASK. Same — surface the discrepancy; do not emit DROP statements.
- **The owner has not provided a fresh DB grant dump and the Cowork sandbox cannot reach the DB** — STOP & ASK. The owner runs the audit query in the Supabase SQL editor and pastes the output for Sonnet to consume. Without the live grant dump, the audit cannot proceed accurately.
- **A table has an RLS policy but no GRANT to the role the policy targets** — emit the GRANT. (The policy is dead code without the GRANT; the rule mandates both.)
- **A table has a GRANT but no RLS policy targeting that role** — this is the dangerous case. If the role is `anon` or `authenticated`, RLS is required. Either: (a) classify as HIGH and emit a REVOKE; OR (b) STOP & ASK for whether RLS should be added (separate kickoff). Default to (a) unless the audit shows the table genuinely needs that role's access.
- **An RPC-only table (per `rls-rules.md` — e.g. `users`) has direct GRANTs to `anon` or `authenticated`** — emit REVOKEs. Verify (grep `src/`) that no direct `from('users').select(...)` exists for those roles; if it does, STOP & ASK.
- **Statements in the SQL file would deadlock or sequence-fail (e.g. revoking a grant that's currently being used by an open connection)** — owner runs the SQL during a low-traffic window; document this in the session log's owner-action paragraph.
- **NOTIFY pgrst, 'reload schema' is needed but omitted** — every GRANT change that adds/removes a table from `anon`/`authenticated`'s catalog visibility requires the reload. Add at the bottom of the SQL file with a comment.
- **Audit doc is empty** (no deltas needed — every table already complies) — still emit the doc with the ✅ OK summary, emit a SQL file with just a header comment "no changes required", update rls-rules.md with the audit-date note. The task is still "complete" — the audit ran and confirmed compliance.

Required investigation (paste outputs into the Task 275 session log):

1. List every `public.*` table currently in the DB. Owner-run query
   (paste output into session log):
   ```sql
   select tablename
   from pg_tables
   where schemaname = 'public'
   order by tablename;
   ```

2. Dump current grants for every `public.*` table. Owner-run query
   (paste output into session log):
   ```sql
   select grantee, table_name, privilege_type
   from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee in ('anon', 'authenticated', 'service_role')
   order by table_name, grantee, privilege_type;
   ```

3. List every RLS policy + the role it targets. Owner-run query (paste
   output into session log):
   ```sql
   select tablename, policyname, roles, cmd
   from pg_policies
   where schemaname = 'public'
   order by tablename, policyname;
   ```

4. Cross-reference: for every table the app SELECTs directly via
   `supabase-js`, grep `src/`:
   ```
   grep -rn "\.from(['\"]<table>['\"])" src/ --include="*.ts" --include="*.tsx"
   ```
   (Run per-table or once with a broad regex; capture which tables are
   directly read by client code.)

5. Cross-reference with `src/types/database.ts` for drift:
   ```
   grep "^export interface" src/types/database.ts
   ```

6. Check the "Acknowledged Advisor Exceptions" table in
   `docs/rls-rules.md` for tables to skip:
   ```
   grep -A 1 "Acknowledged Advisor Exceptions" docs/rls-rules.md | head -40
   ```

Scope (files Sonnet may touch):

1. `tasks/Sprints/Sprint_16_task_275_grant_audit.md` — NEW per-table audit doc.
2. `scripts/grant-discipline-audit.sql` — NEW SQL file with REVOKE / GRANT statements + NOTIFY.
3. `docs/sessions/2026-05-28-task-275-grant-discipline-audit.md` — NEW session log per Task 264.
4. `docs/rls-rules.md` — append one sentence to "Existing-table audit" subsection.
5. `docs/backlog.md` — standard task-closure update.

Out of scope (do NOT touch):
- Any `src/` file (unless the audit surfaces a dependency that REQUIRES migration to an RPC — then STOP & ASK; do NOT auto-fix).
- Any RLS policy (this task is about GRANTs, not policies).
- Any function (RPC EXECUTE discipline was Task 269; do NOT re-audit functions here).
- `src/types/database.ts` (do NOT auto-add missing types if drift is found; STOP & ASK).
- Apply the SQL (owner-only).
- Acknowledged Advisor Exceptions table contents (do NOT modify; only consult).
- Locale message files (no UI change).

Acceptance criteria (literal):
- `tasks/Sprints/Sprint_16_task_275_grant_audit.md` exists with one row per `public.*` table currently in the DB, classifying each (HIGH / MEDIUM / LOW / OK) with current-vs-required grants and a one-sentence justification.
- `scripts/grant-discipline-audit.sql` exists with REVOKE → GRANT order, idempotent statements, one comment per statement, and (if any GRANT changes catalog visibility) a `NOTIFY pgrst, 'reload schema';` at the end.
- `docs/sessions/2026-05-28-task-275-grant-discipline-audit.md` exists with the methodology, summary stats, top-5 HIGH-risk findings, cross-reference to the audit doc, owner-action paragraph, Files Changed table (5 files), Note 18 self-validation block.
- `docs/rls-rules.md` "Existing-table audit" subsection has one new sentence noting the audit ran on 2026-05-28 with cross-references.
- `docs/backlog.md` updated: "Last task number: 275"; Last Session note for Task 275; Session Archive row.
- Stats consistency: rows in audit doc = statement count in SQL (modulo OK rows which don't get statements) = numbers in session log.
- AC self-audit table in session log: every AC bullet → file:line OR runtime check → ✅.
- Self-validation verdict line:
  `Self-validation: tsc=N/A (no src/) · build=N/A (no src/) · AC table=all green · runtime=N/A (SQL only) · scope=clean`.
- NO `src/` files touched UNLESS the audit forced a STOP & ASK that the orchestrator approved on the spot (none expected).
- NO actual SQL execution; the file is emission only.

Final report required from Sonnet:
1. Files Changed table (5 files expected, or 4 if no changes required and the rls-rules.md cross-reference replaces the audit doc).
2. Audit summary: HIGH / MEDIUM / LOW / OK counts.
3. Top 5 HIGH-risk findings with table + delta + rule citation.
4. STOP & ASK list (any tables that need orchestrator decision before SQL emission).
5. Owner-action instruction: "Apply `scripts/grant-discipline-audit.sql` in Supabase SQL editor; verify via `npm run check:schema-drift`."
6. Self-validation verdict line.
7. Confirmation that NO `src/` file was touched.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
apply the SQL. Do NOT modify any RLS policy. Do NOT modify any
function. Do NOT modify any `src/` file.
```
