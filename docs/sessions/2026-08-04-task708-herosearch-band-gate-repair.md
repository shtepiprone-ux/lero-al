# Session Log — Task 708: Repair the dead `heroSearchWrapInBand` gate

**Task:** `tasks/Sprints/Sprint_49_kickoff_prompt_Task_708_HeroSearchWrapInBand_Gate_Repair.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q4 Release/Critical Flow (planted-violation proof mandatory — `docs/critical-flow-registry.md` row 50)
**Branch:** `task/q0-ci-rendered-locale-split`

---

## 0. Contamination event — read before the evidence below

**Timestamps:** 2026-08-03 23:22:06.158 → 23:44:12.555 (local; mtimes measured directly).

Mid-session, a concurrent process/session modified **18 paths unrelated to Task 708**, discovered when a routine
`git status --porcelain` (clean at session start) came back dirty without any edit from this session:

- 13 Mantine story files: `@storybook/react` → `@storybook/nextjs-vite` import swap (Alert, Avatar, Badge, Card,
  Notification, Pagination, Progress, RangeDatePicker, ScrollArea, SegmentedControl, Separator, Skeleton, Slider,
  Tabs `*.stories.tsx`)
- `src/components/admin/AdminReportsManager.tsx` — extracted `reportStatus` local, logic unchanged
- `src/design-system/mantine/patterns/MantineSelect.tsx` — `interface … extends SelectProps {}` → `type … = SelectProps`
- `src/modules/listings/lib/__tests__/visibility.test.ts` — dropped a stale `@ts-ignore`
- `.github/workflows/governance-pr.yml` — split the rendered-proof CI job, added a `homepage-grid` job

**None of these paths were touched, reverted, or built on top of by this task** — confirmed by `git diff` on
`HeroSearchView.tsx`/`check-stories-rendered.mjs`/`heroSearch.smoke.test.tsx` throughout (see AC4/AC6 evidence
below, each showing only the intended lines).

**Owner-directed handling (mid-session clarification):**
1. The **I1 baseline was fully re-captured** after the contamination was discovered, so both sides of every
   before/after comparison (AC5, AC8) share the same foreign state. The original pre-contamination I1
   (`.screenshots/rendered-assert/2026-08-03T21-15/`) is superseded for comparison purposes and kept only as a
   sanity check (see §2).
2. **AC10 (`npm run build`) and `tsc --noEmit` no longer attest to Task 708 alone** — both transcripts also cover
   the 18 foreign paths. Any future failure in that surface needs triage against the contamination, not against
   this task's 3-file diff.
3. This event is the record required for review-time reconciliation of `git status` (19 total paths: 18 foreign +
   this task's 3) against the 3-file task scope.
4. Per the git safety protocol, no foreign path was touched, reverted, or staged.

A separate, unrelated incident: an early attempt to background a verification command with a stray `&` inside the
shell string orphaned a `node` process holding port 6008 (started 07:54:12, this session's own mistake, not the
concurrent session). Identified via `Get-NetTCPConnection`/`Get-Process`, confirmed as this session's own process by
start time, and terminated (`Stop-Process -Id 36080 -Force`) before re-running the baseline. Recorded for
completeness, not a task finding.

---

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | AC | Verdict | Evidence |
|---|---|---|---|---|
| R1 | Assertion returns a real boolean in all 8 `band-700` cells | AC1 | **Confirmed** | Post-repair run: `true`×4 (`Default`×sq/en/uk/it), `null`×4 (`Fallback`×sq/en/uk/it — no search card, correct). §2 |
| R2 | Repaired gate genuinely FAILs on a planted violation | AC2 | **Confirmed** | `heroSearchWrapInBand=false`×4, run reports 5 FAIL, script process **exit 1**, `:1822` message present, transcript persisted, reverted → diff clean. §3 |
| R3 | Neither anchor re-anchors onto a Tailwind class | AC3 | **Confirmed** | Both selectors read `[data-testid="…"]` only; no class token. §4 |
| R4 | `HeroSearchView.tsx` gains exactly 2 `data-testid` attributes, nothing else | AC4 | **Confirmed** | `git diff` — 2 changed lines, each adding only `data-testid`. §5 |
| R5 | All 40 `herosearch` cells keep pre-task PNG md5 + verdict | AC5 | **Confirmed** | 0/40 md5 diffs (I1b vs post-repair). §2 |
| R6 | Smoke test still 6 tests, all passing, `:181`/`:183` unchanged, `:178` re-anchored | AC6 | **Confirmed** | 6/6 PASS; `git diff` — 1 changed line at `:178`. §6 |
| R7 | Re-anchored smoke assertion itself fails on a planted structural violation | AC7 | **Confirmed** | 5/6 PASS with plant (fails exactly at the re-anchored line), reverted → 6/6. §7 |
| R8 | No other `cell.assertions.*` value changes for any cell | AC8 | **Confirmed** | 0 mismatches across all 1184 cells (Mantine-ID normalized, excl. `heroSearchWrapInBand`), summaries identical. §2 |
| R9 | `check:design-tokens` still 23 | AC9 | **Confirmed** | 23 pre- and post-edit, no entry for any touched file. §8 |
| R10 | `npm run build` exits 0, transcript persisted | AC10 | **Confirmed*** | Exit 0. `.screenshots/task708-evidence/ac10-build-transcript.log`. *Also covers the contamination — §0. |
| R11 | Touched files UTF-8, no BOM/mojibake | AC11 | **Confirmed** | Run last, after this log + backlog — §9. |

---

## 2. I1 baseline (re-captured post-contamination) and AC1/AC5/AC8

**Original pre-contamination I1** (`.screenshots/rendered-assert/2026-08-03T21-15/manifest.json`, kept as a sanity
check only): 1160/1184 PASS, 2 FAIL (`LightboxView/Default` blank-canvas, pre-existing/unrelated), 22 AMBIGUOUS
(pre-existing/unrelated). `heroSearchWrapInBand` = `null` × 40 (all 40 herosearch cells, incl. all 8 `band-700`).
Persisted: `.screenshots/task708-evidence/i1-original-baseline-transcript.log` +
`i1-original-herosearch.json`.

**I1b — re-captured baseline** (post-contamination, post my `data-testid` edit, pre-gate-repair):
`.screenshots/rendered-assert/2026-08-04T05-55/manifest.json`. Result: **1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS**
(same pre-existing/unrelated set). `heroSearchWrapInBand` = `null` × 40 — unchanged, confirming the two
`data-testid` attributes are zero-render-delta (A2). Cross-checked all 40 herosearch cell md5s against the original
I1: **0 diffs** — the `data-testid` edit and the contamination together produced no HeroSearch rendering change.
Persisted: `.screenshots/task708-evidence/i1b-contamination-baseline-transcript.log` +
`i1b-contamination-baseline-herosearch.json`.

**Post-repair run** (gate + smoke test re-anchored, no plant):
`.screenshots/rendered-assert/2026-08-04T06-27/manifest.json`. Result: **1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS**
(byte-identical summary to I1b).

- **AC1**: `band-700` × `HeroSearch/Default` = `true` (sq/en/uk/it, all 4); `band-700` × `HeroSearch/Fallback` =
  `null` (all 4, correct — no search card); all 32 non-band herosearch cells = `null` (unchanged).
- **AC5**: all 40 herosearch cell md5s identical to I1b — **0 diffs**.
- **AC8**: field-by-field diff of all 1184 cells' `assertions` object, Mantine-generated-ID-normalized
  (`docs/storybook-governance.md` §14.11 precedent) and excluding `heroSearchWrapInBand` — **0 mismatches**; run
  summaries (`total`/`passed`/`failed`/`ambiguousOnly`) identical between I1b and the post-repair run.

Persisted: `.screenshots/task708-evidence/ac1-ac5-ac8-postrepair-transcript.log` +
`ac1-ac5-ac8-postrepair-herosearch.json`.

---

## 3. AC2 — planted layout violation (gate)

**Plant:** `HeroSearchView.tsx` Search button `className` — `sm:basis-full` → `sm:basis-auto sm:shrink-0` (kept it
content-width instead of wrapping to row 2 in the 640–767 band).

**Run with plant:** `.screenshots/rendered-assert/2026-08-04T06-59/manifest.json`. Result:
**1157/1184 PASS, 5 FAIL** (4 HeroSearch + 1 unrelated `TwoColumnForm` blank-canvas), 22 AMBIGUOUS.

```
❌ Failed cells:
  Mantine/Primitives/HeroSearch/Default × sq × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × en × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × uk × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × it × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
```

`heroSearchWrapInBand` = `false` × 4 (`Default` × band-700, all 4 locales), verdict `fail` × 4. `Fallback` × band-700
unaffected (`null` × 4, `pass` × 4).

**Process exit code, plant still in place:** re-ran `node scripts/check-stories-rendered.mjs --mantine-only`
directly (not through `npm run`) → **`EXIT CODE: 1`** — the run genuinely fails at the process level, not just in
the printed report.

**Reverted:** `className` restored to `sm:basis-full` exactly. `git diff src/components/shared/HeroSearchView.tsx`
after revert = the same 2-line `data-testid`-only diff shown in §5 (confirmed byte-identical). The post-repair run
in §2 (captured before this plant, on this exact reverted state) stands as the "reverted → green" proof.

Persisted: `.screenshots/task708-evidence/ac2-planted-violation-transcript.log` +
`ac2-exitcode-verification.log`.

---

## 4. AC3 — no Tailwind-class anchor; survives a full `className` swap

Both changed selectors, quoted verbatim from the final diffs:

- `check-stories-rendered.mjs`: `document.querySelector('#storybook-root [data-testid="hero-search-card"]')` and
  `card?.querySelector('[data-testid="hero-search-controls"]')`
- `heroSearch.smoke.test.tsx:178`: `expect(container).toHaveAttribute('data-testid', 'hero-search-controls')`

Neither contains a class token (`.`-prefixed selector) — both read the `data-testid` attribute only.

**How the "survives a `className` swap" half was verified:** by construction, not by literally swapping every class
in this task (out of scope — that is Task 709's job). `data-testid` and `className` are two independent JSX props
on the same `Box` element; `Box` forwards each to its own DOM attribute (`data-testid` → attribute, `className` →
`class`) with no code path in `HeroSearchView.tsx` or in either selector that derives one from the other's value.
The I3 rendered-DOM witness (Storybook build with the current Tailwind `className` values in place) already shows
both as independent, literal DOM attributes:

```json
{
  "cardFound": true,
  "cardClass": "rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3",
  "controlsFound": true,
  "controlsChildrenCount": 4,
  "controlsIsDescendantOfCard": true
}
```

Since the gate's `document.querySelector` never reads `class`/`className` for this assertion (post-repair), any
future value substituted into `className` — including a CSS-module class Task 709 might introduce — cannot affect
whether `[data-testid="hero-search-card"]`/`[data-testid="hero-search-controls"]` resolve.

---

## 5. AC4 — `HeroSearchView.tsx` diff

```diff
@@ -92,6 +92,7 @@
             bg="gray.1"
             bd="1px solid var(--mantine-color-gray-2)"
             className="rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3"
+            data-testid="hero-search-card"
           >
@@ -100,7 +101,7 @@
                 shorthand, it fights the sm:/md: flex-basis overrides. */}
-            <Box className="flex flex-wrap md:flex-nowrap gap-2">
+            <Box className="flex flex-wrap md:flex-nowrap gap-2" data-testid="hero-search-controls">
```

Exactly 2 changed lines, both adding only `data-testid`. No class, prop removal, element, or reordering change.

**I3 DOM witness** (rendered Storybook, `band-700`/700×812): `hero-search-card` found (`DIV`), `hero-search-controls`
found (`DIV`, descendant of the card, exactly 4 element children) on `HeroSearch/Default`; neither found on
`HeroSearch/Fallback` (no search card — correct, matches §11 negative-flow row). Confirms A1 (Mantine `Box` forwards
`data-testid` to a real DOM attribute) and A2 (zero rendered delta, corroborated by the AC5 md5 identity).

---

## 6. AC6 — smoke test re-anchor

```diff
@@ -175,7 +175,7 @@
     const container = searchButton.parentElement
     expect(container).not.toBeNull()
-    expect(container).toHaveClass('flex', 'flex-wrap', 'gap-2')
+    expect(container).toHaveAttribute('data-testid', 'hero-search-controls')
```

Single changed line at `:178`. `:181`/`:183` byte-identical. `npx vitest run
src/components/shared/__tests__/heroSearch.smoke.test.tsx` → **6/6 PASS** (both pre- and post-edit baselines, and
after the AC7 plant is reverted).

---

## 7. AC7 — planted structural violation (smoke test)

**Plant:** re-wrapped the filters button + Search button in `HeroSearchView.tsx` inside an intermediate
`<div className="flex gap-2">` — the exact pre-Task-572 nesting the file's own preserved comment (`:181`/`:183`
context) warns against.

**Run with plant:**

```
❯ src/components/shared/__tests__/heroSearch.smoke.test.tsx (6 tests | 1 failed)
  × Task 572: the 4 controls … are direct children of ONE flex-wrap container …

Error: expect(element).toHaveAttribute("data-testid", "hero-search-controls")
Expected the element to have attribute:
  data-testid="hero-search-controls"
Received:
  null

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

Fails exactly at the re-anchored `:178` assertion — `searchButton.parentElement` is now the inner plant `<div>`,
which correctly lacks the `data-testid` (it lives on the untouched outer `Box`).

**Reverted:** intermediate `<div>` removed exactly. `git diff src/components/shared/HeroSearchView.tsx` after
revert = the same 2-line diff as §5 (confirmed). `npx vitest run … heroSearch.smoke.test.tsx` → **6/6 PASS**.

---

## 8. AC9 — design-tokens

`npm run check:design-tokens` (`--strict`): **23** both pre- and post-edit (`src/app/[locale]/page.tsx` 8 +
`NotificationCenter.tsx` 4 + [11 more elsewhere, unchanged file set]). No entry for `HeroSearchView.tsx`,
`check-stories-rendered.mjs`, or `heroSearch.smoke.test.tsx` in either run — `data-testid` is not a style value.

---

## 9. AC10/AC11 — build, file-integrity, mojibake

- `npx tsc --noEmit` — **0 errors**.
- `npm run build` — **exit 0**. Transcript: `.screenshots/task708-evidence/ac10-build-transcript.log`. Per §0,
  this transcript also covers the 18 contamination paths — a future build failure in that surface is not
  necessarily a Task 708 regression and needs triage against §0's file list first.
- `npm run check:file-integrity` / `npm run check:mojibake` — run **after** this log and the backlog update exist
  (§10.7, N6 3rd-recurrence avoidance):
  - `check:file-integrity`: **PASSED — 23 files clean** (NUL/BOM/JSON-parse/`node --check`/truncation). 23 = the 18
    contaminated paths (§0) + this task's 5 (`check-stories-rendered.mjs`, `HeroSearchView.tsx`,
    `heroSearch.smoke.test.tsx`, `docs/backlog.md`, this session log) — matches the reconciled changed-file set.
  - `check:mojibake`: **0 artifacts in 2049 files** scanned.

---

## 10. Files changed

| Path | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | Re-anchor `heroSearchWrapInBand`'s DOM selector onto `data-testid`, rewrite the fossil comment (D33) |
| `src/components/shared/HeroSearchView.tsx` | Add `data-testid="hero-search-card"` / `data-testid="hero-search-controls"` — 2 lines, zero render delta |
| `src/components/shared/__tests__/heroSearch.smoke.test.tsx` | Re-anchor `:178`'s class assertion onto the same `data-testid` |
| `docs/backlog.md` | Task 708 state update, contamination event note — net 0 line delta (held at pre-existing 108) |
| `docs/sessions/2026-08-04-task708-herosearch-band-gate-repair.md` | This log |

**Reconciled against `git status --porcelain`:** 3 in-scope source paths + 2 doc paths above. The 18 contaminated
paths (§0) are **not** in this table — they were not touched, edited, or reverted by this task and remain exactly
as the concurrent process left them.

---

## 11. Other `null`-by-default assertions noticed (finding for Task 710 — not acted on)

Per §8 of the task's out-of-scope list, `fullWidthControlsAtMobile`/`fullWidthButtonsAtMobile`/
`popupBottomSheetAtMobile`/`visualIntegrity.pass` share the same "`null` defers to a non-committal path, only
`=== false` hard-fails" shape as the pre-repair `heroSearchWrapInBand`. Not inspected further here — Task 710's
stated subject.

---

## 12. Assumptions, deviations, limitations

- **A1/A2 (kickoff §5.1)**: confirmed, not assumed — see §5's I3 DOM witness and AC5's md5 identity.
- **Deviation from a literal reading of "re-run to green" (AC2/AC7):** rather than issuing a redundant third full
  `--mantine-only` run after reverting each plant, this log cites the §2 post-repair run (captured on the same
  reverted file state, confirmed byte-identical via `git diff` both times) as the "reverted → green" proof for
  AC2, and a direct post-revert `vitest` run for AC7. No plant was left in place at any point the diff was inspected.
- **Limitation:** the original pre-contamination I1 run is kept only as a sanity cross-check; the owner-directed
  comparison baseline for AC5/AC8 is I1b (§0, §2).
- **BACKLOG LIMIT BREACH:** pre-existing (108 lines, over the ~80-line target before this session started). Held at
  108 (net 0 delta) — not grown by this task, but not reduced either; still needs Opus consolidation.

---

## 13. Opus handoff

- Evidence root: `.screenshots/task708-evidence/` (transcripts + herosearch JSON extractions); full manifests +
  PNGs remain at their `.screenshots/rendered-assert/2026-08-0{3,4}T*/` paths named throughout this log (local-only,
  D6).
- **Please verify independently:** the §0 contamination file list against a fresh `git status --porcelain` (it may
  have changed further since this log was written, if the concurrent session is still active) — reconcile before
  emitting any commit handoff, and stage only this task's 5 paths (§10), never the 18 foreign ones.
- **Risk to confirm:** whether `.github/workflows/governance-pr.yml`'s concurrent rewrite (splitting the
  rendered-proof CI job) changes the actual CI command this task's Q4 evidence should be checked against — this
  task's local commands (`npm run screenshots:assert -- --mantine-only`, `npx vitest run …`) are unaffected either
  way, but the workflow file itself is outside this task's owned scope to judge.
