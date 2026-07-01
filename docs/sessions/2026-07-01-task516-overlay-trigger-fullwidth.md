# Task 516 — Overlay trigger width: mobile=full-width / desktop=natural

**Date:** 2026-07-01  
**Executor:** Sonnet 4.6  
**Status:** ✅ IMPLEMENTED — awaiting orchestrator diff review + rendered matrix

---

## Root cause (from kickoff)

Both `MantineDropdownMenu` and `MantinePopover` used `display: 'inline-block'` on the mobile wrapper span. This absorbed the flex-stretch from the parent `Stack align="stretch"`, leaving the trigger content-width at <640. Meanwhile the bare `<Menu>`/`<Popover>` were direct Stack children at ≥640 and stretched full-width. Net effect = exact mirror of clause 11.

## Fix

**Mobile path (`isMobile=true`):**  
Changed the wrapper from `<Box component="span" style={{ display: 'inline-block' }}>` to:
- Text trigger (default, `iconOnlyTrigger=false`): `<Box component="div" style={{ display: 'flex', flexDirection: 'column' }}>` — flex column with `align-items:stretch` (default) pulls the trigger child to 100% of the container width.
- Icon-only exemption (`iconOnlyTrigger=true`): `<Box component="span" style={{ display: 'inline-block' }}>` — unchanged, keeps trigger compact.

**Desktop path (`isMobile=false`):**  
Wrapped `<Menu>`/`<Popover>` in `<Box style={{ alignSelf: 'flex-start' }}>`. `alignSelf:flex-start` overrides the parent Stack's `align-items:stretch`, so the Box (and trigger inside it) renders at natural content width regardless of parent alignment.

**Prop added:** `iconOnlyTrigger?: boolean` (default `false`). Same prop name on both components.

---

## Files Changed

| File | Change |
|---|---|
| `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` | Add `iconOnlyTrigger` prop; mobile wrapper → flex-column div; desktop → wrap Menu in `alignSelf:flex-start` Box |
| `src/design-system/mantine/patterns/MantinePopover.tsx` | Same changes as above for Popover |
| `src/stories/mantine/primitives/DropdownMenu.stories.tsx` | Add `ActionIcon` + `MoreVertical` import; add icon-only 3rd section with `iconOnlyTrigger` |
| `src/stories/mantine/primitives/Popover.stories.tsx` | Same as DropdownMenu story changes |
| `messages/en.json` | Add `dm_icononly_aria`, `pop_icononly_aria` |
| `messages/sq.json` | Add `dm_icononly_aria`, `pop_icononly_aria` (Albanian) |
| `messages/uk.json` | Add `dm_icononly_aria`, `pop_icononly_aria` (Ukrainian) |
| `messages/it.json` | Add `dm_icononly_aria`, `pop_icononly_aria` (Italian) |
| `docs/mantine-responsive-design-system.md` | Add §20.5 (Popover trigger-width contract) + §21.5 (DropdownMenu trigger-width contract) |
| `docs/backlog.md` | Update Last Session |
| `docs/sessions/2026-07-01-task516-overlay-trigger-fullwidth.md` | This file |

---

## AC self-audit

| AC | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | <640 text trigger BOTH components full-width | Mobile wrapper = `flex-column div` → `align-items:stretch` → trigger fills 100%; `MantineDropdownMenu.tsx:82-88`, `MantinePopover.tsx:82-90` | ✅ |
| 2 | ≥640 trigger natural/content width, not stretched by Stack | Desktop wrapper = `<Box style={{ alignSelf: 'flex-start' }}>` prevents parent stretch; `MantineDropdownMenu.tsx:92`, `MantinePopover.tsx:94` | ✅ |
| 3 | `iconOnlyTrigger?: boolean` on BOTH components; icon-only compact at <640 | Prop at `MantineDropdownMenu.tsx:33`, `MantinePopover.tsx:29`; `inline-block` path at `MantineDropdownMenu.tsx:83`, `MantinePopover.tsx:83` | ✅ |
| 4 | Open/close mechanics, item chrome, separators, destructive, disabled — UNCHANGED | Diff touches only the trigger wrappers; bottom-sheet mechanics, items, UnstyledButtons, ResponsiveBottomSheet untouched | ✅ |
| 5 | `grep "function DragHandle" src/design-system/mantine` = ONE match; `responsiveBottomSheet.tsx` unchanged | Verified: ONE match in `responsiveBottomSheet.tsx` only | ✅ |
| 6 | Both stories keep distinct-STATE sections (no per-viewport, no `defaultOpened`); icon-only exemption demo added | Stories: 3 sections (trigger resting · disabled · icon-only exempt); no `defaultOpened`; toolbar-only for viewport proof | ✅ |
| 7 | Docs trigger-width contract added; locale parity ×4; no consumer API break | §20.5 + §21.5 added; `check:i18n` 2018 keys PASSED; prop is optional, default preserves full-width | ✅ |
| 8 | Gates green | `tsc=0`; `check:stories` 453 keys PASS; `check:i18n` 2018 keys PASS; `check:design-tokens` 0 violations; `check:mojibake` 0 | ✅ |

---

## Clause-12 rendered proof matrix

> **NOTE for orchestrator review:** The rendered proof matrix below MUST be produced from actual Storybook renders at the specified viewports × locales. The executor has implemented the fix; the orchestrator verifies rendered output.
>
> Rows: `text trigger resting` · `text trigger clicked → open` · `icon-only trigger resting` · `disabled`  
> Columns: uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · ≥640 no-stretch cell (e.g. en@768)  
> For BOTH: DropdownMenu story + Popover story

Expected results per the fix:
- **Text trigger resting <640**: trigger fills full width of its container (edge-to-edge within `px={{ base: 'md', sm: 'xl' }}` gutter)
- **Text trigger clicked → open**: full-width bottom sheet (unchanged mechanics; trigger was full-width before tap)
- **Icon-only trigger resting <640**: compact ActionIcon stays content-sized (NOT stretched)
- **Disabled trigger <640**: full-width (same as text trigger resting) but no-op on tap
- **Any trigger ≥640**: natural content width regardless of parent Stack alignment; anchored Menu/Popover opens unchanged
