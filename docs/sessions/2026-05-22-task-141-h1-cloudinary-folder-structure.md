# Session Archive: Task 141 — H.1 Cloudinary User-based Folder Structure — 2026-05-22

## Task

**Task 141 — Epic H.1 — User-based folder structure (infrastructure + documentation)**
Type: Refactor / Infrastructure | Priority: Medium-High

## Upload entry point audit

| Route / Component | Current folder | Target (task) | Status |
|---|---|---|---|
| `/api/upload-avatar` | `avatars/` | `<user_id>/avatars/` | H.2 |
| `/api/upload-company-logo` | `companies/` | `companies/<company_id>/` | H.7 |
| `ImageUpload` (CldUploadWidget) | `listings/` | `<user_id>/listings/<listing_id>/` | H.4 |

All three upload helpers duplicated Cloudinary signing logic independently. H.1 consolidates into a single shared utility.

## DB reference policy

| DB column | Stored format | public_id derivation |
|---|---|---|
| `users.avatar_url` | Full Cloudinary URL | `publicIdFromUrl(url)` in `cloudinaryUpload.ts` |
| `listing_images.url` | Full Cloudinary URL | N/A — use `listing_images.public_id` |
| `listing_images.public_id` | Cloudinary public_id | Direct (already stored) |
| `companies.logo_url` | Full Cloudinary URL | `publicIdFromUrl(url)` in `cloudinaryUpload.ts` |

Decision: keep storing full URLs in existing columns (no schema change). The `publicIdFromUrl()` helper in `cloudinaryUpload.ts` derives the public_id from any stored URL for cleanup tasks (H.3, H.5).

## Files changed

| File | Change |
|---|---|
| `src/lib/cloudinaryUpload.ts` | **NEW** — canonical signed upload + `publicIdFromUrl` |
| `src/app/api/upload-avatar/route.ts` | Remove inline upload fn; import from `@/lib/cloudinaryUpload` |
| `src/app/api/upload-company-logo/route.ts` | Same refactor |
| `docs/integrations.md` | Full folder tree + DB reference policy + migration plan |
| `docs/env.md` | Added `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (was missing) |

## Migration plan (documented; not executed)

See `docs/integrations.md` → "Cloudinary Canonical Folder Tree". Summary:
1. **Inventory** (dry-run): query DB for each asset type → compute old/new public_id pairs.
2. **Rename** via Cloudinary Admin API `POST /rename` + atomic DB update.
3. **Verify** via H.6 reference-check.
Blocked on: H.6 safety audit + dry-run framework.

## Acceptance criteria

- [x] Shared `uploadToCloudinary` is the single upload utility; both routes use it.
- [x] `publicIdFromUrl` utility available for cleanup tasks (H.3, H.5).
- [x] `docs/integrations.md` updated with full folder tree + DB policy + migration plan.
- [x] `docs/env.md` updated with `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.
- [ ] Manual verification: new upload at each entry point lands in correct folder (current = unchanged; verified by H.2/H.4/H.7 after path changes).

## Out of scope

H.2 (avatar path), H.4 (listing image path), H.7 (company logo, marketing), H.3/H.5/H.6 (deletions). Folder strings unchanged in this task; path changes happen in H.2/H.4/H.7.
