/**
 * AGT-10 table URL contract — Task 854 revision 1 (N2/AC13).
 *
 * `AGT10_SORT_TOKENS[token]` is a bare object-index lookup: `?sort=constructor` or
 * `?sort=__proto__` resolves to an inherited `Object.prototype` member instead of `undefined`,
 * which would put `undefined` into `Agt10Table.sort`/`.direction` and break the type at runtime.
 * `resolveSortToken` (used by both `parseAgt10Table` and the sort `Select`'s `onChange`) closes
 * this with `Object.hasOwn` — every case here proves the fallback to `DEFAULT_AGT10_SORT_TOKEN`
 * (`created_desc`) fires instead.
 */
import { describe, it, expect } from 'vitest'
import { parseAgt10Table, serializeAgt10Table, resolveSortToken, sortTokenOf, DEFAULT_AGT10_SORT_TOKEN } from '../tableParams'

describe('resolveSortToken — Object.hasOwn guard against inherited Object.prototype members', () => {
  it('"constructor" falls back to the default (created_at/desc), never an inherited function', () => {
    expect(resolveSortToken('constructor')).toEqual({ sort: 'created_at', direction: 'desc' })
  })

  it('"__proto__" falls back to the default, never resolving to Object.prototype itself', () => {
    expect(resolveSortToken('__proto__')).toEqual({ sort: 'created_at', direction: 'desc' })
  })

  it('"toString" and "hasOwnProperty" also fall back to the default', () => {
    expect(resolveSortToken('toString')).toEqual({ sort: 'created_at', direction: 'desc' })
    expect(resolveSortToken('hasOwnProperty')).toEqual({ sort: 'created_at', direction: 'desc' })
  })

  it('undefined falls back to the default', () => {
    expect(resolveSortToken(undefined)).toEqual({ sort: 'created_at', direction: 'desc' })
  })

  it('a genuine token resolves to its own pair, not the default', () => {
    expect(resolveSortToken('expires_asc')).toEqual({ sort: 'expires_at', direction: 'asc' })
  })

  it('the Task 891 activity tokens resolve to their own pairs', () => {
    expect(resolveSortToken('views_desc')).toEqual({ sort: 'recorded_views', direction: 'desc' })
    expect(resolveSortToken('views_asc')).toEqual({ sort: 'recorded_views', direction: 'asc' })
    expect(resolveSortToken('whatsapp_desc')).toEqual({ sort: 'whatsapp_clicks', direction: 'desc' })
    expect(resolveSortToken('whatsapp_asc')).toEqual({ sort: 'whatsapp_clicks', direction: 'asc' })
    expect(resolveSortToken('activity_desc')).toEqual({ sort: 'last_activity_date', direction: 'desc' })
    expect(resolveSortToken('activity_asc')).toEqual({ sort: 'last_activity_date', direction: 'asc' })
  })
})

describe('parseAgt10Table — AC13: sort=constructor / sort=__proto__ never leak an inherited member', () => {
  it('sort=constructor -> { sort: "created_at", direction: "desc" }', () => {
    const table = parseAgt10Table(new URLSearchParams('sort=constructor'))
    expect(table.sort).toBe('created_at')
    expect(table.direction).toBe('desc')
  })

  it('sort=__proto__ -> { sort: "created_at", direction: "desc" }', () => {
    const table = parseAgt10Table(new URLSearchParams('sort=__proto__'))
    expect(table.sort).toBe('created_at')
    expect(table.direction).toBe('desc')
  })

  it('an absent sort param also falls back to the default', () => {
    const table = parseAgt10Table(new URLSearchParams(''))
    expect(table.sort).toBe('created_at')
    expect(table.direction).toBe('desc')
    expect(sortTokenOf(table.sort, table.direction)).toBe(DEFAULT_AGT10_SORT_TOKEN)
  })

  it('an unknown status/visibility/type/page falls back to undefined/page 1, never throws', () => {
    const table = parseAgt10Table(new URLSearchParams('status=not-a-status&visibility=nope&type=nope&page=not-a-number'))
    expect(table.status).toBeUndefined()
    expect(table.visibility).toBeUndefined()
    expect(table.listingType).toBeUndefined()
    expect(table.page).toBe(1)
  })

  it('a valid combination round-trips through serializeAgt10Table', () => {
    const table = parseAgt10Table(new URLSearchParams('status=active&visibility=visible&type=sale&sort=expires_asc&page=3'))
    const params = serializeAgt10Table(table)
    expect(params).toEqual({ sort: 'expires_asc', status: 'active', visibility: 'visible', type: 'sale', page: '3' })
    expect(parseAgt10Table(new URLSearchParams(params))).toEqual(table)
  })
})
