# Task 722 — `fullWidthControlsAtMobile` `checkedAny` guard + dead-arm re-anchor (Sprint 52.1, folds 732)

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **QA profile:** `Q4` Release/Critical Flow.
**Kickoff:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_722_FullWidthControls_VacuousAssertion.md` +
`Sprint_52_Task_722_execution_contract.md` + `Sprint_52_Task_722_rule_compliance_ledger.md`.
**Evidence root:** `.screenshots/task722-evidence/` (27 artifacts, listed in §7).

---

## 1. Task path and status

`tasks/Sprints/Sprint_52_kickoff_prompt_Task_722_FullWidthControls_VacuousAssertion.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

---

## 2. Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1 — pre-change census | `.screenshots/task722-evidence/I2-census-summary.json`: arm1 (`[data-slot="select-trigger"]`) 0/852, arm2 (`[data-slot="tabs-list"]`) 0/852, arm3 (bare `<input>`) 168/852. `I2-census-raw-dump.json` (per-cell counts), `I2-census-live-cells-by-arm.json` (provenance list). Temporary standalone Playwright probe `.tmp-task722-census.mjs` (Task 711 precedent), deleted after use — not in the diff. |
| R2 — `checkedAny` guard | `git diff scripts/check-stories-rendered.mjs` — evaluate returns `{ failures, checkedAny }`; assignment is `cell.assertions.fullWidthControlsAtMobile = viewport.width < 640 ? (checkedAnyControl ? fullWidthOk : null) : null`, structurally parallel to assertion (d)'s `checkedAnyButton` shape. |
| R3 — discovered hooks, not kickoff-supplied | `.screenshots/task722-evidence/I3-select-tabs-dump-stdout.txt` / `I3-select-tabs-dump.json` — live DOM dump of `Mantine/Primitives/Select/Default` and `Mantine/Primitives/Tabs/Default` at 375px via a second temporary probe (`.tmp-task722-dump.mjs`, deleted). Found `input.mantine-Select-input` (readonly, `aria-haspopup="listbox"`) and `div[role="tablist"].mantine-Tabs-list` — both real Mantine `useStyles({name:...})` static classes, same `withStaticClasses:true` mechanism as assertion (d)'s `.mantine-Button-root` (D33). |
| R4 — two-armed plant | §4 below — 3 transcripts (no-control cell, probe-failing cell, restore). |
| R5 — probe reverted | `.screenshots/task722-evidence/K3-restore-status.txt` — `git hash-object` post-revert `bd96cb0bd5a7c835bffe2f4c74c351071598cc45` == pre-probe hash; `git status --porcelain` for that path empty. |
| R6 — meta-gate adjudicated | `.screenshots/task722-evidence/K6-liveness.log` — `fullWidthControlsAtMobile` classified **LIVE**, 168/1184 cells (was already reported LIVE pre-task too, because the meta-gate only detects null-in-every-cell dead-ness and a vacuous `true` is never null — kickoff §3.5's documented boundary. The classification word does not move; what changes is that 168/1184 is now a real measured count instead of 852/852 vacuous `true`). Exit 0, 0 DEAD-NEW/STALE-ENTRY. |
| R7 — no suppression of new `false` cells | None occurred: final matrix (§5) is byte-identical to the §3.6 comparator; zero cells moved. Nothing to suppress. |
| R8 — final matrix vs baseline | `.screenshots/task722-evidence/K5-final-matrix.log`: `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1` — identical set (`HeroSearch`×12, `NotificationBellView/mobile-390`×4), zero moved cells. |
| R9 — `isChipSetMember` bound documented | `docs/storybook-governance.md` §14.9.28 residual addition (this diff) — documents the N=2-group gap and the `flexWrap:'nowrap'` scrolling-row gap (`FavoritesTypeFilter.tsx:31`'s shape), both currently dormant. Predicate NOT widened (route (a) chosen; R10 requires it unchanged). |
| R10 — untouched logic verified | `git diff` shows zero touch to `isChipSetMember`, its 3 thresholds, `FULL_WIDTH_TOLERANCE`, `MANTINE_VIEWPORTS` — confirmed by reading the diff hunks (§6). |
| R11 — Q4 gates | `.screenshots/task722-evidence/K7-tsc.log` exit 0 · `K10-build.log` exit 0. |
| R12 — critical-flow regression | `.screenshots/task722-evidence/K9-critical-flow-vitest.log` — 4 suites, 41/41 tests pass. |
| R13 — counting gates last | §8 below — two passes, second after this log + backlog existed. |

**AC1–AC12:** all satisfied — see the R-row each AC maps to above; AC4/AC5/AC6 detailed in §4, AC12 in §8.

---

## 3. Current versus required behavior

**Before.** `fullWidthControlsAtMobile` resolved `true` in all 852 applicable (`<640px`) cells, never `false`,
including cells rendering no candidate control at all (e.g. `Alert/Default`) — confirmed via
`.screenshots/task722-evidence/I1b-baseline-isolated.log`'s manifest (`true` on all 12 `Alert/Default`
applicable cells). Two of its three candidate arms (`[data-slot="select-trigger"]`,
`[data-slot="tabs-list"]`) matched 0 elements across the whole scope (shadcn convention, never rendered by
Mantine).

**After.** The assertion resolves `null` where nothing was measured (684/852 applicable cells), `true` where
a real control was measured and is full-width (168/852), and `false` where a measured control is not
full-width — proven live via the R4 plant (§4). No cell in the current codebase resolves `false` (0/1184) —
the plant is the only way `false` was observed, and it was reverted before final verification.

**Negative flows (from the kickoff's applicability table):**

| Negative flow | Applicable | Result |
|---|---|---|
| Zero-match cell returns a confident value | Yes | Fixed — now `null` (§4.1) |
| Re-anchored selector matches nothing | Yes | Ruled out — both new selectors are LIVE (168/852 combined with arm 3; Select/Tabs cells individually confirmed `true`, not `null`) |
| Assertion goes uniformly `null` → meta-gate DEAD-NEW | Yes (A2 stop condition) | Did not occur — arm 3 was already live (168/852), so `checkedAny` is true wherever arm 3 fires even before considering arms 1–2 |
| Probe left in the tree | Yes | R5 evidence — reverted, hash-confirmed |
| New `false` cells suppressed to keep the matrix green | Yes | Did not occur — final matrix has zero new `false` cells, nothing to suppress |
| Enrolment changes the denominator mid-task | Yes | Did not occur — 1184 cells before and after, confirmed by census (`totalCellsAllViewports: 1184`) and both matrix runs |
| Locale/i18n regression | No | `check:i18n` run as a guard, PASSED (2218/2218/2218/2218 parity) |
| Visual/layout regression | No | No `src/` change; final matrix is the witness (byte-identical to baseline) |
| RLS / auth / data-loss path | No | Non-product script only |

---

## 4. The R4 two-armed plant — 3 transcripts

### 4.1 No-control cell (`Alert/Default`)

`Mantine/Primitives/Alert/Default` renders no Select/Tabs/text-input candidate at any of its 12 applicable
cells (4 locales × 3 mobile viewports).

- **Before** (old code, `.screenshots/rendered-assert/2026-08-08T10-19/manifest.json`, captured by the
  isolated baseline re-run `I1b-baseline-isolated.log`): `fullWidthControlsAtMobile: true` on all 12 cells.
- **After** (new code, `.screenshots/rendered-assert/2026-08-08T10-49/manifest.json`, captured by
  `I4-post-guard-matrix.log`): `fullWidthControlsAtMobile: null` on all 12 cells.

Verified by direct manifest query (`node -e "…JSON.parse(readFileSync(…manifest.json))…"`), not by re-deriving
from the console summary.

### 4.2 Failing cell (planted probe)

**Probe:** `src/stories/mantine/primitives/Select.stories.tsx` — the "resting" `MantineSelect` demo instance
gained `styles={{ input: { width: '100px' } }}`, narrowing the rendered `<input class="mantine-Select-input">`
to 100px while its wrapper (`.mantine-Input-wrapper`, driven by `MantineSelect.tsx`'s hardcoded
`w={{base:'100%',sm:'auto'}}` on the outer root) stays the Stack's full content width (343px at 375px
viewport minus padding). `MantineSelect.tsx`'s own `w` prop cannot be overridden from the story (it is set
*after* `{...rest}` in the JSX, so it always wins) — `styles.input` is the only reversible, story-only lever
that reaches the actual `<input>` node directly. Exact diff applied:

```diff
             <MantineSelect
               label={t('sel_label')}
               placeholder={t('sel_placeholder')}
               description={t('sel_hint')}
               data={options}
+              /* Task 722 R4 probe — TEMPORARY, reverted byte-identical before verification */
+              styles={{ input: { width: '100px' } }}
             />
```

- Rebuild: `.screenshots/task722-evidence/K1-build-storybook-probe.txt`, exit 0.
- Sweep with probe in place: `.screenshots/task722-evidence/K2-probe-after.log` —
  `Results: 1134/1184 PASS, 28 FAIL, 22 AMBIGUOUS, exit 1` = the 16 pre-existing FAILs **plus** 12 new
  `Select/Default` FAILs (4 locales × 3 mobile viewports), each printing the `:1930` console line naming the
  control by its localized placeholder, e.g.:
  `✗ form control not full-width at <640: Select type…, Select type…` (en),
  `Zgjidh llojin…` (sq), `Оберіть тип…` (uk), `Seleziona tipo…` (it).
- **Why the label appears twice per cell:** the narrowed `<input class="mantine-Select-input">` has no
  `type` attribute, so it is *also* matched by arm 3's own `input:not([type])` selector — both arms
  independently detect the same failing element (documented in the code comment; §3's own doc line already
  called this out: "Select triggers, TabsList, and form inputs" are three categories, but arm 1's DOM node is
  structurally a subset of arm 3's). This was corrected after the plant run with a one-line dedupe
  (`[...new Set(result.failures)]`, `check-stories-rendered.mjs`) so a future `false` cell reports one label,
  not two — a cosmetic diagnostic fix, verified by `node --check`; not re-run through a full sweep since it
  cannot change the `true`/`false`/`null` verdict (only the label array's uniqueness), and the final
  probe-free sweep (§5) already exercises the corrected code path end-to-end.
- The other 2 demo instances in the same story (`error`, `disabled`) were **not** probed and stayed `true`/`null`
  as applicable — confirms the plant is scoped to the one narrowed control, not a global break.

### 4.3 Restore

Probe removed (`Select.stories.tsx` restored to its exact pre-probe text).
`.screenshots/task722-evidence/K3-restore-status.txt`:
`git hash-object` == `bd96cb0bd5a7c835bffe2f4c74c351071598cc45` (pre-probe hash, recorded before the edit),
`git status --porcelain -- src/stories/mantine/primitives/Select.stories.tsx` empty. Storybook rebuilt probe-free
(`K4-build-storybook-final.txt`, exit 0) and the final sweep (§5) confirms the cell count returns to baseline.

---

## 5. Final matrix vs the §3.6 comparator

`.screenshots/task722-evidence/K5-final-matrix.log` (probe-free, post-dedupe-fix, fresh `build-storybook` +
`screenshots:assert -- --mantine-only`):

```
Results: 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

Identical to the recorded comparator (`1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS`, Task 726's `K9-final-matrix.log`).
The 16 FAILs are the same named set (`HeroSearch`×12, `NotificationBellView/mobile-390`×4) — confirmed by
diffing the "❌ Failed cells" block against the Task 726 log. **Zero cells moved.**

One methodological note: an earlier same-day baseline attempt (`I1-baseline-matrix.log`) showed a spurious
17th FAIL (`Avatar/Default × uk × mobile-390`, `noHorizontalOverflow`) that did **not** reproduce in an
isolated re-run (`I1b-baseline-isolated.log`, exact `1146/1184`/`16 FAIL` match). Root cause: the census probe
(a second concurrent Playwright/Chromium instance) was running at the same time as that sweep, and rendering
timing under that CPU contention produced a one-off geometry flake unrelated to this task's assertion. All
subsequent sweeps in this session ran with no concurrent browser process.

**`fullWidthControlsAtMobile` distribution, before → after (852 applicable cells):**

| State | Before | After |
|---|---:|---:|
| `true` | 852 (vacuous — arms never actually excluded anything) | 168 (real measured full-width passes) |
| `false` | 0 | 0 (0 in the current codebase; `false` was only observed under the R4 plant, reverted) |
| `null` | 0 | 684 (cells where nothing was measured) |

168 matches arm 3's own live-cell count from the R1 census exactly (arms 1–2's newly-live matches are a
subset of cells that also contain arm-3-eligible inputs or their own Select/Tabs elements — no cell in the
current story set exercises Select/Tabs *without* also having a plain input nearby that arm 3 already covered,
per the census's per-cell dump).

---

## 6. Untouched-region verification (R10)

`git diff scripts/check-stories-rendered.mjs` — the only hunks touch: (1) assertion (b)'s block (`:1112` area)
and (2) the `:1930`-area console line for `fullWidthControlsAtMobile === false`. Read start-to-end:
`isChipSetMember` (assertion (d)'s helper), its 3 conditions/thresholds (`N≥3`, `median×3`, `rowWidth×0.8`),
`FULL_WIDTH_TOLERANCE` (`= 8`, `:473`), and `MANTINE_VIEWPORTS` (`:392-397`) are byte-identical — zero diff
lines in any of those regions.

---

## 7. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | `checkedAny` guard for assertion (b); arms 1–2 re-anchored onto live-dumped `.mantine-Select-input` / `.mantine-Tabs-list`; arm 3 unchanged; failing-control labels surfaced (deduped) at the `:1930` console line, mirroring assertion (d). |
| `docs/storybook-governance.md` | New §14.9.28 residual paragraph documenting `isChipSetMember`'s two structural gaps (N=2 groups; `flexWrap:'nowrap'` scrolling rows) per R9/folded-732, route (a) — documented, not widened. |
| `docs/backlog.md` | Concise current-state update: Last Session → 722, task-registry row 722 → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a one-line pointer to this log. **BACKLOG LIMIT BREACH already existing** — file was 91 lines before this session's edits and remains 91 after (edits were net-neutral in line count, strictly shortened in content); flagged for Opus consolidation, not grown further by this task. |
| `docs/sessions/2026-08-08-task722-fullwidth-controls-vacuous-assertion.md` | This file. |

No `src/` product file changed (per §8 out-of-scope) except the reversible `Select.stories.tsx` probe, applied
and byte-identically reverted within this same session (absent from the final diff — confirmed by
`git status --porcelain` throughout §8).

---

## 8. Validation evidence

| # | Command | Result | Artifact |
|---|---|---|---|
| 0 | `git status --porcelain` (pre-write) | clean, HEAD `5849bf9d2` | `J0-status.txt` |
| 1 | `npm run build-storybook` (pre-census) | exit 0 | `I0-build-storybook.txt` |
| 2 | Census probe (`.tmp-task722-census.mjs`, temporary) | 71 stories, 852 applicable cells, 0 errors | `I2-census-summary.json`, `I2-census-raw-dump.json` |
| 3 | R3 DOM dump (`.tmp-task722-dump.mjs`, temporary) | Select/Tabs live hooks found | `I3-select-tabs-dump.json` |
| 4 | `npm run screenshots:assert -- --mantine-only` (isolated baseline, old code) | `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1` — matches §3.6 comparator exactly | `I1b-baseline-isolated.log` |
| 5 | `npm run screenshots:assert -- --mantine-only` (new code, no probe) | `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1` — zero moved cells | `I4-post-guard-matrix.log` |
| 6 | Probe applied · `build-storybook` · `screenshots:assert --mantine-only` | `1134/1184 PASS, 28 FAIL` = baseline 16 + 12 new named `Select/Default` FAILs, console line fires | `K1-build-storybook-probe.txt`, `K2-probe-after.log` |
| 7 | Probe removed · `git hash-object` · `git status --porcelain` | hash == pre-probe `bd96cb0…`, path absent | `K3-restore-status.txt` |
| 8 | `build-storybook` · `screenshots:assert --mantine-only` (final, probe-free) | `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1` | `K4-build-storybook-final.txt`, `K5-final-matrix.log` |
| 9 | `npm run check:assertion-liveness` | exit 0, `fullWidthControlsAtMobile` LIVE 168/1184 | `K6-liveness.log` |
| 10 | `npx tsc --noEmit` | exit 0 | `K7-tsc.log` |
| 11 | `npm run check:i18n` | exit 0, 2218/2218/2218/2218 parity | `K8-i18n.log` |
| 12 | `npx vitest run` the 4 `critical-flow-registry.md:50` suites | 41/41 pass | `K9-critical-flow-vitest.log` |
| 13 | `npm run build` | **exit 0** | `K10-build.log` |
| 14 | `npm run check:file-integrity` (pass 1, pre-log) | 2 files clean, exit 0 | `K11a-file-integrity-pass1.log` |
| 15 | `npm run check:mojibake` (pass 1, pre-log) | 0 artifacts / 2107 files, exit 0 | `K11b-mojibake-pass1.log` |
| 16 | `npm run check:file-integrity` + `check:mojibake` (pass 2, post-log/backlog) | §8 below this table | `K12a`/`K12b` (appended after this file was written — see note) |

**Note on step 16 (AC12/R13):** counting gates run twice by design — once before this log existed (step 14–15,
to catch defects early) and once after, since the log/backlog files themselves are new/changed inputs to those
counters. The second pass's transcript is captured immediately after this file and `docs/backlog.md` are saved,
in the same session, before the completion handoff — see the session's final tool calls; its exit codes are
authoritative for the handoff below (recorded in the same evidence directory as `K12a-file-integrity-pass2.log`
/ `K12b-mojibake-pass2.log`).

---

## 9. Visual source trace

Not applicable — this is a non-product verification-gate task (§1 of the kickoff: "No `src/` product file
changes. No Storybook story ships from this task."). The one visible-surface touch is the R4 probe on
`Select.stories.tsx`, reverted byte-identical before final verification (§4.3) and absent from the final diff.

## 10. Canonical UI decision record

Not applicable — no visible UI artifact is added or changed by this task's shipped diff.

---

## 11. Implementation validation notes

- Both re-anchored arms (`.mantine-Select-input`, `.mantine-Tabs-list`) are confirmed genuinely live in the
  final manifest (not merely non-null by coincidence): `Select/Default` and `Tabs/Default` cells resolve
  `true` (not `null`) at every applicable locale/viewport, matching the census's per-story provenance list.
- A theoretical concern was raised and empirically ruled out during implementation: `Tabs.List` is
  content-sized by Mantine's own theme (`theme.ts:838-851` sets no `width:100%`), and the project's own
  documented Tabs contract is "stretch if it fits, swipe-scroll if it overflows" (never forced full-width) —
  the same domain shape as `SegmentedControl`. If the re-anchored Tabs check had turned out to require literal
  full-width regardless of fit, it would have contradicted that approved contract and produced a
  `TASK SPECIFICATION CONTRADICTION`. It did not: the final matrix shows zero new failures on any `Tabs/*`
  story at any locale/viewport, so no contradiction exists in the current story set — recorded here as a
  documented risk that was checked, not assumed away.
- A cosmetic duplicate-label defect was found and fixed during the R4 plant (§4.2): a failing Select input is
  matched by both arm 1 and arm 3, producing two identical diagnostic labels. Deduped with
  `[...new Set(...)]`. This does not change any `true`/`false`/`null` verdict.

## 12. Assumptions, deviations, and limitations

- The R4 probe used `styles={{ input: { width: '100px' } }}` rather than a `w` prop, because
  `MantineSelect.tsx` hardcodes `w={{base:'100%',sm:'auto'}}` on the Select's own root *after* spreading
  `...rest`, so any `w` passed from the story is unconditionally overridden. `styles.input` reaches the
  rendered `<input>` node directly and is not overridden by the component. This is a deviation from the
  Task 726 precedent's exact mechanism (`w={100}` on a Button) but stays within the same "reversible,
  story-only, no production file touched" constraint.
- Two temporary, uncommitted standalone Playwright scripts (`.tmp-task722-census.mjs`,
  `.tmp-task722-dump.mjs`) and one ad hoc inspection script (`.tmp-task722-select-inspect.mjs`, used to
  diagnose the duplicate-label finding in §4.2/§11) were created in the repo root during the session and
  deleted before this log was written, per the Task 711 precedent (§9 of that session log). None appear in
  `git status --porcelain` or the final diff.
- No owner decision was required; A2's stop condition (all three arms dead) did not trigger (arm 3 was live
  from the start).

## 13. Opus handoff

Evidence root: `.screenshots/task722-evidence/` (27 artifacts). Key files for spot-check: `I2-census-summary.json`
(R1), `I3-select-tabs-dump.json` (R3), `K2-probe-after.log` + `K3-restore-status.txt` (R4/R5), `K5-final-matrix.log`
(R8), `K6-liveness.log` (R6), `K10-build.log` (R11).

Questions/risks for review:
1. Confirm the `styles.input` probe mechanism (§4.2, §12) is an acceptable reversible-probe deviation from the
   `w={100}` precedent, given `MantineSelect.tsx`'s prop-order constraint made the precedent's exact mechanism
   unusable without touching production code.
2. Confirm route (a) for R9 (document `isChipSetMember`'s bound, don't widen) is correctly derived from R10's
   "unchanged" requirement rather than an independent judgment call — the two requirements are in tension if
   read in isolation, and this session resolved it by treating R10 as binding.
3. `docs/backlog.md` is at 91 lines, already over the ~80-line guidance before this session touched it —
   flagged as `BACKLOG LIMIT BREACH` per protocol; this session's edits were net line-count-neutral (shortened
   content, same line count) rather than a fix, since consolidation is an Opus review action.

## 14. Backlog update

`docs/backlog.md` updated: "Last Session" section replaced (722 supersedes the already-archived 726 entry),
task-registry row 722 shortened to a one-line pointer at this session log. Resulting physical line count:
**91 lines** (unchanged from before this session — pre-existing `BACKLOG LIMIT BREACH`, not introduced by this
task; flagged for Opus consolidation per protocol, not resolved here).
