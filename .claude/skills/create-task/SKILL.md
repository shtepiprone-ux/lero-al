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

For any token-consumption requirement, follow [“A documented token is not an implemented token — grep the definition, never the table”](../../../docs/orchestrator-procedures.md).

Before assigning a fact, command, acceptance criterion, or gate `VERIFIED`, read
[`Evidence-first preflight`](../../../docs/orchestrator-evidence-first-preflight.md) and complete the task-design sections of
`docs/orchestrator-evidence-preflight-template.md` in working notes.
Complete `docs/orchestrator-rule-compliance-ledger-template.md` for every selected rule. Do not weaken,
reinterpret, or replace a mandatory rule unless that rule explicitly permits it or a traceable owner decision does.
Complete `docs/orchestrator-execution-contract-template.md` and retain both completed artifacts with the kickoff.
An unresolved owner decision produces a blocked decision note, not a multi-route task for Sonnet.

## Gather evidence before writing

1. Classify the request and state the task type.
2. Read `CLAUDE.md`, `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/orchestrator-procedures.md`, `docs/rule-index.md`, `docs/qa-profiles.md`, and `docs/backlog.md`.
3. Select and read the minimal task-specific rule bundle from `docs/rule-index.md`.
4. Inspect the affected source, existing behavior, nearby patterns, tests, stories, and current diff when relevant.
   For every UI artifact, search the canonical Mantine Storybook scope, `docs/component-catalog.md`,
   `src/design-system/mantine/patterns/`, and the matching current/legacy primitive library before proposing a
   style or component. Open each candidate story and its imported source; a filename or a semantic search hit alone
   is not canonical-source evidence.
   For every claim that a prop, field, callback, selector, token consumer, or API contract is `dead`, `unread`,
   `unused`, `never passed`, `only consumed here`, or otherwise absent, complete the API/data-flow trace in the
   evidence preflight. Read the enclosing declaration, every runtime read, and every construction/forwarding path
   through production callers, stories, and tests. A same-named field on a nested object is not the component's
   root prop: record its exact interface/type and access path before drawing a conclusion. A line-oriented grep,
   a JSX call with no direct prop, or a comment is discovery evidence only, never verification of an absence claim.
5. State verified facts separately from assumptions and unresolved questions.

### Permanent Storybook story creation gate — blocking

Before a task adds or permanently extends a Storybook story, record every inspected candidate story and source, why
each existing candidate cannot provide the required proof, and the final `reuse`, `extend`, or `create canonical`
disposition in the canonical UI decision record. The absence of an API-specific story or a grep match is **not** by
itself authorization to add markup.

When proposed story markup exists only to exercise a selector, gate, regression, or measurement — rather than to
document an in-scope production consumer or an independently owner-approved canonical-coverage requirement — it is a
probe, not a permanent Storybook artifact. Use a reversible probe in an inspected existing story, prove its
before/after result, and restore the story byte-identical before final verification. Do not publish invented permanent
UI merely to manufacture evidence for a gate.

The kickoff must require the restoration **evidence**, not merely the restoration: the story's pre-probe
`git hash-object` value, and the path's absence from `git status --porcelain` after the final gate run. A kickoff
that asks only to "revert the probe" has specified a step no reviewer can check.

`create canonical` or a permanent `extend` is allowed only when the task names the in-scope production consumer or
quotes the owner authorization for independent canonical coverage. If neither exists, publish
`BLOCKED -- STORY CREATION AUTHORIZATION REQUIRED`, not an implementation kickoff.

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
- Every permanent Storybook addition or extension passes the permanent-story creation gate: the decision record
  names the inspected candidates, why reuse is insufficient, the production consumer or owner authorization, and
  why the final markup is not merely a gate probe. Where a reversible probe is used instead, the task names the
  restoration evidence it requires — the pre-probe `git hash-object` value and absence from `git status --porcelain`.
- Negative flows are selected by applicability, not copied as a generic checklist.
- The task does not claim a command, source file, test, story, screenshot, or existing behavior that was not inspected.
- Every material absence/API claim (`dead`, `unread`, `no consumer`, `never forwarded`, `only producer`, or
  equivalent) has a complete property-identity and data-flow trace in the retained preflight. The trace reads the
  enclosing type, all runtime reads, and all production/story/test construction paths; it distinguishes root props
  from nested fields with the same name.
- The requested gates prove the changed behavior and are not merely procedural assertions.
- Every owner-only exception has traceable owner authorization; the task itself is never that authorization.
- Every applicable selected rule has a `COMPLIANT` row in the rule-compliance ledger; no task-authored exception or
  merely plausible alternative can substitute for the rule.
- The retained executable-route contract has exactly one active owner route; its scope, ACs, verification plan,
  report contract, and handoff all derive from that route.
- Every checkpoint names its producer, persisted output, comparator, and failure behavior; dynamic state was checked
  for both zero/empty and non-empty cases.
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
- No requirement, AC, scope boundary, or handoff asserts a material fact as `Confirmed` when its first or only
  verification is deferred to the executor. A task may require an I0 re-measure of an author-verified fact when
  state can drift, but it must retain the author's complete trace and name the re-measure as freshness validation.
  Re-run its evidence trace after the final textual revision; otherwise label it `UNKNOWN` and publish
  `DRAFT — NEEDS EVIDENCE` or `BLOCKED`, not a ready kickoff.
- Assumptions and unresolved decisions are visible to the executor and reviewer.

## Sprint assignment — blocking, check this first

Owner rule, 2026-08-01. **A task may not be created without a sprint.**

1. Read `docs/backlog.md` → "Current sprint" and open `tasks/Sprints/Sprint_NN_*.md` for that sprint.
2. If the task fits an open sprint, save the kickoff as
   `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md` and add its row to that sprint's Tasks table.
3. If nothing fits, **open the next sprint first** — create `tasks/Sprints/Sprint_NN_<Slug>.md` with goal, task
   table, preconditions and exit criteria — then write the kickoff inside it.
4. **Never** write a kickoff to the root of `tasks/`. That is what produced the 621–705 gap: 67 kickoffs with no
   sprint above them, undetected for roughly six weeks until the 2026-08-01 backlog audit, leaving
   `docs/mantine-tailadmin-migration-tracker.md` pointing at slices that had been finished for a month.

Sprint 45 is the after-the-fact name for that unsprinted 621–705 period, not a planned sprint; its kickoffs are
grandfathered at their original paths. Task **706** onward has no exemption.

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
