// @vitest-environment node
/**
 * Task 1038 (AC3): the route that issues the two presigned R2 addresses of a listing photo.
 *  - SEC-UPLOADURL-SRV-DENY / -ALLOW: the authorization matrix of `upload-signature` (anonymous 401, blocked 403, own folder and own listing 200, another person's listing 403, a
 *    moderator with `listings.moderate` 200 in the OWNER's folder, without it 403); nothing is read from R2 and nothing signed for a refusal.
 *  - SEC-UPLOADURL-SRV-BODY: a strict schema of `{ listingId?, type, fullBytes, thumbBytes }`: an extra key (`key`, `folder`, `owner`), a type other than WebP and JPEG, a size of 0, above
 *    819 200, fractional or not a number, a list, text that is not JSON: 400 before any database call.
 *  - SEC-UPLOADURL-SRV-KEY: the keys are `<owner>/listings/<random uuid>/{full,thumb}.{webp,jpg}` under the folder of the person or of the listing's owner, never from the body; the signed
 *    headers hold the content type and the length; the address expires in 300 s; the answer has `fullUrl`, `thumbUrl`, `publicUrl` and nothing else, with `Cache-Control: no-store`.
 *  - SEC-UPLOADURL-SRV-LIMIT: the 31st call in 10 minutes and the 201st in a day answer 429 with `Retry-After` and sign nothing; a failing limiter answers 503.
 * The code under test is the real route and the real R2 signer. The doubles are the identity helpers, the permission helper and a service-role client with a sliding limiter. Synthetic values.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

type Viewer = { ok: true; userId: string; role: string | null } | { ok: false; reason: 'unauthenticated' | 'lookup_failed' }

const world = vi.hoisted(() => ({
  viewer: { ok: false, reason: 'unauthenticated' } as unknown,
  session: null as { id: string } | null,
  listings: new Map<string, { user_id: string }>(),
  listingReadError: false,
  moderatorKeys: new Set<string>(),
  rpcError: false,
  hits: [] as { bucket: string; subject: string }[],
  calls: [] as string[],
}))

vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => world.viewer }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => world.session }))
vi.mock('@/lib/auth/permissions', () => ({
  roleHasPermission: async (role: string, key: string) => role === 'admin' || (role === 'moderator' && world.moderatorKeys.has(key)),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      world.calls.push(`from:${table}`)
      let value = ''
      const chain = {
        select: () => chain,
        eq: (_c: string, v: string) => { value = v; return chain },
        maybeSingle: async () => {
          if (table !== 'listings') return { data: null, error: { code: `unexpected:${table}` } }
          if (world.listingReadError) return { data: null, error: { code: 'XX000' } }
          const row = world.listings.get(value)
          return { data: row ? { user_id: row.user_id } : null, error: null }
        },
      }
      return chain
    },
    rpc: async (name: string, args: { bucket: string; subject: string; window_seconds: number; max_hits: number }) => {
      world.calls.push(`rpc:${name}`)
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

const SECRET = 'r2-secret-1038-never-real'
const CALLER = '11111111-1111-4111-8111-111111111111'
const OWNER = '22222222-2222-4222-8222-222222222222'
const STRANGER = '33333333-3333-4333-8333-333333333333'
const LISTING = '44444444-4444-4444-8444-444444444444'
const UUID_V4 = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
const GOOD = { type: 'image/webp', fullBytes: 300_000, thumbBytes: 40_000 }

const ENV = {
  R2_ACCESS_KEY_ID: 'AKTESTACCESSKEY1038', R2_SECRET_ACCESS_KEY: SECRET, R2_ENDPOINT: 'https://0123456789abcdef.r2.cloudflarestorage.com',
  R2_BUCKET_NAME: 'lero-test-bucket', R2_PUBLIC_URL: 'https://media.lero.al',
} as Record<string, string>
const saved: Record<string, string | undefined> = {}

function post(body?: unknown, raw?: string) {
  return new NextRequest('http://localhost/api/listings/upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
}
function viewer(userId: string, role: string | null = 'user'): Viewer { return { ok: true, userId, role } }
function signIn(userId: string, role: string | null = 'user') { world.viewer = viewer(userId, role); world.session = { id: userId } }
const pathOf = (address: string) => new URL(address).pathname.replace(`/${ENV.R2_BUCKET_NAME}/`, '')

beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) { saved[name] = process.env[name]; process.env[name] = value }
  world.viewer = { ok: false, reason: 'unauthenticated' }
  world.session = null
  world.listings = new Map([[LISTING, { user_id: OWNER }]])
  world.listingReadError = false
  world.moderatorKeys = new Set()
  world.rpcError = false
  world.hits = []
  world.calls = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => {
  for (const name of Object.keys(ENV)) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  vi.restoreAllMocks()
})

describe('POST /api/listings/upload-url: the authorization matrix', () => {
  it('[SEC-UPLOADURL-SRV-DENY] an anonymous caller gets 401, a blocked account 403, an unreadable account 403; nothing is read or signed', async () => {
    expect((await POST(post(GOOD))).status).toBe(401)
    world.session = { id: CALLER }
    expect((await POST(post(GOOD))).status).toBe(403)
    world.session = null
    world.viewer = { ok: false, reason: 'lookup_failed' }
    expect((await POST(post(GOOD))).status).toBe(403)
    expect(world.calls).toEqual([])
  })

  it('[SEC-UPLOADURL-SRV-ALLOW] an active user gets 200 in its own folder, and in the folder of its own listing', async () => {
    signIn(CALLER)
    const bare = await POST(post(GOOD))
    expect(bare.status).toBe(200)
    expect(pathOf((await bare.json()).fullUrl)).toMatch(new RegExp(`^${CALLER}/listings/${UUID_V4}/full\\.webp$`))
    world.listings.set(LISTING, { user_id: CALLER })
    const own = await POST(post({ ...GOOD, listingId: LISTING }))
    expect(own.status).toBe(200)
    expect(pathOf((await own.json()).fullUrl)).toMatch(new RegExp(`^${CALLER}/listings/${UUID_V4}/full\\.webp$`))
  })

  it('[SEC-UPLOADURL-SRV-DENY] a user gets 403 for another person\'s listing and an unknown listing, and 503 for an unreadable one; no limiter hit, nothing signed', async () => {
    signIn(STRANGER)
    expect((await POST(post({ ...GOOD, listingId: LISTING }))).status).toBe(403)
    expect((await POST(post({ ...GOOD, listingId: '55555555-5555-4555-8555-555555555555' }))).status).toBe(403)
    world.listingReadError = true
    expect((await POST(post({ ...GOOD, listingId: LISTING }))).status).toBe(503)
    expect(world.hits).toEqual([])
    expect(world.calls.some((c) => c.startsWith('rpc:'))).toBe(false)
  })

  it('[SEC-UPLOADURL-SRV-ALLOW] a moderator with listings.moderate gets 200 in the OWNER\'s folder; the limiter counts the moderator', async () => {
    signIn(CALLER, 'moderator')
    world.moderatorKeys.add('listings.moderate')
    const res = await POST(post({ ...GOOD, listingId: LISTING }))
    expect(res.status).toBe(200)
    expect(pathOf((await res.json()).fullUrl)).toMatch(new RegExp(`^${OWNER}/listings/`))
    expect(world.hits.every((h) => h.subject === CALLER)).toBe(true)
    expect(world.hits.map((h) => h.bucket)).toEqual(['listing-upload-10m', 'listing-upload-day'])
  })

  it('[SEC-UPLOADURL-SRV-DENY] a moderator without listings.moderate gets 403; an administrator gets 200 in the owner\'s folder', async () => {
    signIn(CALLER, 'moderator')
    expect((await POST(post({ ...GOOD, listingId: LISTING }))).status).toBe(403)
    expect(world.hits).toEqual([])
    signIn(CALLER, 'admin')
    const res = await POST(post({ ...GOOD, listingId: LISTING }))
    expect(res.status).toBe(200)
    expect(pathOf((await res.json()).fullUrl)).toMatch(new RegExp(`^${OWNER}/listings/`))
  })
})

describe('POST /api/listings/upload-url: the body', () => {
  it.each([
    ['an extra key `key`', { ...GOOD, key: `${STRANGER}/listings/x/full.webp` }],
    ['an extra key `folder`', { ...GOOD, folder: `${STRANGER}/listings` }],
    ['an extra key `owner`', { ...GOOD, owner: STRANGER }],
    ['an extra key `public_id`', { ...GOOD, public_id: 'x' }],
    ['a type that is PNG', { ...GOOD, type: 'image/png' }],
    ['a type that is HEIC', { ...GOOD, type: 'image/heic' }],
    ['a type that is SVG', { ...GOOD, type: 'image/svg+xml' }],
    ['a type that is HTML', { ...GOOD, type: 'text/html' }],
    ['no type', { fullBytes: 1, thumbBytes: 1 }],
    ['no fullBytes', { type: 'image/webp', thumbBytes: 1 }],
    ['no thumbBytes', { type: 'image/webp', fullBytes: 1 }],
    ['a fullBytes of 0', { ...GOOD, fullBytes: 0 }],
    ['a thumbBytes of 0', { ...GOOD, thumbBytes: 0 }],
    ['a negative size', { ...GOOD, fullBytes: -1 }],
    ['a fullBytes above 819200', { ...GOOD, fullBytes: 819_201 }],
    ['a thumbBytes above 819200', { ...GOOD, thumbBytes: 819_201 }],
    ['a fractional size', { ...GOOD, fullBytes: 10.5 }],
    ['a size that is text', { ...GOOD, fullBytes: '300000' }],
    ['a size that is Infinity as text', { ...GOOD, fullBytes: 'Infinity' }],
    ['a listingId that is not a UUID', { ...GOOD, listingId: '../../x' }],
    ['a listingId that is not text', { ...GOOD, listingId: 5 }],
    ['a list', [GOOD]],
    ['null', null],
    ['an empty object', {}],
  ])('[SEC-UPLOADURL-SRV-BODY] %s answers 400 and reads nothing', async (_label, body) => {
    signIn(CALLER)
    const res = await POST(post(body))
    expect(res.status).toBe(400)
    expect(world.calls).toEqual([])
    expect(world.hits).toEqual([])
  })

  it('[SEC-UPLOADURL-SRV-BODY] the largest size, 819200 bytes, and the smallest, 1 byte, are accepted', async () => {
    signIn(CALLER)
    expect((await POST(post({ type: 'image/jpeg', fullBytes: 819_200, thumbBytes: 1 }))).status).toBe(200)
  })

  it('[SEC-UPLOADURL-SRV-BODY] a body that is not JSON answers 400; an empty body answers 400 (a size is required)', async () => {
    signIn(CALLER)
    expect((await POST(post(undefined, '{not json'))).status).toBe(400)
    expect((await POST(post(undefined, ''))).status).toBe(400)
    expect(world.calls).toEqual([])
  })
})

describe('POST /api/listings/upload-url: what is signed', () => {
  it('[SEC-UPLOADURL-SRV-KEY] the answer has fullUrl, thumbUrl and publicUrl and nothing else, never to be cached', async () => {
    signIn(CALLER)
    const res = await POST(post(GOOD))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual(['fullUrl', 'publicUrl', 'thumbUrl'])
    expect(JSON.stringify(body)).not.toContain(SECRET)
  })

  it('[SEC-UPLOADURL-SRV-KEY] full and thumb are two objects of one random folder; the public address is the full object on R2_PUBLIC_URL', async () => {
    signIn(CALLER)
    const body = await (await POST(post(GOOD))).json()
    const full = pathOf(body.fullUrl)
    const thumb = pathOf(body.thumbUrl)
    const folder = new RegExp(`^(${CALLER}/listings/${UUID_V4})/full\\.webp$`).exec(full)?.[1]
    expect(folder).toBeTruthy()
    expect(thumb).toBe(`${folder}/thumb.webp`)
    expect(body.publicUrl).toBe(`https://media.lero.al/${full}`)
    expect(new URL(body.fullUrl).origin).toBe(ENV.R2_ENDPOINT)
    expect(new URL(body.thumbUrl).origin).toBe(ENV.R2_ENDPOINT)
  })

  it('[SEC-UPLOADURL-SRV-KEY] a JPEG photo has the .jpg extension on both objects', async () => {
    signIn(CALLER)
    const body = await (await POST(post({ ...GOOD, type: 'image/jpeg' }))).json()
    expect(pathOf(body.fullUrl)).toMatch(/\/full\.jpg$/)
    expect(pathOf(body.thumbUrl)).toMatch(/\/thumb\.jpg$/)
    expect(body.publicUrl).toMatch(/\/full\.jpg$/)
  })

  it('[SEC-UPLOADURL-SRV-KEY] the folder is a fresh random UUID each call', async () => {
    signIn(CALLER)
    const first = await (await POST(post(GOOD))).json()
    const second = await (await POST(post(GOOD))).json()
    expect(pathOf(first.fullUrl)).not.toBe(pathOf(second.fullUrl))
    expect(pathOf(first.fullUrl).split('/')[2]).toMatch(new RegExp(`^${UUID_V4}$`))
  })

  it('[SEC-UPLOADURL-SRV-KEY] each address signs its own content type and length, the cache policy, and expires in 300 seconds', async () => {
    signIn(CALLER)
    const body = await (await POST(post({ type: 'image/webp', fullBytes: 300_000, thumbBytes: 40_000 }))).json()
    for (const address of [body.fullUrl, body.thumbUrl]) {
      const query = new URL(address).searchParams
      expect(query.get('X-Amz-Expires')).toBe('300')
      expect(query.get('X-Amz-SignedHeaders')).toBe('cache-control;content-length;content-type;host')
      expect(query.get('X-Amz-Credential')?.startsWith(`${ENV.R2_ACCESS_KEY_ID}/`)).toBe(true)
    }
    // the two lengths differ, so the two signatures were made over different lengths
    expect(new URL(body.fullUrl).searchParams.get('X-Amz-Signature')).not.toBe(new URL(body.thumbUrl).searchParams.get('X-Amz-Signature'))
  })

  it.each(['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'])('[SEC-UPLOADURL-SRV-DENY] a missing %s answers 500 not_configured and signs nothing', async (name) => {
    signIn(CALLER)
    delete process.env[name]
    const res = await POST(post(GOOD))
    expect(res.status).toBe(500)
    const text = JSON.stringify(await res.json())
    expect(text).toContain('not_configured')
    expect(text).not.toContain('X-Amz-Signature')
  })
})

describe('POST /api/listings/upload-url: the limits', () => {
  it('[SEC-UPLOADURL-SRV-LIMIT] the 30th call in 10 minutes passes, the 31st answers 429 with Retry-After 600 and signs nothing; the limiter subject is the caller', async () => {
    signIn(CALLER)
    for (let i = 0; i < 30; i++) expect((await POST(post(GOOD))).status).toBe(200)
    const refused = await POST(post(GOOD))
    expect(refused.status).toBe(429)
    expect(refused.headers.get('Retry-After')).toBe('600')
    expect(refused.headers.get('Cache-Control')).toBe('no-store')
    const body = await refused.json()
    expect(body).toEqual({ error: 'rate_limited', retryAfterSeconds: 600 })
    expect(new Set(world.hits.map((h) => h.subject))).toEqual(new Set([CALLER]))
  })

  it('[SEC-UPLOADURL-SRV-LIMIT] the daily limit refuses the 201st call with 429 and Retry-After 86400', async () => {
    signIn(CALLER)
    for (let i = 0; i < 200; i++) world.hits.push({ bucket: 'listing-upload-day', subject: CALLER })
    const refused = await POST(post(GOOD))
    expect(refused.status).toBe(429)
    expect(refused.headers.get('Retry-After')).toBe('86400')
    expect(await refused.json()).toEqual({ error: 'rate_limited', retryAfterSeconds: 86400 })
  })

  it('[SEC-UPLOADURL-SRV-LIMIT] a failing limiter answers 503 and signs nothing (fail closed)', async () => {
    signIn(CALLER)
    world.rpcError = true
    const res = await POST(post(GOOD))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('X-Amz-Signature')
  })

  it('[SEC-UPLOADURL-SRV-LIMIT] it shares the buckets of the Cloudinary signature route, so one photo is one hit in each', async () => {
    signIn(CALLER)
    await POST(post(GOOD))
    expect(world.hits.map((h) => h.bucket)).toEqual(['listing-upload-10m', 'listing-upload-day'])
  })
})
