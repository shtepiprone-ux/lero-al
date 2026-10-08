# Lero.al rule architecture

This directory is the operational rule tree. It replaces large, repeated workflow prompts with small files read at
the moment a rule becomes relevant. `CLAUDE.md` is the entry point; a role's `SKILL.md` is its parent checklist.

## Reading model

1. Read the role parent in `.claude/skills/<workflow>/SKILL.md`. It is deliberately short and establishes the gate.
2. Read the numbered phase file it names **before** starting that phase. Never treat a parent summary as permission
   to skip the phase file.
3. For UI, Storybook, tokens, or visual review, read `shared/ui-token-contract.md`, then
   `shared/enforcement-model.md`, before inspecting or changing the visual implementation, then
   `shared/storybook-proof.md` before producing Storybook evidence.
4. Read the exact legacy/reference document named by `docs/rule-index.md` only when the task type needs it. The
   long documents remain the historical and detailed source of record; they are not a default "read everything" list.

## Size and ownership rules

- Parent workflow files contain only role boundary, stop conditions, ordered checks, receipts, and links.
- A phase file should cover one decision point and stay under 8 KB. Create a sibling phase file instead of appending
  a new unrelated policy.
- A policy is stated once in `shared/` or its most-specific `docs/` source. Role files link to it; they do not copy it.
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
