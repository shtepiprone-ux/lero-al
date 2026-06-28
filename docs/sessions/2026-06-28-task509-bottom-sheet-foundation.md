# Session: Task 509 — Mobile bottom-sheet foundation for DROPDOWN overlays

**Date:** 2026-06-28  
**Executor:** Sonnet 4.6  
**Kickoff:** `tasks/Sprints/Sprint_39_kickoff_prompt_Task_509_MobileBottomSheetOverlayFoundation.md`

---

## Current behavior (preserved)

- Select desktop (≥640): anchored dropdown, §6d chrome (gray-2 border, chevron, brand focus ring, 44px, disabled fade) — Task 495/507 intact, pixel-identical on desktop.
- Every existing Select consumer keeps its props (value/onChange/data/searchable/disabled/placeholder). No API break.
- `MantineDialogDrawerPattern` (Modal/Drawer) unchanged.

## Required after-behavior (implemented)

- At `<640`, opening the `Select` shows a full-width bottom sheet (drag handle, top-only radius, ≤90dvh internal scroll, options list, backdrop+Esc close, focus back to trigger via `returnFocus`). Selecting an option closes the sheet and updates the value.
- At `≥640`, the `Select` opens the normal anchored dropdown — unchanged from Task 495/507.
- Mechanism is reusable (`useResponsiveDropdown` hook + `bottomSheetDrawerStyles` const) for Batch C.

---

## Positive flow implementation

1. User taps Select trigger at <640 → `onDropdownOpen` fires → `openDrawer()` called → Drawer opens.
2. `dropdownOpened={false}` on the Select prevents the Mantine anchored dropdown from showing.
3. Drawer: bottom-anchored, edge-to-edge, top-only radius (`var(--mantine-radius-lg) ... 0 0`), drag handle, ≤90dvh.
4. User taps option → `handleOptionSelect(val)` → `onChange(val, item)` → `closeDrawer()`.
5. `returnFocus` on Drawer: focus returns to Select trigger after close.

## Negative flow implementation

| Branch | Handler/Guard | Location |
|---|---|---|
| Backdrop tap | `<Drawer closeOnClickOutside>` (Mantine default) → `onClose={closeDrawer}` | `MantineBottomSheetSelect.tsx` |
| Esc key | `<Drawer closeOnEscape>` (Mantine default) → `onClose={closeDrawer}` | `MantineBottomSheetSelect.tsx` |
| Disabled Select | `onDropdownOpen={isMobile && !disabled ? openDrawer : undefined}` — no handler when disabled | `MantineBottomSheetSelect.tsx:L141` |
| Empty options | `items.length === 0` renders placeholder text in sheet | `MantineBottomSheetSelect.tsx:L166` |
| Long uk option | `whitespace: 'normal', wordBreak: 'break-word'` on option Text | `MantineBottomSheetSelect.tsx:L185` |
| SSR/no-flash | Drawer only rendered when `isMobile` (post-hydration); always closed on SSR | `MantineBottomSheetSelect.tsx:L150` |
| Rapid re-open | `useDisclosure` guards: `open()` is a no-op if already open | `useResponsiveDropdown()` hook |
| Disabled item | `onClick` guards `if (!item.disabled)` + HTML `disabled` prop on `UnstyledButton` | `MantineBottomSheetSelect.tsx:L174` |

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/patterns/MantineBottomSheetSelect.tsx` | **NEW** | Main deliverable: `MantineBottomSheetSelect`, `useResponsiveDropdown`, `bottomSheetDrawerStyles` |
| `src/design-system/mantine/patterns/index.ts` | +3 export lines | Barrel export for new component/hook/styles |
| `src/stories/mantine/primitives/Select.stories.tsx` | Extended | Sections 5–7: bottom-sheet, long-uk, disabled-sheet |
| `messages/en.json` | +2 keys | `sel_option_long_stress`, `sel_sheet_note` |
| `messages/sq.json` | +2 keys | Albanian parity |
| `messages/uk.json` | +2 keys | Ukrainian parity (real Cyrillic) |
| `messages/it.json` | +2 keys | Italian parity |
| `docs/mantine-responsive-design-system.md` | +§19 (4 sub-sections) | Documents canonical dropdown→bottom-sheet pattern for Batch C |
| `docs/tailadmin-style-reference.md` | +§6i pointer row | Pointer to §19 for Batch C overlay implementations |
| `docs/backlog.md` | Last Session updated | Task 509 status |

---

## Acceptance criteria self-audit

| AC | Verification | Status |
|---|---|---|
| AC1: Shared mechanism in `src/design-system/mantine/**` (one hook/wrapper, reused) | `useResponsiveDropdown()` + `bottomSheetDrawerStyles` exported from `MantineBottomSheetSelect.tsx`; barrel in `index.ts` | ✅ |
| AC2: Select anchored dropdown at ≥640 (Task 495/507 chrome intact) AND full-width bottom sheet at <640 | Desktop: `dropdownOpened=undefined` + `onDropdownOpen=undefined` → normal Select behavior. Mobile: `dropdownOpened={false}` + `onDropdownOpen=openDrawer` + Drawer with P0 styles | ✅ |
| AC3: Backdrop tap + Esc both close sheet without committing selection; focus returns to trigger | Mantine Drawer defaults handle backdrop+Esc; `returnFocus` prop; selection only via `handleOptionSelect` | ✅ |
| AC4: Disabled, empty, long-uk-option, SSR-no-flash all handled | See Negative flow table above | ✅ |
| AC5: Pattern documented in `mantine-responsive-design-system.md` + pointer in `tailadmin-style-reference.md` | §19 added + §6i pointer row | ✅ |
| AC6: Story extended (Mantine proof path); rendered matrix at uk@320/375/390 (owner to verify via toolbar) | Sections 5–7 added; `check:stories` 0 violations | ✅ (owner renders) |
| AC7: Zero hardcode; locale parity sq/en/uk/it; no Select consumer API break; `MantineDialogDrawerPattern` untouched | All values use `var(--mantine-*)` / rem exemptions; 2008 keys ×4; API unchanged; `MantineDialogDrawerPattern.tsx` not touched | ✅ |
| AC8: Gates green | See below | ✅ |

---

## Gate transcript

```
tsc --noEmit:         0 errors ✅
check:stories:        88 files, 0 violations ✅
check:i18n:           2008 keys ×4 locales, parity PASSED ✅
check:design-tokens:  0 violations ✅
check:mojibake:       0 artifacts in 1451 files ✅

File integrity (NUL=0, parseable):
  MantineBottomSheetSelect.tsx : 9077 bytes, NUL=0 ✅
  index.ts                     : 2620 bytes, NUL=0 ✅
  Select.stories.tsx           : 5103 bytes, NUL=0 ✅
  en.json                      : 94864 bytes, NUL=0, JSON.parse OK ✅
  sq.json                      : 101489 bytes, NUL=0, JSON.parse OK ✅
  uk.json                      : 133089 bytes, NUL=0, JSON.parse OK ✅
  it.json                      : 100160 bytes, NUL=0, JSON.parse OK ✅
```

---

## Rendered proof matrix (clause 12 — owner verification required via Storybook toolbar)

Story: `Mantine/Primitives/Select` → `Default`

| Section | uk@320 | uk@375 | uk@390 | en@320 | sq@320 | it@320 |
|---|---|---|---|---|---|---|
| 5 — bottom-sheet trigger (closed) | owner verifies: full-width trigger, §6d chrome | — | — | — | — | — |
| 5 — bottom-sheet open (tap at <640) | owner verifies: edge-to-edge sheet, top-only radius, drag handle, ≤90dvh, option rows ≥44px | — | — | — | — | — |
| 6 — long-uk stress option (in sheet at <640) | owner verifies: long uk label wraps, no clip, no h-scroll at 320 | — | — | — | — | — |
| 7 — disabled bottom-sheet | owner verifies: opacity 0.5 whole-control fade, tap does NOT open sheet | — | — | — | — | — |
| 2 — anchored dropdown (desktop ≥640) | owner verifies at ≥640: anchored dropdown unchanged | — | — | — | — | — |

Owner must confirm at `<640px` toolbar: P0 bottom-sheet behavior (NOT an anchored mini-dropdown).

---

## Architecture decision notes

**Why `dropdownOpened={false}` + `onDropdownOpen` (not `comboboxProps.store`):**  
The Select component creates its internal `useCombobox` store with `opened: dropdownOpened`. When `opened: false` (controlled), `openDropdown()` still fires `onDropdownOpen` because `!dropdownOpened` is always `true`. This intercepts the user's open-intent without creating a custom store. Simpler, fewer moving parts, same result.

**Why shared hook (`useResponsiveDropdown`) not per-component:**  
Batch C (Menu/Popover/Combobox/NavigationMenu) all need the same `isMobile` + Drawer state. The hook encapsulates both so each overlay is one `useResponsiveDropdown()` call + one `<Drawer styles={bottomSheetDrawerStyles}>`. No copy-paste required.

**`MantineDialogDrawerPattern` not modified:**  
Kickoff explicitly scoped this as OUT OF SCOPE. The dialog pattern is already canonical and unchanged. Future task could extract shared styles from it too.

---

**Self-validation verdict:** All gates green. Positive + negative flows implemented. AC1–AC8 satisfied. Rendered matrix requires owner Storybook toolbar verification at uk@320/375/390. Emitting NO git commands — orchestrator reviews diff and emits commits.
