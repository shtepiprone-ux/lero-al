# Task 1011 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_1011_Cloudinary_Keeps_No_Unused_Upload.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1011_Cloudinary_Keeps_No_Unused_Upload.md) · OWASP record: [Task_1011.json](../security/owasp/reviews/Task_1011.json)

Review 2 of PR #55, head cfa2f5b1a — NEEDS REVISION
Scope: the CI result of the pull request (V14); the diff is the one of Review 1
Tools: `gh pr checks 55`, `gh run view 45053076568 --log-failed`, local test runs below
Findings: Critical 0, High 0, Medium 1, Low 0
Overall risk: unchanged; the product code is the one Review 1 read, the pull request cannot merge while CI is red.

## Tools (2026-11-22)

- V14: `gh pr checks 55` → 21 pass, 2 fail: "Unit and component tests" and "CI Required" (which needs it). `gh run view 45053076568 --job 137302258461 --log-failed` → Test Files 2 failed | 401 passed, Tests 16 failed | 6718 passed; the two files are `src/lib/__tests__/cloudinary.security.test.ts` and `src/lib/__tests__/cloudinarySignature.test.ts`; the logged lookup error is `pages.content: db.from(...).select(...).order is not a function`.
- Local, on cfa2f5b1a: `npm test -- src/lib/__tests__/cloudinary.security.test.ts src/lib/__tests__/cloudinarySignature.test.ts` → 16 failed | 13 passed, exit 1. With both files set to their `9de067faf` version (3 added lines, `git diff --stat main 9de067faf -- <the two>`) → 29 passed, exit 0; both files then set back to `HEAD`, `git status --short` empty.

## Findings

F1 — Medium — `src/lib/__tests__/cloudinary.security.test.ts:28`, `src/lib/__tests__/cloudinarySignature.test.ts:16` (rule: V14, A1). The paged `pages` read (`src/lib/cloudinaryDelete.ts:111`) calls `.order().range()`; the Supabase mocks of these two existing tests answer only `eq`, `ilike` and `limit`, so every reference check fails closed and 16 cases of `deleteAsset` fail in CI. The Scope of the kickoff did not name these mocks (a design defect of the kickoff, D; Review 1 ran only the Route's four files and approved before CI, V14). The owner added the two files to the Scope (2026-11-22, translated: "option 1"). Required change: "Revision 1" of the kickoff — both files whole from `9de067faf`, which adds only the `order` mock (2 lines and 1 line).

## Open parts

- Sonnet: Revision 1 (checklist I).
- Opus: Review 3 of the revision, then `gh pr checks 55` until every check has concluded.
