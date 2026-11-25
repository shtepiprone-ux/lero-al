// @vitest-environment node
/**
 * Task 1038 (AC4): `createListing` and `updateListing` read an R2 photo back before they attach it.
 *  - SEC-PHOTO-VERIFY: an R2 photo whose `full` or `thumb` object is missing, larger than 819 200 bytes, of a type other than the extension's, or whose first bytes are not that
 *    image, is refused with `images_invalid`, and NOTHING is written (no listing, no image row, no status move, no delete).
 *  - A photo already on the listing is not read again; a Cloudinary photo is not read at all; an unreadable R2 (the read throws) refuses (fail closed).
 * The code under test is the real actions, `verifyListingPhoto` and the address rule. The doubles are the session, the database and the two R2 reads (`headObject`, `readHead`). Synthetic values.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let role: string | null = 'user'
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (t: string) => (t === 'users' ? { select: () => ({ eq: () => ({ single: async () => ({ data: role ? { role } : null }) }) }) } : db.from(t)),
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => (t === 'users' ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role, status: 'active', suspended_until: null, deleted_at: null } : null, error: null }) }) }) } : db.from(t)),
  }),
}))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: vi.fn(async (id: string, to: string) => ({ ok: true, nextStatus: to, listingId: id })) }))
vi.mock('@/lib/media/listingPhoto', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/media/listingPhoto')>()),
  deleteListingPhotos: vi.fn(async () => ({ removed: 0, kept: 0, dryRun: false, failed: 0, purge: 'not_run', errors: [] })),
}))
vi.mock('@/modules/listings/validations', () => ({ listingSchema: { safeParse: (p: Record<string, unknown>) => { const { images: _images, ...rest } = p; return { success: true, data: rest } } } }))

const store = vi.hoisted(() => ({
  heads: new Map<string, { contentLength: number; contentType: string | null } | null>(),
  bytes: new Map<string, Uint8Array>(),
  headCalls: [] as string[],
  readCalls: [] as string[],
  headThrows: false,
}))
vi.mock('@/lib/media/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/media/r2')>()),
  headObject: vi.fn(async (key: string) => { store.headCalls.push(key); if (store.headThrows) throw new Error('R2 unreachable'); return store.heads.get(key) ?? null }),
  readHead: vi.fn(async (key: string) => { store.readCalls.push(key); const b = store.bytes.get(key); if (!b) throw new Error('missing'); return b }),
}))

import { createListing } from '../createListing'
import { updateListing } from '../updateListing'

const UUID1 = '44444444-4444-4444-8444-444444444441'
const UUID2 = '44444444-4444-4444-8444-444444444442'
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x10, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20])
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1])
const HTML = new TextEncoder().encode('<html><script>alert(1)</script>')
const key = (owner: string, uuid: string, name: 'full' | 'thumb', ext = 'webp') => `${owner}/listings/${uuid}/${name}.${ext}`
const photo = (owner: string, uuid: string, n: number, ext = 'webp') => ({ url: `https://media.lero.al/${owner}/listings/${uuid}/full.${ext}`, is_cover: n === 0, order: n })
/** both objects of a good photo */
function stock(owner: string, uuid: string, ext = 'webp') {
  const type = ext === 'webp' ? 'image/webp' : 'image/jpeg'
  for (const name of ['full', 'thumb'] as const) {
    store.heads.set(key(owner, uuid, name, ext), { contentLength: 50_000, contentType: type })
    store.bytes.set(key(owner, uuid, name, ext), ext === 'webp' ? WEBP : JPEG)
  }
}
const base = { title: 'Flat in Tirana', price: 90000, currency: 'EUR' }
const writes = () => db.log.filter((l) => l.op !== 'select')

const ENV = { R2_PUBLIC_URL: 'https://media.lero.al', R2_ENDPOINT: 'https://a.r2.cloudflarestorage.com', R2_BUCKET_NAME: 'b', R2_ACCESS_KEY_ID: 'k', R2_SECRET_ACCESS_KEY: 's', NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'lero-cloud' } as Record<string, string>
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) { saved[name] = process.env[name]; process.env[name] = value }
  store.heads.clear(); store.bytes.clear(); store.headCalls = []; store.readCalls = []; store.headThrows = false
  db = createFakeDb({
    listings: [{ id: 'l-a', slug: 'a-listing', user_id: 'user-a', status: 'active', price: 1, price_old: null, currency: 'EUR', title: 'A' }],
    listing_images: [{ id: 'img-1', listing_id: 'l-a', url: `https://media.lero.al/user-a/listings/${UUID1}/full.webp`, is_cover: true, order: 0 }],
  })
  currentUser = { id: 'user-b' }
  role = 'user'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => {
  for (const name of Object.keys(ENV)) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  vi.restoreAllMocks()
})

describe('createListing reads an R2 photo back', () => {
  it('[SEC-PHOTO-VERIFY] a photo whose two objects are good is attached; both objects were read', async () => {
    stock('user-b', UUID1)
    const res = await createListing({ ...base, images: [photo('user-b', UUID1, 0)] } as never)
    expect('slug' in res).toBe(true)
    expect(store.headCalls.sort()).toEqual([key('user-b', UUID1, 'full'), key('user-b', UUID1, 'thumb')].sort())
    expect(db.tables.listing_images).toHaveLength(2)   // the fixture row plus the new one
  })

  it('[SEC-PHOTO-VERIFY] a JPEG photo (full.jpg, thumb.jpg, image/jpeg, JPEG bytes) is attached', async () => {
    stock('user-b', UUID1, 'jpg')
    expect('slug' in (await createListing({ ...base, images: [photo('user-b', UUID1, 0, 'jpg')] } as never))).toBe(true)
  })

  it.each([
    ['the full object is missing', (o: string) => store.heads.delete(key(o, UUID1, 'full'))],
    ['the thumb object is missing', (o: string) => store.heads.delete(key(o, UUID1, 'thumb'))],
    ['the full object is 819201 bytes', (o: string) => store.heads.set(key(o, UUID1, 'full'), { contentLength: 819_201, contentType: 'image/webp' })],
    ['the thumb object is 819201 bytes', (o: string) => store.heads.set(key(o, UUID1, 'thumb'), { contentLength: 819_201, contentType: 'image/webp' })],
    ['the full object is empty', (o: string) => store.heads.set(key(o, UUID1, 'full'), { contentLength: 0, contentType: 'image/webp' })],
    ['the full object is stored as image/png', (o: string) => store.heads.set(key(o, UUID1, 'full'), { contentLength: 100, contentType: 'image/png' })],
    ['the thumb object is stored as image/jpeg but the extension is webp', (o: string) => store.heads.set(key(o, UUID1, 'thumb'), { contentLength: 100, contentType: 'image/jpeg' })],
    ['the full object is stored as text/html', (o: string) => store.heads.set(key(o, UUID1, 'full'), { contentLength: 100, contentType: 'text/html' })],
    ['the full object has no content type', (o: string) => store.heads.set(key(o, UUID1, 'full'), { contentLength: 100, contentType: null })],
    ['the full bytes are an HTML page declared as image/webp', (o: string) => store.bytes.set(key(o, UUID1, 'full'), HTML)],
    ['the thumb bytes are JPEG while the type and extension are webp', (o: string) => store.bytes.set(key(o, UUID1, 'thumb'), JPEG)],
    ['the full bytes are empty', (o: string) => store.bytes.set(key(o, UUID1, 'full'), new Uint8Array())],
  ])('[SEC-PHOTO-VERIFY] %s: images_invalid and nothing is written', async (_label, spoil) => {
    stock('user-b', UUID1)
    spoil('user-b')
    const res = await createListing({ ...base, images: [photo('user-b', UUID1, 0)] } as never)
    expect(res).toEqual({ error: 'images_invalid' })
    expect(writes()).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] one bad photo among good ones refuses the whole listing and writes nothing', async () => {
    stock('user-b', UUID1)   // the second photo has no objects at all
    const res = await createListing({ ...base, images: [photo('user-b', UUID1, 0), photo('user-b', UUID2, 1)] } as never)
    expect(res).toEqual({ error: 'images_invalid' })
    expect(writes()).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] an R2 that cannot be read refuses (fail closed) and writes nothing', async () => {
    stock('user-b', UUID1)
    store.headThrows = true
    expect(await createListing({ ...base, images: [photo('user-b', UUID1, 0)] } as never)).toEqual({ error: 'images_invalid' })
    expect(writes()).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] another person\'s photo is refused by the address rule before R2 is asked', async () => {
    stock('user-a', UUID1)
    expect(await createListing({ ...base, images: [photo('user-a', UUID1, 0)] } as never)).toEqual({ error: 'invalid_image' })
    expect(store.headCalls).toEqual([])
    expect(writes()).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] a Cloudinary photo is not read from R2', async () => {
    const cloud = { url: 'https://res.cloudinary.com/lero-cloud/image/upload/v1/user-b/listings/a.jpg', is_cover: true, order: 0 }
    expect('slug' in (await createListing({ ...base, images: [cloud] } as never))).toBe(true)
    expect(store.headCalls).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] a listing with no photo asks R2 nothing', async () => {
    expect('slug' in (await createListing({ ...base, images: [] } as never))).toBe(true)
    expect(store.headCalls).toEqual([])
  })
})

describe('updateListing reads an R2 photo back', () => {
  beforeEach(() => { currentUser = { id: 'user-a' } })

  it('[SEC-PHOTO-VERIFY] a new photo is read; one already on the listing is not read again', async () => {
    stock('user-a', UUID2)   // UUID1 is on the listing and has no objects in the double: reading it would fail
    const existing = photo('user-a', UUID1, 0)
    const res = await updateListing('l-a', { ...base, images: [existing, photo('user-a', UUID2, 1)] } as never)
    expect('slug' in res).toBe(true)
    expect(store.headCalls.every((k) => k.includes(UUID2))).toBe(true)
    expect(store.headCalls).toHaveLength(2)
  })

  it.each([
    ['a missing object', (o: string) => store.heads.delete(key(o, UUID2, 'thumb'))],
    ['an oversized object', (o: string) => store.heads.set(key(o, UUID2, 'full'), { contentLength: 819_201, contentType: 'image/webp' })],
    ['another type', (o: string) => store.heads.set(key(o, UUID2, 'full'), { contentLength: 100, contentType: 'image/png' })],
    ['bytes that are not that image', (o: string) => store.bytes.set(key(o, UUID2, 'full'), HTML)],
  ])('[SEC-PHOTO-VERIFY] %s: images_invalid; the listing, its images and its status stay as they were and nothing is deleted', async (_label, spoil) => {
    stock('user-a', UUID2)
    spoil('user-a')
    const res = await updateListing('l-a', { ...base, title: 'Updated', images: [photo('user-a', UUID1, 0), photo('user-a', UUID2, 1)] } as never)
    expect(res).toEqual({ error: 'images_invalid' })
    expect(db.tables.listings.find((l) => l.id === 'l-a')?.title).toBe('A')
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])
    expect(writes()).toEqual([])
  })

  it('[SEC-PHOTO-VERIFY] a staff member editing the owner\'s listing has the photo checked in the OWNER\'s folder', async () => {
    currentUser = { id: 'user-b' }
    role = 'admin'
    stock('user-a', UUID2)
    const res = await updateListing('l-a', { ...base, images: [photo('user-a', UUID2, 0)] } as never)
    expect('slug' in res).toBe(true)
    expect(store.headCalls.every((k) => k.startsWith('user-a/listings/'))).toBe(true)
    // a photo in the staff member's own folder is refused: the folder is the owner's
    stock('user-b', UUID1)
    expect(await updateListing('l-a', { ...base, images: [photo('user-b', UUID1, 0)] } as never)).toEqual({ error: 'invalid_image' })
  })

  it('[SEC-PHOTO-VERIFY] an R2 that cannot be read refuses (fail closed)', async () => {
    stock('user-a', UUID2)
    store.headThrows = true
    expect(await updateListing('l-a', { ...base, images: [photo('user-a', UUID2, 0)] } as never)).toEqual({ error: 'images_invalid' })
    expect(writes()).toEqual([])
  })
})
