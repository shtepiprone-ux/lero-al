# Task 1007 — Review 4

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json) · Previous: [Review 3](Task_1007_Review_3.md)

Review 4 of the working tree on dd2a28ba5 (pull request #70, uncommitted Revision 2) — APPROVED
Scope: Revision 2 changed `scripts/check-signed-in-pages.mjs` (+73 −4), `scripts/__tests__/check-signed-in-pages.test.ts` (+170 −3) and added
`src/components/admin/__tests__/AdminShell.pages.test.tsx` (68 lines): exactly R2-1 and R2-2. The other uncommitted files are Opus's: the kickoff (Revision 2
block, review links), the five kickoffs of F4 and `docs/reviews/Task_1007_Review_3.md`. `AdminShell.tsx` is unchanged.
Tools (local, 2026-11-24): `npm test --` the AdminShell and walk tests → exit 0, 2 files, 76 passed (3 + 73), as reported; the Route's ten files → exit 0, 315
passed; `npx eslint` on the three changed files → exit 0; `check-files.mjs` on them → exit 0; `tsc` limited to the two test files and what they import (a
temporary config extending `tsconfig.json`, removed after the run) → exit 0, so the new `.ts` import of the walk passes the type check; CI runs Node 22.22.3
(`.github/workflows/ci.yml:40`), which strips the types of `src/lib/auth/adminPages.ts` (the executor loaded the walk on that version: exit 0, the warning
`MODULE_TYPELESS_PACKAGE_JSON` only); `owasp.mjs review <kickoff> --base main` → exit 0. Not run (A5): the walk itself, the build, the full runs, CI.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: F2 and F3 are fixed with tests that fail without the change; F4 is fixed (Review 3). The walk reads the live switches per moderator visit and
never writes one.

## Checklist V on the revision

- V2: three files, all of R2-1 and R2-2; no product file changed.
- V3: the reported runs reproduce (above); the executor's failing-first runs (AdminShell 2 of 3, the walk 22 of 73) and the I9 break (19 of 73) match V8.
- V4: `moderatorExpectation` (`scripts/check-signed-in-pages.mjs:168-178`) follows `src/app/admin/page.tsx:29-44`: the dashboard with `page.dashboard`, else
  the first path of the first key in `ADMIN_PAGES` order other than the dashboard, else the page; a keyed row off is `NOT_FOUND`, redirects included.
  `readModeratorPageKeys` (`:184-194`) selects only and throws on an error, so a failed read fails the row (`:419`). `judgeVisit` takes the expectation as an
  optional argument with the row's entry as its default, so every other role and row is judged as before. The key list is `ADMIN_PAGES`, imported.
- V5, V5a, V9: no visible element changes (a CI script and tests); the measurements of Review 1 stand.
- V6: no exemption, `skip` or `eslint-disable` added.
- V7: Tests and Dependencies and configuration — touched: the walk is a CI check of signed-in pages; it reads `role_permissions` with the service role of
  `fixtures.createRun()` (already the walk's client) and writes nothing (the test at `scripts/__tests__/check-signed-in-pages.test.ts:603` passes a client with only the four read
  methods); its output prints error codes only. Every other category — not touched.
- V8: each change undone once, then restored byte for byte (md5): the shell stops passing `allowedPaths` → 2 of 3 fail; Footer back to `STAFF_ONLY` → 2 of 73
  fail; the switches ignored (`return today`) → 17 of 73 fail; the landing ignores `page.dashboard` → 2 of 73 fail.
- V10: `owasp.mjs review` exit 0; the record's verdicts are unchanged (no new sheet triggered).

## Notes

- The Authorization regression job switches `page.users` off and on for a moment (AC3); the walk reads the switch just before each moderator visit, so a
  run can mis-judge a `/admin/users` row only if the toggle falls between that read and that visit (milliseconds). Not a defect of the diff; a red row of
  that kind is rerun, never loosened.
- The executor's own notes: a Node import check and an empty interactive Python start outside the listed commands, no effect on the tree (`git status`).

Open parts, in order: the commit and push to pull request #70 (H) → `gh pr checks 70` → the merge → the moderator check of Route step 5 → the archive
(H7).
