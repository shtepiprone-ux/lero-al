# Opus task design: executable kickoff contract

Build one executable route for a fresh Sonnet session. Before the requirements, add the single Claim ledger required by
`shared/claim-evidence-contract.md`; every `R#` and `AC#` uses its immediate `[C…; D…]` citation. The kickoff includes:

1. objective, verified context expressed only through ledger-backed facts/owner decisions, and exact scope/out-of-scope;
2. current behavior to preserve and required after behavior;
3. atomic requirements, positive flow, applicable negative-flow table, and `ACn [R…] Given/when/then` criteria;
4. selected Q0–Q4 profile, exact commands/evidence, non-Q0 final-build gate, critical-flow coverage where relevant;
5. completion-report contract and a per-rule compliance ledger;
6. the saved path under the selected sprint, never a chat-only task or `tasks/` root file.

Every created or revised task also includes `## Security test contract`, using the exact fields and applicability
rules in [shared/security-testing.md](../shared/security-testing.md). Name frontend AND server security tests,
specific allow/deny/data-leak assertions, fixtures, boundary integration and sensitivity evidence. Existing mapped
regressions require inspected assertions and a rerun; changed behavior requires its own regression. Resolve missing
test infrastructure explicitly before promising runnable evidence. Only genuine Q0 documentation-only work may
justify runtime N/A under that contract. Do not publish a product kickoff missing either layer's criteria.

For each visible artifact, add a canonical decision record: semantic searches, inspected candidates, direct Story and
source, `reuse`/`extend`/`create canonical`, shared token path, registration, preservation boundary, and component →
composition → route evidence hierarchy. A missing token becomes a named semantic-token creation in the canonical
registry, never a consumer value. A Story only passes public props/data; it never contains style repair.

Use `shared/enforcement-model.md` to add the exact pre-write receipt, the required UI-contract registry row for any
new manifest enrolment, and `npm run check:ui-contract` to the task's verification plan. These are requirements, not
optional evidence suggestions.

For every element type in scope, require the GR-12 built-Storybook census before design completion, before Sonnet
writes, and before review. A kickoff cannot prescribe one consumer's colour, radius, spacing, size, or typography;
it prescribes the owning token/component and the evidence that proves cross-Story parity.

Every kickoff has `## Mobile adaptation record`. Use `Scope: none` only for non-visible work. For visible work use the
exact fields and source basis in `shared/mobile-adaptation-contract.md`: surfaces, component-family and pattern IDs,
W3C/Apple/Android sources, the registry-allowed Mantine mechanism and canonical Mantine owner, the `<640px` mobile
range and actual component thresholds, compact reading/action order, required-content treatment, and direct Story
verification through the `640px` transition across affected locales. Mantine retains implementation/interaction/a11y
authority; the record only supplies semantic outcome and proof. A current Story may prove the final implementation
but never supplies the selected pattern.

For visible UI, include the responsive width/type, gutter, popup text-action, circular-control, rounded-corner, state,
locale, viewport, and interactive-control requirements selected by `shared/storybook-proof.md` and GR-3b…GR-3j/GR-9.
Require an owner visual-QA matrix; never specify retired `screenshots:assert` as a verdict. For every changed surface
that opens an overlay, name its `scripts/rendered-interaction-states.json` rows and the rendered state census gate as
its rendered proof (`shared/rendered-state-census.md`); a task-local probe is never that proof. Every visible-UI kickoff
names, per changed container and matrix Story, the container's rhythm token with its owner `path:line`, the GR-3h
vertical-rhythm probe and the GR-3i name-wrap probe with their widths: the full canonical matrix plus both sides of
every layout switch, in all four locales. A kickoff never prescribes a gap value of its own; it names the container's
rhythm token.
