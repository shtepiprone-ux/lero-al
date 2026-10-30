# Opus review: preflight and baseline

## R1. Establish the reviewed contract and candidate

Load startup rules first; read the complete task before auditing implementation or evidence:

1. Read `.claude/rules/shared/role-boundaries.md` and this file.
2. Read the routers `docs/agent-contract.md`, `docs/rule-index.md` and `docs/qa-profiles.md`.
3. Read the complete kickoff/ledger and amendments, explicit owner decisions and current task/backlog state. Identify
   the task's explicitly required first action and report it before auditing implementation. Enumerate the currently
   binding R/ACs and preservation boundaries. Inspect actual status/diff and establish whether the candidate is a
   working tree or exact commit; classify task-owned, unrelated and ambiguous paths before relying on attribution.
4. Select applicable contract fragments/rules from the complete assignment. Visible scope includes
   `docs/rules/agent-contract/p0-16-16c-ui-canonical.md` and `docs/rules/agent-contract/p0-16d-surface-census.md`.
   Read `shared/claim-evidence-contract.md`. Historical orchestrator documents are section-level references only.
   For visible work read `shared/canonical-component-reuse.md`; inspect ready components/Stories in R3/R5 before
   references or replacement proposals. Inherited design needs no new live audit; research only uncovered decisions.
5. On Windows, only native-Windows/CI terminal evidence supports the verdict. Retain platform, Node version, cwd,
   exact command, output, and exit code; otherwise mark evidence missing.
   Read [shared/security-testing.md](../shared/security-testing.md) and its selected companions for every task.
   Select frontend/server criteria now; inspect actual assertions, fixtures, mocks and collection in R3/R4.
   Verify any Q0 N/A against the complete changed-file scope. Source scans/fake databases do not prove real RLS.
6. For visible surfaces, read `shared/mobile-adaptation-contract.md`, then `shared/ui-token-contract.md` and
   `shared/enforcement-model.md`; verify the saved Mobile adaptation record against the inherited ready owner or,
   for a new decision, its primary sources; confirm the allowed Mantine mechanism/canonical owner and identify the
   16d census targets for R5. Mantine owns responsive mechanism/interaction/a11y; a parallel implementation is
   `NEEDS REVISION`. R5 independently verifies direct Story/manifest coverage for rendered in-scope components.

Required first substantive receipt:

`REVIEW PREFLIGHT COMPLETE - loaded: review-task; review/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

Treat every claim as unverified until inspected. State `FACT`, `INFERENCE`, `UNVERIFIED`, `CONTRADICTION`, or
`BLOCKED`; no executor confidence or green narrow gate can substitute for evidence.

**Exit:** the contract, candidate and ownership are known. An unread amendment, unknown candidate or ambiguous path
cannot support approval; identify the gap and continue only the independent parts of the audit.

## R2. Build the comparison and validation plan

1. Enumerate changed symbols and their callers, tests, Stories, fixtures and registry/contract consumers, including
   deletions. Use `shared/task-readiness.md` section 1; do not accept the executor's changed-file list as exhaustive.
2. Read `shared/orchestration-state.md` and record the candidate/input fingerprints before validation. Open raw
   baseline and final artifacts, their producing commands and input manifests/hashes. Confirm matching
   scope, runner, fixtures and environment before comparing results. A missing baseline cannot prove a regression
   is old; use a valid before-state or mark attribution unverified without guessing.
3. Match each baseline/final failure by test identity, assertion and cause. Record new failures separately. A total
   such as "249 failed before" does not excuse different failing tests. Confirm every claimed unchanged red test
   has comparable evidence; retain required final build output for the actual reviewed candidate.
4. Plan independent focused runs for changed behavior and dependencies, followed by required aggregate gates.
   Reuse unchanged, hash-bound artifacts when their inputs and scope still match; do not repeat long runs to hide
   an unexplained difference. Read the executor report only as an index and verify its material claims yourself.

**Exit:** every current AC has an identified source/assertion/proof target, and the baseline supports the comparisons
you will make. Missing runtime evidence stays explicit through the verdict.
