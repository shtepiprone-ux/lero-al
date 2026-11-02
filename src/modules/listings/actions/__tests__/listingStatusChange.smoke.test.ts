/**
 * Guard smoke — Listing status change: pure engine + gateway (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Status change":
 *   Pure engine: legal transition matrix + privileged any-status invariant.
 *   Gateway: owner-privileged write → { ok: true, nextStatus }; forbidden for plain user;
 *            same-status → invalid_transition; not_found when listing missing.
 *
 * ## Relationship to existing test file
 * `src/modules/listings/actions/applyListingTransition.test.ts` provides comprehensive
 * gateway coverage (40+ tests) via the `_db` injection pattern. This smoke file:
 *   - Directly asserts the PURE ENGINE functions (resolveTransition, canSetStatusPrivileged)
 *     which the existing test exercises only indirectly through the gateway.
 *   - Adds thin gateway smoke (owner-privileged path + forbidden + not_found + same-status)
 *     using the same _db injection — NOT duplicating the existing matrix.
 *
 * ## Planted-violation proof (see session log for transcript):
 *   Make `canSetStatusPrivileged` always return `true` even for same-status →
 *   'same-status' invalid_transition assertion FAILS.
 *   Revert → PASS.
 *
 * Commands:
 *   npx vitest run src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts
 *   npx vitest run src/modules/listings/actions/applyListingTransition.test.ts (comprehensive gateway)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  resolveTransition,
  canSetStatusPrivileged,
  ALLOWED_LISTING_TRANSITIONS,
} from '@/modules/listings/domain/listingTransitionEngine'
import {
  applyListingTransitionByStatus,
} from '../applyListingTransition'
import type { TransitionActorContext } from '../applyListingTransition'

// ── Pure-engine invariants ─────────────────────────────────────────────────────
// These test the domain function directly — no DB mock needed.

describe('pure engine — resolveTransition matrix (smoke)', () => {
  it('pending + APPROVE → { ok: true, nextStatus: "active" }', () => {
    const result = resolveTransition('pending', 'APPROVE')
    expect(result).toEqual({ ok: true, nextStatus: 'active' })
  })

  it('pending + PUBLISH → { ok: false, reason: "invalid_transition" } (PUBLISH not in pending matrix)', () => {
    // PUBLISH is NOT in ALLOWED_LISTING_TRANSITIONS.pending → must be blocked.
    // This is the exact invariant a plain-user action cannot bypass.
    expect(ALLOWED_LISTING_TRANSITIONS.pending).not.toContain('PUBLISH')
    const result = resolveTransition('pending', 'PUBLISH')
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('active + ARCHIVE → { ok: true, nextStatus: "archived" }', () => {
    expect(resolveTransition('active', 'ARCHIVE')).toEqual({ ok: true, nextStatus: 'archived' })
  })

  it('sold + RESTORE → { ok: false, reason: "invalid_transition" } (sold is terminal, only ARCHIVE allowed)', () => {
    expect(resolveTransition('sold', 'RESTORE')).toEqual({ ok: false, reason: 'invalid_transition' })
  })
})

describe('pure engine — canSetStatusPrivileged', () => {
  it('active → pending: privileged = true (distinct statuses)', () => {
    expect(canSetStatusPrivileged('active', 'pending')).toBe(true)
  })

  it('pending → sold: privileged = true (owner may mark sold from any status)', () => {
    expect(canSetStatusPrivileged('pending', 'sold')).toBe(true)
  })

  it('same-status (active → active): privileged = false — not a real transition', () => {
    // Critical: same-status must always be blocked. If this returned true,
    // owners could trigger spurious notifications + cache invalidations.
    expect(canSetStatusPrivileged('active', 'active')).toBe(false)
  })

  it('archived → inactive: privileged = true (restore path, any status allowed for privileged)', () => {
    expect(canSetStatusPrivileged('archived', 'inactive')).toBe(true)
  })
})

// ── Gateway smoke — applyListingTransitionByStatus ───────────────────────────
// Uses the _db injection parameter (same pattern as applyListingTransition.test.ts).
// NOT duplicating the existing 40+ gateway tests — adding only the registry row invariants.

type DbParam = NonNullable<Parameters<typeof applyListingTransitionByStatus>[3]>

// The update double behaves like the database (Task 923 R67 (e), Task 931): it applies each `.eq(column, value)` to the CURRENT row and answers
// `.select('id')` with the rows it changed — the same contract as the comprehensive gateway test (applyListingTransition.test.ts).
const writes: Array<{ payload: Record<string, unknown>; filters: Array<[string, unknown]> }> = []

function makeMockDb(
  currentListing: { id: string; status: string; user_id: string } | null,
  updateResult: { error: null | { message: string } } = { error: null },
): DbParam {
  const singleFn    = () => Promise.resolve({ data: currentListing })
  const eqSelectFn  = () => ({ single: singleFn })
  const selectFn    = () => ({ eq: eqSelectFn })
  const updateFn    = (payload: Record<string, unknown>) => {
    const filters: Array<[string, unknown]> = []
    const chain = {
      eq: (column: string, value: unknown) => { filters.push([column, value]); return chain },
      select: () => {
        writes.push({ payload, filters: [...filters] })
        if (updateResult.error) return Promise.resolve({ data: null, error: updateResult.error })
        const matches = !!currentListing
          && filters.every(([column, value]) => (currentListing as Record<string, unknown>)[column] === value)
        return Promise.resolve({ data: matches ? [{ id: currentListing!.id }] : [], error: null })
      },
    }
    return chain
  }
  const fromFn      = () => ({ select: selectFn, update: updateFn })
  return { from: fromFn } as unknown as DbParam
}

const OWNER_ID = 'owner-user-1'
const ADMIN_ID = 'admin-user-1'

const ownerActor: TransitionActorContext = { userId: OWNER_ID, role: 'user',  source: 'cabinet' }
const adminActor: TransitionActorContext = { userId: ADMIN_ID, role: 'admin', source: 'admin_panel' }
const strangerActor: TransitionActorContext = { userId: 'stranger-99', role: 'user', source: 'cabinet' }

describe('gateway — applyListingTransitionByStatus (smoke)', () => {
  beforeEach(() => { writes.length = 0 })

  it('[SEC-931-SRV-TRANSITION-ALLOW] owner: active → sold (privileged) → { ok: true, nextStatus: "sold" }', async () => {
    const db = makeMockDb({ id: 'l1', status: 'active', user_id: OWNER_ID })
    const result = await applyListingTransitionByStatus('l1', 'sold', ownerActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'sold', listingId: 'l1' })
    // compare-and-set: the write matches the id AND the status it was decided on
    expect(writes).toHaveLength(1)
    expect(writes[0].filters).toEqual([['id', 'l1'], ['status', 'active']])
  })

  it('admin: pending → active (privileged) → { ok: true, nextStatus: "active" }', async () => {
    const db = makeMockDb({ id: 'l2', status: 'pending', user_id: 'other-owner' })
    const result = await applyListingTransitionByStatus('l2', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l2' })
  })

  it('stranger (non-owner, role:user) → { ok: false, reason: "forbidden" }', async () => {
    const db = makeMockDb({ id: 'l3', status: 'active', user_id: OWNER_ID })
    const result = await applyListingTransitionByStatus('l3', 'inactive', strangerActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('not_found: listing missing → { ok: false, reason: "not_found" }', async () => {
    const db = makeMockDb(null)
    const result = await applyListingTransitionByStatus('missing', 'active', ownerActor, db)
    expect(result).toEqual({ ok: false, reason: 'not_found' })
  })

  it('same-status (active → active) → { ok: false, reason: "invalid_transition" }', async () => {
    const db = makeMockDb({ id: 'l5', status: 'active', user_id: OWNER_ID })
    const result = await applyListingTransitionByStatus('l5', 'active', ownerActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })
})
