<!--
  Task 747 — isolated lifecycle-rule fixture/carrier (Q3: "a marker exists only while its
  carrier document is live... every marker is removed from that carrier before it closes or
  archives; a closed or archived document is never re-pinned to clear this gate").

  This file is NOT in check-ledger-claim-projection.mjs's scan scope and is never edited to
  simulate a close — the "close-state" half of the proof is a stripped in-memory copy of this
  same content, built inside the test itself
  (scripts/__tests__/check-ledger-claim-projection.test.ts, lifecycle proof section). Nothing
  under docs/backlog-archive.md or any real closed docs/sessions/**/*.md log is touched by
  this proof.

  The marker references the real retained production ledger
  docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json (read-only) so the "live
  state" half runs through the full real scanner pipeline, including the production
  data-source path policy — no gitOps faking needed. This fixture never writes to that ledger.
-->

# Fixture carrier — live state

Decision: <span data-ledger-claim data-source="docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json" data-field="decision" data-ledger-hash="c5393b826a67b4656c0bdb3b74c33ffdcc4124e4">APPROVED WITH NOTES</span>
