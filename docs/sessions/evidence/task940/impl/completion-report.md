# Task 940 — completion report (Opus governance implementer, D1, 2026-11-01)

Kickoff: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.md`
(kickoff digest `7f9a50db1d82a73e74a788c9e004bc8f198a9dbc781e61401bb1dfd965ee1a6a`, committed in `dfc2fedcf`).
Session: a fresh implementation session; it did not design the kickoff and must not approve it (D2).
Platform: native Windows 11, Node v22.22.3, branch `task/935-governance-approval-route`, head `dfc2fedcf`.

## Base runs (before the first write)

`docs/sessions/evidence/task940/impl/base-runs.txt`: `selftests.mjs` 164 pass, 0 fail, 0 skipped, exit 0;
`npm run build` compiled successfully, exit 0.

## Requirements

| R | Changed files | Status | Evidence |
|---|---|---|---|
| R1 rebase chain | `scripts/workflow-gates/contract.mjs` (`rebaseChain`, `rebaseChainErrors`, `scopeHashErrors`) | IMPLEMENTED | GOV-940-VAL-SCOPE-ALLOW, -VAL-CHAIN-ALLOW, -VAL-MALFORMED-ERROR |
| R2 `rules` entry | `contract.mjs` (`rulesEntryErrors`, the former `rulesRebaseErrors` checks without the digest pair, which moved to the chain) | IMPLEMENTED | GOV-940-VAL-CHAIN-ALLOW; the GOV-935 rebase tests unchanged and passing |
| R3 `scope` entry | `contract.mjs` (`scopeEntryErrors`, `scopeRebaseFiles`, `isRuntimeFile`) | IMPLEMENTED | GOV-940-VAL-SCOPE-ALLOW, -VAL-SCOPE-DENY |
| R4 diff check | `scripts/workflow-gates/cli.mjs` (`diffRebaseErrors` generalised; `validateDiff` calls it at every non-plan phase) | IMPLEMENTED | GOV-940-CI-SCOPE-ALLOW, -CI-SCOPE-DENY |
| R5 hook exemption | `scripts/workflow-gates/security-hook.mjs` (`governanceIndependenceErrors`) | IMPLEMENTED | GOV-940-HOOK-EXEMPT-ALLOW, -HOOK-FORGED-DENY, -HOOK-SCOPE-ENTRY-DENY |
| R6 935 rebase | none (approver only) | NOT WRITTEN BY DESIGN | approver writes the `scope` entry and `docs/sessions/evidence/task940/review/scope-rebase-935.md` |
| R7 rule text | `.claude/rules/review/03-decision-closure.md` (7879 bytes, limit 8192) | IMPLEMENTED | `check-workflow.mjs` exit 0 |
| AC8 manifest | `scripts/workflow-gates/publication.json` (new self-test listed) | IMPLEMENTED | `publication.mjs --base HEAD`: 82 files, 0 dependency errors |

New self-test: `scripts/workflow-gates/scope-rebase.selftest.mjs`. Sidecar: stage `implemented`, `implementation.role` `Opus`.

### Behaviour notes for the reviewer

- R1 (d): a recorded digest equal to the current digest returns only the named shape errors of a malformed
  `review.rebases` (a malformed value is reported even when the digest is current); otherwise a valid chain accepts only
  `review.scopeSha256`, never an intermediate digest (asserted in GOV-940-VAL-CHAIN-ALLOW).
- R1 (e): the shape errors are `rebases: must be an array`, `rebases: entry N must be an object`,
  `rebases: entry N has unknown kind <value>`, `rebases: entry N is missing <fields>`; a malformed entry never enters
  the chain. Chain errors are prefixed `rulesRebase:` (legacy entry) or `rebases: entry N:`.
- R3: beyond (b), a listed runtime file (`package.json`, lock file, `tsconfig.json`, `.nvmrc`, the test setup files,
  `next`/`vitest` configs) is refused even when the rebased scope lists it, because D9 and the out-of-scope section
  exclude runtime files from a rebase (variant `runtime file` of GOV-940-VAL-SCOPE-DENY). R7 states the same rule.
- R4 (a): the comparison stops at the first base entry that differs; each base entry from there is reported as
  `the entry recorded at the diff base was edited or replaced` (still present at that index) or `was removed`, and the
  current entries from there are new. This keeps the GOV-935 retained-rebase test unchanged: a re-signed legacy entry is
  now refused as edited and as not approved inside the diff. The former acceptance of an in-place rewrite of the legacy
  `rulesRebase` anchored at its prior rebased digest is removed, as R1 (b) and AC5 require; a later rules change appends a
  `rules` entry to `review.rebases` (R7 text).
- R4 (d): with no new entries the diff check adds nothing; the file-level chain check still compares the last
  `rebasedScopeSha256` with the current scope. The former retained-rebase message
  `digest inputs changed after the retained rebase` is no longer emitted (no GOV-935 test asserts it).
- R4 (e) limitation: when the rebased contract is absent at the diff base, or its `review.scopeSha256` differs from the
  base one (a review written inside the same diff), there is no base anchor: (b) is skipped and only (c) applies (each new
  entry's approving contract in the diff and valid). In PR #12 this is the case of the 935 contract (new on the branch),
  so its R6 entry is checked through 940's contract only. Covered by GOV-940-CI-SCOPE-ALLOW and -CI-SCOPE-DENY (`absent`).
- R5: the exemption applies only to a `rules` entry (legacy or in `review.rebases`) whose `by` is the receipt contract,
  whose evidence is under `docs/sessions/evidence/` and whose `rulesEntryErrors` is empty; the receipt contract itself is
  never exempt; a `scope` entry never exempts, even a valid one (GOV-940-HOOK-SCOPE-ENTRY-DENY asserts that the entry
  validates and the write is still refused).

## GOV-940 cases

| Case | Result |
|---|---|
| GOV-940-VAL-SCOPE-ALLOW | passed |
| GOV-940-VAL-SCOPE-DENY (critical) | passed; 14 variants: case test file, runtime file, file outside the rebased scope, by not reviewed, by not scoping the file, by is the rebased contract, by a docs contract, stale evidence hash, evidence outside the evidence tree, missing heading, broken original digest, broken rebased digest, chain gap after a rules entry, later unlisted change; each also fails `validateReport` alike |
| GOV-940-VAL-CHAIN-ALLOW | passed |
| GOV-940-VAL-MALFORMED-ERROR | passed |
| GOV-940-CI-SCOPE-ALLOW | passed |
| GOV-940-CI-SCOPE-DENY (critical) | passed; re-signed unlisted change of a case test file, `package.json` and another scope file; by outside the diff (also absent at the base); legacy by outside the diff; by not validating; missing base reader; edited earlier entry; removed scope entry; replaced legacy entry; restored chain passes |
| GOV-940-HOOK-EXEMPT-ALLOW | passed |
| GOV-940-HOOK-FORGED-DENY (critical) | passed; planted contract with a scope file as evidence (legacy and `rebases` forms), stale evidence hash, listed file not a rule input, receipt contract not reviewed |
| GOV-940-HOOK-SCOPE-ENTRY-DENY | passed |

`node scripts/workflow-gates/cli.mjs governance-report --contract <sidecar>`: passed, 9 cases, written to
`docs/sessions/evidence/task940/impl/governance-report.json`.

## Sensitivity (one break at a time, applied and removed with the Edit tool)

| Case | Break | Mutant failure | Artifact |
|---|---|---|---|
| GOV-940-VAL-SCOPE-DENY | `contract.mjs` `scopeEntryErrors`: case-test-file condition replaced by `true \|\| ...` | `ERR_ASSERTION` `match`, variant `case test file`: actual `''` (no stale message) | `docs/sessions/evidence/task940/sensitivity/GOV-940-VAL-SCOPE-DENY.txt` |
| GOV-940-CI-SCOPE-DENY | `cli.mjs` `diffRebaseErrors`: base-digest comparison prefixed with `false &&` | `ERR_ASSERTION` `match`, variant `src/profile.test.ts`: the product contract has no `Independent review scope is stale` | `docs/sessions/evidence/task940/sensitivity/GOV-940-CI-SCOPE-DENY.txt` |
| GOV-940-HOOK-FORGED-DENY | `security-hook.mjs`: the `isEvidencePath` and `rulesEntryErrors` conditions removed (pre-940 exemption) | `ERR_ASSERTION` `match`: actual `''` for the planted contract naming `scripts/workflow-gates/example.mjs` as evidence | `docs/sessions/evidence/task940/sensitivity/GOV-940-HOOK-FORGED-DENY.txt` |

Each artifact records baseline pass, mutant fail and restored pass, and the sha256 of the broken file before the break
and after the restore (identical). The first CI-SCOPE-DENY mutant run showed that its stale assertion could be satisfied
by the approving contract's own staleness; the assertion was narrowed to the product contract and all three breaks were
rerun on the final test file (sha256 `f2dc9830d3a245d771ca0324389eaf88f33798736199cfee8a62a3fa59d129ff`).
Records: `docs/sessions/evidence/task940/sensitivity/sensitivity.json`.

## AC8 commands (final)

| Command | Result |
|---|---|
| `node scripts/workflow-gates/selftests.mjs` | 173 tests, 173 pass, 0 fail, 0 skipped, exit 0 (base 164 + 9) |
| `git diff --exit-code -- scripts/workflow-gates/governance-contract.selftest.mjs` | exit 0 (unchanged); GOV-935-VAL-REBASE-ALLOW, -VAL-REBASE-DENY, -CI-REBASE-DENY and the retained-rebase test pass (AC4) |
| `node scripts/workflow-gates/publication.mjs --base HEAD` | 82 explicit files, 0 dependency errors |
| `node scripts/workflow-gates/check-workflow.mjs` | exit 0 |
| `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` | exit 0 |
| `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` | exit 0 |
| `node scripts/workflow-gates/cli.mjs governance-report --contract <sidecar>` | passed, 9 cases |
| `node scripts/workflow-gates/cli.mjs verify --contract <sidecar>` | exit 0 at stage implemented |
| `npm run check:kickoff-evidence` and `check-kickoff-evidence.mjs --files <kickoff>` | PASS |

## Repository state observed for the approver (informational, not AC7)

A scoped harness importing the canonical `validateDiff` and `changedFiles` at phase `release` against `origin/main`
(`d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`) over the working tree, before R6, reported:
- the 935 contract: `Independent review scope is stale` (expected: this task changed its scope files; R6 is the approver's);
- the 940 and 931 contracts: not yet reviewed (expected);
- the 923 contract: stale through its legacy rules entry. Cause: uncommitted working-tree edits outside this task —
  `src/lib/auth/__tests__/permissions.test.ts`, `src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts`,
  `src/modules/cabinet/statistics/__tests__/access.test.ts` (Task 931's files, C15–C17) and four other test files are
  modified (`git status`). Task 940 changed none of the 923 digest inputs (its rule inputs exclude
  `.claude/rules/review/03-decision-closure.md`; the gate scripts are not in its scope). Task 931's approver adds its
  `scope` entry (kickoff section 4).

The mapped-test run of `cli.mjs diff` needs the CI database secrets; it is proven by the PR #12 Task Security Contracts
job after the push (AC7).

## Out of scope, untouched

Product code, the CI workflow, `governance-contract.selftest.mjs` and every other existing self-test, runtime files,
the Task 931 test fixes and the 935/923 contracts.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
