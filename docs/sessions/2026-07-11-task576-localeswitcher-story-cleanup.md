# Task 576 — `LocaleSwitcher` Mantine story + inert-prop cleanup + restore Admin QA evidence

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_576_LocaleSwitcherStoryAndCleanup.md`.
Plan: `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`. Depends on Task 575 (landed).

## Why

Post-574, `LocaleSwitcher` was already prop-driven but had no Storybook story of its own, and still
carried three inert props (`align`, `side`, `defaultOpen`) kept only so the out-of-scope
`AdminLocaleSwitcher.tsx` compiled. This task gives `LocaleSwitcher` its own canonical Mantine story
(following the Task 575-corrected `Mantine/Primitives/*` location pattern), removes the dead props, and
restores `AdminLocaleSwitcher.stories.tsx`'s `MobileBottomSheet` open-state QA evidence via a real
interaction instead of `defaultOpen`.

## Current behavior preserved / required after-behavior

- Header + Admin usages of `LocaleSwitcher` render identically — no product behavior change.
  `align`/`side` removal is a practical no-op (Mantine's own `bottom-start` + auto-flip was already
  the actual behavior; the props were never wired to anything after Task 574). `defaultOpen` was
  QA-only and already inert since Task 574.
- `AdminLocaleSwitcher` keeps all 3 of its stories; `MobileBottomSheet` again demonstrates the OPEN
  full-width bottom sheet — now via a Storybook `play` interaction (real click), not a forced prop.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/LocaleSwitcher.tsx` | Removed the now-dead `align`/`side`/`defaultOpen` from `LocaleSwitcherProps` (were already unused in the destructured params since Task 574 — pure interface cleanup, zero behavior change). |
| `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` | **NEW.** Canonical location (`Mantine/Primitives/LocaleSwitcher`, `MantineStoryShell`, single `Default`) per the Task-575-corrected story-location gate. Stacks 3 fixtures — default trigger, `showLabel`, `isPending` (disabled + spinner) — captions via `storyT()`, per-locale via the existing toolbar (no new render logic — `LocaleSwitcher` already reads `useLocale()` from the global `NextIntlClientProvider` decorator). |
| `src/components/admin/AdminLocaleSwitcher.tsx` | Dropped the `AdminLocaleSwitcherProps`/`defaultOpen` wrapper prop entirely (function now takes no params); stopped passing `align`/`side`/`defaultOpen` to `LocaleSwitcher` (props no longer exist) — kept `onSwitch`/`isPending`/`showLabel`/`className`. Sidebar behavior (menu auto-flip, `setAdminLocale` → `router.refresh()`) unchanged — `AdminSidebar.tsx` already calls `<AdminLocaleSwitcher />` with no props, so no consumer-side change needed. |
| `src/components/admin/AdminLocaleSwitcher.stories.tsx` | `MobileBottomSheet` story: removed `defaultOpen`; added a `play` function (`within(canvasElement)` + `userEvent.click` on the trigger, `storybook/test` — same pattern as `AdminListingsTable.stories.tsx`'s existing `PreviewDialogSoldStatusActions` play function) that performs a real click, which bubbles to `MantineDropdownMenu`'s mobile wrapper (`Box onClick={() => openDrawer()}`) and opens the bottom sheet exactly as a real tap would. |
| `messages/{en,sq,uk,it}.json` | 3 new `storybook.mantine.locale_switcher_{default,showlabel,pending}_caption` keys, full 4-locale parity (560 keys each, up from 557). |
| `scripts/check-stories-rendered.mjs` | Added `mantine-primitives-localeswitcher--default` to `LOADER_ALLOWLIST` — same class of false-positive as the existing `Button`/`Progress` entries: the `isPending` fixture permanently renders a disabled trigger with a `Loader2 animate-spin` icon, which is an intentional static comparison state (not a transient loading state), so the harness's "loader still present at readiness timeout" check can never resolve `loaderPresent:false` for this story. Manually verified via rendered screenshots (see Verification) before allowlisting, mirroring Task 542's own precedent for the Progress entry. |

## Positive / Negative flow

- **Positive:** `LocaleSwitcher` renders its Mantine `Button` trigger identically in the Header and
  Admin sidebar; `AdminLocaleSwitcher`'s `MobileBottomSheet` story now shows the OPEN bottom sheet
  (drag handle, current locale bold, all 4 locale rows) after the `play` click, matching the pre-574
  `defaultOpen` rendering exactly.
- **Negative:** no interactive/negative branches were added or removed by this task (pure prop/story
  cleanup) — `isPending`'s existing disabled-trigger behavior (no click while pending) is unchanged and
  is one of the 3 stacked story fixtures.

## STOP-AND-ASK resolution

- **#A (play/interaction reliability under `screenshots:assert`):** verified directly — a dedicated
  one-off Playwright check against the fresh `storybook-static` build navigated to
  `admin-adminlocaleswitcher--mobile-bottom-sheet` and confirmed the `play` function's click
  synchronously opens the sheet (`role="dialog"`/Drawer content present, 0 console errors, correct
  full-width/drag-handle/locale-list rendering — screenshot manually reviewed). `MobileBottomSheet` was
  never in `ASSERT_STORIES` (confirmed by grep — only `admin-adminlocaleswitcher--default` is), so this
  restores the intended visual-QA evidence without needing to escalate; no `defaultOpen`/controlled-mode
  was re-added.

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/shared/LocaleSwitcher.tsx src/components/admin/AdminLocaleSwitcher.tsx src/components/admin/AdminLocaleSwitcher.stories.tsx src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 113 files checked, 0 violations; `storybook.*` parity 560 keys × 4 locales (up from 557).
- `npm run check:file-integrity` → **PASSED**, 15/15 changed files clean.
- **Dedicated one-off check** (`admin-adminlocaleswitcher--mobile-bottom-sheet`, fresh build, mobile-320,
  en): play-interaction opens the sheet — `role="dialog"`/Drawer content found, 0 console errors, body
  text includes all 4 locale abbreviations. Screenshot manually reviewed: full-width edge-to-edge sheet,
  drag handle, current locale (EN English) bold — correct.
- **`npm run build-storybook`** → rebuilt fresh; `storybook-static/index.json` confirms
  `"id":"mantine-primitives-localeswitcher--default"` (title `Mantine/Primitives/LocaleSwitcher`) and
  `"id":"admin-adminlocaleswitcher--mobile-bottom-sheet"` both indexed.
- **`npm run screenshots:assert -- --mantine-only`** (standing enforced gate):
  - First run (before the `LOADER_ALLOWLIST` fix): **628 total / 586 pass / 16 FAIL / 26 ambiguous** — all
    16 fails were `mantine-primitives-localeswitcher--default` cells, `failReason: "loader-only"`
    ("spinner/loader still present at readiness timeout"), caused by the permanent `isPending` spinner
    fixture. Manually reviewed the captured screenshots for all 16 cells (desktop-1024 + the uk@320
    mandatory stress cell shown below) — all 3 stacked fixtures render correctly, no clip/overflow, no
    actual defect — a false-positive of the same class Task 542 already fixed for `Progress`.
  - After adding the allowlist entry: **628 total / 602 pass / 0 FAIL / 26 pre-existing-ambiguous** — the
    LocaleSwitcher's 16 cells now all `verdict:"pass"`; net +16 cells over Task 575's 612/586/0/26
    baseline, zero regression, zero new ambiguous.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS | PASS | PASS (mandatory stress, screenshot reviewed — full-width triggers, no clip) | PASS |
| 375 | PASS | PASS | PASS (mandatory stress) | PASS |
| 390 | PASS | PASS | PASS (mandatory stress) | PASS |
| 1024 | PASS (screenshot reviewed — 3 stacked fixtures, correct chrome) | PASS | PASS | PASS |

`AdminLocaleSwitcher`'s existing `Default`/`LocaleStress` stories are unaffected (no prop/behavior change
on `AdminLocaleSwitcher` beyond dropping the dead `defaultOpen` param); `MobileBottomSheet` verified
separately above since it isn't part of the `ASSERT_STORIES`/`--mantine-only` machine sweep (same as
before this task — it was never wired into either).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `LocaleSwitcher.tsx` no longer declares `align`/`side`/`defaultOpen` | ✅ | diff — `LocaleSwitcherProps` now only `onSwitch`/`isPending`/`showLabel`/`className` |
| 2 | `AdminLocaleSwitcher.tsx` no longer passes them; sidebar behavior preserved | ✅ | diff; `AdminSidebar.tsx` call site unchanged (already prop-less) |
| 3 | `Mantine/Primitives/LocaleSwitcher` story, `MantineStoryShell`, single `Default`, default/showLabel/isPending fixtures, no hook mock, appears in standing `--mantine-only` sweep | ✅ | story file; `index.json` + manifest confirm auto-discovery, 16/16 pass |
| 4 | `AdminLocaleSwitcher` `MobileBottomSheet` shows OPEN sheet via interaction, no `defaultOpen` | ✅ | diff (play function); dedicated rendered check confirms sheet opens, screenshot reviewed |
| 5 | `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean | ✅ | see Verification — all green, 628/602/0/26 final |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (113 files/0 violations, 560×4 parity),
`check:file-integrity`=15/15 clean, fresh `build-storybook`=0 errors, `screenshots:assert
--mantine-only`=628/602/0/26 (+16 new `LocaleSwitcher` cells over Task 575's baseline, all pass after
the `LOADER_ALLOWLIST` fix, zero regression elsewhere). Git NOT run by this session (single-writer
rule) — Files Changed table above is for the user/orchestrator to review before committing.

**Verdict: Task 576 is functionally complete and verified by every automated gate available in this
environment**, including the standing (not throwaway) `Mantine/Primitives/LocaleSwitcher` coverage and
a manually-reviewed rendered confirmation of the restored `AdminLocaleSwitcher` bottom-sheet QA evidence.
