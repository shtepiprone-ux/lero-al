# Task 201 — R.7: Email-template editor modal width fix

**Date:** 2026-05-24
**Status:** ✅ Complete

## Root cause

`DialogContent` base styles (in `src/components/ui/dialog.tsx`) include `sm:max-w-sm` (384px on ≥640px screens).

`TemplateEditorDialog` passed `className="max-w-2xl max-h-[90vh] overflow-y-auto"`.

With tailwind-merge, responsive-prefixed utilities (`sm:max-w-sm`) and bare utilities (`max-w-2xl`) are in different conflict groups — tailwind-merge does NOT remove the base's `sm:max-w-sm`. Both classes survive in the DOM. CSS then applies the media-query rule last (responsive rules come after base rules in Tailwind's generated CSS), so `sm:max-w-sm` (384px) overrides `max-w-2xl` (672px) on all screens ≥640px.

Result: the editor dialog was always 384px wide on desktop, clipping the tabs, textarea, and other content. When tab content differed in natural width (affecting the dialog's inline-size calculation on narrow screens), it appeared to "auto-change width."

## Fix

**`src/components/admin/AdminEmailTemplatesManager.tsx`, `TemplateEditorDialog`:**

```tsx
// Before
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

// After
<DialogContent className="sm:max-w-2xl">
```

`sm:max-w-2xl` is in the same tailwind-merge conflict group as `sm:max-w-sm` — tailwind-merge removes the base value and keeps the caller's override. The result on desktop is 672px (42rem) stable width.

`max-h-[90vh]` and `overflow-y-auto` were redundant — the base `DialogContent` already supplies `max-h-[90dvh]` and `overflow-y-auto`.

## Result

- Editor modal: stable 672px width on all screens ≥640px (sm+)
- Small screens (<640px): `max-w-[calc(100%-2rem)]` from the base still applies — no edge-to-edge overflow
- No content clipping; no width reflow on tab switch

## Verification

- No new locale keys, no SQL, no schema changes
- 1-line change
- `tsc --noEmit` → 0 errors
