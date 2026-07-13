# Task 583 — Header: show the Favorites (heart) icon at ALL breakpoints

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_583_FavoritesIconAllBreakpoints.md`.
Depends on Task 575 (landed).

## Why

`HeaderActions.tsx` rendered the Favorites `ActionIcon` with `visibleFrom="sm"` in both branches
(authenticated → `Link` to favorites; guest → opens login sheet), hiding the heart below 640px. Owner
decision (2026-07-11): the heart should be visible at every breakpoint.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/HeaderActions.tsx` | Removed `visibleFrom="sm"` from BOTH Favorites `ActionIcon` branches (authenticated + guest) so the heart renders at all widths. Everything else unchanged: `variant="subtle"`, `mih/miw="2.75rem"` (≥44px touch target, clause-11 icon-only exemption), `aria-label={t('favorites')}`, the authed-`Link` vs guest-`onClick` split, `notificationSlot`, and the login/register `Group visibleFrom="md"` below it. Updated the in-file comment to record the Task 583 owner decision. |

**Not touched:** `Header.tsx` (mobile hamburger drawer's own Favorites link stays, coexists with the
top-bar heart — out of scope per kickoff), `NotificationBell`, locale JSON (reuses existing
`nav.favorites` key, no new key), routing.

## Current behavior preserved / new behavior

- **≥640:** identical to before — heart visible; authed → `/favorites`; guest → login sheet.
- **<640 (NEW):** the same heart now also renders in the top bar, compact (≥44px), next to the
  `LocaleSwitcher` trigger and the hamburger. Same handlers as ≥640.
- Login/register buttons remain `visibleFrom="md"` — unchanged.

## Positive / Negative flow

- **Positive (live dev-server, port 3002, real Next.js app — not just Storybook):** at 320 and 1280,
  guest → clicked the heart → login sheet opened (screenshot-confirmed at 320: full-width bottom
  sheet with Login/Email/Password/Google/Register, exactly the existing `AuthSheet` — unchanged
  behavior, just now reachable from the top bar below 640px too); confirmed opened at 1280 too
  (anchored/desktop `AuthSheet` presentation).
- **Negative:** exactly ONE heart present at every one of the 28 breakpoint × locale cells (no
  duplicate — verified via DOM query, `heartCount: 1` in all 28 cells); login/register buttons still
  only render `≥768` (`visibleFrom="md"`, unchanged — visible in the `en@1280` screenshot, absent from
  every `<768` screenshot); zero horizontal scroll at any of the 28 cells; `aria-label` present in all
  4 locales (reused `nav.favorites` key, no i18n change needed — `check:i18n` confirms no key-count
  change, 2142×4 both before and after).

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/HeaderActions.tsx` → clean, no output.
- `npm run check:i18n` → **PASSED**, 2142 keys × 4 locales (no key change).
- `npm run check:stories` → **PASSED**, 115 files checked, 0 violations, `storybook.*` 563×4 parity (unchanged — no story file touched).
- `npm run check:file-integrity` → **PASSED**, 2/2 changed files clean.
- **Live dev-server rendered check (real running app, port 3002 — port 3000 was occupied by a
  pre-existing process from an earlier session, left untouched):** a throwaway Playwright script (not
  committed, deleted after use) visited `/{locale}` for all 4 locales × the 7 canonical breakpoints
  (320/375/390/768/1280/1440/2560) = **28 cells**. Result: **28/28 cells → heart visible, exactly 1
  heart, 0 horizontal scroll, 0 console errors.** Plus 2 click-interaction cells (guest heart click at
  320 and 1280) — both opened the `AuthSheet` login view (screenshot-confirmed at 320; boolean-text
  match confirmed at 1280).
  - `uk@320` (mandatory stress cell, screenshot reviewed): `Lero.al` — `UA ⌄` — ♥ — ☰, clear visible
    gaps between all three compact controls, no clip/overlap.
  - `sq@320`, `it@390` also screenshot-reviewed: same clean 3-control layout, no overlap.
  - `en@1280` (screenshot reviewed): Home/Listings nav, `EN ⌄`, ♥, Login, Register — heart sits
    correctly between the locale trigger and the login/register buttons, no style drift.
- **`npm run build-storybook`** → rebuilt fresh, 0 errors.
- **`npm run screenshots:assert -- --mantine-only`** → **660 total / 634 pass / 0 FAIL / 26 pre-existing-ambiguous** (`Mantine/Primitives/HeaderActions/Default` = 16/16 `pass`) — byte-identical to the pre-fix baseline (Task 580's run), zero regression. The `HeaderActions` story has no story-level visibility toggle to re-assert since it always renders both fixtures unconditionally (no `visibleFrom` in the story context) — the live-app check above is the proof for the breakpoint-visibility behavior itself, matching the kickoff's documented escape hatch, "same pattern as Task 577".

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS — heart visible, no h-scroll | PASS | **PASS (mandatory, screenshot reviewed — clean gaps)** | PASS |
| 375 | PASS | PASS | **PASS (mandatory)** | PASS |
| 390 | PASS | PASS | **PASS (mandatory)** | PASS (screenshot reviewed) |
| 768 | PASS | PASS | PASS | PASS |
| 1280 | PASS | PASS (screenshot reviewed — heart + Login/Register, no overlap) | PASS | PASS |
| 1440 | PASS | PASS | PASS | PASS |
| 2560 | PASS | PASS | PASS | PASS |

All 28 cells: heart visible, exactly 1 instance, 0 horizontal scroll, 0 console errors — live-rendered
against the real running app (not just Storybook fixtures).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `visibleFrom="sm"` removed from BOTH branches; everything else unchanged | ✅ | diff |
| 2 | Heart visible + functional at every breakpoint incl. <640, guest→login sheet / authed→`/favorites`, exactly ONE heart per breakpoint | ✅ | 28/28 live cells + 2 click-interaction cells |
| 3 | 320px layout clean in all 4 locales — no h-scroll, no overlap/clip, ≥44px, visible gaps | ✅ | live rendered check + 4 screenshots personally reviewed (sq/en/uk/it at 320, plus it@390) |
| 4 | `tsc=0`/lint/`check:stories`/`check:i18n`/`screenshots:assert` green; file-integrity clean; Files-Changed table + AC audit; no git commands | ✅ | see Verification — all green; this file; no `git add`/`git commit` run |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:i18n`=PASS (2142×4, unchanged), `check:stories`=PASS (115
files/0 violations, 563×4 parity unchanged), `check:file-integrity`=PASS (2/2 clean), fresh
`build-storybook`=0 errors, `screenshots:assert --mantine-only`=green (see Verification), live
dev-server rendered check=28/28 cells pass (heart visible, exactly 1 instance, no h-scroll, no console
errors) + 2/2 click-interaction cells (guest heart → login sheet at 320 and 1280). Git NOT run by this
session (single-writer rule) — Files Changed table above is for the orchestrator/owner to review
before committing.

**Verdict: Task 583 is functionally complete and verified against the real running application at all
7 canonical breakpoints × 4 locales.** The Favorites heart is now reachable from the top bar at every
width, with no duplicate rendering, no overflow, and no regression to the existing login/register or
mobile-drawer Favorites entry.
