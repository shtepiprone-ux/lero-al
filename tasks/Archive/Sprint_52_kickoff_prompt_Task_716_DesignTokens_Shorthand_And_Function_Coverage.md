# Task 716 — The CSS detector reads single-value declarations only; shorthand and function-wrapped values are still invisible

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Depends on:** 714 (`APPROVED WITH NOTES`, 2026-08-06). **Relationship to 715:** independent, but see §3.6 — 715's
inventory is bounded by exactly this gap, and whichever runs second must re-run the census.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — detector coverage** (`docs/rule-index.md` → Validation/QA tooling).
- **Secondary type:** none. **No `src/` change. No product code. No UI change.**

> **Read this first.** Task 714 closed the blind spot Task 713 fell into — but only for declarations whose **entire
> value is one bare token**. `font-size: 10px` is now seen. `border-bottom: 1px solid var(--border)` is not, because
> the value is a multi-token list. `filter: blur(8px)` is not, because the literal is inside a function. Both are
> ordinary CSS that carries raw design values. **You are closing the smaller blind spot that closing the larger one
> created** — and you must not create a third.

---

## 2. Objective

1. Extend the `css-length` / `css-duration` / `css-zindex` categories so a raw literal is detected when it appears
   in a **multi-value (shorthand) declaration** and when it appears **inside a CSS function**, following the
   token-anchored exemption Task 408 already established for Tailwind's bracket syntax.
2. Fix the CSS marker diagnostic defect: a marker with **no reason** currently reports as `stale-marker` instead of
   the documented missing-reason error, because the block-comment terminator `*/` is absorbed into the rawValue.
3. Keep the new detections **report-only**, and re-run 714's census so the inventory 715 consumes is complete.

**Non-goals, stated so they are not silently attempted:** do **not** flip anything to strict (**715**); do **not**
remediate any literal (**715**); do **not** change the Tailwind-bracket or colour patterns; do **not** touch `src/`.

---

## 3. Verified context

Every fact below was read or executed in this worktree on **2026-08-06**, during the Task 714 review. Nothing is
inferred from a filename or a prior report.

### 3.1 The boundary, probed against the shipped detector

Run directly against `scanContent` from `scripts/check-design-tokens.mjs` on a `.module.css` path:

| Input | Result |
|---|---|
| `font-size: 10px` | **detected** `css-length` |
| `z-index: 30` | **detected** `css-zindex` |
| `transition-duration: .15s` | **detected** `css-duration` |
| `margin-top: -12px` | **detected** `css-length` |
| `border-bottom: 1px solid var(--border)` | **not detected** |
| `filter: blur(8px)` | **not detected** |
| `margin: 4px 8px` | **not detected** |

The boundary is deliberate and documented — `docs/design-system.md` §23.6 states a detection requires a
declaration "whose entire value is one bare token", and that a multi-value list or function-wrapped value "is out of
scope — generalizing to those forms needs the same nested-function handling Task 408 built". **This task is that
generalization.** It was not registered as a task at the time; the Task 714 review recorded it as `F1`.

### 3.2 The precedent to follow, read in source

`scripts/check-design-tokens.mjs:101` `DETECTION_PATTERNS` already contains the shape you need — Task 408's
function-wrapped Tailwind pattern:

```js
{
  re: /\b[\w-]+-\[(?:calc|min|max|clamp)\([^\]]*\)\]/g,
  cat: 'length',
  label: 'function-wrapped arbitrary length (calc/min/max/clamp) with raw px/rem',
  filter: (m) => /(?:px|rem)\b/.test(m) && !/var\(--/.test(m),
}
```

The `filter` hook is the mechanism: **match broadly, then exempt token-anchored forms.** A declaration such as
`border-bottom: 1px solid var(--border)` contains both a raw literal and a `var(--…)`, so a naive
`!/var\(--/` filter would wrongly exempt it. See A1 — this is the task's central design problem.

### 3.3 The marker diagnostic defect

`parseInlineMarkers` (`:233`) takes everything between `design-tokens-allow:` and the `—` separator as the
rawValue. With no `—`, it takes the rest of the physical line, which in CSS **includes the closing `*/`**. Probed:

| Marker | Observed | Documented contract (`:46`) |
|---|---|---|
| `/* design-tokens-allow: font-size: 10px — reason */` | suppressed ✅ | suppressed |
| `/* design-tokens-allow: font-size: 10px */` (no reason) | **`stale-marker`** | **missing-reason ERROR** |
| marker present, declaration removed | `stale-marker` ✅ | `stale-marker` |

Both failing cases exit non-zero, so **there is no false green** — but the reason-less case points the author at a
stale marker when the real fault is the missing reason. The TSX path is unaffected: `//` runs to end-of-line, so
there is no terminator to absorb.

### 3.4 What 714 shipped, and what must not regress

- 3 report-only categories, `.css`-gated, listed in `REPORT_ONLY_CATEGORIES`.
- `scripts/__tests__/check-design-tokens.test.ts` — **43** tests (25 pre-714 + 18 added as `§D`). All pass.
- `npm run check:design-tokens` exits **0** with a `── CSS DECLARATION LITERALS — report-only, not blocking (Task
  714) (45 findings) ──` section.
- Verified negatives that must stay negative: `var(--space-6)`, `calc(var(--x) * 2)`, `0`, `0px`, `100%`, a literal
  inside a CSS comment, an `@media (min-width: 40rem)` prelude, and any `.tsx` path.

### 3.5 The real files this will newly touch

Known undetected literals, found while probing (**not** an exhaustive census — R5 makes you produce that):

- `src/components/layout/HeaderView.module.css:37` — `border-bottom: 1px solid var(--border)` (shorthand, `1px`).
- `src/components/layout/HeaderView.module.css:39-40` — `backdrop-filter: blur(8px)` and its `-webkit-` twin
  (function-wrapped, `8px`).
- `src/components/layout/MobileBottomNavView.module.css:61`, `:89` — `box-shadow: var(--tw-inset-shadow), …`
  (multi-value; the raw offsets live in the `--tw-shadow` custom properties, already marked at `:60`/`:87`).

**All of these belong to closed, approved tasks (706, 713). Zero diff in `src/` — R7.**

### 3.6 The 715 interaction — state it, do not resolve it

715 remediates the **45-item** inventory 714 produced. That inventory is bounded by exactly the gap this task
closes, so **whichever of 715/716 runs second must re-run the census**, or 715 will close its inventory to zero
while shorthand literals remain unremediated and unseen. The owner's sequence is **716 filed → backlog
consolidated → 715 runs**. Record the dependency in the backlog (R6); do not attempt to re-order it.

### 3.7 Worktree state

Task 714's six paths are committed. **Take your own pre-write `git status --porcelain` snapshot before your first
edit.** If it is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | A raw length/duration literal in a **multi-value** declaration is detected — `border-bottom: 1px solid var(--border)` reports `1px`. | P0 | AC1 | Confirmed |
| R2 | §3.1 | A raw literal **inside a CSS function** is detected — `filter: blur(8px)` reports `8px`. | P0 | AC2 | Confirmed |
| R3 | §3.2, A1 | A declaration whose every literal is token-anchored is **not** detected — `padding: var(--space-2) var(--space-4)`, `width: calc(var(--x) * 2)`, `margin: 0 auto`. | P0 | AC3 | Confirmed |
| R4 | §3.3 | A reason-less CSS marker reports the **missing-reason** error, not `stale-marker`. The TSX path is unchanged. | P1 | AC4 | Confirmed |
| R5 | §3.6 | 714's census is re-run and the inventory artifact updated to include the newly-detected literals, per file, with the same `N1-VIOLATION` / `COMPILED-ARTIFACT` classification. | P0 | AC5 | Confirmed |
| R6 | §3.6 | `docs/backlog.md` records that **715 must consume the re-run inventory**, not 714's 45-item one. | P1 | AC6 | Confirmed |
| R7 | scope | Zero diff in `src/`, `package.json`, `.github/workflows/governance-pr.yml`. | P0 | AC7 | Confirmed |
| R8 | §3.4 | `npm run check:design-tokens` still exits **0**; the new detections join the existing report-only section. | P0 | AC8 | Confirmed |
| R9 | §3.4 | All **43** existing detector tests pass unchanged; new planted arms are proven to **fail first**. | P0 | AC9 | Confirmed |
| R10 | §3.4 | Every negative listed in §3.4 stays negative. | P0 | AC10 | Confirmed |
| R11 | 714 R11 | `docs/design-system.md` §23.6 is corrected — it currently states the multi-value/function exclusion as permanent. | P1 | AC11 | Confirmed |
| R12 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC12 | Confirmed |
| R13 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, and their numbers **reconcile to `git status`**. | P1 | AC13 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the token-anchored exemption cannot be a whole-declaration `var()` test.** Task 408's filter exempts a
  match containing `var(--`. That is correct for a Tailwind bracket expression, which is one value. It is **wrong**
  for a declaration list: `border-bottom: 1px solid var(--border)` contains a `var(--…)` **and** a raw `1px`, and
  the `1px` is the thing you must catch. **The exemption has to be per-literal, not per-declaration.** Decide the
  mechanism, document it, and make R3's negatives prove it does not over-exempt.
- **A2 — `0`, unitless numbers and keywords must stay silent** in the new forms too: `margin: 0 auto`,
  `flex: 1 1 0`, `border: 0`, `line-height: 1.5`, `scale: 0.95`. 714 handles these in single-value form; the
  multi-value path is new code and must re-prove them.
- **A3 — `1px` needs the decision 714 deferred by accident.** 714's A3 asked for a `1px` policy; the answer became
  "invisible because it sits in a shorthand". Once R1 lands, every `1px` hairline becomes a finding. **Decide:
  detect-and-require-a-marker, or exempt-by-value with a documented rule.** Either is defensible; silence is not.
  Whatever you choose, it must be consistent between the single-value and multi-value paths.
- **A4 — nested functions exist.** `calc(var(--x) + 2px)`, `clamp(1rem, 2vw, 3rem)`, `blur(8px)` and
  `color-mix(in oklab, var(--primary) 90%, transparent)` all appear in this repo's modules. Handle nesting or state
  the depth limit explicitly; do not silently mis-parse.
- **A5 — custom-property declarations are declarations too.** `--tw-shadow: 0 -2px 16px …`
  (`MobileBottomNavView.module.css:60`) is a `--*` declaration carrying raw lengths, already marked for its colour.
  State whether `--*` declarations are in or out, and be consistent.

### 5.1 Naming — decided, do not re-litigate

Extend the existing `css-length` / `css-duration` / `css-zindex` categories in place. No new category name, no new
script, no new npm script. No task number in any identifier (Task 701 F2).

### 5.2 Rejected alternatives — do not re-open

- **Add a CSS parser dependency.** Rejected, same as 714 §5.2 — every pattern here is regex over source text.
  If you conclude regex genuinely cannot express A4's nesting, **stop and report**; do not add the dependency.
- **Make the new detections blocking.** Rejected: §3.5 shows they land in closed tasks' files. 715 owns the flip.
- **Fold this into 715.** Rejected: 715's job is remediation and the N1-vs-artifact policy call. Expanding the
  detector mid-remediation means remediating against a moving target.
- **Skip the marker diagnostic fix (R4) as cosmetic.** Rejected: it misdirects the author of every reason-less CSS
  marker, and CSS markers are now the repo's standard suppression form.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** · `docs/design-system.md` **§22–23**, especially **§23.5–23.6** (the coverage table you correct).

**Task-specific sources — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` **`:101-200`** (`DETECTION_PATTERNS` incl. Task 408's `filter` precedent),
  **`:217-260`** (marker parsing — R4 lives here), and 714's CSS categories + `REPORT_ONLY_CATEGORIES`.
- `scripts/__tests__/check-design-tokens.test.ts` **`§D`** — 714's 18 arms; add yours in the same style.
- `src/components/layout/HeaderView.module.css` **`:37`, `:39-40`** and
  `src/components/layout/MobileBottomNavView.module.css` **`:60-61`, `:87-89`** — the real shapes. **Read; do not edit.**
- `docs/sessions/2026-08-06-task714-design-tokens-css-declaration-coverage.md` — the inventory method you re-run.

---

## 7. Scope

- `scripts/check-design-tokens.mjs` — detection layer + `parseInlineMarkers` (R4) only.
- `scripts/__tests__/check-design-tokens.test.ts` — new arms; the 43 existing untouched.
- `docs/design-system.md` §23.6 — R11.
- `docs/backlog.md` — R6 + concise state only.
- `docs/sessions/2026-08-0X-task716-design-tokens-shorthand-and-function-coverage.md` — session log.
- The inventory artifact under `.screenshots/task716-evidence/` — R5.

## 8. Out of scope

- **`src/` entirely.** **Zero diff.**
- **`package.json`, `governance-pr.yml`** — 715 owns the strict flip. **Zero diff.**
- Remediating any literal, and the N1-vs-artifact policy call — **715**.
- The colour and Tailwind-bracket patterns, `design-tokens-allowlist.json`, and every other gate.
- `check-stories-rendered.mjs` and 711's assertions.

---

## 9. Current and required behavior

**Current:** after 714, `check:design-tokens` detects a raw length/duration/z-index literal only when it is the
**entire** value of a CSS declaration. A literal in a multi-value list (`border-bottom: 1px solid var(--border)`)
or inside a function (`blur(8px)`) is invisible, so the 45-item inventory 715 will consume is incomplete. A
reason-less CSS marker misreports as `stale-marker`.

**Required after:** raw literals are detected in multi-value and function-wrapped declarations, with a per-literal
token-anchored exemption; `1px` has a decided, documented and consistent policy; a reason-less CSS marker reports
missing-reason; the inventory is re-run and complete; the gate still exits 0.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist the current `check:design-tokens` output (exit 0, 45
  findings) and the current 43-test pass. **Re-probe §3.1's table yourself** — if any row differs, **stop and report**.
- **I2 — Failing arms first.** Add tests asserting detection of `border-bottom: 1px solid var(--border)`,
  `filter: blur(8px)`, `margin: 4px 8px`, and the R4 missing-reason case. **They must fail.** Persist that run — it
  is the D32 proof.
- **I3 — Implement**, per-literal exemption (A1), nesting decided (A4), `--*` decided (A5), `1px` decided (A3).
- **I4 — Green the arms**, then add the R3/R10/A2 negatives and confirm **43 + new** all pass.
- **I5 — R4**, with its own two arms: reason-less → missing-reason; reasoned → suppressed. TSX path unchanged.
- **I6 — Re-run the census (R5).** Full inventory, classified, per file. State the delta against 714's 45.
- **I7 — Confirm exit 0 (R8)**, capture unpiped.
- **I8 — Docs, session log, backlog** (R6/R11).
- **I9 — Counting gates last, after deleting every scratch file**, so the numbers reconcile (713 F3 → 714 AC13).

---

## 10. Implementation requirements

1. **The failing arm comes first** (I2) — D32.
2. **The token-anchored exemption is per-literal, not per-declaration** (A1). This is the whole task.
3. **Every 714 negative stays negative** (R10) — regression arms, not politeness.
4. **`1px` gets a decided, documented, consistent policy** (A3).
5. **Report-only** — the exit code must not change (R8).
6. **Never edit a closed task's `.module.css`** — probe read-only, mutate only in-memory or on a copy.
7. **Capture every transcript unpiped** (Task 710 R10).
8. **No task number** in any identifier (Task 701 F2).
9. **Counting gates LAST, after scratch cleanup, and reconcile them to `git status`** — 713 recorded a mojibake
   count 8 files above the final tree; 714 reconciled exactly. **A regression here is a `P1`.**

---

## 11. Positive and negative flows

**Positive flow:** the three §3.1 undetected forms are detected; every §3.4 negative stays silent; a reason-less
CSS marker reports missing-reason; the re-run inventory is complete and classified; `check:design-tokens` exits 0;
43 + new tests pass; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Raw literal in a shorthand | **Yes** | R1 | detected | AC1 |
| Raw literal inside a function | **Yes** | R2 | detected | AC2 |
| Shorthand where **every** literal is token-anchored | **Yes** | A1/R3 | **not** detected | AC3 |
| Shorthand mixing a raw literal **and** a `var()` | **Yes** | A1/R1 | detected — the raw one | AC1 |
| `0` / unitless / keyword in a multi-value list | **Yes** | A2/R3 | **not** detected | AC3 |
| Nested function (`calc(var(--x) + 2px)`) | **Yes** | A4 | detected or documented depth limit | AC2 |
| `--*` custom-property declaration | **Yes** | A5 | decided and consistent | AC2 |
| Reason-less CSS marker | **Yes** | R4 | missing-reason error | AC4 |
| Reason-less TSX marker | **Yes** | R4 | unchanged behaviour | AC4 |
| An existing 714 detection changes category or count | **Yes** | R9/R10 | must not, except by the R5 delta | AC9 |
| Locale expansion / viewport / RLS | **No** | build-time script, no strings, no rendering, no data | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `border-bottom: 1px solid var(--border)` on a `.css` path, then `1px` is reported as
  `css-length`. Show the test and the raw output.
- **AC2 [R2]** Given `filter: blur(8px)`, then `8px` is reported. State the nesting depth handled (A4) and the
  `--*` decision (A5).
- **AC3 [R3]** Given `padding: var(--space-2) var(--space-4)`, `width: calc(var(--x) * 2)`, `margin: 0 auto`,
  `flex: 1 1 0`, `border: 0` and `line-height: 1.5`, then **none** is reported.
- **AC4 [R4]** Given a CSS marker with no `—`, then a **missing-reason** error is reported, not `stale-marker`;
  given one with a reason, then the detection is suppressed; given the equivalent TSX marker, then behaviour is
  unchanged. Show all three.
- **AC5 [R5]** Given the re-run census, then the inventory artifact lists every detected literal with file, line,
  value, category and classification, and states the **delta against 714's 45** with per-file counts.
- **AC6 [R6]** Given `docs/backlog.md`, when read, then 715's row states it must consume **716's** inventory.
- **AC7 [R7]** Given `git diff` on `src/`, `package.json`, `governance-pr.yml`, then all are **empty**. Verify by hash.
- **AC8 [R8]** Given the current tree, `npm run check:design-tokens` **exits 0**, new detections inside the existing
  report-only section. Persist the transcript with the exit code inside it.
- **AC9 [R9]** Given the suite **before** I3, the new arms **fail**; after, all pass. State totals before and after
  and confirm no pre-existing test was modified.
- **AC10 [R10]** Given every negative listed in §3.4, then none is reported. Show the output.
- **AC11 [R11]** Given `docs/design-system.md` §23.6, when read, then it no longer presents the multi-value /
  function exclusion as permanent, and records the new coverage plus the `1px` decision.
- **AC12 [R12]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC13 [R13]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation explicitly.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow** — a change to a CI-blocking gate's detection layer, and Q4 is the profile
that compels the planted-failure proof. A green run is explicitly **not** sufficient evidence.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0, 45 findings — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | **43 passed** — persisted |
| 4 | Re-probe §3.1's 7 rows (I1) | matches, or **stop and report** |
| 5 | **New arms, pre-implementation** (I2) | **FAIL** — persisted; the D32 proof |
| 6 | Implement (I3) + green (I4) | new arms pass |
| 7 | Full suite (I4) | 43 + new, all pass, none modified |
| 8 | R4's three arms (I5) | missing-reason / suppressed / TSX unchanged |
| 9 | Re-run census (I6) | inventory + delta vs 714's 45 |
| 10 | `npm run check:design-tokens` (I7) | **exit 0** |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate** |
| 13 | `check:file-integrity` · `check:mojibake` — **last, after scratch cleanup** | pass; reconcile to `git status` |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence persists under `.screenshots/task716-evidence/` (local-only per **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task716-design-tokens-shorthand-and-function-coverage.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R13, each with its AC verdict.
3. **The failing arms, before implementation.**
4. **The A1 answer** — the per-literal exemption mechanism, and why it does not over-exempt.
5. **The A3/A4/A5 answers** — the `1px` policy, the nesting depth, the `--*` decision.
6. **R4's three arms**, quoted.
7. **The R5 inventory** — full list, per-file counts, and the **delta against 714's 45**.
8. **Test totals** — 43 before, N after, none modified.
9. **Commands run and actual results** — real exit codes, including the step-12 build transcript.
10. **Evidence locations** — every artifact, named.
11. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
12. **Standing findings not acted on** — 715 (flip + remediation, must consume this task's inventory), 711.
13. **Assumptions, deviations, limitations, unresolved issues.**
14. Concise current state appended to `docs/backlog.md` — **state only**, plus R6. Opus consolidated the file to
    **≤80** lines on 2026-08-06; **do not add net lines**, and flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every file, line range, pattern, category, count and command named; §3.1's boundary given as a 7-row probe table |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R13 → AC1–AC13 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC7, AC9's "43 unchanged", AC10's regression negatives, and §5.2's four rejected alternatives |
| **Detector behaviour proven before publication** (`6c3a2054e`) | ✅ §3.1's table and §3.3's marker table were **probed against the shipped detector** during the 714 review, not inferred; the Task 408 `filter` precedent read at `:101` |
| The task's central difficulty is named, not buried | ✅ A1 states plainly that the Task 408 whole-match `var()` exemption is **wrong** for declaration lists, and R3 makes over-exemption a failing condition |
| The gate proves the changed behavior, not merely procedure | ✅ I2/AC9 require the arms to fail first; AC1's example is a real line in a closed task's file; AC4 has three arms incl. an unchanged-TSX control |
| No new blind spot is created silently | ✅ A4 forces the nesting depth to be stated, A5 forces the `--*` decision, A3 forces the `1px` policy 714 left implicit — each must be **documented**, not defaulted |
| Zero/empty input covered | ✅ A2/R3/AC3 cover `0`, `0 auto`, `1 1 0`, `border: 0`, unitless `line-height` in the new multi-value path |
| Downstream task interaction stated | ✅ §3.6 records that 715's inventory is bounded by this gap and that whichever runs second re-runs the census; R6 puts it in the backlog |
| Owner exceptions have traceable authorization | ✅ D6 for the evidence dir; D32 cited; the N1-vs-artifact policy stays with 715 |
| Exactly one active executable route | ✅ §5.1 fixes naming; §5.2 closes four alternatives; A1/A3/A4/A5 require decisions to be made and recorded rather than left open |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I1 step 4's stop-and-report + I2's mandatory failing arm + I9's cleanup-then-count ordering |
| Prior-review corrections folded in | ✅ Task 714 **F1** (this task is the corrective task that finding required) and **F2** (R4), Task 713 **F3** → 714 **AC13** (§10.9 makes a regression a `P1`), Task 710 **R10** (unpiped capture), **701 F2** (no task numbers). Also folds in my own repeated defect: §3.1/§3.3 are probe tables, not greps |
| Sprint assigned before creation | ✅ Sprint 52, already open |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** A3's `1px` policy is delegated to the executor **with a mandate to decide
and document**, because either answer is defensible and consistency matters more than which one is chosen.
