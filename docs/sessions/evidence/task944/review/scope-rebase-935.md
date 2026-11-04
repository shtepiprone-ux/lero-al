# Task 935 contract — scope rebase by Task 944 (Task 944 R7, owner decision D9, 2026-11-04)

Written by the independent Task 944 governance approver, review 3 (Opus, D2), after the Task 944 review block, never by an
implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work and wrote no file of the 944
contract scope. A `tests` entry (`tests-rebase-935.md`) follows this entry.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`
  (kind `governance`, stage `reviewed`; last chain digest `57f2f78a67c86177d170475b8afc761652da6762c689bb1929c3c5b02442bf65`, the
  `rebasedScopeSha256` of its fourth entry, by Task 943).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`
  (kind `governance`, stage `reviewed`); its scope lists the four files below.
- Base: `d17d9d5a8`; candidate: Task 944 commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea`.
- Why: Task 944 changed these four files of the 935 scope. None is a test file of a 935 case or a runtime file. Its fifth changed
  935 file, the case test `scripts/workflow-gates/governance-contract.selftest.mjs`, is never a `scope` entry; this entry's
  `rebasedScopeSha256` is the 935 digest with that file at the base
  (`8f70b3a1a6728a01b6a9dcf8778b122e5988b84826d138c6c93cb2ecf9996b4c`), where the `tests` entry starts.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/contract.mjs`
- `scripts/workflow-gates/cli.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows 11, Git Bash, Node v22.22.3, read-only, this session)

`docs/sessions/evidence/task944/review/r3-rebase-digests.txt`: `scopeDigest` of the 935 contract with the base (`d17d9d5a8`)
contents of every file Task 944 changed equals the last chain digest (`EQUALS last: true`), so only Task 944 made it stale; the
944-changed files in the 935 scope, inputs and case tests are exactly the four above plus the case test; intermediate digest with
only the case test at the base `8f70b3a1a6728a01b6a9dcf8778b122e5988b84826d138c6c93cb2ecf9996b4c`.
