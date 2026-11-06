## GR-12 — One element, one look: no hardcode, and every existing Story is compared before writing, executing or approving

**Owner rule, 2026-10-08 (Task 859, O78-13 return):** *"A strict rule must be set both for Sonnet and for you, so that there is
no hardcode at all, so that a check for the existing element patterns of components in
the already existing Stories is mandatory (we have such a rule, but you both ignore it)."*

**What reached the owner after seven reviews** (`Mantine/Primitives/Badge`, Task 859):
- section captions written as raw strings in the Story ("soft · leftSection", "long label / no clip");
- one badge (`shape="soft"`) with squarer corners than every other badge;
- the neutral "Archived" badge with a fill invisible on a white page, while the `ListingCard` Story shows the same
  status as a solid grey badge;
- every listing status in a different colour scheme from the cards;
- `styles={{ root: { backgroundColor: … } }}` and `color="gray.9"` written inside the canonical `MantineBadge` itself.

GR-0 forbade the hardcode and GR-10 required the canonical to match its original. Nobody compared the element with the
Stories that already render it, so neither rule fired. This rule makes that comparison mandatory, measured and receipted.

**1. No hardcode, Stories included.** In new or migrated UI, none of these may carry a visual decision outside the
theme entry or the canonical component's registry:
- a `style` or `styles` prop, a `className`, or a raw colour, size, radius or spacing;
- a colour-token literal picked in a component or Story for a meaning (`c="orange.6"`, `color="gray.9"`,
  `var(--mantine-color-…)` in a `styles` object). A meaning maps to a value in one place only, the theme entry or the
  registry, and every consumer, the canonical component included, reads it from there;
- a visible string in a Story that is not locale-backed (`storyT` or `t`). Story captions are text too.

**Missing-token resolution, binding.** First search the implemented theme/token registry and canonical component.
When no suitable token exists, create the smallest shared semantic token (or canonical component token only when the
value is an invariant of that component), add it to the real registry, and consume it from the canonical component
and every same-meaning consumer in the same change. Do not add a Story-only, feature-only, or one-use token. A missing
token/pattern/Story is a stop to local integration, not permission for a raw value, palette literal, `className`,
`style`, or consumer override. The operational decision tree is `.claude/rules/shared/ui-token-contract.md`.

**Machine enforcement, not a waiver.** The write hook that demanded receipts before a UI/Story write
(`.claude/hooks/phase-write-gate.ps1`) was removed 2026-11-06; the kickoff names an automated test for each criterion.
Protected CI runs `npm run check:ui-contract`: changed canonical Stories cannot add local presentation, and a
component newly enrolled in `scripts/mantine-migration-scope.json` must have a real component → token-owner → direct
Story → parity row in `scripts/ui-contract-registry.json`. Neither gate has an inline suppression, allowlist, or
baseline. The full enforcement boundary, including why a built-Storybook census remains required for computed parity,
is `.claude/rules/shared/enforcement-model.md` and `enforcement-status.md`.

