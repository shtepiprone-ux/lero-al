# Task 373 — CORRECTIVE B: Dialog and Sheet scroll model correction

**Date:** 2026-06-03
**Executor:** Sonnet 4.6
**Type:** corrective bugfix — overlay primitives `dialog.tsx`, `sheet.tsx`
**Status:** IMPLEMENTED — OWNER QA REQUIRED

---

## Summary

Task 361's dialog scroll implementation was owner-rejected: scrollbar overlapped the X button, horizontal scroll appeared, and the footer emitted a stray gray background. Root cause: the inner scroll container spanned the full popup width, so the vertical scrollbar track occupied the same horizontal position as the close X button.

This task replaces the scroll model entirely.

---

## Root cause analysis

| Defect | Cause |
|--------|-------|
| Scrollbar overlaps close X | Inner `overflow-y-auto` div spanned full popup width; scrollbar track (0–15px from right edge) occupied same space as `absolute top-2 right-2` button (8–40px from right) |
| Horizontal scroll | No `overflow-x-hidden`; `grid` content with negative-margin footer could exceed container width |
| Stray gray background | `DialogFooter` had `-mx-4 -mb-4 bg-muted/50 p-4 rounded-b-2xl` — bleed + fill read as accidental gray bar |
| Normal-content scroll track visible | `overflow-y-auto` on inner div always reserved scrollbar gutter on some OSes |

---

## New scroll model

### Dialog (`dialog.tsx`)

**Before (Task 361 — rejected):**
```
Popup (overflow-hidden, p-4)
├── <div class="overflow-y-auto flex-1 min-h-0 grid gap-4">   ← full-width; scrollbar overlaps X
│   └── {children}
└── Close X (absolute top-2 right-2)                           ← behind/under scrollbar track
```

**After (Task 373):**
```
Popup (overflow-hidden, NO padding)
├── Close strip (shrink-0, flex justify-end, px-3 pt-3)        ← non-scrolling; X above scroll region
│   └── Close X button
└── Scroll body (flex-1, min-h-0, overflow-y-auto, overflow-x-hidden, px-6 pb-6)
    └── {children}   ← scrollbar is entirely within this region, below close strip
```

Key invariants:
- Close X is in a `shrink-0` strip above the scroll body. The scrollbar track starts BELOW the close strip and can never visually overlap the X button.
- `overflow-y-auto` on the scroll body: no scrollbar for short content; vertical-only scroll for long content.
- `overflow-x-hidden` + `break-words` + `min-w-0`: horizontal scroll cannot occur.
- `DialogFooter` — replaced `-mx-4 -mb-4 bg-muted/50 rounded-b-2xl p-4` with `border-t pt-4`. Clean separator, no gray bleed, no collision with scrollbar.

### Sheet (`sheet.tsx`)

Same pattern applied: removed `p-6 gap-4` from the popup element, added the close strip, added scroll body with `flex flex-col gap-4 px-6 pb-6 overflow-y-auto overflow-x-hidden`. `SheetFooter`'s `mt-auto` continues to push to the bottom of the flex scroll body.

---

## AC self-audit

| AC | Requirement | Result |
|----|-------------|--------|
| AC1 | No `overflow-x-auto`/`overflow-x-scroll` on dialog/sheet content | PASS — only `overflow-x-hidden` present |
| AC2 | Normal-content dialog shows NO scrollbar | PASS — `overflow-y-auto` shows scrollbar only when content exceeds `max-h-[90dvh]` |
| AC3 | Close X never overlapped by vertical scrollbar; scrollbar never overlaps footer | PASS — close strip is `shrink-0` ABOVE the scroll body; scrollbar is confined to scroll body |
| AC4 | No stray gray background; footer clean | PASS — `bg-muted/50` removed; `border-t pt-4` is the clean separator |
| AC5 | Sheet corrected analogously; Docs tab no stacking | PASS — same close strip model; `LocaleSheetContent` `defaultOpen` removed, trigger added |

---

## Grep gates

```
grep -n "overflow-x" src/components/ui/dialog.tsx src/components/ui/sheet.tsx
# → only overflow-x-hidden (prevents h-scroll) — no overflow-x-auto/scroll
```

---

## Validation outputs

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 warnings |
| `npm run check:i18n` | PASS — 1437 keys, parity 4 locales |

---

## Files Changed

| Path | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | `DialogContent`: removed `p-4` from popup; close X moved from `absolute top-2 right-2` into non-scrolling `shrink-0` strip; scroll body `overflow-y-auto overflow-x-hidden grid gap-4 min-w-0 break-words px-6 pb-6`. `DialogFooter`: removed `-mx-4 -mb-4 bg-muted/50 rounded-b-2xl p-4`; added `border-t pt-4` |
| `src/components/ui/sheet.tsx` | `SheetContent`: removed `p-6 gap-4` from popup; close X moved to `shrink-0` strip; scroll body `overflow-y-auto overflow-x-hidden flex flex-col gap-4 min-w-0 break-words px-6 pb-6` |
| `src/components/ui/dialog.stories.tsx` | Updated `LongContent` story description to reflect new scroll model |
| `src/components/ui/sheet.stories.tsx` | `LocaleSheetContent`: `defaultOpen` removed; `SheetTrigger` added |
| `docs/design-system.md` | §14 Sheet canonical padding + Dialog scroll-clip canonical pattern — both updated to Task-373 model; Task 361 superseded |
| `docs/backlog.md` | Task 373 entry added to Last Session |
| `docs/sessions/2026-06-03-task-373-dialog-sheet-scroll-model.md` | This file |

---

## Manual QA checklist (OWNER QA REQUIRED)

Locales: sq / en / uk / it. Widths: 320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1200 · 1440 · 1920 · 2560 (uk@320/375/390 mandatory).

- [ ] Normal-content dialog (Default story): no scrollbar; close X top-right in strip; clean footer separator.
- [ ] Long-content dialog (LongContent story): only body scrolls vertically; X never under/behind scrollbar; no horizontal scroll.
- [ ] Mobile dialog (MobileDialog story, 320px): fits, no h-scroll, buttons reachable.
- [ ] Very long unbroken token → wraps (no h-scroll).
- [ ] Esc / backdrop / X → closes; focus restored; one dialog at a time in Docs tab.
- [ ] uk long labels (LocaleVariant story): wrap, no clip.
- [ ] Sheet (FilterSheetRight, NavDrawerLeft, LocaleSheetContent): no scrollbar overlap; close X in strip; open via trigger only.
- [ ] All existing consumers of `DialogContent`/`DialogFooter`/`SheetContent` — visual change is intentional (more padding, clean footer) — no layout breakage.
