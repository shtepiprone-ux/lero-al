# Task 931 (revision 4) — The full unit suite green again: no wait counted in event-loop turns, no query double blind to its filters, no test hole the Task 945 review measured

Sprint 92. P1. QA profile **Q4** (the changed tests guard auth, ownership, status and permission invariants of three reviewed
contracts, `docs/qa-profiles.md`). Revision 3 by Opus, 2026-11-02, on PR #12 (D7). Revisions 1-2 (approved 2026-11-01) stay at
`tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md` with their sidecar until R13 retires them: two
reviewed rebase entries name that sidecar as their approving contract (C23, C24).

Revision 4 by the Task 945 review 1 session, 2026-11-05, on the owner's decision D29: class D below, R15 to R22, AC10 to AC12; revision 3 is otherwise unchanged and has not been implemented.

## 1. Mode, task type and rule bundle

Product task, test-only in its final diff. **Implementer: Sonnet, fresh session (`execute-task`). Reviewer: Opus, another
session.** Types (`docs/rule-index.md`): unit/component tests, test doubles, auth and permission guards, ownership filters, cron
route. Bundle: `.claude/rules/shared/security-testing.md`, `security-test-quality.md`, `security-test-environment.md`,
`workflow-gates.md` with its companions, `claim-evidence-contract.md`, `task-readiness.md`. No visible UI change: `Scope: none`.

## 2. Objective

The approval of 2026-11-01 rested on a local run; CI run 41415423554 on that head fails two tests of `googlePopup.test.ts` (C1).
Revision 3 removes both causes of tests that pass or fail by accident, not only the one CI showed:

- **Class A, waits counted in turns.** The Google sign-in tests wait at most 500 `setImmediate` turns (or 20, or a fixed 20 ms) for
  a WebCrypto nonce hash; with a busy libuv thread pool one hash took 207118 turns (C2–C6). With the thread pool kept busy, the five
  files fail 17 to 28 of 122 tests in four runs, idle they pass 122 of 122 (C7, C8, C53). The load preload reaches every Vitest
  worker (C9); the whole suite under the same load fails 34 tests in 8 files (C54): besides the Google files, a contact-session
  test gives up after a short find default (class A, C55), two class B files run into the test timeout, and two tests that wait for
  real child processes hit their wall-clock limit (C56).
- **Class B, query doubles blind to their filters.** 70 test files mock a Supabase client factory with a hand-written query double
  instead of the shared `src/tests/fakeSupabase.ts`, or stub a filter so that it ignores its arguments, so removing an identity,
  ownership or status filter from production code fails no test (C13, C14; Task 931 note N3, C47). The shared fake itself lacks
  `lt`, `gt`, `like`, `ilike`, error injection, and treats every `.or()` as a match (C11, C12).
- **Class C, stale text.** Task 931 note N1: a case title says "13 keys present" against 21 registry keys (C30, C31, C46).
- **Class D, test holes the Task 945 review measured.** A failed contact event lookup, a rate-limit count that cannot be read, an unexpected failure of saving a
  permission and a failed audit insert can each turn into another answer with no test noticing (C59-C68). The public pages can stop being refreshed after a status change
  with no test noticing (C69-C71). No test renders the admin listings page past its guard, 2 of its 55 defects are noticed (C72-C74), and 18 of the 31 of its table (C75).
  A prototype closed these with tests alone: 15 tests on the real source, 28 of 28 named defects noticed in memory (C79, C80). No production behaviour changes.

Every changed test keeps its case IDs and exact titles, so the reviewed contracts that map them are rebased, not reopened (D12).

## 3. Verified context

The fixes stay inside test files and `src/tests/fakeSupabase.ts`: every runtime file, `src/tests/setup.ts` included, is bound into
every contract digest and is never rebased (C19, C20). The change set touches case tests of three reviewed contracts: 59 cases in
26 files of Task 923 D8/D9, 13 in 11 files of the 923 owner fixes, 37 in 7 files of Task 927, none an integration case (C35);
their scope also holds 32, 1 and 4 changed files that map no case (C15–C17). A `scope` entry refuses a case test (C21), so these
contracts take the `tests` entry of Task 943 (D12, C28), which binds each exact test name through the gate's own rerun (C26). Every
mapped case of those contracts passes today against the development project; two fail only on a stale report hash (C32), which the
Task 943 `rules` entries repair (C49). The reviewed Task 935 contract scopes the 923 D8/D9 contract file (C18), so it is rebased too.
The existing entries by this task name the archived sidecar (C23, C24) and an approving contract must be reviewed (C22); an archived
sidecar must stay reviewed (C25). This revision therefore lives at the active path, its approver points those entries here, and the
archived pair is then deleted, which the Task 943 R11 check accepts because a reviewed contract of the same file name exists (C29).
The 18 integration test files mock no Supabase factory (C13) and stay unchanged. Class D adds three test files that no reviewed contract holds (C81) and otherwise changes only files of the 70 and the shared fake, so the rebase lists of R13 stay as they are.

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | CI failed two googlePopup tests on the approved head. | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:9-9`; observed: `CI failure: run 41415423554, job 125177970521, head 2693c6b9a: googlePopup.test.ts 2 failed` |
| C2 | FACT | With a busy thread pool one cold digest took 207118 turns (executed probe). | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:5-5`; observed: `thread pool busy; cold digest: 207118 turns, 231.68 ms` |
| C3 | FACT | The googlePopup wait gives up after 500 setImmediate turns. | source: `src/lib/auth/__tests__/googlePopup.test.ts:40-40`; observed: `for (let turn = 0; turn < 500 && !check(); turn++) await new Promise<void>(resolve => setImmediate(resolve))` |
| C4 | FACT | AuthSheet.test.tsx waits 20 turns for the nonce preparation. | source: `src/modules/auth/components/__tests__/AuthSheet.test.tsx:238-238`; observed: `for (let turn = 0; turn < 20; turn++) await new Promise<void>(resolve => setImmediate(resolve))` |
| C5 | FACT | The Header Google test settles with a fixed 20 ms sleep. | source: `src/components/layout/__tests__/Header.google.security.test.tsx:175-175`; observed: `await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })` |
| C6 | FACT | The AuthSheet Google test has a fixed 20 ms settle helper. | source: `src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx:85-85`; observed: `const settleBriefly = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })` |
| C7 | FACT | With the busy-pool preload the five class A files fail 28 tests (executed probe). | source: `docs/sessions/evidence/task931/design/d17-busy-pool-run.txt:5-5`; observed: `busy run 1: exit 1; preload marks 8; total 122 passed 94 failed 28` |
| C8 | FACT | Idle, the five class A files pass every test (executed probe). | source: `docs/sessions/evidence/task931/design/d17-busy-pool-run.txt:3-3`; observed: `idle run 1: exit 0; preload marks 0; total 122 passed 122 failed 0` |
| C9 | FACT | The busy-pool preload reaches every Vitest worker process (executed probe). | source: `docs/sessions/evidence/task931/design/d17-busy-pool-run.txt:5-5`; observed: `preload marks 8` |
| C10 | FACT | The installed Vitest exports a time-bounded waitFor. | source: `node_modules/vitest/dist/index.d.ts:208-208`; observed: `declare function waitFor<T>(callback: WaitForCallback<T>` |
| C11 | FACT | The shared fake treats every or() filter as a match. | source: `src/tests/fakeSupabase.ts:39-39`; observed: `if (kind === 'or') return true // the text of an .or() filter is recorded in the log, not evaluated` |
| C12 | FACT | The shared fake has no lt, gt, like, ilike or error injection (executed probe). | source: `docs/sessions/evidence/task931/design/d19-fake-capabilities.txt:8-8`; observed: `ilike: absent` |
| C13 | FACT | The guard criterion finds 70 test files and no integration file (executed probe). | source: `docs/sessions/evidence/task931/design/d16-guard-criterion.txt:4-4`; observed: `test files 362; guard hits 70; d09 files 82; integration hits 0` |
| C14 | FACT | The 70 include every file of the earlier filter-shape scan. | source: `docs/sessions/evidence/task931/design/d16-guard-criterion.txt:83-83`; observed: `All 32 files of the d07 shape scan are among the 70.` |
| C15 | FACT | The change set holds 26 case test files and 32 other scope files of the 923 D8/D9 contract (executed probe). | source: `docs/sessions/evidence/task931/design/d15-rev3-rebase-plan.txt:4-4`; observed: `case tests 26; non-case scope files 32` |
| C16 | FACT | It holds 11 case test files and 1 other scope file of the 923 owner-fixes contract (executed probe). | source: `docs/sessions/evidence/task931/design/d15-rev3-rebase-plan.txt:6-6`; observed: `case tests 11; non-case scope files 1` |
| C17 | FACT | It holds 7 case test files and 4 other scope files of the 927 contract (executed probe). | source: `docs/sessions/evidence/task931/design/d15-rev3-rebase-plan.txt:8-8`; observed: `case tests 7; non-case scope files 4` |
| C18 | FACT | The reviewed 935 contract scopes the 923 D8/D9 contract file (executed probe). | source: `docs/sessions/evidence/task931/design/d15-rev3-rebase-plan.txt:14-14`; observed: `Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json [governance, reviewed]: case tests 0; non-case scope files 0; inputs/rules 0; contract files in scope ["Sprint_78_Task_923_security_record_D8_D9.security.json"]` |
| C19 | FACT | The change set contains no runtime file (executed probe). | source: `docs/sessions/evidence/task931/design/d15-rev3-rebase-plan.txt:3-3`; observed: `change set 79; runtime files in it 0` |
| C20 | FACT | The test setup files are runtime files bound into every scope digest. | source: `scripts/workflow-gates/contract.mjs:65-65`; observed: `const RUNTIME_FILES = ['package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc', 'src/tests/setup.ts', 'src/tests/integration/setup.ts'];` |
| C21 | FACT | A scope entry refuses a case test. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__contract.mjs.txt:158-158`; observed: `case tests are never rebased` (the snapshot before the Task 943 implementation moved the line) |
| C22 | FACT | An approving contract must be a reviewed product or governance contract. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__contract.mjs.txt:164-164`; observed: `is not a reviewed product or governance contract` (the snapshot before the Task 943 implementation moved the line) |
| C23 | FACT | The 923 D8/D9 chain has an entry approved by the archived 931 sidecar. | source: `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json:4784-4784`; observed: `"by": "tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json",` |
| C24 | FACT | The 935 chain has an entry approved by the archived 931 sidecar. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json:456-456`; observed: `"by": "tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json",` |
| C25 | FACT | An archived sidecar must stay reviewed. | source: `scripts/workflow-gates/cli.mjs:20-20`; observed: `An archived closure receipt requires reviewed stage` |
| C26 | FACT | The gate requires exactly one passing test with the mapped full name. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:240-240`; observed: `a.file === row.testFile && a.fullName === row.testName` (the snapshot before the Task 943 implementation moved the line) |
| C27 | FACT | The unit report check requires zero failed tests. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:208-208`; observed: `data.numFailedTests !== 0` (the snapshot before the Task 943 implementation moved the line) |
| C28 | FACT | Task 943 defines the case-test rebase entry. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md:352-352`; observed: `kind: 'tests', by, evidence, evidenceSha256, originalScopeSha256, rebasedScopeSha256` |
| C29 | FACT | Task 943 R11 accepts a deleted reviewed contract when a reviewed contract of the same file name exists. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md:405-405`; observed: `unless a contract with the same file name exists at head under` |
| C30 | FACT | A case title still says 13 keys. | source: `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts:71-71`; observed: `every other key false; 13 keys present` |
| C31 | FACT | The permission registry is the PERMISSION_KEYS array. | source: `src/lib/auth/permissionKeys.ts:1-1`; observed: `export const PERMISSION_KEYS = [` |
| C32 | FACT | Every mapped case of the three contracts passes on the development project; two contracts fail only on the report hash (executed). | source: `docs/sessions/evidence/task931/design/d11-verify-mapped-cases.txt:15-15`; observed: `Security report scope hash is stale` |
| C33 | FACT | CPU load alone does not reproduce class A (executed). | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:8-8`; observed: `CPU load alone does not exhaust the budget` |
| C34 | FACT | The class A files are none of the 70 (executed probe). | source: `docs/sessions/evidence/task931/design/d20-affected-cases.txt:7-7`; observed: `class A files in the migration list: 0` |
| C35 | FACT | 59 mapped 923 D8/D9 cases, 13 owner-fixes cases and 37 Task 927 cases are in changed files, none integration (executed probe). | source: `docs/sessions/evidence/task931/design/d20-affected-cases.txt:3-5`; observed: `cases 231; in changed files 59; files 26; integration among them 0` |
| C36 | FACT | Planted break P1 target: the delete is scoped to the listing id. | source: `src/modules/listings/actions/deleteListing.ts:57-57`; observed: `.eq('id', listingId)` |
| C37 | FACT | Planted break P2 target: a favourite is scoped to the session user. | source: `src/modules/listings/actions/favoriteActions.ts:61-61`; observed: `.eq('user_id', authUser.id)` |
| C38 | FACT | Planted break P3 target: the duplicate-report check is scoped to the session user. | source: `src/modules/listings/actions/reportListing.ts:63-63`; observed: `.eq('user_id', user.id)` |
| C39 | FACT | Planted break P4 target: contact events need an active listing. | source: `src/modules/listings/actions/contactEvents.ts:58-58`; observed: `.eq('status', 'active')` |
| C40 | FACT | Planted break P5 target: the transition write is a compare-and-set on the status. | source: `src/modules/listings/actions/applyListingTransition.ts:113-113`; observed: `.eq('status', currentStatus)` |
| C41 | FACT | Planted break P6 target: the listing update is scoped to the listing id. | source: `src/modules/listings/actions/updateListing.ts:67-67`; observed: `.eq('id', listingId)` |
| C42 | FACT | Planted break P7 target: the expired-suspension lift needs status blocked. | source: `src/lib/auth/blockCheck.ts:48-48`; observed: `.eq('status', 'blocked')` |
| C43 | FACT | Planted break P8 target: the viewer profile read is scoped to the auth user id. | source: `src/lib/auth/requireViewer.ts:43-43`; observed: `.eq('id', authUserId)` |
| C44 | FACT | Planted break P9 target: the confirm route links a company only to a user without one. | source: `src/app/auth/confirm/route.ts:107-107`; observed: `.is('company_id', null)` |
| C45 | FACT | Planted break P10 target: the cron counts only lapsed listings. | source: `src/app/api/cron/listings-expiry/route.ts:36-36`; observed: `.lt('expires_at', now)` |
| C46 | FACT | Task 931 note N1 asks to rename the title and testName together. | source: `docs/sessions/evidence/task931/review/review-931.md:41-45`; observed: `"every registry key present"` |
| C47 | FACT | Task 931 note N3 records that the cron read double ignores filter values. | source: `docs/sessions/evidence/task931/review/review-931.md:51-53`; observed: `a changed filter value would not fail a test` |
| C48 | FACT | Planted break P11 target: the recovery profile read is scoped to the user id. | source: `src/modules/auth/actions/recovery.ts:139-139`; observed: `.eq('id', user.id).single()` |
| C49 | FACT | A rules entry by 935 restores the owner-fixes and 927 review digests (executed probe). | source: `docs/sessions/evidence/task931/design/d14-rules-rebase-feasibility.txt:4-5`; observed: `MATCH true` |
| C50 | FACT | Planted break P12 target: marking a notification read is scoped to its id. | source: `src/modules/notifications/lib/mutations.ts:18-18`; observed: `.eq('id', id)` |
| C51 | FACT | Planted break P13 target: exchange rates read only active currencies. | source: `src/lib/getExchangeRateServer.ts:52-52`; observed: `.eq('is_active', true)` |
| C52 | FACT | The shared fake answers an unknown filter kind with a match (executed probe). | source: `docs/sessions/evidence/task931/design/d19-fake-capabilities.txt:14-14`; observed: `unknown kind fallback returns true: true` |
| C53 | FACT | A second invocation of the class A probe failed 22 and 17 tests in its two busy runs (executed probe). | source: `docs/sessions/evidence/task931/design/d17b-busy-pool-rerun.txt:5-5`; observed: `busy run 1: exit 1; preload marks 8; total 122 passed 100 failed 22` |
| C54 | FACT | The whole unit suite under the busy pool fails 34 tests in 8 files (executed probe). | source: `docs/sessions/evidence/task931/design/d18-busy-pool-full-suite.txt:3-3`; observed: `busy pool, full unit suite: exit 1; total 5924 passed 5890 failed 34 skipped 0; failed files 8` |
| C55 | FACT | The contact-session test gives up after about 2 s under load (executed probe). | source: `docs/sessions/evidence/task931/design/d22-busy-failure-causes.txt:12-12`; observed: `Unable to find role="button" and name "Show number"` |
| C56 | FACT | Two tests that wait for real child processes hit their wall-clock limits under load (executed probe). | source: `docs/sessions/evidence/task931/design/d22-busy-failure-causes.txt:6-6`; observed: `spawnSync C:\Program Files\nodejs\node.exe ETIMEDOUT` |
| C57 | FACT | The Unit job of run 41823787040 failed with every test passing, on one unhandled error blamed on the hydration test. | source: `docs/sessions/evidence/task945/review/r17-ci-excerpts.txt:7-7`; observed: `This error originated in "src/components/layout/__tests__/header-hydration-id-parity.test.tsx" test file` |
| C58 | FACT | That file alone gives no such error, and this contract holds it (executed three times). | source: `docs/sessions/evidence/task945/review/r21-hydration-alone.txt:4-4`; observed: `in the scope of the Task 931 contract: src/components/layout/__tests__/header-hydration-id-parity.test.tsx` |
| C59 | FACT | A contact event lookup failure answering undefined survived every related test (executed). | source: `docs/sessions/evidence/task945/review/r05-product-holes.txt:1-1`; observed: `contactEvents lookup failure returns undefined` |
| C60 | FACT | An unexpected contact event error answering undefined survived every related test (executed). | source: `docs/sessions/evidence/task945/review/r05-product-holes.txt:2-2`; observed: `contactEvents unexpected error returns undefined` |
| C61 | FACT | A rate limit that refuses only on an error and a null count together survived every related test (executed). | source: `docs/sessions/evidence/task945/review/r05-product-holes.txt:3-3`; observed: `rate limit: only error AND null refuses` |
| C62 | FACT | The contact event lookup failure answers insert_failed. | source: `src/modules/listings/actions/contactEvents.ts:63-63`; observed: `return { ok: false, reason: 'insert_failed' }` |
| C63 | FACT | An unexpected contact event error answers insert_failed. | source: `src/modules/listings/actions/contactEvents.ts:109-109`; observed: `return { ok: false, reason: 'insert_failed' }` |
| C64 | FACT | The inquiry rate limit refuses a count it cannot read. | source: `src/modules/listings/actions/submitListingInquiry.ts:46-46`; observed: `result.count === null` |
| C65 | FACT | A failed audit insert of a permission change is logged. | source: `src/modules/admin/actions/permissions.ts:198-198`; observed: `if (eventError) {` |
| C66 | FACT | No test notices that log going away (executed). | source: `docs/sessions/evidence/task945/review/review-1-lines.md:154-154`; observed: `a failed audit insert would go unlogged` |
| C67 | FACT | An unexpected failure of saving a permission answers save_failed. | source: `src/modules/admin/actions/permissions.ts:206-206`; observed: `return { error: 'save_failed' }` |
| C68 | FACT | No test notices that answer going away (executed). | source: `docs/sessions/evidence/task945/review/review-1-lines.md:155-155`; observed: `would read as success in the admin UI` |
| C69 | FACT | A status change refreshes the public listings index in each locale. | source: `src/modules/listings/actions/applyListingTransition.ts:161-161`; observed: `/listings` |
| C70 | FACT | A status change refreshes the public detail page in each locale. | source: `src/modules/listings/actions/applyListingTransition.ts:163-163`; observed: `/listings/${slug}` |
| C71 | FACT | No test notices those refreshes going away (executed). | source: `docs/sessions/evidence/task945/review/review-1-lines.md:110-110`; observed: `the public pages are not refreshed after a status change` |
| C72 | FACT | Of the 55 defects of the admin listings page, 2 are noticed (executed). | source: `docs/sessions/evidence/task945/review/review-1-lines.md:124-124`; observed: `Run: 2 of 55 caught` |
| C73 | FACT | No test renders that page past its guard. | source: `docs/sessions/evidence/task945/review/review-1-lines.md:189-189`; observed: `no test renders this server page past its guard` |
| C74 | FACT | The page applies the visibility filter to its query. | source: `src/app/admin/listings/page.tsx:94-94`; observed: `applyAdminListingsVisibility(query, visibility, reason)` |
| C75 | FACT | Of the 31 defects of the admin listings table, 18 are noticed (executed). | source: `docs/sessions/evidence/task945/review/review-1-lines.md:123-123`; observed: `Run: 18 of 31 caught` |
| C76 | FACT | The table test creates a new refresh double on each call, so it cannot assert a refresh. | source: `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx:69-69`; observed: `refresh: vi.fn()` |
| C77 | FACT | The shared fake has no injection of a failure today. | source: `src/tests/fakeSupabase.ts:133-133`; observed: `return { from, tables, log, client: { from } }` |
| C78 | FACT | Its log holds no columns, head, order or range. | source: `src/tests/fakeSupabase.ts:9-9`; observed: `affected: number }` |
| C79 | FACT | The prototype of class D passes on the real source (executed). | source: `docs/sessions/evidence/task931/design/r4-proto/run.txt:2-2`; observed: `on the real source: exit 0; 15 passed (15)` |
| C80 | FACT | It notices each of 28 named defects, applied in memory (executed). | source: `docs/sessions/evidence/task931/design/r4-proto/run.txt:31-31`; observed: `defects 28; noticed 28; not noticed or not applied 0` |
| C81 | FACT | No reviewed contract holds the three new test files (executed). | source: `docs/sessions/evidence/task931/design/r4-proto/affected.txt:10-10`; observed: `new files held by a reviewed contract: 0` |
| C82 | FACT | The mutation check of Task 945 reports defects, caught, not caught and not tried per file (executed). | source: `docs/sessions/evidence/task945/review/r15-mutation-security.txt:1-1`; observed: `17 defects, 16 caught, 1 not caught, 0 not tried, 0 undecided` |
| C83 | FACT | The permission history fields are a real gap, display only. | source: `docs/sessions/evidence/task945/review/review-1-lines.md:152-152`; observed: `e.old_allowed ?? null` |
| C84 | FACT | The notification fields passed by the gateway are a real gap, no access decision. | source: `docs/sessions/evidence/task945/review/review-1-lines.md:156-156`; observed: `current.slug ?? null` |
| C85 | FACT | The refreshes of the table are a real gap, no access decision. | source: `docs/sessions/evidence/task945/review/review-1-lines.md:181-181`; observed: `router.refresh()` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12, merged once all checks are green. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |
| D12 | OWNER DECISION | D9 is extended: a later independently reviewed contract may rebase a changed case test of a reviewed contract when every case ID and test name are kept, the cases pass in CI, and the approver states each changed assertion; implemented in Task 943 before Task 931. | owner: 2026-11-02; decision: `Extend D9 (Recommended)` |
| D13 | OWNER DECISION | No new task: every found and potential hole is closed inside the current tasks. | owner: 2026-11-02; decision: `no new task, everything within the current task; close every hole already found and every potential one` |
| D14 | OWNER DECISION | Dependent kickoff work found in a session is done in that session, never left for a later one, as a mandatory rule. | owner: 2026-11-02; decision: `This must be done immediately, because in the next session nobody will remember it. Write it into your mandatory rules so you never forget such points and never skip them!` |
| D29 | OWNER DECISION | The test holes the Task 945 review measured are closed in Task 931 as a revision, with no new number. | owner: 2026-11-05; decision: `I support the recommendation.` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

The final diff changes exactly:

- class A: `src/lib/auth/__tests__/googlePopup.test.ts`, `src/components/layout/__tests__/Header.google.security.test.tsx`,
  `src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx`, `src/modules/auth/components/__tests__/AuthSheet.test.tsx`,
  `src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx`,
  `src/modules/listings/components/__tests__/ListingDetailView.contactSession.security.test.tsx` (C55);
- class B: `src/tests/fakeSupabase.ts`, new `src/tests/__tests__/fakeSupabase.test.ts`, new
  `src/tests/__tests__/queryDoubles.guard.test.ts`, and the 70 files listed under "Guard hits" in
  `docs/sessions/evidence/task931/design/d16-guard-criterion.txt` (every one of them is a guard hit today, so each changes);
- class C: the title of `SEC-931-SRV-MODPERM-ALLOW` in `getModeratorPermissions.smoke.test.ts` (one of the 70) and its `testName`;
- class D: new `src/app/admin/listings/__tests__/page.test.tsx`, new `src/modules/admin/actions/__tests__/permissions.failures.test.ts`, new
  `src/modules/listings/actions/__tests__/applyListingTransition.effects.test.ts`, and added tests in three of the 70: `contactEvents.test.ts`, `submitListingInquiry.test.ts`
  and `AdminListingsTable.smoke.test.tsx`. The mutation check of R22 changes nothing on disk;
- the stage/report fields of this sidecar; evidence under `docs/sessions/evidence/task931/impl-r3/` and
  `docs/sessions/evidence/task931/security/` (`report-r3.mjs`, `report-r3.json`).

Edited only temporarily for the planted breaks of R10 and restored byte-for-byte: the 13 production files of C36-C45, C48, C50,
C51. Written by the reviewer only (R13): `review.rebases` entries of the 923 D8/D9, 923 owner-fixes, 927 and 935 contracts with their
evidence under `docs/sessions/evidence/task931/review-r3/`, the retargeted `by` of the two entries of C23 and C24, and the deletion of
the archived 931 kickoff and sidecar. This sidecar keeps every scope file of revisions 1-2, among them the 923 D8/D9 contract file,
because the retargeted entries list them and an approving contract must scope every listed file.

Out of scope: any production behaviour change (a migrated test that exposes a real defect stops the task: `BLOCKED` with the defect);
every runtime file of C20 and `vitest*.config.*`; the 18 `*.integration.test.ts` files; any case ID, describe title or `it` title
mapped by another contract; Tasks 937-939 (other red jobs); the gate code (Task 943).

## 5. Current and required behaviour

Preserved: every production file byte-for-byte in the final diff; revision 1-2 requirements R1-R9 and their 17 cases (one title
renamed by R9 here); every mapped case of the 923 D8/D9, 923 owner-fixes and 927 contracts with its exact full name; the number of
tests of each changed file, unless a test is merged into a stronger one, named in the completion report. Required: every defect R22 names is noticed by a test; no test waits by
counting event-loop turns or sleeps a fixed time to wait for work to finish; no unit test replaces the Supabase query builder with a
double that ignores filter columns or values; the suite passes idle and with the thread pool kept busy.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C28; C29; C82; D12] | **Prerequisite.** Tasks 941, 943 and 945 are reviewed and committed before the first write; `node scripts/workflow-gates/cli.mjs plan` of this sidecar exits 0. | P1 | AC1 |
| R2 [C2; C3; C4; C7; C10; C33] | **Positive waits.** In every class A file, each wait for a window, a call or a state is a condition wait bounded by time, `vi.waitFor` or Testing Library `waitFor`, timeout at least 5000 ms; each wait for the nonce preparation awaits a completion signal of the real hash: the promises returned by `crypto.subtle.digest` through a pass-through spy that calls the real implementation, or a public ready signal of the component, then flushes inside `act`. No `setImmediate` turn loop and no turn budget remains in these files. | P1 | AC2 |
| R3 [C5; C6] | **Absence checks.** Each fixed settle (`Header.google.security.test.tsx` lines 175-285, `settleBriefly` at its three uses) is classified in the completion report: a positive check after a settle (line 216, `toHaveBeenCalledTimes(2)`) becomes a condition wait; an absence check first awaits the completion signal of the work that could produce the effect (R2's digest promises, the action's promise, or a positive sibling condition), then asserts the absence. A fixed settle may stay only where no such signal exists, named `settleForAbsence` with a comment naming the effect, each site listed in the completion report. | P1 | AC2 |
| R4 [C1; C7] | **No leak between tests.** Each class A file's `afterEach` awaits every captured digest promise and lets every pending attempt settle (or ends it through the module's public API), so a test that fails or gives up opens no window and posts no message during the next test; each `window.open` count assertion stays exact. | P1 | AC2 |
| R5 [C9; C53; C54; C55; C56] | **Every load-sensitive test.** (a) The contact-session test (C55) gets the R2-R4 treatment: every `findBy*`/`waitFor` it relies on gets an explicit timeout of at least 5000 ms or waits on a completion signal. (b) `staffPage.security.test.ts` and `adminUserGone.security.test.ts` (class B files that hit the 60 s test timeout under load, C54) pass every busy run after their migration; the completion report names what they waited for. (c) The four tests of `scripts/__tests__/check-ledger-claim-projection.test.ts` and `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` wait for real child processes and fail only on their wall-clock limit (C56); they are out of scope and are the only failures a busy census may show, each with a timeout message. (d) Before any write, the executor runs `node docs/sessions/evidence/task931/design/d18-busy-pool-full-suite.mjs <out outside the project>` on the base tree and saves `impl-r3/d18-base.txt`; a failing test there in a file outside §4 and outside (c) stops the task `BLOCKED` with that list before any write, for an Opus revision of §4 and the sidecar scope. | P1 | AC2 |
| R6 [C11; C12; C52] | **Shared fake.** `src/tests/fakeSupabase.ts` gains `lt`, `gt`, `like`, `ilike` (SQL `%`/`_` patterns; `ilike` case-insensitive) and `match(object)`; `.or(expression)` evaluates PostgREST terms `column.op.value` joined by commas, with ops `eq`, `neq`, `is`, `in`, `lt`, `lte`, `gt`, `gte`, `like`, `ilike` and nested `and(...)`, and throws `fakeSupabase: unsupported or() term <term>` for anything else; an unknown filter kind throws instead of matching; `db.fail({ table, op, error, times = 1 })` makes the next matching query resolve `{ data: null, error }` without changing any row, recorded in `db.log` with the error. Existing behaviour and the 42 current users stay green unchanged. | P1 | AC3 |
| R7 [C11; C12; C52] | **Fake test.** New `src/tests/__tests__/fakeSupabase.test.ts` proves each new filter and `.or()` on select, update and delete, with a seeded row that matches and one that must not: SEC-931-SRV-FAKE-FILTER-ALLOW, SEC-931-SRV-FAKE-FILTER-DENY, SEC-931-SRV-FAKE-OR-DENY (an unsupported term throws and matches nothing), SEC-931-SRV-FAKE-ERROR (an injected error changes no row and is logged). | P1 | AC3 |
| R8 [C13; C14; C47; D13] | **Migration of the 70 files.** Each file builds its Supabase query builder with `createFakeDb` (other client parts such as `auth`, `rpc` or `storage` may stay explicit doubles composed with `db.client`); every test that depends on an identity, ownership, status, time or flag filter seeds a decoy row that the filter excludes and asserts the decoy is not returned, changed or deleted, or asserts the exact filter in `db.log`; error paths use `db.fail`. No test is skipped or removed, no assertion is weakened, and no mapped case ID or title changes (C26). | P1 | AC4 |
| R9 [C30; C31; C46] | **Stale title.** `SEC-931-SRV-MODPERM-ALLOW` reads "… every other key false; every registry key present" in the test and in this sidecar's `testName`. | P2 | AC4 |
| R10 [C13; C14] | **Guard.** New `src/tests/__tests__/queryDoubles.guard.test.ts` applies the criterion of `docs/sessions/evidence/task931/design/d16-guard-criterion.mjs` (FACTORY and not FAKE and DOUBLE, or BLIND) to every `src/**/*.test.ts(x)` except `*.integration.test.ts` and itself and expects no hit (SEC-931-SRV-QUERY-GUARD-ALLOW); on inline fixture texts of the four shapes of d16 (arrow or `vi.fn` double, method syntax, named spy, filter stub without arguments) it reports a hit, and on a fixture using `createFakeDb` with `from: db.from` none (SEC-931-SRV-QUERY-GUARD-DENY). | P1 | AC5 |
| R11 [C7; C36-C45; C48; C50; C51] | **Planted breaks.** One at a time, then restored with `git diff --exit-code -- <file>` exit 0: P1-P13 each remove the filter call of C36-C45, C48, C50, C51 (the line, or the call cut from the chain on `recovery.ts:139`) and a named test of a migrated file fails with an assertion, not a type or runtime error; P14 makes `.or()` match every row again → SEC-931-SRV-FAKE-OR-DENY fails; P15 adds an untracked fixture test with a hand-written double → SEC-931-SRV-QUERY-GUARD-ALLOW fails, then the fixture is deleted; P16, class A: `docs/sessions/evidence/task931/design/d17-busy-pool-run.mjs 2` on the base files fails (C7), on the changed files passes. | P1 | AC6 |
| R12 [C26; C35; D12] | **Case-assertion record.** The completion report has one row per mapped case of the 923 D8/D9, 923 owner-fixes and 927 contracts whose test file changed: contract, case ID, test file, the assertion before and after, and the exact full name, unchanged. | P1 | AC7 |
| R13 [C15-C18; C21-C25; C29; C32; C49; D9; D12] | **Rebases and archive retirement (reviewer, in order).** (a) Stage `reviewed`. (b) The `by` of the entries of C23 and C24 becomes this sidecar's path; nothing else in them changes. (c) 923 D8/D9: a `tests` entry (its 26 case test files, `## Case assertions` from R12) then a `scope` entry (its 32 other files), each by this sidecar, continuing the last entry present. (d) 923 owner fixes and (e) 927: the same pair (11 + 1 and 7 + 4 files), after the Task 943 `rules` entries. (f) 935: a `scope` entry listing the 923 D8/D9 contract file, `originalScopeSha256` the `rebasedScopeSha256` of its last entry at that moment. (g) Delete the archived 931 kickoff and sidecar from the working tree. (h) `node scripts/workflow-gates/cli.mjs verify --contract <c>` with the development project identity for the 923 D8/D9, owner-fixes and 927 contracts, each exit 0, else that contract's new entries are removed and the decision is `BLOCKED`. (i) Rerun `report-r3.mjs`. (j) Only then the review block with the digests after (b)-(i). | P1 | AC8 |
| R14 [C1; C27; C57; C58] | **CI on the exact head.** After the owner's push, `node scripts/workflow-gates/ci-status.mjs --pr 12` shows the Unit and Component Tests and Task Security Contracts jobs green on the pushed SHA; until then the decision is `PARTIALLY VERIFIED`. The last red Unit job had no failing test: 5931 passed and one unhandled `ReferenceError: window is not defined` came from the scroll-lock timer of the Mantine modal, firing after the environment was torn down, attributed to the hydration test (C57). That file alone gives no error (C58), so the cause is a timer outliving its test under the full run. The fix is in that test's file: the modal is closed or unmounted and its timer has run or been cleared before the test ends, proven under the full suite; `dangerouslyIgnoreUnhandledErrors` and any product change are out. | P1 | AC9 |
| R15 [C61; C77; C78] | **Shared fake, what class D needs.** Besides R6: each `db.log` entry also holds `columns`, `head`, `orders` and `range`, so a test can assert what a query asked for; `db.fail` also takes `error: null` and an optional `count`, and the next matching query resolves `{ data: null, count, error: null }`: a count that cannot be read, with no error. SEC-931-SRV-FAKE-LOG proves both on the real fake. | P1 | AC10 |
| R16 [C59; C60; C62; C63] | **Contact event failures.** In `contactEvents.test.ts`: `db.fail` on the listing read answers `{ ok: false, reason: 'insert_failed' }` and leaves no event row (SEC-931-SRV-CONTACT-LOOKUP-ERROR); a failure thrown by the admin client answers the same (SEC-931-SRV-CONTACT-THROW). | P1 | AC10 |
| R17 [C61; C64] | **A rate limit that cannot be read.** In `submitListingInquiry.test.ts`: a count of `null`, and of `undefined`, with no error, on the first count read and on both reads, answers `{ error: 'rate_limited' }` and leaves no inquiry row (SEC-931-SRV-INQUIRY-COUNT-DENY). | P1 | AC10 |
| R18 [C65; C66; C67; C68; C83] | **Permission save and history.** New `permissions.failures.test.ts`, on the real actions: a thrown failure of `setModeratorPermission` answers `{ error: 'save_failed' }`, never `{}` (SEC-931-SRV-MODPERM-THROW); a failed audit insert keeps the saved change, answers `{}` and logs `setModeratorPermission event insert failed` with the key, and a good insert logs nothing (SEC-931-SRV-MODPERM-AUDIT-ERROR); `getPermissionEvents` gives `null` for `old_allowed`, `actor_user_id` and `actor_name` of an event with no old value and no actor, and keeps an old value of `false` (SEC-931-SRV-MODPERM-HISTORY). | P1 | AC11 |
| R19 [C69; C70; C71; C84] | **Status change effects.** New `applyListingTransition.effects.test.ts`, the real gateway through both public functions with `_db` from the fake; `next/cache`, `createNotification` and `next/server` are doubles at the boundary. Allowed: the index and the detail page refreshed in every locale of `routing.locales`, only the index with no slug; the owner notified with the title and link, the listing id as the title with no title, no link with no slug (SEC-931-SRV-TRANSITION-EFFECTS-ALLOW). Refused: on a lost race and on a database error nothing is refreshed and nobody is notified, and the log holds the actor's source or else user id and the row count; an actor who owns the listing is not notified (SEC-931-SRV-TRANSITION-EFFECTS-DENY). | P1 | AC11 |
| R20 [C72; C73; C74] | **The admin listings page past its guard.** New `page.test.tsx`, the real page and the real `requireStaffPage` on a viewer double, `createFakeDb` with an `rpc` double, `AdminListingsTable` a double that records its props. Allowed: newest first, range 0-24, 25 a page, `getAdminLocale` called, the title of `listings_total` with the count, three audit reads with `head`, the audit counts and every prop the table receives; a search holds the title words, the owner ids from name and e-mail, and an exact id, and a failing e-mail search still renders the page (SEC-931-FE-PAGE-QUERY-ALLOW). Refused, with decoy rows: the premium tab, a status and each visibility value exclude what they must, another tab excludes nothing, and a bad page falls back to the first (SEC-931-FE-PAGE-QUERY-DENY). The cases SEC-931-FE-PAGE-ALLOW and SEC-931-FE-PAGE-DENY stay where they are. | P1 | AC11 |
| R21 [C75; C76; C85] | **The table's refreshes.** In `AdminListingsTable.smoke.test.tsx`, with one named refresh double: after a premium save, a delete and a status change the router refreshes and the dialog closes as it does today; new props replace the rows; the page count is the total divided by the page size, rounded up; the tab, status and audit filters navigate with the parameters they send today; the type label of the preview uses the property type's label, or its code when it has none (SEC-931-FE-TABLE-REFRESH). | P1 | AC11 |
| R22 [C59; C60; C61; C72; C75; C79; C80; C82] | **Proof by the mutation check.** After R15 to R21: `node scripts/workflow-gates/mutation-check.mjs --all --minutes=60 <file>` for `contactEvents.ts`, `submitListingInquiry.ts`, `src/modules/admin/actions/permissions.ts`, `applyListingTransition.ts`, `src/app/admin/listings/page.tsx` and `src/components/admin/AdminListingsTable.tsx`, one file a run, saved under `docs/sessions/evidence/task931/impl-r3/mutation/`. Each report has 0 not tried and 0 undecided, and every line R16 to R21 names is caught. A defect still not caught is named in the completion report with why no behaviour can show it, or gets a test. One that only a product change could show stops the task `BLOCKED` with that line: no product file changes in this task. | P1 | AC12 |

## Acceptance criteria

- **AC1 [R1].** The receipt command of route step 2 prints `SECURITY TASK PREFLIGHT COMPLETE`; 941, 943 and 945 are `reviewed` in their
  sidecars at the start of the session.
- **AC2 [R2-R5].** `rg -n "setImmediate|turn < " <class A files>` finds no wait loop; `node docs/sessions/evidence/task931/design/d17-busy-pool-run.mjs 2`
  prints 0 failed in all four runs with at least 122 tests, twice by the executor and twice by the reviewer (failures vary with timing,
  C53); `node docs/sessions/evidence/task931/design/d18-busy-pool-full-suite.mjs <out>` shows no failure other than the R5 (c) tests
  with a timeout message, run by the executor and rerun by the reviewer; every fixed settle left is listed with its reason.
- **AC3 [R6; R7].** The four SEC-931-SRV-FAKE cases pass; every test file importing `fakeSupabase` passes.
- **AC4 [R8; R9].** For each of the 70 files the test count is at least the base count of `impl-r3/before.json`; every mapped case
  of the four contracts in these files passes under its exact name.
- **AC5 [R10].** SEC-931-SRV-QUERY-GUARD-ALLOW and SEC-931-SRV-QUERY-GUARD-DENY pass.
- **AC6 [R11].** Sixteen transcripts under `docs/sessions/evidence/task931/impl-r3/sensitivity/`, each with the failing assertion and
  the passing rerun after restore; at the end `git diff --name-only` lists no production file and `git status --short` no fixture.
- **AC7 [R12].** The record covers all 59 + 13 + 37 cases of C35.
- **AC8 [R1-R13].** Full suite `npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json`
  then `node scripts/workflow-gates/cli.mjs unit-report` exit 0, run twice; `npm run typecheck`, `npx eslint <changed files>`,
  `npm run check:file-integrity -- --files <changed files>`, `npm run build` exit 0; `report-r3.mjs` writes `report-r3.json` and
  `cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented. Reviewer, after R13: the scoped `validateDiff` harness
  of Task 940 AC7 (phase `release`, base `origin/main`, working tree) reports no error for the 923 D8/D9, owner-fixes, 927, 931 and
  935 contracts, and `reviewedFreshnessErrors` (Task 943 R11) returns `[]`.
- **AC9 [R14].** The `ci-status.mjs` transcript of the exact SHA is saved under `docs/sessions/evidence/task931/review-r3/`, and the Unit job's log of that run holds no `Errors` line and no `window is not defined`.
- **AC10 [R15-R17].** SEC-931-SRV-FAKE-LOG, SEC-931-SRV-CONTACT-LOOKUP-ERROR, SEC-931-SRV-CONTACT-THROW and SEC-931-SRV-INQUIRY-COUNT-DENY pass, and every earlier test of those files stays green.
- **AC11 [R18-R21].** The eight cases SEC-931-SRV-MODPERM-THROW, SEC-931-SRV-MODPERM-AUDIT-ERROR, SEC-931-SRV-MODPERM-HISTORY, SEC-931-SRV-TRANSITION-EFFECTS-ALLOW, SEC-931-SRV-TRANSITION-EFFECTS-DENY, SEC-931-FE-PAGE-QUERY-ALLOW, SEC-931-FE-PAGE-QUERY-DENY and SEC-931-FE-TABLE-REFRESH pass; the guard of R10 has no hit in the new files.
- **AC12 [R22].** Six mutation reports exist, each with 0 not tried and 0 undecided, every named line caught; the reviewer reruns at least `page.tsx` and `applyListingTransition.ts`; `git status --short -- src` shows only test files and the shared fake.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The revision 1-2 boundaries (`requireViewer`, `requireStaffPage`, `hasPermission`, `getModeratorPermissions`, `signUpWithCaptcha`, `getAgentStatisticsAccess`, `applyListingTransitionByStatus`, the listings-expiry cron); the Google sign-in attempt (`googlePopup`) and its consumers; the Supabase query boundary of the 70 files, through `src/tests/fakeSupabase.ts`. |
| Frontend security | Revision 1-2 cases SEC-931-FE-PAGE-ALLOW, SEC-931-FE-PAGE-DENY, SEC-931-FE-STATUS-ERROR on the real consumers; class D SEC-931-FE-PAGE-QUERY-ALLOW, SEC-931-FE-PAGE-QUERY-DENY and SEC-931-FE-TABLE-REFRESH on the real page and table; the Task 927 frontend cases in the class A files keep their names and pass idle and under load (R2-R5). |
| Server security | Revision 1-2 SEC-931-SRV cases; new SEC-931-SRV-FAKE-FILTER-ALLOW, SEC-931-SRV-FAKE-FILTER-DENY, SEC-931-SRV-FAKE-OR-DENY, SEC-931-SRV-FAKE-ERROR on the real `createFakeDb`; SEC-931-SRV-QUERY-GUARD-ALLOW and SEC-931-SRV-QUERY-GUARD-DENY on the real test tree; class D SEC-931-SRV-FAKE-LOG, SEC-931-SRV-CONTACT-LOOKUP-ERROR, SEC-931-SRV-CONTACT-THROW, SEC-931-SRV-INQUIRY-COUNT-DENY, SEC-931-SRV-MODPERM-THROW, SEC-931-SRV-MODPERM-AUDIT-ERROR, SEC-931-SRV-MODPERM-HISTORY, SEC-931-SRV-TRANSITION-EFFECTS-ALLOW and SEC-931-SRV-TRANSITION-EFFECTS-DENY on the real actions and gateway; the migrated tests of the 923 and 927 contracts keep their cases. |
| Database/integrations | No runtime, SQL or provider change. The integration cases of the 923 D8/D9, owner-fixes and 927 contracts are rerun by the reviewer through `cli.mjs verify` with the development project (R13 (h)). No new critical case. |
| Cases | The 35 SEC-931 cases of the sidecar; full names are `<describe> <it>` with the `[ID]` at the start of the `it` title. |
| Fixtures and environment | In-memory rows with synthetic ids, no network or credentials for the executor, unit project only; the busy-pool preload of d17 for load runs. |
| Sensitivity proof | The sixteen planted breaks of R11 (AC6); the mutation reports of R22 (AC12), in memory. |
| Execution | `docs/sessions/evidence/task931/security/report-r3.mjs`, a copy of `report.mjs` that writes `report-r3.json`, then `node scripts/workflow-gates/cli.mjs verify --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`; native Windows, Node 22.22.3; QA Q4. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): commit this kickoff set with the command Opus gives.
2. **Sonnet, fresh session**, after Tasks 941, 943 and 945 are reviewed and committed: `node scripts/workflow-gates/cli.mjs receipt --contract <this sidecar>`;
   save the base JSON run of the 70 files and the class A files to `docs/sessions/evidence/task931/impl-r3/before.json`; run P16 on the
   base files and save its transcript; run the R5 base census.
3. R6, R7 and R15, then R8 file by file (rerun each file after its change), R9, R10; then R2-R5, rerunning d17 after each file; then R16 to R21.
4. R11: the planted breaks with transcripts and restoration proof; R12: the case-assertion record; R22: the mutation reports.
5. `report-r3.mjs` and `cli.mjs verify`; every AC8 command; set stage `implemented`; write
   `docs/sessions/evidence/task931/impl-r3/completion-report.md`; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git command.
6. **Opus reviewer, another session:** review; on approval R13 (a)-(j) in that order; the explicit-path commit command (the deleted
   archive pair by explicit path); the branch push; then R14. PR #12 merges only after all required checks are green.

## 7. Completion report

Per requirement: changed files, evidence, status; the R3 classification of every settle; per migrated file the doubles replaced, the
decoys added and the filters pinned; the R12 case-assertion record; each SEC-931 case with its result; the sixteen planted-break
transcripts; before/after totals of the changed files and of the full suite, idle and busy; one of
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. For class D: each mutation report, and every defect still not caught with its reason.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows from executed probes under `docs/sessions/evidence/task931/design/` and current source lines. |
| `security-testing.md` | Frontend and server rows on real consumers, actions and the shared fake; planted breaks for every pinned filter and for the guard. |
| `role-boundaries.md` | Sonnet changes tests only; Opus reviews and writes every rebase entry; no policy path in scope. |
| `git-publication.md` | Commit on PR #12's branch (D7); push only after approval; merge only after green checks (R14). |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72, C73, C74, C75, C76, C77, C78, C79, C80, C81, C82, C83, C84, C85; owner decisions: D7, D9, D12, D13, D14, D29; blocked claims: NONE.
