/**
 * Real-boundary control for owner decision D8 (2026-10-17): the REAL gateway writes to the REAL database of the approved development project (synthetic rows of one
 * run, verified clean-up). Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'
import { applyListingTransitionByStatus } from './applyListingTransition'

async function eventually<T>(read: () => PromiseLike<T>, done: (value: T) => boolean, ms = 15_000): Promise<T> {
  const until = Date.now() + ms
  let value = await read()
  while (!done(value) && Date.now() < until) { await new Promise(r => setTimeout(r, 500)); value = await read() }
  return value
}

describe('status gateway against the real database', () => {
  let run: Run
  let owner: SyntheticUser
  let staff: SyntheticUser

  beforeAll(async () => {
    run = createRun()
    owner = await run.makeUser('owner')
    staff = await run.makeUser('admin', { role: 'admin' })
  })
  afterAll(async () => {
    const result = await run.cleanup()
    expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  })

  const statusNotifications = (userId: string) => run.admin.from('notifications').select('id').eq('user_id', userId).eq('type', 'listing_status_change')

  it('[SEC-D8-INT-DENY] the owner cannot publish on the real database: status, expiry and notifications stay unchanged', async () => {
    const listing = await run.makeListing(owner.id, 'pending', 'owner-denied')
    const before = await run.admin.from('listings').select('status, expires_at').eq('id', listing.id).single()
    expect(before.error).toBeNull()

    const answer = await applyListingTransitionByStatus(listing.id, 'active', { userId: owner.id, role: 'user', source: 'cabinet' })
    expect(answer).toEqual({ ok: false, reason: 'forbidden' })

    // the chain pending -> inactive -> active is closed as well: the second step is refused
    expect(await applyListingTransitionByStatus(listing.id, 'inactive', { userId: owner.id, role: 'user', source: 'cabinet' })).toEqual({ ok: true, nextStatus: 'inactive', listingId: listing.id })
    expect(await applyListingTransitionByStatus(listing.id, 'active', { userId: owner.id, role: 'user', source: 'cabinet' })).toEqual({ ok: false, reason: 'forbidden' })

    const after = await run.admin.from('listings').select('status, expires_at').eq('id', listing.id).single()
    expect(after.data).toEqual({ status: 'inactive', expires_at: before.data?.expires_at })       // only the allowed step happened; the expiry was never re-stamped
    await new Promise(r => setTimeout(r, 1500))
    const notified = await statusNotifications(owner.id)
    expect(notified.error).toBeNull()
    expect(notified.data).toEqual([])                                                             // the owner acted on their own listing: nobody is told, and the refusals told nobody
  })

  it('[SEC-D8-INT-ALLOW] a real administrator publishes the same listing on the real database', async () => {
    const listing = await run.makeListing(owner.id, 'pending', 'admin-allowed')
    const before = await run.admin.from('listings').select('expires_at').eq('id', listing.id).single()

    const answer = await applyListingTransitionByStatus(listing.id, 'active', { userId: staff.id, role: 'admin', source: 'admin_panel' })
    expect(answer).toEqual({ ok: true, nextStatus: 'active', listingId: listing.id })

    const after = await run.admin.from('listings').select('status, expires_at').eq('id', listing.id).single()
    expect(after.data?.status).toBe('active')
    expect(new Date(after.data?.expires_at as string).getTime()).toBeGreaterThan(Date.now() + 25 * 24 * 3600_000)      // a fresh 30-day window
    expect(after.data?.expires_at).not.toBe(before.data?.expires_at)

    const notified = await eventually(() => statusNotifications(owner.id), r => (r.data ?? []).length >= 1)
    expect(notified.error).toBeNull()
    expect((notified.data ?? []).length).toBeGreaterThanOrEqual(1)                                  // the owner is told that staff published their listing
  })
})
