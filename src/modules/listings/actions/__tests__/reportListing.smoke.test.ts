/**
 * Guard 1 smoke tests — reportListingAction server action (Task 436 / Epic RS Slice 1).
 *
 * Covers the critical-flow-registry.md rows:
 *   - "Report listing" — happy path + failure paths
 *
 * Key assertion: the save_failed path calls console.error with the root cause.
 * This verifies Guard 4 (actionable-error-toast rule): failure is diagnosable,
 * not a silent black hole.
 *
 * Planted-violation proof: stub the insert to throw instead of returning
 * { error: dbError } — the save_failed branch is bypassed → test FAILS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

// listing_reports chain — supports .select().eq().eq().maybeSingle() + .insert()
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn()
const reportChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  insert: mockInsert,
}
// Spy on the table name passed to from() — asserted in happy-path test (Task 448 item C).
const mockFrom = vi.fn(() => reportChain)

const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// admin client only needed by updateReportStatusAction (not tested here)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }),
    auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: null } }) } },
  })),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockGetBlockedError = vi.fn()
vi.mock('@/lib/auth/blockCheck', () => ({
  getBlockedError: (...args: unknown[]) => mockGetBlockedError(...args),
}))

vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: vi.fn().mockResolvedValue(false),
  assertPermission: vi.fn(),
  roleHasPermission: vi.fn().mockReturnValue(false),
}))

// Notification side-effects — not under test here; just prevent import errors
vi.mock('@/modules/notifications/lib/emails/send', () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}))
vi.mock('@/modules/notifications/lib/emails/ReporterNotificationEmail', () => ({
  ReporterNotificationEmail: vi.fn(),
  getReporterNotificationEmailStrings: vi.fn().mockReturnValue({ subject: '', heading: '', body: '' }),
}))
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))

// ── Default fixtures ──────────────────────────────────────────────────────────

const AUTH_USER = { id: 'reporter-user-1' } as const
const LISTING_ID = 'listing-abc-123'
const VALID_REASON = 'spam'
const VALID_COMMENT = 'This is a duplicate listing'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('reportListingAction — smoke tests (Guard 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    reportChain.select.mockReturnThis()
    reportChain.eq.mockReturnThis()
    mockGetUser.mockResolvedValue(AUTH_USER)
    mockGetBlockedError.mockResolvedValue(null)       // not blocked
    mockMaybeSingle.mockResolvedValue({ data: null }) // no existing report
    mockInsert.mockResolvedValue({ error: null })     // insert succeeds
    mockCreateClient.mockResolvedValue({ from: mockFrom })
  })

  it('happy path: submits a valid report and returns {}', async () => {
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({})
    // Task 448 item C: pin the table name so renaming it would cause this test to fail.
    expect(mockFrom).toHaveBeenCalledWith('listing_reports')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      listing_id: LISTING_ID,
      user_id: AUTH_USER.id,
      reason: VALID_REASON,
      status: 'pending',
    }))
  })

  it('unauthorized: returns { error: "unauthorized" } when no session', async () => {
    mockGetUser.mockResolvedValue(null)
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('blocked: returns the block error key when the user is blocked', async () => {
    mockGetBlockedError.mockResolvedValue('account_blocked')
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({ error: 'account_blocked' })
  })

  it('invalid reason: returns { error: "invalid_reason" } for an unknown reason', async () => {
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, 'not_a_valid_reason', VALID_COMMENT)
    expect(result).toEqual({ error: 'invalid_reason' })
  })

  it('already reported: returns { error: "already_reported" } for a duplicate', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-report-id' } })
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({ error: 'already_reported' })
  })

  it('save failed: returns { error: "save_failed" } and logs the root cause (Guard 4)', async () => {
    const dbError = { message: 'new row violates row-level security policy', code: '42501' }
    mockInsert.mockResolvedValue({ error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)

    expect(result).toEqual({ error: 'save_failed' })
    // Guard 4 (actionable-error rule): the server MUST log the root cause.
    // Without this, RLS failures and DB errors are indistinguishable from generic "save_failed".
    // This is the exact gap that made Task 435 (RLS break after Task 270) slow to diagnose.
    expect(consoleSpy).toHaveBeenCalledWith(
      '[reportListing] insert failed',
      expect.objectContaining({ message: dbError.message }),
    )
    consoleSpy.mockRestore()
  })
})
