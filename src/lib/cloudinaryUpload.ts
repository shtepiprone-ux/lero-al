import { createHash } from 'crypto'

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
}

/**
 * Canonical server-side signed Cloudinary upload.
 *
 * Single source of truth for all server-to-Cloudinary uploads in the project.
 * Every API route or server action that writes to Cloudinary MUST call this
 * function — never inline a custom upload implementation.
 *
 * @param bytes    Raw file bytes from ArrayBuffer
 * @param mimeType MIME type (image/jpeg | image/png | image/webp)
 * @param folder   Cloudinary folder path.
 *                 Current values: 'avatars', 'listings', 'companies'
 *                 Target values (Epic H): '<userId>/avatars', '<userId>/listings/<listingId>', 'companies/<companyId>'
 *
 * Returns the secure_url and public_id.
 * public_id is the path WITHOUT the base URL (e.g. 'avatars/abc123').
 * Store it alongside the URL so cleanup tasks (H.3, H.5) can call deleteAsset()
 * without parsing the URL.
 */
export async function uploadToCloudinary(
  bytes: ArrayBuffer,
  mimeType: string,
  folder: string,
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars missing')

  const timestamp = Math.round(Date.now() / 1000)
  // SHA-256 (Task 951 AC6): the signed string is the one SHA-1 signed; `signature_algorithm=sha256` is sent as a form field and is NOT signed (Cloudinary 401, 2026-11-09)
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = createHash('sha256').update(`${paramsToSign}${apiSecret}`).digest('hex')

  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mimeType }))
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)
  form.append('signature_algorithm', 'sha256')
  form.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status))
    throw new Error(`Cloudinary upload failed: ${errText}`)
  }
  const data = await res.json() as {
    secure_url: string
    public_id: string
    width?: number
    height?: number
  }
  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height }
}

/**
 * The pixel size an image DECLARES in its own header, read from the bytes (Task 923 R71 (g)). The upload routes with a size rule (the 256×256 avatar, the logo of at most
 * 256×256) used to upload first and judge the size from Cloudinary's answer, so a refused image stayed in the cloud account. They now read the size here and refuse before
 * any upload. Only the three raster types the product accepts are read (PNG, JPEG, WebP: lossy, lossless and extended); anything else, a truncated header or a
 * zero size gives null, which a caller treats as "not an image it accepts".
 */
export function readImageSize(bytes: ArrayBuffer | Uint8Array): { width: number; height: number } | null {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const u16be = (i: number) => (b[i] << 8) | b[i + 1]
  const u32be = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
  const ok = (width: number, height: number) => (width > 0 && height > 0 ? { width, height } : null)

  // PNG: signature, then the IHDR chunk (length 13, "IHDR", width, height as 32-bit big-endian)
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    if (b[12] !== 0x49 || b[13] !== 0x48 || b[14] !== 0x44 || b[15] !== 0x52) return null
    return ok(u32be(16), u32be(20))
  }

  // JPEG: walk the marker segments to the first start-of-frame (SOF0-SOF15 except DHT 0xC4, JPG 0xC8, DAC 0xCC)
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 3 < b.length) {
      if (b[i] !== 0xff) return null
      const marker = b[i + 1]
      if (marker === 0xff) { i += 1; continue }                          // fill byte
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue }   // markers without a length
      const length = u16be(i + 2)
      if (length < 2) return null
      const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isFrame) return i + 8 < b.length ? ok(u16be(i + 7), u16be(i + 5)) : null
      i += 2 + length
    }
    return null
  }

  // WebP: "RIFF" size "WEBP", then the first chunk says which kind it is
  if (b.length >= 25 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    const kind = String.fromCharCode(b[12], b[13], b[14], b[15])
    if (kind === 'VP8 ') {                                                // lossy: frame tag, start code 9d 01 2a, then 14-bit sizes
      if (b.length < 30 || b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null
      return ok((b[26] | (b[27] << 8)) & 0x3fff, (b[28] | (b[29] << 8)) & 0x3fff)
    }
    if (kind === 'VP8L') {                                                // lossless: signature 0x2f, then two 14-bit (size - 1) fields
      if (b[20] !== 0x2f) return null
      return ok(1 + (((b[22] & 0x3f) << 8) | b[21]), 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)))
    }
    if (kind === 'VP8X') {                                                // extended: canvas size - 1 as 24-bit little-endian
      if (b.length < 30) return null
      return ok(1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16)))
    }
  }
  return null
}

/**
 * Derive a Cloudinary public_id from a stored full URL.
 *
 * Used by cleanup tasks (H.3 avatar replacement, H.5 listing image removal) to
 * obtain the public_id when only a URL is stored in the DB.
 *
 * Pattern: strips the base URL up to and including '/upload/', then removes any
 * version segment ('v12345678/') and Cloudinary transformation prefix if present.
 *
 * Returns null if the URL is not a Cloudinary URL or cannot be parsed.
 */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // Task 923 Revision 7: only an https address on Cloudinary's own host is a Cloudinary URL (the old check looked for "/upload/" anywhere in the text, so
  // `https://evil.example/upload/listings/x.jpg` produced the id of a real asset), and the id has no version, no transformation and no file extension: the
  // id of an upload is `listings/abc`, its delivery URL ends `listings/abc.jpg`.
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null
  const marker = '/upload/'
  const idx = parsed.pathname.indexOf(marker)
  if (idx === -1) return null
  const segments = parsed.pathname.slice(idx + marker.length).split('/').filter(Boolean)
  // leading version (v1234567890) and transformation (c_fill,w_100) segments
  while (segments.length > 1 && (/^v\d+$/.test(segments[0]) || segments[0].includes(','))) segments.shift()
  if (segments.length === 0) return null
  segments[segments.length - 1] = segments[segments.length - 1].replace(/\.[A-Za-z0-9]{2,5}$/, '')
  let id: string
  try {
    id = segments.map((s) => decodeURIComponent(s)).join('/')
  } catch {
    return null
  }
  return id || null
}
