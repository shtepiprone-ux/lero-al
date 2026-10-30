import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: mockHeadersGet })),
}))

// The viewer: since 2026-10-17 only a signed-in, active person reaches the owner (a guest has no access to the contact card). The real session check is
// `requireViewer`, proven in contactSession.security.test.ts; here it is a boundary double driven by `mockGetUser` (null = guest, a throw = lookup failure).
const mockGetUser = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: async () => {
    let user: { id: string } | null
    try { user = await mockGetUser() } catch { return { ok: false, reason: 'lookup_failed' } }
    return user ? { ok: true, userId: user.id } : { ok: false, reason: 'unauthenticated' }
  },
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
  is: vi.fn().mockReturnThis(),
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
/** the owner's own row, read by the live-owner check (Task 923 R66 (f)); null = no row */
const ownerRow: { current: Record<string, unknown> | null } = { current: { status: 'active', suspended_until: null, deleted_at: null } }
const usersChain = { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: ownerRow.current, error: null }) }) }) }
/** Auth: the viewer's own account has the e-mail the inquiry must carry; the owner has another one (Task 923 R70 (c)) */
const authUsers: Record<string, string | null> = { 'viewer-1': 'jane@example.com', 'owner-1': 'owner@example.com' }
const answerGetUserById = async (id: string) => ({ data: { user: authUsers[id] ? { email: authUsers[id] } : null }, error: null })

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => (table === 'listings' ? listingsChain : table === 'users' ? usersChain : listingInquiriesChain),
    auth: { admin: { getUserById: mockGetUserById } },
  })),
}))

const LISTING_ID = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b'
const VALID_LISTING = {
  id: LISTING_ID,
  user_id: 'owner-1',
  title: 'Nice apartment',
  status: 'active',
}

const VALID_INPUT = {
  listingId: LISTING_ID,
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'I am very interested in this listing, please contact me.',
  // no unit runner sets a Turnstile secret, so the development token is the verified human (Task 923 R112)
  captchaToken: 'dev-noop-token',
}

describe('submitListingInquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listingInquiriesChain.select.mockReturnThis()
    listingInquiriesChain.eq.mockReturnThis()
    listingInquiriesChain.is.mockReturnThis()
    listingsChain.select.mockReturnThis()
    listingsChain.eq.mockReturnThis()

    ownerRow.current = { status: 'active', suspended_until: null, deleted_at: null }
    mockHeadersGet.mockReturnValue(null)
    mockGetUser.mockResolvedValue({ id: 'viewer-1' })
    mockGte.mockResolvedValue({ count: 0, error: null })
    mockMaybeSingle.mockResolvedValue({ data: VALID_LISTING, error: null })
    mockGetUserById.mockImplementation(answerGetUserById)
    mockInsert.mockResolvedValue({ error: null })
    mockSendListingInquiryNotification.mockResolvedValue({ ok: true, id: 'email-1' })
  })

  it('returns validation error for a too-short message', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry({ ...VALID_INPUT, message: 'too short' })
    expect(result).toEqual({ error: 'validation' })
  })

  it('returns validation error when the typed email is missing; what is typed in it is otherwise not used (the sender is the account, R70 (c))', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    expect(await submitListingInquiry({ ...VALID_INPUT, email: '   ' })).toEqual({ error: 'validation' })
    expect(await submitListingInquiry({ ...VALID_INPUT, email: 'not-an-email' })).toEqual({})
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'jane@example.com' }))
  })

  it('returns rate_limited when the IP has 5+ inquiries in the last hour', async () => {
    mockHeadersGet.mockImplementation((key: string) => (key === 'x-forwarded-for' ? '1.2.3.4' : null))
    mockGte.mockResolvedValue({ count: 5, error: null })

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    expect(result).toEqual({ error: 'rate_limited' })
  })

  it('an unknown IP is one shared bucket with the same limit, and requester_ip is stored as null (Task 923 R70 (c))', async () => {
    mockHeadersGet.mockReturnValue(null) // no x-forwarded-for / x-real-ip → 'unknown'

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})
    expect(listingInquiriesChain.is).toHaveBeenCalledWith('requester_ip', null)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ requester_ip: null }))

    mockGte.mockResolvedValue({ count: 5, error: null })
    expect(await submitListingInquiry(VALID_INPUT)).toEqual({ error: 'rate_limited' })
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
    authUsers['owner-1'] = null

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)
    authUsers['owner-1'] = 'owner@example.com'
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

  it('happy path: a signed-in viewer submits a valid inquiry for an open listing', async () => {
    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({})
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      listing_id: LISTING_ID,
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

  it('a guest is refused as unauthenticated: nothing is read about the listing, inserted, e-mailed', async () => {
    mockGetUser.mockResolvedValue(null)

    const { submitListingInquiry } = await import('./submitListingInquiry')
    const result = await submitListingInquiry(VALID_INPUT)

    expect(result).toEqual({ error: 'unauthenticated' })
    expect(mockMaybeSingle).not.toHaveBeenCalled()
    expect(mockGte).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockSendListingInquiryNotification).not.toHaveBeenCalled()
  })

  it('a failing session lookup is a retryable failure, not a pass and not a sign-in prompt', async () => {
    mockGetUser.mockRejectedValue(new Error('auth down'))

    const { submitListingInquiry } = await import('./submitListingInquiry')
    expect(await submitListingInquiry(VALID_INPUT)).toEqual({ error: 'save_failed' })
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
