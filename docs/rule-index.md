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
- `docs/critical-flow-registry.md` — **scan it for any flow your task touches.** If it touches one, the
  regression-coverage P0 rule (`agent-contract.md` clause 15 / Epic RS) is in scope: baseline the existing
  test, add/update a regression test, and do not close without automated proof the old behavior still works.

## UI / layout / component task

> **🔴 MANTINE FREEZE (owner, 2026-06-24, Task 482): Mantine is now the source of truth for all new UI work.** New components MUST use Mantine. New responsive layout MUST use Mantine's responsive prop system. New Storybook stories MUST use the Mantine-native proof path. See `docs/mantine-responsive-design-system.md` — read it FIRST for any UI/layout/component task.

**Required:**
- `docs/mantine-responsive-design-system.md` ← **FIRST READ for any UI/layout/component work (Task 482, 2026-06-24). Mantine = source of truth.** §7 = mobile gate rules. §12 = canonical patterns. §15 = governance freeze. §16 = acceptance gates.
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

**Only if relevant (legacy/migration context):**
- `docs/design-system.md` ← legacy system doc — read ONLY when migrating an existing legacy surface or when a legacy rule is referenced. Do NOT use as source of truth for new patterns.
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
- `docs/rls-rules.md` ← **read "RLS-Change Test Requirement" section (Task 436, 2026-06-16): any RLS/permission/SECURITY DEFINER/write-path-table change requires positive + negative test coverage. Cannot close without CI-verifiable proof.**
- `docs/domain-rules.md`
- `docs/qa-rules.md` ← **read "Actionable Error-Toast Rule" section (Task 436, 2026-06-16): server actions must log the root cause and return typed error keys; test must verify console.error is called.**

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

> **🔴 MANTINE PROOF PATH (Task 482, 2026-06-24):** New stories MUST use the Mantine-native proof path (`parameters.skipCanvas: true`, `storybook.mantine.*` i18n namespace, **Default only — toolbar-driven viewport/locale proof**). Each `Patterns/Mantine/*` story group exports exactly ONE story (`Default`). Viewport and locale switching is via Storybook toolbar (12 widths 275–1920px; en/uk/sq/it locales). No per-viewport, per-locale, `Dark`, `LongUk`, `Pass`, or `Fail` exports. See `docs/mantine-responsive-design-system.md` §8 + §13.

**Required:**
- `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules) + §13 (Storybook rebuild plan)
- `docs/storybook-governance.md`
- `docs/storybook-visual-snapshots.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

**Only if relevant:**
- `docs/design-system.md §27` (legacy Storybook proof contract — only when auditing legacy stories)
- `docs/responsive-screenshot-governance.md` (§MQ: machine-detection limits + manual QA requirement — added Task 412)
- `docs/responsive-screenshot-matrix.md`

## Responsive/global-inventory task (canonical standard + Storybook matrix)

**Required:**
- `docs/design-system.md` — full read (§3 14-viewport canon, §10 tableAt, §14 overlays, §24–§27 canonical responsive contracts — added Task 412)
- `docs/storybook-governance.md` (§14 enforced gates, §MQ manual-QA requirement — added Task 412)
- `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits — added Task 412)
- `docs/responsive-screenshot-matrix.md`
- `docs/responsive-storybook-inventory.md` ← **global story inventory** (created Task 412)
- `docs/agent-contract.md`
- `docs/backlog.md`

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

## Regression / critical-flow coverage task (Epic RS — Regression Shield)

**Required:**
- `docs/critical-flow-registry.md` — the registry being extended (single source of truth)
- `tasks/Epics/Epic_RS_Regression_Shield.md` — slice contracts + definition of done
- `docs/qa-rules.md` — test/error-handling conventions
- `docs/agent-contract.md` (clause 15) + `docs/orchestrator-role.md` (regression-coverage gate)

**Only if relevant (by the flow group being covered):**
- Auth/listings/admin slices → the matching task-type bundle above (email/auth lifecycle, DB/RLS, admin).
- `docs/rls-rules.md` + `docs/data-access-rules.md` for the server-action/RLS permission-coverage slice.
- `docs/responsive-screenshot-governance.md` for the i18n/hydration/mobile slice.

## Schema / migration task

**Required:**
- `docs/data-access-rules.md`
- `docs/domain-rules.md`
- `docs/rls-rules.md` ← **read "RLS-Change Test Requirement" (Task 436): positive + negative write-path tests are mandatory for any RLS/permission change.**
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
