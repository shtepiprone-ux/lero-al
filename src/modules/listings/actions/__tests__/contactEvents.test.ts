/**
 * Task 850 — trackListingContactEvent: the server resolves the listing owner, every insert goes through the
 * service-role client, and repeat clicks inside 30 minutes are de-duplicated.
 *
 * Owner correction 2026-10-17: a guest has no access to the owner's contact card, so only a signed-in, active person
 * can produce this event (the guest fingerprint path was removed). The real session check is `requireViewer`, proven in
 * ../contactSession.security.test.ts; here it is a boundary double driven by `mockGetUser` so these tests keep checking
 * the action's own behaviour: the owner resolved on the server, the de-duplication, the insert and its failures.
 *
 * Actor matrix: authenticated non-owner / owner (a guest is refused, see the first test).
 * The DB trigger that re-derives the owner and `is_owner_click` is proven by scripts/task-850-verify.sql (owner-native),
 * not here — these tests assert the action's own behaviour against a mocked admin client.
 *
 * Stubbing seams:
 * - @/lib/auth/requireViewer requireViewer      → the viewer for `mockGetUser` (null = guest, a throw = lookup failure)
 * - @/lib/supabase/admin     createAdminClient   → listings SELECT, de-dup SELECT, contact-events INSERT
 *
 * Command: npm.cmd run test -- src/modules/listings/actions/__tests__/contactEvents.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  // boundary double of the session check (the real one is tested in contactSession.security.test.ts)
  requireViewer: async () => {
    let user: { id: string } | null
    try { user = await mockGetUser() } catch { return { ok: false, reason: 'lookup_failed' } }
    return user ? { ok: true, userId: user.id } : { ok: false, reason: 'unauthenticated' }
  },
}))

const mockListingMaybeSingle = vi.fn()
// the owner's own row (Task 923 R66 (f): a contact event is recorded only for the listing of a LIVE owner); null = no row
const ownerRow = { current: { status: 'active', suspended_until: null, deleted_at: null } as Record<string, unknown> | null }
const mockDedupLimit = vi.fn()
const mockInsert = vi.fn()
const mockDedupEq = vi.fn()

function chain(terminal: Record<string, unknown>, eqSpy?: (col: string, val: unknown) => void) {
  const c: Record<string, unknown> = {}
  c.select = vi.fn(() => c)
  c.eq = vi.fn((col: string, val: unknown) => { eqSpy?.(col, val); return c })
  c.in = vi.fn(() => c)
  c.gte = vi.fn(() => c)
  Object.assign(c, terminal)
  return c
}

const mockAdminDb = {
  from: vi.fn((table: string) => {
    if (table === 'listings') return chain({ maybeSingle: mockListingMaybeSingle })
    if (table === 'users') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: ownerRow.current, error: null }) }) }) }
    if (table === 'listing_contact_events') {
      return {
        ...chain({ limit: mockDedupLimit }, (col, val) => mockDedupEq(col, val)),
        insert: mockInsert,
      }
    }
    throw new Error(`unexpected table ${table}`)
  }),
}
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminDb,
}))

import { trackListingContactEvent } from '../contactEvents'

const LISTING_ID = '11111111-1111-4111-8111-111111111111'
const OWNER_ID = '22222222-2222-4222-8222-222222222222'
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333'

const baseArgs = {
  listingId: LISTING_ID,
  channel: 'whatsapp',
  source: 'listing_detail_contact_card',
  locale: 'sq',
} as const

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: OTHER_USER_ID })
  mockListingMaybeSingle.mockResolvedValue({ data: { id: LISTING_ID, user_id: OWNER_ID }, error: null })
  mockDedupLimit.mockResolvedValue({ data: [], error: null })
  mockInsert.mockResolvedValue({ error: null })
  ownerRow.current = { status: 'active', suspended_until: null, deleted_at: null }
})

describe('trackListingContactEvent', () => {
  it('guest: refused as unauthenticated before the listing is read, and nothing is inserted (owner correction 2026-10-17)', async () => {
    mockGetUser.mockResolvedValue(null)

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: false, reason: 'unauthenticated' })
    expect(mockAdminDb.from).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('authenticated non-owner: inserts the session user id, the server-resolved owner and no ip hash', async () => {
    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: true })
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const row = mockInsert.mock.calls[0][0]
    expect(row.actor_user_id).toBe(OTHER_USER_ID)
    expect(row.actor_ip_hash).toBeNull()
    expect(row.listing_id).toBe(LISTING_ID)
    expect(row.listing_owner_id).toBe(OWNER_ID)
    expect(row.is_owner_click).toBe(false)
    expect(row.channel).toBe('whatsapp')
    expect(row.locale).toBe('sq')
    expect(mockDedupEq).toHaveBeenCalledWith('actor_user_id', OTHER_USER_ID)
  })

  it('owner: writes the row with is_owner_click true, then reports self_click', async () => {
    mockGetUser.mockResolvedValue({ id: OWNER_ID })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsert.mock.calls[0][0].is_owner_click).toBe(true)
    expect(mockInsert.mock.calls[0][0].actor_user_id).toBe(OWNER_ID)
    expect(result).toEqual({ ok: false, reason: 'self_click' })
  })

  it('unknown or non-public listing: not_found and zero inserts', async () => {
    mockListingMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('recent duplicate for the same listing and actor: deduplicated and zero inserts', async () => {
    mockGetUser.mockResolvedValue({ id: OTHER_USER_ID })
    mockDedupLimit.mockResolvedValue({ data: [{ id: 'existing' }], error: null })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: false, reason: 'deduplicated' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('insert error: insert_failed, logged with the error code, never a success', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockInsert.mockResolvedValue({ error: { code: '23503', message: 'fk violation' } })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: false, reason: 'insert_failed' })
    expect(spy).toHaveBeenCalledWith('[contactEvents] insert failed', { code: '23503', listingId: LISTING_ID })
    spy.mockRestore()
  })

  it('session read failure: session_error and zero inserts', async () => {
    mockGetUser.mockRejectedValue(new Error('auth down'))

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: false, reason: 'session_error' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('a caller-supplied owner id cannot reach the insert', async () => {
    await trackListingContactEvent({
      ...baseArgs,
      // @ts-expect-error — the args type has no listingOwnerId field (Task 850): the owner is resolved server-side
      listingOwnerId: 'attacker-chosen-owner',
    })

    expect(mockInsert.mock.calls[0][0].listing_owner_id).toBe(OWNER_ID)
  })
})
