/**
 * Task 850 — trackListingContactEvent: the server resolves the listing owner, every insert goes through the
 * service-role client, guests are recorded by ip hash, and repeat clicks inside 30 minutes are de-duplicated.
 *
 * Actor matrix: guest / authenticated non-owner / owner. The DB trigger that re-derives the owner and
 * `is_owner_click` is proven by scripts/task-850-verify.sql (owner-native), not here — these tests assert the
 * action's own behaviour against a mocked admin client.
 *
 * Stubbing seams:
 * - next/headers            headers()           → controls the ip / user-agent
 * - @/lib/auth/server        getUser             → session user (or null for a guest, or a throw)
 * - @/lib/supabase/admin     createAdminClient   → listings SELECT, de-dup SELECT, contact-events INSERT
 *
 * Command: npm.cmd run test -- src/modules/listings/actions/__tests__/contactEvents.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (name: string) => mockHeadersGet(name) })),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockListingMaybeSingle = vi.fn()
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

function setHeaders(values: Record<string, string | null>) {
  mockHeadersGet.mockImplementation((name: string) => values[name] ?? null)
}

beforeEach(() => {
  vi.clearAllMocks()
  setHeaders({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': 'Mozilla/5.0 (test)' })
  mockGetUser.mockResolvedValue(null)
  mockListingMaybeSingle.mockResolvedValue({ data: { id: LISTING_ID, user_id: OWNER_ID }, error: null })
  mockDedupLimit.mockResolvedValue({ data: [], error: null })
  mockInsert.mockResolvedValue({ error: null })
})

describe('trackListingContactEvent', () => {
  it('guest: inserts actor_user_id null, a 24-hex actor_ip_hash and the server-resolved owner', async () => {
    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: true })
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const row = mockInsert.mock.calls[0][0]
    expect(row.actor_user_id).toBeNull()
    expect(row.actor_ip_hash).toMatch(/^[0-9a-f]{24}$/)
    expect(row.listing_id).toBe(LISTING_ID)
    expect(row.listing_owner_id).toBe(OWNER_ID)
    expect(row.is_owner_click).toBe(false)
    expect(row.channel).toBe('whatsapp')
    expect(row.locale).toBe('sq')
    expect(mockDedupEq).toHaveBeenCalledWith('actor_ip_hash', row.actor_ip_hash)
  })

  it('authenticated non-owner: inserts the session user id and no ip hash', async () => {
    mockGetUser.mockResolvedValue({ id: OTHER_USER_ID })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: true })
    const row = mockInsert.mock.calls[0][0]
    expect(row.actor_user_id).toBe(OTHER_USER_ID)
    expect(row.actor_ip_hash).toBeNull()
    expect(row.listing_owner_id).toBe(OWNER_ID)
    expect(row.is_owner_click).toBe(false)
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

  it('guest without any ip header: row written with an empty hash and no de-dup lookup', async () => {
    setHeaders({ 'user-agent': 'Mozilla/5.0 (test)' })

    const result = await trackListingContactEvent({ ...baseArgs })

    expect(result).toEqual({ ok: true })
    expect(mockInsert.mock.calls[0][0].actor_ip_hash).toBe('')
    expect(mockDedupLimit).not.toHaveBeenCalled()
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
