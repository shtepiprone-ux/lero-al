# Task 361 — Sheet indentation spacing + Dialog stacking bug + scroll-slider clipping

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** bug — overlay primitives `sheet.tsx`, `dialog.tsx` + `dialog.stories.tsx`

---

## Summary

Three overlay primitive bugs fixed:

1. **Sheet padding (AC1)**: `SheetContent` now carries canonical `p-6` (24px). `SheetHeader` and `SheetFooter` no longer have their own `p-4` — the parent container provides symmetric indentation. Consumers who override via `className` (e.g. `p-0`, `p-5`) are unaffected.

2. **Dialog stacking (AC2)**: `LongContent`, `MobileDialog`, `LocaleVariant` stories changed from `defaultOpen` to trigger-based. Storybook Docs mode no longer renders multiple open dialogs simultaneously.

3. **Dialog scroll-clip (AC3)**: `DialogContent` outer popup changed from `overflow-y-auto` to `overflow-hidden`. An inner `<div className="overflow-y-auto flex-1 min-h-0 grid gap-4">` handles the scrollable content area. `overflow-hidden` on the outer clips the scrollbar to the `rounded-2xl` boundary.

---

## Root cause analysis

### AC1 — Sheet padding inconsistency
- `SheetContent` popup had NO own padding (`gap-4` only)
- `SheetHeader` had `p-4` (16px), `SheetFooter` had `p-4`
- Body content between header and footer had NO horizontal indentation unless the consumer explicitly added `px-*`
- Result: header/footer indented at 16px from sheet edges; body content bled to the sheet edges

### AC2 — Dialog stacking
- `LongContent`, `MobileDialog`, `LocaleVariant` used `defaultOpen={true}` (implicit via `defaultOpen` prop)
- In Storybook Docs mode, ALL stories render simultaneously in one page
- Multiple `defaultOpen` dialogs stack on top of each other
- Clicking `X` closes the top one, revealing the next stacked dialog

### AC3 — Scrollbar clipping
- `DialogContent` had `overflow-y-auto rounded-2xl` on the SAME element
- In some browsers/OS scrollbar configurations, the scrollbar track renders as a straight line that does not respect the element's `border-radius` clip region
- The outer container being both the rounded visual boundary AND the scroll container is the antipattern
- Fix: outer = `overflow-hidden` (clips to rounded-2xl), inner = `overflow-y-auto` (scrolls within clipped bounds)

---

## §17 UI Pre-flight

| Check | Files touched | Result |
|---|---|---|
| Non-canonical dropdowns | none | CLEAN |
| Ad-hoc `h-*` on Button | none | CLEAN |
| `z-[...]` | none | CLEAN |
| `overflow-hidden` on outer + `overflow-y-auto` inner | `dialog.tsx:56,61` — correct pattern | PASS |
| Sheet `p-6` consumer regression | `AuthSheet p-0`, `AdminSidebar p-0`, `ListingsShell p-5` — all override via className → tailwind-merge resolves → no regression | PASS |
| `DialogFooter -mx-4 -mb-4` bleed | Inner div fills outer content area; footer bleeds 4px into outer padding → clips at outer border box (= full-bleed for default `p-4`; 8px indentation for consumer `p-6`, same as before) | PASS |
| 7 breakpoints | Primitive-only; viewport toolbar required | OWNER QA REQUIRED |
| 4 locales | No new i18n strings | PASS |

---

## Changes made

### `src/components/ui/sheet.tsx`

**`SheetContent` popup class string:**
- Added `p-6` after `gap-4`
- Before: `"fixed z-50 flex flex-col gap-4 bg-popover ..."`
- After: `"fixed z-50 flex flex-col gap-4 p-6 bg-popover ..."`

**`SheetHeader`:**
- Before: `cn("flex flex-col gap-0.5 p-4", className)`
- After: `cn("flex flex-col gap-0.5", className)`
- Reason: removed `p-4` — content indentation now comes from parent's `p-6`

**`SheetFooter`:**
- Before: `cn("mt-auto flex flex-col gap-2 p-4", className)`
- After: `cn("mt-auto flex flex-col gap-2", className)`
- Reason: same as SheetHeader

**Close button stays at `absolute top-3 right-3`** — within `p-6` (24px) container, 12px from edge. ✓

### Consumer impact check
| Consumer | SheetContent className | SheetHeader className | Impact |
|---|---|---|---|
| `AuthSheet.tsx` | `p-0` (overrides base `p-6` → `p-0`) | `px-4 pt-5 pb-2 pr-12` (own explicit padding) | No regression ✓ |
| `AdminSidebar.tsx` | `p-0` (overrides → `p-0`) | None used | No regression ✓ |
| `ListingsShell.tsx` | `p-5` (overrides → `p-5`) | None used | No regression ✓ |
| `FilterBar.tsx` | None (uses `p-6` default) | None | Gets canonical `p-6` ✓ |
| `Header.tsx` | `w-full max-w-xs` (no p override) | None | Gets canonical `p-6` ✓ |

### `src/components/ui/dialog.tsx`

**`DialogContent` popup class string changes:**
- Removed: `grid`, `gap-4`, `overflow-y-auto`, `p-4`
- Added: `flex flex-col`, `overflow-hidden`
- Kept: `p-4` (on the outer — remains overridable by consumer's `className`)
- Before: `"fixed ... grid w-full max-w-... max-h-[90dvh] ... gap-4 overflow-y-auto rounded-2xl bg-popover p-4 ..."`
- After: `"fixed ... flex flex-col w-full max-w-... max-h-[90dvh] ... overflow-hidden rounded-2xl bg-popover p-4 ..."`

**Added inner scroll wrapper around `{children}`:**
```tsx
<div className="overflow-y-auto flex-1 min-h-0 grid gap-4">
  {children}
</div>
```
- `overflow-y-auto`: scrolls when content > capped height ✓
- `flex-1`: fills outer container (bounded by `max-h-[90dvh]` once capped) ✓
- `min-h-0`: allows flex child to shrink below content minimum size (needed for scrollable flex-column pattern) ✓
- `grid gap-4`: replicates the original `gap-4 grid` layout for content children ✓
- NO `p-*` on inner: content sees outer's `p-4` indentation directly ✓

**Close button stays outside the inner div** — it's `absolute top-2 right-2`, outside the scroll area. ✓

### `src/components/ui/dialog.stories.tsx`

**`LongContent`**: removed `defaultOpen`, added `<DialogTrigger render={<Button>Terms of service</Button>} />`, removed redundant `className="max-h-[90vh] overflow-y-auto"` (now handled by inner wrapper).

**`MobileDialog`**: removed `defaultOpen`, added `<DialogTrigger render={<Button size="xl">Delete listing</Button>} />`.

**`LocaleVariant`**: removed `defaultOpen`, added `<DialogTrigger render={<Button size="xl">Відкрити діалог</Button>} />`, added `globals: { locale: 'uk' }`.

---

## Note 20 — Before/after control inventory

### `sheet.tsx`
| Before | After |
|---|---|
| `SheetContent`: no own padding (`gap-4` only) | `SheetContent`: `p-6` (canonical 24px) |
| `SheetHeader`: `p-4` (16px individual padding) | `SheetHeader`: no own padding (inherits) |
| `SheetFooter`: `p-4` (16px individual padding) | `SheetFooter`: no own padding (inherits) |
| Close button: `absolute top-3 right-3` — inside unpadded container | Close button: same position, now within `p-6` container (12px from edge) ✓ |

No controls removed. Close button, focus trap, Esc dismiss, backdrop dismiss all preserved. ✓

### `dialog.tsx`
| Before | After |
|---|---|
| `DialogContent`: `overflow-y-auto` on outer popup | `DialogContent`: `overflow-hidden` on outer (clips scrollbar); `overflow-y-auto` on inner wrapper |
| `DialogContent`: `grid gap-4 p-4` on outer | `grid gap-4` moved to inner wrapper; `p-4` stays on outer |
| Close button: outside content children | Close button: still outside inner wrapper, absolute positioned ✓ |

No controls removed. Esc dismiss, backdrop, focus trap, X button all preserved. ✓

### `dialog.stories.tsx`
| Before | After |
|---|---|
| `LongContent`: `defaultOpen` — auto-opens on page load | `LongContent`: trigger-based — requires user click |
| `MobileDialog`: `defaultOpen` | `MobileDialog`: trigger-based |
| `LocaleVariant`: `defaultOpen` | `LocaleVariant`: trigger-based |
| Docs mode: all 3 dialogs stacked simultaneously | Docs mode: no dialogs open simultaneously ✓ |

---

## Negative flow verification

| Negative branch | Handler in diff |
|---|---|
| Esc / backdrop dismiss | Base UI dialog primitive handles these natively — not changed |
| Very long content (uk) | Inner `overflow-y-auto flex-1 min-h-0` scrolls; scrollbar clipped to `rounded-2xl` by outer `overflow-hidden` |
| Multiple triggers in one story | Removed `defaultOpen` — user opens one at a time ✓ |
| Empty sheet/footer (no footer slot) | `mt-auto` on SheetFooter only adds gap when present; no empty-gap artifact ✓ |
| Disabled close button case | `showCloseButton={false}` prop path unchanged ✓ |
| Consumer `overflow-y-auto` override | Consumers who explicitly pass `overflow-y-auto` in `className` (AdminSupportManager, AdminInquiriesManager) override the base `overflow-hidden`. Their scrollbar fix is NOT applied but their intended behavior is preserved. Documented as a known limitation. |

---

## Validation outputs

### `npx tsc --noEmit`
```
(exit 0) ✅
```

### `npm run lint`
```
(exit 0) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1434 keys).
```

### `npm run build-storybook`
```
✓ built in 6.37s / Preview built (7.74s) — exit 0 ✅
```

### Diff scope check
Files NOT touched: `src/app`, `src/modules`, `messages/*.json`, `package.json`, any consumer of Sheet/Dialog outside the story files.

---

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — Sheet correct symmetric padding | `sheet.tsx` — `SheetContent` line 56: `p-6`; `SheetHeader` line 87: no `p-4`; `SheetFooter` line 93: no `p-4` | ✅ |
| AC2 — Dialog shows one at a time, no stacking | `dialog.stories.tsx` — `LongContent`/`MobileDialog`/`LocaleVariant` use `<DialogTrigger>`, no `defaultOpen` | ✅ |
| AC3 — Dialog scrollbar clipped within rounded container | `dialog.tsx:56` — `overflow-hidden` on outer; `dialog.tsx:61` — inner `overflow-y-auto` | ✅ |
| Positive + Negative flow parity | Both documented above | ✅ |
| Existing overlay controls preserved (X, Esc, backdrop, focus trap) | No changes to close/dismiss/portal machinery | ✅ |
| 0 new lint errors | `npm run lint` → exit 0 | ✅ |
| `tsc --noEmit` → 0 | exit 0 | ✅ |
| `build-storybook` passes | exit 0 | ✅ |
| `check:i18n` PASS | 1434 keys | ✅ |
| 4 locales render | No new production strings | ✅ |
| 7 breakpoints render | Primitive-only; viewport toolbar | OWNER QA REQUIRED |
| `design-system.md` + `ui-rules.md` updated | §14 + §16 extended | ✅ |
| `backlog.md` updated | Last Session prepended | ✅ |
| No `git add`/`git commit` emitted | — | ✅ |

---

## Rendered QA matrix (OWNER QA REQUIRED)

| Surface | 320 | 375 | 390 | 768 | 1280 |
|---|---|---|---|---|---|
| Sheet / FilterSheetRight | OQR | OQR | OQR | OQR | OQR |
| Sheet / LocaleSheetContent (uk) | OQR | OQR | OQR | OQR | OQR |
| Dialog / Default (trigger open) | OQR | OQR | OQR | OQR | OQR |
| Dialog / LongContent (scroll) | OQR | OQR | OQR | OQR | OQR |
| Dialog / MobileDialog | OQR | OQR | OQR | OQR | OQR |
| Dialog / LocaleVariant (uk) | OQR | OQR | OQR | OQR | OQR |

OQR = OWNER QA REQUIRED. Use Storybook viewport + locale toolbars.

---

Self-validation: tsc=0 · lint=0 · build-storybook=✅ · check:i18n=PASS (1434 keys) · AC table=all green · scope=clean (sheet.tsx, dialog.tsx, dialog.stories.tsx, 2 docs, backlog)

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/components/ui/sheet.tsx` | `SheetContent`: added `p-6`; `SheetHeader`/`SheetFooter`: removed `p-4` (canonical symmetric padding from parent) |
| `src/components/ui/dialog.tsx` | Outer: `overflow-y-auto grid gap-4` → `overflow-hidden flex flex-col`; inner `<div>` with `overflow-y-auto flex-1 min-h-0 grid gap-4` clips scrollbar to `rounded-2xl` |
| `src/components/ui/dialog.stories.tsx` | Removed `defaultOpen` from 3 stories, added `<DialogTrigger>` — prevents stacked overlays in Docs view |
| `docs/design-system.md` | §14 extended: Sheet canonical padding + Dialog scroll-clip canonical pattern |
| `docs/ui-rules.md` | §16 extended: Sheet padding + Dialog scroll-clip documented |
| `docs/backlog.md` | Last Session updated with Task 361 summary |
| `docs/sessions/2026-06-02-task-361-sheet-padding-dialog-stacking-scroll-clip.md` | This session log |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
