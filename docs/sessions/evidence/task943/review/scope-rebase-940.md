# Task 940 contract — scope rebase by Task 943 (Task 943 R6, owner decision D9, 2026-11-03)

Written by the independent Task 943 governance approver, review 3 (Opus session `e50584bc`, D2), after the Task 943 review block,
never by an implementer. This session designed, implemented and reviewed none of the earlier 943 or 944 work; it reran the
verification below itself (the draft of the withdrawn review 2 session `6f2564f3` was only a template).

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`
  (kind `governance`, stage `reviewed`, one earlier `scope` entry; latest recorded digest
  `1c4379305cb8b87a53e17897e12454a3f5f906e083e9cb2204769d85b016a58f`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`
  (kind `governance`, stage `reviewed`, archived at closure); its scope lists every file below.
- Anchor base: `b85f5a66bbc8c6c4d375ad25f250cc29bbfbf8d8`; candidate: Task 943 revision 4 commit
  `04545b0ea58577a6c23ff0b6bd3ba56277637236`.
- Why: Task 943 changed these files of the 940 scope. None is a test file of a 940 case and none is a runtime file.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`
- `scripts/workflow-gates/contract.mjs`
- `scripts/workflow-gates/cli.mjs`
- `.claude/rules/review/03-decision-closure.md`

## Verification (native Windows 11, Node v22.22.3, read-only, this session)

`node test-results/943-r3/run.mjs closure` ran `docs/sessions/evidence/task943/review/r2-closure.mjs` and kept
`docs/sessions/evidence/task943/review/r3-closure.txt`: the 940 scope digest with the base contents of the five files equals the
latest recorded digest (`EQUALS RECORDED (only these files changed)`); each of the five `CHANGED since base`; listed files that
are case tests: `[]`.
