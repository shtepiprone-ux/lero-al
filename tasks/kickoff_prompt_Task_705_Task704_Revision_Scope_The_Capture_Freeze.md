# Task 705 — Task 704 revision: scope the capture freeze to reduced-motion emulation

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** revision of a `NEEDS REVISION` task — rendered-harness determinism mechanism.
- **Secondary type:** none. No component, no token, no product behaviour changes.
- **Origin:** **Task 704 review, 2026-08-01, finding F1 (`P1`)**. Owner-reported symptom: *"але в сторі я не бачу
  мікроанімацію візуально"*. Task 704's code is **not reverted**; it is amended in place, per the Task 675 /
  Task 693 revision precedent.

> **Read this first.** Task 704 restored the Skeleton pulse and then, on the same branch, disabled every animation
> in the Storybook preview **unconditionally**. The delivered feature is therefore invisible on the one surface
> the team reviews components on. The fix is not to weaken the determinism guarantee — it is to key it to a
> trigger the harness sets and a human browser does not.

---

## 2. Objective

1. Replace Task 704's unconditional preview freeze with one scoped to `prefers-reduced-motion: reduce`.
2. Make `scripts/check-stories-rendered.mjs` emulate that condition before capture.
3. Re-prove determinism **under emulation**, and prove the pulse is visible in Storybook **without** it.

---

## 3. Verified context

Read in this worktree on 2026-08-01.

### 3.1 The defect, exactly as shipped

`.storybook/preview-head.html`, added by Task 704:

```css
<style>
  /* Frozen Storybook preview motion (Task 704, R4/R5 …) */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
</style>
```

`grep -n "media\|data-\|reduce" .storybook/preview-head.html` returns **nothing** — there is no media query, no
attribute selector, no flag. The rule applies to every visitor of the Storybook preview iframe, permanently.

Task 704 satisfied the letter of its own R4 ("disable animations inside the Storybook preview iframe") — that
wording was an orchestrator defect. Its A3 stated the intent: *"the freeze is capture-only"*, meaning for the
duration of a Playwright run, not forever.

### 3.2 What this invalidates

Task 704's determinism evidence — `Skeleton/Default` and `HomepageListingGrids/Loading` going from **11/1184** and
**6/1184** md5-changed cells (its own I1 zero-code-diff baseline) to **0** — is numerically correct but proves the
wrong proposition: that a permanently frozen Storybook is deterministic. It must be re-measured under the scoped
mechanism.

### 3.3 The mechanism is already half-built

Task 704 added to `src/design-system/mantine/skeleton-chrome.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .mantine-Skeleton-root::after { animation: none; }
}
```

with a verified rationale: Mantine never emits the `data-reduce-motion` attribute its own global
`[data-respect-reduced-motion] [data-reduce-motion]` rule requires (checked against `Skeleton.mjs`, which sets
only `data-visible`/`data-animate`), so `prefers-reduced-motion` was **not** honoured before Task 704. That rule
stays and is the accessibility fix; this task generalises the same trigger to the whole preview.

### 3.4 The harness side

`scripts/check-stories-rendered.mjs` contains **no** animation handling — grep for `animation`, `transition`,
`reduced-motion`, `emulateMedia` returns nothing. Playwright exposes
`page.emulateMedia({ reducedMotion: 'reduce' })`, which sets the standard media feature for the page. This is the
one-line harness change; it must be applied to every page used for capture, before navigation.

### 3.5 Start state — DIRTY, by design

Task 704 is `NEEDS REVISION` and **uncommitted**. Expect exactly:

```
 M .storybook/preview-head.html
 M docs/backlog.md
 M src/design-system/mantine/skeleton-chrome.css
?? docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md
```

Any other entry is a **stop and report**. Complete `docs/orchestrator-dirty-worktree-manifest-template.md` for
every entry, with an md5 content witness at I0 and at the end for each path this task does **not** intend to
change.

### 3.6 What must not regress

Task 704's ratified outcomes stand and are **not** re-litigated here:

| Outcome | Status |
|---|---|
| D27 fill = `var(--mantine-color-gray-3)` (`#d0d5dd`), ~28.2/255 swing | ratified, keep |
| Stock `0.4 ↔ 1` opacity range (Lever 2 not invoked) | keep |
| `@media (prefers-reduced-motion: reduce)` skeleton rule (R6) | keep |
| Border contrast ~20/255 against the unchanged gray-2 border | keep |

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | The `preview-head.html` freeze is wrapped in `@media (prefers-reduced-motion: reduce)`. No unconditional animation/transition kill remains in that file. | P0 | AC1 | Confirmed |
| R2 | §3.4 | `scripts/check-stories-rendered.mjs` calls `page.emulateMedia({ reducedMotion: 'reduce' })` on every capture page, before navigation. | P0 | AC1 | Confirmed |
| R3 | §3.2 | Determinism re-proved **under emulation**: a same-tree, zero-code-diff double capture shows **0** md5-changed cells for `Skeleton/Default` and `HomepageListingGrids/Loading`, against §3.2's 11 and 6. | P0 | AC2 | Confirmed |
| R4 | §3.1 | Proved that Storybook **without** emulation animates: open the preview with default media settings and confirm the Skeleton `::after` animation is running — via `document.getAnimations()` on the story frame, or an equivalent recorded observation. A screenshot cannot prove this. | P0 | AC3 | Confirmed |
| R5 | §3.6 | `skeleton-chrome.css` is **unchanged** by this task (md5 witness at I0 and at the end). D27 is not revisited. | P0 | AC4 | Confirmed |
| R6 | cl. 12 | Rendered proof vs Task 704's post-change baseline: **0 FAIL, 0 verdict changes**. Because both runs are now emulated-reduced-motion, the two animating stories should be byte-identical; any change is attributed under §14.11 (D26) or the documented noise set. | P0 | AC2 | Confirmed |
| R7 | cl. 9, 14 | `check:homepage-grid` exit 0; `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` 28/0/0; `vitest` no new failure beyond the documented set (see A3); integrity/mojibake clean after the records; `npm run build` exit 0 with the full 54-row route table. | P0 | AC5 | Confirmed |
| R8 | cl. 10 | Session log + `docs/backlog.md` at **80 lines**. Task 704's session log gains a revision note pointing here. | P1 | AC6 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — one trigger, not two.** Do not invent a bespoke URL parameter, global variable or `data-` attribute.
  `prefers-reduced-motion` is a standard media feature, Playwright emulates it natively, and Task 704 already
  keyed the skeleton's accessibility rule to it. A second mechanism would need its own gate.
- **A2 — the freeze must stay broad within its media query.** Keep the `*, *::before, *::after` reach; only the
  condition changes. Narrowing it to the Skeleton would leave every other animating story non-deterministic.
- **A3 — `RangeDatePicker.smoke.test.tsx` is pre-existing.** Task 704 reproduced it failing in isolation on its
  own pre-change baseline. Record it; do not attempt to fix it here. If it now passes, say so.
- **A4 — do not revisit D27** (§3.6). The colour question is closed.
- **A5 — product code is untouched.** `preview-head.html` is Storybook-only (`src/app/layout.tsx` has no reference
  to it, verified by Task 704 at its I8). No `src/` file changes in this task except none at all.

**Open questions — none.**

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 11, 12, 14.
2. `docs/qa-profiles.md` — the **Q3** row.
3. `docs/storybook-governance.md` §14.10 (the D25 freeze precedent) and §14.11 (D26).
4. `docs/orchestrator-dirty-worktree-manifest-template.md` — required by §3.5.
5. `docs/backlog.md` — **80 lines**.

**Source pre-read**

6. `.storybook/preview-head.html` — in full.
7. `src/design-system/mantine/skeleton-chrome.css` — in full; read-only here.
8. `scripts/check-stories-rendered.mjs` — the page-creation and navigation path.
9. `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` — its I1 baseline figures and I8 method.

## 7. Scope

| Path | Action |
|---|---|
| `.storybook/preview-head.html` | modify — wrap the freeze in the media query |
| `scripts/check-stories-rendered.mjs` | modify — `emulateMedia` before navigation |
| `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` | modify — revision note pointing here |
| `docs/backlog.md` | modify — **80 lines** |
| `docs/sessions/2026-08-01-task705-task704-revision-capture-freeze-scope.md` | create |

Nothing else. `src/` is **read-only**, including `skeleton-chrome.css` (R5).

## 8. Out of scope

- **D27, the fill colour, the opacity range** (§3.6, A4).
- **The `prefers-reduced-motion` skeleton rule** added by Task 704 — it stays as-is.
- **`RangeDatePicker.smoke.test.tsx`** (A3).
- **`check-homepage-grid.mjs`** — it does its own page setup; if it also needs emulation, that is a **finding to
  report**, not to fix here, unless R3/R6 cannot pass without it.
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** The Storybook preview kills every animation and transition for every visitor, permanently. The
Skeleton pulse Task 704 restored is invisible in Storybook, which is where it is reviewed. The determinism
evidence proves a permanently-frozen preview is stable — not that captures are.

**Required after.** The freeze applies only under `prefers-reduced-motion: reduce`. The capture harness emulates
that condition, so captures stay byte-stable; a human opening Storybook sees the pulse; a user with the OS
setting enabled sees no motion, in Storybook and in the product alike.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain` verbatim; expect §3.5's four entries exactly. Record md5 for
each, and specifically for `src/design-system/mantine/skeleton-chrome.css` (R5's witness).

**I1 — baseline under the current (broken) mechanism.** `build-storybook`, then `screenshots:assert --
--mantine-only` **twice on the identical tree**; record the md5-changed counts for the two stories. Expect 0/0 —
this is Task 704's own result and is the number R3 must reproduce *after* the mechanism changes.

**I2 — prove the defect.** With the current build, open the preview without emulation and record
`document.getAnimations()` (or equivalent) on the Skeleton story: expect **no running animation**. This is the
owner-reported symptom, captured as evidence rather than asserted.

**I3 — scope the freeze (R1).** Wrap the existing rule in `@media (prefers-reduced-motion: reduce)`. Keep the
`*, *::before, *::after` reach (A2). Update the comment: state that the harness emulates this condition, cite
Task 705 and the Task 704 review's F1.

**I4 — emulate in the harness (R2).** Add `await page.emulateMedia({ reducedMotion: 'reduce' })` on every page
used for capture, before `goto`. Comment it with the same provenance.

**I5 — prove the fix, arm A (R4).** Rebuild Storybook. Without emulation, record `document.getAnimations()` on the
Skeleton story: the pulse **is** running. Quote the output.

**I6 — prove the fix, arm B (R3).** With the harness (which now emulates), run `screenshots:assert --
--mantine-only` **twice on the identical tree**. Required: **0** md5-changed cells for both stories. Quote both
runs.

**I7 — rendered proof (R6).** Compare against I1's post-change baseline: 0 FAIL, 0 verdict changes; partition any
changed cell under D26 or the noise set, recording "0 changed cells" rows.

**I8 — R5 witness.** Confirm `skeleton-chrome.css` md5 matches I0. Confirm `git status` shows no new `src/` entry.

**I9 — gates (R7).** `check:homepage-grid`, `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens`, `vitest`.

**I10 — `npm run build` last**, exit 0, full 54-row route table verbatim.

**I11 — records, then encoding gates.** This session log; a revision note appended to Task 704's session log
pointing here; `docs/backlog.md` (**80 lines**). Then `check:file-integrity` and `check:mojibake` with counts.

**Order:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10 → I11.

## 11. Positive and negative flows

### Positive flow

A designer opens `Mantine/Primitives/Skeleton/Default` in Storybook and sees the placeholder breathe. CI runs the
rendered gate, which emulates reduced motion, and gets byte-identical captures across runs. A user who has enabled
reduced motion sees no pulse anywhere.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **Freeze still unconditional** | **Yes** | R1 | no rule outside the media query | AC1 |
| **Harness forgets emulation on one page** | **Yes** | R2 | every capture page emulates; R3's double run would flake otherwise | AC1, AC2 |
| **Determinism lost after scoping** | **Yes** | R3 | 0/0 under emulation, or stop and report | AC2 |
| **Pulse still invisible in Storybook** | **Yes** | R4 | `getAnimations()` shows it running without emulation | AC3 |
| **D27 re-opened** | **Yes** | R5, A4 | `skeleton-chrome.css` md5 unchanged | AC4 |
| **A bespoke flag invented** | **Yes** | A1 | standard media feature only | AC1 |
| **Freeze narrowed to Skeleton only** | **Yes** | A2 | other animating stories would go non-deterministic | AC1, AC2 |
| **`check:homepage-grid` needs emulation too** | **Yes** | §8 | report as a finding; fix here only if R3/R6 cannot pass | AC5 |
| Localization / RLS / data path | No | No string, no data path | N/A | — |
| Critical-flow regression | No | No registry row covers preview motion | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — the freeze exists **only** inside `@media (prefers-reduced-motion: reduce)`, keeps its
  `*, *::before, *::after` reach, and every capture page calls `emulateMedia({ reducedMotion: 'reduce' })` before
  navigation.
- **AC2 [R3, R6]** — a same-tree double capture under emulation shows **0** md5-changed cells for
  `Skeleton/Default` and `HomepageListingGrids/Loading`; the comparison against I1 shows 0 FAIL and 0 verdict
  changes.
- **AC3 [R4]** — `document.getAnimations()` on the Skeleton story shows **no** running animation before the fix
  (I2) and a **running** one after it, without emulation (I5), both quoted.
- **AC4 [R5]** — `skeleton-chrome.css` md5 matches I0; no `src/` entry in the final `git status`.
- **AC5 [R7]** — all gates green as listed; `npm run build` exit 0 with the full 54-row route table.
- **AC6 [R8]** — this session log exists, Task 704's log carries a revision note pointing here, and
  `docs/backlog.md` is at exactly 80 lines.

## 13. QA profile and verification plan

**`Q3 — Full Visual Matrix`.** The change alters what the rendered comparator captures, so the matrix must be
re-run. The decisive artifacts are the two `getAnimations()` readings (AC3) — a falsifiable before/after on the
exact symptom the owner reported — and the 0/0 double capture under emulation.

**Not Q4** — no gate is authored; the harness change is a capture-condition change, not a new assertion.

| Command | Expected |
|---|---|
| `screenshots:assert -- --mantine-only` ×2, same tree, emulated | **0** changed cells on both stories |
| `document.getAnimations()` on Skeleton, no emulation | none before (I2) · running after (I5) |
| `npm run check:homepage-grid` | exit 0 |
| `typecheck` / `check:stories` / `check:story-coverage` / `check:i18n` / `check:design-tokens` | 0 · 0/127 · 15/15 · 2215×4 · 28/0/0 |
| `vitest` | no new failure beyond the documented set (A3) |
| `check:file-integrity` / `check:mojibake` | 0 / 0 after I11 |
| `npm run build` | **0 — hard gate**, full 54-row route table, last |

## 14. Completion report contract

Session log at `docs/sessions/2026-08-01-task705-task704-revision-capture-freeze-scope.md`:

1. `Files Changed` matching the real diff — say **modified** if modified.
2. The I0 dirty-worktree manifest with per-path md5, and the true final `git status --porcelain` with the same set.
3. R1–R8 → AC1–AC6 with evidence.
4. **Both `getAnimations()` readings verbatim** — I2 (absent) and I5 (running).
5. **Both double-capture runs** under emulation, with per-story changed-cell counts.
6. The diffs of `preview-head.html` and `check-stories-rendered.mjs`, in full.
7. The rendered comparison and its changed-cell partition, including "0 changed cells" rows.
8. Every command with its actual exit code; the build tail verbatim with the full 54-row route table.
9. Deviations, and the A3 `RangeDatePicker` observation.
10. Limitations — at minimum whether `check:homepage-grid` also needs emulation (§8).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. No
self-approval; no mutating git.

**Handoff:** `tasks/kickoff_prompt_Task_705_Task704_Revision_Scope_The_Capture_Freeze.md` under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | **Yes** — the offending CSS quoted, the grep that proves it unconditional, the half-built mechanism, the Playwright API, the baseline figures and the dirty start state are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R8 → AC1–AC6 |
| Scope protects existing behavior | **Yes** — §3.6 and §8 fence D27 and the accessibility rule; R5's md5 witness enforces it |
| QA profile + rationale | **Yes** — §13 Q3 with the `getAnimations()` pair named as the decisive artifact; Q4 declined with a reason |
| Negative flows by applicability | **Yes** — §11, incl. the bespoke-flag branch, the over-narrowed-freeze branch and the missed-page branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes the shipped block and the grep result; §3.3 quotes Task 704's rule and its `Skeleton.mjs` finding; §3.4 is a real grep; §3.5 is a real `git status` |
| Gates prove the changed behavior | **Yes** — a before/after `getAnimations()` pair on the exact reported symptom, plus a 0/0 double capture that would flake if any page missed emulation |
| Single active owner route | **Yes** — forks are only stop conditions: unexpected I0 status, determinism lost after scoping, `skeleton-chrome.css` md5 drift |
| Baselines account for task-created artifacts | **Yes** — I1 re-measures under the current mechanism before anything changes, so R3 compares like with like |
| Dirty-worktree handling | **Yes, declared** — §3.5 with the exact four expected entries and md5 witnesses |

**Known-risk note for the reviewer.** Three likely defects. First, **narrowing the freeze to the Skeleton** while
scoping it — the media query is the only thing that should change; shrinking the selector would restore
non-determinism for every other animating story and the 0/0 proof would not catch it, because those stories are
not in R3's two-story check. Second, **emulating on some pages but not all** — the harness may create more than
one page or context, and a missed one shows up as intermittent flake rather than a clean failure. Third,
**accepting a screenshot as proof of animation** — a PNG cannot show motion; AC3 exists precisely because the
symptom is invisible to the comparator that was supposed to be guarding this.
