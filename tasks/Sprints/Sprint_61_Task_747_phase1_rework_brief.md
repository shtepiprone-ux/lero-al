# Task 747 — Phase 1 rework brief (REVISION 5)

**Status:** READY FOR EXECUTOR — document-only Phase 1 rework. Phase 2 remains blocked until the owner approves the resulting decision. This brief replaces rejected REVISION 4; do not execute an earlier brief.

**Authority:** Sprint_61_kickoff_prompt_Task_747_Ledger_State_Projection_Gate.md remains binding. The only pre-existing owner decision is D1: any ledgerHash mismatch is LEDGER-MOVED; a matching hash with a different claim is CLAIM-STALE; both matching is pass. This brief is an executor contract, not an owner approval.

## 1. Deliverable and write set

Rewrite Sprint_61_Task_747_phase1_decision.md as REVISION 5, no more than 70 lines, answering Q1–Q4 below. Update the Task 747 row in docs/backlog.md concisely and add one new Phase 1 session log. Do not edit any earlier session log, superseded ledger, docs/backlog-archive.md, scripts/, scripts/__tests__/, package.json, or workflow file.

Do not self-approve. No Phase 2 code, test, marker, or package-script write is allowed in this session.

## 2. Q1 — chosen marker format

The live claim is a visible, declared inline HTML element, not a hidden HTML comment and not a registry entry. It contains the whole visible value the control verifies:

~~~md
Open: <span data-ledger-claim data-source="docs/reviews/example.review-ledger.json" data-field="openP0" data-ledger-hash="<git-hash-object>">4 P0</span>
~~~

For data-field="decision", the element body is the complete visible decision, for example APPROVED WITH NOTES. There is no separate value attribute.

This is not a generic N P0 grep: the checker discovers only literal data-ledger-claim elements; data-field declares the ledger association; and it reads only that element's body. For openP0/openP1/openP2, the body must equal exactly the derived number followed by P0/P1/P2. For decision, it must equal review.decision exactly. The P0/P1/P2 label must be inside the element, never beside it.

All attribute values are double-quoted. data-source, data-field, and data-ledger-hash are mandatory; data-ledger-claim is the required marker attribute. A marker is one line, has no nested marker, has no unknown or duplicate attribute, no > or HTML entity in an attribute or body, and uses a 40-character lower-case hexadecimal data-ledger-hash. Missing, duplicate, unknown, or malformed attributes; malformed quoting; nested markup; and malformed body are distinct bad-input messages with exit 2. Markers inside fenced code blocks or inline code spans are ignored by the checker; this is a checker-evaluated syntax rule, not an author exemption.

Reject all four preflight alternatives in the decision: fenced block (visible block noise), YAML front-matter (one value-set per file cannot express backlog rows), generated region (would imply document writes), and registry JSON (duplicates the visible claim elsewhere). State that the chosen visible inline element is a fifth mechanism.

## 3. Q2 and Q4 — fields, sources, validation

v1 fields are openP0, openP1, openP2, and decision. Defer total, verified, unverified, and handoff.commitPush.

- openP0/openP1/openP2: derive from findings where priority equals the field priority and status === OPEN (check-review-ledger.mjs:927-929). Do not read review.coverage.
- decision: read and string-compare review.decision.

A production data-source must be a normalized repository-relative path below docs/reviews/ ending exactly in .review-ledger.json. Paths with .., *.SUPERSEDED.json, and *.DRAFT.json are illegal production sources: exit 2. The historical Task 691 superseded ledger is not a production source.

Before evaluating a production source, the checker must:

1. fail SHALLOW-REPOSITORY with exit 2 if git rev-parse --is-shallow-repository reports true;
2. check that the source exists and is readable, otherwise emit a named exit-2 error; and
3. run node scripts/check-review-ledger.mjs --file <source> once per distinct source. A non-zero result is SOURCE-VALIDATION-FAILED, exit 2. Do not parse the validator's prose output or claim that the source is specifically invalid: the result can also mean the validator environment is unavailable.

Missing, unreadable, illegal, or unvalidated source; unavailable git; and unsupported field all fail closed with exit 2. v1 has no SOURCE-RETIRED branch: a missing source cannot be evaluated and is bad input. This deliberately avoids inferring historical renames from the current tree.

If one run contains both bad input and drift, print all drift findings but return exit 2.

## 4. Q3 — liveness and lifecycle

Scan docs/backlog.md, tasks/Sprints/*.md, and docs/sessions/**/*.md, but inspect only declared markers. A file or number with no marker silently passes. Never open docs/backlog-archive.md; JSON is read only when named as a marker source.

A marker exists only while its carrier document is live. Immediately before closing a session log or sprint, or migrating a backlog row to the archive, remove every marker from that carrier; then close or archive it. A closed or archived document is never re-pinned or otherwise edited to clear this gate. The Phase 2 evidence must demonstrate this lifecycle and show docs/backlog-archive.md plus two closed session logs unflagged and byte-unchanged.

## 5. Bidirectionality and Phase 2 proof

The decision must reproduce D1's full table verbatim:

| Current hash | Visible element body | Result |
|---|---|---|
| matches data-ledger-hash | differs from ledger-derived text | CLAIM-STALE, exit 1 |
| differs | any body | LEDGER-MOVED, exit 1 |
| matches | equals ledger-derived text | pass |

Every drift message names the marker file and line, claimed visible text, and ledger-derived text.

After owner approval, Phase 2 must add one checker, its unit tests, one check: script, and at least one real visible marker on a live claim. AC3 is a test-only reconstruction under scripts/__tests__/fixtures/: it contains the Task 691 state openP0: 4 and a visible 2 P0 claim, and must report the file, claim, and derived value.

AC4 edits only the visible element body and restores it. AC5 edits a real retained ledger, keeps that ledger valid with every required coordinated change, proves LEDGER-MOVED, and fully restores it. Do not describe the AC5 four-edit recipe as viable until it is demonstrated in the Phase 2 plant. A --verify-gate flag may supplement, never replace, the real plants.

## 6. Verification and handoff

For this document-only rework, record git status --porcelain before and after, hashes before/after for every file changed in this session, npm run check:mojibake, npm run check:file-integrity, npm run build, and line counts for the decision (at most 70) and backlog (at most 80). The session report maps Q1–Q4 and this brief's requirements to the actual text written.

The executor's final status is IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. The next action is one independent review of REVISION 5. Only after the owner approves that decision may Sonnet receive the kickoff plus the approved decision for Phase 2.
