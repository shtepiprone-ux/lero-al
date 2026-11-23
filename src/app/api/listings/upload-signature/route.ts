import { createHash, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { getUser } from '@/lib/auth/server'
import { roleHasPermission } from '@/lib/auth/permissions'

// POST /api/listings/upload-signature — Task 957.
//
// A listing photo goes from the browser straight to Cloudinary (the body stays off this function, whose request limit is 4.5 MB), but only with a signature this route issues,
// per photo, for parameters THIS route chose: the owner's folder, a random `public_id`, `overwrite=false` (so a repeated request stores nothing new), the server-only signed preset,
// the uploader's pseudonymous number as a tag and as context. Nothing of the request but an optional `listingId` is read; the body is a strict schema (any other key is a 400).
//
// Order (cheap checks first, Denial_of_Service): the session, the body, the listing and its owner, the limits, then the signature.
//
// The string Cloudinary signs (cloudinary.com/documentation/authentication_signatures and the upload widget guide, read 2026-11-19): every parameter of the upload in snake_case, sorted by
// name, joined with `&`, then the API secret, hashed; `file`, `cloud_name`, `resource_type` and `api_key` are not part of it; the widget adds `source=uw` itself and it must be signed.
// The hash is SHA-256, as the destroy call of `cloudinaryDelete.ts` uses (Task 951 AC6). INFERENCE: Cloudinary accepts it for a widget upload, which cannot send the `signature_algorithm` field the
// destroy call sends; UNKNOWN until AC8 (the live upload test) runs. If Cloudinary refuses it, `SIGNATURE_ALGORITHM` below is the one value to change. AC8 also proves the exact parameter set.

const SIGNATURE_ALGORITHM = 'sha256'

const bodySchema = z.object({ listingId: z.uuid().optional() }).strict()

const LIMITS = [
  { bucket: 'listing-upload-10m', windowSeconds: 600, maxHits: 30 },
  { bucket: 'listing-upload-day', windowSeconds: 86_400, maxHits: 200 },
] as const

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

  // 2. the body: a strict allow-list of one key; nothing is read from the database before it is valid
  let raw: unknown = {}
  try {
    const text = await req.text()
    if (text.trim() !== '') raw = JSON.parse(text)
  } catch {
    return refuse(400, 'invalid_body')
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return refuse(400, 'invalid_body')
  const { listingId } = parsed.data

  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const uploadPreset = process.env.CLOUDINARY_LISTING_PRESET
  if (!apiKey || !apiSecret || !uploadPreset) {
    console.error('[upload-signature] the Cloudinary configuration is incomplete')
    return refuse(500, 'not_configured')
  }

  const db = createAdminClient()

  // 3. whose folder: the caller's own, or, for a listing, the listing owner's (the caller must be the owner or hold `listings.moderate`)
  let ownerId = viewer.userId
  if (listingId) {
    const { data: listing, error } = await db.from('listings').select('user_id').eq('id', listingId).maybeSingle()
    if (error) {
      console.error('[upload-signature] the listing could not be read', { code: error.code })
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

  // 4. the limits, per caller (a moderator's signatures count against the moderator): a limiter that cannot answer refuses (fail closed)
  for (const limit of LIMITS) {
    const { data, error } = await db.rpc('consume_rate_limit', { bucket: limit.bucket, subject: viewer.userId, window_seconds: limit.windowSeconds, max_hits: limit.maxHits })
    if (error) {
      console.error('[upload-signature] the limiter failed', { bucket: limit.bucket, code: error.code })
      return refuse(503, 'unavailable')
    }
    // the person is told when to try again (Task 957 Revision 3, O997-2): the window of the limit that refused, as `Retry-After` (an upper bound: the oldest hit leaves the window sooner)
    if (data !== true) return NextResponse.json({ error: 'rate_limited', retryAfterSeconds: limit.windowSeconds }, { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.windowSeconds) } })
  }

  // 5. the pseudonymous number of the folder's owner: the only profile column that is read, and the only one Cloudinary gets (no name, e-mail or phone)
  const { data: owner, error: ownerError } = await db.from('users').select('public_id').eq('id', ownerId).maybeSingle()
  if (ownerError || !owner || typeof owner.public_id !== 'number') {
    console.error('[upload-signature] the owner number could not be read', { code: ownerError?.code ?? 'missing' })
    return refuse(503, 'unavailable')
  }

  // 6. the parameters, all chosen here
  const folder = listingId ? `${ownerId}/listings/${listingId}` : `${ownerId}/listings`
  const publicId = randomUUID()
  const tags = [`user-${owner.public_id}`]
  const context = listingId ? `user=${owner.public_id}|listing=${listingId}` : `user=${owner.public_id}`
  const timestamp = Math.round(Date.now() / 1000)
  const signed: Record<string, string> = {
    context,
    folder,
    overwrite: 'false',
    public_id: publicId,
    source: 'uw',
    tags: tags.join(','),
    timestamp: String(timestamp),
    upload_preset: uploadPreset,
  }
  const toSign = Object.keys(signed).sort().map((key) => `${key}=${signed[key]}`).join('&')
  const signature = createHash(SIGNATURE_ALGORITHM).update(`${toSign}${apiSecret}`).digest('hex')

  return NextResponse.json(
    { signature, apiKey, uploadSignatureTimestamp: timestamp, uploadPreset, folder, publicId, overwrite: false, tags, context },
    { headers: NO_STORE },
  )
}
