// @vitest-environment node
/**
 * Task 956 AC6: what a visitor is told about a listing address follows the ONE public rule (visibility.ts `isListingOpenableByAddress`): an active listing until its
 * expiry, a sold listing, a rented listing are `public`; every other listing that exists, and an active listing whose expiry passed or is missing, is `hidden`;
 * an address with no listing is `missing`. The answer is one word and carries no listing field.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))

import { getListingAccessState } from '../listingAccessState'

const FUTURE = new Date(Date.now() + 86_400_000).toISOString()
const PAST = new Date(Date.now() - 86_400_000).toISOString()

beforeEach(() => {
  db = createFakeDb({
    listings: [
      { id: '1', slug: 'active-future', status: 'active', expires_at: FUTURE, user_id: 'u1' },
      { id: '2', slug: 'active-past', status: 'active', expires_at: PAST, user_id: 'u1' },
      { id: '3', slug: 'active-null', status: 'active', expires_at: null, user_id: 'u1' },
      { id: '4', slug: 'sold-past', status: 'sold', expires_at: PAST, user_id: 'u1' },
      { id: '5', slug: 'rented-null', status: 'rented', expires_at: null, user_id: 'u1' },
      { id: '6', slug: 'archived-future', status: 'archived', expires_at: FUTURE, user_id: 'u1' },
      { id: '7', slug: 'pending-future', status: 'pending', expires_at: FUTURE, user_id: 'u1' },
      { id: '8', slug: 'expired-past', status: 'expired', expires_at: PAST, user_id: 'u1' },
      { id: '9', slug: 'inactive-future', status: 'inactive', expires_at: FUTURE, user_id: 'u1' },
    ],
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getListingAccessState (the one public rule)', () => {
  it.each([
    ['active-future', 'public'],
    ['sold-past', 'public'],
    ['rented-null', 'public'],
    ['active-past', 'hidden'],
    ['active-null', 'hidden'],
    ['archived-future', 'hidden'],
    ['pending-future', 'hidden'],
    ['expired-past', 'hidden'],
    ['inactive-future', 'hidden'],
    ['no-such-listing', 'missing'],
  ])('%s → %s', async (slug, expected) => {
    expect(await getListingAccessState(slug)).toBe(expected)
  })

  it('reads the status and the expiry of the one listing, nothing else', async () => {
    await getListingAccessState('active-future')
    const read = db.log.filter((entry) => entry.table === 'listings')
    expect(read).toHaveLength(1)
    expect(read[0].filters).toEqual([['slug', 'eq', 'active-future']])
  })

  it('a read error names no listing: the answer is missing', async () => {
    db.client.from = (() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: 'XX000', message: 'boom' } }) }) }) })) as never
    expect(await getListingAccessState('active-future')).toBe('missing')
  })
})
