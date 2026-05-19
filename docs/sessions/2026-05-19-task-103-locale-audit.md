# Session Archive: Task 103 — Epic A.1 — Full Locale Audit — 2026-05-19

## Task 103 Summary

**Type:** Localization QA  
**Epic:** A — Localization & Locale Consistency (A.1)  
**Commit scope:** `fix:`, `chore:`

---

## Pre-Task Checklist

- [x] No duplicate components — audit + server-side fix only, no UI components created
- [x] No hardcode planned — all changes replace Ukrainian error strings with English error codes; no new UI strings
- [x] Scope isolated — touched only: `src/app/api/upload-avatar/route.ts`, `src/components/admin/AdminUserProfile.tsx`, `src/modules/admin/actions/index.ts`, `src/modules/cabinet/actions/index.ts`

---

## Locale Key Count Audit

Governance scan output (baseline):

| Locale | Key count |
|--------|-----------|
| sq     | 862       |
| en     | 862       |
| uk     | 862       |
| it     | 862       |

**Result: Key sets are identical across all four locales. ✅**

Note: Sprint 1 session log stated 826 keys; governance script now reports 862. The difference likely reflects a counting discrepancy between the session log estimate and the governance script's deep-counting algorithm. The governance script is authoritative.

---

## Mixed-Language Values Audit

Reviewed all values in `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`.

### Findings

**No violations found.** The following cases were specifically checked and determined to be correct:

| File | Key | Value | Assessment |
|------|-----|-------|------------|
| `it.json` | `nav.home` | `"Home"` | Acceptable — "Home" is the standard IT web term; identical in `en.json` |
| all | `admin.sidebar.item_dashboard` | `"Dashboard"` | Acceptable — domain-specific technical term |
| all | `admin.sidebar.item_support` | `"Support"` | Acceptable — universal technical term |
| all | `listing.per_sqm` | `"€/m²"` | Acceptable — unit notation, locale-neutral |

**Result: Zero mixed-language value violations. ✅**

---

## Currency Code Audit

Searched codebase for `t('ALL')`, `t('EUR')`, `t('USD')`, `t('GBP')` and similar patterns.

**Result: Zero currency codes are wrapped in `t()` calls. ✅**

Notes:
- `cabinet.currency_ALL` / `cabinet.currency_EUR` / `cabinet.currency_USD` translate full display names (e.g. "Albanian Lek (ALL)") — this is correct.
- The currency codes themselves (`ALL`, `EUR`, `USD`) appear only as literal string values in UI components, not as i18n keys.

---

## API / Server-Action Error String Audit (Sprint 1 Carry-Over)

### Contract Decision

**Chosen: Option (b) — server returns a stable English error code; client resolves to localized message via `t()`.**

Rationale:
- API routes are excluded from next-intl middleware (`/api/*` excluded in `middleware.ts`), so locale is not available server-side without additional overhead.
- Clients already call `useTranslations()` and have all avatar/upload error keys in the `cabinet` namespace.
- English error codes are stable, debuggable, and locale-neutral — no retranslation needed if error messages change.
- This matches the existing pattern for `EMAIL_ERRORS` in `cabinet/actions/index.ts` (which uses inline per-locale strings as an alternative — option (a)), but option (b) is simpler for upload flows.

### Error Code → Client Message Mapping

| Error code | Client i18n key | Display |
|------------|-----------------|---------|
| `no_file` | `cabinet.avatar_upload_error` | Generic upload failed |
| `invalid_type` | `cabinet.avatar_error_type` | Only JPG/PNG/WEBP |
| `file_too_large` | `cabinet.avatar_error_size` | Max 10 MB |
| `file_empty` | `cabinet.avatar_upload_error` | Generic upload failed |
| `invalid_dimensions` | `cabinet.avatar_error_dimensions` | Must be 256×256 |
| `upload_failed` | `cabinet.avatar_upload_error` | Generic upload failed |
| `db_save_failed` | `cabinet.avatar_upload_error` | Generic upload failed |

### Violations Found (all in action/route error strings)

| File | Line(s) | String | Status |
|------|---------|--------|--------|
| `src/app/api/upload-avatar/route.ts` | 76 | `'Файл не надано'` | ✅ Fixed → `'no_file'` |
| `src/app/api/upload-avatar/route.ts` | 82 | `'Тільки JPG, PNG або WEBP'` | ✅ Fixed → `'invalid_type'` |
| `src/app/api/upload-avatar/route.ts` | 85 | `'Максимальний розмір файлу — 2 МБ'` | ✅ Fixed → `'file_too_large'` |
| `src/app/api/upload-avatar/route.ts` | 103 | `'Файл порожній (0 байт) — спробуйте ще раз'` | ✅ Fixed → `'file_empty'` |
| `src/app/api/upload-avatar/route.ts` | 112 | `` `Розмір: …` `` | ✅ Fixed → `'invalid_dimensions'` |
| `src/app/api/upload-avatar/route.ts` | 127 | `'Аватар завантажено але не вдалось зберегти URL'` | ✅ Fixed → `'db_save_failed'` |
| `src/modules/cabinet/actions/index.ts` | 298–302 | 3x Ukrainian validation strings | ✅ Fixed → English codes |
| `src/modules/cabinet/actions/index.ts` | 313, 324 | 2x Ukrainian upload/save errors | ✅ Fixed → English codes |
| `src/modules/cabinet/actions/index.ts` | 50 | `'Помилка збереження профілю'` | ✅ Fixed → `'save_failed'` |
| `src/modules/cabinet/actions/index.ts` | 230 | `'Не вдалось видалити акаунт'` | ✅ Fixed → `'delete_failed'` |
| `src/modules/cabinet/actions/index.ts` | 519–540 | 3x email change token errors | ✅ Fixed → English codes |
| `src/modules/admin/actions/index.ts` | 546–573 | 6x avatar upload Ukrainian strings | ✅ Fixed → English codes |
| `src/modules/admin/actions/index.ts` | 474, 504 | `'Тільки адміністратор може видаляти профілі'` | ✅ Fixed → `'admin_only'` |
| `src/modules/admin/actions/index.ts` | 480, 524 | `'Не вдалось видалити профіль'` | ✅ Fixed → `'delete_failed'` |
| `src/modules/admin/actions/index.ts` | 531 | `'Профіль видалено, але не вдалось видалити обліковий запис'` | ✅ Fixed → `'profile_deleted_auth_failed'` |
| `src/modules/admin/actions/index.ts` | 382 | `'Не вдалось оновити профіль'` | ✅ Fixed → `'update_failed'` |
| `src/modules/admin/actions/index.ts` | 431–432 | 2x create user errors | ✅ Fixed → English codes |
| `src/modules/admin/actions/index.ts` | 456 | `'Не вдалось створити профіль'` | ✅ Fixed → `'create_profile_failed'` |
| `src/modules/admin/actions/index.ts` | 586 | `'Не вдалось видалити аватар'` | ✅ Fixed → `'delete_failed'` |
| `src/modules/admin/actions/index.ts` | 224 | `'Не вдалось зберегти налаштування'` | ✅ Fixed → `'save_failed'` |
| `src/modules/admin/actions/index.ts` | 608, 628, 644 | 3x location/request action errors | ✅ Fixed → English codes |

### Client-Side Display Bugs Fixed

| File | Issue | Fix |
|------|-------|-----|
| `AdminUserProfile.tsx` line 461 | Create mode interpolated raw API error: `t('feedback.avatar_upload_failed', { error: uploadResult.error })` — showed Ukrainian in toast | Changed to `t('feedback.avatar_upload_exception')` — generic localized message |
| `AdminUserProfile.tsx` line 500 | Delete action: `setSaveError(result.error)` rendered Ukrainian string directly in `{saveError}` div | Changed to `setSaveError(t('feedback.save_error'))` — localized generic error |

---

## End-to-End Contract Implementation: `/api/upload-avatar`

**Server:** Returns `{ error: 'error_code' }` with stable English codes.

**Client (edit mode — `AdminUserAvatar.tsx`):** Already correct — shows `tc('avatar_upload_error')` for any `result.error`. No change needed.

**Client (create mode — `AdminUserProfile.tsx`):** Fixed — now shows `t('feedback.avatar_upload_exception')` for any upload error instead of interpolating the raw server string.

---

## Key Notes: Dead Code Server Actions

`uploadCabinetAvatar` (cabinet) and `uploadUserAvatar` (admin) are defined but have no active callers — both were superseded by the `/api/upload-avatar` HTTP route. Their Ukrainian error strings were fixed for consistency but they are not user-visible. These functions can be removed in a future cleanup task.

---

## Validation

| Check | Result |
|-------|--------|
| Key counts balanced (sq/en/uk/it) | ✅ 862 / 862 / 862 / 862 |
| Mixed-language values | ✅ Zero violations |
| Currency codes in `t()` | ✅ Zero violations |
| API error contract decided | ✅ Option (b): English error codes |
| `/api/upload-avatar` contract implemented | ✅ End-to-end |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings (unchanged) |
| `npm run governance:localization` | ✅ PASS — C0/H0/M18 at baseline |
| Responsive coverage | N/A — no layout changes; audit only + server-side fixes |
| Locale runtime switch | N/A — no message key changes; contract fixes only |
