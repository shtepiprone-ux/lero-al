# Reviews

## Review files (owner, 2026-11-19)

Owner, 2026-11-19 (translated): "write reviews as separate files, and add links to these files in the kickoff".

Every review Opus writes is one Markdown file here, `Task_<n>_Review_<k>.md` (Review 1, 2, … of Task `<n>`), in the
format of `.claude/rules/secure-code-review.md` §5: the title line `# Task <n> — Review <k>`, the links to the kickoff
and to the OWASP record (`docs/security/owasp/reviews/Task_<n>.json`), the review summary whose first line is the
verdict, the findings, the Revision items and the open parts. The kickoff's "## Review" holds only one link per review,
in order: `- [Review <k> — <verdict>](../../docs/reviews/Task_<n>_Review_<k>.md)` (`.claude/rules/flow.md` §3).

`scripts/quality/check-files.mjs` refuses review text written into a kickoff, a link to a missing file or to another
task, links out of order, and a review file without its title, its verdict line or its link from the kickoff;
`scripts/quality/owasp.mjs` reads the verdict and the finding numbers of the OWASP record from the linked files, and
the CI task gate counts the verdict of the last linked review.

## Persisted review ledgers (records before 2026-11-06)

The JSON ledgers below are records of the review system the governance reset of 2026-11-06 replaced
(`docs/governance-reset-2026-11-06.md`); no new ledger is written. Under that system every implementation review stored
one JSON ledger here as
`YYYY-MM-DD-taskNNN-short-name.review-ledger.json`. Copy
[`docs/review-ledger-template.json`](../review-ledger-template.json), replace every example value with retained
evidence, then validate it:

```powershell
npm.cmd run check:review-ledger -- --file docs/reviews/YYYY-MM-DD-taskNNN-short-name.review-ledger.json
```

Do not keep `.review-ledger.DRAFT.json` files in this directory: the all-ledger command fails rather than silently
excluding them. A replaced predecessor may be retained as `.review-ledger.SUPERSEDED.json` only when the valid v4
successor names that exact path in `review.supersedes`; renaming a ledger is never a way to obtain a vacuous green
gate.

The ledger is not a summary. Every P0/P1/P2 row must identify its final subject, full required tuple scope,
persisted artifact, actual command, counter-check, and verdict. For generated CSS/cascade work, populate the exact
semantic envelope — including selector, `@media`, `@supports`, layer, specificity, order, declarations, and custom
property behavior. The validator rejects an approval if any primary row is not `VERIFIED`, required tuple coverage is
missing, a required artifact path is absent, a structured semantic field is incomplete, or an open P0/P1/P2 finding
remains. A non-approved ledger records those facts; it does not become an invalid JSON artifact merely because the
implementation is wrong or evidence is absent.

For every required-scope dimension other than `subjects`, either list the complete values or put a concrete reason in
`requiredScope.notApplicable`; omission is invalid. Every evidence row declares `coverageRole`: only `COVERS` counts
toward tuple coverage; `GAP_WITNESS` documents why a named tuple has no qualifying evidence. Evidence rows may cover
only real values, never an invented "not applicable" tuple. If actual `COVERS` evidence does not span the complete
required scope, `coverageGaps` must enumerate the exact uncovered tuples without overlap and link each gap to an
open P0/P1/P2 finding. A row with any coverage gap cannot be `VERIFIED`.

Schema v4 never accepts an exact-generated conclusion as prose alone. Record a full immutable
`review.baseRevision`, exactly one removed `candidate`, the compiler/version/input used for it, and retained verbatim
`before.rawRule` and `after.rawRule` artifacts **including every enclosing `@media` and `@supports` wrapper**.
For `TAILWIND_V4`, `compiler.input` must be a `BASE_REVISION_FILE` whose path is read via
`git show <review.baseRevision>:<path>` and whose revision exactly equals `review.baseRevision`. The validator then
recompiles that one candidate from that source; it never treats a CSS string, a current-worktree file, or a sibling
utility as proof. Imported repository stylesheets must still equal the base revision, and imported package styles
must match the base `package-lock.json`. `media`, `supports`, declarations, and custom-property reads/writes are structured before/after
values. `assessment: "EQUIVALENT"` requires a retained owner-decision artifact for every changed envelope field and
an equivalent negative probe. `assessment: "MISMATCH_RECORDED"` is allowed only for a non-approved decision: every
unapproved changed field must appear exactly once in `observedSemanticDeltas`, linked to an open P0/P1/P2 finding.
An unequal negative probe must use that same finding. An owner-authorized delta and an observed defect can never
describe the same field.

`review.coverage` is an exact summary derived from primary ledger rows and open findings. `review.ledgerGate` records
whether the **ledger record** passes structural validation, not whether the implementation passed review. Therefore a
complete `NEEDS REVISION` ledger can and must show `PASSED`/`0`; its open finding, primary-row status, and prohibited
handoff still make approval impossible. The validator recomputes both, so claims in Markdown, summaries, or the
ledger itself cannot conceal a failed primary row. Every requirement declares `findingIds`, and every finding lists
the reciprocal machine-checked `requirementIds`. A v1, v2, or v3 ledger is intentionally rejected rather than
silently interpreted under this stricter protocol.

CI receives the PR base SHA and requires a changed **approved** ledger whenever reviewable implementation, workflow,
task, or review-governance files change. A ledger therefore must describe the final PR diff, not a preliminary
executor report. Use `PARTIALLY VERIFIED`, `NEEDS REVISION`, or `BLOCKED` with
`handoff.commitPush: "PROHIBITED"` until the evidence is complete; those decisions validate locally but cannot make
a reviewable PR green.
