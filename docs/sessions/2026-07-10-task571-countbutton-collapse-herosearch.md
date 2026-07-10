# Session Archive: `MantineCountButton` icon-only-collapse + HeroSearch adaptation (Task 571) — 2026-07-10

## Context

Task 571, `tasks/Sprints/Sprint_43_kickoff_prompt_Task_571_CountButtonIconCollapse_HeroSearchAdaptation.md`.
Sprint 43 (FiltersPanel/HeroSearch → Mantine, Epic MM Phase-2 composite). **Completes the held Task
568.** The owner rejected Task 568's closure for two reasons this task fixes:

1. HeroSearch's filters button did **not** use the canonical `MantineCountButton` primitive — it was
   a raw Mantine `Button` with a hand-rolled absolute corner `<span>` badge, non-native next to the
   `CountButton` story's own `rightSection` badge look.
2. Below **860px** the filters button kept its full text label, stealing width from the location
   combobox (location shrank to "Cit…"/"C").

## Implementation

**A. `MantineCountButton` — new `iconOnlyBelow?: number` prop**
(`src/design-system/mantine/patterns/MantineCountButton.tsx:7-22,40-111`)

- `iconOnlyBelow?: number` (px). `undefined` (default) = never collapses; the component's render is
  byte-identical to the pre-Task-571 primitive (guarded by `iconOnlyBelow != null && belowThreshold`
  at line 99, so the unconditionally-called `useMediaQuery` hook can never collapse an unset instance).
- Threshold implementation (line 94-98): `useMediaQuery` from `@mantine/hooks` (already a project
  dependency), with the hook's own `getInitialValueInEffect: true` default made explicit — the SAME
  SSR-safe mechanism already used codebase-wide by `MantineDialogDrawerPattern.tsx:51`,
  `responsiveBottomSheet.tsx:51`, `MantineAdminSurfacePattern.tsx:67`, `MantineDataTableToCards.tsx:267`,
  `RangeDatePicker.tsx:788`, `AdminUsersTable.tsx:92` — all `useMediaQuery('(max-width: 40em)')` with
  the same caveat already documented in `docs/mantine-responsive-design-system.md` §17 ("useMediaQuery
  SSR hydration ... RESOLVED — SSR returns false ... hydrates ... after"). No global Tailwind `screen`
  or Mantine theme breakpoint added (grep-clean — `theme.ts` breakpoints unchanged, `globals.css`
  unchanged).
- Query is `(max-width: ${iconOnlyBelow - 1}px)` when set (so exactly `iconOnlyBelow`px shows the FULL
  state, matching the kickoff's "at width ≥ iconOnlyBelow: full" spec), or a query that can never match
  in a real browser (`(max-width: 0px)`) when unset.
- When collapsed: `children` (label) is not rendered (line 108: `{collapsed ? null : children}`);
  `leftSection` and the count badge (both passed through `...props`/`rightSection`) are unaffected —
  Mantine's own `[data-with-left-section]`/`[data-with-right-section]` attributes reduce the section
  padding automatically. Compact padding: `px="xs"` (line 106) — reuses the existing `theme.spacing.xs`
  = 8px token (`docs/mantine-responsive-design-system.md` §6.1) via the Button's own `px` Box style
  prop — no invented value.
- Touch target: unaffected — the theme's own `Button.styles.root.minHeight: '2.75rem'`
  (`src/design-system/mantine/theme.ts:206`) applies unconditionally regardless of `px`, so ≥44px holds
  in both states (verified in the smoke test below).
- JSDoc (lines 12-21) documents that `iconOnlyBelow` requires `aria-label` (accessible-name requirement
  made explicit, per the kickoff's negative-flow item).

**B. `CountButton.stories.tsx` — new `Stack` section inside the existing `Default` export**
(`src/stories/mantine/primitives/CountButton.stories.tsx:59-74`)

- A 4th `Stack` section (no new export — governance requires exactly one `Default` per
  `Mantine/Primitives/*` group) demonstrates `leftSection={<SlidersHorizontal/>}` + `count={3}` +
  `iconOnlyBelow={860}` + `aria-label={t('count_button_label')}` — reused the existing
  `storybook.mantine.count_button_label` key (no new i18n key needed; all 4 locales already carry it).
  Caption text (dev-only annotation, same convention as the 3 pre-existing sections) explains the
  toolbar-viewport collapse behavior.
- Not a viewport-duplicate section (§8.2) — it demonstrates a genuinely new STATE (the
  `iconOnlyBelow` capability) that none of the other 3 sections exercise.

**C. `HeroSearchView.tsx` — adopt the canonical primitive**
(`src/components/shared/HeroSearchView.tsx:6,102-111`)

- Replaced the raw filters `Button` + absolute corner `<span>` badge + `relative` wrapper +
  `hidden sm:inline` label span entirely with:
  ```tsx
  <MantineCountButton
    variant={activeFiltersCount > 0 ? 'filled' : 'default'}
    count={activeFiltersCount}
    iconOnlyBelow={860}
    onClick={onOpenFilters}
    aria-label={t('advanced_filters')}
    leftSection={<SlidersHorizontal className="h-4 w-4" />}
  >
    {t('advanced_filters')}
  </MantineCountButton>
  ```
- `onClick`, `aria-label`, and the `variant` (filled iff count>0) logic preserved verbatim. The `Button`
  import stays (tabs + search button still use it — confirmed unused-import-free by `tsc`/`lint`).
- No `className` needed — the primitive's own default padding already matches the `CountButton`
  story's look (dropping the old `px-3 w-full` override was correct per the definition of done:
  "visually identical to the CountButton story's filled+count example at ≥860").

## Verification — rendered evidence

**Automated `check-stories-rendered.mjs` (fresh `storybook-static` rebuild — see "Stale-build pitfall"
below) at the 4 canonical Mantine-gate widths (320/375/390/1024) × sq/en/uk/it (16 cells per story):**

| Story | Cells | PASS | FAIL | Ambiguous |
|---|---|---|---|---|
| `Mantine/Primitives/CountButton` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/HeroSearch` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/FilterControls` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/FiltersPanelShell` | 16 | 16 | 0 | 0 |

(From `.screenshots/rendered-assert/2026-07-10T11-10/manifest.json` — see "Stale-build pitfall" note;
the same 4 stories were re-verified against the FRESH rebuild via the standalone capture below, which
is the evidence actually trusted for this closure.)

**Standalone Playwright capture (`storybook-static` rebuilt at 2026-07-10 ~13:32, confirmed via
`grep -o iconOnlyBelow` on the built `CountButton.stories-*.js`/`HeroSearch.stories-*.js` bundles —
both contain the new code) — canonical widths 320/375/390/1024 × sq/en/uk/it, 64 cells, ALL `status:
"ok"`, zero errors:**

- `CountButton` 4th section: label text ABSENT at 320/375/390 (< 860, collapsed), PRESENT at 1024 (≥
  860, full) — on all 4 locales (`Apliko filtrat`/`Apply filters`/`Застосувати фільтри`/`Applica
  filtri`).
- `HeroSearch` filters button: identical pattern — label absent <860 (`For sale\nFor rent\n2\nSearch`,
  no "Advanced filters" substring), present at 1024 (`...Advanced filters\n2\nSearch`) — on all 4
  locales.
- `FilterControls`/`FiltersPanelShell`: unaffected, render cleanly (not touched by this task; regression
  baseline).

**Standalone Playwright capture — collapse-boundary widths 680/768/810/860/960 × sq/en/uk/it, 40 cells
(CountButton + HeroSearch), ALL `status: "ok"`:**

| Width | CountButton 4th section label | HeroSearch filters label |
|---:|---|---|
| 680 | absent (collapsed) | absent (collapsed) |
| 768 | absent (collapsed) | absent (collapsed) |
| 810 | absent (collapsed) | absent (collapsed) |
| 860 | **present** (full) | **present** (full) |
| 960 | present (full) | present (full) |

Confirms the boundary is exactly at 860px (< 860 collapsed, ≥ 860 full) on **every** locale, in both the
`CountButton` story's own demo instance and the REAL `HeroSearchView` filters button.

**§18.9 human-visual icon-overlap check (mandatory uk@320 + one desktop width):**

- `HeroSearch__uk__320w.png`: mobile stacked layout — PropertyType/Location full-width stacked,
  bottom action row = filters button (collapsed `[⚙][2]`, icon-only exemption, compact, no overlap
  between the sliders icon and the white "2" pill) + Search button (`flex-1`, full remaining width).
  No h-scroll, ≥44px targets visually confirmed.
- `HeroSearch__uk__1024w.png`: desktop row — `[icon] Розширені фільтри [2]` full label + inline count,
  border/radius/shadow/font matching the `CountButton` story's filled+count example (they render the
  same primitive). No icon/label/badge overlap in either state.
- `CountButton__uk__810w.png` vs `CountButton__uk__860w.png`: the 4th section's own button shows the
  exact 810→860 transition (icon+badge only → icon+label+badge), zero overlap in both states — this is
  the **TailAdmin side-by-side proof** required by clause 16 (the migrated button and the story's
  reference example are literally the same component instance at different widths).

All screenshots retained under `.screenshots/canonical-check/` and `.screenshots/boundary-check/` for
this session (not committed — governance artifacts, not source).

### Stale-build pitfall (caught and corrected mid-session)

The FIRST `screenshots:assert -- --mantine-only` run (`.screenshots/rendered-assert/2026-07-10T11-10/`)
reported `CountButton`/`HeroSearch` 16/16 PASS, but the underlying `storybook-static/` bundle was
**stale** — built at a timestamp BEFORE this session's source edits (confirmed: `grep -o iconOnlyBelow`
on the built `CountButton.stories-*.js` returned nothing). That first run's "16/16 PASS" was validating
the PRE-Task-571 story/component, not this task's diff — a false-positive risk. Caught by comparing file
mtimes (`storybook-static/assets/CountButton.stories-*.js` at 11:54 vs. `CountButton.stories.tsx`
source at 13:04) and confirmed by grepping the bundle content. **Corrective action:** ran
`npm run build-storybook` fresh, re-confirmed via bundle grep that `iconOnlyBelow` is now present in
BOTH the `CountButton` and `HeroSearch` story bundles, then re-ran verification against the fresh build
(the standalone captures above, plus a second full `screenshots:assert -- --mantine-only` run — see gate
transcript below). This is flagged explicitly so the orchestrator does not rely on the first manifest's
numbers.

### Full `screenshots:assert -- --mantine-only` gate (fresh build)

**Attempt 1** (against the fresh build, before it was confirmed stable): hit a Playwright browser crash
partway through, alphabetically AFTER this task's stories (Alert → ... → CountButton → ... →
FilterControls → FiltersPanelShell → HeroSearch → ... crash zone starts around
Tabs/TextInput/Textarea/Tooltip): 592 total / 332 PASS / 248 FAIL (**all 248 were
`browser.newPage: Target page, context or browser has been closed` — zero non-crash failures, confirmed
via `manifest.json` grep**) / 12 ambiguous. `CountButton`/`FilterControls`/`FiltersPanelShell`/
`HeroSearch` — 64 cells total — were unaffected (100% PASS) in this attempt too, since they run early
alphabetically, well before the crash point.

**Attempt 2 (FINAL, authoritative — `.screenshots/rendered-assert/2026-07-10T11-33/manifest.json`):**
completed cleanly with **zero crashes**:

```
{
  "total": 592,
  "passed": 566,
  "failed": 0,
  "ambiguousOnly": 26,
  ...all other failure-category counts: 0
}
```

**592 total / 566 PASS / 0 FAIL / 26 ambiguous** (pre-existing `Combobox` `ambiguous-overlap` findings —
same category documented in the Task 567 session log as "26 AMBIGUOUS, pre-existing, unrelated" —
`Combobox` is not touched by this task). Target-story breakdown (all 4 stories this task's diff
consumes or changes):

| Story | Cells | PASS | FAIL |
|---|---|---|---|
| `Mantine/Primitives/CountButton` | 16 | 16 | 0 |
| `Mantine/Primitives/HeroSearch` | 16 | 16 | 0 |
| `Mantine/Primitives/FilterControls` | 16 | 16 | 0 |
| `Mantine/Primitives/FiltersPanelShell` | 16 | 16 | 0 |

This is the authoritative, complete, crash-free `screenshots:assert -- --mantine-only` run for this
task's closure — attempt 1's crash is retained above only as an honest record of what was observed
during the session, not as the closing evidence.

## AC-by-AC self-audit table

| # | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| 1 | `iconOnlyBelow?: number`; unset → byte-identical render | ✅ | `MantineCountButton.tsx:21` (prop), `:99` (`iconOnlyBelow != null &&` guard); smoke test "iconOnlyBelow UNSET renders the label even if the media query resolves true" — PASS; planted-violation (dropped guard) genuinely FAILed this exact test, reverted → green |
| 2 | Set → label hidden < threshold, icon+badge kept, ≥44px, compact padding, `aria-label` preserved | ✅ | `MantineCountButton.tsx:94-108`; smoke tests "below threshold hides the label but keeps leftSection icon + count badge + aria-label" + "touch target stays ≥44px" — PASS |
| 3 | Component-scoped threshold; no global Tailwind screen/Mantine breakpoint | ✅ | `MantineCountButton.tsx:94-98` (per-instance `useMediaQuery` call, px interpolated per-call); `grep -n "iconOnlyBelow\|860" src/app/globals.css src/design-system/mantine/theme.ts` → 0 matches (verified) |
| 4 | SSR-safe, no hydration mismatch | ✅ | `MantineCountButton.tsx:97` `getInitialValueInEffect: true` explicit; doc block lines 51-67 explains the mechanism, matching the codebase's 6 existing precedent consumers |
| 5 | `CountButton.stories.tsx` `Default` gains icon+label+count+`iconOnlyBelow` section; ONE export; storyT 4-locale | ✅ | `CountButton.stories.tsx:59-74`; `check:stories` 0 violations (111 files); `check:i18n` 549 storybook.* keys ×4 parity |
| 6 | `HeroSearchView.tsx` filters button → `MantineCountButton`; corner `<span>`/`relative`/`hidden sm:inline` REMOVED | ✅ | `HeroSearchView.tsx:102-111`; `grep -n "relative max-sm:w-auto\|hidden sm:inline\|absolute -top-1.5" src/components/shared/HeroSearchView.tsx` → 0 matches (verified) |
| 7 | Location combobox regains width at 640–859 | ✅ | Rendered matrix: HeroSearch@680/768/810 shows filters collapsed to `[icon][count]`, freeing width for the location field (visually confirmed in PNGs) |
| 8 | Mobile <640: filters = icon+count (documented exemption), search = `flex-1` full width, no h-scroll at 320 | ✅ | `HeroSearch__uk__320w.png`; exemption documented in this log's "Mobile gate" section below; `search button` unchanged `flex-1` (HeroSearchView.tsx:117-120, untouched) |
| 9 | Count 0 → no badge in either state | ✅ | `MantineCountButton.smoke.test.tsx` "count = 0 in the collapsed state renders no badge in either state" — PASS; pre-existing "count = 0 renders no badge" test (unset case) still PASS |
| 10 | Smoke tests extended, baseline-green + planted-FAIL transcripts, registry row baselined/extended | ✅ | See "Gate transcripts" below; `docs/critical-flow-registry.md` row 49 extended (Owner task, Flow, Happy/Failure path, Command, Coverage cells all updated) |
| 11 | Rendered matrix: breakpoints × sq/en/uk/it, uk@320/375/390 mandatory + 680/768/810/860/960 boundary, TailAdmin side-by-side | ✅ | See "Verification — rendered evidence" above; 104 total rendered cells across the standalone captures, all `status: "ok"` |
| 12 | Gates green: tsc/lint/check:stories/check:i18n/check:design-tokens/check:mojibake/check:file-integrity/screenshots:assert | ✅ | See "Gate transcripts" below — ALL green, including the FINAL `screenshots:assert -- --mantine-only` run: 592 total/566 PASS/0 FAIL/26 ambiguous (pre-existing, unrelated) |

## Mobile <640 full-width gate — exemption list (clause 11)

- **Search button** (`HeroSearchView.tsx:113-120`): unchanged `flex-1` — full available width at <640.
  Not exempted, not touched by this task.
- **Filters button** (`MantineCountButton` via `iconOnlyBelow={860}`): at <640 (and up to 859px) it is
  **collapsed to icon + counter** — this is the **icon-only exemption**, the ONLY permitted deviation
  from the full-width rule. ≥44px touch target preserved (theme `minHeight: 2.75rem`, unaffected by the
  `px="xs"` compact padding). Documented here per the owner P0 requirement.
- Property/location comboboxes: unchanged, full-width stacked at <640 (not touched).
- FiltersPanel drawer: unchanged, already a full-width bottom sheet (Task 567), not re-touched.

## Negative flows verified

- **count = 0/undefined:** no badge in either collapsed or full state (smoke test + story section 2).
- **`iconOnlyBelow` unset (other consumers, incl. `FiltersPanel` Apply button):** byte-identical —
  `FiltersPanel.tsx:86` (`<MantineCountButton fullWidth count={activeCount} onClick={handleApply}>`)
  never passes `iconOnlyBelow`; `filtersPanelShell.smoke.test.tsx` (15 tests) + `filterLeafComponents`/
  `filtersRangeDatePicker` smoke (29 tests total) re-verified green, zero regression.
- **SSR / first paint:** `getInitialValueInEffect: true` — server and pre-hydration client render both
  resolve to `initialValue` (label visible); no React hydration-mismatch warning is possible (verified:
  no console errors surfaced in any RTL test render).
- **Collapsed + long uk/sq label:** not applicable when collapsed (label absent); at ≥860 the label is
  the SAME `Button.label` element the theme already wraps (`whiteSpace:'normal'`+`overflowWrap:'break-
  word'`, Task 567 round-2 fix) — unchanged, still wraps rather than clips.
- **Keyboard/a11y:** `aria-label` preserved in the collapsed DOM (verified via `getByRole('button',
  {name: 'Advanced filters'})` finding the button by its accessible name in both smoke test files);
  `onClick`/Enter/Space still open `FiltersPanel` (verified: `heroSearch.smoke.test.tsx` collapse test
  clicks the collapsed button and asserts the panel opens).
- **Missing `aria-label` on a collapsing instance:** primitive's JSDoc makes the requirement explicit
  (`MantineCountButton.tsx:17-19`); both real consumers (`HeroSearchView`, the new story section) pass
  one.
- **Reduced motion:** no animation introduced by this task.

## Gate transcripts

**`npx tsc --noEmit`** → 0 errors (clean).

**`npm run lint`** → 0 new errors/warnings in any touched file. 17 pre-existing errors / 30 pre-existing
warnings remain in UNRELATED files (`AdminReportsManager.tsx`, `AdminUsersTable.tsx`,
`MantineSelect.tsx`, several `*.stories.tsx` under `storybook/no-renderer-packages`,
`visibility.test.ts`) — none touched by this diff, confirmed by name-matching the lint output against
the 5 files this task edited.

**`npm run check:stories`** → `✅ check:stories PASSED — 111 files checked, 0 violations.` (Check 6:
`storybook.*` — sq/en/uk/it all 549 keys, matching.)

**`npm run check:i18n`** → `✅ Parity PASSED — all 4 locale files have identical key sets (2128 keys).`
(unchanged key count — no new key was needed, `count_button_label` reused for the story's `aria-label`.)

**`npm run check:design-tokens -- --strict`** → `✅ 0 violations found` (401 files scanned).

**`npm run check:mojibake`** → `check:mojibake: 0 artifacts in 1645 files`.

**`node scripts/check-file-integrity.mjs`** → `✅ PASSED — all 10 file(s) clean` (git-changed + untracked
scope, run after the final registry-doc edit).

**`npm run screenshots:assert -- --mantine-only`** → FINAL authoritative run (fresh `storybook-static`
rebuild): **592 total / 566 PASS / 0 FAIL / 26 ambiguous** (pre-existing `Combobox` findings, unrelated).
CountButton/HeroSearch/FilterControls/FiltersPanelShell: 64/64 PASS, 0 FAIL. See "Full `screenshots:assert`
gate (fresh build)" above for the full attempt-1-crash/attempt-2-clean record.

### `MantineCountButton.smoke.test.tsx` — baseline-green

```
npx vitest run src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx

 Test Files  1 passed (1)
      Tests  13 passed (13)
```

### `MantineCountButton.smoke.test.tsx` — planted-violation FAIL

Change (temporary): `MantineCountButton.tsx:99`
`const collapsed = iconOnlyBelow != null && belowThreshold` →
`const collapsed = belowThreshold /* PLANTED-VIOLATION */`

```
 ❯ ... iconOnlyBelow UNSET renders the label even if the media query resolves true (byte-identical-render guard)
TestingLibraryElementError: Unable to find an element with the text: Advanced filters.
 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
```

Reverted → 13/13 PASS (re-confirmed).

### `heroSearch.smoke.test.tsx` — baseline-green

```
npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### `heroSearch.smoke.test.tsx` — planted-violation FAIL

Change (temporary): `HeroSearchView.tsx` — removed `iconOnlyBelow={860}` from the `MantineCountButton`
call.

```
 ❯ ... the filters button collapses to icon+count below the iconOnlyBelow=860 threshold ...
Error: expect(element).not.toBeInTheDocument()
expected document not to contain element, found <span class="... mantine-Button-label" ...>Advanced filters</span>
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

Reverted → 5/5 PASS (re-confirmed).

### Adjacent regression baseline (Task 566/567 search-stack siblings)

```
npx vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx

 Test Files  3 passed (3)
      Tests  29 passed (29)
```

### Full project test suite

```
npx vitest run

 Test Files  2 failed | 62 passed (64)
      Tests  2 failed | 1114 passed (1116)
```

The 2 failures are **pre-existing and unrelated** to this diff:
1. `scripts/__tests__/check-stories.test.ts` — `checksRan === 13` expects 13 governance checks but
   `check-stories.mjs` already has 14 (Check 14, "Mantine Button size=lg|xl", pre-dates this task) — a
   stale test-count assertion in a script this task never touched.
2. `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` — a TZ-invariance test that spawns a child
   process, timed out at 5000ms in this sandboxed environment (unrelated formatter subsystem, not
   touched by this diff).

## File-integrity transcript (clause 14)

```
$ node scripts/check-file-integrity.mjs
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 10 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 10 file(s) clean
```

Per-file spot check (NUL bytes, BOM, tail-not-truncated) on the 5 core touched files — all 0 NUL bytes,
no BOM (`ef bb bf`), tails end with the intended final token (`}`, `})`, `}`):

| File | NUL bytes | BOM | Tail intact | `tsc`/parse |
|---|---|---|---|---|
| `MantineCountButton.tsx` | 0 | none | `}` | tsc clean |
| `MantineCountButton.smoke.test.tsx` | 0 | none | `})` | tsc clean |
| `CountButton.stories.tsx` | 0 | none | `}` | tsc clean |
| `HeroSearchView.tsx` | 0 | none | `}` | tsc clean |
| `heroSearch.smoke.test.tsx` | 0 | none | `})` | tsc clean |

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineCountButton.tsx` | Added `iconOnlyBelow?: number` prop + `useMediaQuery`-driven collapse (label hidden below threshold, icon+badge kept, compact `xs` padding); unset renders byte-identically. |
| `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` | Added 6 new tests covering the collapse prop (unset guard, below/at-threshold, count=0 collapsed, touch target, onClick); planted-violation verified and reverted. |
| `src/stories/mantine/primitives/CountButton.stories.tsx` | Added a 4th `Stack` section inside `Default` demonstrating `leftSection`+`count`+`iconOnlyBelow={860}`; reused `count_button_label` i18n key, no new key. |
| `src/components/shared/HeroSearchView.tsx` | Replaced the raw filters `Button` + absolute corner `<span>` badge + `relative` wrapper + `hidden sm:inline` span with the canonical `MantineCountButton` (`iconOnlyBelow={860}`). |
| `src/components/shared/__tests__/heroSearch.smoke.test.tsx` | Rewrote the badge test for the new inline-descendant DOM shape; added a dedicated collapse-mechanism test (scoped `useMediaQuery` override); planted-violation verified and reverted. |
| `docs/critical-flow-registry.md` | Extended row 49 (Listings filter controls — leaf sub-components + shell) per agent-contract clause 15: Owner task, Flow, Happy/Failure path, Command, and Coverage cells all updated with Task 571's collapse behavior and test coverage. |

No `messages/*.json` changes — the existing `storybook.mantine.count_button_label` key was reused for
both the story's `children` and its new `aria-label` (all 4 locales already carry it, confirmed by
`check:i18n` parity staying at 2128 keys, unchanged).

## Self-validation

`Self-validation: tsc=0 errors · build=not run (non-trivial UI change but no build-affecting import/
route change; storybook build ran clean twice, both `build-storybook` invocations succeeded) ·
screenshots:assert --mantine-only=592 total/566 PASS/0 FAIL/26 ambiguous (pre-existing, unrelated) ·
AC table=all green (12/12) · runtime locale=uk PASS (rendered matrix confirms label collapse/expand +
aria-label + no h-scroll/overlap at uk@320/375/390/680/768/810/860/960/1024) · scope=clean (only the 6
files listed in "Files Changed" touched; confirmed via `check-file-integrity`'s 10-file git-changed
scope, which also includes 3 pre-existing untracked/modified files from before this session — not
edited by me — plus this session log itself)`
