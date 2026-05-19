# Task 91 — Fix Italian Locale Fallback to Ukrainian

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem summary

When the active locale was Italian (`it`), certain error states in the cabinet profile page displayed Ukrainian text instead of Italian. Specifically:
- Avatar upload failures showed a Ukrainian error toast
- Avatar removal failures showed a Ukrainian inline error message
- Account deletion failures showed a Ukrainian inline error message

---

## Investigation findings

### 1. Locale resolution chain
- `src/i18n/routing.ts`: `locales: ['sq', 'en', 'uk', 'it']`, `defaultLocale: 'sq'`, `localeDetection: false`
- `src/i18n/request.ts`: Falls back to `defaultLocale` (`'sq'`) for unknown locales — never `'uk'`
- No fallback chain configured in next-intl that would route `it` → `uk`

### 2. Key set comparison
- All four locale files have identical 819 leaf keys (confirmed via deep recursive comparison)
- `messages/it.json` contains no Cyrillic characters
- `governance:localization` PASS at baseline (C0/H0/M18)

### 3. Middleware
- `src/middleware.ts`: Uses `handleI18nRouting` from `next-intl/middleware`. No custom locale negotiation. Does not select `uk` for `it` requests.

### 4. Admin locale
- `src/app/admin/layout.tsx`: Admin panel reads `admin-locale` cookie, defaults to `'en'` — not `'uk'`

### 5. Root cause — hardcoded Ukrainian error pass-throughs
Three locations in client components directly passed raw server-action/API error strings to UI:

| Location | Line | Raw error source | Ukrainian string |
|----------|------|-----------------|-----------------|
| `AdminUserAvatar.tsx` | 111 | `fetch('/api/upload-avatar')` response | `'Файл не надано'`, `'Тільки JPG...'` etc. |
| `AdminUserAvatar.tsx` | 146 | `removeUserAvatar()` admin action | `'Не вдалось видалити аватар'` |
| `ProfileTab.tsx` | 361 | `deleteOwnAccount()` cabinet action | `'Не вдалось видалити акаунт'` |

All other error paths were already correct:
- `updateCabinetProfile` error → ProfileTab uses `t('error_saving')` ✓
- `initiateEmailChange` / `resendEmailVerification` → locale-aware `emailError(key, locale)` map ✓
- `consumeEmailChangeToken` → confirm-email page uses `errorCode` to select i18n key ✓
- Avatar client-side validation → already uses `tc('avatar_error_type')` etc. ✓

---

## Implementation summary

### `src/components/admin/AdminUserAvatar.tsx`

**Fix 1** — line 111: upload error toast
```tsx
// Before:
toast.error(result.error)
// After:
toast.error(tc('avatar_upload_error'))
```

**Fix 2** — line 146: remove error inline display
```tsx
// Before:
if (result.error) { setError(result.error); return }
// After:
if (result.error) { setError(tc('error_deleting')); return }
```

`tc` is `useTranslations('cabinet')`, already defined at line 42.

### `src/modules/cabinet/components/ProfileTab.tsx`

**Fix 3** — line 361: delete account error inline display
```tsx
// Before:
setDeleteError(result.error)
// After:
setDeleteError(t('error_deleting'))
```

`t` is `useTranslations('cabinet')`, defined at line 253.

No new i18n keys were added — all fixes use existing `cabinet.avatar_upload_error` and `cabinet.error_deleting` keys.

---

## Keys used

| Key | Namespace | sq | en | uk | it |
|-----|-----------|----|----|----|----|
| `avatar_upload_error` | `cabinet` | Ngarkimi dështoi. Ju lutemi provoni përsëri. | Upload failed. Please try again. | Завантаження не вдалося. Спробуйте ще раз. | Caricamento fallito. Riprova. |
| `error_deleting` | `cabinet` | Gabim gjatë fshirjes | Error deleting | Помилка видалення | Errore nell'eliminazione |

---

## Files changed

- `src/components/admin/AdminUserAvatar.tsx`
- `src/modules/cabinet/components/ProfileTab.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-91-italian-locale-fallback-to-ukrainian.md` (this file)

---

## Locales checked

- `sq` ✅ — `cabinet.avatar_upload_error` and `cabinet.error_deleting` correct
- `en` ✅ — same keys correct
- `uk` ✅ — same keys correct
- `it` ✅ — will now show Italian instead of Ukrainian in error states

---

## Responsive coverage

Changes are text-only (error message strings). No layout changes introduced. Visual rendering at all 7 breakpoints unaffected.

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test file errors, 0 new |
| `npm run governance:localization` | ✅ PASS — C0/H0/M18, at baseline |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| Primitives regression H:57→H:88 | Pre-existing — confirmed via stash test (present before Task 91 changes) |
| `npm run build` | Not run (per project policy — user runs manually) |

---

## Known remaining items

- **Admin action Ukrainian errors** (`src/modules/admin/actions/index.ts`): 20+ hardcoded Ukrainian error strings in admin-only actions (`createAdminUser`, `updateAdminUser`, etc.). These affect admin panel users who set admin locale to `it`. Separate task recommended.
- **`uploadCabinetAvatar` server action**: Dead code (not called by any component). Ukrainian error strings present but never surface in UI.
- **`api/upload-avatar` route**: Ukrainian error strings remain in the HTTP route response. Now masked at component level by `tc('avatar_upload_error')`. Root cause fix (locale-aware API) deferred.
- **`waText` in `ListingMobileCTA`**: Hardcoded Albanian WhatsApp pre-fill message — separate bug, separate task.
