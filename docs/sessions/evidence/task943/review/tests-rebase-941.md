# Task 941 contract — case-test rebase by Task 943 (Task 943 R1 and R6, owner decision D12, 2026-11-03)

**DRAFT (owner D19, 2026-11-03): prepared by the withdrawn review 2 session and not applied.** The next fresh approver reruns the verification below, rewrites the first paragraph as its own, and writes the entry.

Written by the independent Task 943 governance approver session (D2, review 2, session 6f2564f3) after the Task 943 review
block and the 941 `scope` entry (`scope-rebase-941.md`), never by an implementer.

- Rebased contract: `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`.
- Approving contract (`by`): `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`
  (kind `governance`, stage `reviewed`); its scope lists the test file below (Task 943 revision 4, C125–C127).
- Change (`git diff b85f5a66b 04545b0ea -- scripts/workflow-gates/shell-write.selftest.mjs`, read in this review): a constant `K1`
  holding the two parseable `sed -i` commands of R1 and a helper `expectedTargets`; the two `assert.deepEqual` equality loops of
  GOV-941-HOOK-MALFORMED-ERROR compare with `expectedTargets` instead of `previousTargets`. Every command, every `includes(X)`
  assertion, every case ID and every test name is unchanged; all five cases keep their `[<id>]`.
- Why: Task 943 R2 reports the second file positional `writeFileSync` that `sed -i` really edits in those two commands
  (C123–C126); the old expectation asserted that real write away.

## Changed case test files
- `scripts/workflow-gates/shell-write.selftest.mjs`

## Case assertions
- GOV-941-HOOK-READONLY-ALLOW: unchanged -> unchanged
- GOV-941-HOOK-WRITE-DENY: unchanged -> unchanged
- GOV-941-HOOK-MALFORMED-ERROR: two parseable sed -i commands equal to the pre-change result -> the pre-change result followed by the in-place file writeFileSync, still with deepEqual and includes(X); every other command equal to the pre-change result -> unchanged
- GOV-941-HOOK-PRETOOL-DENY: unchanged -> unchanged
- GOV-941-CI-POLICY-DENY: unchanged -> unchanged

## Verification

The approver keeps this entry only when `node scripts/workflow-gates/cli.mjs verify --contract <941 contract>` exits 0 after it
(`.claude/rules/review/04-contract-rebases.md`); the run is recorded in `r2-closure-output.txt` and the review record. The 941
contract has no integration case, so no project identity is needed.
