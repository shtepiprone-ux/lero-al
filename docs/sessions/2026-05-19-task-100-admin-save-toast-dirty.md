# Task 100 — Admin User form: add success toast and disable Save until changed

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Investigation

### `src/components/admin/AdminUserProfile.tsx`

**Bug 1 — No save toast:**

`handleSave` (lines 473–490):
```tsx
async function handleSave(data: FormValues) {
  ...
  setSaving(false)
  if (result.error) { setSaveError(result.error); return }  // ← no toast
  form.reset(data)
  setEditActive(false); router.refresh()  // ← no success toast
}
```

On error: sets `saveError` state (shown as inline banner) — no toast.
On success: resets form, exits edit mode — no toast. User has no feedback that save completed.

**Bug 2 — Save button always enabled:**

```tsx
<Button ... disabled={saving}>
```

`disabled={saving}` — only disabled while the server call is in-flight. Even when no fields have been modified, the button is enabled. `isDirty` was already extracted from `formState` (line 392) but not used for the button.

---

## Implementation

### 1. Added i18n keys to all 4 locale files

Added to `admin.user_profile.feedback` namespace in each locale:

| Locale | `save_success` | `save_error` |
|--------|---------------|-------------|
| sq | Profili u ruajt me sukses. | Gabim gjatë ruajtjes. Ju lutemi provoni sërish. |
| en | Profile saved successfully. | Error saving profile. Please try again. |
| uk | Профіль збережено успішно. | Помилка збереження профілю. Спробуйте ще раз. |
| it | Profilo salvato con successo. | Errore durante il salvataggio. Riprova. |

### 2. Added toasts to `handleSave`

```tsx
// On error:
if (result.error) { setSaveError(result.error); toast.error(t('feedback.save_error')); return }

// On success:
toast.success(t('feedback.save_success'))
form.reset(data)
setEditActive(false); router.refresh()
```

Inline `saveError` banner is preserved for detailed error display (admin context — shows server error string).

### 3. Fixed Save button `disabled` condition

```tsx
// Before:
disabled={saving}

// After:
disabled={saving || (!isCreate && !isDirty)}
```

Logic:
- `saving`: disabled while server call is in-flight (unchanged)
- `!isCreate && !isDirty`: in edit mode only — disabled when no field has changed
- Create mode (`isCreate === true`): button always enabled (new user form, no baseline to compare against)

`isDirty` is already extracted from `react-hook-form`'s `formState` at line 392.

After successful save, `form.reset(data)` is called which resets `isDirty` to `false` — the Save button becomes disabled again automatically (no unsaved changes).

---

## Files changed

- `messages/sq.json`
- `messages/en.json`
- `messages/uk.json`
- `messages/it.json`
- `src/components/admin/AdminUserProfile.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-100-admin-save-toast-dirty.md` (this file)

---

## Key counts

Before: 824 per locale. After: **826** per locale (+2 toast keys). All 4 files balanced.

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| Key parity | ✅ 826 in all 4 locale files |
| `npm run build` | Not run (per policy — user runs manually) |
