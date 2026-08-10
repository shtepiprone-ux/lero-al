# Task 740 — the clearing box must be the fixed system's whole extent

**Kickoff:** `tasks/Sprints/Sprint_54_kickoff_prompt_Task_740_ClickShield_System_Extent.md`, with
`Sprint_54_Task_740_execution_contract.md` and `Sprint_54_Task_740_rule_compliance_ledger.md`.
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Zero `cleared → blocked` transitions against
a 3-run baseline union, and the surviving-violation set is empty (vacuously satisfying R5(2)'s
genuineness requirement) — base reached 0 in all 3 post-fix runs, with the full identity set diff and
three round-tripped control fixtures as the actual evidence, not the number alone.

**Evidence root:** `.screenshots/task740-evidence/` (gitignored, local-only, D6).

---

## 0. Dirty-worktree manifest and backlog baseline (Checkpoint 0, R10/R11)

`git status --porcelain` at task start: **empty — clean worktree** (`J0-status.txt`). 739's landed fix
already in `HEAD` (commit `517b9a3ad`). `git show HEAD:docs/backlog.md | wc -l` → **90** (baseline).

---

## 1. R1 — baseline union and census on all four survivors (Checkpoints 1-2)

**Baseline** (3 full sweeps against the currently-committed, 739-landed `union(hit, ancestor)` code,
`I1-baseline-run1/2/3.log`): violations fluctuated 2/4/4 per run, but the **union** of blocked
identities across all 3 is stable: `{sq-Instagram, en-Instagram, it-Facebook, it-Instagram}` —
matching the kickoff's prediction exactly. Confirmed cleared in the same runs: `sq-Facebook`,
`en-Facebook`, `FavoriteButton` ×4 locales (739's two wins, `I1-union.json`).

**Census** (`I2-census.json`, 3 runs × 4 survivors = 12 measurements): for every survivor, computed
`computeAncestorExtent()` — the ancestor's own rect unioned with every hit-testable descendant's rect
— and compared its resolved offset against the landed `union(hit, ancestor)` box:

| Target | `hit` | `hitRect.top` | `ancRect.top` | `extent.top` | landed box resolves clean | extent box resolves clean |
|---|---|---|---|---|---|---|
| `sq Instagram` | `.navItem` | 757 | 756 | **745** | 0/3 | **3/3** |
| `en Instagram` | `.navItem` | 757 | 756 | **745** | 1/3 (flaky) | **3/3** |
| `it Facebook` | `.fabLabel` | 792 | 756 | **745** | 0/3 | **3/3** |
| `it Instagram` | `.navItem` | 757 | 756 | **745** | 1/3 (flaky) | **3/3** |

**`extent.top` is 745 in every single measurement — exactly `.fabLink`'s own top**, confirming §3.2's
hypothesis: `.fabLink` is the true blocking edge in all four cases, even though it was never the
reported `hit`. The extent box resolves all 4 survivors clean in **all 12** measurements; the landed
box resolves inconsistently (0-1 of 3 per target) — reproducing exactly the flakiness kickoff §3.4
warned about (`sq Instagram`'s own `I2b` row from 739's evidence: identical inputs, opposite
verdicts). **OQ4 does not trigger** — the census confirms, not contradicts, §3.2/§3.3.

---

## 2. R2/R3 — the inclusion rule (Checkpoint 3)

Full prose + predicate + per-exclusion hit-testing justification: `I3-inclusion-rule.md`. Summary: a
descendant counts toward the ancestor's extent iff it is hit-testable (`pointer-events !== 'none'`,
`visibility !== 'hidden'`, `display !== 'none'`, non-zero area) — every check reads only
`getComputedStyle()`/`getBoundingClientRect()`, matching the file's existing classifier convention
(`nearestFixedOrStickyAncestorOf`). **No identity-keyed condition anywhere** — R3/Task 724 F1: a
`.fabLink` special case was the tempting shortcut and is explicitly not what was built; `.fabLink` is
included because it is hit-testable and overflows, the same rule that includes/excludes everything
else. OQ1: no additional exclusion category was found necessary beyond the four listed, verified
against both real production ancestors and all three self-test fixture subtrees.

---

## 3. R4 — cost measurement and caching (Checkpoint 4)

Full detail: `I4-cost.md`. **Caching decision (OQ2): per-ancestor, per-band.** `extentCache` is a
`Map` local to each `runBand` `page.evaluate()` call (one band, one cell), keyed by the ancestor DOM
node — first candidate resolving to a given ancestor computes the extent, every later candidate
resolving to the same ancestor in the same band reads the cache. Not persisted across bands/cells,
since `page.evaluate()` calls don't share JS heap state (the same constraint 727 already worked
around for `N6_EXEMPT_PREDICATE_BODY`) and the DOM genuinely differs by cell (locale, viewport, open
Drawer/Modal). **Measured wall-clock, post-fix, 3 runs: 89s / 90s / 86s** — against 729's own recorded
87s baseline. No material slowdown; nowhere near the 261s (3×) stop-and-report threshold.

---

## 4. R5/R12 — the over-extension control, round-tripped (Checkpoint 5/7)

Added `OVEREXTENSION_TRANSIENT_PAGE_HTML` / `OVEREXTENSION_PERMANENT_PAGE_HTML`: a fixed bar (60px)
containing a `pointer-events:none` decoration extending 500px past it, with the target button inside
the bar's own solid box (needing to clear only the bar, not the decoration).

**Under a deliberately naive union-everything rule** (`isHitTestableForExtent` temporarily forced to
return `true` unconditionally, for this capture only — `I5-verify-pre.log`): **the transient fixture
correctly `FAIL`s** (`violations=1, cleared=0`) — the inflated extent (`-260..300`) generates an
offset that lands the candidate off-screen, proving this is a real control for the over-extension
direction, not decoration. All 13 other cases pass under the naive rule too (expected — only this one
fixture is sensitive to the `pointer-events` filter).

**Under the correct, filtered rule** (`K2-verify-post.log`): **14/14 pass.** The over-extension
fixture now resolves `cleared=1, scrollY=51` (clearing only the bar's own 60px, as intended); its
permanent twin still `FAIL`s (C5). All three control pairs (overhang, containment, over-extension)
plus the original 8 cases are green.

---

## 5. R5(1)/R6 — the post-fix identity set diff (Checkpoints 8-9)

3 full sweeps against the rebuilt app (`K3-sweep-run1/2/3.log`): **base = 0 in all 3 runs**,
`checked=1772`/`excluded=40` every time (exact match to 729's landed baseline),
`WALL_CLOCK_SECONDS` 89/90/86. Drawer/Modal both 0/16 in every run.

Full set diff: `K4-setdiff.md`. **Zero ADDED identities. Zero `cleared → blocked` transitions** —
including for both of 739's wins (`sq`/`en` Facebook, `FavoriteButton` ×4), which were never at risk
since the extent box is a superset of the landed box wherever it differs, identical where it doesn't.
**R5(2)'s genuineness requirement is vacuously satisfied** (`K5-genuineness.json`): there are no
surviving violations to prove genuine or label a suspected false positive. **R7's band-scan-dedup
re-measurement is correspondingly moot** — nothing survived to attribute to that or any other
mechanism. **OQ3 answered: no, nothing survives the extent box.**

---

## 6. Task 725's plant — still loud, more dramatically than before (Checkpoint 10)

`FooterView.module.css`'s `padding-bottom: var(--space-14)` removed as a reversible probe. Rebuilt
(`K6-plant-build.log`, exit 0), server restarted cleanly, ran `--scenario=base`:

```
[base] cells=16  checked=556  excluded=0  violations=24
```

**24 violations, up from the post-fix baseline of 0** — an even cleaner signal than 739's own 3-4→24
(since the post-fix baseline is now unambiguously 0, not a flaky 3-4). Restored byte-identical:
`git hash-object` → `d2c6588aec6bba3c155ea2b68b4f7819c6139d9d` (`K6-restore.txt`, matches every prior
task's recorded value), `git status --porcelain` for that path → empty. Rebuilt again with the
restored file (`K7-restore-build.log`, exit 0) before final gates.

**R8 — comment audit:** `grep -n 'ancRect\b|the post-fix generator|hit's own box'` → no matches
(`K7-comment-audit.txt`). The geometry block, the call-site comment, and the `/overhang-*` fixture
comment (which previously described the now-superseded `hit`-only mechanism) were all corrected to
describe the extent, naming Task 740 and the date.

---

## 7. OQ1–OQ4 dispositions

- **OQ1** — answered in `I3-inclusion-rule.md`: no exclusion category beyond the four
  (`pointer-events:none`, `visibility:hidden`, `display:none`, zero-area) was found necessary,
  verified against both real ancestors and all three fixture subtrees.
- **OQ2** — answered in `I4-cost.md`: cached per-ancestor, per-band; not across bands/cells, with the
  reasoning stated (DOM genuinely differs by cell; `page.evaluate()` calls don't share JS heap state).
- **OQ3** — answered in §5/`K5-genuineness.json`: no, nothing survives the extent box.
- **OQ4** — no contradiction; §1's census confirms §3.2/§3.3.

---

## 8. Standing gates (Checkpoint 11)

- `npx tsc --noEmit` → exit 0 (`K8-tsc.log`).
- `npm run check:i18n` → exit 0, 2218 keys, 4-locale parity (`K8-i18n.log`).
- `npm run check:design-tokens:strict` → exit 0, 0 violations (`K8-design-tokens.log`).
- `npm run build` → exit 0 at every stage: baseline (`I0-build.log`), post-plant
  (`K6-plant-build.log`), final restored (`K7-restore-build.log`).
- `git status --porcelain` → `M scripts/check-click-shield.mjs` only — no application file (R12 met).

---

## 9. Files Changed

| File | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | The extent fix: `computeAncestorExtent` unions the fixed/sticky ancestor's rect with every hit-testable descendant that overflows it (not `union(hit, ancestor)`). New `isHitTestableForExtent` inclusion-rule predicate. Per-ancestor-per-band `extentCache`. Third self-test control pair (over-extension). Comments corrected, naming Task 740. |
| `docs/backlog.md` | Last-Session block replaced; Task 740 registry row updated; Sprint 54 line updated. |
| `docs/sessions/2026-08-09-task740-clickshield-system-extent.md` | This session log. |

`src/components/layout/FooterView.module.css` touched only as a reverted plant — restored
byte-identical, confirmed absent from `git status --porcelain`.

---

## 10. Acceptance-criteria self-audit

| AC | Evidence | Result |
|---|---|---|
| AC1 | §1, `I2-census.json` | Met — census on all 4 survivors, ≥3 runs, 745 edge proven |
| AC2 | §2, `I3-inclusion-rule.md` | Met — prose + predicate, every exclusion justified by hit-testing |
| AC3 | §2 | Met — no identity-keyed condition |
| AC4 | §5, `K4-setdiff.md` | Met — zero `cleared → blocked` |
| AC5 | §5, `K5-genuineness.json` | Met — vacuously (no survivors) |
| AC6 | §4 | Met — 14/14 green, over-extension control round-tripped |
| AC7 | §5, `K3-sweep-run1/2/3.log` | Met — Drawer/Modal 0/16 every run, `checked` reported per scenario |
| AC8 | §3, `I4-cost.md` | Met — cost measured, caching decision stated, wall-clock reported |
| AC9 | §5, §7 | Met — R7 moot (nothing survived), OQ1-4 all dispositioned |
| AC10 | §6, §8 | Met — comment fix present, all 4 standing gates exit 0, no product file |
| AC11 | §0, §11 | Met — baseline quoted pre-edit (90), Files Changed table above |
| AC12 | §11 | Met — file-integrity/mojibake run twice, counts reconciled |

---

## 11. Backlog update and counting gates

Baseline before this edit: **90** (§0). "Last Session" replaced; Task 740 registry row, the Sprint 54
line, and the Supabase-secrets pending-action row all updated to reflect
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Line count after this edit (`wc -l docs/backlog.md`):
**90** — net zero growth.

Counting gates, run after this session log and the backlog update both exist:
`npm run check:file-integrity` → **3** files (`scripts/check-click-shield.mjs`, `docs/backlog.md`,
this session log), PASSED, exit 0 (`K9-file-integrity.log`). `npm run check:mojibake` → 2147 files,
0 artifacts, exit 0 (`K9-mojibake.log`).
