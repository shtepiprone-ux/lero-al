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

## 6. Diff ownership and handoff readiness

| Path | Task-owned evidence | Classification | Staging status / reason |
|---|---|---|---|
| | session log + diff | `OWNED` / `EXCLUDED AS UNRELATED` / `AMBIGUOUS` | |

An `AMBIGUOUS` path with mixed unreviewed work blocks an isolated task handoff.

## 7. Publication gate

- [ ] Every required AC has an observable artifact and valid verification command.
- [ ] Every command can run at its scheduled point without overwriting irreplaceable evidence.
- [ ] Reported enums, exit codes, matrices, and baseline counts come from the actual producing code/artifact.
- [ ] UI claims separate source, computed, geometry, and required visual evidence.
- [ ] Synthetic UI probes assert and persist the effective mutation plus raw live/synthetic measurements.
- [ ] Remediation plans name their start phase and preserved artifacts.
- [ ] Every material claim has a recorded falsification attempt.
- [ ] Unresolved rows are labelled `ASSUMED`, `UNKNOWN`, or `BLOCKED`; none is presented as verified.

If any required checkbox is false, do not publish the task as ready or approve the review.
