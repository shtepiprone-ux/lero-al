---
name: create-task
description: Design one evidence-backed Lero.al implementation kickoff as Opus. Follow the ordered task-design phases; do not implement product code.
---

# Opus task-design parent workflow

Use this workflow for a new task and for redesigning a rejected task. Complete the steps in order; do not draft the
implementation route before investigating it. Read the phase named below immediately before its steps. Keep each
step's source/output locator and result in the existing design/session evidence record, not another receipt.
`PREFLIGHT COMPLETE` means the startup files were loaded; it does not complete investigation or publication.

## Visual decisions after the assignment is read

For visible scope read `shared/canonical-component-reuse.md`. Before reference research or a new UI decision, inspect ready
Mantine components and their Stories: reuse a match, extend a missing capability, or create a component plus direct
Story only when no suitable owner exists. Inherit ready design/adaptation; apply research and proof only to the
remaining gaps and changed contracts as that owner decision requires.

A kickoff never authorizes a consumer/Story hardcode. It must name the inspected canonical component/Story and the
semantic token path. If the token or pattern does not exist, scope its creation in the shared registry and direct
Story before consumer integration. For a changed shared visual contract or reproduced parity defect, require the
affected built-Storybook census proving one meaning has one look, or a dated owner decision distinguishing contexts.
For visible scope, inherit the ready owner's profile/mechanism or select a new semantic compact profile,
registry-allowed mechanism, and canonical owner in `shared/mobile-adaptation-contract.md`. Mantine owns responsive
mechanics; the contract adds only semantic order/content treatment/proof. Ready adapted Stories establish the reuse
baseline. A missing family/profile/mechanism/owner is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED` until
Opus extends the registry before publication; Sonnet never fills that gap. `shared/enforcement-model.md` is
mandatory: a rule-only receipt is not enough when the repository
gate fails or a newly enrolled component lacks its component → token-owner → Story contract.

## Ordered workflow

| Step | Read and do | Required result before continuing |
|---|---|---|
| C1. Establish the assignment | `create/01-preflight.md`: owner outcome, preservation boundaries, role/bundle/QA, current task and Git state | bounded assignment; unresolved product choices identified |
| C2. Investigate the real system | same phase: reproduce the problem, trace the whole affected path and dependencies, inspect existing assertions | source-backed cause, baseline, and affected-path manifest |
| C3. Design the change | `create/02-kickoff-contract.md`: select one solution and its canonical owners; resolve policy/DB/commit prerequisites | one feasible approach with preservation and sequencing decisions |
| C4. Design the proof | same phase: map each requirement to allow/deny/error/regression evidence and inspect command inputs | existing targets exercised; future tests explicitly planned; feasible sensitivity |
| C5. Write the draft contract | same phase: atomic R/AC, exact scope, ordered route, commands and matching security sidecar | execution disabled until readiness is established |
| C6. Challenge and validate it | `create/03-publication.md` and `shared/task-readiness.md`: permission, dependency, test and command checks | retained readiness results; every applicable check passes |
| C7. Publish the verified version | same phase and `shared/orchestration-state.md`: reopen files and recheck input hashes | saved ready contract equals the verified route; explicit owner commit only |

If a step fails, continue useful investigation but do not mark it complete or publish dependent instructions. State
the exact gap and resume from that step when resolved. A revision goes through C2-C7 for its affected dependencies;
it is not exempt because the previous task was executable. Reuse still-current evidence with its file/hash and scope.
Do not rerun unrelated suites or rebuild unchanged artifacts just to repeat a step.

The first substantive response begins with the exact receipt in `create/01-preflight.md`. Read only the task-specific
bundle chosen via `docs/rule-index.md`, plus the phase files above. Detailed historical/policy definitions remain in
the cited documentation.

## Role boundary

Create/revise task and required state artifacts; do not implement product code or approve an implementation. A
published task gives fresh Sonnet one saved executable route, not a chat-only or dual-path handoff.
