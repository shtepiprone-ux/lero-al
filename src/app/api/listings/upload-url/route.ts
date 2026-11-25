import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { getUser } from '@/lib/auth/server'
import { roleHasPermission } from '@/lib/auth/permissions'
import { MAX_PHOTO_BYTES } from '@/lib/media/listingPhoto'
import { R2ConfigError, presignPut, publicUrl } from '@/lib/media/r2'

// POST /api/listings/upload-url — Task 1038.
//
// A listing photo goes from the browser straight to Cloudflare R2 (the body stays off this function, whose request limit is 4.5 MB), but only to addresses this route issues. The browser has
// already turned the photo into two versions (1920 px and 640 px, WebP or JPEG); the route signs a PUT address for each, and chooses everything else: the owner's folder (the caller's own,
// or, for a listing, the listing owner's), a random folder name, the object names. The body is a strict schema of four keys; the type and both byte counts are signed, so R2 refuses an upload
// that is another type or another length, and the server reads both objects back before it attaches the photo to a listing (`verifyListingPhoto`).
//
// Order (cheap checks first, Denial_of_Service): the session, the body, the listing and its owner, the limits, then the signatures. It is the order of `upload-signature/route.ts`, and the
// two limits are the same buckets: one photo is one hit in each, whichever service stores it.

const bodySchema = z.object({
  listingId: z.uuid().optional(),
  type: z.enum(['image/webp', 'image/jpeg']),
  fullBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
  thumbBytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
}).strict()

const LIMITS = [
  { bucket: 'listing-upload-10m', windowSeconds: 600, maxHits: 30 },
  { bucket: 'listing-upload-day', windowSeconds: 86_400, maxHits: 200 },
] as const

const EXTENSION = { 'image/webp': 'webp', 'image/jpeg': 'jpg' } as const

const NO_STORE = { 'Cache-Control': 'no-store' }
const refuse = (status: number, error: string) => NextResponse.json({ error }, { status, headers: NO_STORE })

export async function POST(req: NextRequest) {
  // 1. who: an active session only. A session whose account has no access (blocked, deactivated, deleted) is a 403, no session is a 401, an unreadable account a 403.
  const viewer = await requireViewer()
  if (!viewer.ok) {
    if (viewer.reason === 'lookup_failed') return refuse(403, 'Forbidden')
    let hasSession = false
    try { hasSession = (await getUser()) !== null } catch { hasSession = true }
    return hasSession ? refuse(403, 'Forbidden') : refuse(401, 'Unauthorized')
  }

  // 2. the body: a strict allow-list; nothing is read from the database before it is valid
  let raw: unknown = {}
  try {
    const text = await req.text()
    if (text.trim() !== '') raw = JSON.parse(text)
  } catch {
    return refuse(400, 'invalid_body')
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return refuse(400, 'invalid_body')
  const { listingId, type, fullBytes, thumbBytes } = parsed.data

  const db = createAdminClient()

  // 3. whose folder: the caller's own, or, for a listing, the listing owner's (the caller must be the owner or hold `listings.moderate`)
  let ownerId = viewer.userId
  if (listingId) {
    const { data: listing, error } = await db.from('listings').select('user_id').eq('id', listingId).maybeSingle()
    if (error) {
      console.error('[upload-url] the listing could not be read', { code: error.code })
      return refuse(503, 'unavailable')
    }
    if (!listing) return refuse(403, 'Forbidden')
    if (listing.user_id !== viewer.userId) {
      let allowed = false
      try { allowed = await roleHasPermission(viewer.role ?? '', 'listings.moderate') } catch { allowed = false }
      if (!allowed) return refuse(403, 'Forbidden')
    }
    ownerId = listing.user_id as string
  }

  // 4. the limits, per caller (a moderator's addresses count against the moderator): a limiter that cannot answer refuses (fail closed)
  for (const limit of LIMITS) {
    const { data, error } = await db.rpc('consume_rate_limit', { bucket: limit.bucket, subject: viewer.userId, window_seconds: limit.windowSeconds, max_hits: limit.maxHits })
    if (error) {
      console.error('[upload-url] the limiter failed', { bucket: limit.bucket, code: error.code })
      return refuse(503, 'unavailable')
    }
    // the person is told when to try again: the window of the limit that refused, as `Retry-After` (an upper bound: the oldest hit leaves the window sooner)
    if (data !== true) return NextResponse.json({ error: 'rate_limited', retryAfterSeconds: limit.windowSeconds }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.windowSeconds) } })
  }

  // 5. the keys, all chosen here: `<owner>/listings/<random uuid>/{full,thumb}.<ext>`
  const folder = `${ownerId}/listings/${randomUUID()}`
  const extension = EXTENSION[type]
  const fullKey = `${folder}/full.${extension}`
  const thumbKey = `${folder}/thumb.${extension}`
  try {
    const [fullUrl, thumbUrl] = await Promise.all([presignPut(fullKey, type, fullBytes), presignPut(thumbKey, type, thumbBytes)])
    return NextResponse.json({ fullUrl, thumbUrl, publicUrl: publicUrl(fullKey) }, { headers: NO_STORE })
  } catch (err) {
    if (err instanceof R2ConfigError) {
      console.error('[upload-url] the R2 configuration is incomplete')
      return refuse(500, 'not_configured')
    }
    console.error('[upload-url] the addresses could not be signed', { code: err instanceof Error ? err.name : 'threw' })
    return refuse(503, 'unavailable')
  }
}
