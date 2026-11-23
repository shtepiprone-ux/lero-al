# Task 962 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_962_Hardening_V8b_Promises_The_Code_Relies_On.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_962_Hardening_V8b_Promises_The_Code_Relies_On.md) · OWASP record: [Task_962.json](../security/owasp/reviews/Task_962.json)

Review 2 of Revision 1, working tree on 791f7f1fb (uncommitted, branch `task/962-hardening-v8b2`) — APPROVED
Scope: the Revision 1 diff (R1-1): `src/tests/__tests__/v8b2Sql.test.ts` only; the four tracked test files are as Review 1 read them (`git diff --stat
791f7f1fb -- src` → 4 files, 266 insertions, 5 deletions, as in Review 1); the three SQL files are the applied ones (md5 `v8b2.sql`
`27e9edb1ab98e14a57e06aad289d4d06`, `v8b2-rollback.sql` `23b2e55b351a93be0ded043aff20c066`, `v8b2-preflight.sql` `385bf5d91cf1cf356a70d18f52b95a3e`).
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success` on
`5d7bd89ec`; `npm test -- src/tests/__tests__/v8b2Sql.test.ts` → exit 0, 2 passed; the break (EUR ceiling `10000000000` → `10000000001` in `v8b2.sql`,
restored in `finally`) → exit 1, "expected 10000000001 to be 10000000000", md5 before and after `27e9edb1…`; `owasp.mjs review <kickoff> --base origin/main`
→ exit 0. Review 1, after the apply: the four integration files → 50 passed. Not run (A5): `tsc`, lint, the full unit and integration runs, build, census.
Findings: Critical 0, High 0, Medium 0, Low 0; F1 fixed
Overall risk: low; the five database rules hold on the live project with their tests, the way back is proven, and the open proof is the pull request's CI.

## Secure code review (`secure-code-review.md` §2, §3)

One test file shortened: no entry point, query, permission, schema, dependency or configuration. Every category of §3: not touched by Revision 1; the
categories of the task are answered in Review 1. Tests: no assertion of AC1-AC8 was removed; what left the file was outside AC3 (F1).

## Rendered comparison (V5a)

No visible element changes (SQL and tests only); V9: no Story changes.

## Findings

F1 — fixed in Revision 1 (R1-1), proven above.

## Acceptance criteria

- AC1-AC6: the integration files pass after the apply and failed before it (Review 1); AC3's unit test fails on a changed ceiling (above).
- AC7: `db-sql-roundtrip.mjs` exit 0 with LF and CRLF files, and the body of `handle_new_user` restored byte for byte (Review 1).
- AC8: `gh pr checks <n>` (V14).

## V14 — pull request #67 (commit `b570ad041`), 2026-11-23

`gh pr checks 67` → red: "Lint, types and product checks" and `CI Required`; every other check passes, "Authorization regression" (the whole integration
suite on the development project, the new rules applied) and "Unit and component tests" among them. `gh run view 45235195045 --log-failed`: the step
"Every file in the repository" (`check-files.mjs`) → 3 findings in `docs/security/audit-2026-11-06/findings.md`: A-05 (`:19`), X-01 (`:109`) and C-05
(`:141`) end in "Task 957", which the H7 archive of Task 957 (Opus) took out of `docs/backlog.md`, so the golden-rule check finds no open task. The
archive step did not read the audit ledger, and `check-files.mjs` was run on the changed files only. Fixed in this pull request: each row ends in "fixed"
with the task and pull request that closed it and its existing test (A-05 Task 1014, PR #54, `route.test.ts` `[SEC-UPLOAD-SNIFF-DENY]`; X-01 Task 957,
PR #66, `cloudinarySignedUpload.integration.test.ts` and `cloudinary-config.mjs`; C-05 Task 1011, PR #55, `cloudinaryDelete.security.test.ts`);
`check-files.mjs docs/security/audit-2026-11-06/findings.md` → exit 0. The steps after it in that job ("Product checks") were skipped: UNKNOWN until the
next run.

Open parts, in order: the commit and push of the fix → `gh pr checks 67` → the merge.
