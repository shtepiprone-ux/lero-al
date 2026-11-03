# Task 923 owner-fixes contract — rules rebase by Task 935 (Task 943 R6, C54–C56, 2026-11-03)

**DRAFT (owner D19, 2026-11-03): prepared by the withdrawn review 2 session and not applied.** The next fresh approver reruns the verification below, rewrites the first paragraph as its own, and writes the entry.

Written by the independent Task 943 governance approver session (D2, review 2, session 6f2564f3), never by an implementer.

- Rebased contract: `tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json` (kind `product`, stage
  `reviewed`, no earlier rebase; reviewed digest `86039ff1eefef80125883e9ad7c0842ec43207fa567c1ad059afc1583385c78e`).
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`
  (kind `governance`, stage `reviewed`); its scope lists all six rule files below.
- Why: the review went stale only through these shared rule files, changed on the PR #12 branch by reviewed governance work
  (C55); each is a rule input of the rebased contract.
- Base: `origin/main` `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`; an absent base file is passed as absent, as the CI base reader
  does.

## Changed rule files
- `.claude/rules/shared/security-testing.md`
- `.claude/rules/shared/workflow-gates.md`
- `.claude/rules/shared/workflow-contract.md`
- `.claude/rules/shared/workflow-evidence.md`
- `.claude/rules/shared/workflow-ci.md`
- `.claude/rules/shared/git-publication.md`

## Verification (native Windows, PowerShell 5.1, Node v22.22.3)

The d14 probe rerun in `node docs/sessions/evidence/task943/review/r2-closure.mjs` (`r2-closure-output.txt`): the scope digest with
the base bytes of the six files equals the reviewed digest (`MATCH true`); all six are rule inputs; 935 scopes all six. The
approver keeps this entry only when `cli.mjs verify --contract <this contract>` exits 0 with the development project identity
(R6, C51); the result is recorded in the review record.
