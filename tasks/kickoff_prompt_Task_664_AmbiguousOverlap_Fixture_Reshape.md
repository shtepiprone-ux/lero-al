# Kickoff — Task 664: Reshape the `AmbiguousOverlap` planted fixture so it re-exercises its R1 branch

> Saved implementation kickoff. A fresh Sonnet session must execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** governance / test-fixture repair. Changes **only** one planted Storybook fixture's markup in
  `src/stories/PlantedVisualViolations.stories.tsx`. No harness-logic change, no product component/route/style/i18n
  change. Because it repairs a **gate-integrity fixture**, it carries a planted-violation proof obligation
  (agent-contract clause 13): after the reshape the fixture must again exercise, and prove, the exact branch it exists
  to guard.
- **Origin:** Task 663 review finding N2 (2026-07-23). The `AmbiguousOverlap` fixture silently stopped proving its own
  R1 claim.

## 2. Objective

Reshape the `AmbiguousOverlap` planted fixture (`src/stories/PlantedVisualViolations.stories.tsx`) so its trigger and
popup have **partially-overlapping, non-containing** bounding rects while remaining a `position:absolute`-popup-over-a
`static`-trigger **sibling** pair. This restores the code path so the fixture is classified `ambiguous-overlap` via
Check 4's R1 `isAbsoluteOverOwnTrigger` branch — the branch it was created (Task 467) to guard — instead of being
silently short-circuited by the Task-611 `isContained` bounding-box guard. Add durable proof (and a registry note) so
the fixture cannot silently regress to a non-R1 verdict again.

## 3. Verified context

All facts inspected 2026-07-23 in the repo. Re-verify §3.4 rects via a live probe before finalizing.

### 3.1 The fixture today (the defect)

`src/stories/PlantedVisualViolations.stories.tsx`, `export const AmbiguousOverlap` (≈lines 156–180):

```jsx
<div style={{ position: 'relative', width: 200, height: 50 }}>
  <div role="button" tabIndex={0} data-testid="planted-ambiguous-trigger"
       style={{ padding: 8, cursor: 'pointer', width: 120 }}>Trigger #467</div>
  <div role="button" tabIndex={0} data-testid="planted-ambiguous-popup"
       style={{ position: 'absolute', left: 0, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}>Popup #467</div>
</div>
```

The static trigger and the `absolute left:0 top:0` popup render to **byte-identical rects** (`[16,24,136,64]` at
320px/en, per a Task-663 live probe). Two identical rects each "contain" the other.

### 3.2 Why it no longer proves its branch (verified helper trace, `scripts/geometry-integrity.mjs`)

Check 4's exclusion cascade runs **before** the R1 branch. The Task-611 containment guard (lines ~469–481):

```js
// Task 611 — bounding-box containment guard … either fully contains the other …
function isContained(inner, outer) {
  return inner.left >= outer.left - tol && inner.top >= outer.top - tol &&
    inner.right <= outer.right + tol && inner.bottom <= outer.bottom + tol;
}
```

is consulted at line ~476 as `if (isContained(aVisibleRect, bVisibleRect) || isContained(bVisibleRect, aVisibleRect)) continue;`.
For two **identical** rects, both directions are true (within `tol`), so the pair `continue`s and **never reaches** the
R1 branch (line ~483):

```js
if (isLibraryInternal(a) || isLibraryInternal(b) || isAbsoluteOverOwnTrigger(a, b)) { ambiguous.push({ failReason: 'ambiguous-overlap', … }); continue; }
```

`isAbsoluteOverOwnTrigger(a, b)` (lines ~272–284) returns true only when **one** element is `absolute`/`fixed`, the
**other is NOT** positioned, and `a.parentElement === b.parentElement`. The current fixture DOES satisfy that
relationship — but the containment guard short-circuits first. Result: `AmbiguousOverlap` currently returns `pass`
(no finding), under both the pre-663 and current harness (Task-663 §5.2/§5.3 proof). It has silently not tested its
own gate since Task 611 (~2026-07-15).

### 3.3 The containment guard is correct and out of scope

`isContained` is by design one-directional-or-other and exists to exempt the real Mantine `rightSection`/adornment
nested-sibling pattern. It is **not** the bug and must **not** be weakened or removed. The fix belongs in the
fixture's geometry, not the harness. `geometry-integrity.mjs` stays byte-for-byte unchanged in this task.

### 3.4 The reshape (partial overlap, no containment) — the mechanism

`rectsOverlap` (lines ~457–461) needs `overlapX > tol && overlapY > tol`. `isContained` must be false in BOTH
directions. So offset the popup horizontally so it overlaps the trigger but spills past one edge. Illustrative
(executor confirms actual rendered rects via probe — box-sizing may shift a pixel):

```jsx
// popup shifted right so neither rect contains the other, still absolute-over-static-sibling in the SAME parent
<div role="button" tabIndex={0} data-testid="planted-ambiguous-popup"
     style={{ position: 'absolute', left: 60, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}>Popup #467</div>
```

With trigger ≈`[16,24,136,64]` and popup shifted to ≈`[76,24,196,64]`: overlapX ≈60px (>tol), overlapY full; trigger's
left (16) is left of popup's left (76) and popup's right (196) is right of trigger's right (136) → **neither contains
the other** → the guard no longer fires → R1 `isAbsoluteOverOwnTrigger` fires → `ambiguous-overlap`. Widen the relative
wrapper (e.g. `width: 220`) if needed so the layout is not clipped; keep both elements visible for a non-blank
screenshot. Preserve the two `data-testid`s, `role="button"`, the static-trigger / absolute-popup split, and the shared
`position:relative` parent.

### 3.5 Registration + expected verdict

`AmbiguousOverlap` is already registered in `scripts/check-stories-rendered.mjs` `ASSERT_STORIES` (≈line 210, anchor
testid `planted-ambiguous-trigger`). No new entry is required; update its neighboring comment to state the expected
`ambiguous` (R1) verdict so a future reader/CI knows the intended classification. Do **not** change other entries.

### 3.6 Critical-flow scan

Not a registered critical flow (`docs/critical-flow-registry.md` = auth/RLS/moderation/reporting/payment). Gate
integrity here is the planted-fixture proof, not a product regression harness.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | N2 finding | After reshape, `AmbiguousOverlap`'s trigger and popup rects **partially overlap** and **neither contains the other**; the pair remains an absolute-popup-over-static-trigger sibling pair. | P0 | Live rect probe + DOM/style inspection | Confirmed |
| R2 | N2 finding | The reshaped fixture is classified **`ambiguous-overlap`** (`ambiguousOnly:true`) via the R1 `isAbsoluteOverOwnTrigger` branch — not `pass` (containment short-circuit) and not a hard `element-overlap` FAIL. | P0 | `screenshots:assert -- --fast` verdict + OLD-fixture/NEW-fixture probe against the unchanged committed harness | Confirmed |
| R3 | scope | `scripts/geometry-integrity.mjs` is unchanged; no other planted fixture changes verdict; no product component/route/style/i18n change. | P0 | `git diff` (harness absent) + planted `--fast` verdict parity for all other fixtures | Confirmed |
| R4 | agent-contract 13 | The gate is proven by observable behavior: the reshape flips the fixture `pass → ambiguous` against the **same** (current, unmodified) harness, demonstrating it now exercises R1. | P0 | OLD-fixture-vs-NEW-fixture probe (same harness, two markups) | Confirmed |
| R5 | P0.9 | `npx tsc --noEmit` clean and `npm run build` exit 0. | P0 | transcripts | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **A1 (assumption):** box-sizing on these plain `<div role="button">` elements yields the rects in §3.4 closely
  enough that a ~60px horizontal shift produces partial, non-containing overlap at all asserted widths (320/375/390).
  If the executor's probe shows the shift still produces containment (or no overlap), adjust the offset/size until R1
  is reached and record the final rects — do not settle for `pass` or a hard FAIL.
- **OQ1 (non-blocking, do NOT do here):** whether the `isContained` guard should additionally special-case exact-equal
  rects is a separate harness-design question; this task fixes the fixture only. Note it as a spawn candidate.
- No blocking open questions.

## 6. Pre-read rule bundle (exact — do not read all docs)

1. `docs/agent-contract.md` (P0 scope §1, build gate §9, gate-integrity clause 13).
2. `docs/qa-profiles.md` (Q1 + planted-violation proof).
3. `docs/qa-rules.md` (a gate/fixture must assert observable behavior, not be weakened to pass).
4. `docs/storybook-governance.md` §14 (planted-fixture rendered-proof harness).
5. This kickoff; re-verify §3.2 helper line regions and §3.4 rects against the live repo/DOM before finalizing.

## 7. Scope

- Edit only the `AmbiguousOverlap` fixture markup in `src/stories/PlantedVisualViolations.stories.tsx` per §3.4.
- Update the `AmbiguousOverlap` comment in `scripts/check-stories-rendered.mjs` `ASSERT_STORIES` to state the expected
  R1 `ambiguous` verdict (comment-only; no anchor/id change).
- Update `docs/backlog.md` (concise; ≤80-line cap) and add the session log under `docs/sessions/`.

## 8. Out of scope

- `scripts/geometry-integrity.mjs` (the `isContained` guard, the R1 branch, or any other harness logic) — unchanged.
- Any other planted fixture, any product component/route/CSS/token/i18n.
- Re-designing the containment guard for exact-equal rects (OQ1 — separate spawn candidate).
- Committing the harness-regenerated inventory report (owner call, as with Task 663).

## 9. Current and required behavior

**Current:** `AmbiguousOverlap` renders trigger and popup at identical rects; the Task-611 containment guard exempts
the pair before R1, so the fixture returns `pass` and no longer proves the `isAbsoluteOverOwnTrigger` classification.

**Required (after):** the fixture renders a partial, non-containing overlap of an absolute popup over its static
sibling trigger; Check 4 reaches the R1 branch and classifies it `ambiguous-overlap` (`ambiguousOnly:true`). No harness
code changes; every other fixture's verdict is unchanged.

## 10. Implementation requirements

1. In `AmbiguousOverlap`, offset the popup (e.g. `left: 60`) and, if needed, widen the `position:relative` wrapper so
   the trigger and popup **partially overlap with neither rect containing the other**, keeping: two `role="button"`
   siblings in one `position:relative` parent, the trigger `static` (unpositioned), the popup `position:absolute`, both
   `data-testid`s, and both visibly rendered.
2. Verify via a live rect probe (throwaway, uncommitted — Task 663 §5.2 method) at 320/375/390 that `rectsOverlap` is
   true and `isContained` is false in both directions, and that the fixture's verdict is `ambiguous` (R1), not `pass`
   or `fail`.
3. Do not touch `geometry-integrity.mjs`. Do not change any other fixture. Comment-update the `ASSERT_STORIES` entry
   only.
4. No hardcoded product values; test-fixture geometry only.

## 11. Positive and negative flows

**Positive flow:** Run `screenshots:assert -- --fast`; `Planted/AmbiguousOverlap` appears in the AMBIGUOUS section with
`ambiguous-overlap` (R1 absolute-over-trigger), at 320/375/390 × sq/en/uk/it; no other fixture's verdict changes.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation / Auth-RLS / Offline / Concurrent-writer | No | Non-product fixture-only change | N/A | — |
| Reshape overshoots into a real collision | Yes | R2 | Must NOT become hard `element-overlap` FAIL — stays R1 `ambiguous` | `--fast` verdict + probe |
| Reshape still contained / no overlap | Yes (A1) | R2 | Adjust offset until R1 reached; never leave it `pass` | rect probe |
| Other planted fixtures | Yes (preserve) | R3 | Verdicts byte-identical before/after | planted `--fast` parity |

## 12. Acceptance criteria

- **AC1 [R1]** Given the reshaped fixture at 320/375/390, when rects are probed, then trigger and popup overlap and
  `isContained` is false in both directions (record the rects).
- **AC2 [R2]** Given `screenshots:assert -- --fast`, then `Planted/AmbiguousOverlap` is classified `ambiguous-overlap`
  (`ambiguousOnly:true`) at all 3 widths × 4 locales — not `pass`, not `fail`.
- **AC3 [R4]** Given the **unchanged** committed harness run against the OLD fixture markup vs the NEW fixture markup,
  then OLD = `pass` and NEW = `ambiguous-overlap` (the reshape alone flips it — proof it now exercises R1).
- **AC4 [R3]** Given `git diff`, then `scripts/geometry-integrity.mjs` is absent from the diff, only the fixture markup
  + the `ASSERT_STORIES` comment (+ backlog/session log) changed, and every other planted fixture's `--fast` verdict is
  unchanged from Task 663's baseline.
- **AC5 [R5]** Given the repo, then `npx tsc --noEmit` is clean and `npm run build` exits 0 (transcripts).

## 13. QA profile and verification plan

**Profile: Q1 Targeted + gate-integrity (planted-violation) proof.** Justification: a non-product test-fixture repair
to a QA gate's guardrail; not Q3 (no product visual change) and not Q4 (no critical flow), but it must prove the
fixture re-exercises its intended branch (observable-behavior gate).

Verification plan (repo-known commands only):
1. `npx tsc --noEmit` → 0 errors.
2. `npm run build` → exit 0 (mandatory non-Q0 hard gate; include transcript).
3. `npm run screenshots:assert -- --fast` → `Planted/AmbiguousOverlap` in the AMBIGUOUS section (`ambiguous-overlap`) at
   320/375/390 × sq/en/uk/it; confirm no other planted fixture changed verdict vs Task 663.
4. OLD-fixture-vs-NEW-fixture probe against the unchanged committed harness (throwaway, uncommitted): OLD `pass` → NEW
   `ambiguous-overlap`; record the rects and the `isContained`/`rectsOverlap`/`isAbsoluteOverOwnTrigger` outcomes.
5. `check:stories`, `check:file-integrity`, `check:mojibake` on touched files.

If the reshape cannot reach R1 without becoming a hard `element-overlap` FAIL or staying contained, record the probed
rects and return `PARTIALLY IMPLEMENTED` with the observed geometry — do not ship a fixture that still returns `pass`.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-23-task664-*.md`) and `docs/backlog.md` update must include: changed-files
table matching the real diff; R1–R5 each with evidence; the probed rects at all 3 widths; the OLD/NEW fixture verdict
proof; the planted `--fast` parity for other fixtures; every command with actual result/exit code (tsc, build,
screenshots:assert --fast); assumptions/deviations/limitations; and the AC1–AC5 self-audit. Set status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Do not self-approve. Do not run,
emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (exact fixture, helper line regions, the guard/R1 mechanism,
  and a concrete reshape with a probe stop-condition are inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R5 → AC1–AC5 + §13).
- Scope protects existing behavior and names what must not change — yes (§8: harness logic, other fixtures, product).
- The gate change asserts observable behavior and cannot be silently weakened — yes: AC3's OLD/NEW same-harness flip is
  the planted-violation proof; AC4 preserves every other fixture verdict.
- No uninspected claim — the fixture, the `isContained` guard (lines ~469–481), `isAbsoluteOverOwnTrigger`
  (lines ~272–284), and `rectsOverlap` (lines ~457–461) were inspected 2026-07-23; the only unverified item (exact
  rendered rects after the shift) is delegated to an executor probe with an explicit stop-condition.
- Negative flows by applicability — yes (§11).
- Assumptions/open questions visible — yes (§5).

---

**Task path:** `tasks/kickoff_prompt_Task_664_AmbiguousOverlap_Fixture_Reshape.md`
**QA profile:** Q1 Targeted + gate-integrity (planted-violation) proof.
**Ambiguous/conflicting requirements:** none blocking. Stop-condition A1 (reshape cannot reach R1 cleanly →
`PARTIALLY IMPLEMENTED` with probed geometry).
**Owner decision still needed:** none. OQ1 (special-case exact-equal rects in the `isContained` guard) is a separate
spawn candidate, not part of this task.
