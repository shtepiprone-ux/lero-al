# Opus review: adversarial implementation and UI audit

Rebuild the requirement/AC ledger and trace every row to shipped code and concrete evidence. Try relevant failure
paths: absent/invalid input, stale data, repeated action, partial failure, authorization, locale expansion, small
viewport, changed consumers, and regression. A non-applicable branch needs a concrete reason.

For every changed visible artifact, read `shared/mobile-adaptation-contract.md`, `shared/ui-token-contract.md`,
`shared/enforcement-model.md`, and `shared/storybook-proof.md`, then inspect in this order:

1. direct Story for the real production component and all required states;
2. canonical primitive/pattern and actual semantic token definition/consumer path;
3. composition Story using that real component; and finally route proof;
4. Story fixtures separately from production data flow;
5. Story decorators/render and rendered behavior at task-required locales/viewports.

For every Story × state that opens an overlay, re-run the rendered state census of `shared/rendered-state-census.md`
on the final build (app root and every portal root separately); until its gate (task 923) is approved, such a task
is `BLOCKED — RENDERED STATE CENSUS (923)`, and afterwards it needs the gate green on its own Stories' rows; a
root-only census never approves it.

Run the final built-Storybook parity census yourself. A local visual decision, missing semantic token process,
Story-level styling, raw value/palette semantic literal, unlocalized visible Story text, duplicate child markup, or
one meaning with two looks without a dated owner decision is `NEEDS REVISION`. Geometry checks never override this
result. Verify all required GR-3b…GR-3j, GR-9, GR-12 receipts, the `check:ui-contract` result,
`check-mobile-adaptation-contract` result, and every Story
control. A missing registry row for a newly enrolled component, a changed Story-local presentation violation, or a
checker/hook bypass attempt is `NEEDS REVISION`.

For every selected mobile component family, compare the saved `Mantine mechanism` and `Mantine owner` fields with the
actual implementation. Reject a custom viewport branch when Mantine responsive/visibility props or the named
canonical owner already express the behavior; reject any change to Mantine focus, keyboard, dismissal, or other
native interaction without explicit Mantine-supported evidence. A visually acceptable screenshot does not cure this
mechanism conflict.

If required evidence is unavailable, use `NEEDS REVISION`, `PARTIALLY VERIFIED`, or `BLOCKED`; do not infer an
approval. The detailed UI and evidence protocol is selected through `docs/rule-index.md`.
