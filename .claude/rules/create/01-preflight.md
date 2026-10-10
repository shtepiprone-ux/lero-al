# Opus task design: preflight and evidence

Before opening an existing task, source, diff, executor report, or writing a kickoff:

1. Read `.claude/rules/shared/role-boundaries.md` and this file.
2. Read `docs/agent-contract.md`, `docs/rules/agent-contract/p0-16-16c-ui-canonical.md`,
   `docs/rules/agent-contract/p0-16d-surface-census.md`, `docs/rule-index.md`, and `docs/qa-profiles.md`.
   Read a specific section of `docs/orchestrator-role.md` or `docs/orchestrator-procedures.md` only when its later
   phase or task bundle needs it; neither large historical document is a default preflight read.
3. For a reserved/assigned number, read `docs/backlog-reserved.md` before any task/sprint action and retain the
   required receipt. Read current backlog/sprint state before choosing a sprint.
4. Classify the task. Select the minimal bundle from `docs/rule-index.md`; do not say "read all docs".
5. Read `shared/claim-evidence-contract.md`. Establish facts from current source, callers, tests, direct Stories,
   real behavior, and diff. Create a `C#` entry with its actual path/range/literal for every claim that will determine
   scope, behavior, an AC, an exclusion, or expected command result. Trace a claimed absent/dead prop or token through
   definition, all reads, and production/Story/test construction paths.
6. Complete `shared/reference-research.md` before relying on UI/reference evidence or drafting a kickoff.
7. For visible work, read `shared/mobile-adaptation-contract.md`, then `shared/ui-token-contract.md` and
   `shared/enforcement-model.md`, before proposing values/styles and `shared/storybook-proof.md` before proposing
   Story work. Complete the 16d rendered-component census; no child may disappear into out-of-scope. Select the
   compact profile from primary-source research, the registry-allowed Mantine mechanism, and canonical Mantine owner;
   establish the Mobile adaptation record before treating any current Story as verification. Mantine owns the
   responsive mechanism. If any of family/profile/mechanism/owner is absent, stop as
   `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED` and make the Opus-only policy extension before publication.

Required first substantive receipt:

`TASK-DESIGN PREFLIGHT COMPLETE - loaded: create-task; create/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

Immediately before the first active-kickoff write, run the exact PowerShell registration command for
`KICKOFF EVIDENCE PREFLIGHT COMPLETE` from `shared/claim-evidence-contract.md`. Do not substitute prose beside a tool
call: only the durable registration command reaches the write hook. Its later structural checker rejects a receipt
that is not backed by a saved claim ledger.

If any required source/evidence cannot be read, publish `BLOCKED — KICKOFF EVIDENCE GAP` with its exact path or gap.
Do not replace proof with a plausible implementation plan or defer the first verification to Sonnet.
