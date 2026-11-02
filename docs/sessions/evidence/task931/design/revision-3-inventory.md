# Task 931 revision 3 — inventory of found and potential holes (Opus, 2026-11-02, design in progress)

Owner instruction 2026-11-02 (translated): "You must not just make CI green, you must close every hole in the project that
is already found and every potential one. Without this I will not accept your patched task." Owner instruction the same
day: no new task; everything inside the current task.

Status (updated 2026-11-02, same session, owner D14): **revision 3 written and validated** at
`tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md` with its sidecar (classes A-C, R1-R14); the
archived revision 1-2 pair stays reviewed until revision 3's approver retires it (its R13). Task 937 revision 2 (R12 rebases the
923 D8/D9, 931 revision 3 and 935 contracts; AC6 requires 0 failed) is written and its sidecar `ready`. Class F is Task 943 R7
(D12), class G Task 943 R6 and R11. Readiness: `readiness.md` in this folder.

## Why the approval of 2026-11-01 was wrong

931's goal is a green Unit and Component Tests job. It was approved on a local native-Windows run (5931/5931). CI run
41415423554 on head `2693c6b9a` fails 2 tests of `src/lib/auth/__tests__/googlePopup.test.ts` (`d06-digest-turn-budget.txt`).

## Class A — waits counted in event-loop turns (CI-load dependent)

Cause (EXECUTED, `d06-digest-turn-budget.txt`): the attempt hashes its nonce with WebCrypto before `window.open`; with the
libuv thread pool busy one cold digest took 207118 `setImmediate` turns (231.68 ms) against a 500-turn budget. CPU load
alone does not reproduce it. When the wait gives up, the pending attempt opens its window during the next test.

| File | Site |
|---|---|
| `src/lib/auth/__tests__/googlePopup.test.ts` | `until`, line 40 (failed in CI) |
| `src/components/layout/__tests__/Header.google.security.test.tsx` | `until`, line 101; fixed 20 ms settles, lines 175-285 |
| `src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx` | `until`, line 65; `settleBriefly` 20 ms, line 85 |
| `src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx` | `until`, line 66 |
| `src/modules/auth/components/__tests__/AuthSheet.test.tsx` | 20-turn loop, line 238 |

To classify still: each fixed sleep is either an absence check (a bounded settle may stay, named as such) or a positive wait
(must become a time-bounded condition wait); also `overlays.test.tsx:188` (400 ms) and `MantineCombobox.smoke.test.tsx:440,452`
(50 ms). Integration deadline polls (`contactSession`, `ownerPublish`, `accessHardening`) are time-bounded already.
Required proof: each wait reproduced as failing under a busy thread pool before the change and passing after; a test that
gives up must not leak its attempt into the next test.

## Class B — Supabase doubles that ignore filter values (a changed filter fails no test)

51 occurrences in 32 test files whose double accepts `.eq/.is/.lt/.gte/.neq` without reading the column or value (scan:
`grep -rnE "\b(eq|neq|lt|lte|gt|gte|is|in|ilike|like|match|contains)\s*:\s*(\(\)\s*=>|\(_[a-zA-Z]*)"` over `src/**/*.test.ts(x)`).
Files with no other filter assertion (highest risk — identity, ownership or status scoping is unchecked):
`app/auth/confirm/__tests__/route.test.ts`, `lib/__tests__/exchangeRates.security.test.ts`,
`lib/auth/__tests__/staffPage.security.test.ts`, `lib/auth/requireViewer.security.test.ts`,
`modules/admin/actions/__tests__/userWebsite.security.test.ts`, `modules/auth/actions/__tests__/recovery.security.test.ts`,
`modules/listings/actions/__tests__/deleteReport.smoke.test.ts`, `reStampExpiresAt.smoke.test.ts`,
`submitListingInquiry.smoke.test.ts`, `visitorActions.security.test.ts`, `app/[locale]/[slug]/__tests__/page.errors.test.ts`,
`modules/admin/actions/__tests__/adminGetters.security.test.ts`, `updateUserProfileFull.smoke.test.ts`,
`modules/cabinet/actions/__tests__/changePassword.security.test.ts`, `deleteOwnAccount.smoke.test.ts` (8),
`modules/listings/actions/__tests__/createListing.smoke.test.ts`, `deleteListing.security.test.ts`,
`listingImages.security.test.ts`, `updateListing.smoke.test.ts`, `modules/listings/actions/ownerPublish.security.test.ts`.
Partly asserted: `exchangeRateServer.test.ts`, `pages-and-footer-validation.smoke.test.ts`, `contactEvents.test.ts`,
`submitListingInquiry.test.ts`, `notifications.security.test.ts`, `lib/auth/blockCheck.security.test.ts` and
`lib/auth/__tests__/blockCheck.security.test.ts`, `reportListing.smoke.test.ts`, `rls-write-guards.smoke.test.ts`,
`permissions.test.ts`, `cron/listings-expiry/__tests__/route.test.ts` (Task 931 N3), `getModeratorPermissions.smoke.test.ts`.
Still to do per occurrence: the production query it stands for (file:line), the filter's meaning (identity, ownership,
status, other) and the assertion that pins it; one shared recording double instead of 32 hand-written chains.

**Correction (self-audit, 2026-11-02): the shape scan above is incomplete.** A second form (`eq: vi.fn(...)`) adds 12 files, three
of them new (`hardDeleteUser.smoke.test.ts` with no filter assertion at all, `saveSavedSearch.dedup.test.ts`,
`notifications/lib/__tests__/mutations.smoke.test.ts`). Any shape scan misses forms; the complete criterion is
`d09-hand-written-query-doubles.txt`: 82 test files mock a Supabase client factory with a hand-written query double instead of
`src/tests/fakeSupabase.ts` (18 of them integration tests against the real database, to be confirmed, not migrated). Revision 3
classifies all 82; its mechanical acceptance is that list, not the 32-file shape scan.

## Class C — stale text

Task 931 N1: `SEC-931-SRV-MODPERM-ALLOW` title and sidecar `testName` say "13 keys present"; the registry holds 21.

## Class D — workflow and gate holes (policy paths: Opus governance implementer, D1/D2; not Sonnet)

Placed in the open governance Task 943 (same hook, already scoped for 935 N2), no new task:
- 935 N1: the independence exemption accepts a forged contract with any evidence path (probe in `review-935.md`).
- 940 N3: residual exemption of a planted contract with a valid `rules` entry (untested).
- 935 N4: two shared contracts over 8 KiB; `validateRuleSizes` covers phase files only.
- Review notes reach no later task: `review/03-decision-closure.md` lets `APPROVED WITH NOTES` leave notes only in a review
  file (Task 931 N1/N3 and the 937 obligation).
- A task whose goal is a CI job was approved without that job on the exact SHA.

## Class E — the 937 R12 re-stale (cross-task)

Probes `docs/sessions/evidence/task937/design/p07`, `p08`, `p09`: writing the 923 contract in 937 R12 stales the reviewed
931 and 935 contracts; scope entries by 937 on both validate once the 937 sidecar scopes the 923 contract file (saved, sidecar
`draft`), and fail without it. 931 must be re-reviewed before 937 R12, since 931's case tests change in classes A-C and
case tests are never rebased.

## Class F — the rule that keeps classes A and B unfixable (owner decision required)

Probe `d08-rev3-contract-impact.mjs` (EXECUTED 2026-11-02, exit 0): of the 39 files revision 3 changes, 19 are case tests of
reviewed contracts other than 931 — Task 927 (`googlePopup.test.ts`, `Header.google.security.test.tsx`,
`AuthSheet.google.security.test.tsx`, `ProfileTab.googleReauth.security.test.tsx`), Task 923 D8/D9 and Task 923 owner fixes
(among them `deleteListing`, `ownerPublish`, `changePassword`, `recovery`, `blockCheck` x2, `requireViewer`, `staffPage`,
`exchangeRates`, `listingImages`, `visitorActions`, `notifications`, `exchangeRateServer`). Owner decision D9 (Task 940) lets a
later contract rebase only non-test scope files; `scopeEntryErrors` refuses a case test. So hardening any of these tests, and
even fixing the CI-red `googlePopup.test.ts`, leaves a reviewed contract stale for ever. Choices: extend D9 with an audited
case-test rebase (governance, Task 943, before 931), or reopen and re-review the 923 and 927 contracts.

Class B design input (EXECUTED, `src/tests/fakeSupabase.ts`): a shared fake already evaluates `eq in is neq gte lte not` against
seeded rows and logs every call; it lacks `lt`, `gt`, `like`, `ilike`, error injection, and `.or()` is recorded but always
matches (line 39) — the reasons the hand-written loose doubles exist. Production filter manifest per test file:
`d07-class-b-manifest.txt`.

## Constraints for the revision 3 route (self-audit, 2026-11-02)

- **No runtime file changes.** `scopeDigest` binds `package.json`, `package-lock.json`, `tsconfig.json`, `.nvmrc`,
  `src/tests/setup.ts`, `src/tests/integration/setup.ts` and every root runtime config into every contract
  (`scripts/workflow-gates/contract.mjs:65-72`), and neither a `scope` nor a `tests` rebase accepts them (D9, D12; Task 940
  note N2). A class A fix must stay inside the test files and `src/tests/fakeSupabase.ts`.
- **Class D dispositions** (`docs/sessions/evidence/task943/design/readiness.md`): 935 N1 closed by Task 940 R5; 940 N3 → 943 R8;
  935 N4 no defect (the size limit binds phase files and five named shared files); 940 N1 residual (a rewritten review is a
  forged approval; D2 hook and owner-only commits); closure rules → 943 R9.
- **Bindings** (`d10-inputs-rules-impact.txt`): no changed file is an `inputs` or `rules` binding of any contract; the
  case-test bindings are repaired by the D12 `tests` entries on the 923 D8/D9, 923 owner-fixes and 927 contracts.

- **The reopened contract keeps its path and scope.** The `scope` entries on the 923 D8/D9 and 935 contracts name
  `by: tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json`; `scopeEntryErrors` reads that file
  and requires it `reviewed` and scoping every listed file (`scripts/workflow-gates/contract.mjs:161-166`). Revision 3 therefore
  keeps every revision 1-2 scope file. **Superseded the same day:** an archived sidecar must stay `reviewed` (`cli.mjs:19`) and
  product execution needs an active task, so revision 3 is a new pair at the Sprints path with the same basename; its approver
  points those two entries at it and deletes the archived pair (revision 3 R13), which Task 943 R11 accepts because a reviewed
  contract of the same file name exists.
- **Tests entries need the full case rerun.** A `tests` entry is kept only when `cli.mjs verify` of the rebased contract exits 0
  with the development project identity (943 section 5b); the 923 D8/D9 contract has 86 integration cases, owner fixes 6, 927 4.
- **CI has never rerun the 923/927 cases on PR #12.** Run 41415423554, job Task Security Contracts: `Security scope: 322 changed
  files, 10 task contract(s).` then `BLOCKED: ...Task_941...: Governance verification requires an implemented or reviewed contract`;
  `runMappedTests` is reached only when `validateDiff` has no error (`cli.mjs:281-283`). Local run of the mapped cases with the
  development project (`d11-verify-mapped-cases.txt`): every case of 923 D8/D9, 923 owner fixes and 927 passes; owner fixes and 927
  fail only on a stale report scope hash.

## Class G — reviewed contracts stale outside the diff (found 2026-11-02, third self-audit)

The 923 owner-fixes and 927 reviews are stale since six shared rule files changed on the PR #12 branch (`d12`, `d13`); the Task 935
approver rebased only 923 D8/D9, and no gate checks a reviewed contract whose file is not in the diff. A `rules` entry by 935
carries both (`d14`, `MATCH true`). Placed in Task 943 (no new task, D13): R6 writes both entries, R11 adds the CI freshness check.
Consequence for revision 3: its `tests` entries on these two contracts continue the chain after those `rules` entries.

## Not yet inventoried

Open items in other review files with notes headings (12 evidence files), and reviewed tasks before Sprint 92.
