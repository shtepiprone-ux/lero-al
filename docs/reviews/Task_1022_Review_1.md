# Task 1022 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1022_A_Parking_Listing_Can_Be_Saved.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1022_A_Parking_Listing_Can_Be_Saved.md) · OWASP record: [Task_1022.json](../security/owasp/reviews/Task_1022.json)

Review 1 of the working tree on 36fc0c07f (branch `main`, uncommitted) — NEEDS REVISION
Scope: diff-based; 4 new files (`supabase/sql_migrations/task1022/task1022.sql`, `task1022-rollback.sql`, `task1022-verify.sql`, `src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts`); no entry point changes; the database enum `public.property_type` (owner-applied)
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45905563415 green; the AC1 test → exit 1 as designed before the apply; ESLint → exit 0; typecheck → exit 1, 80 errors, all in the untracked `.next/types/validator.ts`; `db-catalog-audit.mjs` → exit 0; `db-sql-roundtrip.mjs` → exit 1 (F1)
Findings: Critical 0, High 0, Medium 1, Low 0
Overall risk: the change file and the test remove the Cause; the way back cannot run, so the owner cannot apply the SQL until the rollback is fixed.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45905563415 success (Task 988 merge), Scorecard and Repository settings success.
- V2: `git status --short --untracked-files=all` on `36fc0c07f`: outside Opus's documentation only the four Scope files, all new. No file outside the Scope.
- V3: every claim of the report rerun:
  - `npm test -- src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts` → exit 1, 2 failed, both naming `parking` (as the report says; expected until the apply and the snapshot refresh).
  - `npx eslint --no-warn-ignored --max-warnings 0 src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts` → exit 0.
  - `npm run typecheck` → exit 1 (the report says 2): 80 errors, every one in `.next/types/validator.ts` (untracked build output of 2026-11-21, included by `tsconfig.json:35`); 0 in `src`. Not a defect of this diff: CI's TypeScript step runs on a fresh checkout without `.next`, as in Task 988 Review 9. V14 reads it.
  - §8.1 import graph: `npx vitest related --run --reporter=verbose` over the four new files → 1 file (the new test, 2 failed as designed), exit 1; with `--config vitest.integration.config.ts` → "No test files found", exit 0. Text search `propertyTypeEnum|sql_migrations/task1022|task1022` over the test files → no match, exit 1. No reached test was left out.
  - LF: all four files have no CR (read with `cat -A`).
- V4: read once, every line of the four files. `task1022.sql:5` adds `parking` after `garage`, which removes the Cause. `task1022-verify.sql` compares the labels in order as `name[]` and checks `NOT NULL` with `udt_schema`. The test walks the snapshot for the one column `listings.property_type` and holds `PROPERTY_TYPES` and `step1Schema.shape.property_type.options` against it. `task1022-rollback.sql:17-23` alters the column type while a trigger names the column (F1).
- V5: no file of `src` other than the new test changes; the form, the schema, the actions and their errors are byte-identical to `main`.
- V5a: no visible element changes (no file of `src/components`, `src/app`, `src/design-system` or a Story in the diff); nothing to measure.
- V6: the diff adds no `eslint-disable`, `.skip`, `.only`, `.todo`, `@ts-*`, allowlist, baseline or registry row (read in V4).
- V7: below.
- V8:
  - AC1: on `main`'s snapshot the test fails (V3). With `"parking",` inserted after `"garage",` at `supabase/catalog.json:5625` → 2 passed, exit 0; the file restored from its copy, `git diff --quiet supabase/catalog.json` → exit 0.
  - AC2: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task1022/task1022.sql supabase/sql_migrations/task1022/task1022-rollback.sql` → "task1022-rollback.sql failed: cannot alter type of a column used in a trigger definition", exit 1; the same with CRLF copies → exit 1 (F1). A draft rollback with the trigger dropped before step 2 and recreated after it → "the rollback restores the catalog (4 catalog row(s) changed by the change file)", exit 0.
  - AC3: after the apply (not yet done).
  - AC4: after the push.
- V9: no Story changed; nothing for the owner's look in Storybook.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 14 sheets triggered by the diff; the record covers them and the 4 more of the kickoff's "## OWASP": `Database_Security` is F1, `Input_Validation`, `Secure_Coding_with_AI` and `Verifying_Third_Party_Agent_Execution_Evidence` are met, the rest not applicable with reasons.
- V11: one finding, below.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: NEEDS REVISION.

## V7 — secure code review

Six steps: (1) no control weakened: no grant, policy, check or test changes; (2) no new entry point, parameter, outbound call or sink; (3) no trust boundary moves (the same session writes the same row); (4) no package; (5) no test or rule weakened; (6) categories:
- Authorization, Authentication, Requests and redirects, Next.js entry points, Files, Data exposure: not touched (`git status` shows no file of `src/app`, `src/lib`, `src/modules/*/actions` or a route).
- Input and output: touched only by the test (`propertyTypeEnum.test.ts:34-42`), which pins the server schema's allowlist to the enum.
- Business logic: touched: the enum is the database twin of the type allowlist; it gains the one value the server already accepts.
- JavaScript and TypeScript: the test has no regular expression and no untrusted input.
- Dependencies and configuration: not touched. Agent and tool output: `check-files.mjs` runs on the staged files at commit (§4). Tests: AC1 fails without the change (V8).
- Data: `node scripts/quality/db-catalog-audit.mjs` → "no finding", exit 0 (before the apply).

## Findings

F1 — The rollback cannot run: the trigger `listings_catalogue_active` names the column
Severity: Medium      Category: Business logic (database change without a proven way back)      CWE: —
Location: `supabase/sql_migrations/task1022/task1022-rollback.sql:21`
Description: Postgres refuses `alter table public.listings alter column property_type type …` while a trigger definition names the column; `listings_catalogue_active` fires `before insert or update of property_type, currency` (`supabase/sql_migrations/task962/v8b2.sql:72-74`; live, read-only 2026-11-27, `pg_get_triggerdef`). The kickoff's Scope listed views, policies, CHECKs, the index and the default, and missed the trigger: the cause is in the design, the file follows it.
Impact: the owner would apply a change whose way back fails; AC2 is not met.
Reproduction: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task1022/task1022.sql supabase/sql_migrations/task1022/task1022-rollback.sql` → exit 1, "cannot alter type of a column used in a trigger definition".
Recommendation: Revision 1, item 1.
References: OWASP Database_Security; `.claude/rules/checklists/handoff.md` H4.
Status: open

## Revision 1 (for the implementer)

1. F1: in `supabase/sql_migrations/task1022/task1022-rollback.sql`, step 2: first `drop trigger listings_catalogue_active on public.listings;`, then the existing rename, create type, alter column and drop type, then recreate the trigger exactly as `supabase/sql_migrations/task962/v8b2.sql:72-74` (`create trigger listings_catalogue_active before insert or update of property_type, currency on public.listings for each row execute function public.listings_catalogue_active();`). Add the trigger to the comment of line 3. Nothing else changes.

## Open for Opus and the owner

- Opus: AC2 on the revised rollback (LF and CRLF); then the owner applies `task1022.sql` and `task1022-verify.sql`; Opus AC3 and `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json`; AC1 passes before the push.
