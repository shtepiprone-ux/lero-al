# Task 742 — Rendered-run mode provenance

**Kickoff:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_742_RenderedRunModeProvenance.md`
**Kickoff filed:** 2026-08-10. **Executed:** 2026-08-11 (session-log filename kept at the kickoff's own §7 path).
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`.
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

---

## 1. Requirement ledger and evidence

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R1 | `manifest.json` gains `runMode` + `phasesSkipped` | ✅ Confirmed | §3 below — parsed keys from the real run's manifest |
| R2 | Inventory header states real mode, lists skipped phases, no "Global enumeration"/"Full global-enumeration run." under `--mantine-only` | ✅ Confirmed | §3 — before/after header quoted |
| R3 | Scope figure = cells actually rendered, never a story-array-length sum | ✅ Confirmed | `cellsRendered` is always `total` (`matrix.length`), never `ASSERT_STORIES.length + …` — see `scripts/check-stories-rendered.mjs:1810-1819` |
| R4 | Console `NOT RUN` line naming Phase 1 (incl. the 4 anchor rows) and Phase 2 | ✅ Confirmed | §3 — live transcript quoted |
| R5 | Pure exported function, unit-tested for all 3 modes + zero-cell case | ✅ Confirmed | `scripts/lib/rendered-run-mode.mjs` + `scripts/__tests__/rendered-run-mode.test.ts`, 9/9 pass |
| R6 | Pass/fail behaviour, counts and fail set byte-identical (`1164/1204, 18 FAIL, 22 AMBIGUOUS`, 0 added/0 removed) | ⚠️ **Not met as measured — flagged for Opus** | §4 below — 1 new FAIL, 0 removed, with diagnostic evidence it is not attributable to this diff |
| R7 | `storybook-governance.md` §14.9.2 gains a one-line pointer naming 702 AC2 | ✅ Confirmed | Diff below |
| R8 | `npm run build` exit 0; no `src/` file changed | ✅ Confirmed | §5 — build log + final `git status --porcelain` |
| R9 | Concise backlog update + session log | ✅ Confirmed | `docs/backlog.md` edited this session; this file |

---

## 2. Re-derivation against §3.1–§3.4 (§10.1)

All four figures the kickoff cited were re-opened and re-measured before writing any code, per the kickoff's own
instruction that "the tree wins" over the document:

- **§3.1 gate points** — `grep -n "MANTINE_ONLY" scripts/check-stories-rendered.mjs` returned exactly 5 hits:
  the declaration (`:82`), the banner branch (`:1471`), the composition-line branch (`:1574`), the Phase 1 skip
  (`:1634`), the Phase 2 skip (`:1680`). **Matches the kickoff exactly** — `:1634`/`:1680` are confirmed the only
  two phase-skip sites; no third mechanism found.
- **4 anchor rows** — re-read `scripts/check-stories-rendered.mjs:173-181`: `system-featuredlistings--default`,
  `system-latestlistings--default`, `system-similarlistings--default`,
  `patterns-mantine-homepagelistinggrids--default`, all anchored on `.listing-card`. **Matches.**
- **§3.2 on-disk "before" state** — captured *before* any edit (see §3 below): the inventory header on disk read
  `Run mode: full … Global enumeration (317 stories, 1204 cells)` / `Full global-enumeration run.`, mtime
  `2026-08-10 14:14:42.185`. **Matches the kickoff's quote exactly**, including the mtime.
- **§3.3 manifest keys** — `.screenshots/rendered-assert/2026-08-10T11-43/manifest.json` top-level keys were
  exactly `timestamp`, `summary`, `matrix` before this task's edit. **Matches** — no mode field existed.
- **1204 = the mantine-only cell count** — that same manifest's `matrix.length` is 1204, `summary.total` is 1204.
  **Matches.**
- **`.gitignore` reason for no status entry (A2)** — confirmed: `git --no-optional-locks status --porcelain` never
  listed `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` at any point in this
  session, including immediately after the file was rewritten by the rendered run. Consistent with the kickoff's
  gitignore claim (not independently re-grepped against `.gitignore:74`, but the observed behavior matches).

No re-derived figure disagreed with the kickoff. `docs/critical-flow-registry.md` was scanned (grep for
`check-stories-rendered|storybook|screenshots:assert|governance-report`) — **no row references this script**; it
is a build-time reporting harness with no route, data model, or auth/RLS/lifecycle surface, so no critical flow is
affected.

---

## 3. Step-2 "before" witness and the "after" result, side by side

**Before** (captured before any edit, from the file already on disk from Task 702's run):

```
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (317 stories, 1204 cells)
...
> Full global-enumeration run.
```

mtime: `2026-08-10 14:14:42` (12,709 bytes). Manifest keys at that time: `timestamp`, `summary`, `matrix` (no mode
field). Manifest `matrix.length` = 1204.

**After** (from this task's own `--mantine-only` run, `.screenshots/rendered-assert/2026-08-11T06-52/`):

```
**Run mode:** mantine-only (320/375/390 × sq/en/uk/it) | **Scope:** mantine-only (rendered scope only — Phase 1
(ASSERT_STORIES — including the 4 `.listing-card` anchor rows: system-featuredlistings--default,
system-latestlistings--default, system-similarlistings--default, patterns-mantine-homepagelistinggrids--default);
Phase 2 (geometry-only sweep) NOT run; 72 stories, 1204 cells)
...
> mantine-only run. NOT RUN: Phase 1 (ASSERT_STORIES — including the 4 `.listing-card` anchor rows:
system-featuredlistings--default, system-latestlistings--default, system-similarlistings--default,
patterns-mantine-homepagelistinggrids--default); Phase 2 (geometry-only sweep).
```

**AC2 check:** neither `Global enumeration` nor `Full global-enumeration run.` appears in the after header — confirmed
by direct inspection of the written file. **AC1 check** — parsed `manifest.json` for the new run:

```json
"runMode": "mantine-only",
"phasesSkipped": ["phase1-assert-stories", "phase2-geometry-only"]
```

**AC3 check** — live console transcript (`step4b-rendered-run.log`), printed before any cell rendered:

```
mantine-only run. NOT RUN: Phase 1 (ASSERT_STORIES — including the 4 `.listing-card` anchor rows:
system-featuredlistings--default, system-latestlistings--default, system-similarlistings--default,
patterns-mantine-homepagelistinggrids--default); Phase 2 (geometry-only sweep).
```

**AC4 check** — `npx vitest run scripts/__tests__/rendered-run-mode.test.ts`: **9/9 passed**, exit 0. Covers full,
fast, mantine-only, mantine-only-takes-precedence-over-fast, the zero-cell case for all three modes, omitted-counts
default, purity (identical input → identical output), and that `PHASE_LABELS` names Phase 1/2 concretely (not "some
phases").

---

## 4. R6/AC5 — the fail-set identity check (not clean; reported, not hidden)

Standing comparator (Task 702's run, `.screenshots/rendered-assert/2026-08-10T11-43/manifest.json`,
`summary`): `total 1204, passed 1164, failed 18, ambiguousOnly 22`.

This task's own run (`.screenshots/rendered-assert/2026-08-11T06-52/manifest.json`, `summary`): `total 1204,
passed 1163, failed 19, ambiguousOnly 22`.

**Set comparison** (not just totals — the 739/740 lesson), keyed on `storyId__locale__viewport`:

```
before fail count: 18
after fail count: 19
added (new fails not in before): ["mantine-primitives-textinput--default__it__mobile-390"]
removed (were fail, now not): []
```

**This does not satisfy AC5's literal bar (0 added, 0 removed).** Diagnostic evidence gathered on why, and why it
is unlikely to be caused by this task's diff:

1. `git log --oneline ebf25d748..HEAD` and `git diff --stat ebf25d748..HEAD -- src/ messages/` — **zero product
   files changed** between the comparator's commit and the tree this run executed against. The two runs rendered
   the identical `src/`/`messages/` tree.
2. This task's diff touches only `scripts/check-stories-rendered.mjs` (manifest fields, header/console string
   construction) and adds two new files (`scripts/lib/rendered-run-mode.mjs`,
   `scripts/__tests__/rendered-run-mode.test.ts`). **No line in the diff touches `captureCell`, any assertion
   function, or any threshold** — confirmed by re-reading the diff.
3. The failing cell's own manifest entry: `assertions.styleIntegrity.signals.fontFamily` reads `"Times New
   Roman"` — not the site's actual web font — consistent with a font-load race at the moment of that specific
   capture (Times New Roman is the browser's serif fallback). A different font changes measured label widths,
   which is exactly the assertion that failed (`fullWidthControlsAtMobile`, labels `example@gmail.com`,
   `Inserisci il tuo titolo professionale`, `es. Mario Rossi`).
4. By the harness's own design (`isTransientFailure`, `scripts/check-stories-rendered.mjs:690`),
   `fullWidthControlsAtMobile === false` is explicitly classified as **never transient** and is not retried
   (`retryCount: 0` on this cell) — so the harness's own retry logic could not have absorbed a one-off render
   flake of this class, even though the diagnostic signal above suggests it was one.

**Disposition is an Opus decision, not mine.** I did not re-run the ~2.5h sweep a second time to attempt
reproduction — the kickoff's §3.5 explicitly budgets **one** such run ("not three"), and no owner exception was
sought this session. This is reported as an open question, not resolved, and not hidden inside a "clean" summary.

---

## 5. Remaining §13.2 commands

| # | Command | Result |
|---|---|---|
| 1 | `git --no-optional-locks status --porcelain` at I0 | clean; `git show HEAD:docs/backlog.md \| wc -l` = **92** |
| 3 | `npx vitest run scripts/__tests__/rendered-run-mode.test.ts` | **9/9 passed**, exit 0 |
| 4 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` | both exit 0 / (sweep itself exits 1 — see below) |
| 7 | `npx vitest run` (full suite) | **1347/1347 passed, 80/80 files**, exit 0. No timeout-class flakes observed this run (a known, non-stable set per prior sessions — none fired here) |
| 8 | `npm run typecheck` | exit 0 |
| 9 | `npm run build` | exit 0 (ran before the rendered sweep; full route table produced, no errors) |
| 10 | `check:css-vars` | `0 violations, 0 in-class dynamic sites` — exit 0 |
| 10 | `check:design-tokens` | `0 violations found` — exit 0 |
| 10 | `check:stories` | `127 files checked, 0 violations` — exit 0 |
| 10 | `check:mojibake` | `0 artifacts in 2163 files` — exit 0 |
| 10 | `check:file-integrity` | `4 files clean` — exit 0 (scoped to this session's git-changed/untracked files) |

**On the sweep's own exit code:** `npm run screenshots:assert -- --mantine-only` exited **1**. This is expected,
by design — the harness sets `process.exitCode = 1` whenever `failed > 0` (`scripts/check-stories-rendered.mjs`,
the `if (failed > 0)` branch), and this run has 19 FAIL cells (§4). This is the harness's pre-existing behavior,
unrelated to any change in this task — the comparator run (702, exit code not recorded in that session but with
18 FAIL cells would also exit 1 under the identical logic). Not a build/task failure.

`check:homepage-grid` and a second rendered run were explicitly **not required** by §13.2 and were not run.

---

## 6. Files changed

| Path | Reason |
|---|---|
| `scripts/lib/rendered-run-mode.mjs` | **New.** Pure `describeRunMode()` + `PHASE_LABELS`, the single source for run-mode/skip description (R1–R5) |
| `scripts/__tests__/rendered-run-mode.test.ts` | **New.** 9 unit tests covering all 3 modes, precedence, zero-cell case, purity, and label content (R5/AC4) |
| `scripts/check-stories-rendered.mjs` | Imports `describeRunMode`; adds `runMode`/`phasesSkipped` to `manifest.json`; replaces the header's story-array-length ternaries with `modeInfo`; adds the console `NOT RUN` line. No assertion, threshold, allowlist, enrolment, or viewport-set line touched |
| `docs/storybook-governance.md` | §14.9.2 gains the one-line pointer (R7) naming Task 702 AC2 as the case an anchor-dependent AC cannot be proven by `--mantine-only` |
| `docs/backlog.md` | Concise state update (R9) — see §7 |

Final `git status --porcelain` at end of session:

```
 M docs/backlog.md
 M docs/storybook-governance.md
 M scripts/check-stories-rendered.mjs
?? scripts/__tests__/rendered-run-mode.test.ts
?? scripts/lib/rendered-run-mode.mjs
```

(This session log itself is untracked at write time and will appear once saved — six paths total, all §7-scoped;
none under `src/`.) The regenerated inventory report
(`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`) does **not** appear — gitignored,
per A2, witnessed by content + mtime in §3 instead.

---

## 7. Backlog update

`docs/backlog.md`'s "Last Session" block and the Task 742 registry row were both replaced (not appended) with
concise current-state text; the Sprint 46 summary line was updated in place. Baseline from `git show
HEAD:docs/backlog.md | wc -l` = **92** (already over the ~80-line target before this session touched it). Live
count after this session's edits = **89** — net **smaller**, not larger, but still **above 80**.

**`BACKLOG LIMIT BREACH`** — flagged per the standing rule; the file remains over its ~80-line target and needs
Opus consolidation/archival (e.g., of now-superseded historical rows), which is out of this session's authority.

---

## 8. Assumptions, deviations, limitations

- **Not exempt (per §14 item 9's instruction to re-open this kickoff's own derived claims):**
  - "`:1634` and `:1680` are the only two phase gates" — **re-verified true** by direct grep (§2 above), all 5
    `MANTINE_ONLY` occurrences accounted for.
  - "1204 is the mantine-only cell count" — **re-verified true**, both from the pre-existing manifest and this
    task's own new run.
  - "The inventory is written on every run including this mode" — **re-verified true**: this session's
    `--mantine-only` run rewrote the file (new mtime, new content, quoted in §3).
  - "`.gitignore:74` is why it shows no status entry" — **not independently re-grepped against the line number**;
    behavior (file never appears in `git status --porcelain`) is consistent with the claim but the exact line
    was not re-opened this session.
- **R6/AC5 is the one requirement not confirmed clean** — see §4. Reported factually, with diagnostic evidence and
  a proposed (not asserted) explanation; disposition left to Opus.
- **Session-log filename** uses the kickoff's own literal §7 path (`2026-08-10-…`), one day before the actual
  execution date (2026-08-11 per system clock and the rendered run's own timestamp) — kept exact per the task's
  explicit scope table rather than renamed to today's date.
- No file under `src/` was changed. No verdict logic, threshold, allowlist, enrolment rule, or viewport set was
  touched — confirmed by direct diff re-read (§6).
- `docs/critical-flow-registry.md`: scanned, no row affected (§2).

---

## 9. Opus handoff

- Primary open question: **R6/AC5 disposition** — accept the single-cell drift as pre-existing capture noise
  (evidence in §4), or authorize a second `--mantine-only` run (~2.5h) to attempt reproduction/refutation. If a
  second run reproduces the exact same fail set as the 702 baseline (18 FAIL, no TextInput/it/mobile-390 entry),
  that would confirm the flake hypothesis; if it reproduces this run's 19-FAIL set, that would argue for a real,
  pre-existing (not Task-742-introduced) intermittent defect worth its own follow-up number.
- `BACKLOG LIMIT BREACH` (§7) — needs Opus consolidation.
- All other requirements (R1–R5, R7–R9) are fully evidenced and, in my assessment as executor, complete — but per
  the executor/reviewer boundary, this is not a self-approval; Opus's independent inspection of the diff and
  evidence in this file is the approval gate.
