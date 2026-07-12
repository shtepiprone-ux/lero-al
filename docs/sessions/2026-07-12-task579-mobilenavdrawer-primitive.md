# Task 579 — `MobileNavDrawer` presentational primitive (hamburger drawer body)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_579_MobileNavDrawerPrimitive.md`.
Depends on Task 578 (landed as 578+585 combined commit).

## Why

The mobile hamburger drawer (`MantineDrawer` + body, `Header.tsx` ~157–251) — user header, nav
links, auth buttons, logout — was inline. Extracted into a controlled prop-driven `MobileNavDrawer`
primitive with fixtures for logged-in and logged-out.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/MobileNavDrawer.tsx` | **NEW.** Prop-driven controlled primitive (`opened`, `onClose`, `user`, `locale`, `onNavigate`, `onOpenAuth`, `onLogout`). Wraps `MantineDrawer` as-is (`side="right"`, `size="xs"`); reproduces the exact body: optional user header (Avatar 40 + name), nav links (`Home`/`Listings` + logged-in extras `Profile`/`My listings`/`Favorites`/`Add listing`), logged-out auth buttons (Login/Register/Register-as-agent, unchanged `@/components/ui/button` — no redesign), logged-in destructive Logout. Every action calls `onClose()` + its callback (`onNavigate`/`onOpenAuth`/`onLogout`). No `useRouter`/`signOut`/`window.*` inside. |
| `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` | **NEW.** Canonical location (`Mantine/Primitives/MobileNavDrawer`, `MantineStoryShell`, single `Default`), drawer rendered `opened` directly (no trigger — the harness's overlay-open-trigger set doesn't cover `MobileNavDrawer`, and the primitive is controlled with no built-in trigger). Renders the **logged-in** fixture only — see STOP-AND-ASK resolution below for why the logged-out fixture isn't also rendered open. |
| `src/components/layout/Header.tsx` | Removed the inline `MantineDrawer` body (~99 lines) and now-unused imports (`LogOut`, `Button`, `Avatar`, `MantineDrawer`); renders `<MobileNavDrawer opened={mobileOpen} onClose={() => setMobileOpen(false)} user={user} locale={locale} onNavigate={(path) => router.push(path)} onOpenAuth={openAuthSheet} onLogout={handleLogout} />` in place of it. Hamburger `ActionIcon` trigger unchanged (still sets `mobileOpen=true`, container-owned per STOP-AND-ASK #A default). Dropped the now-unused top-level `const t = useTranslations('nav')` (only used by the removed inline body; `NavLinks`'s own `t` is untouched). |
| `messages/{en,sq,uk,it}.json` | 1 new `storybook.mantine.mobile_nav_drawer_caption` key, full 4-locale parity (563 keys each, up from 562). |

**Not touched:** `MantineDrawer` (consumed as-is), `NavLinks` (stays module-level), routing/auth logic —
confirmed via diff scope and `check:file-integrity`.

## STOP-AND-ASK resolution — single open fixture, not two

The kickoff's "Story fixtures" section asked for a single `Default` showing the drawer **OPEN ×
logged-in AND OPEN × logged-out**. Before implementing that literally, I empirically tested it (ad
hoc Playwright probe against a throwaway build, not committed) because it looked like the same shape
of defect the orchestrator found and Task 585 just fixed for `UserMenu` (two independent
uncontrolled overlays open at once, overlapping). Result: **confirmed the same defect, worse** —
`MantineDrawer` is a `position:fixed` panel anchored to the same edge (`right:0` desktop) / the same
full-width bottom sheet (mobile) regardless of which fixture opens it, so two simultaneously-`opened`
instances render at the *identical* screen position; the second-mounted one completely hides the
first at every breakpoint tested (desktop-1024 and mobile-320 probed directly — screenshots showed
only the logged-out drawer, the logged-in drawer entirely invisible behind it).

Resolved the same way Task 585 resolved `UserMenu`: render **ONE** open fixture — logged-in, the
superset (user header + full nav + destructive Logout) — and verify the logged-out branch (nav +
Login/Register/Register-as-agent) by **code inspection** of `MobileNavDrawer.tsx`'s `{user ? … : …}`
conditionals, not by forking the primitive or stacking a second open overlay. Documented inline in
the story's file-level comment and in the `mobile_nav_drawer_caption` copy itself.

## Positive / Negative flow

- **Positive:** mobile `<640` (hamburger tapped) — full-width bottom sheet opens: logged-in shows
  user header, full nav (Home, Listings, Profile, My listings, Favorites, Add listing), destructive
  Logout; every entry closes the drawer and fires its callback (`onNavigate`/`onLogout`). Logged-out
  shows nav (Home, Listings) + Login/Register/Register-as-agent buttons; each closes the drawer and
  opens the `AuthSheet` in the right view via `onOpenAuth`. Byte-identical to pre-extraction behavior
  (diff-verified — same JSX/classes, only parameterized).
- **Negative:** logged-out never sees Profile/My listings/Favorites/Add listing/Logout (gated by
  `{user && …}`, verified by code inspection); the hamburger trigger and `mobileOpen` state stay
  container-owned (Header.tsx), matching STOP-AND-ASK #A's default; no `useRouter`/`signOut`/
  `window.*` call lives inside the primitive (verified via source — all side effects are callback
  props, called only on the container's behalf).

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/MobileNavDrawer.tsx src/components/layout/Header.tsx src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 115 files checked, 0 violations; `storybook.*` parity 563 keys × 4 locales (up from 562).
- `npm run check:i18n` → **PASSED**, 2142 keys × 4 locales.
- `npm run check:file-integrity` → **PASSED**, 8/8 changed/untracked files clean.
- **`npm run build-storybook`** → rebuilt fresh (lesson carried over from Task 585: always rebuild before asserting, a stale build gives false signals).
- **`npm run screenshots:assert -- --mantine-only`** (standing enforced gate): **660 total / 634 pass /
  0 FAIL / 26 pre-existing-ambiguous** — +16 new `MobileNavDrawer` cells over the 578+585 baseline
  (644/618/0/26), all 16 `verdict:"pass"`, zero regression elsewhere (same 26 ambiguous cells,
  identical Combobox/RangeDatePicker/Tabs set as before).
- Screenshots manually reviewed (`.screenshots/rendered-assert/2026-07-12T08-14/`):
  - `en`/`uk` desktop-1024: single clean side drawer, correct nav order (Home, Listings, Profile, My
    listings, Favorites, Add listing), destructive Logout in red, caption fully translated.
  - `uk` mobile-320/375/390 (mandatory stress cells): full-width bottom sheet, drag handle, Ukrainian
    caption + nav labels wrap correctly, no clip/horizontal scroll.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS | PASS | PASS (mandatory, screenshot reviewed — full-width, no clip) | PASS |
| 375 | PASS | PASS | PASS (mandatory) | PASS |
| 390 | PASS | PASS | PASS (mandatory, screenshot reviewed) | PASS |
| 1024 | PASS | PASS (screenshot reviewed — single clean side drawer) | PASS (screenshot reviewed) | PASS |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `MobileNavDrawer.tsx` prop-driven controlled drawer; every nav/auth/logout action closes + fires its callback | ✅ | diff — every handler calls `onClose()` + its callback |
| 2 | `Header.tsx` renders `<MobileNavDrawer/>`; hamburger trigger preserved; inline drawer body removed | ✅ | diff |
| 3 | `Mantine/Primitives/MobileNavDrawer` story, `MantineStoryShell`, single `Default`, drawer rendered `opened`, no hook mock, appears in `--mantine-only` sweep | ✅ | story file; manifest shows 16/16 `MobileNavDrawer` cells discovered + pass |
| 4 | Rendered matrix + full-width bottom sheet <640; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean | ✅ | see Verification + Rendered matrix above |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (115 files/0 violations, 563×4 parity),
`check:i18n`=PASS (2142×4), `check:file-integrity`=8/8 clean, fresh `build-storybook`=0 errors,
`screenshots:assert --mantine-only`=660/634/0/26 (+16 new `MobileNavDrawer` cells, all pass, zero
regression vs the 578+585 baseline). Git NOT run by this session (single-writer rule) — Files
Changed table above is for the orchestrator/owner to review before committing.

**Verdict: Task 579 is functionally complete and verified by every automated gate available in this
environment**, including standing (not throwaway) `Mantine/Primitives/MobileNavDrawer` coverage, and
a proactively-caught multi-overlay-stacking defect that was resolved before it ever reached the
rendered gate (verified empirically, not just by analogy to Task 585).
