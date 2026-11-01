# Task 940 — A reviewed contract survives a later reviewed change to its scope files (audited scope rebase)

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's decision to resolve the frozen Task 923 contract with an audited rebase (D9), with every CI fix of PR #12 published on
that PR (D7) as one task per red check (D8).

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every executor path in scope is a policy path (C29). **Approver: Opus, in another fresh session that wrote none of the scope
files (D2).** Neither may be the session that designed this kickoff. Types (`docs/rule-index.md`): workflow gates / governance
tooling. Bundle: `.claude/rules/shared/workflow-gates.md` with `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md`,
`git-publication.md`; `security-testing.md`; `role-boundaries.md`; `claim-evidence-contract.md`; `task-readiness.md`;
`orchestration-state.md`; `.claude/rules/review/03-decision-closure.md`.

## 2. Objective

A reviewed contract stays valid when a later, independently reviewed task legitimately changes files of its scope, through an
audited rebase entry, while any unlisted or unapproved change still stales it. Today the only rebase is rule-only (C4–C7, D6), so a
fix to three outdated unit tests of Task 931 (C15–C17, C19) makes the Task 923 D8/D9 review stale in every PR (C8–C10, C2), and
this task's own gate edits stale the reviewed Task 935 contract inside PR #12 (C22–C24).

## 3. Verified context

The scope digest of a contract covers its scope, inputs, rule inputs, case test files and runtime files (C1). Release validation and
the security report both compare their recorded digest through `scopeHashErrors` (C2, C3); without `review.rulesRebase` a mismatch is
an error (C4). A rules rebase accepts only rule inputs of the contract (C5), approved by a reviewed governance contract (C6), listed
under `## Changed rule files` (C7). Every diff selects the contracts of resolved release blockers (C8, C9), one of which is the Task
923 D8/D9 contract (C10), and runs its mapped tests (C11). The diff check keeps a retained rebase only while nothing else changed
(C12, C13) and requires the approving contract in the same diff (C14). The 923 scope lists three of Task 931's failing test files
(C15, C16, C17); it already carries the 935 rules rebase (C18); editing any of the three files changes its digest (C19). The Stop
hook exempts writes to any contract whose `rulesRebase.by` names the receipt contract, without validating it (C20, C21). The
reviewed 935 contract scopes the gate code this task changes (C22), and editing that code or the review rule stales it (C23, C24).
The approver procedure for rebases is in the review rule (C25), whose phase files are limited to 8 KiB (C26). Baseline: 164 gate
self-tests pass (C27); on the PR #12 head (C30) the Task Security Contracts job passed (C28).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The scope digest covers scope, inputs, rule inputs, every case test file and runtime files. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:68-68`; observed: `let files = [...new Set([...contract.scope, ...(contract.inputs` |
| C2 | FACT | Release validation compares the review scope digest through scopeHashErrors. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:153-153`; observed: `scopeHashErrors(root, value, review?.scopeSha256, 'Independent review scope is stale')` |
| C3 | FACT | The security report scope digest is compared through the same function. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:250-250`; observed: `Security report scope hash is stale` |
| C4 | FACT | Without a rules rebase a stale scope digest is an error. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:127-127`; observed: `if (!contract.review?.rulesRebase) return [stale];` |
| C5 | FACT | A rules rebase accepts only rule inputs of the rebased contract. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:115-115`; observed: `is not a rule input of this contract` |
| C6 | FACT | A rules rebase must be approved by a reviewed governance contract. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:118-118`; observed: `is not a reviewed governance contract` |
| C7 | FACT | Rebase evidence lists files under a Changed rule files heading. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:95-95`; observed: `Changed rule files` |
| C8 | FACT | The diff check retains the contracts of resolved release-blocker findings. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:93-93`; observed: `if (finding.status === 'resolved' && finding.contract) retained.push(finding.contract);` |
| C9 | FACT | Retained contracts are selected in every diff. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:95-95`; observed: `...retained])]` |
| C10 | FACT | The release-blocker registry names the Task 923 D8/D9 contract. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__release-blockers.json.txt:4-4`; observed: `"contract": "tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json"` |
| C11 | FACT | The diff command runs the mapped tests of each selected non-planned product contract. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:265-265`; observed: `errors.push(...runMappedTests(ROOT, contract));` |
| C12 | FACT | A rebase unchanged since the diff base is handled as retained. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:71-71`; observed: `if (prior && canonicalJson(prior) === canonicalJson(rebase)) {` |
| C13 | FACT | The diff check refuses changes other than the listed rule files. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:77-77`; observed: `files other than the listed rule files changed since the review` |
| C14 | FACT | The approving contract of a new rebase must be part of the same diff. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__cli.mjs.txt:78-78`; observed: `is not part of this diff` |
| C15 | FACT | The Task 923 D8/D9 scope lists the permissions unit test. | source: `docs/sessions/evidence/task940/design/sources/tasks__Sprints__Sprint_78_Task_923_security_record_D8_D9.security.json.txt:136-136`; observed: `"src/lib/auth/__tests__/permissions.test.ts",` |
| C16 | FACT | The Task 923 D8/D9 scope lists the moderator-permissions smoke test. | source: `docs/sessions/evidence/task940/design/sources/tasks__Sprints__Sprint_78_Task_923_security_record_D8_D9.security.json.txt:140-140`; observed: `"src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts",` |
| C17 | FACT | The Task 923 D8/D9 scope lists the agent statistics access test. | source: `docs/sessions/evidence/task940/design/sources/tasks__Sprints__Sprint_78_Task_923_security_record_D8_D9.security.json.txt:143-143`; observed: `"src/modules/cabinet/statistics/__tests__/access.test.ts",` |
| C18 | FACT | The Task 923 D8/D9 review already carries the 935 rules rebase anchored at its reviewed digest. | source: `docs/sessions/evidence/task940/design/sources/tasks__Sprints__Sprint_78_Task_923_security_record_D8_D9.security.json.txt:4778-4778`; observed: `"originalScopeSha256": "a036d22822ad264ff5717aa08f85b5e49d4d95ca36a9bb66810152f43da32c74",` |
| C19 | FACT | Editing the permissions unit test changes the Task 923 D8/D9 scope digest (executed probe; the other two files likewise, lines 5-6). | source: `docs/sessions/evidence/task940/design/p01-923-scope-probe.txt:4-6`; observed: `digest after editing permissions.test.ts` |
| C20 | FACT | The Stop hook takes the exemption from any contract's rulesRebase. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__security-hook.mjs.txt:129-129`; observed: `const rebase = other?.review?.rulesRebase;` |
| C21 | FACT | The 935 review recorded that this exemption is not validated (note N1). | source: `docs/sessions/evidence/task935/review/review-935.md:79-79`; observed: `N1 — exemption not validated.` |
| C22 | FACT | The reviewed Task 935 contract scopes the contract validator. | source: `docs/sessions/evidence/task940/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:40-40`; observed: `"scripts/workflow-gates/contract.mjs",` |
| C23 | FACT | Editing the contract validator changes the Task 935 scope digest (executed probe). | source: `docs/sessions/evidence/task940/design/p02-935-scope-probe.txt:3-3`; observed: `scripts/workflow-gates/contract.mjs CHANGED` |
| C24 | FACT | Editing the review decision rule changes the Task 935 scope digest (executed probe). | source: `docs/sessions/evidence/task940/design/p02-935-scope-probe.txt:6-6`; observed: `.claude/rules/review/03-decision-closure.md CHANGED` |
| C25 | FACT | The review rule tells the governance approver to write the rules rebase. | source: `docs/sessions/evidence/task940/design/sources/.claude__rules__review__03-decision-closure.md.txt:64-64`; observed: `review.rulesRebase` |
| C26 | FACT | Review phase files are refused above 8 KiB. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__check-workflow.mjs.txt:104-104`; observed: `Operational rule exceeds 8 KiB` |
| C27 | FACT | The gate self-tests pass 164 tests before this task. | source: `docs/sessions/evidence/task940/design/p03-selftests-base.txt:6-6`; observed: `# pass 164` |
| C28 | FACT | On the PR #12 head the Task Security Contracts job passed. | source: `docs/sessions/evidence/task940/design/p04-pr12-ci-run.txt:5-5`; observed: `Task Security Contracts = success` |
| C29 | FACT | Gate scripts and the rules tree are policy paths. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__contract.mjs.txt:74-74`; observed: `export const isPolicyPath = file =>` |
| C30 | FACT | The design was made on PR #12 head c2f918a59. | source: `docs/sessions/evidence/task940/design/p00-head.txt:1-1`; observed: `c2f918a590cab7354e1c2f01379b2a7c93726060` |
| C31 | FACT | The gate publication manifest lists each self-test file by path. | source: `docs/sessions/evidence/task940/design/sources/scripts__workflow-gates__publication.json.txt:58-58`; observed: `"scripts/workflow-gates/governance-contract.selftest.mjs",` |
| C32 | FACT | The reviewed Task 935 contract scopes the publication manifest. | source: `docs/sessions/evidence/task940/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:47-47`; observed: `"scripts/workflow-gates/publication.json",` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D5 | OWNER DECISION | main changes only through a pull request with green required checks. | owner: 2026-11-01; decision: `switch to branch + PR so that CI on GitHub is the check before the merge` |
| D6 | OWNER DECISION | A contract stale only through rule files is rebased by the governance approver with an audit record. | owner: 2026-11-01; decision: `Rebase with an audit record (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12, merged once all checks are green. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D8 | OWNER DECISION | Each red CI check gets its own task. | owner: 2026-11-01; decision: `A separate task for each check (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/workflow-gates/contract.mjs`, `scripts/workflow-gates/cli.mjs`,
`scripts/workflow-gates/security-hook.mjs`, new `scripts/workflow-gates/scope-rebase.selftest.mjs`, its entry in
`scripts/workflow-gates/publication.json` (C31; that file is in the 935 scope, C32, so R6 lists it when changed),
`.claude/rules/review/03-decision-closure.md`, the stage/implementation fields of this task's `.security.json`, and the evidence files
`docs/sessions/evidence/task940/impl/completion-report.md`, `docs/sessions/evidence/task940/impl/governance-report.json`,
`docs/sessions/evidence/task940/impl/base-runs.txt`, `docs/sessions/evidence/task940/sensitivity/sensitivity.json` and the three
artifacts `docs/sessions/evidence/task940/sensitivity/GOV-940-VAL-SCOPE-DENY.txt`, `…/GOV-940-CI-SCOPE-DENY.txt`,
`…/GOV-940-HOOK-FORGED-DENY.txt`. Written by the approver only (R6): the `review.rebases` entry of the Task 935 contract
`tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json` and its evidence
`docs/sessions/evidence/task940/review/scope-rebase-935.md`; these are not executable policy files and need no contract scope.

Out of scope: product code; the CI workflow file; `scripts/workflow-gates/governance-contract.selftest.mjs` and every other existing
self-test file (each GOV-935 test must pass unchanged, because a case test file of 935 cannot be rebased under D9); runtime files
(`package.json`, lock file, configs) in a rebase, which D9 does not cover: a future change to them still stales a pinned contract and
needs its own owner decision; the Task 931 test fixes and their 923 rebase (Task 931); the other red CI jobs (Tasks 937–939).

## 5. Current and required behaviour

Preserved: every current rules-rebase rule (C4–C7, C12–C14) and its GOV-935 tests; every product, docs and governance check; the
retained selection of release-blocker contracts (C8, C9) and their mapped-test run (C11). Changed: a reviewed contract may carry an
ordered list of rebase entries of kind `rules` or `scope`; a `scope` entry accepts files of its scope that a later reviewed contract
owns and that are not tests of its cases; the hook's rebase exemption is validated.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C2; C3; C4; C18; D9] | **Rebase chain.** (a) `review.rebases` is an optional array of entries `{ "kind": "rules" or "scope", "by", "evidence", "evidenceSha256", "originalScopeSha256", "rebasedScopeSha256" }`. (b) The chain is the legacy `review.rulesRebase`, when present, as a first entry of kind `rules`, followed by `review.rebases` in order; the legacy field stays valid and is never rewritten. (c) The chain is valid only when entry 1 `originalScopeSha256` equals `review.scopeSha256`, each next `originalScopeSha256` equals the previous `rebasedScopeSha256`, the last `rebasedScopeSha256` equals the current scope digest, and every entry passes R2 or R3 for its kind. (d) `scopeHashErrors` accepts a recorded digest that differs from the current digest only when the chain is valid and the recorded digest equals `review.scopeSha256`; otherwise it returns the stale message followed by the named chain errors (prefixed `rebases:`, or `rulesRebase:` for the legacy entry), so the review check (C2) and the report check (C3) behave alike. (e) A malformed `review.rebases` (not an array, an entry not an object, an unknown `kind`, a missing field) is a named error and the contract stays stale. | P1 | AC1, AC3, AC4 |
| R2 [C5; C6; C7; D6] | **Entry of kind `rules`.** Exactly today's conditions (C5–C7): evidence under `docs/sessions/evidence/` with a current hash, files listed under `## Changed rule files`, each a rule input of the contract, `by` a reviewed governance contract whose scope lists every file. | P1 | AC1 |
| R3 [C15; C16; C17; C19; C22; D9] | **Entry of kind `scope`.** (a) Evidence under `docs/sessions/evidence/` with a current hash lists one or more files under a `## Changed scope files` heading. (b) Every listed file is in the rebased contract's `scope` array and is not the `testFile` of any of its cases. (c) `by` names a different contract (its `task` differs) of kind `product` or `governance`, stage `reviewed`, whose `scope` lists every listed file. (d) Each failure has its own message naming the file or contract. | P1 | AC1, AC2 |
| R4 [C8; C9; C11; C12; C13; C14] | **Diff check of the chain.** Generalise `diffRebaseErrors` in `cli.mjs`: (a) read the contract at the diff base; the base chain must equal (canonical JSON) a prefix of the current chain up to the first differing entry; entries from that point are new; a removed entry is an error. (b) With new entries and a base version: the scope digest recomputed with the base contents of every file listed by the new entries (read-only `git show <base>:<file>`, absent when missing) must equal the base chain's last `rebasedScopeSha256`, or the base `review.scopeSha256` when the base chain is empty; otherwise `Independent review scope is stale` and `rebases: files other than the listed files changed since the review`. (c) Each new entry's `by` contract is selected in the same diff and validates at the requested phase, else the existing not-part-of-this-diff or does-not-validate message. (d) Without new entries nothing is added (retained chain; C12). (e) When the rebased contract does not exist at the base (reviewed inside the same PR), (b) is skipped and (c) applies; this limitation is recorded in the completion report. (f) The existing rules-rebase messages and GOV-935 tests stay unchanged. | P1 | AC5 |
| R5 [C20; C21; D2] | **Hook exemption validated (N1).** `governanceIndependenceErrors` exempts a written contract and its evidence path only for a chain entry of kind `rules` whose `by` is the receipt contract, whose `evidence` satisfies `isEvidencePath`, and whose entry validation (R2) returns no error; an entry of kind `scope` never exempts. | P1 | AC6 |
| R6 [C22; C23; C24; C32; D7; D9] | **Rebase of the Task 935 contract (approver).** After approving 940 (stage `reviewed`), the approver appends a `scope` entry by 940's contract to the 935 contract's `review.rebases`, with evidence `docs/sessions/evidence/task940/review/scope-rebase-935.md` listing the 935 scope files that 940 changed, and recomputes nothing else in that contract. | P1 | AC7 |
| R7 [C25; C26; D9] | **Rule text.** `.claude/rules/review/03-decision-closure.md` adds, next to the governance paragraph: when an approved task changed files of another reviewed contract's scope, the approver of that task (never its implementer) writes a `scope` entry in that contract's `review.rebases` after its own review block, with `## Changed scope files` evidence, then runs `cli.mjs diff --phase release`; tests of that contract's cases and runtime files are never rebased. The file stays under 8 KiB (C26). | P1 | AC8 |

## Acceptance criteria

- **AC1 [R1; R2; R3].** GOV-940-VAL-SCOPE-ALLOW passes: a reviewed fixture product contract whose only change is a non-test scope file, with a `scope` entry by a reviewed contract scoping that file, validates at release with no error, and the same contract without the entry reports `Independent review scope is stale`. GOV-940-VAL-CHAIN-ALLOW passes: a legacy `rulesRebase` followed by a `scope` entry validates, and `validateReport` accepts a report whose `scopeSha256` equals `review.scopeSha256`.
- **AC2 [R3].** GOV-940-VAL-SCOPE-DENY passes, each variant refused with the stale message and a named error: listed file is a case test file; listed file outside the rebased scope; `by` not reviewed; `by` not scoping the file; `by` is the rebased contract itself; stale evidence hash; evidence outside `docs/sessions/evidence/`; missing heading; broken chain digest. Sensitivity: dropping the case-test-file condition fails GOV-940-VAL-SCOPE-DENY with an assertion; restored passes.
- **AC3 [R1].** GOV-940-VAL-MALFORMED-ERROR passes: each malformed shape of R1 (e) yields a named error.
- **AC4 [R1].** The four GOV-935 rebase tests (`GOV-935-VAL-REBASE-ALLOW`, `GOV-935-VAL-REBASE-DENY`, `GOV-935-CI-REBASE-DENY` and the retained-rebase test of `governance-contract.selftest.mjs`) pass with that file unchanged (`git diff --exit-code` on it).
- **AC5 [R4].** GOV-940-CI-SCOPE-ALLOW passes (a diff that adds a legacy rules entry and a scope entry to a contract present at the base, both `by` contracts in the diff and valid, has no error) and GOV-940-CI-SCOPE-DENY passes (a re-signed scope entry hiding an unlisted change of a case test file, of `package.json` and of another scope file; a `by` outside the diff; an edited or removed earlier entry: each refused). Sensitivity: skipping the base-digest comparison fails GOV-940-CI-SCOPE-DENY; restored passes.
- **AC6 [R5].** GOV-940-HOOK-EXEMPT-ALLOW passes (a valid rules entry by the receipt contract exempts the written contract) and GOV-940-HOOK-FORGED-DENY passes (an entry with evidence outside the evidence tree, or failing R2, does not exempt; the write yields `GOVERNANCE INDEPENDENCE`); GOV-940-HOOK-SCOPE-ENTRY-DENY passes (a scope entry naming the receipt never exempts). Sensitivity: restoring the unvalidated exemption fails GOV-940-HOOK-FORGED-DENY; restored passes.
- **AC7 [R6].** After the approver's rebase, a scoped harness that imports the canonical `validateDiff` and `changedFiles` from `scripts/workflow-gates/cli.mjs` (`shared/workflow-evidence.md`) and runs them at phase `release` against base `origin/main` over the working tree reports no error for the 935 and 940 contracts; the 923 contract may still report the Task 931 test files until Task 931's approver adds its entry. The mapped-test run of `cli.mjs diff` needs the CI database secrets and is proven by the PR #12 Task Security Contracts job after the push.
- **AC8 [R1; R2; R3; R4; R5; R7; C31].** `node scripts/workflow-gates/publication.mjs --base HEAD` reports 0 dependency errors with the new self-test listed in `publication.json`; `node scripts/workflow-gates/selftests.mjs` exits 0 with at least 164 + 9 passing tests and 0 skipped (C27); `node scripts/workflow-gates/check-workflow.mjs` exits 0; `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0; `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case; `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented; `npm run check:kickoff-evidence` passes.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The release validation of reviewed contracts (`scopeHashErrors`, `rulesRebaseErrors`, `validateContract` release block; C2–C7), the diff check of rebases and retained release-blocker contracts (`diffRebaseErrors`, `validateDiff`; C8–C14) and the Stop hook's governance independence exemption (`governanceIndependenceErrors`; C20). Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-940-HOOK-EXEMPT-ALLOW, GOV-940-HOOK-FORGED-DENY and GOV-940-HOOK-SCOPE-ENTRY-DENY on the real `governanceIndependenceErrors` with synthetic transcripts and contracts. |
| Server security | The CI and validator layer replaces this row: GOV-940-VAL-* on the real `validateContract`, `scopeHashErrors` and `validateReport`; GOV-940-CI-* on the real `validateDiff` with an injected base reader. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path; the base reader of the diff tests is injected. |
| Cases | The nine GOV-940 cases of the sidecar, each with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook, ci and validator layers. |
| Fixtures and environment | Temporary directories from `mkdtempSync`, synthetic contracts, evidence and transcripts; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical cases GOV-940-VAL-SCOPE-DENY, GOV-940-CI-SCOPE-DENY and GOV-940-HOOK-FORGED-DENY: the breaks named in AC2, AC5 and AC6; baseline pass, isolated break failing with an assertion, restored pass; artifacts under `docs/sessions/evidence/task940/sensitivity/`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives. Prerequisite: branch at `c2f918a59` or later (C30).
2. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save the base runs of `selftests.mjs` and
   `npm run build` to `docs/sessions/evidence/task940/impl/base-runs.txt` before the first write.
3. Implement R1–R5 with the nine cases in `scope-rebase.selftest.mjs`, then R7. Record `implementation: { "role": "Opus" }`, stage
   `implemented`, `report` and `sensitivity` in the sidecar; run the three sensitivity breaks and keep their artifacts. Do not write
   R6: the approver does.
4. Run `cli.mjs governance-report` and every AC command; write the completion report; end with
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the owner. No push.
5. **Opus approver, another fresh session** (D2): review R1–R7; on approval write the `review` block and stage `reviewed`, write R6
   with its evidence, run AC7, and hand off the explicit-path commit and the push of the branch under `shared/git-publication.md`.
   PR #12 merges only after green PR checks, which also need Tasks 931 and 937–939 (D7).

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-940 case with its result; the three sensitivity diffs with the failed
assertion; base and final self-test totals; proof that `governance-contract.selftest.mjs` is unchanged; the R4 (e) limitation; one of
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task940/design/`. |
| `security-testing.md` | Governance contract: hook and CI/validator layers, allow/deny/error, sensitivity for critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); push only after approval; merge only after green checks (D5). |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32; owner decisions: D1, D2, D5, D6, D7, D8, D9; blocked claims: NONE.
