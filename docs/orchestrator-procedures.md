# Orchestrator Procedures

This file contains the longer procedures that were previously mixed into `docs/agent-contract.md`.
The short contract states the invariants; this file explains how Opus applies them.

## Modes

Classify each request before acting:

- `TASK DESIGN`
- `ORCHESTRATION`
- `IMPLEMENTATION REVIEW`
- `TASK REVIEW`
- `BUG ANALYSIS`
- `QA VALIDATION`
- `RELEASE READINESS`
- `DECISION REVIEW`

State the mode briefly in the output unless the user asked for a tiny direct answer.

## Context acquisition

Before planning, assigning, reviewing, or approving work:

1. Read `CLAUDE.md`, `docs/agent-contract.md`, this file, `docs/rule-index.md`, and `docs/backlog.md`.
2. Select the task-type bundle from `docs/rule-index.md`.
3. Read only the relevant rule files for that bundle.
4. Inspect affected source files, tests, existing patterns, and task history as needed.
5. Inspect the current diff when reviewing implementation work.

Do not rely on filenames, task titles, prior summaries, or a worker's completion report as proof.

## Requirement ledger

For non-trivial task design or review, normalize requirements into a ledger:

| ID | Source | Requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | User/task/docs | Observable requirement | P0/P1/P2/P3 | Test, diff, rendered proof, native check | Confirmed/Assumed/Ambiguous/Conflict |

Every acceptance criterion and every confirmed review finding should map back to one or more requirement IDs.

## Evidence-first preflight (mandatory before task publication or review decision)

Before publishing an implementation kickoff, declaring a task executable, or returning an approval/revision
decision, complete the applicable sections of
[`docs/orchestrator-evidence-preflight-template.md`](orchestrator-evidence-preflight-template.md). This is a
**fail-closed gate**, not optional planning prose.

The preflight must distinguish these evidence layers:

1. **Source semantics:** inspect the exact implementation, enum, conditional branches, and configuration that make
   the claim true. Do not infer an output state, default, selector, or registry behavior from a name, a comment, or
   a prior report.
2. **Command/artifact contract:** for every required command, record its real inputs, output path and schema, matrix
   scope, exit semantics, and every file it writes or can overwrite. A command may prove only properties observable
   in its actual artifact.
3. **Rendered behavior:** keep source rules, computed CSS, geometry, and visual outcome separate. A declaration or
   computed value does not prove rendered geometry; a geometry result does not prove a pixel-level result unless the
   selected QA profile calls for that evidence.
4. **Execution state:** label the plan exactly one of `from-scratch`, `remediation`, or `mixed`. A remediation plan
   must name its start step, reusable artifacts, forbidden re-runs, and every preserved artifact that a command
   could overwrite.
5. **Ownership and sequencing:** reconcile task-owned, unrelated, and ambiguous paths before a handoff. A path
   containing unreviewed work from another task is ambiguous, not implicitly available to stage.

For every material claim, acceptance criterion, and proposed gate, attempt one concrete falsification before relying
on it: inspect a counter-branch, an absent/missing baseline, a different matrix mode, a real enum, a narrow/long
locale UI state, or another relevant failure mode. Record the result as `VERIFIED`, `ASSUMED`, `UNKNOWN`, or
`BLOCKED`.

Do not publish a task as ready for Sonnet when a required command has no valid input at the point it is scheduled,
when a required artifact cannot represent the claimed property, or when a proposed rerun can overwrite the only
baseline. Return `DRAFT — NEEDS EVIDENCE` or stop for an owner decision instead. Do not approve a review while the
same gaps remain.

### Additional rules for baselines, assertions, and revisions

- Name matrices precisely. Never substitute a `fast`, subset, Storybook-only, route-only, or historical result for a
  full-run baseline without proving identical scope.
- Read the code that produces a reported status or verdict. An allowlist entry, configuration name, or expected
  behavior does not create a manifest enum value unless the code assigns one.
- New regression harnesses must fail closed for missing baseline cells, infra failures, absent selectors, and
  unrendered pages. A reason string without a failing result is not an assertion.
- A revision of completed work must begin with an explicit re-entry mode. Preserve prior baseline artifacts by
  default; do not rerun a baseline capture unless a valid pre-change input is available and overwriting is explicitly
  safe.
- For UI migrations, test the smallest observable question. When the only suspected difference is a runtime style
  value, a same-page synthetic measurement may be valid; prove that all other relevant container rules are
  equivalent first, restore temporary state in `finally`, and document the measurement limits.

## Ambiguity policy

Ask the user only when all are true:

1. The answer materially changes architecture, contract, data model, security model, or user-visible behavior.
2. The answer cannot be derived from repository context or accepted decisions.
3. A reversible documented assumption would be unsafe.

Otherwise choose the safest reversible assumption, label it, and keep the task easy to change.

## Task design protocol

Every implementation task must be executable by a fresh Sonnet session with repository access and no hidden chat context.

A valid task includes:

1. Title with a concrete outcome.
2. Objective.
3. Verified context.
4. Scope and out of scope.
5. Functional requirements.
6. Technical constraints.
7. Positive flow.
8. Negative-flow applicability table.
9. Acceptance criteria linked to requirement IDs.
10. QA profile from `docs/qa-profiles.md`.
11. Verification plan with exact commands when known.
12. Completion report contract:
    - files changed;
    - requirement IDs completed;
    - tests and commands run;
    - actual results;
    - assumptions;
    - deviations;
    - known limitations;
    - unresolved issues;
    - evidence needed for review.

For a UI task, add a canonical UI decision record before publishing the kickoff:

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|

Use `reuse` when the canonical story/component already covers the artifact, `extend` when that source is the right
owner for a missing variant, and `create canonical` only when searches prove no suitable source exists. The record
must cite the exact story title/path when available and the component, pattern, theme token, or legacy semantic
token that supplies each visual value. `create canonical` requires the shared source, a canonical Storybook proof
added or updated in the same task, and applicable catalog/coverage updates. If a needed visual value has no approved
provenance, stop task design for `CANONICAL STYLE DECISION REQUIRED`; do not leave Sonnet to choose a local value.

### Canonical Story source-of-truth check (mandatory for Opus before publishing a UI kickoff)

Opus must inspect the source of the corresponding canonical Mantine Story, not merely cite its title or path. The
kickoff's decision record, scope, requirements, and acceptance criteria must then bind the production change to that
Story:

- **Existing Story:** the same task must update or preserve the exact Story so it renders the migrated artifact with
  the same canonical Mantine primitive and applicable states. Opus must not mark that Story out of scope or authorize
  a route-only proof in its place.
- **No Story:** the kickoff must require creation of a canonical Mantine Story before, or in the same task as, the
  consumer migration, plus `scripts/mantine-migration-scope.json` registration and a passing static-import proof from
  `check:story-coverage`.
- **Slot or demo mismatch:** a Story that supplies a static stand-in, legacy control, or other divergent demo through
  a pattern slot does not cover the real production node. Opus must scope an update that renders the real node or an
  equivalent canonical composition Story. If that would change a deliberate boundary, stop task design and ask the
  owner; do not leave the decision to Sonnet or silently exclude the Story.

A kickoff that omits this decision, declares an existing corresponding Story out of scope, or treats a demo stand-in
as Story proof is a task-design defect and must not be handed to Sonnet.

Do not publish a task that says "read all docs." Use `docs/rule-index.md`.
Save an implementation kickoff under `tasks/` using the location and naming rules in `docs/ai-behavior.md`.

## Review protocol

Review implementation evidence, not the author's explanation.

1. Rebuild the requirement ledger from the task.
2. Inspect the actual changed files and diff.
3. Compare changed files to the session log's "Files Changed" table.
4. Trace each requirement to code and validation evidence.
5. Check failure paths that are applicable to the task.
6. Check regressions in affected components and consumers.
7. Apply the selected QA profile from `docs/qa-profiles.md`.
8. For every non-Q0 task, require a final `npm run build` transcript with exit code 0 for the reviewed diff. A
   failed, unrun, or stale build is missing blocking evidence and cannot receive an approval decision.
9. For UI work, compare the canonical UI decision record with the diff and rendered evidence. Reject copied local
   styles when `reuse` was available; require the shared source, canonical story, and registration when `extend` or
   `create canonical` was selected. A missing record or uncited "no story" claim is missing P1 evidence.
10. Produce exactly one decision.

Allowed decisions:

- `APPROVED`
- `APPROVED WITH NOTES`
- `NEEDS REVISION`
- `BLOCKED`
- `PARTIALLY VERIFIED`

Do not approve from a summary. Do not approve when required evidence is missing.

Decision criteria:

- `APPROVED`: all primary requirements and acceptance criteria are verified; selected QA evidence is complete; no
  unresolved P0/P1/P2 findings remain.
- `APPROVED WITH NOTES`: the approval conditions above are met and only non-blocking P3 findings or notes remain.
- `NEEDS REVISION`: a requirement is incomplete/incorrect, required evidence is missing, or a blocking finding
  remains.
- `PARTIALLY VERIFIED`: actual implementation was inspected, but only part of the required evidence is available.
- `BLOCKED`: required access, context, owner decision, environment, or dependency prevents meaningful review.

### Owner-native validation handoff

When sandbox execution, a missing native binary, or a timeout prevents a task-required check, list the exact command
under `Missing evidence and limitations` and repeat it under `Required next actions`. Use the command verified in the
task or repository; on Windows PowerShell prefer `npm.cmd` / `npx.cmd` for Node commands. Include the expected exit
result, report, screenshot, or output to return. Missing validation is not a "low risk" result and cannot support an
approval decision.

## Finding format

Confirmed findings must be specific and actionable:

- Severity: `P0 BLOCKER`, `P1 HIGH`, `P2 MEDIUM`, `P3 LOW`, or `NOTE`.
- Requirement IDs.
- Location.
- Observed behavior.
- Expected behavior.
- Evidence.
- Impact.
- Required correction.
- Verification method.

Label uncertain issues as `NEEDS VERIFICATION`; do not report them as confirmed defects.

## Git policy

Read-only git is allowed for inspection:

- `git status`
- `git diff`
- `git show`
- `git log`
- `git grep`
- commands using `--no-optional-locks` for read-only inspection

Mutating git is owner-only and native PowerShell only, including:

- `git add`
- `git commit`
- `git push`
- `git reset`
- `git restore`
- `git checkout`
- `git stash`
- `git merge`
- `git rebase`
- `git rm`
- `git apply`
- `git clean`
- `git config`

After verified task design that changed task/docs artifacts, or an `APPROVED` / `APPROVED WITH NOTES` review, the
orchestrator may emit explicit-path commit commands for the owner to run, but must not run them. Only after the
`APPROVED` / `APPROVED WITH NOTES` review may Opus append `git push <verified-remote> <verified-branch>` for the
owner. Inspect the current branch and remote/upstream read-only first and replace both placeholders with verified
values; never emit a bare `git push`. A task-design handoff and each non-approved review must omit a push command.
Never emit `git add -A`, `git add -u`, or wildcard staging.

Immediately before the handoff, inspect `git status --short` and the corresponding real diff. Reconcile each status
path with task scope and the session `Files Changed` table. The command lists every reconciled artifact once, including
required `docs/backlog.md` and `docs/sessions/...` updates. Classify every remaining status path as `EXCLUDED AS
UNRELATED` or `AMBIGUOUS`. Explicitly excluded parallel work is not a blocker and must not be staged. Report
`STATUS/REPORT MISMATCH` and withhold the handoff only when a path that should belong to the current task is missing,
undocumented, or ambiguous; never omit a reconciled task artifact or stage a broad set.

Before this reconciliation, inspect `.git/index.lock`. Stale lock cleanup is the sole authorized agent-side `.git`
mutation: first check that no Git process is active; then delete only the exact project-local `.git/index.lock`,
confirm it is absent, and re-run `git status --short`. If a Git process is active or the lock remains, return
`GIT WRITE BLOCKED` and emit no handoff. Never delete another `.git` file or run recovery commands.

If the sandbox view shows corruption, stale files, impossible dirty state, NUL bytes, or truncation, treat it as a
screen only. Ask for owner-native verification or use available CI evidence before issuing a verdict.

## Self-critique before final output

Before returning a task or review:

1. Did I inspect evidence or repeat claims?
2. Did I preserve every explicit user requirement?
3. Did I invent project facts?
4. Did I separate assumptions from decisions?
5. Did I verify applicable failure paths?
6. Are findings specific and actionable?
7. Does the decision match the evidence?

If any answer exposes a gap, revise before returning.
