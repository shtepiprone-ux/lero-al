# Task 747 — Phase 1 rework brief (REVISION 3)

**Sprint:** 61 · **Kickoff:** `Sprint_61_kickoff_prompt_Task_747_Ledger_State_Projection_Gate.md` (unchanged, still
the authority) · **Target artifact:** `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md`
**Status:** Phase 1 REOPENED. `REVISION 2` was rejected in orchestrator review. Phase 2 remains blocked.
**Still binding:** no file under `scripts/`, `scripts/__tests__/` or `package.json` may be touched. This is a
document-only rework.

## 0. What happened, so you do not repeat it

`REVISION 1` and `REVISION 2` were written by the orchestrator, not by an executor, and were not independently
reviewed before delivery. Two independent adversarial reviews then found two P0s and nine further defects, several
of them introduced by those very edits. Read §2 as a list of corrections to a flawed document, not as a fresh
design. The mechanism choice (inline HTML-comment marker) survives; most of the reasoning around it does not.

## 1. Owner decisions (quoted — these are settled, do not re-open)

**D1 — AC5, decided 2026-08-20:**

> Обирайте 1 — literal: будь-який hash mismatch → LEDGER-MOVED. Правило має бути таким: — ledgerHash збігається,
> але значення різні → CLAIM-STALE. — ledgerHash не збігається — незалежно від того, збігається value чи ні →
> LEDGER-MOVED. — Збігаються і hash, і value → pass. Так AC5 виконується буквально: будь-яка зміна source ledger
> робить pin застарілим і дає окремий failure. Фраза в decision про "correct-by-coincidence … passes" має бути
> прибрана.

That truth table is total and replaces the conditional table in `REVISION 2`. `D1` ceases to be an open question.

**D2 — process, decided 2026-08-20:** the executor writes `REVISION 3`; the orchestrator reviews it. Author and
reviewer must not be the same agent.

## 2. Mandatory corrections

Each item states the defect, the evidence, and what the corrected document must say. Every line/file reference below
was verified against the tree on 2026-08-20.

### R1 — P0. Delete the legal-`source` restriction. Establish validity by delegation instead.

`REVISION 2` ruled that `source` must end `.review-ledger.json`, making `*.SUPERSEDED.json` bad input. That makes
**AC3 unreachable**: instance ⓐ *is* `docs/reviews/2026-08-12-task691-….review-ledger.SUPERSEDED.json`, so the named
acceptance fixture would exit 2 with no ledger-derived value, and AC3 plus Appendix A checkpoint 4 both require the
derived value in the message. The restriction is also unforced: `parseFileArgument` (`check-review-ledger.mjs:1284-1300`)
applies **no** suffix or directory filter, and `--file` routes any path through the full
`validateLedger(…, { checkPaths: true })` at `:1347` — proof: `node scripts/check-review-ledger.mjs --file package.json`
schema-validates `package.json` as a ledger.

**Required:** `source` is any path under `docs/reviews/` ending `.review-ledger.json` **or**
`.review-ledger.SUPERSEDED.json`. Validity is established **per source, at check time**, by
`node scripts/check-review-ledger.mjs --file <source>` — exit 0 means the ledger is internally consistent, including
its `review.coverage`. This is what actually closes the "an unvalidated ledger could lie" gap; a path ban never did.

**Record these consequences in the document** (they bind Phase 2):

- delegation costs one Node spawn per **distinct** source — dedup by source; measured 76 ms–1466 ms each, because
  `validateLedger({checkPaths:true})` invokes a native CSS compiler (`lightningcss`);
- `--file` returns **only 0 or 1**. Missing file, missing argument and schema-invalid all return 1. Exit 2 must be
  synthesized by the new checker;
- `--file` output is emoji prose on stdout+stderr with embedded multi-line Node stack traces and no `--json`. Consume
  the **exit code only**; do not grep the text;
- `--file` skips what the default walk does at `:1296-1297` (draft/superseded discovery) and `:1358` (orphaned-
  superseded back-reference). A `--file` PASS therefore does **not** imply `npm run check:review-ledger` passes.

### R2 — P0. Define what is *not* a marker. The document currently breaks AC2 against itself.

`tasks/Sprints/*.md` is in the declared scan scope, and line 12 of the decision document is a complete, literal
`<!-- ledger-claim: source=docs/reviews/<name>.review-ledger.json field=openP0 value=4 … -->`. On its first run the
control would fail on the file that specifies it — `<name>` does not exist. AC2 requires exit 0 on today's tree.

**Required:** the format must exclude markers inside fenced code blocks and inline code spans, stated as part of the
format, not as an implementation detail. The corrected document must be checkable by its own rule.

### R3 — P1. State exit-1/exit-2 precedence for an absent `source`.

`REVISION 2` classified a missing source as exit 2 in Q4 *and* as exit 1 `SOURCE-RETIRED` in the failure table, with
no ordering rule — so `SOURCE-RETIRED` could never fire. R1 dissolves most of this case (a superseded path is now a
legal source), but the branch still exists when a source is gone from disk entirely.

**Required:** successor resolution is attempted **before** bad input is declared. If a retained ledger names
`<source-stem>.review-ledger.SUPERSEDED.json` in `review.supersedes`, the result is exit 1 `SOURCE-RETIRED` and the
message names the successor path; otherwise exit 2. Note the verified caveat: 2 of the 5 `*.SUPERSEDED.json` files
were *born* superseded (git status `A`) and never had a retained stem, so the substitution cannot resolve for them.

### R4 — P1. AC1: compare all four enumerated mechanisms, and admit the choice is a fifth.

The rejection table lists mechanisms 2, 3 and 4 only. Preflight §4 mechanism 1 is *"fenced code block with a declared
source path and `key=value` fields"* — it is neither adopted nor rejected, while the adopted mechanism (inline HTML
comment) is not any of the four. AC1 requires the document to name **every** rejected alternative with its reason.

**Required:** a rejection row for mechanism 1, and one sentence stating plainly that the chosen mechanism is a fifth
option with why it beats mechanism 1 (a fenced block visibly alters the rendered document; the HTML comment does not).

### R5 — P1. Implement D1's truth table verbatim; delete the old conditional table.

Three rows, total, no conditions: hash matches + values differ → `CLAIM-STALE`; hash differs → `LEDGER-MOVED`
regardless of value; hash and value both match → pass. Delete the sentence about a correct-by-coincidence claim
passing with a stale pin, and delete the matching entry from the limitations list. `D1` is no longer an open decision.

### R6 — P1. Session logs return to scan scope. `D2` was never an owner decision.

`REVISION 2` escalated the session-log exclusion to the owner on the grounds that the repository has no machine-
readable closed-signal. Its own Q3 rule dissolves that: unmarked prose is a silent pass, so an unmarked closed
session log costs nothing and is never flagged, and AC6 is satisfied because the control reports and never rewrites.

**Required:** `docs/sessions/**` joins the scan scope; kickoff §1's three surfaces are all covered; the `D2` block is
deleted. If you disagree, the burden is to show a *concrete* file that would be wrongly flagged — not a category.

### R7 — P1. The plants must be real and restorable. In-memory arms do not satisfy AC4/AC5.

AC4 requires the `git hash-object` of the touched file and both runs recorded; AC5 requires a restore; checkpoint 5
requires *"both restore clean"*. Nothing is touched by an in-memory fixture, so there is nothing to hash and nothing
to restore. The stated justification was also wrong: editing a finding's `status` **together with** the matching
`coverage.openP0` keeps the ledger valid under `validateCoverageSummary` (`:917-936`) *and* moves the derived value,
so a real, valid, restorable reverse plant is available in-tree.

**Required:** AC4/AC5 are recorded plants on real files with before/after hashes and restores. `--verify-gate` may
ship **in addition**, as a repeatable arm and still as a flag on the single new script (kickoff §4 allows one
`check:` entry), but it does not replace the recorded plants.

### R8 — P1. The gate must not ship inert.

The tree carries zero markers, and `REVISION 2` never commits Phase 2 to authoring one. AC2 and checkpoint 3 would
then pass by checking nothing, and kickoff §1's objective — *make a live state claim checkable* — would not be
advanced by the delivered artifact.

**Required:** Phase 2 authors at least one marker on a real live claim. Verified constraint to design around: **all
seven retained ledgers have `openP0 = openP1 = openP2 = 0`**, so a numeric marker on today's tree can only assert
zero. `decision` is where a non-trivial live claim exists; the backlog row for a task with a retained ledger is the
natural first site.

### R9 — P1. The `ledgerHash` rationale is empirically false. Fix the reason, then keep or drop the method.

`REVISION 2` justifies `git hash-object` by claiming an in-process SHA-1 would diverge on "this CRLF checkout".
Measured: `.gitattributes` line 1 is `* text=auto eol=lf`, `core.autocrlf=false`; across all 7 retained ledgers,
`docs/backlog.md` and the decision document — **0 CRLF bytes and 0 hash divergence**. A 2952-file sweep found 5
divergences, all build-log artifacts, no ledger and no markdown.

**Required:** delete the CRLF claim. Either keep `git hash-object` and justify it honestly (it is the identity git
itself records, and it stays correct if `.gitattributes` ever changes), or compute in-process and say why that is
safe here. Do not keep a decision propped up by a false measurement.

### R10 — P2. Assert the "no marked claim" negative flow, do not merely decide it.

Kickoff §7 requires that row to be *"asserted either way"*, and AC7 requires the new unit arms present. Silent pass
needs its own unit arm.

### R11 — P2. Fix the citations.

- `:1064` is the body of `walkLedgers`, **not** `runValidation` — which begins at `:1291` and calls `walkLedgers` at
  `:1315`, only in the non-`--file`, non-`--ci` branch.
- The walk **recurses into subdirectories** (`:1057`), so the retained set is not a fixed seven; "12 on disk, 7
  validated" is today's count, not a property of the rule.
- *"`:988-989` … the validator only asserts membership in `VALID_DECISIONS`. Nothing is derived"* — the **read**
  classification is right, the word *only* is wrong: `review.decision` is additionally cross-validated at
  `:1028-1044`, `:860-862`, and feeds `validateGateReceipt` at `:955-963`.
- The same `:1064` error is mirrored in `docs/backlog.md` and must be corrected there too.

### R12 — P2. Meet the length requirement.

Kickoff §3 asks for *"a short written decision — one page."* `REVISION 2` is 128 lines / ~1300 words. With `D1` and
`D2` deleted (R5, R6), the AC1 load-bearing content — Q1–Q4 plus four rejection rows — fits in roughly 45 lines.
**Target ≤ 70 lines.** Justifications that belong in a review do not belong in a decision.

### R13 — P3. `D3` is the only open owner decision left. State a recommendation with it.

Claim lifecycle: all `tasks/Sprints/*.md` are scanned including closed sprints, so a marker outliving its sprint
stays live and can demand re-pinning. Marker presence separates marked from unmarked, not LIVE from HISTORY. Keep
`D3` open, but do not present it neutrally — recommend one option and say why.

### R14 — P3. State consistency.

`docs/backlog.md` row 747 and the decision document must agree on the revision number. They currently do not.

## 3. Do not undo these — they were verified correct

- The `openP0/openP1/openP2` derivation: count `findings` where `priority === '<PN>'` **and** `status === 'OPEN'`
  (`:927-929`). Independently re-derived across all 7 retained ledgers: agrees 7/7. `PRIMARY_PRIORITIES` (`:922`)
  gates only `total`/`verified`/`unverified` — the three fields v1 defers.
- Exit 1 (detected failure) vs exit 2 (cannot evaluate), per `check-assertion-liveness.mjs:93,98`.
- `--verify-gate` as a flag on one binary, matching `check-review-ledger.mjs` (`:1292`, `:1381`).
- Silent pass on unmarked prose, forced by AC2.
- Scope discipline: nothing outside kickoff §5, nothing wired into `governance-pr.yml`, no auto-fix, no history
  edits, 746 and 750 not folded in.

## 4. Acceptance for this rework

R1–R14 addressed · document ≤ 70 lines · all four enumerated mechanisms carry a rejection reason and the fifth is
declared · D1's truth table verbatim · only `D3` left open · `docs/backlog.md` consistent and ≤ 80 lines · every
line-number citation re-verified against the file before it is written · zero files under `scripts/`,
`scripts/__tests__/`, `package.json`.

## 5. Verification plan

```
git status --porcelain                       # before first write
#   … write REVISION 3 …
npm run check:mojibake                       # touched text files
npm run check:file-integrity
npm run build                                # Q1 profile, non-Q0
wc -l tasks/Sprints/Sprint_61_Task_747_phase1_decision.md   # ≤ 70
wc -l docs/backlog.md                        # ≤ 80
git status --porcelain                       # compare to the start snapshot
```

Report `git hash-object` before/after for every changed file — the previous session's contract miss. Status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or `BLOCKED`, never self-approved.
