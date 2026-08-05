# Task 709-R — Restore site 8's cascade-layer standing: `@layer utilities` for `HeroSearchView.module.css`

**Task:** `tasks/Sprints/Sprint_49_kickoff_prompt_Task_709R_HeroSearchView_LayerFix.md`
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

---

## 1. Files changed

Reconciled against the pre-write `git status --porcelain` snapshot (`.screenshots/task709R-evidence/i1-dirty-worktree-manifest.md`).

| Path | Type | Reason |
|---|---|---|
| `src/components/shared/HeroSearchView.module.css` | edit (was `??` from Task 709) | Wrapped every rule in one `@layer utilities { … }` block; corrected the provenance header (R9) |
| `docs/sessions/2026-08-05-task709-herosearchview-de-tailwind.md` | edit (was `??` from Task 709) | R13 correction note in §6: retracted the wrong `(0,1,0)`/`(0,0,0)` specificity claim, stated the corrected source-order mechanism |
| `tasks/Sprints/Sprint_49_kickoff_prompt_Task_709_HeroSearchView_DeTailwind.md` | edit | R13 correction note after §3.3: `sm:basis-full` **does** compile; the drop rests on measured equivalence, not absence |
| `docs/backlog.md` | edit (was already `M` from Task 709) | Concise state update, this session |
| `docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md` | new | This session log |

**Zero-diff scope, verified by SHA-256 before/after (unchanged):** `src/components/shared/HeroSearchView.tsx`,
`src/stories/mantine/primitives/HeroSearch.stories.tsx`, `scripts/check-stories-rendered.mjs`,
`src/components/shared/__tests__/heroSearch.smoke.test.tsx`, and the six other `.module.css` files
(`FooterView`, `HeaderView`, `MantineHomeSection`, `FeaturedListingsView`, `LatestListingsView`,
`PopularLocationsView`). Full witness table: `.screenshots/task709R-evidence/i1-dirty-worktree-manifest.md`.

**Excluded, unrelated, untouched (dirty at session start, later committed mid-session by a concurrent process as
`50c40c2f8` "fix(ci): unblock governance PR checks"; SHA-256 confirmed byte-identical before and after that commit,
so no content this task is responsible for changed):** `scripts/governance/baseline.json`,
`scripts/governance/scan-ssr.mjs`, `src/app/[locale]/page.tsx`, `src/app/globals.css`,
`src/modules/listings/components/FavoriteButton.module.css`,
`src/modules/listings/components/SaveToCollectionButton.module.css`,
`src/modules/notifications/components/NotificationCenter.tsx`, `scripts/__tests__/scan-ssr.test.ts`.

---

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 — every rule in `@layer utilities` | AC1 | **PASS** — single block, opened after the header, wraps both `@media` blocks (no nesting). Emitted selector (post-build): `@layer utilities{...._searchControl_blflv_31{padding-inline:var(--space-6);--tw-font-weight: 600;font-weight:600;flex-basis:100%}@media(min-width:48rem){._searchControl_blflv_31{flex-grow:0;flex-basis:auto}}}` |
| R2 — all 40 herosearch cells match `T06-34` | AC2 | **PASS** — 40/40 md5-identical, including the 20 previously-regressed `--default` cells. 0 changed. |
| R3 — site 8 = 12px/18px at 375/700/1024 | AC3 | **PASS** — 0 diffs vs `i2` (pre-709 target); exactly 6 diffs vs `i3` (post-709 regression), all `site8_searchControl.paddingLeft/paddingRight` at the 3 widths, `24px→12px`/`24px→18px`. |
| R4 — gate `true`×4/`null`×36 | AC4 | **PASS** — matrix indices 260/265/270/275 all `true`, all other herosearch cells `null`. |
| R5 — planted violation genuinely fails, exit captured | AC5 | **PASS** — plant flipped all 4 target cells to `false`/FAIL, run reported `Results: …, 4 FAIL, …`, `EXIT_CODE=1` captured unpiped inside the transcript. Revert restored 40/40 md5-identical + gate `true`×4 + `EXIT_CODE=0`. |
| R6 — six other `.module.css` files zero diff | AC6 | **PASS** — all 6 SHA-256-identical before/after. |
| R7 — `HeroSearchView.tsx`, stories, gate script, smoke test zero diff | AC7 | **PASS** — all 4 SHA-256-identical before/after. |
| R8 — layering changes only layer membership | AC8 | **PASS** — diff quoted below; only the header rewrite, the `@layer utilities {`/`}` wrapper, and re-indentation. |
| R9 — header corrected | AC9 | **PASS** — "(0,1,0) beats (0,0,0)" claim absent from the module (was never literally there; the paragraph is now fully rewritten to state the corrected mechanism), D34 cited, 602/629/650/651/653/654/656 non-application recorded. |
| R10 — `npm run build` exit 0, transcript persisted | AC10 | **PASS** — `.screenshots/task709R-evidence/i6-build.log`, `EXIT_CODE=0` captured inside the file. |
| R11 — design-tokens / smoke test | AC11 | **PARTIAL, attributed** — smoke test 6/6 PASS. `check:design-tokens` reads **0**, not the kickoff's stated 23 — see §8 below; not caused by this task. |
| R12 — counting gates last, real numbers in the log | AC12 | **PASS** — see §8. |
| R13 — 709 log + kickoff correction notes | AC13 | **PASS** — both edited, diffs shown in §1/§9. |

---

## 3. Current versus required behavior

**Current (start of session, inherited from Task 709):** `HeroSearchView.module.css` unlayered. Site 8's
`.searchControl { padding-inline: var(--space-6) }` (equal specificity `(0,1,0)` to Mantine's
`:where([data-with-left-section])` rule, also `(0,1,0)`, at equal unlayered cascade tier) won on source order,
rendering `paddingLeft/paddingRight: 24px/24px` instead of the pre-709 `12px/18px`. 20 of 40 herosearch cells
differed from the `T06-34` baseline.

**Required after (this session):** every rule in `@layer utilities`, so the module unconditionally loses to
Mantine's unlayered CSS regardless of specificity or source order — site 8 back to `12px/18px`, all 40 cells
byte-identical to `T06-34`, and the 640–767 band gate (`heroSearchWrapInBand`) still provably live (plants to
`false`, genuinely fails, reverts clean).

**Negative flows (§11 applicability table):**

| Branch | Applicable? | Result |
|---|---:|---|
| CSS-modules pipeline drops/mangles `@layer` | Yes | Did not occur — layer survived, classes still hashed (`_searchControl_blflv_31` etc.) |
| Planted band violation | Yes | Genuinely FAILed (4/4 target cells), exit code 1 captured, reverted clean |
| Layering weakens an uncontested class (sites 2/3/4/5/7) | Yes | No computed-style change vs. `i3`/`i2` on any of them |
| `className` reaching a child via `cn()` (sites 4/5/7) | Yes | Module classes confirmed present on child roots (DOM witness, §5) |
| Locale expansion (sq/en/uk/it) | Yes | Identical md5/verdict in all 4 |
| Hydration / RLS / validation | No | Presentational CSS-only change; no runtime branch, no data access touched |

---

## 4. A1 — pipeline result

Pre-edit compiled chunk (`storybook-static/assets/HeroSearch-x6ZCZH7x.css`, saved as
`.screenshots/task709R-evidence/i1-pre-edit-HeroSearch.css`): unlayered, e.g.
`._searchControl_uwk7k_32{padding-inline:var(--space-6);...}`.

Post-edit compiled chunk (`storybook-static/assets/HeroSearch-BXCG9YH-.css`, saved as
`.screenshots/task709R-evidence/i2-post-edit-HeroSearch.css`):

```
@layer utilities{..._searchControl_blflv_31{padding-inline:var(--space-6);--tw-font-weight: 600;font-weight:600;flex-basis:100%}@media(min-width:48rem){._searchControl_blflv_31{flex-grow:0;flex-basis:auto}}}
```

The `@layer utilities { … }` block survived compilation as a single outer wrapper (not nested inside `@media`,
per §10.2), and CSS-modules class hashing is intact (`_searchControl_blflv_31`, changed hash suffix only because
file content/module-id changed — same hashing mechanism, not broken). **A1 resolved: no `BLOCKED`.**

---

## 5. Computed-style diff (I2) against `i2` and `i3`

Captured via an ad-hoc Playwright script (transient, not persisted — same convention as Task 709's own I2/I3
captures) against the real `Mantine/Primitives/HeroSearch/Default` story at 375/700/1024, saved as
`.screenshots/task709R-evidence/i2-post-layer-computed-styles.json`.

- **vs. `i2`** (`.screenshots/task709-evidence/i2-pre-edit-computed-styles.json`, the pre-709 target): **0 diffs**
  across all 9 sites × 3 widths (`childrenCount=4` at every width).
- **vs. `i3`** (`.screenshots/task709-evidence/i3-post-edit-computed-styles.json`, the post-709 regression):
  **exactly 6 diffs**, all `site8_searchControl.paddingLeft`/`paddingRight` at 375/700/1024:
  `24px→12px` / `24px→18px`. No other site or property differs.

**DOM witness** (`.screenshots/task709R-evidence/i2-dom-witness.json`, band-700): all 6 module classes present —
`_searchCard_blflv_56`, `_controls_blflv_68`, `_typeControl_blflv_80` (on `PropertyTypeCombobox`'s child root,
merged via `cn()`), `_locationControl_blflv_92` (`LocationCombobox`'s child root), `_filtersControl_blflv_104`
(`MantineCountButton`'s `Button` root), `_searchControl_blflv_31` (`Button` root) — control row still exactly 4
element children.

---

## 6. The 40-cell comparison against `T06-34`

`npm run screenshots:assert -- --mantine-only` → `.screenshots/rendered-assert/2026-08-05T10-27/`
(`.screenshots/task709R-evidence/i3-mantine-only-assert.log`).

Direct md5 comparison of all 40 `mantine-primitives-herosearch--*` PNGs against
`.screenshots/rendered-assert/2026-08-05T06-34/` (script output, saved as
`.screenshots/task709R-evidence/i3-herosearch-md5-comparison.json`): **40 identical, 0 changed, 0 missing.**
All 40 cells report `verdict: pass`. Gate: `heroSearchWrapInBand` `true` at indices 260/265/270/275 (sq/en/uk/it ×
band-700), `null` at the other 36.

**One unrelated FAIL in this run** (`Mantine/Primitives/LocationComboboxSubPanel/Default × en × mobile-320`,
`blank-canvas`/near-uniform + horizontal-overflow): a story this task does not touch, absent from
`T06-34`/Task 709's own `T09-04` run (both `pass`), and matching this project's own documented
capture-flake pattern (`docs/storybook-governance.md:1130`, "capture flake … present in run 1 and cleared in
run 2 — zero [impact]"). It did not recur in either of the two subsequent full runs this session (I4 plant, I4
revert-confirm) — see §7. Recorded as a standing finding, not acted on (out of scope, §9).

---

## 7. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` + `git diff --stat` (I1) | 12 entries, not the 4 the kickoff quoted — see §9 finding | `.screenshots/task709R-evidence/i1-dirty-worktree-manifest.md` |
| 2 | `npm run build-storybook` (I1, pre-edit) | exit 0 | `i1-build-storybook.log` |
| 3 | `npm run build-storybook` (I2, post-layer) | exit 0 | `i2-build-storybook.log` |
| 4 | `npm run screenshots:assert -- --mantine-only` (I3) | `Results: 1161/1184 PASS, 1 FAIL, 22 AMBIGUOUS`; herosearch 40/40 PASS; `EXIT_CODE=1` (from the 1 unrelated FAIL, §6) | `i3-mantine-only-assert.log`, `.screenshots/rendered-assert/2026-08-05T10-27/` |
| 5 | `npm run build-storybook` (I4, plant) | exit 0 | `i4-plant-build-storybook.log` |
| 6 | `npm run screenshots:assert -- --mantine-only` (I4, planted) | `Results: 1158/1184 PASS, 4 FAIL, 22 AMBIGUOUS`; the 4 FAILs are exactly the 4 target herosearch band-700 cells; **`EXIT_CODE=1`** captured unpiped, inside the file | `i4-planted-violation-assert.log`, `.screenshots/rendered-assert/2026-08-05T11-01/` |
| 7 | `npm run build-storybook` (I4, revert) | exit 0 | `i4-revert-build-storybook.log` |
| 8 | `npm run screenshots:assert -- --mantine-only` (I4, revert-confirm) | `Results: 1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS`; 40/40 herosearch md5-identical to `T06-34`; gate `true`×4; **`EXIT_CODE=0`** | `i4-revert-confirm-assert.log`, `.screenshots/rendered-assert/2026-08-05T11-33/` |
| 9 | `npm run check:design-tokens` | `0` violations (kickoff expected 23 — see §9 finding) | `i6-design-tokens.log` |
| 10 | `npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx` | 6/6 PASS | `i6-smoke-test.log` |
| 11 | `npx tsc --noEmit` | 0 errors | `i6-tsc.log` |
| 12 | `npm run build` | **exit 0**, `EXIT_CODE=0` captured inside the file | `i6-build.log` |
| 13 | `npm run check:file-integrity` · `npm run check:mojibake` (last) | see §8 | `i6-file-integrity.log`, `i6-mojibake.log` |

The AC5 plant/revert used the module CSS (`.searchControl { flex-basis: auto }`, was `100%`), not
`HeroSearchView.tsx`, since the .tsx is out of scope for this task. Diff of the plant and its exact revert:
identical to the pre-plant state (confirmed via the same diff comparator used for AC8, and via the 40/40 md5
match in run #8 above).

---

## 8. Counting gates (run last, after this log and the backlog row existed)

Run after this session log and the `docs/backlog.md` update were both in place, per N6/§10.8. **Real, actual
numbers from the live run** (`.screenshots/task709R-evidence/i6-file-integrity.log`,
`.screenshots/task709R-evidence/i6-mojibake.log`):

- `npm run check:file-integrity` — scope: git-changed + untracked (default). **Checked 6 file(s)** (NUL bytes ·
  BOM · JSON parse · `node --check` · truncation). **PASSED — all 6 file(s) clean.** `EXIT_CODE=0`.
- `npm run check:mojibake` — scanned **2055** text file(s) under `docs/ src/ app/ components/ modules/ messages/
  tasks/ scripts/` + root `*.md`. **0 artifacts in 2055 files.** `EXIT_CODE=0`.

Reconciled against the pre-write `git status --porcelain` snapshot (§1): the 6 files `check:file-integrity`
scoped to are exactly this session's changed set (module CSS, both session logs, the 709 kickoff correction,
`docs/backlog.md`) — matches the "Files changed" table in §1.

---

## 9. Standing findings not acted on (per §8 out-of-scope)

1. **`check:design-tokens` reads 0, not the kickoff's stated 23.** Root cause: a concurrent, unrelated commit
   (`50c40c2f8`, `fix(ci): unblock governance PR checks`) landed on this branch **during** this session (between
   I1 and I2) and touched `FavoriteButton.module.css`, `SaveToCollectionButton.module.css`, `page.tsx`, and
   `NotificationCenter.tsx` — the exact 4 files the kickoff's §3.5 attributed the 23 violations to. SHA-256
   confirms these files' content was byte-identical before and after that commit landed (it only formalized
   pre-existing working-tree modifications this task correctly excluded and never touched — see the dirty-worktree
   manifest, §1). The task's own requirement — "no entry for `HeroSearchView.*`" — still holds trivially at 0.
   Not attributable to this session; flagged for the orchestrator to reconcile the kickoff's stated baseline.
2. **The `LocationComboboxSubPanel` capture flake** (§6) — a known, documented capture-flake pattern in this
   repo, on a story this task never touches. Not re-triaged as a defect.
3. The repo-wide N1 debt (raw resolved values instead of `var()` tokens) — unchanged, out of scope.
4. The `--mantine-radius-lg` 8px (theme override) vs. 16px (Mantine stock default) discrepancy — unchanged,
   `var(--mantine-radius-lg)` referenced verbatim either way.
5. The pre-existing `<div>` cannot be a descendant of `<p>` hydration warning in the FiltersPanel drawer — real,
   predates this task, needs its own task (per kickoff §8).

---

## 10. Assumptions, deviations, limitations, unresolved issues

- **A1** (CSS-modules pipeline handling of `@layer` in a `.module.css`) resolved cleanly — no workaround needed,
  no `BLOCKED`.
- **A2/A3** confirmed exactly as predicted by measurement, not assumed.
- **Deviation:** the AC5 plant was applied to `HeroSearchView.module.css` (`.searchControl { flex-basis: auto }`,
  reverted to `100%`), not to `HeroSearchView.tsx` as Task 708/709's plants were, because the kickoff places the
  `.tsx` file out of scope for this task. The plant genuinely reproduces the same failure mode (Search button
  fails to wrap to row 2 in the 640–767 band) via the module's own `flex-basis`, and reverts to a byte-identical
  state (confirmed both by the AC8-style diff and the 40/40 post-revert md5 match).
- **Deviation:** `check:design-tokens` (§9.1) — reported, not fixed; fixing those 4 unrelated files' remaining
  state (already at 0, not caused by me) would be out of scope regardless.
- No mutating git command was run, suggested, or emitted, per the executor git boundary.
- The one `LocationComboboxSubPanel` flake (§6/§9.2) did not recur in either of the two subsequent full-matrix
  runs this session (I4 plant, I4 revert-confirm both report 0 unrelated FAILs), consistent with a transient
  capture flake rather than a persistent regression.

---

## 11. Opus handoff — evidence locations and questions

**Evidence root:** `.screenshots/task709R-evidence/` (local-only, D6). Named run directories created this
session: `.screenshots/rendered-assert/2026-08-05T10-27/` (I3), `.screenshots/rendered-assert/2026-08-05T11-01/`
(I4 planted), `.screenshots/rendered-assert/2026-08-05T11-33/` (I4 revert-confirm). No existing baseline
directory (including `T06-34`) was overwritten.

**Questions/risks for review:**

1. Please independently re-verify the A1 pipeline result (§4) and the 6-property computed-style diff (§5) — the
   core mechanism claim (`@layer` unconditionally loses to unlayered CSS) is spec-guaranteed but was previously
   asserted with a wrong specificity argument in the Task 709 session log (now corrected, §1/§9).
2. **`check:design-tokens` = 0, not 23** (§9.1) — please confirm the attribution to commit `50c40c2f8` and decide
   whether the kickoff's §3.5/R11/AC11 baseline needs a retroactive correction note, since it's now stale through
   no action of this task.
3. Confirm the AC5 plant-on-module-CSS deviation (§10) is an acceptable substitute for a plant on `.tsx`, given
   the kickoff placed `.tsx` out of scope.

## 12. Backlog update

`docs/backlog.md` updated: "Last Session" header/bullets rewritten for 709-R (concise state only, no history),
and the 709 registry row split into a closed `709` row + new `709-R` row reflecting `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`. **`BACKLOG LIMIT BREACH`:** the file is now **108** physical lines (was 107, target ~80)
— a net **+1** line, from the unavoidable split of the 709 registry row into two (709 closed, 709-R open); the
"Last Session" section itself was held flat (4 lines → 2 lines, offsetting most of the growth). Flagged for
Opus to validate and consolidate, per `docs/agent-contract.md` clause 10.
