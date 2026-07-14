# Task 594 — Remove the duplicated "Сповіщення" heading on the notification bottom sheet (mobile)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_594_NotificationSheetHeadingDedup.md`.
Owner-reported 2026-07-14. Follow-up to Tasks 591/592/593.

## Why

`NotificationBellView.tsx` passed `title={t('title')}` to `MantinePopover`. On mobile (<640) that prop rendered
the `ResponsiveBottomSheet` header text "Сповіщення" below the drag handle — `NotificationCenter.tsx` ALSO
renders its own header with the same text (the row holding the mark-all button). Result: heading appeared twice
on mobile, once on desktop (the anchored `Popover.Dropdown` never renders the `title` prop).

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` | Removed the `title={t('title')}` prop (was line 46) from the `<MantinePopover>` call. Drops the sheet to drag-handle-only (the existing no-title pattern already used by Select/Popover/Menu/Nav option lists). `t` is still imported/used by the `ActionIcon`'s `aria-label={t('title')}` (line 38) — untouched. No other line changed. |

No other file touched. `MantinePopover.tsx`, `responsiveBottomSheet.tsx`, `NotificationCenter.tsx` — all
grep-confirmed untouched (`git status --short` shows exactly one modified file).

## Positive flow

Authed user, `hasUnread=true`, opens the bell.
- **<640:** drag handle → single "Сповіщення" header + mark-all button → notification rows; sheet edge-to-edge
  full width, closes on backdrop/Esc. Verified uk@320/375/390 PNGs (below) — heading appears exactly once.
- **≥640:** anchored dropdown, single "Сповіщення" header + mark-all — byte-identical to before (the `title`
  prop was never rendered on desktop).

## Negative flow

- **`!hasUnread` (all-read fixture):** single header, no mark-all button, no orphan row. Verified via throwaway
  capture at uk@320/390 — header renders once, no second heading, no mark-all (unreadCount=0).
- **Empty list (`notifications=[]`):** single header + localized empty message ("Немає повідомлень" at uk).
  Verified uk@320/390 — single heading, no badge, no mark-all, empty state renders below the header divider
  (the divider is the header↔list separator from Task 584, not a title-duplication artifact).
- **Backdrop tap / Esc:** sheet closes (used in the throwaway capture loop between panels — behaved correctly,
  unchanged mechanism).
- Long uk labels: confirmed no clip / no h-scroll@320 in all captured PNGs.

## Mobile <640 full-width gate (clause 11)

Sheet stays full-width edge-to-edge with drag handle — unchanged (`ResponsiveBottomSheet` mechanism untouched).
Bell trigger = icon-only `ActionIcon` exemption (`mih/miw=2.75rem`). Mark-all button = Task 593 behavior,
unchanged. No control removed — only the duplicate heading text node is gone.

## TailAdmin conformance (clause 16)

No chrome/token/color/px/radius/font touched. `title` is a layout prop being dropped, not a style value —
nothing to cite.

## Regression coverage (clause 15)

Scanned `docs/critical-flow-registry.md` (grep for `notification|mark-all|NotificationBell|NotificationCenter`) —
only one existing row, "P1 — Notifications display (Task 564)" (`resolvePriceChangeBody` ICU formatting), which
this diff doesn't touch. No mark-all/heading-dedup row exists; confirms the kickoff's own assessment — pure
presentational heading removal, zero logic change, no new test required.

`npx vitest run src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` —
**3/3 PASS** (ran after the edit; the existing suite already covers the adjacent formatting logic untouched by
this diff).

## Rendered evidence (clauses 12/13 + §18.9)

**`npm run build-storybook`** — fresh build, 0 errors.

**`npm run screenshots:responsive:storybook`** — 296/296 captured, 0 failed (fast-check matrix; NotificationBellView
is not in this script's hardcoded `STORY_TARGETS` list — the authoritative Mantine-primitives evidence for this
task comes from the `screenshots:assert --mantine-only` gate below, which auto-discovers every
`Mantine/Primitives/*` story including `NotificationBellView`).

**`npm run screenshots:assert -- --mantine-only`** (fresh build, run `2026-07-14T16-01`):

- **665/692 PASS, 0 FAIL, 27 AMBIGUOUS, 1 flaky-recovered (Tabs/Default × en × mobile-390, unrelated).**
  **Byte-identical to the last known baseline** (Task 593's session log recorded the same 665/692 PASS, 0 FAIL,
  27 AMBIGUOUS profile) — zero regression, zero new ambiguous cell, zero new FAIL.
  - The pre-existing `Mantine/Primitives/NotificationBellView/Default × en × mobile-320` ambiguous-overlap
    (`button ↔ button("Mark all as read")`, background-backdrop geometry false-positive, same class as the 26
    Combobox/RangeDatePicker entries) is present unchanged — confirms this diff introduced no new geometry
    finding on the story.
  - All 15 other `NotificationBellView` cells (320/375/390/desktop-1024 × sq/en/uk/it minus the one ambiguous)
    are `verdict:"pass"`.

**🔴 §18.9 human-visual proof (the check that decides this task) — PNGs opened directly:**

- **uk@320** (`mantine-primitives-notificationbellview--default__uk__mobile-320.png`): drag handle, single
  "Сповіщення" heading, mark-all button ("Позначити всі як прочитані") on its own row per Task 593, 3 notification
  rows, no divider artifact above the heading, no clip, no h-scroll. ✅
- **uk@375**: identical structure, single heading. ✅
- **uk@390 (mandatory)**: heading + mark-all share one row (Task 593 in-row behavior), single heading, no
  artifact. ✅
- **uk@desktop-1024**: anchored dropdown, single heading — unchanged from before this diff (the `title` prop was
  never rendered at this breakpoint, so this cell is a control proving desktop is untouched). ✅
- **en/sq/it @ 320/375/390/desktop-1024** (all 12 remaining PNGs opened): every cell shows exactly one heading,
  no divider artifact, mark-all button intact where `hasUnread=true`. ✅
- **Negative flow — all-read fixture, uk@320/uk@390** (throwaway capture, see below): single heading, NO mark-all
  button (unreadCount=0), no orphan row. ✅
- **Negative flow — empty fixture, uk@320/uk@390** (throwaway capture): single heading, localized "Немає
  повідомлень" empty message, no badge, no mark-all. ✅

Negative-flow states (all-read, empty) are the 2nd/3rd demo blocks in the story; the automated gate's scripted
open-click only opens the FIRST trigger in DOM order (by design — Task 529's `MANTINE_OVERLAY_PRIMITIVES`
mechanism), so a throwaway Playwright script (`scripts/capture-task594-throwaway.mjs`, same pattern as Task 593's
own throwaway capture) opened triggers #2 and #3 at uk/en × 320/390, screenshotted each, then was deleted after
use. PNGs left under `.screenshots/task594-throwaway/` (gitignored, not tracked, kept as supporting evidence).

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (manifest + PNG reviewed — single heading) | AMBIGUOUS (pre-existing geometry false-positive, unchanged from 593 baseline; PNG reviewed — single heading, correct) | PASS (mandatory, PNG reviewed — single heading) | PASS (manifest + PNG reviewed) |
| 375 | PASS (manifest + PNG reviewed) | PASS (manifest + PNG reviewed) | PASS (mandatory, PNG reviewed — single heading) | PASS (manifest + PNG reviewed) |
| 390 | PASS (manifest + PNG reviewed) | PASS (manifest + PNG reviewed) | PASS (mandatory, PNG reviewed — single heading) | PASS (manifest + PNG reviewed) |
| desktop-1024 | PASS (manifest + PNG reviewed — unchanged, control) | PASS (manifest + PNG reviewed) | PASS (PNG reviewed — unchanged, control) | PASS (manifest + PNG reviewed) |

Negative flow (all-read / empty), throwaway capture: uk@320, uk@390, en@320, en@390 — all 4 PNGs reviewed,
single heading confirmed in every case, no mark-all on all-read/empty, localized empty message correct.

## §17 UI pre-flight checklist

- **Ad-hoc control heights:** N/A — no control added/resized, one prop removed.
- **Non-canonical overlay/dropdown grep on touched file:** `grep -n "position: fixed\|position: absolute\|z-\[\|Dialog\|Sheet\|Popover\|DropdownMenu" NotificationBellView.tsx` → 0 hits (the only overlay reference is the canonical `MantinePopover` import, untouched).
- **Overflow@320 (uk):** confirmed no horizontal scroll in the reviewed uk@320 PNG.

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Diff removes ONLY the `title={t('title')}` prop; no other file changed | ✅ | `NotificationBellView.tsx` diff (single line removed); `git status --short` shows exactly 1 file |
| 2 | `t` still used by `ActionIcon` `aria-label` | ✅ | `NotificationBellView.tsx:38` unchanged |
| 3 | Mobile PNGs (uk@320/375/390) single heading, drag handle, no divider artifact | ✅ | Rendered evidence + matrix above |
| 4 | Desktop PNG unchanged single heading | ✅ | uk@desktop-1024 PNG reviewed |
| 5 | `!hasUnread` + empty-list mobile PNGs — single heading, no mark-all/localized empty, no orphan row | ✅ | Throwaway capture, uk@320/390 |
| 6 | Gates: tsc=0, eslint clean, check:stories/i18n/file-integrity/mojibake green; screenshots:assert no new FAIL; smoke 3/3 | ✅ | See Self-validation below |
| 7 | Session log: AC self-audit, Files Changed, rendered matrix, §18.9 proof, clause-11 note, UX flow trace; no git run | ✅ | This file |

## UX flow trace

1. User clicks the bell `ActionIcon` → `MantinePopover` opens (anchored dropdown ≥640 / `ResponsiveBottomSheet`
   <640). Before this diff, `<640` rendered the sheet's own title text ("Сповіщення") below the drag handle
   because `title={t('title')}` was passed.
2. `NotificationBellView` renders its children — `NotificationCenter` — inside the popover/sheet body.
   `NotificationCenter` has always rendered its own `<p>` header with the same "Сповіщення" text plus the
   mark-all button (Task 593).
3. Removing the `title` prop means `ResponsiveBottomSheet` takes its existing no-title branch (the same code
   path already used by Select/Popover/Menu/Nav option lists) — no header text node, no divider, no extra
   padding — leaving `NotificationCenter`'s header as the sole heading at every breakpoint.
4. ≥640 is unaffected because `Popover.Dropdown` never read the `title` prop in the first place — the desktop
   render tree is byte-identical before and after.

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/modules/notifications/components/NotificationBellView.tsx` =
clean (no output). `npm run check:i18n` = PASSED, 2147×4 keys (unchanged — no key touched). `npm run
check:stories` = PASSED, 116 files / 0 violations. `npm run check:file-integrity` = PASSED, 1 file clean.
`npm run check:mojibake` = PASSED, 0 artifacts in 1700 files (no pre-existing-deletion blocker this session,
unlike Task 593's caveat — nothing was deleted). `npm run build-storybook` = 0 errors. `npm run
screenshots:assert -- --mantine-only` = 665/692 PASS, 0 FAIL, 27 AMBIGUOUS — byte-identical to the prior
baseline (Task 593), zero regression. `npx vitest run
.../NotificationItem.priceChange.smoke.test.tsx` = 3/3 PASS.

Git NOT run by this session (single-writer rule) — the Files Changed table above is for the orchestrator/owner
to review before staging/committing. One scratch artifact was used and is already cleaned up: the throwaway
`capture-task594-throwaway.mjs` script (deleted after use); its output PNGs under
`.screenshots/task594-throwaway/` are gitignored, left in place as supporting evidence, not tracked.

**Verdict: Task 594 is functionally complete.** The duplicate "Сповіщення" heading is gone on mobile — the sheet
now shows the heading exactly once (from `NotificationCenter`), matching desktop's existing single-heading
behavior. All gates green, zero regression on the rendered-assertion gate (byte-identical to the last approved
baseline), all four flows (positive + all-read + empty + desktop control) visually confirmed via PNG at every
required breakpoint/locale combination. HELD for orchestrator review — not committed.
