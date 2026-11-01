# Task 935 — Rule, hook and gate changes get a security contract and an independent approval

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's instruction to file this as a separate task (D4), with the owner's answers on the implementer (D1), on hook-enforced
independence (D2) and on covering PR #11 (D3).

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every path in scope is a policy path that Sonnet may not edit (C5, C20). **Approver: Opus, in another fresh session that
wrote none of the scope files (D2).** Neither may be the session that designed this kickoff. Types (`docs/rule-index.md`): workflow
gates / governance tooling. Bundle: `.claude/rules/shared/workflow-gates.md` with its companions `workflow-contract.md`,
`workflow-evidence.md`, `workflow-ci.md`, `git-publication.md`; `security-testing.md`; `role-boundaries.md`;
`claim-evidence-contract.md`; `task-readiness.md`; `orchestration-state.md`.

## 2. Objective

A change to rules, hooks, settings, CI workflows or gate scripts gets the same discipline as product work: a saved task with a
machine-checked security contract, runnable regression cases, an evidence report, an approval only from an Opus session that did not
implement it, and a CI check that refuses such a change without a reviewed contract. Today none of this exists: the contract validator
knows only `product` and `docs` (C1), `product` refuses policy paths (C2), `docs` accepts only Markdown under Q0 (C3, C4), and CI asks
for a contract only for product files (C14, C15), so gate code reaches a PR with no contract and no approval route (C10). The new
route also formally approves the rule changes already on PR #11 (D3, C26).

## 3. Verified context

The validator accepts `kind` `product` or `docs` only (C1). A product contract may not contain a policy path (C2, C5); a docs contract
must be Q0 with Markdown only (C3, C4), and the security rule allows runtime N/A only for that Q0 case (C22) while product tasks need
frontend and server rows (C21). Release validation (Opus review, evidence, scope and report hashes) exists only for product (C6), and
the approval hook validates a report only for product (C11) after requiring a receipt (C10, C16) and the reviewed stage (C12). Case
IDs must start with `SEC-` (C8), mapped tests must be `.test`/`.spec` files (C7), and any critical case forces Q4 (C9). CI's contract
job runs the release diff (C23), which demands a contract only when product paths change (C14, C15). The approval hook already
collects the session's successful Write/Edit calls (C13) and Stop events carry `session_id` (C17). The gate self-test runner collects
every `*.selftest.mjs` (C18); today it passes 143 tests (C29). PR #11's tests carry no case IDs (C19, C30). Sonnet may not edit policy
(C20). PR #11 is one commit of 30 files (C26), open and blocked by the ruleset (C27, C28). The red unit suite is Task 931's (C25).
The next free task number was 935 (C24). PR #11's CI run failed (C36); its Task Security Contracts job failed on a reviewed
Task 923 contract whose review scope went stale (C31): that contract is selected in every diff because it closes resolved
release blockers (C32, C33), its scope digest includes its rule files and the workflow-gates companions (C34), and PR #11 added
the companion section that the base lacked (C35). Every later rule change would stale every such contract the same way; the
owner chose a rebase with an audit record by the independent governance approver (D6).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The contract validator accepts only the kinds `product` and `docs`. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:92-92`; observed: `check(['product', 'docs'].includes(value.kind), 'kind must be product or docs');` |
| C2 | FACT | A product contract fails when its scope contains a policy path. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:105-105`; observed: `Executor scope contains policy path` |
| C3 | FACT | A docs contract must be Q0 and every scope path must be a documentation file. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:115-115`; observed: `N/A is permitted only for Q0 documentation/rules/task records` |
| C4 | FACT | A documentation file is a Markdown file under docs, tasks, the rules tree or CLAUDE.md. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:69-69`; observed: `const isDoc = file => /\.md$/.test(file)` |
| C5 | FACT | Policy paths are defined by one shared predicate (the `.claude` tree, CI workflows, gate scripts, check scripts and rule documents). | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:64-64`; observed: `export const isPolicyPath = file =>` |
| C6 | FACT | Release-phase review validation runs only for product contracts. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:80-80`; observed: `if (phase === 'release' && value.kind === 'product') {` |
| C7 | FACT | A mapped case test file must be a `.test` or `.spec` file. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:143-143`; observed: `runnable testFile required` |
| C8 | FACT | Case IDs must start with `SEC-`. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:131-131`; observed: `Case ID must be SEC-<stable identifier>` |
| C9 | FACT | Any critical case forces the Q4 profile. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:153-153`; observed: `Critical security work requires Q4` |
| C10 | FACT | The Stop hook refuses an approval without a current task security contract receipt. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__security-hook.mjs.txt:173-173`; observed: `Completion/approval requires the current task security contract receipt` |
| C11 | FACT | The Stop hook validates a security report only for product contracts. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__security-hook.mjs.txt:178-178`; observed: `if (contract.kind === 'product') errors.push(...validateReport(` |
| C12 | FACT | An approval requires the contract's reviewed stage. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__security-hook.mjs.txt:179-179`; observed: `Independent approval requires reviewed stage` |
| C13 | FACT | The Stop hook already collects the session's successful Write/Edit calls from the transcript. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__security-hook.mjs.txt:160-160`; observed: `const written = successfulCalls(transcript)` |
| C14 | FACT | CI's diff check demands a task contract only when product paths change. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__cli.mjs.txt:56-56`; observed: `Product diff requires a changed task security contract` |
| C15 | FACT | CI's diff check maps only product paths to a contract scope. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__cli.mjs.txt:73-73`; observed: `outside every changed product contract scope` |
| C16 | FACT | The receipt command prints the receipt line the Stop hook reads. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__cli.mjs.txt:144-144`; observed: `SECURITY TASK PREFLIGHT COMPLETE - contract:` |
| C17 | FACT | Hook events carry a `session_id` that the role resolver reads. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__session-role.mjs.txt:64-64`; observed: `readState(roleFile(root, event.session_id))` |
| C18 | FACT | The gate self-test runner collects every `*.selftest.mjs` file of the gate folder. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__selftests.mjs.txt:8-8`; observed: `\.selftest\.mjs$/.test(file)` |
| C19 | FACT | PR #11's push-detection incident test has no case ID in its name. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__publication-safety.selftest.mjs.txt:63-63`; observed: `incident 2026-11-01: inline code, table cells and labelled prose are push handoffs too` |
| C20 | FACT | Policy and governance files are read-only to Sonnet. | source: `docs/sessions/evidence/task935/design/sources/claude__rules__shared__role-boundaries.md.txt:70-70`; observed: `are read-only to Sonnet` |
| C21 | FACT | Every product task needs frontend and server test rows. | source: `docs/sessions/evidence/task935/design/sources/claude__rules__shared__security-testing.md.txt:27-27`; observed: `For EVERY product task, both frontend and server rows require tests` |
| C22 | FACT | Runtime N/A is allowed only for a documentation-only Q0 task. | source: `docs/sessions/evidence/task935/design/sources/claude__rules__shared__security-testing.md.txt:34-34`; observed: `Only a genuine Q0 task containing documentation/rules/task-record changes alone may mark runtime rows N/A` |
| C23 | FACT | CI's Task Security Contracts job runs the release-phase diff check. | source: `docs/sessions/evidence/task935/design/sources/github__workflows__governance-pr.yml.txt:191-191`; observed: `node scripts/workflow-gates/cli.mjs diff --phase release` |
| C24 | FACT | Before this kickoff the backlog's next free task number was 935. | source: `docs/sessions/evidence/task935/design/sources/docs__backlog.md.txt:46-46`; observed: `NEXT FREE **935**` |
| C25 | FACT | Making the full unit suite green again is reserved Task 931. | source: `docs/sessions/evidence/task935/design/sources/docs__backlog-reserved.md.txt:18-18`; observed: `The full unit suite green again` |
| C26 | FACT | PR #11's commit changes 30 files. | source: `docs/sessions/evidence/task935/design/pr11-commit-stat.txt:34-34`; observed: `30 files changed, 1099 insertions(+), 184 deletions(-)` |
| C27 | FACT | PR #11 is open and its merge is blocked. | source: `docs/sessions/evidence/task935/design/pr11-state.txt:1-1`; observed: `"mergeStateStatus":"BLOCKED"` |
| C28 | FACT | GitHub enforces the required check Governance Required on main. | source: `docs/sessions/evidence/task935/design/ruleset-main.txt:1-1`; observed: `"context":"Governance Required"` |
| C29 | FACT | The gate self-test suite passed 143 tests on the design baseline. | source: `docs/sessions/evidence/task935/design/selftests-baseline.txt:864-864`; observed: `# pass 143` |
| C30 | FACT | PR #11's Git-write policy test has no case ID in its name. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__git-policy.selftest.mjs.txt:14-14`; observed: `Git policy rejects output-file writes hidden inside read-only subcommands` |
| C31 | FACT | PR #11's Task Security Contracts job fails because a reviewed Task 923 contract's review scope is stale. | source: `docs/sessions/evidence/task935/design/pr11-task-security-contracts-log.txt:2-2`; observed: `Independent review scope is stale` |
| C32 | FACT | The release-blocker registry ties resolved finding S59 to the reviewed Task 923 D8/D9 contract. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__release-blockers.json.txt:4-4`; observed: `"contract": "tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json"` |
| C33 | FACT | Every contract of a resolved release blocker is selected in every diff check. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__cli.mjs.txt:53-53`; observed: `if (finding.status === 'resolved' && finding.contract) retained.push(finding.contract);` |
| C34 | FACT | The review scope digest includes the rule files of the contract, expanded with the workflow-gates companions. | source: `docs/sessions/evidence/task935/design/sources/scripts__workflow-gates__contract.mjs.txt:60-60`; observed: `...workflowRuleInputs(root, contract.rules` |
| C35 | FACT | The companion expansion applies only when workflow-gates.md has a Required companions section, which the base commit lacked. | source: `docs/sessions/evidence/task935/design/workflow-gates-companions-base.txt:1-1`; observed: `count=0` |
| C36 | FACT | PR #11's CI run on its head commit concluded failure. | source: `docs/sessions/evidence/task935/design/pr11-ci-run-41284148492.txt:1-1`; observed: `conclusion=failure head=23206fb7fd4c30b6778a6169a811e1d61699c0ba` |
| D1 | OWNER DECISION | Governance tasks (rules, hooks, gate scripts) are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | The hook technically refuses an approval in the session that implemented the governance task. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D3 | OWNER DECISION | Task 935 also formally approves the rule changes already made on PR #11. | owner: 2026-11-01; decision: `Yes, cover PR #11 (Recommended)` |
| D4 | OWNER DECISION | The missing approval route for rule changes is filed as a separate task. | owner: 2026-11-01; decision: `create a separate task` |
| D5 | OWNER DECISION | main changes only through a pull request with green required checks. | owner: 2026-11-01; decision: `turn on the ruleset on main with Governance Required and Release Security Required required; switch to branch + PR so that CI on GitHub is the check before the merge` |
| D6 | OWNER DECISION | A reviewed contract made stale only by rule files is rebased by the independent governance approver with an audit record. | owner: 2026-11-01; decision: `Rebase with an audit record (Recommended)` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (implementer writes): `scripts/workflow-gates/contract.mjs`, `scripts/workflow-gates/cli.mjs`,
`scripts/workflow-gates/security-hook.mjs`, new `scripts/workflow-gates/governance-contract.selftest.mjs`, the case IDs and splits in
`scripts/workflow-gates/publication-safety.selftest.mjs`, `scripts/workflow-gates/workflow.selftest.mjs` and
`scripts/workflow-gates/git-policy.selftest.mjs`, `scripts/workflow-gates/publication.json` if its manifest must list the new test,
`.claude/rules/shared/security-testing.md`, `.claude/rules/shared/role-boundaries.md`, `.claude/rules/review/03-decision-closure.md`,
the stage/implementation fields of this task's `.security.json`, and evidence under `docs/sessions/evidence/task935/`. Written by the approver only (R10, D6): the `review.rulesRebase` block of
`tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json` and its rebase evidence. Covered by the
contract without edits (D3): the 30 files of PR #11 (C26), listed in the sidecar's `scope`.

Out of scope: product code under `src/`, the CI workflow file, the product contract rules (`product` keeps every current check, C6,
C9), the red product jobs of CI (Task 931, C25, and their own tasks), Vercel settings, and any change that lets Sonnet edit policy.

## 5. Current and required behaviour

Preserved: every check of `product` and `docs` contracts (C1–C4, C6–C9), the receipt line (C16), every existing gate test (C29).
Changed: a third kind `governance` is valid for policy-path work; its approval needs a reviewed contract, a passing governance report
and a session that wrote no scope file; CI refuses a changed executable policy file outside a governance contract.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C2; C3; C4; C5; C7; C8; C9; C20; D1] | **Kind `governance` in `validateContract`.** (a) `kind` is `product`, `docs` or `governance`. (b) A governance scope contains only paths for which `isPolicyPath` is true, Markdown files under `tasks/`, or files under `docs/sessions/evidence/`; at least one path is a policy path that is not Markdown; no path satisfies `isProductPath`. (c) `qaProfile` is Q1–Q4; a critical case does not force Q4 for governance (C9 stays for product). (d) `rules` contains `security-testing.md`, `workflow-gates.md`, `git-publication.md` and `role-boundaries.md` of `.claude/rules/shared/`. (e) Each case: `id` matches `GOV-<A-Z0-9 segments>`; concrete `invariant`, `actor`, `resource`, `input`, `response`; `layer` is `hook`, `ci` or `validator`; `outcome` is `allow`, `deny` or `error`; `boundary` is `unit` or `process`; boolean `critical`; non-empty `forbiddenEffects`; `testFile` matches `scripts/workflow-gates/<name>.selftest.mjs` (must exist except in the plan phase); `testName` contains `[<id>]`; no test maps to two cases. (f) Coverage: at least one `allow`, one `deny` and one `error` case, and at least one `hook` and one `ci` case. (g) `report` and `sensitivity` are paths under `docs/sessions/evidence/`. | P1 | AC1 |
| R2 [C6; C12; D1; D2] | **Release phase for governance.** `phase === 'release'` with `kind === 'governance'` requires stage `reviewed`; `implementation.role` `Opus`; `review.role` `Opus` and `review.decision` `APPROVED` or `APPROVED WITH NOTES`; `review.evidence`, `review.evidenceSha256`, `review.scopeSha256` (scope digest) and `review.reportSha256` current, exactly as for product (C6). Verify phase requires stage `implemented` or `reviewed` and `implementation.role` `Opus`. | P1 | AC2 |
| R3 [C7; C11; C16] | **Governance report.** New command `node scripts/workflow-gates/cli.mjs governance-report --contract <path>`: runs `node --test --test-reporter=tap` on the contract's distinct test files, maps each case to exactly one `ok`/`not ok` line by its exact `testName`, merges the per-case records of the contract's `sensitivity` file, and writes the report at `report` (version 1, status, `contractSha256` = plan digest, `scopeSha256` = scope digest, `cases` with id/status/testName, `errors`). It exits nonzero when any case is missing, duplicated, skipped or failed. New `validateGovernanceReport` in `contract.mjs`: status passed, no errors, current hashes, every case passed once, and every critical case carries sensitivity `baseline: passed`, `mutant: failed`, `failureKind: assertion`, `restored: passed` and a current artifact hash. `cli.mjs verify` and `cli.mjs receipt` handle governance contracts (verify runs the report validation). | P1 | AC3 |
| R4 [C10; C11; C12; C13; C17; D2] | **Approval hook.** For `APPROVED`/`APPROVED WITH NOTES` with a governance receipt, `security-hook.mjs` applies `validateContract` at release and `validateGovernanceReport`; and when the current session's transcript has a successful Write or Edit (C13), or a shell write the hook already detects, to any path of the contract's `scope`, it adds `GOVERNANCE INDEPENDENCE: this session wrote <path>; an implementing session cannot approve (owner decision 2026-11-01)`. `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a governance receipt applies verify and the report validation. | P1 | AC4 |
| R5 [C14; C15; C23] | **CI diff.** In `validateDiff`, every changed path (deletions included) that is a policy path and not Markdown needs a selected contract of kind `governance` whose `scope` contains it, else `<file>: outside every changed governance contract scope`; a selected governance contract is validated at the requested phase, so CI's release run (C23) requires the reviewed stage. Changes to Markdown policy files keep today's behaviour. | P1 | AC5 |
| R6 [C18; C19; C29; C30; D3] | **Tests.** New `governance-contract.selftest.mjs` holds the R1–R5 cases. PR #11's tests get their case IDs in the test names (C19, C30) and are split where one test held two cases, so each case maps to exactly one test; no assertion is removed or weakened. | P1 | AC6 |
| R7 [C20; C21; C22; D1; D2] | **Rules.** `security-testing.md` gains a section "Governance tasks": kind `governance`, the hook layer and the CI layer in place of the frontend and server rows, allow/deny/error coverage, sensitivity for critical cases, Q1–Q4. `role-boundaries.md` adds the governance implementer (Opus in a separate session, D1) and the approval independence (D2). `review/03-decision-closure.md` R7 names the governance approval path. Every phase file stays under 8 KiB. | P1 | AC7 |
| R8 [C26; C27; D3] | **PR #11 coverage.** The sidecar's `scope` lists all 30 files of PR #11 and the cases of the PR #11 behaviours (push detection, PR-only route, ruleset check, PR CI status, Git-write policy) are in the contract. | P1 | AC6 |
| R9 [C24; C25; C27; C28; D5] | **Git route.** Work on `task/935-governance-approval-route`, created from `task/rules-pr-policy` (which holds PR #11). Its PR into main replaces PR #11: the owner closes PR #11 unmerged when the new PR is open. The merge waits for green required checks (C28), which also depends on Task 931 (C25) and the other red product jobs; those are not this task's scope. | P1 | AC8 |
| R10 [C31; C32; C33; C34; C35; D2; D6] | **Rule-only rebase of a reviewed contract.** (a) A reviewed contract may carry `review.rulesRebase`: `{ "by": <governance contract path>, "evidence": <path under docs/sessions/evidence/>, "evidenceSha256", "originalScopeSha256", "rebasedScopeSha256" }`. (b) In `validateContract` at verify or release, a stale `review.scopeSha256` is accepted only when all hold: `rulesRebase.originalScopeSha256` equals `review.scopeSha256`; `rulesRebase.rebasedScopeSha256` equals the current scope digest; the evidence hash is current; the evidence file lists the changed files, each a `.claude/rules/` Markdown file returned by `workflowRuleInputs` for this contract; the `by` contract has kind `governance`, stage `reviewed`, and every listed file in its `scope`. Otherwise the error stays `Independent review scope is stale`. (c) In `validateDiff` (which has the diff base), a contract with `rulesRebase` passes only when its `by` contract is selected in the same diff and validates at the requested phase, and the scope digest recomputed with the base contents of the listed files (read-only `git show <base>:<file>`, absent when the file did not exist at the base) equals `originalScopeSha256`; so any change other than the listed rule files (scope, inputs, test files, runtime configs) keeps the contract stale. (d) The approving session of the governance task writes the rebase (D2: the implementing session cannot); the independence check of R4 does not count a write to a rebased contract's `review.rulesRebase` as a write to the governance scope. (e) For 935: the Task 923 D8/D9 contract (C32) is rebased by 935's approver, and its evidence records which rule files changed between d8a07a3c7 and the 935 head. | P1 | AC9 |

## Acceptance criteria

- **AC1 [R1].** GOV-935-VAL-ALLOW, GOV-935-VAL-DENY-PRODUCT-PATH and GOV-935-VAL-DENY-COVERAGE pass; the existing product and docs contract tests pass unchanged.
- **AC2 [R2].** GOV-935-VAL-RELEASE-DENY (planned or implemented stage, missing review, stale hash, `implementation.role` not Opus each refused) and GOV-935-VAL-RELEASE-ALLOW pass. Sensitivity: removing the governance release block fails GOV-935-VAL-RELEASE-DENY; restored passes.
- **AC3 [R3].** GOV-935-REPORT-ERROR passes: on a fixture contract with one failing mapped test the command exits nonzero and writes status failed; a missing case and a critical case without sensitivity are refused.
- **AC4 [R4; D2].** GOV-935-HOOK-SELF-APPROVE-DENY passes (a transcript with a successful Write to a scope file and `APPROVED` gets the GOVERNANCE INDEPENDENCE error) and GOV-935-HOOK-INDEPENDENT-ALLOW passes (no scope write, valid receipt, reviewed contract, passing report: no error). Sensitivity: removing the scope-write check fails GOV-935-HOOK-SELF-APPROVE-DENY; restored passes.
- **AC5 [R5].** GOV-935-CI-DIFF-DENY (a changed `.mjs` policy file with no governance contract) and GOV-935-CI-DIFF-ALLOW (inside a reviewed governance contract at release) pass. Sensitivity: removing the policy-file loop fails GOV-935-CI-DIFF-DENY; restored passes.
- **AC6 [R6; R8].** Every case of the sidecar passes in `cli.mjs governance-report`; `node scripts/workflow-gates/selftests.mjs` exits 0 with at least 143 passing tests and 0 skipped on native Windows (C29); the evidence lists the diff of each renamed test and shows no removed `assert` line.
- **AC7 [R7].** `node scripts/workflow-gates/check-workflow.mjs` exits 0; the three rule files contain the new text; `npm run check:kickoff-evidence` passes.
- **AC8 [R1; R2; R3; R4; R5; R6; R9].** `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0; `& .\.claude\hooks\phase-write-gate.ps1 -VerifyGate` passes; `node scripts/workflow-gates/publication.mjs --base HEAD` reports 0 dependency errors; `node scripts/workflow-gates/cli.mjs receipt --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json` prints the receipt; `node scripts/workflow-gates/cli.mjs verify --contract` on the same path exits 0 at stage implemented; `npm run build` exits 0 or fails only as on a base run taken before the first write; the owner commands of R9 are given only by the approving session.
- **AC9 [R10; D6].** GOV-935-VAL-REBASE-ALLOW (a reviewed fixture contract whose only change is a rule file inside a reviewed governance contract, with a valid `rulesRebase`: no error) and GOV-935-VAL-REBASE-DENY (the same rebase with a changed scope or test file, a non-governance or unreviewed `by`, a rule file outside the `by` scope, or a stale evidence hash: each refused with `Independent review scope is stale` or a named rebase error) pass. Sensitivity: accepting any `rulesRebase` without the changed-file check fails GOV-935-VAL-REBASE-DENY; restored passes. After the approver's rebase, `node scripts/workflow-gates/cli.mjs diff --phase release --base d8a07a3c7` reports no error for the Task 923 D8/D9 contract.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The publication and approval controls: `security-hook.mjs` Stop approval (C10–C13), `push-safety.mjs` and `block-mutating-git.ps1` from PR #11, `validateContract`/`validateDiff` (C1, C14, C15) and CI's contract job (C23). Owners: Opus (D1). |
| Frontend security | Governance has no browser consumer. Its agent-facing layer is the hook decision: cases with `layer: hook` (GOV-935-HOOK-*), allow, deny and error, on the real hook functions with transcript fixtures. This row replaces the frontend row under R7. |
| Server security | The enforcement layer is CI and the validator: `layer: ci` and `layer: validator` cases (GOV-935-CI-*, GOV-935-VAL-*, GOV-935-REPORT-ERROR) on the real `validateContract`, `validateDiff`, `ciErrors` and `validateRuleset`. This row replaces the server row under R7. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path changes; GitHub is reached only through PR #11's existing read-only calls, whose decision functions are tested with injected data. |
| Cases | The 22 GOV-935 cases of the sidecar (including GOV-935-VAL-REBASE-ALLOW, GOV-935-VAL-REBASE-DENY and GOV-935-CI-REBASE-DENY for R10), each with actor, resource, input, response and forbidden effects. |
| Fixtures and environment | Temporary directories from `mkdtempSync`, synthetic transcripts and contracts; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical cases: GOV-935-VAL-RELEASE-DENY, GOV-935-HOOK-SELF-APPROVE-DENY, GOV-935-CI-DIFF-DENY, GOV-935-HOOK-PUSH-INLINE-DENY (restore the old start-of-line regex) and GOV-935-HOOK-PUSH-MAIN-DENY (remove the main refusal), GOV-935-VAL-REBASE-DENY (accept any `rulesRebase`): baseline pass, isolated break fails with an assertion, restored pass, artifact under `docs/sessions/evidence/task935/sensitivity/`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract <sidecar>`, then `cli.mjs verify`; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): check out `task/rules-pr-policy`, create
   `task/935-governance-approval-route` from it. Prerequisite: PR #11 at `23206fb7f` (C27).
2. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save base runs of `selftests.mjs` and `npm run build`
   under `docs/sessions/evidence/task935/impl/` before the first write.
3. Implement R1–R5 with their tests (R6), then R7. Record `implementation: { "role": "Opus" }`, stage `implemented`, `report` and
   `sensitivity` paths in the sidecar; implement R10 (the approver writes the 923 rebase, not you); run the six sensitivity breaks and keep their artifacts.
4. Run `cli.mjs governance-report` and every AC command; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the completion
   report; give the owner the explicit-path commit command for the branch. No push.
5. **Opus approver, another fresh session** (D2): the R1–R7 review; on approval, write the `review` block and stage `reviewed`, write
   the Task 923 D8/D9 `rulesRebase` with its evidence (R10, D6), rerun the report and `cli.mjs diff --phase release`, and only then
   hand off the explicit-path commit of those files, the branch push and PR creation under `shared/git-publication.md`.
6. **Owner**: close PR #11 unmerged once the new PR is open (R9). Merge only after green PR checks.

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-935 case with its result; the six sensitivity diffs with the failed
assertion; base and final self-test totals; the PR #11 coverage list; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots under `docs/sessions/evidence/task935/design/`. |
| `security-testing.md` | Security test contract present; the governance mapping of its rows is itself R7. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit, PR replaces #11, merge only after green checks (D5). |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

## 9. Bootstrap note

The sidecar uses kind `governance`, which R1 introduces; until R1 lands, `cli.mjs receipt` on it fails with `kind must be product or
docs` (C1). This is the only order in which the task can exist: the implementer writes policy as Opus without a receipt, the receipt
first succeeds after R1, and approval (step 5) uses the implemented validator in a session that did not write it. No approval depends
on itself.

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36; owner decisions: D1, D2, D3, D4, D5, D6; blocked claims: NONE.
