# Task 718R — Close `css-undefined-var`'s uppercase gap and document the two it cannot close

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Revises:** Task 718 (`NEEDS REVISION`, uncommitted — its 5 modified paths + session log are still in the worktree).
**Origin:** Task 718 review **F1** (`P2`), plus **F3** (`P3`) folded in at the owner's direction, 2026-08-06.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — detector coverage correction** (`docs/rule-index.md` → Validation/QA
  tooling).
- **Secondary type:** documentation of measured coverage limitations (`docs/design-system.md` §23.6.c).

> **Read this first.** This is not a new gate. Task 718's `css-undefined-var` category works — the review reproduced
> its planted-violation arms independently and confirmed exit 1 / exit 0. What the review found is that **three
> shapes of undefined `var()` are silently not findings**, while §23.6.c documents only two limitations (A4, A6). A
> reader of §23.6.c concludes those two are the whole list. They are not. **One of the three is fixable here; two
> are not, and this task's job is to make all three visible instead of leaving them as silent defaults.**

---

## 2. Objective

1. **Fix the one that is in this file's own code:** `VAR(--missing)` — CSS function names are case-insensitive, and
   the detector's `var\(` regex is not (R1).
2. **Document the two that are not fixable here** — the `*`-leading-line skip and the multi-line `var(` — as named
   coverage limitations in §23.6.c beside A4 and A6, each pointing at the task that owns it (R3).
3. **Lock all three in the suite** with arms that assert the *documented* behavior, including the two negative ones
   (R2). A limitation with no arm is a limitation that will be re-discovered by a review instead of by the suite.
4. **Fold in review F3 at the owner's direction:** restore the three narrowed pre-existing arms to their unfiltered
   `toHaveLength(0)` form (R4).

**Non-goals:** do **not** modify `shouldSkipLine` — that is **719** (§5, A1); do **not** widen the detector to
multi-line `var()` (§5, A2); do **not** touch any 714/716 detection pattern; do **not** re-open Task 718's A5
fallback decision, its external-prefix list, or the `--z-*` definitions, all of which the review verified.

---

## 3. Verified context

Every line number, count and behavior below was measured in this worktree on **2026-08-06** with the real tool,
during the Task 718 review. Task 718's five modified paths are **uncommitted and present** — this task edits that
same working state, it does not start from `HEAD`.

### 3.1 The three gaps, reproduced

Probed against the real exported `scanContent` (in-memory fixtures, no tree writes):

| Fixture | Result | Cause |
|---|---|---|
| `.x { color: var(--phantom-a); }` | **FLAGGED** ✓ | control — the category works |
| `*, *::before { color: var(--phantom-b); }` | **not flagged** | `shouldSkipLine` — **719** |
| `  * { color: var(--phantom-d); }` | **not flagged** | same | 
| `.z { color: var(\n  --phantom-e\n ); }` | **not flagged** | line-based scan, deliberate (§3.4) |
| `.w { color: VAR(--phantom-f); }` | **not flagged** | **R1 fixes this** |
| `var(--tw-ease, var(--phantom-h))` | **FLAGGED** ✓ | nested resolution correct, unchanged |
| `.a { color: var(--late); }` then `:root{--late:red}` | not flagged ✓ | documented position-independence, unchanged |

### 3.2 R1's exact edit site

`scripts/check-design-tokens.mjs:481`:

```js
  const callRe = /var\(/g;
```

This regex is **local to `findUndefinedCssVarReferences`** (Task 718's own function, added at `:417-471`). It is not
a `DETECTION_PATTERNS` entry and is read by no other category, so the `i` flag cannot affect 714's or 716's
behavior. That containment is why R1 belongs here and not in 719.

### 3.3 The `i` flag is measurably safe on this tree

The risk of `/var\(/gi` is a false positive on an identifier that merely *ends* in `var(`.

| Probe (case-insensitive, `src/**/*.css`) | Count |
|---|---:|
| `[\w-]var\(` — any identifier ending in `var(` | **0** |
| `\bVAR\(` — uppercase references today | **0** |

Both zero. So R1 **adds no finding to the current tree** — the gate still exits 0 (R6) — and introduces no known
false positive. R1 is latent protection, not remediation.

### 3.4 Why the multi-line gap is not fixed here

`findUndefinedCssVarReferences` scans one physical line and bails on an unbalanced paren:

```js
    if (depth !== 0) continue; // unterminated on this physical line — skip
```

That is deliberate and consistent with the whole file: `scanContent` iterates `lines`, every category is
line-scoped, and every finding carries a single `line` number. Making one category multi-line would give it a
different source model from every other category in the same loop. **Document it (R3); do not fix it.** If it is
ever worth fixing, it is a scanner-architecture task, not a regex change.

### 3.5 Why the `*`-line gap is not fixed here — and how small it currently is

`scripts/check-design-tokens.mjs:581-588`:

```js
function shouldSkipLine(line) {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;   // :586 — dead duplicate of :584
  ...
```

`shouldSkipLine` runs **before every category**, so changing it changes 714's, 716's and 718's behavior at once.
That is **719**'s blast radius, not this task's.

Measured exposure today, `src/**/*.css`:

| Metric | Value |
|---|---:|
| lines whose first non-space character is `*` | **309** |
| of those, lines that survive CSS-comment stripping (real CSS, not a comment continuation) | **1** |
| that one line | `src/app/globals.css:559` — `* {` |
| is it scanned? | **No** — `globals.css` is excluded from the scanner (`SKIP_FILES`, Task 718 A6) |

**So the live exposure of this gap is currently zero**, and 308 of the 309 lines are JSDoc-style comment
continuations that `shouldSkipLine` skips *correctly*. That is exactly why it is a documented limitation here and a
carefully-proven task there: the fix is cheap, the regression surface is 308 lines wide.

### 3.6 §23.6.c's current limitation block

`docs/design-system.md`: **A4** at `:1156`, **A6** at `:1161`, **Proof (Task 718 R5, D32)** at `:1165`. R3's two new
entries go **after A6 and before Proof**, in the same `**Xn — known coverage limitation, not closed here:**` shape
the two existing entries already use.

### 3.7 F3 — the three narrowed arms, and the measured replacement

Task 718 narrowed three pre-existing arms from "no findings at all" to "no `css-length` findings", because their
fixture used the fictitious `--x`, which the new category legitimately flags:

| Line | `it()` title (abbreviated) | Current assertion |
|---|---|---|
| `:270` | does NOT flag a `calc(var(...))` length declaration (§D) | `.filter(f => f.cat === 'css-length')` |
| `:390` | does NOT flag a `calc()` built entirely from a `var()` and a unitless number (R3, §E) | same |
| `:409` | exempts a literal inside a function whose SAME function also contains a `var()` (A4 nested, §E) | same |

`--space-6` is defined at `src/app/globals.css:157` (`--space-6: 1.5rem;`). Substituting it and running the real
`scanContent` with the real globals definitions:

| Fixture | Unfiltered finding count |
|---|---:|
| `.x { width: calc(var(--space-6) * 2); }` | **0** |
| `.x { width: calc(var(--space-6) + 2px); }` | **0** |

Both clean, so the unfiltered `toHaveLength(0)` holds and each arm goes back to asserting strictly more than it does
now, on a fixture that is also more realistic than `--x`.

### 3.8 Worktree state

`git status --short` at task-design time — six paths, all Task 718's, all uncommitted:

```
 M docs/backlog.md
 M docs/design-system.md
 M scripts/__tests__/check-design-tokens.test.ts
 M scripts/check-design-tokens.mjs
 M src/app/globals.css
?? docs/sessions/2026-08-06-task718-zindex-tokens-and-undefined-var-gate.md
```

Plus the two artifacts this kickoff adds (§7). **Take your own pre-write `git status --porcelain` snapshot before
your first edit** and complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry — the start
state is dirty by design here, because 718 was never committed.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-08-06 (1); review F1 | `callRe` at `check-design-tokens.mjs:481` carries the `i` flag, so `VAR(--missing)` — and any mixed case — is found exactly as `var(--missing)` is. Nothing else in the function changes. | P0 | AC1 | Confirmed |
| R2 | Owner 2026-08-06 (2); review F1 | Three arms added to §H: **(a)** `VAR(--missing)` **is** flagged; **(b)** a `*`-leading line is **not** flagged, with the reason and **719** named in the test title or a comment; **(c)** a multi-line `var(` is **not** flagged, same treatment. (b) and (c) assert the *documented* limitation, not an aspiration. | P0 | AC2 | Confirmed |
| R3 | Owner 2026-08-06 (3); review F1 | §23.6.c records both remaining gaps as named limitations after A6 and before Proof, each stating what is missed, why it is not closed here, and who owns it (**719** / architectural). | P0 | AC3 | Confirmed |
| R4 | Owner 2026-08-06 (optional, adopted); review F3 | The three arms at `:270`, `:390`, `:409` are restored to unfiltered `expect(...).toHaveLength(0)` with `--x` replaced by `--space-6`. Their `it()` titles and the behavior they test are unchanged; the Task 718 scoping comments are removed as no longer true. | P2 | AC4 | Confirmed |
| R5 | scope | Zero diff in `src/app/globals.css`, `package.json`, `.github/workflows/governance-pr.yml`, `scripts/design-tokens-allowlist.json`, `scripts/check-stories-rendered.mjs`, every `.module.css` under `src/`, and **`shouldSkipLine`**. Verify by hash and by diff. | P0 | AC5 | Confirmed |
| R6 | §3.3, R7 | The gate still reports **0** `css-undefined-var` findings and `npm run check:design-tokens` exits **0** — R1 is latent protection, it must not turn the tree red. | P0 | AC6 | Confirmed |
| R7 | R2, R4 | Suite passes at **89** arms (85 + 3 from R2 + 1 net-zero from R4 — restate the real total from the transcript if it differs, do not force this number). No pre-existing arm weakened; R4 strengthens three. | P0 | AC7 | Confirmed |
| R8 | D32 | **Failing arm first.** R2(a) must fail before R1 lands. Persist that run. | P0 | AC8 | Confirmed |
| R9 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC9 | Confirmed |
| R10 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, numbers **reconcile to `git status`**. | P1 | AC10 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — `shouldSkipLine` is off-limits here, and that is a scoping decision, not an oversight.** It gates every
  category (§3.5). Touching it inside a task whose stated purpose is a one-character regex fix would mean a
  three-category regression surface with no planted proof budget. **719** owns it, with its own per-category proof.
  If you conclude R3's documentation cannot honestly describe the gap without also fixing it, **stop and report**.
- **A2 — the multi-line gap has no owner and should not acquire one by accident.** §3.4 explains why it is
  structural. R3 documents it as a known architectural limitation with **no** task number attached. Do not register
  a task for it; do not fix it.
- **A3 — R1 cannot be proven by the tree, only by a plant.** §3.3 measured **0** uppercase `VAR(` references in
  `src/`, so a green gate run proves nothing about R1. Its proof is R2(a)'s arm plus R8's failing-first run. Do not
  offer a green `check:design-tokens` as R1 evidence.
- **A4 — the `i` flag's false-positive surface is measured, not assumed.** §3.3 found **0** identifiers ending in
  `var(`. If your own re-measurement finds a non-zero count, **stop and report** — the fix would then need a
  boundary guard, which is a different edit with a different risk profile than the owner authorized.
- **A5 — R4 is the owner's optional item, adopted as P2.** It is the lowest-priority requirement here. If it turns
  out that any of the three arms does **not** go clean unfiltered with `--space-6` — contradicting §3.7's
  measurement — leave that arm scoped, record which one and its actual finding output, and complete R1–R3. A
  partially-delivered R4 is acceptable; a forced one is not.

### 5.1 Naming and numbering — decided

This is a **revision of 718**, not a new number: it corrects 718's own uncommitted work before it is committed, and
718's `NEEDS REVISION` verdict is what created it. It follows the `709` → `709R` precedent
(`Sprint_49_kickoff_prompt_Task_709R_HeroSearchView_LayerFix.md`). **719** is a separate, genuinely new task
(`shouldSkipLine`) and is not this one. No task number appears in any code identifier (Task 701 F2).

### 5.2 Rejected alternatives — do not re-open

- **Fix `shouldSkipLine` here.** Rejected by A1 — **719**.
- **Make the scan multi-line.** Rejected by A2/§3.4 — architectural, unowned, documented only.
- **Replace `/var\(/gi` with a boundary-guarded regex.** Rejected unless A4's re-measurement forces it: the owner
  authorized the `i` flag, §3.3 measured it safe, and the guard changes the `m.index + 4` offset arithmetic the
  paren-walk depends on.
- **Commit 718 first, then revise.** Rejected: 718 is `NEEDS REVISION`; the review withheld its handoff. One commit
  covers 718 + 718R once this is approved.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** · `docs/design-system.md` **§23.6.c** (the section R3 edits — read all of it, including A4/A6, before
adding to it).

**Task-specific — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` — `findUndefinedCssVarReferences` (`:417-471`), `callRe` (**`:481`**, R1's only
  edit), and `shouldSkipLine` (**`:581-588`** — read for R3's wording, **do not edit**, A1).
- `scripts/__tests__/check-design-tokens.test.ts` — the **§H** block (`:517`+, 16 arms, add yours in the same
  style) and the three F3 arms at **`:270`**, **`:390`**, **`:409`**.
- `tasks/Sprints/Sprint_52_kickoff_prompt_Task_718_ZIndexTokens_And_UndefinedVarGate.md` — **A4/A5/A6 only**, so
  R3's new entries match the established voice and do not contradict the two already published.
- `docs/sessions/2026-08-06-task718-zindex-tokens-and-undefined-var-gate.md` — §5 and §9, the limitation and
  narrowed-arm records this task extends.

---

## 7. Scope

- `scripts/check-design-tokens.mjs` — **the `i` flag on `:481` and nothing else.**
- `scripts/__tests__/check-design-tokens.test.ts` — three new §H arms (R2), three restored arms (R4).
- `docs/design-system.md` — §23.6.c, two limitation entries between A6 and Proof (R3).
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-06-task718R-css-undefined-var-coverage-gaps.md`.

## 8. Out of scope

- **`shouldSkipLine` — zero diff.** **719** (A1).
- **`src/app/globals.css` — zero diff.** 718's `--z-*` block is approved as-is by the review; do not touch it.
- **Every `.module.css` under `src/` — zero diff.**
- `package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`, `check-stories-rendered.mjs` — zero diff.
- Every existing detection pattern (714/716) · the A5 fallback decision · the external-prefix list · the `--z-*`
  values · 717 · 711.

---

## 9. Current and required behavior

**Current:** `css-undefined-var` blocks correctly on ordinary CSS — the review reproduced exit 1 on a plant and exit
0 on its removal. But `VAR(--missing)`, a `var()` on a line whose first non-space character is `*`, and a `var(`
split across physical lines are all silently not findings, and §23.6.c lists only A4 and A6, so a reader takes those
two for the complete set. Three pre-existing arms assert less than they did before 718.

**Required after:** uppercase and mixed-case `var()` is found; the two remaining gaps are named limitations in
§23.6.c with owners; all three are locked by arms that assert the documented behavior; the three narrowed arms are
strict again; the tree still reports 0 findings and the gate still exits 0.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain` (dirty — complete the manifest). Persist `check:design-tokens`
  (exit 0) and the current suite total (exit 0).
- **I2 — Failing arm first (D32).** Add R2(a)'s `VAR(--missing)` arm **before** R1. It must fail. Persist that run.
- **I3 — R1.** Add the `i` flag. R2(a) goes green.
- **I4 — Re-measure A4's safety** on your own tree (`[\w-]var\(`, case-insensitive, `src/**/*.css`). Non-zero →
  **stop and report**.
- **I5 — R2(b)/(c).** Add the two negative arms. Confirm each fails for the documented reason and not by accident:
  temporarily change the fixture's selector to `.x` (b) or join the `var(` onto one line (c) and watch the same
  fixture **become** a finding. Persist both, then restore the arms to their limitation-asserting form.
- **I6 — R3.** Both §23.6.c entries, after A6, before Proof.
- **I7 — R4.** Restore the three arms; delete the now-false scoping comments.
- **I8 — Full suite + gate.** Both exit 0. State the real arm total.
- **I9 — `npx tsc --noEmit`, then `npm run build`** (R9).
- **I10 — Counting gates last, after deleting every scratch file**, reconciled to `git status`.

---

## 10. Implementation requirements

1. **The failing arm comes first** (I2) — D32. A green suite after the fix is not proof on its own.
2. **`shouldSkipLine` is not edited** (A1). If you believe R3 cannot be written honestly without editing it, stop.
3. **R2(b) and (c) assert the limitation, not the wish.** An arm that expects these to be flagged would fail, and
   "skipped" or `.todo` is not acceptable — the suite must state today's real behavior. I5's inversion proves the
   arm is discriminating rather than vacuous.
4. **Re-measure before trusting §3.3/§3.7** (I4, and R4's clean-unfiltered claim). They were measured during the
   718 review, on this same worktree — confirm, do not inherit.
5. **Capture every transcript unpiped** (Task 710 R10).
6. **No task number in any code identifier** (Task 701 F2). Task numbers in test titles and comments are the
   established convention here and are fine.
7. **Counting gates LAST, after scratch cleanup, reconciled to `git status`** — a regression is a `P1`.
8. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.

---

## 11. Positive and negative flows

**Positive flow:** R2(a) fails, R1 lands, it passes; the two negative arms lock the documented gaps; §23.6.c names
both with owners; the three arms are strict again; suite green; gate exits 0 with 0 `css-undefined-var` findings;
`shouldSkipLine` and `globals.css` untouched; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `VAR(--missing)` uppercase | **Yes** | R1 | **finding**, blocking | AC1, AC2 |
| `Var(--missing)` mixed case | **Yes** | R1 | **finding** — `i` is not "uppercase only" | AC1 |
| `var(--missing)` lowercase | **Yes** | R1 | still a finding — unchanged | AC2 |
| identifier ending in `var(` | **Yes** | A4 | no false positive; 0 measured, re-measure at I4 | AC1 |
| `*`-leading line | **Yes** | R2(b), A1 | **not** flagged; documented; **719** | AC2, AC3 |
| multi-line `var(` | **Yes** | R2(c), A2 | **not** flagged; documented; architectural | AC2, AC3 |
| the three F3 arms with `--space-6` | **Yes** | R4 | 0 findings unfiltered | AC4 |
| tree turns red after R1 | **Yes** | R6/A3 | 0 uppercase refs measured → must stay green; red means **stop and report** | AC6 |
| `.tsx` behavior | **Yes** | R5 | unchanged — the category is `cssOnly`, `callRe` is not shared | AC5, AC7 |
| Locale / viewport / RLS / rendered output | **No** | build-time script only; no strings, no rendering, no data access, no `.module.css` diff | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `check-design-tokens.mjs:481`, then the regex carries `i`, the diff of this file is **exactly
  that one line**, and a re-measurement of `[\w-]var\(` in `src/**/*.css` returns **0**. Quote the line before and
  after and the re-measured count.
- **AC2 [R2]** Given the §H block, then three arms exist: `VAR(--missing)` flagged; `*`-leading line not flagged;
  multi-line `var(` not flagged. Show all three, plus I5's inversion transcripts proving (b) and (c) are
  discriminating.
- **AC3 [R3]** Given §23.6.c, then two limitation entries sit between A6 and Proof, each naming what is missed, why
  it is not closed here, and its owner (**719** / architectural, no owner). Quote both.
- **AC4 [R4]** Given `:270`, `:390`, `:409`, then each asserts unfiltered `toHaveLength(0)` on a `--space-6`
  fixture and the Task 718 scoping comments are gone. Quote all three before and after. If any could not be
  restored, state which, its actual finding output, and why.
- **AC5 [R5]** Given `git diff`, then `shouldSkipLine`, `globals.css`, `package.json`, `governance-pr.yml`,
  `design-tokens-allowlist.json`, `check-stories-rendered.mjs` and every `.module.css` under `src/` are **empty**.
  Verify by hash.
- **AC6 [R6]** Given the final tree, `npm run check:design-tokens` reports **0** `css-undefined-var` findings and
  exits **0**. Persist the transcript with the exit code inside it.
- **AC7 [R7]** Given the suite, then it passes with the real total stated, no pre-existing arm weakened, and the
  three R4 arms strengthened. State totals before and after.
- **AC8 [R8]** Given R2(a) run before R1, then it **fails**. Persist that run with its exit code.
- **AC9 [R9]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC10 [R10]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation, including this task's two new artifacts and 718's six.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A CI-blocking gate's matching behavior changes. Q4's planted-violation
requirement is satisfied by R8's failing-first arm plus I5's two inversions — a green suite is explicitly **not**
sufficient (A3: the tree contains 0 uppercase references, so the gate cannot demonstrate R1 by running clean).

**Rendered evidence is not required, and the reason is structural:** no `.module.css`, no `globals.css`, no `.tsx`
and no token value changes (R5, hash-verified). The only runtime artifact touched is a build-time Node script.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | dirty — 718's 6 paths + this task's 2; completed manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0 — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | 85 pass — persisted |
| 4 | **R2(a) arm, pre-`i`-flag** (I2) | **FAIL** — persisted; the D32 proof |
| 5 | Add `i` (I3) + re-run | R2(a) passes |
| 6 | `grep -rniE '[\w-]var\(' --include='*.css' src/` (I4) | **0** — or **stop and report** |
| 7 | I5 inversions for R2(b) and (c) | each fixture **becomes** a finding when its cause is removed — persisted |
| 8 | R3 + R4 (I6/I7) | — |
| 9 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I8) | all pass, real total stated |
| 10 | `npm run check:design-tokens` (I8) | **0** `css-undefined-var`, exit 0 |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate** |
| 13 | `check:file-integrity` · `check:mojibake` — **last, after cleanup** | pass; reconcile to `git status` |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence under `.screenshots/task718R-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-06-task718R-css-undefined-var-coverage-gaps.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot, with
   718's six paths distinguished from 718R's.
2. **Requirement IDs completed** — R1–R10, each with its AC verdict.
3. **The `callRe` line**, before and after, plus I4's re-measured false-positive count.
4. **The three new arms**, quoted, with I5's inversion transcripts.
5. **The two §23.6.c entries**, quoted.
6. **The three restored arms**, before and after — or, per A5, which one was not restored and its real output.
7. **Commands run and actual results** — real exit codes, including the step-12 build transcript.
8. **Evidence locations** — every artifact, named.
9. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
10. **Standing findings not acted on** — **719** (`shouldSkipLine`), the multi-line limitation (unowned), 717, 711,
    700, 702/691 (Sprint 46).
11. **Assumptions, deviations, limitations, unresolved issues.**
12. Concise current state in `docs/backlog.md` — **state only**. The file is at **87** lines against an ~80 target
    and in `BACKLOG LIMIT BREACH`; **do not add net lines**, and re-flag the breach if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ the exact line (`:481`), its current text, the three arm shapes with their probed results, the §23.6.c insertion point (after `:1161`, before `:1165`), the three F3 line numbers, the replacement token with its defining line, and every command are named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R10 → AC1–AC10 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC5 covering `shouldSkipLine`, `globals.css` and every `.module.css`; §5.2's four rejected alternatives |
| **The owner decision is quoted, not inferred** | ✅ the owner's four numbered instructions of 2026-08-06 map to R1 (1), R2 (2), R3 (3) and **719** (4); the optional fifth is R4, adopted at P2 with A5's stop condition |
| **No number is asserted that was not measured with the real tool** | ✅ `:481` · 0 `[\w-]var(` · 0 uppercase `VAR(` · 309 `*`-leading lines, exactly 1 real and it is unscanned · `--space-6` at `:157` · both R4 fixtures measured 0 unfiltered · §23.6.c anchors `:1156`/`:1161`/`:1165` · suite at 85 — all run in this worktree on 2026-08-06 |
| The gate proves the changed behavior, not merely procedure | ✅ R8 requires R2(a) to fail first; A3 forbids offering a green gate as R1 evidence; I5 requires both negative arms to be inverted and shown to flip |
| No new blind spot is created silently | ✅ that is the entire task — R3 converts the two unfixable gaps from silent defaults into named limitations with owners, and R2(b)/(c) lock them in the suite |
| Zero/empty input covered | ✅ §3.3's two zero counts are the *reason* R1 is safe, and R6 makes a post-fix red tree a stop condition rather than a remediation exercise |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's mandatory failure + I4's stop condition + I5's inversions + A5's partial-R4 path + I10's cleanup-then-count |
| Dirty worktree handled | ✅ §3.8 quotes the real six-path start state and requires the manifest; AC10 reconciles 718's six plus 718R's two |
| Owner exceptions have traceable authorization | ✅ the owner's 2026-08-06 instruction list; D6 for the evidence dir; D32 cited with its source |
| Exactly one active executable route | ✅ §5.1 fixes the numbering, §5.2 closes four alternatives, A1/A2/A4/A5 each convert a fork into a decision plus a stop condition |
| Prior-review corrections folded in | ✅ 718 review **F1** (R1–R3) and **F3** (R4); 718 **F2**'s lesson applied in R8/I5 — a comparator must fail on *behavior*, not on a missing import; 710 **R10** (unpiped); **701 F2** (no task numbers in code) |
| Sprint assigned before creation | ✅ Sprint 52, already open; row added to its Tasks table |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** The owner's four instructions are implemented as R1–R3 here and **719**
separately; the optional fifth is R4 at P2 with an explicit partial-delivery path (A5).
