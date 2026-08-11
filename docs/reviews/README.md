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
missing, a required artifact path is absent, a structured semantic field is incomplete, or an open P0/P1/P2 finding
remains.

For every required-scope dimension other than `subjects`, either list the complete values or put a concrete reason in
`requiredScope.notApplicable`; omission is invalid. Evidence rows may cover only real values, never an invented
"not applicable" tuple.

Schema v2 never accepts an exact-generated conclusion as prose alone. Record the immutable `review.baseRevision`,
the exact removed `candidate`, the compiler/version/input used for it, and retained verbatim `before.rawRule` and
`after.rawRule` artifacts **including every enclosing `@media` and `@supports` wrapper**. `TAILWIND_V4` rows are
recompiled by the validator from the exact candidate; a sibling
utility cannot stand in for it. `media`, `supports`, declarations, and custom-property reads/writes are structured
before/after values. Every changed envelope field needs a retained owner-decision artifact; every row also needs a
persisted negative probe whose before/after outcomes match. A v1 ledger is intentionally rejected rather than
silently interpreted under this stricter protocol.

CI receives the PR base SHA and requires a changed **approved** ledger whenever reviewable implementation, workflow,
task, or review-governance files change. A ledger therefore must describe the final PR diff, not a preliminary
executor report. Use `PARTIALLY VERIFIED`, `NEEDS REVISION`, or `BLOCKED` with
`handoff.commitPush: "PROHIBITED"` until the evidence is complete; those decisions validate locally but cannot make
a reviewable PR green.
