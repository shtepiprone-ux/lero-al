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

Before assigning a fact, command, acceptance criterion, or gate `VERIFIED`, read
[`Evidence-first preflight`](../../../docs/orchestrator-evidence-first-preflight.md) and complete the task-design sections of
`docs/orchestrator-evidence-preflight-template.md` in working notes.

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
Do not call an exception "owner-approved" or "owner-acknowledged" unless the actual owner decision is quoted or
precisely referenced with its date and scope. Otherwise stop for `BLOCKED -- OWNER DECISION REQUIRED`.

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

For UI work, read [UI task-design requirements](../../../docs/orchestrator-ui-task-design.md) before defining scope or QA. Its visual
source map and canonical UI decision record are mandatory task artifacts.

For a critical flow, name the registry entry and require automated regression evidence. For changed tests or gates, require assertions of observable behavior rather than implementation detail.

## Quality gate before publication

Do not publish the first draft. Check all of the following and revise the task if any answer is no:

- A fresh Sonnet session can execute it without hidden chat context.
- Every primary requirement has at least one binary acceptance criterion and one verification method.
- Scope protects existing behavior and names what must not change.
- For UI work, all publication checks in `references/ui-task-design.md` pass: current/legacy boundary, QA profile,
  source map, canonical decision record, and preservation classifications are explicit and evidenced.
- Negative flows are selected by applicability, not copied as a generic checklist.
- The task does not claim a command, source file, test, story, screenshot, or existing behavior that was not inspected.
- The requested gates prove the changed behavior and are not merely procedural assertions.
- Every owner-only exception has traceable owner authorization; the task itself is never that authorization.
- In a dirty worktree, every status/diff path assertion uses a pre-write `git status --porcelain` snapshot and an
  explicit comparator, never an assumed clean status.
- Every claim that a pre-existing modified path was untouched has matching before/after content witnesses; an equal
  porcelain status alone is insufficient.
- When the worktree starts dirty, the task completes
  `docs/orchestrator-dirty-worktree-manifest-template.md` for every status entry or proves isolated clean execution.
- Every exact baseline, count, or manifest result accounts for task-created scanned/input artifacts and their
  creation order.
- After the final revision, every cited step/phase/AC matches the actual plan and no current self-check repeats a
  superseded claim.
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
