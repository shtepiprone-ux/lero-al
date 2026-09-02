# Task 780R — `ListingsFilterBar` review rework: remove production inset, absorb overhang in story harness

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Kickoff:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_780_ListingsFilterBar_ReviewRework.md`
**Executor session:** 2026-09-02, platform `win32`, Node `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al`.

---

## 1. Files changed (this session only)

| Path | Reason |
|---|---|
| `src/modules/listings/components/ListingsFilterBar.tsx` | R1 — removed `me="sm"` from root `Stack` (`:75` old / `:73` new); rewrote the obsolete comment paragraph — Modified |
| `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` | R2 — added `<Box px={{base:'md',sm:'xl',lg:'2xl',xxl:'3xl'}}>` container around the rendered bar, matching `ListingsPageFrame.tsx:78`; `Box` import added; new doc-comment paragraph naming its provenance — Modified |
| `docs/sessions/evidence/task780R/` | New — retained instrument, comparator, manifests, transcripts (R8) — Created |
| `docs/sessions/2026-09-02-task780R-listings-filter-bar-rework.md` | This log — Created |
| `docs/backlog.md` | State update, kept ≤80 lines (R11) — Modified |

**Separated from the Task 779/780 changes already in the tree (§3.1):** `scripts/mantine-migration-scope.json` and
`src/modules/listings/components/ListingsShellView.tsx` show as modified in `git status` — both are Task 779's
carried-over changes; **zero diff to either in this session**, confirmed by `git --no-optional-locks diff --stat`
(only `ListingsFilterBar.tsx`'s line count changed vs. the pre-780R tree). `useListingsUrlFilters.ts` and
`listingsFilterBar.smoke.test.tsx` — zero diff, confirmed absent from `git status --porcelain`/`diff --stat`.

`tasks/Sprints/Sprint_68_Task_780_review_ledger.PENDING-VALIDATION.json` appeared untracked in the worktree during
this session — an orchestrator artifact, not created or touched by it. It was a staging copy of the Task 780 review
ledger and was **deleted on 2026-09-02** once the final validated ledger landed at
`docs/reviews/2026-09-02-task780R-listings-filter-bar-rework.review-ledger.json`. It was never committed.

---

## 2. Requirement IDs completed

| ID | Evidence |
|---|---|
| R1 | AC1 grep (§6 below): 0 `className=`, 0 code-level `me=`/`mr=`/`ml=`; the sole `ms=` in the file is the retained `ms={{ sm: 'auto' }}` on the right-actions `Group` (`:134`), not on `Stack`. Comment paragraph rewritten to describe the withdrawal, asserting no margin mechanism. |
| R2 | Story file `:77-81`: `<Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}>` wraps `<ListingsFilterBar>`. Mantine token props only — no raw px/rem, no `className`, no `style`, no CSS module. `skipCanvas: true` and `layout: 'fullscreen'` unchanged (grep-confirmed, both still present verbatim). |
| R3 | `Indicator` (`:150`) carries `label`, `disabled`, `color`, `w` only — no `size`, `offset`, or `position` prop, grep-confirmed. |
| R4 | Both comboboxes still wrapped in `Box w={FULL_BELOW_SM}` (`:101`, `:113`); every `Button` and the `Indicator` retain `w={FULL_BELOW_SM}`; `ms={{ sm: 'auto' }}` retained on right-actions `Group`. `data-testid="task775-advanced-filters"` (`:153`) and `data-testid="listings-filter-bar-root"` (`:73`) byte-identical to the pre-780R file. |
| R5 | Retained instrument (§8) adds `containerContentRight`/`barInsetRight`/`|barInsetRight|<=2` per cell. 16/16 PASS on the final state (`instrument-final.log`). Plant P-A recorded failing this exact assertion at all 16 cells (§7). |
| R6 | §5 — differential `P \ B = ∅`, arithmetic reconciles, 16/16 `ListingsFilterBar` cells PASS with `noHorizontalOverflow: true` on every one (`differential-comparison.json`). Plant P-B recorded failing `noHorizontalOverflow` at all 16 cells (§7). |
| R7 | §4 — every gate transcript timestamped after the final source write (this file's edits were the last write before V1-V12; the S2 plant/revert cycle's own rebuilds are the true "final write" boundary, and all V-gates ran after the P-B revert + final rebuild). |
| R8 | `docs/sessions/evidence/task780R/measure-layout-instrument.mjs` retained (not deleted). `git hash-object`: **`865b114060628fce8871430a91a04f72ca4cade0`**. |
| R9 | §9 — CC8 corrected; CC10/CC11 recorded with measured before/after. |
| R10 | AC11 — `git diff --stat` shows only `ListingsFilterBar.tsx`, `ListingsShellView.tsx`, `mantine-migration-scope.json`; the latter two are Task 779's pre-existing diff, untouched this session. `useListingsUrlFilters.ts` and `listingsFilterBar.smoke.test.tsx` absent from any diff. |
| R11 | `docs/backlog.md` — physical line count after this session's edit: see §10; baseline taken from `git show HEAD:docs/backlog.md` = 73 lines (not measured post-edit and misreported as pre-existing). |

---

## 3. S0 preconditions

`HEAD` read at S0: `e8cbcfb436a933b4c21c3b31aa2939f2ec704647` — **not** `3beabc9cc`, the SHA the kickoff's original S0
required. Per the kickoff's original (pre-revision) wording this was an unconditional stop condition; execution
halted and reported `BLOCKED` rather than reinterpreting it. The orchestrator revised S0 (Revision 1, recorded
in-document) to a comparator: `git --no-optional-locks diff --name-only 3beabc9cc HEAD` passes only if every
returned path starts with `docs/` or `tasks/`. Re-measured independently before resuming:

```
docs/backlog-archive.md
docs/backlog.md
tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md
tasks/Sprints/Sprint_68_kickoff_prompt_Task_780_ListingsFilterBar_ReviewRework.md
```

Four paths, all `docs/`/`tasks/`. Comparator PASSES independently of the orchestrator's own re-authorization message.
B (`docs/sessions/evidence/task780/B-manifest.json`, reused per §3.8) remains valid; no re-capture performed.

`git --no-optional-locks status --porcelain` at S0, before the first write, matched §3.1's ten paths exactly (see
§1 above for the full current listing, which additionally shows the orchestrator's own new artifacts from filing
this kickoff — none of which this session created).

---

## 4. Commands run

All native Windows PowerShell, `node.exe -p process.platform` → `win32` confirmed at every evidence-producing
session start, Node `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al`. Every command below ran **after** the final
source write (the P-B-plant revert + rebuild that restored the story container — `V7-final-build.log`).

| # | Command | Exit | Transcript |
|---|---|---:|---|
| S0 | `rev-parse HEAD` + `diff --name-only 3beabc9cc HEAD` + `status --porcelain` | — | inline above |
| S1 | Component/story edits + instrument run | 0 | `instrument-run1.log` (16/16) |
| S2-PA | Plant `me="sm"`, build, instrument | 1 | `plant-PA-build.log` / `plant-PA-instrument.log` (0/16, `barInsetRight=12.00`) |
| S2-PA revert | Remove `me="sm"`, build, instrument | 0 | `revert-PA-build.log` / `revert-PA-instrument.log` (16/16) |
| S2-PB | Remove story container, build, instrument | 1 | `plant-PB-build.log` / `plant-PB-instrument.log` (0/16, `noDocumentOverflow=false` at every cell) |
| S2-PB revert | Restore story container, build, instrument | 0 | `V7-final-build.log` / `instrument-final.log` (16/16) |
| V1 | `npx vitest run listingsFilterBar.smoke.test.tsx` + 3 sibling suites | 0 | `V1-final.log` (60/60) |
| V2 | `npm run check:stories` | 0 | `V2-final.log` (133 files, 0 violations) |
| V3 | `npm run check:story-coverage` | 0 | `V3-final.log` (22/22 covered) |
| V4 | `npm run governance:tailwind` | 0 | `V4-final.log` (C0/H10/M0, baseline unchanged) |
| V5 | `npm run check:design-tokens:strict` | 0 | `V5-final.log` (0 violations) |
| V6 | `npm run typecheck` | 0 | `V6-final.log` |
| V7 | `npm run build-storybook` (final) | 0 | `V7-final-build.log` |
| V8 | `npm run screenshots:assert -- --mantine-only` (= P) | 1* | `V8-screenshots-assert.log` — *80 pre-existing FAILs, identical set to B |
| V9 | `npm run check:locale-leak:mantine-only` | 1* | `V9-locale-leak.log` — *23 pre-existing leaks, 0 attributable to `ListingsFilterBar` |
| V10 | `npm run build` | 0 | `V10-build.log` |
| V11 | `git --no-optional-locks diff --check` | 0 | `V11-diff-check.log` |
| V12 | `git --no-optional-locks diff --stat` | 0 | `V12-diff-stat.log` |

---

## 5. Differential rendered result (D68-2)

**B** (reused per kickoff §3.8, not re-captured): `docs/sessions/evidence/task780/B-manifest.json`,
timestamp `2026-09-02T12-42`, **1380 total / 1273 PASS / 80 FAIL / 27 AMBIGUOUS**, 83 Mantine stories. Copied into
`docs/sessions/evidence/task780R/B-manifest.json` for this task's own retained record.

**P**: `docs/sessions/evidence/task780R/P-manifest.json`, timestamp `2026-09-02T17-30`,
**1396 total / 1289 PASS / 80 FAIL / 27 AMBIGUOUS**, 84 Mantine stories.

**Arithmetic** (`differential-comparison.json`, computed by the retained `compare-manifests.mjs`):

```
total(P) = 1396 = total(B) + 16 = 1380 + 16   ✓
pass(P)  = 1289 = pass(B)  + 16 = 1273 + 16   ✓
fail(P)  =   80 =  fail(B)      =   80        ✓
ambig(P) =   27 = ambig(B)      =   27        ✓
```

`newFailedIdentities: []`, `newAmbiguousIdentities: []` — `P \ B = ∅` as a set of normalized
`Story × locale × viewport` identities, programmatically computed (not counted).

**All 16 `Patterns/Mantine/ListingsFilterBar/Default` cells**, individually, from the P matrix:

| Locale | Viewport | Verdict | `noHorizontalOverflow` |
|---|---|---|:---:|
| sq | mobile-320 | pass | true |
| sq | mobile-375 | pass | true |
| sq | mobile-390 | pass | true |
| sq | desktop-1024 | pass | true |
| en | mobile-320 | pass | true |
| en | mobile-375 | pass | true |
| en | mobile-390 | pass | true |
| en | desktop-1024 | pass | true |
| uk | mobile-320 | pass | true |
| uk | mobile-375 | pass | true |
| uk | mobile-390 | pass | true |
| uk | desktop-1024 | pass | true |
| it | mobile-320 | pass | true |
| it | mobile-375 | pass | true |
| it | mobile-390 | pass | true |
| it | desktop-1024 | pass | true |

---

## 6. AC1 grep evidence (verbatim)

```
$ grep -n "className=" src/modules/listings/components/ListingsFilterBar.tsx
(no matches)

$ grep -n "me=\|mr=\|ml=\|ms=" src/modules/listings/components/ListingsFilterBar.tsx
16: * additionally carries `ms={{ sm: 'auto' }}` …                          ← comment
24: * document-edge overflow with a `me="sm"` inset on this `Stack` — but …  ← comment, past tense
134:        <Group gap="xs" wrap="wrap" w={FULL_BELOW_SM} ms={{ sm: 'auto' }}>  ← code, right-actions Group
```

Zero code-level `me=`/`mr=`/`ml=`. The sole code-level `ms=` is on the right-actions `Group`, not `Stack` —
matches AC1 exactly.

---

## 7. Planted violations — two-armed obligation

Both plants applied to the full 16-cell matrix (not reduced to a single cell for either arm, though the kickoff
permitted P-B to be single-cell).

| Arm | Plant | Actual failing output | Revert confirmed |
|---|---|---|---|
| **P-A** | Re-added `me="sm"` to root `Stack` | All 16 cells: `containerRelative: false`, `barInsetRight=12.00` (exactly the reintroduced 12px). Every other check (`propertyType`/`location`/`premium`/`reset`/`advanced`/`rightAligned`) still reported `true` — **this is the point**: the OLD instrument (relative-to-bar-root only) would have missed this defect entirely; only the new container-relative check catches it. `plant-PA-instrument.log`, exit 1, 0/16 PASS. | `revert-PA-build.log` + `revert-PA-instrument.log`, 16/16 PASS |
| **P-B** | Removed the story's `Box` container, rendering the bar bare again | All 16 cells: `noDocumentOverflow: false` (`documentScrollWidth > documentClientWidth+1`), while `containerRelative: true` (barInsetRight=0, since there's no gutter to misalign against — a genuinely different failure signature from P-A, confirming the two plants are independent). `plant-PB-instrument.log`, exit 1, 0/16 PASS. Verified against the **full matrix**, exceeding the kickoff's "≥1 cell" minimum. | `V7-final-build.log` + `instrument-final.log`, 16/16 PASS |

Neither plant produced a false negative; neither required adjustment to pass. Both are genuine controls.

---

## 8. Instrument — retained

**Path:** `docs/sessions/evidence/task780R/measure-layout-instrument.mjs`
**`git hash-object`:** `865b114060628fce8871430a91a04f72ca4cade0`

Adds, beyond the previous attempt's per-control relative-width checks: `containerContentRight` (the bar root's
containing block's content-box right edge, i.e. `container.getBoundingClientRect().right −
paddingRight(container)`), `barInsetRight = containerContentRight − barRootRight`, and
`pass` requires `|barInsetRight| <= 2`. Also adds `documentScrollWidth`/`documentClientWidth`/`noDocumentOverflow`
per cell (the same measurement the real gate performs, usable as a fast pre-check before the full
`screenshots:assert` run). A companion comparator, `compare-manifests.mjs`, is also retained in the same directory
(not required by name in R8, kept for consistency with the instrument's retention).

---

## 9. Measured before/after — CC8 correction, CC10, CC11

- **CC8 correction (Task 779 §7).** That row stated the spacer became a `Group justify="space-between"`
  composition. **The delivered mechanism is `ms={{ sm: 'auto' }}`** on the right-actions `Group` (confirmed at
  `ListingsFilterBar.tsx:134`, unchanged by this task). Record corrected.
- **CC10 — the bar loses its 12px right inset.** Before (Task 780, withdrawn): `barRootWidth` 308/363/378/1012 at
  320/375/390/1024 (viewport − 12), `barRootRight === barRootWidth`, right side only. After (this task):
  `barInsetRight = 0.00` at all 16 cells (`instrument-final.log`) — the bar's right edge is flush with its
  containing block's content edge, matching every sibling on the production route (`ListingsShellView.tsx` was
  never touched and carries no inset).
- **CC11 — the story gains the production containing block.** Before: bar rendered bare, flush to the viewport
  edge (`layout:'fullscreen'`, no container). After: bar rendered inside `<Box px={{base:'md',sm:'xl',lg:'2xl',
  xxl:'3xl'}}>` — measured control widths now reflect `viewport − 32px` at 320/375/390 (16px each side) and
  `viewport − 64px` at 1024 (32px each side), not the raw viewport. This makes the 16 cells more faithful to
  production, not less — no "visually neutral" claim is made anywhere in this report.

---

## 10. Assumptions — fate of A1-A4

- **A1 held**, measured not assumed: the 16px base gutter absorbed the ~7px badge overhang at every mobile cell,
  confirmed via `noDocumentOverflow: true` in the P manifest (§5), not via arithmetic alone.
- **A2 held**: no full-width verdict regressed. All `propertyType`/`location`/`premium`/`reset`/`advanced` checks
  remained `true` throughout (instrument logs), and the real gate's `fullWidthControlsAtMobile`/
  `fullWidthButtonsAtMobile` assertions show no new FAIL in the P manifest for this story.
- **A3, A4** — unchanged, not addressed here (raw enum labels / Task 679; 391-1023px detector blind spot / Task
  779 §10.6). Not in scope.

---

## 11. Backlog + session log

`docs/backlog.md` baseline at `HEAD` (`git show HEAD:docs/backlog.md`): **73 lines**. This session's edit keeps
the file at or under 80 lines — concise "Last Session" update only, no multi-line report appended. Full detail is
this file.
