# Task 931 — The full unit suite green again: seven test files back on the code Task 923 shipped

Sprint 92 (moved from the Sprint 78 reservation by D7). P1. QA profile **Q4** (the repaired tests guard auth, permission and
critical-flow-registry rows, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01. Published on PR #12 (D7) as the task for the red
Unit and Component Tests check (D8).

## 1. Mode, task type and rule bundle

Product task, test-only in its final diff. **Implementer: Sonnet, fresh session (`execute-task`). Reviewer: Opus.** Types
(`docs/rule-index.md`): unit/component tests, auth and permission guards, cron route, listing transition gateway. Bundle:
`.claude/rules/shared/security-testing.md`, `security-test-quality.md`, `security-test-environment.md`, `workflow-gates.md` with its
companions, `claim-evidence-contract.md`, `task-readiness.md`. No visible UI change: `Scope: none`.

## 2. Objective

CI's unit job requires 0 failed tests; on PR #12 it has 17 failures in 7 files (C1, C2), reproduced locally with identical identities
(C3). Every one is a stale test double or expectation: one squashed commit of Task 923 changed the code on purpose (C4–C16) and left
these tests on the old contract. Each test is brought onto the shipped behaviour, with no skip, baseline, allowlist or weakened
assertion, and the tests that still pass only by accident through a failed lookup (C20, C21) are moved onto the intended branch.

## 3. Verified context

The cron job is paused by owner decisions D56/D58: it counts lapsed listings (`.limit(1000)`), writes none, answers `expired: 0`, and
a failed read answers 500 `read_failed` (C4–C7). Permission checks take the role from `requireViewer()`, and a refused viewer has no
permission (C8, C9). Moderator switches are read by an administrator only (C10). Supabase Auth is the single Turnstile verifier and its
captcha refusal maps to `captcha_failed` (C11, C12). Agent statistics map `lookup_failed` to `not_agent` and other refusals to
`unauthenticated`, with the owner id from the viewer (C13, C14); `requireViewer` answers `unauthenticated` for a missing or deleted
profile (C15). The transition write is a compare-and-set with a second `.eq` and a `.select` (C16), while the smoke double resolves
after one `.eq` (C17). The admin listings page calls `requireStaffPage()` before any read (C18), which calls `notFound()` for a
non-staff viewer (C19). The statistics test still expects `not_agent` for a missing profile (C20) and the permissions test still mocks
the old auth module (C21). Two critical-flow registry rows describe the removed behaviour (C22, C23). The admin test script runs two of
the files (C24). Three of the files are in the scope of the reviewed Task 923 D8/D9 contract (C25), so its review is rebased by this
task's reviewer through Task 940 (D9). That write changes the reviewed Task 935 contract in turn, which scopes the 923 contract file
(C26), a file that is neither a 935 case test nor a runtime file (C27). An approving contract must scope every file it rebases (C28),
so this sidecar also scopes the 923 contract file, and the same reviewer appends a 935 entry continuing its chain (C29).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The CI unit run on PR #12 had 5922 tests with 17 failed. | source: `docs/sessions/evidence/task931/design/d02-ci-unit-failed-ids.txt:2-2`; observed: `numTotalTests 5922 numPassedTests 5905 numFailedTests 17` |
| C2 | FACT | The 17 failures are in 7 files. | source: `docs/sessions/evidence/task931/design/d02-ci-unit-failed-ids.txt:20-20`; observed: `failed files 7` |
| C3 | FACT | A local run of the 7 files fails the same 17 tests (identities compared, identical). | source: `docs/sessions/evidence/task931/design/d03-local-failed-ids.txt:2-2`; observed: `numTotalTests 67 numPassedTests 50 numFailedTests 17` |
| C4 | FACT | The listings-expiry cron is paused by owner decisions D56/D58 and changes no listing. | source: `docs/sessions/evidence/task931/design/sources/src__app__api__cron__listings-expiry__route.ts.txt:6-6`; observed: `owner decisions D56 / D58` |
| C5 | FACT | The cron reads lapsed listings with a limit. | source: `docs/sessions/evidence/task931/design/sources/src__app__api__cron__listings-expiry__route.ts.txt:37-37`; observed: `.limit(1000)` |
| C6 | FACT | The cron answers zero expired listings. | source: `docs/sessions/evidence/task931/design/sources/src__app__api__cron__listings-expiry__route.ts.txt:55-55`; observed: `expired: 0,` |
| C7 | FACT | A failed cron read answers read_failed with status 500. | source: `docs/sessions/evidence/task931/design/sources/src__app__api__cron__listings-expiry__route.ts.txt:40-40`; observed: `read_failed` |
| C8 | FACT | hasPermission takes the viewer from requireViewer. | source: `docs/sessions/evidence/task931/design/sources/src__lib__auth__permissions.ts.txt:36-36`; observed: `const viewer = await requireViewer()` |
| C9 | FACT | A refused viewer or a viewer without a role has no permission. | source: `docs/sessions/evidence/task931/design/sources/src__lib__auth__permissions.ts.txt:37-37`; observed: `!viewer.role) return false` |
| C10 | FACT | getModeratorPermissions refuses every role except administrator. | source: `docs/sessions/evidence/task931/design/sources/src__modules__admin__actions__permissions.ts.txt:45-45`; observed: `if (viewer.role !== 'admin') throw new Error('forbidden')` |
| C11 | FACT | Supabase Auth is the single verifier of the Turnstile token. | source: `docs/sessions/evidence/task931/design/sources/src__modules__auth__actions__captcha.ts.txt:7-7`; observed: `Supabase Auth is the ONE verifier of the Turnstile token` |
| C12 | FACT | A Supabase captcha refusal maps to captcha_failed. | source: `docs/sessions/evidence/task931/design/sources/src__modules__auth__actions__captcha.ts.txt:40-40`; observed: `isCaptchaRefusal(error) ? 'captcha_failed' : 'signup_failed'` |
| C13 | FACT | Agent statistics map lookup_failed to not_agent and other refusals to unauthenticated. | source: `docs/sessions/evidence/task931/design/sources/src__modules__cabinet__statistics__access.ts.txt:18-18`; observed: `viewer.reason === 'lookup_failed' ? { kind: 'not_agent' } : { kind: 'unauthenticated' }` |
| C14 | FACT | Agent statistics take the owner id from the viewer. | source: `docs/sessions/evidence/task931/design/sources/src__modules__cabinet__statistics__access.ts.txt:21-21`; observed: `ownerId: viewer.userId` |
| C15 | FACT | requireViewer answers unauthenticated for a missing or deleted profile. | source: `docs/sessions/evidence/task931/design/sources/src__lib__auth__requireViewer.ts.txt:46-46`; observed: `data.deleted_at) return { ok: false, reason: 'unauthenticated' }` |
| C16 | FACT | The transition write also filters on the status it was decided on. | source: `docs/sessions/evidence/task931/design/sources/src__modules__listings__actions__applyListingTransition.ts.txt:113-113`; observed: `.eq('status', currentStatus)` |
| C17 | FACT | The smoke test double resolves the update after one eq. | source: `docs/sessions/evidence/task931/design/sources/src__modules__listings__actions____tests____listingStatusChange.smoke.test.ts.txt:98-98`; observed: `const updateFn    = () => ({ eq: eqUpdateFn })` |
| C18 | FACT | The admin listings page checks the staff viewer before any read. | source: `src/app/admin/listings/page.tsx:20-20`; observed: `await requireStaffPage()` |
| C19 | FACT | requireStaffPage calls notFound for a refused viewer. | source: `docs/sessions/evidence/task931/design/sources/src__lib__auth__staff.ts.txt:92-92`; observed: `notFound()` |
| C20 | FACT | The statistics test expects not_agent for a missing profile row. | source: `docs/sessions/evidence/task931/design/sources/src__modules__cabinet__statistics____tests____access.test.ts.txt:91-91`; observed: `toEqual({ kind: 'not_agent' })` |
| C21 | FACT | The permissions test still mocks the old auth module. | source: `docs/sessions/evidence/task931/design/sources/src__lib__auth____tests____permissions.test.ts.txt:21-21`; observed: `vi.mock('@/lib/auth/server'` |
| C22 | FACT | The critical-flow registry Signup row names a Turnstile rejection by the action. | source: `docs/sessions/evidence/task931/design/sources/docs__critical-flow-registry.md.txt:29-29`; observed: `captcha fail (empty + turnstile reject)` |
| C23 | FACT | The registry listing-expiry row describes lapsed listings being expired. | source: `docs/sessions/evidence/task931/design/sources/docs__critical-flow-registry.md.txt:69-69`; observed: `authorized lapsed→expired` |
| C24 | FACT | An npm admin test script exists that runs the admin smoke files. | source: `docs/sessions/evidence/task931/design/sources/package.json.txt:15-15`; observed: `"test:admin": "vitest run` |
| C25 | FACT | Editing the three auth test files changes the reviewed Task 923 D8/D9 scope digest (executed probe). | source: `docs/sessions/evidence/task940/design/p01-923-scope-probe.txt:4-6`; observed: `digest after editing permissions.test.ts` |
| C26 | FACT | The reviewed Task 935 contract scopes the Task 923 D8/D9 contract file (executed probe). | source: `docs/sessions/evidence/task931/design/d04-935-rebase-probe.txt:3-3`; observed: `923 contract listed in 935 scope: true` |
| C27 | FACT | The 923 contract file is no 935 case test and no runtime file, and writing it changes the 935 scope digest (executed probe). | source: `docs/sessions/evidence/task931/design/d04-935-rebase-probe.txt:4-6`; observed: `935 digest after a later write to the 923 contract: CHANGED` |
| C28 | FACT | A scope entry's approving contract must scope every listed file. | source: `scripts/workflow-gates/contract.mjs:165-165`; observed: `is outside the scope of ${entry.by}` |
| C29 | FACT | Each rebase entry must continue the previous entry of the chain. | source: `scripts/workflow-gates/contract.mjs:176-176`; observed: `originalScopeSha256 does not continue the previous rebase entry` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D8 | OWNER DECISION | Each red CI check gets its own task. | owner: 2026-11-01; decision: `A separate task for each check (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract for its non-test scope files (Task 940). | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

The final diff changes exactly: `src/app/api/cron/listings-expiry/__tests__/route.test.ts`,
`src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts`,
`src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`, `src/lib/auth/__tests__/permissions.test.ts`,
`src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts`,
`src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`, `src/modules/cabinet/statistics/__tests__/access.test.ts`,
rows Signup and Listing expiry reconciliation of `docs/critical-flow-registry.md`, the stage/report fields of this task's sidecar, and
evidence under `docs/sessions/evidence/task931/impl/` and `docs/sessions/evidence/task931/security/`. Edited only temporarily for
the planted breaks of R9 and restored byte-for-byte: `src/lib/auth/staff.ts`, `src/lib/auth/permissions.ts`,
`src/modules/admin/actions/permissions.ts`, `src/modules/auth/actions/captcha.ts`, `src/modules/cabinet/statistics/access.ts`,
`src/app/api/cron/listings-expiry/route.ts`. Written by the reviewer only (R10): a `review.rebases` entry of
`tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json` and its evidence, then a `review.rebases` entry of
`tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json` and its evidence.
The sidecar scope lists the 923 contract file only so that this contract can approve the 935 entry (C28); the executor never writes it.

Out of scope: any production behaviour change (if a test shows a real defect, stop and report it); `package.json` scripts; any other
test file; the other red CI jobs (Tasks 937–939); the gate code (Task 940).

## 5. Current and required behaviour

Preserved: every production file byte-for-byte in the final diff; every passing assertion that still describes shipped behaviour;
the test scripts of `package.json`. Required: the 7 files pass on the shipped code, every test reaches the branch its title names, and
the case-mapped tests below carry their case IDs.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C4; C5; C6; C7] | **Cron test on the paused job.** The admin-client double supports `.select().eq().lt().limit()` and `.select(…, { count, head }).eq().is()` and records every `update` call. Authorized lapsed rows → `expired: 0`, `would_expire` = lapsed count, `would_expire_ids` = their ids, no update; nothing lapsed → `would_expire: 0`, no update; NULL-expiry rows counted in `null_expiry_active`, no update; GET answers like POST; a failed lapsed read → 500 `read_failed`, no update. The old test "status set to engine-resolved value (expired), not raw string" asserts a behaviour removed by D56/D58 (C4) and is rewritten as "while paused, no listing status is written"; its old name ends. Unauthorized and CRON_SECRET tests stay unchanged. | P1 | AC1 |
| R2 [C16; C17] | **Transition smoke double.** The `update` double applies each `.eq(column, value)` to the current row and answers `.select('id')` with the rows it changed, as the comprehensive gateway test does (`applyListingTransition.test.ts`); owner and admin privileged writes then pass with their current names; forbidden, not_found and same-status tests stay green. | P1 | AC1 |
| R3 [C18; C19] | **Admin listings page test (T9).** Mock `@/lib/auth/requireViewer` (the real `requireStaffPage` stays in the path) and add `notFound` and `redirect` to the `next/navigation` mock as functions that throw a recognisable error. T9 with an administrator viewer passes; a new T9 test with a viewer of role `user` asserts the page rejects with the not-found error and records no `select` on the admin client. | P1 | AC2 |
| R4 [C8; C9; C21] | **Permissions test.** Replace the `@/lib/auth/server` and `@/lib/supabase/server` role doubles of the hasPermission/assertPermission tests with a `requireViewer` double; the moderator end-to-end tests pass through a moderator viewer; a new test asserts a refused viewer (`unauthenticated` and `lookup_failed`) gets `false` without any `role_permissions` read. `roleHasPermission` tests stay unchanged, so the client-factory mocks their "neither client factory called" assertion reads are kept. | P1 | AC3 |
| R5 [C10] | **getModeratorPermissions smoke.** Use a `requireViewer` double; admin → stored rows; unauthenticated → rejects `unauthenticated`; regular user → `forbidden` with no `role_permissions` read (the assertion targets that table, since the users read moved into `requireViewer`); a new moderator test → `forbidden` with no `role_permissions` read; read error → all-false map and `console.error`. | P1 | AC3 |
| R6 [C11; C12] | **Signup smoke.** Happy path asserts `signUp` receives the token and `verifyTurnstile` is not called; the old "turnstile rejects" test asserts a behaviour removed by Task 923 R67 (c) (C11) and is rewritten as "Supabase refuses the token → captcha_failed"; empty token and duplicate e-mail tests stay. | P1 | AC4 |
| R7 [C13; C14; C15; C20] | **Agent statistics access test.** Use a `requireViewer` double; agent → `ok` with the viewer id; the module makes no role read of its own; `lookup_failed` → `not_agent`; a missing or deleted profile (`unauthenticated` from `requireViewer`, C15) → `unauthenticated`, replacing the stale `not_agent` expectation (C20); guest and thrown-lookup tests stay on their branches. The old `console.error` expectation is dropped because the access module no longer reads or logs (C13); the completion report names this removal. | P1 | AC5 |
| R8 [C22; C23] | **Registry rows.** Signup and Listing expiry reconciliation rows describe the shipped behaviour (Supabase refusal; paused counting) and name the current tests. | P2 | AC6 |
| R9 [C9; C10; C12; C13; C19] | **Planted breaks.** One at a time, then restored: P1 `staff.ts` drops the staff-role check → SEC-931-FE-PAGE-DENY fails; P2 `permissions.ts` lets a refused viewer through as moderator → SEC-931-SRV-PERM-DENY fails; P3 admin `permissions.ts` admits a moderator → SEC-931-SRV-MODPERM-MODERATOR-DENY fails; P4 `captcha.ts` maps a captcha refusal to `signup_failed` → SEC-931-SRV-CAPTCHA-DENY fails; P5 cron `route.ts` writes a status to the NULL-expiry rows → SEC-931-SRV-CRON-DENY fails; P6 `access.ts` grants on `lookup_failed` → SEC-931-SRV-STATS-DENY fails. Each with the failed assertion and `git diff --exit-code -- <file>` exit 0 after restore. | P1 | AC7 |
| R10 [C25; C26; C27; C28; C29; D9] | **Task 923 and Task 935 rebases (reviewer), in this order.** Once the approval conditions of 931 hold (Task 940 is reviewed): (a) stage `reviewed`; (b) a `scope` entry by this task's contract appended to the 923 D8/D9 `review.rebases`, evidence `docs/sessions/evidence/task931/review/scope-rebase-923.md` listing the three auth test files; (c) a `scope` entry by this task's contract appended to the 935 `review.rebases`, evidence `docs/sessions/evidence/task931/review/scope-rebase-935.md` listing `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json`, its `originalScopeSha256` equal to the `rebasedScopeSha256` of the last 935 entry present at that moment (Task 941's approver may have appended one, C29) and its `rebasedScopeSha256` the 935 digest after (b); (d) rerun the report harness, since this sidecar's plan and its scope digest (which covers the 923 contract file) changed after the executor's report; (e) only then the review block with the digests of (b)–(d). | P1 | AC8 |

## Acceptance criteria

- **AC1 [R1; R2].** `npx vitest run` on the 7 files reports 0 failed, 0 skipped, and at least 67 passed plus the new tests; the 17 failing identities of `d03-local-failed-ids.txt` are each passing or mapped to their new name in the completion report.
- **AC2 [R3].** SEC-931-FE-PAGE-ALLOW, SEC-931-FE-PAGE-DENY and SEC-931-FE-STATUS-ERROR pass.
- **AC3 [R4; R5].** SEC-931-SRV-PERM-ALLOW, SEC-931-SRV-PERM-DENY, SEC-931-SRV-MODPERM-ALLOW, SEC-931-SRV-MODPERM-USER-DENY, SEC-931-SRV-MODPERM-MODERATOR-DENY and SEC-931-SRV-MODPERM-ERROR pass; `npm run test:admin` exits 0 (C24).
- **AC4 [R6].** SEC-931-SRV-CAPTCHA-ALLOW and SEC-931-SRV-CAPTCHA-DENY pass; `npm run test:auth` exits 0.
- **AC5 [R7; R2; R1].** SEC-931-SRV-STATS-ALLOW, SEC-931-SRV-STATS-DENY, SEC-931-SRV-TRANSITION-ALLOW, SEC-931-SRV-CRON-ALLOW, SEC-931-SRV-CRON-DENY and SEC-931-SRV-CRON-ERROR pass; `npm run test:listings` exits 0.
- **AC6 [R8].** The two registry rows name the current tests and no longer claim a Turnstile rejection by the action or an expiry write.
- **AC7 [R9].** Six planted-break transcripts under `docs/sessions/evidence/task931/impl/sensitivity/` each show the named case failing with an assertion and passing after restore; `git diff --name-only` at the end lists no production file.
- **AC8 [R1–R9].** Full suite `npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json` then `node scripts/workflow-gates/cli.mjs unit-report` exit 0; `npm run typecheck` exits 0; `npx eslint <the 7 files>` exits 0; `npm run check:file-integrity` and `npm run check:mojibake` pass; `npm run build` exits 0; the report harness writes `docs/sessions/evidence/task931/security/report.json` and `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented. Reviewer, after R10: the scoped `validateDiff` harness of Task 940 AC7 reports no error for the 923, 931 and 935 contracts, and `validateContract` at phase `release` plus `validateGovernanceReport` report no error for the 935 contract; after the owner's push the PR #12 Unit and Component Tests job is green.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | `requireViewer` (`src/lib/auth/requireViewer.ts`), `requireStaffPage` (`src/lib/auth/staff.ts`), `hasPermission` (`src/lib/auth/permissions.ts`), `getModeratorPermissions` (`src/modules/admin/actions/permissions.ts`), `signUpWithCaptcha` (`src/modules/auth/actions/captcha.ts`), `getAgentStatisticsAccess`, `applyListingTransitionByStatus`, `GET/POST /api/cron/listings-expiry`; consumers `AdminListingsPage` and `AdminListingsTable`/`ListingPreviewDialog`. |
| Frontend security | Real `AdminListingsPage` with the real `requireStaffPage`: staff allowed (SEC-931-FE-PAGE-ALLOW), non-staff refused before any read (SEC-931-FE-PAGE-DENY); real `ListingPreviewDialog`: a failed status update shows the error toast and leaves the row (SEC-931-FE-STATUS-ERROR). |
| Server security | Real actions and handlers with explicit doubles at the `requireViewer`, admin-client, Supabase Auth and cron-request boundaries: SEC-931-SRV-PERM-*, SEC-931-SRV-MODPERM-*, SEC-931-SRV-CAPTCHA-*, SEC-931-SRV-STATS-*, SEC-931-SRV-TRANSITION-ALLOW, SEC-931-SRV-CRON-*. |
| Database/integrations | No runtime, SQL or provider change. The real boundaries of these invariants stay mapped by the reviewed Task 923 D8/D9 contract, whose cases CI reruns in every diff; this task adds none and marks no case critical. |
| Cases | The 17 SEC-931 cases of the sidecar; full names are `<describe> <it>` with the `[ID]` at the start of the `it` title. |
| Fixtures and environment | In-memory doubles, synthetic ids, no network, no credentials, unit project only; no database rows, so cleanup is trivially zero. |
| Sensitivity proof | The six planted breaks of R9 with restoration proof (AC7). |
| Execution | Report harness `docs/sessions/evidence/task931/security/report.mjs` modelled on `docs/sessions/evidence/task923/security/owner-fixes-report.mjs` (unit project only, the gate's own `runMappedTests`), then `node scripts/workflow-gates/cli.mjs verify --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`; native Windows, Node 22.22.3; QA Q4. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): commit this kickoff set on
   `task/935-governance-approval-route` with the command Opus gives (D7).
2. **Sonnet, fresh session:** `node scripts/workflow-gates/cli.mjs receipt --contract <this sidecar>`; save the base run of the 7 files
   to `docs/sessions/evidence/task931/impl/before.json` and confirm the 17 identities of `d03-local-failed-ids.txt`.
3. R1–R7 in that order, rerunning the touched file after each; then R8.
4. R9: six planted breaks with transcripts and restoration proof.
5. The report harness and `cli.mjs verify`; every AC8 command; set stage `implemented`; write
   `docs/sessions/evidence/task931/impl/completion-report.md`; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git command.
6. **Opus reviewer:** review; on approval, R10 (a)–(e) in that order (Task 940 is reviewed since 2026-11-01); the explicit-path
   commit command and the branch push. PR #12 merges only after all required checks are green.

## 7. Completion report

Per requirement: changed files, evidence, status; old full name → new full name for every renamed or rewritten test; each SEC-931 case
with its result; the six planted-break transcripts; the dropped `console.error` expectation of R7 with its reason; before/after totals
of the 7 files and of the full suite; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows from retained snapshots and executed runs under `docs/sessions/evidence/task931/design/`. |
| `security-testing.md` | Frontend and server rows on real consumers and actions; changed-behaviour regressions; planted breaks. |
| `role-boundaries.md` | Sonnet implements test-only product work; Opus reviews and writes the 923 rebase; no policy path in scope. |
| `git-publication.md` | Commit on PR #12's branch (D7); push only after approval; merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29; owner decisions: D7, D8, D9; blocked claims: NONE.
