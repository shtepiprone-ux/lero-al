### Task 367 — Process corrective: Task 354 sprawl (12+ corrective sub-sessions on one task) + commit-batch hygiene

> **Status: READY (priority: medium — governance/process).** Docs/governance-only. Opus orchestrator task.
> **No product code.** Allowed to EDIT/WRITE: `docs/`, `tasks/`. Forbidden: `src/`, `app/`, `components/`,
> `modules/`, migrations, `messages/*.json`, package files. Single-writer git: owner commits from PowerShell.

```
Type:     governance / process corrective
Priority: medium
Area:     scope discipline · session-log hygiene · commit cadence
```

## Pre-read (mandatory)
1. `docs/agent-contract.md`
2. `docs/orchestrator-role.md`
3. `docs/backlog.md`
4. `docs/ai-behavior.md` → "Scope Isolation Rules", "Pre-Completion Self-Validation (Note 18)"

## Problem statement (observed 2026-06-02 review)
Task 354 ("admin DS overflow / row-action hardening") expanded into **12+ corrective sub-sessions**
(`task-354-fix-*`, `task-354-fix-2-*`) covering admin-table filtering taxonomy, chevron affordance, global
controls audit, localized storybook feedback, etc. Symptoms of a scope-discipline failure:
- A single task number absorbed many distinct concerns instead of being split into separate numbered tasks.
- Many sub-sessions left work **uncommitted** (the whole 354→361 block sat uncommitted on one working tree),
  which (a) violates the one-commit-per-logical-change rule (Task 264) and (b) is exactly the accumulation that
  triggers the single-writer `.git/index.lock` corruption hazard (`orchestrator-role.md` → Environment & git safety).
- One sub-session (`task-354-fix-corrective-global-controls-audit`) skipped `npm run lint`, justifying it as
  "clause 9 = tsc + build-storybook only" — clause 9 actually lists lint among required validation.

## Goal
Codify rules that prevent this recurring, and document the cleanup decision — WITHOUT rewriting history of the
already-reviewed 354 work.

## Acceptance criteria
- AC1 Add to `docs/ai-behavior.md` (Scope Isolation): a **task-splitting trigger** — when a task accrues a 3rd
  distinct corrective concern, the orchestrator MUST open a new numbered task instead of another `*-fix-*`
  sub-session of the same number. Define "distinct concern" with examples from the 354 sprawl.
- AC2 Add to `docs/orchestrator-role.md`: a **commit-cadence rule** — the orchestrator emits commit commands per
  completed task at review time; uncommitted completed tasks MUST NOT exceed N (recommend N=2) before commits are
  emitted, to bound the single-writer corruption window. Reference the lock incident.
- AC3 Clarify in `docs/agent-contract.md` clause 9 (or `ai-behavior.md` validation section) that **`npm run lint`
  is required** (not optional), closing the loophole used by the 354 corrective sub-session.
- AC4 Add a short retro entry to `docs/backlog.md` documenting the 354 sprawl + the corrective rules, linking the
  relevant session logs.
- AC5 No product code touched; no history rewrite of 354.

## Out of scope
Re-doing or reverting any 354 code · editing `src/`/`messages` · changing the storybook taxonomy already shipped ·
renumbering existing tasks.

## Validation
Docs-only: confirm the four docs render and cross-links resolve; `git diff` shows only `docs/` + `tasks/` changes.
End with a Files Changed table. Orchestrator emits commit commands.
