# Mandatory UI enforcement model

This file explains how the UI rules are enforced. It does not create an exception or a weaker alternative to
`ui-token-contract.md`; read that contract first.

## Four layers, in order

1. **Phase gate.** Before an agent writes an in-scope UI source file, the `PreToolUse` hook requires the ordered
   preflight receipts below. It denies the edit when it cannot verify them. It is a stop-before-write control, not a
   claim that text alone proves visual parity.
2. **Canonical contract.** The saved task identifies the real component, token owner, direct Story and state boundary.
   If one is absent, the task is `BLOCKED — GR-12`; no local value, Story decorator, wrapper, or scanner exception is
   permitted.
3. **Repository gate.** `npm run check:ui-contract` is a fail-closed CI diff gate. It rejects a changed canonical
   Story that writes local presentation and rejects every newly manifest-enrolled component without a machine-readable
   component → token-owner → canonical-Story → parity contract in `scripts/ui-contract-registry.json`. It has no
   baseline, inline suppression, or allowlist route.
4. **Rendered proof.** The executor and reviewer still run the built-Storybook census in `ui-token-contract.md`.
   The static gate cannot measure computed layout or know that two contexts carry the same semantic meaning.

The first three layers prevent skipped sequencing and prohibited repository state; the fourth detects visual results
that source inspection cannot infer. A receipt is necessary for phase progression but never sufficient for approval.

## Exact pre-write receipts

Before an in-scope UI/component write, emit both:

`GR-0 CANONICAL REUSE PREFLIGHT — request: <component/Story/style>; semantic queries: <queries>; inspected candidates: <paths + Story IDs | NONE>; decision: <REUSE | EXTEND | COMPOSE | CREATE | STOP>; selected canonical owner: <path | NONE>; Mantine/TailAdmin token path: <path | NONE>; new hardcoded visual values: NONE; rationale: <why>.`

`UI CONTRACT PREFLIGHT COMPLETE - scope: <exact paths>; canonical owner: <path>; token owner: <registry/theme path>; direct Story: <path>.`

Before a canonical Story write, also emit:

`STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: <path>; production component: <name>; allowed public states: <typed props>; local presentation: NONE.`

Placeholders, an absent path, a parallel Story, or a claimed “temporary” hardcode do not satisfy the receipt. The
required action is to reuse/extend the owner or create the missing shared token/pattern and direct Story first.

## Change discipline

- Add a registry row in `scripts/ui-contract-registry.json` in the same change that newly adds a component to
  `scripts/mantine-migration-scope.json`. The row must name files that exist and the Story exports used by its
  GR-12 census.
- Never edit the checker, registry schema, CI job, hook, or a rule to make an implementation pass. Such a request is
  `POLICY-EDIT AUTHORITY REQUIRED` for Sonnet and needs an owner decision for Opus.
- A local hook can be disabled by someone with filesystem control; it is workflow enforcement, not a security
  boundary. The protected CI job is the merge boundary. A CI failure, unavailable diff base, malformed registry, or
  unparseable affected Story is a failure, never a skip.
