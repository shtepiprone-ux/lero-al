# Task 254 — Migrate queued tasks to the new concrete Sonnet task template

Type:        chore
Priority:    high
Area:        tasks / governance / backlog hygiene

Pre-read:
1. docs/backlog.md
2. docs/agent-contract.md
3. docs/rule-index.md
4. docs/orchestrator-role.md
5. docs/ai-behavior.md
6. Task 253 session log
7. All pending / queued task files under:
   - tasks/Epics/
   - tasks/Sprints/

Localization coverage:
- N/A for runtime UI, because this is a task-file/governance migration.
- Do not edit messages/*.json.
- Preserve locale requirements inside migrated tasks where relevant.

Responsive coverage:
- N/A for runtime UI, because this is a task-file/governance migration.
- Preserve responsive requirements inside migrated UI/layout tasks where relevant.

## Role contract

You are Opus 4.7 acting as the lero-al orchestrator / architect / reviewer.

For this task, you may edit only task-planning and governance files:

- tasks/Epics/
- tasks/Sprints/
- docs/backlog.md
- docs/sessions/

You are NOT allowed to change product code.

Do not edit:

- src/
- app/
- components/
- modules/
- database logic
- migrations
- server actions
- runtime UI
- styling
- locale message files

This is a task migration / backlog hygiene task only.

## Problem

Task 253 introduced the new compact AI governance structure and concrete Sonnet task template.

However, existing queued tasks may still use the old abstract format.

Risk:

- Sonnet may receive an old queued task.
- The old task may say what to change but not what must remain working.
- Existing controls may disappear silently.
- A moved editable control may become a read-only label.
- The task may say “read all docs” instead of using docs/rule-index.md.
- Acceptance criteria may be too abstract to review reliably.

## Goal

Rewrite all pending / queued future tasks so they follow the new concrete Sonnet task template created by Task 253.

The migration must preserve original intent and scope.

This task must NOT create new product requirements.

This task must NOT expand old tasks into new features.

## Required investigation

Before editing, create an inventory in the session log:

| Task | File | Current status | Needs migration? | Reason |
|---|---|---|---|---|

Inspect all task files under:

- tasks/Epics/
- tasks/Sprints/

Only migrate tasks that are:

- pending;
- not started;
- queued for future execution;
- not already completed;
- not already superseded;
- not historical final reports.

Do not rewrite completed task reports.

Do not rewrite historical session logs.

## Migration rules

For every queued task that needs migration:

1. Preserve the original task number.
2. Preserve the original task title unless it is unclear.
3. Preserve original Epic/Sprint placement.
4. Preserve original business goal.
5. Preserve original scope.
6. Add `docs/agent-contract.md` to Pre-read.
7. Replace “read all docs” with task-relevant docs from `docs/rule-index.md`.
8. Add current behavior preservation if the task touches UI, forms, controls, admin tables, profile flows, server mutations, or lifecycle actions.
9. Add required after-behavior.
10. Replace abstract AC with literal behavioral AC.
11. Add explicit Out of scope.
12. Add required validation.
13. Add final report requirements.
14. Preserve sq/en/uk/it requirements where user-facing text may change.
15. Preserve breakpoint requirements where UI/layout may change.

## Mandatory UI/control preservation rule

For every migrated UI/control task, add:

```text
Any existing control must either:
- remain;
- move to a specified new place;
- or be explicitly listed as removed.

Silent removal is forbidden.
```

## Mandatory control relocation rule

For every migrated task that moves a control, add:

This task may change WHERE the control appears, but it must not remove the underlying capability.

If the old location becomes read-only, the new editable location must be implemented in the same task.

A read-only label is not a replacement for an editable control.

The task is incomplete if the user can no longer perform the action after the change.

## Mandatory admin table rule

For every migrated admin table task, add:

Before changing the table, inventory:
- columns;
- row click behavior;
- row actions;
- inline controls;
- filters;
- search;
- pagination;
- sort;
- empty state;
- loading state;
- mobile layout.

After the change, every existing admin action must remain reachable unless explicitly removed by the owner.

## Mandatory edit-flow rule

For every migrated profile/edit-flow task, add:

Every field/action that was editable before must remain editable unless explicitly removed.

If editing moves from one component to another, the new component must include:
- editable input/select/switch/control;
- validation;
- save behavior;
- loading state;
- success state;
- error state;
- persisted value after refresh;
- localization if text changed;
- mobile usability.

## Out of scope

- Do not change product code.
- Do not create new feature requirements.
- Do not change task numbers.
- Do not move tasks between Epics/Sprints unless the current location is clearly wrong.
- Do not rewrite completed tasks.
- Do not rewrite historical final reports.
- Do not rewrite historical session logs.
- Do not delete tasks.
- Do not merge unrelated tasks.
- Do not expand task scope beyond the owner’s original intent.

## Acceptance criteria

- All pending / queued task files are inventoried.
- Every task that needs migration is rewritten using the new concrete template.
- Completed tasks and historical reports are not rewritten.
- Original task numbers are preserved.
- Original scope is preserved.
- Old “read all docs” wording is removed from migrated pending tasks.
- Migrated tasks use docs/rule-index.md for task-specific pre-read docs.
- UI/control tasks include current behavior preservation.
- Control relocation tasks include the control relocation rule.
- Admin table tasks include the admin table rule.
- Edit-flow tasks include the edit-flow rule.
- Abstract AC are replaced with behavioral AC.
- docs/backlog.md is updated with Task 254.
- A session log is added under docs/sessions/.
- No product code is changed.
- No locale message files are changed.
- Ready-to-run git commands are provided for the owner.

## Required validation

Run or document why impossible:

- grep/check that migrated pending tasks do not say “read all docs”
- grep/check that migrated pending tasks reference docs/agent-contract.md
- grep/check that migrated pending tasks reference docs/rule-index.md where relevant
- grep/check that Task 254 appears in docs/backlog.md
- grep/check that docs/sessions/ contains a Task 254 session log

Do not run mutating git commands.

## Final report required from Opus

Return:

1. Files changed.
2. Inventory of queued tasks reviewed.
3. List of tasks migrated.
4. List of tasks intentionally not migrated and why.
5. Confirmation that task numbers were preserved.
6. Confirmation that completed tasks were not rewritten.
7. Confirmation that no product code changed.
8. Validation performed.
9. Ready-to-run git commands for the owner.