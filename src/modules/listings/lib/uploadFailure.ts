/**
 * Why a listing photo was not uploaded, as the person is told it (Task 957 Revision 3, owner decision O997-2, 2026-11-21, translated: "it is very bad UX; show which error it is: a photo too large,
 * a file too large, or a network problem"). One kind per reason the person can act on; `ImageUpload` maps each kind to its own text in four locales (`listing.upload_error_<kind>`).
 */
export type UploadFailure =
  | 'session'            // the session ended (401 from our route)
  | 'forbidden'          // not allowed for this listing (403)
  | 'rate_limited'       // our limit of 30 photos per 10 minutes
  | 'rate_limited_day'   // our limit of 200 photos per day
  | 'not_configured'     // the server has no Cloudinary key, secret or preset (500 `not_configured`)
  | 'unavailable'        // our route or the photo service answers with a server error
  | 'network'            // no answer at all
  | 'too_large'          // the file is larger than the allowed size
  | 'format'             // the file type is not allowed
  | 'rejected'           // the photo service refused the upload (401 / 403 from it)
  | 'provider_busy'      // the photo service's own rate limit (420 / 429 from it)
  | 'failed'             // anything else
  | 'processing'         // the browser could not read or re-encode the file (Task 1038)

/** The longest window of our two limits: a `Retry-After` of at least this many seconds is the daily limit (`src/app/api/listings/upload-signature/route.ts` and `upload-url/route.ts` `LIMITS`). */
export const DAY_WINDOW_SECONDS = 86_400

/**
 * What R2 answered to the browser's PUT of one version of a photo (Task 1038): `0` is no answer at all (offline, a timeout, an abort), a 403 is an address that expired or was refused
 * (the queue asks the route again once, then tells the person), a 413 a file above the signed length, a 5xx R2 failing; anything else is a refusal of the upload.
 */
export function classifyPutFailure(status: number): UploadFailure {
  if (status === 0) return 'network'
  if (status === 413) return 'too_large'
  if (status >= 500) return 'unavailable'
  return 'rejected'
}

/** What our own signature route (`upload-signature`) or address route (`upload-url`) answered; they answer alike. `retryAfterSeconds` is the `Retry-After` header on a 429. */
export function classifySignatureRefusal(status: number, errorCode: string | undefined, retryAfterSeconds: number | undefined): UploadFailure {
  if (status === 401) return 'session'
  if (status === 403) return 'forbidden'
  if (status === 429) return retryAfterSeconds !== undefined && retryAfterSeconds >= DAY_WINDOW_SECONDS ? 'rate_limited_day' : 'rate_limited'
  if (status === 500 && errorCode === 'not_configured') return 'not_configured'
  return 'unavailable'
}

/**
 * What the Cloudinary widget's `onError` hands over: `{ status, statusText }`, a string, or null (`CloudinaryUploadWidgetError`, `@cloudinary-util/types`). Cloudinary's pages do not name the values
 * (read 2026-11-21: `status` and `statusText` are not documented), so the kind comes from the HTTP status class first, and only a 400 is read by its words (INFERENCE: a message that names the size
 * or the format is about it); nothing from the answer is shown to the person, only the kind.
 */
export function classifyWidgetError(error: unknown): UploadFailure {
  if (error === null || error === undefined) return 'failed'
  const text = typeof error === 'string' ? error : typeof error === 'object' ? String((error as { statusText?: unknown }).statusText ?? '') : ''
  const rawStatus = typeof error === 'object' ? (error as { status?: unknown }).status : undefined
  const status = typeof rawStatus === 'number' ? rawStatus : typeof rawStatus === 'string' && /^\d+$/.test(rawStatus) ? Number(rawStatus) : undefined
  const words = text.toLowerCase()
  if (status === 0 || /network|offline|timeout|timed out|failed to fetch/.test(words)) return 'network'
  if (status === 413) return 'too_large'
  if (status === 401 || status === 403) return 'rejected'
  if (status === 420 || status === 429) return 'provider_busy'
  if (status !== undefined && status >= 500) return 'unavailable'
  if (/too large|file size|exceeds|maximum/.test(words)) return 'too_large'
  if (/format|file type|unsupported|invalid image|not allowed/.test(words)) return 'format'
  return 'failed'
}
