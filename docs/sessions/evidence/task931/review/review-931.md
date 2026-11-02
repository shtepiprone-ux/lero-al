# Task 931 — independent review 1 (Opus), 2026-11-01

Decision: **APPROVED WITH NOTES**. Kickoff (archived at closure):
`tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md`; contract kind `product`, QA Q4.
Executor report: `docs/sessions/evidence/task931/impl/completion-report.md` (status `PARTIALLY IMPLEMENTED` only because of
the two global checks of AC8, see N2), used as an index; every claim below was re-established in this session.

## Candidate and ownership (R1, R2)

- Branch `task/935-governance-approval-route`, `HEAD` `8ec8096f312fd2153d797da3f5c2654d74c09ba1`; PR #12 head
  `01b8259fa7e118e0990928fbbc2a5281b9447c14`; `origin/main` `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`. Candidate: the working tree.
- Task-owned changes: the 7 test files of kickoff §4, `docs/critical-flow-registry.md` (two rows), the 931 kickoff and sidecar
  (the design revision C26–C29 of 2026-11-01 and stage), `docs/sessions/evidence/task931/**` (design revision, `ids.cjs` →
  `ids.mjs`, impl, security, review). `git diff --name-only -- src/` lists exactly the 7 test files; `git status` of the six
  planted-break production files is clean.
- Unrelated, not part of this task: `docs/sessions/evidence/task859/**` (5 modified, many untracked), `.playwright-mcp/`,
  `debug.log`, other tasks' untracked evidence, the untracked Task 926 kickoff.
- Baseline: `impl/before.json` (67 tests, 17 failed) has identities equal to `design/d03-local-failed-ids.txt`
  (`impl/before-identities.txt`).

## Requirements and acceptance criteria (R3, R4)

| AC | Verdict | Evidence inspected or run in this session |
|---|---|---|
| AC1 [R1, R2] | PASS | `npx vitest run <7 files> --allowOnly=false --retry=0`: 76 total, 76 passed, 0 failed, 0 skipped, exit 0. The 17 identities pass or map to their new names (`impl/rename-map.txt`, completion report). R1: the cron double supports both read chains, records every `update` with its filters; lapsed → `expired 0`, `would_expire`, ids, `limit(1000)`, no update; GET mirrors POST; both failed reads → 500 `read_failed`, no update; the old engine-resolved test is rewritten as "while paused, no listing status is written". R2: the `update` double applies each `.eq` to the current row and answers `.select('id')`; the ALLOW test also asserts the compare-and-set filters `[id, status]`. |
| AC2 [R3] | PASS | Real `AdminListingsPage` → real `requireStaffPage` (`src/lib/auth/staff.ts:84-96`) on a `requireViewer` double; `notFound`/`redirect` throw recognisable errors; a `user` viewer rejects with `NotFoundError` and `pageSelects` stays empty. `SEC-931-FE-PAGE-ALLOW`, `-PAGE-DENY`, `-STATUS-ERROR` passed. |
| AC3 [R4, R5] | PASS | `permissions.test.ts`: `@/lib/auth/server` mock removed, `requireViewer` double; refused viewers (`unauthenticated`, `lookup_failed`) → `false` and `forbidden` with no admin-client or user-client call; client-factory mocks kept for `roleHasPermission`. `getModeratorPermissions`: admin → stored rows; user and moderator → `forbidden` with no `role_permissions` read (the stored-rows admin client is installed, so a read would succeed); read error → all-false map + `console.error`. Six SEC cases passed; `npm run test:admin` exit 0 (executor transcript, 38 tests, re-covered by the full suite below). |
| AC4 [R6] | PASS | The token reaches `signUp` (`options.captchaToken`) and `verifyTurnstile` is not called; a Supabase refusal (code `captcha_failed`) and a message-only refusal → `captcha_failed` with `supabaseErrorMessage`, matching `src/modules/auth/actions/captcha.ts:12-14,40`. Both SEC cases passed. |
| AC5 [R7, R2, R1] | PASS | `access.test.ts`: `requireViewer` double; both client factories throw and record on any read (none made); `lookup_failed` → `not_agent`; missing/deleted profile → `unauthenticated` (C15); role `null` → `not_agent`; dropped `console.error` expectation is named in the report and correct (`access.ts` no longer logs, `src/modules/cabinet/statistics/access.ts:14-22`). Six SEC cases passed. |
| AC6 [R8] | PASS | `git diff docs/critical-flow-registry.md`: only the Signup and Listing expiry reconciliation rows changed; neither claims a Turnstile rejection by the action or an expiry write; both name the current tests and SEC IDs. |
| AC7 [R9] | PASS | Six transcripts `impl/sensitivity/P1…P6-*.txt` (`run-plants.mjs`): baseline pass, one-line break, the named case fails with an assertion (not a compile or import error), restored bytes identical, `git diff --exit-code -- <file>` exit 0. Re-checked here: the six production files are clean. |
| AC8 [R1–R9] | PASS with N2 | Full suite `npm test -- --allowOnly=false --passWithNoTests=false --retry=0`: 5931 total, 5931 passed, 0 failed, 0 pending, 351 files, exit 0 (this session). `npm run typecheck` exit 0; `npx eslint <7 files> + run-plants.mjs + report.mjs + design/*.mjs` exit 0 (this session). Build: test-only diff; executor transcript `impl/build.txt` "Compiled successfully", `build exit=0`. `check:file-integrity -- --files <task files>` PASS (11 files, this session). Global `check:file-integrity` and `check:mojibake` exit 1 on other tasks' files only (N2). Report regenerated after R10 (b)/(c) and the archive move (`r10-02-report.txt`, 17/17 passed). |
| R10 | DONE | (a) stage `reviewed`; (b) `scope-rebase-923.md`; (c) `scope-rebase-935.md`; (d) report rerun; (e) review block. Anchors and validation: `r10-00-before.txt`, `r10-01-after.txt`. |

Security rows: frontend (real page + real `requireStaffPage`; real `ListingPreviewDialog`) and server (real actions and handlers
with doubles at the `requireViewer`, admin-client, Supabase Auth and cron-request boundaries) are both present and mapped.
Database/integration: no runtime, SQL or provider change; the real boundaries stay with the reviewed Task 923 D8/D9 contract.

## Notes (P3, non-blocking)

- **N1 — stale number in a case title (task design).** `SEC-931-SRV-MODPERM-ALLOW` keeps "13 keys present" in its title
  because the sidecar `testName` fixed that text, while the registry holds 21 keys and the test asserts
  `PERMISSION_KEYS.length` plus every key present. The assertion is correct; only the title's number is stale (executor
  question D2). Resolution: at the next edit of this file, rename the title and the sidecar `testName` together to
  "every registry key present".
- **N2 — AC8 global checks fail on other tasks' artifacts (environment).** `check:file-integrity` (default mode): two
  untracked Task 923 `.nul` files under `docs/sessions/evidence/task923/review-67/`. `check:mojibake`: 1282 artifacts in
  five files of Tasks 923 and 927, two of them tracked since `d8a07a3c7` (`task923/r33-13a-mojibake.txt`,
  `task927/base/unit-base-failures.txt`). No Task 931 file is flagged; neither check runs in `.github/workflows/`. The
  tracked NUL file and the mojibake allowlist entry are already Task 937's scope; the untracked files must never be staged.
- **N3 — loose read doubles (pre-existing pattern).** The cron read double ignores the filter values of
  `.eq('status','active')` and `.lt('expires_at', …)`; a changed filter value would not fail a test. Not introduced by this
  task and outside its requirements.

## Cross-task obligation (not a Task 931 defect)

- **Task 937 R12 re-stales the 935 contract,** exactly as Task 931 did before its revision (C26–C29): 937's reviewer
  appends a 923 `scope` entry, which writes the 923 contract file that the 935 scope lists, while the 937 sidecar does not
  scope that file (`scope.includes(<923 contract>)` = `false`) and its route has no 935 entry. The same correction applies
  (add the 923 contract file to the 937 scope; its reviewer appends a 935 `scope` entry chained on the last 935 entry). It
  belongs to the Task 937 design or review cycle, before its R12.
- **Task 941 and 943 approvers** chain their 935 entries after the Task 931 entry recorded here.

## Closure

The 931 kickoff and sidecar moved to `tasks/Archive/` (task path and hash updated, stage `reviewed`, report regenerated by
`review/report-archived.mjs`, a reviewer copy of `security/report.mjs` taking the contract path); the Task 923 and Task 935
contracts carry the R10 `scope` entries by the archived path; the Sprint 92 file row, `docs/backlog.md` and
`docs/backlog-archive.md` record the approval. Open: owner commit and branch push; PR #12's Unit and Component Tests job
green after the push; merge only after every required check is green.
