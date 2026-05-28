# Sprint 16 — Task 272 kickoff (Task 268 doc-gap closure: rls-rules.md Option B sub-rationale + session-log SQL comment cleanup)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: "Docs-only / governance" bundle. No SQL emitted to owner (the production view is already correct from Task 268 Option B). No `src/` code change. No locale change. No UI change. Owner runs git; executor never runs git.

---

## Task 272 — Task 268 doc-gap closure: Option B sub-rationale propagation

```
Hard contract: see top.

Type:        chore (docs hygiene)
Priority:    low (pure documentation cleanup; runtime is correct)
Area:        docs / governance

GOAL: Close two documentation gaps left open after Task 268 shipped with orchestrator
Option B. The production view is correct and the Security Advisor finding is properly
acknowledged in the session log, but two surfaces still show stale "STOP & ASK / DEFERRED"
language that contradicts the final decision:

  (gap 1) `docs/rls-rules.md` → "Acknowledged Advisor Exceptions" → row for
          `public.public_user_profiles` → "Rationale" cell does NOT yet contain the
          Option B sub-rationale (the explanation of WHY condition 3 is met-in-spirit
          without a literal `WHERE deleted_at IS NULL`). Anyone reading this table six
          months from now will see only the original generic rationale and not understand
          why the WHERE clause is intentionally absent.

  (gap 2) `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` →
          the "Emitted SQL" section header still reads "(PARTIAL — pending orchestrator
          decision on condition 3)" and the inline SQL comments still contain the
          original "⚠️ STOP & ASK" / "WHERE deleted_at IS NULL: DEFERRED" text.
          The condition-3 status in the SAME file's "Four-Condition Facade-Exception
          Checklist" already shows ✅ Option B, so the SQL block contradicts the rest of
          the document.

This task is pure documentation cleanup. NO production view change. NO `src/` change.
NO new SQL emitted for the owner to run.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — follow-up to close the gap left by
Task 268's amendment. The amendment was placed outside the prompt code-block in the
Task 268 kickoff (orchestrator structural mistake), which caused Sonnet to execute only
part of the required follow-through (checklist + verdict line + backlog) but not the
rls-rules.md row refinement or the SQL-comment cleanup.

Pre-read (Docs-only / governance bundle from docs/rule-index.md):
- docs/agent-contract.md
- docs/backlog.md
- docs/rls-rules.md → "Acknowledged Advisor Exceptions" — the row being refined
- docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md — the
  session log being patched. Read the entire file: the orchestrator-decision rationale
  is captured at the top ("✅ OPTION B — Chosen by orchestrator") and at the bottom
  of the kickoff (Task 268 file → "Orchestrator decision — 2026-05-28" section). The
  Option B sub-rationale text below is also a clean source.
- tasks/Sprints/Sprint_15_kickoff_prompt_Task_268.md → "Orchestrator decision —
  2026-05-28 (post-STOP&ASK on condition 3)" section — the canonical text of the
  Option B decision.

Current behavior to preserve:
- Production DB view `public.public_user_profiles` — DO NOT MODIFY. Already correct
  (Option B applied; no WHERE clause; rationale comment present in DDL).
- Security Advisor finding `0010_security_definer_view` on the view — REMAINS by design
  as an acknowledged exception.
- All other rows in the "Acknowledged Advisor Exceptions" table — DO NOT MODIFY.
- All other sections of the Task 268 session log — DO NOT MODIFY (the four-condition
  checklist already shows ✅ Option B; the "✅ OPTION B" header at the top is correct;
  the self-validation verdict is correct).
- All references in `src/` — DO NOT TOUCH (this is a docs-only task).

Required after behavior:

1. `docs/rls-rules.md` → "Acknowledged Advisor Exceptions" → row for
   `public.public_user_profiles` updated:

   - The "Rationale" cell ADDS this sentence at the end (after the existing rationale
     text — do not delete the existing rationale, append):

     > Condition 3 (`WHERE` filter) is met IN SPIRIT, not by a literal
     > `WHERE deleted_at IS NULL`: tombstoned rows are intentionally included because the
     > `deleted_at` column is the publicly-visible signal that drives the `ownerDeleted`
     > UI branch on the listing detail page (`ListingContact.tsx:60`). The view's column
     > restriction (no PII) is the access boundary; the row set is intentionally
     > inclusive of tombstoned users. Adding the literal `WHERE` clause would degrade
     > UX without security gain. Orchestrator decision Option B recorded 2026-05-28.

   - The "Established by" cell — keep the existing reference but make it accurate to
     what shipped. Replace the parenthetical
     `Task 266 (creation) / Task 268 (acknowledgement + rationale comment + WHERE filter)`
     with
     `Task 266 (creation) / Task 268 (acknowledgement + rationale comment, no WHERE per Option B) / Task 272 (sub-rationale doc-gap closure)`.

2. `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` →
   "Emitted SQL" section updated:

   - Section header changes from
     `## Emitted SQL (PARTIAL — pending orchestrator decision on condition 3)`
     to
     `## Emitted SQL (FINAL — Option B applied; owner-applied 2026-05-28)`.

   - The intro paragraph immediately under the header changes from
     `The SQL below adds the rationale comment and makes security_invoker = false explicit. The WHERE clause is **left out** pending the STOP & ASK resolution. Owner should NOT apply this until the orchestrator resolves Option A vs B.`
     to
     `The SQL below adds the rationale comment and makes security_invoker = false explicit. NO literal WHERE clause — Option B (per orchestrator 2026-05-28); the deleted_at column is the publicly-visible signal for the ownerDeleted UI branch. Owner applied this on 2026-05-28.`

   - Inside the SQL code block, the lines:
     ```
     -- 3. Explicit WHERE filter ......................................... ⚠️ STOP & ASK
     --    WHERE deleted_at IS NULL would break the ownerDeleted UI branch
     --    (ListingContact.tsx:60 checks owner.deleted_at for "account deleted" state).
     --    Orchestrator must resolve before applying. See Task 268 session log.
     ```
     become:
     ```
     -- 3. Explicit WHERE filter ......................................... ✅ MET IN SPIRIT (Option B)
     --    No literal WHERE clause — tombstoned rows kept for ownerDeleted UI branch.
     --    Sub-rationale documented in rls-rules.md "Acknowledged Advisor Exceptions".
     ```

   - Inside the SQL code block, the line:
     ```
     -- WHERE deleted_at IS NULL: DEFERRED — see STOP & ASK above (condition 3)
     ```
     becomes:
     ```
     -- (intentionally no WHERE — see rationale comment above; tombstoned rows kept for ownerDeleted UI)
     ```

   - All other lines inside the SQL block — UNCHANGED. The `CREATE OR REPLACE VIEW`
     statement, the column list, the `WITH (security_invoker = false)`, the
     `NOTIFY pgrst, 'reload schema';` — all preserved verbatim.

3. `docs/backlog.md` updated per the standard task-closure workflow (Task 264 contract):
   advance `Last task number` to 272; add a row to the Session Archive table OR a brief
   Last Session note referencing Task 272 closure. Follow the existing
   "Backlog & Session Log Rules" in `docs/ai-behavior.md` — do NOT bloat the backlog.

4. NEW session log added at
   `docs/sessions/2026-05-28-task-272-task-268-doc-gap-closure.md`:
   - Short context paragraph: what gap was closed and why.
   - Before / after diff for the rls-rules.md row (paste both versions for review).
   - Before / after diff for the session-log SQL block (paste both snippets).
   - "Files Changed" table per Task 264.
   - Note 18 self-validation block (with N/A markers for runtime / build / locale /
     breakpoint lines and reasons).

Positive flow (happy path):
- Sonnet reads the Task 268 session log to confirm the current state.
- Sonnet edits `rls-rules.md`: appends the Option B sub-rationale to the
  `public.public_user_profiles` row's Rationale cell + corrects the Established-by cell.
- Sonnet edits the Task 268 session log: changes section header + intro paragraph + the
  two comment blocks inside the SQL.
- Sonnet creates the Task 272 session log with before/after diffs + Files Changed.
- Sonnet updates `docs/backlog.md`: Task counter advances, brief closure note.
- All three text-only changes pass tsc (no src/ touched anyway).

Negative flow (every off-happy-path branch):
- **The existing rls-rules.md row text differs from what's expected** (e.g. someone has
  already edited it after Task 268 shipped): STOP & ASK. Do NOT overwrite a divergent
  state without orchestrator review. Paste the current state of the cell into the
  session log and stop.
- **The Task 268 session log has already been edited by someone else** (e.g. the SQL
  block text differs from what's quoted in this kickoff): STOP & ASK. Do NOT proceed
  with the find-and-replace blindly. Paste current state and stop.
- **An additional row exists in the Acknowledged Advisor Exceptions table that
  references the same view**: STOP & ASK. This kickoff assumes one row per
  view/finding pair.
- **Re-running this task** (idempotency): editing the file twice would either be a
  no-op (text already matches the "after" state) OR introduce a duplicate sentence
  (the Option B sub-rationale would be appended twice). Sonnet MUST grep for the
  Option B sub-rationale phrase in `rls-rules.md` BEFORE appending. If
  "Option B recorded 2026-05-28" already appears in the file, the rls-rules.md edit is
  already done; skip it but still report it in the Files Changed table as "verified, no
  change needed".
- **Backlog hygiene violation** (backlog growing past ~80 lines of active content): if
  the backlog is near the limit, prefer adding a Session Archive row over expanding the
  Last Session block. Follow `docs/ai-behavior.md` → "Backlog & Session Log Rules".
- **Trying to edit the production view** (e.g. running SQL): forbidden. This task is
  pure docs. The view is already correct.

Required investigation (paste outputs into the Task 272 session log):

1. Confirm current state of the rls-rules.md row before editing:
   ```
   grep -n -A 3 "public.public_user_profiles" docs/rls-rules.md
   ```
   Paste the matched row(s) verbatim. If the row already contains "Option B recorded
   2026-05-28", report the file as "no change needed" and skip edit #1.

2. Confirm current state of the Task 268 session log SQL block before editing:
   ```
   grep -n "STOP & ASK\|DEFERRED\|Emitted SQL (PARTIAL" docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md
   ```
   If zero hits, the SQL block is already cleaned up; report and skip edit #2.

3. Confirm baseline backlog state:
   ```
   grep -n "Last task number" docs/backlog.md
   ```
   Confirm the current "Last task number" line so the increment lands on the right value.

Scope (files Sonnet may touch):

1. `docs/rls-rules.md` — ONLY the one row in "Acknowledged Advisor Exceptions"
   table for `public.public_user_profiles`. Do not edit any other table row, any other
   section, any other rule.
2. `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` — ONLY
   the "Emitted SQL" section's header, intro paragraph, and the two comment blocks
   inside the SQL fence. All other sections (✅ OPTION B header, Original STOP & ASK
   [RESOLVED], Owner-Provided Investigation, Required Investigation, Consumer Analysis,
   View Definition, Four-Condition Facade-Exception Checklist, Security Advisor
   Acknowledgement, Files Changed table — except Sonnet may want to append a single
   row noting Task 272 update if it improves traceability — Self-Validation) — DO NOT
   modify.
3. `docs/sessions/2026-05-28-task-272-task-268-doc-gap-closure.md` — new file per
   Task 264 contract.
4. `docs/backlog.md` — standard task-closure update only.

Out of scope (do NOT touch):
- Production view (already correct).
- Any other `docs/rls-rules.md` row.
- Any other section of the Task 268 session log beyond the Emitted SQL block.
- Any `src/` file.
- Any locale message file.
- Any UI / responsive concern.
- Filing follow-ups for the duplicate `users` table SELECT policy noted in the Task 268
  investigation (`"Users can view own profile"` + `"users_self_read"`). That is a
  separate housekeeping kickoff if owner decides it's worth filing.
- Backlog rollback of any orchestrator's earlier direct edits in the 2026-05-28 session.
  Separate hygiene kickoff if owner decides.

Acceptance criteria (literal):
- `docs/rls-rules.md` "Acknowledged Advisor Exceptions" row for
  `public.public_user_profiles` contains the Option B sub-rationale paragraph appended
  to the Rationale cell (verbatim text from Required after behavior §1) AND the
  Established-by cell is updated to the new triplet of task references.
- `docs/sessions/2026-05-28-task-268-...` "Emitted SQL" section: header reads "FINAL —
  Option B applied; owner-applied 2026-05-28"; intro paragraph rewritten verbatim per
  §2; the two comment blocks inside the SQL fence rewritten verbatim per §2.
- All other sections of the Task 268 session log preserved verbatim (verify via diff
  read).
- New session log `2026-05-28-task-272-task-268-doc-gap-closure.md` exists with: short
  context, before/after diffs (rls-rules.md row + SQL block snippets), Files Changed
  table, Note 18 self-validation block.
- `docs/backlog.md` updated: `Last task number: 272`, closure note for Task 272.
- AFTER-grep: `grep -n "STOP & ASK\|DEFERRED" docs/sessions/2026-05-28-task-268-...md`
  returns 0 hits OR only hits in the "[RESOLVED: Option B]" header (which is intentional
  history; do NOT remove the [RESOLVED] header). Paste output into session log to prove.
- AFTER-grep: `grep -c "Option B recorded 2026-05-28" docs/rls-rules.md` returns exactly
  1.
- "Files Changed" table per Task 264 lists exactly: `docs/rls-rules.md`,
  `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md`,
  `docs/sessions/2026-05-28-task-272-task-268-doc-gap-closure.md`,
  `docs/backlog.md`. Four files, no `src/` files, no others.
- Self-validation verdict line:
  `Self-validation: tsc=0 errors (no src/ touched) · build=N/A (docs only) · AC table=all green · runtime locale=N/A · scope=clean`.
- 0 new lint/typecheck errors.

Final report required from Sonnet:
1. Files Changed table (4 files expected).
2. BEFORE / AFTER diff for the rls-rules.md row.
3. BEFORE / AFTER diff for the session-log SQL block.
4. AFTER-grep evidence (zero STOP&ASK/DEFERRED outside the [RESOLVED] header; exactly
   1 occurrence of "Option B recorded 2026-05-28" in rls-rules.md).
5. Confirmation that the production view was NOT modified (no SQL emitted, no SQL
   pasted in this session log).
6. Self-validation verdict line.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT run SQL. Do NOT
emit any new SQL for the owner. The view in production is already correct.
```
