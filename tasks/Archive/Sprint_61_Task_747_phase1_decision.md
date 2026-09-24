# Task 747 — Phase 1 decision: the assertion format (REVISION 5)

**Status:** APPROVED by the owner 2026-08-20 — the quoted, dated approval is recorded below (kickoff Appendix A, checkpoint 2 satisfied); Phase 2 may proceed under this document. **D1 is closed** (quoted below, 2026-08-20) and is the only pre-existing owner decision; every other answer below is the rework brief's own specification, not an open recommendation.

## Q1 — How is a claim marked live?

The live claim is a visible, declared inline HTML element, not a hidden HTML comment and not a registry entry. It contains the whole visible value the control verifies:

```
Open: <span data-ledger-claim data-source="docs/reviews/example.review-ledger.json" data-field="openP0" data-ledger-hash="<git-hash-object>">4 P0</span>
```

For `data-field="decision"`, the element body is the complete visible decision, for example `APPROVED WITH NOTES`. There is no separate `value` attribute.

This is not a generic `N P0` grep: the checker discovers only literal `data-ledger-claim` elements; `data-field` declares the ledger association; and it reads only that element's body. For `openP0`/`openP1`/`openP2`, the body must equal exactly the derived number followed by `P0`/`P1`/`P2`. For `decision`, it must equal `review.decision` exactly. The `P0`/`P1`/`P2` label must be inside the element, never beside it.

All attribute values are double-quoted. `data-source`, `data-field`, and `data-ledger-hash` are mandatory; `data-ledger-claim` is the required marker attribute. A marker is one line, has no nested marker, has no unknown or duplicate attribute, no `>` or HTML entity in an attribute or body, and uses a 40-character lower-case hexadecimal `data-ledger-hash`. Missing, duplicate, unknown, or malformed attributes; malformed quoting; nested markup; and malformed body are distinct bad-input messages with exit 2. Markers inside fenced code blocks or inline code spans are ignored by the checker — a checker-evaluated syntax rule, not an author exemption.

| # | Rejected mechanism | Reason |
|--:|---|---|
| 1 | Fenced block, declared source + `key=value` fields | Visible block noise in the rendered document. |
| 2 | YAML front-matter per file | One value set per file cannot express N per-row claims in `docs/backlog.md`. |
| 3 | Generated region | Would imply document writes; the checker never edits documents. |
| 4 | Registry JSON (`assertion-liveness-registry.json` model) | Duplicates the visible claim elsewhere. |

The adopted mechanism is a **fifth** option — none of the four above.

## Q2 and Q4 — Which claim fields are in scope, where do their sources come from, and how are they validated?

v1 fields: `openP0`, `openP1`, `openP2`, `decision`. Deferred: `total`, `verified`, `unverified`, `handoff.commitPush`.

`openP0`/`openP1`/`openP2` derive from `findings` where `priority` equals the field's priority and `status === 'OPEN'` (`check-review-ledger.mjs:927-929`); `review.coverage` is never read directly. `decision` is read and string-compared against `review.decision` verbatim.

A production `data-source` must be a normalized repository-relative path below `docs/reviews/` ending exactly in `.review-ledger.json`. Paths containing `..`, `*.SUPERSEDED.json`, and `*.DRAFT.json` are illegal production sources: exit 2. The historical Task 691 superseded ledger is not a production source.

Before evaluating a production source, the checker must, in order: (1) fail `SHALLOW-REPOSITORY`, exit 2, if `git rev-parse --is-shallow-repository` reports true; (2) confirm the source exists and is readable, else a named exit-2 error; (3) run `node scripts/check-review-ledger.mjs --file <source>` once per distinct source — a non-zero result is `SOURCE-VALIDATION-FAILED`, exit 2, without parsing the validator's prose output or asserting the source is specifically invalid, since the same non-zero result can also mean the validator environment is unavailable.

Missing, unreadable, illegal, or unvalidated source; unavailable `git`; and an unsupported `field` all fail closed with exit 2. **v1 has no `SOURCE-RETIRED` branch** — a missing source cannot be evaluated and is bad input, deliberately avoiding any inference of historical renames from the current tree. If one run contains both bad input and drift, the checker prints every drift finding it found and still returns exit 2.

## Q3 — How does the control tell a LIVE claim from HISTORY, and what is its lifecycle?

The checker scans `docs/backlog.md`, `tasks/Sprints/*.md`, and `docs/sessions/**/*.md`, but inspects only declared markers; a file or a number carrying no marker silently passes. `docs/backlog-archive.md` is never opened. A `*.json` file is read only when a marker names it as `data-source`.

A marker exists only while its carrier document is live. Immediately before closing a session log or sprint, or migrating a backlog row to the archive, every marker is removed from that carrier; only then is it closed or archived. A closed or archived document is never re-pinned or otherwise edited to clear this gate. Phase 2's evidence must demonstrate this lifecycle end to end and show `docs/backlog-archive.md` plus two closed session logs unflagged and byte-unchanged.

## Bidirectionality (D1) and the Phase 2 proof mechanism

Owner decision D1 (2026-08-20), reproduced verbatim:

| Current hash | Visible element body | Result |
|---|---|---|
| matches `data-ledger-hash` | differs from ledger-derived text | `CLAIM-STALE`, exit 1 |
| differs | any body | `LEDGER-MOVED`, exit 1 |
| matches | equals ledger-derived text | pass |

Every drift message names the marker's file and line, the claimed visible text, and the ledger-derived text.

After owner approval, Phase 2 adds exactly one checker, its unit tests, one `check:` script, and at least one real visible marker on a live claim. AC3 is a test-only reconstruction under `scripts/__tests__/fixtures/`: it contains the Task 691 state `openP0: 4` alongside a visible `2 P0` claim, and the checker must report the file, the claim, and the derived value. AC4 edits only the visible element body and restores it. AC5 edits a real retained ledger, keeps that ledger valid under every required coordinated change, proves `LEDGER-MOVED`, and fully restores it — the AC5 four-edit recipe is not described as viable until demonstrated in the Phase 2 plant itself. A `--verify-gate` flag may supplement the real plants; it never replaces them.

## Owner approval

**D1 CLOSED** (2026-08-20, quoted above). Every other answer above is the rework brief's own specification, not an open recommendation left for this document to propose. The owner's quoted approval below approves this `REVISION 5` document as a whole and lifts the Phase 2 block.

> **Owner approval (2026-08-20):** Approve Task 747 REVISION 5 as the Phase 2
> contract. I explicitly accept the Phase 1 evidence variance: the overwritten
> decision's contemporaneous pre-edit hash and the new session log's hash were
> not captured. This is not retroactively represented as compliant evidence.
> The retained `revision5-*` validation logs are accepted as Phase 1 evidence.
> Phase 2 may begin only under this approved decision.
