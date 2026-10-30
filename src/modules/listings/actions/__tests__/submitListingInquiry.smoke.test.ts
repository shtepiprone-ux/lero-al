/**
 * Guard smoke — submitListingInquiry server action (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Inquiry / send message":
 *   Happy: valid input, IP=unknown (one shared bucket since Task 923 R70 (c)) → insert + email → {}
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

// The viewer: since 2026-10-17 only a signed-in, active person reaches the owner (a guest has no access to the contact card). The real session check is
// `requireViewer`, proven in ../contactSession.security.test.ts; here it is a boundary double driven by `mockGetUser` (null = guest, a throw = lookup failure).
const mockGetUser = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: async () => {
    let user: { id: string } | null
    try { user = await mockGetUser() } catch { return { ok: false, reason: 'lookup_failed' } }
    return user ? { ok: true, userId: user.id } : { ok: false, reason: 'unauthenticated' }
  },
}))

const mockSendNotification = vi.fn()
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({
  sendListingInquiryNotification: (...args: unknown[]) => mockSendNotification(...args),
}))

const mockCreateNotification = vi.fn()
vi.mock('@/modules/notifications/lib/createNotification', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
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
        // rate-limit counts: per IP (`eq`, or `is null` for an unknown IP) and per person (`eq` on the e-mail), both ending in `gte`
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ gte: mockRateLimitGte }),
          is: vi.fn().mockReturnValue({ gte: mockRateLimitGte }),
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
    // the owner's own row for the live-owner check (Task 923 R66 (f))
    if (table === 'users') {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'active', suspended_until: null, deleted_at: null }, error: null }) }) }) }
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

const LISTING_ID  = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b'
const OWNER_ID    = 'owner-user-1'
const OWNER_EMAIL = 'owner@example.al'
const VIEWER_ID = 'viewer-1'

const VALID_LISTING = {
  id: LISTING_ID, user_id: OWNER_ID, title: 'Apartament Tiranë', status: 'active', slug: 'apartament-tirane',
}

/** Auth e-mails by account: the inquiry carries the viewer's own (Task 923 R70 (c)), the owner's receives it */
const authEmails: Record<string, string | null> = { [VIEWER_ID]: 'arben@example.al', [OWNER_ID]: OWNER_EMAIL }

const VALID_INPUT = {
  listingId: LISTING_ID,
  name: 'Arben Hoxha',
  email: 'arben@example.al',
  message: 'Jam i interesuar për këtë apartament. Mund të takoj pronar?',
  // no unit runner sets a Turnstile secret, so the development token is the verified human (Task 923 R112)
  captchaToken: 'dev-noop-token',
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // IP='unknown' → counted in the shared "no address" bucket (requester_ip is null)
  mockHeadersGet.mockReturnValue(null)

  mockGetUser.mockResolvedValue({ id: VIEWER_ID }) // a signed-in viewer who is not the owner = not self-inquiry

  authEmails[VIEWER_ID] = 'arben@example.al'
  authEmails[OWNER_ID] = OWNER_EMAIL

  // Rate-limit count chain (per IP bucket and per person)
  mockRateLimitGte.mockResolvedValue({ count: 0, error: null })

  // Listing lookup
  mockListingMaybeSingle.mockResolvedValue({ data: VALID_LISTING, error: null })

  // Auth e-mail lookups: the sender (the viewer) and the owner
  mockGetUserById.mockImplementation(async (id: string) => ({ data: { user: authEmails[id] ? { email: authEmails[id] } : null }, error: null }))

  // Inquiry insert
  mockInquiryInsert.mockResolvedValue({ error: null })

  // Email
  mockSendNotification.mockResolvedValue({ ok: true })

  // In-app notification (Task 880 R3)
  mockCreateNotification.mockResolvedValue(undefined)
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

    // Task 880 R3: exactly one in-app notification, 'listing_inquiry' template, listingName only
    expect(mockCreateNotification).toHaveBeenCalledOnce()
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: OWNER_ID,
      type: 'new_message',
      templateId: 'listing_inquiry',
      templateParams: { listingName: VALID_LISTING.title },
      link: `/listings/${VALID_LISTING.slug}`,
    }))
  })

  it('validation: message too short → { error: "validation" }, no DB touched', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, message: 'Too short.' })

    expect(result).toEqual({ error: 'validation' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockSendNotification).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('validation: no typed email → { error: "validation" }; a typed address is never used, the Auth e-mail of the account is (R70 (c))', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, email: '  ' })

    expect(result).toEqual({ error: 'validation' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()

    expect(await submitListingInquiry({ ...VALID_INPUT, email: 'someone.else@example.org' })).toEqual({})
    expect(mockInquiryInsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'arben@example.al' }))
    expect(mockSendNotification).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'arben@example.al', email: 'arben@example.al' }))
  })

  it('rate_limited: 5th+ request from real IP → { error: "rate_limited" }', async () => {
    // Provide a real IP so isRateLimited actually runs the DB count query
    mockHeadersGet.mockImplementation((header: string) =>
      header === 'x-forwarded-for' ? '192.168.1.100' : null,
    )
    // 5 requests already in window → at limit
    mockRateLimitGte.mockResolvedValue({ count: 5, error: null })

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'rate_limited' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('not_found: listing query returns null → { error: "not_found" }', async () => {
    mockListingMaybeSingle.mockResolvedValue({ data: null, error: null })

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'not_found' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('self-inquiry: viewer is the listing owner → { error: "validation" }, no notification', async () => {
    mockGetUser.mockResolvedValue({ id: OWNER_ID })

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'validation' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('owner_unavailable: owner email cannot be resolved → { error: "owner_unavailable" }, no notification', async () => {
    authEmails[OWNER_ID] = null

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'owner_unavailable' })
    expect(mockInquiryInsert).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
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

    // No email/notification attempted after a failed insert (row not in DB yet)
    expect(mockSendNotification).not.toHaveBeenCalled()
    expect(mockCreateNotification).not.toHaveBeenCalled()
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

    // Task 880 R3: exactly one 'listing_inquiry_email_failed' notification, sender contacts included
    expect(mockCreateNotification).toHaveBeenCalledOnce()
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: OWNER_ID,
      type: 'new_message',
      templateId: 'listing_inquiry_email_failed',
      templateParams: {
        listingName: VALID_LISTING.title,
        senderName: VALID_INPUT.name,
        senderEmail: VALID_INPUT.email,
      },
    }))
    consoleSpy.mockRestore()
  })

  it('email_transient: sendListingInquiryNotification THROWS → caught, same email_failed notification, { error: "email_transient" }', async () => {
    mockSendNotification.mockRejectedValue(new Error('resend network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'email_transient' })
    expect(mockCreateNotification).toHaveBeenCalledOnce()
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      templateId: 'listing_inquiry_email_failed',
    }))
    consoleSpy.mockRestore()
  })

  it('never calls createNotification twice for one inquiry (either branch, exactly once)', async () => {
    const { submitListingInquiry } = await import('../submitListingInquiry')
    await submitListingInquiry(VALID_INPUT)
    expect(mockCreateNotification).toHaveBeenCalledTimes(1)
  })

  it('createNotification rejects → the action result is still unaffected ({})', async () => {
    mockCreateNotification.mockRejectedValue(new Error('insert failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { submitListingInquiry } = await import('../submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})
    consoleSpy.mockRestore()
  })
})
