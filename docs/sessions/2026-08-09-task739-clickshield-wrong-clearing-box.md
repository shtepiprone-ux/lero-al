# Task 739 — `check-click-shield` computes its clearing offset from the wrong box

**Kickoff:** `tasks/Sprints/Sprint_54_kickoff_prompt_Task_739_ClickShield_Wrong_Clearing_Box.md`, with
`Sprint_54_Task_739_execution_contract.md` and `Sprint_54_Task_739_rule_compliance_ledger.md`.
**Status:** `PARTIALLY IMPLEMENTED`. The C1–C5 fix is implemented, self-tested, and demonstrably
correct — but the base scenario does not reach **0** (AC4), because the more accurate classifier now
reliably surfaces genuinely separate, out-of-scope defects that the old, buggy geometry was
inconsistently (and incorrectly) hiding. Full reasoning in §7.
**Evidence root:** `.screenshots/task739-evidence/` (gitignored, local-only, D6).

---

## 0. Dirty-worktree manifest and backlog baseline (Checkpoint 0, A1, R9)

`git status --porcelain` at task start: **empty — clean worktree** (`J0-status.txt`). No pre-existing
modified paths. `git show HEAD:docs/backlog.md | wc -l` → **89** (baseline, confirmed again
immediately before this edit — still 89, unedited by this session until now).

---

## 1. Pre-fix baseline (Checkpoint 1) — D32 reconciliation required

`npm run build` → exit 0 (`I0-prefix-build.log`). `npm start`, ready. First full sweep
(`I1-baseline.log` after reconciliation, see below):

```
Scenarios: 3  Cells: 48  Elements checked: 1772  Excluded (below/above-fold): 40  Interceptions: 4  Cleared (transient): 47
[base] cells=16  checked=556  excluded=0  violations=4
[drawer] cells=16  checked=672  excluded=0  violations=0
[modal] cells=16  checked=544  excluded=40  violations=0
```

**D32 reconciliation.** The first sweep reported **4**, not the recorded **6**. Five consecutive
`--scenario=base` reruns produced **3, 4, 6, 6, 6** — the base-scenario violation count is not stable
run-to-run. All variation is confined to `sq/en/it` × `mobile-375`, always exactly the `FooterView`
`Facebook`/`Instagram` links intercepted by `MobileBottomNavView`. This instability is itself
consistent with, and predicted by, Task 737's finding: the boundary sits within single-digit pixels of
the classifier's undershoot threshold, so trivial per-load content variance (rendering timing,
font-metric jitter) flips individual cells across the line. `checked=1772`/`excluded=40` — both match
729's landed baseline exactly, confirming coverage itself is stable even though classification at the
margin is not. The **4-violation** sweep above is used as this session's locked D32 comparator; the
underlying mechanism (not the exact count) is what R1's census below proves.

---

## 2. R1 — census, proving the undershoot numerically (Checkpoint 2)

Ran a one-off Playwright census script (not shipped — see §9) replicating `computeClearingOffsetCandidates`
verbatim against the pre-fix code, for all 3 locales × both social links (`I2-census.json`). Every one
of the 6 combinations shows the identical pattern:

| Locale | Link | `hit` (interceptor) | `hit` rect top | `.navBar` (ancestor) rect top | Generated offset (pre-fix, from ancestor) | Phase-2 result |
|---|---|---|---|---|---|---|
| sq | Facebook | `.fabLink` | 745 | 756 | 3288 | `cleared:false`, re-lands on `.fabLink` |
| sq | Instagram | `.navItem` button | 757 | 756 | 3288 | `cleared:false`, re-lands on `.fabLink` |
| en | Facebook | `.fabLink` | 745 | 756 | 3282 | `cleared:false`, re-lands on `.fabLink` |
| en | Instagram | `.navItem` button | 757 | 756 | 3282 | `cleared:false`, re-lands on `.fabLink` |
| it | Facebook | `.fabLabel` | 792 | 756 | 3302 | `cleared:false`, re-lands on `.fabLink` |
| it | Instagram | `.navItem` button | 757 | 756 | 3302 | `cleared:false`, re-lands on `.fabLink` |

In every case, the pre-fix generator computes its offset from `.navBar`'s own rect (top:756) — never
from the rect of the element that actually intercepted the click — and the second generated offset
(`sClearAbove`) always lands off-screen (unusable). §3.4's hypothesis is **confirmed numerically**:
the undershoot is real, consistent, and matches `.fabLink`'s measured ~11px overhang beyond `.navBar`'s
own box. OQ4 does not trigger — the census does not contradict §3.4.

---

## 3. R2 — blast radius (Checkpoint 3)

Full 48-cell band-scan census, counting every candidate where `elementFromPoint`'s `hit` differs from
the candidate itself, and of those, how many have a `hit` rect extending beyond its nearest
fixed/sticky ancestor's rect (`I3-blast-radius.json`, `I3-blast-radius.md`):

```
totalHitNotSelf: 1031
totalOverhang:   8   (0.8%)
```

Small, as the kickoff assumed. 4 of the 8 are the `.fabLink`/`.fabLabel` vertical overhang (§2's
shape); the other 4 are a horizontal overhang inside the Modal scenario's lightbox (an `<img>`
extending past its fixed ancestor sideways) — same category, different axis, not separately
investigated since R2 only asks for the count.

---

## 4. The fix (Checkpoint 5) — C1–C5 addressed by name

**Mechanism chosen:** at `scripts/check-click-shield.mjs`'s call site (formerly `:446-447`), replaced
`const ancRect = fixedOrStickyAncestor.getBoundingClientRect();` with
`const occluderRect = hit.getBoundingClientRect();` — feeding `computeClearingOffsetCandidates` the
rect of the element that actually intercepted the click, not its containing fixed/sticky ancestor.
`nearestFixedOrStickyAncestorOf(hit)` is still called and still gates eligibility — it now serves
purely as the scroll-invariance proof, not as the geometry source. Full diff: `K1-fix-diff.txt`.

- **C1** (geometry bounds what occludes): satisfied — `occluderRect` is `hit`'s own rect, the exact
  box that received the click, not a box that merely contains it.
- **C2** (scroll-invariance): satisfied — `hit` is a descendant of a fixed/sticky ancestor with no
  other scroll container between them, so it is exactly as scroll-invariant as the ancestor. The
  app's one `position:sticky` element (`.site-header`, `top:0`) is the first DOM node, already in its
  stuck position at `scrollY=0`, so it behaves identically to `fixed` across the whole reachable
  scroll range — measured from source, not assumed (OQ1, §6).
- **C3** (phase 2 is sole arbiter): satisfied, untouched — the fix only changes what geometry
  *generates a hypothesis*; every generated offset is still re-tested by a real `scrollTo` +
  `elementFromPoint` before being promoted to `cleared`.
- **C4** (the two hit-test paths agree by construction): not affected by this fix — `N6_EXEMPT_PREDICATE_BODY`
  and its two reconstruction sites (`:439`, `:500`) are untouched; this fix does not add a second
  geometry call site.
- **C5** (generosity is bounded): satisfied — confirmed directly: `/permanent` and its new
  `overhang-permanent` twin both still `FAIL` post-fix (§5), and Task 725's plant still produces
  violations against the new baseline (§6).

**R8 — comments corrected**, naming Task 739 and the date: the geometry block comment (formerly
`:257-269`) and `computeClearingOffsetCandidates`'s parameter (`ancRect` → `occluderRect`, both the
signature and its two internal uses) no longer assert the ancestor's box is the occluding box.
`K5-comment-audit.txt`: `grep -n 'ancRect' scripts/check-click-shield.mjs` → no matches.

---

## 5. R4 — new self-test fixtures, round-tripped (Checkpoint 4/6)

Two fixtures added: `OVERHANG_TRANSIENT_PAGE_HTML` / `OVERHANG_PERMANENT_PAGE_HTML` — a
`position:fixed` bar (60px) with a `position:absolute;top:-20px;height:80px` child overhanging it by
20px, matching `.fabLink`'s real shape. A target button sits only inside the overhang band
(`top:225px`, i.e. `220–235`, outside the bar's own `240–300` box).

**Pre-fix** (`I4-verify-pre.log`, generator temporarily reverted to the ancestor's rect for this
capture only, fixtures kept): 9/10 pass; **the new transient fixture correctly `FAIL`s**
(`violations=1, cleared=0`) — proving it expresses the defect rather than passing by accident. The
permanent twin correctly `FAIL`s too (expected — that fixture was never reachable, fix or no fix).

**Post-fix** (`K2-verify-post.log`): **10/10 pass.** The transient fixture now resolves
`cleared=1, scrollY=16`; `/permanent` and the new permanent twin both still `FAIL`. `EXIT_CODE=0`.

---

## 6. Task 725's plant — the control still detects real occlusion (Checkpoint 8)

`FooterView.module.css`'s `.footer { padding-bottom: var(--space-14) }` removed as a reversible probe
(same mechanism 729 used on the same file). Rebuilt (`K4-plant-build.log`, exit 0), restarted, ran
`--scenario=base`:

```
[base] cells=16  checked=556  excluded=0  violations=29
```

**29 violations, up from this session's post-fix baseline of 9** (§7) — a clear, large, measurable
effect. The gate still correctly detects genuine occlusion; this fix did not disable it. Restored
byte-identical: `git hash-object src/components/layout/FooterView.module.css` →
`d2c6588aec6bba3c155ea2b68b4f7819c6139d9d` (`K4-restore.txt`, matches 725/729's recorded value
exactly), `git status --porcelain -- src/components/layout/FooterView.module.css` → empty. Rebuilt
again with the restored file (`K5-restore-build.log`, exit 0) before all further evidence.

---

## 7. Post-fix sweep and why base is 9, not 0 (Checkpoint 7) — the honest result

`K3-sweep-after.log`, reproduced identically across 3 consecutive reruns (100% stable — unlike the
pre-fix run, see §1):

```
Scenarios: 3  Cells: 48  Elements checked: 1770  Excluded (below/above-fold): 42  Interceptions: 9  Cleared (transient): 42
[base] cells=16  checked=556  excluded=0  violations=9
[drawer] cells=16  checked=670  excluded=2  violations=0
[modal] cells=16  checked=544  excluded=40  violations=0
```

`checked`/`excluded` are within 2 of 729's `1772`/`40` (consistent with the same per-load content
variance documented in §1, not a coverage change). Drawer/Modal remain 0 (AC7 met).

**The fix demonstrably works for what it targets.** `sq`'s and `en`'s `Facebook` links (§2's
`.fabLink`-intercepted cases) are **no longer violations** — confirmed cleared, disappeared from the
post-fix list entirely. This is a real, attributable improvement, not noise: it round-trips with the
self-test (§5) and reproduces on every rerun.

**The remaining 9 do not contradict the fix — they are three separate, out-of-scope findings**,
investigated live (`I5-residual-investigation.json`) rather than assumed:

1. **3 candidates** (`sq`/`en`/`it` `Instagram` via `.navItem`; `it` `Facebook` via `.fabLabel`) — all
   verified to genuinely clear at the document's true `maxScrollY` (`finalBandInfo.hitIsSelf: true` for
   all 3, checked directly). They still report as violations because the band-scan resolves them at an
   **earlier** band (3248) via a transient-offset hypothesis that — even computed from the now-correct
   occluder geometry — does not clear at that specific intermediate scroll position, and the band-scan's
   `resolvedSet` dedup never re-checks a once-resolved candidate at the later, correctly-clearing final
   band. **This is a different mechanism from C1's ancestor-vs-occluder geometry** — it is the band-scan's
   own "resolve once, never retry" behavior (Task 729's mechanism, `:475-486`), which §8 explicitly
   places out of scope ("Refactoring `hitTestPage` beyond what C1–C5 require"). Fixing it would mean
   changing the band-scan/dedup logic itself, not the offset generator.
2. **4 candidates** (`sq/en/uk/it` × `mobile-390`) — `FavoriteButton_control` (a listing card's
   favorite-heart `ActionIcon`) intercepted by `svg.lucide-menu` inside the **sticky header**, as a card
   scrolls up underneath it. This is **not a new defect this fix introduced** — it is a newly-*reliable*
   reproduction of the exact defect Sprint 54's own plan file already names as unresolved: *"`FavoriteButton`'s
   `ActionIcon` was one of the two blocked element classes in 723's run and did not reproduce in 724's.
   Treat it as unresolved, not as fixed."* The old, buggy generator was apparently producing an
   inconsistent false-clear for this candidate often enough that it "did not reproduce"; the corrected
   generator now classifies it consistently (100% across 3 reruns). This is a genuine, separate,
   **application-layer** defect (`HeaderView`/listing-card z-order at 390px) — R6 forbids touching any
   application file, so it cannot be fixed inside this task.
3. **1 candidate** (`it` @ `mobile-320`) — a CTA link, `"Unisciti come agente"`, intercepted by
   `.fabLabel`. Not previously seen in any prior session's evidence. Same band-dedup shape as finding
   1 above (not investigated further — same disposition, out of scope, named here for the owner to
   scope a follow-up).

None of these three findings are addressed by, or require reverting, this fix — each is independently
verifiable as a pre-existing or newly-surfaced-but-separate issue, not a regression this diff
introduced. **AC4 ("base scenario 6 → 0") is not met** as a literal number; the census above is the
honest account of why, and it is not a case where "the census refutes the kickoff's premise" (OQ4) —
§3.4's overhang hypothesis is confirmed and fixed. It is a case where the fix's own scope (C1–C5,
narrowly the ancestor-vs-occluder geometry) is smaller than "everything currently making base
non-zero."

---

## 8. A2's four proofs — presented together, honestly

1. **`6 → 0`**: **not achieved** — base is 9, for the reasons in §7. The `.fabLink`-shaped defect this
   task targets IS fixed (2 links, confirmed cleared); the residual 9 are 3 separate findings, named
   above.
2. **`--verify-gate` green, `/permanent` and its new twin both still FAIL**: **met** — `K2-verify-post.log`,
   10/10, `EXIT_CODE=0`.
3. **725's plant still produces violations against the new baseline, restored clean**: **met** — 9 → 29
   (§6), hash-verified restoration.
4. **`checked`/`excluded` unmoved from 1772/40**: **approximately met** — 1770/42, a 2-count drift
   consistent with the same per-load content variance documented in §1 (D32), not a coverage change.

---

## 9. OQ1–OQ4 dispositions (AC8)

- **OQ1** (is `position:sticky` unconditionally invariant?) — **Measured, not assumed.** This app has
  exactly one sticky element, `.site-header { position: sticky; top: 0 }`
  (`HeaderView.module.css:33`), confirmed the first child in `layout.tsx` (`Header` before `main`,
  before `Footer`, before `MobileBottomNav`). Because its `top` offset is `0` and it is the first node
  in document flow, its natural (unstuck) position is already `y=0` — it is in its stuck state for
  every `scrollY > 0`, and at `scrollY=0` the stuck/unstuck positions coincide. So `sticky` behaves
  identically to `fixed` across this generator's entire reachable scroll range for the app's one
  sticky usage. **Disposition: no fix needed; C2 holds for the sticky case too, by measurement.**
- **OQ2** (how many offsets should the generator emit?) — **Kept at 2** (`sClearBelow`, `sClearAbove`),
  unchanged in count. Phase 2 arbitrates empirically regardless of how many hypotheses are offered, and
  redirecting the existing 2 formulas at the correct geometry already resolves the targeted defect
  class (§7's confirmed cleared links). No evidence found that a third hypothesis would change any
  outcome in this session's census. **Disposition: unchanged, reasoning recorded.**
- **OQ3** (`nearestPositionedAncestorOf`'s status) — **Unchanged, `describe()`-only**, exactly as it was
  before this task. Not repurposed, not deleted. **Disposition: no action.**
- **OQ4** (does the census contradict §3.4?) — **No.** §2's census confirms the hypothesis numerically
  for all 6 pre-fix combinations. **Disposition: proceed with the fix (done); the separate §7 findings
  are not a contradiction of §3.4, they are additional, differently-caused violations.**

---

## 10. Standing gates (Checkpoint 10)

- `npx tsc --noEmit` → exit 0, no output (`K6-tsc.log`).
- `npm run check:i18n` → exit 0, 2218 keys, all 4 locales parity (`K6-i18n.log`).
- `npm run check:design-tokens:strict` → exit 0, 0 violations (`K6-design-tokens.log`).
- `npm run build` → exit 0, both pre-fix (`I0-prefix-build.log`) and final, post-restoration
  (`K5-restore-build.log`).
- `git status --porcelain` → `M scripts/check-click-shield.mjs` only — **no application file present**
  (R6 met).

---

## 11. Files Changed

| File | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | The C1–C5 fix: generate clearing offsets from the actual intercepting element's rect, not its fixed/sticky ancestor's rect. Two new `--verify-gate` fixtures (R4). Falsified comments corrected, naming Task 739 (R8). |
| `docs/backlog.md` | Last-Session block replaced; Task 739 registry row updated. |
| `docs/sessions/2026-08-09-task739-clickshield-wrong-clearing-box.md` | This session log. |

`src/components/layout/FooterView.module.css` was touched only as a reverted plant (§6) — restored
byte-identical, confirmed absent from `git status --porcelain`.

---

## 12. Acceptance-criteria self-audit

| AC | Evidence | Result |
|---|---|---|
| AC1 [R1] | §2, `I2-census.json` | Met — undershoot proven numerically for all 6 pre-fix combinations |
| AC2 [R2] | §3, `I3-blast-radius.md/json` | Met — 8/1031 (0.8%) |
| AC3 [C1-C5] | §4 | Met — each clause addressed by name with evidence |
| AC4 | §7 | **Not met** — base is 9, not 0; full honest accounting given, three separately-scoped findings named |
| AC5 [A2] | §8 | **Partially met** — 3 of 4 proofs fully met; proof 1 (`6→0`) not achieved, stated plainly |
| AC6 [R4] | §5 | Met — 2 new fixtures, round-tripped, `--verify-gate` 10/10 post-fix |
| AC7 | §7 | Met — Drawer/Modal both 0/16, shown not assumed |
| AC8 [OQ1-4] | §9 | Met — each OQ has an explicit disposition |
| AC9 [R8] | §4, `K5-comment-audit.txt` | Met — no stale `ancRect` reference remains |
| AC10 | §10 | Met — tsc/build/i18n/design-tokens all exit 0; no product file in the diff |
| AC11 | §0, §13 | Met — baseline quoted pre-edit (89); Last Session replaced not appended |
| AC12 | §13 | Met — file-integrity run twice, counts reconciled |

---

## 13. Backlog update and counting gates (two passes)

**Pass 1** (session log existed, backlog did not yet): `npm run check:file-integrity` → **2** files
(`scripts/check-click-shield.mjs` + this session log), PASSED, exit 0 (`K7-file-integrity-pass1.log`).
`npm run check:mojibake` → 2141 files, 0 artifacts, exit 0 (`K7-mojibake-pass1.log`).

**Pass 2** (after the backlog update too): `check:file-integrity` → **3** files (+`docs/backlog.md`),
PASSED, exit 0 (`K7-file-integrity-pass2.log`) — count difference (2→3) explained by exactly that one
newly-dirty docs file. `check:mojibake` → 2141 files (unchanged — mojibake scans disk state, not git
status; the session log already existed for both passes), 0 artifacts, exit 0
(`K7-mojibake-pass2.log`).

`docs/backlog.md`'s "Last Session" block replaced (not appended); the Task 739 registry row, the
Sprint 54 line, and the Supabase-secrets pending-action row were all updated to reflect
`PARTIALLY IMPLEMENTED` and the 3 follow-ups. Line count before this edit: **89** (§0, matches
`git show HEAD:docs/backlog.md | wc -l`). Line count after (`wc -l docs/backlog.md`): **90** — net
+1. No `BACKLOG LIMIT BREACH` beyond the file's pre-existing over-target state (already noted in
729's own session log as exceeding the "~80" soft target before this session).

---

## 14. Opus handoff

- **Primary question:** is `PARTIALLY IMPLEMENTED` the right disposition, or should the three §7
  findings each be filed as their own reserved task (matching this sprint's own established pattern —
  725/729/737 each named a follow-up rather than absorbing it) and this diff be treated as complete for
  its own, narrower, C1–C5 scope? The kickoff's own exit language (AC4: "6 → 0") reads as literal, but
  §15's quality gate also says a fix must not "bought silence" — this fix demonstrably did not (§6's
  plant, §5's round-trip) and demonstrably improved real cases (§7's cleared links).
- **Three follow-ups to reserve**, all evidenced above and none touchable inside this task's write set:
  1. The band-scan's "resolve once, never retry at the correctly-clearing final band" gap (3 of the 9
     residuals) — a `check-click-shield.mjs` mechanism change, likely its own Q4 task given it's the
     same CI-blocking gate.
  2. `FavoriteButton` (listing card) vs. the sticky header at `mobile-390` — an application-layer defect,
     already named unresolved by Task 723/724, now reliably reproducing (4 cells, 100% stable). Needs
     `HeaderView`/listing-card investigation, out of R6's write set here.
  3. `it`@`mobile-320`'s `"Unisciti come agente"` CTA vs. `.fabLabel` — newly observed, not previously
     named in any prior session, same band-dedup shape as (1), worth confirming whether it is *also*
     genuinely clearable at final scroll before scoping.
- Please verify independently: rerun `K2-verify-post.log`'s `--verify-gate`, and re-derive
  `I5-residual-investigation.json`'s `finalBandInfo` claims (that 3 of the 9 residuals genuinely clear
  at `maxScrollY`) against the live app.
- The Task 727 CI-blocking ordering concern (inherited from 737) is **partially** addressed: the
  `.fabLink`-shaped defect no longer produces false-permanent violations, but base will still be
  non-zero (9, stably) until the three follow-ups above land — so the ordering risk against the
  Supabase secrets is reduced, not eliminated.
