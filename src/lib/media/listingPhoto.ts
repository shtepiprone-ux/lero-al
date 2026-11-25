import { checkIsReferenced, deleteAsset } from '@/lib/cloudinaryDelete'
import { publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { declaredTypeMatchesBytes } from '@/lib/uploads/imageSniff'
import { MEDIA_HOST, parseR2ListingPhotoUrl } from '@/lib/uploads/imageUrl'
import { purgePhotoFolders, type PurgeResult } from './cdnPurge'
import { deleteObjects, headObject, keyFromPublicUrl, readHead } from './r2'

/**
 * A listing photo on R2 (Task 1038). One photo is two objects in one folder of the OWNER's account: `<owner>/listings/<folder uuid>/full.<ext>` (1920 px) and `thumb.<ext>` (640 px), `ext`
 * `webp` or `jpg`. A listing stores only the address of `full`; `thumb` is derived from it. The server issues the keys (`POST /api/listings/upload-url`), so the folder is random and the
 * owner comes from the session or the listing, never from a request.
 */

/** the most bytes one object of a photo may have: the browser pipeline refuses more, the route signs no more, and the server checks it again before it attaches the photo */
export const MAX_PHOTO_BYTES = 819_200
/** how much of an object is read to see what it really is */
const SNIFF_BYTES = 16

const TYPE_OF: Record<'webp' | 'jpg', 'image/webp' | 'image/jpeg'> = { webp: 'image/webp', jpg: 'image/jpeg' }

export interface PhotoLocation {
  ownerId: string
  fullKey: string
  thumbKey: string
  ext: 'webp' | 'jpg'
  /** the CDN prefix of the photo's folder, as Cloudflare's purge takes it: host and path, no scheme */
  prefix: string
}

/** where the photo with this address is, or null when the address is not an R2 listing photo of this project (its host, its shape, the key rule) */
export function locatePhoto(url: unknown): PhotoLocation | null {
  const parts = parseR2ListingPhotoUrl(url)
  if (!parts) return null
  const folder = `${parts.ownerId}/listings/${parts.folder}`
  const fullKey = `${folder}/full.${parts.ext}`
  // the address must also be an address of the bucket's public host as the server's configuration names it
  if (keyFromPublicUrl(url) !== fullKey) return null
  return { ownerId: parts.ownerId, fullKey, thumbKey: `${folder}/thumb.${parts.ext}`, ext: parts.ext, prefix: `${MEDIA_HOST}/${folder}/` }
}

/**
 * Reads both objects of a photo back before it is attached to a listing: the photo is in the folder of `ownerId`, both objects exist, each is at most `MAX_PHOTO_BYTES`, each is stored
 * with the content type of its extension, and the first bytes of each are that image (File_Upload: the type a sender declares is not trusted). An object that cannot be read, because R2
 * does not answer, refuses the photo.
 */
export async function verifyListingPhoto(url: unknown, ownerId: string): Promise<boolean> {
  const photo = locatePhoto(url)
  if (!photo || photo.ownerId !== ownerId) return false
  const type = TYPE_OF[photo.ext]
  try {
    const checks = await Promise.all([photo.fullKey, photo.thumbKey].map(async (key) => {
      const head = await headObject(key)
      if (!head || head.contentLength < 1 || head.contentLength > MAX_PHOTO_BYTES) return false
      if ((head.contentType ?? '').split(';')[0].trim().toLowerCase() !== type) return false
      return declaredTypeMatchesBytes(type, await readHead(key, SNIFF_BYTES))
    }))
    return checks.every(Boolean)
  } catch (err) {
    console.error('[verifyListingPhoto] the photo could not be read back', { code: err instanceof Error ? err.name : 'threw' })
    return false
  }
}

/** `verifyListingPhoto` for every address; true only when all of them pass (an empty list passes) */
export async function verifyListingPhotos(urls: readonly string[], ownerId: string): Promise<boolean> {
  return (await Promise.all(urls.map((url) => verifyListingPhoto(url, ownerId)))).every(Boolean)
}

export interface PhotoDeleteSummary {
  /** photos whose files were deleted */
  removed: number
  /** photos kept because a row still uses them or the check could not run */
  kept: number
  /** photos whose delete failed */
  failed: number
  /** the mode switch of the Cloudinary wrapper is not `enabled`: nothing was deleted */
  dryRun: boolean
  /** the CDN purge of the deleted R2 photos; `not_run` when none was deleted */
  purge: PurgeResult | 'not_run'
  /** what made a delete fail (a Cloudinary or an R2 error), for the caller's own log line; never shown */
  errors: unknown[]
}

/**
 * Deletes the files of listing photos that no row uses any more. A Cloudinary address goes to `deleteAsset`, as before. An R2 address: the reference check of `cloudinaryDelete.ts` on the
 * key of `full` (any row, page or setting that still holds it keeps the photo; a check that cannot run keeps it), the same dry-run gate (`CLOUDINARY_DELETE_MODE=enabled`), then BOTH
 * objects, then ONE purge of the photos' folders from the CDN. A failure of the R2 delete is returned and logged and skips the purge (the object is still there); a failed purge is
 * returned as `purge_failed` and logged, never as purged (owner decision O1038-5). Nothing is thrown (the errors of the deletes that failed are in `errors`, for the caller's own log line):
 * the rows are already gone when this runs.
 */
export async function deleteListingPhotos(urls: readonly string[], reason: string): Promise<PhotoDeleteSummary> {
  const summary: PhotoDeleteSummary = { removed: 0, kept: 0, failed: 0, dryRun: process.env.CLOUDINARY_DELETE_MODE !== 'enabled', purge: 'not_run', errors: [] }
  const doomed: PhotoLocation[] = []

  for (const url of new Set(urls)) {
    const photo = locatePhoto(url)
    if (photo) {
      let check: Awaited<ReturnType<typeof checkIsReferenced>>
      try {
        check = await checkIsReferenced(photo.fullKey)
      } catch {
        check = { referenced: false, tables: [], lookupFailed: 'threw' }
      }
      if (check.lookupFailed || check.referenced) {
        summary.kept += 1
        console.info('[deleteListingPhoto]', { reason, outcome: check.lookupFailed ? 'SKIP_LOOKUP_FAILED' : 'SKIP_REFERENCED', prefix: photo.prefix, referencedIn: check.tables })
      } else if (summary.dryRun) {
        console.info('[deleteListingPhoto]', { reason, outcome: 'DRY_RUN', prefix: photo.prefix })
      } else {
        doomed.push(photo)
      }
      continue
    }
    const publicId = publicIdFromUrl(url)
    if (publicId) {
      try {
        const result = await deleteAsset(publicId, { reason })
        if (result.deleted) summary.removed += 1
        else if (result.skipped) summary.kept += 1
      } catch (err) {
        summary.failed += 1   // `deleteAsset` has logged it
        summary.errors.push(err)
      }
    }
  }

  if (doomed.length === 0) return summary
  try {
    await deleteObjects(doomed.flatMap((photo) => [photo.fullKey, photo.thumbKey]))
    summary.removed += doomed.length
    console.info('[deleteListingPhoto]', { reason, outcome: 'DELETED', photos: doomed.length })
  } catch (err) {
    summary.failed += doomed.length
    summary.errors.push(err)
    console.error('[deleteListingPhoto]', { reason, outcome: 'ERROR', photos: doomed.length, code: err instanceof Error ? err.name : 'threw' })
    return summary
  }
  const prefixes = doomed.map((photo) => photo.prefix)
  try {
    summary.purge = await purgePhotoFolders(prefixes)
  } catch {
    console.error('[deleteListingPhoto]', { reason, outcome: 'purge_failed', prefixes, codes: ['threw'] })
    summary.purge = { outcome: 'purge_failed', prefixes, codes: ['threw'] }
  }
  return summary
}

/** one photo: `deleteListingPhotos` for a list of one */
export function deleteListingPhoto(url: string, reason: string): Promise<PhotoDeleteSummary> {
  return deleteListingPhotos([url], reason)
}
