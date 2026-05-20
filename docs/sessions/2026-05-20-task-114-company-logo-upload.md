# Session Archive: Task 114 — Epic B.4 — Company Logo Upload — 2026-05-20

**Epic:** B — Auth, Registration & Agent Onboarding  
**Task:** 114 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED

---

## Goal

Add optional company logo upload to the `CompanyField` "Add new company" inline form in `AuthSheet`. Client-side validation (MIME, size, dimensions), preview before save, Cloudinary upload to `companies/` folder, `companies.logo_url` updated.

---

## Changes Made

### `src/app/api/upload-company-logo/route.ts` (new)

POST `/api/upload-company-logo` — service-role API route (no session required):
- Accepts `logo` (File) + `companyId` (string) via multipart
- Validates: MIME ∈ {jpg/png/webp}, size ≤ 2 MB, dimensions ≤ 256×256 (checked via Cloudinary response)
- Verifies `companyId` exists in DB before upload
- Uploads to Cloudinary folder `companies/`
- Updates `companies.logo_url` with the returned secure URL
- Error codes: `no_file`, `invalid_type`, `file_too_large`, `invalid_dimensions`, `company_not_found`, `upload_failed`, `db_save_failed`

### `src/modules/auth/components/AuthSheet.tsx` — `CompanyField` extended

New state:
- `logoFile: File | null` — the selected file
- `logoPreview: string | null` — `createObjectURL` blob URL for preview
- `logoError: string | null` — client-side validation error

New client-side validation in `handleLogoSelect`:
- MIME check before anything else
- Size check (≤ 2 MB) via `file.size`
- Dimension check via `new Image()` → `naturalWidth ≤ 256 && naturalHeight ≤ 256`

Logo upload in `handleCreate` (after company row is created):
- POST to `/api/upload-company-logo` with FormData
- Non-fatal — company creation succeeds even if logo upload fails

Logo preview UI:
- Square thumbnail `h-9 w-9` with `object-contain` shows the preview
- "Choose file" / "Replace" button (canonical `Button variant="outline"`) opens hidden `<input type="file">`
- `×` clear button revokes blob URL and resets state
- Hint text and error text below the preview area
- `// eslint-disable-next-line @next/next/no-img-element` on the preview `<img>` — blob URLs cannot use next/image optimizer; justified

### `messages/{sq,en,uk,it}.json`

7 new keys added across `auth` and `common` namespaces:

**auth namespace** (5 keys):
| Key | sq | en | uk | it |
|---|---|---|---|---|
| `company_logo` | "Logo (opsional)" | "Logo (optional)" | "Логотип (необов'язково)" | "Logo (opzionale)" |
| `company_logo_hint` | "PNG / JPG / WEBP · max 256×256 px · max 2 MB" | same | same | same |
| `company_logo_invalid_type` | "Lejohen vetëm..." | "Only PNG, JPG..." | "Дозволяються..." | "Sono consentiti..." |
| `company_logo_too_large` | "Skedari duhet..." | "File must be..." | "Файл має бути..." | "Il file deve..." |
| `company_logo_too_big` | "Imazhi duhet..." | "Image must be..." | "Зображення має..." | "L'immagine deve..." |

**common namespace** (2 keys):
| Key | sq | en | uk | it |
|---|---|---|---|---|
| `choose_file` | "Zgjidhni skedarin" | "Choose file" | "Обрати файл" | "Scegli file" |
| `replace` | "Zëvendëso" | "Replace" | "Замінити" | "Sostituisci" |

---

## Key Decisions

### No crop modal for company logos
Avatar uploads use `AvatarCropModal` (react-easy-crop) to enforce an exact 256×256 crop. Company logos are constrained to ≤256×256 — pre-sized logos are uploaded as-is. This avoids forcing agents to crop their brand logos.

### Client-side dimension check via `new Image()`
Blob URL is created → `new Image()` loads it → checks `naturalWidth/Height ≤ 256`. If valid, the blob URL becomes the preview src. If invalid, the URL is immediately revoked and an error is shown.

### Non-fatal logo upload
If the logo upload fails (Cloudinary down, network error), the company is still created and the user is registered successfully. Logo can be added later by an admin via Task 115.

### service-role route (no auth check)
Pre-auth registration context requires service-role for the upload. The `companyId` existence check prevents updating arbitrary rows.

---

## Acceptance Criteria Checklist

- [x] Client MIME validation: only PNG/JPG/WEBP accepted
- [x] Client size validation: ≤ 2 MB
- [x] Client dimension validation: ≤ 256×256 px via `new Image()`
- [x] Preview shown before save
- [x] Server validates all constraints (MIME + size + Cloudinary dimensions)
- [x] Cloudinary path: `companies/` folder
- [x] `companies.logo_url` updated on successful upload
- [x] Logo upload is non-fatal — company creation succeeds regardless
- [x] All 4 locales: error/label/hint via `t()`
- [x] 0 new lint errors / 0 new warnings
- [x] `governance:localization` PASS
- [ ] `npm run build` — user's manual step
