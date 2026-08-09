# Task 733 — Stop discarding every form control inside an overlay

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **QA profile:** `Q4` Release/Critical Flow.
**Kickoff:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_733_Overlay_Hosted_Controls.md` +
`Sprint_52_Task_733_execution_contract.md` + `Sprint_52_Task_733_rule_compliance_ledger.md`.
**Evidence root:** `.screenshots/task733-evidence/` (28 artifacts, listed in §11).

---

## 1. Task path and status

`tasks/Sprints/Sprint_52_kickoff_prompt_Task_733_Overlay_Hosted_Controls.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

---

## 2. Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1 — census re-derived from a fresh manifest | `.screenshots/task733-evidence/I1-census.json` — fresh `build-storybook` + `screenshots:assert --mantine-only` run (`.screenshots/rendered-assert/2026-08-09T12-33/`), 1164/1204 PASS/18 FAIL/22 AMBIGUOUS (matches the standing comparator exactly). Applicable=**864** (not the kickoff's 852 — reconciled in §4), dialog-hosting=**156** (matches kickoff), blind=**120** (matches kickoff, exactly the 10 named stories × 12 cells). |
| R2 — live DOM census, per blind story | `.screenshots/task733-evidence/I2-overlay-dump.json` / `I2-overlay-dump-stdout.txt` — temporary Playwright probe (`.tmp-task733-census.mjs`, Task 711/722 precedent, deleted after use) opened all 10 blind stories at 375px. See §5. |
| R3 — replacement is gate-evaluated, never author-appliable | `.screenshots/task733-evidence/K1-gate-diff.txt` — both `el.closest('[role="dialog"]')` skips (arms 1 and 3) **removed**, not narrowed; the census (R2) found no overlay class where the comparison is meaningless, so removal — matching sibling assertion (d)'s zero-skip precedent — is the correct outcome per §7.3/OQ1. |
| R4 — comment naming task, census, date | `scripts/check-stories-rendered.mjs:1145-1164` — new comment block naming Task 733, `I2-overlay-dump.json`, and 2026-08-09, following the file's existing per-exemption convention. |
| R5 — two-armed plant | §6 below — planted narrowed `TextInput` inside the open `Modal/Default` dialog resolves `false` ×12 (all locales × mobile widths), named `task733-probe-narrow`; removed, cell returns to `null` (prior value). |
| R6 — probe reverted, evidenced | `.screenshots/task733-evidence/K4-restore.txt` — `git hash-object` post-revert `cf20660058c313e3a7411cc372ab10cc9339e03f` == pre-probe hash; `git status --porcelain -- src/stories/mantine/primitives/Modal.stories.tsx` empty. |
| R7 — every newly-`false` cell named/attributed/escalated, none suppressed | **Zero cells newly resolve `false` without a plant** (§7). The only natural-data change is `FiltersPanelShell/Default` moving `null→true` (12 cells) — not a failure, a correct new measurement. Nothing to escalate; explicitly stated, not silently omitted. |
| R8 — assertion (d) untouched | `.screenshots/task733-evidence/K1-gate-diff.txt` — diff touches only assertion (b)'s block (comment + 2 line removals); `isChipSetMember`, `FULL_WIDTH_TOLERANCE`, `MANTINE_VIEWPORTS`, assertion (d) read byte-identical (confirmed by reading the diff hunks — no other region touched). |
| R9 — final matrix vs comparator, every moved cell attributed | `.screenshots/task733-evidence/K6-final-matrix.log` + `K6-final-matrix-summary.json` — final probe-free matrix `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`, fail set byte-identical to the R1 baseline (0 added, 0 removed). Blind count **120 → 108** (delta −12), entirely attributed to `FiltersPanelShell/Default`. Two transient, unrelated `blank-canvas` render flakes investigated and ruled out — see §7. |
| R10 — `check:assertion-liveness`, LIVE-THIN before/after | `.screenshots/task733-evidence/K7b-assertion-liveness-before.log` (before: `fullWidthControlsAtMobile` LIVE 180/1204, LIVE-THIN 20.8%) and `K7-assertion-liveness.log` (after: LIVE 192/1204, LIVE-THIN 22.2%). Both exit 0, 5 LIVE / 0 DEAD / 0 STALE / 0 ORPHAN. |
| R11 — `tsc`/`build` exit 0 | `.screenshots/task733-evidence/K8-tsc.log` exit 0 · `K10-build.log` exit 0. |
| R12 — backlog baseline read first, counting gates last | `.screenshots/task733-evidence/J0-backlog-linecount.txt` — `git show HEAD:docs/backlog.md \| wc -l` = **90 lines**, read at Checkpoint 0 before any edit. Counting gates: §9 below, two passes. |

**AC1–AC10:** all satisfied — see the R-row each AC maps to above; AC4/AC5 detailed in §6, AC10 in §9.

---

## 3. Current versus required behavior

**Before.** `fullWidthControlsAtMobile` discarded every candidate matching arms 1 (`.mantine-Select-input`) and 3
(bare text inputs) inside `[role="dialog"]`, via `if (el.closest('[role="dialog"]')) continue;` — two uncommented
lines. 120 of 852 (now 864, see §4) applicable `<640` cells that host an open dialog resolved `null` (nothing
measured), while the sibling assertion (d) 30 lines below has never excluded overlay content and already reports 4
real failures inside the same dialogs (`NotificationBellView` "Mark all as read" × 4 locales).

**After.** Both skips are removed. The census (§5) shows this was never a uniform "every overlay is blind" defect:
9 of the 10 previously-blind stories render **zero** assertion-(b)-class candidates inside their open dialog at all
(their story fixtures hold no `Select`/`Tabs`/text-input — the skip was never the actual reason they read `null`).
The 10th, `FiltersPanelShell`, renders 5 `TextInput`s inside its bottom sheet, all already full-width — those 12
cells now correctly resolve `true` instead of `null`. The blind-cell count drops from 120 to 108. The two-armed
plant (§6) proves the removed skip was live and reachable: a narrowed control inside an open dialog now resolves
`false` and is named, where before the skip would have silently discarded it.

**Negative flows (from the kickoff's applicability table):**

| Negative flow | Applicable | Result |
|---|---|---|
| The skip is removed and nothing changes | Yes (A3) | Did not occur naturally — blind count moved 120→108; the "no natural FAIL" outcome is explained by measured census data (§5), not by the edit failing to take effect, and is independently proven reachable by the plant (§6) |
| New failures are suppressed to keep the matrix green | Yes | Did not occur — final matrix fail set is byte-identical to baseline; nothing to suppress |
| The replacement keys on an author-appliable property | Yes | Did not occur — the condition was **removed**, not re-expressed as another DOM property (724 F1/D33) |
| A narrow overlay (Tooltip) produces meaningless comparisons | Yes (OQ1) | Ruled out — `Tooltip/Default`'s dialog hosts zero assertion-(b) candidates; no comparison occurs there at all, meaningless or otherwise |
| 722's `checkedAny` is broken while editing the same block | Yes | Did not occur — `Alert/Default` (control-free) still resolves `null` on every `<640` cell, never `true` (§8) |
| Assertion (d) edited "while we're in there" | Yes (R8) | Did not occur — diff isolated to assertion (b) |
| Locale / i18n regression | No | `check:i18n` run as a guard, PASSED (2218/2218/2218/2218 parity) |
| Visual / layout regression | No | No `src/` change; the matrix is the witness |

---

## 4. R1 — census reconciliation (kickoff §3.2 vs fresh manifest)

The kickoff's 852/156/120 figures were a 2026-08-08T12-27 snapshot (the run Task 722 shipped against). Re-deriving
from a fresh manifest taken 2026-08-09 (after Task 678 landed) gives **864 applicable, 156 dialog-hosting, 120
blind**. Per A2, the fresh numbers win and the difference is reported:

- **Applicable: 852 → 864 (+12).** Task 678 (`AdminUsersTable` per-story enrolment) landed after the kickoff's
  snapshot and added 12 applicable `<640` cells for a story with no open dialog
  (`popupBottomSheetAtMobile === null`) and `fullWidthControlsAtMobile === true` already — confirmed by direct
  manifest query. Not blind, not dialog-hosting; a denominator-only shift.
- **Dialog-hosting: 156 (unchanged).** Confirmed identical.
- **Blind: 120 (unchanged), across exactly the kickoff's 10 named stories.** The dialog-hosting set actually spans
  **13** stories (156 cells) — the 10 blind ones plus `Combobox/Default`, `RangeDatePicker/Default`,
  `Select/Default`, whose `fullWidthControlsAtMobile` already resolved `true` pre-edit (measured via a candidate
  *outside* the dialog, e.g. the closed trigger). Consistent with the kickoff's own framing of "10 blind stories".

Full detail: `.screenshots/task733-evidence/I1-census.json`.

---

## 5. R2 — the overlay DOM census (answers OQ1)

Method: a temporary standalone Playwright probe (`.tmp-task733-census.mjs`, Task 711/722 precedent — not committed,
deleted after use) opened each of the 10 blind stories at 375×812 (clicking the story's open-trigger for the 8
primitives that need one; `FiltersPanelShell`/`MobileNavDrawer` render pre-opened, matching the harness's own
`MANTINE_OVERLAY_PRIMITIVES` exclusion for those two), then dumped every `[role="dialog"]` element's geometry and
every assertion-(b)-class candidate's `insideDialog`/`offsetWidth`/`parentContentWidth`.

Raw dump: `.screenshots/task733-evidence/I2-overlay-dump.json`.

| Story | Dialog shape | In-dialog candidates | Result |
|---|---|---:|---|
| `Drawer`, `DropdownMenu`, `MobileNavDrawer`, `Modal`, `NavigationMenu`, `NotificationBellView`, `Popover`, `Tooltip`, `Patterns/Mantine/DialogDrawerPattern` | `.mantine-Drawer-content[role="dialog"]`, edge-to-edge, bottom-anchored (confirms Task 711's convergence census) | **0** | Story fixture renders no `Select`/`Tabs`/text-input at all — the skip was never the reason these read `null` |
| `FiltersPanelShell` | same shape | **5** (all `TextInput`, `mantine-TextInput-input`) | All 5 already `offsetWidth === parentContentWidth` (`fullWidth:true`) — a bottom sheet is full-bleed by construction |

**Answers OQ1:** no overlay class produces a meaningless comparison. The 9 zero-candidate stories have nothing to
compare (dialog or not); the 1 story with candidates measures correctly. Removal, not narrowing, is the correct
outcome — the census explicitly authorizes what §3.4 predicted but withheld.

---

## 6. R4/R5/R6 — the two-armed plant

**Plant.** `src/stories/mantine/primitives/Modal.stories.tsx` — `ModalStandardSection`'s open `MantineModal` body
gained one temporary `TextInput` (`placeholder="task733-probe-narrow"`, `styles={{ input: { width: '100px' } }}`),
chosen because the story constructs its own dialog children directly (unlike `FiltersPanelShell`, which renders a
production component's internals with no story-level style lever). Pre-probe hash: `cf20660058c313e3a7411cc372ab10cc9339e03f`.

- **Applied** → `build-storybook` (`K1c-build-storybook-plant.txt`, exit 0) → `screenshots:assert --mantine-only`
  (`K3-plant.log`): `1152/1204 PASS, 30 FAIL` = the 18 baseline FAILs + 12 new `Modal/Default` FAILs (4 locales × 3
  mobile widths). Direct manifest query (`.screenshots/rendered-assert/2026-08-09T13-40/manifest.json`) confirms all
  12: `fullWidthControlsAtMobile: false`, `failingControlLabels: ["task733-probe-narrow"]`.
- **Removed** — story restored to its exact pre-probe text (import reverted, JSX line removed).
  `K4-restore.txt`: `git hash-object` == `cf20660058c313e3a7411cc372ab10cc9339e03f` (pre-probe hash), `git status
  --porcelain -- src/stories/mantine/primitives/Modal.stories.tsx` empty. Rebuilt probe-free
  (`K4b-build-storybook-final.txt`, exit 0). Post-removal manifest confirms `Modal/Default` returns to `null` (the
  prior value — Modal has zero natural candidates per §5) on all 12 mobile cells.

---

## 7. R7/R9 — final matrix, and the flake investigation

Three post-edit, probe-free full `--mantine-only` sweeps were run to reach an authoritative final matrix:

| Run | Manifest | Result | Extra FAIL vs 18-baseline |
|---|---|---|---|
| K5 | `2026-08-09T14-11` | 1163/1204 PASS, 19 FAIL | `Popover/Default × en × mobile-390` — `blank-canvas` renderCheck failure |
| K5b | `2026-08-09T14-42` | 1163/1204 PASS, 19 FAIL | `MobileBottomNavView/Authenticated × uk × mobile-320` — `blank-canvas` renderCheck failure; **the K5 Popover cell passed cleanly here** |
| K5c | `2026-08-09T15-13` | **1164/1204 PASS, 18 FAIL** | **none — fail set byte-identical to the R1 baseline (0 added, 0 removed)** |

Both extra failures were `renderCheck.failReason: 'blank-canvas'` (near-uniform screenshot, `domFailed:true`) —
this fails *before* any assertion (b) logic runs, has no `fullWidthControlsAtMobile` value at all, and is on a
different, unrelated story in each run, never reproducing on the same cell twice. This matches the harness/CPU-
contention render-flake pattern documented in Task 711's session log (§9). **K5c is used as the authoritative final
matrix (K6)** — `.screenshots/task733-evidence/K6-final-matrix.log`, `K6-final-matrix-summary.json`. All three
transcripts are preserved as evidence rather than discarded.

**No cell resolved `false` from natural (non-planted) data in any of the three runs.** The only cells that moved are
`FiltersPanelShell/Default`'s 12 cells, `null→true`, zero new failures — fully attributed in §3/§4. Per R7, there is
nothing to escalate.

---

## 8. Checkpoint 7 — Task 722's `checkedAny` guard

`Mantine/Primitives/Alert/Default` (renders no assertion-(b) candidate) resolves `fullWidthControlsAtMobile: null`
on all `<640` cells in the final manifest (`K6`) — never `true`. The guard added in Task 722 is unaffected by this
task's edit (verified directly, not inferred from the diff region alone).

---

## 9. Validation evidence

| # | Command | Result | Artifact |
|---|---|---|---|
| 0 | `git status --porcelain` (pre-write) + `git show HEAD:docs/backlog.md \| wc -l` | clean, baseline **90 lines** | `J0-status.txt`, `J0-backlog-linecount.txt` |
| 1 | `build-storybook` (fresh, pre-census) | exit 0 | `I0-build-storybook.txt` |
| 2 | `screenshots:assert --mantine-only` (R1 baseline) | `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` | `I1-baseline-matrix.log` |
| 3 | Overlay DOM census probe | 10/10 stories opened, 0 errors | `I2-overlay-dump.json` |
| 4 | Edit assertion (b); `build-storybook` | exit 0 | `K1-gate-diff.txt`, `K1b-build-storybook-post-edit.txt` |
| 5 | `screenshots:assert --mantine-only` (post-edit) | `1164/1204 PASS, 18 FAIL` — blind 120→108 | `K2-blind-delta.log` |
| 6 | Plant · `build-storybook` · `screenshots:assert --mantine-only` | `1152/1204 PASS, 30 FAIL` = 18 + 12 named `Modal/Default` FAILs | `K1c-build-storybook-plant.txt`, `K3-plant.log` |
| 7 | Remove plant · `git hash-object` · `git status --porcelain` | hash == pre-probe, path absent | `K4-restore.txt` |
| 8 | `build-storybook` (final, probe-free) · `screenshots:assert --mantine-only` ×3 (flake investigation) | final: `1164/1204 PASS, 18 FAIL`, byte-identical to baseline | `K4b-…`, `K5…K5c`, `K6-final-matrix.log` |
| 9 | `check:assertion-liveness` (before manifest, explicit `--manifest`) | exit 0, LIVE 180/1204 (20.8%) | `K7b-assertion-liveness-before.log` |
| 10 | `check:assertion-liveness` (after, latest manifest) | exit 0, LIVE 192/1204 (22.2%) | `K7-assertion-liveness.log` |
| 11 | `npx tsc --noEmit` | exit 0 | `K8-tsc.log` |
| 12 | `npm run check:i18n` | exit 0, 2218/2218/2218/2218 parity | `K9-i18n.log` |
| 13 | `npm run build` | **exit 0** | `K10-build.log` |
| 14 | `npx vitest run` the 4 `critical-flow-registry.md:50` suites | 41/41 pass | `K11-critical-flow-vitest.log` |
| 15 | `npm run check:file-integrity` (pass 1, pre-log) | 1 file clean, exit 0 | `K12a-file-integrity-pass1.log` |
| 16 | `npm run check:mojibake` (pass 1, pre-log) | 0 artifacts / 2124 files, exit 0 | `K12b-mojibake-pass1.log` |
| 17 | `npm run check:file-integrity` + `check:mojibake` (pass 2, final) | see §13 | `K13a`/`K13b` |

---

## 10. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | Removed both `[role="dialog"]` skips from assertion (b) (arms 1 and 3); added a comment naming Task 733, the census artifact, and the date, following the file's existing per-exemption convention. Assertion (d), `isChipSetMember`, `FULL_WIDTH_TOLERANCE`, `MANTINE_VIEWPORTS` byte-identical. |
| `docs/backlog.md` | Concise current-state update: "Last Session" replaced, task-registry row 733 updated (see §12). |
| `docs/sessions/2026-08-09-task733-overlay-hosted-controls.md` | This file. |

No `src/` product file changed. The `src/stories/mantine/primitives/Modal.stories.tsx` probe was applied and
byte-identically reverted within this session — absent from the final diff, confirmed by `git status --porcelain`
throughout §6/§9.

---

## 11. Visual source trace

Not applicable — this is a non-product verification-gate task. No `src/` product change ships; the only visible-
surface touch is the R4/R5 probe on `Modal.stories.tsx`, reverted byte-identical before final verification (§6) and
absent from the final diff.

## 12. Canonical UI decision record

Not applicable — no visible UI artifact is added or changed by this task's shipped diff.

---

## 13. Implementation validation notes

- The zero-natural-FAIL outcome from removing the skip was **investigated, not assumed benign** (A3's "distrust a
  zero-delta result" clause): the blind count did move (120→108, proving the edit reached the interpreter), and the
  census (§5) independently explains *why* no natural FAIL appears — 9/10 stories have no in-dialog candidate at
  all, and the 10th's candidates are already correct. The plant (§6) is the definitive proof that the removed skip
  was live and reachable, independent of whether any current story happens to violate it.
- Two transient `blank-canvas` render-check failures were found across three post-edit full sweeps, on two different
  unrelated stories, neither reproducing on a second run, neither touching `fullWidthControlsAtMobile`. Investigated
  per R7/D32 rather than discarded: both transcripts are preserved (§7), and the third, clean run is what is cited
  as the authoritative K6 comparator artifact.
- The plant mechanism (`styles={{ input: { width: '100px' } }}` on a story-owned `TextInput`) follows the Task 722
  precedent (`MantineSelect`'s `styles.input` override) rather than a bare `w`/`style` prop, since Mantine
  components frequently set their own root width after spreading `...rest`.

## 14. Assumptions, deviations, and limitations

- **A2 applied.** The kickoff's 852 applicable-cell figure was superseded by Task 678 landing after the kickoff's
  snapshot date; the fresh 864 figure is used throughout, with the delta explicitly reconciled (§4).
- **Worktree started clean, not dirty.** The kickoff's A1 anticipated a possible dirty start; the actual pre-write
  `git status --porcelain` was empty (`J0-status.txt`) — the full dirty-worktree manifest procedure was not needed.
- One temporary, uncommitted standalone Playwright script (`.tmp-task733-census.mjs`) was created in the repo root
  for the R2 census and deleted before this log was written, per the Task 711/722 precedent. It does not appear in
  `git status --porcelain` or the final diff.
- No owner decision was required; OQ1 is answered by the census (§5) — no narrowed-condition case exists.

## 15. Opus handoff

Evidence root: `.screenshots/task733-evidence/` (28 artifacts). Key files for spot-check: `I1-census.json` (R1),
`I2-overlay-dump.json` (R2), `K1-gate-diff.txt` (R3/R4/R8), `K3-plant.log` + `K4-restore.txt` (R5/R6),
`K6-final-matrix.log` + `K6-final-matrix-summary.json` (R7/R9), `K7-assertion-liveness.log` +
`K7b-assertion-liveness-before.log` (R10), `K10-build.log` (R11), `K11-critical-flow-vitest.log` (registry row 50).

Questions/risks for review:
1. Confirm the R1 reconciliation (852→864, attributed to Task 678) is an acceptable application of A2 rather than a
   scope deviation — the kickoff's own AC1 requires reconciliation, and this session did reconcile rather than
   silently using either number.
2. Confirm the three-sweep flake investigation (§7) is sufficient evidentiary treatment for the two transient
   `blank-canvas` failures, versus requiring a fourth confirmatory run or a separate gate-flake ticket.
3. Confirm the plant's choice of `Modal/Default` (zero natural candidates, so the plant is the *only* place a
   `false` value is ever observed for that story) versus `FiltersPanelShell` (which has natural candidates already
   passing) is an acceptable interpretation of "an inspected existing story" — `FiltersPanelShell` was considered
   first but has no story-level style lever into its production-internal `TextInput`s (§6).

## 16. Backlog update

`docs/backlog.md` updated: "Last Session" section replaced (733 supersedes the 678 entry, never appended),
task-registry row 733 shortened from a multi-line paragraph to a one-line pointer at this session log, and the
Sprint 52 summary line corrected (722/721/678/711 all archived, 733 now the reviewed item, 727 remains). Baseline
was **90 lines** (`git show HEAD:docs/backlog.md | wc -l`, read at Checkpoint 0). Resulting physical line count:
**92 lines** (`git diff --stat`: +9/−7, net +2). **`BACKLOG LIMIT BREACH`** — the file was already over the ~80-line
target before this session (90) and this session's edit made it marginally larger (+2) despite shortening the 733
row substantially, because the Last Session block replacement and the Sprint-line correction both added slightly
more than they removed. Per protocol, not widened further — flagged for Opus validation/consolidation at review.

---

## 17. Counting gates — both passes

**Pass 1** (§9, rows 15–16), taken before this log and the backlog update existed: 1 git-changed file
(`scripts/check-stories-rendered.mjs`), 0 integrity failures; 2124 text files scanned, 0 mojibake artifacts.

**Pass 2** (final, after this log and the backlog update exist): 3 git-changed/untracked files, 0 integrity failures
(`K13a-file-integrity-pass2.log`); 2125 text files scanned (+1 vs pass 1 — this log), 0 mojibake artifacts
(`K13b-mojibake-pass2.log`). Reconciled to `git status --porcelain`: 2 modified (`docs/backlog.md`,
`scripts/check-stories-rendered.mjs`) + 1 untracked (this session log) = 3 entries, matching file-integrity's
"3 file(s)" exactly.
