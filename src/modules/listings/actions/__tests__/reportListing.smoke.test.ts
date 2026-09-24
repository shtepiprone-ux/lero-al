/**
 * Guard 1 smoke tests — reportListingAction + updateReportStatusAction server actions
 * (Task 436 / Epic RS Slice 1; extended Task 880 R4-R6).
 *
 * Covers the critical-flow-registry.md rows:
 *   - "Report listing" — happy path + failure paths + owner notification (Task 880 R4)
 *   - updateReportStatusAction resolved/dismissed → reporter + listing-owner notifications (R5),
 *     both awaited before the action returns (R6)
 *
 * Key assertion: the save_failed path calls console.error with the root cause.
 * This verifies Guard 4 (actionable-error-toast rule): failure is diagnosable,
 * not a silent black hole.
 *
 * Planted-violation proof (see session log for transcript):
 *   Return `{}` instead of `{ error: 'save_failed' }` in the insert-error branch →
 *   save_failed assertion FAILS. Revert → PASS.
 *   Task 880: drop the R4 owner notification call → report-filed test FAILS;
 *   make notifyReporter un-awaited again → the ordering test FAILS. Both reverted → PASS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

// listing_reports chain (user-scoped client, via createClient) — supports
// .select().eq().eq().maybeSingle() + .insert()
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

// admin (service-role) client — used by reportListingAction (R4 owner lookup on `listings`)
// and updateReportStatusAction (permission read on `users`, CAS/audit on `listing_reports`,
// and the R5 combined reporter+owner lookup via `listing_reports` embedding `listings`).
const mockListingsSingle = vi.fn()
const mockReportsReadSingle = vi.fn()
const mockUsersSingle = vi.fn()
const mockReportActionsInsert = vi.fn()
const mockReportsUpdate = vi.fn()
const mockReportsUpdateSelect = vi.fn()
const mockGetUserById = vi.fn()

const adminReportsUpdateChain = {
  eq: vi.fn().mockReturnThis(),
  select: mockReportsUpdateSelect,
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'listings') {
        return { select: () => ({ eq: () => ({ single: mockListingsSingle }) }) }
      }
      if (table === 'listing_reports') {
        return {
          select: () => ({ eq: () => ({ single: mockReportsReadSingle }) }),
          update: (data: unknown) => { mockReportsUpdate(data); return adminReportsUpdateChain },
        }
      }
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ single: mockUsersSingle }) }) }
      }
      if (table === 'report_actions') {
        return { insert: mockReportActionsInsert }
      }
      return {}
    },
    auth: { admin: { getUserById: (...args: unknown[]) => mockGetUserById(...args) } },
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

const mockHasPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: (key: string) => mockHasPermission(key),
  assertPermission: vi.fn(),
  roleHasPermission: vi.fn().mockReturnValue(false),
}))

const mockSendEmail = vi.fn()
vi.mock('@/modules/notifications/lib/emails/send', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))
vi.mock('@/modules/notifications/lib/emails/ReporterNotificationEmail', () => ({
  ReporterNotificationEmail: vi.fn(),
  getReporterNotificationEmailStrings: vi.fn().mockReturnValue({ subject: 'subj', heading: 'head', body: 'body text' }),
}))

const mockCreateNotification = vi.fn()
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

function setupPermission(mapping: Record<string, boolean>) {
  mockHasPermission.mockImplementation((key: string) => Promise.resolve(mapping[key] ?? false))
}

// Drains pending microtasks across the multi-await chain inside updateReportStatusAction
// (permission check, profile read, status read, CAS update, audit insert, R5 combined read)
// before either deferred notification promise is allowed to settle.
async function flushMicrotasks(rounds = 20) {
  for (let i = 0; i < rounds; i++) await Promise.resolve()
}

// ── Default fixtures ──────────────────────────────────────────────────────────

const AUTH_USER = { id: 'reporter-user-1' } as const
const LISTING_ID = 'listing-abc-123'
const VALID_REASON = 'spam'
const VALID_COMMENT = 'This is a duplicate listing'

const VALID_LISTING_ROW = { user_id: 'owner-user-1', title: 'Apartament Tiranë', slug: 'apartament-tirane' }

// ── Tests: reportListingAction ─────────────────────────────────────────────────

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
    mockListingsSingle.mockResolvedValue({ data: VALID_LISTING_ROW, error: null })
    mockCreateNotification.mockResolvedValue(undefined)
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
    expect(mockCreateNotification).not.toHaveBeenCalled()
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
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('already reported: returns { error: "already_reported" } for a duplicate', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-report-id' } })
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({ error: 'already_reported' })
    expect(mockCreateNotification).not.toHaveBeenCalled()
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
    expect(mockCreateNotification).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  // ── Task 880 R4: owner notification on report filed ──────────────────────────

  it('report filed: owner notified — listing name + link only, no reporter identity or reason anywhere in the row', async () => {
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)

    expect(result).toEqual({})
    expect(mockCreateNotification).toHaveBeenCalledOnce()
    const payload = mockCreateNotification.mock.calls[0][0] as Record<string, unknown>
    expect(payload).toEqual(expect.objectContaining({
      userId: VALID_LISTING_ROW.user_id,
      type: 'report_outcome',
      templateId: 'listing_report_filed',
      templateParams: { listingName: VALID_LISTING_ROW.title },
      link: `/listings/${VALID_LISTING_ROW.slug}`,
    }))
    const serialized = JSON.stringify(payload)
    expect(serialized).not.toContain(AUTH_USER.id)
    expect(serialized.toLowerCase()).not.toContain(VALID_REASON)
    expect(serialized.toLowerCase()).not.toContain(VALID_COMMENT.toLowerCase())
  })

  it('owner reports their own listing → no owner notification (self-report)', async () => {
    mockListingsSingle.mockResolvedValue({ data: { ...VALID_LISTING_ROW, user_id: AUTH_USER.id }, error: null })
    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)
    expect(result).toEqual({})
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('listing lookup fails after report insert → no call, console.error, result still {}', async () => {
    const lookupError = { message: 'listing not found', code: 'PGRST116' }
    mockListingsSingle.mockResolvedValue({ data: null, error: lookupError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { reportListingAction } = await import('../reportListing')
    const result = await reportListingAction(LISTING_ID, VALID_REASON, VALID_COMMENT)

    expect(result).toEqual({})
    expect(mockCreateNotification).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('[reportListing] listing lookup failed', lookupError)
    consoleSpy.mockRestore()
  })
})

// ── Tests: updateReportStatusAction — reporter + owner outcome notifications ───

describe('updateReportStatusAction — outcome notifications (Task 880 R5/R6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ id: 'moderator-1' })
    setupPermission({ 'reports.manage': true })
    mockUsersSingle.mockResolvedValue({ data: { role: 'moderator' } })
    // Default old status 'reviewed' — reviewed→{resolved,dismissed} is manager-allowlisted;
    // the SAME row also carries the R5 combined reporter+owner fields (the mock returns one
    // object regardless of the requested column list, matching every listing_reports select).
    mockReportsReadSingle.mockResolvedValue({
      data: {
        status: 'reviewed',
        user_id: 'reporter-1',
        listings: { user_id: 'owner-1', title: 'Listing X', slug: 'listing-x' },
      },
    })
    adminReportsUpdateChain.eq.mockReturnThis()
    mockReportsUpdateSelect.mockResolvedValue({ data: [{ id: 'r-1' }], error: null })
    mockReportActionsInsert.mockResolvedValue({ error: null })
    mockCreateNotification.mockResolvedValue(undefined)
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'reporter@example.al' } } })
    mockSendEmail.mockResolvedValue({ ok: true })
  })

  it('resolved: reporter AND listing owner both notified with the correct template ids', async () => {
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')

    expect(result).toEqual({})
    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'reporter-1',
      type: 'report_outcome',
      templateId: 'report_resolved',
    }))
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'owner-1',
      type: 'report_outcome',
      templateId: 'listing_report_resolved_owner',
      templateParams: { listingName: 'Listing X' },
      link: '/listings/listing-x',
    }))
  })

  it('dismissed: reporter AND listing owner both notified with the correct template ids', async () => {
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'dismissed', '')

    expect(result).toEqual({})
    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'reporter-1',
      templateId: 'report_dismissed',
    }))
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'owner-1',
      templateId: 'listing_report_dismissed_owner',
      templateParams: { listingName: 'Listing X' },
    }))
  })

  it('owner equals reporter → only the reporter notification is sent', async () => {
    mockReportsReadSingle.mockResolvedValue({
      data: {
        status: 'reviewed',
        user_id: 'same-user',
        listings: { user_id: 'same-user', title: 'Listing X', slug: 'listing-x' },
      },
    })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')

    expect(result).toEqual({})
    expect(mockCreateNotification).toHaveBeenCalledOnce()
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'same-user',
      templateId: 'report_resolved',
    }))
  })

  it('reviewed (non-terminal) transition → no notification call', async () => {
    mockReportsReadSingle.mockResolvedValue({
      data: {
        status: 'pending',
        user_id: 'reporter-1',
        listings: { user_id: 'owner-1', title: 'Listing X', slug: 'listing-x' },
      },
    })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({})
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  it('reopen (resolved→pending) → no notification call', async () => {
    setupPermission({ 'reports.status_override': true })
    mockReportsReadSingle.mockResolvedValue({
      data: {
        status: 'resolved',
        user_id: 'reporter-1',
        listings: { user_id: 'owner-1', title: 'Listing X', slug: 'listing-x' },
      },
    })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'pending', '')
    expect(result).toEqual({})
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  // R6: the action's promise must not resolve before BOTH notification promises resolve.
  it('ordering: the action does not resolve before both the reporter and owner notification promises resolve', async () => {
    const order: string[] = []
    let resolveReporterCall: (() => void) | undefined
    let resolveOwnerCall: (() => void) | undefined

    mockCreateNotification.mockImplementation((payload: { templateId?: string }) => {
      if (payload.templateId === 'report_resolved' || payload.templateId === 'report_dismissed') {
        return new Promise<void>(resolve => { resolveReporterCall = () => { order.push('reporter'); resolve() } })
      }
      return new Promise<void>(resolve => { resolveOwnerCall = () => { order.push('owner'); resolve() } })
    })

    const { updateReportStatusAction } = await import('../reportListing')
    let actionResolved = false
    const pending = updateReportStatusAction('r-1', 'resolved', '').then(r => { actionResolved = true; return r })

    // Flush microtasks so the reporter createNotification call has definitely happened.
    await flushMicrotasks()
    expect(actionResolved).toBe(false)
    expect(resolveReporterCall).toBeDefined()
    expect(resolveOwnerCall).toBeUndefined() // owner path is sequential — has not started yet

    resolveReporterCall!()
    await flushMicrotasks()
    expect(actionResolved).toBe(false)
    expect(resolveOwnerCall).toBeDefined()

    resolveOwnerCall!()
    const result = await pending

    expect(actionResolved).toBe(true)
    expect(order).toEqual(['reporter', 'owner'])
    expect(result).toEqual({})
  })

  it('createNotification rejects on the reporter path → still returns {}, owner path still attempted (isolated try/catch)', async () => {
    let callCount = 0
    mockCreateNotification.mockImplementation(() => {
      callCount += 1
      if (callCount === 1) return Promise.reject(new Error('reporter insert failed'))
      return Promise.resolve()
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')

    expect(result).toEqual({})
    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[updateReportStatus] reporter notification failed',
      expect.objectContaining({ reportId: 'r-1', newStatus: 'resolved' }),
    )
    consoleSpy.mockRestore()
  })

  // Revision 1, review 1 finding R1-F2: the combined reporter+owner lookup discarded `error`.
  it('R1-F2: the combined reporter+owner lookup errors → console.error logged, no notification call, result still {}', async () => {
    const lookupError = { message: 'connection reset', code: '08006' }
    mockReportsReadSingle.mockResolvedValueOnce({ data: { status: 'reviewed' } }) // the earlier oldStatus read
    mockReportsReadSingle.mockResolvedValueOnce({ data: null, error: lookupError }) // the R5 combined read
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')

    expect(result).toEqual({})
    expect(mockCreateNotification).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[updateReportStatus] report lookup failed',
      expect.objectContaining({ reportId: 'r-1', error: lookupError }),
    )
    consoleSpy.mockRestore()
  })
})
