# Sonnet implementation: controlled execution

## Before each visible UI change

1. Read `shared/enforcement-model.md` and emit its exact UI contract preflight receipt. Before a canonical Story
   write, emit its exact Storybook-proof receipt too; the PreToolUse hook blocks the write otherwise.
2. Build a visual source trace for the changed artifact and named preserved siblings: source/markup, selector,
   cascade, token path, state, and direct evidence.
3. Complete the canonical decision: `reuse`, `extend`, or `create canonical`. Search behavior, not filenames.
   A candidate covering 70% or more is reused or extended. The decision names the real component, direct Story,
   token path, and required registration.
4. Apply `shared/storybook-proof.md`. Build from the lowest visible component upward and integrate only the same
   proven production component.
5. Add visual meaning only in the established canonical token/component owner. Follow the missing-token process in
   `shared/ui-token-contract.md`; do not create a feature/Story workaround.
6. Before visual write and again before handoff, run the GR-12 built-Storybook parity census and retain its receipt.
   Run `npm run check:ui-contract -- --base <task-base> --head HEAD` after the relevant commit in addition to the
   task QA profile; a changed Story-local style or a malformed new contract is a hard failure.

## General discipline

- Change only saved task scope. Inspect consumers before changing a shared contract.
- Preserve specified positive/negative flows, locale behavior, current/legacy implementation boundary, and tests.
- A mechanical change touching more than one file needs an exact manifest before the first write; stop on a mismatch.
  Record pre/final hashes and inspect the actual diff. Never derive a write set from a bare directory or recursive glob.
- Do not weaken tests, gates, or allowlists to make a result green. Do not invent values, paths, commands, or decisions.
- Re-read each changed file after a meaningful edit. If a task exposes a governance/policy correction, report it; Sonnet
  does not edit policy or `.claude` files.

If no canonical owner, token, Story, or parity-consistent precedent exists, stop feature integration. The permitted
resolution is a shared semantic token/canonical pattern plus its direct Story, not a local hardcode.
