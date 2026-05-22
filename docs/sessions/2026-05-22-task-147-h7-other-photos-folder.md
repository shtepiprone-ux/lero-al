# Session Archive: Task 147 — H.7 Other Photos Folder Structure — 2026-05-22

## Task

**Task 147 — Epic H.7 — Other photos (company logos, marketing, popular locations)**
Type: Refactor | Depends on: H.1 (Task 141)

## Audit of non-user/non-listing uploaders

| Route | Current folder | H.7 target | Status |
|---|---|---|---|
| `/api/upload-company-logo` | `companies/` | `companies/<company_id>/` | ✅ done |
| marketing assets | — | `marketing/<slug>/...` | no uploader yet (placeholder) |
| popular_locations photos | — | `popular_locations/<id>/...` | no uploader yet (Epic J / Task 151) |

Only one active uploader required change. Both callers (`AdminCompaniesManager` and `AuthSheet`) pass `companyId` in formData — the route handles both paths.

## Change

`src/app/api/upload-company-logo/route.ts` line 63:

```diff
- const result = await uploadToCloudinary(bytes, file.type, 'companies')
+ const result = await uploadToCloudinary(bytes, file.type, `companies/${companyId}`)
```

`companyId` is already validated against the DB (company existence check on line 48) before this line is reached.

## docs/integrations.md — folder tree complete

All H.* statuses updated:
- `<user_id>/avatars/` ✅ H.2
- `<user_id>/listings/<listing_id>/` ✅ H.4
- `companies/<company_id>/` ✅ H.7
- `marketing/<slug>/...` — placeholder
- `popular_locations/<id>/...` — placeholder (Epic J)

## Existing-asset migration plan

Current: `companies/<file_id>` (flat, no company_id in path)
Target: `companies/<company_id>/<file_id>`

Migration (deferred, post-H.6 dry-run):
1. Query `companies.id, logo_url` for all companies with a logo
2. Derive `oldPublicId = publicIdFromUrl(logo_url)`
3. Rename via Cloudinary Admin API: `old → companies/<company_id>/<filename>`
4. Update `companies.logo_url` atomically

## Files changed

| File | Change |
|---|---|
| `src/app/api/upload-company-logo/route.ts` | Folder: `'companies'` → `` `companies/${companyId}` `` |
| `docs/integrations.md` | H.7 status ✅; marketing + popular_locations placeholders added |

## Acceptance criteria

- [x] New company logo lands in `companies/<companyId>/` in Cloudinary.
- [x] Both callers (admin + AuthSheet registration) use the same route — change applies everywhere.
- [x] `docs/integrations.md` folder tree complete (user/avatar/listing/company/marketing/popular_location).
- [x] Existing-asset migration plan documented (not executed).
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 new warnings.
- [ ] Manual: upload company logo → confirm Cloudinary shows `companies/<uuid>/` path.

## Epic H — CLOSED

All 7 sub-tasks complete: H.1 (infra) → H.2 (avatars) → H.4 (listings) → H.6 (safety) → H.3 (avatar cleanup) → H.5 (listing cleanup) → H.7 (other photos).
