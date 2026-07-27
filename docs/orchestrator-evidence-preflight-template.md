# Orchestrator Evidence-First Preflight

Use this template before Opus publishes a non-trivial implementation task or returns an implementation-review
decision. Keep the completed preflight with the task design or review evidence; do not replace it with a confidence
statement.

## 1. Scope and execution state

| Field | Value |
|---|---|
| Task / review | |
| Mode | `TASK DESIGN` / `IMPLEMENTATION REVIEW` / other |
| Execution state | `from-scratch` / `remediation` / `mixed` |
| Exact start step | |
| Reused artifacts | |
| Artifacts that must not be overwritten | |
| Owner decision required? | no / yes: |

For `remediation`, state explicitly which original phases must not be rerun and why their inputs are no longer
valid.

## 2. Requirement-to-evidence map

| Requirement / AC | Observable claim | Exact source or artifact inspected | Producing command and real output | Matrix / branch scope | Status |
|---|---|---|---|---|---|
| R / AC | | file + symbol/line, manifest field, or rendered capture | command + exit semantics | viewport/locale/state, if applicable | `VERIFIED` / `ASSUMED` / `UNKNOWN` / `BLOCKED` |

No row may claim more than its command or artifact actually observes.

## 3. Command and artifact contract

| Command / script | Reads | Writes or can overwrite | Output schema / verdict enum inspected | Expected exit semantics | Safe at scheduled step? |
|---|---|---|---|---|---|
| | | | | | yes / no |

For any baseline or manifest command, state its exact matrix. Mark a mismatch between `fast`, full, route, Storybook,
or locale subsets as `UNKNOWN` until reconciled.

## 4. Rendered UI proof (UI work only)

| Visible artifact / state | Source rule | Computed value evidence | Geometry evidence | Visual/pixel evidence required by QA profile | Result |
|---|---|---|---|---|---|
| | | | | | |

Do not infer a rendered result from a CSS rule alone. For a synthetic browser measurement, document the selected
story ID, selectors, viewport/locale matrix, temporary mutation, restoration in `finally`, comparison epsilon, and
what the measurement cannot prove. For every cell, assert and persist that the synthetic pass reached its requested
state; retain the raw `live` and `synthetic` computed values, rects, and overflow inputs as well as the derived
deltas. A zero delta without proof that the mutation took effect is `NOT VERIFIABLE`.

## 5. Falsification log

| Claim or gate | Counterexample / failure branch inspected | Actual result | Consequence |
|---|---|---|---|
| | missing baseline, enum branch, long locale, narrow viewport, alternate matrix, stale build, overlapping task path, etc. | | verified / task correction / owner decision |

At minimum test every new or changed gate against a missing/invalid input and inspect the code path that emits its
reported status. Mark the result `EXECUTED` only when a command or artifact actually exercised it; label a
source-derived counterfactual `ANALYTICAL`, never “fired” or “cleared”.

## 6. Write-scope viability, ownership, and handoff readiness

| Path the executor must change | Current classification | File-local limit / constraint | Allowed action or owner decision | Handoff / staging status |
|---|---|---|---|---|
| | `CLEAN` / `OWNED` / `EXCLUDED AS UNRELATED` / `AMBIGUOUS` | e.g. line cap, mixed diff | edit / defer / non-growing consolidation / owner sequencing | |

Inspect this before publishing a task, not only before its handoff. An `AMBIGUOUS` path with mixed unreviewed work,
or a capped file already over its limit, cannot be a required executor edit without an explicit owner decision or
non-growing consolidation plan. Scope, Out of scope, verification, completion report, and handoff must agree.

### 6a. Exceptions, dirty-worktree comparison, and artifact timing

| Check | Evidence / exact plan | Status |
|---|---|---|
| Owner-only exception | Verbatim owner decision or durable reference: date, exact exception scope, follow-up owner | `VERIFIED` / `BLOCKED` |
| Start-state comparator | Read-only `git status --porcelain` captured before task writes; pre-existing paths classified; ending comparison defined | `VERIFIED` / `BLOCKED` |
| Pre-modified path integrity | Content SHA-256 or read-only snapshot before and after every pre-existing modified path claimed untouched | `VERIFIED` / `BLOCKED` |
| Dirty-worktree manifest or clean isolation | Every starting porcelain entry covered by `orchestrator-dirty-worktree-manifest-template.md`, or recorded proof of an isolated clean worktree | `VERIFIED` / `BLOCKED` |
| Stateful measurement timing | Every new scanned/input artifact named, with its creation point relative to each baseline/count/manifest command | `VERIFIED` / `BLOCKED` |
| Revision consistency | Every step/phase/AC reference and current self-check recomputed after the last edit; superseded claims marked historical | `VERIFIED` / `BLOCKED` |

Never use the task document itself as evidence of owner approval. A raw final status is not a delta in a dirty
worktree. If an artifact could change the measured input set, the task must either schedule it after the measurement
or include it in the expected result.

### 6b. Unwaivable rule-compliance ledger

Complete `docs/orchestrator-rule-compliance-ledger-template.md` for every selected rule. Record the exact clause,
its applicability, mandatory observable, evidence, and `COMPLIANT` / `BLOCKED` / source-based `NOT APPLICABLE`
result. A task-authored exception, a weaker alternative, or a row omitted from the ledger is `BLOCKED`.

## 7. Publication gate

- [ ] Every required AC has an observable artifact and valid verification command.
- [ ] Every command can run at its scheduled point without overwriting irreplaceable evidence.
- [ ] Reported enums, exit codes, matrices, and baseline counts come from the actual producing code/artifact.
- [ ] UI claims separate source, computed, geometry, and required visual evidence.
- [ ] Synthetic UI probes assert and persist the effective mutation plus raw live/synthetic measurements.
- [ ] Remediation plans name their start phase and preserved artifacts.
- [ ] Every required write path is viable in the current worktree; no scope or reporting instruction contradicts it.
- [ ] Every exception to an owner-only rule has a traceable owner decision; otherwise the task is `BLOCKED`.
- [ ] Dirty-worktree path assertions compare against a pre-write status snapshot, not a purported clean status.
- [ ] An unchanged-content claim for a pre-modified path has matching before/after content witnesses.
- [ ] Every starting dirty entry is covered by the integrity manifest, or execution has verified clean isolation.
- [ ] Every applicable selected rule has a `COMPLIANT` row in the rule-compliance ledger.
- [ ] Exact baseline/count/manifest assertions account for the timing of every task-created input artifact.
- [ ] The current task text has no stale step reference or self-check claim contradicted by its latest revision.
- [ ] Every material claim has a recorded falsification attempt.
- [ ] Unresolved rows are labelled `ASSUMED`, `UNKNOWN`, or `BLOCKED`; none is presented as verified.

If any required checkbox is false, do not publish the task as ready or approve the review.
