// @vitest-environment node
/**
 * The edges of the read helpers (Task 923 Revision 7): a database that answers with no rows or no data at all, every optional filter, a page past the end, and the
 * "recently viewed" lists with an excluded listing and a limit. None of these may crash or return another person's rows.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let user: { id: string } | null = null
vi.mock('@/lib/supabase/client', () => ({ createClient: () => db.client }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ ...db.client, auth: { getUser: async () => ({ data: { user } }) } }) }))

import { getFeaturedListings, getLatestListings, getListings } from '../queries'
import { getFavoriteIds, getFavoriteListings, getFavoriteListingsPaginated, getFavoriteTypeCounts, getUserCollections } from '../favoritesQueries'
import { getRecentlyViewedForGuest, getRecentlyViewedForUser } from '../recentlyViewedQueries'
import { getSearchableLocations } from '@/modules/locations/lib/queries'
import { getActiveCurrencies } from '@/modules/currency/lib/queries'
import { getCompanies } from '@/modules/companies/lib/queries'

const FUTURE = '2099-01-01T00:00:00Z'
const L = (id: string, extra: Record<string, unknown> = {}) => ({ id, status: 'active', expires_at: FUTURE, is_premium: false, created_at: `2026-01-0${id.slice(-1)}`, listing_type: 'sale', property_type: 'apartment', price: 100, ...extra })

/** every read of `table` answers "no error, no data" */
function noData(...tables: string[]) {
  const real = db.client.from
  db.client.from = ((t: string) => {
    const c = real(t) as Record<string, unknown>
    if (tables.includes(t)) {
      const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: null, count: null }) : chain), apply: () => chain })
      c.select = () => chain
    }
    return c
  }) as never
}

beforeEach(() => {
  db = createFakeDb({
    listings: [L('l1', { area_gross: 50, rooms: 2, bedrooms: 1, condition: 'good', heating: 'gas', wall_type: 'brick', year_built: 2000 }), L('l2', { area_gross: 120, rooms: 3, bedrooms: 2, condition: 'new_build', heating: 'electric', wall_type: 'panel', year_built: 2020 }), L('l3', { status: 'archived' }), L('l4', { property_type: 'house' })],
    favorites: [{ id: 'f1', user_id: 'u1', listing_id: 'l1', created_at: '2026-02-01' }, { id: 'f2', user_id: 'u1', listing_id: 'l4', created_at: '2026-02-02' }, { id: 'f3', user_id: 'u1', listing_id: 'l3', created_at: '2026-02-03' }],
    recently_viewed: [{ id: 'r1', user_id: 'u1', listing_id: 'l1', viewed_at: '2026-03-01' }, { id: 'r2', user_id: 'u1', listing_id: 'l2', viewed_at: '2026-03-03' }, { id: 'r3', user_id: 'u1', listing_id: 'l4', viewed_at: '2026-03-02' }, { id: 'r4', user_id: 'u2', listing_id: 'l3', viewed_at: '2026-03-04' }],
    collections: [], collection_items: [], locations: [], currencies: [], companies: [],
  })
  user = { id: 'u1' }
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a database that answers with no data', () => {
  it('public lists are empty, not a crash', async () => {
    noData('listings')
    expect(await getFeaturedListings()).toEqual([])
    expect(await getLatestListings()).toEqual([])
    expect(await getListings()).toEqual({ listings: [], total: 0 })
  })

  it('reference lists are empty', async () => {
    noData('locations', 'currencies', 'companies')
    expect(await getSearchableLocations()).toEqual([])
    expect(await getActiveCurrencies()).toEqual([])
    expect(await getCompanies()).toEqual([])
  })

  it('personal lists are empty', async () => {
    noData('favorites', 'collections')
    expect(await getFavoriteIds('u1')).toEqual([])
    expect(await getFavoriteListings('u1')).toEqual([])
    expect(await getFavoriteListingsPaginated('u1')).toEqual({ listings: [], total: 0 })
    expect(await getFavoriteTypeCounts('u1')).toEqual({})
    expect(await getUserCollections('u1')).toEqual([])
  })

  it('favourites whose listings come back with no data are an empty page or an empty count', async () => {
    noData('listings')
    expect(await getFavoriteListingsPaginated('u1')).toEqual({ listings: [], total: 0 })
    expect(await getFavoriteTypeCounts('u1')).toEqual({})
    expect(await getFavoriteListings('u1')).toEqual([])
  })

  it('collection items with no data count as zero', async () => {
    db.tables.collections.push({ id: 'c1', user_id: 'u1', name: 'A', created_at: '2026-01-01' })
    noData('collection_items')
    expect(await getUserCollections('u1')).toMatchObject([{ id: 'c1', item_count: 0 }])
  })

  it('recently viewed lists are empty', async () => {
    noData('recently_viewed')
    expect(await getRecentlyViewedForUser()).toEqual([])
    noData('listings')
    expect(await getRecentlyViewedForGuest(['11111111-1111-4111-8111-111111111111'])).toEqual([])
  })
})

describe('getListings: every optional filter', () => {
  it.each([
    [{ bedrooms: 2 }, ['l2']], [{ condition: 'good' }, ['l1']], [{ heating: 'electric' }, ['l2']], [{ wall_type: 'brick' }, ['l1']], [{ year_built_min: 2010 }, ['l2']], [{ year_built_max: 2010 }, ['l1']],
    [{ area_min: 100 }, ['l2']], [{ area_max: 100 }, ['l1']],
  ])('%j', async (filters, ids) => {
    expect((await getListings(filters as never)).listings.map((l: { id: string }) => l.id)).toEqual(ids)
  })

  it('a page past the end is an empty page with the real total', async () => {
    const res = await getListings({ page: 50 })
    expect(res.listings).toEqual([])
    expect(res.total).toBe(3)
  })
})

describe('favourites', () => {
  it('a type filter reaches the paginated list and the plain list', async () => {
    expect((await getFavoriteListingsPaginated('u1', 'house' as never)).listings.map((l: { id: string }) => l.id)).toEqual(['l4'])
    expect((await getFavoriteListingsPaginated('u1', 'land' as never))).toEqual({ listings: [], total: 0 })
  })

  it('a page past the end keeps the total', async () => {
    expect(await getFavoriteListingsPaginated('u1', undefined, 5, 25)).toEqual({ listings: [], total: 2 })
  })

  it('a failing page read returns an empty page with the total', async () => {
    const real = db.client.from
    let calls = 0
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'listings') {
        const select = c.select as (...a: unknown[]) => unknown
        c.select = (...a: unknown[]) => {
          calls++
          if (calls < 2) return select(...a)
          const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { message: 'x' } }) : chain), apply: () => chain })
          return chain
        }
      }
      return c
    }) as never
    expect(await getFavoriteListingsPaginated('u1')).toEqual({ listings: [], total: 2 })
    expect(console.error).toHaveBeenCalledWith('Failed to fetch favorite listings', expect.objectContaining({ userId: 'u1' }))
  })

  it('type counts skip archived listings', async () => {
    expect(await getFavoriteTypeCounts('u1')).toEqual({ apartment: 1, house: 1 })
  })
})

describe('recently viewed', () => {
  it('the signed-in list is newest first and does not hold another person\'s history', async () => {
    expect((await getRecentlyViewedForUser()).map((l: { id: string }) => l.id)).toEqual(['l2', 'l4', 'l1'])
  })

  it('an excluded listing is left out and the limit is applied after that', async () => {
    expect((await getRecentlyViewedForUser({ excludeId: 'l2' })).map((l: { id: string }) => l.id)).toEqual(['l4', 'l1'])
    expect((await getRecentlyViewedForUser({ excludeId: 'l2', limit: 1 })).map((l: { id: string }) => l.id)).toEqual(['l4'])
    expect((await getRecentlyViewedForUser({ limit: 2 })).map((l: { id: string }) => l.id)).toEqual(['l2', 'l4'])
  })

  it('an excluded listing that is not in the history still leaves exactly the limit', async () => {
    expect((await getRecentlyViewedForUser({ excludeId: 'not-there', limit: 2 })).map((l: { id: string }) => l.id)).toEqual(['l2', 'l4'])
  })

  it('when the only viewed listing is the excluded one the list is empty', async () => {
    db.tables.recently_viewed = [{ id: 'r1', user_id: 'u1', listing_id: 'l1', viewed_at: '2026-03-01' }]
    expect(await getRecentlyViewedForUser({ excludeId: 'l1' })).toEqual([])
  })

  it('history of listings that are not public any more (draft) is not shown', async () => {
    db.tables.listings.push(L('l5', { status: 'pending' }))
    db.tables.recently_viewed.push({ id: 'r9', user_id: 'u1', listing_id: 'l5', viewed_at: '2026-03-09' })
    expect((await getRecentlyViewedForUser()).map((l: { id: string }) => l.id)).not.toContain('l5')
  })

  it('the guest list keeps the cookie order, without the ids that are not ids, and with a limit', async () => {
    const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'junk']
    db.tables.listings.push(L('x1', { id: ids[0] }), L('x2', { id: ids[1] }))
    expect((await getRecentlyViewedForGuest([ids[1], ids[0], 'junk'])).map((l: { id: string }) => l.id)).toEqual([ids[1], ids[0]])
    expect((await getRecentlyViewedForGuest(ids, { limit: 1 })).map((l: { id: string }) => l.id)).toEqual([ids[0]])
    expect((await getRecentlyViewedForGuest(ids, { excludeId: ids[0] })).map((l: { id: string }) => l.id)).toEqual([ids[1]])
    expect(await getRecentlyViewedForGuest([])).toEqual([])
  })
})
