# Task 935 contract — case-test rebase by Task 944 (Task 944 R7 and R10, owner decision D12, 2026-11-04)

Written by the independent Task 944 governance approver, review 3 (Opus, D2), after the Task 944 review block and the 935 `scope`
entry (`scope-rebase-935.md`), never by an implementer. This session designed, implemented and reviewed none of the earlier 943 or
944 work and read the change below itself.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json`.
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`
  (kind `governance`, stage `reviewed`); its scope lists the test file below (Task 944 revision 3, R10).
- Change (`git diff d17d9d5a8 22c6871a3 -- scripts/workflow-gates/governance-contract.selftest.mjs`, 3 insertions and 1 deletion,
  read in this review): in the unnamed test `the governance report passes only on every mapped case and records current hashes and
  sensitivity`, the fixture saves the break spec `docs/sessions/evidence/gov/break.json`
  (`{ version: 1, case: 'GOV-T-HOOK-DENY', target: 'scripts/workflow-gates/example.mjs', find: 'true', replace: 'false' }`) before
  the sensitivity file, and the GOV-T-HOOK-DENY record gains `method: 'in-memory'`, `break` and `breakSha256`. The one removed
  line is the `saveJson` line of that record, which the added lines extend; the other record fields keep their values. No
  assertion, no test name and no `[<id>]` changed; the changed test is none of the 13 cases of this contract that map to the file.
- Why: Task 944 R2 refuses a non-legacy critical record without those fields; the fixture contract's task `tasks/gov_kickoff.md`
  is not legacy (Task 944 C73–C76).

## Changed case test files
- `scripts/workflow-gates/governance-contract.selftest.mjs`

## Case assertions
- GOV-935-VAL-ALLOW: unchanged -> unchanged
- GOV-935-VAL-DENY-PRODUCT-PATH: unchanged -> unchanged
- GOV-935-VAL-DENY-COVERAGE: unchanged -> unchanged
- GOV-935-VAL-RELEASE-DENY: unchanged -> unchanged
- GOV-935-VAL-RELEASE-ALLOW: unchanged -> unchanged
- GOV-935-REPORT-ERROR: unchanged -> unchanged
- GOV-935-VAL-REBASE-ALLOW: unchanged -> unchanged
- GOV-935-VAL-REBASE-DENY: unchanged -> unchanged
- GOV-935-HOOK-SELF-APPROVE-DENY: unchanged -> unchanged
- GOV-935-HOOK-INDEPENDENT-ALLOW: unchanged -> unchanged
- GOV-935-CI-DIFF-DENY: unchanged -> unchanged
- GOV-935-CI-DIFF-ALLOW: unchanged -> unchanged
- GOV-935-CI-REBASE-DENY: unchanged -> unchanged

## Verification

The approver keeps this entry only when `node scripts/workflow-gates/cli.mjs verify --contract <935 contract>` exits 0 after it
(`.claude/rules/review/04-contract-rebases.md`); the run is kept in `docs/sessions/evidence/task944/review/r3-verify-935.txt`. The
935 contract has no integration case, so no project identity is needed.
