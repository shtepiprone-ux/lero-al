# Task 739 — rework brief, attempt 2

**Sprint 54. Supersedes nothing in the kickoff; it narrows it.** Read
`Sprint_54_kickoff_prompt_Task_739_ClickShield_Wrong_Clearing_Box.md` — especially its `REWORK` banner, which
carries **corrected C1** — then this file. The contract (`Sprint_54_Task_739_execution_contract.md`) and ledger
still bind, with the checkpoint deltas in §6 below.

**Status:** attempt 1 `REJECTED` at orchestrator review 2026-08-09. Its diff is **still in the worktree,
unstaged, deliberately** — build on it, do not start from `HEAD`.

---

## 1. What attempt 1 got right — keep all of it

Do not redo or discard: §2's per-violation census · §3's blast-radius count (`totalHitNotSelf: 1031`,
`totalOverhang: 8`) · §9's OQ1 sticky measurement (`.site-header` is the app's only sticky element, `top:0`,
first in document flow, therefore stuck across the whole reachable range) · the corrected geometry comments ·
the two `/overhang-*` fixtures · the 725 plant round-trip. All sound, all reusable.

**Exactly one thing is wrong: the box.**

## 2. Why attempt 1's box is wrong, in one line each

- `hit.getBoundingClientRect()` is right when the interceptor **overhangs** its fixed ancestor (`.fabLink`, 745,
  above `.navBar`, 756) and wrong when it is **contained** (`svg.lucide-menu`, 20px, inside `.site-header`, 65px).
- Evidence it is a regression, from attempt 1's own artifacts: `FavoriteButton_control` at `(333,15 32x32)` reads
  `cleared: … @ scrollY=793` in `I1-baseline.log` and `blocked:` in `K3-sweep-after.log`, ×4 locales, 3/3 reruns.
- Evidence it under-delivers: attempt 1's own census records `re-lands on .fabLink` for **all six** target rows
  while `hit` varies (`.fabLink` 745 · `.navItem` 757 · `.fabLabel` 792). The blocker is the same element in
  every row; the interceptor is not.

## 3. The requirement — corrected C1

> The geometry must bound everything scroll-invariant that can occlude the candidate **at the offsets it
> generates**, not only what occludes it at the current scroll position.

For a fixed/sticky bar that is the bar's **extent**: its own rect unioned with the rects of descendants that
overflow it. Note what this implies for both failing cases — the extent of `.navBar` is 745 (it contains
`.fabLink`), and the extent of `.site-header` is its full 65px (it contains the icon). **Both are handled by the
same rule.** That makes "the extent" the obvious candidate mechanism.

**You are not authorised to adopt it because this brief names it.** Adopt it because you measured it against a
stated alternative and it won. R2 below is that requirement.

C2–C5 are unchanged and still bind. C3 in particular: phase 2 remains the sole arbiter, so a wrong hypothesis
still costs a recheck and cannot manufacture a false `cleared`.

## 4. Requirements

**R1 — Baseline as a set, across reruns.** Attempt 1's comparator drifted 3/4/6/6/6 across five runs. Take the
pre-fix baseline as the **union of the violation sets over ≥3 reruns**, keyed by
`(scenario, locale, viewport, element class + text + rect, interceptor class)`. A single-run count cannot detect
a regression that lands in a jittery cell.

**R2 — Evaluate at least two candidate boxes before choosing.** Run the census against each and report, per
target case and per header case, which resolve. If a single box satisfies corrected C1 in **both** directions,
one box is the right answer and multi-hypothesis is unnecessary — but the comparison must exist in the record.
If no single box does, emit offsets from more than one and let phase 2 arbitrate (OQ2, reopened).

**R3 — Dedupe and order the offsets.** If you emit more than one hypothesis, drop duplicates and try the most
conservative first; phase 2 breaks on first success, so ordering is free accuracy.

**R4 — Acceptance is a set property, not a number.** The target is **not** "base == 0". It is:

1. **No candidate that was `cleared` in the R1 baseline union may be `blocked` after.** Zero tolerance — this is
   the regression test attempt 1 lacked.
2. Every violation that remains must be **individually proven genuine**: a direct hit-test showing the candidate
   unreachable at every band the scan visits *and* at `maxScrollY`. A violation you cannot prove genuine is a
   suspected false positive and must be reported as one, not carried as a residual.

If (1) and (2) hold and base is non-zero, that is an acceptable outcome — provided each remaining violation
carries its proof. **A green count with an unproven set is not.**

**R5 — The containment control fixture (kickoff R12).** Add a self-test fixture that is the mirror of
`/overhang-transient`: an interceptor strictly **smaller** than its fixed ancestor — a small icon inside a tall
bar — with the target positioned so clearing the icon's box alone leaves it inside the bar. It must **FAIL under
attempt 1's diff** and **PASS after the rework**; show both transcripts. A fixture that passes under both proves
nothing. Add its permanent twin (page height == viewport) which must FAIL in both.

Attempt 1's `/overhang-transient` is not a control: its `top:-20px;height:80px` span is a *superset* of the 60px
bar, so interceptor-only passes it by construction. That is precisely how the regression got through.

**R6 — Set-diff reporting (kickoff R13).** Report added and removed violations by identity, not counts. Name any
`cleared → blocked` transition as a regression explicitly, whatever else it may also be.

**R7 — Re-measure attempt 1's "band-dedup gap" after the box is fixed.** Its finding 1 attributed 4 residual
violations to the band scan's `resolvedSet` never retrying a resolved candidate. With the extent box the offset
moves from 3288 to ~3300, still inside `maxScrollY` 3335, so it plausibly evaporates. If it survives the correct
geometry, name it with evidence and **do not fix it here** — it is a different mechanism and needs its own task.

**R8 — `FavoriteButton` at mobile-390.** After the rework it must return to `cleared`, as it was pre-fix. If it
does not, that is a genuine finding and needs the R4(2) proof before it can be reported as one. Do not attribute
it to the 723/724 defect without that proof — attempt 1 did, and the before/after pair refuted it.

**R9–R12** — unchanged from the kickoff: no application file in the write set · no CI softening · comments
corrected · backlog baseline from `git show HEAD:docs/backlog.md | wc -l` before the first edit · dirty-worktree
manifest (note: the worktree starts dirty **by design** this time — attempt 1's diff) · evidence local-only in
`.screenshots/task739-evidence/` (D6).

## 5. Pre-declared false successes for attempt 2

**A2.1 — "Base reached 0."** Still purchasable, and now also purchasable by over-conservatism in the other
direction. R4's set property, not the count, is the deliverable.

**A2.2 — "The regression is gone."** Check it against the R1 **union**, not against attempt 1's single 4-violation
run. A regression that only manifests in a jittery cell will hide behind a single-run comparison.

**A2.3 — "Runtime is fine."** If you emit more hypotheses, phase 2 does more rechecks. 729 measured 87s for the
full sweep; kickoff §7.4's stop-and-report threshold is 3× that. Report the actual wall-clock either way.

**A2.4 — "The containment fixture passes."** It must have failed first. A control that never failed is decoration.

## 6. Checkpoint deltas against `Sprint_54_Task_739_execution_contract.md`

| Checkpoint | Change for attempt 2 |
|---|---|
| 0 | Worktree starts dirty **by design** — attempt 1's unstaged diff. Manifest it as such; it is the base, not contamination |
| 1 | Baseline is the **union over ≥3 reruns** (R1), not one run. Persist all runs |
| 2 | Census re-run against **each** candidate box (R2), not one |
| 4 | Pre-fix `--verify-gate` must include the new containment control **failing** (R5) |
| 6 | Post-fix `--verify-gate` ≥12 cases: 8 original + 2 overhang + ≥2 containment |
| 7 | Report the **set diff** (R6). Zero `cleared → blocked` transitions is a pass condition, not a note |
| 8 | 725's plant unchanged as a control — it must still be loud |
| new | Every surviving violation carries its R4(2) genuineness proof, or is labelled a suspected false positive |

## 7. Completion report contract

Everything the kickoff §14 asks for, plus: the R1 baseline union with per-run sets · the R2 box comparison table ·
the R6 set diff with regressions named · the R5 control's fail-then-pass transcripts · the R7 re-measurement ·
`FavoriteButton`'s post-rework disposition (R8) · wall-clock for the full sweep.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` requires **zero** `cleared → blocked` transitions against the
baseline union and a genuineness proof attached to every remaining violation. Report `PARTIALLY IMPLEMENTED` or
`BLOCKED` honestly otherwise — attempt 1 did exactly that, and the honesty is not what was rejected. The box was.
