<!--
  Task 747 AC3 — test-only reconstruction carrier fixture.

  This is NOT a real project document and is never in check-ledger-claim-projection.mjs's
  scan scope (docs/backlog.md, tasks/Sprints/*.md, docs/sessions/**/*.md). It exists so the
  AC3 test can run a real live marker through the actual parser/scanner path
  (findMarkerCandidates -> validateMarkerCandidate), not just hand-build inputs for the
  comparator directly.

  Reproduces instance (a): three real markdown sites once claimed "2 P0" while the ledger
  (docs/reviews/2026-08-12-task691-mantinelistingcardpattern-detailwind.review-ledger.SUPERSEDED.json)
  actually held openP0: 4, and check:review-ledger stayed green because nothing compared the
  two. task691-reconstruction.review-ledger.json reconstructs that ledger state; the marker
  below reconstructs the false claim.
-->

Open: <span data-ledger-claim data-source="scripts/__tests__/fixtures/task691-reconstruction.review-ledger.json" data-field="openP0" data-ledger-hash="b6a434d3abfece46c82460643617464ada92132f">2 P0</span>
