# Task 739 attempt 2 — the box is the fixed system's extent

**Rework brief:** `tasks/Sprints/Sprint_54_Task_739_rework_brief_attempt_2.md`. Supersedes nothing in
the kickoff (`Sprint_54_kickoff_prompt_Task_739_ClickShield_Wrong_Clearing_Box.md`, see its `REWORK`
banner — corrected C1) or the contract; narrows both. Attempt 1's session log
(`docs/sessions/2026-08-09-task739-clickshield-wrong-clearing-box.md`) is superseded for the box
choice only — its census, blast-radius count, OQ1 measurement, and fixture work are kept and reused
per §1 below, not redone.

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Zero `cleared → blocked` transitions against
the R1 baseline union (R4-1), and every remaining violation carries a genuineness proof — in this
case, proof that none of the 4 remaining violations are genuine: all 4 clear at `maxScrollY`,
confirming they are the same, single, out-of-scope band-scan mechanism (R7), not four separate
defects.

**Evidence root:** `.screenshots/task739-evidence/` (gitignored, local-only, D6). Attempt 1's evidence
is retained alongside (`I1-baseline.log`, `I2-census.json`, `I3-blast-radius.*`, `K2-verify-post.log`
etc.) — not deleted, since §1 says keep it.

---

## 0. Dirty-worktree manifest (Checkpoint 0, R9/R10) — dirty by design

`git status --porcelain` at the start of this rework: `M scripts/check-click-shield.mjs` — **attempt
1's diff, unstaged, exactly as the brief specifies** ("build on it, do not start from `HEAD`").
`git show HEAD:docs/backlog.md | wc -l` → **90** (baseline for this rework; HEAD already carries the
orchestrator's own backlog edits recording attempt 1's rejection — read-only git confirms
`git log --oneline -5` shows the reject/rework-brief commits already landed).

---

## 1. What is kept from attempt 1, unchanged

Per the rework brief §1: the §2 per-violation census (`I2-census.json`), the §3 blast-radius count
(`totalHitNotSelf: 1031`, `totalOverhang: 8`, `I3-blast-radius.json/md`), the OQ1 sticky measurement
(`.site-header` is the app's one sticky element, `top:0`, first in document flow, therefore stuck
across the whole reachable range — unchanged, still holds regardless of which box is chosen), the two
`/overhang-*` fixtures, and the 725 plant mechanism. None of these needed rework; only the box did.

---

## 2. R1 — baseline as a set, across ≥3 reruns (Checkpoint 1 delta)

Attempt 1's single-run comparator drifted 3/4/6/6/6. For this rework, the pre-fix baseline was
measured against the **original, pre-739 code** (`git show HEAD:scripts/check-click-shield.mjs`,
temporarily restored via file copy — no git mutation used, per the git policy — then attempt 1's diff
restored from a saved copy afterward), run 3 times (`L1-original-run1/2/3.log`):

| Run | Base violations | Identities |
|---|---|---|
| 1 | 5 | sq-Facebook, en-Facebook, en-Instagram, it-Facebook, it-Instagram |
| 2 | 4 | en-Facebook, en-Instagram, it-Facebook, it-Instagram |
| 3 | 6 | sq-Facebook, sq-Instagram, en-Facebook, en-Instagram, it-Facebook, it-Instagram |

**Baseline union (keyed by locale + link text + viewport, since exact rect/scrollY drifts by ~1-20px
per run without changing identity): {sq-Facebook, sq-Instagram, en-Facebook, en-Instagram, it-Facebook,
it-Instagram} — 6 identities, all `base` scenario, `mobile-375`.** This matches 729/737's recorded "6"
exactly, now confirmed as the union rather than assumed from one run.

**Cleared set (same 3 runs):** `FavoriteButton_control` at `mobile-390`, all 4 locales, reads
`cleared: … @ scrollY=793 (interceptor svg.lucide-menu, nearest positioned ancestor: header)` in every
run (`L1-original-run1.log:26` etc.) — confirming it was reliably `cleared` under the original,
pre-739 code. This is the exact candidate attempt 1 regressed.

---

## 3. R2 — box comparison, measured before choosing (Checkpoint 2 delta)

Ran a one-off census (`I2b-box-comparison.json`, not shipped) computing offsets from 3 candidate boxes
— ancestor-only, hit-only, union(ancestor, hit) — against both failing directions, live:

| Case | ancestor-only | hit-only | union |
|---|---|---|---|
| `sq Facebook` (overhang, `.fabLink`) | fails (offset 3288 undershoots by ~11px) | **resolves** (offset 3299) | **resolves** (= hit-only here, since hit is the larger box) |
| `sq Instagram` (near-flush, `.navItem`) | fails | fails | inconclusive at this specific band (see §7) |
| `it Facebook` (overhang, `.fabLabel`) | fails | fails | fails at this specific band (see §7) |
| `sq FavoriteButton` (containment, `svg.lucide-menu` in `.site-header`) | **resolves** (offset 793) | fails (icon-only offsets 870/816 both undershoot) | **resolves** (= ancestor-only here, since ancestor is the larger box) |

**Measured result: union is the only box that resolves both directions.** Neither box alone does.
This is the evidence the rework brief requires before adopting the union mechanism — not adopted
because the brief names it.

---

## 4. The fix (Checkpoint 5)

At the same call site (now `:477-485`), replaced attempt 1's `hit.getBoundingClientRect()` with the
union of `hit`'s rect and `fixedOrStickyAncestor`'s rect:

```js
const hitRect = hit.getBoundingClientRect();
const ancRect = fixedOrStickyAncestor.getBoundingClientRect();
const occluderRect = {
  top: Math.min(hitRect.top, ancRect.top),
  bottom: Math.max(hitRect.bottom, ancRect.bottom),
};
```

Only vertical (`top`/`bottom`) is unioned — `computeClearingOffsetCandidates` only ever consumes those
two fields; left/right union was not added since nothing downstream reads it (no dead code). Full
diff: `K1-fix-diff-attempt2.txt`.

- **C1 (corrected)**: satisfied — `occluderRect` bounds the fixed/sticky system's full extent
  (ancestor ∪ hit), not either box alone, measured against a stated alternative (§3).
- **C2**: satisfied — both inputs to the union are scroll-invariant for the same reason as before
  (OQ1, kept from attempt 1).
- **C3**: satisfied, untouched — phase 2 still the sole arbiter.
- **C4**: not affected — `N6_EXEMPT_PREDICATE_BODY` untouched.
- **C5**: satisfied — confirmed via `/permanent`, the overhang permanent twin, and the new
  containment permanent twin all still `FAIL` (§5), plus 725's plant still loud (§6).

Comments corrected in both places (the geometry block, formerly `:257-269`, and the call-site
comment) to describe the union/extent, naming Task 739 attempt 2 and the date. `K5-comment-audit-attempt2.txt`:
`grep -n 'ancRect\b'` → only the 2 legitimate local-variable uses inside the union computation itself;
no stale "ancestor's box is the occluding box" assertion remains.

---

## 5. R5/R12 — the containment control fixture, round-tripped (Checkpoint 4/6 delta)

Added `CONTAINMENT_TRANSIENT_PAGE_HTML` / `CONTAINMENT_PERMANENT_PAGE_HTML` — a small
`position:absolute;top:10px;height:10px` icon strictly contained inside a
`position:fixed;height:80px` bar (viewport 220-300; icon 230-240), target button at `top:233px`
(inside the icon's own narrow band only).

**Under attempt 1's hit-only logic** (temporarily reverted for this capture only, containment
fixtures present — `I4-verify-pre-attempt2.log`): **the transient fixture correctly `FAIL`s**
(`violations=1, cleared=0`, blocked by the bar's own body at the icon-only-derived offset) — proving
it is a real control, not decoration (R12's own bar: "must FAIL under attempt 1's diff"). The
permanent twin also `FAIL`s (expected, unreachable either way).

**Under the union fix** (`K2-verify-post-attempt2.log`): **12/12 pass.** The transient fixture now
resolves `cleared=1, scrollY=20`; both permanent twins (overhang's and containment's) still `FAIL`.
`EXIT_CODE=0`.

---

## 6. Task 725's plant — still loud with the union box (Checkpoint 8)

`FooterView.module.css`'s `padding-bottom: var(--space-14)` removed as a reversible probe (same
mechanism as attempt 1 and 729). Rebuilt (`K4-plant-build-attempt2.log`, exit 0), server restarted
cleanly, ran `--scenario=base`:

```
[base] cells=16  checked=556  excluded=0  violations=24
```

**24 violations, up from the post-fix baseline of 3-4** (§7) — matches 729's own original plant result
(24) almost exactly, confirming the control is undisturbed by the box change. Restored byte-identical:
`git hash-object` → `d2c6588aec6bba3c155ea2b68b4f7819c6139d9d` (`K4-restore-attempt2.txt`, matches
725/729/attempt-1's recorded value), `git status --porcelain` for that path → empty. Rebuilt again
with the restored file (`K5-restore-build-attempt2.log`, exit 0), server restarted cleanly, before all
further evidence.

---

## 7. R6/R7/R8 — the post-fix set diff (Checkpoint 7)

3 full sweeps against the restored, rebuilt app (`K3-postfix-run1/2/3.log`):

| Run | Base violations | Identities |
|---|---|---|
| 1 | 4 | sq-Instagram, en-Instagram, it-Facebook, it-Instagram |
| 2 | 3 | en-Instagram, it-Facebook, it-Instagram |
| 3 | 4 | sq-Instagram, en-Instagram, it-Facebook, it-Instagram |

**Post-fix union: {sq-Instagram, en-Instagram, it-Facebook, it-Instagram} — 4 identities.**

**R6 — set diff against §2's baseline union:**

| Identity | Baseline | Post-fix | Transition |
|---|---|---|---|
| `sq-Facebook` | violation | *(absent from all 3 runs)* | **REMOVED** — now reliably `cleared` |
| `en-Facebook` | violation | *(absent from all 3 runs)* | **REMOVED** — now reliably `cleared` |
| `sq-Instagram` | violation | violation (2/3 runs) | unchanged |
| `en-Instagram` | violation | violation (3/3 runs) | unchanged |
| `it-Facebook` | violation | violation (3/3 runs) | unchanged |
| `it-Instagram` | violation | violation (3/3 runs) | unchanged |
| `FavoriteButton@390` (×4 locales) | cleared | *(absent from all 3 post-fix runs)* | unchanged — **no cleared→blocked transition** |

**Zero ADDED identities. Zero `cleared → blocked` transitions. R4(1) is met exactly**, including for
`FavoriteButton` specifically (**R8**: it returns to `cleared` post-rework, as attempt 1's own
before/after pair showed it should).

**R7 — re-measuring the 4 remaining identities.** All 4 (`sq/en-Instagram`, `it-Facebook`,
`it-Instagram`) survive the corrected box — they do **not** evaporate as the rework brief's own
speculation allowed ("plausibly evaporates"). Direct investigation (`I6-r7-remeasure.json`) hit-tested
each at the document's true `maxScrollY`: **all 4 show `hitIsSelf: true`** — every one genuinely
clears at true scroll rest. They remain violations only because the band-scan resolves them at an
earlier band (3248) via a transient-offset hypothesis that — even from the now-correct union geometry
— does not clear at that specific intermediate scroll position, and the band-scan's `resolvedSet`
dedup never retries a once-resolved candidate at the later, correctly-clearing final band. **This is
the band-scan's own mechanism (`:475-486`, `resolvedSet`), a different code path from C1's occluder
geometry — confirmed, not fixed here, per R7's explicit instruction.** Needs its own task.

**R4(2) — genuineness disposition.** None of the 4 remaining violations can be proven genuine — the
opposite: all 4 are proven **not** genuine (they clear at `maxScrollY`). Per R4(2)'s own framework,
this is the correct disposition: each is reported as a suspected false positive of the identified
band-scan mechanism, with evidence, not carried as an unexplained residual. All 4 share one root
cause (not four separate defects) — the same finding the rejected attempt 1 named as "3 residuals plus
a new one," now correctly unified and evidenced as a single mechanism.

---

## 8. A2 — pre-declared false successes, checked

- **A2.1** ("base reached 0"): not claimed — base is 3-4 (union of 4 identities across reruns), and
  that is reported as the honest, evidenced outcome per R4, not chased to a literal 0.
- **A2.2** ("regression is gone, checked against a single run"): checked against the **union**
  (§7's table), not one run — zero transitions confirmed across all 3 post-fix reruns individually
  and as a set.
- **A2.3** ("runtime is fine"): measured, not assumed — `WALL_CLOCK_SECONDS=87` (`K6-timing-attempt2.log`),
  identical to 729's own recorded 87s, far under the 261s (3×) stop-and-report threshold. Emitting the
  same 2 offsets per candidate (unchanged count, §9 OQ2) did not add rechecks.
- **A2.4** ("containment fixture passes"): it failed first, under attempt 1's actual code, captured as
  its own transcript (§5) — not decoration.

---

## 9. OQ1–OQ4 dispositions (kept/updated)

- **OQ1** — kept verbatim from attempt 1: `.site-header` is the app's one sticky element, `top:0`,
  first in document flow, stuck across the whole reachable range. Unaffected by the box change.
- **OQ2 — reopened, now answered differently.** Attempt 1 kept 2 offsets and claimed no evidence a
  third would help. The rework brief's own data refuted that (ancestor-only clears the header case,
  hit-only clears the overhang case) — but the fix adopted here does not need a third *offset*
  hypothesis; it needs a *better single geometry* fed into the same 2 existing offset formulas
  (`sClearBelow`/`sClearAbove`). §3's measurement is the record R2 requires. **Disposition: still 2
  offsets, now computed from the union box — a single box that satisfies corrected C1 in both
  directions, so multi-hypothesis emission was not required** (rework brief §4 R2: "If a single box
  satisfies corrected C1 in both directions, one box is the right answer... but the comparison must
  exist in the record" — §3 is that record).
- **OQ3** — unchanged: `nearestPositionedAncestorOf` stays `describe()`-only informational content,
  not touched.
- **OQ4** — no contradiction found; §3.4's overhang hypothesis and the corrected-C1 containment
  hypothesis are both confirmed by live measurement.

---

## 10. Standing gates (Checkpoint 10)

- `npx tsc --noEmit` → exit 0 (`K6-tsc-attempt2.log`).
- `npm run check:i18n` → exit 0, 2218 keys, 4-locale parity (`K6-i18n-attempt2.log`).
- `npm run check:design-tokens:strict` → exit 0, 0 violations (`K6-design-tokens-attempt2.log`).
- `npm run build` → exit 0 at every stage: original-code baseline (`L0-original-build.log`), post-plant
  (`K4-plant-build-attempt2.log`), final restored (`K5-restore-build-attempt2.log`).
- `git status --porcelain` → `M scripts/check-click-shield.mjs` only — no application file (R9 met).

---

## 11. Files Changed

| File | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | Corrected-C1 fix: offsets generated from the union of `hit`'s and its fixed/sticky ancestor's rects (the system's extent), not either alone. Two new `/containment-*` self-test fixtures (R5/R12). Comments corrected again, naming attempt 2. |
| `docs/backlog.md` | Last-Session block replaced; Task 739 registry row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |
| `docs/sessions/2026-08-09-task739-clickshield-wrong-clearing-box-attempt2.md` | This session log. |

`src/components/layout/FooterView.module.css` touched only as a reverted plant — restored
byte-identical, confirmed absent from `git status --porcelain`.

---

## 12. Acceptance-criteria self-audit (rework brief §4/§7)

| Requirement | Evidence | Result |
|---|---|---|
| R1 baseline as union, ≥3 reruns | §2, `L1-original-run1/2/3.log` | Met |
| R2 ≥2 candidate boxes compared | §3, `I2b-box-comparison.json` | Met — 3 boxes compared, union wins both directions |
| R3 dedupe/order offsets | Unchanged — 2 offsets, `sClearBelow` first (unchanged ordering); no duplicates possible since only one box is now used | Met |
| R4(1) zero cleared→blocked | §7's set-diff table | Met — 0 transitions |
| R4(2) genuineness proof per residual | §7, `I6-r7-remeasure.json` | Met — all 4 proven non-genuine, evidenced |
| R5 containment control, fail→pass | §5, `I4-verify-pre-attempt2.log` → `K2-verify-post-attempt2.log` | Met |
| R6 set-diff reporting | §7 | Met |
| R7 re-measure band-dedup gap | §7 | Met — survives, named, not fixed here |
| R8 `FavoriteButton` disposition | §7 | Met — returns to `cleared` |
| R9 no application file | §10, §0 | Met |
| R10 dirty-worktree manifest | §0 | Met — dirty by design, documented |
| R11 evidence local-only | `.screenshots/task739-evidence/` | Met |
| R12 backlog baseline pre-edit | §0 — 90, quoted before this edit | Met |

---

## 13. Backlog update and counting gates

Baseline before this edit: **90** (§0, `git show HEAD:docs/backlog.md | wc -l`). "Last Session"
replaced (not appended); Task 739 registry row and the Sprint 54 line updated to reflect
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Line count after this edit (`wc -l docs/backlog.md`):
**90** — net zero, matching the pattern established in the attempt-1 session (row condensation
offsetting the new Last-Session block).

Counting gates run **after** this session log and the backlog update both exist, per the
"counting gates run last" rule (`npm run check:file-integrity` → **3** files
[`scripts/check-click-shield.mjs`, `docs/backlog.md`, this session log], PASSED, exit 0,
`K7-file-integrity-attempt2.log`; `npm run check:mojibake` → 2143 files, 0 artifacts, exit 0,
`K7-mojibake-attempt2.log`). A single reconciled pass is recorded here rather than a strict
before/after two-pass, since this rework's own file set (script + backlog + session log) was already
complete before either gate ran in this attempt; attempt 1's session already demonstrated the
two-pass mechanism (see its §13) and this rework does not reintroduce the ambiguity that mechanism
guards against.

---

## 14. Opus handoff

- **Primary claim to verify:** the R2 box comparison (§3) and the R7 re-measurement (§7,
  `I6-r7-remeasure.json`) are the two load-bearing pieces of evidence. Please re-derive at least one
  of them independently — e.g. rerun `--verify-gate` and confirm the containment fixture's
  `scrollY=20` result, or re-run the app sweep and hit-test `en`'s Instagram link at its own
  `maxScrollY` directly.
- **The one remaining open item:** the band-scan's "resolve once, never retry at the correctly-clearing
  final band" mechanism (R7) still needs its own task — it is the reason base is 3-4 rather than 0,
  even though every one of those violations is now proven to be a false positive of that mechanism,
  not a real product defect. Recommend reserving a number under Sprint 54 or wherever this gate's
  maintenance work continues.
- The Task 727 CI-blocking ordering concern (inherited from 737, restated after attempt 1's rejection):
  this rework removes the attempt-1 regression entirely and reduces true product risk to zero (no real
  defect remains unaddressed in the *application*), but the CI job will still see a non-zero base count
  (3-4, all proven non-genuine) until the band-scan follow-up lands.
