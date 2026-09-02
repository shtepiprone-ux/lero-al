# Task 779 — `ListingsFilterBar` → Mantine, route visibility relocated

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Kickoff:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_779_ListingsFilterBar_Mantine.md`
**Executor session:** 2026-09-02, platform `win32`, Node `v22.22.3`.

---

## 1. Files changed

| Path | Reason |
|---|---|
| `src/modules/listings/components/ListingsFilterBar.tsx` | Full Mantine migration (R1–R5, R8) — Modified |
| `src/modules/listings/components/ListingsShellView.tsx` | Lines 76–79 + `Box` import: wrap bar in `<Box visibleFrom="md">` (R6) — Modified |
| `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` | New canonical story `Patterns/Mantine/ListingsFilterBar` (R9) — Created |
| `scripts/mantine-migration-scope.json` | Appended `ListingsFilterBar.tsx`, 21 → 22 (R10) — Modified |
| `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` | New T1–T7 smoke suite (§13 S3) — Created |
| `docs/sessions/evidence/task779/` | Retained command transcripts (§13/AC15) — Created |
| `docs/backlog.md` | State update — Modified |
| `docs/sessions/2026-09-02-task779-listings-filter-bar-mantine.md` | This log — Created |

`git --no-optional-locks status --porcelain` confirms no path outside this set and no §8 out-of-scope path.
`useListingsUrlFilters.ts` — **zero diff** (read-only, confirmed absent from `git diff --stat`).

---

## 2. Requirement IDs completed

| ID | Evidence |
|---|---|
| R1 | AC1 census below: 0 `className=`, 0 legacy `<Combobox`, 0 `@/components/ui/button` / `@/components/shared/Combobox` / `cn(` / `@/lib/utils` imports; `@mantine/core` import present. |
| R2 | T1/T2 (`listingsFilterBar.smoke.test.tsx`), planted-violation proofs in §6 below. No `useState` in the file (T1c). |
| R3 | T3 — property type routes through `handlePropertyTypeChange`; dependent param dropped in the same push. |
| R4 | T4 — `resetFilters` → bare `router.push(pathname)`, no `?`. |
| R5 | T5 — `onFiltersOpen` called once, 0 `router.push`. |
| R6 | T6 — `ListingsShellView`'s wrapper root carries `mantine-visible-from-md`; the bar's own root (`data-testid="listings-filter-bar-root"`) carries neither visibility class. `theme.breakpoints.md === '48em'`. |
| R7 | V8 — all 16 new `Patterns/Mantine/ListingsFilterBar` cells PASS at 320/375/390/1024 × sq/en/uk/it. |
| R8 | `Indicator` wraps the advanced-filters `Button`; no `position:absolute` badge markup remains in the file (grep-confirmed). `data-testid="task775-advanced-filters"` preserved verbatim. |
| R9 | New story, title `Patterns/Mantine/ListingsFilterBar`, static import, exactly one export (`Default`) — confirmed by `check:story-coverage` (V3) and `check:stories` (V2). |
| R10 | `scripts/mantine-migration-scope.json`: 21 → 22, `ListingsShellView.tsx` absent — V3 confirms 22 covered, 0 unproven. |
| R11 | `git --no-optional-locks diff --stat`: only the 3 tracked files in §7; `useListingsUrlFilters.ts` absent. |
| R12 | V5 (`check:design-tokens:strict`) 0 violations; V4 (`governance:tailwind`) baseline unchanged (C0/H10/M0); no `design-tokens-allow:` marker, no raw px/rem/hex added; no new entropy-allowlist entry. |
| R13 | V8 differential: `total(P)=1396=total(B)+16`, `pass(P)=1289=pass(B)+16`, `fail(P)=80=fail(B)`, `ambiguous(P)=27=ambiguous(B)`. Story-identity diff of the FAIL/AMBIGUOUS sets between B and P is empty (see §5). |
| R14 | §7 below — CC1–CC9 recorded with measured before/after. No "visually neutral" claim made. |
| R15 | `ListingsShellView.tsx` diff is exactly the import line + lines 76–79; its 13 `className` are unchanged (before/after both 13); not enrolled in `mantine-migration-scope.json`. |

---

## 3. Census — before/after, exact commands

| Metric | §3.1 baseline | Post-edit (final) | Command |
|---|---:|---:|---|
| Physical lines | 135 | **134** | `(Get-Content -LiteralPath <file>).Count` |
| `className=` | 13 | **0** | `Select-String -Pattern 'className='` |
| `<Button` | 4 | **4** | `Select-String -Pattern '<Button'` |
| legacy `<Combobox` | 1 | **0** | `Select-String -Pattern '(?<![A-Za-z])<Combobox'` |

**S1 measurement-instrument finding (not a content drift):** the task's named command
`Get-Content -LiteralPath <file> | Measure-Object -Line` returned **119**, not the expected **135**, when run
against the byte-identical pre-edit file (git hash-object `81ee08e67993612d1489a0cf9395a8f558b6eebb`, matching
the task's own pre-write witness exactly — confirmed via `git hash-object` before any write). Cross-check via
`(Get-Content -LiteralPath <file>).Count` returned **135**, and blank-line count (`16`) plus non-blank (`119`)
sums to `135`. **Root cause: in this repository's PowerShell 5.1 (`5.1.26100.9278`), `Measure-Object -Line`
piped from `Get-Content` undercounts by excluding blank lines** — it is a tooling quirk of the *named* command in
this environment, not a file-content drift. `git hash-object` equality is conclusive proof the file was byte-identical
to the design-time measurement. Recorded per S1's requirement to report a discrepancy; not treated as a blocking
census drift because the underlying content was proven unchanged. `ListingsShellView.tsx`'s `className=` count is
**13 before and 13 after** (byte-identical, R15) — confirmed via the same `Select-String` command.

`git --no-optional-locks status --porcelain` re-taken before the first write matched §3 exactly (one unrelated
pre-existing modified path, `tasks/Sprints/Sprint_68_…md`, the 778-closure row) — no dirty-worktree manifest
required.

---

## 4. Commands run

All commands executed in native Windows PowerShell 5.1, `node.exe -p process.platform` → `win32`, Node `v22.22.3`,
cwd `C:\Claude_Code_Projects\lero-al`. Transcripts retained under `docs/sessions/evidence/task779/`.

| # | Command | Exit | Transcript |
|---|---|---:|---|
| S1 | Census (4 `Select-String`/`Get-Content` commands + `git status --porcelain`) | — | inline above |
| S2 | `npm run build-storybook` (pre-edit) | 0 | `S2-build-storybook.log` |
| V1 | `npx vitest run listingsFilterBar.smoke.test.tsx` + 3 sibling suites | 0 | `V1-absolute-final.log` (60 tests, 4 files) |
| V2 | `npm run check:stories` | 0 | `V2-check-stories-final.log` (133 files, 0 violations) |
| V3 | `npm run check:story-coverage` | 0 | `V3-story-coverage-final.log` (22/22 covered) |
| V4 | `npm run governance:tailwind` | 0 | `V4-governance-final.log` (C0/H10/M0, baseline unchanged) |
| V5 | `npm run check:design-tokens:strict` | 0 | `V5-design-tokens-final.log` (0 violations) |
| V6 | `npm run typecheck` | 0 | `V6-typecheck-final.log` |
| V7 | `npm run build-storybook` (post-edit, post-fix) | 0 | `V7b-build-storybook.log` |
| V8 | `npm run screenshots:assert -- --mantine-only` (post-fix, = P) | 1* | `V8-P-postfix.log` — *exit 1 reflects 80 pre-existing FAIL cells, all baseline-identical; see §5 |
| V9 | `npm run check:locale-leak:mantine-only` | 1* | `V9-locale-leak.log` — *23 pre-existing leaks, 0 in `ListingsFilterBar` |
| V10 | `npm run build` | 0 | `V10-build.log` |
| V11 | `git --no-optional-locks diff --check` | 0 | `V11-diff-check.log` |
| V12 | `git --no-optional-locks diff --stat` | 0 | `V12-diff-stat.log` |

`check:i18n` not required — A2 held (no new `storybook.*` key; the two location fixture strings reuse
`storybook.mantine.combobox_option_tirana`/`_durres`, already present in all four locales).

---

## 5. Differential rendered result (D68-2)

**B** — Task 778's own approved closure evidence, `docs/sessions/evidence/task778/V8b-post-edit-screenshots-assert-final.txt`
(captured 2026-09-01 22:31:34, manifest `.screenshots/rendered-assert/2026-09-01T20-31/manifest.json`). Reused
rather than re-captured: `ListingsFilterBar.tsx`'s pre-edit `git hash-object` (`81ee08e67993612d1489a0cf9395a8f558b6eebb`)
matches the task's own pre-write witness exactly, and no other file affecting Storybook rendering changed between
778's close and this session's first edit — B is the codebase state this task actually started from.

- **B: 1380 total, 1273 PASS, 80 FAIL, 27 AMBIGUOUS**, 83 Mantine stories selected.

**P** — this session's post-edit, post-width-fix run, `docs/sessions/evidence/task779/V8-P-postfix.log`, manifest
under `.screenshots/rendered-assert/2026-09-02T…/manifest.json`.

- **P: 1396 total, 1289 PASS, 80 FAIL, 27 AMBIGUOUS**, 84 Mantine stories selected.

**Arithmetic reconciliation (AC13):**

```
total(P) = 1396 = total(B) + 16 = 1380 + 16   ✓
pass(P)  = 1289 = pass(B)  + 16 = 1273 + 16   ✓
fail(P)  =   80 =  fail(B)      =   80        ✓ (unchanged)
ambig(P) =   27 = ambig(B)      =   27        ✓ (unchanged)
```

**`P \ B` as a set of story identities:** extracted every `Story × locale × viewport` block header from both
transcripts, reduced to unique story names. B's FAIL/AMBIGUOUS section names 11 story identities (10 real +
1 `flaky-recovered` note-only line for `Patterns/Mantine/TwoColumnForm/Default`, which is **not** a FAIL/AMBIGUOUS
entry — it recovered on retry). P's section names the same 10 real story identities, `flaky-recovered: 0`.
`grep -c "ListingsFilterBar" V8-P-postfix.log` → **0** — the new story appears nowhere in the FAIL or AMBIGUOUS
sections. **`P \ B = ∅`**, and the arithmetic proves the 16 new cells are the entirety of the `pass` growth — all
16 `Patterns/Mantine/ListingsFilterBar` cells (320/375/390/1024 × sq/en/uk/it) are PASS, none blank (AC6).

Pre-existing FAIL/AMBIGUOUS families (unchanged, not touched by this task): `AuthSheet` (Login/Register/Register
Agent/Forgot Password/Register Agent Add Company — full-width-button + navigation-timeout), `AdminUsersTable`
(scroll-tab ambiguous), `Combobox` overlap, `PopularLocationsView` long-city-name ellipsis, `Tabs` scroll-tab
ambiguous.

---

## 6. Planted violations — proof each test is a real control

Every plant was applied to the working tree, run with `npx vitest run … -t "<name>"`, the actual FAIL captured,
then reverted and the full suite re-run to green (final confirmation: `V1-absolute-final.log`, 60/60).

| Test | Plant | Actual failure captured | Revert confirmed |
|---|---|---|---|
| T1a | Double `router.push` on listing-type click | `expected "vi.fn()" to be called 1 times, but got 2 times` | `plant-T1a.log` |
| T1b | `type: type \|\| 'all'` instead of `null` | `expected true to be false` (`type` present when it must be deleted) | `plant-T1b.log` |
| T1c | Reintroduced `useState` import | `expected …not to match /useState/` | `plant-T1c.log` |
| T2 | Premium always sets `'true'`, never deletes | `expected true to be false` on the off-toggle | `plant-T2.log` |
| T3 | `onChange` called `updateParams({property_type:…})` instead of `handlePropertyTypeChange` | `year_built_min` survived (`expected true to be false`) | `plant-T3.log` |
| T4 | Reset called `updateParams({})` instead of `resetFilters` | push arg was `/en/listings?type=sale&premium=true`, not bare pathname | `plant-T4.log` |
| T5 | Advanced-filters `onClick` also called `updateParams` | `pushMock` called 1 time, expected 0 | `plant-T5.log` |
| T6 | `visibleFrom="md"` moved onto the bar's own `Stack` **and** the `Box` wrapper removed from `ListingsShellView` | Both arms independently proven to fail: bar-root class assertion failed (`plant-T6-fixed.log`) and wrapper-class assertion failed (`plant-T6-arm2.log`) when isolated | both reverted, `plant-T6.log`/`-fixed`/`-arm2` |
| T7 | Reset condition forced `true`; `Indicator disabled={false}` | Reset button rendered with `activeCount === 0`; Indicator badge rendered | `plant-T7.log` |

T6 required a **test redesign mid-plant**: the first attempt (selector `.listings-shell > div`) passed
unexpectedly under the plant because it could not distinguish "wrapper carries the class" from "the bar's own root
(now the same DOM node) carries the class." Fixed by adding `data-testid="listings-filter-bar-root"` to the bar's
`Stack` and re-deriving both assertions from that stable node; re-verified failing under the same plant before
reverting (see log pair above).

---

## 7. Canonical changes CC1–CC9 — measured, not asserted neutral

| # | Change | Measured before | Measured after |
|---|---|---|---|
| CC1 | Property-type combobox loses fixed 160px width | `w-40` = 160px fixed | `MantineCombobox` default `triggerWidth` `{base:'100%', sm:'auto'}` |
| CC2 | Location combobox loses fixed 208px width | `w-52` = 208px fixed | `LocationCombobox` default (no `className` passed); internally `{base:'100%', sm:'100%'}` |
| CC3 | Control chrome → theme defaults | `rounded-xl` (12px) / `text-xs` | `defaultRadius: 'lg'` = 8px (`theme.ts:225`) / Button's own `--mantine-font-size-sm` |
| CC4 | Count badge changes mechanism (forced by `Button` `overflow:hidden`, §3.7) | absolute corner `<span>` `h-4 w-4 rounded-full bg-primary` | `Indicator` wrapping the Button, `color="brand"`, no `size`/`offset` prop (Mantine default) |
| CC5 | `size="lg"` dropped from all controls | shadcn `size="lg"` | Mantine theme default size (banned per Task 520) |
| CC6 | Both rules change color | `#EBEBEB` (`--border`) | `#D0D5DD` (`gray.3`, D2/Task 671); vertical rule additionally goes from fixed 24px height to flex-stretch |
| CC7 | Reset control loses destructive hover tint | `hover:text-destructive` | `variant="subtle" color="gray"`, no hover-tint equivalent — deliberate, recorded loss |
| CC8 | Layout mechanism changes; two spacings preserved exactly, one changes | `py-3`=12px, `gap-2`=8px preserved via `py="sm"`/`gap="xs"`; listing-type inner `gap-1`=4px has no 4px step in the theme scale | `gap="xs"`=8px (a real 4px change); spacer `flex-1` replaced by `Group justify="space-between"` composition |
| CC9 *(not in the kickoff's CC list — forced by the Q3 rendered gate)* | Standalone text buttons (type toggles, premium toggle, reset) must be full-width below 640px | Buttons rendered at intrinsic (auto) width at every viewport | `w={{ base: '100%', sm: 'auto' }}` added to the 3 listing-type buttons, the premium toggle and the reset button; both mid-level `Group`s changed `wrap="nowrap"` → `wrap="wrap"` | Measured: V8's first run (pre-fix) failed 12/16 new cells with `✗ text button not full-width at <640` plus a genuine `✗ horizontal overflow detected` at uk×320; the fix run (`V8-P-postfix.log`) shows all 16 cells PASS. **CC9 is Storybook-only in effect** — the production route hides this bar entirely below 768px (`B12`), so no real user ever sees the stacked-full-width mobile state; it exists only so the canonical story's mobile cells are genuine, passing UI rather than a rule violation. |

No claim of "visually neutral" or "no visual change" appears anywhere in this report; every changed visible
artifact above carries a measured before/after value.

---

## 8. Implementation validation notes

- Defect found and fixed: the first implementation (no explicit `w` prop on standalone Buttons, inner Groups
  `wrap="nowrap"`) failed the rendered gate's mobile full-width-button rule on 12/16 new cells and produced a
  genuine horizontal-overflow at uk×320 (long Ukrainian labels in a `nowrap` row). Fixed per CC9 above; re-verified
  green on the full differential run.
- No other implementation gap found. `Indicator`'s corner badge is not clipped at any of the 16 cells (visually
  confirmed by V8 PASS + AC7's structural check that the badge markup lives outside the `Button` box).

---

## 9. Assumptions, deviations, limitations

- **A1 held.** One story export (`Default`), 16 new cells — matches the kickoff's fixed arithmetic.
- **A2 held.** No new `storybook.*` key needed; `combobox_option_tirana`/`_durres` reused.
- **A3 — known limitation, not fixed here (Task 679).** The property-type combobox shows raw lowercase enum
  labels (`apartment`, `commercial`, …) in the story, in every locale, because `usePropertyTypes()`'s
  `buildFallback()` has no live endpoint in Storybook. Confirmed present in the rendered story; not addressed.
- **A4 held.** No currency/exchange-rate output is rendered by this component; inert for this story.
- **Q1 — not adopted.** `MantineCountButton` (the canonical "trigger + count" primitive, already used by
  `HeroSearchView`) was inspected and rejected for this slice because it relocates the count from a corner overlay
  to an inline `rightSection` pill — a larger visual change than authorized. Recorded as a convergence candidate
  for the final `ListingsShellView` slice, per the kickoff.
- **§10.6's stated detector blind spot stands.** The 16 rendered cells prove the bar's own responsive behavior at
  320/375/390/1024; they prove **nothing** about the route's 768px visibility boundary (391–1023px is never
  captured). That boundary is proven by T6 (the `mantine-visible-from-md` class + `theme.breakpoints.md==='48em'`
  check), not by pixels.
- **Deviation — CC9 (§7).** Not named in the kickoff's CC1–CC8 list; required by the generic Q3 mobile-button
  rendered-gate rule once the bar's own visibility gate was removed and it became visible at 320/375/390 in
  Storybook for the first time. Recorded with full before/after measurement rather than silently added.
- **S1 measurement-instrument finding (§3).** The task's exact named census command undercounts blank lines in
  this repo's PowerShell 5.1; the file was proven byte-identical to the design-time witness via `git hash-object`
  before this finding is relied on. Not treated as a content drift.
- **B reuse (§5).** Baseline B was not re-captured via a fresh `screenshots:assert` run; Task 778's own approved
  closure transcript was reused because the pre-edit file hash matched the task's witness exactly. This is
  disclosed as a deviation from a literal re-run, with the equivalence proof stated.

---

## 10. Backlog update

Concise state written to `docs/backlog.md` "Last Session" and the Task 779 registry row (state → `IMPLEMENTED -
AWAITING ORCHESTRATOR REVIEW`). `docs/backlog.md` physical line count after edit: see backlog diff — no
`BACKLOG LIMIT BREACH` (file stays under the stated review threshold; only the "Last Session" paragraph and the
779 registry-row status token changed).
