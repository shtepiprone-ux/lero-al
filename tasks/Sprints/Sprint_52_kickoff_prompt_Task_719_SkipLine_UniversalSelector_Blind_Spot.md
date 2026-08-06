# Task 719 — `shouldSkipLine` blinds every CSS category on a universal-selector line

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Blocked by:** **718R** (§5, A1 — it publishes the §23.6.c limitation entry this task retires, and both edit the
same test file and doc section). **Origin:** Task 718 review **F1**, escalated by measurement (§3.2).

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — shared skip-heuristic correction** (`docs/rule-index.md` →
  Validation/QA tooling).

> **Read this first.** This sprint exists because gates report green while no longer observing what they were built
> to observe. `shouldSkipLine` is the third instance, and the widest: it runs **before every category**, and it
> treats any line whose first non-space character is `*` as a comment. In a `.ts`/`.tsx` file that is correct —
> JSDoc continuation lines look exactly like that and nothing strips them. In a `.css` file it is wrong, because a
> leading `*` is also the **universal selector**, and CSS comments have already been stripped by the time it
> matters. **The result is that all four CSS categories miss a violation written on a universal-selector line.**
> This task is scoped tightly because the heuristic is shared: the fix is small, the regression surface is ~4,366
> lines wide.

---

## 2. Objective

1. **Stop treating a leading `*` as a comment marker in `.css` files** (R1), so a universal-selector rule is scanned
   like any other rule — while leaving `.ts`/`.tsx` JSDoc skipping exactly as it is.
2. **Prove it per category** (R2). Four categories are blinded; four planted violations, four arms.
3. **Prove the 4,366 correctly-skipped lines did not regress** (R3).
4. **Delete the dead duplicate branch** at `:586` (R4).
5. **Retire 718R's limitation entry** in §23.6.c, which this task closes (R5).

**Non-goals:** do **not** change any `DETECTION_PATTERNS` entry (714/716 own them); do **not** change the
`//`-comment or `import`/`type` branches of `shouldSkipLine`; do **not** widen the scan to multi-line `var(`
(unowned, architectural — 718R A2); do **not** narrow the path allowlist (**717**).

---

## 3. Verified context

Every number and behavior below was measured in this worktree on **2026-08-06** with the real tool, against the
real exported `scanContent`.

### 3.1 The code

`scripts/check-design-tokens.mjs:581-588`:

```js
function shouldSkipLine(line) {
  const trimmed = line.trimStart();
  // Comment-only lines (value inside a trailing // comment is not runtime code)
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // CSS comment lines
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;      // ← :586, dead: :584 already returned
  // Import / type declarations — no runtime style values
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}
```

Called once per line in `scanContent`, **before any category runs**:

```js
    if (shouldSkipLine(line)) continue;
```

Note it receives the **raw** line. `scanContent` has already computed `cssStrippedLines` (the CSS-comment-stripped
source, `.css` only) two lines earlier — that is the input R1 uses.

### 3.2 The blind spot, measured across all four CSS categories

In-memory fixtures, no tree writes:

| Fixture (relPath `…/Probe.module.css`) | Findings | Verdict |
|---|---:|---|
| `.a { margin: 10px; }` — **control** | 1 (`css-length`) | correctly flagged |
| `* { margin: 10px; }` | **0** | **`css-length` MISSED** |
| `* { transition-duration: 250ms; }` | **0** | **`css-duration` MISSED** |
| `* { z-index: 42; }` | **0** | **`css-zindex` MISSED** |
| `* { color: var(--phantom); }` | **0** | **`css-undefined-var` MISSED** |
| `*,\n*::before {\n  margin: 10px;\n}` | 1 (`css-length`) | **caught** — see §3.3 |

The Task 718 review reported this as a `css-undefined-var` limitation. It is not: it is a **cross-category** blind
spot in a CI-blocking gate, and three of the four categories it blinds were shipped by 714/715/716.

### 3.3 The gap is narrower than it looks, and that is load-bearing

The last row matters. The skip is **per physical line**, so it only hides a declaration written on the *same* line
as the `*` selector. The conventional multi-line form — selector on one line, declarations on their own — is caught
today, because the declaration lines do not start with `*`. That bounds the real-world exposure and is why this is
a `P1` correctness fix rather than a `P0` emergency.

### 3.4 Current live exposure: zero

| Metric | Value |
|---|---:|
| lines whose first non-space char is `*`, `src/**/*.css` | **309** |
| of those, lines that survive CSS-comment stripping (real CSS, not a comment continuation) | **1** |
| that one line | `src/app/globals.css:559` — `* {` |
| is it scanned? | **No** — `globals.css` is excluded from the scanner (`SKIP_FILES`) |
| lines whose first non-space char is `*`, `src/**/*.{ts,tsx}` | **4058** |

**No file in `src/` currently exploits the gap.** So R1 must not add a single finding to the tree (R3): this is
latent protection, exactly like 718R's `i` flag. A green gate after the fix is the *expected* result, not the proof
— the proof is R2's four plants.

### 3.5 Why the `*` heuristic exists at all, and why `.css` does not need it

`stripJsxComments` removes `{/* … */}` JSX blocks. It does **not** remove `/** … */` JSDoc blocks, and nothing else
does either — so in `.ts`/`.tsx` the leading-`*` heuristic is the **only** thing preventing 4,058 JSDoc continuation
lines from being scanned as code. It must stay for those files.

For `.css`, `stripCssComments` has already blanked every `/* … */` span by the time `scanContent` loops. A comment
continuation line is therefore already whitespace in `cssStrippedLines[i]`; the leading-`*` heuristic adds nothing
except the false skip in §3.2. **That asymmetry is the whole design of R1.**

### 3.6 Worktree state

This task runs **after 718R is approved and committed**. Expect a clean or near-clean start; take your own pre-write
`git status --porcelain` snapshot before the first edit and complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every entry if it is not empty.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2, §3.5 | For `.css` files, the per-line skip decision no longer treats a leading `*` or `/*` as a comment. It is made against the CSS-comment-stripped line, skipping only when that line is blank. `.ts`/`.tsx` skip behavior is **byte-for-byte unchanged**. | P1 | AC1 | Confirmed |
| R2 | §3.2, D32 | **Planted proof, per category.** `* { margin: 10px; }` → `css-length`; `* { transition-duration: 250ms; }` → `css-duration`; `* { z-index: 42; }` → `css-zindex`; `* { color: var(--phantom); }` → `css-undefined-var`. Each arm fails before R1 and passes after. Persist both runs. | P0 | AC2 | Confirmed |
| R3 | §3.4, §3.5 | **No regression on correctly-skipped lines.** The gate still reports **0** findings tree-wide and exits **0**; the full suite passes; a `.css` comment-continuation line and a `.tsx` JSDoc continuation line each still produce no finding, locked by arms. | P0 | AC3 | Confirmed |
| R4 | §3.1 | The dead duplicate branch at `:586` is removed. No behavior change — `:584` already returns for both of its conditions. | P3 | AC4 | Confirmed |
| R5 | 718R R3 | §23.6.c's `shouldSkipLine` limitation entry (published by 718R) is retired and replaced by a note that **719** closed it, stating the `.css`/`.ts` asymmetry. The multi-line-`var(` limitation entry beside it **stays** — this task does not close it. | P1 | AC5 | Confirmed |
| R6 | scope | Zero diff in every `DETECTION_PATTERNS` entry, the `//`/`import`/`type` branches of `shouldSkipLine`, `src/app/globals.css`, `package.json`, `.github/workflows/governance-pr.yml`, `scripts/design-tokens-allowlist.json`, `scripts/check-stories-rendered.mjs`, and every `.module.css` under `src/`. Verify by hash. | P0 | AC6 | Confirmed |
| R7 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC7 | Confirmed |
| R8 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, numbers **reconcile to `git status`**. | P1 | AC8 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — 718R lands first, and that ordering is not negotiable.** 718R publishes the §23.6.c entry R5 retires and
  adds three §H arms adjacent to R2's. Running these two in parallel produces a doc section that both describes and
  denies the same limitation, and two conflicting edits to one test file. If 718R is not yet `APPROVED`,
  **stop and report** — do not start.
- **A2 — the `.ts`/`.tsx` path must not move at all.** §3.4 measured **4,058** leading-`*` lines there, and §3.5
  explains that nothing else protects them. R1 is a `.css`-only branch. If your implementation changes the skip
  decision for a non-CSS file in any way, it is wrong regardless of what the suite says. R3's `.tsx` arm exists to
  catch that.
- **A3 — "skip when the stripped line is blank" is the route; a `*`-selector regex is not.** Detecting "is this a
  universal selector" by pattern re-introduces the same guessing this task removes, and would have to distinguish
  `*`, `*,`, `* {`, `*::before`, `* > *`. Reusing `cssStrippedLines` asks the stripper — which already has the
  answer — instead of guessing. If you conclude the stripped-line route cannot work, **stop and report**; do not
  substitute a selector regex.
- **A4 — a blank stripped line is not the same as a blank raw line.** A line that is *entirely* a CSS comment
  strips to whitespace and is skipped, which is correct and matches today's behavior. A line with a violation
  *before* a trailing comment strips to the violation and must still be scanned — that is Task 714's existing
  guarantee (`stripCssComments` blanks only the comment span) and R3 must not regress it.
- **A5 — the tree must stay green (§3.4).** R1 adds no finding because no scanned file exploits the gap. If your
  post-R1 gate run is non-zero, something in the change is over-broad: **stop and report** the finding rather than
  remediating it or allowlisting it.

### 5.1 Rejected alternatives — do not re-open

- **Fix it inside `findUndefinedCssVarReferences`** (i.e. only for `css-undefined-var`). Rejected: §3.2 measured
  that all four categories are blinded. A per-category fix leaves three of them broken and adds a fourth code path.
- **Delete the leading-`*` branch outright, for all file types.** Rejected by A2/§3.5 — it would expose 4,058 JSDoc
  lines in `.ts`/`.tsx` to every detector.
- **Detect the universal selector with a regex.** Rejected by A3.
- **Fold this into 718R.** Rejected: that task is a one-character regex change plus documentation; this one changes
  a heuristic shared by every category and needs four planted proofs of its own.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** · `docs/design-system.md` **§23.5–23.6.c** (read all of §23.6.c, including the entry R5 retires).

**Task-specific — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` — `shouldSkipLine` (**`:581-588`**, R1/R4's only edit site), its call site in
  `scanContent`, and the `cssStrippedLines` / `codeOnlyCss` computation immediately above it. **Do not touch any
  `DETECTION_PATTERNS` entry.**
- `scripts/__tests__/check-design-tokens.test.ts` — **§A**'s two existing comment-skipping arms (*"existing `//`
  comment-only line skipping is unchanged"* and *"existing `/* */` and leading-`*` comment-line skipping is
  unchanged"*) — **these two are the regression lock for R3 and must keep passing unmodified** — and the **§H**
  block, where 718R's arms already sit.
- `tasks/Sprints/Sprint_52_kickoff_prompt_Task_718R_CssUndefinedVar_Coverage_Gaps.md` — §3.5 and R3, so R5's
  retirement note matches what 718R published.

---

## 7. Scope

- `scripts/check-design-tokens.mjs` — `shouldSkipLine` and its call site only (R1, R4).
- `scripts/__tests__/check-design-tokens.test.ts` — four R2 arms, two R3 regression arms.
- `docs/design-system.md` — §23.6.c, retire one limitation entry (R5).
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-0X-task719-skipline-universal-selector.md`.

## 8. Out of scope

- Every `DETECTION_PATTERNS` entry — 714/716 own them. **Zero diff.**
- The `//`, `import`, `export type`, `type`, `interface` branches of `shouldSkipLine`. **Zero diff.**
- The `.ts`/`.tsx` skip path (A2). **Zero behavior change.**
- The multi-line-`var(` limitation (718R A2, unowned, stays documented) · `src/app/globals.css` · every
  `.module.css` under `src/` · `package.json` · `governance-pr.yml` · `design-tokens-allowlist.json` ·
  `check-stories-rendered.mjs` · **717** · **711**.

---

## 9. Current and required behavior

**Current:** any line whose first non-space character is `*` is skipped before every category runs. In `.css` that
silently hides `css-length`, `css-duration`, `css-zindex` and `css-undefined-var` violations written on a
universal-selector line (§3.2), while `.ts`/`.tsx` JSDoc skipping depends on the same branch. `:586` duplicates
`:584` and can never execute. §23.6.c documents the gap as a known limitation owned by this task.

**Required after:** in `.css`, the skip decision consults the already-stripped source and skips only genuinely
blank lines, so a universal-selector rule is scanned like any other; all four categories flag a violation on it,
each proven by a plant; `.ts`/`.tsx` behavior is unchanged and locked by an arm; the tree still reports 0 findings;
`:586` is gone; §23.6.c records the closure.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist `check:design-tokens` (exit 0) and the current suite total.
- **I2 — Failing arms first (D32).** Add all four R2 arms **before** R1. All four must fail. Persist that run.
- **I3 — R1.** The `.css`-only stripped-line branch. All four arms go green.
- **I4 — R3's regression arms.** One `.css` comment-continuation fixture, one `.tsx` JSDoc-continuation fixture,
  both asserting no finding. Confirm §A's two pre-existing skip arms still pass **unmodified**.
- **I5 — Prove the tree stayed green** (A5). Non-zero → **stop and report**.
- **I6 — R4**, then **R5**'s §23.6.c edit.
- **I7 — Full suite + gate**, both exit 0, real totals stated.
- **I8 — `npx tsc --noEmit`, then `npm run build`** (R7).
- **I9 — Counting gates last, after deleting every scratch file**, reconciled to `git status`.

---

## 10. Implementation requirements

1. **The failing arms come first** (I2) — D32, and all four must fail, not one.
2. **`.ts`/`.tsx` behavior does not move** (A2). §A's two pre-existing skip arms are the lock and must pass
   **unmodified** — if you find yourself editing either, the implementation is wrong.
3. **Ask the stripper, do not guess the selector** (A3).
4. **The tree stays at 0 findings** (A5). A new finding is a stop, not a remediation.
5. **Capture every transcript unpiped** (Task 710 R10).
6. **No task number in any code identifier** (Task 701 F2).
7. **Counting gates LAST, after scratch cleanup, reconciled to `git status`** — a regression is a `P1`.
8. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.

---

## 11. Positive and negative flows

**Positive flow:** four arms fail; R1 lands; all four pass; `.css` and `.tsx` continuation lines still produce
nothing; §A's arms pass unmodified; tree still 0 findings, gate exits 0; `:586` gone; §23.6.c updated; build 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `* { margin: 10px; }` | **Yes** | R2 | `css-length` finding | AC2 |
| `* { transition-duration: 250ms; }` | **Yes** | R2 | `css-duration` finding | AC2 |
| `* { z-index: 42; }` | **Yes** | R2 | `css-zindex` finding | AC2 |
| `* { color: var(--phantom); }` | **Yes** | R2 | `css-undefined-var` finding | AC2 |
| `*,` / `* > *` / `*::before` selector forms | **Yes** | R1 | scanned like any selector — no form-specific handling (A3) | AC1 |
| `.css` line that is entirely a comment | **Yes** | A4, R3 | still skipped (stripped line is blank) | AC3 |
| `.css` violation followed by a trailing comment | **Yes** | A4 | still flagged — 714's existing guarantee | AC3 |
| `.tsx` JSDoc continuation line | **Yes** | A2, R3 | still skipped, path unchanged | AC3 |
| declaration on its own line under a `*` selector | **Yes** | §3.3 | still flagged, as it is today — no change | AC3 |
| tree turns red after R1 | **Yes** | A5 | **stop and report** — never remediate or allowlist | AC3 |
| Locale / viewport / RLS / rendered output | **No** | build-time script only; no strings, no rendering, no data access, no `.module.css` diff | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `shouldSkipLine` and its call site, then the `.css` skip decision is made against the
  CSS-comment-stripped line and skips only when blank, and the non-CSS path is unchanged. Quote the function and
  call site before and after.
- **AC2 [R2]** Given the four planted fixtures, then each produces its category's finding after R1 and produced
  **none** before it. Show both transcripts and all four arms.
- **AC3 [R3]** Given the final tree, `npm run check:design-tokens` reports **0** findings and exits **0**; the
  suite passes with the real total stated; §A's two pre-existing skip arms pass **unmodified** (quote them and
  confirm zero diff); and the two new regression arms (`.css` continuation, `.tsx` JSDoc) pass.
- **AC4 [R4]** Given `shouldSkipLine`, then the duplicate branch is gone and the remaining branches are unchanged.
  Quote before and after.
- **AC5 [R5]** Given §23.6.c, then 718R's `shouldSkipLine` limitation entry is replaced by a closure note naming
  **719** and stating the `.css`/`.ts` asymmetry, and the multi-line-`var(` entry is **still present**. Quote both.
- **AC6 [R6]** Given `git diff`, then every `DETECTION_PATTERNS` entry, the untouched `shouldSkipLine` branches,
  `globals.css`, `package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`, `check-stories-rendered.mjs`
  and every `.module.css` under `src/` are **empty**. Verify by hash.
- **AC7 [R7]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC8 [R8]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A heuristic shared by every category in a CI-blocking gate changes
behavior. Q4 compels planted-violation proof, and R2 requires **four** — one per blinded category — because a
single plant would prove only that one code path recovered.

**Rendered evidence is not required, and the reason is structural:** no `.module.css`, no `globals.css`, no `.tsx`
and no token changes (R6, hash-verified). The only artifact touched is a build-time Node script and its suite.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0 — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | current total passes — persisted |
| 4 | **Four R2 arms, pre-R1** (I2) | **all four FAIL** — persisted; the D32 proof |
| 5 | R1 (I3) + re-run | all four pass |
| 6 | R3's two regression arms + §A's two unmodified (I4) | pass |
| 7 | `npm run check:design-tokens` (I5) | **0** findings, exit 0 — or **stop and report** |
| 8 | R4 + R5 (I6) | — |
| 9 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I7) | all pass, real total stated |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `check:file-integrity` · `check:mojibake` — **last, after cleanup** | pass; reconcile to `git status` |

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence under `.screenshots/task719-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task719-skipline-universal-selector.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R8, each with its AC verdict.
3. **`shouldSkipLine` and its call site**, quoted before and after.
4. **The four planted arms** — failing transcript and passing transcript, per category.
5. **The regression evidence** — §A's two arms confirmed unmodified and passing, plus the two new ones.
6. **The §23.6.c edit**, quoted, showing the retired entry and the surviving multi-line one.
7. **Commands run and actual results** — real exit codes, including the step-11 build transcript.
8. **Evidence locations** — every artifact, named.
9. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
10. **Standing findings not acted on** — the multi-line-`var(` limitation (unowned), 717, 711, 700, 702/691.
11. **Assumptions, deviations, limitations, unresolved issues.**
12. Concise current state in `docs/backlog.md` — **state only**, and re-flag `BACKLOG LIMIT BREACH` if you cannot
    hold the line count.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ the function quoted with its line range, its call site, the input R1 reuses, all four blinded categories with their measured fixtures, the two regression arms named by their existing titles, and every command |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R8 → AC1–AC8 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC6; A2 makes the 4,058-line `.ts` surface an explicit no-move zone with its own arm; §5.1's four rejected alternatives |
| **No number is asserted that was not measured with the real tool** | ✅ `:581-588` · `:586` dead · 4 categories missed with a passing control · the multi-line form caught · 309 `*`-lines in `.css`, exactly 1 real and unscanned · 4058 in `.ts`/`.tsx` — all run in this worktree on 2026-08-06 |
| The gate proves the changed behavior, not merely procedure | ✅ R2 requires four plants, each failing first; A5 forbids treating a green tree as proof; §3.4 states outright that the tree cannot demonstrate the fix |
| No new blind spot is created silently | ✅ A4 names the trailing-comment case the change must not regress; R5 keeps the multi-line limitation documented rather than quietly inheriting it |
| Zero/empty input covered | ✅ the blank-stripped-line case **is** the mechanism (A4), and R3 locks both the entirely-comment line and the violation-before-comment line |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's four mandatory failures + I5's stop condition + A2's arm + I9's cleanup-then-count |
| Ordering/dependency stated | ✅ A1 blocks this on 718R with a stop condition, mirroring Sprint 49's ordered 708 → 709 |
| Owner exceptions have traceable authorization | ✅ the owner's instruction (4) of 2026-08-06 created this task; D6 for the evidence dir; D32 cited |
| Exactly one active executable route | ✅ A3 fixes the mechanism, §5.1 closes four alternatives, A1/A2/A5 convert each remaining fork into a decision plus a stop condition |
| Prior-review corrections folded in | ✅ 718 review **F1** (origin, escalated by §3.2's measurement) and **F2**'s lesson — I2 requires four *behavioral* failures, never a module-load error; 710 **R10** (unpiped); **701 F2** (no task numbers in code) |
| Sprint assigned before creation | ✅ Sprint 52, already open; row added to its Tasks table |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** The owner's instruction (4) of 2026-08-06 authorized this task's existence;
its scope is bounded by the measurement in §3.2/§3.4.
