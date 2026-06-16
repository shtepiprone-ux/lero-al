/**
 * Guard smoke — submitListingInquiry server action (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Inquiry / send message":
 *   Happy: valid input, IP=unknown (never rate-limited) → insert + email → {}
 *   Failures: validation (short message / bad email), rate_limited, not_found,
 *             save_failed (+ console.error diagnosable), email_transient (partial-success).
 *
 * Key invariant: DB row is inserted with status:'new'; email is fired only after insert.
 * A partial success (insert ok, email fails) surfaces 'email_transient' — not swallowed.
 *
 * ## Stubbing seams
 * - next/headers  headers()  → returns mockHeaders (controls IP, rate-limit path)
 * - @/lib/supabase/admin createAdminClient — DB: rate-limit SELECT + listing SELECT + inquiry INSERT
 * - @/lib/auth/server getUser — self-inquiry guard
 * - @/modules/notifications/lib/emails/listingInquiry sendListingInquiryNotification
 *
 * NOTE: @/modules/listings/domain isListingClosed is a pure function — NOT mocked.
 *       Test data uses status:'active' (isListingClosed → false) for happy path.
 *
 * Planted-violation proof (see session log for transcript):
 *   Return `{}` instead of `{ error: 'rate_limited' }` in isRateLimited branch →
 *   rate_limited assertion FAILS. Revert → PASS.
 *   Separately: remove `console.error('[listing-inquiry] insert failed', ...)` →
 *   save_failed diagnosable assertion FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/submitListingInquiry.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

// next/headers — controls IP resolution
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockHeadersGet(...args),
  }),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockSendNotification = vi.fn()
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({
  sendListingInquiryNotification: (...args: unknown[]) => mockSendNotification(...args),
}))

// DB chains — rate-limit (listing_inquiries SELECT) + main body (listing_inquiries INSERT)
const mockRateLimitGte    = vi.fn()
const mockInquiryInsert   = vi.fn()

// DB chain — listings SELECT
const mockListingMaybeSingle = vi.fn()

// DB chain — auth.admin.getUserById
const mockGetUserById     = vi.fn()

const mockAdminDb = {
  from: vi.fn((table: string) => {
    if (table === 'listing_inquiries') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ gte: mockRateLimitGte }),
        }),
        insert: mockInquiryInsert,
      }
    }
    if (table === 'listings') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockListingMaybeSingle }),
        }),
      }
    }
    return {}
  }),
  auth: {
    admin: {
      getUserById: (...args: unknown[]) => mockGetUserById(...args),
    },
  },
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminDb),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const LISTING_ID  = 'listing-inquiry-1'
const OWNER_ID    = 'owner-user-1'
const OWNER_EMAIL = 'owner@example.al'

const VALID_LISTING = {
  id: LISTING_ID, user_id: OWNER_ID, title: 'Apartament Tiranë', status: 'active',
}

const VALID_INPUT = {
  listingId: LISTING_ID,
  name: 'Arben Hoxha',
  email: 'arben@example.al',
  message: 'Jam i interesuar për këtë apartament. Mund të takoj pronar?',
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // IP='unknown' → isRateLimited immediately returns false (no rate-limit DB query)
  mockHeadersGet.mockReturnValue(null)

  mockGetUser.mockResolvedValue(null) // viewer not logged in = not self-inquiry

  // Rate-limit check chain (only called when IP !== 'unknown')
  mockRateLimitGte.mockResolvedValue({ count: 0 })

  // Listing lookup
  mockListingMaybeSingle.mockResolvedValue({ data: VALID_LISTING, error: null })

  // Owner email lookup
  mockGetUserById.mockResolvedValue({ data: { user: { email: OWNER_EMAIL } } })

  // Inquiry insert
  mockInquiryInsert.mockResolvedValue({ error: null })

  // Notification
  mockSendNotification.mockResolvedValue({ ok: true })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('submitListingInquiry — smoke tests (Task 442)', () => {
  it('happy path: valid input, IP=unknown → insert + notification → {}', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})

    // Row must be inserted with status:'new' — the partial-success model depends on this ordering.
    expect(mockInquiryInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'new', listing_id: LISTING_ID }),
    )

    // Email fired exactly once, after insert
    expect(mockSendNotification).toHaveBeenCalledOnce()
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ to: OWNER_EMAIL, listingTitle: VALID_LISTING.title }),
    )
  })

  it('validation: message too short → { error: "validation" }, no DB touched', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, message: 'Too short.' })

    expect(result).toEqual({ error: 'validation' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockSendNotification).not.toHaveBeenCalled()
  })

  it('validation: bad email format → { error: "validation" }', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, email: 'not-an-email' })

    expect(result).toEqual({ error: 'validation' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
  })

  it('rate_limited: 5th+ request from real IP → { error: "rate_limited" }', async () => {
    // Provide a real IP so isRateLimited actually runs the DB count query
    mockHeadersGet.mockImplementation((header: string) =>
      header === 'x-forwarded-for' ? '192.168.1.100' : null,
    )
    // 5 requests already in window → at limit
    mockRateLimitGte.mockResolvedValue({ count: 5 })

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'rate_limited' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
  })

  it('not_found: listing query returns null → { error: "not_found" }', async () => {
    mockListingMaybeSingle.mockResolvedValue({ data: null, error: null })

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'not_found' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
  })

  it('save_failed: insert fails → { error: "save_failed" } + console.error with root cause (Guard 4)', async () => {
    const dbError = { message: 'foreign key violation on listing_inquiries' }
    mockInquiryInsert.mockResolvedValue({ error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    // Guard 4: DB failure must surface as typed error, not swallowed.
    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith('[listing-inquiry] insert failed', dbError)

    // No email attempted after a failed insert (row not in DB yet)
    expect(mockSendNotification).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('email_transient: insert ok, email fails → { error: "email_transient" } + console.error (partial-success)', async () => {
    mockSendNotification.mockResolvedValue({ ok: false, reason: 'resend_error' })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    // Partial-success: row was written (insert was called), email failed → typed transient error.
    expect(result).toEqual({ error: 'email_transient' })
    expect(mockInquiryInsert).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[listing-inquiry] email notification failed',
      expect.objectContaining({ reason: 'resend_error' }),
    )
    consoleSpy.mockRestore()
  })
})
