// @vitest-environment node
/**
 * Reads (Task 923 Revision 7). A public read must apply the public-visibility rule (active AND not expired) so a draft, sold or expired listing is never returned;
 * a person's own lists (favourites, history) are asked for by their id; a database error is thrown (never returned as "no results"); the pages are 25 long.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let serverUser: { id: string } | null = null
vi.mock('@/lib/supabase/client', () => ({ createClient: () => db.client }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ ...db.client, auth: { getUser: async () => ({ data: { user: serverUser } }) } }) }))

import { getFeaturedListings, getLatestListings, getListings } from '../queries'
import { buildCabinetListingsQuery } from '@/modules/cabinet/lib/queries'
import { getFavoriteIds, getFavoriteListings, getFavoriteListingsPaginated, getFavoriteTypeCounts, getUserCollections } from '../favoritesQueries'
import { loadUserFavoriteListingIds } from '../loadUserFavoriteListingIds'
import { getSearchableLocations } from '@/modules/locations/lib/queries'
import { getActiveCurrencies } from '@/modules/currency/lib/queries'
import { getCompanies } from '@/modules/companies/lib/queries'

const FUTURE = '2099-01-01T00:00:00Z'
const PAST = '2020-01-01T00:00:00Z'
const L = (id: string, extra: Record<string, unknown> = {}) => ({ id, status: 'active', expires_at: FUTURE, is_premium: false, created_at: `2026-01-0${id.slice(-1)}`, listing_type: 'sale', property_type: 'apartment', price: 100, ...extra })

function failing(table: string) {
  const real = db.client.from
  db.client.from = ((t: string) => {
    const c = real(t) as Record<string, unknown>
    if (t === table) {
      const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { message: 'boom' } }) : chain), apply: () => chain })
      c.select = () => chain
    }
    return c
  }) as never
}

beforeEach(() => {
  db = createFakeDb({
    listings: [
      L('l1', { is_premium: true }), L('l2', { price: 300, rooms: 2 }), L('l3', { status: 'pending' }), L('l4', { status: 'sold' }), L('l5', { expires_at: PAST }), L('l6', { expires_at: null }),
      L('l7', { listing_type: 'rent', property_type: 'house', location_id: 4, is_premium: true }),
    ],
    favorites: [{ id: 'f1', user_id: 'u1', listing_id: 'l1', created_at: '2026-02-01' }, { id: 'f2', user_id: 'u1', listing_id: 'l7', created_at: '2026-02-03' }, { id: 'f3', user_id: 'u1', listing_id: 'l9', created_at: '2026-02-02' }, { id: 'f4', user_id: 'u2', listing_id: 'l2', created_at: '2026-02-04' }],
    collections: [{ id: 'c1', user_id: 'u1', name: 'A', created_at: '2026-01-01' }, { id: 'c2', user_id: 'u2', name: 'B', created_at: '2026-01-02' }],
    collection_items: [{ id: 'i1', collection_id: 'c1' }, { id: 'i2', collection_id: 'c1' }, { id: 'i3', collection_id: 'c2' }],
    locations: [{ id: 1, type: 'region', name_al: 'B' }, { id: 2, type: 'city', name_al: 'A' }, { id: 3, type: 'country', name_al: 'Z' }, { id: 4, type: 'village', name_al: 'C' }],
    currencies: [{ id: 1, code: 'ALL', is_active: true, is_default: true }, { id: 2, code: 'EUR', is_active: true, is_default: false }, { id: 3, code: 'USD', is_active: false, is_default: false }],
    companies: [{ id: 'k2', name: 'Zeta' }, { id: 'k1', name: 'Alfa' }],
  })
  serverUser = { id: 'u1' }
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.useRealTimers())

describe('public listing reads show only public listings', () => {
  it('featured: only premium, active and not expired, newest first', async () => {
    expect((await getFeaturedListings()).map((l: { id: string }) => l.id)).toEqual(['l7', 'l1'])
  })

  it('latest: premium first, then newest; never a pending, sold, expired or no-expiry listing', async () => {
    const ids = (await getLatestListings()).map((l: { id: string }) => l.id)
    expect(ids).toEqual(['l7', 'l1', 'l2'])
  })

  it('the visibility rule asks for "active" and an expiry from now on, on every read', async () => {
    await getFeaturedListings(); await getLatestListings(); await getListings()
    for (const log of db.log) {
      expect(log.filters).toEqual(expect.arrayContaining([['status', 'eq', 'active'], ['expires_at', 'gte', '2026-10-17T10:00:00.000Z']]))
    }
  })

  it('a database error is thrown, not turned into "no listings"', async () => {
    failing('listings')
    await expect(getFeaturedListings()).rejects.toMatchObject({ message: 'boom' })
    await expect(getLatestListings()).rejects.toMatchObject({ message: 'boom' })
    await expect(getListings()).rejects.toMatchObject({ message: 'boom' })
  })
})

describe('getListings', () => {
  it('without filters returns every public listing and the total', async () => {
    const res = await getListings()
    expect(res.total).toBe(3)
    expect(res.listings.map((l: { id: string }) => l.id)).toEqual(['l7', 'l1', 'l2'])
  })

  it('applies each filter it is given', async () => {
    expect((await getListings({ listing_type: 'rent' })).listings.map((l: { id: string }) => l.id)).toEqual(['l7'])
    expect((await getListings({ property_type: 'house' })).total).toBe(1)
    expect((await getListings({ location_id: 4 })).total).toBe(1)
    expect((await getListings({ price_min: 200 })).listings.map((l: { id: string }) => l.id)).toEqual(['l2'])
    expect((await getListings({ price_max: 100 })).total).toBe(2)
    expect((await getListings({ rooms: 2 })).listings.map((l: { id: string }) => l.id)).toEqual(['l2'])
  })

  it('a zero or empty filter is not applied', async () => {
    expect((await getListings({ price_min: 0, rooms: 0, location_id: 0 })).total).toBe(3)
  })

  it('pages are 25 long: page 2 starts at the 26th', async () => {
    db.tables.listings = Array.from({ length: 30 }, (_, i) => L(`m${String(i).padStart(2, '0')}`, { created_at: `2026-03-${String(i + 1).padStart(2, '0')}` }))
    const first = await getListings({ page: 1 })
    const second = await getListings({ page: 2 })
    expect(first.total).toBe(30)
    expect(first.listings).toHaveLength(25)
    expect(second.listings).toHaveLength(5)
    expect(new Set([...first.listings, ...second.listings].map((l: { id: string }) => l.id)).size).toBe(30)
  })
})

describe('cabinet query builder', () => {
  const recorder = () => {
    const calls: unknown[][] = []
    const q: Record<string, (...a: unknown[]) => unknown> = {}
    for (const m of ['eq', 'in']) q[m] = (...a: unknown[]) => { calls.push([m, ...a]); return q }
    return { q, calls }
  }

  it('turns a visibility group into its statuses and adds the premium filter on top', () => {
    const a = recorder()
    buildCabinetListingsQuery(a.q, 'HIDDEN', 'PREMIUM')
    expect(a.calls).toEqual([['in', 'status', ['inactive', 'pending', 'expired']], ['eq', 'is_premium', true]])
    const b = recorder()
    buildCabinetListingsQuery(b.q, 'ALL')
    expect(b.calls).toEqual([])
  })
})

describe('favourites are asked for by the person\'s id', () => {
  it('getFavoriteIds returns only that person\'s', async () => {
    expect(await getFavoriteIds('u1')).toEqual(['l1', 'l7', 'l9'])
    expect(await getFavoriteIds('nobody')).toEqual([])
  })

  it('getFavoriteListings keeps the favourites order (newest first), skips archived and missing listings, and can filter by type', async () => {
    db.tables.listings.push(L('l9', { status: 'archived' }))
    expect((await getFavoriteListings('u1')).map((l: { id: string }) => l.id)).toEqual(['l7', 'l1'])
    expect((await getFavoriteListings('u1', 'house' as never)).map((l: { id: string }) => l.id)).toEqual(['l7'])
    expect(await getFavoriteListings('nobody')).toEqual([])
  })

  it('getFavoriteListingsPaginated pages the visible favourites and reports the total', async () => {
    // l9 has no listing row, so two favourites are visible
    const first = await getFavoriteListingsPaginated('u1', undefined, 1, 1)
    expect(first.total).toBe(2)
    expect(first.listings.map((l: { id: string }) => l.id)).toEqual(['l7'])
    expect((await getFavoriteListingsPaginated('u1', undefined, 2, 1)).listings.map((l: { id: string }) => l.id)).toEqual(['l1'])
    expect(await getFavoriteListingsPaginated('u1', undefined, 9, 1)).toEqual({ listings: [], total: 2 })
    expect(await getFavoriteListingsPaginated('nobody')).toEqual({ listings: [], total: 0 })
  })

  it('counts the types of the visible favourites', async () => {
    expect(await getFavoriteTypeCounts('u1')).toEqual({ apartment: 1, house: 1 })
    expect(await getFavoriteTypeCounts('nobody')).toEqual({})
  })

  it('collections: only the person\'s own, each with its item count', async () => {
    expect(await getUserCollections('u1')).toMatchObject([{ id: 'c1', item_count: 2 }])
    expect(await getUserCollections('nobody')).toEqual([])
  })

  it('a failing listing read returns an empty page instead of crashing', async () => {
    failing('listings')
    expect(await getFavoriteListings('u1')).toEqual([])
  })
})

describe('loadUserFavoriteListingIds', () => {
  const clientFor = (user: { id: string } | null, throws = false) => ({
    ...db.client,
    auth: { getUser: async () => { if (throws) throw new Error('x'); return { data: { user } } } },
  })

  it('returns the signed-in person\'s favourite ids as a set', async () => {
    expect([...(await loadUserFavoriteListingIds(clientFor({ id: 'u1' }) as never))].sort()).toEqual(['l1', 'l7', 'l9'])
  })

  it('an anonymous visitor gets an empty set and the table is not read', async () => {
    db.log.length = 0
    expect((await loadUserFavoriteListingIds(clientFor(null) as never)).size).toBe(0)
    expect(db.log).toEqual([])
  })

  it('a failing read or a thrown error gives an empty set', async () => {
    failing('favorites')
    expect((await loadUserFavoriteListingIds(clientFor({ id: 'u1' }) as never)).size).toBe(0)
    expect((await loadUserFavoriteListingIds(clientFor({ id: 'u1' }, true) as never)).size).toBe(0)
  })
})

describe('reference data reads', () => {
  it('searchable locations: regions, cities and villages only, ordered', async () => {
    expect((await getSearchableLocations()).map((l) => l.id).sort()).toEqual([1, 2, 4])
  })

  it('active currencies: the default first', async () => {
    expect((await getActiveCurrencies()).map((c) => c.code)).toEqual(['ALL', 'EUR'])
  })

  it('companies by name', async () => {
    expect((await getCompanies()).map((c) => c.name)).toEqual(['Alfa', 'Zeta'])
  })

  it('a database error is thrown by each', async () => {
    failing('locations'); failing('currencies'); failing('companies')
    await expect(getSearchableLocations()).rejects.toMatchObject({ message: 'boom' })
    await expect(getActiveCurrencies()).rejects.toMatchObject({ message: 'boom' })
    await expect(getCompanies()).rejects.toMatchObject({ message: 'boom' })
  })
})

