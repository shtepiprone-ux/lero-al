# Task 729 — The click-shield gate never looks below the fold

**Kickoff:** `tasks/Sprints/Sprint_54_kickoff_prompt_Task_729_BelowFold_Blind_Spot.md`, with
`Sprint_54_Task_729_execution_contract.md` and `Sprint_54_Task_729_rule_compliance_ledger.md`.
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
**Evidence root:** `.screenshots/task729-evidence/` (gitignored, local-only, D6).

---

## 0. Dirty-worktree manifest and backlog baseline (Checkpoint 0, A1, R11)

`git status --porcelain` at task start: **empty — clean worktree.** No pre-existing modified paths to
classify or witness. `git show HEAD:docs/backlog.md | wc -l` → **88** (baseline, taken before the
first edit). `.screenshots/task729-evidence/J0-status.txt`.

FooterView pre-plant hash re-derived per A3: `git hash-object src/components/layout/FooterView.module.css`
→ `d2c6588aec6bba3c155ea2b68b4f7819c6139d9d` — matches 725's recorded value exactly; the file has not
changed since.

---

## 1. Pre-change baseline (Checkpoint 1)

`npm run build` → exit 0 (`I1-build.log`). `npm start`, ready after 1 attempt. Full 3-scenario sweep
(`BASE_URL=http://127.0.0.1:3000 npm run check:click-shield`, `I1-baseline.log`):

```
Scenarios: 3  Cells: 48  Elements checked: 912  Interceptions: 0  Cleared (transient): 4  Empty-candidate cells: 0
[base] cells=16  checked=208  violations=0
[drawer] cells=16  checked=324  violations=0
[modal] cells=16  checked=380  violations=0
EXIT_CODE=0
WALL_CLOCK_SECONDS=90
```

Identical shape to Task 727's landed evidence (208/324/380 checked, 0 violations) — reproducible, not
drifted.

---

## 2. Census — R1 (Checkpoint 2)

Instrumented `scripts/check-click-shield.mjs`'s viewport-exclusion branch (previously a bare
`continue`) to record identifying detail (tag, class, document-space position, exclusion reason) for
every candidate whose centre falls outside the viewport, and added an optional
`CLICK_SHIELD_CENSUS_FILE` env var that dumps the full per-scenario × per-cell detail to JSON. Ran
against the same live build as §1 (`I2-census.json`, `I2-census-run.log`):

```
Elements checked: 912  Excluded (below/above-fold): 900  Empty-candidate cells: 0
[base] checked=208  excluded=348
[drawer] checked=324  excluded=348
[modal] checked=380  excluded=204
```

**A2 check:** not zero anywhere — instrumentation is sound. **Total excluded: 900 of 1812 total
candidates (912+900)** — stated as one number, per §14 contract.

Breakdown by reason: `below-fold` 860, `right-of-viewport` 40 (all inside the Modal scenario's
lightbox thumbnail strip — a nested horizontally-scrollable container, not the window), `above-fold`
0, `left-of-viewport` 0. Breakdown by element (top classes): `a.FooterView_footerLink` 348,
`button.mantine-focus-auto` 232, `a.listing-card` 96, `a.FooterView_socialLink` 96,
`a.mantine-focus-auto` 80, `a.FooterView_brandLink` 48 — every one a real, user-reachable interactive
control, none decorative or intentionally off-canvas. Full reasoning: `K1-decision.md`.

---

## 3. §7.3 branch decision — R3 (Checkpoint 3)

**Branch selected: second bullet — real controls are excluded, coverage must close.** Full reasoning,
including the rejected per-candidate alternative and its cost comparison, is in `K1-decision.md`
(required artifact, not restated here). Summary: a **vertical band scan** — re-running the existing
hit-test loop at each of a handful of `window.innerHeight`-sized scroll bands from 0 to the document's
measured `maxScrollY`, deduping already-resolved candidates — costs O(page height ÷ viewport height),
not O(excluded candidates). The rejected alternative (scroll to each of the ~900 excluded candidates
individually, reusing phase 2's existing per-candidate mechanism) would cost O(excluded candidates)
instead and was not built, since the cheaper mechanism already satisfied §7.3 with no cost tradeoff to
weigh.

**Horizontal exclusions (the 40 `right-of-viewport` lightbox thumbnails) are explicitly out of
scope** — a nested container's own horizontal scroll, not `window.scrollTo`, which this mechanism
cannot reach. Named as an unaddressed, structurally different gap, not folded into this fix.

---

## 4. R2 — the count ships in normal output, unconditionally (Checkpoint 4)

Every cell line and the run summary now print `excluded(below/above-fold)=N` next to `checked=N`, with
no flag required (`K2-output-final.log`):

```
Scenarios: 3  Cells: 48  Elements checked: 1772  Excluded (below/above-fold): 40  Interceptions: 6  Cleared (transient): 45
[base] cells=16  checked=556  excluded=0  violations=6
[drawer] cells=16  checked=672  excluded=0  violations=0
[modal] cells=16  checked=544  excluded=40  violations=0
```

`checked` rose from 912 → 1772 (the 900 previously-excluded candidates, minus the 40 structurally
unreachable ones, are now genuinely hit-tested); the remaining `excluded=40` is honestly reported
rather than silently absent.

---

## 5. A secondary defect the widening exposed, found and fixed in-scope

Running the band scan against the live app first produced **21** violations in the `base` scenario —
none pre-existing. Direct DOM inspection (a throwaway Playwright script, not shipped) walked the full
ancestor chain of several interceptors and found 15 of the 21 were **false positives**: the existing
`nearestPositionedAncestorOf()` helper (Task 725) returns the FIRST non-static ancestor, which for a
Mantine `ActionIcon`/`Button` root is routinely `position: relative` (Mantine's own default styling,
unrelated to layout) sitting BETWEEN the interceptor and the genuinely fixed/sticky ancestor
(`.site-header { position: sticky }`, confirmed in `src/components/layout/HeaderView.module.css:33`;
`.mobile-bottom-nav { position: fixed }`) one or more levels further up. That misclassified a real,
scroll-clearable header/nav collision as a permanent violation.

This bug pre-dates Task 729 (introduced by Task 725) but was never exercised until the band scan
tested candidates near that exact ancestor shape for the first time — below-fold coverage was the
only thing that could have hit it. Fixed by adding `nearestFixedOrStickyAncestorOf()`, which walks
past any number of non-fixed/sticky ancestors instead of stopping at the first one; used only in the
transient/permanent classification branch. **Does not touch Task 727's N6 predicate, its two call
sites, the three scenarios, or the dialog-open guard** — a different code path (§10.3 / R6). After the
fix: 21 → 6 violations; 15 correctly reclassified as transient and scroll-cleared
(`Cleared (transient)` rose 30 → 45). Self-test (`K7-verify-after-classification-fix.log`) still
passes 8/8 after this change.

---

## 6. R7 — the remaining 6 are a real product finding, not fixed here

The final 6 violations are reproducible, per-candidate confirmed ("no reachable scroll offset cleared
it") **permanent** occlusions — not a gate artifact:

> `FooterView`'s social links ("Facebook", "Instagram") are permanently covered by
> `MobileBottomNavView`'s floating action button/label at `mobile-375` (812px-tall viewport), in the
> `sq`, `en`, and `it` locales — **not** `uk`, and **not** at `mobile-320` or `mobile-390`. The footer
> sits at the document's trailing edge; there is no further scroll room to clear the FAB's band at
> that exact combination of viewport height and locale-dependent footer height (locale text-length
> differences plausibly shift the footer's total height just enough to change whether `maxScrollY`
> clears the FAB — not root-caused further here, out of scope).

Reproduced identically across three independent runs (`K2-output-final.log`, `K3-base-rerun.log`, and
the drawer/modal-scenario-agnostic base rerun) — not a flake. This is a **new, previously-undetected
production click-shield defect**, exposed only because this task's widened coverage now tests
below-fold footer content. Per R7/§7.5, it is **named and attributed here, not fixed**: it needs its
own task under an open sprint (none of Sprint 54's existing scope covers a `FooterView` fix), reserved
by the orchestrator/owner, not this executor.

**This means `check:click-shield`'s `base` scenario — part of the CI-blocking job Task 727 wired up —
will exit non-zero until that follow-up lands.** Flagged explicitly for Opus's review: shipping this
diff as-is makes `click-shield` (blocking, no `continue-on-error`) fail on the base scenario for every
PR until the FooterView/MobileBottomNavView collision is fixed separately. The negative-flow table in
the kickoff (§7.3, "Widened coverage floods the gate with new violations") explicitly anticipates
exactly this outcome and calls it a finding to report before proceeding, not a reason to suppress or
narrow the widened coverage — so the fix ships and the defect is reported, per that rule.

---

## 7. R4/R5 — the FooterView plant, reused from 725, now produces a result (Checkpoints 6-7)

Removed `src/components/layout/FooterView.module.css`'s `padding-bottom: var(--space-14)` (the mobile
nav-clearance rule). Rebuilt (`K4-footer-plant-build.log`, exit 0), restarted, ran the base scenario:

```
[base] cells=16  checked=556  excluded=0  violations=24
```

**24 violations, up from the pre-plant 6** — a clear, measurable effect. Stated against 725's recorded
result: 725's session log (verbatim, kickoff §3.2) reports this identical plant "produced **zero
change** in the gate's output" because the footer's content was never a hit-test candidate under the
old, scrollY=0-only enumeration. Under this task's widened coverage, the same plant now moves the
violation count from 6 → 24 (`K4-footer-plant.log`).

Restored the file byte-identical. `git hash-object src/components/layout/FooterView.module.css` →
`d2c6588aec6bba3c155ea2b68b4f7819c6139d9d` — matches the pre-plant value exactly. `git status
--porcelain -- src/components/layout/FooterView.module.css` → empty (absent from the list). Both
captured after the final gate run (`K5-restore.txt`). Rebuilt again with the restored file
(`K5-restore-build.log`, exit 0) before all further evidence.

---

## 8. R6 — Task 727's work is intact (Checkpoint 5)

The N6 contextual predicate (`N6_EXEMPT_PREDICATE_BODY`), its two reconstruction call sites, the
three scenarios (`base`/`drawer`/`modal`), and `openScenarioOverlay`'s dialog-open guard are all
byte-for-byte unchanged — the diff touches only the hit-test enumeration/scan and the
ancestor-classification helper (§5), never this logic. `npm run check:click-shield:verify` (self-test,
CI-safe, no server) passes 8/8 after every edit in this task
(`K7-verify-after-instrumentation.log`, `K7-verify-after-bandscan.log`,
`K7-verify-after-classification-fix.log` — all identical, all `EXIT_CODE=0`). Full 3-scenario rerun
after final restoration (`K3-base-rerun.log`) reproduces §4's numbers exactly: `checked=1772
excluded=40 violations=6`, drawer/modal both 0 violations — Task 727's Drawer/Modal scenarios remain
clean.

---

## 9. R8 — wall-clock, before/after, same machine (Checkpoint 8)

`K6-timing.txt`:

```
BEFORE: 90s (checked=912, no exclusion instrumentation)
AFTER:  87s (checked=1772, excluded=40, violations=6, cleared=45)
DELTA:  -3s — flat, no material slowdown.
```

§7.3's third bullet (escalate if the fix materially slows the blocking job) is **not triggered.**

---

## 10. R9/R10 — standing gates

- `npm run check:click-shield:verify` — exit 0 (§8).
- `npx tsc --noEmit` — exit 0, no output (`K9-tsc.log`).
- `npm run check:i18n` — exit 0, all 4 locales 2218 keys, no raw-enum leaks (`K9-i18n.log`).
- `npm run build` (final, post-restoration) — exit 0 (`K5-restore-build.log`).

---

## 11. R11 — counting gates, two passes

**Pass 1** (before this session log/backlog existed): `npm run check:file-integrity` → 1 file checked
(only `scripts/check-click-shield.mjs` was dirty at that point), PASSED, exit 0
(`K10-file-integrity-pass1.log`). `npm run check:mojibake` → 2132 files scanned, 0 artifacts, exit 0
(`K10-mojibake-pass1.log`).

**Pass 2** (after this session log and the backlog update exist): `check:file-integrity` → 3 files
(script + backlog + this session log), PASSED, exit 0 (`K10-file-integrity-pass2.log`) — count
difference from pass 1 (1→3) explained by exactly those two new/changed docs files.
`check:mojibake` → 2133 files (2132→2133, this session log), 0 artifacts, exit 0
(`K10-mojibake-pass2.log`).

Backlog baseline was taken from `git show HEAD:docs/backlog.md | wc -l` = **88**, before the first
edit (§0), per the 717/721/722 corollary.

---

## 12. Files Changed

| File | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | R1/R2: instrument and report the below/above-fold exclusion count. R3: close the coverage gap with an O(bands) vertical scan. §5: fix the pre-existing (Task 725) ancestor-classification bug the widening exposed, isolated to the transient/permanent branch — Task 727's N6 predicate/scenarios/guard untouched. |
| `docs/backlog.md` | Last-Session block replaced (not appended); Sprint 54 and Task 729 registry rows updated. |
| `docs/sessions/2026-08-09-task729-below-fold-blind-spot.md` | This session log. |

`src/components/layout/FooterView.module.css` was touched only as a reverted plant (§7) — restored
byte-identical, confirmed absent from `git status --porcelain`.

---

## 13. Acceptance-criteria self-audit

| AC | Evidence | Result |
|---|---|---|
| AC1 [R1] | `I2-census.json`, `I2-census-run.log` | Met — 900 excluded, per-cell detail persisted, total stated as one number |
| AC2 [R2] | `K2-output-final.log` | Met — skipped count in every run's normal output, no flag |
| AC3 [R3] | `K1-decision.md` | Met — §7.3 branch cited to the census, rejected alternative recorded |
| AC4 [R4] | `K4-footer-plant.log` vs 725's "zero change" | Met — 6 → 24 violations |
| AC5 [R5] | `K5-restore.txt` | Met — hash matches, path absent from porcelain |
| AC6 [R6] | `K3-base-rerun.log`, `K7-verify-after-classification-fix.log` | Met — 727's predicate/scenarios/guard unchanged, self-test 8/8 |
| AC7 [R7] | §6 above | Met — named, attributed, reserved; not fixed here |
| AC8 [R8] | `K6-timing.txt` | Met — 90s → 87s, no escalation triggered |
| AC9 [R10] | `K9-tsc.log`, `K5-restore-build.log` | Met — both exit 0 |
| AC10 [R11] | §11 above + §0 | Met — two counting passes, baseline quoted pre-edit |

---

## 14. Assumptions, deviations, and limitations

- **Deviation from the kickoff's literal "unchanged base verdicts" phrasing (R9/checkpoint 5):** the
  live `base` scenario's overall pass/fail DID change (0 → 6 violations), because the widened coverage
  correctly found a real, previously-invisible defect (§6). The **previously-tested 208 candidates**
  remain verdict-identical (§8, confirmed by the `checked=208→556` delta matching exactly the newly
  reachable candidate count). Read "unchanged" as protecting existing coverage, not as forbidding the
  new coverage from finding anything — the alternative reading directly contradicts R7 and the
  kickoff's own pre-declared "flood of new violations" negative flow (§7.3negative-flow table).
- The ancestor-classification fix (§5) was not scoped by the kickoff in advance — it was discovered
  as a blocking prerequisite for R3's coverage-widening to produce correct (not false-positive)
  results, and is confined to the transient/permanent helper, not Task 727's protected surface.
- Root cause of the locale/viewport asymmetry in §6's finding (sq/en/it @375 but not uk, not
  320/390) was not investigated further — flagged as a question for whoever picks up the follow-up
  task.
- `BACKLOG LIMIT BREACH`: `docs/backlog.md` is now **92 lines** (baseline 88; the "~80" soft target
  was already exceeded before this task). The Task 729 registry row was condensed from a long
  paragraph to a short pointer at this session log to minimize further growth, but net line count
  still rose. Flagged for Opus consolidation, not resolved here.

---

## 15. Opus handoff

- Evidence root: `.screenshots/task729-evidence/` (local-only, D6; 26 artifacts, indexed above by
  checkpoint).
- **Primary question for review:** §6's finding means the CI-blocking `click-shield` job's `base`
  scenario will fail on every PR until a follow-up `FooterView`/`MobileBottomNavView` fix lands. Is
  this diff mergeable as-is (accepting CI redness until the follow-up lands), or should the follow-up
  be scoped and ready before this merges? This is a product/velocity call outside this executor's
  authority.
- Please verify independently: the ancestor-classification fix (§5) doesn't quietly change behavior
  for any of Task 727's three scenarios beyond what §8's rerun shows (self-test + live rerun both
  clean for drawer/modal).
- Please reserve a task number under an appropriate open sprint for §6's finding (FooterView social
  links vs. MobileBottomNavView FAB, mobile-375, sq/en/it).
- The 40 `right-of-viewport` lightbox-thumbnail exclusions (§3) are a second, unaddressed, structurally
  different gap (nested container horizontal scroll) — worth its own reservation if in scope for a
  future sprint.
