# Task 979 — The `parking` property type: the catalogue, the application and the database enum agree

Sprint 93. Priority P1. Found 2026-11-15 by Task 956 Part A review 1 (`db-types-drift.mjs`: "enum property_type is
apartment, commercial, garage, house, land, office, other, room, warehouse in the catalog; Listing.property_type allows
… parking …"). Owner decision O979-1 needed before execution: `parking` stays a property type (the database accepts it)
or leaves (the catalogue and the application stop offering it). Implementer: Sonnet (the application, the SQL, the
tests; never applies SQL). The owner applies. Reviewer: a separate Opus session.

## Goal

Read on the live project 2026-11-15 (read-only transaction): `public.property_types` holds `parking` with
`is_active = true`; `enum_range(null::public.property_type)` is `{apartment,house,land,commercial,office,garage,warehouse,
other,room}` — no `parking`. The application offers and accepts it: `src/modules/listings/constants/index.ts:9`,
`src/modules/listings/validations/index.ts:26`, `src/types/database.ts:26`, the four locale files (`property_type_parking`).
`createListing` passes the catalogue check (`createListing.ts:37`) and inserts the value (`createListing.ts:65-81`), so a
listing of type `parking` ends in `insert_failed` (INFERENCE: Postgres refuses a label outside the enum, `22P02`;
UNKNOWN until AC1 measures it). The search filter for an underground floor asks for
`property_type in (garage, parking, warehouse, other)` (`filterEngine.security.test.ts:156`); whether that query fails
as a whole is UNKNOWN until AC2 measures it. After the task every active catalogue slug is an enum label and every enum
label the application offers is an active catalogue slug, in the direction O979-1 chose.

## Scope

- O979-1 = stays: `alter type public.property_type add value 'parking'` in `supabase/sql_migrations/task979/v1.sql`
  (a value cannot be removed from an enum: `v1-rollback.sql` states that the rollback is "keep the label, deactivate the
  catalogue row" and does exactly that), `v1-preflight.sql` (read-only: the current labels and the catalogue rows),
  `v1-verify.sql`.
- O979-1 = leaves: the catalogue row is deactivated (`v1.sql` / `v1-rollback.sql` / `v1-verify.sql`), and `parking`
  leaves `constants/index.ts`, `validations/index.ts`, `database.ts`, the filter engine and its tests; the locale keys
  leave with it (`check:i18n` decides whether a key may stay).
- Either way: `src/tests/integration/propertyTypeCatalogue.integration.test.ts` (new) reads both lists through the
  service role and asserts the agreement of the Goal.
- Dependencies: none (Task 978 aligns `database.ts` after this task).
- Out of scope: the catalogue trigger of Task 962; other enums.

## Attack surface

Unchanged: no grant, policy or route changes; one enum label or one catalogue row changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-15).

- Authorization: not applicable — no policy, grant or role changes; one enum label or one catalogue row changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization predicate changes in this task.
- Database_Security: not applicable — no grant, role or permission changes.
- GraphQL: not applicable — no API schema or access change.
- Identity_Propagation_Patterns: not applicable — the service role reads two public lists in a test only.
- Injection_Prevention: not applicable — the SQL files are static migrations; no query is built from input.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the server schema and the database accept the same property types — AC1, AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL run on every changed file — AC4.
- Mass_Assignment: not applicable — the field list `createListing` writes is unchanged.
- Multi_Tenant_Security: not applicable — no tenant predicate or RLS role changes.
- Prototype_Pollution_Prevention: not applicable — one enum literal changes; no object is merged.
- Query_Parameterization: not applicable — static migration; the filter's query construction is unchanged.
- SQL_Injection_Prevention: not applicable — no value from input reaches SQL text.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns AC1-AC3 on the live project, not the report — AC1, AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Reconcile supplier reports with observations you control when possible" — the measured failing-first runs are rerun in review — AC1, AC2.

## UI

O979-1 = stays: no visible change (the option already shows). O979-1 = leaves: the `parking` option leaves the listing
form and the search filter; the canonical `Select` / filter components are unchanged.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A listing of each active catalogue type is created — test:
  `src/modules/listings/actions/ownerPublish.integration.test.ts` (extended: `createListing` with each active slug read
  from `property_types` succeeds; red first for `parking` today, measured).
- AC2 The underground-floor search answers — test: `src/tests/integration/listingAccessState.integration.test.ts`
  (extended: the query `filterEngine` builds for `floor_min=-1` answers without error; measured first).
- AC3 The catalogue and the enum agree — test: `src/tests/integration/propertyTypeCatalogue.integration.test.ts`.
- AC4 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/changed-lines-coverage.mjs
  --base main`, `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. Wait for O979-1. Branch from `main`.
2. Tests first (AC1-AC3) against the live project with `SECURITY_TEST_PROJECT_REF`; save each failing output.
3. The SQL files and the application change of the chosen direction. Hand over to Opus; Opus proves the preflight (and,
   for "leaves", the rollback with `db-sql-roundtrip.mjs`) and gives the owner the apply step.
4. After the apply: `v1-verify.sql`, AC1-AC4.
5. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
