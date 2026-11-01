# Task 935 contract — scope rebase by Task 940 (Task 940 R6, owner decision D9, 2026-11-01)

Written by the independent Task 940 governance approver session (D2), after the Task 940 review block, never by the
implementer. This session wrote none of the Task 940 scope files.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, evidence
  `docs/sessions/evidence/task935/review/review-935.md`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`
  (kind `governance`, stage `reviewed`, review `APPROVED WITH NOTES`, archived at closure); its scope lists every file below.
- Anchor base: `c2f918a590cab7354e1c2f01379b2a7c93726060` (PR #12 head at which the 935 review digest was current);
  candidate: Task 940 commit `ad6e1b08ec9cf21d29550b037040c02ed6772eae`.
- Why: Task 940 changed gate code, the publication manifest and the review rule that the 935 scope lists (kickoff C22–C24,
  C32). None is a test file of a 935 case and none is a runtime file.

## Changed scope files
- `scripts/workflow-gates/contract.mjs`
- `scripts/workflow-gates/cli.mjs`
- `scripts/workflow-gates/security-hook.mjs`
- `scripts/workflow-gates/publication.json`
- `.claude/rules/review/03-decision-closure.md`

## Verification (native Windows, PowerShell 5.1.26100, Node v22.22.3, read-only)

- `node docs/sessions/evidence/task940/review/r6-935-anchor-probe.mjs c2f918a59` (also with base `dfc2fedcf`): the 935
  scope digest with the base contents of the five files above equals the recorded `review.scopeSha256`
  `3ecf552263ac4ac3c742d215cfe26f96c27a8e2fb7c50c03f1e5f44e5294a2d0` (EQUALS REVIEWED); each of the five changed since
  the base.
- Current 935 scope digest: `a3fb3748747e9ae60e4bce1f9365c9bcdf818c052214fceeb77cee41f1637349`.
- 935 case test files (`governance-contract.selftest.mjs`, `publication-safety.selftest.mjs`, `git-policy.selftest.mjs`,
  `workflow.selftest.mjs`) are unchanged; no other digest input changed.
- The 935 contract is absent at `origin/main`, so the CI diff check skips the base anchor for this entry (Task 940 R4 e);
  the anchor above is the approver's substitute check.
