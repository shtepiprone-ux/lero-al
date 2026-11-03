# Task 940 contract — scope rebase by Task 941 (Task 941 R5, owner decision D9, 2026-11-03)

Written by the independent Task 941 governance approver session (D2, review 3), after the Task 941 review block, never by an
implementer. This session wrote none of the Task 941 scope files apart from the rule-mandated report regeneration.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, no earlier rebase; reviewed digest
  `5281d99052146b1a5c6d9c937340430576e78d14389542c3d38f354e11d1aa81`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, archived at closure); its scope lists both files below.
- Anchor base: `758508105^` (the commit before the first Task 941 code commit); candidate: Task 941 revision 2 commit
  `b7c3fc9f64cb14f5ab261303e1ad39c3a83730bc`.
- Why: Task 941 changed the hook and the publication manifest, both in the 940 scope. Neither is a test file of a 940 case and
  neither is a runtime file.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows, PowerShell 5.1.26100, Node v22.22.3, read-only)

- `node docs/sessions/evidence/task941/review/closure.mjs`: the 940 scope digest with the base contents of the two files above
  equals the reviewed digest `5281d99052146b1a5c6d9c937340430576e78d14389542c3d38f354e11d1aa81` (EQUALS RECORDED); each of
  the two changed since the base; changed files that are case test files: none.
- Current 940 scope digest before this entry: `1c4379305cb8b87a53e17897e12454a3f5f906e083e9cb2204769d85b016a58f`.
