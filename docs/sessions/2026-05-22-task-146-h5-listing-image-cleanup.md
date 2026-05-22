# Session Archive: Task 146 — H.5 Listing Image Replacement Cleanup — 2026-05-22

## Task

**Task 146 — Epic H.5 — Listing image replacement cleanup**
Type: Feature | Depends on: H.4 (Task 143), H.6 (Task 144)

## Two entry points changed

### `updateListing.ts` — image diff on edit

`updateListing` does a bulk delete + re-insert of listing_images. The diff happens by comparing
old URLs (fetched before the delete) against new URLs (from the payload).

**Order:**
1. Fetch `oldUrls` from `listing_images` before the wipe
2. Delete all listing_images → insert new ones (DB committed)
3. Compute `orphanedPublicIds = oldUrls ∖ newUrlSet` → `publicIdFromUrl(url)` for each
4. `Promise.allSettled(orphaned.map(pid => deleteAsset(pid, { reason: 'listing_image_removed' })))`

Reference check in `deleteAsset` fires AFTER the new images are in DB, so any URL still
present (same image kept across edit) is correctly detected as still-referenced and skipped.

### `deleteListing.ts` — bulk cleanup on listing delete

`listing_images` are cascade-deleted when the listing row is deleted. Fetch URLs before the
delete, then clean up after the DB commit.

**Order:**
1. Fetch `imagesToDelete` from DB before delete
2. Delete listing (cascade)
3. `Promise.allSettled(pids.map(pid => deleteAsset(pid, { reason: 'listing_deleted' })))`

## Why `publicIdFromUrl` (no `public_id` column)

`listing_images` stores `url` but no Cloudinary `public_id` column. The Cloudinary public_id
is derived from the URL via `publicIdFromUrl(url)` from `src/lib/cloudinaryUpload.ts`.
The H.6 reference check queries both `listing_images.public_id` (direct) and
`listing_images.url ILIKE '%publicId%'` — so even without a dedicated column the check works.

## Files changed

| File | Change |
|---|---|
| `src/modules/listings/actions/updateListing.ts` | Import `publicIdFromUrl` + `deleteAsset`; fetch old URLs; orphan diff + cleanup |
| `src/modules/listings/actions/deleteListing.ts` | Import same; fetch URLs before cascade; cleanup after delete |

## Acceptance criteria

- [x] Edit listing → remove image → orphaned URL passed to deleteAsset (dry-run logged).
- [x] Reference check fires after new images are in DB — re-used images not deleted.
- [x] Delete listing → all image URLs cleaned up (dry-run by default).
- [x] DB always updated before Cloudinary delete (order enforced).
- [x] All cleanups non-fatal (`Promise.allSettled` + `.catch`).
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.

## Out of scope
Avatar cleanup (H.3). Other photos (H.7).
