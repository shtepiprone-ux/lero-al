// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S21 and the listing ownership rules): what createListing / updateListing accept from a browser.
 *  - an image address that is not on this project's Cloudinary cloud is refused BEFORE anything is written (it would be output in `<img src>` on public pages);
 *  - person B cannot edit person A's listing, whatever id is sent; an administrator can; an anonymous caller cannot do either action;
 *  - the owner, status and counters of a new listing are set by the server, never by the payload.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
// the caller's own row, read by the real `requireViewer()` (Task 923 R44)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => (t === 'users' ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role, status: 'active', suspended_until: null, deleted_at: null } : null, error: null }) }) }) } : db.from(t)),
  }),
}))
let blockedError: string | null = null
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => blockedError }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
// the move of an owner's edit of an ACTIVE listing to review goes through the one status gateway (Task 923 R74); its own behaviour is proved in
// updateListing.security.test.ts and applyListingTransition.test.ts, here it is a boundary double that succeeds
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: vi.fn(async (id: string, to: string) => ({ ok: true, nextStatus: to, listingId: id })) }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async () => undefined) }))
// the schema is not under test here: it passes the payload through (a wrong id or price is covered by its own tests)
vi.mock('@/modules/listings/validations', () => ({ listingSchema: { safeParse: (p: Record<string, unknown>) => { const { images: _images, ...rest } = p; return { success: true, data: rest } } } }))

import { deleteAsset } from '@/lib/cloudinaryDelete'
import { createListing } from '../createListing'
import { updateListing } from '../updateListing'

const CLOUD = 'lero-cloud'
const GOOD = (n: number) => ({ url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/listings/${n}.jpg`, is_cover: n === 0, order: n })
const EVIL = { url: 'https://tracker.example/pixel.gif?uid=1', is_cover: false, order: 9 }
const base = { title: 'Flat in Tirana', price: 90000, currency: 'EUR' }

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  db = createFakeDb({
    listings: [{ id: 'l-a', slug: 'a-listing', user_id: 'user-a', status: 'active', price: 1, price_old: null, currency: 'EUR', title: 'A' }],
    listing_images: [{ id: 'img-1', listing_id: 'l-a', url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/listings/old.jpg`, is_cover: true, order: 0 }],
  })
  currentUser = { id: 'user-b' }
  blockedError = null
  vi.mocked(deleteAsset).mockClear()
  role = 'user'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createListing', () => {
  it('stores trusted images and sets owner, status and counters on the server', async () => {
    const res = await createListing({ ...base, user_id: 'user-a', status: 'active', views_count: 9999, images: [GOOD(0), GOOD(1)] } as never)
    expect('slug' in res).toBe(true)
    const row = db.tables.listings.find((l) => l.slug !== 'a-listing')
    expect(row).toMatchObject({ user_id: 'user-b', status: 'pending', views_count: 0, price_old: null })
    expect(db.tables.listing_images.filter((i) => i.listing_id === row?.id)).toHaveLength(2)
  })

  it('refuses a listing with an image from another site and writes nothing', async () => {
    const res = await createListing({ ...base, images: [GOOD(0), EVIL] } as never)
    expect(res).toEqual({ error: 'invalid_image' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it.each([
    ['a data URL', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['a javascript URL', 'javascript:alert(1)'],
    ['another cloud', 'https://res.cloudinary.com/someone-else/x.jpg'],
    ['plain http', `http://res.cloudinary.com/${CLOUD}/x.jpg`],
  ])('refuses %s', async (_l, url) => {
    expect(await createListing({ ...base, images: [{ url, is_cover: true, order: 0 }] } as never)).toEqual({ error: 'invalid_image' })
  })

  it('refuses an anonymous caller', async () => {
    currentUser = null
    expect(await createListing({ ...base, images: [] } as never)).toEqual({ error: 'unauthenticated' })
    expect(db.log).toEqual([])
  })
})

describe('updateListing', () => {
  it('person B cannot edit person A\'s listing, and nothing is written', async () => {
    const res = await updateListing('l-a', { ...base, title: 'hijacked', images: [GOOD(0)] } as never)
    expect('error' in res).toBe(true)
    expect(db.tables.listings.find((l) => l.id === 'l-a')?.title).toBe('A')
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])
  })

  it('the owner can edit their own listing and the images are replaced', async () => {
    currentUser = { id: 'user-a' }
    const res = await updateListing('l-a', { ...base, title: 'Updated', images: [GOOD(0), GOOD(1)] } as never)
    expect('slug' in res).toBe(true)
    expect(db.tables.listings.find((l) => l.id === 'l-a')?.title).toBe('Updated')
    expect(db.tables.listing_images.filter((i) => i.listing_id === 'l-a')).toHaveLength(2)
  })

  it('an administrator can edit someone else\'s listing', async () => {
    role = 'admin'
    const res = await updateListing('l-a', { ...base, title: 'Moderated', images: [GOOD(0)] } as never)
    expect('slug' in res).toBe(true)
    expect(db.tables.listings.find((l) => l.id === 'l-a')?.title).toBe('Moderated')
  })

  it('the owner is refused an image from another site, and the listing and its images stay as they were', async () => {
    currentUser = { id: 'user-a' }
    const res = await updateListing('l-a', { ...base, title: 'Updated', images: [GOOD(0), EVIL] } as never)
    expect(res).toEqual({ error: 'invalid_image' })
    expect(db.tables.listings.find((l) => l.id === 'l-a')?.title).toBe('A')
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('an anonymous caller is refused', async () => {
    currentUser = null
    expect(await updateListing('l-a', { ...base, images: [] } as never)).toEqual({ error: 'unauthenticated' })
    expect(db.log).toEqual([])
  })

  it('a listing that does not exist is "not_found"', async () => {
    currentUser = { id: 'user-a' }
    expect(await updateListing('nope', { ...base, images: [] } as never)).toEqual({ error: 'not_found' })
  })
})

describe('the shape of the images list (finding S49)', () => {
  const tooMany = Array.from({ length: 21 }, (_, n) => GOOD(n))
  const bad: [string, unknown][] = [
    ['more than 20 images', tooMany],
    ['not a list', { 0: GOOD(0), length: 1 }],
    ['nothing at all', undefined],
    ['a null entry', [null]],
    ['a cover flag that is not true / false', [{ ...GOOD(0), is_cover: 'yes' }]],
    ['no cover flag', [{ url: GOOD(0).url, order: 0 }]],
    ['a position that is text', [{ ...GOOD(0), order: '1' }]],
    ['a negative position', [{ ...GOOD(0), order: -1 }]],
    ['a fractional position', [{ ...GOOD(0), order: 1.5 }]],
    ['a position of 1000', [{ ...GOOD(0), order: 1000 }]],
  ]

  it.each(bad)('createListing refuses %s and writes nothing', async (_l, images) => {
    expect(await createListing({ ...base, images } as never)).toEqual({ error: 'invalid_image' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it.each(bad)('updateListing refuses %s and leaves the listing and its images as they were', async (_l, images) => {
    currentUser = { id: 'user-a' }
    expect(await updateListing('l-a', { ...base, images } as never)).toEqual({ error: 'invalid_image' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
    expect(db.tables.listing_images).toHaveLength(1)
  })

  it('exactly 20 images and an empty list are accepted', async () => {
    expect('slug' in (await createListing({ ...base, images: Array.from({ length: 20 }, (_, n) => GOOD(n)) } as never))).toBe(true)
    expect('slug' in (await createListing({ ...base, images: [] } as never))).toBe(true)
  })
})

describe('updateListing: a blocked person and the failure paths after the listing is saved', () => {
  const owner = () => { currentUser = { id: 'user-a' } }
  const okPayload = { ...base, images: [GOOD(0)] }

  it.each(['account_blocked', 'account_suspended'])('a person who is %s edits nothing, and createListing refuses them too', async (reason) => {
    owner()
    blockedError = reason
    expect(await updateListing('l-a', okPayload as never)).toEqual({ error: reason })
    expect(await createListing(okPayload as never)).toEqual({ error: reason })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('old images that are no longer used are handed to the clean-up, and the ones kept are not', async () => {
    owner()
    db.tables.listing_images.push({ id: 'img-2', listing_id: 'l-a', url: GOOD(0).url, is_cover: false, order: 1 })
    expect('slug' in (await updateListing('l-a', okPayload as never))).toBe(true)
    const asked = vi.mocked(deleteAsset).mock.calls.map((c) => c[0])
    expect(asked).toEqual(['listings/old'])
    expect(vi.mocked(deleteAsset).mock.calls[0][1]).toEqual({ reason: 'listing_image_removed' })
  })

  it('a clean-up that fails is logged and does not fail the save', async () => {
    owner()
    vi.mocked(deleteAsset).mockRejectedValueOnce(new Error('cloudinary down'))
    expect('slug' in (await updateListing('l-a', okPayload as never))).toBe(true)
    expect(console.error).toHaveBeenCalledWith('[updateListing] image cleanup failed:', expect.any(Error))
  })

  /** makes ONE kind of write or read on listing_images fail; `when` limits it to the calls whose rows / columns it accepts */
  function failImages(op: 'select' | 'delete' | 'insert', when: (arg: unknown) => boolean = () => true) {
    const origFrom = db.from
    db.from = ((t: string) => {
      const c = origFrom(t) as Record<string, (...a: unknown[]) => unknown>
      if (t === 'listing_images') {
        const failing: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { message: 'x' } }) : failing), apply: () => failing })
        const orig = c[op].bind(c)
        c[op] = (...a: unknown[]) => (when(a[0]) ? failing : orig(...a))
      }
      return c
    }) as never
  }
  const IMAGE_FAILED = { error: 'images_failed' }

  it('new images that cannot be saved: the previous images are restored, no clean-up runs, and the failure is reported (Task 923 R67 (a))', async () => {
    owner()
    // the insert of the NEW rows fails; the insert that puts the old rows back works
    failImages('insert', (rows) => Array.isArray(rows) && rows.some((r) => r.url === GOOD(0).url))
    expect(await updateListing('l-a', okPayload as never)).toEqual(IMAGE_FAILED)
    expect(console.error).toHaveBeenCalledWith('Failed to update listing images', expect.objectContaining({ listingId: 'l-a' }))
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])         // the gallery is back as it was, with the same row
    expect(db.tables.listing_images[0]).toMatchObject({ url: expect.stringContaining('old.jpg'), is_cover: true, order: 0 })
    expect(deleteAsset).not.toHaveBeenCalled()                                    // the files the old rows point at are untouched
  })

  it('when the previous images cannot be put back either, both failures are logged with the listing id and the failure is still reported', async () => {
    owner()
    failImages('insert')                                                          // every insert fails, the restore too
    expect(await updateListing('l-a', okPayload as never)).toEqual(IMAGE_FAILED)
    expect(console.error).toHaveBeenCalledWith('Failed to restore listing images', expect.objectContaining({ listingId: 'l-a', rows: 1 }))
    expect(deleteAsset).not.toHaveBeenCalled()
  })

  it('a failed delete of the old image rows stops the update before any new row is written, and no clean-up runs', async () => {
    owner()
    failImages('delete')
    expect(await updateListing('l-a', okPayload as never)).toEqual(IMAGE_FAILED)
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])
    expect(db.log.filter((l) => l.table === 'listing_images' && l.op === 'insert')).toEqual([])
    expect(deleteAsset).not.toHaveBeenCalled()
  })

  it('a failed read of the old image rows stops the update before anything is deleted', async () => {
    owner()
    failImages('select', (cols) => cols === '*')
    expect(await updateListing('l-a', okPayload as never)).toEqual(IMAGE_FAILED)
    expect(db.tables.listing_images.map((i) => i.id)).toEqual(['img-1'])
    expect(db.log.filter((l) => l.table === 'listing_images' && l.op === 'delete')).toEqual([])
    expect(deleteAsset).not.toHaveBeenCalled()
  })

  it('createListing reports images that cannot be saved instead of answering with a slug', async () => {
    owner()
    failImages('insert')
    const res = await createListing(okPayload as never)
    expect(res).toEqual(IMAGE_FAILED)
    expect(console.error).toHaveBeenCalledWith('Failed to insert listing images', expect.objectContaining({ listingId: expect.anything() }))
  })

  it('an unknown listing is "not_found"', async () => {
    owner()
    expect(await updateListing('nope', okPayload as never)).toEqual({ error: 'not_found' })
  })

  it('a database failure of the listing update is returned', async () => {
    owner()
    const origFrom = db.from
    db.from = ((t: string) => {
      const c = origFrom(t) as Record<string, unknown>
      if (t === 'listings') {
        const select = c.select as (...a: unknown[]) => unknown
        c.select = select
        c.update = () => ({ eq: async () => ({ error: { message: 'row too big' } }) })
      }
      return c
    }) as never
    const res = await updateListing('l-a', okPayload as never)
    expect(res).toEqual({ error: 'update_failed' })                       // a fixed code, never the database's message (Task 923 R71 (f))
    expect(JSON.stringify(res)).not.toContain('row too big')
    expect(vi.mocked(deleteAsset)).not.toHaveBeenCalled()
  })

  it('a refused payload does not touch the images', async () => {
    owner()
    const bad = { ...okPayload, images: [{ ...GOOD(0), order: 'x' }] }
    expect(await updateListing('l-a', bad as never)).toEqual({ error: 'invalid_image' })
    expect(db.tables.listing_images).toHaveLength(1)
  })
})

// Task 923 R38 (case SEC-S49-SRV-DENY)
it('[SEC-S49-SRV-DENY] An image payload is a list of at most 20 trusted images with a boolean cover and a position 0-999', async () => {
  currentUser = { id: 'user-a' }
  const tooMany = Array.from({ length: 21 }, (_, n) => GOOD(n))
  for (const images of [tooMany, [{ ...GOOD(0), is_cover: 'yes' }], [{ ...GOOD(0), order: 5000 }]]) {
    expect(await updateListing('l-a', { ...base, images } as never)).toEqual({ error: 'invalid_image' })
  }
  expect(db.log.filter((l) => l.op !== 'select')).toEqual([])           // no row inserted, updated or deleted
  expect(db.tables.listing_images).toHaveLength(1)
  expect('slug' in (await createListing({ ...base, images: Array.from({ length: 20 }, (_, n) => GOOD(n)) } as never))).toBe(true)   // the control: exactly 20 pass
})
