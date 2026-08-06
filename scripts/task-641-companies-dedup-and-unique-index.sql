-- Task 641: De-duplicate existing `companies` rows and add a normalized UNIQUE
-- index on lower(btrim(name)), matching Task 640's app-level duplicate check.
-- Run once in the Supabase SQL editor, in three ordered steps (see the
-- "RUN ORDER" labels below): Section A (read-only DRY-RUN) → owner review →
-- Section B (transaction-wrapped merge) → Section C (unique index).
--
-- Origin: Task 640 added app-level duplicate detection (name.trim().toLowerCase())
-- plus a dormant 23505 unique-violation fallback in createCompanyAction that only
-- activates once a DB UNIQUE index exists (this script's Section C). During
-- Tasks 638-640 testing, duplicate test companies were created (Test1/Test2/
-- Test3, ...) — Section B cleans those up.
--
-- Normalization: lower(btrim(name)) — case-insensitive, whitespace-trimmed,
-- NOT accent-insensitive. This matches the shipped Task 640 app check exactly.
-- A disabled unaccent-based variant is included at the end of Section C for the
-- owner to opt into later; enabling it requires `CREATE EXTENSION unaccent` AND
-- a matching change to createCompanyAction (not done in this script — flag as a
-- follow-up task if the owner elects it). Do not silently choose accent-
-- insensitivity.
--
-- Keeper rule: for each lower(btrim(name)) group, the earliest-created_at row
-- wins (tie-break: lowest id). This preserves the oldest row and its
-- created_at. Every FK referencing a loser is re-pointed to the keeper BEFORE
-- the loser is deleted.
--
-- Known FK: users.company_id (src/types/database.ts `User.company_id`).
-- Section A's A1 query enumerates ALL foreign keys referencing companies(id)
-- from the live Postgres catalog (not just the known one) — if it reveals
-- another referencing column, add a matching re-point UPDATE to Section B (see
-- the TEMPLATE comment there) before running Section B.
--
-- Companies columns confirmed live: id (uuid, PK), name (text), logo_url
-- (text|null), created_at (timestamptz) — src/modules/companies/lib/queries.ts
-- and src/types/database.ts `Company`. Re-confirm via Section A output before
-- mutating; do not assume beyond these.
--
-- This migration does NOT change RLS policies or GRANTs on companies/users.

-- ============================================================================
-- RUN ORDER 1 — SECTION A: DRY-RUN (READ-ONLY). Run this first. Every
-- statement below is a SELECT — nothing is mutated. Review the three result
-- sets before proceeding to Section B.
-- ============================================================================

-- A1. Enumerate ALL foreign keys referencing companies(id) from the live
-- catalog. Confirms users.company_id is the only referencing column — if this
-- returns any other row, Section B's re-point step must be extended (see the
-- TEMPLATE comment in Section B) before it is run.
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name        AS referencing_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema     = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema     = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name     = 'companies'
  AND ccu.column_name    = 'id';

-- A2. Duplicate groups by lower(btrim(name)): every member, its role
-- (KEEPER = earliest created_at, tie-break lowest id; LOSER = everything
-- else in the group), and the group size. Only groups with > 1 member are
-- shown — a company with a unique normalized name never appears here and is
-- never touched by Section B.
WITH normalized AS (
  SELECT id, name, logo_url, created_at, lower(btrim(name)) AS norm_name
  FROM companies
),
ranked AS (
  SELECT
    *,
    row_number() OVER (PARTITION BY norm_name ORDER BY created_at ASC, id ASC) AS rn,
    count(*)     OVER (PARTITION BY norm_name)                                 AS group_size
  FROM normalized
)
SELECT
  norm_name,
  id,
  name,
  logo_url,
  created_at,
  CASE WHEN rn = 1 THEN 'KEEPER' ELSE 'LOSER' END AS role,
  group_size
FROM ranked
WHERE group_size > 1
ORDER BY norm_name, rn;

-- A3. Per-loser referencing-row counts — how many rows in each known
-- referencing table point at each loser (so the owner can see the exact
-- blast radius before Section B re-points and deletes). Extend the SELECT
-- list with one more `(SELECT count(*) FROM <table> WHERE <fk_column> = l.id)
-- AS <table>_referencing` per any additional row A1 reveals.
WITH normalized AS (
  SELECT id, name, created_at, lower(btrim(name)) AS norm_name
  FROM companies
),
ranked AS (
  SELECT
    *,
    row_number() OVER (PARTITION BY norm_name ORDER BY created_at ASC, id ASC) AS rn
  FROM normalized
),
losers AS (
  SELECT id, name, norm_name FROM ranked WHERE rn > 1
)
SELECT
  l.id   AS loser_id,
  l.name AS loser_name,
  l.norm_name,
  (SELECT count(*) FROM users u WHERE u.company_id = l.id) AS users_referencing
FROM losers l
ORDER BY l.norm_name, l.id;

-- ============================================================================
-- ⚠️ STOP. Review Section A's three result sets before proceeding.
-- Confirm:
--   1. A1 lists ONLY users.company_id. If it lists any other table/column,
--      add a matching re-point UPDATE to Section B (TEMPLATE comment below)
--      before running Section B.
--   2. A2's keeper/loser assignment per group looks correct (oldest row kept).
--   3. A3's reference counts are what you expect to be re-pointed.
-- Return this output to the orchestrator/owner for review before running B.
-- ============================================================================

-- ============================================================================
-- RUN ORDER 2 — SECTION B: MUTATION (transaction-wrapped). Run only after
-- reviewing Section A. Select and execute this ENTIRE block (BEGIN through
-- COMMIT) as ONE query submission in the SQL editor — do not run the
-- statements individually, since the verification DO block's abort behavior
-- depends on running inside the same transaction as the merge.
--
-- Rollback: if anything below looks wrong once you review the output, or the
-- verification DO block raises an exception (Postgres then marks the
-- transaction "aborted" and ignores further commands until it ends), run
-- `ROLLBACK;` instead of `COMMIT;` to discard every change in this block.
-- Nothing is persisted until COMMIT succeeds.
-- ============================================================================

BEGIN;

-- Step 1: build the loser → keeper mapping for this run (dropped automatically
-- at the end of the transaction, so this is safe to re-run).
CREATE TEMP TABLE task_641_company_merge_map ON COMMIT DROP AS
WITH normalized AS (
  SELECT id, name, created_at, lower(btrim(name)) AS norm_name
  FROM companies
),
ranked AS (
  SELECT
    *,
    row_number() OVER (PARTITION BY norm_name ORDER BY created_at ASC, id ASC) AS rn
  FROM normalized
),
keepers AS (
  SELECT norm_name, id AS keeper_id FROM ranked WHERE rn = 1
)
SELECT r.id AS loser_id, k.keeper_id, r.norm_name
FROM ranked r
JOIN keepers k USING (norm_name)
WHERE r.rn > 1;
-- If there are no duplicate groups, this temp table is empty and every
-- statement below becomes a no-op — Section B safely does nothing and
-- Section C can still proceed.

-- Step 2: re-point the known FK — users.company_id — from every loser to its
-- keeper. This MUST run before Step 4 (delete) so no referencing row is ever
-- left pointing at a deleted company.
UPDATE users u
SET company_id = m.keeper_id
FROM task_641_company_merge_map m
WHERE u.company_id = m.loser_id;

-- [TEMPLATE — only if Section A's A1 revealed an additional referencing
-- column beyond users.company_id; uncomment and fill in <table>/<fk_column>]
-- UPDATE <table> t
-- SET <fk_column> = m.keeper_id
-- FROM task_641_company_merge_map m
-- WHERE t.<fk_column> = m.loser_id;

-- Step 3 (OPTIONAL, disabled by default): refresh the denormalized
-- users.company_name / company_logo_url copies to the keeper's values for
-- cosmetic consistency. Not required for correctness — company_name is
-- already effectively equal up to case/whitespace for merged rows; logo_url
-- may differ between keeper and losers. Uncomment to enable.
-- UPDATE users u
-- SET company_name = c.name,
--     company_logo_url = c.logo_url
-- FROM task_641_company_merge_map m
-- JOIN companies c ON c.id = m.keeper_id
-- WHERE u.company_id = m.keeper_id;

-- Step 4: delete the loser rows. By this point every referencing row has
-- been re-pointed in Step 2 (+ the TEMPLATE step if applicable), so no
-- referencing row still points at a loser.
DELETE FROM companies c
USING task_641_company_merge_map m
WHERE c.id = m.loser_id;

-- Step 5: in-transaction verification — zero normalized-name duplicates must
-- remain. If any remain, RAISE EXCEPTION aborts the transaction so nothing in
-- this block is ever committed.
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT lower(btrim(name))
    FROM companies
    GROUP BY 1
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Task 641 merge verification failed: % normalized duplicate group(s) remain', dup_count;
  END IF;
END $$;

-- If Step 5 raised, this transaction is already aborted — run ROLLBACK, not
-- COMMIT. If Step 5 completed silently, zero duplicates remain and it is
-- safe to commit.
COMMIT;

-- Re-run this check after COMMIT as a second, out-of-transaction confirmation
-- before proceeding to Section C. Expected: 0 rows.
SELECT lower(btrim(name)) AS norm_name, count(*)
FROM companies
GROUP BY 1
HAVING count(*) > 1;

-- ============================================================================
-- ⚠️ STOP. Confirm Section B committed without error (no RAISE EXCEPTION
-- output) and that the post-COMMIT duplicate check above returned 0 rows.
-- Only then proceed to Section C.
-- ============================================================================

-- ============================================================================
-- RUN ORDER 3 — SECTION C: NORMALIZED UNIQUE INDEX. Run only after Section B
-- committed and the 0-duplicate check above returned 0 rows. This is a
-- standalone DDL statement — no explicit transaction needed.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_norm_uniq
  ON companies (lower(btrim(name)));

-- Verification: the index exists.
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'companies'
  AND indexname = 'companies_name_norm_uniq';

-- Verification (commented — uncomment to confirm the index rejects a future
-- duplicate; pick a name that already exists in `companies` after Section B):
-- INSERT INTO companies (name) VALUES ('  Test1  ');
-- -- Expected: ERROR 23505 duplicate key value violates unique constraint
-- -- "companies_name_norm_uniq" — this is the failure createCompanyAction's
-- -- existing 23505 fallback (Task 640) now catches and surfaces as the
-- -- friendly "already exists" UX instead of a raw DB error.

-- ── Disabled accent-insensitive variant (owner opt-in ONLY — do not enable
-- without also updating createCompanyAction; see the file header) ──────────
-- CREATE EXTENSION IF NOT EXISTS unaccent;
-- DROP INDEX IF EXISTS companies_name_norm_uniq;
-- CREATE UNIQUE INDEX IF NOT EXISTS companies_name_norm_uniq
--   ON companies (lower(btrim(unaccent(name))));
-- -- If you enable this variant, createCompanyAction's JS-side
-- -- `name.trim().toLowerCase()` lookup no longer matches the DB's accent-
-- -- folded uniqueness key (JS has no equivalent to SQL `unaccent()`), so the
-- -- app-level duplicate check and the DB constraint would disagree — inserts
-- -- could fail with a raw 23505 in cases the app-level check didn't predict.
-- -- This requires a follow-up task to update createCompanyAction's
-- -- normalization to match (e.g. via an RPC-based lookup). Do NOT enable this
-- -- variant without filing that follow-up.
