# Session Log — Task 641: `companies` de-dup + normalized UNIQUE index

**Date:** 2026-07-20
**Executor:** Sonnet (execute-task skill)
**Task file:** `tasks/kickoff_prompt_Task_641_Companies_Dedup_And_Unique_Index.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (script authored; DRY-RUN pending owner)

## Requirement ledger and evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 | Section A strictly read-only; lists duplicate groups with keeper/loser + per-loser reference counts; enumerates ALL FKs referencing `companies(id)` from the live catalog | `scripts/task-641-companies-dedup-and-unique-index.sql` A1 (catalog FK enumeration via `information_schema.table_constraints`/`key_column_usage`/`constraint_column_usage`), A2 (duplicate groups + KEEPER/LOSER role via `row_number()`), A3 (per-loser `users.company_id` reference count) — all three are pure `SELECT`s, no DML/DDL |
| R2 | Section B, in one `BEGIN…COMMIT`: picks one keeper per group (earliest `created_at`, tie-break lowest `id`), re-points every referencing FK to the keeper, deletes losers, in-transaction zero-duplicate verification before `COMMIT` | Section B: `BEGIN;` → temp mapping table (Step 1) → `UPDATE users … SET company_id = keeper_id` (Step 2) → `DELETE FROM companies … WHERE id = loser_id` (Step 4) → `DO $$ … RAISE EXCEPTION … $$` verification (Step 5) → `COMMIT;` |
| R3 | Section B atomic/reversible until `COMMIT`; never deletes a still-referenced row (re-point precedes delete); doesn't touch non-duplicate companies; rollback note included | Step 2 (`UPDATE`) precedes Step 4 (`DELETE`) in source order; the merge-map temp table only contains loser ids (`WHERE rn > 1`), so companies with a unique normalized name never appear in any statement; explicit rollback instructions in the Section B header comment and after the `DO` block |
| R4 | Section C creates `UNIQUE INDEX companies_name_norm_uniq ON companies (lower(btrim(name)))`, `IF NOT EXISTS`, standalone (no `CONCURRENTLY` used, so no transaction conflict), verifies index existence + commented 23505 proof | `CREATE UNIQUE INDEX IF NOT EXISTS companies_name_norm_uniq ON companies (lower(btrim(name)));` + `pg_indexes` verification SELECT + commented `INSERT` that documents the expected `23505` |
| R5 | Index expression equals the app normalization `lower(btrim(name))` (case/whitespace only); decision stated; accent variant flagged with the required `createCompanyAction` follow-up if elected | File header + Section C: default variant matches exactly; disabled `unaccent` variant is present but commented out, with an explicit note that enabling it requires `CREATE EXTENSION unaccent` AND a `createCompanyAction` follow-up (not done here) |
| R6 | Follows `scripts/task-NNN-*.sql` convention (header comment, DDL/DML, verification SELECT); UTF-8 no-BOM; valid SQL; self-documenting RUN ORDER labels | File header matches the `task-314`/`task-319` precedent format; three sections labelled `RUN ORDER 1/2/3` with `⚠️ STOP` review banners between them; file-integrity check below |

## Script structure

- **Section A (RUN ORDER 1, read-only DRY-RUN):**
  - **A1** — catalog-driven FK enumeration (`information_schema` joins on `constraint_type = 'FOREIGN KEY'` and `ccu.table_name = 'companies'`), so a DB-level FK not visible in the TypeScript types cannot be missed.
  - **A2** — every `lower(btrim(name))` duplicate group, each member's id/name/logo_url/created_at, `KEEPER`/`LOSER` role, and group size.
  - **A3** — per-loser `users.company_id` reference count, with an inline instruction to extend the SELECT list if A1 reveals any additional referencing column.
- **Section B (RUN ORDER 2, transaction-wrapped mutation):** `BEGIN` → build a `CREATE TEMP TABLE … ON COMMIT DROP` loser→keeper mapping (empty when there are no duplicates, making every following statement a safe no-op) → re-point `users.company_id` (Step 2, with a commented TEMPLATE for any additional FK column) → optional, disabled-by-default denormalized `company_name`/`company_logo_url` refresh (Step 3) → delete loser rows (Step 4, strictly after the re-point) → in-transaction verification via a `DO $$ … RAISE EXCEPTION … $$` block that aborts the transaction if any normalized duplicate remains (Step 5) → `COMMIT` → a second, out-of-transaction duplicate-count SELECT as an extra confirmation.
- **Section C (RUN ORDER 3, unique index):** `CREATE UNIQUE INDEX IF NOT EXISTS companies_name_norm_uniq ON companies (lower(btrim(name)))` (no `CONCURRENTLY` — the table is small test data, so a plain index build is fine and needs no special transaction handling) → `pg_indexes` existence verification → commented duplicate-insert proof (`23505`) → disabled `unaccent`-based variant with its required `createCompanyAction` follow-up spelled out in comments.

Between each section, an `⚠️ STOP` banner tells the owner exactly what to review before continuing (A1's FK list is only `users.company_id`; A2/A3 assignments look right; Section B committed cleanly and the post-commit duplicate check returned 0 rows).

## Normalization decision and keeper rule

- **Normalization:** `lower(btrim(name))` — case-insensitive, whitespace-trimmed, **not** accent-insensitive. This is the case/whitespace-only default the task specified, and it is byte-identical to Task 640's shipped app-level check (`name.trim().toLowerCase()`). No `unaccent` extension is enabled by default.
- **If the owner later elects accent-insensitivity:** the disabled variant at the end of Section C (`unaccent(name)`) is ready to uncomment, but doing so requires (a) `CREATE EXTENSION IF NOT EXISTS unaccent` and (b) a follow-up task to change `createCompanyAction`'s JS-side lookup, because JavaScript's `.toLowerCase()` has no accent-folding equivalent to SQL `unaccent()` — enabling the DB variant without that follow-up would let the app-level check and the DB constraint disagree. This script does **not** silently choose accent-insensitivity; it states the decision and its cost, per R5/the task's "open decision" instruction.
- **Keeper rule:** for each normalized-name group, the row with the earliest `created_at` is kept; ties break on the lowest `id`. This preserves the original/oldest row. Stated in the file header and inline above Section B's temp-table query.

## Known FK and catalog-driven discovery

- **Known application FK:** `users.company_id` (`src/types/database.ts` `User.company_id: string | null`). Section B's Step 2 explicitly re-points this column.
- **Catalog-driven discovery (not hardcoded):** Section A's A1 query does not rely on the TypeScript types — it queries `information_schema.table_constraints` / `key_column_usage` / `constraint_column_usage` for every `FOREIGN KEY` constraint whose target is `companies(id)`, so any DB-level FK invisible in the app's type file would still surface before the owner runs Section B. If A1 returns anything beyond `users.company_id`, Section B includes a commented `[TEMPLATE]` `UPDATE` block for the owner/executor to fill in and enable before running the mutation.
- Confirmed via `schema-drift-check.sql` and `src/types/database.ts` that `companies` has exactly 4 columns (`id`, `name`, `logo_url`, `created_at`) and that `public_user_profiles.company_name` is a denormalized view column, not a separate FK — it auto-reflects `users` and needs no action.

## Owner run-order (exact instructions, restated from the script)

1. **Run Section A only** (three `SELECT`s — A1, A2, A3) in the Supabase SQL editor. Read-only; nothing is mutated.
2. **Review the output** and confirm: A1 lists only `users.company_id` (if it lists anything else, extend Section B's TEMPLATE block first); A2's keeper/loser assignment per group is correct (oldest row kept); A3's reference counts match expectations. **Return this output to the orchestrator/owner for review before proceeding** — this task cannot be marked "applied" until that review happens.
3. **Run Section B as one submission** (the entire `BEGIN … COMMIT` block, including the verification `DO` block) — not statement-by-statement, since the `DO` block's automatic-abort-on-duplicate behavior depends on running inside the same transaction as the merge. If the `DO` block raises (duplicates remain after the merge — should not happen given the grouping logic, but is the safety net), the transaction is already aborted; run `ROLLBACK` explicitly and stop to investigate rather than attempting `COMMIT`. After a clean `COMMIT`, the script's own post-commit `SELECT … HAVING count(*) > 1` should return 0 rows — confirm this before moving on.
4. **Run Section C** only after step 3's 0-row confirmation: creates the unique index, verifies it exists via `pg_indexes`. From this point, `createCompanyAction`'s dormant `23505` fallback (Task 640) is live — any future duplicate insert attempt is caught and surfaced as the friendly "already exists" toast instead of a raw DB error.

## Rollback note

Section B is a single transaction. Any change made by Steps 1–5 is visible only within that transaction until `COMMIT` runs. If the owner is unsure about the Step-5 verification result, or wants to abort before committing, `ROLLBACK;` discards the entire merge (temp table, `users.company_id` re-points, and `companies` deletes) with zero persisted effect. Section C's `CREATE UNIQUE INDEX` is independent DDL and only runs after Section B has already committed successfully.

## Validation evidence

1. **SQL inspection (executor, no local `psql`/SQL parser available in this sandbox — confirmed via `which psql` and probing for `pg-query-parser`/`node-sql-parser` node packages, neither present):**
   - Section A: all three statements are `SELECT`s only — no `INSERT`/`UPDATE`/`DELETE`/DDL keyword appears in Section A.
   - Section B: `BEGIN` opens the transaction; Step 2 (`UPDATE users`) precedes Step 4 (`DELETE FROM companies`) in source order — no referencing row can be orphaned; the `DO $$ … $$` verification block runs before `COMMIT`; the merge-map temp table's `WHERE rn > 1` scoping means only loser rows are ever touched by the `UPDATE`/`DELETE`, never a company with a unique normalized name.
   - Section C: `CREATE UNIQUE INDEX IF NOT EXISTS companies_name_norm_uniq ON companies (lower(btrim(name)))` matches Task 640's `trim().toLowerCase()` normalization exactly; no `CONCURRENTLY` is used, so no "standalone statement outside a transaction" conflict applies; the `unaccent` variant is present but fully commented out (disabled by default).
   - File-integrity script (below): balanced parentheses (96 open / 96 close) and balanced `$$` dollar-quote pairs (1 pair, for the single `DO $$ … $$` block) — both consistent with syntactically well-formed SQL.
2. `npm run check:mojibake` → **0 artifacts in 1823 files** (new script included in the scan).
3. File-integrity spot-check (executor, Node):
   ```
   bytes: 12290  BOM: false  NUL byte present: false
   parens open/close: 96 96
   dollar-quote count (should be even): 2
   ```
   UTF-8, no BOM, no NUL bytes, balanced structural delimiters.
4. `git status --short`:
   ```
   ?? scripts/task-641-companies-dedup-and-unique-index.sql
    M docs/backlog.md
   ?? docs/sessions/2026-07-20-task641-companies-dedup-and-unique-index.md
   ```
   Only the new SQL script plus the backlog/session-log pair — no app-code, TypeScript, or i18n file touched. `createCompanyAction`, `CompanyField`, `AdminCompaniesManager` are byte-identical to `HEAD`.
5. **No SQL was executed by the agent.** No `psql` connection, no Supabase MCP/CLI call, no database access of any kind was made in this session. The script has never been run against any database.
6. **No mutating git command was run or emitted by the agent** — only read-only inspection (`git status`, `git diff` semantics via the tools above).

### Owner-native DRY-RUN handoff (required before B/C)

Per the task's Q4 verification plan, this task cannot be marked "applied" — only "authored + DRY-RUN handed off." Handoff instruction for the owner:

1. Open the Supabase SQL editor for the project.
2. Run **Section A only** (statements A1, A2, A3 — read-only) from `scripts/task-641-companies-dedup-and-unique-index.sql`.
3. Return the three result sets (FK enumeration, duplicate groups with keeper/loser roles, per-loser reference counts) for orchestrator/owner review.
4. Only after that review confirms the plan is correct, run Section B (as one submission, per the run-order above), confirm the post-commit 0-duplicate check, then run Section C.

## Self-review findings

- Re-read the full file after writing it: confirmed Section A contains zero mutating keywords; confirmed Section B's `UPDATE` (re-point) textually precedes its `DELETE` (Step 4) and that the verification `DO` block precedes `COMMIT`; confirmed the merge-map CTE's `WHERE rn > 1` filter means the temp table is empty when there are no duplicates, so Section B is a safe no-op in that case (satisfies the "no duplicates exist" negative-flow branch); confirmed Section C uses `IF NOT EXISTS` and no `CONCURRENTLY`.
- Verified against `src/modules/companies/actions.ts` that the app's `23505` fallback branch already exists (added by Task 640) and needs no change — this script's Section C is exactly what activates it.
- Verified against `src/types/database.ts` and `scripts/schema-drift-check.sql` that `companies` has exactly the 4 columns assumed (`id`, `name`, `logo_url`, `created_at`) and that `users.company_id` is the only application-level FK; Section A's A1 query is the authoritative, catalog-driven confirmation the owner will see before B runs.
- No defects found in the authored script. The only open item is the owner's DRY-RUN review, which is out of the executor's authority to perform.

## Assumptions, deviations, and limitations

- No `psql` or SQL-parsing library was available in this sandbox to mechanically validate the script; verification is by careful manual inspection (structure, keyword ordering, delimiter balance) as the task's fallback explicitly allows, not by execution.
- Did not enable `CONCURRENTLY` on the unique index — the table holds only test data at this scale, so a plain (locking) `CREATE UNIQUE INDEX IF NOT EXISTS` is simpler and sufficient; noted in Section C's comment. The owner can add `CONCURRENTLY` manually as a standalone statement if the table has grown significantly by the time this runs.
- Did not enable the `unaccent` variant — case/whitespace-only is the stated safe default; the alternative and its `createCompanyAction` follow-up cost are documented but not chosen.
- No app-code, TypeScript, or i18n file was touched — confirmed via `git status --short` above.
- The executor did not run any SQL against any database, per the task's explicit restriction (DB mutation is owner-only, same class of restriction as mutating git).

## Opus handoff

- Evidence locations: this session log; `scripts/task-641-companies-dedup-and-unique-index.sql` (full script); `git status --short` above.
- Open risk to inspect: the script has not been executed anywhere — review by careful reading (Section A read-only-ness, Section B's re-point-before-delete ordering and transaction safety, Section C's index expression) is the only verification available before the owner's DRY-RUN. Recommend reviewing the catalog FK-discovery query (A1) closely, since a subtle join-condition error there could hide a real FK from the DRY-RUN report.
- Required next step: hand Section A to the owner to run in the Supabase SQL editor and return its output, per the "Owner-native DRY-RUN handoff" section above, before Section B is authorized to run.

## Backlog update

Moved Task 641 from "Designed — not yet executed" to the "Implemented — awaiting orchestrator review" list in `docs/backlog.md`, matching the existing entry format (current state + session log pointer, script authored / DRY-RUN pending owner). `docs/backlog.md` stays within the ~80-line active-state limit — no `BACKLOG LIMIT BREACH`.
