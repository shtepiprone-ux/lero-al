import { describe, it, expect } from 'vitest'
import {
  applyListingTransition,
  applyListingTransitionByStatus,
} from './applyListingTransition'
import type { TransitionActorContext } from './applyListingTransition'

// ── Mock DB helpers ───────────────────────────────────────────────────────────
//
// Tests inject a mock DB via the optional _db parameter.
// This keeps tests pure (no vi.mock needed, no module hoisting concerns).

type MockSelectResult = { data: { id: string; status: string; user_id?: string } | null; error: null }
type MockUpdateResult = { error: null | { message: string } }

function makeMockDb(selectResult: MockSelectResult, updateResult: MockUpdateResult = { error: null }) {
  const singleFn = () => Promise.resolve(selectResult)
  const eqSelectFn = () => ({ single: singleFn })
  const selectFn = () => ({ eq: eqSelectFn })
  const eqUpdateFn = () => Promise.resolve(updateResult)
  const updateFn = () => ({ eq: eqUpdateFn })
  const fromFn = () => ({ select: selectFn, update: updateFn })
  return { from: fromFn } as unknown as NonNullable<Parameters<typeof applyListingTransition>[3]>
}

// ── Actor fixtures ────────────────────────────────────────────────────────────

const adminActor: TransitionActorContext = { userId: 'admin-1', role: 'admin', source: 'admin_panel' }
const modActor:   TransitionActorContext = { userId: 'mod-1',   role: 'moderator', source: 'admin_panel' }
const userActor:  TransitionActorContext = { userId: 'user-1',  role: 'user',      source: 'cabinet' }
const noRoleActor: TransitionActorContext = { userId: 'anon-1', role: null }

// ── applyListingTransition — action-based ─────────────────────────────────────

describe('applyListingTransition — permission checks', () => {
  it('returns forbidden for user role', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('returns forbidden for null role', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', noRoleActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('allows admin role', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result.ok).toBe(true)
  })

  it('allows moderator role', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransition('l1', 'APPROVE', modActor, db)
    expect(result.ok).toBe(true)
  })
})

describe('applyListingTransition — not found', () => {
  it('returns not_found when listing does not exist', async () => {
    const db = makeMockDb({ data: null, error: null })
    const result = await applyListingTransition('missing', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'not_found' })
  })
})

describe('applyListingTransition — valid transitions', () => {
  it('pending + APPROVE → active', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransition('l1', 'APPROVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('pending + REJECT → inactive', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransition('l1', 'REJECT', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })

  it('active + ARCHIVE → archived', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })

  it('active + MARK_AS_SOLD → sold', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'MARK_AS_SOLD', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'sold', listingId: 'l1' })
  })

  it('active + MARK_AS_RENTED → rented', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'MARK_AS_RENTED', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'rented', listingId: 'l1' })
  })

  it('active + UNPUBLISH → inactive', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'UNPUBLISH', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })

  it('inactive + PUBLISH → active', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'inactive' }, error: null })
    const result = await applyListingTransition('l1', 'PUBLISH', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('sold + ARCHIVE → archived', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })

  it('rented + ARCHIVE → archived', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'rented' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })

  it('archived + RESTORE → inactive', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'archived' }, error: null })
    const result = await applyListingTransition('l1', 'RESTORE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })

  it('active + EXPIRE → expired', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransition('l1', 'EXPIRE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'expired', listingId: 'l1' })
  })

  it('expired + RENEW → active', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'expired' }, error: null })
    const result = await applyListingTransition('l1', 'RENEW', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('expired + ARCHIVE → archived', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'expired' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })
})

describe('applyListingTransition — invalid transitions', () => {
  it('sold + RESTORE → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransition('l1', 'RESTORE', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('rented + PUBLISH → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'rented' }, error: null })
    const result = await applyListingTransition('l1', 'PUBLISH', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('archived + ARCHIVE → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'archived' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('pending + PUBLISH → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransition('l1', 'PUBLISH', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('inactive + APPROVE → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'inactive' }, error: null })
    const result = await applyListingTransition('l1', 'APPROVE', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('expired + PUBLISH → invalid_transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'expired' }, error: null })
    const result = await applyListingTransition('l1', 'PUBLISH', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('expired + EXPIRE → invalid_transition (cannot double-expire)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'expired' }, error: null })
    const result = await applyListingTransition('l1', 'EXPIRE', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })
})

describe('applyListingTransition — terminal status enforcement', () => {
  it('sold cannot be restored directly', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransition('l1', 'RESTORE', adminActor, db)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_transition')
  })

  it('rented cannot be restored directly', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'rented' }, error: null })
    const result = await applyListingTransition('l1', 'RESTORE', adminActor, db)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_transition')
  })

  it('sold can only ARCHIVE — path to archived confirmed', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })
})

describe('applyListingTransition — DB error', () => {
  it('returns db_error when DB update fails', async () => {
    const failDb = makeMockDb(
      { data: { id: 'l1', status: 'active' }, error: null },
      { error: { message: 'connection timeout' } },
    )
    const result = await applyListingTransition('l1', 'ARCHIVE', adminActor, failDb)
    expect(result).toEqual({ ok: false, reason: 'db_error' })
  })
})

// ── applyListingTransitionByStatus — status-based bridge ──────────────────────

describe('applyListingTransitionByStatus — permission checks', () => {
  it('returns forbidden for user role', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'archived', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })
})

describe('applyListingTransitionByStatus — not found', () => {
  it('returns not_found when listing does not exist', async () => {
    const db = makeMockDb({ data: null, error: null })
    const result = await applyListingTransitionByStatus('missing', 'inactive', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'not_found' })
  })
})

describe('applyListingTransitionByStatus — same-status is not a transition (Task 427 rework)', () => {
  it('admin: same-status returns invalid_transition (not a no-op success)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })

  it('owner of own listing: same-status returns invalid_transition (not a no-op success)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active', user_id: 'user-1' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
  })
})

describe('applyListingTransitionByStatus — valid transitions', () => {
  it('pending → active (bridges to APPROVE)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('pending → inactive (bridges to REJECT)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'inactive', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })

  it('active → archived (bridges to ARCHIVE)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'archived', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'archived', listingId: 'l1' })
  })

  it('archived → inactive (bridges to RESTORE)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'archived' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'inactive', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })

  it('inactive → active (bridges to PUBLISH)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'inactive' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })
})

// (Task 427) For a privileged actor (admin/moderator, or owner of their own
// listing), applyListingTransitionByStatus allows direct transition to ANY
// other status — these previously-"invalid" status pairs now succeed.
describe('applyListingTransitionByStatus — privileged any-status transitions (Task 427)', () => {
  it('sold → active (admin, no base-matrix path, now allowed)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('sold → pending (admin, now allowed)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'pending', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'pending', listingId: 'l1' })
  })

  it('archived → active (admin, now allowed without going via inactive)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'archived' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('rented → inactive (admin, now allowed)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'rented' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'inactive', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })
  })
})

describe('applyListingTransitionByStatus — admin restore flow', () => {
  it('archived → inactive → active (two-step restore works)', async () => {
    // Step 1: restore archived to inactive
    const db1 = makeMockDb({ data: { id: 'l1', status: 'archived' }, error: null })
    const step1 = await applyListingTransitionByStatus('l1', 'inactive', adminActor, db1)
    expect(step1).toEqual({ ok: true, nextStatus: 'inactive', listingId: 'l1' })

    // Step 2: publish inactive to active
    const db2 = makeMockDb({ data: { id: 'l1', status: 'inactive' }, error: null })
    const step2 = await applyListingTransitionByStatus('l1', 'active', adminActor, db2)
    expect(step2).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })
})

// ── applyListingTransitionByStatus — privileged any-status (Task 427) ────────

describe('applyListingTransitionByStatus — privileged any-status access', () => {
  it('owner of own listing: sold → active (self-approve, no base-matrix path)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold', user_id: 'user-1' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', userActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('owner of own listing: archived → pending (no base-matrix path)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'archived', user_id: 'user-1' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'pending', userActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'pending', listingId: 'l1' })
  })

  it('admin: sold → active (privileged any-status, beyond base matrix)', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold', user_id: 'other-user' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', adminActor, db)
    expect(result).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
  })

  it('non-owner, non-staff caller: forbidden even for same-status no-op', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active', user_id: 'other-user' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('non-owner, non-staff caller: forbidden for any target status', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold', user_id: 'other-user' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('owner targeting a listing they do not own: forbidden', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'sold', user_id: 'someone-else' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'active', userActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('null-role caller: forbidden regardless of target status', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active', user_id: 'other-user' }, error: null })
    const result = await applyListingTransitionByStatus('l1', 'sold', noRoleActor, db)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

})

describe('bypass prevention — no direct DB access from outside gateway', () => {
  it('admin actor cannot bypass via user role check failure', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'active' }, error: null })
    // A "user" role caller gets forbidden regardless of having a valid action
    const result = await applyListingTransition('l1', 'MARK_AS_SOLD', userActor, db)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('forbidden')
  })

  it('null role caller cannot perform any transition', async () => {
    const db = makeMockDb({ data: { id: 'l1', status: 'pending' }, error: null })
    const result = await applyListingTransition('l1', 'APPROVE', noRoleActor, db)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('forbidden')
  })

  it('transition engine rejects invalid action before DB is touched', async () => {
    // If invalid_transition, the update mock would be called with no status change
    // We can verify this by checking the result — db_error would mean DB was reached
    const db = makeMockDb({ data: { id: 'l1', status: 'sold' }, error: null })
    const result = await applyListingTransition('l1', 'APPROVE', adminActor, db)
    // APPROVE is only valid from pending, not sold
    expect(result).toEqual({ ok: false, reason: 'invalid_transition' })
    // If DB were reached, we'd get ok: true or db_error, not invalid_transition
  })
})
