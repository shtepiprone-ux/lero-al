# Task 1022 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_1022_A_Parking_Listing_Can_Be_Saved.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1022_A_Parking_Listing_Can_Be_Saved.md) · OWASP record: [Task_1022.json](../security/owasp/reviews/Task_1022.json)

Review 2 of the working tree on 1f8fe168e (branch `task/1022-parking-listing-saved`, uncommitted) — APPROVED
Scope: diff-based; Revision 1 against `1f8fe168e`: `supabase/sql_migrations/task1022/task1022-rollback.sql` (+7, −1); after the owner's apply, Opus's refresh of `supabase/catalog.json` (+1); no entry point changes
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45905563415 green; `db-sql-roundtrip.mjs` → exit 0 (LF and CRLF); the owner applied `task1022.sql` on 2026-11-27; `task1022-verify.sql` → every row ok; `db-catalog-audit.mjs` → exit 0; the AC1 test → 2 passed
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the database now accepts the type the form and the server already offered; the change has a proven way back and grants nothing.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45905563415 success.
- V2: `git diff --stat 1f8fe168e` → only `supabase/sql_migrations/task1022/task1022-rollback.sql`, 7 insertions, 1 deletion: the Revision 1 item and nothing else. After the apply, `supabase/catalog.json` (+1 line, `"parking"` after `"garage"`), the Scope's Opus line.
- V3: every claim of the report rerun: CR count of the rollback file → 0; `npm test -- src/modules/listings/constants/__tests__/propertyTypeEnum.test.ts` before the apply → exit 1, 2 failed naming `parking` (as reported); `npx vitest related --run --reporter=verbose` over the rollback file and `supabase/catalog.json` → "No test files found", exit 0; text search `supabase/catalog|catalog\.json|task1022` over the test files → `propertyTypeEnum.test.ts` (run, below) and `src/tests/integration/listingImageOwner.integration.test.ts:19` (a comment only). No TypeScript file changed since Review 1, so no typecheck; `npx eslint --no-warn-ignored --max-warnings 0` on the test → exit 0.
- V4: read once, the whole rollback file. Step 2 drops `listings_catalogue_active`, renames the type, creates the nine-value type, moves the column, drops the old type and recreates the trigger; `diff` of `task962/v8b2.sql:72-74` with the recreated lines → identical, exit 0. The header names the trigger.
- V5: no file of `src` changes in this revision; the application is byte-identical to `1f8fe168e`.
- V5a: no visible element changes; nothing to measure.
- V6: no `eslint-disable`, `.skip`, `.only`, allowlist, baseline or registry row in the diff.
- V7: below.
- V8:
  - F1 / AC2: the rollback of `1f8fe168e` → "cannot alter type of a column used in a trigger definition", exit 1; the revised file → "the rollback restores the catalog (4 catalog row(s) changed by the change file)", exit 0, with LF and with CRLF copies (md5 `task1022.sql` bba3ca53bade8e609df2f4d00966db48, `task1022-rollback.sql` b1d602346a300dd16432c7508b883629, `task1022-verify.sql` 396c3a56858f9f2299dd632e9dffa0c9).
  - AC3: before the apply, `task1022-verify.sql` read-only → row 1 false, row 2 true; the owner applied `task1022.sql` ("Success. No rows returned") and ran the verify (both true); rerun read-only → both true, exit 0; `node scripts/quality/db-catalog-audit.mjs` → "no finding", exit 0.
  - AC1: `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json` → exit 0, the diff is the one line `"parking"`; the test → 2 passed, exit 0 (it failed on the previous snapshot, Review 1 and V3 above).
  - AC4: after the push (V14). PR #84, run 45972616229 on `692e296aa`: "Lint, types and product checks" failed at `node scripts/quality/check-files.mjs --all` → `docs/security/audit-2026-11-06/findings.md:121 [finding-status] P-06: Task 988 is not an open task of docs/backlog.md` (this branch archived Task 988; the OWASP steps passed). The P-06 status now reads "fixed in Task 988 (PR #83)" with its test `src/modules/notifications/lib/__tests__/notificationHref.test.ts`; `check-files.mjs --all` → 0 findings, exit 0; `owasp.mjs review` → the same 14 sheets. Run 45973492256 on `874d9ad7a`: every check of PR #84 passed, `CI Required` success; merged as `8896ef0d7`, `main` run 45977310002 green (18m57s).
- V9: no Story changed.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0, 14 sheets triggered; the record now has `Database_Security` met (F1 fixed), the rest as in Review 1.
- V11: no finding.
- V12: this file, linked from the kickoff; `check-files.mjs` on both.
- V13: APPROVED.

## V7 — secure code review

Six steps: (1) no control weakened: the rollback recreates the catalogue trigger exactly, and `db-sql-roundtrip.mjs` proves the catalog equal after it; (2) no new entry point; (3) no trust boundary moves; (4) no package; (5) no test or rule weakened; (6) categories as in Review 1: only Business logic (the enum, the database twin of the type allowlist) and Tests are touched; `db-catalog-audit.mjs` → exit 0 after the apply.

## Findings

No findings. Review 1's F1 is fixed (V8).

## Open for Opus and the owner

- The owner: the commit, push and pull request; Opus: `gh pr checks <n>` until every check concluded (AC4, V14), then the merge and H7.
