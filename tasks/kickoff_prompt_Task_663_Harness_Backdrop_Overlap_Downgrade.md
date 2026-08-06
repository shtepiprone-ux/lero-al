# Kickoff — Task 663: Suppress false-positive "background behind overlay backdrop" ambiguous-overlap findings (backdrop-gated downgrade)

> Saved implementation kickoff. A fresh Sonnet session must execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** governance / test-tooling. Changes the visual-integrity harness verdict logic in
  `scripts/geometry-integrity.mjs` (a Node/Playwright-page script, not product UI). No product component, route,
  style, or i18n string changes. Because it changes a **validation gate's classification**, it carries a
  gate-integrity obligation: planted-violation proof that genuine defects are still caught (agent-contract clause 13).
- **Owner directive (2026-07-23):** the recurring `ambiguous-overlap` findings with reason
  *"background page content behind an opened overlay's backdrop"* are a false-positive class (a Storybook multi-demo
  page artifact, not a product defect — confirmed by owner visual inspection of `Mantine/Primitives/Combobox/Default`
  at 320px). Downgrade that specific reason-class so it stops being flagged, **without** weakening detection of a
  genuine collision or a real background-bleed defect.

## 2. Objective

In `scripts/geometry-integrity.mjs` Check 4, stop emitting an `ambiguous-overlap` finding for a pair that straddles
the opened-overlay boundary (one element inside `.mantine-Drawer-body`, the other outside) **when a genuine blocking
overlay backdrop actually covers the background element**. In that case the background control is provably
unreachable, so the overlap is expected modal behavior and must be treated as `pass` (no finding). When **no** covering
backdrop is present (e.g. `withOverlay={false}`, or a background element stacked above the backdrop), the pair must
still be surfaced exactly as today (`ambiguous-overlap`) so a real bleed-through is never silently hidden.

Net effect: the ~40 recurring owner-triage rows on `Combobox`/`RangeDatePicker`/`NotificationBellView` default stories
disappear, `screenshots:assert` still reports `0 FAIL`, and the harness still catches genuine overlaps and genuine
uncovered-background cases (proven by planted fixtures).

## 3. Verified context

All facts below inspected in the repo on 2026-07-23. Re-verify only where a step says so.

### 3.1 The exact branch to change

`scripts/geometry-integrity.mjs`, **Check 4** (pairwise interactive-overlap scan). After the algorithmic exclusions
(ancestor, containment, label/input pair, `aria-hidden`, `inert`, `pointer-events:none` — lines ~475–480) and the R1
`isLibraryInternal`/`isAbsoluteOverOwnTrigger` ambiguous branch (line ~483), the cross-overlay-boundary branch is:

```js
// lines ~502–511 (Task 538)
if (isInsideOverlayBody(a) !== isInsideOverlayBody(b)) {
  ambiguous.push({
    failReason: 'ambiguous-overlap',
    selector: `${selectorFor(a)} ↔ ${selectorFor(b)}`,
    label: `"${labelFor(a)}" ↔ "${labelFor(b)}"`,
    details: `...`,
    reason: "background page content behind an opened overlay's backdrop",
  });
  continue;
}
```

This is the **only** branch that emits that reason string. `isInsideOverlayBody(el)` = `!!el.closest('.mantine-Drawer-body')`
(lines ~203–205). `BOTTOM_SHEET_BODY_SELECTOR` (lines ~73–80) feeds `.mantine-Drawer-body`-scoped interactive elements
into the candidate set, which is why an opened bottom sheet produces these cross-boundary pairs.

### 3.2 Why the current output is a false positive

The affected stories (`Mantine/Primitives/Combobox/Default`, `.../RangeDatePicker/Default`, `.../NotificationBellView/Default`)
stack several independent demo instances on one Storybook page. When one opens its bottom sheet (`.mantine-Drawer-body`),
the *other* demos' triggers/options remain in the DOM behind the sheet's full-viewport backdrop. Their bounding boxes
geometrically overlap the sheet's elements → the branch above fires. In the real app only one such control exists per
surface and the backdrop covers the whole viewport, so no user can perceive or reach the background control. Owner
visually confirmed nothing is wrong.

### 3.3 Verdict / reporting flow (so the fix lands in the right place)

- A cell with only ambiguous findings and otherwise-passing hard checks is set `cell.verdict = 'ambiguous'`
  (`scripts/check-stories-rendered.mjs` ~lines 1221–1224); the run still prints `✅ All hard assertions PASSED`
  (ambiguous ≠ FAIL). So these 43 do **not** fail CI today — they are pure triage noise.
- The `ambiguousOverlap` summary counter and the harness-generated inventory
  (`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`, regenerated every run) tally them.
  Downgrading the covered-backdrop case to `pass` (i.e. **not** pushing to `ambiguous`, letting the pair fall through as
  a non-finding) naturally drops both counts; no new counter/bucket is required.

### 3.4 Planted-fixture harness (the gate-integrity guardrail)

- Planted fixtures live in `src/stories/PlantedVisualViolations.stories.tsx` and are registered in
  `scripts/check-stories-rendered.mjs`'s `ASSERT_STORIES` list (~lines 205–222) so `--fast` asserts them at
  320/375/390 × sq/en/uk/it.
- **Verified:** the existing `AmbiguousOverlap` fixture (`export const AmbiguousOverlap`, lines ~156–180; testid
  `planted-ambiguous-trigger`/`planted-ambiguous-popup`) is a `position:absolute` popup over its own trigger inside one
  `position:relative` box. It exercises the **R1 `isAbsoluteOverOwnTrigger`** branch (line ~483), **NOT** the
  cross-overlay-boundary branch (line ~502). Therefore this task's change must leave its verdict **unchanged**
  (`ambiguous`). Likewise `OverlappingActions` (testid `planted-overlap-a`) must still hard-FAIL `element-overlap`, and
  `ScrollVisibleOverlap` must still FAIL. These are the non-weakening anchors.

### 3.5 What is NOT yet verified (executor must confirm before coding — do not assume)

The exact Mantine backdrop element/class for these bottom sheets is **not currently referenced anywhere** in `src/`
or `scripts/` (grep for `mantine-Overlay-root`/`mantine-Drawer-overlay`/`withOverlay` returned nothing). The executor
MUST open one affected story with the sheet open (e.g. `Mantine/Primitives/Combobox/Default` at 320px in Storybook or
via the harness page context) and inspect the live DOM to determine the real backdrop element (likely a
`.mantine-Overlay-root` or `.mantine-Drawer-overlay` under the same Drawer portal), its computed `position`
(expected `fixed`), viewport coverage, and stacking (`z-index`) relative to the background control. Key the downgrade
on that **verified** element and its covering geometry — not on an assumed class name.

### 3.6 Critical-flow scan

`docs/critical-flow-registry.md` covers auth, RLS/write-path, moderation, reporting, payment. A Storybook visual-QA
harness verdict is **not** a registered critical flow. No product regression-coverage obligation; the gate-integrity
proof here is the planted-fixture requirement, not a critical-flow harness.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | Check 4's cross-overlay-boundary pair (`isInsideOverlayBody(a) !== isInsideOverlayBody(b)`) is treated as `pass` (no `ambiguous-overlap` finding) **when** a genuine blocking overlay backdrop covers the outside-sheet (background) element. | P0 | Code inspection + planted `OverlayBackdropCovered` fixture → PASS | Confirmed |
| R2 | Owner (non-weakening) | When **no** covering backdrop is present (`withOverlay={false}` / background element stacked at/above the backdrop), the same pair is still surfaced as `ambiguous-overlap` (not silently passed). | P0 | Planted `OverlayNoBackdrop` fixture → still `ambiguous` (not pass) | Confirmed |
| R3 | agent-contract 13 | No pre-existing genuine detection is weakened: `OverlappingActions` still hard-FAILs `element-overlap`; `ScrollVisibleOverlap` still FAILs; the existing `AmbiguousOverlap` (absolute-over-trigger, R1 branch) still returns `ambiguous`. | P0 | `--fast` planted assert run, all prior verdicts unchanged | Confirmed |
| R4 | Owner | On a full `screenshots:assert -- --mantine-only` run, the `ambiguous-overlap` count for the backdrop reason-class drops to ~0 (only genuinely-uncovered cases, if any, remain), with **`0 FAIL`** and no story losing a previously-passing hard assertion. | P0 | Before/after `screenshots:assert` summary | Confirmed |
| R5 | qa-profiles / P0.9 | `npx tsc --noEmit` clean (scripts are `.mjs`, but the repo typechecks the tree) and `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R6 | scope | No product component/route/style/token/i18n change; only `geometry-integrity.mjs`, the planted story, and the `ASSERT_STORIES` registration change (+ backlog/session log). | P0 | `git diff` file list | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **A1 (assumption):** Mantine renders a single full-viewport backdrop element per open Drawer bottom sheet with a
  z-index between the background page and the sheet body. If the executor's DOM inspection (§3.5) finds no such element
  for these sheets, STOP and return `BLOCKED` with the observed DOM — do not fabricate a backdrop test.
- **A2 (assumption):** Treating the covered case as a silent `pass` (fall-through, no push) is preferred over adding a
  new "expected-overlay" bucket. If the reviewer later wants an explicit audit trail, that is a follow-up; keep this
  change minimal.
- **OQ1 (non-blocking):** The harness-generated inventory file regenerates on every run. Whether to commit its refresh
  is an owner call at review time (it is a generated artifact), not part of this task's required diff.
- No blocking open questions beyond A1's stop-condition.

## 6. Pre-read rule bundle (exact — do not read all docs)

1. `docs/agent-contract.md` (P0 scope §1, build gate §9, gate-integrity clause 13).
2. `docs/qa-profiles.md` (Q1 + gate/planted-violation proof).
3. `docs/qa-rules.md` (validation-gate rules; a gate must assert observable behavior, not be weakened to pass).
4. `docs/storybook-governance.md` §14 (rendered-proof harness / `screenshots:assert` + planted fixtures).
5. This kickoff. Re-verify §3.1 line region and §3.5 backdrop element against the live repo/DOM before coding.

## 7. Scope

- Edit `scripts/geometry-integrity.mjs` Check 4: gate the line ~502 cross-overlay-boundary branch on verified
  backdrop coverage — downgrade to `pass` (fall-through, no `ambiguous` push) only when the background element is
  covered by a real blocking backdrop; otherwise keep the current `ambiguous-overlap` push.
- Add two planted fixtures to `src/stories/PlantedVisualViolations.stories.tsx`, following the existing fixture style
  and the `.mantine-Drawer-body` simulation precedent already used by `ScrollClippedOverlap`:
  - `OverlayBackdropCovered` — inside-sheet element overlaps a background control **with** a full-viewport blocking
    backdrop between them → expected **PASS**.
  - `OverlayNoBackdrop` — same overlap but **no** covering backdrop (or background stacked above it) → expected
    **still `ambiguous-overlap`** (not pass).
- Register both new fixtures in `scripts/check-stories-rendered.mjs` `ASSERT_STORIES` (~lines 205–222) with their
  testids and expected verdicts, mirroring the existing planted entries.
- Update `docs/backlog.md` (concise current state, ≤80-line cap) and add the session log under `docs/sessions/`.

## 8. Out of scope

- Any product component, route, CSS/token, or i18n string.
- The R1 `isAbsoluteOverOwnTrigger`/`isLibraryInternal` ambiguous branch (line ~483) and its planted `AmbiguousOverlap`
  fixture — untouched.
- Other Check 4 hard-FAIL classes (`element-overlap`, `text-clipped`, `outside-container`, `offscreen`, `unstyled`).
- Committing the regenerated inventory file (OQ1 — owner call).
- Inerting/`aria-hidden`-ing the sibling demos in the affected product stories (a different approach the owner
  explicitly did not choose).

## 9. Current and required behavior

**Current:** any interactive pair straddling the `.mantine-Drawer-body` boundary that geometrically overlaps is
classified `ambiguous-overlap` ("background behind backdrop"), producing ~40 recurring owner-triage rows even though a
full-viewport backdrop makes the background control unreachable.

**Required (after):** the same pair is a silent `pass` **iff** a verified blocking backdrop covers the background
element; if no covering backdrop exists, it remains `ambiguous-overlap`. Genuine `element-overlap` FAILs and the
existing absolute-over-trigger `ambiguous` classification are unchanged.

## 10. Implementation requirements

1. **Backdrop detection (in-page, verified — §3.5):** add a helper (e.g. `isBackgroundCoveredByOverlayBackdrop(bgEl)`)
   that returns true only when a real Mantine overlay backdrop element is present, is `position:fixed` and covers the
   viewport (its rect contains `bgEl`'s rect), and sits at a `z-index` at/above `bgEl`'s stacking context and below the
   sheet body. Use the **actual** backdrop selector confirmed by DOM inspection, not an assumed name. Reuse existing
   helpers (`getComputedStyle`, `rectsOverlap`, `isInsideOverlayBody`) where possible.
2. **Gate the branch:** in the line ~502 branch, when `isInsideOverlayBody(a) !== isInsideOverlayBody(b)`, identify the
   outside-sheet element as the background element; if `isBackgroundCoveredByOverlayBackdrop(background)` → `continue`
   with **no finding** (pass). Else → keep the existing `ambiguous.push({... reason: "background page content behind an
   opened overlay's backdrop" ...})`. Preserve all preceding exclusions and the R1 branch exactly.
3. **Do not** broaden the exemption: it must fire only for the drawer-body cross-boundary case with a proven covering
   backdrop. A pair fully inside or fully outside the sheet must still reach the hard `element-overlap` push.
4. **Planted fixtures** (`PlantedVisualViolations.stories.tsx`): `OverlayBackdropCovered` (expected PASS) and
   `OverlayNoBackdrop` (expected still `ambiguous`). Simulate `.mantine-Drawer-body` and the backdrop with plain
   elements/classes as the existing planted fixtures do; give each a stable `data-testid`. Keep a visible element so
   the screenshot is not blank.
5. **Registry:** add both to `ASSERT_STORIES` with anchors/testids and a comment stating each expected verdict
   (PASS vs ambiguous), matching the Task 569 `ScrollClippedOverlap`/`ScrollVisibleOverlap` precedent.
6. No hardcoded product values; the change is pure harness logic + test fixtures.

## 11. Positive and negative flows

**Positive flow:** Run `screenshots:assert -- --mantine-only`; the `Combobox`/`RangeDatePicker`/`NotificationBellView`
default stories no longer emit the backdrop-reason `ambiguous-overlap` rows; `0 FAIL`; no story loses a prior hard PASS.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation / Auth-RLS / Offline / Concurrent-writer | No | No product/form/data path touched | N/A | — |
| Backdrop absent (`withOverlay={false}` / bg above backdrop) | Yes | R2 | Pair still flagged `ambiguous-overlap` | `OverlayNoBackdrop` fixture |
| Backdrop present, bg covered | Yes | R1 | Pair passes (no finding) | `OverlayBackdropCovered` fixture |
| Genuine same-layer overlap | Yes (preserve) | R3 | Still hard-FAIL `element-overlap` | `OverlappingActions`, `ScrollVisibleOverlap` unchanged |
| Absolute-over-own-trigger | Yes (preserve) | R3 | Still `ambiguous` (R1 branch) | existing `AmbiguousOverlap` unchanged |
| Backdrop element not found in DOM | Yes | A1 | Return `BLOCKED` with observed DOM | inspection note |

## 12. Acceptance criteria

- **AC1 [R1]** Given `OverlayBackdropCovered`, when asserted, then the cross-boundary overlap yields **PASS** (no
  `ambiguous-overlap` finding).
- **AC2 [R2]** Given `OverlayNoBackdrop`, when asserted, then the pair is still classified **`ambiguous-overlap`** (not
  passed).
- **AC3 [R3]** Given the existing planted set, when asserted (`--fast`, 4 locales), then `OverlappingActions` and
  `ScrollVisibleOverlap` still **FAIL** `element-overlap`, and `AmbiguousOverlap` still returns **`ambiguous`** —
  verdicts unchanged from before this task.
- **AC4 [R4]** Given `npm run screenshots:assert -- --mantine-only`, when compared before/after, then the
  backdrop-reason `ambiguous-overlap` rows on the affected default stories drop to ~0, total run is **`0 FAIL`**, and no
  story loses a previously-passing hard assertion (paste both summaries).
- **AC5 [R5]** Given the repo, then `npx tsc --noEmit` is clean and `npm run build` exits 0 (transcripts).
- **AC6 [R6]** Given `git diff`, then only `scripts/geometry-integrity.mjs`, `src/stories/PlantedVisualViolations.stories.tsx`,
  `scripts/check-stories-rendered.mjs`, `docs/backlog.md`, and the new session log changed — no product component/style/i18n.

## 13. QA profile and verification plan

**Profile: Q1 Targeted + gate-integrity (planted-violation) proof.** Justification: a non-product Node-script change to
a QA gate's classification. It is not Q3 (no product UI/story visual output changes) and not Q4 (no auth/RLS/critical
flow), but because it alters a validation gate it MUST carry planted-violation proof (agent-contract 13): the fix is
only acceptable if genuine collisions and genuine uncovered-background cases still fail/flag.

Verification plan (repo-known commands only):
1. `npx tsc --noEmit` → 0 errors.
2. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include transcript).
3. `npm run screenshots:assert -- --mantine-only --fast` → planted fixtures assert: `OverlayBackdropCovered` PASS,
   `OverlayNoBackdrop` ambiguous, `OverlappingActions`/`ScrollVisibleOverlap` FAIL, `AmbiguousOverlap` ambiguous
   (paste the planted-cell verdict lines).
4. `npm run screenshots:assert -- --mantine-only` (full) BEFORE vs AFTER → paste both summary blocks showing the
   `ambiguous-overlap` count drop and `0 FAIL`; confirm no story regressed a hard assertion.
5. `check:file-integrity` / `check:mojibake` on touched text files.

If the backdrop element cannot be found in the live DOM (A1), record it as `BLOCKED` with the observed DOM dump and the
exact command used — do not fabricate a passing backdrop test.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-23-task663-*.md`) and `docs/backlog.md` update must include: changed-files
table matching the real diff; R1–R6 each with evidence; every command with actual result/exit code (tsc, build,
planted `--fast` verdict lines, before/after full `screenshots:assert` summaries); the verified backdrop
element/selector and its computed coverage/z-index; assumptions/deviations/limitations; and the AC1–AC6 self-audit.
Set status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Do not self-approve. Do
not run, emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (exact branch/lines, verdict flow, planted-fixture file and
  registry, and the backdrop-verification step are all inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R6 → AC1–AC6 + §13).
- Scope protects existing behavior and names what must not change — yes (§8: R1 branch, hard-FAIL classes, product
  stories, existing planted verdicts).
- The gate change asserts observable behavior and cannot be silently weakened — yes: R2/R3 + the `OverlayNoBackdrop`
  and preserved FAIL fixtures are the planted-violation proof required for a gate change.
- No uninspected claim — the changed branch, helper, verdict flow, planted file, and registry were inspected
  2026-07-23; the one unverified item (exact backdrop selector) is explicitly delegated to executor DOM inspection with
  a `BLOCKED` stop-condition, not asserted.
- Negative flows selected by applicability — yes (§11).
- Assumptions/open questions visible — yes (§5).

---

**Task path:** `tasks/kickoff_prompt_Task_663_Harness_Backdrop_Overlap_Downgrade.md`
**QA profile:** Q1 Targeted + gate-integrity (planted-violation) proof.
**Ambiguous/conflicting requirements:** none blocking. Stop-condition A1 (backdrop element absent → `BLOCKED`).
**Owner decision still needed:** none to start. OQ1 (commit the regenerated inventory refresh) is a review-time owner call.
