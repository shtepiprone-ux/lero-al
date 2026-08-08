# Task 722 — Give `fullWidthControlsAtMobile` a `checkedAny` guard, and re-anchor the two arms Mantine never renders

**Sprint 52 — Gates that stopped checking, position 52.1.** Folds Task **732**.
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_52_Task_722_execution_contract.md` · `Sprint_52_Task_722_rule_compliance_ledger.md`.

> **Read this first.** This task's whole subject is a gate that reports `true` without looking. The single way to
> fail it is to produce another one. Every claim below was read from the repository on 2026-08-08; where a value
> must be discovered rather than asserted, this kickoff says so explicitly and **does not supply the answer**.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate correctness (non-product code), plus one governance
amendment. No `src/` product file changes. No Storybook story ships from this task.

Sonnet executes this via the `execute-task` workflow and reports
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`cell.assertions.fullWidthControlsAtMobile` currently resolves `true` in cells where it inspected nothing. Make it
resolve `true` only when it actually measured a control, `null` when it measured none, and `false` when a measured
control is not full-width — and prove each of those three outcomes with an executed transcript, not an argument.

---

## 3. Verified context — read from the repository 2026-08-08

### 3.1 The assertion, verbatim

`scripts/check-stories-rendered.mjs:1112-1145`:

- `:1113` — `let fullWidthOk = true;`
- `:1114` — the whole body runs only when `viewport.width < 640`
- `:1122` — arm 1 iterates `document.querySelectorAll('[data-slot="select-trigger"]')`
- `:1127` — arm 2 iterates `document.querySelectorAll('[data-slot="tabs-list"]')`
- `:1131` — arm 3 iterates `input[type="text"], input[type="email"], input[type="password"], input[type="search"], input:not([type])`
- `:1142` — `return true;` is reached whenever no arm returned `false`, **including when no arm matched anything**
- `:1145` — `cell.assertions.fullWidthControlsAtMobile = viewport.width < 640 ? fullWidthOk : null;`

There is **no** `checkedAny` in this block. A cell that renders no control at all therefore contributes a
confident `true`.

### 3.2 Two of the three arms are a convention this scope never renders

`[data-slot="select-trigger"]` and `[data-slot="tabs-list"]` are shadcn attributes. This is the **same root cause**
Task 711 closed for the two sibling assertions, recorded in this file's own comment at `:1148-1150`:

> `[data-slot="button"]` was a shadcn-only convention this Mantine-scope gate never renders … dead in 0/852
> applicable cells since Task 652. Re-anchored on `.mantine-Button-root` …

Arm 3 (bare `input` elements) is **not** shadcn-specific and is expected to be live in Mantine scope — Mantine's
`TextInput` renders a real `<input>`. Do not assume this; §7.1 requires you to measure it.

### 3.3 The correct pattern already exists in this file — copy it, do not invent one

Assertion (d), `fullWidthButtonsAtMobile`, after 711's D33 re-anchor (`scripts/check-stories-rendered.mjs`, the
lines immediately following this block):

```js
      }, FULL_WIDTH_TOLERANCE);
      failingButtons = result.failures;
      checkedAnyButton = result.checkedAny;
      fullWidthButtonsOk = failingButtons.length === 0;
    }
    cell.assertions.fullWidthButtonsAtMobile = viewport.width < 640 ? (checkedAnyButton ? fullWidthButtonsOk : null) : null;
```

The in-page function returns `{ failures, checkedAny }`; the assignment yields `null` when nothing was checked.
**That is the required shape.** Assertion (b) must end up structurally parallel to assertion (d).

### 3.4 Consumers of the assertion

| Site | What it does |
|---|---|
| `scripts/check-stories-rendered.mjs:674` | `if (cell.assertions.fullWidthControlsAtMobile === false) return false;` — hard fail, never retried into a pass |
| `scripts/check-stories-rendered.mjs:679` | Comment naming this assertion as the model for a sibling's non-retry behavior |
| `scripts/check-stories-rendered.mjs:1897` | Console line `✗ form control not full-width at <640` |
| `docs/storybook-governance.md:1225` | Names it alongside `fullWidthButtonsAtMobile` in `isTransientFailure()`'s exclusion set |

Every consumer tests `=== false`. `null` and `true` are both non-failing, which is exactly why a vacuous `true`
was invisible — and why turning vacuous `true` into `null` cannot by itself turn CI red.

### 3.5 The meta-gate cannot see this defect, by construction

`scripts/check-assertion-liveness.mjs` (header comment, `:18-23`) classifies a key **LIVE** when it "resolved to
`true` or `false` … in at least one cell". A vacuously-`true` assertion is `true` everywhere, so it is maximally
LIVE. The meta-gate detects *dead* assertions; it has no concept of a *vacuous* one. This is not a bug in 710's
work — it is the boundary of it, and §7.4 requires you to record that boundary rather than quietly widen it.

### 3.6 Current matrix baseline — the comparator for this task

From Task 726's final run (`.screenshots/task726-evidence/K9-final-matrix.log`, 2026-08-08):

```
Results: 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

FAIL is exactly `{ HeroSearch × 12, NotificationBellView/mobile-390 × 4 }`. `MANTINE_VIEWPORTS` is 4 widths
(`:392`). **The denominator does not change in this task** — enrolment is Task 678 (Sprint 52.4) and is explicitly
out of scope here.

### 3.7 Folded from Task 732 — Task 726's residue

Task 726 deleted the author-appliable `[role="group"]` skip from assertion (d). `isChipSetMember` is now the sole
mechanism keeping legitimate chip rows out of `fullWidthButtonsAtMobile`. Verified 2026-08-08: every current chip
row clears it (rooms 5 options; layout/heating/wall 10 each; the three `flex-col` groups stretch full-width
regardless), which is why 726 moved zero cells. It does **not** hold for a 2-button Mantine group, nor for a
`nowrap` horizontally-scrolling chip row — the exact shape of `FavoritesTypeFilter.tsx:31`, safe today only
because that component is still shadcn and the gate reads `.mantine-Button-root`.

### 3.8 Critical flow in scope

`docs/critical-flow-registry.md:50` — "Listings filter controls — leaf sub-components + shell (Mantine)". Its
`FiltersPanel` listing-id `TextInput` is a live candidate for arm 3. Q4 applies; automated regression evidence is
required (§13).

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Sprint 52 §10 | A pre-change census records, per arm, how many live matches exist across the `--mantine-only` matrix | P0 | Persisted census artifact | Confirmed |
| R2 | 722 finding | The in-page function returns `checkedAny` and the assignment yields `null` when nothing was checked, structurally parallel to assertion (d) | P0 | Diff + code read | Confirmed |
| R3 | 722 finding, D33 | Arms proven dead by R1 are re-anchored onto hooks **discovered by live census**, never onto a selector this kickoff supplied | P0 | Census dump + diff | Confirmed |
| R4 | Two-armed plant | A cell with no control flips `true` → `null`; a planted narrow control resolves `false`; removing the plant restores the prior value | P0 | Three transcripts | Confirmed |
| R5 | 726 R5 rule | Any probe is reverted byte-identical, evidenced by `git hash-object` and absence from `git status --porcelain` | P0 | Hash + status | Confirmed |
| R6 | Meta-gate | `npm run check:assertion-liveness` is run after the change and its classification of this key is recorded and adjudicated | P0 | Transcript | Confirmed |
| R7 | 724 lesson | Any newly-`false` cell is escalated as a finding; no tolerance, exclusion, or allowlist is added to make it green | P0 | Session log | Confirmed |
| R8 | Baseline | Final `--mantine-only` result is reported against §3.6's bound, with every moved cell named and attributed | P0 | Final matrix log | Confirmed |
| R9 | Folded 732 | `storybook-governance.md` §14.9.28 records `isChipSetMember`'s structural bound, **or** the predicate is widened — and the task states which and why | P1 | Doc diff | Confirmed |
| R10 | Governance | `check-stories-rendered.mjs`'s untouched logic is witnessed unchanged: `isChipSetMember` and its 3 thresholds, `FULL_WIDTH_TOLERANCE`, `MANTINE_VIEWPORTS` | P1 | Whole-file + hunk comparison | Confirmed |
| R11 | Q4 | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R12 | Q4 | `docs/critical-flow-registry.md:50`'s named smoke suites stay green | P0 | Vitest transcript | Confirmed |
| R13 | Standing | Counting gates run **last**, after the session log and backlog row exist | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** The worktree may start dirty. Snapshot `git status --porcelain` **before** the first write and classify
  every entry; do not assume a clean tree. Pre-existing modified paths need before/after content witnesses, not an
  equal porcelain status.
- **A2.** Arm 3 is expected live, arms 1–2 expected dead. **This is an expectation, not a fact.** R1's census
  decides. If arm 3 also proves dead, stop and report `BLOCKED — ASSERTION HAS NO LIVE ANCHOR`, because a guard
  added to an assertion with zero live anchors converts a vacuous `true` into a uniform `null`, which
  `check-assertion-liveness.mjs` will classify **DEAD-NEW** and exit 1. That is an owner decision, not a fix.
- **A3.** No owner decision is outstanding for this task. Sprint 52's parked item (727) is unrelated.
- **OQ1 — for the reviewer, not a blocker.** `docs/critical-flow-registry.md:50` is a plausible referent for Task
  721's unresolvable "row 50" finding, since that file has no numbered table rows but does have a line 50 covering
  the filter controls. Record it as an observation; **do not act on it here** — 721 owns it.

---

## 6. Pre-read rule bundle

Exactly these, no more:

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q4` row
- `docs/storybook-governance.md` — §14.9.9 (the PORTAL_SELECTOR precedent), §14.9.28 (`isChipSetMember`), §14.9.29
- `docs/critical-flow-registry.md:50`
- `scripts/check-stories-rendered.mjs` — `:660-700`, `:1100-1260`, `:380-400`
- `scripts/check-assertion-liveness.mjs` — the header comment and `parseManifest`
- `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md` — §10
- `docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` — the D33 re-anchor method
- `docs/sessions/2026-08-08-task726-role-group-exclusion-and-chiprow-aria.md` — the probe/restore method

Binding decisions: **D33** (re-anchor onto a de-Tailwind-stable hook, never another utility class) and **D32**
(a migration may not be proven against a comparator not shown to fail).

---

## 7. Scope

### 7.1 R1 — census before any edit

Run the existing `--mantine-only` sweep and, from the same run, capture per-arm live counts across all 1184 cells:
how many cells contain ≥1 `[data-slot="select-trigger"]`, ≥1 `[data-slot="tabs-list"]`, ≥1 of arm 3's inputs.
Persist the counts. This is the D32 comparator: an arm you cannot show to be dead may not be re-anchored.

### 7.2 R3 — discover the replacement hooks, do not accept one from this kickoff

**This kickoff deliberately does not name the Mantine selectors.** Task 724's P0 exists because an orchestrator
re-expressed an exclusion as a DOM property and the next task satisfied the gate by producing that property. Follow
711's method instead: open the Mantine-scope stories that actually render a select and a tab list at 375px, dump
the rendered DOM, and read the stable class or role off the live output. Record the dump. If a primitive has no
stable hook, say so and leave that arm unanchored with the reason — an unanchored arm plus a working `checkedAny`
is honest; a guessed selector is not.

### 7.3 R4 — the two-armed plant, three transcripts

1. **No-control cell.** Name a `--mantine-only` story that renders none of the candidates at <640 (§3.5's
   `Alert/Default` is the recorded example; confirm it still qualifies). Before: `true`. After: `null`.
2. **Failing cell.** In an inspected **existing** story, apply a reversible probe that narrows a real control below
   its parent's content width. After: `false`, and the console line at `:1897` fires.
3. **Restore.** Remove the probe; the cell returns to its pre-probe value.

### 7.4 R6 — adjudicate the meta-gate

Run `npm run check:assertion-liveness` after the change. Record this key's classification. If it moves, say what
it moved to and why. Do not edit the liveness registry to make a classification go away.

### 7.5 R9 — the folded 732 half

Either amend `docs/storybook-governance.md` §14.9.28 with `isChipSetMember`'s structural bound (2-button groups and
`nowrap` scrolling rows are outside it), **or** widen the predicate to cover them. Pick one, state the reason, and
if you widen it, prove the widening with its own plant. Both are acceptable; silence is not.

---

## 8. Out of scope — zero diff expected

- Any `src/` file. This task ships no product change.
- `MANTINE_VIEWPORTS`, the story manifest, and any enrolment — **Task 678**, Sprint 52.4.
- `FULL_WIDTH_TOLERANCE` and assertion (d)'s own logic beyond §7.5's explicit choice.
- The 16 pre-existing FAIL cells (`HeroSearch` × 12, `NotificationBellView` × 4) — Sprint 49 and their own owners.
- `check-assertion-liveness.mjs` itself. Observing its boundary is in scope; changing it is not.
- Wiring anything into CI — that is 727, parked on owner decisions OQ2 and OQ3.

---

## 9. Current and required behavior

**Current.** `fullWidthControlsAtMobile` is `true` in all 852 applicable cells and has never been `false`. Two of
its three candidate arms cannot match anything this scope renders. A cell that inspected nothing is indistinguishable
from a cell that inspected everything and passed.

**Required.** The assertion is `null` where nothing was measured, `true` where something was measured and passed,
`false` where something was measured and failed — with all three states observed in a transcript. The count of
cells where it resolves non-`null` is stated as a number, before and after.

---

## 10. Implementation requirements

1. The in-page evaluate returns an object carrying `checkedAny`, mirroring assertion (d) exactly.
2. The assignment at `:1145` becomes the `checkedAny ? ok : null` form.
3. Re-anchored arms carry a comment in the file naming the census that justified them and the date — the shape
   `:1148-1150` already uses. A re-anchor with no recorded census is not acceptable.
4. Failing control labels are surfaced the way assertion (d) surfaces `failingButtonLabels`, so a `false` cell is
   diagnosable from the log without a re-run.
5. No new exclusion, allowlist, tolerance, or skip. Any exemption must be a condition the gate evaluates itself —
   never one a component author can apply (724 F1, closed by 726).

---

## 11. Positive and negative flows

**Positive.** A <640 cell rendering a full-width Mantine text input resolves `true`; the same cell with the input
narrowed resolves `false`; a cell rendering no control resolves `null`; the matrix total moves only by cells this
task can name.

| Negative flow | Applicable | Why |
|---|---|---|
| Zero-match cell returns a confident value | **Yes** | This is the defect |
| Re-anchored selector matches nothing | **Yes** | Would silently re-create the defect under a new name |
| Assertion goes uniformly `null` → meta-gate DEAD-NEW, exit 1 | **Yes** | A2 makes this a `BLOCKED` stop, not a fix |
| Probe left in the tree | **Yes** | R5 evidence is mandatory |
| New `false` cells suppressed to keep the matrix green | **Yes** | The 724 failure mode this sprint exists to end |
| Enrolment changes the denominator mid-task | **Yes** | Would destroy attribution; 678 owns it |
| Locale/i18n regression | No | No `messages/*` or `src/` change; `check:i18n` still run as a guard |
| Visual/layout regression | No | No product code changes; the matrix itself is the witness |
| RLS / auth / data-loss path | No | Non-product script only |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the pre-change sweep, when the census is read, then per-arm live counts across 1184 cells are
  persisted, and each arm is classified live or dead against them.
- **AC2 [R2]** Given the edited file, when `:1145`'s assignment is read, then it is the `checkedAny ? ok : null`
  form and the evaluate returns `checkedAny`.
- **AC3 [R3]** Given each re-anchored arm, when its comment is read, then it names the census dump and date, and no
  selector traceable only to this kickoff appears in the diff.
- **AC4 [R4]** Given the no-control cell, when compared before and after, then it moves `true` → `null`.
- **AC5 [R4]** Given the probe cell, when the sweep runs with the probe, then that cell is `false` and `:1897`'s
  line appears naming the control.
- **AC6 [R4, R5]** Given the probe removal, when the sweep re-runs, then the cell returns to its pre-probe value,
  `git hash-object <probed-file>` equals its pre-probe value, and the path is absent from `git status --porcelain`.
- **AC7 [R6]** Given `check:assertion-liveness`, when it runs post-change, then this key's classification and exit
  code are recorded, and any movement is explained.
- **AC8 [R7, R8]** Given the final `--mantine-only` run, when compared to `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS`,
  then every differing cell is named and attributed, and no cell was made green by a new exemption.
- **AC9 [R9]** Given §14.9.28, when read after the task, then it states `isChipSetMember`'s bound, or the predicate
  was widened with its own plant transcript — and the session log says which was chosen and why.
- **AC10 [R10]** Given whole-file comparison, when the untouched regions are checked, then `isChipSetMember`, its
  three thresholds, `FULL_WIDTH_TOLERANCE` and `MANTINE_VIEWPORTS` read unchanged.
- **AC11 [R11, R12]** Given the final gates, then `tsc` exit 0, `npm run build` exit 0, `check:i18n` exit 0, and
  the four filter-control smoke suites named at `critical-flow-registry.md:50` pass.
- **AC12 [R13]** Given two counting-gate passes, when the second runs, then it is after the session log and backlog
  row exist and reconciles exactly to `git status --porcelain`.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** Three independently sufficient reasons: the logic of a hard-blocking CI
gate changes; `docs/critical-flow-registry.md:50` is in scope; and the planted-violation clause is Q4-owned.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` (pre-write snapshot) | Manifest for A1 |
| 2 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` | Baseline + R1 census |
| 3 | Apply probe · rebuild · re-run | Probe cell `false`, `:1897` line present |
| 4 | Remove probe · `git hash-object` · `git status --porcelain` | AC6 |
| 5 | `npm run build-storybook` · `npm run screenshots:assert -- --mantine-only` (final, probe-free) | AC8 vs §3.6 |
| 6 | `npm run check:assertion-liveness` | AC7 |
| 7 | `npx tsc --noEmit` | exit 0 |
| 8 | `npx vitest run` the 4 suites named at `critical-flow-registry.md:50` | all pass |
| 9 | `npm run check:i18n` | exit 0 |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `npm run check:file-integrity` + `check:mojibake` (twice, second after the log/backlog exist) | AC12 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · every requirement R1–R13 with its evidence artifact · every command with its
**actual** result and exit code · evidence root path · assumptions, deviations and limitations · unresolved issues.
State the before/after count of cells where the assertion resolves non-`null` as a number. If any cell newly
resolves `false`, name it and escalate — do not resolve it here.

Then update `docs/backlog.md` (concise current state, `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`) and write
`docs/sessions/<date>-task722-fullwidth-controls-vacuous-assertion.md` with the full evidence trail.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · scope names what must not change and asserts zero `src/` diff · negative flows
were selected by applicability, not copied · **no selector, count or line reference in this kickoff was asserted
without being read from the repository on 2026-08-08** · the one value that must not come from the orchestrator
(§7.2's replacement hooks) is explicitly withheld and assigned to a census · the probe restoration requires evidence,
not an assertion · the dirty-worktree manifest is required rather than assumed · both the zero-match and non-empty
cases of the new guard are covered by distinct ACs · Task 732's folded scope has its own AC and is not implied.
