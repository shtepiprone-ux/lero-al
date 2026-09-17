# Task 832 — `check:click-shield` drawer scenario re-pointed, viewport-edge `null` no longer counted as an interception

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)` — see "Revision 1" section at the
bottom. Everything above that section is the original (Revision 0) submission, kept verbatim as the
historical record; review 1 returned `NEEDS REVISION` on one P1 finding (F1 — R4 not fail-closed
across multiple bands), re-entry scoped to kickoff §16 only.

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_832_Click_Shield_Drawer_Trigger_And_Edge_Null_Hit.md`

## 1. Task path and status

`tasks/Sprints/Sprint_75_kickoff_prompt_Task_832_Click_Shield_Drawer_Trigger_And_Edge_Null_Hit.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.

## 2. Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 | Confirmed | `SCENARIOS[1].isDrawerScenario` + `openDrawerScenario()` (`scripts/check-click-shield.mjs`): desktop (`vp.width>=768`) clicks `header.site-header`'s guest login `Button` by accessible name; mobile clicks the hamburger `ActionIcon` by `aria-label`, then the opened drawer's own login `Button`, both names loaded from `messages/<locale>.json` via `loadDrawerTriggerLabels()`. Live proof: `22_final_run1.txt` drawer section, 16/16 `dialog present: true`. |
| R2 | Confirmed | `isAuthSheetSettled(page)` — exactly one `[role=dialog]`/`[role=alertdialog]` AND it contains `input[type=email]`; used both live (`openDrawerScenario`) and in `--verify-gate` arm (c). |
| R3 | Confirmed | `runBand`'s per-candidate loop: `edgeBand = !farOutside && (cy>=innerHeight-0.5 \|\| cx>=innerWidth-0.5)`, routed into the same `excluded` path as below-fold/right-of-viewport. |
| R4 | Confirmed | `edgeBand`-flagged `excluded`/null-hit entries are not added to `resolved`; `finalExcluded` entries still `edgeBand`-flagged after the last band become violations with reason `elementFromPoint returned null at every band` (never a below/above/left/right-of-viewport entry, which is left unchanged). |
| R5 | Confirmed | Arms (a)/(b)/(c) added to `--verify-gate` before the fix; retained red transcript `10_redarms_verify-gate.txt` (arm a and arm c FAIL on old code); green transcript `21_final_verify-gate.txt` (all pass, `EXIT_CODE=0`). |
| R6 | Confirmed | `SCENARIOS[1]` comment names the desktop/mobile trigger paths, `HeaderActions.tsx`/`MobileNavDrawer.tsx` line refs, and Task 787's 2026-09-04 owner decision that removed the Favorites-heart guest branch. `Scenario-open failures` label unchanged in output. |
| R7 | Confirmed | `base`/`modal` unchanged apart from R3/R4: modal 16/16 PASS every run; base 16/16 PASS, 0 cells failing on `elementFromPoint returned null`, across 3 consecutive live runs (`22_final_run1.txt`/`23_final_run2.txt`/`24_final_run3.txt`). |

## 3. Current versus required behavior

**Before.** `npm run check:click-shield` exited 2 on every run for two harness reasons, not a product
regression: (1) the `drawer` scenario's trigger (`header button:has(svg.lucide-heart)`) matched
nothing — Task 787 (owner "скрізь" decision 2026-09-04) removed the guest Favorites-heart branch
that used to open AuthSheet, so 16/16 drawer cells reported `SCENARIO OVERLAY NEVER OPENED`; (2) the
`base` scenario intermittently reported a footer link as blocked with `elementFromPoint returned
null inside the viewport`, because a candidate whose centre sat in the last half-pixel row of the
viewport (measured: `cy` in `[innerHeight-0.5, innerHeight)`) was treated as "inside" by the old
`cx<innerWidth && cy<innerHeight` check, then genuinely returned `null` from Chromium's
`elementFromPoint` (a rounding artefact of the viewport boundary, not a real interception).

**After.** The `drawer` scenario opens the real guest AuthSheet via the header's login `Button`
(desktop-1024) or the hamburger→`MobileNavDrawer`'s own login `Button` (320/375/390), located by
accessible name from `messages/<locale>.json`, and only counts as open when exactly one dialog is
present and it contains `input[type=email]` — so a two-step trigger that stopped after the nav
drawer is a hard scenario-open failure, not a silent false pass. A candidate whose centre sits in
the viewport-edge rounding band (or that genuinely returns `null` even away from the edge) defers
to later scanned bands instead of counting immediately; only a candidate still unresolved after the
final band is reported as a violation, with a reason naming that it was never resolved. `npm run
check:click-shield` exits 0 on the unmodified product (48/48 cells PASS, 0 interceptions), 3
consecutive times. `npm run check:click-shield:verify` proves both fixes still fail when they
should (R5).

**Negative flows (kickoff §11):**

| Negative flow | Applicable | Result |
|---|---|---|
| Trigger label missing in a locale file | Yes | `loadDrawerTriggerLabels()` throws naming the missing key; not exercised live (all 4 locale files have both keys — verified `04_probe832d.txt`), but the throw path exists and would surface as the harness's normal uncaught-exception exit 2. |
| Only the nav drawer opens | Yes | `isAuthSheetSettled` returns `false` when 2 dialogs are present or the single dialog lacks `input[type=email]` — proven by `--verify-gate` arm (c) (`WRONG_DIALOG_PAGE_HTML`, `21_final_verify-gate.txt`: `settled=false`). |
| Candidate centre in last half-pixel row, resolvable later | Yes | Arm (a) (`EDGE_RESOLVED_PAGE_HTML`) — clean post-fix, was a false violation pre-fix. |
| Candidate never resolvable | Yes | Arm (b) (`EDGE_PERMANENT_PAGE_HTML`) — violation in both regimes, reason updated post-fix. |
| Server not running / fixture env missing | Yes | Existing preflight/dev-server-detection paths untouched. |
| Authenticated session | No | Gate is guest-only by design (unchanged). |

## 4. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | R1-R6: drawer scenario re-pointed to real guest openers + R2 settle check; R3/R4 viewport-edge deferral in the band loop; R5 planted arms added to `--verify-gate`. |
| `docs/backlog.md` | Task 832 state line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |
| `docs/sessions/evidence/task832/*` (not `design/`) | I0 baseline, red-arm, post-fix, and final gate-block transcripts (this session). |
| `docs/sessions/2026-09-17-task832-click-shield-drawer-edge-null.md` | This session log. |

`git --no-optional-locks hash-object scripts/check-click-shield.mjs` → `a58ce81647b1bc5062cc7bb09bf90662c60a7a48`
`git --no-optional-locks hash-object docs/backlog.md` → `cadab2c1078d661307c0894f16411fc50e76796c`
`git --no-optional-locks diff --stat` → `scripts/check-click-shield.mjs | 286 +++++++++++++++++++++++++++++++++++++----` (1 file changed, 258 insertions(+), 28 deletions(-)) — `docs/sessions/evidence/task832/30_final_git-diff-stat.txt`.
`git --no-optional-locks status --porcelain` → only `M scripts/check-click-shield.mjs` plus untracked new files under `docs/sessions/evidence/task832/` and this log/backlog edit — `docs/sessions/evidence/task832/31_final_git-status.txt`.

## 5. Validation evidence

All transcripts under `docs/sessions/evidence/task832/`. Node `v22.22.3`, `win32` (`I0_01_check-click-shield.txt`).

### I0 — baseline (before any edit)

| Command | Path | Result |
|---|---|---|
| `npm run build` (fixture env) | `I0_00_build.txt` | `EXIT_CODE=0` |
| `npm run check:click-shield` | `I0_01_check-click-shield.txt` | `EXIT_CODE=2` — matches §3.1 exactly: 16/16 drawer `SCENARIO OVERLAY NEVER OPENED — trigger not found: header button:has(svg.lucide-heart)`; base 1 interception (`elementFromPoint returned null inside the viewport`); `Scenario-open failures: 16`. |
| `npm run check:click-shield:verify` | `I0_02_verify-gate.txt` | `EXIT_CODE=0` (pre-existing arms all pass; Task 832 arms not yet added). |

### Failing-arms-first (R5, before the fix)

| Command | Path | Result |
|---|---|---|
| `npm run check:click-shield:verify` (arms a/b/c added, `isAuthSheetSettled` still the naive pre-fix shape, hit-test threshold still old) | `10_redarms_verify-gate.txt` | `EXIT_CODE=1`. Arm (a): `checked=1, violations=1 … reason: elementFromPoint returned null inside the viewport` (expected `violations=0`) — **wrongly reports a violation, as required**. Arm (c): `wrong dialog … settled=true (expected false)` — **accepts the wrong dialog, as required**. Arm (b) (control): already a violation on old code, consistent with both regimes. Not `BLOCKED — TEST BLIND` since both required arms failed pre-fix. |

### After R3/R4 (hit-test only, before R1/R2)

| Command | Path | Result |
|---|---|---|
| `npm run check:click-shield:verify` | `11_afterR3R4_verify-gate.txt` | `EXIT_CODE=1` — only R5c fails (`isAuthSheetSettled` not yet fixed); R5a/R5b and every pre-existing arm pass. |

### After R1/R2 (full fix, final)

| Command | Path | Result |
|---|---|---|
| `node --check scripts/check-click-shield.mjs` | (inline) | `CHECK_EXIT=0` |
| `npm run check:click-shield:verify` | `12_final_verify-gate.txt` | `EXIT_CODE=0`, all 19 arms pass. |
| `npm run check:click-shield` (live, server 1) | `13_final_live_run1.txt` | `EXIT_CODE=0` — drawer 16/16 `dialog present: true`, 0 interceptions; `Interceptions: 0`. |
| `npm run check:click-shield` (live, server 1, run 2) | `14_final_live_run2.txt` | `EXIT_CODE=0`, identical counts. |
| `npm run check:click-shield` (live, server 1, run 3) | `15_final_live_run3.txt` | `EXIT_CODE=0`, identical counts. |

### §13.2 final gate block (server stopped → build → server restarted → gates)

| Command | Path | Result |
|---|---|---|
| `npm run build` (server stopped) | `20_final_build.txt` | `EXIT_CODE=0` |
| `npm run check:click-shield:verify` | `21_final_verify-gate.txt` | `EXIT_CODE=0` |
| `npm run check:click-shield` ×3 | `22_final_run1.txt` / `23_final_run2.txt` / `24_final_run3.txt` | `EXIT_CODE=0` all three; identical `Scenarios: 3 Cells: 48 Elements checked: 1358 Excluded (below/above-fold): 490 Interceptions: 0 Cleared (transient): 38 Empty-candidate cells: 0 Scenario-open failures: 0` each run (AC5). **Note:** the first attempt at this block (superseded, not kept as evidence) hit a harness artefact — an earlier `npm run start` process survived a `Stop-Process` on its npm wrapper (the actual `next start` child was orphaned, not killed) and degraded under load, producing 16/16 spurious drawer/modal timeouts even on the unchanged `modal` scenario; diagnosed via `netstat`/`Get-Process` (only one PID ever listens on :3000), the orphan was killed directly by PID, a genuinely fresh server started, and the block re-run clean. Not a defect in this diff — `modal` uses the pre-existing, untouched trigger path and failed identically to `drawer` on the stale server. |
| `npm run lint` | `25_final_lint.txt` | `EXIT_CODE=0`, 77 pre-existing warnings / 0 errors, none in `check-click-shield.mjs`. |
| `npm run check:file-integrity` (Bash, no BOM) | `28_final_file-integrity3.txt` | `EXIT_CODE=0`, 30/30 files clean. (Two earlier PowerShell-redirected attempts, `26_`/`27_`, self-flagged their own stray BOM from the `*>` redirect — fixed by stripping BOM from all 20 originally-flagged evidence transcripts via a scope-guarded Node script, then re-running via Bash `>` which does not add a BOM.) |
| `npm run check:mojibake` | `29_final_mojibake.txt` | `EXIT_CODE=0`, 0 artifacts in 5360 files. |
| `git --no-optional-locks diff --stat` | `30_final_git-diff-stat.txt` | 1 file changed (`scripts/check-click-shield.mjs`). |
| `git --no-optional-locks status --porcelain` | `31_final_git-status.txt` | Only the expected changed/untracked paths. |
| `git --no-optional-locks hash-object scripts/check-click-shield.mjs docs/backlog.md` | `32_final_git-hash.txt` (script only; backlog hash re-taken after the backlog edit, quoted in §4) | See §4. |

## 6. Visual source trace

Not applicable — no product UI file was changed (out-of-scope per kickoff §8: `HeaderActions`,
`HeaderView`, `MobileNavDrawer`, `AuthSheet` untouched). The task is a harness/gate-script fix only.

## 7. Canonical UI decision record

Not applicable — no visible artifact was created or changed. `header.site-header` and the accessible
names used by `openDrawerScenario` are read-only references to the existing, unchanged production
DOM/i18n contract (`HeaderView.tsx`'s `site-header` class, `messages/*.json`'s `nav.login`/
`common.aria_open_menu`), not new styling or a new component.

## 8. Implementation validation notes

- **I0 assumptions verified before implementation** (kickoff §5): `04_probe832d.mjs`/`.txt` drove
  the real guest flow at all 16 locale×viewport cells against the fixture server — desktop login
  `Button` visible (`display:flex`) at 1024px in every locale; mobile hamburger→drawer login
  `Button` closes the nav drawer and leaves exactly 1 dialog with `input[type=email]` within
  1000ms, every cell. Neither `Stop:` condition in §5 was hit; no `BLOCKED`.
- **Viewport-edge threshold re-measured at this self-test's own 400×300 viewport** (not just the
  320×812 the kickoff's own probe used): `null` begins exactly at `cy=299.5=innerHeight-0.5`,
  matching the general rule.
- **Native `<button>` intrinsic sizing defeated the first two attempts at the R5a/R5b fixtures** —
  a plain `height:9px`/`height:1px` button rendered at Chromium's UA-stylesheet intrinsic minimum
  instead, inflating `document.documentElement.scrollHeight` past the fixture's intended
  `maxScrollY=0` for the "permanent" page. Fixed with an explicit zeroed style
  (`box-sizing:border-box;padding:0;border:0;margin:0;line-height:1;font-size:0;min-height:0;
  min-width:0`) that makes `getBoundingClientRect()` match the literal CSS box; verified empirically
  (`probe832_debug2..5.mjs` in the scratchpad, not committed) before landing the final fixture HTML.
- **Superseded server-restart artefact** — see the §5 table note; root-caused and does not implicate
  the diff (the unchanged `modal` scenario failed identically on the stale orphaned server).
- No remaining implementation gaps.

## 9. Assumptions, deviations, and limitations

- The phase-2 transient-clearing recheck (`hitTestPage`'s scroll-and-recheck for
  `candidate-transient` results, `:590-621` pre-edit) was **not** given the R3/R4 edge-deferral
  treatment — the kickoff's §3.3 FACT and R3/R4 both cite only the primary per-band hit-test path
  (`:474-491` pre-edit), and R7 requires base/modal unchanged "apart from R3/R4"; extending the fix
  into phase 2 was out of the measured scope and risked an unrequested behavior change. No evidence
  of the edge-null defect in phase 2 was observed in any of the four live runs this session.
- `WRONG_DIALOG_PAGE_HTML`'s fixture uses plain `<button>` elements with no `type` attribute (not
  representative of `MobileNavDrawer`'s real markup) — it exists only to prove `isAuthSheetSettled`
  rejects a dialog without an email field, not to model the real nav drawer's DOM.
- The `desktop`/`mobile` split in `openDrawerScenario` is keyed on `vp.width >= 768`, matching the
  kickoff's own stated boundary and the gate's fixed `VIEWPORTS` (only `desktop-1024` is ≥768); it
  is not a general-purpose breakpoint helper and was not asserted against any other width.

## 10. Opus handoff

- Evidence root: `docs/sessions/evidence/task832/` (I0/red-arm/post-fix/final transcripts, numbered
  chronologically; `design/` subfolder is the pre-existing orchestrator-provided probes, unmodified).
- Real diff: `scripts/check-click-shield.mjs` only (`git diff` / `30_final_git-diff-stat.txt`).
- Worth an adversarial look: (1) the `edgeBand` bookkeeping in `runBand`/`hitTestPage` — confirm the
  `finalExcluded` → violation conversion only fires for `edgeBand`-flagged entries, never for an
  ordinary below/above/left/right-of-viewport candidate (R7's "base/modal unchanged apart from
  R3/R4" claim rests on this); (2) `openDrawerScenario`'s two-branch (desktop vs. mobile) control
  flow against `HeaderActions.tsx`/`HeaderView.tsx`/`MobileNavDrawer.tsx` as currently on `HEAD`;
  (3) the `04_probe832d.mjs` I0 probe and the final live 16/16 drawer results agree independently.

## 11. Backlog update

`docs/backlog.md` — added one concise state line under "Last Session (2026-09-17)" naming Task 832's
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` status, the fix shape, and this session log's path.
Resulting physical line count: **79** (was 78; budget 80). No `BACKLOG LIMIT BREACH`.

---

## Revision 1 — response to review 1 `NEEDS REVISION` (kickoff §16)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.**

### R1.1 Finding addressed

**F1 (P1 HIGH)** — `hitTestPage`'s post-loop conversion inspected only the FINAL band's `edgeBand`
flag. A candidate deferred at band *k* lands in `[-0.5, 0)` at band *k+1* (an ordinary `above-fold`
exclusion, `edgeBand: false`), and if band *k+1* isn't itself the final band, that benign
classification survives unquestioned to the final band — silently dropping the case even when a
real element covers it. Review 1's own probe (`docs/sessions/evidence/task832/review1/
r1_multiband_edge_probe.txt`) reproduced this live on the working tree at the time
(`a58ce81647b1bc5062cc7bb09bf90662c60a7a48`): a 1000px-tall fixture (bands 0/300/600/700) with the
target deferred at band 0 and landing `above-fold` at band 300 — both a clean control (p1) and a
really-covered control (p2, a `z-index:5` span at the exact same document position) ended identically
as `excluded=[above-fold]`, `violations=0`.

### R1.2 R8 — sticky deferral + targeted recheck

`hitTestPage` now keeps a `deferredInfo` Map (index → latest snapshot, including `docCentreY`)
populated whenever ANY scanned band flags a candidate `edgeBand` (the R3 viewport-edge case, or a
`null` hit even away from the edge). After the band loop, every deferred index not already resolved
some other way gets exactly ONE targeted recheck: scroll to
`clamp(round(docCentreY − innerHeight/2), 0, maxScrollY)` (centres the candidate's document-space
midpoint in the viewport — the best chance of landing it clear of any edge), re-read the same
candidate by `CANDIDATE_SELECTOR` + index, recompute its centre, and classify once:

- inside the (tightened) R3 bounds and self/descendant/ancestor-of-self or N6-exempt → **clean**
  (never appears in `violations` or `excluded`);
- inside the R3 bounds and a real, non-exempt element is hit → **violation**, interceptor =
  `describe(hit)`, reason `intercepted at targeted recheck offset <offset>`;
- still outside the R3 bounds after centering (e.g. an unfixable right-edge `cx`), `hit` is `null`,
  or the element is gone → **violation**, reason `elementFromPoint returned null at every band`.

A deferred index never appears in the returned `excluded`, whatever its own last band's reason was —
`excluded` is now filtered by `deferredInfo.has(index)` membership, not by the final band's
`edgeBand` flag alone. A candidate never deferred keeps today's exclusion behavior unchanged (R7).
The old `unresolvedEdgeViolations` block (final-band-only) is removed and replaced by this mechanism.

### R1.3 R9 — two more planted arms, red first

Added to `--verify-gate` (reusing `EDGE_TARGET_STYLE`, body 1000px tall so the band after the
deferral band is NOT the final band):

- **arm (d)** `/edge-multiband-clean` — nothing covering the deferred target. Expected `violations=0`
  **and** `excluded=0` (new `expectExcludedZero` case field, printed and asserted by the runner).
- **arm (e)** `/edge-multiband-intercepted` — the same page plus a covering `<span>` at the exact
  document position review 1's probe used. Expected `violations≥1` with a real interceptor.

**Red-first, AC6.** Since R8 had already landed in the working tree by the time these arms were
authored, the pre-R8 code no longer exists as a runnable file. Reused Opus's own review-1 method
(`docs/sessions/evidence/task832/review1/r1_build_probe.mjs`): extracted the exact blob the review
inspected via `git cat-file -p a58ce81647b1bc5062cc7bb09bf90662c60a7a48` (still reachable in the
object store), stripped its `main()` entry point, and called its own `hitTestPage()` directly against
the new arm (d)/(e) fixtures (builder: `docs/sessions/evidence/task832/40_r1_build_redarms_probe.mjs`).
Result, `docs/sessions/evidence/task832/40_r1_redarms_verify-gate.txt`:

```
FAIL Task 832 R9 arm (d) — multiband deferral, nothing covering (must be clean AND unexcluded): checked=0, violations=0, cleared=0, excluded=1["above-fold"]
FAIL Task 832 R9 arm (e) — multiband deferral, real interceptor (must FAIL with a real interceptor): checked=0, violations=0, cleared=0, excluded=1["above-fold"]
AT_LEAST_ONE_ARM_FAILED
EXIT_CODE=1
```

Matches the review's own predicted failure shape exactly (§16.3: "(d) fails on `excluded=1`, (e)
fails on `violations=0`"). Not `BLOCKED — TEST BLIND`.

### R1.4 Acceptance criteria — revision 1

- **AC6 [R9]** — quoted above (§R1.3). Both arms fail pre-R8, matching the predicted shape.
- **AC7 [R8, R9]** — `docs/sessions/evidence/task832/41_r1_verify-gate.txt`, full `--verify-gate` on
  the post-R8 code, 21/21 arms pass, `EXIT_CODE=0`:
  ```
  ✅ Task 832 R5a — viewport-edge rounding, resolved at a later band (scroll clears it): checked=1, violations=0, cleared=0, excluded=0 (expected violations=0)
  ✅ Task 832 R5b — viewport-edge rounding, page height == viewport (never resolvable): checked=0, violations=1, cleared=0, excluded=0 (expected violations>0)
     blocked: button. @ (40,299)
     interceptor: undefined.undefined
     reason: elementFromPoint returned null at every band
  ✅ Task 832 R9 arm (d) — multiband deferral, nothing covering (must be clean AND unexcluded): checked=0, violations=0, cleared=0, excluded=0 (expected violations=0, excluded=0)
  ✅ Task 832 R9 arm (e) — multiband deferral, real interceptor (must FAIL with a real interceptor): checked=0, violations=1, cleared=0, excluded=0 (expected violations>0)
     blocked: button. @ (40,299)
     interceptor: span.
     reason: intercepted at targeted recheck offset 150
  ```
  ```
  ✅ GATE IS FUNCTIONAL — planted shield detected, clean page passes, N6 overlay exemption works.
  EXIT_CODE=0
  ```
- **AC8 [R7, R8]** — full §13.2 block re-run on the final script (server hygiene: `Get-NetTCPConnection
  -LocalPort 3000` used to find and kill the real listening PID, per §16.6, not the npm wrapper).
  `npm run check:click-shield` × 3, all `EXIT_CODE=0`, identical summaries each run:
  ```
  Scenarios: 3  Cells: 48  Elements checked: 1358  Excluded (below/above-fold): 490  Interceptions: 0  Cleared (transient): 38  Empty-candidate cells: 0  Scenario-open failures: 0
  ```
  (`44_r1_run1.txt` / `45_r1_run2.txt` / `46_r1_run3.txt`). No live run reported a violation with
  reason `intercepted at targeted recheck offset` or `null at every band` — `Interceptions: 0` in
  every run (grep-verified empty across all three transcripts) — so no stop-and-report was triggered.
  `git --no-optional-locks hash-object scripts/check-click-shield.mjs docs/backlog.md` →
  `6de5dd7604d480794c14b9e838c10c6ee15c3d9a` / `265b365a4c859aaa2bb78d745982303c3aca7e42`
  (`53_r1_git-hash.txt`).

### R1.5 Full command log — revision 1

| Command | Path | Result |
|---|---|---|
| `node --check scripts/check-click-shield.mjs` (after R8) | (inline) | `SYNTAX_OK` |
| `node --check scripts/check-click-shield.mjs` (after R9) | (inline) | `SYNTAX_OK` |
| Red-arm builder + probe (AC6) | `40_r1_build_redarms_probe.mjs` / `40_r1_redarms_verify-gate.txt` | `EXIT_CODE=1`, both arms FAIL as predicted |
| `npm run check:click-shield:verify` (post-R8/R9, no server) | `41_r1_verify-gate.txt` | `EXIT_CODE=0`, 21/21 arms pass |
| `npm run build` (server stopped) | `42_r1_build.txt` | `EXIT_CODE=0` |
| `npm run start` (server restarted; PID found via `Get-NetTCPConnection`) | `server_r1.log` / `server_r1.pid.txt` | ready |
| `npm run check:click-shield:verify` (server running) | `43_r1_verify-gate.txt` | `EXIT_CODE=0` |
| `npm run check:click-shield` ×3 | `44_r1_run1.txt` / `45_r1_run2.txt` / `46_r1_run3.txt` | `EXIT_CODE=0` all three, identical summaries |
| `npm run lint` | `47_r1_lint.txt` | `EXIT_CODE=0`, 0 errors (78 pre-existing warnings), none in `check-click-shield.mjs` |
| `npm run check:file-integrity` | `48_r1_file-integrity.txt` (1 stray-BOM self-artifact from a PowerShell `Out-File`) → stripped → `49_r1_file-integrity2.txt` | `EXIT_CODE=0`, 50/50 clean |
| `npm run check:mojibake` | `50_r1_mojibake.txt` | `EXIT_CODE=0`, 0 artifacts in 5382 files |
| Server stopped (real PID via `Get-NetTCPConnection`) | (inline) | port 3000 clean |
| `git --no-optional-locks diff --stat` | `51_r1_git-diff-stat.txt` | `scripts/check-click-shield.mjs \| 408 ++++++++++++++++++++++++++++++++++++++---` (1 file changed, 378 insertions(+), 30 deletions(-)) |
| `git --no-optional-locks status --porcelain` | `52_r1_git-status.txt` | only the expected changed/untracked paths |
| `git --no-optional-locks hash-object scripts/check-click-shield.mjs docs/backlog.md` | `53_r1_git-hash.txt` | quoted in §R1.4 AC8 |

### R1.6 Files Changed — revision 1 (in addition to §4 above)

| Path | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | R8 (sticky deferral + targeted recheck, replaces the final-band-only conversion) + R9 (arms d/e added to `--verify-gate`, `expectExcludedZero` case field). |
| `docs/backlog.md` | Task 832 line updated: `NEEDS REVISION` → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`. |
| `docs/sessions/evidence/task832/40_*`–`53_*` | Revision 1 evidence (red-arm probe + builder, post-fix verify-gate, final §13.2 block, git checks). |
| `docs/sessions/2026-09-17-task832-click-shield-drawer-edge-null.md` | This "Revision 1" section. |

**Superseded (kept, not deleted, per §16.6):** `12_final_verify-gate.txt` through `32_final_git-hash.txt`
(and the intervening `20_`–`31_` §13.2-block transcripts) described the script at hash `a58ce816…`,
which R8 changes. They remain valid evidence for R1/R2/R3/R5(a-c)/R6's original AC1–AC5 (§16.6:
"Reuse, do not re-run" — R1/R2, `openDrawerScenario`, `isAuthSheetSettled` and
`loadDrawerTriggerLabels` were inspected in review 1 and not reopened, and were not touched in this
revision), but are no longer the current-script evidence for R3/R4 specifically — §R1.4 AC7/AC8
above supersede them for R3/R4/R8.

### R1.7 Assumptions, deviations, and limitations — revision 1

- The targeted-recheck's interceptor `describe()` (inlined inside the new `page.evaluate()` closure,
  per this file's existing convention of duplicating DOM helpers across evaluate boundaries) omits
  `nearestPositionedAncestor` (always `null`) — unused by any consumer: neither the live gate's
  printer nor the self-test's printer reads that field off a `violations` entry (only `cleared`
  entries do, an unrelated code path). Confirmed by inspection, not just omission.
- `docCentreY` is computed once, from whichever band first (or most recently) flagged the candidate
  `edgeBand`; this is safe only because these candidates are static/absolute-positioned document-flow
  elements, whose document-relative position does not change with scroll — the same invariant the
  pre-existing phase-2 transient-clearing mechanism already relies on.
- No change to R1/R2/R3/R5(a-c)/R6/`openDrawerScenario`/`isAuthSheetSettled`/
  `loadDrawerTriggerLabels`, per §16.6.
- The §11 negative-flow table amendment (§16.4 — missing locale label is a fatal `exit 2`, not a
  per-cell failure) required no code change, confirmed by inspection: `loadDrawerTriggerLabels` is
  called in `runChecks`' locale loop, outside the per-cell `try`, so a thrown `Error` reaches
  `main().catch` unconditionally.

### R1.8 Opus handoff — revision 1

- New evidence root: `docs/sessions/evidence/task832/40_*` through `53_*`.
- Worth an adversarial look: (1) the `deferredInfo`/`resolved` interplay — confirm a candidate that
  becomes `candidate-transient` (fixed/sticky occlusion) at some band before ever needing the R8
  recheck is correctly skipped by `if (resolved.has(idx)) continue;`; (2) the AC6 methodology itself
  (extracting a blob via `git cat-file` and running its `hitTestPage` directly) — same technique the
  review's own F1 probe used, but worth independently confirming the extracted `hitTestPage` is
  byte-identical to what review 1 inspected; (3) whether `docCentreY`'s single-band snapshot could
  ever be stale for a candidate whose bounding rect legitimately changes between the band that
  deferred it and the recheck (not observed in any fixture or live run, but not proven impossible for
  an arbitrary page).
