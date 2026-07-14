# Task 593 — `NotificationCenter` mark-all button: left-align label + own-row <390px

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_593_NotificationCenterMarkAllButtonAlignment.md`.
Owner-flagged from the Task 592 render (2026-07-14).

## Why

With the badge fixed (592), the owner rejected the mark-all button's chrome: (1) the label centred when it
wrapped to two lines ("хаос"), wanted left-aligned after the icon; (2) at very narrow widths the button crowded
the title on one row. Owner decision (2026-07-14, via orchestrator question): `<390px` the button drops to its
own row, full-width, content flush-left.

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/components/NotificationCenter.tsx` | Header row: `flex items-center justify-between` → `flex flex-col min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between` (column-stacks <390, reverts to the original single row ≥390). Button gained `justify="flex-start"` (moves icon+label to the left of its own box) + `styles={{ label: { textAlign: 'left' } }}` (wrapped lines stay left-aligned instead of centring) + `className="w-full min-[390px]:w-auto"` (full-width on its own row <390, content-width in-row ≥390). No other line touched — logic/props/i18n untouched. |

No other file in scope changed. Grep-confirmed the only `<390`-relevant edits live in this one header `div` +
`Button`.

## Positive / Negative flow

- **Positive:** `hasUnread=true`. **≥390px:** title and button share row 1 (unchanged layout vs today); label
  reads icon→text left-to-right, wrapped lines (uk/sq/it) stay left-aligned instead of centring. **<390px:** row
  1 = title, row 2 = the button, full width, icon+label flush-left. Click → `handleMarkAll` →
  `markAllNotificationsRead()` → `onRead()` → `hasUnread` false → button unmounts (byte-identical logic, untouched).
- **Negative:** `!hasUnread` → button not rendered, no orphan second row, title alone occupies the header (verified
  — see rendered evidence). `isPending` → button `disabled`, alignment/row-placement unchanged while disabled (no
  layout class is conditioned on `isPending`). Long-locale label (uk/sq/it) at <390 → full-width button, label
  wraps left-aligned, no clip, no h-scroll@320 (theme-level `whiteSpace:'normal'`/`overflowWrap:'break-word'` on
  `Button` label unchanged, untouched by this diff). Long-locale label at 390–639 (in-row) → label left-aligned,
  wraps left when it wraps (verified at uk@390, both wrapped lines start at the same left edge under the icon —
  see PNG), title not pushed off. Desktop ≥640 (anchored dropdown) → in-row, left-aligned, unchanged width
  behavior (verified at desktop-1024/768/1280 — see Rendered matrix).

## Mobile <640 full-width gate (clause 11)

- **<390px:** mark-all button is `w-full` with `justify="flex-start"` content — full-width row, flush-left
  icon+label, satisfies the gate on its own row. Touch target unchanged (theme `minHeight:'2.75rem'` on all
  `Button`s, untouched).
- **390–639px (documented exemption, owner-directed 2026-07-14):** the button stays a compact inline header
  action at content width beside the title — analogous to a toolbar/secondary action, not a primary CTA. This is
  the owner's explicit instruction (new-row behavior specified only `<390px`); the sheet container itself remains
  full-width edge-to-edge (unchanged from 591/592, untouched by this diff).
- Bell trigger + bottom-sheet mechanism (`MantinePopover`) — out of scope, untouched.

## TailAdmin conformance (clause 16)

Button stays `variant="transparent" color="brand"` (`§6a-link` row) — no color/size/radius invented.
`justify`/`className` width utilities and `styles.label` textAlign are layout props/instance-level style, not new
design tokens, per §18 ("prefer Mantine props/`styles` over global CSS" — this is a component-instance `styles`
override, not a `theme.ts` edit, so it doesn't touch the shared `§6a-link` chrome used by every other
`variant="transparent"` consumer in the app). `CheckCheck size={14}` unchanged. The `min-[390px]:` arbitrary
Tailwind breakpoint follows the identical precedent set by Task 590's `HeaderView.tsx` split (cited in-code).

## Rendered evidence (clause 12/13 + §18.9)

**`npm run build-storybook`** — rebuilt (the first `screenshots:assert` run was against a stale pre-edit build;
caught and corrected before reporting).

**`npm run screenshots:assert -- --mantine-only`** (full run against the fresh build, `2026-07-14T14-37`):

- **665/692 PASS, 0 FAIL, 27 AMBIGUOUS** (`ambiguous-overlap: 27`, `flaky-recovered: 0`,
  `✅ All hard assertions PASSED`). **This is NOT byte-identical to the Task 592 baseline (666/692, 26
  AMBIGUOUS) — reporting the delta honestly rather than rounding to "zero regression."**
  - The one new cell: `Mantine/Primitives/NotificationBellView/Default × en × mobile-320` flipped from
    `pass` to `ambiguous-overlap` (`button ↔ button("Mark all as read")` — "background page content behind an
    opened overlay's backdrop"). Root cause: the mark-all button is now `w-full` at 320px, so its wider bounding
    box geometrically intersects the story canvas's OTHER demo-block bell icon sitting behind the sheet's
    translucent backdrop — the exact same benign geometry-gate blind spot already producing all 26 pre-existing
    `ambiguous-overlap` entries for Combobox/RangeDatePicker (raw DOM-rect overlap between an open overlay and
    dimmed background content, not a real visual defect; §18.9 exists precisely because this gate can't tell a
    translucent backdrop from a genuine clash). **Directly reviewed the PNG for this exact cell** (below) — the
    render is correct: title row, then the full-width button flush-left on its own row, nothing clipped or
    overlapping on-screen.
  - No FAIL anywhere (0/692). No other NotificationBellView cell changed status — the remaining 15/16 stayed
    `pass`.
- Manifest-verified: 15/16 `Mantine/Primitives/NotificationBellView` cells still `verdict:"pass"`; the 16th
  (en@320) is `ambiguous-overlap` for the reason above, visually confirmed correct.

**🔴 §18.9 human-visual proof — the check that actually decides this task:**

- **uk@320:** `Сповіщення` (row 1) / full-width `✓✓ Позначити всі як прочитані` button (row 2), icon+label
  flush-left. ✅
- **uk@375:** same — own row, full-width, flush-left (label fits one line at this width). ✅
- **uk@390 (mandatory — the label-wrap proof):** title and button share row 1; the long uk label wraps to two
  lines and **both lines start at the same left edge directly under the check icon** — no centring. This is the
  literal defect the owner rejected, now fixed. ✅
- **uk@desktop-1024 / uk@768 / uk@1280 (manually captured — outside the automated gate's viewport set, throwaway
  Playwright script against the same `storybook-static` build, deleted after use, PNGs left under
  `.screenshots/task593-throwaway/` which is gitignored):** identical in-row, left-aligned, two-line wrap at
  every desktop width — the fix is viewport-independent past 390, as expected (only one CSS fork exists, at
  `min-[390px]`). ✅
- **it@768:** `Segna tutte come lette` also wraps left-aligned. ✅ (spot-check confirming the fix isn't
  uk-specific.)
- **en@320 (the ambiguous cell) — reviewed directly:** title row, then the full-width "Mark all as read" button
  on row 2, icon+label flush-left, nothing visually overlapping. Confirms the ambiguous flag above is the known
  false-positive class, not a defect.
- **Negative flow — `!hasUnread` (all-read demo block), uk@320/390:** only the title renders in the header, no
  button, no orphan second row, no gap — clicking the second (all-read) bell trigger and capturing the opened
  panel confirms the `flex-col`/`gap-2` header collapses cleanly to one child when `hasUnread` is false.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS (manifest + screenshot reviewed — own row, flush-left) | AMBIGUOUS (geometry false-positive, screenshot reviewed — correct render, see above) | PASS (mandatory, screenshot reviewed — own row, flush-left) | PASS (manifest + screenshot reviewed) |
| 375 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed — own row, flush-left) | PASS (manifest) |
| 390 | PASS (manifest) | PASS (manifest) | PASS (mandatory, screenshot reviewed — in-row, label wraps left-aligned) | PASS (manifest) |
| 768 | — (manually captured, not spot-viewed) | — (manually captured, not spot-viewed) | PASS (screenshot reviewed — in-row, left-aligned wrap) | PASS (screenshot reviewed — in-row, left-aligned wrap) |
| 1280 | — (manually captured, not spot-viewed) | — (manually captured, not spot-viewed) | PASS (screenshot reviewed — in-row, left-aligned wrap) | — (manually captured, not spot-viewed) |

(1024 substituted for 1280 in the automated gate's own viewport set — `verdict:"pass"` for sq/en/uk/it@1024 per
manifest; uk/it@768/1280 additionally screenshot-reviewed directly above to cover the literal 768/1280 cells the
AC names.)

## §17 UI pre-flight checklist

- **Ad-hoc control heights on touched `Button`:** `grep -n "h-8\|h-9\|h-10\|h-11\|h-12"
  src/modules/notifications/components/NotificationCenter.tsx` → 0 hits. No ad-hoc height introduced (relies on
  the existing theme-level `minHeight:'2.75rem'`).
- **Non-canonical overlay/dropdown grep on touched file:** `grep -n "position: fixed\|position: absolute\|z-\[\|Dialog\|Sheet\|Popover\|DropdownMenu" NotificationCenter.tsx` → 0 hits — no raw overlay introduced.
- **Same-row height (§15):** ≥390px row is `items-center` — title `<p>` and `Button` share one visual row height,
  unchanged from today.
- **Overflow@320 (uk):** confirmed no horizontal scroll in the reviewed uk@320 PNG (full-width button fits
  exactly inside the sheet's existing `px-4` padding, same inset as every other row).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Label left-alignment in the diff + rendered evidence at a wrapping width (uk@320) | ✅ (wrap evidence is at uk@390, the width where uk actually wraps two lines — 320/375 fit on one line) | `NotificationCenter.tsx:46-47`; uk@390 PNG shows both wrapped lines flush-left |
| 2 | `<390px` own-row full-width in the diff | ✅ | `NotificationCenter.tsx:37,48`; uk@320/375 PNGs |
| 3 | `≥390px` in-row preserved | ✅ | `NotificationCenter.tsx:37` (`min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between`); uk@390/768/1024/1280 PNGs |
| 4 | Rendered verification matrix 320/375/390/768/1280 × sq/en/uk/it, uk mandatory, PNG shows alignment/row pixel | ✅ | Rendered matrix above + throwaway 768/1280 captures |
| 5 | `screenshots:assert --mantine-only` zero regression vs 592 baseline | ⚠️ **NOT literally zero** — 665/692 PASS (was 666), 27 AMBIGUOUS (was 26), 0 FAIL (unchanged). One NotificationBellView cell (en@mobile-320) moved pass→ambiguous, root-caused to the same geometry-gate backdrop-overlap blind spot as the pre-existing 26, and visually confirmed correct via direct PNG review. Flagging for orchestrator/owner judgment rather than asserting a clean match. |
| 6 | `!hasUnread` still renders no button, no empty second row | ✅ | all-read demo block, uk@320/390 PNGs |
| 7 | Gates: tsc=0, eslint clean, check:stories green, check:i18n unchanged, file-integrity clean, check:mojibake clean (flag if blocked) | ✅ (mojibake caveat below, anticipated by the kickoff) | see Self-validation |
| 8 | §17 checklist in session log | ✅ | above |
| 9 | Session log: AC self-audit, Files Changed, rendered matrix, clause-11 exemption table, UX flow trace; no git run | ✅ | this file |

## UX flow trace

1. Authenticated user with ≥1 unread notification opens the bell → `NotificationBellView` renders
   `MantinePopover` → `NotificationCenter` header: `hasUnread=true` → mark-all `Button` mounts.
2. **≥390px:** header `div` is `flex-row items-center justify-between` (from `min-[390px]:` overrides) — title
   left, button right, one row, unchanged from today except the button's internal content (icon+label) now
   anchors left via `justify="flex-start"` and any wrapped label line is `textAlign:'left'` instead of the
   Mantine default centre.
3. **<390px:** header `div` falls back to its base `flex-col`, `gap-2` stacks title then button vertically; the
   button's `className="w-full"` (no `min-[390px]:` override applies below 390) makes it span the row, and
   `justify="flex-start"` keeps icon+label pinned to the left edge of that full-width box instead of centring.
4. User clicks the button → `handleMarkAll` → `markAllNotificationsRead()` → `onRead()` → parent re-fetches →
   `hasUnread` becomes `false` on next render → the `{hasUnread && (...)}` guard unmounts the button → header
   collapses back to just the title, no orphan row (the `flex-col`/`gap-2` container only reserves space for
   children present). No DB/logic difference from before this task.

## Self-validation

`npx tsc --noEmit -p .` = 0 errors. `npx eslint src/modules/notifications/components/NotificationCenter.tsx` =
clean. `npm run check:i18n` = PASSED, 2147×4 keys (unchanged, no key touched — `mark_all_read` already existed).
`npm run check:stories` = PASSED, 116 files / 0 violations (568×4 `storybook.*` keys, unchanged). `npm run
check:file-integrity` = PASSED, 8 files clean. `npm run build-storybook` = 0 errors. `npm run screenshots:assert
-- --mantine-only` = 665/692 PASS, 0 FAIL, 27 AMBIGUOUS — see AC5 note above for the honest delta vs the 592
baseline and the root-cause/visual-confirmation for the one new ambiguous cell.

**Known gate caveat — `check:mojibake` still blocked, same pre-existing cause flagged in the 591/592 session
logs and anticipated by this task's own AC7.** The script's tracked-file list still includes the deleted
`NotificationCenter.stories.tsx` (deletion unstaged — single-writer rule, this executor never runs `git
rm`/`git add`) and crashes `ENOENT` reading it. Not fixable from this diff without running git. Manual UTF-8/BOM
check on the one touched file (`NotificationCenter.tsx`) is clean via `check:file-integrity`. Resolves once the
591 deletion is staged.

Git NOT run by this session (single-writer rule) — the Files Changed table above is for the orchestrator/owner
to review before staging/committing. Two scratch artifacts were used and are already cleaned up / gitignored:
the throwaway `capture-task593-throwaway.mjs` script (deleted after use, per the kickoff's own instruction) and
its output PNGs under `.screenshots/task593-throwaway/` (directory is gitignored, left in place as supporting
evidence, not tracked).

**Verdict: Task 593 is functionally complete.** Label renders flush-left (single-line and wrapped) at every
breakpoint and locale sampled; the button drops to its own full-width flush-left row below 390px and reverts to
the original in-row layout at 390px and above, matching the owner's 2026-07-14 decision exactly. One honest
caveat for orchestrator review: the rendered gate is not byte-identical to the 592 baseline (665/692 vs 666/692,
27 vs 26 ambiguous) — the single delta is a geometry-gate false-positive on the now-wider button's bounding box,
visually confirmed correct, not a functional regression. HELD for orchestrator review — not committed.
