# Task 923 D8/D9 contract — rule-only review rebase (Task 935 R10, owner decision D6, 2026-11-01)

Written by the independent Task 935 governance approver session (D2), not by the implementer.

- Rebased contract: `tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json` (kind `product`, stage
  `reviewed`, review `APPROVED WITH NOTES`, evidence `docs/sessions/evidence/task923/review-67/rv67-10-review-decision.md`).
- Approving governance contract (`by`):
  `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`.
- Diff base: `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2` (`origin/main`, the merge base); head: the Task 935 branch.
- Why: PR #11 and Task 935 changed rule files that the Task 923 review scope digest includes through
  `workflowRuleInputs` (`workflow-gates.md` gained its Required companions section), so the reviewed digest went
  stale with no change to any product file, test, input or runtime config (kickoff C31–C35).

## Changed rule files
- `.claude/rules/shared/security-testing.md`
- `.claude/rules/shared/workflow-gates.md`
- `.claude/rules/shared/workflow-contract.md`
- `.claude/rules/shared/workflow-evidence.md`
- `.claude/rules/shared/workflow-ci.md`
- `.claude/rules/shared/git-publication.md`

## Verification (native Windows, Node v22.22.3, read-only)

- Rule inputs of the Task 923 contract (`workflowRuleInputs`): security-testing, security-test-quality,
  security-test-environment, security-test-boundaries, workflow-gates, workflow-contract, workflow-evidence,
  workflow-ci, git-publication. Exactly the six files above differ between the base and the working tree.
- Each listed file is a `.claude/rules/` Markdown file in the scope of the approving governance contract.
- Task 923 scope digest with the base contents of the six files (`git show <base>:<file>`):
  `a036d22822ad264ff5717aa08f85b5e49d4d95ca36a9bb66810152f43da32c74` = recorded `review.scopeSha256` (MATCH).
- Current Task 923 scope digest: `a46e25d54ad70b4daedae8ddde0c4c31daf638b73a1a012092e9e5e1faf61302`.
- No other digest input (scope, inputs, mapped test files, runtime configs) changed; any such change keeps the review
  stale under `diffRebaseErrors`.
