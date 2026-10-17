# Sonnet implementation: start gate

Open this phase file before the saved task; do not open source, diff, or Storybook until its ordered gate is complete.

1. Read `.claude/rules/shared/role-boundaries.md`.
2. Read the complete saved task and its named rule bundle. If it is incomplete, contradictory, or lacks executable
   acceptance criteria, stop with the precise gap.
   Read [shared/security-testing.md](../shared/security-testing.md) and its selected companions. Verify the saved
   `Security test contract` names frontend AND server security criteria, an approved target and scoped synthetic fixtures.
   Missing product-layer criteria are `BLOCKED — SECURITY TEST CONTRACT MISSING`; report the exact gap to Opus.
   Do not substitute live customer data, production services or always-successful mocks for missing test facilities.
3. Read `.claude/rules/shared/mobile-adaptation-contract.md`, then `.claude/rules/shared/ui-token-contract.md`, for
   every visible/UI/Story/token task. Verify the saved Mobile adaptation record selects a real source-backed pattern,
   registry-allowed Mantine mechanism, and canonical Mantine owner; a current Story is not its authority. Mantine
   owns responsive mechanism/interaction/a11y; do not implement a parallel viewport solution. If the record is
   absent or incompatible, report `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`; Sonnet must not edit the registry.
   For a confirmed non-visible task, record why it is not applicable.
4. Read the affected source, callers, tests, Stories, and current diff. Reproduce the stated current behavior or
   retain direct evidence before changing it.
5. Record in session evidence: requirement/AC ledger, preserved and required behavior, QA profile, relevant negative
   flows, and the exact task-owned write scope.
6. For a visible surface, read `docs/rules/agent-contract/p0-16d-surface-census.md` and run its rendered-component
   census. A component with neither its own canonical Story nor manifest entry is in scope. Do not implement around it:
   `BLOCKED — CLAUSE 16d`.
7. Before the first write of every task, complete `shared/reference-research.md` and the exact GR-7 receipt.

Required first substantive receipt:

`EXECUTION PREFLIGHT COMPLETE - loaded: execute-task; shared/role-boundaries; shared/ui-token-contract; saved task and selected rule bundle.`

Then issue the relevant GR-0 canonical-reuse receipt before any visual/component/Story write. The exact detailed
receipts and historic definitions remain in `docs/golden-rules.md`.
