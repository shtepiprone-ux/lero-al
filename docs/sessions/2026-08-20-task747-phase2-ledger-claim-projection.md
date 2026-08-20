# Task 747 Phase 2 — the ledger-claim projection control

**Task:** `tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md`
**Authority chain:** kickoff (still binding) → `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` (`REVISION 5`, owner-approved 2026-08-20, the build contract) → the phase 2 kickoff (execution constraints).
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Not self-approved. This status went `IMPLEMENTED -
AWAITING ORCHESTRATOR REVIEW` → `PARTIALLY IMPLEMENTED` (review found AC7 non-compliant as literally written, plus
parser defects, §0/§0b) → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` again (§0c: `npm run test` is now genuinely
green, exit 0, after an owner-native commit outside this diff resolved AC7's one remaining failure). See §0c and §7
for the full account — this is not a self-granted waiver.

## 0. Rework performed in this session (post-review)

A review of the first build (this session, same conversation) found:

1. **Parser bug — inline-code decoy adjacent to a live marker.** `findMarkerCandidates` gated the whole line on
   `stripped.includes(MARKER_ATTR)` but then extracted candidates from the **raw**, un-stripped line. A line
   containing both a backtick-wrapped documentation example and a real marker leaked the backtick-wrapped one through
   as a second, spurious candidate. **Fixed:** extraction now runs entirely against the inline-code-stripped text
   (`stripInlineCodeSpans` is length-preserving, so a real marker's characters are identical between raw and stripped
   at its own offsets; a decoy's are blanked). Regression: `npm run test` §I, "an inline-code-wrapped decoy marker
   sharing a line with a real marker does not leak a second candidate" + the before/after ordering variant.
2. **Parser bug — substring match on the marker attribute name.** `attrString.includes('data-ledger-claim')` and the
   line-level gate used the same substring check, so an ordinary, unrelated attribute like
   `data-ledger-claim-note="..."` was misread as containing the marker token, turning an unmarked span into a false
   `UNKNOWN-ATTRIBUTE` bad-input finding. **First fix (superseded, §0b):** a boundary-aware `hasMarkerToken()` regex
   requiring the token to be flanked by non-identifier characters. That regex still scanned raw attribute *text*, so
   it could not distinguish an attribute name from an attribute *value* — see §0b item 8 for the second, final fix.
   Regression: `npm run test` §I, "an ordinary span carrying only an unrelated attribute that starts with the marker
   name... is silently ignored" + a control proving a genuine extra attribute alongside a real marker is still
   correctly flagged.
3. **Comparator leniency — body trimmed before comparison.** `validateMarkerCandidate` returned `body.trim()`, so a
   body padded with stray whitespace (e.g. `"APPROVED WITH NOTES "`) silently matched a ledger-derived
   `"APPROVED WITH NOTES"`, weakening Q1's "the body must equal exactly the derived value." **Fixed:** the body is
   returned untrimmed. Regression: `npm run test` §I, "a body padded with a stray trailing space is NOT normalized to
   match" + a control proving the un-padded body still passes.

Also reworked on review request, not as a defect fix:

4. **AC3 now runs through the real parser/scanner path.** The original AC3 test called `evaluateClaim` directly with
   hand-typed `{dataSource, dataField, body}` values — it exercised the comparator but never the parser. AC3 now
   reads a real, visible carrier fixture (`scripts/__tests__/fixtures/task691-carrier.md`), locates its marker line,
   and runs it through the real `findMarkerCandidates` → `validateMarkerCandidate` before handing the **parsed**
   values to `evaluateClaim`. The one step still bypassed is `evaluateParsedMarker`'s production `data-source` path
   policy (Q2: must live under `docs/reviews/`) — the AC3 ledger fixture deliberately lives under
   `scripts/__tests__/fixtures/`, per the kickoff's own instruction for a "test-only reconstruction," so asserting it
   through that policy would only prove the policy correctly rejects a non-production path, not exercise AC3's
   parser/comparator claim. This is stated explicitly in the test's own comments, not left implicit.
5. **New isolated lifecycle proof.** `scripts/__tests__/fixtures/task747-lifecycle-carrier.md` is a dedicated fixture
   carrying one real, live marker referencing the real retained ledger
   `docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json` (read-only). `npm run test` §J proves, through
   the real end-to-end pipeline: (a) live state — the marker is found and evaluates to `pass`; (b) close-state — the
   SAME content with the marker line stripped in memory (never written to disk) yields zero results, matching Q3's
   "no marker, silent pass" rule; (c) the fixture file on disk is untouched by the proof. Neither
   `docs/backlog-archive.md` nor any real `docs/sessions/**/*.md` log was read, edited, or used for this proof — AC6
   already covers those with real files (§6).
6. **All 23 retained transcripts now hashed.** §10 lists `git hash-object` for every file under
   `docs/reviews/artifacts/2026-08-19-task747/phase2*.log` (16 from the first build + 7 from this rework), not just
   the 7 reviewed-file paths.
7. **Baseline mismatch recorded explicitly as a limitation**, not just embedded in the AC7 narrative — see §11.

`npm run test` was re-run in full after these fixes (§7 — first rework round). The unit-test delta for Task 747
itself was `43 passed, 0 failed` (was 34; +9 from the regression arms above), still `0 changes` to any pre-existing
passing test.

## 0b. Second rework round (post-review, this session)

A second review found the §0 item 2 fix (`hasMarkerToken()`, a boundary-aware regex) still insufficient:

8. **Parser bug — marker identified by text scan, not by tokenized attribute key.** `hasMarkerToken()` matched the
   literal substring `data-ledger-claim` bounded by non-identifier characters anywhere in the attribute text —
   including inside another attribute's quoted **value**. `<span data-note="data-ledger-claim">ordinary
   prose</span>` has `data-ledger-claim` bounded by `"` on both sides (a non-identifier character), so the old regex
   matched it exactly as it would a real bare declaration, misreading an ordinary span with no marker at all as a
   marker candidate. **Fixed:** `hasMarkerToken()`/`MARKER_TOKEN_RE` removed outright. Marker identification is now
   `attrStringDeclaresMarkerKey(attrString)`, which calls the real `tokenizeAttributes()` (already used by
   `validateMarkerCandidate` for full attribute validation) and checks `tokens.some(t => t.key === MARKER_ATTR)` —
   inspecting only tokenized attribute **keys**, never raw text or any attribute's value. Applied at all three call
   sites in `findMarkerCandidates` (the unterminated-tag branch's slice was also corrected to drop the literal
   `<span` prefix before tokenizing, which the raw-text regex had not needed to care about). Regression: `npm run
   test` §I, `"data-ledger-claim appearing only as ANOTHER attribute's VALUE, not as a key, is silently ignored — 0
   candidates, silent pass"` — this line reproduces the exact regex-vs-tokenization gap and would have failed against
   the §0 (first-rework) parser.
9. **Full suite re-run after the tokenized-key fix.** `npm run test`: **1** failure (the pre-existing, unrelated
   `css-var-resolvability.test.ts` count drift, §7) — `filtersPanelShell.smoke.test.tsx`'s timeout (§7, first rework
   round) did **not** recur on this run, consistent with (still not proof of) its `UNATTRIBUTED` classification.
   `typecheck`/`lint`/`check:review-ledger`/`check:mojibake`/`check:file-integrity`/`build` all re-run, all exit 0 —
   §7 updated with the `phase2r2-*` transcripts. Unit-test delta for Task 747: `44 passed, 0 failed` (was 43; +1 from
   item 8's regression arm).

No file was newly touched in this round beyond `scripts/check-ledger-claim-projection.mjs`,
`scripts/__tests__/check-ledger-claim-projection.test.ts`, the AC7 transcripts, and this session log (`docs/backlog.md`
and `package.json` remain modified from earlier rounds, not further edited here until the status-line update below) —
confirmed by `git status --porcelain -uall` (§10). No archive, closed session log, ledger, or fixture edit was
needed; AC2/AC4/AC5/AC6's real-file evidence is unaffected because the real marker (§8) and the AC5 ledger plant use
none of the constructs the tokenized-key fix changes behavior for (no adjacent decoy, no attribute-value collision)
— re-confirmed directly (§3).

## 0c. AC7 resolved — `npm run test` is now genuinely green

While this session's §0b re-verification (`phase2r2-test.log`) was already retained, a fresh `git status` check
(part of routine re-verification before finalizing this log) showed
`scripts/__tests__/css-var-resolvability.test.ts` as externally modified. Inspection
(`git log -1 -- scripts/__tests__/css-var-resolvability.test.ts`) found a new commit,
**`2819d09629d71cd3ed2186eb7b9d76e79ee07a73`, `test(css): sync owned token count`, authored by the repository owner
(Shtepiprone), 2026-08-20 14:57:05** — a single-line change updating that test's hardcoded expectation from
`toBe(256)` to `toBe(257)`, i.e. accepting the real, current `extractOwnedNames(globals.css)` count (the `--hero-bg`
token, §7) as the new baseline rather than requiring the flagged commits to be squashed. **This commit is not part of
this session's diff** — it was never staged, edited, or suggested by this session; it appeared in the working tree as
an already-committed change from a separate, owner-driven native Git process. `git show --stat 2819d09629d` confirms
its scope is exactly the one file, one line.

Re-running `npm run test` after this commit landed (`phase2r3-test.log`):

```
$ npm run test
Test Files  81 passed (81)
     Tests  1399 passed (1399)
EXIT_CODE=0
```

**All 1399 tests pass, 81/81 files, exit 0.** This is one of the two paths to full AC7 compliance named in §7/§12's
original disposition ("an owner-native re-run showing `npm run test` genuinely green") — it happened during this
session, external to this diff. `filtersPanelShell.smoke.test.tsx`'s previously `UNATTRIBUTED` timeout (§7, §0b) did
not recur on this run either — now absent on 2 of 3 full-suite runs since its single appearance, still not asserted
as more than `UNATTRIBUTED` per D37, but no longer relevant to AC7's exit code regardless.

Re-confirmed unaffected by the owner's commit: the real marker (§8, §3) still evaluates to `pass`; the AC5 ledger
plant's restore is still zero-diff (§5); `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md`,
`tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md`, and `docs/backlog-archive.md` are still byte-unchanged from
their §0 baselines (all re-hashed after the owner's commit landed, §10).

**Status corrected back up to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — not because this task manufactured a
waiver, but because the literal AC7 condition ("all exit 0") is now factually met. §7 and §12 are updated below to
reflect the current, authoritative (`phase2r3-test.log`) result.

## 0d. Fifth parser defect — malformed token before a valid marker key hid the marker entirely

A fourth review found that `tokenizeAttributes` stopped scanning **entirely** at the first token it could not parse
as either `key="value"` or a bare key — so a stray, unparseable token positioned **before** an otherwise valid
`data-ledger-claim` key (e.g. a `<span>` opening with `@bad` before the marker attribute) prevented
`attrStringDeclaresMarkerKey` from ever reaching the real key at all: `tokens` stayed empty, the whole line read as
"no marker attempt", and the line was silently ignored — fail-**open**,
the opposite of the required fail-closed contract. A malformed marker attempt must surface as bad input
(`MALFORMED-ATTRIBUTE`, exit 2); it must never quietly disappear because something *before* the key happened to be
garbage.

**Fixed:** `tokenizeAttributes`'s two failure branches (an unquoted value that consumes nothing, and a token
matching neither `key=value` nor a bare key) no longer `break`. Each now skips exactly the unparseable run — the
`"key="` prefix in the first case, the next whitespace-delimited token in the second — sets `malformedAttribute =
true`, and **continues scanning**, guaranteeing forward progress each iteration so the loop cannot hang. This is
still a strictly local, fail-closed fix, not a redesign: the tokenizer's contract (`{tokens, malformedQuoting,
malformedAttribute, leftover}`) and every existing call site are unchanged; only its resilience to a leading garbage
token changed, from "give up" to "keep looking for the marker key, then still fail closed once found."

Verified directly before writing the regression test (`node -e` probe, this session): `findMarkerCandidates` on
`<span @bad data-ledger-claim data-source="..." data-field="decision" data-ledger-hash="...">APPROVED</span>` now
returns exactly 1 candidate (`ok: true`), and `validateMarkerCandidate` on it returns `{ok: false, code:
'MALFORMED-ATTRIBUTE'}` — matching the required behavior exactly.

Regression: `npm run test` §I, `"an unparseable token BEFORE a valid data-ledger-claim key is still found as a
candidate and rejected MALFORMED-ATTRIBUTE, exit 2 — not silently ignored"` — asserts the candidate is found (not
dropped), `validateMarkerCandidate` returns `MALFORMED-ATTRIBUTE`, and the full `scanFileContent` →
`summarizeResults` path exits 2 with exactly that bad-input code. This line reproduces the exact "stop-at-first-
failure" gap and would have returned 0 candidates against every parser version from §0 through §0c.

No other file changed in this round. `git status --porcelain -uall` before writing this section: only
`scripts/check-ledger-claim-projection.mjs`, `scripts/__tests__/check-ledger-claim-projection.test.ts`, and the AC7
transcripts below are new/modified beyond what §0c already recorded. Re-confirmed unaffected: the real marker (§8)
still evaluates to `pass`; the AC5 ledger plant is still zero-diff; all frozen files (§10) are still byte-unchanged.
`npm run test`: **1400/1400, 81/81 files, exit 0** (`phase2r4-test.log`) — status stays
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; this round did not touch AC7's disposition, only added evidence.
`typecheck`/`lint`/`check:file-integrity`/`check:mojibake`/`build` were also re-run for this round and all exit 0
(`phase2r4-*.log`).

This is the task's **fifth** distinct parser defect across four review rounds (§0 items 1–3, §0b item 8, this §0d
item), not the fourth — `docs/backlog.md` is corrected to say so.

## 1. Requirement and acceptance-criteria evidence

| Requirement | Evidence | Result |
|---|---|---|
| AC1 (Phase 1 approval) | Owner approval quoted verbatim in `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` §"Owner approval", dated 2026-08-20 | Pre-existing, closed before this session |
| AC2 — checker exits 0 on today's tree with the real marker in place | §3 below | Exit 0, re-confirmed after the parser rework |
| AC2a — fence rule genuinely implemented, not just declared | Unit arms §A (4/4) | Passing, unaffected by the rework |
| AC3 — Task 691 reconstruction rejected, file/claim/derived all named, through the real parser/scanner path | §0.4 above, `npm run test` §F | Passing — now via `findMarkerCandidates`/`validateMarkerCandidate` on a real carrier fixture, not comparator-only |
| AC4 — forward plant (markdown drifts, ledger frozen) | §4 below | `CLAIM-STALE`, exit 1; restored, hash-proven |
| AC5 — reverse plant (ledger moves, markdown frozen) | §5 below | `LEDGER-MOVED`, exit 1 — distinct name from AC4; restored, hash-proven |
| AC6 — history unflagged, byte-unchanged | §6 below | 0 markers found anywhere outside this document; `docs/backlog-archive.md` byte-unchanged; no session log besides this one touched |
| AC7 — full gate suite | §7 below | **MET.** All 7 commands exit 0, including `npm run test` (1400/1400, §0d — 1 higher than §0c's 1399 because §0d added one more Task 747 regression test). See §7 for the full account, including the owner-native commit that resolved the one remaining pre-existing failure. |
| AC8 — `docs/backlog.md` within its 80-line cap | `wc -l docs/backlog.md` = 76 (cap 80); baseline was also 76 | Met, no growth |

Every bad-input category enumerated in the kickoff — missing / duplicate / unknown / malformed attribute · malformed
quoting · nested markup · malformed body · illegal source path (`..`, `*.SUPERSEDED.json`, `*.DRAFT.json`) ·
missing/unreadable source · `SHALLOW-REPOSITORY` · `SOURCE-VALIDATION-FAILED` · unsupported field · unavailable git —
has its own unit arm in `scripts/__tests__/check-ledger-claim-projection.test.ts` §B–§D, each asserting a distinct
`code` string, plus §I's regression arms for the three parser defects found in review.

## 2. Current versus required behavior

**Current (before this task):** `review.coverage` in a v4 review ledger is validator-derived and cannot lie
(`check-review-ledger.mjs:917-936`), but the same facts restated in `docs/backlog.md`, `tasks/Sprints/*.md`, and
session logs are never compared against it. Instance ⓐ (Task 691) proved this: three markdown sites said `2 P0`
while the ledger held `openP0: 4`, and `check:review-ledger` stayed green throughout, because nothing compared the
two.

**Required (after):** a live, visible `<span data-ledger-claim>` marker planted on a claim makes that specific claim
machine-checkable against the ledger that owns it, bidirectionally: drift in either the markdown or the ledger fails
closed with a distinct message (`CLAIM-STALE` vs `LEDGER-MOVED`). No marker, no check — this is a targeted
projection, not a blanket `N P0` grep (explicit non-goal, D1 decision doc).

**Negative-flow applicability** (mirrors the kickoff's own table):

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Missing or unreadable ledger | Yes | Fail closed, `MISSING-SOURCE`, exit 2 | `npm run test` §D |
| Ledger present but invalid | Yes | Fail closed via `SOURCE-VALIDATION-FAILED`, never falls back to trusting the markdown | `npm run test` §D |
| Document with no marked claim | Yes | Silent pass (Q3 decision) | AC2 run; §J's close-state arm |
| Historical file containing counts | Yes | Never flagged, never edited | AC6 §6 |
| Ordinary span sharing the marker's attribute-name prefix (`data-ledger-claim-note`) | Yes | Silently ignored, not flagged | §I regression arm |
| Validation / Authorization / RLS / Offline / Concurrent writer | No | No form, no data access, no network, no writes to product data — this is a read-only documentation-linting script | N/A by design |

## 3. AC2 — checker on today's tree, real marker in place

The real marker lives in §8 below, referencing the retained production ledger
`docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json` (`decision` field, currently
`"APPROVED WITH NOTES"`).

```
$ npm run check:ledger-claim-projection
✅ check-ledger-claim-projection PASSED — 1 live marker(s) matched their ledger, 0 drift, 0 bad input.
EXIT_CODE=0
```

Re-confirmed after §0, §0b, and §0d — the real marker line uses none of the patterns any of the three fixes address
(no adjacent inline-code decoy, no attribute-value collision, no padded body, no leading unparseable token), so
behavior is unchanged across all of them. Full transcript:
`docs/reviews/artifacts/2026-08-19-task747/phase2-ac2-checker.log`.

## 4. AC4 — forward plant (markdown drifts, ledger frozen)

Baseline (A) — `docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md`:
`fabc5d59a91a89773dbf69dc14be33df83d4c82c`

**Plant:** the marker body at §8 was changed, and only that, from `APPROVED WITH NOTES` to `APPROVED`. The ledger
was not touched.

```
$ git hash-object -- docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md
489ad8f92b15fef0d7f4eed05b1e8cc096f736e2                                            # B — differs from A
$ git hash-object -- docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
c5393b826a67b4656c0bdb3b74c33ffdcc4124e4                                            # unchanged
$ npm run check:ledger-claim-projection
❌ CLAIM-STALE docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md:70: CLAIM-STALE — "docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json" claims "APPROVED" but the ledger derives "APPROVED WITH NOTES".
Results: 0 PASS / 1 DRIFT / 0 BAD-INPUT
EXIT_CODE=1
```

**Restore:** the body was set back to `APPROVED WITH NOTES` exactly.

```
$ git hash-object -- docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md
fabc5d59a91a89773dbf69dc14be33df83d4c82c                                            # equals A exactly
$ npm run check:ledger-claim-projection
✅ check-ledger-claim-projection PASSED — 1 live marker(s) matched their ledger, 0 drift, 0 bad input.
EXIT_CODE=0
```

This plant/restore cycle ran **before** the §0 parser rework, against the pre-rework parser. Re-run against the fixed
parser in §3 above (AC2) confirms the same marker still evaluates to `pass` post-rework, so the plant's validity is
unaffected. Transcripts: `docs/reviews/artifacts/2026-08-19-task747/phase2-ac4-forward-plant.log`,
`phase2-ac4-forward-restore.log`. (This document's own hash necessarily moved again after this proof, as the
remaining narrative sections were written — the plant-and-restore hash equality above was captured at the moment of
the restore itself, which is what the acceptance criterion requires.)

## 5. AC5 — reverse plant (ledger moves, markdown frozen)

Baseline (C) — `docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json`:
`c5393b826a67b4656c0bdb3b74c33ffdcc4124e4`

**Plant:** a coordinated two-field edit, the minimum required to keep the ledger internally valid —
`review.decision`: `"APPROVED WITH NOTES"` → `"NEEDS REVISION"`, and `handoff.commitPush`: `"ALLOWED"` →
`"PROHIBITED"` (`check-review-ledger.mjs:1043-1044` requires `commitPush: PROHIBITED` for any non-approved
decision). No other field needed to change: `coverage`/`findings`/`requirements` are all decision-independent, and
`ledgerGate.status: PASSED` / `exitCode: 0` remain correct because they assert the ledger's own internal validity,
not its approval value.

```
$ npm run check:review-ledger -- --file docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
✅ docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json — valid fail-closed review ledger
✅ check:review-ledger PASSED — 1 ledger file(s) validated
EXIT_CODE=0                                                                          # MUST be 0 here, else this
                                                                                      # would prove SOURCE-VALIDATION-
                                                                                      # FAILED, not LEDGER-MOVED
$ git hash-object -- docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
7ed22b352b1710ad5f2f970fbe6f0f8160896b29                                            # D — differs from C
$ git hash-object -- docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md
fabc5d59a91a89773dbf69dc14be33df83d4c82c                                            # equals A from §4 — markdown
                                                                                      # untouched
$ npm run check:ledger-claim-projection
❌ LEDGER-MOVED docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md:70: LEDGER-MOVED — "docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json" now hashes to 7ed22b352b1710ad5f2f970fbe6f0f8160896b29, but the marker declares c5393b826a67b4656c0bdb3b74c33ffdcc4124e4. Claimed text: "APPROVED WITH NOTES".
Results: 0 PASS / 1 DRIFT / 0 BAD-INPUT
EXIT_CODE=1                                                                          # LEDGER-MOVED — distinct name
                                                                                      # from AC4's CLAIM-STALE
```

**Restore:** both fields set back exactly (`"APPROVED WITH NOTES"` / `"ALLOWED"`).

```
$ git hash-object -- docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
c5393b826a67b4656c0bdb3b74c33ffdcc4124e4                                            # equals C exactly
$ npm run check:review-ledger -- --file docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
EXIT_CODE=0
$ npm run check:ledger-claim-projection
✅ check-ledger-claim-projection PASSED — 1 live marker(s) matched their ledger, 0 drift, 0 bad input.
EXIT_CODE=0
$ git diff --stat -- docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json
(no output — zero diff, confirmed restored byte-identical, not merely hash-equal)
```

Re-confirmed after the §0 rework: `git diff --stat` for this file is still empty (checked again at the end of this
session, §10). Transcripts: `phase2-ac5-reverse-plant-ledger-validator.log`, `phase2-ac5-reverse-plant.log`,
`phase2-ac5-reverse-restore-ledger-validator.log`, `phase2-ac5-reverse-restore.log`, all under
`docs/reviews/artifacts/2026-08-19-task747/`.

## 6. AC6 — no-false-positive arm

Named examples of historical files carrying raw `P0`/count prose that must never be flagged:

- `docs/backlog-archive.md` — e.g. row `2026-08-16 | Task 741 …`: `"C3's stale 257 control expectation now matches
  the real 256 owned tokens"`; row `2026-08-16 | Task 749 …`: `"0 open P0/P1/P2"`.
- `docs/sessions/2026-08-14-task741-closedoverlaystyle-module-exit.md` — contains `P0` prose.
- `docs/sessions/2026-08-13-task695-overlay-namespace-exit.md` — contains `P0` prose.

None of these contain a `<span data-ledger-claim>` element (confirmed by the AC2 run in §3, which scans the entire
tree and found exactly **one** marker — the one planted in §8 of this document). `docs/backlog-archive.md` is
additionally never opened at all: `listScanFiles()` in `scripts/check-ledger-claim-projection.mjs` builds its file
list from exactly `docs/backlog.md` + `tasks/Sprints/*.md` + `docs/sessions/**/*.md`, and
`scripts/__tests__/check-ledger-claim-projection.test.ts` §H asserts `docs/backlog-archive.md` is absent from that
list. §J adds an isolated, dedicated-fixture proof of the strip-before-close lifecycle mechanic itself (§0.5) without
touching these three real files or any other real archive/closed-log content.

Byte-unchanged proof:

```
$ git hash-object -- docs/backlog-archive.md
c0945a6529f793a9019aefb14d2910bf5270787c        # equals the §0 baseline exactly
$ git status --porcelain -uall -- docs/backlog-archive.md docs/sessions/
?? docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md     # only the new file — nothing else touched
```

## 7. AC7 — gate suite

Five full `npm run test` runs are retained across this session; `phase2r4-test.log` (post-§0d) is authoritative.
`phase2r3-test.log` (post-§0c) was already fully green — §0d added one more Task 747 test, hence 1400 vs 1399.
`typecheck`/`lint`/`check:file-integrity`/`check:mojibake`/`build` were re-run again in §0d (`phase2r4-*`) purely to
re-verify the tokenizer fix touched nothing else; none of them depend on `css-var-resolvability.test.ts` or
`extractOwnedNames`'s count.

| Command | Exit | Authoritative transcript | Earlier transcripts (historical) |
|---|---:|---|---|
| `npm run test` | **0** | `phase2r4-test.log` — **1400/1400 pass, 81/81 files** | `phase2r3-test.log` (1399/1399) → `phase2r2-test.log` (1398/1399, 1 failure) → `phase2r-test.log` (1396/1398, 2 failures) → `phase2-test.log` (1388/1389, 1 failure) |
| `npm run typecheck` | 0 | `phase2r4-typecheck.log` | `phase2r2-typecheck.log`, `phase2r-typecheck.log`, `phase2-typecheck.log` |
| `npm run lint` | 0 | `phase2r4-lint.log` — 0 errors, 64 pre-existing warnings | `phase2r2-lint.log`, `phase2r-lint.log`, `phase2-lint.log` |
| `npm run check:review-ledger` | 0 | `phase2r2-check-review-ledger.log` — all 7 retained ledgers valid (unaffected by §0d, not re-run) | `phase2r-check-review-ledger.log`, `phase2-check-review-ledger.log` |
| `npm run check:mojibake` | 0 | `phase2r4-check-mojibake.log` — 0 artifacts in 2980 files | `phase2r2-check-mojibake.log`, `phase2r-check-mojibake.log`, `phase2-check-mojibake.log` |
| `npm run check:file-integrity` | 0 | `phase2r4-check-file-integrity.log` — 45/45 clean | `phase2r2-check-file-integrity.log`, `phase2r-check-file-integrity.log`, `phase2-check-file-integrity.log`, `-final.log` |
| `npm run build` | 0 | `phase2r4-npm-build.log` | `phase2r2-npm-build.log`, `phase2r-npm-build.log`, `phase2-npm-build.log` |

**All 7 commands now exit 0.** The path to this: two failures were found on full-suite runs during this session's
own rework rounds (§0/§0b) — a pre-existing `css-var-resolvability.test.ts` count-mismatch (256 vs the real 257,
caused by an already-flagged, already-committed `--hero-bg` token sitting on the branch before this session started)
and an `UNATTRIBUTED` `filtersPanelShell.smoke.test.tsx` timeout that appeared once and did not reproduce in
isolation or on later full-suite runs. Neither was touched by this task's diff — confirmed at every round by
`git status --porcelain -uall -- src/` returning empty output. The `css-var-resolvability.test.ts` failure was then
resolved by an **owner-native commit external to this task's diff** — `2819d09629d71cd3ed2186eb7b9d76e79ee07a73`,
`test(css): sync owned token count`, 2026-08-20 14:57:05 — which this session discovered mid-verification and
documented in §0c rather than silently absorbing. `filtersPanelShell`'s timeout has now not recurred on 2 of 3
full-suite runs; its classification stays `UNATTRIBUTED` per D37 (a passing re-run does not retro-explain a failing
one), but it no longer affects `npm run test`'s exit code on the authoritative run.

All 44 of this task's own unit tests pass in every round from §0b onward; the delta attributable to Task 747 is
`+44 passed, +0 failed` relative to `main`.

**AC7 disposition: MET.** `npm run test` exits 0 (`phase2r3-test.log`), and always did for every check this task's
own diff is responsible for. Full approval no longer requires a waiver — the "owner-native re-run showing `npm run
test` genuinely green" path named in the earlier draft of this section happened during this session, not after it.

## 8. The real live marker

Planted on this document. Referenced ledger: `docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json`,
`data-field="decision"`, current value `"APPROVED WITH NOTES"` (`review.decision`, verbatim string compare per the
decision doc's Q1 answer). This marker was the subject of the AC4 forward plant (§4) — its body was temporarily
changed and restored — and observed the AC5 reverse plant (§5) fire `LEDGER-MOVED` while remaining byte-unchanged
itself. Re-confirmed passing after §0, §0b, and §0d (§3).

Decision: <span data-ledger-claim data-source="docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json" data-field="decision" data-ledger-hash="c5393b826a67b4656c0bdb3b74c33ffdcc4124e4">APPROVED WITH NOTES</span>

## 9. Canonical UI decision record

Not applicable — this task has no visible UI artifact. It adds a Node governance script, its unit tests, and
markdown/JSON evidence. No `className`, style prop, or rendered component is touched.

## 10. Files Changed

| Path | Reason | `git hash-object` before | after |
|---|---|---|---|
| `scripts/check-ledger-claim-projection.mjs` | New checker; reworked in §0 (3 fixes), §0b (tokenized-key marker identification), §0d (resilient scan past a leading unparseable token) | N/A (new file) | `ec4e09773c7dc8ffe97a717eeb957397d27f5222` |
| `scripts/__tests__/check-ledger-claim-projection.test.ts` | Unit arms for every bad-input category, AC2a, D1 comparator, §0's AC3 rework and §I/§J regression + lifecycle arms, §0b's tokenized-key regression arm, §0d's resilient-scan regression arm (45 tests) | N/A (new file) | `b8ec5e1da843d64f8407ebc52b3ab5b0b12276ce` |
| `scripts/__tests__/fixtures/task691-reconstruction.review-ledger.json` | AC3 test-only reconstruction fixture (ledger side) | N/A (new file) | `b6a434d3abfece46c82460643617464ada92132f` |
| `scripts/__tests__/fixtures/task691-carrier.md` | AC3 rework — real visible carrier marker for the parser/scanner-path test (§0.4) | N/A (new file) | `78b39ee339b108942474f1138692bc2dd1484808` |
| `scripts/__tests__/fixtures/task747-lifecycle-carrier.md` | Isolated lifecycle-rule proof fixture (§0.5) | N/A (new file) | `364efb82bb7c89de51fff1fe0ff87536df7c3984` |
| `package.json` | One `check:` script added (`check:ledger-claim-projection`) | `dd927724da01b8c09340bf026c6572e37093d146` | `ad87decb94e73f41e892a7a5e1e82013c416503f` |
| `docs/backlog.md` | AC8 concise current-state update; status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` → `PARTIALLY IMPLEMENTED` (§0/§0b) → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` again (§0c, AC7 met); defect/test counts refreshed in §0d (5 defects, 45 tests, 1400/1400) | `1fafdc61f46bcb4287a7257c605d39fece50c235` | `a39265776c266131c343fbcf7dd2c3b7ed3b6265` |
| `docs/sessions/2026-08-20-task747-phase2-ledger-claim-projection.md` (this file) | Session log + the real live marker + the AC4 plant carrier + this rework | N/A (new file; a file cannot carry its own post-write hash) | — |
| `docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json` | AC5 reverse plant — temporarily edited (2 fields), then fully restored | `c5393b826a67b4656c0bdb3b74c33ffdcc4124e4` | `c5393b826a67b4656c0bdb3b74c33ffdcc4124e4` (equal — `git diff --stat` confirms zero diff, re-checked after §0 AND §0b) |

**All 39 retained transcripts under `docs/reviews/artifacts/2026-08-19-task747/`, hashed:**

| File | `git hash-object` |
|---|---|
| `phase2-ac2-checker.log` | `d9136687a0dacfa62d8cdaade48c1a0d8de44a6f` |
| `phase2-ac4-forward-plant.log` | `c70ee37fedd5a21eebde8ca6dd70274879482121` |
| `phase2-ac4-forward-restore.log` | `d9136687a0dacfa62d8cdaade48c1a0d8de44a6f` |
| `phase2-ac5-reverse-plant-ledger-validator.log` | `6ebf434ea6dd508d6f586b29fbc3a90bdf822ad8` |
| `phase2-ac5-reverse-plant.log` | `55e129239bce04c05d314ae326d8818ac6897b99` |
| `phase2-ac5-reverse-restore-ledger-validator.log` | `6ebf434ea6dd508d6f586b29fbc3a90bdf822ad8` |
| `phase2-ac5-reverse-restore.log` | `d9136687a0dacfa62d8cdaade48c1a0d8de44a6f` |
| `phase2-check-file-integrity-final.log` | `2a9d7ce69b33d1fdfd7fa73f4bb5dbd6c083f4cc` |
| `phase2-check-file-integrity.log` | `d218b311201ab52af097742f5aa496b4c67361d2` |
| `phase2-check-mojibake-final.log` | `a509e4d61735dfc53d9b3faa28ab001bf938a0f4` |
| `phase2-check-mojibake.log` | `b32dd49ff0769e654206017f076202f1c46572de` |
| `phase2-check-review-ledger.log` | `2b1390e0ac4c4a8367368c965b0a19f2fc16dd91` |
| `phase2-lint.log` | `e82e54298d676ed914b21e3e4705a0e83f40ebd0` |
| `phase2-npm-build.log` | `eae0987fa829e6d9cc27d621accc490f1c00c471` |
| `phase2-test.log` | `a47e89c970b7ee404bad2d2b4fdcc558fede91f4` |
| `phase2-typecheck.log` | `8053669fd2877351009fc45aba25b721aca1721d` |
| `phase2r-check-file-integrity.log` | `e06a5e8d37b0a81e6280885afbe378bb35e8bb20` |
| `phase2r-check-mojibake.log` | `f787c5578dce362542108ea0cbb317cadbc388e5` |
| `phase2r-check-review-ledger.log` | `2b1390e0ac4c4a8367368c965b0a19f2fc16dd91` |
| `phase2r-lint.log` | `e82e54298d676ed914b21e3e4705a0e83f40ebd0` |
| `phase2r-npm-build.log` | `8613f092d05a8c873c07ffc65a78261cb19f4476` |
| `phase2r-test.log` | `7739525880fd8727ebea3561177ce4df92564d3d` |
| `phase2r-typecheck.log` | `8053669fd2877351009fc45aba25b721aca1721d` |
| `phase2r-check-file-integrity-final.log` | `34cedca70d7b91b909b7d631da6d400935debb2e` |
| `phase2r-check-mojibake-final.log` | `366a177fd833321e2c8664aba0fd48e34fdb22ef` |
| `phase2r2-check-file-integrity.log` | `906948c0da5a5a4478a78a26b7bc50ddcb9a359e` |
| `phase2r2-check-mojibake.log` | `e2d07deaf42af9aaadda3d4884ec1f239eefeed0` |
| `phase2r2-check-review-ledger.log` | `2b1390e0ac4c4a8367368c965b0a19f2fc16dd91` |
| `phase2r2-lint.log` | `e82e54298d676ed914b21e3e4705a0e83f40ebd0` |
| `phase2r2-npm-build.log` | `b98d058bc9a1c341429693e8fc9f376dfe1ccb71` |
| `phase2r2-test.log` | `272f4f923ca97d582c0859b6704858dff727c65d` |
| `phase2r2-typecheck.log` | `8053669fd2877351009fc45aba25b721aca1721d` |
| `phase2r3-test.log` | `c3b4cfd6d661db88069608ae1b04c4bca1e676b9` |
| `phase2r4-check-file-integrity.log` | `819f21c3fb979f071ab1b9539b84380eeaaa043e` |
| `phase2r4-check-mojibake.log` | `a09fa847f234ecf222f49b138e6c83ace1034358` |
| `phase2r4-lint.log` | `e82e54298d676ed914b21e3e4705a0e83f40ebd0` |
| `phase2r4-npm-build.log` | `9176e76c5655dbfe85c660e39dfb379d0717ce45` |
| `phase2r4-test.log` | `51726b97a78200de71b785b6a893a63500b6f8ba` |
| `phase2r4-typecheck.log` | `8053669fd2877351009fc45aba25b721aca1721d` |

(Several hashes repeat across files — expected: `phase2-ac2-checker.log`/`phase2-ac4-forward-restore.log`/
`phase2-ac5-reverse-restore.log` all captured the identical "PASSED, 1 marker, 0 drift, 0 bad input" transcript
content at different points in the session; `phase2-check-review-ledger.log`/`phase2r-check-review-ledger.log` and
`phase2-lint.log`/`phase2r-lint.log`/`phase2-typecheck.log`/`phase2r-typecheck.log` are byte-identical reruns because
those gates' output does not depend on the parser rework.)

**Frozen, confirmed byte-unchanged (§0/§8/§9 of the kickoff's verification plan), re-checked after §0, §0b, and §0d:**

| Path | Hash | Status |
|---|---|---|
| `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` | `2463dfa6cda6971ed1ed8a8af7378881af888f6a` | Unchanged from §0 baseline |
| `tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md` | `36f75b16ff77981eaa224213f356b659fde4b7ad` | Unchanged from §0 baseline |
| `.github/workflows/`, `scripts/check-review-ledger.mjs` | — | `git status --porcelain -uall` empty |
| `docs/reviews/*.SUPERSEDED.json` | — | `git status --porcelain -uall` empty |
| `docs/backlog-archive.md` | `c0945a6529f793a9019aefb14d2910bf5270787c` | Unchanged from §0 baseline |
| Task 746, Task 750 | — | No file referencing either number touched |

## 11. Assumptions, deviations, and limitations

- **`npm run test` was red for most of this session, and is green as of §0c** — resolved by an owner-native commit
  external to this task's diff (`2819d09629d71cd3ed2186eb7b9d76e79ee07a73`), not by any fix this task made. Recorded
  as a limitation on attribution, not a claim of this task's own doing: the AC7 gate's final green state depends on
  a commit outside `git status --porcelain -uall`'s reported scope for this session's own changes. §0c's causal
  identification (that commit, that content, that timestamp) is `FACT` — directly inspected via `git log`/`git show`
  — not inferred.
- **The `filtersPanelShell` timeout is recorded `UNATTRIBUTED` per D37**, not asserted as a flake — see §7. It no
  longer affects AC7's exit code, but its mechanism was never established either way.
- **No `--verify-gate` flag.** The kickoff permits but does not require one, following the `check:assertion-liveness`
  precedent. AC4/AC5's real-file plants plus the vitest unit suite already cover every required bad-input arm and
  the D1 comparator; adding an in-memory self-test flag on top would duplicate coverage without adding evidence, so
  it was left out to keep the build to exactly what the decision authorised (kickoff §2, "Build scope").
- **AC5's coordinated edit was 2 fields** (`review.decision`, `handoff.commitPush`), not the `findings`-array
  cascade the decision doc's own warning anticipated ("the unvalidated four-edit recipe is exactly what sank an
  earlier revision"). The `decision` field was chosen specifically to avoid that cascade. `decision` only required
  the one dependent field (`handoff.commitPush`), verified live in §5 rather than assumed.
- **`--verify-gate` for `check-review-ledger.mjs` was not re-run** — out of scope; this task reads that script,
  never modifies it (confirmed frozen, §10).
- The marker's carrier is this session log itself, not `docs/backlog.md` or a `tasks/Sprints/*.md` file. This keeps
  the plant/restore cycle isolated to one purpose-built file rather than interleaving it with `docs/backlog.md`'s
  80-line-cap-constrained prose.
- **AC3's fixture ledger is deliberately outside `evaluateParsedMarker`'s production path-policy gate** — see §0.4.
  This is the kickoff's own design (a "test-only reconstruction under `scripts/__tests__/fixtures/`"), not a gap
  introduced in this rework.

## 12. Opus handoff

- Real diff owned by this task: `scripts/check-ledger-claim-projection.mjs` (checker, reworked §0 → §0b → §0d, five distinct parser defects across four review rounds), `scripts/__tests__/check-ledger-claim-projection.test.ts` (45 tests), 3 fixture files under `scripts/__tests__/fixtures/`, `package.json` (+1 script), `docs/backlog.md` (AC8 + status corrections), this session log. `docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json` shows **zero diff** — please re-verify with `git diff -- docs/reviews/2026-08-16-task741-final-closeout.review-ledger.json` (should be empty).
- **Not part of this diff, but present in the working tree/history at review time:** commit `2819d09629d71cd3ed2186eb7b9d76e79ee07a73` (`test(css): sync owned token count`, owner-authored, §0c) — a one-line change to `scripts/__tests__/css-var-resolvability.test.ts` unrelated to Task 747, which is why `npm run test` is green in §7. Please confirm this commit's presence and scope independently (`git show --stat 2819d09629d`) rather than trusting this log's account.
- Please independently re-run `npm run check:ledger-claim-projection` and `npx vitest run scripts/__tests__/check-ledger-claim-projection.test.ts` (expect 45/45), and `npm run test` (expect 1400/1400), rather than trusting this log's transcripts.
- AC7 is now MET (§7) — no waiver is being requested. The only open, non-blocking item is `filtersPanelShell.smoke.test.tsx`'s `UNATTRIBUTED` timeout (§7/§11), which does not affect any exit code on the authoritative run and is not part of this task's scope to investigate further.
- No mutating git command was run or suggested by this task. All of this task's own changes are unstaged in the working tree.
