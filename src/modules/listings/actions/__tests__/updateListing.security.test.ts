// @vitest-environment node
/**
 * Security (Task 923 R74, owner decision D53): moderation of an edit applies to ACTIVE listings only.
 *  - SEC-X-SRV-EDIT-MODERATION: the REAL updateListing runs against an in-memory database and a status-gateway double that records the ORDER of calls. The owner's edit of an
 *    ACTIVE listing moves it to `pending` BEFORE any content is written, and the answer carries `pending`; when the move fails the answer is `transition_failed` and nothing
 *    is written; when the content write fails after the move the listing stays `pending`. For sold, rented, inactive and expired listings no transition is requested and the
 *    status is unchanged; a staff edit keeps the status too.
 * Identity and the status gateway are doubles. Every id is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  userId: 'owner-1',
  role: 'user' as string,
  order: [] as string[],
  transitionFails: false,
  contentFails: false,
  /** the keys a moderator holds (Task 923 R75): editing ANOTHER person's listing needs `listings.moderate` */
  keys: new Set<string>(['listings.moderate']),
}))

let db = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => wrap(t) }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => wrap(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: state.userId }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: state.userId, role: state.role }) }))
vi.mock('@/lib/auth/permissions', () => ({ roleHasPermission: async (role: string, key: string) => role === 'admin' || (role === 'moderator' && state.keys.has(key)), hasPermission: async () => false }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async () => undefined) }))
vi.mock('@/modules/listings/validations', () => ({ listingSchema: { safeParse: (p: Record<string, unknown>) => { const { images: _images, ...rest } = p; return { success: true, data: rest } } } }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: async (id: string, to: string) => {
    state.order.push(`transition:${to}`)
    if (state.transitionFails) return { ok: false, reason: 'conflict' }
    const row = db.tables.listings.find((l) => l.id === id)
    if (row) row.status = to
    return { ok: true, nextStatus: to, listingId: id }
  },
}))

/** records when the listing row (the content) is written, and can refuse that write */
function wrap(table: string) {
  const chain = db.from(table) as Record<string, (...a: unknown[]) => unknown>
  if (table === 'listings') {
    const update = chain.update.bind(chain)
    chain.update = (values: unknown) => {
      state.order.push('content-write')
      if (state.contentFails) return { eq: async () => ({ error: { message: 'MARKER-DB-MESSAGE' } }) }
      return update(values)
    }
  }
  return chain
}

import { updateListing } from '../updateListing'

const ID = 'l-1'
const CLOUD = 'lero-cloud'
const payload = { title: 'Edited', price: 90000, currency: 'EUR', property_type: 'apartment', images: [{ url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/listings/a.jpg`, is_cover: true, order: 0 }] }

function arrange(status: string) {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  db = createFakeDb({
    listings: [{ id: ID, slug: 'flat', user_id: 'owner-1', status, price: 1, price_old: null, currency: 'EUR', title: 'Flat' }],
    listing_images: [],
    // the active catalogue rows the edit is checked against (Task 923 R100)
    property_types: [{ id: 1, slug: 'apartment', is_active: true }],
    currencies: [{ id: 1, code: 'EUR', is_active: true }],
  })
  state.userId = 'owner-1'
  state.role = 'user'
  state.order = []
  state.transitionFails = false
  state.contentFails = false
  state.keys = new Set(['listings.moderate'])
}
const listing = () => db.tables.listings.find((l) => l.id === ID)!

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('updateListing', () => {
  it('a moderator without the listings.moderate key cannot edit the listing of another person (Task 923 R75)', async () => {
    arrange('active')
    state.userId = 'moderator-1'
    state.role = 'moderator'
    state.keys = new Set()
    expect(await updateListing(ID, payload as never)).toEqual({ error: 'forbidden' })
    expect(state.order).toEqual([])
    expect(listing()).toMatchObject({ status: 'active', title: 'Flat' })
  })

  it('[SEC-X-SRV-EDIT-MODERATION] only an active listing goes to pending, before the content is written', async () => {
    // active: the transition first, the content after, the answer carries pending
    arrange('active')
    expect(await updateListing(ID, payload as never)).toEqual({ slug: 'flat', status: 'pending' })
    expect(state.order.slice(0, 2)).toEqual(['transition:pending', 'content-write'])
    expect(listing()).toMatchObject({ status: 'pending', title: 'Edited' })

    // the transition fails: transition_failed, and no content is written
    arrange('active')
    state.transitionFails = true
    expect(await updateListing(ID, payload as never)).toEqual({ error: 'transition_failed' })
    expect(state.order).toEqual(['transition:pending'])
    expect(listing()).toMatchObject({ status: 'active', title: 'Flat' })

    // the content write fails after the move: the listing stays pending, never active again
    arrange('active')
    state.contentFails = true
    const failed = await updateListing(ID, payload as never)
    expect(failed).toEqual({ error: 'update_failed' })
    expect(JSON.stringify(failed)).not.toContain('MARKER-DB-MESSAGE')
    expect(listing().status).toBe('pending')

    // every other status: no transition, the status is unchanged
    for (const status of ['sold', 'rented', 'inactive', 'expired', 'pending', 'archived']) {
      arrange(status)
      const res = await updateListing(ID, payload as never)
      expect(res, status).toEqual({ slug: 'flat', status })
      expect(state.order.filter((o) => o.startsWith('transition')), status).toEqual([])
      expect(listing(), status).toMatchObject({ status, title: 'Edited' })
    }
  })

  it('a staff edit of another person\'s active listing keeps the status and requests no transition (the control)', async () => {
    arrange('active')
    state.userId = 'moderator-1'
    state.role = 'moderator'
    expect(await updateListing(ID, payload as never)).toEqual({ slug: 'flat', status: 'active' })
    expect(state.order.filter((o) => o.startsWith('transition'))).toEqual([])
    expect(listing()).toMatchObject({ status: 'active', title: 'Edited' })
  })
})
