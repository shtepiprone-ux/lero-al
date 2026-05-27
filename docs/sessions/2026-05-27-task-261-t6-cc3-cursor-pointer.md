# Task 261 — T.6 / CC.3 — `cursor-pointer` on every interactive control

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** T — Global UX Polish & Forms / CC — Combobox v2

---

## Audit (Scope 1)

### Root cause

`buttonVariants` (the canonical button primitive in `src/components/ui/button.tsx`) used `@base-ui/react/button` which does NOT default to `cursor: pointer`. No `cursor-pointer` was in the base class string. Since all `<Button>` usages derive from `buttonVariants`, the entire button surface showed arrow cursor on hover.

`SelectTrigger` (`src/components/ui/select.tsx`) also missing `cursor-pointer`.

**Combobox:** `button` variant trigger already had `cursor-pointer` at line 234. Input variant correctly uses `cursor-text` (expected for a text input — no change).

### Disabled control convention

`buttonVariants` uses `disabled:pointer-events-none` — this removes pointer events entirely, so no cursor is shown (the OS default, which varies). Adding `cursor-pointer` to the base is safe: it never reaches the hover state for disabled buttons.

`SelectTrigger` uses `disabled:cursor-not-allowed` — overrides `cursor-pointer` for disabled state. Correct.

### Existing `cursor-pointer` audit (all usages — none are redundant after this fix)

| File | Element | Redundant after fix? | Action |
|------|---------|---------------------|--------|
| `Combobox.tsx:234` | raw `<button>` trigger | No — not using `buttonVariants` | Keep |
| `Header.tsx:226` | `<DropdownMenuItem>` | No — not a `<Button>` | Keep |
| `NotificationItem.tsx:50` | conditional on notification | No — custom interactive div | Keep |
| `checkbox.stories.tsx:47` | `<label htmlFor>` | No — label for checkbox | Keep |
| `AdminUserProfile.tsx:935` | `<label>` for checkbox | No | Keep |
| `AdminUserCreate.tsx:249` | `<label>` for checkbox | No | Keep |
| `AvatarCropModal.tsx:130` | `<input type="range">` | No | Keep |
| `AdminUserAvatar.tsx:154` | clickable div (upload) | No | Keep |
| `AdminSupportManager.tsx:656` | table row | No | Keep |
| `AdminSidebar.tsx:156` | raw `<button>` (see governance debt below) | No — raw button, cursor-pointer correct | Keep |
| `AdminReportsManager.tsx:287` | table row | No | Keep |
| `AdminPropertyTypesManager.tsx:355` | `<Badge>` | No | Keep |
| `AdminEmailTemplatesManager.tsx:247` | `<label>` for checkbox | No | Keep |
| `ImageUpload.tsx:201` | file upload area | No | Keep |
| `FloorGroupField.tsx:61` | `<Label>` for checkbox | No | Keep |

**No duplicates to remove.** All existing usages are on non-Button elements where `buttonVariants` doesn't apply.

### Governance debt — raw `<button>` anti-patterns (do NOT fix here)

Per ui-rules.md §0, all interactive controls must use the canonical `<Button>` primitive. These pre-existing violations escape it:

| File | Line | Context |
|------|------|---------|
| `AdminSidebar.tsx` | 154 | Logout button |
| `Combobox.tsx` | 229 | Button-variant trigger |
| `MobileBottomNav.tsx` | (multiple) | Nav items |
| `AdminUserAvatar.tsx` | (multiple) | Avatar upload |
| `AdminInquiriesManager.tsx` | 215 | Inquiry list rows |
| `SaveToCollectionButton.tsx` | 132 | Collection toggle rows |

File as follow-up under governance debt (no ticket number yet).

---

## Changes

### `src/components/ui/button.tsx`

Added `cursor-pointer` to the `buttonVariants` base class string (after `select-none`, before `focus-visible:`):

```
... select-none cursor-pointer focus-visible:border-ring ...
```

### `src/components/ui/select.tsx`

Added `cursor-pointer` to the `SelectTrigger` base class string (after `select-none`):

```
"flex w-fit ... select-none cursor-pointer",
```

`disabled:cursor-not-allowed` already present in the next line overrides `cursor-pointer` when disabled.

---

## Positive flow verification

- `<Button>` (all variants: default, outline, secondary, ghost, destructive, link) → pointer on hover ✅
- `<SelectTrigger>` → pointer on hover ✅
- `Combobox` button-variant trigger → pointer on hover ✅ (already had it)
- `Combobox` input-variant trigger → text cursor ✅ (correct, `cursor-text`)
- `<a>` styled via `buttonVariants` (WhatsApp link, Call, View/Edit in admin) → anchor already shows pointer when `href` present; `cursor-pointer` from `buttonVariants` also applies ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| `<Button disabled>` | pointer-events: none → OS default cursor | ✅ `disabled:pointer-events-none` prevents any hover |
| `<SelectTrigger disabled>` | `cursor-not-allowed` | ✅ `disabled:cursor-not-allowed` overrides `cursor-pointer` |
| `<Combobox disabled>` | `cursor-not-allowed` | ✅ `triggerBase` has `disabled:cursor-not-allowed` |
| `<label>` elements with `cursor-pointer` | unchanged | ✅ not affected by this change |
| Non-interactive `<div>` / `<span>` | no false positives added | ✅ only canonical primitives changed |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `cursor-pointer` present in `buttonVariants` base class — verifiable at `button.tsx:7`
- [x] `cursor-pointer` present in `SelectTrigger` base class — verifiable at `select.tsx:46`
- [x] Combobox button-variant: unchanged — already had `cursor-pointer` at `Combobox.tsx:234`
- [x] Combobox input-variant: unchanged — correctly uses `cursor-text` at `Combobox.tsx:226`
- [x] No `cursor-pointer` duplicates removed (none were redundant — all on non-Button elements)
- [x] Disabled state preserved: `disabled:pointer-events-none` in button; `disabled:cursor-not-allowed` in select
- [x] 0 locale key changes (pure classname fix)
- [x] Governance debt documented (raw `<button>` list above)

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

Pure CSS classname change to two canonical primitives. No layout classes added. All 7 breakpoints (320/375/390/768/1280/1440/2560) unaffected. Desktop-only observable change (cursor is irrelevant on touch devices).

---

## Files changed

```
src/components/ui/button.tsx
src/components/ui/select.tsx
```
