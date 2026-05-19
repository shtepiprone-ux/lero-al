# Task 98 — Constrain Combobox scrollbar within the dropdown bounds

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem

The scrollbar inside custom Combobox dropdowns appeared to extend beyond the dropdown's visible boundary (past the `rounded-xl` corners). This affected all three custom dropdown components: `Combobox`, `LocationCombobox`, and `YearCombobox`.

---

## Root cause

All three components had this single-layer structure:

```tsx
<div className="... rounded-xl shadow-lg overflow-y-auto max-h-56">
  {options}
</div>
```

When `overflow-y: auto` is on the same element as `border-radius`, browsers render the scrollbar track as part of the element's scroll mechanism. In some browsers/OS configurations (Windows native scrollbars, macOS non-overlay scrollbars), the scrollbar visually extends to the element's rectangular bounding box, not its rounded visual boundary — making the scrollbar appear to "bleed out" of the rounded corners.

---

## Fix: Two-layer overflow pattern

Replaced single-layer with two-layer approach in all three components:

```tsx
// OUTER: handles visual boundary (border, shadow, radius) — overflow-hidden clips scroll track
<div className="... rounded-xl shadow-lg overflow-hidden">
  // INNER: handles scrolling — scrollbar is rendered inside the outer's clip
  <div className="overflow-y-auto max-h-56">
    {options}
  </div>
</div>
```

**Why this works:**
- `overflow: hidden` on the outer clips ALL child content — including the inner div's scrollbar track — to the rounded rectangle
- `overflow-y: auto` on the inner provides the actual scrolling behaviour
- The scrollbar track is rendered inside the inner div, which is inside the outer div, so it gets clipped to the outer's rounded shape
- Keyboard navigation is unaffected — scrollbar CSS doesn't touch focus/keyboard handling
- Portal mode: `dropdownStyle` (position, maxHeight) still goes on the outer div; inner `max-h-56` constrains scroll height within

---

## Files changed

| File | Change |
|------|--------|
| `src/components/shared/Combobox.tsx` | Outer: `overflow-hidden` (was `overflow-y-auto`), removed `max-h-56`. Inner: new `<div className="overflow-y-auto max-h-56">` |
| `src/components/shared/LocationCombobox.tsx` | Same two-layer pattern applied |
| `src/components/shared/YearCombobox.tsx` | Same two-layer pattern applied |

---

## Scope note

Task 98 scope: "canonical Combobox instances." The `SettlementCombobox` inside `ProfileTab.tsx` (cabinet) is a custom portal implementation — out of scope per Task 99's note. Its inline-style dropdown uses a different rendering approach.

---

## Localization coverage

All 4 locales: text rendering inside the dropdown is unaffected — only the scroll container structure changed. Long Ukrainian city names tested conceptually — `flex-1 truncate` on option labels handles overflow within fixed-width dropdown.

---

## Keyboard navigation

`overflow-hidden` / `overflow-y-auto` are purely CSS layout properties. Focus management is handled by `onFocus`/`onBlur`/`onMouseDown` event handlers which are unchanged. Arrow key navigation (if any) is also unaffected.

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run build` | Not run (per policy — user runs manually) |
