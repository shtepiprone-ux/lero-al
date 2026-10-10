# Sonnet implementation: controlled execution

## Before each visible UI change

1. Read `shared/enforcement-model.md` and emit its UI-contract receipt, then register its exact mobile-adaptation
   receipt through the required **PowerShell tool call** before the first in-scope UI write. Before a canonical Story
   write, register its exact Storybook-proof receipt through that same required tool. Prose beside a tool call is not
   durable evidence and is not a substitute; the PreToolUse hook blocks the write otherwise.
2. Build a visual source trace for the changed artifact and named preserved siblings: source/markup, selector,
   cascade, token path, state, and direct evidence.
3. Complete the canonical decision: `reuse`, `extend`, or `create canonical`. Search behavior, not filenames.
   A candidate covering 70% or more is reused or extended. The decision names the real component, direct Story,
   token path, and required registration.
4. Apply `shared/mobile-adaptation-contract.md` and `shared/storybook-proof.md`. Build the selected compact
   presentation from the lowest visible component upward through the saved Mantine mechanism and canonical owner;
   integrate only the same proven production component. The contract supplements semantic order/content treatment and
   proof; it does not authorize parallel viewport logic or changed Mantine interaction/a11y behavior.
5. Add visual meaning only in the established canonical token/component owner. Follow the missing-token process in
   `shared/ui-token-contract.md`; do not create a feature/Story workaround.
6. Before visual write and again before handoff, run the GR-12 built-Storybook parity census and GR-3j reflow probe
   across the actual `<640px` component thresholds and the `640px` transition; retain both receipts.
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

If no canonical owner, token, Story, parity-consistent precedent, or saved compatible Mantine mechanism exists, stop
feature integration. A missing mobile map is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED` for Opus, not permission
for Sonnet to edit policy or create a local hardcode.
