# Rule Index

This file selects the minimal rule bundle for each task type. It replaces "read all docs."

## How to use

1. Classify the task type.
2. Read the Always Required bundle.
3. Read only the matching task bundle and relevant optional files.
4. Select a QA profile from `docs/qa-profiles.md`.
5. If a task spans multiple types, include each matching bundle and state the boundary.

## Always Required

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `docs/critical-flow-registry.md` - scan for affected critical flows only.

For Opus orchestration or review, also read:

- `docs/orchestrator-role.md`
- `docs/orchestrator-procedures.md`

## UI / Layout / Component

First classify the UI surface:

- **New or migrated UI:** Mantine current path.
- **Existing legacy UI:** shadcn/Tailwind/Base UI path until migrated.
- **Mixed migration:** read both current and legacy docs, but state which files belong to each side.

### Current Mantine path

Required:

- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md`
- `docs/component-rules.md`
- `docs/ui-rules.md` - routing and legacy boundary notes only.
- `docs/qa-rules.md` - validation and encoding rules.

Optional if relevant:

- `docs/mantine-tailadmin-migration-tracker.md`
- `docs/storybook-governance.md`
- `docs/storybook-visual-snapshots.md`
- `docs/state-authority.md`
- `docs/i18n-rules.md`

### Legacy shadcn/Tailwind path

Required:

- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/design-system.md`
- `docs/qa-rules.md`

Optional if relevant:

- `docs/component-governance.md`
- `docs/responsive-governance.md`
- `docs/responsive-screenshot-governance.md`
- `docs/tailwind-governance.md`
- `docs/tailwind-canonical-fragments.md`
- `docs/state-authority.md`

## Admin Table / Admin Control

Required:

- `docs/admin-ux-rules.md`
- `docs/domain-rules.md`
- `docs/rls-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` - Note 22 admin table/control preservation.
- Current or legacy UI bundle above, depending on the touched surface.

Optional if relevant:

- `docs/component-governance.md`
- `docs/state-authority.md`
- `docs/admin-data-freshness-inventory.md`

## DB / Server Action / RLS

Required:

- `docs/data-access-rules.md`
- `docs/rls-rules.md`
- `docs/domain-rules.md`
- `docs/qa-rules.md`

Optional if relevant:

- `docs/state-authority.md`
- `docs/app-lifecycle-contract.md`
- `docs/architecture.md`

## Control Relocation

Use when an editable capability moves between surfaces or one location becomes read-only.

Required:

- `docs/ai-behavior.md` - Notes 20 and 21.
- `docs/component-rules.md`
- `docs/qa-rules.md`
- The current or legacy UI bundle for both source and destination surfaces.

Also include the destination task bundle, such as Profile / Edit Flow or Admin Table / Admin Control.

## Auth / Email / Account Lifecycle

Required:

- `docs/env.md`
- `docs/domain-rules.md`
- `docs/qa-rules.md`
- `docs/integrations.md`
- `docs/app-lifecycle-contract.md`

Optional if relevant:

- `docs/rls-rules.md`
- `docs/data-access-rules.md`

## Profile / Edit Flow

Required:

- Current or legacy UI bundle above, depending on the touched surface.
- `docs/domain-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` - behavior-preservation notes.

Optional if relevant:

- `docs/state-authority.md`
- `docs/rls-rules.md`

## Storybook / Visual Proof

Required:

- `docs/mantine-responsive-design-system.md` for Mantine stories, or `docs/storybook-governance.md` plus legacy UI docs for legacy stories.
- `docs/storybook-governance.md`
- `docs/storybook-visual-snapshots.md`
- `docs/qa-profiles.md`
- `docs/qa-rules.md`

Optional if relevant:

- `docs/responsive-screenshot-governance.md`
- `docs/responsive-screenshot-matrix.md`

## Responsive / Global Inventory

Use for cross-project responsive audits, breakpoint governance, or full Storybook matrix work.

Required:

- `docs/qa-profiles.md`
- `docs/storybook-governance.md`
- `docs/responsive-screenshot-governance.md`
- `docs/responsive-screenshot-matrix.md`
- `docs/responsive-storybook-inventory.md`

Then select by scope:

- Current Mantine inventory: `docs/mantine-responsive-design-system.md`.
- Legacy inventory: `docs/design-system.md` and `docs/responsive-governance.md`.
- Mixed inventory: both sets, with the boundary stated explicitly.

Do not apply one implementation system to the other.

## TailAdmin / Styling Governance

Required:

- `docs/tailadmin-style-reference.md`
- `docs/mantine-responsive-design-system.md`
- `docs/qa-profiles.md`
- `docs/qa-rules.md`

Optional if relevant:

- `docs/tailwind-governance.md`
- `docs/tailwind-canonical-fragments.md`
- `scripts/design-tokens-allowlist.json`

## Legacy Tailwind Styling Governance

Use only for legacy Tailwind surfaces or governance tooling that still scans them.

Required:

- `docs/tailwind-governance.md`
- `docs/tailwind-canonical-fragments.md`
- `docs/tailwind-entropy-audit.md`
- `docs/ui-rules.md`
- `docs/qa-rules.md`

## Performance

Required:

- `docs/performance.md`
- `docs/qa-rules.md`

Optional if relevant:

- `docs/state-authority.md`
- `docs/responsive-screenshot-governance.md`

## Analytics / SEO

Required:

- `docs/analytics-rules.md`
- `docs/env.md`
- `docs/qa-rules.md`

## Component Catalog / Coverage

Required:

- `docs/component-catalog.md`
- `docs/component-catalog-governance.md`
- `docs/component-coverage-matrix.md`
- `docs/component-risk-register.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

## Regression / Critical Flow Coverage

Required:

- `docs/critical-flow-registry.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md`
- `docs/agent-contract.md`

Also include the bundle for the changed flow: auth, DB/RLS, UI, admin, or lifecycle.

## Schema / Migration

Required:

- `docs/data-access-rules.md`
- `docs/domain-rules.md`
- `docs/rls-rules.md`
- `docs/qa-rules.md`
- `docs/architecture.md`

Optional if relevant:

- `docs/state-authority.md`

## Docs / Governance / Task Template

Required:

- `docs/agent-contract.md`
- `docs/orchestrator-role.md`
- `docs/orchestrator-procedures.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`

Optional if relevant:

- `docs/ai-behavior.md`
- `docs/governance-checklists.md`
- `docs/governance-enforcement.md`

## Out of scope by default

Read these only when the task specifically needs them:

- historical audits in `docs/*audit*.md`;
- closed epic summaries;
- old session logs;
- broad governance reports;
- full design-system legacy sections when working only on Mantine current UI.
