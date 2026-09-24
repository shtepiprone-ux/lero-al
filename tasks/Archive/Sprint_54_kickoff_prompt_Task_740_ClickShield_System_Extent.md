# Task 740 — the clearing box must be the fixed system's whole extent

**Sprint 54 — Mobile bottom-nav overlay collision. Closes the sprint.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` — CI-blocking gate logic + planted-violation proof.
**Companions:** `Sprint_54_Task_740_execution_contract.md` · `Sprint_54_Task_740_rule_compliance_ledger.md`.

> **This is the third and last box error in the same chain.** Read the archive rows for 737 and 739 before §4,
> and the `REWORK` banner on 739's kickoff. The short version:
> **attempt 1 of 739** used the interceptor's box — broke containment · **739 as landed** uses
> `union(hit, ancestor)` — correct only when the interceptor *is* the part that sticks out ·
> **740** uses the ancestor's real extent. **Do not touch the application.** 737 proved it is correct.

> **Ordering (inherited from 737 → 739).** Task 727's `click-shield` CI job is blocking but cannot run until the
> owner adds the Supabase repository secrets. The base scenario still reports **4 false positives**, so that job
> would fail every PR. **740 lands before the secrets.** That is why it is P1, and it is the whole reason this
> task exists rather than being deferred.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** correctness fix inside a CI-blocking gate. No product surface, no rendered UI
change. Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

Make the clearing-offset generator measure the **whole scroll-invariant occluding system** — the fixed/sticky
ancestor together with every descendant that can receive a hit outside the ancestor's own box — so the four
remaining false positives resolve, **without** inflating the box into a new class of false positive in the
opposite direction.

Both halves again. Over-extending the box is not a safe error: an offset that exceeds `maxScrollY` is discarded,
so an inflated box turns *clearable* candidates into *permanent* violations. §5 A2 says so in advance.

---

## 3. Verified context — read from the repository and from 739's evidence, 2026-08-09

Re-measure everything here. 737 exists because a kickoff's arithmetic was self-consistent and pointed at the
wrong box; 739 attempt 1 exists because a contract clause was ambiguous. Treat §3 as a hypothesis with receipts.

### 3.1 What is in the file today (Task 739, landed)

```js
const hitRect = hit.getBoundingClientRect();
const occluderRect = {
  top: Math.min(hitRect.top, ancRect.top),
  bottom: Math.max(hitRect.bottom, ancRect.bottom),
};
const offsets = computeClearingOffsetCandidates(rect, occluderRect, maxScrollY);
```

`ancRect` comes from `nearestFixedOrStickyAncestorOf(hit)`. The union of exactly **two** rects: the ancestor's,
and the one descendant that happened to be `hit`.

### 3.2 Why that is still short

`.fabLink` is a child of `.navBar` carrying `margin-top: calc(var(--space-3) * -1)` (`MobileBottomNavView.module.css:68-76`),
so it hit-tests from **745** while `.navBar`'s own box starts at **756**. `.fabLink` is the element that blocks
**all six** footer identities — 739's census records `re-lands on .fabLink` in every row — but it is the reported
`hit` in only **two** of them. In the other four `hit` is `.navItem` (757) or `.fabLabel` (792), both *inside*
`.navBar`, so `union(hit, anc)` collapses to **756** and the generated offset parks the candidate in the
745–756 strip `.fabLink` occupies.

### 3.3 The four survivors, and the number that predicts the fix

Base scenario, `mobile-375`: `sq` Instagram · `en` Instagram · `it` Facebook · `it` Instagram. From
`.screenshots/task739-evidence/I2b-box-comparison.json`:

| Row | box top used | offset | phase 2 |
|---|---|---|---|
| `sq Facebook` (`hit` **is** `.fabLink`) | **745** | 3299 | **cleared: true** |
| `it Facebook` (`hit` is `.fabLabel`) | 756 | 3302 | cleared: false |

Same page, same footer band. The only difference is the box's top edge. `it Facebook`'s 745-derived offset would
be ≈**3313**, against `maxScrollY` **3349** — reachable, and untested. That is the whole hypothesis.

### 3.4 One row of 739's comparison is not trustworthy

For `sq Instagram`, `ancestorOnly` and `union` record the **identical** box `{756,812}` and the **identical**
offsets `[3288, 3214]`, yet `resolvesClean` false vs. true. Identical inputs, different outputs — the phase-2
recheck flaked. The final sweep still blocks that identity, so the `false` reading is the true one. **Any
comparison you run must be reproduced ≥3× before it is evidence** (R9).

### 3.5 What 739 left standing, and must survive

`nearestFixedOrStickyAncestorOf` (729) · the N6 predicate written once and rebuilt at both sites (727) · the
transient/permanent semantics (725) · phase 2 as sole arbiter · `describe()`'s informational
`nearestPositionedAncestor` · **12 self-test cases**, including the overhang pair (739 R4) and the containment
pair (739 R5) — the two controls that make this class of error non-silent.

### 3.6 The acceptance discipline that produced a correct verdict last time

739's review re-derived the result with an identity-level set diff — scenario × locale × viewport × element ×
text — over a **3-run baseline union**, because a single run's count is unstable (3/4/6/6/6 was observed). That
is carried forward, not optional.

---

## 4. Requirements — one active route

**R1 — Census before edit, on all four survivors.** For each: candidate rect · `hit` and its rect · ancestor rect ·
**the ancestor's computed extent** · offsets under the landed code and under your proposed box · phase-2 result
per offset, ≥3 runs. Prove the 745 edge is what blocks. If it is not, §5 OQ4.

**R2 — State the inclusion rule, and justify every exclusion.** The box must cover every scroll-invariant thing
that can actually receive a hit outside the ancestor's own box. Some descendants should plainly *not* count —
`pointer-events: none`, zero-area, `visibility: hidden`, `display: none`. **Each exclusion needs a stated reason
grounded in hit-testing behaviour, not in whether it improves the number.** Report the rule as prose plus the
predicate that implements it.

**R3 — The rule may not key on identity.** No class name, component name, `data-*` attribute or module hash. It
keys on computed style and geometry or it is not a rule — Task **724 F1**: an exemption an author can hand-apply
is not an exemption the gate owns. A special case for `.fabLink` is an automatic rejection.

**R4 — Cost is in scope.** This runs per candidate, per band, inside a hot loop; naive `querySelectorAll('*')` +
`getBoundingClientRect()` per candidate is O(n·m). Measure it. Cache per ancestor per band if that is what it
takes. 729's full sweep is **87s**; kickoff-standard stop-and-report threshold is **3×** that.

**R5 — Acceptance is a set property, not a count.**

1. **Zero `cleared → blocked` transitions** against a ≥3-run baseline union of the **currently committed** code
   (not attempt 1, not the pre-739 original). Identity = scenario × locale × viewport × element class + text +
   rect. Zero tolerance.
2. Every surviving violation carries an individual genuineness proof: direct hit-testing at every band the scan
   visits **and** at `maxScrollY`. Unproven ⇒ reported as a suspected false positive, never carried as a residual.

Base reaching **0** is the expected outcome. It is not the acceptance criterion, and a 0 with an unproven set
does not pass.

**R6 — Both existing controls must keep round-tripping**, and add a third: **an overflowing descendant that must
NOT count** — a fixed bar with a large `pointer-events: none` decoration extending well past it, where the
candidate must still resolve `cleared`. Under a naive union-everything rule this fixture fails. That is the
point: it is the control for the over-extension direction, which R2's exclusions exist to prevent. Show it
failing under a deliberately naive rule, then passing.

**R7 — Re-measure 739's band-dedup claim.** 739 attributed all four survivors to the band scan's resolve-once
dedup; its own `I2b` refutes that for `it Facebook`. After the extent box, re-run and report which survivors (if
any) remain. **Only what survives earns a task number** — do not pre-file one.

**R8 — Fix the stale comment** 739 left on the `/overhang-*` fixtures: it still reads *"the post-fix generator
(`hit`'s own box, top:220)"*, describing a mechanism that was rejected. Name Task 740 and the date.

**R9 — Reproduce before believing.** Any box-comparison or census result that decides a design choice must be run
≥3× and reported with all runs. §3.4 is why.

**R10** — backlog baseline from `git show HEAD:docs/backlog.md | wc -l` before the first edit.
**R11** — dirty-worktree manifest before any write.
**R12** — evidence local-only in `.screenshots/task740-evidence/` (D6). No application file in the write set.

---

## 5. Assumptions and open questions

**A1 — The worktree may start dirty.** Manifest it.

**A2 — Pre-declared false successes.**

1. **"Base reached 0" by over-extension.** Union enough descendants and offsets exceed `maxScrollY`, which
   *discards* them — turning clearable candidates into permanent violations. This direction is caught only by
   R5(1)'s zero-tolerance set diff and R6's third control. Neither is optional.
2. **"Base reached 0" by special-casing.** See R3. Automatic rejection.
3. **A green run that measured nothing.** Report per-scenario `checked` for all three; a `checked: 0` scenario is
   not a pass (727 A2).
4. **A green run that flaked green.** §3.4. Post-fix sweeps get the same ≥3-run union treatment as the baseline.
5. **"The rest is the dedup."** Said twice now, refuted twice by the task's own evidence. R7 requires the
   measurement before the claim.

**OQ1 — Which descendants count?** R2 asks for the rule; this asks you not to inherit mine. `pointer-events`,
zero-area and hidden elements are the obvious exclusions — verify each against real hit-test behaviour rather
than assuming, and say whether any others are needed.

**OQ2 — Is the extent stable across bands and cells?** Fixed elements do not move under scroll, but content
differs by locale and viewport, and a drawer/modal changes the DOM. State whether the extent must be recomputed
per band, per cell, or once — with evidence, since this decides R4's caching.

**OQ3 — Does anything survive the extent box?** If yes, R7's measurement decides whether it is the dedup, and
only then does it earn a number.

**OQ4 — If the census contradicts §3.2/§3.3**, report `BLOCKED` with the measurement. 737 did exactly that and it
was the right outcome; the process working is not the process failing.

---

## 6. Pre-read rule bundle

`CLAUDE.md` (Git policy · "the executor's report is not proof") · `docs/ai-behavior.md` → Commit Rules, Backlog &
Session Log Rules · `docs/qa-profiles.md` → **Q4** · `docs/orchestrator-procedures.md` → Git policy ·
`tasks/Sprints/Sprint_54_MobileBottomNav_Overlay_Collision.md` · 739's kickoff **including its `REWORK` banner**
and `Sprint_54_Task_739_rework_brief_attempt_2.md` · `docs/backlog-archive.md` rows for 725, 727, 729, 737, 739
(729's row carries a retraction — read it, not the retracted text) ·
`docs/sessions/2026-08-09-task739-clickshield-wrong-clearing-box-attempt2.md`.

---

## 7. Scope

**7.1** `scripts/check-click-shield.mjs` — the occluder-box computation, its inclusion rule, the third self-test
fixture and its cases, and the comments R8 falsifies.
**7.2** `docs/backlog.md` · `docs/sessions/2026-08-09-task740-*.md`.
**7.3** `docs/storybook-governance.md` or `docs/qa-profiles.md` only to correct a sentence the fix falsifies —
quote it.
**7.4 Cost:** one production build + `npm start` + a 48-cell sweep ×3 (R5's union) + `--verify-gate`. If a single
sweep exceeds **3× 87s**, stop and report before iterating.

---

## 8. Out of scope

- **Every application file.** `FooterView`, `MobileBottomNavView`, `HeaderView`, `layout.tsx` — none of them.
- **Task 738** — the horizontal-scroll blind spot (729's residual 40 `excluded`).
- The band-scan dedup **fix** — R7 measures it; fixing it is a different mechanism and a different task.
- Widening scenarios, routes, viewports or locales. Touching `.github/workflows/*`. Adding a Storybook story.

---

## 9. Current and required behavior

| | Current (739, landed) | Required |
|---|---|---|
| Box | `union(hit.rect, ancestor.rect)` — two rects | The ancestor's **extent**: its rect ∪ every hit-testable descendant that overflows it |
| Overhanging descendant that is `hit` | Covered | Covered |
| Overhanging descendant that is **not** `hit` | **Missed** — box collapses to the ancestor's own top | Covered |
| Non-hit-testable overflow (`pointer-events:none`, hidden, zero-area) | N/A | **Excluded**, with a stated reason (R2) |
| Base scenario | 4 false positives | 0 expected — but R5's set property is the criterion |
| Self-test | 12 cases | ≥14: + the over-extension control, round-tripped |

---

## 10. Implementation requirements

**10.1** One logical change: the box rule + its fixture + the falsified comments.
**10.2** No new dependency, npm script, or env var.
**10.3** If the rule is needed inside both `page.evaluate` closures, it goes in **one** source string rebuilt at
both sites — 727's standard. Playwright serializes each callback independently, so a Node-side helper is
unreachable in the browser context.
**10.4** `behavior: 'instant'` on every programmatic scroll — the project's `<html>` sets `scroll-behavior: smooth`.
**10.5** Phase 2 stays the sole arbiter. No candidate is promoted to `cleared` on geometry alone.

---

## 11. Positive and negative flows

**Positive**
1. All four survivors resolve `cleared` with a real offset, reproduced ≥3×.
2. `sq`/`en` Facebook stay cleared (739's win is not traded away).
3. `FavoriteButton` @ mobile-390 stays cleared, ×4 locales — attempt 1's regression stays fixed.
4. `/transient`, `/overhang-transient`, `/contained-transient` all still resolve `cleared > 0`.

**Negative**
5. `/permanent` and both permanent twins still FAIL.
6. R6's over-extension control: candidate still `cleared` despite a huge non-hit-testable overflow.
7. `/violation`, `/dialog-violation`, `/alertdialog-violation` still FAIL — N6 untouched.
8. 725's plant still loud against the new baseline; restored to hash with clean porcelain.
9. A candidate whose extent-derived offsets all exceed `maxScrollY` is still a violation, not silently dropped.

---

## 12. Acceptance criteria

**AC1** R1's census on all four survivors, ≥3 runs, with the 745 edge proven.
**AC2** R2's inclusion rule stated as prose + predicate, every exclusion justified by hit-test behaviour.
**AC3** R3 satisfied — no identity-keyed condition anywhere in the rule.
**AC4** R5(1): **zero** `cleared → blocked` against the ≥3-run baseline union, shown as an identity set diff.
**AC5** R5(2): every surviving violation carries its genuineness proof, or is labelled a suspected false positive.
**AC6** ≥14 self-test cases green, R6's third control round-tripped (naive-rule FAIL → final PASS).
**AC7** Drawer and Modal scenarios shown unchanged; per-scenario `checked` reported.
**AC8** R4's cost measurement + the caching decision, with wall-clock for each sweep.
**AC9** R7's re-measurement; OQ1–OQ3 answered with dispositions; OQ4 answered by the census.
**AC10** R8's comment fix; `tsc`, `build`, `check:i18n`, `check:design-tokens:strict` exit 0; no product file.
**AC11** Backlog baseline quoted from `HEAD`; "Last Session" **replaced**, not appended; **Files Changed** table.
**AC12** `check:file-integrity` clean; counting gates twice, after session log and backlog both exist.

---

## 13. QA profile and verification plan

**Q4** — same justification as 739: this changes the classification logic of a gate that is wired CI-blocking, and
a false negative here is silent by construction.

1. Dirty manifest + backlog baseline.
2. `npm run build && npm start`; **3×** `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` → baseline union.
3. R1 census (≥3 runs); R2 rule drafted; R4 cost measured.
4. `--verify-gate` pre-fix 12/12, plus R6's new control shown **failing** under a deliberately naive rule.
5. Apply the fix.
6. `--verify-gate` ≥14 cases.
7. **3×** full sweeps → identity set diff vs. the baseline union (AC4).
8. R7 re-measurement of any survivor.
9. 725's plant → violations > 0 → restore → hash + clean porcelain.
10. `tsc`, `build`, `check:i18n`, `check:design-tokens:strict`.
11. Session log + backlog; counting gates last, twice.

---

## 14. Completion report contract

The census (all four survivors, ≥3 runs) · the inclusion rule with justified exclusions · the identity set diff ·
per-survivor genuineness proofs · the three control fixtures with round-trip transcripts · per-scenario `checked` ·
the cost measurement and caching decision · R7's re-measurement · OQ1–OQ4 dispositions · a **Files Changed**
table · the backlog baseline from `HEAD` · every command with its exit code. Evidence in
`.screenshots/task740-evidence/` (D6).

State plainly anything you could not run, and why.

---

## 15. Task quality gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` requires **zero** `cleared → blocked` transitions and a genuineness
proof attached to every remaining violation. A base of 0 with an unproven set does not qualify, and neither does a
0 bought by a rule that no longer keys on geometry.

If the census refutes §3.2/§3.3, report `BLOCKED` with the measurement. Sprint 54 has now produced two correct
`BLOCKED`/rejection outcomes and one shipped regression; the record is unambiguous about which is cheaper.
