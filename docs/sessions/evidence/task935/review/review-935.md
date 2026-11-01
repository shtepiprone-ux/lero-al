# Task 935 — independent governance review (Opus approver session, 2026-11-01)

Decision: **APPROVED WITH NOTES** (no P0–P2 finding; P3 notes N1–N4 below).

Approver independence (D2): this session wrote no file of the 935 contract `scope` other than the Task 923 contract's
`review.rulesRebase` and its rebase evidence (the R10(d) exemption). It ran `cli.mjs governance-report`, which
regenerates the report file named by the contract, as the kickoff route step 5 and `review/03-decision-closure.md`
R7 require. It did not design the kickoff (design session: `e2f340abd`) and did not implement it (implementer
session: `94288edbb`).

## Candidate and environment

- Branch `task/935-governance-approval-route`; reviewed implementation commit `94288edbb` on kickoff `e2f340abd` on
  PR #11 `23206fb7f`; `origin/main` = merge base = `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`.
- No uncommitted change under `scripts/`, `.claude/`, `.github/` or `docs/sessions/evidence/task935/` before the
  review writes. Unrelated untracked paths (Task 926 kickoff/sidecar, Task 859/790 evidence, `.playwright-mcp/`,
  `debug.log`) are not task-owned and are excluded from the handoff.
- Native Windows, PowerShell 5.1.26100.9818, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`.

## Independent runs on the candidate

| Command | Result |
|---|---|
| `node scripts/workflow-gates/selftests.mjs` | exit 0; 164 tests, 164 pass, 0 fail, 0 skipped (base 143) |
| `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` | exit 0 |
| `node scripts/workflow-gates/check-workflow.mjs` | exit 0 |
| `npm run check:kickoff-evidence` | exit 0, PASS |
| `node scripts/workflow-gates/publication.mjs --base HEAD` | 81 files, 0 dependency errors |
| `& .\.claude\hooks\phase-write-gate.ps1 -VerifyGate` | PASSED |
| `cli.mjs governance-report --contract <935 sidecar>` (implemented stage) | 22/22 cases passed; regenerated report byte-identical to the committed one |
| `cli.mjs verify --contract <935 sidecar>` (implemented stage) | exit 0 |
| `npm run build` | reused: `impl/final-build.txt` exit 0 on this commit; no app input changed (scope has no `src/` path) |

## Requirements and acceptance criteria

| R / AC | Inspected implementation | Disposition |
|---|---|---|
| R1 / AC1 | `contract.mjs` `isGovernanceScopePath`, `REQUIRED_GOVERNANCE_RULES`, `governanceCaseErrors`; product/docs branches untouched | verified (decision 1 accepted, see below) |
| R2 / AC2 | release block extended to `governance`; verify needs implemented/reviewed and `implementation.role` Opus | verified; sensitivity artifact inspected |
| R3 / AC3 | `cli.mjs governanceReport`, `parseTap`, `validateGovernanceReport`; `verify`/`receipt` handle governance | verified; forged-report and skipped cases refused |
| R4 / AC4 | `security-hook.mjs` `governanceIndependenceErrors` in the Stop branch; real hook process exits 2 | verified; note N1 |
| R5 / AC5 | `validateDiff` policy loop over `isExecutablePolicyPath`, deletions included (`--no-renames` diff) | verified |
| R6 / AC6 | new selftest file; PR #11 tests renamed/split; `impl/assert-retention.txt` 0 removed assertions; diff re-read | verified |
| R7 / AC7 | three rule files carry the new text; `03-decision-closure.md` 7397 B | verified; note N4 |
| R8 / AC6 | `git diff --name-only d8a07a3c7 23206fb7f` (30 files) minus sidecar scope = empty | verified |
| R9 / AC8 | branch created from PR #11; owner handoff given by this approving session only | verified |
| R10 / AC9 | `rebaseFiles`, `rulesRebaseErrors`, `scopeHashErrors`, `diffRebaseErrors`, `gitBaseReader`, digest overrides | verified; Task 923 rebase written by this session (`rules-rebase-923.md`) |

## Sensitivity

The six recorded breaks (`../sensitivity/sensitivity.json`) each show baseline pass, `ERR_ASSERTION` in the mutant,
byte-identical restore and restored pass. Independently, in a scratch copy of `scripts/workflow-gates/` outside the
project, this session applied three further breaks of its own; each failed its mapped case with `ERR_ASSERTION`:
removing the by-contract scope check of `rulesRebaseErrors` (GOV-935-VAL-REBASE-DENY), forcing the R10(c) anchor of
`diffRebaseErrors` to true (GOV-935-VAL-REBASE-DENY), and exempting every write in `governanceIndependenceErrors`
(GOV-935-HOOK-SELF-APPROVE-DENY); the restored copy passed.

## Implementation decisions 1–9

1. Scope set wider than the literal R1(b): accepted. The saved sidecar scope (designed with the kickoff) lists
   `CLAUDE.md`, `docs/orchestrator-*.md` and the Task 923 sidecar, which the literal list refuses; the conflict is a
   task-design defect, resolved conservatively (product paths still refused, one executable policy path required).
2. Report outside its own digest: accepted; a fixed point is impossible; product digests unchanged.
3. Product report accepted under a valid rebase's original digest: accepted; required for the Task 923 report.
4. Retained rebase in later diffs: accepted; covered by the retained-rebase selftest (a later rule change re-signed
   without a governance contract is refused).
5. R4 exemption of the rebased contract and its evidence: accepted in principle (the designed scope lists the rebase
   evidence); see N1 for its missing validation.
6. Planned governance contract validated at `plan` when it covers no changed executable policy file: accepted,
   mirrors the product rule.
7. AC9 needs a full 40-hex base and, at release, the `SECURITY_TEST_*` targets for the Task 923 integration tests:
   confirmed; `.env.local` holds no `SECURITY_TEST_*` names, so the local release diff is bounded to the contract
   checks and CI on the PR supplies the integration run.
8. GOV-935-HOOK-GIT-WRITE-DENY skips off Windows: confirmed; the report was regenerated on native Windows.
9. `security-testing.md` and `role-boundaries.md` exceed 8 KiB but are shared contracts, not phase files: accepted.

## Notes (P3, non-blocking)

- **N1 — exemption not validated.** `governanceIndependenceErrors` exempts the path of any contract whose
  `review.rulesRebase.by` names the receipt contract, and its `evidence` path, without checking that the evidence is
  under `docs/sessions/evidence/` or that the rebase validates. Probe (scratch copy, synthetic fixture): an untracked
  contract `{ review: { rulesRebase: { by: <receipt>, evidence: "scripts/workflow-gates/example.mjs" } } }` made a
  session that wrote `scripts/workflow-gates/example.mjs` pass the hook (`PROBE_ERRORS=[]`). Exploitation needs a
  deliberate forged file; it is the same class as shell writes the hook does not detect (N2), and CI refuses such a
  contract if it is committed. Hardening: require `isEvidencePath(evidence)` and `rulesRebaseErrors(...)` = [] for
  an exempting contract.
- **N2 — shell-write detection.** The independence check sees Write/Edit and the shell writes the PreToolUse guard
  recognizes (R4 wording); `Copy-Item`, `Move-Item`, `sed -i` and similar are not detected.
- **N3 — task design.** R1(b) and the saved scope disagreed (decision 1); a future governance kickoff should state
  the accepted scope set directly.
- **N4 — sizes.** The two shared contracts are over 8 KiB; `validateRuleSizes` covers phase files only.

## Task 923 rule-only rebase (R10, D6)

Recorded in `rules-rebase-923.md`: six rule inputs changed since `d8a07a3c7`, all in the 935 scope; the 923 scope
digest recomputed with their base contents equals its `review.scopeSha256`.
