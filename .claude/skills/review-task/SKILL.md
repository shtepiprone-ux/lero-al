---
name: review-task
description: Perform an evidence-based implementation review and QA verdict for a Lero.al task. Use after Sonnet or another executor reports work complete, for Storybook/UI validation, or for release-readiness review. Do not use to create a new task or implement product code.
---

# Review an implementation task

Apply this protocol to the review request below. Review actual evidence, never the executor's confidence.

Review request:

$ARGUMENTS

## Role and boundary

Act as the adversarial reviewer, critic, and QA gatekeeper. Do not implement product code while using this skill. The executor's completion report is an index to inspect, not proof that a requirement is met.

## Establish the review baseline

1. Read the complete implementation task and rebuild its requirement ledger.
2. Read `CLAUDE.md`, `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/orchestrator-procedures.md`, `docs/rule-index.md`, `docs/qa-profiles.md`, and `docs/backlog.md`.
3. Read the task-specific rule bundle and the QA profile named by the task. If the task selected the wrong profile, record that as a finding and review at the level required by the actual risk.
4. Inspect the real diff, all changed files, affected callers, relevant tests and stories, and the session `Files Changed` table when available.
5. For every non-Q0 task, inspect the final `npm run build` zero-exit transcript against the reviewed diff. A missing,
   failed, or stale build transcript is a blocking evidence gap; do not approve until the current build passes.
6. Treat missing access, missing task context, missing diff, or missing required evidence as a review limitation. Do not fill it with assumptions.

When a task-required validation cannot run because of a sandbox, missing native binary, timeout, or comparable
environment limit, provide an owner-native validation handoff before the final decision. For every unrun check:

1. State the exact command and reason it did not run.
2. Provide a copy-pasteable command for the project root using the task's verified command and explicit test paths or
   flags. On Windows PowerShell, use `npm.cmd` or `npx.cmd` for Node-package commands unless the project specifies
   another native invocation.
3. State the expected exit result or artifact and the output the owner must return.

Do not substitute "reportedly clean", "risk is low", or an executor's summary for the missing result. Do not invent a
command. The missing check requires `NEEDS REVISION`, `PARTIALLY VERIFIED`, or `BLOCKED`, never approval.

Approval is an Opus-only review decision. Sonnet's implementation report and its status can never approve a task;
only this evidence-based review may return `APPROVED` or `APPROVED WITH NOTES`.

Use read-only Git only. Never run mutating Git. After an `APPROVED` or `APPROVED WITH NOTES` decision, emit a
precise owner-run commit handoff when the real diff and changed-file evidence have been inspected. This is the only
point at which Opus may additionally emit an owner-run push handoff:

```powershell
git add <explicit-inspected-paths>
git commit -m "<type>(TaskN): <short description>"
git push <verified-remote> <verified-branch>
```

Never execute the commands. Before emitting the push line, inspect the current branch and remote/upstream with
read-only Git and replace both placeholders with their verified values; a bare `git push` is not permitted. Never
use `git add -A`, `git add -u`, or wildcards. Do not emit a commit or push handoff for `NEEDS REVISION`,
`PARTIALLY VERIFIED`, or `BLOCKED`.

Before emitting an approved-review handoff, run read-only `git status --short` and inspect the corresponding diff.
Reconcile every status path with the task scope and the executor session's `Files Changed` table. The handoff must
stage every reconciled task path exactly once, including `docs/backlog.md` and the task session log when the task
contract requires them. Classify every remaining status path explicitly as either `EXCLUDED AS UNRELATED` or
`AMBIGUOUS`. Unrelated parallel work is not a blocker: list it without staging it, then emit the exact handoff for
the fully reconciled current task. Use `STATUS/REPORT MISMATCH` and withhold the handoff only when a path that should
belong to the current task is missing, undocumented, or ambiguous. Never silently omit a reconciled task artifact
merely because it is documentation, and never stage an unrelated or uninspected artifact to make the worktree clean.

Also inspect `.git/index.lock` before the handoff. It is an authorized agent-maintenance exception, not a Git commit:

1. Check for active Git processes. If any are active, return `GIT WRITE BLOCKED` with the lock path and do not emit a
   handoff.
2. If no Git process is active and the exact project-local `.git/index.lock` exists, delete only that file, confirm it
   is gone, then re-run read-only `git status --short` and reconcile paths again.
3. Never delete another `.git` file, run recovery commands, or emit a handoff while a lock remains.

## Trace the requirements

For every requirement and acceptance criterion, record one status:

- `VERIFIED`
- `PARTIALLY VERIFIED`
- `NOT IMPLEMENTED`
- `INCORRECT`
- `NOT VERIFIABLE`
- `OUT OF SCOPE`

Trace each one to the implementing code and concrete evidence. Inspect relevant positive flows, applicable negative flows, affected consumers, and regressions. A passing command is useful only when it tests the required behavior.

## Adversarial review

Attempt to invalidate the happy path with conditions relevant to the change: invalid or absent input, stale or missing data, duplicate action, partial failure, authorization/RLS failure, locale expansion, small viewport, changed consumer, or repeated execution. Mark a branch `not applicable` only with a concrete reason.

For current Mantine/TailAdmin UI, check the current design-system and Storybook proof path. For legacy shadcn/Tailwind UI, apply only the legacy rule bundle. For UI changes, verify rendered behavior at the viewports/locales required by the selected QA profile; source inspection or a passing unit test does not replace required visual proof.

For UI visual work, independently rebuild a visual source trace from the actual source and diff before accepting the
executor's explanation:

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Required disposition | Evidence |
|---|---|---|---|---|---|

Trace utility classes to generated CSS semantics and variables to concrete tokens. Verify every task-named changed,
preserved, or out-of-scope sibling artifact against both source and rendered proof. Do not accept "not found" when
the task or source names markup, a utility, a selector, or a token that has not been opened and traced. Treat a
missing or incorrect trace as insufficient evidence and apply the decision rules accordingly.

Independently verify the task's canonical UI decision record for each changed visible artifact. Open the cited
canonical story and source, repeat enough of the repository search to verify a claimed absence, and compare the
record to the real diff. A `reuse` decision must consume the shared source without a copied local style. An `extend`
or `create canonical` decision must add or update the shared owner, its toolbar-reactive canonical Storybook proof,
and every required catalog/coverage registration in the same diff. Treat a missing record, an uncited "no story" claim, a
component-local raw value, or an allowlisted raw value without shared provenance as a `P1 HIGH` finding; it blocks
approval even when token or typecheck gates are green.

Reconcile the task's change/preserve/out-of-scope classifications with the original owner request and available
visual evidence. If an artifact marked preserved is a plausible cause of the unresolved defect or prevents an
acceptance criterion, record a `P1 HIGH - TASK SPECIFICATION DEFECT` and return `NEEDS REVISION` or `PARTIALLY
VERIFIED`; do not approve implementation merely because it followed the faulty scope.

When a task claims a new validation or regression gate, verify that it asserts observable behavior. Q4 gate claims require planted-violation failure proof. Do not accept a test that only mirrors an implementation detail, is weakened to pass, or fails to exercise the changed flow.

## Findings

List confirmed findings before any summary. Every finding must include:

- severity: `P0 BLOCKER`, `P1 HIGH`, `P2 MEDIUM`, `P3 LOW`, or `NOTE`;
- requirement IDs;
- precise location;
- observed behavior and expected behavior;
- evidence and impact;
- required correction and verification method.

Use `NEEDS VERIFICATION` for a plausible issue that the available evidence cannot confirm. Do not convert style preferences into blocking findings or hide a functional defect as a note.

## Decision rules

Return exactly one decision:

- `APPROVED` only when all primary requirements and acceptance criteria are verified, the selected QA evidence is complete, and no unresolved P0/P1/P2 findings remain.
- `APPROVED WITH NOTES` only when the approval conditions are met and only P3 findings or notes remain.
- `NEEDS REVISION` when a requirement is wrong or incomplete, a blocking finding remains, or required evidence is missing without an acceptable reason.
- `PARTIALLY VERIFIED` when implementation was inspected but the evidence cannot support final approval.
- `BLOCKED` when required access, context, owner decision, environment, or dependency prevents meaningful review.

Never use optimistic wording to disguise a non-approved verdict.

## Required review output

Use these headings in order:

1. `Decision`
2. `Confidence`
3. `Blocking findings`
4. `Non-blocking findings`
5. `Requirement coverage`
6. `Validation evidence`
7. `Missing evidence and limitations`
8. `Owner-native validation handoff` - list every unrun task-required check as exact Windows PowerShell commands, or
   state `None` when all required checks were actually run.
9. `Required next actions`
10. `Reviewer self-check`

In the self-check, confirm that the review inspected evidence rather than summaries, preserved every explicit requirement, applied the right current/legacy UI route and QA profile, considered applicable failure paths, and made a decision consistent with the evidence.
