# How the UI rules are enforced

1. **The kickoff** names the canonical owner, the token owner, the direct Story and the mobile record (checklist U1,
   U5), and says "new hardcoded visual values: none". A missing owner or token is added at the shared owner with its
   Story first; a missing decision is `BLOCKED — GR-12`.
2. **CI on GitHub** (`scripts/quality/product-gates.mjs`, `.claude/rules/quality-gates.md`): `check:ui-contract` rejects a
   changed canonical Story that writes local presentation and a newly enrolled component without its row in
   `scripts/ui-contract-registry.json`; `check-mobile-adaptation-contract.mjs` rejects added clipping primitives; the
   token, enrolled-Tailwind, badge, dialog and surface-census checks run beside them; then the Storybook jobs.
3. **The owner** checks the changed Stories by hand.
4. **Review** (checklist V5, V9): the owner and mechanism of the kickoff against the code and Stories. A custom
   viewport branch that duplicates a Mantine prop, a second look for one meaning, or an unapproved hardcode is
   `NEEDS REVISION`.

A registry row in `scripts/ui-contract-registry.json` is added in the change that adds a component to
`scripts/mantine-migration-scope.json`. A checker, registry schema, CI job or rule is never edited to make a change
pass (checklist A9).
