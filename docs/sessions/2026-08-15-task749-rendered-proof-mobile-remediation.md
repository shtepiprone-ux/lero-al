# Task 749 — Rendered-proof mobile remediation (AdminUsersTable, HeroSearch, NotificationBellView)

**Task path:** `tasks/Sprints/Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md`
**Contract:** `tasks/Sprints/Sprint_58_Task_749_execution_contract.md`
**Ledger:** `tasks/Sprints/Sprint_58_Task_749_rule_compliance_ledger.md`
**Revision 1:** `tasks/Sprints/Sprint_58_Task_749_revision_1_AdminUsersTable_ScrollArea.md` — see §12 below.
**Revision 2:** `tasks/Sprints/Sprint_58_Task_749_revision_2_GeometryScrollAwareness.md` (+ its evidence preflight)
— see §13 below.
**Historical executor status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 2) — `0 FAIL` reached,
all plants confirmed and gates green. **Never self-approved.**
**Current review outcome (2026-08-16):** `APPROVED WITH NOTES` — review ledger 9/9 `VERIFIED`, no open
P0/P1/P2 and `commitPush: ALLOWED`; PR #8 is committed and awaits merge. Revision 3 closed F4/F5 with tracked,
re-derivable evidence. P3 findings F1–F3 remain follow-up work only.

---

## 1. Summary

Two of the three product fixes (HeroSearch three-band collapse, NotificationCenter 390→640 threshold move) were
implemented exactly per kickoff §6.B/§6.C and verified clean: gate-green, md5-identical outside their authorized
target cells, all named tests/critical-flow rows pass. The third fix (AdminUsersTable tab-wrap, kickoff §6.A),
implemented **exactly as the kickoff's code snippet specifies**, causes an unauthorized side effect: the
`Tabs.List` container's own shrink-to-fit width shrinks at every viewport, not only mobile-320, producing new
2-line wrapping regressions at desktop-1024 (all 4 locales) and mobile-375/mobile-390 (sq/uk) that the kickoff's
AC2 explicitly forbids ("Any md5 change outside mobile-320 is a regression: stop and report, do not absorb").

Separately, C2's mandatory token deletion (required by D-2/R8/AC8's first clause) breaks a hardcoded assertion in
`scripts/__tests__/css-var-resolvability.test.ts:205` (`expect(owned.size).toBe(257)`), which reads the real
`src/app/globals.css` (not a synthetic fixture) and is explicitly out-of-scope/zero-diff per kickoff §4 and AC8's
second clause. The real count is now 256. AC8's two clauses are mutually unsatisfiable as written.

Per the kickoff's own handoff instruction (§14: "If any of them turns out to be unsatisfiable as written, stop and
report BLOCKED with the measurement that makes it unsatisfiable; do not substitute a different route") and the
executor protocol's contradiction-reporting requirement, this session stops here rather than inventing an
alternate CSS mechanism for 6.A or editing the out-of-scope test file.

---

## 2. Requirement ledger — evidence

| ID | Requirement | Evidence | Status |
|---|---|---|---|
| R1/AC1 | AdminUsersTable sq/uk mobile-320 pass | Manifest: `noHorizontalOverflow:true`, `visualIntegrity.violations:[]` for all 4 locales at mobile-320 | ✅ met at the gate level |
| R1/AC2 | AdminUsersTable byte-identical outside mobile-320 | md5 table below — **NOT met**: diffs at desktop-1024 (×4 locales) + mobile-375/390 (sq/uk) | ❌ **BLOCKED** |
| R2/AC3 | HeroSearch 12 cells: `fullWidthButtonsAtMobile:true`, no `failingButtonLabels` | Manifest AFTER run | ✅ |
| R3/AC4 | Filters trigger: label + icon + badge + ≥44px at <640 | Visual inspection of AFTER screenshots (see §6); DOM-level probe not separately captured (see §8 limitations) | ✅ (visual), ⚠️ (no separate computed-style transcript) |
| R4/AC5 | HeroSearch band-700 + desktop-1024 byte-identical; Fallback all cells byte-identical | md5 table below — **met**, exactly as required | ✅ |
| R5/AC5 | `>=860` byte-identical | Same table | ✅ |
| R6/AC6 | NotificationBellView 4 cells: `fullWidthButtonsAtMobile:true` | Manifest AFTER run | ✅ |
| R7/AC7 | Threshold at 640, not 390 | md5 table + before/after screenshots consistent with the code change | ✅ |
| R8/AC8 | `notification-compact` absent from `src/`; zero diff on `css-var-resolvability.test.ts` | grep = 0 matches (met); test file has zero diff (met) BUT the test itself now fails because its hardcoded assertion assumed the token's continued existence | ⚠️ **contradiction** — see §5 |
| R9/AC9 | `iconOnlyAbove` additive; `npm run test` exits 0 | New MantineCountButton cases pass (16/16); **`npm run test` overall exits 1** due to R8's contradiction | ❌ blocked by R8 |
| R10/AC10 | Gate/workflow zero-diff | `git status --porcelain` confirms neither path touched | ✅ |
| R11/AC11 | `screenshots:assert --mantine-only` → 0 FAIL, exit 0 | AFTER run: `1182/1204 PASS, 0 FAIL, 22 AMBIGUOUS`, exit 0 | ✅ at the gate level (does not detect the AC2 regression) |
| R12/AC12 | Ambiguous set unchanged, 22 | Before/after ambiguous lists identical (Combobox×4, PopularLocationsView×12, Tabs×2) | ✅ |
| R13/AC13 | Two-armed plants | **Not executed** — stopped after discovering the R1/AC2 defect; see §8 | ⚠️ not run |
| R14/AC14 | `npm run build` exit 0 | Exit 0, transcript retained | ✅ |
| R15/AC15 | Critical-flow rows 33/45/50 | All three exit 0 (row 33: 3/3, row 45: 21/21, row 50: 41/41) | ✅ |

---

## 3. Current vs required behavior

**HeroSearch and NotificationBellView:** required after-behavior delivered exactly as specified (three-band
collapse with visible label/icon/badge/44px floor at <640; 640-859 icon-only byte-identical; >=860 byte-identical;
NotificationCenter threshold moved 390→640). No negative-flow regressions found (zero/empty states, SSR, long
translations all unaffected per the clean md5 tables).

**AdminUsersTable:** required behavior was "wrap to 2 lines at mobile-320 only, byte-identical elsewhere." Actual
behavior: the `Tabs.List` container itself narrows at every viewport once `minWidth:0` is applied to its children
alongside `whiteSpace:'normal'`, because Chromium's shrink-to-fit intrinsic-width calculation for the flex
container appears to use a smaller (content-shrinkable) contribution once the children's `min-width:auto` clamp is
removed, rather than the sum of the labels' full (max-content) widths. This produces new 2-line wraps well beyond
mobile-320 — confirmed directly by screenshot inspection (see §6), not inferred from md5 alone.

---

## 4. Files changed

| Path | Reason |
|---|---|
| `src/components/admin/AdminUsersTable.tsx` | Added `styles={{ tab: { whiteSpace: 'normal', minWidth: 0 } }}` to `<Tabs>` per kickoff §6.A (defect found, see §5/§6) |
| `src/design-system/mantine/patterns/MantineCountButton.tsx` | Added `iconOnlyAbove` prop and narrowed the existing `useMediaQuery` into one range query per kickoff §6.B1 |
| `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` | Added 3 new test cases proving `iconOnlyAbove` additivity per AC9 |
| `src/components/shared/HeroSearchView.tsx` | Added `iconOnlyAbove={640}` per kickoff §6.B2 |
| `src/components/shared/HeroSearchView.module.css` | `.filtersControl` gains base full-width + `var(--space-11)` floor, reset at 40rem per kickoff §6.B3 |
| `src/modules/notifications/components/NotificationCenter.tsx` | `notification-compact:` → `sm:` on both sites, comment updated to record D-2, per kickoff §6.C1 |
| `src/app/globals.css` | Removed the `--breakpoint-notification-compact` `@theme` block + its comment per kickoff §6.C2 (triggers the R8/AC8 contradiction, see §5) |

`docs/backlog.md` and this session log are the only other writes (§4 item 8). No path outside the kickoff's
allowed write set was touched — confirmed by `git status --porcelain`.

`git hash-object` (post-edit):
```
src/components/admin/AdminUsersTable.tsx                                        61e4b1da86e8aeabb69bdb863e8167f47f3b5fe5
src/design-system/mantine/patterns/MantineCountButton.tsx                       4ccea4764838695db35216170bfc702deb4474f8
src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx  7d622c328491cc912f5fd369675bd42c7d830f92
src/components/shared/HeroSearchView.tsx                                        6e482e9f50ef76de3b5780d56061f37cf058ccea
src/components/shared/HeroSearchView.module.css                                 d0b9f79e74a90f8f156def8e889cd3ccde38bc35
src/modules/notifications/components/NotificationCenter.tsx                     198fdffddd0db72c615f3f8ab7d92dfa15e0c0b1
src/app/globals.css                                                             5c9b368e780ef2c0d22aa0a3a8b2e51d8a08d231
```

---

## 5. Two blocking contradictions

### 5.1 AdminUsersTable's exact specified fix has an unauthorized side effect (blocks AC2)

The kickoff's §6.A code — `styles={{ tab: { whiteSpace: 'normal', minWidth: 0 } }}` on `<Tabs>` — was implemented
verbatim, no deviation. `screenshots:assert` reports 0 FAIL because it only checks `noHorizontalOverflow` and
`visualIntegrity` (which a 2-line wrap satisfies), not visual-identity outside the target cell. AC2's separate
md5 comparison (required by the task, not by the automated gate) catches the regression the gate cannot see:

| Cell | Before/after md5 | Result |
|---|---|---|
| en / desktop-1024 | `ccf6e46…` → `7032388…` | **DIFF — unauthorized** |
| en / mobile-320 | (fix target) | DIFF — expected |
| en / mobile-375, mobile-390 | identical | SAME — OK |
| it / desktop-1024 | `ff3c017…` → `4a80d47…` | **DIFF — unauthorized** |
| it / mobile-320 | (fix target) | DIFF — expected |
| it / mobile-375, mobile-390 | identical | SAME — OK |
| sq / desktop-1024, mobile-375, mobile-390 | all differ | **DIFF — unauthorized** |
| sq / mobile-320 | (fix target) | DIFF — expected |
| uk / desktop-1024, mobile-375, mobile-390 | all differ | **DIFF — unauthorized** |
| uk / mobile-320 | (fix target) | DIFF — expected |

Only `en`/`it` at `mobile-375`/`mobile-390` stayed byte-identical (4 of 12 non-target cells). The other 8
non-target cells all regressed. This is a genuine, reproducible defect in the exact mechanism the kickoff
specified, confirmed by direct visual inspection (§6), not a plant/measurement artifact.

Per the kickoff's own instruction, this session does **not** substitute an alternate CSS mechanism (e.g. a
`.module.css`, explicit width instead of `minWidth:0`, or a different Mantine styles-API shape) without owner
authorization, since kickoff §6.A explicitly names and forbids several alternate routes and the task contract
(§14) requires stopping and reporting rather than rerouting.

### 5.2 R8/AC8 self-contradiction: token deletion vs. zero-diff test file

`scripts/__tests__/css-var-resolvability.test.ts` is named out-of-scope/zero-diff in kickoff §4, with the stated
reason limited to its `--breakpoint-notification-compact` **string literal** at `:170`/`:185`, inside a synthetic
CSS fixture that "never reads `globals.css`." That reasoning is correct for those two lines. It does not cover a
third, separate test in the same file (`:198-213`) that **does** read the real `src/app/globals.css` and hardcodes
`expect(owned.size).toBe(257)`. Deleting the `--breakpoint-notification-compact` `@theme` declaration (mandatory
per D-2/R8/AC8's first clause and confirmed correct by `check:css-vars`, which self-reports the new owned count as
256 with 0 violations) necessarily drops this real, measured count from 257 to 256, failing the hardcoded
assertion. AC8 requires both "0 matches" (satisfied only by deleting the token) and "zero diff on this test file"
(satisfied only by leaving the now-256-vs-257 assertion unedited) — these cannot both hold simultaneously once the
real count changes. This session left the token deleted (matching D-2/R8/AC8's first clause and the census
requirements in the execution contract's checkpoint 5/6) and did not edit the test file (matching the explicit
out-of-scope instruction), so the test fails as evidence of the contradiction rather than being silently patched
around.

```
FAIL  scripts/__tests__/css-var-resolvability.test.ts > extractOwnedNames (R3, A2) — scoped to @theme / @theme inline / :root
  > matches the real globals.css measured count (257) — Task 695 re-derivation
AssertionError: expected 256 to be 257
```

---

## 6. Visual evidence (AdminUsersTable regression)

Screenshots compared: `.screenshots/rendered-assert/2026-08-15T12-42/` (BEFORE, true pre-edit tree) vs.
`.screenshots/rendered-assert/2026-08-15T13-14/` (AFTER, full implementation).

- `admin-adminuserstable--default__en__desktop-1024.png`: BEFORE shows both tabs on one line each (`All users`,
  `✓ Verified agents`) inside a compact (~230px) strip. AFTER shows the SAME strip narrower, with `✓ Verified
  agents` now wrapped to two lines — at 1024px viewport width, where there is no shortage of page space.
- `admin-adminuserstable--default__sq__mobile-375.png`: BEFORE shows `✓ Agjentë të verifikuar` on one line.
  AFTER shows it wrapped to two lines, at a width the kickoff explicitly requires to stay byte-identical.

Mechanism (not directly instrumented, inferred from the consistent pattern across all 16 cells): `Tabs.List`'s own
width is shrink-to-fit (not stretched by the parent `Stack`), so its preferred width is normally the sum of both
tabs' max-content (single-line) label widths. Adding `min-width:0` to the flex children, combined with
`white-space:normal`, appears to let the browser's flex-container auto-sizing algorithm use a smaller
(content-shrinkable) per-item contribution when computing the container's own preferred width — shrinking the
whole strip even at viewports where nothing needed to shrink, and causing the (now narrower) 50/50 split to no
longer fit the longer label on one line.

---

## 7. Validation evidence — commands and actual results

The original scratchpad evidence path was gitignored and retained nothing. Durable Revision 3 evidence is under
`docs/reviews/artifacts/2026-08-15-task749/`; a subset material to the manifest/md5 claims is also reproducible
from `.screenshots/rendered-assert/2026-08-15T12-42/` (BEFORE) and
`.screenshots/rendered-assert/2026-08-15T13-14/` (AFTER).

| Command | Result | Notes |
|---|---|---|
| `git status --porcelain` (baseline) | 2 known untracked fixture logs only | Checkpoint 0 |
| `npm run build-storybook` (BEFORE) | exit 0 | |
| `npm run screenshots:assert -- --mantine-only` (BEFORE, true pre-edit tree) | exit 1, `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` | Fail set identical to kickoff §3.1 |
| `npx vitest run` MantineCountButton smoke (post-6.A/B) | exit 0, 16/16 | |
| `npm run typecheck` | exit 0 | |
| `npm run lint` | exit 0, 0 errors (63 pre-existing warnings) | |
| `npm run test` (full suite) | **exit 1** — 1 failed / 1355 total; the 1 failure is §5.2's contradiction; all 1354 others pass incl. every new/touched-file test | |
| `npm run check:hydration` | exit 1 — all 7 routes SKIP, no dev server running (`net::ERR_CONNECTION_REFUSED`) | Infra requirement not met in this session; not evidence of a defect |
| `npx vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx` (registry row 33) | exit 0, 3/3 | AC15 |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (row 45) | exit 0, 21/21 | AC15 |
| Row 50 full command set (4 suites) | exit 0, 41/41 | `heroSearch.smoke.test.tsx:47` unchanged, confirms `iconOnlyAbove` additive |
| `npm run build-storybook` (AFTER) | exit 0 | |
| `npm run screenshots:assert -- --mantine-only` (AFTER) | exit 0, `1182/1204 PASS, 0 FAIL, 22 AMBIGUOUS` | R11/AC11 satisfied at the gate level; does not detect §5.1 |
| `npm run check:assertion-liveness` | exit 0, 5 LIVE / 0 DEAD / 0 STALE / 0 ORPHAN | |
| `npm run check:story-coverage` | exit 0, 15/15 covered | |
| `npm run check:design-tokens` | exit 0, 0 violations | Confirms `var(--space-11)` used, no raw literal |
| `npm run check:css-vars` (post-build) | exit 0, 0 violations; self-reports owned count **256** | Confirms C2's deletion is correct per this gate's own live logic |
| `npm run check:mojibake` | exit 0, 0 artifacts / 2812 files | |
| `npm run check:i18n` | exit 0, 2218/2218/2218/2218 parity | |
| `npm run check:locale-leak:mantine-only` | exit 1, 13 leaks, all in `Admin/AdminUsersTable/Default` (company/agent names, `Online`/`Moderator`/`Administrator` labels) | **Pre-existing, out of this task's scope** — none of the leaked strings are in this task's diff (only `Tabs` `styles` prop touched); kickoff §3.3.A explicitly names these as Task 736 territory, not 749's |
| `npm run build` | exit 0 | AC14 |
| `grep -rn "notification-compact" src/` | 0 matches | AC8 first clause |
| `git status --porcelain` (final) | exactly the 7 in-scope files + 2 pre-existing untracked logs | AC10 |

BEFORE/AFTER manifests: `.screenshots/rendered-assert/2026-08-15T12-42/manifest.json` (BEFORE),
`.screenshots/rendered-assert/2026-08-15T13-14/manifest.json` (AFTER).

### AC2 md5 table — AdminUsersTable (see §5.1 for the full table and interpretation)

### AC5 md5 table — HeroSearch/Default, HeroSearch/Fallback, NotificationBellView/Default

- `HeroSearch/Default`: `band-700` and `desktop-1024` **SAME** for all 4 locales (8/8 identical). `mobile-320/375/390`
  **DIFF** for all 4 locales (12/12 — all authorized target cells).
- `HeroSearch/Fallback`: **SAME** for all 4 locales × all 5 viewports (20/20 identical) — confirms the Fallback
  component (a bare `Skeleton`, no `Button`) is untouched.
- `NotificationBellView/Default`: `desktop-1024`, `mobile-320`, `mobile-375` **SAME** for all 4 locales (12/12).
  `mobile-390` **DIFF** for all 4 locales (4/4 — exactly the authorized target cells, matching kickoff §3.1).

These two fixes are clean: every non-target cell is byte-identical, exactly as AC5/AC7 require.

---

## 8. Implementation validation notes, deviations, limitations

- **Two-armed plants (§9 of the kickoff, R13/AC13) were not executed.** Work stopped after discovering §5.1's
  defect, since re-verifying a fix mechanism known to have an unauthorized side effect has low value before the
  route itself is reconsidered. P2a/P2b/P3a/P3b (HeroSearch/NotificationCenter) were not run either, though those
  two fixes are otherwise fully evidenced via the clean md5 tables and the manifest before/after diff.
- **AC4's DOM/computed-style probe was not captured as a separate Playwright transcript.** The required properties
  (visible label, `SlidersHorizontal` icon, `Badge` in right section, `>=44px` height, `>=parentContentWidth-8`
  width) are consistent with the AFTER screenshots and the `.filtersControl` CSS as written, but a dedicated
  `getComputedStyle` capture at 320/375/390 × 4 locales was not produced as its own artifact.
- **`npm run check:hydration` could not run** — it requires a live `next dev`/`next start` server, which was not
  started this session; all 7 routes reported `SKIP`, not `PASS`/`FAIL`. This is an unmet evidence requirement
  under the Q3 profile's listed evidence, distinct from the two blocking contradictions.
- **`npm run check:locale-leak:mantine-only` exits 1**, but all 13 findings are in `AdminUsersTable`'s fixture/label
  content this task's diff never touches (only the `Tabs` `styles` prop changed) and are explicitly named in the
  kickoff (§3.3.A) as Task 736's territory, not 749's. Treated as pre-existing, not a regression, but the command
  itself did not exit 0 as the evidence table in kickoff §10 lists it.
- **A checkpoint-ordering gap was corrected mid-session**: the true BEFORE gate run (checkpoint 1) was not captured
  before editing began. This was recovered without any mutating git command — the 7 touched files' original `HEAD`
  content was captured via read-only `git show` and written back via the Write tool (not `git checkout`/`stash`,
  both owner-only), the BEFORE gate was run and confirmed to match kickoff §3.1 exactly, then the implementation
  was restored from a scratchpad backup before the AFTER run. No git mutating command was used at any point.
- Two pre-existing documentation findings, per kickoff §13, still handed to the reviewer and not fixed here:
  (i) `check-stories-rendered.mjs:1226-1229`'s comment is wrong — a collapsed `MantineCountButton` does render a
  (empty) `.mantine-Button-label`, per `@mantine/core/esm/components/Button/Button.mjs:128`; (ii)
  `docs/storybook-governance.md:1842` incorrectly records Task 724's `NotificationCenter.tsx` retarget as landed —
  `git log --all` on that file ends at `50c40c2f8`, before either 724 or 724R touched it.

---

## 9. Assumptions

- The AC2/AC5 md5 comparisons were computed directly from the two `.screenshots/rendered-assert/` run directories
  (`2026-08-15T12-42` BEFORE, `2026-08-15T13-14` AFTER) rather than a separately-scripted comparator, since no
  dedicated comparator script was named by the kickoff for this purpose.
- The BEFORE run's 18-FAIL / 1164-PASS / 22-AMBIGUOUS result, and its cell-for-cell match to kickoff §3.1, is
  treated as sufficient confirmation that the recovered pre-edit tree state was correct (no drift from the
  kickoff's own 2026-08-15T05-29 baseline).

---

## 10. Opus handoff

Two questions for the orchestrator:

1. **AdminUsersTable route.** Kickoff §6.A's exact specified mechanism (`styles={{tab:{whiteSpace:'normal',
   minWidth:0}}}`) has a real, reproducible side effect outside its authorized scope (§5.1). Does the owner want a
   different CSS mechanism authorized for the 50/50 tab-wrap fix (e.g., an explicit `flexBasis: '50%'` on each tab
   instead of relying on `minWidth:0` + intrinsic shrink-to-fit sizing — not implemented or verified this session,
   offered only as a starting hypothesis for the next attempt), or does the owner want to accept the desktop-1024/
   mobile-375/390 wrapping as intentional and update AC2 accordingly?
2. **`css-var-resolvability.test.ts`'s hardcoded count.** Since this file is named zero-diff/out-of-scope by the
   kickoff, but the deletion its own C2 mandates breaks a test the kickoff's zero-diff reasoning didn't anticipate,
   does the owner want to (a) authorize a one-line update to that test's hardcoded `257` → `256` as an
   in-scope exception, or (b) treat this as a defect in the kickoff's scope definition to correct before
   re-execution?

---

## 11. Backlog update

`docs/backlog.md` updated: Last Session header replaced (749, `BLOCKED`) and the task-749 registry row rewritten
to the current blocked state, both in place — physical line count **unchanged at 82** (no growth; the file was
already at 82 lines before this session's edit, above the ~80-line guideline, but this session did not enlarge
it). No `BACKLOG LIMIT BREACH` newly introduced by this edit, but the file remains at the edge of the guideline
and may warrant Opus consolidation independent of this task.

---

## Final status (original round): `BLOCKED`

Two contradictions require an owner/orchestrator decision before this task can proceed to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`: the AdminUsersTable fix mechanism specified in kickoff §6.A has an
unauthorized visual side effect outside mobile-320 (§5.1), and R8/AC8's two clauses are mutually unsatisfiable
against the current `css-var-resolvability.test.ts` (§5.2). HeroSearch and NotificationBellView fixes are complete,
clean, and fully evidenced; they are not blocked, but AC10/R10's "zero diff outside the write set" plus the shared
`npm run test` gate mean the task as a whole cannot be reported `IMPLEMENTED` while either contradiction stands.

---

## 12. Revision 1 — `Sprint_58_Task_749_revision_1_AdminUsersTable_ScrollArea.md`

The orchestrator upheld both original findings (O-1 = my §5.1, O-2 = my §5.2), filed this revision, and gave three
new owner decisions: **D-5** fix AdminUsersTable with `ScrollArea` (the mechanism `theme.ts:830-831` and
`Tabs.stories.tsx:36` already prescribe) · **D-6** the canonical story shape (full-width track removed, `grow`
dropped) · **D-7** update the `css-var-resolvability.test.ts` hardcoded count `257 -> 256`.

### 12.1 Revision A — AdminUsersTable via ScrollArea

**A1 (restore).** `src/components/admin/AdminUsersTable.tsx` was restored to `HEAD` **without** `git checkout`
(owner-only per `CLAUDE.md`'s git policy) — the one-line diff introduced by the original round
(`styles={{tab:{whiteSpace:'normal',minWidth:0}}}`) was reverted directly with the Edit tool. Verified
byte-identical: `git hash-object` = `147239a7ad98bd104d0d532665e35b2cc8ec73f3`, matching the revision's stated
`147239a7a` blob exactly.

**A2-A4 applied verbatim** — `Tabs.List` wrapped in `<ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>`
matching `Tabs.stories.tsx:36` exactly, `grow` removed from `Tabs.List`, comment at `:421` replaced per §5 A3's
required wording. `git diff`:

```diff
-      {/* Tabs — full-width on mobile via Tabs.List grow */}
+      {/* Tabs — content-width pill strip inside a horizontal ScrollArea (theme.ts:830), matching
+          Tabs.stories.tsx:36. `grow` removed (Task 749 rev.1, D-6): it was already inert (each tab
+          is pinned at max-content by `min-width: auto`), and under a full-width track it would
+          stretch each tab to ~50% of the strip, a design change nobody asked for. */}
       <Tabs …>
-        <Tabs.List grow>
-          <Tabs.Tab value="all">{t('tab_all')}</Tabs.Tab>
-          <Tabs.Tab value="verified">{t('tab_verified')}</Tabs.Tab>
-        </Tabs.List>
+        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
+          <Tabs.List>
+            <Tabs.Tab value="all">{t('tab_all')}</Tabs.Tab>
+            <Tabs.Tab value="verified">{t('tab_verified')}</Tabs.Tab>
+          </Tabs.List>
+        </ScrollArea>
       </Tabs>
```

No other line in the file changed. `ScrollArea` was already imported (`:10`).

### 12.2 Checkpoint R1 — the mandatory classification gate

`npm run build-storybook` (exit 0) then `npm run screenshots:assert -- --mantine-only`
(`.screenshots/rendered-assert/2026-08-15T14-47/manifest.json`, exit 0 as a process, but the run itself is
non-passing):

```
Results: 1179/1204 PASS, 3 FAIL, 22 AMBIGUOUS (needs-owner-decision)
  text-clipped: 3
```

**Verbatim `assertions.visualIntegrity` payload, `Admin/AdminUsersTable/Default`, every `sq`/`uk` cell:**

```
sq × mobile-320  pass:false  violations:[
  {failReason:"text-clipped", selector:"#mantine-v4316xm2s-tab-all",
   label:"Të gjithë përdoruesit", details:"scrollWidth=349, clientWidth=288, text=\"Të gjithë përdoruesit\""},
  {failReason:"text-clipped", selector:"#mantine-v4316xm2s-tab-verified",
   label:"✓ Agjentë të verifikuar", details:"scrollWidth=349, clientWidth=288, text=\"✓ Agjentë të verifikuar\""}
]  ambiguous:[
  {failReason:"ambiguous-offscreen", selector:"#mantine-v4316xm2s-tab-verified",
   label:"✓ Agjentë të verifikuar", details:"right=360, viewportWidth=320, has overflow-x:auto|scroll ancestor",
   reason:"element reachable by horizontal scrolling (carousel/scroll-tabs)"}
]

sq × mobile-375  pass:false  violations:[
  {failReason:"text-clipped", selector:"#mantine-s9j67jlpx-tab-all",
   label:"Të gjithë përdoruesit", details:"scrollWidth=349, clientWidth=343, text=\"Të gjithë përdoruesit\""},
  {failReason:"text-clipped", selector:"#mantine-s9j67jlpx-tab-verified",
   label:"✓ Agjentë të verifikuar", details:"scrollWidth=349, clientWidth=343, text=\"✓ Agjentë të verifikuar\""}
]  ambiguous:[]

sq × mobile-390  pass:true   violations:[]  ambiguous:[]
sq × desktop-1024 pass:true  violations:[]  ambiguous:[]

uk × mobile-320  pass:false  violations:[
  {failReason:"text-clipped", selector:"#mantine-njh82gfn2-tab-all",
   label:"Всі користувачі", details:"scrollWidth=328, clientWidth=288, text=\"Всі користувачі\""},
  {failReason:"text-clipped", selector:"#mantine-njh82gfn2-tab-verified",
   label:"✓ Верифіковані агенти", details:"scrollWidth=328, clientWidth=288, text=\"✓ Верифіковані агенти\""}
]  ambiguous:[
  {failReason:"ambiguous-offscreen", selector:"#mantine-njh82gfn2-tab-verified",
   label:"✓ Верифіковані агенти", details:"right=339, viewportWidth=320, has overflow-x:auto|scroll ancestor",
   reason:"element reachable by horizontal scrolling (carousel/scroll-tabs)"}
]

uk × mobile-375  pass:true   violations:[]  ambiguous:[]
uk × mobile-390  pass:true   violations:[]  ambiguous:[]
uk × desktop-1024 pass:true  violations:[]  ambiguous:[]
```

**Classification per §6's table: row 3 — "any `violations` entry" — fired.** Per the revision's explicit
instruction: *"STOP. Report `BLOCKED` with the payload. Do not add a gate exemption, do not switch mechanism, do
not touch `geometry-integrity.mjs`."* This session stops here. `geometry-integrity.mjs` was read (to identify
which check fired, see below) but not edited — `git status --porcelain` confirms zero diff on it.

**What actually fired, for the reviewer's next attempt.** Neither trap named in §6 is the literal mechanism —
`Trap 1` is confirmed **working as designed** (the `ambiguous-offscreen` entries at mobile-320 show
`"has overflow-x:auto|scroll ancestor"`, proving `hasHorizontalScrollAncestor` correctly recognizes the
`ScrollArea` viewport). `Trap 2` (`outside-container`) did **not** fire at all. What fired instead is **Check 1,
`text-clipped`** (`geometry-integrity.mjs:338-376`, not discussed in the revision's §6) — a third, independent
check that walks up to the nearest ancestor with `overflow: hidden|clip`, and hard-fails if that ancestor's
`scrollWidth > clientWidth`. Like Check 3, **Check 1 has no scroll-aware downgrade at all** — it does not consult
`hasHorizontalScrollAncestor`. The measured `clientWidth` values (288 @320, 343 @375) match the story's own
content-box widths, and `scrollWidth` (349 sq, 328 uk) matches the unwrapped two-tab natural width — consistent
with `ScrollArea`'s own root computing `overflow: hidden` (as §6 Trap 2 already predicted for a *different* check)
and Check 1 finding that ancestor first, before Check 3 or Check 2 would have had a chance to apply their own
(partial or absent) scroll-awareness. This is the same failure *family* the revision named — an unscoped hard
check blind to a legitimate horizontal-scroll container — just triggered by a third check the revision's own
trap analysis did not enumerate.

Also newly measured, not anticipated by the revision brief: **`sq × mobile-375` now fails too** (2 cells), a third
locale/viewport combination beyond the two `mobile-320` cells §6's table discusses. The `mobile-320` failures
happen at **both** locales the original kickoff named (sq, uk); `mobile-375` only regresses for `sq` (uk's
shorter label still clips: `scrollWidth=328` vs `clientWidth=343` at 375 — wait, 328 < 343, so `uk × mobile-375`
correctly stays `pass:true`; only `sq`'s 349 > 343 clips at 375). No other story or cell in the 1204-cell matrix
changed — the fail set is exactly `{sq,uk}×mobile-320` + `{sq}×mobile-375`, 3 cells outside the pre-existing 22
`AMBIGUOUS`, everything else in the run matches the prior AFTER manifest.

### 12.3 Revision B — not attempted

Per `Sprint_58_Task_749_revision_1_AdminUsersTable_ScrollArea.md` §10's exact command ordering (`… apply §5 A2–A4,
then STOP at checkpoint R1 … npm run screenshots:assert … # checkpoint R1 — classify per §6 before continuing …
then §7, then …`), Revision B (`css-var-resolvability.test.ts`'s `257 -> 256` edit) is gated behind a
continue-classification at checkpoint R1. Since R1 classified STOP, Revision B was not applied this session, even
though it is an independent, low-risk, fully-specified one-line change unrelated to O-1. `git status --porcelain`
confirms `scripts/__tests__/css-var-resolvability.test.ts` carries zero diff.

### 12.4 Files changed (revision 1)

| Path | Reason |
|---|---|
| `src/components/admin/AdminUsersTable.tsx` | A1 restore to `HEAD` (via `git show`+Edit, not `git checkout`) then A2-A4 `ScrollArea` wrap + `grow` removal, per revision §5 |

No other in-scope file was touched this round. `docs/backlog.md` and this session log are the only other writes.

### 12.5 Validation evidence (revision 1)

| Command | Result |
|---|---|
| `git hash-object src/components/admin/AdminUsersTable.tsx` (post-A1, pre-A2) | `147239a7ad98bd104d0d532665e35b2cc8ec73f3` — matches HEAD exactly |
| `npm run build-storybook` (post A2-A4) | exit 0 |
| `npm run screenshots:assert -- --mantine-only` (checkpoint R1) | exit 0 as a process; `1179/1204 PASS, 3 FAIL, 22 AMBIGUOUS` — **classifies as STOP**, see §12.2 |
| `git status --porcelain` (final, this round) | `src/components/admin/AdminUsersTable.tsx` modified (A2-A4 only) + the original round's other 6 in-scope files + `docs/backlog.md` + 2 session/task docs + 2 pre-existing untracked logs — no path outside the allowed write set |

No further command from revision §10 was run (typecheck/lint/test/build/critical-flow row 45/check:css-vars),
since they are downstream of a continue-classification at checkpoint R1 that did not occur. Plants P1a-R/P1b-R
were not run for the same reason — they test the ScrollArea mechanism's `ambiguous-offscreen` downgrade, which is
moot while the mechanism itself hard-fails via a different check.

### 12.6 Final status (revision 1): `BLOCKED`

Checkpoint R1 fired the revision's own mandatory STOP condition. The `ScrollArea` mechanism is the theme's
prescribed answer to the strip-level "should this scroll" question, and it does correctly satisfy that question
(`Trap 1` confirmed working) — but a distinct, unscoped-for-scroll-containers check (`text-clipped`, Check 1)
still hard-fails on the same `ScrollArea` root's `overflow:hidden` computation, for 3 cells: `{sq,uk}×mobile-320`
and `{sq}×mobile-375`. This is a finding about `geometry-integrity.mjs`'s check coverage (same family as reserved
Task 738), not a defect in the applied edit, and per the revision's explicit instruction requires an owner
decision before any further mechanism change, gate edit, or exemption. Revision B
(`css-var-resolvability.test.ts`) was not attempted, gated behind R1 by the revision's own command ordering.
HeroSearch and NotificationBellView remain complete and unaffected by this round (untouched, per §12.4).

---

## 13. Revision 2 — `Sprint_58_Task_749_revision_2_GeometryScrollAwareness.md`

Filed after a completed evidence preflight (`…_revision_2_evidence_preflight.md`) that named three orchestrator
defects (O-1/O-2/O-3) behind the two blocked rounds, and owner decision **D-8** (*"Виправити гейт у 749"*,
2026-08-15) authorizing a diff to `geometry-integrity.mjs` and `check-stories-rendered.mjs`, amending Sprint 58
exit criterion 3.

### 13.1 The edit — §4.1–§4.5 applied verbatim

**§4.1** — extracted a shared `isHorizontalScrollContainer(node)` predicate in `geometry-integrity.mjs`, used by
`hasHorizontalScrollAncestor` (Check 2, unchanged behavior) and the two new call sites below.

**§4.2 (Check 1, `text-clipped`)** — added a third arm, after the existing ellipsis arm: when the clipping
ancestor being examined by the walk is itself a horizontal-scroll container, downgrade to
`ambiguous-text-clipped-scrollable` instead of a hard violation.

**§4.3 (Check 3, `outside-container`)** — added `horizScroller = isHorizontalScrollContainer(clipParent)`; when
true, `escapeRight`/`escapeLeft` no longer contribute to the hard violation (`escapeBottom`/`escapeTop` still do,
unconditionally); a horizontal-only escape inside a scroller now pushes `ambiguous-outside-scrollable` instead of
being silently dropped.

**§4.4** — retired the Task 529 `GEOMETRY_ALLOWLIST` entry for `mantine-primitives-tabs--default` /
`text-clipped` in `check-stories-rendered.mjs`, replacing it with a comment recording the retirement and pointing
to this session log.

**§4.5 (Revision 1 §7, still pending until now)** — landed:
`scripts/__tests__/css-var-resolvability.test.ts`'s `expect(owned.size).toBe(257)` → `toBe(256)`, with the
required verbatim comment (`257 -> 256 (Task 749): --breakpoint-notification-compact deleted with its last
consumer …`). Only the assertion value and its comment changed — the test title string and the `:170`/`:185`
synthetic-fixture uses were left untouched, per the revision's "exactly one expectation" scoping.

`git hash-object`, before (`HEAD`, this revision's start) → after:

```
scripts/geometry-integrity.mjs                  878fd795bd20a7e24eb204b7a8fbc2b605b840e2 -> d12c11f18f80c7a2eaa43c8993850ccd524906ed
scripts/check-stories-rendered.mjs              c9651f28abcda01b093d7866f037cf0ced6787b4 -> 843316e4c86666eb696768ed9e856a9efe6faa56
scripts/__tests__/css-var-resolvability.test.ts 5c265d401d81bb494d1c0c29b8399ce11df7cbb8 -> 8e4a3ad20afccda13f512a1e6506668354f35dac
```

`src/components/admin/AdminUsersTable.tsx` (`3b0df9fd5e72e12bf65103f2de99657de4924e54`) and every other file
accepted from revisions 1/0 carry **zero** further diff this round — confirmed both by `git status --porcelain`
(§13.6) and the AC-R2-5 content-witness comparison (§13.5).

### 13.2 Result — `0 FAIL`, but not the predicted numbers

```
Results: 1177/1204 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
Manifest: .screenshots/rendered-assert/2026-08-15T18-14/manifest.json
```

The revision's own §5 table predicted `1179/1204 PASS, 0 FAIL, 25 AMBIGUOUS`. Actual: **1177 PASS, 27 AMBIGUOUS**
— 2 fewer pass, 2 more ambiguous, **FAIL matches at 0**. Reporting the difference rather than reconciling to the
table, per AC-R2-6:

The 3 predicted AdminUsersTable cells (`{sq,uk}×mobile-320`, `sq×mobile-375`) are correctly `AMBIGUOUS`
(`ambiguous-text-clipped-scrollable` + the pre-existing `ambiguous-offscreen`/new `ambiguous-outside-scrollable`
at mobile-320), never `PASS` — matching the revision's explicit requirement not to describe this as "all green."

The 2 extra ambiguous cells are **`Mantine/Primitives/Tabs/Default × sq × mobile-375`** and
**`× uk × mobile-320`** — both were `pass:true` in the pre-revision-2 manifest (`14-47`), because the now-retired
Task 529 allowlist entry unconditionally **deleted** any `text-clipped` violation for that entire story, for
every locale and viewport, before it ever reached the manifest. Retiring it (§4.4) did not just remove a
redundant safety net — it also stopped masking two genuine clipping cases in the canonical `Tabs/Default` demo
story itself that nobody could previously see. With the structural predicate live, those two cases now correctly
downgrade to `ambiguous-text-clipped-scrollable`/`ambiguous-outside-scrollable` rather than being silently counted
as passing. This is a positive, expected consequence of replacing an allowlist with a measured predicate, not a
defect — but it is a genuine deviation from the revision's own prediction table, reported here rather than
reconciled.

### 13.3 Plant matrix — all 4 arms, confirmed and reverted

Each plant's pre-plant hash, the observed result, and the post-revert hash:

| # | File | Pre-plant hash | Applied | Observed (verbatim, abridged) | Post-revert hash |
|---|---|---|---|---|---|
| P-G1 | `AdminUsersTable.tsx` | `3b0df9fd5…` | `scrollbars="x"` -> `"y"` | `1177/1204 PASS, 3 FAIL` — all 3 AdminUsersTable cells return to hard `text-clipped`; `sq`/`uk`×320 also regain hard `offscreen-control` (Check 2 loses its downgrade too, since `data-scrollbars` no longer reads `x`) | `3b0df9fd5…` ✅ matches |
| P-G2 | `geometry-integrity.mjs` | `d12c11f18…` | §4.3 reverted only, §4.2 kept | `1177/1204 PASS, 6 FAIL` — `Admin/AdminUsersTable × {sq,uk} × mobile-320` hard-fail `outside-container` (converts the preflight's `ANALYTICAL` masking prediction to `EXECUTED`); **broader than "the same three cells"** — `sq×mobile-375` stayed `ambiguous` only (its escape is text-internal, not a bounding-box escape) and `Mantine/Primitives/Tabs/Default`'s own now-unmasked cells (§13.2) were also exposed to the same masking, adding to the FAIL count | `d12c11f18…` ✅ matches |
| P-G3 | `geometry-integrity.mjs` | `d12c11f18…` | §4.1-§4.3 fully reverted to `HEAD` content; §4.4 (allowlist retirement) kept | `1177/1204 PASS, 7 FAIL` — `Mantine/Primitives/Tabs/Default` goes hard-red on `text-clipped` for **all 3 tabs × all 4 locales at mobile-320** (`sq`/`uk`/`it` — `en` fits), proving the structural predicate, not the deleted allowlist, is what keeps it green, using real production data | `d12c11f18…` ✅ matches |
| P-G4 | `Tabs.stories.tsx` | `116b3d036…` | Reversible probe: `<Button>` (Mantine, to satisfy `check:stories`' `raw-html-button` rule) in a fixed `width:60px, overflow:hidden` box, no `data-scrollbars`, text = existing `storybook.mantine.tabs_demo_tab_activity` key (no hardcoded string, satisfies the i18n gate) | `1164/1204 PASS, 17 FAIL` — the plant hard-fails `text-clipped` at **all 4 viewports × all 4 locales** (16 cells) for the genuinely-clipped probe button; proves the check still catches the defect class it exists for. (One unrelated cell, `Patterns/Mantine/EmptyLoadingErrorState/Default × sq × mobile-375`, also failed with `blank-canvas`/`horizontal overflow` — a different story this plant never touches; treated as an unrelated capture flake, not investigated further) | `116b3d036…` ✅ matches |

Two build-time gate corrections were needed before P-G4 would build: a hardcoded English string in the plant
tripped `check:stories`' i18n rule (fixed by reusing an existing `storyT` key) and a raw `<button>` tripped its
`raw-html-button` rule (fixed by using Mantine's `Button`). Both are evidence-gathering corrections to the
*reversible probe*, not to any in-scope file — the probe and both corrections were fully reverted together.

### 13.4 AC-R2-4 — PNG md5, all 16 AdminUsersTable cells, `14-47` vs final `18-14`

```
SAME  admin-adminuserstable--default__en__desktop-1024.png   SAME  __en__mobile-320/375/390.png
SAME  admin-adminuserstable--default__it__desktop-1024.png   SAME  __it__mobile-320/375/390.png
SAME  admin-adminuserstable--default__sq__desktop-1024.png   SAME  __sq__mobile-320/375/390.png
SAME  admin-adminuserstable--default__uk__desktop-1024.png   SAME  __uk__mobile-320/375/390.png
```

16/16 identical. The gate-only change altered no CSS, confirming the pixel claim required by AC-R2-4.

### 13.5 AC-R2-5 — content witnesses, every `M` path untouched by this revision

SHA-256 captured at S0 (before this revision's first write) for the 8 paths accepted from earlier rounds, and
re-verified with `sha256sum -c` after the final build:

```
src/app/globals.css: OK
src/components/admin/AdminUsersTable.tsx: OK
src/components/shared/HeroSearchView.module.css: OK
src/components/shared/HeroSearchView.tsx: OK
src/design-system/mantine/patterns/MantineCountButton.tsx: OK
src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx: OK
src/modules/notifications/components/NotificationCenter.tsx: OK
tasks/Sprints/Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md: OK
```

All 8 unchanged.

### 13.6 Validation evidence (revision 2)

| Command | Result |
|---|---|
| `git status --porcelain` (S0, before first write) | 8 `M` + 4 `??` (2 unrelated CI-fixture logs, this session log, revision-1 brief) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors (63 pre-existing warnings) |
| `npm run test` | exit 0, **1355/1355** — confirms AC-R2-7's `css-var-resolvability.test.ts` fix; the round-1/revision-1 contradiction is resolved |
| `grep -rn "notification-compact" src/` | 0 matches — AC-R2-7 |
| `npm run build-storybook` (post-fix) | exit 0 |
| `npm run screenshots:assert -- --mantine-only` (post-fix, final) | exit 0, `1177/1204 PASS, 0 FAIL, 27 AMBIGUOUS` — AC-R2-6 (numbers differ from prediction, reported in §13.2) |
| 4 plants (P-G1..P-G4) | see §13.3 — all confirmed, all reverted with hash proof |
| `npm run check:assertion-liveness` | exit 0, 5 LIVE / 0 DEAD / 0 STALE / 0 ORPHAN |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (row 45) | exit 0, 21/21 |
| `npm run build` | exit 0 — AC-R2-8 |
| `npm run check:css-vars` (post-build) | exit 0, 0 violations, self-reports owned count **256** |
| `npm run check:design-tokens` | exit 0, 0 violations |
| `sha256sum -c` witnesses | all 8 `OK` — AC-R2-5 |
| `git status --porcelain` (final, vs S0) | S0 + exactly 3 new `M`: `scripts/geometry-integrity.mjs`, `scripts/check-stories-rendered.mjs`, `scripts/__tests__/css-var-resolvability.test.ts` — matches §6's write-scope table exactly |

Not re-run, per the revision's own §10: `check:hydration`, `test:header-hydration-id-parity`, row 50's set,
`check:locale-leak:mantine-only`, `check:story-coverage`, `check:mojibake`, `check:i18n` — all previously exited 0
(or, for locale-leak, exited 1 on the 13 pre-existing AdminUsersTable findings reserved for Task 736, unrelated to
this revision's diff) and their inputs are untouched by this revision's write set.

### 13.7 Acceptance criteria — evidence

| AC | Status | Evidence |
|---|---|---|
| AC-R2-1 | ✅ | 3 cells `violations:[]`, carry `ambiguous-text-clipped-scrollable`, verdict `ambiguous`; P-G1 and P-G4 each produce hard `text-clipped` when applied, clear when reverted (§13.3) |
| AC-R2-2 | ✅ (with the broader-cell-set note in §13.3) | P-G2 fires `outside-container`; `summary.outsideContainer` is 0 with §4.3 restored (confirmed in the final manifest) |
| AC-R2-3 | ✅ | Final manifest: `Tabs/Default`'s original `{sq,it}×mobile-320` cells still ambiguous via `ambiguous-offscreen` (Check 2 unchanged); P-G3 turns the story hard-red, proving the retired allowlist is genuinely replaced |
| AC-R2-4 | ✅ | 16/16 md5-identical (§13.4) |
| AC-R2-5 | ✅ | 8/8 witnesses `OK` (§13.5) |
| AC-R2-6 | ✅ (numbers reported, not reconciled) | `1177/1204 PASS, 0 FAIL, 27 AMBIGUOUS`, exit 0 — see §13.2 for the explained 25→27 delta |
| AC-R2-7 | ✅ | `grep` 0 matches; `npm run test` exit 0, 1355/1355, `css-var-resolvability.test.ts` changed in exactly one expectation + its comment |
| AC-R2-8 | ✅ | `npm run build` exit 0; AC10/AC13/AC15 from the original kickoff still bind and were not re-broken (row 45 re-verified; rows 33/50 untouched, per §13.6) |

### 13.8 Files changed (revision 2)

| Path | Reason |
|---|---|
| `scripts/geometry-integrity.mjs` | §4.1–4.3: shared `isHorizontalScrollContainer` predicate; Check 1 and Check 3 gain scroll-aware downgrades |
| `scripts/check-stories-rendered.mjs` | §4.4: retired the Task 529 `Tabs/Default` allowlist entry |
| `scripts/__tests__/css-var-resolvability.test.ts` | §4.5 / Revision 1 §7: `257 -> 256` with the required comment |
| `docs/backlog.md`, this session log | Concise state update + full evidence, no growth to the backlog's line count (still 82, breach unresolved — flagged for Opus consolidation) |

### 13.9 Assumptions, deviations, limitations

- The `Patterns/Mantine/EmptyLoadingErrorState/Default × sq × mobile-375` failure observed only during the P-G4
  plant run was not investigated — it is a different story, outside this revision's write set, and did not recur
  in the pre-plant or final post-revert runs. Flagged as a possible capture flake for the reviewer, not
  characterized further here.
- AC-R2-2's "the same three cells hard-fail with `outside-container`" is satisfied in spirit (Check 3's masking
  by Check 1 is proven `EXECUTED`, the preflight's core claim) but not literally in cell count — see §13.3's P-G2
  row for the exact, reported difference.
- `docs/backlog.md` remains at 82 lines (`BACKLOG LIMIT BREACH`, first flagged in the revision 2 preflight §7).
  This session's edits kept the line count unchanged rather than adding history, per the preflight's own
  corrective-action note; the breach itself is unresolved and needs Opus consolidation.

### 13.10 Historical executor status (revision 2): `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

`0 FAIL` reached (`1177/1204 PASS, 0 FAIL, 27 AMBIGUOUS`, exit 0). All three original product fixes (AdminUsersTable
via `ScrollArea` + scroll-aware gate, HeroSearch three-band collapse, NotificationCenter 390→640) are in place and
verified. The `css-var-resolvability.test.ts` contradiction from the original round is resolved. All four plants
in this revision's matrix are confirmed and reverted with hash proof. The residual 3-cell `AdminUsersTable`
`AMBIGUOUS` debt is named, not hidden, and is a content decision (shortening `sq`/`uk` tab labels) the owner
explicitly declined this round — it is expected to remain until that decision changes, not a defect in this
implementation. **Never self-approved** — this status is the strongest this session may claim; only Opus,
independently reviewing the diff and this evidence, may approve.

---

## 14. Revision 3 — durable final-state audit and native receipts

The original pre-Revision-2 S0 cannot be recovered and was **not** reconstructed. On 2026-08-16 the owner accepted
the persisted eight-path diff audit as a replacement final-state assertion: it proves the current accepted edits,
not byte identity to the unavailable historical moment.

- `docs/reviews/artifacts/2026-08-15-task749/authorized-content-audit.txt` contains the eight authorised diffs and
  their matching numstat pairs.
- `S0-prime-witnesses.txt` stores SHA-256 values for the 12 paths that were already modified at Revision 3 start.
  Codex re-verified them natively with PowerShell `Get-FileHash`: **12/12 match**.
- The F7 `AdminUsersTable` smoke-test mock correction was deliberately made after S0′, is separately recorded as a
  `9/3` diff in the audit, and its native scoped suite passes **21/21** without the former `scrollbarSize` warning.
- `build-final.txt` is UTF-8 without BOM, ends `EXIT=0`, contains `Compiled successfully` and `40/40`; the current
  `npm.cmd run check:mojibake` result is `0 artifacts`.

P-R3's temporary production-source mutation was waived by the owner: it would not exercise any new detector or UI
behaviour, while the persisted hashes, exact audit, and native test directly cover this evidence-only revision.
