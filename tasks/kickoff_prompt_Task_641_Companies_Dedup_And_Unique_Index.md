# Task 641 — Author a DRY-RUN-gated SQL migration that de-duplicates existing `companies` rows (re-pointing every foreign key to a canonical row) and then adds a normalized `UNIQUE` index on `lower(btrim(name))` matching Task 640's app-level duplicate check

- **Task number:** 641
- **Epic:** none (AuthSheet company-field follow-up — the DB backstop for Tasks 640/643).
- **Parent / origin:** Task 640 added an app-level duplicate check in `createCompanyAction` (`trim().toLowerCase()`) plus a dormant `23505` unique-violation fallback that only becomes live once a DB UNIQUE index exists. Owner decision (`AskUserQuestion`, 2026-07-20): guarantee uniqueness at the **DB level** with a normalized `UNIQUE` index **and** a one-time cleanup of existing duplicates, **with a DRY-RUN report before any mutation** ("з обовʼязковим DRY-RUN"). During Tasks 638–640 the owner created test companies (`Test1`, `Test2`, `Test3`, …), some duplicated — this migration cleans those and locks out future duplicates.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** **DB migration authoring** — the deliverable is a hand-run SQL script under `scripts/` following the repo convention (`scripts/task-NNN-*.sql`, "run once in the Supabase SQL editor"). **The executor authors the SQL and a session log; it does NOT run it.** Executing DB mutations is owner-only and native (same class of restriction as mutating git) — the owner runs the DRY-RUN section first, reviews it, then runs the mutation and constraint sections. There is no app-code, TypeScript, or i18n change in this task.

## Objective

Produce `scripts/task-641-companies-dedup-and-unique-index.sql`: a single, clearly-sectioned, idempotent-where-possible script that (A) in a **read-only DRY-RUN** section reports every duplicate company group and every foreign key that references `companies(id)`, so the owner can review the exact impact before mutating; (B) in a **transaction-wrapped mutation** section, picks one canonical company per normalized-name group, re-points every referencing foreign key to the canonical id, deletes the duplicate rows, and verifies zero duplicates remain; (C) adds the normalized `UNIQUE` index `companies (lower(btrim(name)))` (matching Task 640's `trim().toLowerCase()` normalization) so future duplicates are rejected at the DB and Task 640's `23505` fallback goes live. The three sections must be individually runnable and clearly labelled so the owner runs A → reviews → B → C.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 640/643 committed: `7e701a522`, `9dc7ccb38`). Reference by structure.

### Migration convention (repo)

- SQL migrations are hand-run scripts under `scripts/`, named `task-NNN-<slug>.sql`, e.g. `scripts/task-314-complaint-type.sql`, `scripts/task-319-notifications-template-columns.sql`. Each begins with a header comment ("Task NNN: … Run once in the Supabase SQL editor before deploying…"), then the DDL/DML, then a verification `SELECT`. There is **no** `supabase/migrations` CLI directory — these are applied manually by the owner. The executor must follow this exact convention.

### `companies` table and the normalization to match

- `companies` columns (from `src/modules/companies/lib/queries.ts` `select('id, name, logo_url, created_at')` and `src/types/database.ts` `interface Company`): `id` (uuid, PK), `name` (text), `logo_url` (text|null), `created_at` (timestamptz). Confirm the live column set in the DRY-RUN before mutating (do not assume beyond these).
- **Normalization must equal Task 640's app check.** Task 640 matches on `name.trim().toLowerCase()` (case-insensitive, whitespace-trimmed, **NOT** accent-insensitive — accent handling was explicitly deferred to this task as a joint decision). The SQL equivalent is `lower(btrim(name))`. **Open decision below:** confirm whether to keep case/whitespace-only (`lower(btrim(name))`) or extend to accent-insensitive (`lower(btrim(unaccent(name)))`) — the latter also requires `CREATE EXTENSION unaccent` and a matching change in `createCompanyAction` (a follow-up), so the safe default is case/whitespace-only to stay consistent with the shipped Task 640 behavior.

### Foreign keys referencing `companies(id)`

- The known application FK is **`users.company_id`** (`src/types/database.ts` `interface User` → `company_id: string | null`). `users` also carries denormalized `company_name` and `company_logo_url` copies (not FKs). `PublicUserProfile` (line 283) is a derived view exposing `company_name` — it auto-reflects `users` and needs no action.
- **Do not hardcode the FK set from the type file alone.** The DRY-RUN section MUST enumerate every foreign key that references `companies(id)` from the live catalog (`pg_constraint` / `information_schema.table_constraints` + `key_column_usage` / `constraint_column_usage`), so a DB-level FK not visible in the TypeScript types cannot be missed. The mutation section explicitly re-points `users.company_id`, and includes a clearly-commented template for any additional referencing column the owner confirms from the DRY-RUN output.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner (DRY-RUN gate) | Section A is strictly read-only (only `SELECT`s): it lists each duplicate group by `lower(btrim(name))` with the member ids/names/created_at, the chosen keeper vs losers, and a count of referencing rows per loser; and it enumerates ALL foreign keys referencing `companies(id)` from the live catalog | P0 | Script inspection; owner runs A and returns output | Confirmed |
| R2 | Owner (cleanup) | Section B, in a single `BEGIN…COMMIT` transaction: selects one canonical company per normalized group (earliest `created_at`, tie-break lowest `id`), re-points every referencing FK (at minimum `users.company_id`) from loser ids to the keeper id, deletes the loser rows, and includes an in-transaction verification that zero normalized-name duplicates remain before `COMMIT` | P0 | Script inspection; owner runs B; post-run duplicate-count = 0 | Confirmed |
| R3 | Data safety | Section B is atomic and reversible until `COMMIT`; it never deletes a company that still has referencing rows (re-point precedes delete); it does not touch non-duplicate companies; a rollback note is included | P0 | Script inspection (ordering, transaction, `HAVING count>1` scoping) | Confirmed |
| R4 | Owner (DB backstop) | Section C creates `UNIQUE INDEX ... ON companies (lower(btrim(name)))` (named e.g. `companies_name_norm_uniq`), consistent with Task 640's normalization; uses `IF NOT EXISTS`; if `CONCURRENTLY` is used it is a standalone statement outside any transaction; includes a verification that the index exists and (commented) that a duplicate insert now fails with `23505` | P0 | Script inspection; owner runs C; index present | Confirmed |
| R5 | Consistency with 640 | The index expression equals the app normalization `lower(btrim(name))` (case/whitespace only, no `unaccent`) unless the owner elects accent-insensitivity in the open decision; either way, the choice is stated and, if accent-insensitive, the required `createCompanyAction` follow-up is flagged (not done here) | P0 | Script comments + session log state the decision | Confirmed |
| R6 | Convention/integrity | The script follows the `scripts/task-NNN-*.sql` header + verification-SELECT convention; the file is UTF-8 no-BOM, valid SQL, and self-documenting (each section labelled RUN ORDER 1/2/3 with what to review between) | P0 | File inspection; `check:mojibake` if it scans `scripts/` | Confirmed |

## Assumptions and open questions

- **OPEN DECISION (owner) — accent sensitivity of the uniqueness key:** default and recommended is **case/whitespace-only** (`lower(btrim(name))`), identical to the shipped Task 640 app check — no `unaccent`, no app follow-up, fully consistent today. The alternative (`lower(btrim(unaccent(name)))`) additionally collapses `Tëst`≡`Test`, but requires `CREATE EXTENSION IF NOT EXISTS unaccent` and a matching update to `createCompanyAction` (otherwise the app check and DB index disagree, and inserts could fail confusingly). Author the script for the **case/whitespace-only** default; add a clearly-commented, disabled `unaccent` variant the owner can opt into, and flag the required app follow-up if they do. Do not silently choose accent-insensitivity.
- **Keeper selection:** earliest `created_at` wins (the original), tie-break by lowest `id`. This preserves the oldest row and its `created_at`. State it in comments.
- **Denormalized `users.company_name` / `company_logo_url`:** after re-pointing `company_id`, optionally refresh these to the keeper's `name`/`logo_url` for cosmetic consistency (losers and keeper share a normalized name, so `company_name` is already effectively equal up to case; `logo_url` may differ). Include this as an optional, clearly-commented step in Section B; it is not required for correctness. Do not make it mandatory.
- **The executor cannot run any SQL** (no DB in the sandbox; DB mutation is owner-only). "Verification" for this task = SQL correctness by inspection + the owner running Section A and returning its output for review before B/C. The completion status reflects "script authored + DRY-RUN handed to owner," not "migration applied."
- **No app-code change in this task.** `createCompanyAction` keeps its app-level pre-check (friendly duplicate UX) and its `23505` fallback (which activates once C lands). Tasks 642 (`📷`) and any accent follow-up are separate.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 2 no-invented-facts, 9 validation evidence, 14 file integrity, 15 critical-flow — companies feed agent registration).
- `docs/rule-index.md` (data/migration routing).
- `docs/data-access-rules.md` and `docs/rls-rules.md` (Supabase schema/RLS conventions; confirm the migration does not weaken RLS on `companies`/`users`).
- `docs/domain-rules.md` (company/agent domain), `docs/env.md` (how migrations are applied — manual Supabase SQL editor, owner-run).
- Source/context: `scripts/task-314-complaint-type.sql` and `scripts/task-319-notifications-template-columns.sql` (migration-format precedent), `src/modules/companies/actions.ts` (`createCompanyAction` normalization + `23505` fallback the index activates), `src/modules/companies/lib/queries.ts` (`companies` columns), `src/types/database.ts` (`Company`, `User.company_id`).

## Scope

1. Author `scripts/task-641-companies-dedup-and-unique-index.sql` with three labelled, individually-runnable sections (A DRY-RUN read-only, B mutation in a transaction, C unique index), per R1–R6, including the FK-discovery query, the keeper rule, the re-point-before-delete ordering, the in-transaction zero-duplicate verification, the normalized UNIQUE index, and the disabled `unaccent` variant + rollback note.
2. Write the session log documenting the script, the normalization decision (case/whitespace-only default), the known FK (`users.company_id`) plus the catalog-driven discovery approach, and the exact owner run-order (A → review → B → C) with what to check between steps.
3. Add a concise `docs/backlog.md` active-state entry (move Task 641 from "Designed" to implemented-awaiting-review; keep ≤80 lines, flag `BACKLOG LIMIT BREACH` if needed).
4. Do NOT run any SQL, and do NOT run or emit mutating git.

## Out of scope

- Running/applying the migration (owner-only, native Supabase).
- Any change to `createCompanyAction`, `CompanyField`, `AdminCompaniesManager`, or app code (Task 640/643 already shipped; the index only activates the existing `23505` fallback).
- Accent-insensitive normalization unless the owner elects it in the open decision (then flag the `createCompanyAction` + `unaccent` follow-up; still don't change app code here).
- Task 642 (`📷` removal); real logo thumbnails.

## Current and required behavior

- **Current:** `companies` has no uniqueness constraint; existing test duplicates (`Test1`/`Test2`/`Test3`…) may include normalized-name collisions; Task 640's `23505` fallback is dormant (no index to trigger it).
- **Required after (once the owner runs the script):** duplicate `companies` rows are merged into one canonical row each (all `users.company_id` and any other FK re-pointed, losers deleted), a normalized `UNIQUE` index rejects future duplicates at the DB, and Task 640's `23505` fallback becomes an active race backstop. No app behavior regresses; agent registration still selects/creates companies exactly as after Task 640.

## Positive and negative flows

**Positive:** owner runs Section A → reviews the duplicate groups + FK list → runs Section B (merge + verify 0 duplicates) → runs Section C (create unique index + verify) → future duplicate inserts fail with `23505`, which `createCompanyAction` now catches and surfaces as the friendly duplicate UX (Task 640).

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| No duplicates exist at run time | **Yes** | R2 | Section B merges nothing; Section C still creates the index; no data lost | Script handles empty duplicate set gracefully (no-op merge) |
| Duplicate group with `users.company_id` referencing a loser | **Yes** | R2/R3 | loser refs re-pointed to keeper before the loser is deleted; no orphaned FK | Section B ordering; in-transaction verification |
| An FK referencing `companies` not in the TS types | **Yes** | R1 | surfaced by the catalog FK-discovery query so the owner adds a re-point block | Section A FK enumeration |
| Index creation while a duplicate still exists | **Yes** | R2/R4 | C run only after B verifies 0 duplicates; otherwise the unique index build fails loudly (acceptable guard) | Run-order comments; B verification gate |
| Accent-only collision (`Tëst`≡`Test`) | **No (deferred)** | Open decision | not collapsed by the default `lower(btrim(name))`; owner may opt into the `unaccent` variant | Commented disabled variant |
| Rollback needed mid-mutation | **Yes** | R3 | B is one transaction; owner can `ROLLBACK` before `COMMIT` if the in-transaction verification looks wrong | Transaction wrapping + rollback note |
| RLS weakened | **No** | R6 | migration adds an index + merges rows; does not alter RLS policies | Script inspection |

## Acceptance criteria

- `AC1 [R1]` Given Section A, then it is read-only, lists every `lower(btrim(name))` duplicate group with members/keeper/losers and per-loser referencing-row counts, and enumerates all FKs referencing `companies(id)` from the live catalog.
- `AC2 [R2,R3]` Given Section B, then within one transaction it re-points every referencing FK (incl. `users.company_id`) from losers to the earliest-`created_at` keeper, deletes only loser rows, verifies zero normalized duplicates remain before `COMMIT`, and never deletes a still-referenced row.
- `AC3 [R4,R5]` Given Section C, then it creates `UNIQUE INDEX companies_name_norm_uniq ON companies (lower(btrim(name)))` (`IF NOT EXISTS`; `CONCURRENTLY` outside any transaction if used), consistent with Task 640's normalization, and verifies the index exists.
- `AC4 [R6]` Given the file, then it follows the `scripts/task-NNN-*.sql` header + verification-SELECT convention, is valid SQL, UTF-8 no-BOM, with the three sections labelled in run order and the `unaccent` variant + rollback note included.
- `AC5 [R5]` Given the session log, then it states the normalization decision (case/whitespace-only default), the keeper rule, and — if the owner later elects `unaccent` — the required `createCompanyAction` follow-up.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (data-loss risk — merging/deleting rows that feed agent registration). Because the deliverable is owner-run SQL, the evidence is script correctness + the owner's DRY-RUN, not sandbox execution. Record:

1. **SQL inspection (executor):** the script parses as valid Postgres SQL; Section A is read-only; Section B is transaction-wrapped with re-point-before-delete and an in-transaction zero-duplicate verification; Section C's unique-index expression equals `lower(btrim(name))`; `unaccent` variant is present but disabled; rollback note present. (If a local `psql`/parser is unavailable in the sandbox, state so and rely on careful inspection — do not fabricate execution.)
2. `npm run check:mojibake` → 0 artifacts (the script lives under `scripts/`, which the scanner covers) — confirm the new file is clean.
3. **Owner-native DRY-RUN handoff (required before B/C):** provide the exact instruction — owner opens the Supabase SQL editor, runs **Section A only**, and returns: the duplicate-group list, the FK enumeration, and the per-loser reference counts. The task cannot be marked applied until the owner reviews this; the executor's status is "authored + DRY-RUN handed off."
4. `git status --short` / `git diff --stat` → only `scripts/task-641-companies-dedup-and-unique-index.sql` (new), `docs/backlog.md`, and the new session log. No app-code/TS/i18n change.

Do not run the migration. Do not substitute a confidence claim for the owner DRY-RUN. Q4 data-mutation cannot be "approved as applied" without the owner's DRY-RUN review and post-run verification output; the executor's deliverable is the correct, DRY-RUN-gated script.

## Completion report contract

Write `docs/sessions/2026-07-20-task641-companies-dedup-and-unique-index.md` + a concise `docs/backlog.md` update. Include: the full script's structure (sections A/B/C with what each does); the normalization decision + keeper rule; the known FK (`users.company_id`) and the catalog-driven discovery approach; the exact owner run-order (A → review → B → C) and what to verify between steps; the rollback note; `check:mojibake` result; explicit confirmation that no app code/TS/i18n was changed and that no SQL was executed by the agent; and the owner-native DRY-RUN handoff (Section A) with the expected output to return. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (script authored, DRY-RUN pending owner) / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git; do not run SQL.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the migration convention + example scripts, the `companies` columns, the normalization that must match Task 640 (`lower(btrim(name))`), the known FK plus the catalog-discovery requirement, the three-section DRY-RUN-gated structure, the keeper rule, the transaction/rollback safety, and the owner-run-order are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the data-loss risk is gated behind an owner DRY-RUN that must be reviewed before mutation. ✅
- Scope is authoring-only; the executor is explicitly forbidden from running SQL or mutating git, consistent with owner-only DB/git mutation. ✅
- The open decision (accent sensitivity) is surfaced to the owner with a safe default and the follow-up cost of the alternative, not silently chosen. ✅
- Negative flows selected by applicability (no-duplicates no-op / re-point-before-delete / hidden FK discovery / index-after-verify / accent deferred / rollback / RLS untouched). ✅
- The uniqueness key is consistent with the shipped Task 640 app check, and the migration activates Task 640's dormant `23505` fallback rather than requiring new app code. ✅
