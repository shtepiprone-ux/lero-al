# Task 941 contract — scope rebase by Task 944 (Task 944 R7, owner decision D9, 2026-11-04)

Written by the independent Task 944 governance approver, review 3 (Opus, D2), after the Task 944 review block, never by an
implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work and wrote no file of the 944
contract scope.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`
  (kind `governance`, stage `reviewed`; last chain digest `17e727cdccdca7519b6ec4751b6c3029f1639e52f38d9a4cdb1e07e95b4b2de4`, the
  `rebasedScopeSha256` of its second entry, the `tests` entry by Task 943).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`
  (kind `governance`, stage `reviewed`); its scope lists both files below.
- Base: `d17d9d5a8`; candidate: Task 944 commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea`.
- Why: Task 944 changed these two files of the 941 scope. Neither is a test file of a 941 case or a runtime file; Task 944 changed
  no 941 case test.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows 11, Git Bash, Node v22.22.3, read-only, this session)

`docs/sessions/evidence/task944/review/r3-rebase-digests.txt`: `scopeDigest` of the 941 contract with the base (`d17d9d5a8`)
contents of every file Task 944 changed equals the last chain digest (`EQUALS last: true`); the 944-changed files in the 941 scope,
inputs and case tests are exactly the two above; current digest
`11686da52a568e9b3daccd99c5daa745bd901b263083e68a2c01d0821c49b86a`.
