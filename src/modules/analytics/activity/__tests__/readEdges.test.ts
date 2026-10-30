// @vitest-environment node
/**
 * The failure paths of the activity readers (Task 923 Revision 7). A dashboard must show "could not load" for a failed query, never a row of zeros, and a freshness
 * it cannot read is an inconsistency, never "fresh".
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STALE_AFTER_MS } from '../types'

let rpcAnswer: { data: unknown; error: unknown } | 'throw' = { data: [], error: null }
let freshAnswer: { data: unknown; error: unknown } | 'throw' = { data: [], error: null }
const rpcCalls: { fn: string; args: Record<string, unknown> }[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => { rpcCalls.push({ fn, args }); if (rpcAnswer === 'throw') throw new Error('rpc down'); return rpcAnswer },
    from: () => {
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order']) chain[m] = () => chain
      chain.limit = async () => { if (freshAnswer === 'throw') throw new Error('db down'); return freshAnswer }
      return chain
    },
  }),
}))

import { getActivityFreshness, getOwnerActivityByListing } from '../read'

const period = { from: '2026-10-01', to: '2026-10-17' } as never
const owner = 'owner-1' as never

beforeEach(() => {
  rpcAnswer = { data: [], error: null }
  freshAnswer = { data: [], error: null }
  rpcCalls.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getOwnerActivityByListing', () => {
  it('asks for exactly this owner and period, and turns the database\'s text numbers into numbers', async () => {
    rpcAnswer = { data: [{ listing_id: 'l1', recorded_views: '12', whatsapp_clicks: '3', listing_inquiry_submissions: '1', last_activity_date: '2026-10-16' }], error: null }
    expect(await getOwnerActivityByListing(owner, period)).toEqual({ ok: true, data: [{ listingId: 'l1', recordedViews: 12, whatsappClicks: 3, listingInquirySubmissions: 1, lastActivityDate: '2026-10-16' }] })
    expect(rpcCalls).toEqual([{ fn: 'listing_activity_owner_by_listing', args: { p_owner: 'owner-1', p_from: '2026-10-01', p_to: '2026-10-17' } }])
  })

  it('no activity is an empty list that is a success', async () => {
    expect(await getOwnerActivityByListing(owner, period)).toEqual({ ok: true, data: [] })
  })

  it('a database error is "query_failed" and is logged', async () => {
    rpcAnswer = { data: null, error: { message: 'x' } }
    expect(await getOwnerActivityByListing(owner, period)).toEqual({ ok: false, error: 'query_failed' })
    expect(console.error).toHaveBeenCalled()
  })

  it('a call that throws is "query_failed"', async () => {
    rpcAnswer = 'throw'
    expect(await getOwnerActivityByListing(owner, period)).toEqual({ ok: false, error: 'query_failed' })
  })

  it.each([[null], [undefined], [{}], ['rows'], [5]])('an answer that is not a list (%j) is "data_inconsistent", never zeros', async (data) => {
    rpcAnswer = { data, error: null }
    expect(await getOwnerActivityByListing(owner, period)).toEqual({ ok: false, error: 'data_inconsistent' })
  })
})

describe('getActivityFreshness', () => {
  const now = new Date('2026-10-17T12:00:00Z')
  const ranAt = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString()

  it('no successful refresh at all is stale', async () => {
    expect(await getActivityFreshness(now)).toEqual({ ok: true, data: { lastSuccessAt: null, stale: true } })
    freshAnswer = { data: null, error: null }
    expect(await getActivityFreshness(now)).toEqual({ ok: true, data: { lastSuccessAt: null, stale: true } })
  })

  it('a refresh within the limit is fresh, exactly at the limit is still fresh, one millisecond past it is stale', async () => {
    freshAnswer = { data: [{ ran_at: ranAt(60_000) }], error: null }
    expect(await getActivityFreshness(now)).toMatchObject({ ok: true, data: { stale: false } })
    freshAnswer = { data: [{ ran_at: ranAt(STALE_AFTER_MS) }], error: null }
    expect(await getActivityFreshness(now)).toMatchObject({ ok: true, data: { stale: false } })
    freshAnswer = { data: [{ ran_at: ranAt(STALE_AFTER_MS + 1) }], error: null }
    expect(await getActivityFreshness(now)).toMatchObject({ ok: true, data: { stale: true } })
  })

  it('returns the time of the refresh as it was stored', async () => {
    const stored = ranAt(1000)
    freshAnswer = { data: [{ ran_at: stored }], error: null }
    expect(await getActivityFreshness(now)).toMatchObject({ data: { lastSuccessAt: stored } })
  })

  it('a time that cannot be read is "data_inconsistent", not fresh', async () => {
    freshAnswer = { data: [{ ran_at: 'yesterday-ish' }], error: null }
    expect(await getActivityFreshness(now)).toEqual({ ok: false, error: 'data_inconsistent' })
  })

  it('a database error or a throw is "query_failed"', async () => {
    freshAnswer = { data: null, error: { message: 'x' } }
    expect(await getActivityFreshness(now)).toEqual({ ok: false, error: 'query_failed' })
    freshAnswer = 'throw'
    expect(await getActivityFreshness(now)).toEqual({ ok: false, error: 'query_failed' })
  })
})
