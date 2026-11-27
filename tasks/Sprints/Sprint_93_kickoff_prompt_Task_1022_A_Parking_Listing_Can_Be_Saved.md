# Task 1022 — A listing of the type Parking can be saved

Sprint 93. Priority P1. Owner decision O957-15 (2026-11-21, translated, recorded in the Task 1001 kickoff): "the type
Parking shows a dropdown of parking kinds and the floor when needed": the type is part of the approved form. Found in
Task 962 Review 1; registry row 2026-11-23. Implementer: Sonnet (the SQL files and the test); Opus (the rollback proof
and the catalog snapshot after the owner's apply). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Today a person who picks the type Parking in the listing form fills it in and cannot save it: the form, the server
schema and the catalogue accept the type, the database enum `property_type` refuses it. After the task the enum has
`parking`, a Parking listing is stored like any other type, and a test fails whenever the form offers a type the
enum does not hold.

## Cause

Read at `36fc0c07f`
- The form offers the type: `src/components/shared/PropertyTypeCombobox.tsx:29-30` builds its options from
  `PROPERTY_TYPES`, which lists `parking` (`src/modules/listings/constants/index.ts:9`).
- The server accepts it: `property_type: z.enum([... 'parking' ...])` (`src/modules/listings/validations/index.ts:26`),
  and the catalogue check passes, because `property_types.slug = 'parking'` is an active row
  (`src/modules/listings/actions/createListing.ts:59`, `src/modules/listings/actions/updateListing.ts:50`; live,
  read-only 2026-11-27: `select slug, is_active from public.property_types` → `{"slug":"parking","is_active":true}`).
- The database refuses it at the insert (`src/modules/listings/actions/createListing.ts:69-71`): the enum has no
  `parking` (`supabase/catalog.json:5613-5629`, column `listings.property_type`, nine values; the live catalog read with
  `node scripts/quality/db-catalog-audit.mjs --save <file>` → exit 0 on 2026-11-27 equals that snapshot; read-only
  2026-11-23: `select 'parking'::public.property_type` → `22P02 invalid input value for enum property_type: "parking"`).
- Nothing compares the offered types with the enum: no test of `src` reads the enum of `supabase/catalog.json`
  (`grep -rlE "supabase/catalog|catalog\.json" src scripts --include=*.test.*` → one comment only,
  `src/tests/integration/listingImageOwner.integration.test.ts:19`), and `scripts/quality/db-types-drift.mjs` does not
  run in CI (Task 978).

Fix: one owner-applied SQL statement adds `parking` to the enum after `garage`, with its rollback and read-only check;
a unit test holds every offered type against the enum of the committed catalog snapshot.

## Scope

- `supabase/sql_migrations/task1022/task1022.sql` (new, owner-applied, LF): `begin; alter type public.property_type add
  value 'parking' after 'garage'; commit;` with a header comment (what, why, the verify and rollback files), as
  `supabase/sql_migrations/task957/task957-parking.sql:1-4`.
- `supabase/sql_migrations/task1022/task1022-rollback.sql` (new): one transaction; refuses with `raise exception` when
  any `public.listings` row has `property_type::text = 'parking'` (no data is lost silently); renames the type to
  `property_type_task1022_old`, creates `public.property_type` with the nine values of `supabase/catalog.json:5620-5628`
  in that order, `alter table public.listings alter column property_type type public.property_type using
  property_type::text::public.property_type`, drops the old type. Live facts it relies on (read-only 2026-11-27): only
  `listings.property_type` has the type; no view, policy or CHECK names the column; one index
  (`listings_property_type_idx`), rebuilt by the column change; no column default; no function takes or returns the type.
- `supabase/sql_migrations/task1022/task1022-verify.sql` (new, read-only, one statement, rows `n, check_name, ok` as
  `task957-parking-verify.sql`): the labels of `public.property_type` in order are `apartment, house, land,
  commercial, office, garage, parking, warehouse, other, room`; `listings.property_type` is still `NOT NULL` of that type.
- `src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts` (new): reads `supabase/catalog.json`, takes the
  `enum_values` of the column `listings.property_type`, and fails for any value of `PROPERTY_TYPES` or of
  `step1Schema.shape.property_type.options` (`src/modules/listings/validations/index.ts:99-102`) that it lacks.
- `supabase/catalog.json` (Opus, after the owner's apply): rewritten by
  `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json`; the only difference is `parking` in that column.
- Dependencies: none.
- Out of scope: the parking and garage fields per type (Task 1001; its Scope line that adds `parking` to the enum is
  carried by this task, and its kickoff is re-read before it starts); a staff-created catalogue slug that no enum
  holds (Task 1072); `src/types/database.ts`, which already lists `parking` (`:26`).
- Kept as on `main` (checklist A2): the nine existing values and their order; `listings.property_type` `NOT NULL`,
  no default, its index, grants and policies; every application file unchanged: the form, its options and labels, the
  server schema, the catalogue check and the error a refused save shows.

## Attack surface

Unchanged — the type is already offered by the form, validated by the server schema and the active catalogue, and written
through the same Server Actions, grants and RLS; the database stops refusing one value the server already accepts.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-27).

- Authorization: not applicable — no grant, policy, role or permission check is added, removed or changed by the SQL.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision or its output is touched here.
- Authorization_Patterns: not applicable — "staff" names Task 1072's catalogue; no enforcement point changes in this task.
- Authorization_Regression_Testing: not applicable — the write path and its access checks stay byte-identical to `main`.
- Authorization_Testing_Automation: not applicable — no row of the authorization matrix changes with one enum value.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the change adds one enum label and grants nothing; `db-catalog-audit.mjs` exits 0 after the apply — AC2, AC3.
- GraphQL: not applicable — the project has no GraphQL endpoint; the SQL is a fixed schema change.
- Injection_Prevention: not applicable — the SQL files are fixed statements; no input reaches an interpreter.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the server schema keeps its fixed list of types and the database enum now holds the same list, checked by a test — AC1.
- JavaScript_and_TypeScript_Security: not applicable — the new test reads a committed JSON file; no regular expression or merge.
- Mass_Assignment: not applicable — the validated object and the insert stay as on `main`; no field becomes writable.
- Multi_Tenant_Security: not applicable — no tenant identifier, object access check or storage path is changed.
- Nextjs_Security: not applicable — no Server Action, route or its returned fields change; only the database enum.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys; nothing in `src` changes.
- Query_Parameterization: not applicable — the statements are fixed text; no query is built from input.
- SQL_Injection_Prevention: not applicable — the SQL is a fixed schema change that the owner applies once by hand.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency is added; the reviewer reruns the test, the rollback proof and the catalog check — AC1-AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reproduces the failing test run and every exit code of the report — AC1-AC3.

## UI

No visible change: the form already offers the type; only its save stops failing.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every type the form offers is a value of the enum — test: `src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts`
  (fails on `main`'s snapshot naming `parking`; passes after the apply and the snapshot refresh).
- AC2 The change has a proven way back — test: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task1022/task1022.sql supabase/sql_migrations/task1022/task1022-rollback.sql`
  exits 0 (Opus, before the owner's apply; LF and CRLF, checklist H4).
- AC3 The applied database holds `parking` and no invariant broke — test: `node scripts/quality/db-catalog-audit.mjs`
  exits 0 after the apply, and `task1022-verify.sql` returns every row `ok = true` (Opus, read-only).
- AC4 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Branch from `main`. Read the files of "## Cause" and `supabase/sql_migrations/task957/task957-parking*.sql`.
2. Write the test (AC1); run `npm test -- src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts`; save the
   failing output (it must name `parking`).
3. Write the three SQL files of the Scope, LF, every object schema-qualified. Do not apply them.
4. Run: `npm test -- src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts` (still failing until the
   snapshot is refreshed: report it as expected, with its output) and ESLint on the new test file (checklist I8).
   Nothing else runs locally; CI runs on GitHub only (`gh pr checks <n>`).
5. Report: each command, exit code, relevant output.
6. Opus, after the review: AC2; the owner applies `task1022.sql` in the Supabase SQL editor, then `task1022-verify.sql`;
   Opus AC3 and the snapshot refresh; AC1 passes before the push.

## Revision 1 (Review 1, 2026-11-27)

- F1: the trigger `listings_catalogue_active` (`before insert or update of property_type, currency`,
  `supabase/sql_migrations/task962/v8b2.sql:72-74`) names the column, so the rollback's column change is refused. In
  `supabase/sql_migrations/task1022/task1022-rollback.sql` step 2: drop that trigger first, recreate it exactly as
  `v8b2.sql:72-74` after the old type is dropped, and name it in the header comment. Nothing else changes.

## Review
- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_1022_Review_1.md)
