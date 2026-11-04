# Task 943 contract — scope rebase by Task 944 (Task 944 R7, owner decision D9, 2026-11-04)

Written by the independent Task 944 governance approver, review 3 (Opus, D2), after the Task 944 review block, never by an
implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work and wrote no file of the 944
contract scope.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`
  (kind `governance`, stage `reviewed`, no earlier rebase; reviewed digest
  `b82dbac3822a5cf3bd165ac5de5e02c2fb4055dbae6e57b6f55dc89739eb755e`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`
  (kind `governance`, stage `reviewed`); its scope lists the four files below.
- Base: `d17d9d5a8`; candidate: Task 944 commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea`.
- Why: Task 944 changed these four files of the 943 scope. None is a test file of a 943 case or a runtime file; Task 944 changed
  no 943 case test.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/contract.mjs`
- `scripts/workflow-gates/cli.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows 11, Git Bash, Node v22.22.3, read-only, this session)

`docs/sessions/evidence/task944/review/r3-rebase-digests.txt`: `scopeDigest` of the 943 contract with the base (`d17d9d5a8`)
contents of every file Task 944 changed equals the reviewed digest (`EQUALS last: true`); the 944-changed files in the 943 scope,
inputs and case tests are exactly the four above; current digest
`b50491fae6c575f79bc8664cba0a2303ab38337eb888268e881b2de45f7731fb`.
