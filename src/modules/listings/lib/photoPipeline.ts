import imageCompression from 'browser-image-compression'

/**
 * The browser pipeline of a listing photo (Task 1038, owner request 2026-11-25: "optimisation entirely in the user's browser ... no compression inside Vercel Functions").
 *
 * One chosen file (JPEG, PNG or WebP) becomes two versions: a large one of at most 1920 px on the long side and a small one of at most 640 px for the cards, each WebP at quality 0.85
 * (JPEG where the browser cannot encode WebP), each at most 819 200 bytes, with no metadata (`preserveExif: false`; the GPS position and the camera model of a phone photo stay in the file the
 * person chose and never reach the server). `browser-image-compression` does the work in a Web Worker, applies the camera's orientation itself, and only ever scales a photo DOWN: a photo
 * smaller than the limit keeps its size. HEIC is not accepted here (Task 1039).
 */

export const FULL_MAX_SIDE = 1920
export const THUMB_MAX_SIDE = 640
/** the same limit the route signs and the server checks (`MAX_PHOTO_BYTES` of `src/lib/media/listingPhoto.ts`, which a browser bundle cannot import) */
export const MAX_PHOTO_BYTES = 819_200
export const ACCEPTED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type PhotoType = 'image/webp' | 'image/jpeg'

export interface ProcessedPhoto {
  type: PhotoType
  full: Blob
  thumb: Blob
}

/** why a photo cannot be uploaded: its type is not accepted, a version is above the size limit, or the browser could not make the versions */
export type PhotoProcessingReason = 'format' | 'too_large' | 'processing'

export class PhotoProcessingError extends Error {
  readonly reason: PhotoProcessingReason
  constructor(reason: PhotoProcessingReason) {
    super(`photo ${reason}`)   // no text of the library or the file name: neither is shown nor logged
    this.name = 'PhotoProcessingError'
    this.reason = reason
  }
}

/**
 * The Worker's script is the package's own file served by this site (`public/vendor/`, a byte copy of `node_modules/browser-image-compression/dist/browser-image-compression.js`, held by `photoPipeline.test.ts`):
 * without `libURL` the library loads it from cdn.jsdelivr.net at run time. The Worker is made from a blob, where `importScripts` refuses a site-relative path ("The URL ... is invalid") and the library then
 * compresses on the main thread without a word, so the address is absolute, built from the page's own origin when a photo is processed (no host is written in the code; owner decision O1038-6).
 */
const WORKER_SCRIPT_PATH = '/vendor/browser-image-compression-2.0.2.js'
const commonOptions = () => ({ initialQuality: 0.85, useWebWorker: true, preserveExif: false, libURL: new URL(WORKER_SCRIPT_PATH, window.location.origin).href }) as const

/** both versions in one type: one after the other, so a phone holds one decoded photo at a time */
async function encode(file: File, type: PhotoType): Promise<{ full: Blob; thumb: Blob }> {
  const common = commonOptions()
  const full = await imageCompression(file, { ...common, maxWidthOrHeight: FULL_MAX_SIDE, maxSizeMB: 0.5, fileType: type })
  const thumb = await imageCompression(file, { ...common, maxWidthOrHeight: THUMB_MAX_SIDE, fileType: type })
  return { full, thumb }
}

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  if (!(ACCEPTED_INPUT_TYPES as readonly string[]).includes(file.type)) throw new PhotoProcessingError('format')
  let type: PhotoType = 'image/webp'
  let versions: { full: Blob; thumb: Blob }
  try {
    versions = await encode(file, type)
    // a browser that cannot encode WebP answers another type (PNG): both versions are made again as JPEG
    if (versions.full.type !== 'image/webp') {
      type = 'image/jpeg'
      versions = await encode(file, type)
    }
  } catch {
    throw new PhotoProcessingError('processing')
  }
  if (versions.full.type !== type || versions.thumb.type !== type) throw new PhotoProcessingError('processing')
  if (versions.full.size < 1 || versions.thumb.size < 1) throw new PhotoProcessingError('processing')
  if (versions.full.size > MAX_PHOTO_BYTES || versions.thumb.size > MAX_PHOTO_BYTES) throw new PhotoProcessingError('too_large')
  return { type, ...versions }
}
