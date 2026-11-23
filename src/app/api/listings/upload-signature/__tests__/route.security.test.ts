// @vitest-environment node
/**
 * Task 957 (AC1, AC2): the signature route of listing photos.
 *  - SEC-UPLOADSIG-SRV-ALLOW / -DENY: every row of the authorization matrix (anonymous 401, blocked 403, active user 200 for its own folder and its own listing, another
 *    person's listing 403, a moderator with `listings.moderate` 200 in the OWNER's folder, a moderator without it 403, an administrator 200).
 *  - SEC-UPLOADSIG-SRV-BODY: a strict body schema: `folder`, `public_id`, `overwrite`, `type`, any unknown key, a bad id, a list, a text that is not JSON: 400, no database call.
 *  - SEC-UPLOADSIG-SRV-SIGNED: only server values are signed; the signature verifies with the test secret over the sorted snake_case string with `source=uw`; `overwrite` is false;
 *    the `public_id` is a fresh random UUID each call; `tags` and `context` carry the owner's `public_id` number and the listing, never a name, e-mail or phone.
 *  - SEC-UPLOADSIG-SRV-LIMIT: the 31st call in 10 minutes answers 429 and signs nothing; a failing limiter answers 503; the limiter subject is the CALLER's id.
 * The code under test is the real route. The doubles are the identity helpers, the permission helper and a service-role client with a sliding limiter of its own.
 * Every id, number and secret is synthetic.
 */
import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Viewer = { ok: true; userId: string; role: string | null } | { ok: false; reason: 'unauthenticated' | 'lookup_failed' }

const world = vi.hoisted(() => ({
  viewer: { ok: false, reason: 'unauthenticated' } as unknown,
  session: null as { id: string } | null,
  listings: new Map<string, { user_id: string }>(),
  listingReadError: false,
  publicIds: new Map<string, number>(),
  moderatorKeys: new Set<string>(),
  rpcError: false,
  hits: [] as { bucket: string; subject: string }[],
  calls: [] as string[],
  selects: [] as string[],
}))

vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => world.viewer }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => world.session }))
vi.mock('@/lib/auth/permissions', () => ({
  roleHasPermission: async (role: string, key: string) => role === 'admin' || (role === 'moderator' && world.moderatorKeys.has(key)),
}))

const LIMITS: Record<string, number> = { 'listing-upload-10m': 30, 'listing-upload-day': 200 }
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      world.calls.push(`from:${table}`)
      let column = ''
      let value = ''
      const chain = {
        select: (columns: string) => { world.selects.push(`${table}:${columns}`); return chain },
        eq: (c: string, v: string) => { column = c; value = v; return chain },
        maybeSingle: async () => {
          if (table === 'listings') {
            if (world.listingReadError) return { data: null, error: { code: 'XX000' } }
            const row = world.listings.get(value)
            return { data: row ? { user_id: row.user_id } : null, error: null }
          }
          if (table === 'users') {
            const number = world.publicIds.get(value)
            return { data: number === undefined ? null : { public_id: number }, error: null }
          }
          return { data: null, error: { code: `unexpected:${table}.${column}` } }
        },
      }
      return chain
    },
    rpc: async (name: string, args: { bucket: string; subject: string; window_seconds: number; max_hits: number }) => {
      world.calls.push(`rpc:${name}`)
      if (name !== 'consume_rate_limit') return { data: null, error: { code: 'unexpected' } }
      if (world.rpcError) return { data: null, error: { code: 'XX000' } }
      const used = world.hits.filter((h) => h.bucket === args.bucket && h.subject === args.subject).length
      if (used >= args.max_hits) return { data: false, error: null }
      world.hits.push({ bucket: args.bucket, subject: args.subject })
      return { data: true, error: null }
    },
  }),
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const SECRET = 'test-secret-957'
const CALLER = '11111111-1111-4111-8111-111111111111'
const OWNER = '22222222-2222-4222-8222-222222222222'
const STRANGER = '33333333-3333-4333-8333-333333333333'
const LISTING = '44444444-4444-4444-8444-444444444444'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function post(body?: unknown, raw?: string) {
  return new NextRequest('http://localhost/api/listings/upload-signature', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
}
function viewer(userId: string, role: string | null = 'user'): Viewer { return { ok: true, userId, role } }
function signIn(userId: string, role: string | null = 'user') { world.viewer = viewer(userId, role); world.session = { id: userId } }

beforeEach(() => {
  world.viewer = { ok: false, reason: 'unauthenticated' }
  world.session = null
  world.listings = new Map([[LISTING, { user_id: OWNER }]])
  world.listingReadError = false
  world.publicIds = new Map([[CALLER, 7001], [OWNER, 7002], [STRANGER, 7003]])
  world.moderatorKeys = new Set()
  world.rpcError = false
  world.hits = []
  world.calls = []
  world.selects = []
  process.env.CLOUDINARY_API_SECRET = SECRET
  process.env.CLOUDINARY_API_KEY = 'key-957'
  process.env.CLOUDINARY_LISTING_PRESET = 'listing-signed'
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('POST /api/listings/upload-signature: the authorization matrix', () => {
  it('[SEC-UPLOADSIG-SRV-DENY] an anonymous caller gets 401, a blocked account 403, an unreadable account 403; nothing is read or signed', async () => {
    expect((await POST(post({}))).status).toBe(401)
    world.session = { id: CALLER }                       // a session exists, the account has no access (blocked, deactivated, deleted)
    expect((await POST(post({}))).status).toBe(403)
    world.session = null
    world.viewer = { ok: false, reason: 'lookup_failed' }
    expect((await POST(post({}))).status).toBe(403)
    expect(world.calls).toEqual([])
  })

  it('[SEC-UPLOADSIG-SRV-ALLOW] an active user gets 200 in its own folder, and in its own listing folder', async () => {
    signIn(CALLER)
    const bare = await POST(post({}))
    expect(bare.status).toBe(200)
    expect((await bare.json()).folder).toBe(`${CALLER}/listings`)
    world.listings.set(LISTING, { user_id: CALLER })
    const own = await POST(post({ listingId: LISTING }))
    expect(own.status).toBe(200)
    expect((await own.json()).folder).toBe(`${CALLER}/listings/${LISTING}`)
  })

  it('[SEC-UPLOADSIG-SRV-DENY] a user gets 403 for another person\'s listing and an unknown listing, and 503 for an unreadable listing; no limiter hit, nothing signed', async () => {
    signIn(STRANGER)
    expect((await POST(post({ listingId: LISTING }))).status).toBe(403)
    expect((await POST(post({ listingId: '55555555-5555-4555-8555-555555555555' }))).status).toBe(403)
    world.listingReadError = true
    expect((await POST(post({ listingId: LISTING }))).status).toBe(503)
    expect(world.hits).toEqual([])
    expect(world.calls.some((c) => c.startsWith('rpc:'))).toBe(false)
  })

  it('[SEC-UPLOADSIG-SRV-ALLOW] a moderator with listings.moderate gets 200 in the OWNER\'s folder; the limiter counts the moderator', async () => {
    signIn(CALLER, 'moderator')
    world.moderatorKeys.add('listings.moderate')
    const res = await POST(post({ listingId: LISTING }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.folder).toBe(`${OWNER}/listings/${LISTING}`)
    expect(body.tags).toEqual(['user-7002'])
    expect(world.hits.every((h) => h.subject === CALLER)).toBe(true)
    expect(world.hits.map((h) => h.bucket)).toEqual(['listing-upload-10m', 'listing-upload-day'])
  })

  it('[SEC-UPLOADSIG-SRV-DENY] a moderator without listings.moderate gets 403; an administrator gets 200', async () => {
    signIn(CALLER, 'moderator')
    expect((await POST(post({ listingId: LISTING }))).status).toBe(403)
    expect(world.hits).toEqual([])
    signIn(CALLER, 'admin')
    const res = await POST(post({ listingId: LISTING }))
    expect(res.status).toBe(200)
    expect((await res.json()).folder).toBe(`${OWNER}/listings/${LISTING}`)
  })
})

describe('POST /api/listings/upload-signature: the body', () => {
  it.each([
    ['folder', { folder: `${STRANGER}/listings` }],
    ['public_id', { public_id: 'x' }],
    ['publicId', { publicId: 'x' }],
    ['overwrite', { overwrite: true }],
    ['type', { type: 'authenticated' }],
    ['an unknown key beside a good listingId', { listingId: LISTING, extra: 1 }],
    ['a listingId that is not a UUID', { listingId: '../../x' }],
    ['a listingId that is not text', { listingId: 5 }],
    ['a list', [LISTING]],
    ['null', null],
  ])('[SEC-UPLOADSIG-SRV-BODY] %s answers 400 and reads nothing', async (_label, body) => {
    signIn(CALLER)
    const res = await POST(post(body))
    expect(res.status).toBe(400)
    expect(world.calls).toEqual([])
    expect(world.hits).toEqual([])
  })

  it('[SEC-UPLOADSIG-SRV-BODY] a body that is not JSON answers 400; an empty body is the same as {}', async () => {
    signIn(CALLER)
    expect((await POST(post(undefined, '{not json'))).status).toBe(400)
    expect((await POST(post(undefined, ''))).status).toBe(200)
    expect(world.calls.filter((c) => c === 'rpc:consume_rate_limit')).toHaveLength(2)
  })
})

describe('POST /api/listings/upload-signature: what is signed', () => {
  it('[SEC-UPLOADSIG-SRV-SIGNED] the signature verifies; the id is random each call; overwrite is false; tags and context hold the number and the listing only', async () => {
    signIn(CALLER)
    world.listings.set(LISTING, { user_id: CALLER })
    const first = await (await POST(post({ listingId: LISTING }))).json()
    const second = await (await POST(post({ listingId: LISTING }))).json()
    expect(first.publicId).toMatch(UUID_V4)
    expect(second.publicId).toMatch(UUID_V4)
    expect(second.publicId).not.toBe(first.publicId)
    expect(first.overwrite).toBe(false)
    expect(first.uploadPreset).toBe('listing-signed')
    expect(first.apiKey).toBe('key-957')
    expect(first.tags).toEqual(['user-7001'])
    expect(first.context).toBe(`user=7001|listing=${LISTING}`)
    // the string Cloudinary signs: every signed parameter in snake_case, sorted by name, joined with &, then the secret (the widget adds source=uw itself)
    const toSign = `context=${first.context}&folder=${first.folder}&overwrite=false&public_id=${first.publicId}&source=uw&tags=user-7001&timestamp=${first.uploadSignatureTimestamp}&upload_preset=listing-signed`
    expect(first.signature).toBe(createHash('sha256').update(`${toSign}${SECRET}`).digest('hex'))
    expect(Math.abs(first.uploadSignatureTimestamp - Math.round(Date.now() / 1000))).toBeLessThan(5)
    // only the pseudonymous number is read from the profile: no name, e-mail or phone
    expect([...new Set(world.selects.filter((s) => s.startsWith('users:')))]).toEqual(['users:public_id'])
    expect(JSON.stringify(first)).not.toMatch(/@|\+355/)
    expect(JSON.stringify(first)).not.toContain(SECRET)
  })

  it('[SEC-UPLOADSIG-SRV-SIGNED] without a listing the context carries only the number', async () => {
    signIn(CALLER)
    const body = await (await POST(post({}))).json()
    expect(body.context).toBe('user=7001')
    expect(body.folder).toBe(`${CALLER}/listings`)
  })

  it.each(['CLOUDINARY_API_SECRET', 'CLOUDINARY_API_KEY', 'CLOUDINARY_LISTING_PRESET'])('[SEC-UPLOADSIG-SRV-DENY] a missing %s answers 500 and signs nothing', async (name) => {
    signIn(CALLER)
    delete process.env[name]
    const res = await POST(post({}))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('signature')
  })

  it('[SEC-UPLOADSIG-SRV-DENY] an owner with no readable public number answers 503 and signs nothing', async () => {
    signIn(CALLER)
    world.publicIds.delete(CALLER)
    const res = await POST(post({}))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('signature')
  })
})

describe('POST /api/listings/upload-signature: the limits', () => {
  it('[SEC-UPLOADSIG-SRV-LIMIT] the 30th call in 10 minutes passes, the 31st answers 429 and signs nothing; the limiter subject is the caller', async () => {
    signIn(CALLER)
    for (let i = 0; i < LIMITS['listing-upload-10m']; i++) expect((await POST(post({}))).status).toBe(200)
    const refused = await POST(post({}))
    expect(refused.status).toBe(429)
    expect(refused.headers.get('Retry-After')).toBe('600')   // the 10-minute window: the person is told to try again in up to 10 minutes
    const body = await refused.json()
    expect(body).toEqual({ error: 'rate_limited', retryAfterSeconds: 600 })
    expect(JSON.stringify(body)).not.toContain('signature')
    expect(new Set(world.hits.map((h) => h.subject))).toEqual(new Set([CALLER]))
  })

  it('[SEC-UPLOADSIG-SRV-LIMIT] the daily limit refuses the 201st call with 429', async () => {
    signIn(CALLER)
    for (let i = 0; i < LIMITS['listing-upload-day']; i++) world.hits.push({ bucket: 'listing-upload-day', subject: CALLER })
    const refused = await POST(post({}))
    expect(refused.status).toBe(429)
    expect(refused.headers.get('Retry-After')).toBe('86400')   // the daily window: the person is told to try again tomorrow
    expect(await refused.json()).toEqual({ error: 'rate_limited', retryAfterSeconds: 86400 })
  })

  it('[SEC-UPLOADSIG-SRV-LIMIT] a failing limiter answers 503 and signs nothing (fail closed)', async () => {
    signIn(CALLER)
    world.rpcError = true
    const res = await POST(post({}))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('signature')
  })
})
