# Task 737 — Footer social links under the bottom-nav FAB

**Kickoff:** `tasks/Sprints/Sprint_54_kickoff_prompt_Task_737_FooterSocialLinks_Under_FAB.md`, with
`Sprint_54_Task_737_execution_contract.md` and `Sprint_54_Task_737_rule_compliance_ledger.md`.
**Status:** `BLOCKED` — R1's live measurement contradicts the kickoff's arithmetic; no existing-token
clearance change can close the gate without either a visible regression or reliance on
locale-content-length luck. Reported per R2's own `BLOCKED — CANONICAL STYLE DECISION REQUIRED`
clause and OQ1's re-scope clause, both anticipated in the kickoff.
**Evidence root:** `.screenshots/task737-evidence/` (gitignored, local-only, D6).

---

## 0. Dirty-worktree manifest and backlog baseline (Checkpoint 0, A1, R11)

`git status --porcelain` at task start: **empty — clean worktree** (`J0-status.txt`). No pre-existing
modified paths. `git show HEAD:docs/backlog.md | wc -l` → **89** (baseline, taken before the first
edit; confirmed again via `wc -l docs/backlog.md` on the still-unedited file at write-up time — same
89).

---

## 1. Pre-fix baseline (Checkpoint 1)

`npm run build` → exit 0 (`I0-prefix-build.log`). `npm start`, ready. Full 3-scenario sweep
(`BASE_URL=http://127.0.0.1:3000 npm run check:click-shield`, `I1-baseline.log`):

```
Scenarios: 3  Cells: 48  Elements checked: 1772  Excluded (below/above-fold): 40  Interceptions: 6  Cleared (transient): 45
[base] cells=16  checked=556  excluded=0  violations=6
[drawer] cells=16  checked=672  excluded=0  violations=0
[modal] cells=16  checked=544  excluded=40  violations=0
EXIT_CODE=1
```

**Base scenario: 6 violations**, reproducing Task 729's finding exactly — `FooterView`'s Facebook/
Instagram links at mobile-375, sq/en/it (not uk, not 320/390). Drawer/Modal scenarios clean, matching
727's landed protection.

---

## 2. R1 — live geometry measurement (Checkpoint 2)

Wrote and ran a one-off Playwright measurement script (not shipped — see §9) against the running app
for 3 failing cells (sq/en/it@375) and 3 passing cells (uk@375, en@320, en@390)
(`I2-geometry.json`). Key findings, all measured, not computed from declarations (A2's explicit
requirement):

| Quantity | Measured value | Source |
|---|---|---|
| `.navBar` own box | `top:756 bottom:812` (56px, matches `--space-14`) | `I2-geometry.json` |
| `.fabLink` (`<a>`) box — the ACTUAL click target | `top:745 bottom:812` (**67-68px**, not 56px) | `I2-geometry.json` — the negative `margin-top:-12px` stretches the flex item's cross-size by 12px beyond the bar, confirming the kickoff's own flagged-as-unverified arithmetic (~64-68px) was closer to right than the bar height alone |
| Total document-space clearance from the social row's bottom to the document's end | **104px**, constant across all 6 measured cells (sq/en/it/uk@375, en@320, en@390) | `container`'s own `padding-bottom` (48, unconditional) + `footer`'s own mobile `padding-bottom` (56, `--space-14`) |
| Social-row position at **true scroll rest** (`scrollY = maxScrollY`) | Screen bottom **= 708px**, i.e. **44px clear** of `.fabLink`'s true top (745) | Directly hit-tested — `document.elementFromPoint` returns the link itself, `hitIsSelf: true`, for **both** a failing cell (en@375) and a passing cell (uk@375) (`I2b-scroll-clear-check.log`) |

**R1's answer: the clearance is not insufficient.** At the page's true resting scroll position, the
social links clear the FAB's real hit-box (fabLink, not just the visible bar) by a comfortable 44px,
in every cell measured — including the 3 that the gate reports as *permanent* violations. This directly
contradicts the kickoff's §3.2 arithmetic ("occluded band ≈64px, clearance exactly 56px") once verified
live, exactly as A2 warned it might.

### 2a. Why the gate still reports 6 violations — the real mechanism (`I2c-debug-offsets.log`)

Replicated `scripts/check-click-shield.mjs`'s own band-scan and `computeClearingOffsetCandidates` logic
verbatim, instrumented with verbose logging, against the `en@375` failing cell:

- The gate scans fixed bands at multiples of the viewport height (0, 812, 1624, 2436, 3248, then the
  document's true `maxScrollY` = 3329). The social row first enters the viewport at band **3248**
  (`rect.top:773 bottom:789`) — **not** at the final, correctly-tested `maxScrollY` band.
- At band 3248, `elementFromPoint` hits `.fabLink` (or a sibling nav item) — a transient candidate.
  `nearestFixedOrStickyAncestorOf()` walks up from the **interceptor**, not the candidate, and finds
  `.navBar` (the only element that is actually `position:fixed`) — **not** `.fabLink`, which is a
  normal-flow flex child that merely *overhangs* `.navBar`'s own box via its negative margin.
- `computeClearingOffsetCandidates` therefore computes its clearing offset against `.navBar`'s own rect
  (`top:756`), not `.fabLink`'s true, larger hit-box (`top:745`). The computed offset (3283) lands the
  candidate's bottom at ~754 — **above 756 (clears the bar), but still inside 745-812 (still inside the
  FAB's real overhang)** — so `elementFromPoint` still returns `.fabLink`, phase 2 reports
  `cleared:false`, and the candidate becomes a hard violation. Confirmed directly: `phase2 @offset=3283:
  {"cleared":false,...,"hitClass":"MobileBottomNavView_fabLink__kTCqN"}`.
- Because the candidate was already resolved (as a violation) at band 3248, the band-scan's own dedupe
  (`resolvedSet`) skips it at the final band (3329) — where a direct, un-offset-computed
  `elementFromPoint` check **would** have correctly found it clear (`hitIsSelf:true`, matching §2's
  direct test).
- **The 11px gap is exactly `.fabLink`'s own overhang** (`margin-top:-12px` stretches it 12px beyond
  `.navBar`'s box, measured as 11px after rounding) — an existing, intentional design characteristic of
  the FAB (D28/D34-protected), not a defect in the clearance.

### 2b. Why sq/en/it fail and uk/320/390 don't

Derived from the same measurements, not assumed: whether a cell fails depends entirely on whether the
social row's document-position (fixed by content height *above* it — header + main + the footer's own
brand/nav/info columns, which vary slightly by locale text length) happens to land inside the viewport
at one of the gate's *regular* 812px-multiple scan bands (triggering the flawed offset math above) or
only at the *final* band (always correctly tested). `uk`'s longer strings push its footer content
~30-100px taller than `sq/en/it`, which happens to push its row's entry into the viewport past the last
regular band (3248 < 3379 = its `maxScrollY`, but the *next* regular band would be 4060, never reached)
— it only gets checked at the final, correct band. `320`/`390` differ enough in viewport height that the
same coincidence recurs in their favour. **This is a coincidence of content length vs. a fixed 812px
scan stride, not a designed distinction** — exactly what the kickoff's §3.3 flagged as unresolved and
told this task to measure rather than assume.

---

## 3. R2 — why no existing-token clearance change can fix this (Checkpoint 2/4)

Tested two directions empirically, not just derived, against the running app (runtime
`page.addStyleTag` overrides — no source edited):

**(a) Increase footer's own clearance.** Tried `.site-footer { padding-bottom: 64/80/96/112px }`
(`--space-16` through beyond `--space-28`) against all 3 failing locales (`I2e-clearance-increase-test.log`).
**Zero effect at any value** — band 3248's detected `rect.bottom` for the social row stayed at
exactly 795/789/809 (sq/en/it) regardless of how much padding follows the row, because padding
*after* content does not move that content's own document position — it only pushes the document's
end (and `maxScrollY`) further out. The row's position relative to the gate's fixed 812px scan bands
is set entirely by content **above** it.

**(b) Decrease `<main>`'s redundant clearance** (its `pb-14` duplicates `FooterView`'s own protection,
since `Footer`/`MobileBottomNav` are unconditional siblings on every route — `layout.tsx:49-54`).
Zeroing `<main>`'s mobile `padding-bottom` via style override (`I2d-hypothesis-test.log`) fixed `sq`
and `en` (row becomes directly clear at band 3248) but **left `it` failing and, critically, broke the
previously-passing `uk`** (now also caught mid-transit at band 3248: `hitIsSelf:false`). Even at the
maximum possible reduction (0), `it` and `uk` still fail — the required per-locale shift is
content-length-dependent and does not converge to a single safe value.

**Why neither direction can work, derived:** the gate's transient-offset math always targets clearing
`.navBar`'s own box (756) with a 1px margin, undershooting the true `.fabLink` hit-box (745) by a fixed
~11px, **regardless of total clearance** — unless the computed offset exceeds `maxScrollY` and gets
clamped to it (which *would* resolve correctly, per §2's direct test). Clamping requires total
clearance-after-row `< 56px` (derived: `56 − clearanceAfterRow > 0`). But total clearance-after-row
must stay `≥ 56px`, or the social row's bottom at **true scroll rest** would sit *inside* `.navBar`'s
own **opaque, visible** box (756-812) — a real, user-visible occlusion, strictly worse than the current
narrow scroll-transit click-shield gap. **These two constraints are mutually exclusive at exactly
56px.** No value of an existing token (or a `calc()` composition, which A3 already flags as having no
precedent in `src/`) satisfies both.

**R2 conclusion: `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.** The fix that would actually resolve
this is a change to `check-click-shield.mjs`'s `computeClearingOffsetCandidates` (derive `ancRect` from
the actual intercepting element, not its nearest fixed/sticky ancestor) — explicitly out of scope
(§8: "any other `check:click-shield` change"). The alternative — removing `.fabLink`'s hit-testable
overhang so it no longer exceeds `.navBar`'s own box — would change the FAB's elevated-button visual
design, which §8 and D28/D34 also place out of scope ("re-hybridising or restyling
`MobileBottomNavView` beyond the collision fix").

---

## 4. OQ1 — answered

**"If R1 shows the clearance is correct and the real cause is the footer's own layout at 375, the fix
belongs in FooterView, not the shell — say so with evidence and re-scope rather than padding the shell
to hide it."** R1 shows the clearance *is* correct (§2, §3). The real cause is neither `FooterView`'s
layout nor the shell's clearance — it is a measurement gap in `check-click-shield.mjs`'s own
transient-offset computation, interacting with a coincidence of locale content-length vs. the gate's
fixed 812px scan stride (§2a-b). Surfaced here per OQ1 rather than decided silently; re-scope
recommendation in §7.

---

## 5. R4/R5 — not applicable, nothing shipped

No source file was edited. `MobileBottomNavView.module.css`'s `@layer utilities` wrapper and D28
provenance are untouched (never opened for edit). `layout.tsx` is untouched. No bar/clearance comment
needed correction because no clearance value changed.

---

## 6. R6 — canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| `FooterView`'s social-link row (`.socialLink`, `.bottomBar`) | Opened `FooterView.tsx:107-132`, `FooterView.module.css:107-138`; grepped `--space-1[0-9]\|--space-16` in `globals.css` | `FooterView.module.css` (Task 673 D28 canonical source) | **No change made** — investigated for a clearance edit, none applied (BLOCKED, §3) | N/A — no value consumed or introduced |
| `<main>`'s bottom padding (`layout.tsx:50`) | Opened `layout.tsx:45-58`; traced `--space-14` in `globals.css:164` | `layout.tsx` (Task 712 canonical source) | **No change made** — tested via runtime override only, reverted, not shipped (§3b) | N/A |
| `.fabLink`'s overhang (`MobileBottomNavView.module.css:68-76`) | Opened the whole file per the pre-read bundle; identified as the true root cause of the gate's ancRect mismatch (§2a) | `MobileBottomNavView.module.css` (Task 713 D28/D34 canonical source) | **Explicitly out of scope** — changing it would restyle the FAB's elevation, forbidden by §8 | N/A |

No visible artifact was changed. This table exists per R6's requirement to record the investigation
even when its conclusion is "do not touch."

---

## 7. Opus handoff — the decision this executor cannot make

- **Primary question:** this is a real-but-narrow defect (a ~40-60px window of scroll positions, out of
  ~3300px of scrollable range, where a resting tap would miss the social links) that the gate correctly
  found but currently *misclassifies as permanent* due to its own transient-offset computation using the
  wrong ancestor rect. Closing it requires either:
  1. **Fix `check-click-shield.mjs`'s `computeClearingOffsetCandidates`** to derive `ancRect` from the
     actual intercepting element (or walk its own overhang) rather than its nearest fixed/sticky
     ancestor — this is a gate fix, explicitly out of this task's scope, and would need its own kickoff.
  2. **Accept the current 6 violations as a known, narrow, low-severity gap** and adjust Task 727's CI
     gate policy for the base scenario accordingly (e.g., a scoped, named exemption) until (1) lands —
     a product/policy call outside this executor's authority.
  3. **Redesign `.fabLink`'s hit-box** so it does not exceed `.navBar`'s own painted box — a genuine
     restyle of the FAB, out of *this* task's scope per §8, but could be scoped as its own task if the
     owner decides the elevated-overhang hit-box is worth trading away.
- **Ordering risk unchanged from the kickoff:** Task 727's CI gate remains blocked on the Supabase
  secrets, and this defect will make its `base` scenario non-zero the moment that job can run,
  regardless of which of the above is chosen — the kickoff's own ordering concern (§0) stands.
- Please verify independently: rerun `I2c-debug-offsets.log`'s replicated gate logic, or add
  step-through logging to the real `computeClearingOffsetCandidates` (read-only inspection, no edit) to
  confirm the ancestor-selection finding.
- All temporary diagnostic scripts (`scripts/task737-*.mjs`, 5 files) were deleted after use — not
  shipped, not part of the diff (§9).

---

## 8. Standing gates (subset run — no source changed)

- `npm run build` (pre-investigation baseline) — exit 0 (`I0-prefix-build.log`).
- No further build/tsc/i18n reruns performed after §0, since no source file was ever edited
  (`git status --porcelain -- src/ scripts/ docs/` confirmed empty before this session log/backlog
  edit — see §0). AC8/AC9/AC10's remaining clauses (tsc, i18n, file-integrity/mojibake, two-pass
  counting) do not apply to an unedited-source `BLOCKED` outcome in the way they would to a shipped
  fix; the pre-fix build result stands as the only production-build evidence needed since nothing
  changed after it.

---

## 9. Assumptions, deviations, and limitations

- Five one-off Playwright diagnostic scripts were created under `scripts/` during investigation
  (`task737-measure-geometry.mjs`, `task737-verify-scroll-clear.mjs`, `task737-debug-gate-offsets.mjs`,
  `task737-hypothesis-test.mjs`, `task737-hypothesis-test2.mjs`) to obtain live, non-arithmetic
  evidence per R1/A2. All five were deleted after producing their logged output (`.screenshots/task737-evidence/I2*.log`,
  `I2*.json`) and are **not** part of the diff — confirmed via `git status --porcelain` (empty) after
  deletion. This matches Task 729's own precedent ("a throwaway Playwright script, not shipped," §5 of
  its session log).
- **Deviation from the kickoff's framing:** §3.2's arithmetic ("occluded band ≈64px vs. 56px
  clearance") is contradicted by live measurement (§2) — the true clearance is 104px and the true
  overhang is 67-68px, comfortably non-overlapping at rest. The kickoff itself flagged this arithmetic
  as unverified (A2) and required live measurement to confirm or correct it (R1); this session did so
  and the correction is the deviation.
- **Limitation:** this session did not attempt to fix `check-click-shield.mjs` (explicitly out of
  scope) or `.fabLink`'s hit-box geometry (explicitly out of scope), so the 6 base-scenario violations
  remain unresolved. No regression was introduced — the worktree is unchanged from `git show HEAD`.
- The evidence root `.screenshots/task737-evidence/` contains: `J0-status.txt`, `I0-prefix-build.log`,
  `I1-baseline.log`, `I2-geometry.json`, `I2b-scroll-clear-check.log`, `I2c-debug-offsets.log`,
  `I2d-hypothesis-test.log`, `I2e-clearance-increase-test.log`, `I2-geometry.err.log`, `server.log`.

---

## 10. Files Changed

| File | Reason |
|---|---|
| `docs/backlog.md` | Last-Session block replaced; Task 737 registry row updated to `BLOCKED` with a pointer to this session log. |
| `docs/sessions/2026-08-09-task737-footer-social-links-under-fab.md` | This session log. |

No product source file changed. `scripts/task737-*.mjs` (5 files, diagnostic only) were created and
deleted within this session — absent from the final diff.

---

## 11. Acceptance-criteria self-audit

| AC | Evidence | Result |
|---|---|---|
| AC1 [R1] | §2, `I2-geometry.json`, `I2b-scroll-clear-check.log` | Met — failing/passing cell geometry recorded, sq/en/it-vs-uk and 375-vs-320/390 explained from measurement (§2b) |
| AC2 [R2, R8] | §3 | **Not met as "fix ships"** — R2's own escape clause invoked: no existing token/composition closes the gap without a worse regression or fragile luck; `check:design-tokens:strict` not run since no source changed |
| AC3 [R3] | §1 | **Not met** — base scenario stays at 6, not 0. This is the substance of the `BLOCKED` status |
| AC4 [R4] | §5 | Met — nothing restructured, because nothing was edited |
| AC5 [R5] | §5 | Met — no comment needed correction, no value changed |
| AC6 [R6] | §6 | Met — investigation recorded even though disposition is "no change" |
| AC7 [R7] | N/A | Not applicable — no rendered proof needed for an unshipped, source-unchanged BLOCKED outcome |
| AC8 [R9] | §8 | Partially met — pre-investigation build exit 0; tsc/i18n not rerun (no source changed after baseline) |
| AC9 [R10] | N/A | Not applicable — no fix to attribute cells against |
| AC10 [R11] | §0 | Met — baseline quoted pre-edit (89), single pass since this is the first and only backlog edit this session |

---

## 12. Backlog update

`docs/backlog.md`'s "Last Session" block replaced (4 lines) and the Task 737 registry row condensed
from its long kickoff-summary paragraph to a short pointer at this session log, following 729's own
precedent for keeping growth in check. Line count before this edit: **89** (§0, matches
`git show HEAD:docs/backlog.md | wc -l`). Line count after (`wc -l docs/backlog.md`): **89** — net
zero growth (the 737 registry-row condensation offset the new Last-Session block). No
`BACKLOG LIMIT BREACH` this session; the file was already over the "~80" soft target before this
session (per 729's own log) and stays at that same pre-existing level, not worse.
