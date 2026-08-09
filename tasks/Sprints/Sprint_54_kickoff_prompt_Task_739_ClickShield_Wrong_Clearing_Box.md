# Task 739 — `check-click-shield` computes its clearing offset from the wrong box

**Sprint 54 — Mobile bottom-nav overlay collision. Closes the sprint.**
**Status:** ⚠️ `REWORK REQUIRED` — attempt 1 rejected at review 2026-08-09. **QA profile:** `Q4`.

> ## ⚠️ REWORK 2026-08-09 — attempt 1 rejected. Read this before §4.
>
> **Attempt 2's executable brief is `Sprint_54_Task_739_rework_brief_attempt_2.md`** — narrowed scope,
> set-based acceptance, checkpoint deltas. This banner states *why*; that file states *what to do*.
>
> Attempt 1 replaced `ancRect` with `hit.getBoundingClientRect()`. **Do not land that diff.** It fixes the
> *overhang* case and breaks the *containment* case, and the net effect on a CI-blocking gate is worse:
> base **4 → 9**, `cleared:` detail lines **39 → 15**.
>
> **Proof it is a regression, from attempt 1's own evidence** (`.screenshots/task739-evidence/`):
> `FavoriteButton_control` at `(333,15 32x32)`, intercepted by `svg.lucide-menu`, reads
> `cleared: … @ scrollY=793` in `I1-baseline.log` and `blocked:` in `K3-sweep-after.log` — same candidate,
> same interceptor, ×4 locales, stable across 3 reruns. `svg.lucide-menu` is a 20px icon inside the 65px
> `.site-header`; clearing the icon's own box does not clear the header. Attribution to the known 723/724
> `FavoriteButton` defect is refuted by that before/after pair.
>
> **Why only 2 of 6 targets cleared:** §2's census records `re-lands on .fabLink` for **all six** rows, while
> `hit` varies (`.fabLink` 745 · `.navItem` 757 · `.fabLabel` 792). The element that blocks is the same in
> every case regardless of which one `elementFromPoint` returned. Targeting the interceptor therefore fixes
> only the two rows where the interceptor *happened to be* the blocker.
>
> ### Corrected C1 — the original wording was ambiguous and this is the orchestrator's error
>
> C1 said *"bounds what actually occludes the candidate **at the tested point**, not merely a box that
> contains it."* That phrasing licensed interceptor-only and pushed away from the ancestor. It should have
> read:
>
> > **C1 (corrected).** The geometry must bound everything scroll-invariant that can occlude the candidate
> > **at the offsets it generates** — not only what occludes it at the current scroll position. For a fixed
> > or sticky bar that is the bar's **extent**: its own rect unioned with the rects of descendants that
> > overflow it. Neither the ancestor's box alone (undershoots on overhang) nor the interceptor's box alone
> > (undershoots on containment) satisfies this.
>
> ### OQ2 is reopened, and its previous answer is falsified
>
> Attempt 1 answered *"kept at 2 … no evidence a third hypothesis would change any outcome."* Its own data
> refutes that: an offset generated from the ancestor's box clears the header cases, one generated from the
> system's extent clears all six footer cases. **Emitting hypotheses from more than one box is now required
> unless you can show a single box that satisfies corrected C1 in both directions.** Phase 2 already
> arbitrates (C3), so an extra hypothesis costs a recheck and cannot manufacture a false `cleared`.
>
> ### Two additional requirements
>
> **R12 — a containment control fixture.** R4's overhang fixtures were shaped so that the interceptor is a
> *superset* of its fixed ancestor, which is why they pass under a wrong fix. Add the mirror case: an
> interceptor strictly **smaller** than its fixed ancestor (a small icon inside a tall bar), where the
> candidate must still resolve `cleared`. Show it FAILING under attempt 1's diff — that is what makes it a
> control rather than decoration.
>
> **R13 — compare violation *sets*, not counts.** Attempt 1 reported "base is 9, not 0" without diffing the
> identities. Report added/removed violations by element + rect + interceptor. Any candidate that was
> `cleared` before and is `blocked` after is a regression and must be named as one, whatever else it may
> also be.
>
> **Keep from attempt 1:** the §2 census, the R2 blast radius, the OQ1 sticky measurement, the corrected
> comments, the plant round-trip, and the two overhang fixtures. All sound. Only the chosen box is wrong.
>
> **Not filed as follow-ups:** the three residual "findings" attempt 1 named. (a) and (c) are the corrected-C1
> defect itself; (b) is the regression above. Reserving numbers for artifacts of a rejected diff would add
> registry noise for work that disappears when the box is right.
**Companions:** `Sprint_54_Task_739_execution_contract.md` · `Sprint_54_Task_739_rule_compliance_ledger.md`.

> **Read the correction banner at the top of `Sprint_54_kickoff_prompt_Task_737_FooterSocialLinks_Under_FAB.md`
> before this file.** 737 measured the app and found **no product defect**. The 6 violations Task 729 reported are
> false positives produced by this gate. **This task does not touch the application.** If you find yourself editing
> `FooterView.module.css`, `MobileBottomNavView.module.css` or `layout.tsx`, you are solving 737's refuted problem.

> **Ordering is load-bearing** (inherited from 737). Task 727's `click-shield` CI job is blocking but cannot run
> until the owner adds the Supabase repository secrets. Until 739 lands, that job would fail every PR on these
> false positives. **739 lands before the secrets are added.** That is why it is P1.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** correctness fix inside a CI-blocking gate. No product surface, no rendered UI
change, no visual delta anywhere — a passing run of the visual matrix is a precondition, not a deliverable.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

The gate's transient/permanent classifier generates candidate scroll offsets from the wrong rectangle. Make it
generate them from geometry that actually occludes the candidate, so a scroll-clearable control stops being
reported as a permanent violation — **without** widening the gate's tolerance for genuine occlusion.

Those two halves are one objective, not two. A change that achieves the first and loses the second is a
regression dressed as a fix, and §5 A2 says so in advance.

---

## 3. Verified context — read from the repository 2026-08-09

Every line/number below was read from source by the orchestrator on 2026-08-09. **R1 still requires you to
re-measure**: 737 exists because a kickoff's arithmetic was internally consistent and pointed at the wrong box.

### 3.1 The call site — `scripts/check-click-shield.mjs:444-447`

```js
const fixedOrStickyAncestor = nearestFixedOrStickyAncestorOf(hit);
if (fixedOrStickyAncestor) {
  const ancRect = fixedOrStickyAncestor.getBoundingClientRect();
  const offsets = computeClearingOffsetCandidates(rect, ancRect, maxScrollY);
```

`rect` is the **candidate's** box. `ancRect` is the **fixed/sticky ancestor's** box. `hit` — the element the
browser reports as actually receiving the click — is passed to `nearestFixedOrStickyAncestorOf()` and then
discarded. Its own geometry never reaches the generator.

### 3.2 The generator — `:360-368`

```js
function computeClearingOffsetCandidates(elRect, ancRect, maxScrollY) {
  const elDocTop = elRect.top + window.scrollY;
  const elDocBottom = elRect.bottom + window.scrollY;
  const offsets = [];
  const sClearBelow = elDocBottom - ancRect.top;
  if (sClearBelow >= 0 && sClearBelow <= maxScrollY) offsets.push(Math.min(maxScrollY, Math.ceil(sClearBelow) + 1));
  const sClearAbove = elDocTop - ancRect.bottom;
  if (sClearAbove >= 0 && sClearAbove <= maxScrollY) offsets.push(Math.max(0, Math.floor(sClearAbove) - 1));
  return offsets;
}
```

Both arms solve for the scroll position at which the candidate's edge meets **`ancRect`'s** edge.

### 3.3 Why an ancestor is used at all — and why that reason does not require the ancestor's *box*

`:370-391` (Task 729) explains the ancestor walk: the classification needs a **scroll-invariant** reference,
because the arithmetic treats the occluder's viewport rect as constant while `scrollY` varies. A `position:fixed`
ancestor supplies that invariance; a `position:relative` wrapper does not, which is the bug 729 fixed.

That reasoning justifies **finding** the fixed/sticky ancestor. It does not justify **measuring** it. Any
descendant of a `position:fixed` ancestor is equally scroll-invariant, and the descendant is what occludes.
729 was right about which ancestor to find and inherited the false premise that the ancestor's box is the
occluding box.

### 3.4 The overhang, structurally verified

- `src/components/layout/MobileBottomNavView.tsx:34-55` — the `<Link className={styles.fabLink}>` is a **child**
  of the `<Box component="nav" className={styles.navBar}>`. Confirmed in source; not inferred.
- `MobileBottomNavView.module.css:50-55` — `.navBar { position: fixed; bottom: 0; z-index: 30 }`.
- `:68-76` — `.fabLink { flex: 1; …; margin-top: calc(var(--space-3) * -1) }` = **−12px**. A negative margin on a
  flex item pulls it above the container's content box; nothing sets `overflow: hidden` on `.navBar`, so it
  paints and hit-tests outside its parent's rect.
- Measured 2026-08-09: `.navBar` top **756**, `.fabLink` top **745** — the interceptor begins **~11px above** the
  box the generator measures. `sClearBelow` therefore stops ~11px short, phase 2 re-lands on the FAB, no offset
  clears, and the candidate is reported **permanent**.

### 3.5 Phase 2 is the arbiter, and must stay that way — `:495-539`

Every candidate offset is re-tested by an actual `window.scrollTo` + `elementFromPoint` in the live page. Only
`recheck.cleared` promotes a candidate to `cleared`; otherwise `:538` pushes a violation with
`no reachable scroll offset cleared it`. **The generator produces hypotheses; phase 2 decides.** This is the
property that makes a more generous generator safe and a more trusting one dangerous.

### 3.6 The harness

`VIEWPORTS` = `mobile-320` (320×812), `mobile-375` (375×812), `mobile-390` (390×844), `desktop-1024` (1024×768).
`LOCALES` = `sq, en, uk, it`. 16 cells per scenario × 3 scenarios (base · `AuthSheet` Drawer · `LightboxView`
Modal) = **48 cells**. Task 729's landed baseline: `checked=1772`, `excluded=40`, `cleared=45`,
**`violations=6`** (`Facebook`/`Instagram` in `FooterView`, mobile-375, sq/en/it — not uk, not 320/390).

### 3.7 The self-test — `--verify-gate`, 8 cases today

`/violation` (FAIL) · `/clean` (PASS) · `/overlay-exempt` (PASS) · `/transient` (PASS, `cleared>0`) ·
`/permanent` (FAIL) · `/dialog-violation` (FAIL) · `/dialog-clean` (PASS) · `/alertdialog-violation` (FAIL).
Note what is **absent**: every fixture's interceptor is a `<span>` that exactly fills its fixed bar
(`width:100%;height:100%`). **No fixture reproduces an interceptor that overhangs its fixed ancestor.** That
absence is why this defect survived 725, 727 and 729 — the self-test could not express it.

### 3.8 The strongest available comparator — Task 725's plant

Removing `padding-bottom` from `FooterView.module.css` produced **24 violations against a 6-violation baseline**
(729 F2), restored to hash `d2c6588aec…` with clean porcelain. That plant makes the links *genuinely* unreachable.
It is the control that proves this fix did not simply buy silence.

### 3.9 Landed work this task must not disturb

- **Task 727** — `N6_EXEMPT_PREDICATE_BODY` written once and rebuilt via `new Function` at **both** hit-test
  sites (`:439`, `:500`), so the direct path and the scroll-recheck path agree by construction.
- **Task 729** — `nearestFixedOrStickyAncestorOf()` (`:383-391`), the band scan, and unconditional `excluded=N`
  reporting.
- **Task 725** — the transient/permanent semantics themselves: a candidate with a reachable clearing offset is
  not a violation; one without is.
- `describe()`'s `nearestPositionedAncestor` (`:337-348`) is **informational report content**, not classifier
  input. Leave it keyed on `nearestPositionedAncestorOf`.

---

## 4. Requirements — one active route

**R1 — Census before edit; do not inherit §3's numbers.** For each of the 6 reported violations, dump: candidate
rect, `hit` (`describe()` output), the fixed/sticky ancestor's rect, the offsets `computeClearingOffsetCandidates`
returns, and phase 2's per-offset result. Prove the undershoot numerically. If the measured cause is not the
overhang, **stop and report** — §5 OQ4.

**R2 — The blast radius is part of the census.** Across all 48 cells, count the candidates whose `hit` is **not**
the fixed/sticky ancestor itself, and of those, how many have a `hit` rect that extends beyond the ancestor's.
This kickoff assumes the answer is small. If it is large, the fix's risk profile changes and you say so before
editing, not after.

**R3 — The contract the fix must satisfy.** The mechanism is deliberately **not** specified here — choosing it
from measurement is the task. Whatever you implement must satisfy all five:

| | Contract clause |
|---|---|
| **C1** | The geometry used to generate candidate offsets must bound what actually occludes the candidate at the tested point, not merely a box that contains it. |
| **C2** | That geometry must be scroll-invariant across the offsets it generates, or its outputs must be treated as hypotheses only. State which, and why it holds. |
| **C3** | Phase 2 remains the sole arbiter. No candidate may be reported `cleared` without a real scroll + re-hit-test. Never promote a candidate on computed geometry alone. |
| **C4** | The direct path (`:439`) and the scroll-recheck path (`:500`) must not diverge — 727 R2's standard: agreement **by construction**, not by resemblance. |
| **C5** | Generosity is bounded. A candidate with no reachable clearing offset must still be reported a violation. `/permanent` staying FAIL is the minimum proof; §5 A2 names the rest. |

**R4 — New self-test fixtures, in the same task.** Add at least two to `--verify-gate`: the **overhang shape**
(fixed bar with a child extending above it, tall page → must resolve `cleared>0`, `violations=0`) and its
**permanent twin** (same shape, page height == viewport → must still FAIL). Assert the pre-fix gate fails the
first fixture and the post-fix gate passes it — a planted-violation round trip for this defect specifically.
A fixture that passes both before and after the fix proves nothing and does not count.

**R5 — D32 comparator discipline.** The 6 pre-fix violations are the comparator. Capture the full pre-fix
transcript before touching the file.

**R6 — No application file in the write set.** Not `FooterView.module.css`, not `MobileBottomNavView.*`, not
`layout.tsx`. 737 proved the app is correct.

**R7 — No CI softening.** No `continue-on-error`, no route/scenario skip, no threshold that lets a red run pass.
The Sprint 52 lesson stands: a blocking gate that silently never runs is the defect, not the cure.

**R8 — Correct the comments the fix falsifies.** `:370-391` and any other comment asserting the ancestor's box is
the occluding box must be corrected in the same commit. Name Task 739 and the date, as 729 and 733 did.

**R9 — Backlog baseline** read from `git show HEAD:docs/backlog.md | wc -l` **before** your first edit. Quote it.

**R10 — Dirty-worktree manifest** before any write; classify every pre-existing path; witnesses before and after.

**R11 — Evidence is local-only (D6):** `.screenshots/task739-evidence/`. It must not appear in the diff.

---

## 5. Assumptions and open questions

**A1 — The worktree may start dirty.** Manifest it; do not stage anything you did not author.

**A2 — Pre-declared false success, and it is the likeliest outcome of a careless fix.**
**`6 → 0` is trivially purchasable.** Widen the offset generator enough and phase 2 will eventually find *some*
scroll position for almost anything; the gate goes quiet and looks fixed. **`6 → 0` is therefore not the proof.**
The deliverable is `6 → 0` **simultaneously with** all of:

1. `--verify-gate` green on every case **including `/permanent` still FAIL**, plus R4's new permanent twin FAIL.
2. Task 725's plant still producing violations against the **new 0 baseline**, restored to `d2c6588aec…` with
   clean porcelain.
3. `checked` and `excluded` unmoved from 729's `1772` / `40` — this fix changes classification, not coverage. A
   moved `checked` means you changed something you did not intend to.
4. `cleared` rising by **exactly** the number of newly-cleared candidates, each named. `45 → 51` is the expected
   shape; report what you measure, not what this line predicts.

**A3 — A second false success: a clean run that measured nothing.** 727's A2 guard exists because a scenario
whose trigger fails yields `checked: 0` and a silent pass. Report per-scenario `checked` for all three.

**OQ1 — `position: sticky` is not unconditionally scroll-invariant.** A sticky element moves with the document
until it sticks, so C2 may not hold for sticky ancestors the way it holds for fixed ones. Measure whether this is
reachable in the current app. Fix in scope **only** if it is cheap and provable; otherwise name it and file it.
Do not silently assume sticky and fixed behave alike — that assumption is the shape of this very bug.

**OQ2 — How many offsets should the generator emit?** Two arms exist today. Since phase 2 arbitrates empirically,
more hypotheses may be strictly safer than a single more-precise one. Decide from evidence and record the
reasoning; either answer is acceptable, an unexamined one is not.

**OQ3 — `nearestPositionedAncestorOf` (725) may end up with `describe()` as its only consumer.** That is fine.
Do not repurpose or delete it silently; state its status.

**OQ4 — If R1's census contradicts §3.4**, this kickoff is wrong the way 737's was. Report `BLOCKED` with the
measurement. That outcome is a success for the process, not a failure of the task.

---

## 6. Pre-read rule bundle

`CLAUDE.md` (Git policy · "the executor's report is not proof") · `docs/ai-behavior.md` → Commit Rules, Backlog &
Session Log Rules · `docs/qa-profiles.md` → **Q4** · `docs/orchestrator-procedures.md` → Git policy ·
`tasks/Sprints/Sprint_54_MobileBottomNav_Overlay_Collision.md` · the 737 kickoff **including its correction
banner** · `docs/sessions/2026-08-09-task729-below-fold-blind-spot.md` ·
`docs/sessions/2026-08-09-task737-footer-social-links-under-fab.md` · `docs/backlog-archive.md` rows for 725, 727,
729, 737 (729's row carries a **retraction** — read it, not the retracted text).

---

## 7. Scope

**7.1** `scripts/check-click-shield.mjs` — the clearing-offset geometry, its call site, the new self-test
fixtures and their cases, and the comments R8 falsifies.
**7.2** `docs/backlog.md` · `docs/sessions/2026-08-09-task739-*.md`.
**7.3** `docs/storybook-governance.md` or `docs/qa-profiles.md` **only** if a statement there is made false by the
fix. Quote the falsified sentence.
**7.4 Cost:** one `npm run build` + `npm start` + a 48-cell sweep (~90s per 729's measurement) plus
`--verify-gate` (no server). If a full sweep exceeds **3×** 729's recorded 87s, stop and report before iterating.

---

## 8. Out of scope

- **Every application file.** See R6.
- **Task 738** — the horizontal-scroll blind spot (the residual 40 `excluded`). Different mechanism; already filed.
- Widening scenario coverage, adding routes, adding viewports or locales.
- Refactoring `hitTestPage` beyond what C1–C5 require.
- Wiring the CI job differently, or touching `.github/workflows/*` at all.
- Adding a Storybook story.

---

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Offset generation | Solves against the fixed/sticky **ancestor's** rect (`:446-447`) | Solves against geometry that actually occludes the candidate (C1) |
| Overhanging interceptor | Undershoots by the overhang; phase 2 re-lands on the interceptor | Clears it, or reports a violation for a reason phase 2 actually measured |
| The 6 base-scenario violations | Reported permanent | **0** — with A2's four simultaneous proofs |
| Genuine occlusion | Correctly reported | Still correctly reported (C5) |
| Self-test | 8 cases; none expresses an overhanging interceptor | ≥10; the overhang shape and its permanent twin both present, both round-tripped |

---

## 10. Implementation requirements

**10.1** One logical change. Geometry fix + its fixtures + falsified comments — nothing else.
**10.2** No new dependency, no new npm script, no new env var.
**10.3** Both `page.evaluate` closures must keep receiving their predicate from the single
`N6_EXEMPT_PREDICATE_BODY` source string (727). If your fix needs shared geometry in both, use the same
single-source pattern rather than a second copy.
**10.4** Serialization constraint, stated so you do not rediscover it: Playwright serializes each `page.evaluate`
callback independently, so a Node-side helper is unreachable inside the browser context. That is why 727 used
`new Function` on a module constant.
**10.5** `behavior: 'instant'` on every programmatic scroll — the project's `<html>` carries
`scroll-behavior: smooth`, and a smooth scroll makes a synchronous re-read capture the pre-scroll rect
(`:501-505`).

---

## 11. Positive and negative flows

**Positive**
1. Base scenario, mobile-375, sq/en/it — the `FooterView` social links resolve `cleared` with a real offset.
2. `/transient` self-test still resolves `cleared>0`.
3. R4's overhang fixture resolves `cleared>0` after the fix, and is shown failing before it.
4. Drawer and Modal scenarios unchanged: 16/16 cells, 0 interceptions each.

**Negative**
5. `/permanent` still FAILs.
6. R4's permanent twin FAILs.
7. `/violation`, `/dialog-violation`, `/alertdialog-violation` still FAIL — the N6 rule is untouched.
8. 725's plant still produces violations against the new baseline.
9. A candidate whose only computed offset exceeds `maxScrollY` is still a violation, not silently dropped.

---

## 12. Acceptance criteria

**AC1** R1's census persisted, with the undershoot proven numerically per violation.
**AC2** R2's blast-radius count reported for all 48 cells.
**AC3** The fix satisfies C1–C5, each addressed explicitly by name in the report.
**AC4** Base scenario **6 → 0**, as two full transcripts.
**AC5** A2's four simultaneous proofs, each with its own artifact.
**AC6** ≥2 new self-test fixtures, round-tripped (pre-fix FAIL → post-fix PASS for the transient one), and
`--verify-gate` green on **every** case.
**AC7** Drawer and Modal scenarios shown unchanged, not assumed.
**AC8** OQ1–OQ3 each answered with a disposition; OQ4 answered by the census.
**AC9** R8's comment corrections present, naming Task 739 and the date.
**AC10** `tsc`, `npm run build`, `check:i18n`, `check:design-tokens:strict` exit 0. No product file in the diff.
**AC11** Backlog baseline quoted from `git show HEAD:docs/backlog.md | wc -l`; "Last Session" **replaced**, not
appended; session log carries a **Files Changed** table.
**AC12** `check:file-integrity` clean; counting gates run twice, after the session log and backlog both exist.

---

## 13. QA profile and verification plan

**Q4 — CI-blocking gate change with planted-violation proof.** Promoted above 729's Q3 for a concrete reason,
per `qa-profiles.md`'s rule against unjustified promotion: 729 widened *coverage* inside a not-yet-blocking gate,
whereas this task changes the **classification logic** of a gate that is now wired blocking (727), and a false
negative here is silent by construction.

1. Dirty manifest + backlog baseline.
2. `npm run build && npm start`; `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` → pre-fix transcript.
3. R1 census; R2 blast radius.
4. `npm run check:click-shield:verify` → pre-fix 8/8, plus the new transient fixture shown **failing**.
5. Apply the fix.
6. `--verify-gate` → all cases including the new ones.
7. Full 48-cell sweep → post-fix transcript; reconcile `checked`/`excluded`/`cleared`/`violations` against A2.
8. Task 725's plant → violations > 0 → restore → `d2c6588aec…` + clean porcelain.
9. `tsc`, `build`, `check:i18n`, `check:design-tokens:strict`.
10. Session log + backlog; counting gates last, twice.

---

## 14. Completion report contract

Report: the census table (per violation: candidate rect · interceptor rect · ancestor rect · generated offsets ·
phase-2 result); the blast-radius count; the chosen mechanism with C1–C5 addressed by name; the four A2 proofs;
the new fixtures with their round-trip transcripts; per-scenario `checked` for all three scenarios; OQ1–OQ4
dispositions; a **Files Changed** table; the backlog baseline quoted from `HEAD`; and every command with its
exit code. Evidence stays in `.screenshots/task739-evidence/` (D6).

State plainly anything you could not run, and why. An unrun check reported as passing is the failure this sprint
was opened to end.

---

## 15. Task quality gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when AC1–AC12 each have a persisted artifact **and** A2's four
proofs are shown together. A green sweep on its own does not qualify — a gate that stopped complaining is the
exact failure mode this sprint has now found four times, each one layer further inside the tooling.

If the census refutes §3.4, report `BLOCKED` with the measurement and stop. 737 did precisely that, and it was
the correct outcome.
