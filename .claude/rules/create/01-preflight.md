# Opus task design: preflight and evidence

## C1. Establish the assignment and current state

Load startup rules first; read the complete assignment before investigating implementation:

1. Read `.claude/rules/shared/role-boundaries.md` and this file.
2. Read the routers `docs/agent-contract.md`, `docs/rule-index.md` and `docs/qa-profiles.md`.
3. For a reserved/assigned number, read `docs/backlog-reserved.md` before any task/sprint action and retain the
   required receipt. Read current backlog/sprint state before choosing a sprint.
4. Read the complete existing task, ledger and amendments when revising, plus the owner's assignment/decisions.
   Identify and report its current required first action. For a new task, establish the requested outcome and
   preservation boundaries from the assignment; do not invent an existing task or defect.
5. Read `shared/secure-code-review.md` section 1: the kickoff's `Assets and boundaries` row answers its four questions.
6. Select the minimal task bundle and applicable Agent Contract fragments. Visible scope includes
   `docs/rules/agent-contract/p0-16-16c-ui-canonical.md` and `docs/rules/agent-contract/p0-16d-surface-census.md`.
   Read `shared/claim-evidence-contract.md`, `shared/security-testing.md` and selected companions. Read historical
   orchestrator documents only at the sections needed later. Do not say "read all docs".
6. Inspect current `git log`, scoped `git status` and task/backlog state. Record unresolved owner choices; do not
   infer approval from permissive current code. Investigation and test selection happen in C2 after this assignment.

Required first substantive receipt (loaded rules only, not a completed investigation):

`TASK-DESIGN PREFLIGHT COMPLETE - loaded: create-task; create/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

**Exit:** the assignment, current state and selected checks are identified. An unresolved product decision blocks
the dependent design, not independent evidence gathering.

## C2. Investigate before choosing a solution

1. With C1's complete assignment, inspect the current diff and ownership of each affected path. Retain a concrete reproduction or record why the problem is
   source-only/unreproduced; do not promote an explanation to a verified cause without testing its counter-branch.
   For feature work demonstrate the current behavior/missing capability instead of inventing a defect to reproduce.
2. Trace the affected path from the real consumer/trigger through actions, guards and data access to effective DB
   permissions/RPCs and provider effects where applicable. Inspect complete relevant branches, error mapping and
   every writer of changed fields. Verify absence/deletion claims through definitions, reads and constructors.
   A new site setting, or a table that only admin code writes, needs its reader outside the admin code in the same
   task; an admin-only record (audit or support desk) names its admin reader (Task 923 R78 (d), owner D51).
3. Build the affected-path manifest of `shared/task-readiness.md` section 1 before fixing the write scope: callers,
   tests, Stories, fixtures, generated/registry consumers, existing contracts and sensitivity scripts. Read the actual
   assertions and doubles in existing tests; find baseline failures by test identity, not a summary total.
4. Establish `C#` entries with current path/range/literal for facts that determine scope, behavior, ACs, exclusions or
   command expectations. Keep the raw source/probe evidence so a later falsification can be checked independently.
5. For visible work, read `shared/canonical-component-reuse.md` and inspect ready Mantine components and rendered
   Stories before external research or a new component/design decision. Record reuse, extension, composition, or
   justified creation plus a direct Story. Inherit covered design/adaptation; do not create a duplicate.
6. Apply `shared/reference-research.md` only after that search and scope its audit to uncovered decisions/defects.
   Record inherited canonical design explicitly when the reuse rule waives a fresh audit.
7. For visible work, read `shared/mobile-adaptation-contract.md`, then `shared/ui-token-contract.md` and
   `shared/enforcement-model.md`, before proposing values/styles and `shared/storybook-proof.md` before proposing
   Story work. Complete the 16d rendered-component census; no child may disappear into out-of-scope. Select the
   compact profile from the ready owner, or primary-source research for a new decision, with the registry-allowed
   Mantine mechanism and canonical owner; establish the Mobile adaptation record using those inherited/new fields.
   Mantine owns the responsive mechanism. If any of family/profile/mechanism/owner is absent, stop as
   `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED` and make the Opus-only policy extension before publication.

**Exit:** evidence explains the observed problem, affected dependencies and preservation boundary. Missing evidence
is named explicitly; do not begin the implementation route using a guessed file, API, permission or expected result.

Immediately before the first active-kickoff write, run the exact PowerShell registration command for
`KICKOFF EVIDENCE PREFLIGHT COMPLETE` from `shared/claim-evidence-contract.md`. Do not substitute prose beside a tool
call: only the durable registration command reaches the write hook. Its later structural checker rejects a receipt
that is not backed by a saved claim ledger.

If any required source/evidence cannot be read, publish `BLOCKED — KICKOFF EVIDENCE GAP` with its exact path or gap.
Do not replace proof with a plausible implementation plan or defer the first verification to Sonnet.
