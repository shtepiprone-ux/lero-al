// @vitest-environment node
/**
 * Security (Task 923 R67 (a)): a failed image write never empties a gallery or deletes its files.
 *  - SEC-X-SRV-GALLERY-ATOMIC: the REAL updateListing and createListing run against an in-memory database in which one image operation fails at a time. The owner's
 *    gallery of two images is back as it was (same rows), no Cloudinary clean-up call is made, and an error code, never a success, is returned.
 * Every id and URL is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: (t: string) => db.from(t) }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'owner-1' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'owner-1', role: 'user' }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
// the move of an owner's edit of an ACTIVE listing to review goes through the one status gateway (Task 923 R74); its own behaviour is proved in
// updateListing.security.test.ts and applyListingTransition.test.ts, here it is a boundary double that succeeds
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: vi.fn(async (id: string, to: string) => ({ ok: true, nextStatus: to, listingId: id })) }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async () => undefined) }))
// the schema is not under test here: it passes the payload through
vi.mock('@/modules/listings/validations', () => ({ listingSchema: { safeParse: (p: Record<string, unknown>) => { const { images: _images, ...rest } = p; return { success: true, data: rest } } } }))

import { deleteAsset } from '@/lib/cloudinaryDelete'
import { createListing } from '../createListing'
import { updateListing } from '../updateListing'

const CLOUD = 'lero-cloud'
const url = (name: string) => `https://res.cloudinary.com/${CLOUD}/image/upload/v1/listings/${name}.jpg`
const OLD = [
  { id: 'img-1', listing_id: 'l-1', url: url('old-1'), is_cover: true, order: 0 },
  { id: 'img-2', listing_id: 'l-1', url: url('old-2'), is_cover: false, order: 1 },
]
const NEW_IMAGES = [{ url: url('new-1'), is_cover: true, order: 0 }]
const payload = { title: 'Flat', price: 90000, currency: 'EUR', images: NEW_IMAGES }

/** makes ONE kind of operation on listing_images fail; `when` limits it to the calls whose argument it accepts */
function failImages(op: 'select' | 'delete' | 'insert', when: (arg: unknown) => boolean = () => true) {
  const origFrom = db.from
  db.from = ((t: string) => {
    const c = origFrom(t) as Record<string, (...a: unknown[]) => unknown>
    if (t === 'listing_images') {
      const failing: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { message: 'MARKER-DB-MESSAGE' } }) : failing), apply: () => failing })
      const orig = c[op].bind(c)
      c[op] = (...a: unknown[]) => (when(a[0]) ? failing : orig(...a))
    }
    return c
  }) as never
}

// (the fake database stamps `created_at` on every insert, so a restored row carries one: it is not part of what the gallery means)
const gallery = () => db.tables.listing_images.filter((i) => i.listing_id === 'l-1').map(({ created_at: _c, ...row }) => row).sort((a, b) => String(a.id).localeCompare(String(b.id)))

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  db = createFakeDb({
    listings: [{ id: 'l-1', slug: 'flat', user_id: 'owner-1', status: 'active', price: 1, price_old: null, currency: 'EUR', title: 'Flat' }],
    listing_images: OLD.map((r) => ({ ...r })),
  })
  vi.mocked(deleteAsset).mockClear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('updateListingGallery', () => {
  it('[SEC-X-SRV-GALLERY-ATOMIC] a failed image write keeps the gallery and its files', async () => {
    // (a) the insert of the new rows fails: the two old rows are put back, no file is released, the error is returned
    failImages('insert', (rows) => Array.isArray(rows) && rows.some((r) => r.url === NEW_IMAGES[0].url))
    expect(await updateListing('l-1', payload as never)).toEqual({ error: 'images_failed' })
    expect(gallery()).toEqual(OLD)
    expect(deleteAsset).not.toHaveBeenCalled()

    // (b) the delete of the old rows fails: nothing is written after it, the gallery is untouched, no file is released
    db = createFakeDb({ listings: [{ id: 'l-1', slug: 'flat', user_id: 'owner-1', status: 'active', price: 1, price_old: null, currency: 'EUR', title: 'Flat' }], listing_images: OLD.map((r) => ({ ...r })) })
    failImages('delete')
    expect(await updateListing('l-1', payload as never)).toEqual({ error: 'images_failed' })
    expect(gallery()).toEqual(OLD)
    expect(db.log.filter((l) => l.table === 'listing_images' && l.op === 'insert')).toEqual([])
    expect(deleteAsset).not.toHaveBeenCalled()

    // (c) createListing: the insert of the images fails, an error code is returned, not a slug
    failImages('insert')
    const created = await createListing(payload as never)
    expect(created).toEqual({ error: 'images_failed' })
    expect(JSON.stringify(created)).not.toContain('MARKER-DB-MESSAGE')

    // the control: with no failure the gallery is replaced and the files that are no longer used are handed to the clean-up
    db = createFakeDb({ listings: [{ id: 'l-1', slug: 'flat', user_id: 'owner-1', status: 'active', price: 1, price_old: null, currency: 'EUR', title: 'Flat' }], listing_images: OLD.map((r) => ({ ...r })) })
    expect('slug' in (await updateListing('l-1', payload as never))).toBe(true)
    expect(gallery().map((i) => i.url)).toEqual([NEW_IMAGES[0].url])
    expect(vi.mocked(deleteAsset).mock.calls.map((c) => c[0]).sort()).toEqual(['listings/old-1', 'listings/old-2'])
  })
})
