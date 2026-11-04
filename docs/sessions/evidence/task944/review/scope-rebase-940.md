# Task 940 contract — scope rebase by Task 944 (Task 944 R7, owner decision D9, 2026-11-04)

Written by the independent Task 944 governance approver, review 3 (Opus, D2), after the Task 944 review block, never by an
implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work and wrote no file of the 944
contract scope.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`
  (kind `governance`, stage `reviewed`; last chain digest `2ca83fb4fbacc528048b4b62c1ba61ce062a7e15e7b3ddff833f0ede895afae4`, the
  `rebasedScopeSha256` of its second entry, by Task 943).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`
  (kind `governance`, stage `reviewed`); its scope lists the four files below.
- Base: `d17d9d5a8`; candidate: Task 944 commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea`.
- Why: Task 944 changed these four files of the 940 scope. None is a test file of a 940 case or a runtime file; Task 944 changed
  no 940 case test.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/contract.mjs`
- `scripts/workflow-gates/cli.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows 11, Git Bash, Node v22.22.3, read-only, this session)

`docs/sessions/evidence/task944/review/r3-rebase-digests.txt`: `scopeDigest` of the 940 contract with the base (`d17d9d5a8`)
contents of every file Task 944 changed equals the last chain digest (`EQUALS last: true`); the 944-changed files in the 940 scope,
inputs and case tests are exactly the four above; current digest
`1db15707bda529dee5dd2e2b1abc8970d5f6f0ad3a7b3974efcd69bc85af4687`.
