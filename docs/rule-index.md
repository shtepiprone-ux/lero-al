# Rule Index — pre-read selection for Sonnet 4.6

> **Replaces "Read all docs".** Every Sonnet kickoff must load only the docs listed under the
> matching task type below. Loading 30+ doc files at the top of every task is what produced
> the failure modes Task 253 was filed for — Sonnet follows one visible rule and ignores another.

## How to use this file

1. The orchestrator selects ONE primary task type from the list below.
2. The kickoff `Pre-read` section lists:
   - the **Always required** block (every task),
   - the matching task type's **Required** block,
   - any **Only if relevant** entries that actually apply to this kickoff.
3. Anything outside that list stays unread — by design. The relevant rule still exists; it is
   just not in scope for this task.

If a task spans two types (e.g. "admin table change + email lifecycle"), include both bundles.

## Always required (every task, every type)

- `docs/agent-contract.md`
- `docs/backlog.md`

## UI / layout / component task

**Required:**
- `docs/design-system.md` ← **canonical Global Responsive Design System Contract v1 (Task 340)** — read first for any layout/responsive/container/data-surface/overlay work
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

**Only if relevant:**
- `docs/component-governance.md`
- `docs/responsive-governance.md`
- `docs/responsive-screenshot-governance.md`
- `docs/governance-checklists.md`
- `docs/tailwind-governance.md`
- `docs/tailwind-canonical-fragments.md`
- `docs/state-authority.md` (if touching client-state vs SSR boundaries)

## Admin table / admin control task

**Required:**
- `docs/design-system.md` ← canonical contract (§9 admin layout, §10 `tableAt` decisions)
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/component-governance.md` (canonical `AdminTableRow` pattern in §11)
- `docs/domain-rules.md`
- `docs/rls-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` → Note 22 "Admin Table Preservation Rule"

**Only if relevant:**
- `docs/governance-checklists.md`
- `docs/state-authority.md`

## DB / server action / RLS task

**Required:**
- `docs/data-access-rules.md`
- `docs/rls-rules.md`
- `docs/domain-rules.md`
- `docs/qa-rules.md`

**Only if relevant:**
- `docs/state-authority.md`
- `docs/app-lifecycle-contract.md`
- `docs/architecture.md`

## Email / auth lifecycle task

**Required:**
- `docs/env.md`
- `docs/domain-rules.md`
- `docs/qa-rules.md`
- `docs/integrations.md`

**Only if relevant:**
- `docs/app-lifecycle-contract.md`
- `docs/rls-rules.md`

## Profile / edit-flow task

**Required:**
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` → Note 23 "Edit-Flow Preservation Rule"

**Only if relevant:**
- `docs/state-authority.md`
- `docs/domain-rules.md`
- `docs/rls-rules.md`

## Performance task

**Required:**
- `docs/performance.md`
- `docs/qa-rules.md`

**Only if relevant:**
- `docs/responsive-screenshot-governance.md`
- `docs/responsive-screenshot-matrix.md`
- `docs/state-authority.md`

## Analytics / SEO task

**Required:**
- `docs/analytics-rules.md`
- `docs/env.md`
- `docs/qa-rules.md`

## Storybook / visual snapshot task

**Required:**
- `docs/storybook-governance.md`
- `docs/storybook-visual-snapshots.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

**Only if relevant:**
- `docs/responsive-screenshot-governance.md`
- `docs/responsive-screenshot-matrix.md`

## Tailwind / styling governance task

**Required:**
- `docs/tailwind-governance.md`
- `docs/tailwind-canonical-fragments.md`
- `docs/tailwind-entropy-audit.md`
- `docs/ui-rules.md`
- `docs/qa-rules.md`

## Component catalog / coverage task

**Required:**
- `docs/component-catalog.md`
- `docs/component-catalog-governance.md`
- `docs/component-coverage-matrix.md`
- `docs/component-risk-register.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

## Control-relocation task (moves an editable control between surfaces)

**Required:**
- `docs/ai-behavior.md` → Note 20 "Existing-Control Preservation"
- `docs/ai-behavior.md` → Note 21 "Control Relocation Rule"
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`
- Any task-type bundle of the destination surface (e.g. profile/edit-flow if the new location is the user profile edit page).

This is the bundle that exists specifically to prevent the "moved editable control becomes read-only label" failure mode that motivated Task 253.

## Docs-only / governance / task-template task

**Required:**
- `docs/agent-contract.md`
- `docs/orchestrator-role.md`
- `docs/backlog.md`

**Only if relevant:**
- `docs/ai-behavior.md`
- `docs/governance-checklists.md`
- `docs/governance-enforcement.md`

## Schema / migration task

**Required:**
- `docs/data-access-rules.md`
- `docs/domain-rules.md`
- `docs/rls-rules.md`
- `docs/qa-rules.md`
- `docs/architecture.md`

**Only if relevant:**
- `docs/state-authority.md`

## Mixed task (overlapping types)

List both bundles. The principle is the same: **load only what is relevant, never everything**.

## Out of scope from every bundle

Reference-only docs that are NOT mandatory pre-reads (read on demand):

- `docs/architecture.md` (system overview — read when restructuring modules)
- `docs/maintenance-playbook.md` (operational runbook — read on incident response)
- `docs/governance-enforcement.md` (governance internals — read when changing governance gates)
- `docs/eslint-debt-taxonomy.md` (lint debt history — read when triaging lint debt)
- `docs/responsive-audit.md`, `docs/ui-audit.md` (historical audit snapshots)
- Closed epic summaries (`Epic_*_Summary_CLOSED.md`).

These are kept as reference, not deleted, but they do not belong in any Sonnet kickoff pre-read by default.
