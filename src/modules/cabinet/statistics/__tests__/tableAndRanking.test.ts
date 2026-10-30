// @vitest-environment node
/**
 * The statistics table address and the top-listings ranking (Task 923 Revision 7). The address is typed by anybody: it must always parse to a valid table state
 * (never throw, never carry an inherited object member), and the ranking must never show a title of a listing the owner does not have.
 */
import { describe, expect, it } from 'vitest'
import { AGT10_SORT_TOKENS, DEFAULT_AGT10_SORT_TOKEN, parseAgt10Table, resolveSortToken, serializeAgt10Table, sortTokenOf } from '../tableParams'
import { rankTopListings } from '../topListings'

describe('sort tokens', () => {
  it('every token resolves to its pair and back to the same token', () => {
    for (const [token, { sort, direction }] of Object.entries(AGT10_SORT_TOKENS)) {
      expect(resolveSortToken(token)).toEqual({ sort, direction })
      expect(sortTokenOf(sort, direction)).toBe(token)
    }
  })

  it.each([[undefined], [''], ['nope'], ['CREATED_DESC'], ['constructor'], ['__proto__'], ['toString'], ['hasOwnProperty']])('the token %j gives the default', (token) => {
    expect(resolveSortToken(token)).toEqual(AGT10_SORT_TOKENS[DEFAULT_AGT10_SORT_TOKEN])
  })

  it('a pair that has no token gives the default token', () => {
    expect(sortTokenOf('nothing' as never, 'asc')).toBe(DEFAULT_AGT10_SORT_TOKEN)
  })
})

describe('parseAgt10Table', () => {
  it('an empty address is the default table', () => {
    expect(parseAgt10Table(new URLSearchParams(''))).toEqual({ status: undefined, visibility: undefined, listingType: undefined, sort: 'created_at', direction: 'desc', page: 1 })
  })

  it('reads a full address, from URLSearchParams and from a record (an array takes its first value)', () => {
    const expected = { status: 'active', visibility: 'hidden', listingType: 'rent', sort: 'recorded_views', direction: 'asc', page: 3 }
    expect(parseAgt10Table(new URLSearchParams('status=active&visibility=hidden&type=rent&sort=views_asc&page=3'))).toEqual(expected)
    expect(parseAgt10Table({ status: ['active', 'sold'], visibility: 'hidden', type: 'rent', sort: 'views_asc', page: ['3', '9'] })).toEqual(expected)
  })

  it.each([['status', 'draft'], ['status', 'ACTIVE'], ['visibility', 'all'], ['type', 'lease'], ['type', 'SALE']])('an unknown %s=%s is dropped', (key, value) => {
    const t = parseAgt10Table(new URLSearchParams(`${key}=${value}`))
    expect([t.status, t.visibility, t.listingType]).toEqual([undefined, undefined, undefined])
  })

  it.each([['0', 1], ['-4', 1], ['abc', 1], ['', 1], ['1', 1], ['2.9', 2], ['1e2', 100], ['Infinity', 1]])('the page %j is %d', (page, expected) => {
    expect(parseAgt10Table(new URLSearchParams(`page=${page}`)).page).toBe(expected)
  })

  it('a missing record value is the default', () => {
    expect(parseAgt10Table({ status: undefined, page: undefined })).toMatchObject({ status: undefined, page: 1 })
  })
})

describe('serializeAgt10Table', () => {
  it('writes only what differs from the default, and parses back to the same table', () => {
    expect(serializeAgt10Table(parseAgt10Table(new URLSearchParams('')))).toEqual({ sort: 'created_desc' })
    const table = parseAgt10Table(new URLSearchParams('status=sold&visibility=visible&type=sale&sort=whatsapp_desc&page=4'))
    const out = serializeAgt10Table(table)
    expect(out).toEqual({ sort: 'whatsapp_desc', status: 'sold', visibility: 'visible', type: 'sale', page: '4' })
    expect(parseAgt10Table(out)).toEqual(table)
  })

  it('page 1 is not written', () => {
    expect(serializeAgt10Table({ ...parseAgt10Table({}), page: 1 })).not.toHaveProperty('page')
  })
})

describe('rankTopListings', () => {
  const rows = (...r: [string, number, string | null][]) => r.map(([listingId, recordedViews, lastActivityDate]) => ({ listingId, recordedViews, lastActivityDate })) as never
  const own = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }, { id: 'c', title: 'Gamma' }, { id: 'd', title: 'Delta' }]

  it('orders by views, and keeps only the owner\'s own listings with views', () => {
    const top = rankTopListings(rows(['a', 5, '2026-01-01'], ['b', 9, '2026-01-01'], ['zzz', 99, '2026-01-01'], ['c', 0, '2026-01-01']), own)
    expect(top).toEqual([{ listingId: 'b', title: 'Beta', recordedViews: 9 }, { listingId: 'a', title: 'Alpha', recordedViews: 5 }])
  })

  it('a tie goes to the more recent activity, then a listing without a date last, then the id', () => {
    const top = rankTopListings(rows(['a', 5, '2026-01-01'], ['b', 5, '2026-02-01'], ['c', 5, null], ['d', 5, null]), own)
    expect(top.map((r) => r.listingId)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('equal views and dates fall back to the id, in either input order', () => {
    expect(rankTopListings(rows(['d', 1, '2026-01-01'], ['a', 1, '2026-01-01']), own).map((r) => r.listingId)).toEqual(['a', 'd'])
    expect(rankTopListings(rows(['a', 1, '2026-01-01'], ['d', 1, '2026-01-01']), own).map((r) => r.listingId)).toEqual(['a', 'd'])
  })

  it('a listing with a date comes before one with none, whichever is first in the input', () => {
    expect(rankTopListings(rows(['a', 2, null], ['b', 2, '2026-01-01']), own).map((r) => r.listingId)).toEqual(['b', 'a'])
    expect(rankTopListings(rows(['b', 2, '2026-01-01'], ['a', 2, null]), own).map((r) => r.listingId)).toEqual(['b', 'a'])
  })

  it('shows at most five by default and obeys another limit', () => {
    const many = Array.from({ length: 8 }, (_, i) => [`id${i}`, 10 - i, '2026-01-01'] as [string, number, string])
    const titles = many.map(([id]) => ({ id, title: id }))
    expect(rankTopListings(rows(...many), titles)).toHaveLength(5)
    expect(rankTopListings(rows(...many), titles, 2)).toHaveLength(2)
    expect(rankTopListings(rows(...many), titles, 0)).toEqual([])
  })

  it('does not change its input', () => {
    const input = rows(['a', 1, null], ['b', 2, null])
    const copy = JSON.stringify(input)
    rankTopListings(input, own)
    expect(JSON.stringify(input)).toBe(copy)
  })
})
