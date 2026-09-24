# Task 729 — The click-shield gate never looks below the fold

**Sprint 54 — Mobile bottom-nav overlay collision. The only remaining task; closes the sprint.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_54_Task_729_execution_contract.md` · `Sprint_54_Task_729_rule_compliance_ledger.md`.

> This gate became **CI-blocking** three days ago (Task 727, approved 2026-08-09). Everything below is measured
> against the file *as it stands after 727*, not against the version 725 found the defect in.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate coverage (non-product script). No `src/` product change — a
real defect the widened gate exposes is escalated, never fixed here.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`checked=324` currently reads as coverage. It is not: every candidate below the fold at the page's starting scroll
position is discarded before any test runs, and never counted anywhere. Measure that exclusion, make it visible in
the gate's own output, and close it if the measurement justifies the cost.

---

## 3. Verified context — read from the repository 2026-08-09, after Task 727

### 3.1 The mechanism, in source

`scripts/check-click-shield.mjs`:

- `:272` — `const startScrollY = await page.evaluate(() => window.scrollY);` — phase 1 runs at the page's current
  scroll position, which on a fresh load is **0**.
- `:330` — `const candidates = Array.from(document.querySelectorAll(selector));` — enumerated **once**.
- `:342` — `if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) continue;` — any candidate
  whose **centre point** is outside the viewport at that instant is skipped. It is not hit-tested, not counted in
  `checked`, and appears in no output.
- `:397-429` — phase 2 re-tests **only** `transientCandidates`, looked up by `selectorIndex` (`:405`) from phase
  1's own array. It scrolls, but it can only revisit what phase 1 already enumerated. **It never enumerates.**

So a control that is permanently occluded *and* below the fold is not "passing" the gate — it is **invisible** to
it, and the `checked` count silently excludes it.

### 3.2 This is already documented, by the task that hit it

Task 725's session log, verbatim:

> Round 1's plan (temporarily remove `FooterView.module.css`'s `padding-bottom`) was **attempted and found
> untestable**: the footer's content is never a hit-test *candidate* in the first place, because it sits far below
> the fold at `scrollY = 0` and the gate's candidate selection only considers elements visible at the page's
> starting scroll position. Removing the padding produced **zero change** in the gate's output — not a defect in
> the fix, but proof that this specific plant mechanism cannot exercise the "permanent occlusion" path at all
> under this gate's methodology.

That gives this task a **ready-made regression proof with a recorded prior result**: the same plant must now
produce output. Its pre-plant hash is recorded in 725's log —
`git hash-object src/components/layout/FooterView.module.css` → `d2c6588aec6bba3c155ea2b68b4f7819c6139d9d`.
Confirm that value still holds before relying on it.

### 3.3 The hole's size is **unknown**, and this kickoff does not guess it

Typical in-viewport candidate counts today are ~20–21 per cell (324 across a 16-cell Drawer sweep, Task 727
evidence). **How many are excluded by `:342` has never been counted.** No number appears in this kickoff because
none was measured, and R1 exists to produce it.

*(This is deliberate. Task 733's kickoff stated 120 cells as "the hole" when the census proved 108 of them had
nothing to measure — the real figure was 12. Stating an unmeasured size as fact is the orchestrator error this
sprint's own standing note warns about, and it is not repeated here.)*

### 3.4 The cost side, because this gate now blocks merges

Task 727 wired `check:click-shield` into `governance-pr.yml` as a **blocking** job with no `continue-on-error`.
Observed wall-clock from 727's evidence: a base 16-cell sweep ≈ 8 min, a Drawer sweep ≈ 4 min. Re-enumerating per
scroll band multiplies per-cell work by the page's height in viewports. **Any fix that materially slows a blocking
gate is an owner decision, not an executor one** — see §7.3.

### 3.5 What must not regress

Task 727 landed three days ago: the contextual N6 predicate written once and reconstructed at both hit-test sites,
three real scenarios (base, Drawer, Modal), and the A2 open-proof guard. All of it is in the same function this
task edits.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.3 | The exclusion is **counted**: per scenario and per cell, how many candidates `:342` discards, and what they are | P0 | Census artifact | Confirmed |
| R2 | §3.1, 722 lesson | The gate's own output reports the skipped count alongside `checked`, **whatever fix is chosen** — a number that reads as coverage must stop doing so | P0 | Transcript | Confirmed |
| R3 | §3.3, §3.4 | The fix follows from R1's measurement, under the rule in §7.3; the reasoning and the rejected alternative are recorded | P0 | Session log + diff | Confirmed |
| R4 | §3.2 | The `FooterView` plant that produced **zero change** for 725 now produces a violation; removing it restores the prior result | P0 | Two transcripts | Confirmed |
| R5 | 726 R5 rule | The plant is reverted byte-identical, evidenced by `git hash-object` and absence from `git status --porcelain` | P0 | Hash + status | Confirmed |
| R6 | §3.5 | Task 727's work is intact: one predicate at both sites, three scenarios, the dialog-open guard — witnessed | P0 | Diff + `:verify` | Confirmed |
| R7 | 724 lesson | Any real defect the widened coverage exposes is named and **escalated**, not fixed and not exempted | P0 | Session log | Confirmed |
| R8 | §3.4 | Wall-clock before and after is measured and stated; if the fix materially slows the blocking job, §7.3's escalation applies | P0 | Timings | Confirmed |
| R9 | Standing | `npm run check:click-shield:verify` passes; the base scenario's verdicts are unchanged | P0 | Transcript | Confirmed |
| R10 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R11 | Standing | Counting gates last; backlog baseline from `git show HEAD:docs/backlog.md \| wc -l` **before** the first edit, quoted | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: pre-write `git status --porcelain` snapshot, per-entry classification, before/after
  content witnesses for pre-existing modified paths.
- **A2.** **A zero-exclusion census is a red flag, not a clean result.** 725 proved at least one real control sits
  below the fold. If R1 counts zero skipped candidates anywhere, the census is wrong — fix it before proceeding.
- **A3.** The `FooterView` hash in §3.2 is from 725's log, 2026-08-07. Re-derive it; if it differs, the file
  changed since and the plant needs re-basing, not the recorded value trusted.
- **OQ — none for the owner unless §7.3 triggers.** The measurement decides the fix. Only a materially slower
  blocking gate escalates.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q4` row
- `scripts/check-click-shield.mjs` — the whole file, especially `:265-345` (phase 1 and the viewport filter),
  `:387-435` (phase 2), and the scenario machinery Task 727 added
- `.github/workflows/governance-pr.yml` — the `click-shield` job (727), for the cost constraint
- `docs/storybook-governance.md` §14.9.29 — the transient/permanent distinction this task extends
- `docs/sessions/2026-08-07-task725-bottomnav-overlay-collision.md` — §R12, the finding in its original words
- `docs/sessions/2026-08-09-task727-click-shield-ci-and-contextual-n6.md` — what must not regress

---

## 7. Scope

### 7.1 R1 — count what is discarded, before changing anything

Instrument `:342`'s branch and record, per scenario × cell: how many candidates are skipped, and enough about each
(tag, class, document-space position) to tell a below-fold control from a genuinely irrelevant one. Persist it.
This is the D32 comparator and the input to every decision below.

### 7.2 R2 — make the number honest regardless

Even if §7.3 concludes the coverage should not change, `checked=N` must stop implying it looked everywhere. The
gate reports the skipped count. This requirement stands independently of the fix — it is the Task 722 lesson
applied to a different number in a different file.

### 7.3 R3 — the fix follows the measurement, under this rule

**This kickoff does not choose the mechanism.** It states the rule that selects it:

- If the census shows below-fold candidates are a **negligible** share and none is a real interactive control,
  documenting the boundary in `storybook-governance.md` §14.9.29 is sufficient — **provided R2 ships**.
- If the census shows real interactive controls are excluded, coverage must be closed, and the cheapest correct
  mechanism wins. Enumerating per scroll band is one option; enumerating over the document once and scrolling to
  each candidate is another; there may be better. Cost is proportional to something — say which.
- **Escalate rather than decide** if the cheapest correct fix materially slows the blocking job (§3.4). Report
  `BLOCKED — OWNER DECISION REQUIRED` with the measured before/after wall-clock and the alternatives. Do not
  quietly ship a gate that doubles CI time, and do not quietly narrow coverage to keep it fast.

### 7.4 R4 — the plant with a recorded prior result

725 attempted exactly this plant and recorded **zero change**. Re-run it: remove `FooterView.module.css`'s
`padding-bottom`, confirm the gate now reports what it could not see before, then restore byte-identical. A plant
whose previous outcome is already in the record is stronger evidence than a fresh one — use it.

### 7.5 R6/R7 — protect 727, escalate what you find

Do not restructure the predicate, the scenarios or the open-proof guard. If widened coverage exposes a real
occluded control in this application, that is a product defect with its own number: name it, attribute it, reserve
it. It is not fixed here.

---

## 8. Out of scope

Any `src/` product fix (R7 escalates; the `FooterView` plant is a reverted probe, not a change) · Task 727's
contextual rule, scenarios and CI job beyond leaving them intact · `check-stories-rendered.mjs` — Sprint 52 is
closed · adding the Supabase repository secrets (owner action, tracked separately) · anything reserved under 734,
735 or 736.

---

## 9. Current and required behavior

**Current.** Candidates are enumerated once at `scrollY=0`; anything whose centre is outside the viewport is
dropped before testing and counted nowhere. Phase 2 scrolls but only revisits phase 1's list. A permanently
occluded control below the fold is invisible, and `checked` conceals that.

**Required.** The excluded count is measured, reported in the gate's own output, and either closed or documented
under §7.3's rule with the reasoning recorded. 725's `FooterView` plant, which produced zero change, now produces
a result.

---

## 10. Implementation requirements

1. Task 727's predicate, its two call sites, the three scenarios and the dialog-open guard are witnessed unchanged.
2. The skipped count is part of the gate's normal output, not a debug flag.
3. Any coverage widening keeps the phase-1/phase-2 contract intact: a transient overlap must still be distinguishable from permanent occlusion (§14.9.29, Task 725).
4. A newly-found real defect is a **finding**: named, attributed, reserved. Never fixed, never exempted here.
5. Wall-clock is measured on the same machine before and after, and both numbers are reported.

---

## 11. Positive and negative flows

**Positive.** The census names N excluded candidates per cell; the gate reports them; the `FooterView` plant now
fails the gate and recovers on restore; the base scenario's verdicts are otherwise unchanged.

| Negative flow | Applicable | Why |
|---|---|---|
| Census reports zero exclusions | **Yes** | A2 — 725 proved at least one exists; zero means the instrumentation is wrong |
| Widened coverage floods the gate with new violations | **Yes** | R7 — escalate each, never suppress; a flood is itself a finding worth reporting before proceeding |
| The fix doubles a blocking CI job's runtime | **Yes** | §7.3 escalates to the owner rather than shipping it |
| Coverage is narrowed to keep the gate fast | **Yes** | The opposite failure, equally forbidden by §7.3 |
| 727's predicate or scenarios are refactored in passing | **Yes** | R6 — three days old, CI-blocking, out of scope |
| `FooterView` plant left in the tree | **Yes** | R5 evidence is mandatory |
| Locale / i18n regression | No | No `messages/*` change; parity run as a guard |
| Visual / layout regression | No | No `src/` change ships |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the census, then per scenario × cell the excluded-candidate count and identifying detail are persisted, and the total is stated as one number.
- **AC2 [R2]** Given a normal gate run, then its output reports the skipped count alongside `checked`, with no extra flag required.
- **AC3 [R3]** Given the session log, then §7.3's rule is applied explicitly: which branch the measurement selected, why, and what was rejected.
- **AC4 [R4]** Given the `FooterView` plant, then the gate reports a result it did not report for 725 — stated against 725's recorded "zero change".
- **AC5 [R5]** Given the plant's removal, then `git hash-object` equals the pre-plant value and the path is absent from `git status --porcelain`, both captured after the final run.
- **AC6 [R6]** Given the diff and `check:click-shield:verify`, then 727's predicate, both call sites, the three scenarios and the dialog-open guard are unchanged and the self-test passes.
- **AC7 [R7]** Given any real occluded control found, then it is named, attributed and reserved under a number — and not fixed in this diff.
- **AC8 [R8]** Given before/after timings on the same machine, then both are stated; if the increase is material, §7.3's escalation was taken rather than the change shipped.
- **AC9 [R10]** `tsc` exit 0 and `npm run build` exit 0.
- **AC10 [R11]** Two counting passes, the second after the session log and backlog row exist; the backlog baseline quoted from `git show HEAD:docs/backlog.md | wc -l`.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A CI-blocking gate's coverage changes, and the planted-violation clause is
Q4-owned.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` + `git show HEAD:docs/backlog.md \| wc -l` | A1 manifest + R11 baseline |
| 2 | `npm run build` · `npm start` · `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` | Pre-change baseline + wall-clock |
| 3 | Instrumented census run | AC1 |
| 4 | Implement per §7.3 | — |
| 5 | Re-run all three scenarios | AC2, base verdicts unchanged |
| 6 | `FooterView` plant · run · restore · `git hash-object` | AC4, AC5 |
| 7 | `npm run check:click-shield:verify` | AC6 |
| 8 | Wall-clock after, same machine | AC8 |
| 9 | `npx tsc --noEmit` · `npm run check:i18n` | exit 0 |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `check:file-integrity` + `check:mojibake`, twice | AC10 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R11 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root (`.screenshots/task729-evidence/`, local-only per D6) · assumptions,
deviations, limitations · unresolved issues. State the excluded-candidate total as one number, the before/after
wall-clock as two, and which §7.3 branch was taken. Then update `docs/backlog.md` — **replacing** the "Last
Session" block, never appending — and write `docs/sessions/<date>-task729-below-fold-blind-spot.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **the hole's size is explicitly declared unmeasured**, with the Task 733
overstatement named as the reason no figure is asserted here · the mechanism was verified in source against the
file *as it stands after 727*, not against the version 725 found it in · the fix is selected by a stated rule
applied to a measurement, not chosen in advance · the cost escalation is bounded in both directions — neither a
slower blocking gate nor a quietly narrowed one may ship without the owner · the plant reuses a probe whose prior
result is already in the record, which is stronger than a fresh one · a zero-exclusion census is pre-declared as
instrumentation failure, since 725 proved at least one case exists · R2 stands independently of the fix, so the
misleading `checked` number is corrected even on the do-nothing branch.
