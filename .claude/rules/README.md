# Lero.al rule architecture

This directory is the operational rule tree. It replaces large, repeated workflow prompts with small files read at
the moment a rule becomes relevant. `CLAUDE.md` is the entry point; a role's `SKILL.md` is its parent checklist.

## Reading model

Read [shared/workflow-gates.md](shared/workflow-gates.md) for every task. It owns the executable plan, write,
verification, CI-summary and release gates; the numbered role phases invoke it at their boundary.
Its required companions are `shared/workflow-contract.md`, `shared/workflow-evidence.md` and `shared/workflow-ci.md`.
Before any Git handoff read `shared/git-publication.md`: task-branch commit, branch push + PR, merge after green PR
checks and post-merge main CI are separate boundaries for every model.

1. Read the role parent in `.claude/skills/<workflow>/SKILL.md`. It is deliberately short and establishes the gate.
2. Read the numbered phase file it names **before** starting that phase. Never treat a parent summary as permission
   to skip the phase file.
   Opus completes C1-C7 (design) or R1-R7 (review) with evidence and explicit exit conditions. Both use
   [shared/task-readiness.md](shared/task-readiness.md) before publishing any executor route, including revisions.
   [shared/orchestration-state.md](shared/orchestration-state.md) owns draft/ready transitions and proof freshness.
3. Before a kickoff or material review conclusion, read `shared/claim-evidence-contract.md`. It is the shared
   contract for factual claims; task/review phases say when its ledger is required.
4. For UI, Storybook, tokens, or visual review, Opus first reads `shared/canonical-component-reuse.md` and inspects
   ready components/Stories before external research. Its owner-approved reuse scope takes precedence over blanket
   research/remeasurement. Then read `shared/mobile-adaptation-contract.md`, then
   `shared/ui-token-contract.md` and `shared/enforcement-model.md`, before proposing or changing the visual
   implementation, then `shared/storybook-proof.md` before producing Storybook evidence. Mantine and the project
   theme remain authoritative for responsive mechanism, interaction, accessibility, and canonical owner; the mobile
   contract supplies semantic outcome/proof only. Opus inherits ready adaptations; a new pattern needs source support.
5. Read the exact legacy/reference document named by `docs/rule-index.md` only when the task type needs it. The
   long documents remain the historical and detailed source of record; they are not a default "read everything" list.
6. For every new or edited task, read [shared/security-testing.md](shared/security-testing.md) and its selected
   companion files. Every product task requires frontend AND server security tests, named by Opus, implemented or
   rerun by Sonnet, and independently verified by Opus. The contract defines the narrow Q0-only N/A exception.

   Every role and model also follows [shared/secure-code-review.md](shared/secure-code-review.md): threats before code,
   how to write it, what runs by itself after it, and how a session that wrote none of it reviews it.

7. Opus and Sonnet communicate with the owner in Ukrainian only; Russian replies and mixed Ukrainian/Russian prose
   are forbidden. Read [shared/project-language.md](shared/project-language.md). Every project file you write is
   English, owner quotes included; only product localization data may be in another language.

## Size and ownership rules

- Parent workflow files contain only role boundary, stop conditions, ordered checks, receipts, and links.
- A phase file should cover one decision point and stay under 8 KB. Create a sibling phase file instead of appending
  a new unrelated policy.
- A policy is stated once in `shared/` or its most-specific `docs/` source. Role files link to it; they do not copy it.
- Current ordered phase workflows own sequencing; historical incident narratives do not add another workflow.
  Keep one current execution route in a kickoff and retain history as linked evidence, preserving open obligations.
- A change to a shared policy must update every affected role checklist and the relevant validation/gate in the same
  change. A role-specific exception belongs in that role's phase file and needs an owner decision with date and scope.

## Tree

```text
.claude/rules/
  shared/     cross-role contracts
  create/     Opus task-design phases
  review/     Opus implementation-review phases
  execute/    Sonnet implementation phases
```

## Canonical sources

- `docs/golden-rules.md` indexes the detailed GR-0…GR-12 fragments and exact receipts in `docs/rules/golden/`.
- `docs/agent-contract.md` indexes P0 invariants and role authority fragments in `docs/rules/agent-contract/`.
- `docs/rule-index.md` selects task-specific source documents.
- The files here make the mandatory sequence small enough to follow; they never weaken those sources.
