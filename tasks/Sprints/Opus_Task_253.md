# Task 253 — Compress AI governance rules and enforce concrete task templates

Type:        chore
Priority:    high
Area:        docs / governance / orchestration / task templates

Pre-read (mandatory before any docs/task-rule change):
1. docs/backlog.md
2. docs/ai-behavior.md
3. docs/orchestrator-role.md
4. docs/ui-rules.md
5. docs/component-rules.md
6. docs/qa-rules.md
7. docs/data-access-rules.md
8. docs/rls-rules.md
9. docs/domain-rules.md
10. docs/env.md
11. docs/governance-checklists.md
12. docs/responsive-governance.md
13. docs/component-governance.md
14. recent task examples under tasks/Epics/
15. recent task examples under tasks/Sprints/

Localization coverage:
- N/A for runtime UI, because this is a docs/governance-only task.
- Do not edit messages/*.json.
- Future task templates must preserve the project-wide runtime locale rule: sq/en/uk/it for any user-facing text change.

Responsive coverage:
- N/A for runtime UI, because this is a docs/governance-only task.
- Do not edit rendered UI.
- Future task templates must preserve the project-wide responsive rule: 320, 375, 390, 768, 1280, 1440, 2560 for any UI/layout change.

## Role contract

You are Opus 4.7 acting as the lero-al orchestrator / architect / reviewer.

For this task, you are allowed to create and update governance and task-rule files in:

- docs/
- tasks/Epics/
- tasks/Sprints/

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

This is a docs/governance/task-template refactor only.

## Problem

The project has accumulated too many AI/governance rules across docs/.

Current symptoms:

- Sonnet 4.6 sometimes follows one visible rule but ignores another.
- Opus 4.7 sometimes creates tasks that are too abstract.
- Tasks sometimes describe what to change, but not what must remain working.
- Existing editable controls can disappear silently.
- A moved editable control can accidentally become a read-only label.
- Session logs and final reports are sometimes treated as proof, even though only actual diff review is proof.
- “Read all docs” is no longer reliable because the rule set is too large.

Example failure class:

A task says:

> Move user status editing from the admin users table to the user profile edit flow.

Sonnet removes the editable status control from the table, but does not implement a working editable status control in the profile edit flow. The status becomes only a read-only label, so the admin can no longer change it.

This is an orchestration/template failure.

Future tasks must make this regression class impossible.

## Goal

Reorganize the AI/governance rules into a smaller, enforceable hierarchy.

The goal is NOT to add another massive rule file.

The goal is to create a compact system where every future Sonnet task has:

1. A short mandatory P0 contract.
2. Only task-relevant pre-read docs.
3. Current behavior preservation.
4. Concrete required after-behavior.
5. Literal behavioral acceptance criteria.
6. Runtime validation expectations.
7. Opus diff-review checklist.

## Required investigation

Before editing files, inspect and document in the session log:

1. Where the current canonical task template lives.
2. Which rules are duplicated between docs/ai-behavior.md and docs/orchestrator-role.md.
3. Which rules are duplicated across other governance docs.
4. Which rules are already covered by Note 18, Note 19, and Note 20 in docs/ai-behavior.md.
5. Which files currently act as mandatory rules for every task.
6. Which docs should become task-type-specific references instead of always-loaded docs.
7. Whether any existing task files already use a better concrete behavior-preservation structure.
8. Which existing docs must remain reference-only instead of mandatory pre-read docs.

Do not treat every historical session log as a mandatory rule source.

Session logs are history/evidence, not the primary rule source.

## Mandatory migration map

Before changing docs, create a migration map in the session log.

The migration map must show:

| Existing rule / section | Current file | New source of truth | Action |
|---|---|---|---|
| Global task numbering | docs/backlog.md / docs/ai-behavior.md | Keep existing source | Preserve |
| Canonical Task Template | docs/ai-behavior.md | Updated canonical template location | Refactor |
| Note 18 self-validation | docs/ai-behavior.md | docs/agent-contract.md + reference in ai-behavior.md | Preserve intent, reduce duplication |
| Note 19 UX-flow preservation | docs/ai-behavior.md | docs/agent-contract.md + task template behavior section | Preserve intent |
| Note 20 control preservation | docs/ai-behavior.md | docs/agent-contract.md + control relocation rule | Preserve intent |
| Localization sq/en/uk/it | existing governance docs | single source of truth + references | Deduplicate |
| Responsive breakpoints | existing governance docs | single source of truth + references | Deduplicate |
| Git ownership rule | existing governance docs | docs/agent-contract.md or existing stronger source of truth | Deduplicate |
| Validation rules | docs/ai-behavior.md / docs/qa-rules.md / governance docs | single source of truth + references | Deduplicate |
| Session log requirements | docs/ai-behavior.md / docs/backlog.md / task template | single source of truth + references | Deduplicate |
| Existing-control preservation | docs/ai-behavior.md Note 20 / task prompts | docs/agent-contract.md + task template + references | Preserve and strengthen |

Rules:

- Do not delete the intent of Note 18, Note 19, or Note 20.
- Do not weaken any existing governance rule.
- If a rule is moved, leave a reference/link from the old location.
- If a rule is duplicated, choose one source of truth and replace duplicates with references.
- If unsure whether a rule is obsolete, preserve it as reference-only instead of deleting it.
- The final result must be smaller and easier to follow than the current scattered rule set.

## Required docs changes

Create or update the following structure:

```text
docs/
  agent-contract.md
  rule-index.md
  orchestrator-role.md
  ai-behavior.md

If a file already exists, update it instead of duplicating it.

If a better existing file should be the source of truth, use that file and explain why in the session log.

## Required implementation

1. Create docs/agent-contract.md

Create docs/agent-contract.md as the short P0 source of truth for future Sonnet tasks.

It must stay short.

It must include this P0 contract:

## Agent Contract

### P0 Sonnet Contract

- Do not change scope.
- Do not invent architecture.
- Do not remove existing functionality unless explicitly authorized.
- Do not replace an editable control with a read-only label unless the new editable location is implemented in the same task.
- Preserve existing UX flow unless the task explicitly changes it.
- Every UI/control change must define current behavior and required after behavior.
- Every new/changed user-facing string must cover sq/en/uk/it.
- UI changes must be checked at 320, 375, 390, 768, 1280, 1440, 2560.
- Run required validation before claiming complete.
- Update docs/backlog.md and docs/sessions/.
- Provide ready-to-run git commands for the owner; Sonnet must not run git.

Do not expand this into a long essay.

This file must become the mandatory first pre-read for future Sonnet tasks.

2. Create docs/rule-index.md

Create docs/rule-index.md.

Future tasks must not say:

Read all docs.

Instead, future tasks must include only the relevant docs for the task type.

The rule index must include at minimum:

## Rule Index

### Always required

- docs/agent-contract.md
- docs/backlog.md

### UI / layout / component task

Required:
- docs/ui-rules.md
- docs/component-rules.md
- docs/qa-rules.md

Only if relevant:
- docs/component-governance.md
- docs/responsive-governance.md
- docs/responsive-screenshot-governance.md
- docs/governance-checklists.md
- docs/tailwind-governance.md
- docs/tailwind-canonical-fragments.md

### Admin table / admin control task

Required:
- docs/ui-rules.md
- docs/component-rules.md
- docs/domain-rules.md
- docs/rls-rules.md
- docs/qa-rules.md

Only if relevant:
- docs/component-governance.md
- docs/governance-checklists.md
- docs/state-authority.md

### DB / server action / RLS task

Required:
- docs/data-access-rules.md
- docs/rls-rules.md
- docs/domain-rules.md
- docs/qa-rules.md

Only if relevant:
- docs/state-authority.md
- docs/app-lifecycle-contract.md

### Email / auth lifecycle task

Required:
- docs/env.md
- docs/domain-rules.md
- docs/qa-rules.md

Only if relevant:
- docs/integrations.md
- docs/app-lifecycle-contract.md

### Performance task

Required:
- docs/performance.md
- docs/qa-rules.md

Only if relevant:
- docs/responsive-screenshot-governance.md
- docs/responsive-screenshot-matrix.md

### Analytics / SEO task

Required:
- docs/analytics-rules.md
- docs/env.md
- docs/qa-rules.md

### Storybook / visual snapshot task

Required:
- docs/storybook-governance.md
- docs/storybook-visual-snapshots.md
- docs/component-rules.md
- docs/qa-rules.md

Only if relevant:
- docs/responsive-screenshot-governance.md
- docs/responsive-screenshot-matrix.md

### Tailwind / styling governance task

Required:
- docs/tailwind-governance.md
- docs/tailwind-canonical-fragments.md
- docs/tailwind-entropy-audit.md
- docs/ui-rules.md
- docs/qa-rules.md

### Component catalog / coverage task

Required:
- docs/component-catalog.md
- docs/component-catalog-governance.md
- docs/component-coverage-matrix.md
- docs/component-risk-register.md
- docs/component-rules.md
- docs/qa-rules.md

### Docs-only / governance task

Required:
- docs/agent-contract.md
- docs/orchestrator-role.md
- docs/backlog.md

Only if relevant:
- docs/ai-behavior.md
- docs/governance-checklists.md
- docs/governance-enforcement.md

Adjust exact bundles based on existing docs, but preserve the principle:

Future Sonnet tasks must load only task-relevant rules.

## 3. Update docs/orchestrator-role.md

Update docs/orchestrator-role.md so Opus follows the new orchestration standard.

It must clearly state:

Opus may create/update governance docs and task files.
Opus must not change product code unless explicitly instructed by the owner.
Opus creates concrete Sonnet prompts.
Opus must avoid abstract task wording.
Opus must require current behavior preservation.
Opus must require task-type-specific pre-read docs from docs/rule-index.md.
Opus must review the actual diff, not only Sonnet’s final report.
Opus must reject work if an existing capability disappears silently.
Opus must create a follow-up task when AC are not satisfied.

Add this mandatory review rule:

- Opus approval is allowed only after actual diff review.
- Sonnet's final report is not proof.
- The actual changed files are the proof.

## 4. Refactor docs/ai-behavior.md

Refactor docs/ai-behavior.md so it does not remain an ever-growing dumping ground.

Requirements:

Keep the existing important rules.
Preserve the intent of Note 18, Note 19, and Note 20.
Link to docs/agent-contract.md as the P0 source of truth.
Link to docs/rule-index.md for task-type pre-read selection.
Remove or consolidate duplicated rules where safe.
Do not duplicate the full P0 contract in many files.
Keep long explanations as references, not as mandatory full-read material for every task.
Preserve the global task numbering rule.
Preserve the canonical task-template requirement.
Preserve the owner-runs-git rule.
Preserve the session-log requirement.
Preserve validation requirements, but avoid copying the same validation text into many places.

##5. Update the canonical future task template

Update the canonical task template in the correct source-of-truth location.

The future task template must keep the existing project structure, but become more concrete and behavior-based.

It must include this structure:

# Task <N> — <Concrete task title>

Type:        <bug | feature | refactor | chore | UX>
Priority:    <critical | high | medium | low>
Area:        <component / module / domain area>

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. Task-relevant docs from docs/rule-index.md
4. Inspect package.json for current validation scripts.

Localization coverage:
- sq, en, uk, it for any UI/text task
- N/A only if the task has zero user-facing text

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 for any UI/layout task
- N/A only if the task does not touch rendered UI

Current behavior to preserve:
Before editing, inspect and document:
- affected route/component;
- existing controls;
- existing editable controls;
- existing read-only labels;
- existing server actions/API routes;
- existing success/error behavior;
- existing mobile behavior.

Any existing control must either:
- remain;
- move to a specified new place;
- or be explicitly listed as removed.

Silent removal is forbidden.

Bug / Goal:
<Concrete problem or goal. No abstract wording.>

Required after behavior:
As <role>, on <route/surface>:
1. <exact action>
2. <expected UI behavior>
3. <expected mutation/server behavior>
4. <expected success state>
5. <expected error state>
6. <expected behavior after refresh/revalidation>

Required investigation:
1. <step>
2. <step>

Acceptance criteria:
- <literal behavioral AC>
- <literal behavioral AC>
- Existing working controls/flows are preserved unless explicitly removed.
- 0 new lint errors / 0 new warnings.
- Typecheck passes or any pre-existing failures are clearly documented.
- npm run build passes.
- Relevant governance checks pass.
- All four locales render correctly at runtime if UI/text changed.
- All seven breakpoints render correctly if UI/layout changed.
- docs/backlog.md is updated.
- docs/sessions/ contains a task session log.
- Ready-to-run git commit commands are provided as plain text for the owner.

Out of scope:
- <explicit forbidden change>
- <explicit forbidden refactor>
- <explicit forbidden architecture change>

## 6. Add mandatory control relocation rule

Add this as a mandatory future rule:

Control relocation rule:

This task may change WHERE the control appears, but it must not remove the underlying capability.

If the old location becomes read-only, the new editable location must be implemented in the same task.

A read-only label is not a replacement for an editable control.

The task is incomplete if the user can no longer perform the action after the change.

This rule is mandatory for:

- user status changes;
- listing status changes;
- moderation actions;
- role/permission changes;
- delete/archive/block/suspend actions;
- admin table row actions;
- profile edit actions;
= modal/dialog actions.

## 7. Add mandatory admin table rule

Add this as a mandatory future rule for admin table tasks:

Admin table preservation rule:

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

## 8. Add mandatory edit-flow rule

Add this as a mandatory future rule for profile/edit flows:

Edit-flow preservation rule:

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

### Deduplication requirements

Do not duplicate the same rule across many files.

Deduplicate or centralize references for:

localization rules;
responsive breakpoint rules;
git ownership rules;
no-hardcode rules;
canonical component rules;
validation rules;
session log requirements;
existing-control preservation rules;
task pre-read rules.
scope-control rules.
actual-diff-review rules.

When a rule already exists in multiple places:

Choose one source of truth.
Keep the source of truth.
Replace duplicates with links/references where safe.
Do not delete important historical context unless clearly obsolete.

### Out of scope

Do not change product code.
Do not refactor application components.
Do not edit routes.
Do not edit server actions.
Do not edit database logic.
Do not edit migrations.
Do not edit locale messages.
Do not rewrite all historical session logs.
Do not delete historical docs unless clearly duplicated or obsolete.
Do not create another massive rule document.
Do not make every doc mandatory reading for every future task.
Do not rename historical task files.
Do not weaken Note 18, Note 19, or Note 20.
Do not replace behavior-preservation rules with vague wording.

### Acceptance criteria

- docs/agent-contract.md exists and is short.
- docs/agent-contract.md contains the P0 Sonnet Contract.
- docs/rule-index.md exists and maps task types to relevant docs.
- docs/orchestrator-role.md is updated to require compact concrete tasks.
- docs/orchestrator-role.md requires actual diff review before approval.
-  docs/ai-behavior.md references the new contract/index instead of duplicating every rule.
- The intent of Note 18 self-validation is preserved.
- The intent of Note 19 UX-flow preservation is preserved.
- The intent of Note 20 existing-control preservation is preserved.
- The session log contains a migration map showing where each major old rule now lives.
- The canonical future task template no longer encourages “read all docs”.
- Future UI/control tasks require current behavior preservation.
- Future control-relocation tasks include the control relocation rule.
- Future admin table tasks include the admin table rule.
- Future edit-flow tasks include the edit-flow rule.
- Duplicated rules are reduced or clearly linked to one source of truth.
- docs/backlog.md is updated with Task 253.
- A session log is added under docs/sessions/.
- No product code is changed.
- No locale message files are changed.
- Ready-to-run git commands are provided for the owner.

### Required validation

Run or document why impossible:

- npx tsc --noEmit
- npm run build
- relevant docs/governance checks if available
- grep/check that future templates do not say “read all docs”
- grep/check that Task 253 appears in docs/backlog.md
- grep/check that docs/sessions/ contains a Task 253 session log
- grep/check that docs/agent-contract.md exists
- grep/check that docs/rule-index.md exists
- grep/check that Note 18, Note 19, and Note 20 are still preserved or referenced

Do not run mutating git commands.

### Final report required from Opus

Return:

1. Files changed.
2. New rule hierarchy.
3. Migration map summary.
4. Which duplicated rules were consolidated.
5. Where the new P0 contract lives.
6. Where the new rule index lives.
7. Where the compact task template lives.
8. How future Sonnet prompts should select docs.
9. How future Opus reviews must verify Sonnet output.
10. Any remaining docs/governance debt.
11. Validation performed.
12. Ready-to-run git commands for the owner.