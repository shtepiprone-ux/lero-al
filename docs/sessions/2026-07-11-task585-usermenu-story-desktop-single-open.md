# Task 585 — `UserMenu` story: open only the admin fixture on desktop

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_585_UserMenuStoryDesktopSingleOpen.md`.
Depends on Task 578 (in working tree, not yet committed).

## Why

Orchestrator finding on the 578 review (2026-07-12): `UserMenu.stories.tsx`'s `play` function opened
BOTH fixtures on desktop (regular *Alba Krasniqi* trigger, then admin *Driton Berisha* trigger). Each
fixture is an independent uncontrolled `MantineDropdownMenu`, so on desktop both anchored dropdowns
stayed open at once and visually overlapped — the admin menu rendered on top of the still-open regular
menu, occluding its items. This also made the 578 log's "regular fixture visible-but-closed" claim
inaccurate. Fix: on desktop, open ONLY the admin fixture.

## Files Changed

| File | Rationale |
|---|---|
| `src/stories/mantine/primitives/UserMenu.stories.tsx` | `play` function: removed the regular (*Alba Krasniqi*) trigger click; opens only the admin (*Driton Berisha*) trigger on desktop. `if (window.innerWidth < 640) return` mobile guard unchanged. `render`/fixtures/title/captions/`MantineStoryShell` untouched. |
| `docs/sessions/2026-07-11-task585-usermenu-story-desktop-single-open.md` | **NEW** — this session log. |
| `docs/backlog.md` | Updated (Last Session + Next Immediate Tasks). |

**Not touched:** `UserMenu.tsx`, `Header.tsx`, `messages/*.json`, `MantineDropdownMenu` — confirmed via
`git diff` scope and `check:file-integrity` (only the story + docs files changed).

## Positive / Negative flow

- **Positive:** desktop (≥640) — `Default` renders both fixtures; `play` clicks only the admin trigger;
  admin dropdown opens near its trigger (correct 5-item order: Profile · My listings · Add listing ·
  Dashboard (brand-colored) · Logout (destructive)); regular trigger remains closed and fully visible;
  no overlap.
- **Negative:**
  - Mobile `<640`: `play` returns early — both triggers closed, full-width, no clip/h-scroll — byte-identical to 578.
  - Regular fixture's role gate (no Admin item): NOT proven by a second open dropdown (would reintroduce
    the overlap); proven by code inspection of `UserMenu.tsx`'s `user.role === 'admin' || user.role ===
    'moderator'` conditional (verified — unchanged, matches the item array driving the rendered admin menu).
  - Trigger not found / timing: `findByRole` await pattern unchanged, no new risk.

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/stories/mantine/primitives/UserMenu.stories.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 114 files checked, 0 violations; `storybook.*` parity 562 keys × 4 locales (unchanged, no new i18n keys — this task added no captions).
- `npm run check:i18n` → **PASSED**, 2141 keys × 4 locales.
- `npm run check:file-integrity` → **PASSED**, all changed/untracked files clean.
- **`npm run build-storybook`** → rebuilt fresh (mandatory — the first `screenshots:assert` attempt ran
  against a stale pre-edit build and falsely showed both dropdowns open; rebuilding and re-running
  produced the correct single-open result below).
- **`npm run screenshots:assert -- --mantine-only`** (standing enforced gate), run against the fresh
  build: **644 total / 618 pass / 0 FAIL / 26 pre-existing-ambiguous** — identical to the Task 578
  baseline (644/618/0/26), zero regression. All 16 `UserMenu` cells (4 locales × 4 viewports) `verdict:"pass"`; none of the 26 ambiguous cells belong to `UserMenu` (same pre-existing Combobox/RangeDatePicker/Tabs set as before this change).
- Screenshots manually reviewed (`.screenshots/rendered-assert/2026-07-12T07-36/`):
  - `en`/`uk` desktop-1024: exactly ONE open menu (admin, correct 5-item order, Dashboard brand-colored),
    regular *Alba Krasniqi* trigger closed and fully visible, **no overlap** — makes the 578 log's
    "regular closed, admin open" description literally true.
  - `uk` mobile-320/375/390 (mandatory stress cells): both triggers closed, full-width, Ukrainian
    captions/labels wrap correctly, no clip/horizontal scroll.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS | PASS | PASS (mandatory, screenshot reviewed — both closed, full-width, no clip) | PASS |
| 375 | PASS | PASS | PASS (mandatory, screenshot reviewed) | PASS |
| 390 | PASS | PASS | PASS (mandatory) | PASS |
| 1024 | PASS | PASS (screenshot reviewed — single open admin menu, no overlap) | PASS (screenshot reviewed) | PASS |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `play` opens ONLY the admin trigger on desktop; regular click removed; mobile guard unchanged | ✅ | diff |
| 2 | §18.9 human-visual proof: desktop en/uk @1024 shows admin open (correct order) + regular closed, no overlap | ✅ | screenshots reviewed above |
| 3 | Mobile uk@320/375/390 unchanged (closed, full-width, wraps, no clip) | ✅ | screenshots reviewed above |
| 4 | No product code touched; story `render`/fixtures/title/captions unchanged, only `play` body differs | ✅ | diff |
| 5 | Gates green: `tsc`=0, lint 0 new, `check:stories`, `check:i18n`, `check:file-integrity`, `screenshots:assert --mantine-only` = 644/618/0/26 no regression | ✅ | see Verification |
| 6 | `docs/backlog.md` + this session log updated with Files Changed table; no `git add`/`git commit` run | ✅ | this log; backlog updated separately |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (114 files/0 violations), `check:i18n`=PASS
(2141×4), `check:file-integrity`=clean, fresh `build-storybook`=0 errors, `screenshots:assert
--mantine-only`=644/618/0/26 (zero regression vs the 578 baseline; all 16 `UserMenu` cells pass, none
ambiguous). Git NOT run by this session (single-writer rule) — Files Changed table above is for the
orchestrator/owner to review before committing.

**Note on process:** the first `screenshots:assert` run after the edit used a `storybook-static` build
that predated the edit (built 08:26, edit landed 08:47), which reproduced the exact overlap this task
was meant to fix — a false signal from stale state, not a code defect. Rebuilding Storybook fresh
before re-running the gate resolved it; the manifest and reviewed PNGs above are from the post-rebuild
run.

**Verdict: Task 585 is complete and verified** — the desktop render is now clean and non-overlapping,
the 578 session log's rendered-evidence description is now literally true, and no regression was
introduced anywhere else in the standing `--mantine-only` gate.
