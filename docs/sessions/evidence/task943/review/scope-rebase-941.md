# Task 941 contract — scope rebase by Task 943 (Task 943 R6, owner decision D9, 2026-11-03)

Written by the independent Task 943 governance approver, review 3 (Opus session `e50584bc`, D2), after the Task 943 review block,
never by an implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work; it reran the
verification below itself (the draft of the withdrawn review 2 session `6f2564f3` was only a template). A `tests` entry
(`tests-rebase-941.md`) follows this entry.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`
  (kind `governance`, stage `reviewed`, no earlier rebase; reviewed digest
  `3cf59b3205ba848c95ce87460963ed825d2ff6f3a70efda9776996896c42e6a5`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`
  (kind `governance`, stage `reviewed`, archived at closure); its scope lists both files below.
- Anchor base: `b85f5a66bbc8c6c4d375ad25f250cc29bbfbf8d8`; candidate: Task 943 revision 4 commit
  `04545b0ea58577a6c23ff0b6bd3ba56277637236`.
- Why: Task 943 changed these two files of the 941 scope. Neither is a test file of a 941 case nor a runtime file. Its third
  changed 941 file, the case test `scripts/workflow-gates/shell-write.selftest.mjs`, is never a `scope` entry (C37, C157); this
  entry's `rebasedScopeSha256` is the 941 digest with that file at the base
  (`28fede2a27134a1d64219fcbac25b3ad23a57945f801c2542bf1bc3023036aa3`), where the `tests` entry starts (C156).

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows 11, Node v22.22.3, read-only, this session)

`node test-results/943-r3/run.mjs closure` ran `docs/sessions/evidence/task943/review/r2-closure.mjs` and kept
`docs/sessions/evidence/task943/review/r3-closure.txt`: the 941 scope digest with the base contents of the three changed files
equals the reviewed digest (`EQUALS RECORDED (only these files changed)`); each `CHANGED since base`; only the test file is a case
test; intermediate digest `28fede2a27134a1d64219fcbac25b3ad23a57945f801c2542bf1bc3023036aa3`.
