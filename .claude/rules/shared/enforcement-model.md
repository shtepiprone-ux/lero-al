# UI enforcement model

How the UI rules are enforced. It does not weaken `ui-token-contract.md`; read that contract first. For Opus design and
review, apply `canonical-component-reuse.md` first (owner decision 2026-10-20).

## Four layers, in order

1. **The kickoff's UI section** (`.claude/rules/kickoff-template.md`) names the canonical owner, the token owner, the
   direct Story, the mobile profile and mechanism (`mobile-adaptation-contract.md`), and states "new hardcoded visual
   values: none". If an owner or token is missing, the task first adds it at the shared owner with its direct Story; no
   local value, Story decorator, wrapper or scanner exception is permitted. A missing decision is `BLOCKED — GR-12`.
2. **Repository gates in CI** (`scripts/quality/product-gates.mjs`, `quality-gates.md`). `check:ui-contract` rejects a
   changed canonical Story that writes local presentation and every newly enrolled component without a component →
   token-owner → canonical-Story → parity row in `scripts/ui-contract-registry.json`; it has no baseline, suppression
   or allowlist. `check-mobile-adaptation-contract.mjs` rejects added text-clipping primitives. The design-token,
   enrolled-Tailwind, badge, dialog and surface-census checks run beside them.
3. **Rendered proof.** The implementer and the reviewer run the built-Storybook census of `ui-token-contract.md` and the
   rendered state census of `rendered-state-census.md` over the app root and every portal root.
4. **Review.** Opus compares the kickoff's selected owner and mechanism with the actual code and Stories. A custom
   viewport branch that duplicates a Mantine prop, a second look for the same semantic element, or an unapproved
   hardcode is `NEEDS REVISION`, even if a screenshot looks right.

## Change discipline

- Add a registry row in `scripts/ui-contract-registry.json` in the same change that adds a component to
  `scripts/mantine-migration-scope.json`. The row names files that exist and the Story exports used by its census.
- Never edit a checker, registry schema, CI job or rule to make an implementation pass (`quality-gates.md` §4).
- A CI failure, unavailable diff base, malformed registry or unparseable affected Story is a failure, never a skip.
