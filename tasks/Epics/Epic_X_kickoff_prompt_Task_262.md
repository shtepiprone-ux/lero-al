# Task 262 — X.3 — `market_type` DB column audit + `Listing` type alignment

Type:        chore (domain-type integrity)
Priority:    medium
Area:        listings / domain types / schema integrity
Filed by:    Task 234 (X.1 enum drift audit) on 2026-05-27 — see follow-up note in its session log.
Sprint:      14 (queued)

## Pre-read

1. `docs/agent-contract.md` (P0 contract — INCLUDING clause 6a Positive + Negative flow)
2. `docs/backlog.md`
3. `docs/rule-index.md` → "DB / server action / RLS task" bundle:
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - `docs/rls-rules.md`
   - `docs/qa-rules.md`
4. `docs/rule-index.md` → "Schema / migration task" bundle (if owner confirms the column is missing):
   - `docs/architecture.md`
5. Task 234 session log: `docs/sessions/2026-05-27-task-234-x1-enum-drift-audit.md` → "Global domain enum audit" table → `market_type` row.
6. Task 172 session log + `scripts/check-schema-drift.mjs` + `scripts/schema-drift-check.sql`.
7. `src/modules/listings/domain/filterEngine.ts` (`applyListingFilters` — line that calls `.eq('market_type', marketType)`).
8. `src/types/database.ts` (`Listing` interface — confirm `market_type` is absent).
9. `src/modules/listings/constants.ts` (`MARKET_TYPES`).

## Problem statement (verbatim from Task 234 session log)

> `market_type` is used in `applyListingFilters` as `.eq('market_type', marketType)` but is NOT in the `Listing` TypeScript interface or the schema-drift-check.sql column list. It may exist in the DB as a TEXT column not yet typed. If it does not exist, any use of the market_type filter would cause 42703. Since no 42703 has been reported, it likely exists — but should be added to the Listing interface in a follow-up task.

## Goal

Establish ground truth for `market_type`:
- **(A)** If the column exists in DB → add it to `Listing` interface in `src/types/database.ts` + add to `scripts/schema-drift-check.sql` so the drift guard covers it.
- **(B)** If the column does NOT exist in DB → emit a SQL migration AND the `Listing` interface addition AND the schema-drift entry (all idempotent).
- **(C)** If neither matches reality → STOP & ask the orchestrator.

## Current behavior to preserve

- `applyListingFilters` continues to filter by `market_type` when the URL param is one of the validated enum values (`new_building` / `secondary`). Filtering must produce the same results before and after this task.
- `useHomepageFilters` / `useListingsUrlFilters` / `FiltersPanel` / `ListingsFilters` — all unchanged.
- The `market_type` filter section visibility (added by Task 228 for apartment/house/commercial/office) — unchanged.

## Required after behavior

As a developer:
1. `Listing` type in `src/types/database.ts` has a `market_type: string | null` field (or a stricter union if the DB confirms enum) matching the actual DB shape.
2. `scripts/schema-drift-check.sql` includes a `market_type` row in the expected-columns set.
3. `npm run check:schema-drift` passes.
4. `npx tsc --noEmit` passes with the new field accessed/typed consistently.

As any user:
1. The market_type filter still produces the same listings before and after this task — no behavior change at runtime.

## Positive flow (happy path)

- Actor: developer / Sonnet running this task in dev.
- Preconditions: the `listings` table is reachable; the orchestrator has confirmed which scenario (A) or (B) applies.
- Steps:
  1. Query the DB schema (`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'market_type'`). Paste result in session log.
  2. (A) Column exists: add to `Listing` type + `scripts/schema-drift-check.sql`.
  3. (B) Column missing: emit idempotent migration `ALTER TABLE listings ADD COLUMN IF NOT EXISTS market_type text` + `Listing` type addition + schema-drift entry. Owner runs the migration.
  4. `npx tsc --noEmit` → 0 errors.
  5. `npm run check:schema-drift` → PASS.
  6. Existing market_type filtering still works in the running app.

## Negative flow (every off-happy-path branch)

- DB query reveals the column exists but with an unexpected type (e.g. `varchar` instead of `text`): STOP & ask the orchestrator before changing types.
- DB query reveals a strict enum type (rare): the `Listing` type should match (use a union); STOP & ask before adding the enum to TS.
- `applyListingFilters` references a column name that doesn't exist (typo): STOP & ask before renaming.
- The owner cannot run the migration (e.g. RLS, permission): document the blocker in the session log and DO NOT proceed with TS changes that would create a runtime type mismatch.
- Backward compat: existing rows have `market_type IS NULL` — the filter must still produce the same listings (the existing `.eq()` already filters out nulls correctly; verify).
- Schema-drift script error after the addition (false positive on the new row): document and STOP & ask.

## Acceptance criteria

- Positive flow step 1 (DB query result) pasted in the session log.
- (A) OR (B) executed per the result; the other path NOT taken.
- `Listing` type updated with `market_type` field.
- `scripts/schema-drift-check.sql` includes the new column.
- `npx tsc --noEmit` → 0 errors.
- `npm run check:schema-drift` → PASS (after owner runs migration if (B) applies).
- Negative flow branches each have a documented response in the session log even if not triggered (so the reviewer can verify they were considered).
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: `docs/sessions/2026-05-27-task-262-x3-market-type-audit.md`.

## Out of scope

- Changing the `market_type` filter UI (Task 228 handled the section visibility).
- Removing the `market_type` filter entirely (would be a product decision; STOP & ask).
- Adding more enum values to `market_type` (separate task if owner wants more options).
