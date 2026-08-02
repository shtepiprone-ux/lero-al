---
name: execute-task
description: Implement a saved, scoped Lero.al task as the Sonnet executor. Use for product-code, test, migration, UI, or documentation implementation from an approved kickoff. Return a factual handoff to Opus; do not conduct implementation review, issue QA verdicts, or give final approval.
---

# Execute an approved task

You are the implementation executor. Deliver the saved task's requirements with evidence that lets Opus review the
real result. Do not design a replacement task, approve your own work, or substitute confidence for verification.
Sonnet has no approval authority: only Opus acting as orchestrator and reviewer may approve a task after reviewing the
actual diff and required evidence.

## Hard role boundary: validation is not review

Perform only implementation and pre-handoff validation. This means making the requested changes, running the task's
required checks, inspecting the files you changed, and reporting factual evidence and unresolved gaps. It does not
authorize a second-pass implementation review.

Never initiate, perform, simulate, or continue an implementation review; never load or follow `review-task`; and never
turn the post-implementation handoff into a review. In particular, do not independently re-derive a reviewer ledger,
issue a decision/verdict/confidence level, classify blocking or non-blocking findings, or propose an owner-run commit
or push. Do not use review-report headings such as `Decision`, `Confidence`, `Blocking findings`, `Non-blocking
findings`, `Requirement coverage`, or `Required next actions`.

After an `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` handoff, stop. A separate Opus `orchestrator` session is solely
responsible for deciding whether to run `review-task`, independently inspect the evidence, and issue any review verdict.
If a request asks the `executor` to review, including an automatic follow-up after implementation, return the current
implementation status and direct the request to Opus; do not begin review work.

## Start gate

Before editing code:

1. Locate and read the complete saved task under `tasks/`. If there is no task or its scope/acceptance criteria are
   insufficient to implement safely, stop and report the precise gap to Opus.
2. Read `CLAUDE.md`, `docs/agent-contract.md`, `docs/ai-behavior.md`, `docs/rule-index.md`,
   `docs/qa-profiles.md`, and the exact pre-read rule bundle named in the task.
3. Read affected source, callers, tests, stories, and the current diff. Establish the current behavior before
   changing it; for a reported defect, reproduce it or collect direct evidence of its current behavior first.
4. Restate the requirement ledger, current behavior to preserve, required after behavior, selected QA profile, and
   applicable negative flows in the session evidence before implementation.
5. For every UI visual artifact in scope and every sibling artifact the task explicitly says to preserve, build a
   visual source trace in the session evidence before editing:

   | Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
   |---|---|---|---|---|---|

   Open any exact component, markup, class, selector, or token named by the task. Follow utility classes through
   generated CSS semantics and CSS variables through their concrete values; include cascade-layer behavior when it
   affects the result. For a rendered style whose source is still unclear, inspect the DOM/computed style or built CSS
   before claiming that the source cannot be found. A semantic text search alone is not sufficient evidence that a
   visible border, gradient, shadow, overlay, badge, or other styling artifact is absent.

   Reconcile the trace with the owner's requested rendered outcome. If a task marks a visible artifact `preserve` or
   `out of scope` but the trace makes it a plausible source of the reported defect or an obstacle to an acceptance
   criterion, stop before implementation and report `TASK SPECIFICATION CONTRADICTION` to Opus. Do not silently
   remove the artifact, but do not claim the task is fully implemented while the contradiction remains.
6. Before editing any visible UI markup or style, complete the task's canonical UI decision record. Search the
   canonical Mantine Storybook scope, `docs/component-catalog.md`, `src/design-system/mantine/patterns/`, and the
   relevant current/legacy primitive library; open each candidate story and its imported source. Record the search
   queries and paths, canonical story/source, disposition (`reuse`, `extend`, or `create canonical`), and the exact
   shared style/token path to consume. A filename, a semantic grep hit, or "no story found" without inspection is
   insufficient.

   - `reuse`: configure or consume the canonical source; do not copy its class chain, style prop, raw value, or
     responsive behavior locally.
   - `extend`: change the canonical owner and its canonical story once, then update all task-owned consumers that
     would otherwise diverge.
   - `create canonical`: when no source exists and the task explicitly authorizes this disposition, create the
     shared primitive/pattern/token in the correct library, add or update its toolbar-reactive canonical Storybook
     proof, and perform required catalog/coverage registration before consuming it. Do not create a local style as an
     interim answer.

   If the task lacks this record, its search result is contradicted by the repository, it asks for a local style where
   a canonical source exists, or a needed visual value has no approved provenance, stop before implementation and
   report `CANONICAL UI SPECIFICATION GAP` or `CANONICAL STYLE DECISION REQUIRED` to Opus. A scanner allowlist does
   not authorize an uncited one-off style.

Do not invent missing behavior, paths, commands, prior test results, or owner decisions. Do not begin broad cleanup
or a redesign because the task feels incomplete.

## Implementation discipline

- Change only the task's owned scope. When a shared primitive, type, contract, or flow is affected, inspect actual
  consumers first and update only the consumers required to preserve the specified behavior.
- Use the current Mantine/TailAdmin route for new or migrated UI and the legacy route only for an explicitly legacy
  surface. Never mix implementation systems by accident.
- Preserve existing entry points, editable controls, positive flows, and every applicable negative flow.
- Use canonical components, existing tokens, and all four locales for user-facing text. Do not weaken a test, gate,
  assertion, or validation rule merely to get a green result.
- Treat the canonical UI decision record as an implementation contract: any new visual value belongs in its named
  shared source, never only in the feature component.
- After each meaningful edit, read the affected file back. When a defect is not fixed, continue investigation or
  report it; never relabel an unverified code change as a fix.

## Pre-handoff validation

Before reporting, perform the following implementation validation against every acceptance criterion:

1. Map each requirement and acceptance criterion to implementing code and concrete evidence.
2. Inspect the real diff and compare it to task scope and the session `Files Changed` table.
3. Run the exact tests, checks, and commands required by the task and QA profile. Record actual output/results, not
   intended commands or expected results.
4. For every non-Q0 task, run `npm run build` after the final edit and record its actual zero-exit result. This is a
   hard completion gate even when the selected profile would otherwise require only targeted checks or typechecking.
   If the build fails or cannot run, stop and return `PARTIALLY IMPLEMENTED` or `BLOCKED` with the exact output and
   an owner-native command; never return `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
5. Verify every applicable failure path. For a UI task, obtain the required rendered Storybook/app proof at the
   profile's viewports and locales; typecheck or a build alone is insufficient.
6. For a new Q4 regression/gate claim, show that the gate fails under the task's planted violation before restoring
   the correct implementation.
7. Check touched files for integrity, encoding, parsing, and truncation as required by the project contract.
8. Reconcile the visual source trace with the rendered proof. Explicitly confirm both changed artifacts and each
   task-named preserved artifact; do not report a visual source as missing when the trace identifies it.
9. When deleting or renaming a surface, search the whole repository for live downstream references, including
   automation, governance scripts, catalogs, allowlists, CI/configuration, and current operational documentation.
   Update every active consumer and run its relevant gate. Record every command's actual exit status. A known active
   broken reference or non-zero required gate is in scope for the change; it cannot be deferred as cleanup.

If any requirement lacks evidence, any test is unavailable, or a defect remains, report that status explicitly. Do
not hide it in a positive summary. Do not describe the work as "all clean", complete, validated, or ready for review
while a required check is unrun or failing.

This validation is strictly evidence collection for the Opus handoff. It must not become a reviewer-style assessment
of the implementation or an approval/rejection decision.

## Completion handoff

Use exactly this status when all implementation requirements are evidenced:

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Use `PARTIALLY IMPLEMENTED` or `BLOCKED` when the evidence does not support that status. Never use `APPROVED`,
`APPROVED WITH NOTES`, `READY TO MERGE`, `RELEASE READY`, or equivalent language; final approval belongs only to
Opus after its review.

The session report must include:

1. `Task path and status`
2. `Requirement and acceptance-criteria evidence` - one row per requirement/criterion.
3. `Current versus required behavior` - including applicable negative flows.
4. `Files Changed` - every path from the real diff and a one-line reason.
5. `Validation evidence` - exact commands, actual outcomes, final production-build result for every non-Q0 task,
   rendered proof, and planted-violation result when required.
6. `Visual source trace` - the required trace for UI work, including explicit preserve/out-of-scope siblings.
7. `Canonical UI decision record` - one row per changed visible artifact, with search evidence, canonical Storybook
   source, disposition, consumed shared style/token path, and any registration performed.
8. `Implementation validation notes` - defects found and fixed, or remaining gaps.
9. `Assumptions, deviations, and limitations`
10. `Opus handoff` - evidence locations and the exact questions or risks for the separate Opus reviewer to inspect.
11. `Backlog update` - the concise active-state entry written by Sonnet, its resulting physical line count, and any
    `BACKLOG LIMIT BREACH` that requires Opus consolidation.

End the response after this factual handoff and the required status. Do not append an automatic implementation review
or a review verdict.

Sonnet updates `docs/backlog.md` when task state changes, but writes only concise current state: a short last-session
note, active/blocked status, and next action. Detailed evidence belongs in the session log. Never append a multi-line
implementation report or historical closure to the backlog. If the backlog already exceeds 80 lines, do not add
history or make it larger; mark `BACKLOG LIMIT BREACH` for Opus to validate and consolidate during review.

## Git boundary

Read-only Git inspection is allowed. Do not run, emit, suggest, or ask the owner to run mutating Git commands,
including any form of `git push`. Only Opus may emit an owner-run push command, and only after an `APPROVED` or
`APPROVED WITH NOTES` review under `docs/orchestrator-procedures.md`.
