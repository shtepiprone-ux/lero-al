# Task 577 — Header: use the ONE canonical adaptive `LocaleSwitcher` at all breakpoints (delete the redundant mobile combobox)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_577_MobileLocaleSwitcherPrimitive.md`.
Depends on Task 576 + Task 581 (both landed — rebased on the no-globe `LocaleSwitcher`).

## Why

The header shipped two locale switchers: the canonical `LocaleSwitcher` (`MantineDropdownMenu`) shown
only `≥640`, and a separate inline `MantineCombobox` shown only `320–639`. `LocaleSwitcher` is already
adaptive — its `MantineDropdownMenu` renders as a full-width bottom sheet at `<640` — so the second
implementation was redundant. This supersedes the earlier "extract a `MobileLocaleSwitcher` primitive"
plan: there is no second component to extract; there is now one switcher, used everywhere.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/Header.tsx` | Removed `className="hidden sm:flex"` from `<LocaleSwitcher>` so it renders at all breakpoints; deleted the entire `sm:hidden` `MantineCombobox` block + its comment; deleted the now-fully-unused `localeOptions` array AND `langLabels` (both had no other consumer once `localeOptions` was gone — `LocaleSwitcher.tsx` already builds its own internal `langLabels`); removed `MantineCombobox`/`MantineComboboxOption` from the `@/design-system/mantine/patterns` import and `LOCALES`/`LocaleCode` from the `@/components/shared/LocaleSwitcher` import (all now unused). `tc('aria_open_menu')` (hamburger) still uses `useTranslations('common')`, so that hook stays. |

No other file touched — `LocaleSwitcher.tsx`, `MantineCombobox.tsx`, `MantineDropdownMenu.tsx`,
`AdminLocaleSwitcher.tsx`, routing/`switchLocale`, `LOCALES`, and locale JSON are all untouched, per scope.

## Positive / Negative flow

- **Positive (live, dev server):** at 320 and at 1280, clicked the single switcher → SQ/EN/UA/IT list
  opened (bottom sheet at 320, anchored menu at 1280) → selected UA → confirmed URL navigated to `/uk`
  and the trigger re-rendered `UA` — full end-to-end `switchLocale` → `setAdminLocale` + `router.push`
  round-trip verified against the running app, not just a story.
- **Negative:** verified via the existing `Mantine/Primitives/LocaleSwitcher` story (unchanged, still
  covers pending/disabled+spinner and dismiss behavior) — this task didn't touch `LocaleSwitcher.tsx`
  itself, so its own negative-flow coverage (Task 576) still applies unchanged. Confirmed via live render:
  no duplicate switcher at any of the 7 canonical breakpoints × 4 locales (28 cells, see Verification), no
  horizontal scroll at 320 in any locale.

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/Header.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 113 files checked, 0 violations (560×4 parity, unchanged — no
  story files touched by this task).
- `npm run check:i18n` → **PASSED**, 2139 keys × 4 locales (no key change — icon/dedup change only).
- `npm run check:file-integrity` → **PASSED**, 16/16 changed files clean.
- **Live dev-server rendered check (this session, real Next.js app, not just Storybook):** booted `npm run
  dev` (port 3002, since 3000 was occupied), then a throwaway Playwright script (not committed) visited
  `/{locale}` for all 4 locales × the 7 canonical breakpoints (320/375/390/768/1280/1440/2560) = **28
  cells**, counting visible elements whose text matches the current locale's trigger abbreviation
  (`SQ`/`EN`/`UA`/`IT`): **all 28 cells → exactly 1 match, 0 horizontal-scroll, 0 console errors.** Plus 2
  interaction cells (320 mobile bottom sheet, 1280 desktop menu) both opened correctly
  (`role="dialog"`/`.mantine-Menu-dropdown` present). Screenshots manually reviewed:
  - `320/uk` (mandatory stress cell): header shows `Lero.al` — `UA ⌄` — hamburger, no globe, no clip.
  - `320` open state: full-width bottom sheet, drag handle, SQ/EN(bold)/UA/IT list.
  - `1280` open state: anchored dropdown menu under the `EN ⌄` trigger, Favorites/Login/Register/hamburger
    all present and unchanged, current locale (EN) bold.
  - End-to-end switch click (EN→UA) confirmed `router.push` to `/uk` and the trigger re-rendering `UA`.
  Dev server stopped after verification (orphaned port-6008 harness process from an earlier interrupted
  run was also found and cleaned up before the final gate re-run below).
- **`npm run build-storybook`** → rebuilt fresh, 0 errors (no story files changed by this task, but
  rebuilt to keep the gate run current).
- **`npm run screenshots:assert -- --mantine-only`** → **628 total / 602 pass / 0 FAIL / 26
  pre-existing-ambiguous** — byte-identical to the last known-good baseline (Task 576/581), confirming
  zero regression to any Mantine primitive story from this Header-only diff.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS — 1 switcher, no h-scroll | PASS | **PASS (mandatory, screenshot reviewed)** | PASS |
| 375 | PASS | PASS | **PASS (mandatory)** | PASS |
| 390 | PASS | PASS | **PASS (mandatory)** | PASS |
| 768 | PASS | PASS | PASS | PASS |
| 1280 | PASS | PASS (screenshot reviewed — anchored dropdown, no duplicate) | PASS | PASS |
| 1440 | PASS | PASS | PASS | PASS |
| 2560 | PASS | PASS | PASS | PASS |

All 28 cells: exactly one language-switcher trigger visible (the Task-574 one-switcher-per-breakpoint
human-eye cell), no horizontal scroll, no console errors — live-rendered against the real running app.

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `Header.tsx` renders a single `<LocaleSwitcher>` with no `hidden sm:flex`; `sm:hidden` combobox block + `localeOptions` deleted; no unused import/var remains | ✅ | diff; `tsc`=0/`eslint` clean confirm no unused-var/import leftovers |
| 2 | Exactly ONE language switcher at every breakpoint; `<640` full-width bottom sheet, `≥640` unchanged dropdown | ✅ | live rendered check, 28/28 cells, screenshots reviewed |
| 3 | Locale switching + `uk→UA` + pending/disabled behavior unchanged | ✅ | live end-to-end click test (EN→UA, URL + trigger text confirmed); `isPending`/dismiss behavior untouched (`LocaleSwitcher.tsx` not edited) |
| 4 | `tsc=0`/lint/`check:stories`/`check:i18n`/`screenshots:assert` green; file-integrity clean; Files-Changed table + AC audit in session log; no git commands | ✅ | see Verification — all green; this file |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (113/0, 560×4 parity unchanged), `check:i18n`=PASS
(2139×4), `check:file-integrity`=16/16 clean, fresh `build-storybook`=0 errors, `screenshots:assert
--mantine-only`=628/602/0/26 (byte-identical baseline, zero regression), live dev-server rendered
check=28/28 cells pass (exactly one switcher, no h-scroll, no console errors) + 2/2 interaction cells
(mobile bottom sheet + desktop menu open correctly) + live end-to-end locale-switch click verified. Git
NOT run by this session (single-writer rule) — Files Changed table above is for the user/orchestrator to
review before committing.

**Verdict: Task 577 is functionally complete and verified against the real running application**, not
just Storybook — the redundant mobile combobox is gone, the one canonical `LocaleSwitcher` now serves
every breakpoint, and the Task-574 one-switcher-per-breakpoint gate is proven at all 7 canonical
breakpoints × 4 locales.
