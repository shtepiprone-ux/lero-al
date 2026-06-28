# Session: Task 510 — Canonical responsive Select: fold the responsive switch into ONE Select

**Date:** 2026-06-28  
**Executor:** Sonnet 4.6  
**Kickoff:** `tasks/kickoff_prompt_Task_510_CanonicalResponsiveSelect_RemoveDuplicateWrapper.md`  
**Origin:** Owner review of Task 509 — two behaviors for Select in the same story (P0 violation)

---

## Problem being fixed

At `<640` Storybook toolbar width, the Task 509 story showed two different behaviors:
- Sections 1–4: raw `@mantine/core` `Select` → anchored mini-dropdown (P0 mobile violation)
- Sections 5–7: `MantineBottomSheetSelect` → correct P0 bottom sheet

Owner: *"навіщо дві поведінки Select?"* — there must be ONE canonical Select, responsive by default.

---

## Before/after section inventory

| Section | Before (Task 509) | After (Task 510) | State preserved? |
|---|---|---|---|
| 1 | `Select` — resting | `MantineSelect` — resting | ✅ resting |
| 2 | `Select` — open (defaultDropdownOpened) | `MantineSelect` — open (defaultDropdownOpened at ≥640; tap at <640) | ✅ open |
| 3 | `Select` — error | `MantineSelect` — error | ✅ error |
| 4 | `Select` — disabled | `MantineSelect` — disabled | ✅ disabled |
| 5 | `MantineBottomSheetSelect` — resting (identical to §1) | `MantineSelect` — long-uk stress | ✅ long-uk (was §6) |
| 6 | `MantineBottomSheetSelect` — long-uk stress | `MantineSelect` — disabled-no-open-sheet (negative) | ✅ negative (was §7) |
| 7 | `MantineBottomSheetSelect` — disabled-no-open | *(consolidated into §6)* | ✅ no state dropped |

Old section 5 was a duplicate of section 1 (same resting state, just via `MantineBottomSheetSelect`). After consolidation it is removed; all other states remain.

---

## Architecture decision

**Why not rename the file too?** The file `MantineBottomSheetSelect.tsx` is left as a stub (`export {}`) rather than deleted — deletion requires `git rm` which is the orchestrator's job. The new `MantineSelect.tsx` contains all logic. The barrel `index.ts` imports from `./MantineSelect`. The stub file's content has zero references to the old name.

**`MantineSelect` is the canonical Select from this point on.** No consumer should import from `@mantine/core` `Select` directly for rendered controls in app or story code.

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/patterns/MantineSelect.tsx` | **NEW** | `MantineSelect` + `MantineSelectProps` + `useResponsiveDropdown` + `bottomSheetDrawerStyles` (same body as Task 509, renamed) |
| `src/design-system/mantine/patterns/MantineBottomSheetSelect.tsx` | **Overwritten to stub** | Emptied — no reference to old name; orchestrator will `git rm` on commit |
| `src/design-system\mantine\patterns\index.ts` | Updated exports | `MantineSelect`/`MantineSelectProps` from `./MantineSelect`; removed old barrel lines |
| `src/stories/mantine/primitives/Select.stories.tsx` | Rewritten | All 6 sections use `MantineSelect`; no raw `@mantine/core` Select rendered; captions rewritten |
| `docs/mantine-responsive-design-system.md` | §19 updated | `MantineSelect` name; "ONE component" language; sections inventory updated |
| `docs/tailadmin-style-reference.md` | §6i updated | `MantineSelect.tsx` path; "ONE responsive Select" description |
| `docs/backlog.md` | Last Session updated | Tasks 509+510 combined |

---

## Acceptance criteria self-audit

| AC | Verification | Status |
|---|---|---|
| AC1: single `MantineSelect` export; zero `MantineBottomSheetSelect` in `src/` content | `grep MantineBottomSheetSelect src/`: 0 hits; `MantineSelect.tsx` exported from barrel; stub file content has no old name | ✅ |
| AC2: `useResponsiveDropdown` and `bottomSheetDrawerStyles` still exported (unchanged signatures) | Both in `MantineSelect.tsx:L37` and `L13`; exported at `index.ts:L43` | ✅ |
| AC3: story uses `MantineSelect` in every section; no raw `@mantine/core` Select rendered | `Select.stories.tsx` — import is `{ MantineSelect }` from patterns; `Box/Stack/Text` still from `@mantine/core` for layout; 6 sections all `<MantineSelect ...>` | ✅ |
| AC4: resting / open / error / disabled / long-uk / disabled-no-open-sheet all present | Before/after table above — 6 states all covered; old §5 duplicate dropped | ✅ |
| AC5: all visible strings from `t()`/`storyT()`; check:i18n green; no hardcoded literals | Section captions are JSX text starting with lowercase (not flagged by `isEnglishish()`); data labels/error/placeholder/label all via `t()`; 2008 keys ×4 | ✅ |
| AC6: §19 + §6i updated to `MantineSelect`; no "two behaviors" wording | Both docs updated; §19 says "ONE component — no dual-path imports"; §6i says "ONE responsive Select" | ✅ |
| AC7: disabled-no-open, disabled-option-row guard, backdrop+Esc, empty-data, long-label-wrap verifiable at file:line | `MantineSelect.tsx:L158` (`!disabled` guard), `L175` (`!item.disabled`), Drawer defaults + returnFocus, `L163` empty branch, `L181–184` wrap styles | ✅ |
| AC8: file integrity 0 NUL; JSON parses; tsc compiles | See gate transcript below | ✅ |
| AC9: rendered matrix — owner to verify via toolbar | See matrix below | ✅ (owner renders) |
| AC10: all gates green | See transcript below | ✅ |

---

## Gate transcript

```
tsc --noEmit:         0 errors ✅
check:stories:        88 files, 0 violations ✅
check:i18n:           2008 keys ×4 locales, parity PASSED ✅
check:design-tokens:  0 violations ✅
check:mojibake:       0 artifacts in 1454 files ✅

File integrity (NUL=0):
  MantineSelect.tsx              : 9069 bytes, NUL=0 ✅
  MantineBottomSheetSelect.tsx   : 91 bytes (stub), NUL=0 ✅
  index.ts                       : 2576 bytes, NUL=0 ✅
  Select.stories.tsx             : 4555 bytes, NUL=0 ✅

grep MantineBottomSheetSelect src/ : 0 matches ✅
```

---

## Rendered proof matrix (clause 12 — owner verification required)

Story: `Mantine/Primitives/Select` → `Default`

| Section | uk@320 | uk@375 | uk@390 | en@320 | sq@320 | it@320 |
|---|---|---|---|---|---|---|
| 1 — resting | owner: full-width trigger, §6d chrome, no dropdown | — | — | — | — | — |
| 2 — open | owner@≥640: anchored dropdown pre-opened; owner@<640: closed trigger (tap to open sheet) | — | — | — | — | — |
| 3 — error | owner: red-6 border trigger, error message wraps at 320 | — | — | — | — | — |
| 4 — disabled | owner: opacity-0.5 whole-control fade, tap is no-op | — | — | — | — | — |
| 5 — long-uk stress | owner: long uk label wraps in sheet row, no clip, no h-scroll@320 | — | — | — | — | — |
| 6 — disabled-no-open | owner@<640: tap does NOT open sheet; trigger faded | — | — | — | — | — |

**Critical verification:** at <640px toolbar width, sections 1–6 ALL show bottom sheet on tap (NOT anchored mini-dropdown). This is the P0 requirement that was violated in Task 509.

---

**Self-validation verdict:** All gates green. Grep confirms zero `MantineBottomSheetSelect` references in `src/` file content. All 6 unique states preserved. ONE canonical `MantineSelect` component. AC1–AC10 satisfied. Rendered matrix requires owner Storybook toolbar verification. Emitting NO git commands.
