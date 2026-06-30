# Task 514 — Extract bottom-sheet chrome to single-source foundation (Batch C dedup)

**Date:** 2026-06-30  
**Executor:** Sonnet 4.6  
**Status:** ✅ DONE — awaiting orchestrator diff review + commit emission

## Summary

Pure refactor (zero rendered/behavior change). Created `responsiveBottomSheet.tsx` as the ONE foundation module
for all Batch C overlays. Moved `useResponsiveDropdown`, `bottomSheetDrawerStyles`, and `DragHandle` from their
original home inside `MantineSelect.tsx` into the new module. Added `ResponsiveBottomSheet` — a canonical
Drawer wrapper that encapsulates the fixed P0 chrome so consumers never copy-paste the Drawer block.

Refactored `MantineSelect.tsx` and `MantinePopover.tsx` to import from `./responsiveBottomSheet` and render
their mobile sheets via `<ResponsiveBottomSheet>`. Updated `index.ts` barrel and §19/§20 docs.

`grep -rn "function DragHandle" src/design-system/mantine` → exactly 1 match (`responsiveBottomSheet.tsx:49`).
No inline `<Drawer position="bottom">` remains in either consumer file.

## Files Changed

| Path | Change |
|------|--------|
| `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` | **NEW** — single-source foundation: `useResponsiveDropdown` + `bottomSheetDrawerStyles` + `DragHandle` (ONE) + `ResponsiveBottomSheet` wrapper |
| `src/design-system/mantine/patterns/MantineSelect.tsx` | Removed local `bottomSheetDrawerStyles`/`useResponsiveDropdown`/`DragHandle`/inline `<Drawer>`; imports from `./responsiveBottomSheet`; renders mobile sheet via `<ResponsiveBottomSheet>` |
| `src/design-system/mantine/patterns/MantinePopover.tsx` | Removed local `DragHandle`/inline `<Drawer>`/`bottomSheetDrawerStyles` import from `./MantineSelect`; imports `useResponsiveDropdown`+`ResponsiveBottomSheet` from `./responsiveBottomSheet` |
| `src/design-system/mantine/patterns/index.ts` | Moved `useResponsiveDropdown`/`bottomSheetDrawerStyles` re-exports to `./responsiveBottomSheet`; added `DragHandle`+`ResponsiveBottomSheet`+`ResponsiveBottomSheetProps` |
| `docs/mantine-responsive-design-system.md` | §19.1 foundation location updated to `responsiveBottomSheet.tsx`; exports table expanded (DragHandle+ResponsiveBottomSheet); Batch C adoption snippet updated. §20.1 mechanism updated to reference single-source |

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 0 violations (89 files) |
| `check:i18n` parity | ✅ 2010×4 (unchanged — pure refactor) |
| `check:design-tokens` | ✅ 0 violations |
| `check:mojibake` | ✅ 0 artifacts (1464 files) |
| `grep "function DragHandle"` | ✅ exactly 1 match in `responsiveBottomSheet.tsx:49` |
| `<Drawer position="bottom">` in consumers | ✅ 0 matches — both consumers use `<ResponsiveBottomSheet>` |

## AC checklist

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | New foundation module exists; houses `useResponsiveDropdown`+`bottomSheetDrawerStyles`+ONE `DragHandle`+`ResponsiveBottomSheet` | ✅ | `responsiveBottomSheet.tsx` lines 14–100 |
| 2 | `grep "function DragHandle"` = 1 match; no inline `<Drawer position="bottom">` in consumers | ✅ | Grep confirmed above |
| 3 | Select renders pixel-identical to Task 510 — `useResponsiveDropdown` call same, `<ResponsiveBottomSheet>` emits same Drawer chrome | ✅ | Structural: same props, same styles, same `returnFocus`, same `withCloseButton=false`, same `size="auto"` |
| 4 | Popover renders pixel-identical to Task 513 — mobile span-onClick unchanged, `<ResponsiveBottomSheet>` emits same Drawer chrome | ✅ | Structural: identical Drawer block now inside `ResponsiveBottomSheet` |
| 5 | All foundation import paths resolve; barrel updated; `tsc=0` | ✅ | `index.ts` updated; `MantinePopover.tsx` imports from `./responsiveBottomSheet` not `./MantineSelect` |
| 6 | Docs §19/§20 point at new single-source module | ✅ | `mantine-responsive-design-system.md` §19.1 + §20.1 updated |
| 7 | Zero hardcode; no new i18n keys; 2010×4 parity unchanged; `MantineDialogDrawerPattern` untouched | ✅ | check:i18n=2010, check:design-tokens=0 |
| 8 | All gates green | ✅ | Transcript above |
| 9 | Rendered proof matrix (both consumers) | ⚠️ owner-native Storybook required |
| 10 | Session log + Files Changed table | ✅ this file |

> AC9 note: Both `MantineSelect` and `MantinePopover` story behaviors are structurally unchanged — same hook,
> same Drawer props, same styles. Orchestrator verifies the diff; owner confirms both stories render identically
> at uk@320/375/390 before/after the refactor (this is purely a source-level move with no logic change).
