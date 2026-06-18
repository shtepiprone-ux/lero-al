/**
 * Re-stamp expires_at smoke — Task 455 (Epic LV / LV.2).
 *
 * Verifies that writeListingStatus (via applyListingTransition / applyListingTransitionByStatus)
 * re-stamps expires_at when the next status is publicEligible, and does NOT re-stamp otherwise.
 *
 * Key scenario: expired → RENEW → active must produce a fresh future expires_at,
 * proving a stale/past expires_at cannot persist through re-activation.
 *
 * Uses payload-capturing mock DB to assert the exact update payload.
 *
 * Planted-violation proof: disable shouldReStampExpiresAt (always return false) →
 * the "includes expires_at" assertions FAIL; restore → PASS.
 */

import { describe, it, expect } from 'vitest'
import {
  applyListingTransition,
  applyListingTransitionByStatus,
} from '../applyListingTransition'
import type { TransitionActorContext } from '../applyListingTransition'
import { LISTING_ACTIVE_WINDOW_MS } from '@/modules/listings/domain/listingConstants'

type DbParam = NonNullable<Parameters<typeof applyListingTransition>[3]>

const adminActor: TransitionActorContext = { userId: 'admin-1', role: 'admin', source: 'admin_panel' }
const ownerActor: TransitionActorContext = { userId: 'owner-1', role: 'user', source: 'cabinet' }

function makeCapturingDb(
  currentListing: { id: string; status: string; user_id?: string; slug?: string; title?: string } | null,
): { db: DbParam; capturedPayloads: Record<string, unknown>[] } {
  const capturedPayloads: Record<string, unknown>[] = []

  const singleFn = () => Promise.resolve({ data: currentListing })
  const eqSelectFn = () => ({ single: singleFn })
  const selectFn = () => ({ eq: eqSelectFn })

  const eqUpdateFn = () => Promise.resolve({ error: null })
  const updateFn = (payload: Record<string, unknown>) => {
    capturedPayloads.push(payload)
    return { eq: eqUpdateFn }
  }
  const fromFn = () => ({ select: selectFn, update: updateFn })

  return { db: { from: fromFn } as unknown as DbParam, capturedPayloads }
}

describe('re-stamp expires_at on transition to publicEligible status (action-based)', () => {
  it('active → EXPIRE → expired: does NOT include expires_at (expired is not publicEligible)', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l1', status: 'active' })
    const result = await applyListingTransition('l1', 'EXPIRE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'expired', listingId: 'l1' })
    expect(capturedPayloads).toHaveLength(1)
    expect(capturedPayloads[0]).toHaveProperty('status', 'expired')
    expect(capturedPayloads[0]).not.toHaveProperty('expires_at')
  })

  it('expired → RENEW → active: INCLUDES fresh future expires_at (core fix)', async () => {
    const before = Date.now()
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l2', status: 'expired' })
    const result = await applyListingTransition('l2', 'RENEW', adminActor, db)
    const after = Date.now()
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l2' })
    expect(capturedPayloads).toHaveLength(1)
    expect(capturedPayloads[0]).toHaveProperty('status', 'active')
    expect(capturedPayloads[0]).toHaveProperty('expires_at')
    const expiresAt = new Date(capturedPayloads[0].expires_at as string).getTime()
    expect(expiresAt).toBeGreaterThanOrEqual(before + LISTING_ACTIVE_WINDOW_MS)
    expect(expiresAt).toBeLessThanOrEqual(after + LISTING_ACTIVE_WINDOW_MS)
  })

  it('pending → APPROVE → active: INCLUDES expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l3', status: 'pending' })
    const result = await applyListingTransition('l3', 'APPROVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l3' })
    expect(capturedPayloads[0]).toHaveProperty('expires_at')
    const expiresAt = new Date(capturedPayloads[0].expires_at as string).getTime()
    expect(expiresAt).toBeGreaterThan(Date.now())
  })

  it('inactive → PUBLISH → active: INCLUDES expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l4', status: 'inactive' })
    const result = await applyListingTransition('l4', 'PUBLISH', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l4' })
    expect(capturedPayloads[0]).toHaveProperty('expires_at')
  })

  it('active → ARCHIVE → archived: does NOT include expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l5', status: 'active' })
    const result = await applyListingTransition('l5', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l5' })
    expect(capturedPayloads[0]).not.toHaveProperty('expires_at')
  })

  it('active → MARK_AS_SOLD → sold: does NOT include expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l6', status: 'active' })
    const result = await applyListingTransition('l6', 'MARK_AS_SOLD', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'sold', listingId: 'l6' })
    expect(capturedPayloads[0]).not.toHaveProperty('expires_at')
  })
})

describe('re-stamp expires_at on privileged status-based transition', () => {
  it('owner: expired → active (privileged): INCLUDES fresh expires_at', async () => {
    const before = Date.now()
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l7', status: 'expired', user_id: 'owner-1' })
    const result = await applyListingTransitionByStatus('l7', 'active', ownerActor, db)
    const after = Date.now()
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l7' })
    expect(capturedPayloads[0]).toHaveProperty('expires_at')
    const expiresAt = new Date(capturedPayloads[0].expires_at as string).getTime()
    expect(expiresAt).toBeGreaterThanOrEqual(before + LISTING_ACTIVE_WINDOW_MS)
    expect(expiresAt).toBeLessThanOrEqual(after + LISTING_ACTIVE_WINDOW_MS)
  })

  it('admin: sold → active (privileged): INCLUDES fresh expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l8', status: 'sold' })
    const result = await applyListingTransitionByStatus('l8', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l8' })
    expect(capturedPayloads[0]).toHaveProperty('expires_at')
  })

  it('admin: active → archived (privileged): does NOT include expires_at', async () => {
    const { db, capturedPayloads } = makeCapturingDb({ id: 'l9', status: 'active' })
    const result = await applyListingTransitionByStatus('l9', 'archived', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l9' })
    expect(capturedPayloads[0]).not.toHaveProperty('expires_at')
  })
})
