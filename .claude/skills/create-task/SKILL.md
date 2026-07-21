---
name: create-task
description: Create a repository-backed, executable implementation task for Lero.al. Use for feature, bug-fix, migration, refactor, UI, or governance task design and handoff. Do not use to implement product code or review completed work.
---

# Create an implementation task

Apply this protocol to the request below. The finished implementation kickoff must be saved under `tasks/`; a chat-only handoff is insufficient.

Request:

$ARGUMENTS

## Role and boundary

Act as the task architect. Produce an executable, evidence-based task for a fresh Sonnet session. Do not implement product code while using this skill.

## Gather evidence before writing

1. Classify the request and state the task type.
2. Read `CLAUDE.md`, `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/orchestrator-procedures.md`, `docs/rule-index.md`, `docs/qa-profiles.md`, and `docs/backlog.md`.
3. Select and read the minimal task-specific rule bundle from `docs/rule-index.md`.
4. Inspect the affected source, existing behavior, nearby patterns, tests, stories, and current diff when relevant.
   For every UI artifact, search the canonical Mantine Storybook scope, `docs/component-catalog.md`,
   `src/design-system/mantine/patterns/`, and the matching current/legacy primitive library before proposing a
   style or component. Open each candidate story and its imported source; a filename or a semantic search hit alone
   is not canonical-source evidence.
5. State verified facts separately from assumptions and unresolved questions.

Do not invent file paths, current behavior, APIs, commands, test results, or user decisions. Do not write `read all docs`; name the exact pre-read bundle needed by the executor.

## Build the requirement ledger

Normalize every explicit requirement before decomposition.

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | User, task, or rule | Specific required outcome | P0-P3 | Named test, rendered evidence, or inspection | Confirmed, Assumed, Ambiguous, or Conflicting |

Every acceptance criterion and every expected review finding must map to one or more requirement IDs.

## Define the implementation contract

The task must contain all of the following:

1. A precise, outcome-oriented title and objective.
2. Verified context, including exact affected files only when inspected.
3. Scope and explicit out-of-scope boundaries.
4. Current behavior to preserve and the required after behavior.
5. Atomic functional requirements and relevant technical constraints.
6. One positive flow and a negative-flow applicability table. Mark irrelevant branches `No` with the existing owner or reason; do not invent scope for every possible failure mode.
7. Acceptance criteria in `ACn [R...] Given / when / then` form.
8. The selected `Q0`-`Q4` QA profile, why it applies, and the exact evidence required.
9. A verification plan with only commands, stories, viewports, locales, or manual steps known from the repository and selected rule bundle. Every non-Q0 plan must include the final `npm run build` hard gate and require its actual zero-exit transcript; a failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.
10. A completion-report contract for Sonnet: changed files, completed requirement IDs, commands run and actual results, evidence locations, assumptions, deviations, limitations, and unresolved issues.

The implementation handoff must direct Sonnet to the saved task path and the `execute-task` workflow. It must require
an `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` status, never self-approval.
Sonnet updates `docs/backlog.md` with concise current state and writes the detailed session log; Opus validates and
consolidates those records during review.

For UI work, explicitly classify each affected surface as current Mantine/TailAdmin or legacy shadcn/Tailwind. Identify the applicable Storybook or rendered proof path. In verified context, create a visual source map for every affected visible artifact and every visually related artifact that the task says to preserve or exclude:

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|

Trace utility classes to their generated CSS semantics and CSS variables to their concrete tokens. State whether each artifact is changed, preserved, or out of scope. Never describe a visual root cause or preservation boundary only by a broad term such as "gradient", "border", or "shadow" when inspected markup, classes, selectors, or tokens can name it precisely. Require the visual profile from `docs/qa-profiles.md`; never promote a logic-only change to a full visual matrix without a concrete risk reason.

Also include a canonical UI decision record in the kickoff for every changed visible artifact:

| Visible artifact | Search queries and inspected paths | Canonical Mantine Story / source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|

The disposition is exactly `reuse`, `extend`, or `create canonical`. `reuse` requires Sonnet to consume the source
without copying its styles locally. `extend` requires the canonical owner and story to change once for all in-scope
consumers. `create canonical` is allowed only after an evidenced search finds no suitable source; it requires a new
shared primitive/pattern/token in the correct library, a toolbar-reactive canonical story added or updated to prove
it, and applicable catalog or coverage registration in the same task. Do not hand Sonnet an uncited "no story exists" assertion. If the required
visual value has no TailAdmin/design-system provenance, leave the task `BLOCKED - CANONICAL STYLE DECISION REQUIRED`
for the owner instead of authorizing a guessed local value.

Reconcile that source map with the owner's stated rendered outcome and any supplied visual evidence. A `preserve` or
`out of scope` classification requires positive evidence that the artifact cannot cause the reported defect or
prevent an acceptance criterion. It does not override explicit owner intent. If the artifact remains a plausible
cause, either place its change in scope or surface an owner decision as `AMBIGUOUS` or `CONFLICTING`; never publish a
self-contradictory task as ready for execution.

For a critical flow, name the registry entry and require automated regression evidence. For changed tests or gates, require assertions of observable behavior rather than implementation detail.

## Quality gate before publication

Do not publish the first draft. Check all of the following and revise the task if any answer is no:

- A fresh Sonnet session can execute it without hidden chat context.
- Every primary requirement has at least one binary acceptance criterion and one verification method.
- Scope protects existing behavior and names what must not change.
- The current/legacy UI boundary, QA profile, locale needs, and Storybook obligations are explicit when applicable.
- A UI task traces each changed visual artifact and each task-named preserved sibling to inspected markup, styling,
  and tokens; a fresh executor can distinguish a ring from a border, gradient, overlay, or hover state.
- Every changed UI artifact has a canonical UI decision record backed by inspected search evidence; a `reuse` result
  forbids copied local styles, while an `extend` or `create canonical` result names the shared owner, canonical
  story, and required catalog/coverage registration.
- The trace's change/preserve/out-of-scope classifications agree with the owner-requested rendered result and any
  supplied visual evidence; a plausible source of the defect was not incorrectly protected as a preserved sibling.
- Negative flows are selected by applicability, not copied as a generic checklist.
- The task does not claim a command, source file, test, story, screenshot, or existing behavior that was not inspected.
- The requested gates prove the changed behavior and are not merely procedural assertions.
- Assumptions and unresolved decisions are visible to the executor and reviewer.

## Required task document structure

Use these headings in the saved task file:

1. `Mode and task type`
2. `Objective`
3. `Verified context`
4. `Requirements`
5. `Assumptions and open questions`
6. `Pre-read rule bundle`
7. `Scope`
8. `Out of scope`
9. `Current and required behavior`
10. `Implementation requirements`
11. `Positive and negative flows`
12. `Acceptance criteria`
13. `QA profile and verification plan`
14. `Completion report contract`
15. `Task quality gate`

End the response with the task path, the selected QA profile, the requirements that remain ambiguous or conflicting, and any owner decision still needed.

## Owner-run Git handoff

After saving and verifying the task artifact, emit an owner-run commit handoff when this task design changed task or
documentation artifacts. List every changed path explicitly, then provide only:

```powershell
git add <explicit-task-or-doc-paths>
git commit -m "docs(TaskN): <short description>"
```

Never execute the commands. Never use `git add -A`, `git add -u`, wildcards, `git push`, or a command that stages an
uninspected file. Before emitting the handoff, inspect read-only `git status --short` and reconcile all changed or
untracked paths with the task/document artifacts created in this session. Include every reconciled artifact exactly
once. List unrelated parallel changes as `EXCLUDED AS UNRELATED` without staging them; they do not block a handoff.
Use `STATUS/REPORT MISMATCH` only for a path that should belong to this task/design but is missing, undocumented, or
ambiguous, and withhold the handoff only in that case.
Also inspect `.git/index.lock` before the handoff. If active Git processes exist, return `GIT WRITE BLOCKED` and do
not emit a handoff. If no Git process is active, delete only the exact project-local `.git/index.lock`, confirm it is
gone, re-run read-only `git status --short`, and reconcile paths again. Do not delete another `.git` file or run Git
recovery commands.
