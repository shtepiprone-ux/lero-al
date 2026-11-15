# Task 978 — The hand-written database types equal the catalog, and CI keeps them equal

Sprint 93. Priority P2. Found 2026-11-15 by Task 956 Part A review 1 (`db-types-drift.mjs` on the live catalog); the
whole-project audit L-04 (`docs/security/audit-2026-11-06/findings.md`: the types are written by hand). No owner decision
needed beyond Task 979's. Implementers: Sonnet (`src/types/database.ts`, the code that reads a changed type, the SQL,
`scripts/check-schema-drift.mjs` and its documents; never applies SQL); Opus (the CI step and the rule in
`.claude/rules/quality-gates.md`; `flow.md` §2 forbids `.github/**` and `.claude/**` to Sonnet). The owner applies.
Reviewer: a separate Opus session.

## Goal

`node scripts/quality/db-types-drift.mjs --catalog <live snapshot>` (Task 956 Part A review 1, 2026-11-15) exits 1 with
42 differences between `src/types/database.ts` and the live catalog:
- 21 columns are nullable in the catalog while the type does not admit null (`created_at` of 12 tables, `updated_at` of
  `listings` and `pages`, `listings.expires_at`, `listings.multi_storey_building`, `listing_views.viewed_at`,
  `currency_rates.fetched_at`, `currency_rates.source_url`, `contact_inquiry_replies.replied_by`,
  `report_actions.actor_id`); `support_tickets.complaint_type` is NOT NULL while the type admits null.
- 19 catalog columns have no property: `companies.created_by`, `listings.price_initial` and 17 `*_name` columns
  (`contact_inquiries.handled_by_name`, `pages.updated_by_name`, `support_tickets.assigned_to_name` and 14 more, each in
  the tool's output).
- `listings.property_type`: the type allows `parking`, the enum does not (Task 979).
Nothing fails when they drift: `scripts/check-schema-drift.mjs` only writes SQL for a person to run, and maps
`DBExchangeProvider` (`scripts/check-schema-drift.mjs:70`), an interface `database.ts` no longer has. After the task
`node scripts/quality/db-types-drift.mjs` exits 0 on the committed `supabase/catalog.json`, CI runs it on every pull
request, and every database task re-saves the snapshot after its apply.

## Scope

- Nullability, per column of the 22: when the column has a default, every application write sets it or relies on the
  default, and the preflight counts 0 null rows, the database gains `NOT NULL` (the code already reads a value);
  otherwise the type admits null and every reader the grep `\.<column>\b` finds handles null. The report lists the
  choice and its evidence per column. `complaint_type`: the type loses `| null` and every writer is shown to set it.
- The 19 missing columns become properties with the catalog's type and null rule.
- SQL in `supabase/sql_migrations/task978/`: `v1.sql`, `v1-rollback.sql`, `v1-preflight.sql` (read-only: null rows per
  column that gains `NOT NULL`; any non-zero count stops the apply), `v1-verify.sql`; one transaction, schema-qualified.
- `scripts/check-schema-drift.mjs`, `scripts/schema-drift-check.sql` and the `check:schema-drift` script are removed;
  `docs/qa-rules.md` and `docs/integrations.md` name `db-types-drift.mjs` instead.
- Opus: a step `node scripts/quality/db-types-drift.mjs` in the `quality` job of `.github/workflows/ci.yml`; in
  `.claude/rules/quality-gates.md` the rule "a database task re-saves `supabase/catalog.json` with
  `db-catalog-audit.mjs --save` after its apply, in the same pull request".
- Dependencies: Task 956 applied and its `supabase/catalog.json` committed; Task 979 decided (its `property_type` line).
- Out of scope: types for the six relations no interface describes (`amenity_translations`, `exchange_providers`,
  `listing_translations`, `location_translations`, `page_translations`, `reauth_failures`; the tool lists them), the
  security changes of Tasks 956 and 962.

## Attack surface

Unchanged for sessions: the SQL only adds `NOT NULL` to columns the preflight shows are never null. A CI step reads a
committed file; no new secret or network access (the snapshot holds no secret, `db-catalog-audit.mjs` header).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-15).

- AI_Agent_Security: not applicable — the rule added to quality-gates.md is about the database snapshot; no agent tool, permission or hook changes.
- Authentication: not applicable — `reauth_failures` is named only as a relation without a type; no sign-in code changes.
- Authentication_Patterns: not applicable — no authentication code changes; only row types and NOT NULL constraints.
- Authorization: not applicable — no policy, grant or role changes; the snapshot is read, not changed.
- Authorization_Decisions_And_Output_Handling: not applicable — `v1.sql` adds NOT NULL only; no authorization predicate changes.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the drift step joins the quality job that `CI Required` gates on every pull request — AC2.
- Cookie_Theft_Mitigation: not applicable — no cookie or session changes.
- Credential_Stuffing_Prevention: not applicable — no sign-in path or limit changes in this task.
- Database_Security: not applicable — no permission changes; NOT NULL constraints only, proven by AC3 and AC4.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the new step runs in the existing quality job under the workflow's empty permissions and needs no token or secret — AC2.
- GraphQL: not applicable — no API schema or access change.
- Injection_Prevention: not applicable — the SQL files are static migrations; no query is built from input.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — a column that gains NOT NULL refuses null on the direct database path — AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL run on every changed file — AC6.
- Key_Management: not applicable — no key is created, stored or rotated.
- LLM_Prompt_Injection_Prevention: not applicable — no agent input path changes.
- MCP_Security: not applicable — no MCP server or tool changes.
- Mass_Assignment: not applicable — no writable field list or column grant changes.
- Multi_Tenant_Security: not applicable — no tenant predicate or RLS role changes.
- Multifactor_Authentication: not applicable — no sign-in factor changes in this task.
- OS_Command_Injection_Defense: not applicable — the removed script and the new CI step start no process from input.
- Prototype_Pollution_Prevention: not applicable — the types file holds no runtime code.
- Query_Parameterization: not applicable — static migration; no dynamic SQL.
- SQL_Injection_Prevention: not applicable — static migration; no value from input reaches SQL.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — the committed snapshot passes the secret checks of check-files — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns the drift tool and the AC tests, not the report — AC1, AC3.
- Session_Management: not applicable — no session handling changes in this task.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — the CI step adds no action or package; it runs a repository script — AC2.
- Transaction_Authorization: not applicable — no transaction or approval flow changes.
- Verifying_Third_Party_Agent_Execution_Evidence: "Reconcile supplier reports with observations you control when possible" — the quality job result is read from GitHub with `gh pr checks <n>` — AC2.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The hand types equal the catalog — test: `node scripts/quality/db-types-drift.mjs` exits 0 on the
  `supabase/catalog.json` saved after the apply (exit 1 with the 42 before, kept in the report).
- AC2 A drift fails CI — test: the `quality` job of this task's pull request runs the step (`gh pr checks <n>`), and a
  planted extra property in `database.ts` turns it red locally (`node scripts/quality/db-types-drift.mjs` exit 1),
  restored.
- AC3 A column that gains `NOT NULL` refuses null on the direct path and the application still writes — test:
  `src/tests/integration/accessHardening.integration.test.ts` (extended: per such column an insert or update with null
  answers `23502`) and the integration suites of every table touched stay green.
- AC4 Rollback restores the previous catalog — test: `node scripts/quality/db-sql-roundtrip.mjs
  supabase/sql_migrations/task978/v1.sql supabase/sql_migrations/task978/v1-rollback.sql` exits 0 (run by Opus before
  the apply, D91).
- AC5 The old guard is gone — test: `src/__tests__/repo/noHandRunSchemaDrift.test.ts` (new: `package.json` has no
  `check:schema-drift` script, `scripts/check-schema-drift.mjs` and `scripts/schema-drift-check.sql` do not exist, and
  `docs/qa-rules.md` and `docs/integrations.md` do not name them).
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/changed-lines-coverage.mjs
  --base main`, `node scripts/quality/check-files.mjs --worktree`, `node --test "scripts/quality/*.test.mjs"` exit 0.

## Route

1. Branch from `main` after Task 956 is merged. Run `node scripts/quality/db-types-drift.mjs` and keep the output.
2. Per column of the 22: the default, the writers, the null count (read-only); write the choice table.
3. Tests first (AC3) against the live project with `SECURITY_TEST_PROJECT_REF`; save each failing output.
4. Change `database.ts` and its readers; write the four SQL files; remove the old guard (AC5). Hand over to Opus: the CI
   step and the rule; Opus proves the preflight and the rollback and gives the owner the apply step.
5. After the owner's apply: `v1-verify.sql`, `db-catalog-audit.mjs --save supabase/catalog.json`, AC1-AC6.
6. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
