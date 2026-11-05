# Opus review: adversarial implementation and UI audit

## R3. Trace implementation semantics and dependent behavior

Follow `shared/secure-code-review.md` section 4 for every task: read the change-review report of the candidate and
answer each of its lines, read every changed file individually, and report findings in that section's form.
Rebuild the requirement/AC ledger and trace every row to shipped code and concrete evidence. Try relevant failure
paths: absent/invalid input, stale data, repeated action, partial failure, authorization, locale expansion, small
viewport, changed consumers, and regression. A non-applicable branch needs a concrete reason.

Read complete relevant functions and their callers, not only added lines. Follow real UI/HTTP entry points through
server guards, queries/RPCs, DB grants/RLS and external effects where applicable. Inspect response/error mappings
and test doubles after changed reads/writes. For deletions check all imports, Stories, cases and sensitivity scripts.
Keep requested behavior, current behavior and effective runtime enforcement distinct. A new product preference is
an owner question, not a defect against the saved contract.

If the saved route itself is confirmed unexecutable, disable its affected sidecars immediately under
`shared/orchestration-state.md`, retain the finding, and continue the independent audit before consolidating a correction.

**Exit:** each AC has inspected implementation and a relevant counter-check; any unchecked boundary is explicit.

## R4. Inspect assertions and independently execute proof

Inspect exact collected test names/assertions, fixtures, mocks, target config and allow/deny/error controls under
`shared/security-testing.md`. Run the mapped/focused checks yourself on the candidate and examine their raw results;
verify actual collection, no skipped required cases and the intended assertion failure in sensitivity evidence.
A governance sensitivity record outside the four legacy contracts that lacks method in-memory and its current break
spec is NEEDS REVISION, and so is any break planted in a live file.
Mocks prove only their local boundary; source scans do not prove real RLS. Verify synthetic cleanup and forbidden
effects. Preserve byte/hash restoration proof for a deliberate break, and never mutate a live boundary without its
task/environment authorization. A proposed break that cannot safely run is missing evidence, not a passing test.

Compare required aggregate results with R2's baseline by identity/cause. Verify contract digests and rerun `verify`
under `shared/workflow-gates.md`; report unavailable inputs separately from implementation/test defects.

**Exit:** required security/regression evidence is current and inspected, or its exact failure/gap is recorded. Do
not proceed to an approval claim with an unresolved required gap.

## R5. Verify applicable canonical UI and integration evidence

Run the 16d rendered-component census yourself on the final applicable build. A rendered in-scope component
without a direct Story/manifest entry is `NEEDS REVISION`, even when an aggregate coverage count is green.

First apply `shared/canonical-component-reuse.md`: inspect ready components/Stories, inherit their settled design,
and verify integration. Research only named gaps; a ready match must not be replaced with a duplicate.
For every changed visible artifact, read `shared/mobile-adaptation-contract.md`, `shared/ui-token-contract.md`,
`shared/enforcement-model.md`, and `shared/storybook-proof.md`, then inspect in this order:

1. direct Story for the real production component and all required states;
2. canonical primitive/pattern and actual semantic token definition/consumer path;
3. composition Story using that real component; and finally route proof;
4. Story fixtures separately from production data flow;
5. Story decorators/render and rendered behavior at task-required locales/viewports.

For every Story × state that opens an overlay, re-run the rendered state census of `shared/rendered-state-census.md`
on the final build (app root and every portal root separately). For the gate's first review use its candidate and
the bootstrap order in that contract; never require its own prior approval. A consuming overlay task stays
`BLOCKED — RENDERED STATE CENSUS (923)` until the gate is approved, then requires it green on its Stories' rows.
A root-only census never approves it.

Run the affected final built-Storybook parity census yourself for a changed shared visual contract or reproduced
parity defect; apply the reuse rule's exemption for unchanged canonical chrome. A local visual decision, missing
semantic token process, Story-level styling, raw value/palette semantic literal, unlocalized visible Story text, duplicate child markup, or
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

Inspect the final non-Q0 app build and relevant runtime/server logs, not only exit codes or HTTP status. Where a
required gate reads committed blobs, run it after the owner's commit with verified base/head; it cannot approve a
dirty candidate by reading an older HEAD. UI checks may be N/A only with a scope-based reason. Record the exact
Story/state/locale/width/root coverage; a subset never silently replaces the selected matrix.
