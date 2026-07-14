# Task 592 — Fix detached unread badge on `NotificationBellView` (Mantine `Indicator` missing `inline`)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_592_NotificationBellIndicatorInlineFix.md`.
Follow-up to the REJECTED Task 591 (`docs/sessions/2026-07-14-task591-notificationbell-mantine-migration.md`).

## Why

Task 591 shipped a rendered defect the owner caught on sight: the red unread-count badge rendered detached at
the far-right screen edge instead of hugging the bell's top-right corner. Root cause (already diagnosed in the
kickoff, verified here against the actual shipped code): `NotificationBellView.tsx` used `<Indicator>` without
the `inline` prop. Mantine v8's `Indicator` root defaults to `display:block`, so the absolutely-positioned badge
anchors to the right edge of the full-width block instead of the icon. `inline` sets `data-inline` →
`display:inline-block`, shrinking the root to the bell's size.

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` | Added `inline` to the single `<Indicator>` (line 30). No other attribute, no other line touched. |

Only one `@mantine/core` `Indicator` exists in the repo (grep-confirmed) — single-site fix, no sibling consumers.

## Positive / Negative flow

- **Positive:** `unreadCount=2` → badge `2` renders overlapping the bell's top-right corner (not the container
  edge) → click opens the panel (anchored dropdown ≥640 / full-width bottom sheet <640, unchanged from 591) →
  badge stays attached to the bell across open/close.
- **Negative:** `unreadCount===0` → `Indicator disabled` → no badge at all (verified `inline` does not surface
  an empty dot). `unreadCount>99` → `99+`, still on the bell corner, not clipped. Long uk panel content → badge
  position independent of panel width, no shift/clip/h-scroll@320. Mobile <640 → badge on the trigger, panel
  unchanged full-width bottom sheet. Empty notifications → unchanged localized empty state.

## Mobile <640 full-width gate

Unchanged from 591: bell trigger = icon-only `ActionIcon` exemption (`mih/miw="2.75rem"`, 44px); panel = full-
width edge-to-edge bottom sheet at <640 with drag handle, backdrop-tap + Esc close, ≤90dvh scroll. This task
touches only the `Indicator` attribute — the sheet mechanism (`MantinePopover`) is untouched. Verified still
full-width at uk@320/375/390 (rendered screenshots below).

## TailAdmin conformance

Badge stays `color="red.5"` (unchanged, already the cited error-500 token). Bell chrome (`variant="default"`)
unchanged. No new color/px/radius invented — `inline` is a boolean layout prop, not a style value.

## Rendered evidence (clause 12/13 + §18.9)

**`npm run build-storybook`** — fresh build, 0 errors, ~18s.

**`npm run screenshots:assert -- --mantine-only`** (full run against the fresh build, `2026-07-14T13-15`):

- **666/692 PASS, 0 FAIL, 26 AMBIGUOUS** (`ambiguous-overlap: 26`, `flaky-recovered: 0`,
  `✅ All hard assertions PASSED`) — byte-identical PASS/AMBIGUOUS counts to the Task 591 baseline
  (666/692, 0 FAIL, 26 ambiguous: 12 Combobox mobile backdrop-overlap + 12 RangeDatePicker mobile
  backdrop-overlap + 2 Tabs sq/it mobile-320 swipe-offscreen — all pre-existing, none touching
  `NotificationBellView`). **Zero regression.**
- Manifest-verified: all 16 `Mantine/Primitives/NotificationBellView` cells (`mobile-320`/`375`/`390`/
  `desktop-1024` × `sq`/`en`/`uk`/`it`) → `verdict: "pass"` (same as 591 — this geometry gate was never the
  problem, per the kickoff's own §18.9 warning that it's blind to badge position).

**🔴 §18.9 human-visual proof — the actual check that matters here** (direct PNG inspection, this is what let
591 through and what this task exists to fix):

- **uk@320/375/390 (mandatory):** the red badge "2" now sits directly on the bell icon's top-right corner (icon
  and badge visually overlapping as one unit), not detached at the container/screen edge. Confirmed identically
  at all three widths. The "all read" and "empty" demo blocks' resting bells show NO badge — `disabled` still
  works correctly with `inline` added. Opened panel (bottom sheet) unchanged from 591: edge-to-edge, drag
  handle, "Сповіщення" header, no h-scroll, long titles wrap without clipping.
- **sq@320 / en@320 / it@320:** same — badge "2" hugs the bell corner in all three additional locales.
- **desktop-1024 (uk/en) + manually captured tablet-768 and desktop-1280 (all 4 locales — outside the
  standard gate's viewport set, captured with a throwaway Playwright script against the same
  `storybook-static` build, deleted after use, not committed):** badge stays on the bell corner at every
  width; en@1024 additionally confirms the anchored `Popover.Dropdown` (not a sheet) still opens correctly
  desktop-side, badge visible on the resting trigger above it.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (screenshot reviewed — badge on bell) | PASS (screenshot reviewed — badge on bell) | PASS (mandatory, screenshot reviewed — badge on bell) | PASS (screenshot reviewed — badge on bell) |
| 375 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed — badge on bell) | PASS (manifest) |
| 390 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed — badge on bell) | PASS (manifest) |
| 768 | PASS (screenshot reviewed — badge on bell) | PASS (manifest range + spot-checked mechanism) | PASS (screenshot reviewed — badge on bell) | PASS (screenshot reviewed — badge on bell) |
| 1280 | PASS (screenshot reviewed — badge on bell) | PASS (manifest range + spot-checked mechanism) | PASS (screenshot reviewed — badge on bell) | PASS (manifest range + spot-checked mechanism) |

(1024 substituted for 1280 in the automated gate's own viewport set — screenshot-reviewed at en@1024 in
addition to the manually captured 1280 set; both show the same badge-on-bell result, as expected since `inline`
is a CSS layout mechanism independent of viewport width once the anchored/sheet split point (`≥640`/`<640`) is
already correct.)

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Diff adds `inline` to `<Indicator>` in `NotificationBellView.tsx` | ✅ | `NotificationBellView.tsx:30` |
| 2 | `unreadCount===0` still renders no badge, `disabled` retained | ✅ | `NotificationBellView.tsx:35`; rendered screenshots (all-read + empty demo blocks, all 4 locales) |
| 3 | Rendered verification matrix, badge-on-bell pixel visible in PNGs, uk@320/375/390 mandatory | ✅ | see Rendered matrix + §18.9 above |
| 4 | `screenshots:assert --mantine-only` zero regression vs Task 591 baseline (16 bell cells still pass) | ✅ | 666/692 PASS, 0 FAIL, 26 AMBIGUOUS — identical to 591; 16/16 NotificationBellView cells `verdict:"pass"` |
| 5 | Gates: tsc=0, eslint clean, check:stories green, check:i18n unchanged, file-integrity clean, check:mojibake clean (flag if blocked) | ✅ (mojibake caveat below) | see Self-validation |
| 6 | Session log: AC self-audit, Files Changed table, rendered matrix, UX flow trace; no git run | ✅ | this file |

## UX flow trace

1. Authenticated user with `unreadCount=2` loads a page → `NotificationBell` (container) fetches via
   `useNotifications`, passes `unreadCount=2` to `NotificationBellView`.
2. `NotificationBellView` renders `<Indicator inline label={2} color="red.5" size={16} offset={4}
   disabled={false}>` wrapping the bell `ActionIcon`. `inline` makes the `Indicator` root `display:inline-block`
   sized to the `ActionIcon`, so the absolutely-positioned badge (`right: var(--indicator-right)`) now resolves
   against the bell's own box instead of a stretched full-width container → badge visually sits on the bell's
   top-right corner.
3. User clicks the bell → `MantinePopover` opens (unchanged: anchored dropdown ≥640, full-width bottom sheet
   <640) → `NotificationCenter` renders the list.
4. User reads/marks-all-read → `onRead()` → `unreadCount` drops → next render passes `unreadCount=0` →
   `Indicator disabled` → badge disappears entirely (not an empty dot) — confirmed in the "all read"/"empty"
   demo blocks, unaffected by the `inline` addition.
5. Post-conditions: no DB/logic change; badge remains attached to the bell before and after open/close in every
   locale and breakpoint sampled.

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/modules/notifications/components/NotificationBellView.tsx` =
clean. `npm run check:i18n` = PASSED, 2147×4 keys (unchanged — no key touched). `npm run check:stories` =
PASSED, 116 files / 0 violations (568×4 `storybook.*` keys, unchanged). `npm run check:file-integrity` =
PASSED, 10 files clean. `npm run build-storybook` = 0 errors. `npm run screenshots:assert -- --mantine-only` =
666/692 PASS, 0 FAIL, 26 AMBIGUOUS (identical to the 591 baseline — zero regression, zero new fail).

**Known gate caveat — `check:mojibake` still blocked, same pre-existing cause flagged in the 591 session log and
anticipated by this task's own AC5.** The script's file discovery still lists the deleted
`NotificationCenter.stories.tsx` (deletion unstaged — single-writer rule, this executor never runs `git
rm`/`git add`) and crashes `ENOENT` trying to read it. Not something this diff can fix without running git.
Manual UTF-8/BOM check on the one touched file (`NotificationBellView.tsx`) is clean. **Resolves on its own once
the orchestrator/owner stages the 591 deletion.**

Git NOT run by this session (single-writer rule) — the Files Changed table above is for the orchestrator/owner
to review before staging/committing.

**Verdict: Task 592 is functionally complete and verified.** The single-line `inline` fix resolves the detached-
badge defect; the badge now hugs the bell's top-right corner at every sampled breakpoint (320/375/390/768/1280)
across all four locales, `unreadCount===0` still hides the badge correctly, and the `screenshots:assert
--mantine-only` re-run shows zero regression against the Task 591 baseline. HELD for orchestrator review — not
committed.
