/**
 * Which image addresses the application accepts from a browser (Task 923 Revision 7, finding S21).
 *
 * `createListing` / `updateListing` wrote the `url` of every image straight from the request into `listing_images`, and the public pages render it in `<img src>`.
 * Any address was accepted: another site's tracking pixel (it learns every visitor's address and browser), content the platform does not host, a `data:` URL of
 * many megabytes. A listing photo goes from the browser straight to Cloudinary, signed by the server (`POST /api/listings/upload-signature`, Task 957): the signature fixes the
 * folder, so the only address that is ever legitimate is an https address on Cloudinary's delivery host, inside this project's own cloud and inside the folder of the LISTING
 * OWNER (`<owner>/listings/...`). `isOwnedListingImageUrl` is that rule; the trigger `listing_images_owner_folder` repeats it in the database.
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

/**
 * A listing photo of `ownerId` (Task 957): a trusted address whose path is `/<cloud>/image/upload/[v<digits>/]<ownerId>/listings/<name...>`. The owner id is compared as a segment of text,
 * never used as a pattern. The address is judged as it is written: a `.` or `..` segment, an encoded dot, slash or backslash, a backslash, a query and a fragment are refused (the URL parser
 * would fold a `..` segment away and hide it). The same rule as the trigger `listing_images_owner_folder` (supabase/sql_migrations/task957/task957.sql).
 */
export function isOwnedListingImageUrl(raw: unknown, ownerId: string, cloudName: string | undefined = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME): boolean {
  if (typeof ownerId !== 'string' || ownerId.length === 0 || ownerId.includes('/')) return false
  if (!isTrustedImageUrl(raw, cloudName)) return false
  const text = raw as string
  if (/[?#\\]|%2e|%2f|%5c/i.test(text)) return false
  const afterHost = text.slice('https://res.cloudinary.com/'.length).split('/')
  // [<cloud>, 'image', 'upload', ('v<digits>')?, <ownerId>, 'listings', <name...>]
  const [, kind, delivery, ...rest] = afterHost
  if (kind !== 'image' || delivery !== 'upload') return false
  if (rest.length > 0 && /^v[0-9]+$/.test(rest[0])) rest.shift()
  if (rest.length < 3 || rest[0] !== ownerId || rest[1] !== 'listings') return false
  return rest.slice(2).every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

/** true when EVERY image of the payload is a trusted address (an empty list is fine) */
export function allImagesTrusted(images: readonly { url?: unknown }[] | undefined | null): boolean {
  return (images ?? []).every((i) => isTrustedImageUrl(i?.url))
}

/** the most images one listing may carry; the form stops at the same number, the server now enforces it (Task 923 Revision 7) */
export const MAX_LISTING_IMAGES = 20

/**
 * The whole `images` list of a listing payload (Task 923 Revision 7, finding S49): a list (the types are erased at runtime), at most `MAX_LISTING_IMAGES` long,
 * every entry a photo in the folder of the listing OWNER `ownerId` (Task 957; the owner of the listing, also when staff edit it) with a true / false cover flag and a whole-number
 * position. The limit existed only in the upload widget; a request could carry thousands of rows.
 */
export function isValidImagePayload(images: unknown, ownerId: string): boolean {
  if (!Array.isArray(images) || images.length > MAX_LISTING_IMAGES) return false
  return images.every((i) => {
    if (!i || typeof i !== 'object') return false
    const { url, is_cover: isCover, order } = i as { url?: unknown; is_cover?: unknown; order?: unknown }
    return isOwnedListingImageUrl(url, ownerId) && typeof isCover === 'boolean' && typeof order === 'number' && Number.isInteger(order) && order >= 0 && order < 1000
  })
}
