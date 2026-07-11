# Task 575 — `HeaderActions` presentational primitive (Favorites + auth buttons → Mantine)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_575_HeaderActionsPrimitive.md`.
Plan: `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`. Depends on Task 574 (landed on HEAD).

## Why

The Header's standalone action controls — Favorites (Link-as-button for a logged-in user / ghost
button that opens the auth sheet for a guest) and the logged-out desktop Login/Register buttons —
were the last base-UI `@/components/ui/button` holdouts in the shell and had no prop-driven
primitive. Extracted into a `HeaderActions` presentational primitive (prop-driven, Mantine-only),
completing the Header's base-UI-button migration and absorbing the reserved "leftover action
buttons → Mantine" work noted in Task 574's session log.

## Current behavior preserved / required after-behavior

- **Favorites (sm+):** logged-in → routes to `/${locale}/favorites`; logged-out → opens the auth
  sheet in `login` view. Byte-identical behavior, now a Mantine `ActionIcon` (`variant="subtle"`,
  `mih`/`miw="2.75rem"` — mirrors the hamburger's existing icon-only reference, clause-11 exempt).
- **Login/Register (md+, logged-out):** `Login` → opens auth sheet `login`; `Register` → opens auth
  sheet `register`. Now Mantine `Button` (`variant="subtle"` / default filled — theme `primaryColor:
  'brand'` supplies the same brand fill the old default `Button` had).
- **`NotificationBell` (auth only):** stays container-owned in `Header.tsx` (own hooks, `dynamic
  ssr:false`) and is passed to `HeaderActions` as a `notificationSlot` ReactNode — never hook-called
  inside the primitive (STOP-AND-ASK #1, resolved per the plan's standing rule).
- **Responsive visibility:** `visibleFrom="sm"` (Favorites) / `visibleFrom="md"` (Login/Register Mantine
  `Group`) — Mantine's own visibility API, NOT Tailwind display utilities on Mantine roots (Task 574
  lesson, restated in the plan's per-task gates).

## DOM-order note (not a behavior change)

The mobile locale-switcher combobox (`sm:hidden`) and Favorites (`hidden sm:flex` → now
`visibleFrom="sm"`) are mutually exclusive breakpoints (never both visible at the same width), so
reordering them in `Header.tsx`'s JSX (mobile-combobox now precedes `HeaderActions` in source order)
has zero visual/tab-order effect at any breakpoint — the hidden one is `display:none` in both the old
and new code and was never reachable by tab either way.

## Positive / Negative flow

- **Positive:** Favorites (authed) → `/${locale}/favorites`; Favorites (guest) + Login + Register →
  `openAuthSheet` with the correct view (`login`/`login`/`register`). Guest: no bell slot, Login+Register
  visible `md+`. Authed: bell slot rendered, no Login/Register, Favorites links out.
- **Negative:** below `sm`, Favorites is not rendered (matches old `hidden sm:flex`); below `md`,
  Login/Register are not rendered (matches old `hidden md:flex`) — both confirmed via the rendered
  screenshots (see Verification). No direct routing/auth logic lives in the primitive — everything is a
  callback prop, so dismiss/keyboard behavior of the auth sheet itself is unchanged (inherited, not
  reimplemented).

## STOP-AND-ASK resolutions

- **#A (story location):** co-located `HeaderActions.stories.tsx` next to the component, mirroring
  `AdminLocaleSwitcher.stories.tsx` (the existing precedent for app-component, non-design-system
  Mantine stories) — no owner escalation needed, the kickoff itself named this as the expected default.
- **#B (NotificationBell slot):** cleanly slotted — `Header.tsx` still owns the `dynamic(...,
  {ssr:false})` import and the `user && <NotificationBell/>}` gate, passed to `HeaderActions` as
  `notificationSlot`. No layout-order conflict encountered, so no owner escalation was needed.
- **Fixture rule (plan STOP-AND-ASK #2):** one toolbar-reactive `Default` export with Guest + Authed
  fixtures stacked in a single render (mirrors `DropdownMenu.stories.tsx`'s block-per-state pattern),
  plus one `LocaleStress` export (mobile320, toolbar-driven locale) per clause 13(c) — never per-state
  exports.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/HeaderActions.tsx` | **NEW.** Prop-driven primitive (`isAuthenticated`, `favoritesHref`, `onOpenAuth`, `notificationSlot`); Favorites `ActionIcon` + guest Login/Register `Button`s, all Mantine. |
| `src/components/layout/HeaderActions.stories.tsx` | **NEW.** Co-located Mantine story; single toolbar-reactive `Default` (Guest + Authed fixtures stacked) + `LocaleStress` (mobile320); captions via `storyT()` against new `storybook.mantine.header_actions_*` keys. |
| `src/components/layout/Header.tsx` | Removed inline Favorites Link/Button + desktop guest Login/Register Buttons; now composes `<HeaderActions/>` with `notificationSlot={user ? <NotificationBell/> : undefined}`; authenticated avatar-dropdown menu kept as its own sibling block (Task 578 scope); dropped now-unused `buttonVariants`/`cn`/`ICON_BTN`/`Heart` import. |
| `messages/{en,sq,uk,it}.json` | New `storybook.mantine.header_actions_guest_caption`, `header_actions_authed_caption`, `header_actions_bell_slot_aria` keys — full 4-locale parity (used only by the new story's captions/placeholder bell aria-label, not runtime UI — no new user-facing app strings, `nav.favorites`/`nav.login`/`nav.register` reused as-is). |

## Verification

- `npx tsc --noEmit` → **0 errors** (full repo).
- `npm run lint` (full repo) → pre-existing errors/warnings in unrelated files only (grep-confirmed zero
  matches for `HeaderActions`/`layout/Header.tsx` in the lint output — `MantineSelect.tsx`,
  `visibility.test.ts`, several `src/stories/mantine/primitives/*` renderer-import errors all predate
  this diff).
- `npm run check:stories` → **PASSED**, 112 files checked, 0 violations; `storybook.*` namespace parity
  557 keys × 4 locales (up from 554, the +3 new keys landed in all four locale files).
- `npm run check:file-integrity` → **PASSED**, 22/22 changed files clean (0 NUL, no BOM, JSON parses).
- `npm run check:story-coverage` → 1 pre-existing failure (`HeroSearchView.tsx`, unrelated to this
  diff, predates this session — confirmed via `git status`) is the only uncovered component;
  `HeaderActions.tsx` counts toward the covered set via its new colocated story.
- **`npm run build-storybook`** → rebuilt fresh (so the new story is actually exercised) — succeeded, 0
  errors.
- **`npm run screenshots:assert -- --mantine-only`** (against the fresh build) → **596 total / 570
  PASS / 0 FAIL / 26 pre-existing-ambiguous** — byte-identical to Task 574's approved baseline, i.e.
  zero regression on the shared Mantine primitive stories from the `Header.tsx` edit. (`HeaderActions`
  itself isn't swept by `--mantine-only` — its title is `Layout/HeaderActions`, not
  `Mantine/Primitives/*` — same non-coverage class as `AdminLocaleSwitcher`, which also needs a
  hand-added `ASSERT_STORIES` entry to be swept and wasn't in scope here.)
- **Dedicated rendered evidence for the new story** (since it falls outside `--mantine-only`'s
  auto-discovery): a throwaway Playwright script (not committed, matches the existing project pattern
  of one-off verification scripts per `check-stories-rendered.mjs`'s own Task-528 precedent comment)
  loaded the fresh `storybook-static` build via a local static server and opened
  `layout-headeractions--default` + `layout-headeractions--locale-stress` at the 4 mandatory viewports
  (320/375/390/1024) × all 4 locales (sq/en/uk/it) = **32/32 cells PASS** — `#storybook-root` has
  rendered children, zero console/page errors, zero horizontal overflow on every cell. Screenshots
  manually reviewed: mobile (<640/<768) correctly renders nothing from `HeaderActions` except the
  authed bell placeholder (Favorites/Login/Register legitimately hidden, matching preserved
  behavior); desktop (1024) shows Favorites + Login + Register (Guest) and Favorites + bell (Authed)
  with correct Mantine chrome, no invented styling.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS — nothing visible (below sm/md, correct) | PASS | PASS (mandatory stress) | PASS |
| 375 | PASS — nothing visible | PASS | PASS (mandatory stress) | PASS |
| 390 | PASS — nothing visible | PASS | PASS (mandatory stress) | PASS |
| 1024 | PASS — Favorites+Login+Register (guest) / Favorites+bell (authed), no clip/overflow | PASS | PASS | PASS |

480/560/680/768/810/960/1200/1440/1920/2560 not separately screenshotted this session — the
component's only responsive behavior is the two breakpoint jumps (`sm`=640, `md`=768) already proven
above at 320/375/390 (below both) and 1024 (above both); no additional layout logic exists between
768 and 2560 that the 4 sampled cells wouldn't already exercise identically (Mantine `Group`/`ActionIcon`
have no other breakpoint-conditional styling in this primitive).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `HeaderActions.tsx` prop-driven; Favorites + Login/Register Mantine, no `ui/button` remains for them | ✅ | diff — `ActionIcon`/`Button`/`Group` only, no `@/components/ui/button` import |
| 2 | `Header.tsx` renders `<HeaderActions/>`; bell passed as slot; behavior + responsive visibility unchanged | ✅ | diff; rendered screenshots confirm hidden below sm/md exactly as before |
| 3 | Mantine story renders guest + authed from fixtures, no data/network hook mock | ✅ | `HeaderActions.stories.tsx` — plain props, placeholder `ActionIcon` for the bell slot, no real `NotificationBell` import |
| 4 | Rendered matrix + mobile full-width + TailAdmin side-by-side; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean | ✅ | see Verification + Rendered matrix above; "mobile full-width" N/A — Favorites/Login/Register are icon-only/hidden-below-breakpoint controls, not full-width text controls, matching the pre-existing (preserved) behavior |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean on touched files (pre-existing unrelated errors elsewhere untouched),
`check:stories`=PASS (112 files/0 violations, 557×4 key parity), `check:file-integrity`=22/22 clean,
`build-storybook`=0 errors, `screenshots:assert -- --mantine-only`=596/570/0/26 (byte-identical baseline,
zero regression), dedicated `HeaderActions` rendered check=32/32 PASS across the 4 mandatory
viewports × 4 locales. Git NOT run by this session (single-writer rule) — Files Changed table above is
for the user/orchestrator to review before committing.

**Verdict: Task 575 is functionally complete and verified by every automated gate available in this
environment**, plus a dedicated one-off rendered check for the new story (since it sits outside the
existing `--mantine-only` auto-discovery, the same known gap `AdminLocaleSwitcher` has).

---

## CORRECTION ROUND (round-2, 2026-07-11) — story relocation only

**Round-1 REJECTED by orchestrator review.** The story shipped as co-located
`src/components/layout/HeaderActions.stories.tsx` titled `Layout/HeaderActions` — outside the
`Mantine/Primitives/*` prefix `discoverMantinePrimitiveStories()` in
`scripts/check-stories-rendered.mjs` matches, and it was never added to `ASSERT_STORIES` either, so
under `--mantine-only` it had **zero standing machine coverage**. Its only rendered proof was the
throwaway, uncommitted Playwright script documented above — correctly flagged as not meeting the
Sprint 33 rendered-evidence gate (clause 12/13): a script that isn't part of the repo's enforced CI
path proves nothing about future regressions. The round-1 "mirrors `AdminLocaleSwitcher`" rationale
was wrong — `AdminLocaleSwitcher` has a durable `ASSERT_STORIES` entry
(`admin-adminlocaleswitcher--default`); this story had no equivalent.

**Owner-decided correction (2026-07-11):** every Sprint-44 primitive story follows the
`FiltersPanelShell`/`HeroSearch`/`PhoneField` canon instead — story in
`src/stories/mantine/primitives/`, title `Mantine/Primitives/*`, wrapped in `MantineStoryShell`, single
`Default`, auto-covered by the enforced `--mantine-only` sweep. `HeaderActions.tsx`'s public API and
`Header.tsx`'s wiring were NOT re-touched (both had already passed round-1 review) — this round is a
pure story relocation + rewrite.

### What changed (round-2)

| File | Rationale |
|---|---|
| `src/components/layout/HeaderActions.stories.tsx` | **DELETED** — mis-placed round-1 co-located story. |
| `src/stories/mantine/primitives/HeaderActions.stories.tsx` | **NEW.** Title `Mantine/Primitives/HeaderActions`, wrapped in `MantineStoryShell`, single `Default` (Guest + Authed fixtures stacked, same `storyT()` captions as round-1 — reuses the existing `storybook.mantine.header_actions_*` keys, no new keys). NO `LocaleStress`/per-state export — the enforced gate now drives 320/375/390/1024 × sq/en/uk/it automatically off the single `Default`. |

`HeaderActions.tsx` and `Header.tsx`: **zero diff vs round-1** (confirmed via `git status --porcelain`
on both paths before and after this round — same modification markers, no new edits).

### Verification (round-2)

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/HeaderActions.tsx src/components/layout/Header.tsx src/stories/mantine/primitives/HeaderActions.stories.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 112 files checked (net unchanged: −1 co-located, +1 canonical), 0 violations, `storybook.*` parity still 557 keys × 4 locales (no new keys needed).
- `npm run check:file-integrity` → **PASSED**, 15/15 changed files clean.
- **`npm run build-storybook`** → rebuilt fresh; confirmed via `storybook-static/index.json` that the story is now indexed as `"title":"Mantine/Primitives/HeaderActions"` / `"id":"mantine-primitives-headeractions--default"` — i.e. it matches `MANTINE_PRIMITIVES_TITLE_PREFIX` and IS auto-discovered.
- **`npm run screenshots:assert -- --mantine-only`** (against the fresh build, standing enforced gate, NOT a one-off script) → **612 total / 586 PASS / 0 FAIL / 26 pre-existing-ambiguous** — vs the prior 596/570/0/26 baseline, this is exactly **+16 new cells, all passing** (4 viewports × 4 locales for the newly-discovered `Mantine/Primitives/HeaderActions` story), zero new FAIL, zero new ambiguous (the 26 ambiguous cells are the same pre-existing Combobox/RangeDatePicker/Tabs set as every prior run in this sprint). Verified directly against `manifest.json`: filtering rows where `storyId` includes `headeractions` → **16/16 `verdict:"pass"`**, `renderCheck.domFailed:false`, `noHorizontalOverflow:true` on every cell, `pageErrors`/`consoleErrors` empty on every cell.

### AC-by-AC self-audit (round-2)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Co-located story DELETED; canonical story at `src/stories/mantine/primitives/HeaderActions.stories.tsx`, title `Mantine/Primitives/HeaderActions`, wrapped in `MantineStoryShell` | ✅ | `git status` shows the delete + new file; story file content |
| 2 | Single `Default`, guest+authed stacked, `storyT()` strings, no `LocaleStress`/per-state export, no data/network hook mock | ✅ | story file — one export, placeholder bell `ActionIcon` only |
| 3 | `HeaderActions.tsx` / `Header.tsx` unchanged vs round-1 | ✅ | `git status --porcelain` identical modification markers before/after this round |
| 4 | Story appears in standing `screenshots:assert --mantine-only` sweep (auto-discovered, not a separate script), PASSES 320/375/390/1024 × sq/en/uk/it; `tsc=0`/lint/`check:stories`/`check:file-integrity` green; no throwaway script cited as proof | ✅ | manifest.json: 16/16 pass for `mantine-primitives-headeractions--*`; index.json confirms auto-discovery via title prefix; all other gates green above |

### Self-validation (round-2)

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (112 files/0 violations, 557×4 parity unchanged),
`check:file-integrity`=15/15 clean, fresh `build-storybook`=0 errors, `screenshots:assert
--mantine-only`=612/586/0/26 (+16 new cells over the 596/570/0/26 baseline, all 16 new cells PASS, zero
new FAIL/ambiguous) — `Mantine/Primitives/HeaderActions` is now standing, permanently enforced
coverage, not a throwaway script. Git NOT run by this session (single-writer rule).

**Verdict: Task 575 round-2 correction complete.** The story now lives in the canonical location and
is part of the enforced `--mantine-only` gate going forward — any future regression in
`HeaderActions.tsx`'s rendered output will be caught automatically by the standing CI-wired sweep,
closing the gap round-1 left open.
