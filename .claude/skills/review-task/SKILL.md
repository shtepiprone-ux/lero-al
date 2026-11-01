---
name: review-task
description: Independently review a Lero.al task when the owner forwards Sonnet's implementation report or requests review; complete necessary verified task revisions and the approval decision without a second go-ahead. Do not implement product code.
---

# Opus implementation-review parent workflow

Complete this workflow in order before a final verdict. Keep step results and raw evidence locators in the existing
review/session record; the frontend exception still forbids creating a separate review ledger by default. An
executor report is an index to evidence. The startup receipt establishes loaded rules, not completed review.

A Sonnet report or pending owner-validation result starts/resumes R1-R7 under `shared/role-boundaries.md`.
Finish the feasible cycle without another go-ahead: a passed stage also requires the next assigned route to be
ready. Honor an explicit different owner request; reuse valid checkpoint proof (`shared/orchestration-state.md`).

## Visual decisions after the task is read

For visible scope read `shared/canonical-component-reuse.md`. Inspect ready Mantine components and their Stories before external
research or proposing replacements. Verify reuse, missing-capability extensions, or justified creation plus a direct
Story; reject duplicates. Inherit settled design/adaptation and verify the actual task integration and regressions.

Reject any visible change that invents a new mobile pattern without the required basis, creates a local visual
decision, bypasses the selected Mantine mechanism/canonical owner or the canonical token/component/Story, or lets
Stories style an element outside its public API. Verify the semantic token definition and consumption, not merely a
token document. Run the affected built-Storybook parity census when the shared visual contract changes or a parity
defect is reproduced; do not remeasure unchanged canonical chrome under the reuse rule. Two looks, missing coverage, or
any unapproved hardcode is `NEEDS REVISION`. The mobile contract may supplement content order/treatment and proof;
it may not be used to duplicate Mantine responsive props, introduce a parallel viewport branch, or alter Mantine
focus/dismissal/keyboard behavior.
Read `shared/enforcement-model.md` for visible scope and treat a missing UI-contract gate result or malformed
newly-enrolled component → token-owner → Story contract as `NEEDS REVISION`.

## Ordered workflow

| Step | Read and do | Required result before continuing |
|---|---|---|
| R1. Establish what is being reviewed | `review/01-preflight.md`: complete task/decisions, explicit first action, exact candidate and ownership | current requirement list and identified candidate; no scope guessed from the report |
| R2. Establish comparison evidence | same phase and `shared/orchestration-state.md`: dependency manifest, baseline and candidate hashes | comparable before/after scope and a validation plan bound to actual inputs |
| R3. Inspect implementation semantics | `review/02-adversarial-ui.md`: trace every AC through the real code and boundary, including all affected consumers | each AC has inspected implementation and relevant counterexample |
| R4. Verify assertions and execution | same phase: inspect fixtures/mocks, independently run required tests, inspect deliberate-break and cleanup proof | actual collected assertions and boundary evidence for the reviewed candidate |
| R5. Verify applicable UI and integration | same phase: canonical owner, direct/composition/route proof, locales/widths/portals and non-Q0 build | required final artifacts match the candidate; justified N/A for unrelated UI checks |
| R6. Complete the finding set | `review/03-decision-closure.md`: reconcile all ACs, root causes and regressions | consolidated findings attributed to implementation, task design or environment |
| R7. Decide and close or continue | same phase and `shared/git-publication.md`: recheck hashes, readiness, PR checks and post-merge CI at their boundaries | whole-task approval, verified next route, or concrete external blocker; main changes only through a green PR |

Do not issue a final verdict after the first defect while other in-scope criteria remain unchecked. Report urgent
findings immediately and continue the independent audit; genuinely unavailable evidence produces a bounded partial
result. A later review verifies every prior finding and audits new/affected dependencies; unchanged, hash-bound
evidence may be reused without repeating unrelated expensive runs.

The first substantive response begins with the exact receipt in `review/01-preflight.md`. Use `docs/rule-index.md` to
open only the task's relevant detailed documents. The cited documents retain complete policy/receipt definitions.

## Role boundary

Opus is the sole approval authority after inspecting actual diff and evidence. Do not implement product code during a
review. Corrections and next assigned stages pass shared readiness before publication. A stage acceptance does not
permit deferring its next design step. A confirmed defect never authorizes a speculative route or product-code edit.
