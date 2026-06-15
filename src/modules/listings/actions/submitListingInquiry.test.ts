import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: mockHeadersGet })),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockSendListingInquiryNotification = vi.fn()
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({
  sendListingInquiryNotification: (...args: unknown[]) => mockSendListingInquiryNotification(...args),
}))

// listing_inquiries chain (rate-limit count + insert)
const mockGte = vi.fn()
const mockInsert = vi.fn()
const listingInquiriesChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: mockGte,
  insert: mockInsert,
}

// listings chain (fetch listing)
const mockMaybeSingle = vi.fn()
const listingsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
}

const mockGetUserById = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => (table === 'listings' ? listingsChain : listingInquiriesChain),
    auth: { admin: { getUserById: mockGetUserById } },
  })),
}))

const VALID_LISTING = {
  id: 'listing-1',
  user_id: 'owner-1',
  title: 'Nice apartment',
  status: 'active',
}

const VALID_INPUT = {
  listingId: 'listing-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'I am very interested in this listing, please contact me.',
}

describe('submitListingInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listingInquiriesChain.select.mockReturnThis()
    listingInquiriesChain.eq.mockReturnThis()
    listingsChain.select.mockReturnThis()
    listingsChain.eq.mockReturnThis()

    mockHeadersGet.mockReturnValue(null)
    mockGetUser.mockResolvedValue(null)
    mockGte.mockResolvedValue({ count: 0 })
    mockMaybeSingle.mockResolvedValue({ data: VALID_LISTING, error: null })
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'owner@example.com' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockSendListingInquiryNotification.mockResolvedValue({ ok: true, id: 'email-1' })
  })

  it('returns validation error for a too-short message', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, message: 'too short' })
    expect(result).toEqual({ error: 'validation' })
  })

  it('returns validation error for an invalid email', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, email: 'not-an-email' })
    expect(result).toEqual({ error: 'validation' })
  })

  it('returns rate_limited when the IP has 5+ inquiries in the last hour', async () => {
    mockHeadersGet.mockImplementation((key: string) => (key === 'x-forwarded-for' ? '1.2.3.4' : null))
    mockGte.mockResolvedValue({ count: 5 })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'rate_limited' })
  })

  it('does not rate-limit an unknown IP and stores requester_ip as null', async () => {
    mockHeadersGet.mockReturnValue(null) // no x-forwarded-for / x-real-ip → 'unknown'

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ requester_ip: null }))
  })

  it('returns not_found when the listing does not exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns validation error for a closed (sold) listing', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { ...VALID_LISTING, status: 'sold' }, error: null })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'validation' })
  })

  it('returns validation error for a self-inquiry (viewer is the listing owner)', async () => {
    mockGetUser.mockResolvedValue({ id: 'owner-1' })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'validation' })
  })

  it('returns owner_unavailable when the owner has no resolvable email', async () => {
    mockGetUserById.mockResolvedValue({ data: { user: null } })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'owner_unavailable' })
  })

  it('returns save_failed when the insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'db error' } })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'save_failed' })
  })

  it('returns email_transient (treated as partial success by the UI) when the owner notification email fails (row already persisted)', async () => {
    mockSendListingInquiryNotification.mockResolvedValue({ ok: false, reason: 'unverified_sender' })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'email_transient' })
    expect(mockInsert).toHaveBeenCalled()
  })

  it('happy path: guest submits a valid inquiry for an open listing', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      listing_id: 'listing-1',
      listing_owner_id: 'owner-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'new',
    }))
    expect(mockSendListingInquiryNotification).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.com',
      replyTo: 'jane@example.com',
      listingTitle: 'Nice apartment',
      locale: 'sq',
    }))
  })

  it('happy path: authenticated non-owner viewer submits a valid inquiry', async () => {
    mockGetUser.mockResolvedValue({ id: 'viewer-2' })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({})
  })
})
