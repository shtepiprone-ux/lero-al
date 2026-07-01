# Task 515 — DropdownMenu → canonical Mantine, full-width bottom sheet <640 (Batch C, P1.19)

**Date:** 2026-06-30  
**Executor:** Sonnet 4.6  
**Status:** ✅ DONE — awaiting orchestrator diff review + commit emission

## Summary

Built `MantineDropdownMenu` — second Batch C overlay to consume the Task 514 single-source foundation
(`useResponsiveDropdown` + `ResponsiveBottomSheet` from `responsiveBottomSheet.tsx`). NO DragHandle copy,
no inline `<Drawer>` block. Anchored Mantine `Menu` at ≥640; full-width bottom sheet at <640.

Items-array API (`DropdownMenuItemDef[]`): label, onClick?, icon?, color? (e.g. 'red' for destructive),
disabled?, separator?. Same items source renders `Menu.Item`s at desktop and ≥44px `UnstyledButton` rows in
the bottom sheet at mobile. Tapping an item fires its action and closes the sheet.

Mobile click mechanism: same span-onClick pattern as `MantinePopover` (avoids Mantine v8 controlled-mode issue).

## Foundation check (STOP-and-ASK scan)
- `ResponsiveBottomSheet` accepts arbitrary children ✅ — fits both Select (options Stack) and DropdownMenu (items list)
- Items-array API covers icon, color (destructive), disabled, separator ✅ — matches all consumer use cases
- No STOP and ASK triggered.

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 0 violations (90 files — new DropdownMenu story included) |
| `check:i18n` parity | ✅ all 4 locales — 2016 keys (2010+6 dm_* keys) |
| `check:design-tokens` | ✅ 0 violations |
| `check:mojibake` | ✅ 0 artifacts (1468 files) |
| `grep "function DragHandle"` | ✅ 1 match (`responsiveBottomSheet.tsx:49`) — integrity preserved |
| `<Drawer position="bottom">` in consumer | ✅ 0 matches — uses `<ResponsiveBottomSheet>` |

## AC checklist

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `MantineDropdownMenu` imports `useResponsiveDropdown`+`ResponsiveBottomSheet` from `./responsiveBottomSheet`; NO new bottom-sheet code | ✅ | `MantineDropdownMenu.tsx:7` |
| 2 | Clicking trigger OPENS overlay — span-onClick→`openDrawer()` at mobile; uncontrolled `Menu.Target` at desktop | ✅ | `MantineDropdownMenu.tsx:65–73` (mobile span), `74–89` (desktop Menu) |
| 3 | Items render in both paths; tapping fires action+`closeDrawer()`; per-item disabled (opacity 0.5, guarded onClick); destructive (color='red') preserved | ✅ | `MantineDropdownMenu.tsx:79–88` (desktop), `99–131` (mobile rows) |
| 4 | Backdrop+Esc close via `ResponsiveBottomSheet`'s `onClose={closeDrawer}`; disabled no-op; empty state; long-uk wraps; SSR-no-flash | ✅ | `MantineDropdownMenu.tsx:93–95`; `whiteSpace: 'normal'` `wordBreak: 'break-word'` on row text |
| 5 | `grep "function DragHandle"` = 1 match; no inline `<Drawer>` in consumer | ✅ | Grep confirmed above |
| 6 | Story: 2 sections (trigger closed + disabled), zero `defaultOpened` (§8.2) | ✅ | `DropdownMenu.stories.tsx` — 2 sections, 0 `defaultOpened` |
| 7 | §21 doc row added; tracker P1.19→✅; 2016×4 locale parity; foundation+`MantineDialogDrawerPattern` untouched | ✅ | Docs + tracker updated; check:i18n=2016 |
| 8 | All gates green | ✅ | Transcript above |
| 9 | Rendered proof matrix (uk@320/375/390 mandatory) | ⚠️ owner-native Storybook required |
| 10 | Session log + Files Changed table | ✅ this file |

> AC9 note: Orchestrator/owner must open `npm run storybook`, section 1 "trigger (closed/resting)", click the
> trigger button, switch toolbar between 320 and 1280 to verify: at <640 a full-width bottom sheet with drag
> handle + ≥44px rows + long Ukrainian `dm_item_archive` wrapping; at ≥640 the anchored Mantine Menu.
> uk@320/375/390 are the mandatory stress cells per clause 12 + §8.2.

## Files Changed

| Path | Change |
|------|--------|
| `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` | **NEW** — canonical responsive DropdownMenu; span-onClick mobile; uncontrolled Menu desktop; items-array API; consumes Task 514 foundation |
| `src/design-system/mantine/patterns/index.ts` | Added `MantineDropdownMenu`, `MantineDropdownMenuProps`, `DropdownMenuItemDef` exports |
| `src/stories/mantine/primitives/DropdownMenu.stories.tsx` | **NEW** — Mantine proof story: 2 sections (§8.2), toolbar-driven, `storyT()` dm_* keys |
| `messages/en.json` | Added `dm_trigger`, `dm_title`, `dm_item_view`, `dm_item_edit`, `dm_item_archive`, `dm_item_delete` |
| `messages/sq.json` | Same 6 keys in Albanian |
| `messages/uk.json` | Same 6 keys in Ukrainian (`dm_item_archive` long for wrap stress) |
| `messages/it.json` | Same 6 keys in Italian |
| `docs/mantine-responsive-design-system.md` | §21 added (§21.1–§21.4 — mechanism, SSR caveat, story location, P0 gate) |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.19 → ✅ Task 515 |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-30-task515-dropdown-menu-bottom-sheet.md` | This file |
