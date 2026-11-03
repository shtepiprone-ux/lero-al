# Task 935 contract — scope rebase by Task 941 (Task 941 R5, owner decision D9, 2026-11-03)

Written by the independent Task 941 governance approver session (D2, review 3), after the Task 941 review block, never by an
implementer. This session wrote none of the Task 941 scope files apart from the rule-mandated report regeneration.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`; latest entry: the `scope` entry by Task 931, rebased
  digest `9cc079cb216857dfe6a1d535f88f2c88ace4c5653557385a7f6400347c9eb34a`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, archived at closure); its scope lists both files below.
- Anchor base: `758508105^` (the commit before the first Task 941 code commit); candidate: Task 941 revision 2 commit
  `b7c3fc9f64cb14f5ab261303e1ad39c3a83730bc`.
- Why: Task 941 changed the hook and the publication manifest, both in the 935 scope. Neither is a test file of a 935 case and
  neither is a runtime file.

## Changed scope files
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`

## Verification (native Windows, PowerShell 5.1.26100, Node v22.22.3, read-only)

- `node docs/sessions/evidence/task941/review/closure.mjs`: the 935 scope digest with the base contents of the two files above
  equals the latest recorded digest `9cc079cb216857dfe6a1d535f88f2c88ace4c5653557385a7f6400347c9eb34a` (EQUALS RECORDED);
  each of the two changed since the base; changed files that are case test files: none.
- Current 935 scope digest before this entry: `cfb7e1f248c4f5c78bb0b2ae22065e63409dc0b582f52d12feb4712c14ef7f44`.
