# Session Log — Task 373 v2 — Dialog + Sheet: Full-Width Bottom Sheet at <640

**Date:** 2026-06-03  
**Task:** Sprint_32_CORRECTIVE_B_Task_373_Dialog.md (v2 re-do)  
**Executor:** Sonnet 4.6

---

## Summary

v2 re-do. Main change: Dialog becomes a full-width bottom sheet at <640px (removes centered card on mobile). Sheet `side="bottom"` gets drag handle + `rounded-t-2xl` + `max-h-[90dvh]`. Scroll model was already correct from v1. tsc=0, lint=0.

**Rendered matrix: NOT CHECKED by Sonnet. OWNER QA REQUIRED at all breakpoints × 4 locales.**

---

## Before / After

**Dialog at <640 — BEFORE:**  
`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-2rem)] rounded-2xl` → centered card with 1rem side margins.

**Dialog at <640 — AFTER:**  
`max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-w-none max-sm:rounded-t-2xl max-sm:rounded-b-none` → full-width bottom sheet, edge-to-edge, rounded top only, slide-up animation.

**Dialog at ≥640 — unchanged:**  
`sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:rounded-2xl` → same centered card.

---

## AC Self-Audit

| AC# | Requirement | Implementation | Verification | Status |
|-----|-------------|----------------|--------------|--------|
| AC1 | No horizontal scrollbar anywhere | Body has `overflow-x-hidden`; popup has `overflow-hidden` to clip; no `overflow-x-auto` on popup | grep gate: see below | PASS |
| AC2 | Normal-content dialog: no scrollbar | Body `overflow-y-auto` only shows scrollbar when content exceeds `max-h-[90dvh]` | Static analysis | PASS |
| AC3 | Close X never under scrollbar | X strip is a `shrink-0` div OUTSIDE the `flex-1 overflow-y-auto` body — structurally separated | `dialog.tsx:62-75` | PASS |
| AC4 | No stray gray background | No `bg-muted/50` in footer or body; `DialogFooter` has only `border-t pt-4` | `dialog.tsx:105` | PASS |
| AC5 (mobile gate) | Dialog = full-width bottom sheet at <640 | `max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-w-none max-sm:rounded-t-2xl max-sm:rounded-b-none` | `dialog.tsx:60-69` | PASS (static) / NOT CHECKED (rendered) |
| AC5 (drag handle) | Drag handle bar at top (mobile only) | `max-sm:flex hidden` div with `h-1 w-10 rounded-full bg-muted-foreground/30` before close strip | `dialog.tsx:71-73` | PASS (static) |
| AC5 (animation) | Slide-up on mobile, zoom on desktop | `max-sm:data-open:slide-in-from-bottom` + `sm:data-open:zoom-in-95` | `dialog.tsx:65-69` | PASS (static) |
| AC5 (Sheet bottom) | Sheet side="bottom": full-width, rounded-t-2xl, max-h, drag handle | Added `data-[side=bottom]:rounded-t-2xl data-[side=bottom]:rounded-b-none data-[side=bottom]:max-h-[90dvh]`; drag handle rendered when `side==='bottom'` | `sheet.tsx:56,63-67` | PASS (static) |
| AC5 (trigger) | DialogTrigger full-width at <640 | Trigger inherits Task 372 Button primitive `max-sm:w-full` | `button.tsx` sizes | PASS |
| AC5 (footer) | Footer buttons full-width at <640 | `DialogFooter` is `flex-col-reverse sm:flex-row` — each button full-width at <640 | `dialog.tsx:105` | PASS |

---

## Command Transcript

| Command | Exit | Result |
|---------|------|--------|
| `npx tsc --noEmit` | 0 | No errors |
| `npm run lint` | 0 | Clean |
| `npm run check:i18n` | NOT RUN | No new i18n keys added |
| `npm run build-storybook` | NOT RUN | Deferred to owner QA |

---

## Grep Gates

### Gate 1: No overflow-x-auto/scroll on dialog/sheet popup element
```
grep -n "overflow-x" src/components/ui/dialog.tsx src/components/ui/sheet.tsx
```
```
src/components/ui/dialog.tsx:86: "flex-1 min-h-0 overflow-y-auto overflow-x-hidden grid gap-4..."
src/components/ui/sheet.tsx:79:  "flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col..."
```
Only `overflow-x-hidden` on the scroll body (prevents h-scroll inside). No `overflow-x-auto` or `overflow-x-scroll` anywhere. ✅

---

## Rendered Verification Matrix

**OWNER QA REQUIRED.** Sonnet cannot render the app.

Critical cells to verify (uk@320/375/390 mandatory):

| Surface | 320 | 375 | 390 | 640+ |
|---------|-----|-----|-----|------|
| Dialog Default — bottom sheet edge-to-edge | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED (centered card) |
| Dialog LongContent — body scrolls, X fixed | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Dialog MobileFullWidth (uk, defaultOpen) | NOT CHECKED | NOT CHECKED | NOT CHECKED | n/a |
| Dialog LocaleVariant (uk) | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Sheet side="bottom" — drag handle, rounded-t | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| DialogTrigger Button — full-width | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| DialogFooter buttons — full-width at <640 | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |

Verify per cell: full-width edge-to-edge · no h-scroll · drag handle visible · X above scroll track · footer buttons full-width · uk labels wrap.

---

## STOP&ASK Log

| Ambiguity | Stopped? | Resolution |
|-----------|----------|------------|
| Sheet `side="left"/"right"` at mobile — are they full-width per P0? | No — task says "Sheet already edge-anchored", scope limited to Dialog + Sheet bottom | Left/right sheets are intentional side drawers; `side="bottom"` already full-width via `inset-x-0`. Note: `FilterBar.tsx` uses `side="right"` with consumer `max-w-sm` limiting width at >320px — potential P0 violation, flagged for Task 376/377 review. |
| `MobileFullWidth` story uses `defaultOpen` | Documented | Task explicitly authorised `defaultOpen` in this isolated story for visual inspection |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | `DialogContent`: removed centered-card mobile positioning; added full-width bottom-sheet `max-sm:*` classes; slide-up animation at mobile; zoom animation at desktop (`sm:*`); drag handle div (mobile only); close button `pt-0` at mobile (drag handle provides spacing) |
| `src/components/ui/sheet.tsx` | `SheetContent`: added `data-[side=bottom]:rounded-t-2xl data-[side=bottom]:rounded-b-none data-[side=bottom]:max-h-[90dvh]`; drag handle rendered for `side="bottom"` |
| `src/components/ui/dialog.stories.tsx` | `MobileDialog`: removed `w-full sm:w-auto` from footer buttons (DialogFooter handles stacking); updated description. Added `MobileFullWidth` story (uk@320, `defaultOpen`) |
| `docs/backlog.md` | Updated Last Session |
| `docs/sessions/2026-06-03-task-373-v2-dialog-sheet-bottom-sheet.md` | This file |

---

## Self-validation

- tsc: 0 errors ✅
- lint: clean ✅
- Grep gate (no overflow-x on popup): ✅
- Scroll model: X strip outside body scroll, footer outside body scroll ✅
- Rendered matrix: NOT CHECKED — OWNER QA REQUIRED
- Task status: INCOMPLETE pending owner rendered QA
