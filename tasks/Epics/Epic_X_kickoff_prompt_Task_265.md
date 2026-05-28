# Task 265 — X.4 — `listings.search_vector` drift: add to `Listing` TS type + schema-drift guard

Type:        chore (domain-type integrity)
Priority:    low (drift item, no production impact)
Area:        listings / domain types / schema integrity
Filed by:    Task 250 review (Opus 4.7) on 2026-05-28 — surfaced when owner ran `npm run check:schema-drift` and Supabase reported `listings.search_vector | not in types`.
Sprint:      14 (or 15)

## Pre-read

1. `docs/agent-contract.md` (P0 — INCLUDING clause 6a Positive + Negative flow + clause 10 Files Changed)
2. `docs/backlog.md`
3. `docs/rule-index.md` → "Schema / migration task" bundle:
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - `docs/architecture.md`
4. Task 234 + Task 262 session logs (the broader market_type / schema-drift work).
5. `src/types/database.ts` (`Listing` interface — confirm `search_vector` absent).
6. `scripts/schema-drift-check.sql` + `scripts/check-schema-drift.mjs` (the drift guard infrastructure).

## Problem statement

After Task 250 + Task 262 were applied, the owner ran `npm run check:schema-drift` against production:

```
[{ "table_name": "listings", "column_name": "search_vector", "status": "not in types" }]
```

The `search_vector` column exists in the production `listings` table (PostgreSQL `tsvector` for full-text search) but is missing from the `Listing` TypeScript interface in `src/types/database.ts`. This is the last outstanding drift item after Task 250 added 4 missing interfaces and Task 262 added `market_type`.

## Current behavior to preserve

- All existing `Listing` SELECT projections — `LISTING_SELECT`, `CABINET_LISTING_SELECT`, custom queries in admin/cabinet — continue to work unchanged.
- The `tsvector` column is NEVER selected in any client-side projection (verify by grep); it is used only by server-side full-text search operators (if any) — preserved.
- `npm run check:schema-drift` should report 0 drift items after this task.

## Required after behavior

As a developer:
1. `Listing` type in `src/types/database.ts` has a `search_vector: unknown | null` (or `string | null` if the project prefers to surface tsvector as text) field.
2. `scripts/schema-drift-check.sql` regenerated includes `search_vector`.
3. `npm run check:schema-drift` → owner's Supabase SQL Editor query returns zero rows.
4. `npx tsc --noEmit` → 0 errors.

## Positive flow (happy path)

- Actor: developer / Sonnet.
- Steps:
  1. Read the DB column's actual type via `\d listings` or `information_schema.columns` → confirm `tsvector`.
  2. Add `search_vector: unknown | null` to `Listing` interface (after `created_at` or wherever natural).
  3. Run `node scripts/check-schema-drift.mjs` to regenerate `scripts/schema-drift-check.sql`.
  4. `npx tsc --noEmit` → 0 errors (existing code does not reference `search_vector`).
  5. Owner runs `scripts/schema-drift-check.sql` in Supabase SQL Editor → 0 rows returned.

## Negative flow (every off-happy-path branch)

- Existing code accidentally references `search_vector` in a SELECT projection (unlikely — full-text search usually uses `to_tsquery()` filter only): grep to confirm 0 hits; if found, address before adding the type.
- TS type choice: `unknown` is safer (prevents accidental misuse as a string); STOP & ask the orchestrator if the project prefers a different stance.
- DB column type changes in the future (e.g. dropped or renamed): the drift guard catches it on next run.
- Schema-drift script error after the addition: document and STOP & ask.

## Acceptance criteria

- Positive flow steps 2-3 (type added + drift SQL regenerated) verifiable in diff.
- Negative flow → grep proof: 0 client-side SELECT projections include `search_vector`.
- `npm run check:schema-drift` → 28 tables, 263 cols (was 262 after Task 262).
- Owner Supabase SQL Editor run: 0 drift rows returned.
- `npx tsc --noEmit` → 0 errors; `npm run build` → passes.
- "Files Changed" table in session log per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: `docs/sessions/2026-05-2N-task-265-x4-search-vector-drift.md`.

## Out of scope

- Implementing full-text search UI on top of `search_vector` (separate feature task).
- Reviewing or changing the production `tsvector` trigger that populates `search_vector` (existing DB infra).
- Adding `search_vector` to any client-side projection — it remains server-side-only.
