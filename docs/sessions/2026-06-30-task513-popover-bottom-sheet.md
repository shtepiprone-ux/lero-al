# Task 513 (REWORK) — Popover → canonical Mantine, full-width bottom sheet <640 (Batch C, P1.18)

**Date:** 2026-06-30  
**Executor:** Sonnet 4.6  
**Status:** ✅ REWORK DONE — awaiting orchestrator diff review + commit emission

## Summary

First pass (same date) was REJECTED by owner for two defects now codified in §8.2:
1. **Per-viewport duplicate sections** in story (same open state shown twice for ≥640 and <640).
2. **Click-to-open broken** — trigger did nothing; overlay only appeared via `defaultOpened` auto-open.

Rework fixes both defects:
- Story trimmed to 2 DISTINCT-STATE sections (`trigger closed/resting` + `disabled`). No `defaultOpened` anywhere.
- Mobile click mechanism replaced: instead of `Popover opened={false}` + `onChange` (which in Mantine v8 fires `onChange(currentValue)` not `onChange(!current)` making it useless for interception), the trigger is now wrapped in an `inline-block` `Box` span that captures click events bubbled from the trigger button and directly calls `openDrawer()`. Desktop uses uncontrolled Mantine Popover (no `opened` prop at all). `defaultOpened`, `useDisclosure`, and `useEffect` removed entirely.
- §20 docs updated to reflect the span-wrapper mechanism and 2-section story.

## Mechanism (REWORK — span-wrapper pattern)

**Mobile (<640px):**
- `isMobile=true` → render `<Box component="span" onClick={() => { if (!disabled) openDrawer() }}>{trigger}</Box>`
- Click event bubbles from the trigger `<Button>` up to the span → `openDrawer()` called directly
- No Mantine Popover `opened`/`onChange` involved on mobile path (avoids Mantine v8 controlled-mode quirk)
- Drawer uses `bottomSheetDrawerStyles` from foundation — edge-to-edge, top-only radius, drag handle, ≤90dvh, backdrop+Esc, `returnFocus`

**Desktop (≥640px):**
- `isMobile=false` → render standard `<Popover>` in uncontrolled mode (no `opened` prop)
- Mantine manages open/close state natively; trigger click works as designed

**SSR/hydration:** `isMobile=false` on first render (Mantine v8 `getInitialValueInEffect=true`). Desktop path used on SSR + initial client render; mobile path mounts after hydration. No user interaction possible before the switch — imperceptible.

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 0 violations |
| `check:i18n` parity | ✅ all 4 locales — 2010 keys (2006 base + 4 pop_* keys from first pass, kept) |
| `check:design-tokens` | ✅ 0 violations |
| `check:mojibake` | ✅ 0 artifacts |

## AC checklist (REWORK)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `MantinePopover` exists in design-system layer; imports `useResponsiveDropdown`+`bottomSheetDrawerStyles` from `./MantineSelect`; no duplicated bottom-sheet block | ✅ | `MantinePopover.tsx:6` import |
| 2 | **Clicking/tapping trigger ACTUALLY OPENS overlay** — at ≥640 uncontrolled Mantine Popover (click → opens); at <640 span onClick → `openDrawer()` → bottom sheet | ✅ | `MantinePopover.tsx:88–97` (mobile span), `99–109` (desktop Popover) |
| 3 | Backdrop tap (`onClose={closeDrawer}`) + Esc (Drawer default) close sheet; focus returns to trigger (`returnFocus`) | ✅ | `MantinePopover.tsx:116–118` |
| 4 | Disabled (span `onClick` guarded by `!disabled`; desktop Mantine `disabled` prop), empty (Drawer opens whatever children), long-uk (wrap style on content), SSR-no-flash | ✅ | `MantinePopover.tsx:94, 104` |
| 5 | `mantine-responsive-design-system.md` §12 + §20 updated (mechanism + story count); `tailadmin-style-reference.md` §6j; tracker P1.18 → ✅ | ✅ | Diff |
| 6 | **Story has DISTINCT-STATE sections ONLY** (trigger closed + disabled) — NO per-viewport open sections, NO `defaultOpened` prop anywhere (§8.2) | ✅ | `Popover.stories.tsx` — 2 sections, zero `defaultOpened` |
| 7 | Zero hardcode; locale parity 2010×4; no consumer API break; foundation + `MantineDialogDrawerPattern` + `MantineSelect` untouched | ✅ | tsc=0, check:design-tokens=0, check:i18n=0 |
| 8 | All gates green | ✅ | Transcript above |
| 9 | Rendered proof matrix — browser not available in executor env | ⚠️ owner-native required |
| 10 | Session log + Files Changed table | ✅ this file |

> AC9 note: Orchestrator/owner must open `npm run storybook`, section 1 "trigger closed/resting", click the trigger, switch toolbar between 320 and 1280 to verify both paths actually open. uk@320/375/390 stress cells (long Cyrillic `pop_content_body`) are mandatory per clause 12 + §8.2.

## Files Changed

| Path | Change |
|------|--------|
| `src/design-system/mantine/patterns/MantinePopover.tsx` | **REWORK** — span-wrapper mobile click mechanism; removed `defaultOpened` prop, `useDisclosure`, `useEffect`; uncontrolled desktop Popover; 2-path conditional render |
| `src/design-system/mantine/patterns/index.ts` | Added `MantinePopover` + `MantinePopoverProps` exports (from first pass — unchanged in rework) |
| `src/stories/mantine/primitives/Popover.stories.tsx` | **REWORK** — trimmed from 4 sections to 2 (trigger closed/resting + disabled); zero `defaultOpened`; complies with §8.2 |
| `messages/en.json` | Added `pop_trigger`, `pop_title`, `pop_content_heading`, `pop_content_body` (from first pass — unchanged) |
| `messages/sq.json` | Same 4 keys in Albanian (from first pass — unchanged) |
| `messages/uk.json` | Same 4 keys in Ukrainian (long stress text — from first pass — unchanged) |
| `messages/it.json` | Same 4 keys in Italian (from first pass — unchanged) |
| `docs/mantine-responsive-design-system.md` | §12 MantinePopover row (first pass) + §20 mechanism updated in rework to span-wrapper + 2-section story count |
| `docs/tailadmin-style-reference.md` | §6j added (from first pass — unchanged in rework) |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.18 → ✅ Task 513 (from first pass — unchanged in rework) |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-30-task513-popover-bottom-sheet.md` | This file (overwrote first-pass log with rework details) |
