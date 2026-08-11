# Persisted review ledgers

Every implementation review stores one JSON ledger here as
`YYYY-MM-DD-taskNNN-short-name.review-ledger.json`. Copy
[`docs/review-ledger-template.json`](../review-ledger-template.json), replace every example value with retained
evidence, then validate it:

```powershell
npm.cmd run check:review-ledger -- --file docs/reviews/YYYY-MM-DD-taskNNN-short-name.review-ledger.json
```

The ledger is not a summary. Every P0/P1/P2 row must identify its final subject, full required tuple scope,
persisted artifact, actual command, counter-check, and verdict. For generated CSS/cascade work, populate the exact
semantic envelope — including selector, `@media`, `@supports`, layer, specificity, order, declarations, and custom
property behavior. The validator rejects an approval if any primary row is not `VERIFIED`, required tuple coverage is
missing, a required artifact path is absent, an exact-semantic field is blank, or an open P0/P1/P2 finding remains.

For every required-scope dimension other than `subjects`, either list the complete values or put a concrete reason in
`requiredScope.notApplicable`; omission is invalid. Evidence rows may cover only real values, never an invented
"not applicable" tuple.

CI receives the PR base SHA and requires a changed **approved** ledger whenever reviewable implementation, workflow,
task, or review-governance files change. A ledger therefore must describe the final PR diff, not a preliminary
executor report. Use `PARTIALLY VERIFIED`, `NEEDS REVISION`, or `BLOCKED` with
`handoff.commitPush: "PROHIBITED"` until the evidence is complete; those decisions validate locally but cannot make
a reviewable PR green.
