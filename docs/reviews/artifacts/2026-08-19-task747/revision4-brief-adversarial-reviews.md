# Task 747 — adversarial review dossier for the REJECTED `REVISION 4` brief

**Date:** 2026-08-20 · **Subject:** `tasks/Sprints/Sprint_61_Task_747_phase1_rework_brief.md` (rejected, not executed)
**Produced for:** owner review before any further Phase 1 iteration.
**Contents:** §1 orchestrator's own raw verification (commands + unedited output) · §2 reviewer A full report ·
§3 reviewer B full report · §4 orchestrator adjudication, including findings rejected and errors owned.

---

## §1 Orchestrator's raw verification

Everything below was run by the orchestrator directly, not relayed from a reviewer.

### 1.1 "Empty drift surface" — every tracked version of every retained ledger

```
for f in docs/reviews/*.review-ledger.json; do
  for c in $(git log --all --full-history --format=%H -- "$f"); do
    git show "$c:$f" | python3 -c "…print(decision, openP0, openP1, openP2)"
  done
done
```

```
### 2026-08-12-task691R-mantinelistingcardpattern-
   APPROVED             openP0=0 openP1=0 openP2=0
   APPROVED             openP0=0 openP1=0 openP2=0
   APPROVED             openP0=0 openP1=0 openP2=0
### 2026-08-13-task695-overlay-namespace-exit.revi
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
### 2026-08-13-task748-rework2-evidence-apparatus.
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0
### 2026-08-15-ci-baseline-recovery.review-ledger.
   APPROVED             openP0=0 openP1=0 openP2=0
   APPROVED             openP0=0 openP1=0 openP2=0
   APPROVED             openP0=0 openP1=0 openP2=0
### 2026-08-15-task741-revision1-evidence-apparatu
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0   (×4)
### 2026-08-15-task749-revision2-geometry-scroll-a
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0   (×7)
### 2026-08-16-task741-final-closeout.review-ledge
   APPROVED WITH NOTES  openP0=0 openP1=0 openP2=0   (×2)
```

**26 tracked versions across 7 ledgers. `decision` and `openP0/1/2` are identical in every one.**

**What this does and does not prove.** It establishes the *historical* true-positive count for the v1 field set is
zero. It does **not** establish that the gate is unnecessary — the owner is right that AC3–AC5 plants exist exactly
to prove a control works against *future* drift, and a control with no historical instance can still be the
mechanism that keeps the count at zero. Its actual bearing is narrower and still real: it constrains **AC9** (which
real claim can be marked first) and it means the first marker will be green on day one and can only go red through
a hash re-pin until a ledger is genuinely re-decided.

### 1.2 What actually changes when a ledger changes — task749, first blob vs last

```
git diff 23028d2d0 95215314e -- docs/reviews/2026-08-15-task749-…json | (key histogram)
```

```
     14 - key:path        14 + key:path
      2 - key:observable   2 + key:observable
      2 - key:command      2 + key:command
      1 - key:reviewedRevision
      1 - key:baseRevision
      1 - key:result       1 - key:freshness      1 - key:claim
      1 -   ".screenshots/task749-evidence",
      1 -   ".screenshots/rendered-assert/2026-08-15T18-14",   (and 6 more .screenshots entries)
      1 -   ".next/BUILD_ID",
```

Seven tracked versions; the churn is evidence-path repointing from `.screenshots/` and `.next/` to
`docs/reviews/artifacts/`. **Cost figure for D1's chosen semantics: a marker pinned at version 1 would have required
6 re-pins, against 0 changes to any projected field.** Recorded as the price of the semantics the owner selected,
not as a defect.

### 1.3 Per-source `--file`, with timings

```
for f in docs/reviews/*.review-ledger.json; do node scripts/check-review-ledger.mjs --file "$f"; done
```

```
rc=1   544ms 2026-08-12-task691R-…      Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
rc=0   115ms 2026-08-13-task695-…
rc=0    89ms 2026-08-13-task748-rework2-…
rc=0    80ms 2026-08-15-ci-baseline-recovery
rc=1  1474ms 2026-08-15-task741-revision1-…  Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
rc=0   132ms 2026-08-15-task749-…
rc=0    74ms 2026-08-16-task741-final-closeout
```

5 pass, 2 fail — both **solely** on the absent native binding in this Linux sandbox. The owner's Windows run of the
full walk is exit 0, 7/7 (`docs/reviews/artifacts/2026-08-19-task747/phase1-check-review-ledger.log`). Cost per
distinct source: 74–1474 ms plus a Node spawn.

### 1.4 Shallow clone — reproduced by the orchestrator, not relayed

```
git clone --depth 1 file://$HOME/mnt/lero-al /tmp/sh747     # CLONE_RC=0
cd /tmp/sh747 && ln -s <repo>/node_modules node_modules
git rev-list --count HEAD                                   # 1
node scripts/check-review-ledger.mjs --file docs/reviews/2026-08-13-task695-overlay-namespace-exit.review-ledger.json
```

```
   - …review.baseRevision does not resolve to a local commit: f42e9b855bcd119ad2041c0daf1c5b6d06d637c4
   - …review.ledgerGate.status claims PASSED, but this ledger evaluates to FAILED
   - …review.ledgerGate.exitCode claims 0, but this ledger evaluates to 1
❌ check:review-ledger FAILED — 1 invalid ledger file(s)
RC=1
```

A ledger that passes in the full clone fails at depth 1, via `immutableCommit()`'s `git cat-file -e <sha>^{commit}`.
Note the cascade: the environmental failure **manufactures** two derived "ledgerGate claims PASSED but evaluates to
FAILED" errors, so an environmental failure is textually indistinguishable from genuine invalidity.

```
grep -rn "fetch-depth" .github/workflows/     →  governance-pr.yml:34:  fetch-depth: 0     (one hit)
grep -rc "actions/checkout" .github/workflows/*.yml → governance-pr.yml:5, governance-scheduled.yml:1
```

**6 checkout steps, exactly 1 sets `fetch-depth: 0`.** Any job other than Governance Check runs shallow.

### 1.5 `SOURCE-RETIRED` population — the brief's own error, confirmed

```
python3 — collect every review.supersedes entry across the 7 retained ledgers; compare to the 5 files on disk
```

```
superseded on disk: 5   named by a retained successor: 5
NAMED   2026-08-11-task691-…      NAMED   2026-08-12-task691-…
NAMED   2026-08-13-task748-overlay-utility-exit-…      NAMED   2026-08-13-task748-rework-…
NAMED   2026-08-14-task741-closedoverlaystyle-module-exit-…
```

The rule the brief specifies (search `review.supersedes` for the transformed `.SUPERSEDED.json` path) resolves
**5 of 5**. The brief's "3 of 5 / 2 of 5" is a *git-history* predicate — did the stem ever exist un-suffixed —
which is a different question. `check-review-ledger.mjs:1358-1367` fails the repo if any superseded file is
unreferenced, so the brief's `exit 2` branch is dead code inside `docs/reviews/`.

---

## §2 Reviewer A — factual accuracy and internal consistency (full report, verbatim)

> **P0 — §3.6's mandated statement is false; the brief orders a new falsehood written into three files.** §3.6
> defines SOURCE-RETIRED resolution as *search retained ledgers' `review.supersedes` for the transformed
> `.SUPERSEDED.json` path*. I enumerated every `review.supersedes` entry across the 7 retained ledgers: **all 5
> superseded files are named**. The rule as specified resolves for **5 of 5**, not 3. Root cause: §2's `3 of 5 /
> 2 of 5` is a *git-history* predicate; §3.6's rule is a *present-tree* predicate. `:1358`'s orphan check
> *guarantees* every superseded file is referenced, so §2's own evidence refutes §3.6. D7 and Appendix A ckpt 2
> then order this false figure into three files. This is the §0 failure pattern reproduced verbatim.
>
> **P0 — §3.2's "test-fixture carve-out (below)" is never defined; AC3 is unsatisfiable as written.** One grep hit
> for `carve` — the forward reference itself. §3.2 makes legal `source` = retained ledgers rooted at
> `docs/reviews`; §6 row 4 makes anything else `exit 2`. AC3 requires a fixture under `scripts/__tests__/fixtures/`
> to be rejected *naming the ledger-derived value* — but that source is illegal input, so no derived value exists.
> The executor must invent the carve-out. Precisely the AC3-unreachable defect D2 claims to have fixed.
>
> **P1 — D1 declares itself total and then two other rules give a different outcome for the same input.** Missing
> source with a successor: no file → no hash → D1 says `LEDGER-MOVED`; §3.6/§6 say `SOURCE-RETIRED`. Source present,
> content changed, `--file` now non-zero: D1 → `LEDGER-MOVED` (exit 1) and D5 requires the drift reported; §6 row 3
> → `exit 2`, "never trust the marker". §3.7 settles the process exit code, never the per-marker name or whether
> hash-compare runs before or after `--file`.
>
> **P1 — §4 orders an edit to a closed session log that D3 cites the kickoff as forbidding (undeclared divergence).**
> D3's rationale is that re-pinning "would require editing a closed session log, which kickoff §4 and §5 forbid";
> §4 then mandates exactly that edit for the `REVISION 3` log. Kickoff `:75-76` is categorical. No amendment declared.
>
> **P1 — Appendix A ckpt 2's detector produces a false pass on 2 of the 3 files.** The literal string `0 of 5`
> occurs only in the session log. The decision doc carries it as "none of today's 5"; the backlog as "**none** of
> the 5". An executor running the stated comparator marks it done with the falsehood intact in two files.
>
> **P2 — §0's justification for its burden-of-proof rule is false.** "`git log --all -- <path>` returns zero for
> every path in this repository" — measured: `docs/backlog.md` → 777; `package.json` → 52;
> `scripts/check-review-ledger.mjs` → 4. The method is blind only for renamed/deleted paths.
>
> **P2 — AC7 is unsatisfiable in the environment §2 measured.** Full walk here is exit 1 (lightningcss). Nothing
> states which machine AC7/AC2 are adjudicated on.
>
> **P2 — Appendix A ckpt 0 trips immediately.** Actual `git status --porcelain` also shows
> `M tasks/Sprints/Sprint_61_Task_747_phase1_rework_brief.md`, which the stated start state omits.
>
> **P2 — AC8 asks the checker to observe something §2 proves it cannot.** The only signals are the exit code
> (0 or 1) and text §2 forbids consuming. Environmental failure and genuine invalidity are observationally
> identical — confirmed: the lightningcss failures emit `…ledgerGate.status claims PASSED, but this ledger
> evaluates to FAILED`.
>
> **P2 — AC9's marker has no specified home.** No file is named; and the choice of which retained ledger silently
> decides whether AC2 passes, given 2 of 7 fail `--file` here. Two guesses.
>
> **P2 — kickoff instance ⓑ obligation dropped without declaration.**
>
> **P3** — task749 finding row omits `P3:RESOLVED ×1` (9 entries, not 8) · "both failures are *solely*
> lightningcss" overstated: each emits 2 cascade violations · `:1054-1064` straddles two functions
> (`walkFilesWithSuffix` 1052-1061, `walkLedgers` 1063-1065); behaviour described is correct · §8 demands AC1–AC11
> results while §1/§4 forbid exercising most of them · §2 says `scripts/__tests__/fixtures/` "is created by this
> task" while §0 binds zero files there · **the current decision doc `:10` carries a bare unfenced
> `<!-- ledger-claim: … -->` with unquoted values → under §3.1+D4 that is a live marker with a missing source,
> defeating AC2.**
>
> **VERIFIED CORRECT:** 12 = 7 retained + 5 superseded, 0 draft · `walkLedgers` suffix + recursion · all 7
> `decision` values, 5 of 7 `APPROVED WITH NOTES` · `VALID_DECISIONS` `:31-37`, 3 of 5 contain spaces · finding
> rows for task695, task748-rework2, task741-revision1 · `openP0=openP1=openP2=0` for all seven, zero P0/P1
> findings, zero OPEN P2 · per-source `--file` 5/2 · owner's Windows log · fixture ⓐ coverage, 24 reviewedPaths,
> the two `.next` hashes, `--file` exit 1, `ls .next/static/css/` 8 files neither hash present, `.next` gitignored
> · both `git log` methods and the 3-of-5/2-of-5 split *as a git-history statement* · every remaining line citation
> `:922 :927-929 :968-974 :988-989 :1028-1044 :1284-1288 :1292 :1296-1297 :1347 :1358 :1379 :1381` exact ·
> `--file package.json` schema-validates it · exit codes 0/1 only · `.gitattributes` + zero CRLF divergence ·
> vitest, 11 test files, no fixtures dir.
>
> **Bonus (D6): the four-edit recipe IS viable.** Built a disposable copy outside the repo from task749 with
> finding→`OPEN`, `coverage.openP2`→1, `decision`→`NEEDS REVISION`, `handoff.commitPush`→`PROHIBITED`; `--file` →
> **exit 0, valid**. `validateGateReceipt` (`:956-957`) derives `expectedStatus` from error count only, so no fifth
> edit is needed.
>
> **Safe to hand to an executor: No.**

---

## §3 Reviewer B — design soundness (full report, verbatim)

> **P0-1 — The marker is never bound to the prose it "backs".** Author writes
> `Open: **2 P0** <!-- ledger-claim: … field="openP0" value="0" ledgerHash="<current>" -->`; the checker derives
> `openP0 = 0`, matches `value="0"`, hash matches → pass, exit 0, while the rendered sentence says **2 P0**.
> Nothing requires `value` to occur in or derive from the adjacent prose. The kickoff's founding instance ⓐ is
> *"Three markdown sites said 2 P0"* — three **prose** sites. Markers are invisible in rendered markdown, so a
> human reviewer sees no discrepancy either. AC4 will be demonstrated by editing the marker attribute, not the
> sentence, and proves nothing about the failure mode in the kickoff.
>
> **P0-2 — v1 has an empty drift surface.** Across all 7 retained ledgers, all commits (19 commits, 11 distinct
> blobs), true positives available in the repository's whole history: **0**. `openP0/1/2` are 0 everywhere;
> `decision` is write-once by construction — a retained ledger is never re-decided, it is renamed to
> `.SUPERSEDED.json` and a successor is written, and per D2 a superseded ledger is never a production source.
>
> **P0-3 — On a shallow clone the gate exits 2 for every marker, permanently.** `git clone --depth 1`;
> `--file` → rc=1, `baseRevision does not resolve to a local commit`; same for all 7. Cause:
> `check-review-ledger.mjs:145-153` `immutableCommit()` runs `git cat-file -e <sha>^{commit}`.
> `governance-pr.yml:34` sets `fetch-depth: 0` in **one** job; four other PR jobs and `governance-scheduled.yml:30`
> check out shallow.
>
> **P1-4 — Churn: 100% false-alarm rate, measured.** task749's ledger took 4 distinct blob hashes on a single day;
> `decision` and `openP0/1/2` identical in all four; the diff was `baseRevision`, `reviewedRevision` and ~20
> evidence paths repointed from `.screenshots/…` to `docs/reviews/artifacts/…`. A marker pinned at blob 1 would
> have raised 3 `LEDGER-MOVED` failures in one day. The re-pin is a mechanical edit of a hash string, which trains
> the maintainer to treat every failure of this gate as paperwork.
>
> **P1-5 — The re-pin habit produces a silent pass with real drift.** Under D1, if `ledgerHash` matches, the source
> is byte-identical, therefore the derived value is identical to pin time — so `CLAIM-STALE` can only fire if a
> human edited the `value` attribute. Sequence: ledger genuinely re-decided → `LEDGER-MOVED`, and the message hands
> the author *the obtained value* → author re-pins the hash and pastes the printed value into `value=` → the prose
> sentence beside it is untouched → exit 0, prose wrong. Instance ⓐ, re-created by the gate's own remediation loop.
>
> **P1-6 — §3.6's SOURCE-RETIRED population is wrong and its exit-2 branch is unreachable.** 5 of 5 resolve.
> `check-review-ledger.mjs:1355-1366` already fails the repo if any `*.SUPERSEDED.json` is unreferenced, so a
> missing-source-with-no-successor cannot exist inside `docs/reviews/` while the gate is green. §6's partition has
> an empty second cell.
>
> **P1-7 — The fenced-code exemption is an author-applied exemption.** `docs/backlog.md:70` Corollary 724:
> *"require every exemption to be a condition the gate evaluates — never one an author applies."* An author can
> wrap a failing marker in a fence and the gate goes green with no record. 246 of the 475 files in scan scope
> already contain fences. The `REVISION 3` decision document already recommends the deletion escape hatch in
> writing (`:39`). The precedent closes this with a TRACKED DEAD GATE list
> (`check-assertion-liveness.mjs:33-40`); this design has no inventory of what ought to be marked, so it has no
> analogue. Secondary cost: the fence rule requires a real markdown block parser.
>
> **P1-8 — Scan scope contradicts D3's own rationale.** `tasks/Sprints/*.md` matches **475 files today**, from
> `Sprint_0_—_Summary_CLOSED.md` forward. D3 excludes `docs/sessions/**` because re-pinning would require editing
> closed history; a sprint file becomes closed history within days under the same kickoff §4 constraint. Also, the
> glob is non-recursive: foldering sprint files silently removes every marker from scope.
>
> **P1-9 — Legitimate archival removes a claim from scope with no signal.** `docs/backlog.md:3-4` requires closed
> tasks to move to `docs/backlog-archive.md`, which is never opened. A marked row migrates on close and the claim
> becomes permanently unverified, exit 0 forever. Coverage decays as a function of normal backlog hygiene.
>
> **P2-10 — `--file` makes the verdict a function of the developer's machine.** 2 of 7 retained ledgers unusable as
> a source here, failing the whole run. Also: the pre-`3deacff70` task749 blob listed
> `.screenshots/rendered-assert/…/manifest.json` — gitignored, ephemeral — in `reviewedPaths`; any ledger naming a
> build/screenshot artifact turns every marker pointing at it into exit 2, and the marker's author has no authority
> to repair the ledger.
>
> **P2-11 — No `--verify-gate` arm.** `package.json` carries `:verify` self-tests for eight other gates. Given
> P0-3 and P2-10 — both environment-dependent — an in-process self-test that runs wherever the gate runs is the
> highest-value thing this design could adopt and is the one it budgets out. Two further precedent behaviours:
> **derive both sides fresh, never pin a hash** (`check-assertion-liveness.mjs` keys on `{scope, assertion}` and
> recomputes every run, so it has no churn analogue); and **crash guards** (`:90-99` installs
> `uncaughtException`/`unhandledRejection` so the process can never exit -1).
>
> **P2-12 — Grammar holes in `value` comparison.** No comparison rule for numeric fields. Under `Number(value)`,
> `""`, `" "`, `"+0"`, `"0.0"`, `"0x0"`, `"\n"` all coerce to `0`, and every real numeric field is `0`, so an
> empty-valued marker passes universally; under string comparison `"00"` fails legitimate markers. Also `value`
> may not contain `-->`, unstated.
>
> **P3-13 — `source` is a literal path with no rename tolerance.** Foldering `docs/reviews/` by month makes every
> marker exit 2 with no failure name describing "the file moved".
>
> **P3-14 — Bootstrapping is mechanically fine but yields a vacuous first marker.** The author can compute
> `git hash-object` at authoring time (no self-reference cycle) and the value is stable across a shallow clone and
> this host. But AC9's marker is `field="decision"` on a ledger whose decision is immutable, beside prose it is not
> compared against, in a file that will be archived out of scope, avoiding the 2 of 7 ledgers that fail here.
>
> **Root cause:** the design checks **an attribute against a JSON field** where the task requires checking **prose
> against a JSON field**, and it detects change by **pinning a content hash** where the precedent detects it by
> **recomputing both sides from a stable identity key**. The first substitution empties the gate of true positives;
> the second fills it with false ones.
>
> **Sound enough to build: no.**

---

## §4 Orchestrator adjudication

### 4.1 Findings the orchestrator REJECTS after owner challenge

| Finding | Why it does not stand |
|---|---|
| B · P1-5 "`CLAIM-STALE` unreachable by any ledger action" *as a defect* | It is the specification, not a defect. Kickoff AC4 requires the forward plant to *"change **only** a live markdown claim, leave its ledger byte-identical"* — so `CLAIM-STALE` is **meant** to fire only on a markdown-side edit. The reviewer described the design correctly and mislabelled it. The *second half* of P1-5 — the remediation loop that re-pins and pastes the obtained value while leaving prose stale — survives, but only because of P0-1, not because of this. |
| B · P0-2 "empty drift surface" *as an argument against the task* | Zero historical instances does not make a control unnecessary; that is what AC3–AC5 plants exist for. It survives only in the narrow form stated in §1.1: it constrains AC9 and predicts the first marker's behaviour. |
| B · P1-4 churn *as "false alarms"* | D1 defines any hash mismatch as `LEDGER-MOVED` deliberately. Metadata churn is the price of a chosen semantics, not a malfunction. It survives as a **cost figure** — 6 forced re-pins on task749 against 0 field changes — for the owner to weigh, not as a defect. |
| B · P1-7 fenced/code-span exclusion *as an author-owned exemption* | The exclusion is a condition **the checker evaluates**, not an allowlist an author edits, so Corollary 724 does not bite in the sense the rule means. What survives is smaller and still real: because there is no inventory of what *ought* to be marked, deleting or fencing a marker is an undetectable coverage downgrade — the same property `silent-pass` already accepts. Record it; do not treat it as blocking. |

### 4.2 Findings that survive

**Design-level:** B·P0-1 (marker not bound to visible prose — the one substantive defect, and the owner's proposed
fix addresses it) · B·P0-3 + orchestrator §1.4 (shallow clone, 5 of 6 CI checkouts) · B·P1-9 (archival drains
coverage silently) · B·P1-8 (475 sprint files; non-recursive glob) · B·P2-10 (machine-dependent verdict; ephemeral
`reviewedPaths`) · B·P2-11 (no self-test arm; the precedent's "recompute, never pin" is a real alternative) ·
B·P2-12 (numeric comparison rule) · B·P3-13 (no rename tolerance).

**Brief-level, all orchestrator errors:** A·P0 §3.6 5-of-5 (confirmed in §1.5) · A·P0 undefined carve-out ·
A·P1 D1-vs-§3.6/§6 precedence · A·P1 undeclared kickoff §4 divergence · A·P1 ckpt 2 false-pass detector ·
A·P2 §0's false categorical claim · A·P2 AC7/AC2 adjudication machine unstated · A·P2 ckpt 0 start state wrong ·
A·P2 AC8 unobservable · A·P2 AC9 no home · A·P2 instance ⓑ dropped · all A·P3 items.

**Reviewer A's D6 result is a positive finding:** the four-edit reverse-plant recipe was demonstrated valid on a
disposable copy outside the repo — `--file` exit 0. No fifth edit needed.

### 4.3 Authority correction

`D2`–`D7` in the rejected brief were labelled "owner decisions". **They were not.** Only `D1` (the AC5 truth table)
was chosen by the owner in answer to a decision request. `D2`–`D7` were positions the orchestrator drafted from
review commentary and presented as settled. They are **proposals** and carry no authority. Any future brief must
label them as such, and the session's record is corrected here.
