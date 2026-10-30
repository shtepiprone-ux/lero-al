/**
 * Which image addresses the application accepts from a browser (Task 923 Revision 7, finding S21).
 *
 * `createListing` / `updateListing` wrote the `url` of every image straight from the request into `listing_images`, and the public pages render it in `<img src>`.
 * Any address was accepted: another site's tracking pixel (it learns every visitor's address and browser), content the platform does not host, a `data:` URL of
 * many megabytes. Images are uploaded by the server to Cloudinary (the upload routes), so the only address that is ever legitimate is an https address on
 * Cloudinary's delivery host, inside this project's own cloud.
 */
const CLOUDINARY_HOST = 'res.cloudinary.com'

export function isTrustedImageUrl(raw: unknown, cloudName: string | undefined = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME): boolean {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return false
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.hostname !== CLOUDINARY_HOST || url.username || url.password || url.port) return false
  if (cloudName && !url.pathname.startsWith(`/${cloudName}/`)) return false
  return true
}

/** true when EVERY image of the payload is a trusted address (an empty list is fine) */
export function allImagesTrusted(images: readonly { url?: unknown }[] | undefined | null): boolean {
  return (images ?? []).every((i) => isTrustedImageUrl(i?.url))
}

/** the most images one listing may carry; the form stops at the same number, the server now enforces it (Task 923 Revision 7) */
export const MAX_LISTING_IMAGES = 20

/**
 * The whole `images` list of a listing payload (Task 923 Revision 7, finding S49): a list (the types are erased at runtime), at most `MAX_LISTING_IMAGES` long,
 * every entry a trusted address with a true / false cover flag and a whole-number position. The limit existed only in the upload widget; a request could carry
 * thousands of rows.
 */
export function isValidImagePayload(images: unknown): boolean {
  if (!Array.isArray(images) || images.length > MAX_LISTING_IMAGES) return false
  return images.every((i) => {
    if (!i || typeof i !== 'object') return false
    const { url, is_cover: isCover, order } = i as { url?: unknown; is_cover?: unknown; order?: unknown }
    return isTrustedImageUrl(url) && typeof isCover === 'boolean' && typeof order === 'number' && Number.isInteger(order) && order >= 0 && order < 1000
  })
}
