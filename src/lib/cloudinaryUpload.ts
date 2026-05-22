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
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = createHash('sha1').update(`${paramsToSign}${apiSecret}`).digest('hex')

  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mimeType }))
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)
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
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const afterUpload = url.slice(idx + marker.length)
  // Strip optional version prefix: v1234567890/
  return afterUpload.replace(/^v\d+\//, '')
}
