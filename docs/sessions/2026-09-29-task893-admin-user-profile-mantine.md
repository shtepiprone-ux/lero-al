# Task 893 — `/admin/users/[id]` and `/admin/users/new` on canonical Mantine

Executor session, 2026-09-29. Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (owner matrix O84-2 owed). **Revision 1 (2026-09-30) appended at the end of this file.**
Kickoff: `tasks/Archive/Sprint_84_kickoff_prompt_Task_893_Admin_User_Profile_On_Mantine.md`. Evidence: `docs/sessions/evidence/task893/`.

## Files Changed

| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantineFormSectionStack.tsx`, `patterns/index.ts` | R1: `MantineFormSection` exported; the stack renders through it |
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | R2: `selectionMode?: 'range' \| 'single'` (default `'range'`, range path untouched) |
| `src/components/admin/useAdminAvatarUpload.ts` (new), `AdminUserAvatar.tsx` | R3a: logic moved, JSX byte-identical |
| `src/components/admin/AdminUserAvatarFieldView.tsx`, `AdminUserAvatarField.tsx` (new) | R3b |
| `src/components/admin/AdminUserProfileView.tsx`, `AdminUserProfileDialogsView.tsx` (new), `AdminUserProfile.tsx` | R4–R6 |
| `src/design-system/mantine/theme.ts`, both `page.tsx` | R8: `adminPageFormMaxWidth`, Mantine `Box` wrappers |
| 3 new + 2 extended Stories, `src/stories/fixtures/admin.fixtures.ts` (additions) | R7 |
| `AdminUserProfile.smoke.test.tsx` (new), `RangeDatePicker.smoke.test.tsx`, `RangeDatePickerLocalization.test.tsx` | R11, R2 |
| deleted: `shared/DatePicker.tsx`, `shared/__tests__/DatePicker.localization.test.tsx`, `admin/AdminUserProfile.stories.tsx` | R10 |
| `scripts/mantine-migration-scope.json`, `story-coverage-exempt.json`, `surface-census-baseline.json`, `check-stories-rendered.mjs` | R9/R10 |
| `docs/critical-flow-registry.md` (rows 46, 53, 62), `docs/backlog.md` (893 cell) | R10 / state |
| `docs/component-risk-register.md`, `docs/responsive-storybook-inventory.md` | **outside §7** — see Deviations |

Hashes: `evidence/task893/22-hash-object.txt`.

## Receipts

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
- GR-0 / GR-3a: re-verified at I0 against the source (EXTEND ×3, REUSE, COMPOSE; CREATE only for the three Views). New hardcoded visual values: NONE.
- GR-1: census before `02`, after `11`: no tier-2 node, no `AdminEditLayout`/`AdminInput`/`AdminUserAvatar`/`Combobox`/`DatePicker`. Three Views + `RangeDatePicker` are `manifest:yes story:yes`.
- GR-2: `check:story-coverage` inspects only enrolled files; it cannot see the containers. The containers are proven by T1–T9.
- GR-3: `AdminUserProfileView` ← `AdminUserProfileView.stories.tsx`; `AdminUserProfileDialogsView` ← its Story; `AdminUserAvatarFieldView` ← its Story; `MantineFormSection` ← `FormSectionStack.stories.tsx` (`Section`); `RangeDatePicker` ← `RangeDatePicker.stories.tsx` (`SingleDate*`).
- GR-3b / GR-3c / GR-3d: `24-gr3-receipts-en.txt` (all 31 Stories, `en`), `24-gr3-receipts-en-type.txt` (type, scoped selectors), plus `uk` overflow pass. No overflow at 320/390/768/1024/1440 in `en` or `uk`; Views 288/358/960/1376 of the viewport; edge gap 16/16/32/32 on every Story with the profile; dialogs are overlay-only. Type: title 20px, section header 16px, label 14px, history row 12px at every width; nothing at 24px or above.

## Commands (real exit codes, transcripts in the evidence folder)

I0: platform `win32 v22.22.3`; status clean; 877 archived and `adminPageMaxWidth` at `theme.ts:810`; baselines `04` (55 + 32 tests, exit 0).
Final tree: `10` tests 0 · `10b` test:admin 0 · `12` typecheck 0 · `13` lint 0 errors (118 pre-existing warnings, none in touched files) · `14` story-coverage 0 · `15` rendered-scope 0 · `16` census:changed 0 (`SURFACE_CENSUS_BASE_SHA=HEAD`) · `17`/`17b`/`17c` 0 · `18`/`18b` 0 · `19` build-storybook 0 · `19b` **build 0**.

## Plants (two-armed; hash pairs in the transcripts)

| Plant | Failed | Evidence |
|---|---|---|
| P1 blank-reason check removed (placed in the DialogsView, where the check lives) | T3 | `05` |
| P2 delete without dialog | T4 | `06` |
| P3 single mode falls back to `pickDay` | 2 single-mode tests | `07` |
| P4 `ui/badge` import re-added | census names it on both routes | `08` |
| P5 first-name label association removed | T1, T1 err, T6, T7, T9 | `09` |

Incident: my first re-run of the plant script crashed between plant and restore and left P1/P2/P3/P5 live in the tree. I detected it by hash, restored each by inverse edit, verified the hashes equal the pre-plant values, and rewrote the script with a `finally` restore. Plants were then re-run and recorded from the rewritten script. They ran before the final avatar-slot edit to the View/container; the restored hashes and the final green tests are on the final tree.

## Moved assertions

`DatePicker.localization.test.tsx` → `RangeDatePickerLocalization.test.tsx`, describe "single mode … ICU-independent": weekday row and month/year header for `sq` and `uk` with `Intl.DateTimeFormat` throwing. The "today label" assertion has no counterpart (the shortcut is gone, §5.3).

## Deviations, contradictions, limitations (for Opus)

1. **TASK SPECIFICATION CONTRADICTION — R9 "no key may be added".** R3b mandates a new container `AdminUserAvatarField.tsx`; the census cannot exempt a container (GR-1), so the baseline gains 2 keys (`[id]` and `new` × `AdminUserAvatarField`), and the census shows `AdminUserProfile.tsx` and `AdminUserAvatarField.tsx` as baselined `FAIL`s besides the root (AC7 says "only the root"). Removed keys: exactly the 26 legacy ones; `AdminUserProfile` keeps its 4. `20-baseline-diff.txt`. Decision needed: accept as baselined container debt (877's precedent) or restructure.
2. **Avatar as a slot.** `check:rendered-scope` failed on View → `AdminUserAvatarField` (a hook-bearing container inside a View). The View now takes `avatar: ReactNode`; the container passes `AdminUserAvatarField`. Same rendered result; the View is props-only; no rendered-scope baseline change.
3. **Docs outside §7**: two rows removed from `component-risk-register.md`; `RETIRED-893` markers in `responsive-storybook-inventory.md`; registry row 62 lost a deleted path. Needed for AC8. The literal `20b` command still matches history ledgers (weekly reports, `docs/reviews/**`, old sprint kickoffs, the entropy audit): `20b-reference-audit.txt`.
4. **Behaviours preserved on purpose**: a status-only change does not mark the form dirty (legacy `setValue('status')` had no `shouldDirty`), so Save stays disabled until another field changes; `yearStarted` empty yields `NaN` as `valueAsNumber` did.
5. **Visible changes beyond §9**: avatar is Mantine `xl` (84px, was 96px), stacked buttons and `min-content` column; email and website truncate with a `title` (no Mantine prop for `break-all`).
6. `AvatarCropModal` remains dynamic-imported (census blind spot, as designed).
7. Four sprint kickoffs (and later 857–859, 894–896) appeared untracked in `tasks/Sprints/` during the session from other work; not touched.
8. **Environment**: `npm run build` needed `.next`, held by the owner's `next dev` (PID 27000). With the owner's explicit answer, I stopped only that PID. The Storybook dev server (PID 38412) was left running. The owner restarts `npm run dev`.

## Owed

**O84-2** owner visual matrix (§13.4, 72 tuples). The rendering was self-checked only through screenshots in `evidence/task893/shots/` and the measurements above.

---

## Revision 1 — 2026-09-30 (kickoff §17, remediation; evidence `docs/sessions/evidence/task893/r1-*`)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Start tree = review 1 (container `f787f90a` confirmed). I0, baselines, R9 and P1–P5 not re-run, as §17.1 says.

### Files Changed (revision 1)

| Path | Change | blob hash after |
|---|---|---|
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | R12 `onDropdownOpen` calls `updateSelectedOptionIndex('active', { scrollIntoView: true })`; R13 ref on the current value's sheet button and `scrollIntoView({ block: 'center' })` when the sheet opens | `00b5212c` |
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | R14: `triggerAriaLabel={t('period_year')}` on the desktop year combobox (one prop) | `692f8707` |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` | R15: T-C1, T-C2, T-C3 | `c3a06539` |
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | **outside §17.3's write set**: a jsdom `scrollIntoView` stub (deviation 1) | `7629f47c` |
| `src/components/admin/AdminUserProfile.tsx` | R17: `FIELD_OPTIONS.status` = `{ shouldDirty: true }` (one line) | `b418f35d` |
| `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` | R17: T10, T10b; T2's type-and-clear workaround removed | `da6895cb` |
| `docs/critical-flow-registry.md` | row 47: T10/T10b command and coverage text | `ddaf47db` |
| `docs/backlog.md` | the 893 cell only | — |

### Results (real exit codes in the r1 transcripts)

- R12–R17 implemented. `r1-tests` 6 files / 91 tests exit 0; `r1-test-admin` 0; typecheck 0; lint 0 errors; story-coverage 0; rendered-scope 0; design-tokens 0; enrolled-tailwind 0; file-integrity 0; mojibake 0; build-storybook 0; **build 0**. The build ran after the last production-code edit; the only later edit is the test stub in deviation 1, after which typecheck, lint, file-integrity and mojibake were re-run (all 0).
- `check:surface-census:changed` exit 0 with `SURFACE_CENSUS_BASE_SHA=HEAD` (0 new blocks, 0 stale). The bare command exits 1 (`--base <ref> is required`) in this shell; the first-run evidence had the base set the same way.
- Plants (blob hashes equal before and after restore): **P6** `status: {}` fails T10, T10b and T2 (the planted container hash is `f787f90a`, the review-1 file, so the diff is exactly one line); **P7** no `onDropdownOpen` fails T-C1; **P8** no sheet scroll fails T-C2. Transcripts `r1-plant-p6/p7/p8.txt`.
- `r1-year-reach.txt` (Chromium on the fresh `storybook-static`, `sq`): at 1440 the SingleDate year list opens at `scrollTop 26` with 2026 inside the 220px box, and 2036 is reachable; the desktop year trigger has `aria-label` `Viti` (R14). At 390 the sheet shows 2026 inside its visible area. **`Combobox--default` was not measured as worded**: its lists have 6 options and no preset value, so nothing scrolls there (reason in the file).

### Deviations for Opus

1. **Regression caught by the existing suite.** R12 makes Mantine call `scrollIntoView` in a timer; jsdom lacks it, so `filtersRangeDatePicker.smoke.test.tsx` reported an unhandled error (all tests green, run exit 1). Fix: a one-line `Element.prototype.scrollIntoView = vi.fn()` in that file's `beforeAll`, a file outside §17.3's write set. No production code was guarded for jsdom.
2. **T-C1 wording.** §17.3 asks the 12th option to carry `data-combobox-selected`. Mantine's own `Select` pattern, which R12 prescribes, does not set it: `updateSelectedOptionIndex('active', …)` only syncs the index and scrolls. T-C1 asserts `data-combobox-active` plus the `scrollIntoView` call on that option inside `.mantine-Combobox-options`.
3. **Mobile sheet.** With 16 options the sheet is 700px high and its content 704px, so it barely scrolls; 2026 is visible with or without R13. R13 matters for the ~80-year `YearCombobox` sheet, proven by T-C2 and P8 only.
4. **Existing behaviour visible in T10:** after blocked → active the payload still carries the stored `suspendedUntil` (`2026-12-31`) and an empty `blockReason`; the container never cleared the date, and R17 forbids changing anything else. Whether the server ignores it is untested here.
5. `r1-status-after.txt` lists the whole dirty tree (other work included). This revision touched nothing outside §17.3 plus deviation 1.

### Owed

**O84-2 remainder** (§17.6): `Mantine/Primitives/RangeDatePicker` `SingleDate` / `SingleDateSelected` (sq, en × 390, 1440; open the year list) and `Mantine/Primitives/Combobox` `Default`. The live check gains one step: unblock the test user with the status select alone.

---

## Revision 2 — 2026-09-30 (kickoff §19, remediation; evidence `docs/sessions/evidence/task893/r2-*`)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Start tree = review 2. `01`–`24` and `r1-*` kept.

### Files Changed (revision 2)

| Path | Change | blob hash after |
|---|---|---|
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | R18, `MobileBody` only: a `windowAnchor` state (starts at `anchorMonth`) builds the month window; `jumpTo` re-anchors it for an out-of-window month, and a layout effect scrolls to that month once rendered. A moved window starts 12 months before the target (clipped to `minDate`) so the 60-month cap cannot cut it off | `7fd34906` |
| `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` | R19: T-M1…T-M5 | `274926d3` |
| `src/components/admin/AdminUserProfile.tsx` | comment only (`FIELD_OPTIONS`, review-2 P3 note) | `ef9d04c2` |
| `docs/backlog.md` | the 893 cell only | — |

### Results

- Gates, all exit 0 on the final tree: `r2-tests` (6 files, 96 tests), `test:admin`, typecheck, lint, story-coverage, rendered-scope, census-changed (with `SURFACE_CENSUS_BASE_SHA=HEAD`), design-tokens, enrolled-tailwind, file-integrity, mojibake, build-storybook, **build**. The build ran after the last source edit.
- **P9** (silent `return` restored): T-M1, T-M2, T-M3 and T-M4 fail; T-M5 passes (the in-window control). Blob hashes equal before and after restore (`r2-plant-p9.txt`). §19.3 expected T-M1, T-M2, T-M4; T-M3 fails too because it needs the same jump.
- `r2-year-select.txt` (Chromium, fresh `storybook-static`, `uk`), what was **selected**:
  - `SingleDate` at 320: year 2030, then a 2030 day, then Confirm, and the trigger shows `01.01.2030`. At 1440: 2030 selected, the field reads 2030.
  - `Default` first (uncapped) row trigger at 1440: 2030 selected.
  - capped instance at 320: 2022 lands in 2022.

### Deviations for Opus

1. **`Default` at 320 renders only its forced-open instance, which has `maxDate`.** 2030 is not offered there by design, so §19.4's "`Default` at 320, choose 2030" cannot be done. The owner's screenshot of `Default`'s mobile sheet therefore shows a capped list. The uncapped phone case is `SingleDate`. No `maxDate` was changed.
2. An extra `windowStart` rule (moved window with `minDate` set) is not in R18's text; it stops the 60-month cap from cutting a far target. No test covers that branch.
3. The mobile tests stub `Element.prototype.scrollIntoView` (R13 calls it inside the sheet).

### Owed

**O84-2 remainder** (§19.5): `Mantine/Primitives/RangeDatePicker` `SingleDate`, `SingleDateSelected`, `Default` in `uk`/`en` at 320 and 1440; choose a year after 2026 and confirm a day (in `Default` at 320 that year is not offered; see deviation 1).

---

## Revision 3 — 2026-09-30 (kickoff §20, remediation; evidence `docs/sessions/evidence/task893/r3-*`)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Start tree = review 3 (`RangeDatePicker.tsx` `7fd34906`, smoke test `274926d3`, `AdminUserProfile.tsx` `ef9d04c2`, all equal to `r2-hash-object.txt`). `01`–`24`, `r1-*`, `r2-*`, `review3-*` kept.

GR-0 receipt: request header follows scroll after a window shrink (R20) + T-M6/T-M7; decision EXTEND; owner `patterns/RangeDatePicker.tsx`; new hardcoded visual values NONE. GR-3a: REUSE of `mantine-primitives-rangedatepicker`, no Story write (§20.3).

### Files Changed (revision 3)

| Path | Change | blob hash after |
|---|---|---|
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | R20: `handleScrollPositionChange` reads section tops from `sectionRefs.current.slice(0, months.length)` (one expression, plus a comment) | `479c42bf` |
| `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` | R21: T-M6 (shrink) and T-M7 (`disablePastDates`, `minDate` branch) inside the existing R18/R19 `describe` | `b330563e` |
| `docs/backlog.md` | the 893 cell only | — |

### Results (the real exit code is the last line of each `r3-*` transcript)

- Tests: `r3-tests` 6 files / 98 tests, exit 0 (T-M1…T-M7 pass, T-M1–T-M5 unchanged). `r3-test-admin`, typecheck, lint, story-coverage, rendered-scope, census-changed (`SURFACE_CENSUS_BASE_SHA=HEAD`), design-tokens, enrolled-tailwind, file-integrity, mojibake, build-storybook and **build** all exit 0. The build ran after the last source edit.
- **P10** (tops from the full `sectionRefs.current`): T-M6 fails (1 failed, 46 skipped); after the restore it passes. **P11** (a moved window starts at `minDate` again): T-M7 fails; after the restore it passes. Blob hash before and after the restore is `479c42bf…` in both, and the planted hashes differ (`r3-plant-p10.txt`, `r3-plant-p11.txt`). Node I/O; hashes computed in Node with the blob algorithm.
- `r3-header-follow.txt` (Chromium, fresh `storybook-static`, `uk`, 320): forced-open capped instance, choose 2022, then 2026, scroll up ~700px → header `Жовтень 2025`, identical to the no-jump control; the pre-fix fallback reads `Січень 2026`. Every `Default` instance at 320 accepts its last offered year; instance 3 (`disablePastDates`) reaches `2036`.

### Deviations for Opus

1. T-M6 asserts the month trigger reads `February` under the `en` test messages (`fireEvent.scroll` on `.mantine-ScrollArea-viewport`; in jsdom the "at the end" rule answers the last rendered section). The harness delivered the scroll callback, so `BLOCKED — T-M6 HARNESS` did not apply.
2. The "first visible section" probe in `r3-header-follow.txt` reads `Листопад 2025 р.` while the header reads `Жовтень 2025`: the same pair in the jump run and in the no-jump control, so the offset rule itself is unchanged by R20.
3. The Playwright probe scripts lived in the scratchpad and are not committed; the transcript holds the measured values.
4. The plants ran through a Node script that computes the hashes itself, because the repository's command gate rejects a shell script that shells out to the version-control CLI.

### Owed

**O84-2 remainder** (§20.5, 12 tuples): `Mantine/Primitives/RangeDatePicker` `SingleDate`, `SingleDateSelected` and `Default` (row 1; Escape first at 320), `uk`/`en`, 320 and 1440. Reload with Ctrl+Shift+R first. Choose a year after 2026, pick a day, Apply/Confirm; at 320 also scroll the list after the jump.
