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

Schema v3 never accepts an exact-generated conclusion as prose alone. Record a full immutable
`review.baseRevision`, exactly one removed `candidate`, the compiler/version/input used for it, and retained verbatim
`before.rawRule` and `after.rawRule` artifacts **including every enclosing `@media` and `@supports` wrapper**.
For `TAILWIND_V4`, `compiler.input` must be a `BASE_REVISION_FILE` whose path is read via
`git show <review.baseRevision>:<path>` and whose revision exactly equals `review.baseRevision`. The validator then
recompiles that one candidate from that source; it never treats a CSS string, a current-worktree file, or a sibling
utility as proof. Imported repository stylesheets must still equal the base revision, and imported package styles
must match the base `package-lock.json`. `media`, `supports`, declarations, and custom-property reads/writes are structured before/after
values. Every changed envelope field needs a retained owner-decision artifact; every row also needs a persisted
negative probe whose before/after outcomes match.

`review.coverage` is an exact summary derived from primary ledger rows and open findings. `review.ledgerGate` must
record the final `check:review-ledger` command with the matching pass/fail status and exit code. The validator
recomputes both, so claims in Markdown, summaries, or the ledger itself cannot conceal a failed primary row. A v1 or
v2 ledger is intentionally rejected rather than silently interpreted under this stricter protocol.

CI receives the PR base SHA and requires a changed **approved** ledger whenever reviewable implementation, workflow,
task, or review-governance files change. A ledger therefore must describe the final PR diff, not a preliminary
executor report. Use `PARTIALLY VERIFIED`, `NEEDS REVISION`, or `BLOCKED` with
`handoff.commitPush: "PROHIBITED"` until the evidence is complete; those decisions validate locally but cannot make
a reviewable PR green.
