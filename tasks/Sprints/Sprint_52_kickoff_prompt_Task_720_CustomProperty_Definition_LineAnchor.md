# Task 720 — `extractCssCustomPropertyDefinitions` only sees the first declaration on a line

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Sequenced after:** **719** (§5, A1 — file-contention, not behavioral dependency).
**Origin:** owner decision 2026-08-06, from a reviewer probe during the 718R review.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — detector correctness** (`docs/rule-index.md` → Validation/QA tooling).
- **Blast radius:** one function, one category (`css-undefined-var`). Narrower than 719 by design.

> **Read this first.** This defect is a **false positive**, not a false negative — the gate fails **loud**, and CI
> goes red rather than letting a violation ship silently. That is the opposite of the failure class this sprint
> exists to hunt, and it is why this is a `P2` correctness fix with zero current exposure rather than an
> emergency. **The danger in this task is the fix, not the bug:** the obvious one-character repair converts a loud
> false positive into a silent false negative (§3.4). Read §3.4 before writing any regex.

---

## 2. Objective

1. **Register every custom-property declaration in a scanned `.css` file**, not only the first one on each physical
   line, so a same-line define-and-use no longer produces a phantom `css-undefined-var` finding (R1).
2. **Do it with declaration-aware parsing, not by deleting the `^` anchor** (R2, §3.4 — owner decision).
3. **Preserve name case-sensitivity** — `--Foo` and `--foo` are two different properties and must stay two
   different entries (R3).
4. **Prove it failing-first**, with the three arms the owner specified (R4).

**Non-goals:** do **not** touch `shouldSkipLine` — **719** owns it and lands first; do **not** change any
`DETECTION_PATTERNS` entry (714/716); do **not** change `findUndefinedCssVarReferences`, the A5 fallback rule, the
external-prefix list, or the `--z-*` definitions (all approved in 718/718R, committed `98bec3fa9`); do **not** close
the multi-line-`var(` limitation (§23.6.c A8, deliberately unowned).

---

## 3. Verified context

Every result below was measured on **2026-08-06** against the real exported function, at commit `98bec3fa9`.

### 3.1 The code

`scripts/check-design-tokens.mjs:571-578`, regex at **`:574`**:

```js
export function extractCssCustomPropertyDefinitions(content) {
  const stripped = stripCssComments(content);
  const defs = new Set();
  const re = /^\s*(--[\w-]+)\s*:/gm;
  ...
```

`^…/gm` anchors each match to the start of a physical line, and `exec` advances past it — so **at most one
declaration per line is ever registered, and only if it is the first token on that line.**

### 3.2 The behavior, measured

| Input | Returns |
|---|---|
| `'--Foo: 1px; --foo: 2px'` | `['--Foo']` — **the second same-line declaration is missed** |
| `'  --Foo: 1px;\n  --foo: 2px;'` | `['--Foo', '--foo']` — separate lines, both registered, **case correctly distinct** |
| `'.x { --Foo: 1px; }'` | `[]` — **not the first token on its line, missed entirely** |
| `'.x {\n  --Foo: 1px;\n}'` | `['--Foo']` — control |

Consequence for the gate, measured end-to-end through `scanContent`:

| Fixture | `css-undefined-var` findings | Correct? |
|---|---:|---|
| `.x {\n  --local: 1px;\n  width: var(--local);\n}` | 0 | ✅ |
| `.x { --local: 1px; width: var(--local); }` | **1** | ❌ **false positive** |
| `.x { --Local: 1px; width: var(--Local); }` | **1** | ❌ same defect, unrelated to case |

**Both halves of the defect are line-anchoring.** The reviewer's first probe of this attributed the second row to
case-sensitivity; the owner corrected that on 2026-08-06, and §3.2 row 2 is the disproof — separate lines keep
`--Foo` and `--foo` distinct and both resolvable, so case handling is already correct (R3 only has to **preserve**
it, not fix it).

### 3.3 Current live exposure: zero

Scanned every `.css` under `src/`, CSS comments stripped, looking for a `--x:` declaration that is not the first
token on its line:

| Metric | Value |
|---|---:|
| same-line (non-first-token) custom-property declarations in `src/**/*.css` | **0** |

Independently confirmed by the owner on the same date. So **R1 must not change a single finding on the current
tree** (R6) — like 718R's `i` flag, this is latent correctness, and a green gate afterwards is the expected result,
not the proof.

### 3.4 Why deleting the `^` is rejected — the fix is the dangerous part

The one-character repair is `/(--[\w-]+)\s*:/g`. On **this** tree it invents **0** extra definitions, so the tree
cannot justify rejecting it — the argument is prospective, and these constructed cases demonstrate it:

| Fixture | anchored (current) | naive (`^` removed) |
|---|---|---|
| `.x {\n  content: "--fake: 1px";\n}` | `[]` | **`['--fake']`** |
| `.x {\n  background: url("data:image/svg+xml,<svg style=%27--fake2: 1%27/>");\n}` | `[]` | **`['--fake2']`** |
| `.x {\n  --real: 1px;\n}` (control) | `['--real']` | `['--real']` |

A declaration-shaped literal **inside a value** — a `content` string, a data URI, any quoted payload — would be
registered as a definition. A later `var(--fake)` would then **silently resolve**, converting a loud false positive
into exactly the silent false negative this sprint exists to eliminate. **The repair must know the difference
between a declaration and a value.** Owner decision, 2026-08-06: *"Не варто просто прибирати `^` з regex … потрібен
declaration-aware розбір."*

### 3.5 What "declaration-aware" has to mean here, and what it must not become

`stripCssComments` already runs first, so comments are not the problem. What remains is telling *"a `--x:` that
begins a declaration"* from *"a `--x:` inside a value"*. A declaration starts at the beginning of a line, after a
`{`, or after a `;` — always at the top level of the current block, and never inside quotes or parentheses.

That is expressible as a scan over the stripped source that tracks quote state and paren depth. **It is not an
invitation to add a CSS parser dependency** — rejected in 714 §5.2, 716 §5.2 and 718 §5.2, and rejected again here.
If you conclude that quote/paren-aware scanning genuinely cannot express it, **stop and report**; do not add the
dependency and do not ship the naive regex.

### 3.6 What is already correct and must stay correct

718/718R are committed (`98bec3fa9`) and approved. This task must not regress:

- **Case-sensitivity** — §3.2 row 2 (R3).
- **Comment blindness** — a declaration-shaped string inside a CSS comment is not a definition; the existing arm
  *"extractCssCustomPropertyDefinitions ignores a definition-shaped string inside a comment"* is the lock (R5).
- **Indentation/nesting independence** — the existing arm *"…finds a custom property regardless of
  indentation/block nesting"* is the lock (R5).
- **`globals.css` resolution** — `run()` feeds this function's output in as `globalsDefinedProps`; the 7 `--z-*`
  tokens must keep resolving. The R1 regression-lock arm is the lock (R5).

### 3.7 Worktree state

This task runs **after 719 is approved and committed**. Take your own pre-write `git status --porcelain` snapshot
before the first edit and complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry if it is
not empty.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2, owner | `extractCssCustomPropertyDefinitions` registers **every** custom-property declaration in the stripped source, including a second one on the same line and one that is not the first token on its line. | P2 | AC1 | Confirmed |
| R2 | §3.4, owner | The implementation is **declaration-aware** — it distinguishes a declaration from a declaration-shaped literal inside a value, tracking quote state and paren depth. Deleting the `^` anchor is **not** an acceptable implementation. No CSS parser dependency (§3.5). | P0 | AC2 | Confirmed |
| R3 | §3.2, owner | Name **case-sensitivity is preserved**: `--Foo` and `--foo` remain two distinct entries, and a `var()` whose name differs only in case from a defined property is still a finding. | P0 | AC3 | Confirmed |
| R4 | owner, D32 | **Failing-first arms**, all three: (a) `.x { --local: 1px; width: var(--local); }` produces **0** `css-undefined-var` findings; (b) two different-case custom properties on one line are **both** registered, distinctly; (c) a declaration-shaped literal inside a **value** (`content` string and data-URI, §3.4) is **not** registered. Each must fail before R1/R2 land. | P0 | AC4 | Confirmed |
| R5 | §3.6 | The three existing lock arms (comment-blindness, indentation/nesting, the `--z-*` R1 regression lock) pass **unmodified**. No pre-existing arm weakened. | P0 | AC5 | Confirmed |
| R6 | §3.3 | The gate still reports **0** findings tree-wide and `npm run check:design-tokens` exits **0** — a new finding is a **stop and report**, never a remediation. | P0 | AC6 | Confirmed |
| R7 | §23.6.c | §23.6.c records the corrected resolution-source-2 semantics (every declaration, not the first per line) and states the quote/paren-aware basis. **A7 and A8 stay untouched** — this task closes neither. | P1 | AC7 | Confirmed |
| R8 | scope | Zero diff in `shouldSkipLine`, `findUndefinedCssVarReferences`, every `DETECTION_PATTERNS` entry, `src/app/globals.css`, `package.json`, `.github/workflows/governance-pr.yml`, `scripts/design-tokens-allowlist.json`, `scripts/check-stories-rendered.mjs`, and every `.module.css` under `src/`. Verify by hash. | P0 | AC8 | Confirmed |
| R9 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC9 | Confirmed |
| R10 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, numbers **reconcile to `git status`**. | P1 | AC10 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — 719 lands first, for file contention, not behavior.** The two defects are independent: 719 fixes a shared
  skip heuristic across four categories; this fixes one function feeding one category. But both edit
  `check-design-tokens.mjs` and `check-design-tokens.test.ts`, and 719's own scope statement covers the test file.
  Owner decision, 2026-08-06: keep them separate and run this one **after**. If 719 is not yet `APPROVED`,
  **stop and report**.
- **A2 — the fix direction is the risk, and §3.4 is the guardrail.** This defect currently costs nothing (§3.3
  measures zero exposure) and fails loud. A careless repair costs a silent blind spot. If at any point the choice
  is between shipping a naive regex and reporting the task incomplete, **report it incomplete.**
- **A3 — §3.4's rejection is argued, not measured on this tree.** The naive regex invents **0** extra definitions
  here. The constructed `content`/data-URI cases are the demonstration, and R4(c) turns them into arms. State this
  honestly in the session log; do not claim the tree proved the hazard.
- **A4 — position-independence stays.** 718 documented that resolution does not model selector or media scoping —
  a declaration anywhere in the file resolves a reference anywhere in the file. That simplification is unchanged;
  this task changes **which declarations are seen**, not **where they apply**.
- **A5 — the same-line reference side already works.** `findUndefinedCssVarReferences` walks every `var(` on a
  line, so multiple references per line are already handled. Only the *definition* side is line-limited. Do not
  "fix" the reference side.

### 5.1 Rejected alternatives — do not re-open

- **Delete the `^` anchor.** Rejected by the owner and by §3.4 — it converts a loud false positive into a silent
  false negative.
- **Add a CSS parser dependency.** Rejected in 714, 716, 718 and again here (§3.5).
- **Fold this into 719.** Rejected by the owner, 2026-08-06 — mixing a shared four-category heuristic with a
  single-category function inflates 719's risk and breaks its narrow scope.
- **Do nothing, since exposure is zero.** Rejected: the gate is CI-blocking, and a false positive on a legitimate
  same-line declaration would block a PR with a finding that is simply wrong.
- **Close A7 or A8 here.** Rejected — 719 owns A7; A8 is deliberately unowned.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 1, 2, 9, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this is a detector change:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** · `docs/design-system.md` **§23.6.c** in full, including **A7** and **A8** (neither is yours).

**Task-specific — read, and note which you may not edit:**

- `scripts/check-design-tokens.mjs` — `extractCssCustomPropertyDefinitions` (**`:571-578`**, the only edit site),
  `stripCssComments` (runs first — read it, do not change it), `findUndefinedCssVarReferences` (**do not edit**,
  A5), and `shouldSkipLine` (**do not edit**, 719).
- `scripts/__tests__/check-design-tokens.test.ts` — the **§H** block, specifically the three lock arms named in
  §3.6 (R5) — add yours beside them in the same style.
- `docs/sessions/2026-08-06-task718R-css-undefined-var-coverage-gaps.md` — §5, so R7's §23.6.c wording matches what
  718R published rather than contradicting it.

---

## 7. Scope

- `scripts/check-design-tokens.mjs` — `extractCssCustomPropertyDefinitions` only (R1, R2, R3).
- `scripts/__tests__/check-design-tokens.test.ts` — the R4 arms (a), (b), (c).
- `docs/design-system.md` — §23.6.c, resolution source 2's description (R7).
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-0X-task720-custom-property-definition-line-anchor.md`.

## 8. Out of scope

- `shouldSkipLine` (**719**) · `findUndefinedCssVarReferences` (A5) · every `DETECTION_PATTERNS` entry (714/716) ·
  the A5 fallback rule, external-prefix list and `--z-*` definitions (718/718R, committed `98bec3fa9`).
- §23.6.c **A7** and **A8** — neither is closed here.
- `src/app/globals.css` · every `.module.css` under `src/` · `package.json` · `governance-pr.yml` ·
  `design-tokens-allowlist.json` · `check-stories-rendered.mjs` · **717** · **711**.

---

## 9. Current and required behavior

**Current:** `extractCssCustomPropertyDefinitions` registers at most one declaration per physical line, and only
when it is the first token on that line. A same-line define-and-use therefore produces a phantom
`css-undefined-var` finding, and a second declaration on a line is invisible regardless of case. Nothing in `src/`
currently triggers it.

**Required after:** every declaration in the stripped source is registered, distinguished from declaration-shaped
literals inside values by quote/paren-aware scanning; name case stays significant; the three specified arms lock
the behavior; the three existing lock arms still pass unmodified; the tree still reports 0 findings.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist `check:design-tokens` (exit 0) and the current suite total.
- **I2 — Failing arms first (D32).** All three R4 arms **before** the fix. (a) and (b) must fail; **(c) will
  already pass** against the current anchored regex — say so, and keep it, because its job is to fail against the
  *naive* implementation, which is the regression this task most needs locked.
- **I3 — Implement** the declaration-aware scan (R1/R2/R3). All three arms green.
- **I4 — Prove the tree stayed green** (R6, A2). Non-zero → **stop and report**.
- **I5 — Confirm the three §3.6 lock arms pass unmodified** (R5). Editing one means the implementation is wrong.
- **I6 — R7's §23.6.c edit**, leaving A7 and A8 untouched.
- **I7 — Full suite + gate**, both exit 0, real totals stated.
- **I8 — `npx tsc --noEmit`, then `npm run build`** (R9).
- **I9 — Counting gates last, after deleting every scratch file**, reconciled to `git status`.

---

## 10. Implementation requirements

1. **The failing arms come first** (I2) — D32, and the report must state plainly which of the three failed and
   which (c) did not, and why that is expected.
2. **Never ship the naive regex** (§3.4, A2). Report incomplete instead.
3. **No CSS parser dependency** (§3.5). Stop and report if quote/paren-aware scanning cannot express it.
4. **Case-sensitivity is preserved, not "improved"** (R3). Do not lowercase names anywhere.
5. **The tree stays at 0 findings** (R6). A new finding is a stop, not a remediation.
6. **Capture every transcript unpiped** (Task 710 R10).
7. **No task number in any code identifier** (Task 701 F2).
8. **Counting gates LAST, after scratch cleanup, reconciled to `git status`** — a regression is a `P1`.
9. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.

---

## 11. Positive and negative flows

**Positive flow:** (a) and (b) fail; the declaration-aware scan lands; all three arms pass; the three lock arms
pass unmodified; the tree still reports 0 findings and exits 0; §23.6.c describes the corrected semantics with A7
and A8 intact; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `.x { --local: 1px; width: var(--local); }` | **Yes** | R1/R4(a) | **0** findings — the defect closed | AC1, AC4 |
| `--Foo: 1px; --foo: 2px` on one line | **Yes** | R1/R3/R4(b) | both registered, distinct | AC1, AC3, AC4 |
| `var(--foo)` where only `--Foo` is defined | **Yes** | R3 | **still a finding** — different property | AC3 |
| decl-shaped literal in a `content` string | **Yes** | R2/R4(c) | **not** a definition | AC2, AC4 |
| decl-shaped literal in a data-URI value | **Yes** | R2/R4(c) | **not** a definition | AC2, AC4 |
| decl-shaped string inside a CSS comment | **Yes** | R5 | **not** a definition — existing arm unmodified | AC5 |
| `--x:` inside a `var()` fallback | **Yes** | R2 | not a definition — inside parens | AC2 |
| the 7 `--z-*` tokens still resolve | **Yes** | R5, §3.6 | yes — R1 regression-lock arm unmodified | AC5 |
| tree turns red after the fix | **Yes** | R6/A2 | **stop and report** | AC6 |
| Locale / viewport / RLS / rendered output | **No** | build-time script only; no strings, no rendering, no data access, no `.module.css` diff | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `extractCssCustomPropertyDefinitions`, then `'--Foo: 1px; --foo: 2px'` returns **both**,
  `'.x { --Foo: 1px; }'` returns `['--Foo']`, and `'.x {\n  --Foo: 1px;\n}'` still returns `['--Foo']`. Quote the
  function before and after.
- **AC2 [R2]** Given the implementation, then it tracks quote state and paren depth, the `^` anchor was not simply
  deleted, and no dependency was added. Show the code and both §3.4 fixtures returning **no** definition.
- **AC3 [R3]** Given `'  --Foo: 1px;\n  --foo: 2px;'` and `'--Foo: 1px; --foo: 2px'`, then both return two
  distinct entries; and a `var()` differing only in case from a defined property is **still** a finding. Show both.
- **AC4 [R4]** Given the three arms run before the fix, then (a) and (b) **fail** and (c) passes, with the reason
  (c) passes stated; after the fix all three pass. Show both transcripts.
- **AC5 [R5]** Given the three lock arms of §3.6, then each passes **unmodified** — quote them and confirm zero
  diff. State suite totals before and after.
- **AC6 [R6]** Given the final tree, `npm run check:design-tokens` reports **0** findings and exits **0**. Persist
  the transcript with the exit code inside it.
- **AC7 [R7]** Given §23.6.c, then resolution source 2 describes the corrected semantics and its quote/paren-aware
  basis, and **A7 and A8 are byte-unchanged**. Quote the edited passage and confirm A7/A8 zero diff.
- **AC8 [R8]** Given `git diff`, then `shouldSkipLine`, `findUndefinedCssVarReferences`, every
  `DETECTION_PATTERNS` entry, `globals.css`, `package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`,
  `check-stories-rendered.mjs` and every `.module.css` under `src/` are **empty**. Verify by hash.
- **AC9 [R9]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC10 [R10]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A CI-blocking gate's resolution logic changes. Q4 compels planted proof;
here it takes the form of R4's failing-first arms plus R4(c)'s guard against the rejected implementation. A green
gate is explicitly **not** sufficient — §3.3 measured zero exposure, so the tree cannot demonstrate the fix.

**Rendered evidence is not required, and the reason is structural:** no `.module.css`, no `globals.css`, no `.tsx`
and no token changes (R8, hash-verified). The only artifact touched is a build-time Node script and its suite.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0 — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | current total passes — persisted |
| 4 | **R4 arms (a)(b)(c), pre-fix** (I2) | **(a) and (b) FAIL, (c) passes** — persisted; the D32 proof |
| 5 | Implement (I3) + re-run | all three pass |
| 6 | `npm run check:design-tokens` (I4) | **0** findings, exit 0 — or **stop and report** |
| 7 | §3.6 lock arms (I5) | pass **unmodified** |
| 8 | R7's §23.6.c edit (I6) | A7/A8 zero diff |
| 9 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I7) | all pass, real total stated |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `check:file-integrity` · `check:mojibake` — **last, after cleanup** | pass; reconcile to `git status` |

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence under `.screenshots/task720-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task720-custom-property-definition-line-anchor.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R10, each with its AC verdict.
3. **The function**, quoted before and after, with the quote/paren-aware mechanism explained in two or three lines.
4. **The three R4 arms**, quoted, with the pre-fix transcript and the statement of why (c) already passed.
5. **The three §3.6 lock arms** confirmed unmodified and passing.
6. **The §23.6.c edit**, quoted, with A7/A8 confirmed byte-unchanged.
7. **A3's honesty note** — that §3.4's hazard is argued from constructed cases, not measured on this tree.
8. **Commands run and actual results** — real exit codes, including the step-11 build transcript.
9. **Evidence locations** — every artifact, named.
10. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
11. **Standing findings not acted on** — §23.6.c **A7** (719, if still open) and **A8** (unowned), 717, 711, 700,
    702/691 (Sprint 46).
12. **Assumptions, deviations, limitations, unresolved issues.**
13. Concise current state in `docs/backlog.md` — **state only**, and re-flag `BACKLOG LIMIT BREACH` if you cannot
    hold the line count.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ the function and its regex quoted with line numbers, all four measured input/output pairs, the end-to-end false positive, the rejected fix with its two demonstrative fixtures, the three lock arms named, and every command |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R10 → AC1–AC10 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC8; §3.6 lists four behaviors that must survive, each with its existing lock arm; §5.1's five rejected alternatives |
| **The owner decision is quoted, not inferred** | ✅ 2026-08-06: separate task after 719, the three required arms, and *"Не варто просто прибирати `^` з regex … потрібен declaration-aware розбір"* |
| **No number is asserted that was not measured with the real tool** | ✅ `:571-578`/`:574` · all four `extract…` returns · the 3-row end-to-end table · **0** same-line declarations tree-wide · the naive regex's **0** extra on this tree · both constructed hazard fixtures — all run at `98bec3fa9` on 2026-08-06 |
| **A claim that was NOT measured is marked as such** | ✅ A3 states outright that §3.4's hazard is argued from constructed cases, not observed in the tree, and R4(c) converts it into a permanent arm |
| The gate proves the changed behavior, not merely procedure | ✅ I2 requires (a) and (b) to fail first; §13 declares a green gate insufficient because §3.3 measured zero exposure; R4(c) locks the rejected implementation out permanently |
| No new blind spot is created silently | ✅ the entire hazard analysis is §3.4; A4 restates the unchanged scoping simplification; R7 forbids touching A7/A8 so neither is silently absorbed |
| Zero/empty input covered | ✅ §3.3's zero exposure is why R6 makes any new finding a stop; AC1 keeps the single-declaration control returning `['--Foo']` |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's mixed pass/fail expectation + I4's stop condition + I5's unmodified-arm check + I9's cleanup-then-count |
| Ordering/dependency stated | ✅ A1 sequences this after 719 on file contention and names the stop condition, and is explicit that it is **not** a behavioral dependency |
| Owner exceptions have traceable authorization | ✅ the owner's 2026-08-06 decision; D6 for the evidence dir; D32 cited |
| Exactly one active executable route | ✅ §3.5 fixes the mechanism class, §5.1 closes five alternatives, A2/A3 convert the remaining forks into stop conditions |
| Prior-review corrections folded in | ✅ 718R's lesson that a comparator must fail on **behavior** (I2) · 718 **F2** (no module-load failures as proof) · the owner's correction of the reviewer's own case-vs-line-anchor misattribution, recorded in §3.2 · 710 **R10** (unpiped) · **701 F2** (no task numbers in code) |
| Sprint assigned before creation | ✅ Sprint 52, already open; row added to its Tasks table |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** The separation from 719, the three required arms, and the rejection of the
naive regex were all decided on 2026-08-06.
