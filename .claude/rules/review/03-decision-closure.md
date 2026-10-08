# Opus review: verdict and closure

Use one decision only:

- `APPROVED` only when every primary requirement/AC and required QA evidence is verified with no unresolved P0–P2;
- `APPROVED WITH NOTES` only when approval conditions hold and only P3/notes remain;
- `NEEDS REVISION` for a wrong/incomplete result or missing required evidence;
- `PARTIALLY VERIFIED` or `BLOCKED` when evidence/access cannot support a final verdict.

Each confirmed finding names severity, requirement IDs, exact location, observed/expected behavior, evidence/impact,
specific resolution, and verification. No generic “fix this” finding.

For `NEEDS REVISION`, revise the existing kickoff and active state records in the same turn, reopen it to verify the
single corrected route, and provide only a commit-only owner handoff for Opus-authored artifacts. For approval,
synchronize GR-5 state, archive the closed task/stale closed rows, re-read active backlog, run its gate, and emit the
required receipt. Reconcile real status/diff and then give the explicit-path owner commit + verified push handoff.
Never issue a handoff for unreconciled or unapproved work. Every permitted commit handoff is an unattributed owner
commit: `Co-Authored-By`, AI/agent credit, and `--author` are forbidden in every command and message.

The final response uses the concise headings and exact command format in `docs/orchestrator-procedures.md`; detailed
transcripts remain in the review/session record.
