# Mandatory UI enforcement model

This file explains how the UI rules are enforced. It does not create an exception or a weaker alternative to
`ui-token-contract.md`; read that contract first.

For Opus design/review, first apply `canonical-component-reuse.md` (owner decision 2026-10-20). Its inherited-design
and unchanged-chrome scope governs the research/rendered proof below. Existing pre-write receipts and repository
gates remain required; this document does not claim the hook mechanically verifies reuse or research scope.

## Five cumulative layers, in order

1. **Phase gate.** Before an agent writes an in-scope UI source file, the `PreToolUse` hook requires the ordered
   preflight receipts below. It denies the edit when it cannot verify them. It is a stop-before-write control, not a
   claim that text alone proves visual parity.
2. **Mobile adaptation contract.** The saved task selects a source-backed semantic compact profile, content order,
   direct Story, the actual `<640px` component thresholds, and the `640px` transition proof. A Story demonstrates the
   selected profile; it never defines one.
3. **Canonical contract.** The saved task identifies the real component, token owner, direct Story and state boundary.
   If one is absent, the task is `BLOCKED — GR-12`; no local value, Story decorator, wrapper, or scanner exception is
   permitted.
4. **Repository gates.** `npm run check:ui-contract` is a fail-closed CI diff gate. It rejects a changed canonical
   Story that writes local presentation and rejects every newly manifest-enrolled component without a machine-readable
   component → token-owner → canonical-Story → parity contract in `scripts/ui-contract-registry.json`. It has no
   baseline, inline suppression, or allowlist route. `node scripts/check-mobile-adaptation-contract.mjs` separately
   rejects added text-clipping primitives and malformed changed kickoff records.
5. **Rendered proof.** The executor and reviewer still run the built-Storybook census in `ui-token-contract.md`,
   and the rendered state census of `rendered-state-census.md` over the app root and every portal root (gate built
   by task 923). Apply that contract's bootstrap ordering to the gate's first review. Consuming overlay tasks wait
   for its approval and then require the gate green on their own Stories' rows.
   The static gate cannot measure computed layout or know that two contexts carry the same semantic meaning.

The first four layers prevent skipped sequencing and prohibited repository state; the fifth detects visual results
that source inspection cannot infer. A receipt is necessary for phase progression but never sufficient for approval.

## Exact pre-write receipts

Before an in-scope UI/component write, register all three receipts through the **PowerShell tool**, one helper call
per command, the call being the command's only statement (no `Set-Location` or other prefix):

```powershell
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt 'GR-0 CANONICAL REUSE PREFLIGHT - request: <component/Story/style>; semantic queries: <queries>; inspected candidates: <paths + Story IDs | NONE>; decision: <REUSE | EXTEND | COMPOSE | CREATE>; selected canonical owner: <path | NONE>; Mantine/TailAdmin token path: <path | NONE>; new hardcoded visual values: NONE; rationale: <why>.'
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind UiContract -Receipt 'UI CONTRACT PREFLIGHT COMPLETE - scope: <exact paths>; canonical owner: <path>; token owner: <registry/theme path>; direct Story: <path>.'
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: <paths and semantic regions>; component families: <registry IDs>; pattern IDs: <allowed IDs from those families>; standards: <all required source IDs>; mantine mechanism: <allowed registry IDs>; mantine owner: <canonical selected-family pattern path>; mobile range: <640px (theme.other.mobileGate / sm); mobile order: <ordered content/actions>; required content: no semantic loss; verification: <direct Story> across actual <640px thresholds and the 640px transition x <locales>.'
```

The registration is required because prose beside another tool call is stored as empty thinking, not as text (observed
in Task 923 on 2026-10-18: a Sonnet session's prose GR-0 and UI-contract receipts never reached the transcript, so
every UI write was denied). A `STOP` GR-0 decision is a stop, never a write authorization, and the helper rejects it,
as it rejects a GR-0 receipt without `new hardcoded visual values: NONE`. The mobile receipt's `mobile order` value is
free text and may contain ordinary semicolons; the named delimiter is `; required content:`.
Escape an apostrophe in any receipt value as `''` inside the PowerShell single-quoted argument.
The helper validates only syntax and prints the receipt. The phase gate then validates registry compatibility before
the write, so registration is durable evidence rather than a bypass. Its deny message names each missing receipt.

The mobile receipt proves that the task supplements Mantine rather than replacing it: the selected mechanism and
owner must be registry-listed and match actual code. It cannot justify custom viewport logic when Mantine responsive
or visibility props already express the behavior.

Before a canonical Story write, register the following receipt through the **PowerShell tool** (not prose adjacent to
a tool call, because Claude may retain that prose only as unavailable thinking):

```powershell
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind StorybookProof -Receipt 'STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: <this Story path[, additional Story paths]>; production component: <name[, names]>; allowed public states: <typed props>; local presentation: NONE.'
```

The hook accepts only this exact helper invocation from the PowerShell tool. The receipt must name the precise Story
being edited; a receipt for another Story does not authorize the write. The helper validates and prints the receipt
but writes no project state. It is a durable preflight record, not a bypass.

Placeholders, an absent path, a parallel Story, or a claimed “temporary” hardcode do not satisfy the receipt. The
required action is to reuse/extend the owner or create the missing shared token/pattern and direct Story first.

## Change discipline

- Add a registry row in `scripts/ui-contract-registry.json` in the same change that newly adds a component to
  `scripts/mantine-migration-scope.json`. The row must name files that exist and the Story exports used by its
  GR-12 census.
- Never edit the checker, registry schema, CI job, hook, or a rule to make an implementation pass. Such a request is
  `POLICY-EDIT AUTHORITY REQUIRED` for Sonnet and needs an owner decision for Opus.
- A local hook can be disabled by someone with filesystem control; it is workflow enforcement, not a security
  boundary. CI becomes a merge boundary only after remote required-check protection is configured and verified.
  See `workflow-gates.md`. A CI failure, unavailable diff base, malformed registry, or
  unparseable affected Story is a failure, never a skip.
