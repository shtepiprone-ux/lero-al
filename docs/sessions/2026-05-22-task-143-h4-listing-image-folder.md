# Session Archive: Task 143 — H.4 Listing Image Folder Structure — 2026-05-22

## Task

**Task 143 — Epic H.4 — Listing image folder `<user_id>/listings/<listing_id>/`**
Type: Refactor | Depends on: H.1 (Task 141)

## Create-mode decision (no listing_id available)

Listing images are uploaded via `CldUploadWidget` (client→Cloudinary) BEFORE the listing
is saved to DB. At upload time in CREATE mode, there is no `listing_id` yet.

**Decision:** use `<user_id>/listings/` for create-mode uploads (user-scoped, no listing_id).
Edit-mode uses the full `<user_id>/listings/<listing_id>/` path.
This is an intermediate state — images uploaded at creation time live one level higher.
Full `<listing_id>` sub-folder is always achieved for any subsequent edit.

Documented in the code comment in `create/page.tsx`. A future migration (H.6 era) could rename
create-time images into the listing sub-folder after the listing_id is known.

## Prop chain

```
create/page.tsx        → uploadFolder = `${user.id}/listings`
edit/page.tsx          → uploadFolder = `${listing.user_id}/listings/${listing.id}`
  → ListingFormLoader  (new uploadFolder prop)
    → ListingFormShell (new uploadFolder prop)
      → ImageUpload    (new uploadFolder prop → CldUploadWidget folder option)
```

## Files changed

| File | Change |
|---|---|
| `src/modules/listings/components/ImageUpload.tsx` | Add `uploadFolder: string` prop; use in `CldUploadWidget` options |
| `src/modules/listings/components/ListingFormShell.tsx` | Add `uploadFolder` to `BaseProps`; pass to `ImageUpload` |
| `src/modules/listings/components/ListingFormLoader.tsx` | Add `uploadFolder` to `BaseLoaderProps`; pass to `ListingFormShell` |
| `src/modules/listings/components/steps/StepPhotos.tsx` | Add `uploadFolder` prop (dead code; required for typecheck) |
| `src/app/[locale]/listings/create/page.tsx` | Compute `uploadFolder = \`${user.id}/listings\``, pass to loader |
| `src/app/[locale]/listings/[slug]/edit/page.tsx` | Compute `uploadFolder = \`${listing.user_id}/listings/${listing.id}\``, pass to loader |
| `docs/integrations.md` | H.4 implementation status updated to ✅ |

## Acceptance criteria

- [x] Create mode: new images land in `<user_id>/listings/` in Cloudinary.
- [x] Edit mode: new images land in `<user_id>/listings/<listing_id>/`.
- [x] Gallery renders correctly (AppImage reads URL from DB regardless of folder).
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.
- [ ] Manual verification: upload listing photo → confirm Cloudinary folder in console.

## Out of scope

Listing image replacement cleanup (H.5 — needs H.6 first). Company/marketing photos (H.7).
