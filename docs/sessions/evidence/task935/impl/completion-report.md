# Task 935 — completion report (Opus implementer session, 2026-11-01)

Implementer: Opus in a fresh implementation session (D1). This session did not design the kickoff and must not
approve it (D2): the Stop hook now refuses `APPROVED` from it because it wrote scope files.
Branch: `task/935-governance-approval-route` at `e2f340abd` (kickoff commit on top of PR #11 `23206fb7f`).
Platform: native Windows, PowerShell 5.1, Node v22.22.3.

## Base runs (before the first write)

- `node scripts/workflow-gates/selftests.mjs`: 143 tests, 143 pass, 0 fail, 0 skipped, exit 0 — `base-selftests.txt`.
- `npm run build`: exit 0 — `base-build.txt`.

## Requirements

| R | Changed files | Evidence | Status |
|---|---|---|---|
| R1 kind `governance` | `scripts/workflow-gates/contract.mjs` (`isGovernanceScopePath`, `REQUIRED_GOVERNANCE_RULES`, `governanceCaseErrors`) | GOV-935-VAL-ALLOW, -VAL-DENY-PRODUCT-PATH, -VAL-DENY-COVERAGE; extra structural test | implemented |
| R2 release/verify for governance | `contract.mjs` `validateContract` | GOV-935-VAL-RELEASE-DENY (critical), -VAL-RELEASE-ALLOW | implemented |
| R3 governance report | `cli.mjs` `governance-report`, `governanceReport`, `parseTap`; `contract.mjs` `validateGovernanceReport`; `verify`/`receipt` handle governance | GOV-935-REPORT-ERROR; `governance-report.json` | implemented |
| R4 approval hook | `scripts/workflow-gates/security-hook.mjs` (`governanceIndependenceErrors`, shared `shellWriteTargets`) | GOV-935-HOOK-SELF-APPROVE-DENY (critical, incl. real hook process exit 2), -HOOK-INDEPENDENT-ALLOW | implemented |
| R5 CI diff | `cli.mjs` `validateDiff` policy loop; governance report validated in `diff` | GOV-935-CI-DIFF-DENY (critical), -CI-DIFF-ALLOW | implemented |
| R6 tests | new `governance-contract.selftest.mjs`; case IDs and splits in `publication-safety.selftest.mjs`, `git-policy.selftest.mjs`, `workflow.selftest.mjs`; `publication.json` lists the new test | `renamed-tests.diff`, `assert-retention.txt` (0 removed assertions) | implemented |
| R7 rules | `.claude/rules/shared/security-testing.md` (section "Governance tasks"), `.claude/rules/shared/role-boundaries.md` (implementer row, independence bullet), `.claude/rules/review/03-decision-closure.md` (governance approval path) | `final-checks.txt` | implemented |
| R8 PR #11 coverage | sidecar `scope` (unchanged; all 30 files of `23206fb7f` present, checked with `comm`) | cases GOV-935-HOOK-PUSH-*, -HOOK-RULESET-ERROR, -HOOK-MERGE-ADMIN-DENY, -HOOK-GIT-WRITE-DENY, -CI-PR-STATUS-*, -CI-RULESET-DENY | implemented |
| R9 Git route | none (owner) | branch already created from PR #11 | owner/approver |
| R10 rule-only rebase | `contract.mjs` (`rebaseFiles`, `rulesRebaseErrors`, `scopeHashErrors`, digest overrides), `cli.mjs` (`gitBaseReader`, `diffRebaseErrors`), hook exemption | GOV-935-VAL-REBASE-ALLOW, -VAL-REBASE-DENY (critical), -CI-REBASE-DENY; `rebase-923-feasibility.txt` | implemented; the 923 rebase itself is the approver's (D2, D6) |

## GOV-935 cases (`cli.mjs governance-report`)

All 22 cases `passed`, report status `passed`: GOV-935-VAL-ALLOW, -VAL-DENY-PRODUCT-PATH, -VAL-DENY-COVERAGE,
-VAL-RELEASE-DENY, -VAL-RELEASE-ALLOW, -REPORT-ERROR, -VAL-REBASE-ALLOW, -VAL-REBASE-DENY, -HOOK-SELF-APPROVE-DENY,
-HOOK-INDEPENDENT-ALLOW, -HOOK-PUSH-INLINE-DENY, -HOOK-PUSH-MAIN-DENY, -HOOK-PUSH-BRANCH-ALLOW, -HOOK-RULESET-ERROR,
-HOOK-MERGE-ADMIN-DENY, -HOOK-GIT-WRITE-DENY, -CI-DIFF-DENY, -CI-DIFF-ALLOW, -CI-REBASE-DENY, -CI-PR-STATUS-ALLOW,
-CI-PR-STATUS-DENY, -CI-RULESET-DENY. Record: `docs/sessions/evidence/task935/impl/governance-report.json`.

## Sensitivity (six critical cases; `../sensitivity/`, script `run-sensitivity.mjs`)

| Case | Isolated break | Failed assertion in the mutant |
|---|---|---|
| GOV-935-VAL-RELEASE-DENY | release block limited to `product` again | `/independently reviewed stage/` not matched |
| GOV-935-HOOK-SELF-APPROVE-DENY | independence call removed from the Stop branch | `/GOVERNANCE INDEPENDENCE: this session wrote .../` not matched |
| GOV-935-CI-DIFF-DENY | executable policy-file loop removed from `validateDiff` | `outside every changed governance contract scope` not matched |
| GOV-935-HOOK-PUSH-INLINE-DENY | `GIT_PUSH` restricted to start of line (`^\s*`) | `pushCommands` deepEqual on the inline/table/label replies |
| GOV-935-HOOK-PUSH-MAIN-DENY | main-only-via-PR refusal removed | `/Direct push to main is prohibited/` not matched for `git push origin main` |
| GOV-935-VAL-REBASE-DENY | any `rulesRebase` accepted without its checks | `/Independent review scope is stale/` not matched ("changed scope file") |

Each: baseline passed, mutant failed with `ERR_ASSERTION`, file restored byte-identically, restored run passed.

## Final runs

- `selftests.mjs`: 164 tests, 164 pass, 0 fail, 0 skipped (>= 143) — `final-selftests.txt`.
- eslint on `scripts/workflow-gates`: exit 0; `check-workflow.mjs`: exit 0; `npm run check:kickoff-evidence`: PASS;
  `publication.mjs --base HEAD`: 81 files, 0 dependency errors; `phase-write-gate.ps1 -VerifyGate`: PASSED — `final-checks.txt`.
- `cli.mjs receipt` on the sidecar printed the receipt; `cli.mjs verify` exit 0 at stage `implemented`.
- `cli.mjs diff --phase plan --base d8a07a3c7841022207fd5331f53e5a80b4d7c7e2 --working-tree`: exit 0 — `diff-plan.txt`.
- `npm run build`: exit 0 — `final-build.txt` (base run also exit 0).

## Implementation decisions the approver must review

1. **R1(b) scope set.** The saved sidecar scope (R8, R10) contains `CLAUDE.md`, `docs/orchestrator-*.md` and the Task 923
   sidecar, which the literal R1(b) list (policy paths, task Markdown, evidence) would refuse. A governance scope
   therefore also accepts documentation Markdown (`docs/`, `tasks/`, `.claude/rules/`, `CLAUDE.md`) and
   `tasks/**/*.security.json`; any `isProductPath` path is still refused and one non-Markdown policy path is required.
2. **Report outside its own digest.** A governance scope digest omits the contract's own `report` path; the report
   records that digest, so including it has no fixed point. Product digests are unchanged.
3. **Product report under a rebase.** `validateReport` accepts `report.scopeSha256` equal to a valid rebase's
   `originalScopeSha256`; the Task 923 report records the original digest (`a036d228…`), so CI's diff would otherwise
   still refuse the rebased contract after its review passes.
4. **Retained rebase in later diffs (R10c).** When the diff base already carries the identical `rulesRebase`, the
   contract passes only if its digest inputs did not change in that diff; the by-contract need not be in the diff.
   A new or changed rebase needs the by-contract in the same diff, validating at the requested phase, and a base
   digest equal to `originalScopeSha256` (or the previous retained rebase's digest under the same review). Without this,
   every later PR would refuse the Task 923 contract because 935's sidecar is no longer in the diff.
5. **R4 exemption.** The approver's writes to a contract whose `review.rulesRebase.by` is the receipt contract, and to
   that rebase's evidence file, are not counted as governance scope writes.
6. **R5 planned contract.** A planned governance contract that covers no changed executable policy file validates at
   `plan`, mirroring the product rule; one that covers a change validates at the requested phase.
7. **AC9 command.** `changedFiles` requires a full 40-hex base: use
   `--base d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`. A local `--phase release` diff also runs the Task 923 mapped
   integration tests, which need the `SECURITY_TEST_*` development target variables (CI secrets); without them it
   reports the integration-target error, not a review-scope error.
8. **Platform.** `GOV-935-HOOK-GIT-WRITE-DENY` is `skip` off Windows (`git-policy.selftest.mjs`); the governance report
   must be produced on native Windows. CI validates the report and does not rerun it.
9. **Rule sizes.** `03-decision-closure.md` is 7397 bytes (< 8 KiB). The shared contracts `security-testing.md`
   (8576) and `role-boundaries.md` (8562) are not phase files and are outside `validateRuleSizes`.

## Rebase feasibility (read-only, for the approver)

`rebase-923-feasibility.txt`: the Task 923 rule inputs changed since `d8a07a3c7` are `security-testing.md`,
`workflow-gates.md`, `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md` and `git-publication.md`, all in
the 935 scope; recomputing the 923 scope digest with their base contents gives `a036d22822ad…2c74`, equal to its
`review.scopeSha256` (MATCH).

## Approver order (step 5)

Review R1–R7; write `docs/sessions/evidence/task935/review/rules-rebase-923.md` with a `## Changed rule files`
section listing the six files; set stage `reviewed` and the `review` block on the 935 sidecar; write the 923
`review.rulesRebase` (by, evidence, evidenceSha256, originalScopeSha256, rebasedScopeSha256); rerun
`cli.mjs governance-report`; then compute the 935 review hashes and run the release diff before the handoff.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
