# Task 931 — design and readiness record (Opus, 2026-11-01)

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`
at `c2f918a59`.

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | `docs/backlog-reserved.md` 931 row; owner D7, D8, D9 (2026-11-01) | 17 IDs in 7 files; fixed in code or test, never skipped; published in PR #12 | PASS |
| C2 reproduction | `npx vitest run <7 files> --reporter=json` → `d00-baseline-7-files.json`, `d03-local-failed-ids.txt` | 67 tests, 50 passed, 17 failed | PASS (EXECUTED) |
| C2 identity | `d02-ci-unit-failed-ids.txt` (CI run 41296776854 artifact) vs `d03` | identical failing identities; CI total 5922 with 17 failed, all in these 7 files | PASS (EXECUTED) |
| C2 cause | `git show d8a07a3c7` on route.ts, permissions.ts, admin permissions.ts, captcha.ts, access.ts, applyListingTransition.ts, page.tsx | each source changed on purpose (D56/D58, R44, R67 (c), R67 (e), R68 (a), R75 (e)); the 7 tests were not updated | PASS (EXECUTED) |
| C2 accidental passes | `sources/...access.test.ts.txt:88-92` with `requireViewer.ts.txt:46` and `access.ts.txt:18` | the missing-profile test expects not_agent but the shipped answer is unauthenticated; it passes only through a failed real lookup | PASS (ANALYTICAL) |
| C3 design | kickoff R1-R10 | test doubles move to the requireViewer / compare-and-set / paused-cron boundaries; removed behaviours rewritten with cited decisions; no production change | PASS |
| C4 proof | sidecar 17 SEC-931 cases; R9 planted breaks P1-P6 | frontend and server allow/deny/error; each planted break reaches a named case | PASS (ANALYTICAL) |
| C6 authority | canonical `isPolicyPath` on every scope path; `phase-write-gate.ps1:37-38` | no policy path; test files are not UI source paths; no `src/app/admin` or `src/components` source in the write set (P1 plants in `src/lib/auth/staff.ts`) | PASS |
| C6 counterexample | `sources/...permissions.test.ts.txt` roleHasPermission tests | they assert "neither client factory called", so R4 keeps their mocks | PASS after correction |
| C6 dependency | Task 940 | the 923 rebase (R10) needs 940 reviewed; implementation does not | PASS (sequenced) |
| C6 evidence gate | `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS | PASS (EXECUTED) |
| C6 ready candidate | canonical `validateContract({...sidecar, executionStatus:'ready'}, {phase:'plan'})` in memory | no errors | PASS (EXECUTED) |
| C7 publication | `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` after saving `ready`; `cli.mjs diff --phase plan --working-tree`; `publication.mjs --base HEAD` | plan exit 0; diff-plan exit 0 (5 task contracts); publication 0 dependency errors; final digests: kickoff 49cbaf3ba44dc1adfffb40a128333cf812d2dd56a4e5fd20d472218af87b3d23, sidecar file 5c41a9ed0aabdd91c56c1890507f1514d1afa29668b735d5890d598c5944213f | PASS (EXECUTED) |

## Revision 2026-11-01 — cross-task dependency on the Task 935 rebase chain (Opus)

HEAD at the probes: `2c8c51adf`. The sidecar was set to `draft` before the edit and saved `ready` after the in-memory check
(`shared/orchestration-state.md`); stage stays `implemented`, and the implementation awaits review.

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| R1 dependency | `d04-935-rebase-probe.mjs` → `d04-935-rebase-probe.txt` | the 923 D8/D9 contract is in the 935 scope, is not a 935 case test and is not a runtime file; a later write to it changes the 935 digest; it was not in the 931 scope | PASS (EXECUTED) |
| R2 route | kickoff R10 (a)-(e), ledger C26-C29, AC8; sidecar scope gains the 923 contract file | the R10 write to the 923 contract is followed by a 935 scope entry by the reviewed 931 contract, chained on the last 935 entry present at that moment | PASS |
| R3 ready candidate | `d05-ready-candidate.mjs` → `d05-ready-candidate.txt` | ready candidate plan errors `[]`; simulated 935 entry by the reviewed 931 contract `[]`; the same entry without the 923 file in the 931 scope fails with "is outside the scope of" | PASS (EXECUTED) |
| R4 CI lint | `ids.cjs` (introduced in `dfc2fedcf`) fails CI lint with `@typescript-eslint/no-require-imports`; replaced by `ids.mjs` with the same output | `eslint ids.mjs d04 d05` exit 0; `ids.mjs` smoke run on a temporary report printed the expected FAILED line and file count | PASS (EXECUTED) |
| R5 gates | `cli.mjs plan --contract <sidecar>`; `check-kickoff-evidence.mjs --files <kickoff>`; `publication.mjs --base HEAD` | plan exit 0; kickoff evidence PASS; publication 82 explicit files, 0 dependency errors; kickoff taskSha256 ffaf511e4a78be07b1266f9530e850dbcd73f578ce59edf1a423f50bca6304c7 | PASS (EXECUTED) |
| R6 Task 941 | 941 kickoff R5 and AC6 | 941 already rebases 935 and 940 after its own write; no edit needed | PASS |
