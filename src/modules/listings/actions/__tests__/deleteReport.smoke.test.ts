/**
 * Task 463 — deleteReportAction + updateReportStatusAction allowlist/status_override guard.
 *
 * Covers:
 *   - deleteReportAction: capable delete → row deleted (DB call verified) + {};
 *     forbidden → no delete (DB call absent); delegation (moderator with reports.delete) → passes;
 *     unauthenticated → unauthorized; missing row → not_found; DB error → save_failed + console.error.
 *   - updateReportStatusAction: permission-before-read (no capability → forbidden before any
 *     service-role read); CAS update (filter on oldStatus); audit-revert on audit failure;
 *     allowlist transitions pass with reports.manage; out-of-allowlist denied without
 *     reports.status_override (update NOT called); same→same → invalid_status; CAS conflict.
 *
 * Planted-violation transcript: drop the reports.status_override classification
 * (make the guard always check reports.manage) → the "moderator out-of-allowlist forbidden"
 * tests FAIL because reports.manage passes. Restore → PASS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockHasPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: (key: string) => mockHasPermission(key),
  assertPermission: vi.fn(),
  roleHasPermission: vi.fn(),
}))

const mockDelete = vi.fn()
const mockDeleteSelect = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateSelect = vi.fn()
const mockInsert = vi.fn()

const deleteChain = {
  eq: vi.fn().mockReturnThis(),
  select: mockDeleteSelect,
}
const updateChain = {
  eq: vi.fn().mockReturnThis(),
  select: mockUpdateSelect,
}
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}
const profileChain = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'listing_reports') {
        return {
          delete: () => { mockDelete(); return deleteChain },
          select: () => selectChain,
          update: (data: unknown) => { mockUpdate(data); return updateChain },
        }
      }
      if (table === 'users') {
        return { select: () => ({ eq: () => profileChain }) }
      }
      if (table === 'report_actions') {
        return { insert: mockInsert }
      }
      return {}
    },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: vi.fn().mockResolvedValue(null) }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: vi.fn() }))
vi.mock('@/modules/notifications/lib/emails/ReporterNotificationEmail', () => ({
  ReporterNotificationEmail: vi.fn(),
  getReporterNotificationEmailStrings: vi.fn().mockReturnValue({ subject: '', heading: '', body: '' }),
}))
vi.mock('@/modules/notifications/lib/mutations', () => ({ createNotification: vi.fn() }))

const AUTH_USER = { id: 'admin-1' }

// ── Helpers ─────────────────────────────────────────────────────────────────

function setupPermission(mapping: Record<string, boolean>) {
  mockHasPermission.mockImplementation((key: string) => Promise.resolve(mapping[key] ?? false))
}

// ── Tests: deleteReportAction ───────────────────────────────────────────────

describe('deleteReportAction — Task 463', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue(AUTH_USER)
    deleteChain.eq.mockReturnThis()
    mockDeleteSelect.mockResolvedValue({ data: [{ id: 'r-1' }], error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('capable viewer → row deleted (DB delete called), returns {}', async () => {
    setupPermission({ 'reports.delete': true })
    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')
    expect(result).toEqual({})
    expect(mockDelete).toHaveBeenCalledOnce()
  })

  it('reports.manage-only moderator → forbidden, delete NOT called', async () => {
    setupPermission({ 'reports.manage': true, 'reports.delete': false })
    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')
    expect(result).toEqual({ error: 'forbidden' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('moderator WITH reports.delete granted → delete invoked (delegation)', async () => {
    setupPermission({ 'reports.manage': true, 'reports.delete': true })
    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')
    expect(result).toEqual({})
    expect(mockDelete).toHaveBeenCalledOnce()
  })

  it('unauthenticated → unauthorized, delete NOT called', async () => {
    mockGetUser.mockResolvedValue(null)
    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')
    expect(result).toEqual({ error: 'unauthorized' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('missing row → not_found', async () => {
    setupPermission({ 'reports.delete': true })
    mockDeleteSelect.mockResolvedValue({ data: [], error: null })
    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')
    expect(result).toEqual({ error: 'not_found' })
  })

  it('DB error → console.error + save_failed', async () => {
    setupPermission({ 'reports.delete': true })
    const dbError = { message: 'FK violation', code: '23503' }
    mockDeleteSelect.mockResolvedValue({ data: null, error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { deleteReportAction } = await import('../reportListing')
    const result = await deleteReportAction('r-1')

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith('[deleteReport] delete failed', expect.objectContaining({ message: 'FK violation' }))
    consoleSpy.mockRestore()
  })
})

// ── Tests: updateReportStatusAction allowlist + status_override ─────────────

describe('updateReportStatusAction — allowlist/status_override guard (Task 463)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue(AUTH_USER)
    profileChain.single.mockResolvedValue({ data: { role: 'moderator' } })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    updateChain.eq.mockReturnThis()
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 'r-1' }], error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('allowlist transition (pending→reviewed) with reports.manage → passes', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({})
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'reviewed' })
  })

  it('allowlist transition (pending→resolved) with reports.manage → passes', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')
    expect(result).toEqual({})
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'resolved' })
  })

  it('allowlist transition (pending→reviewed) with status_override only (no reports.manage) → passes', async () => {
    setupPermission({ 'reports.status_override': true, 'reports.manage': false })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({})
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'reviewed' })
  })

  it('allowlist transition (pending→resolved) with status_override only (no reports.manage) → passes', async () => {
    setupPermission({ 'reports.status_override': true, 'reports.manage': false })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'resolved', '')
    expect(result).toEqual({})
  })

  it('out-of-allowlist (reviewed→pending) by reports.manage-only moderator → forbidden, update NOT called', async () => {
    setupPermission({ 'reports.manage': true, 'reports.status_override': false })
    selectChain.single.mockResolvedValue({ data: { status: 'reviewed' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'pending', '')
    expect(result).toEqual({ error: 'forbidden' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('out-of-allowlist (resolved→dismissed) by reports.manage-only moderator → forbidden, update NOT called', async () => {
    setupPermission({ 'reports.manage': true, 'reports.status_override': false })
    selectChain.single.mockResolvedValue({ data: { status: 'resolved' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'dismissed', '')
    expect(result).toEqual({ error: 'forbidden' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('reopen (resolved→pending) by reports.manage-only moderator → forbidden, update NOT called', async () => {
    setupPermission({ 'reports.manage': true, 'reports.status_override': false })
    selectChain.single.mockResolvedValue({ data: { status: 'resolved' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'pending', '')
    expect(result).toEqual({ error: 'forbidden' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('out-of-allowlist with reports.status_override granted → passes', async () => {
    setupPermission({ 'reports.status_override': true })
    selectChain.single.mockResolvedValue({ data: { status: 'resolved' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'pending', '')
    expect(result).toEqual({})
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'pending' })
  })

  it('same→same noop → invalid_status', async () => {
    setupPermission({ 'reports.manage': true, 'reports.status_override': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'pending', '')
    expect(result).toEqual({ error: 'invalid_status' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('unauthenticated → unauthorized', async () => {
    mockGetUser.mockResolvedValue(null)
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({ error: 'unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  // Permission-before-read: no capability → forbidden before any service-role read
  it('no report capability (neither manage nor override) → forbidden, no service-role read', async () => {
    setupPermission({ 'reports.manage': false, 'reports.status_override': false })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({ error: 'forbidden' })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(selectChain.single).not.toHaveBeenCalled()
    expect(profileChain.single).not.toHaveBeenCalled()
  })

  // CAS: concurrent transition race → conflict
  it('CAS conflict (status changed between read and write) → conflict', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    mockUpdateSelect.mockResolvedValue({ data: [], error: null })
    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')
    expect(result).toEqual({ error: 'conflict' })
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'reviewed' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  // Audit-row assertion on successful status change
  it('successful status change → audit row inserted', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const { updateReportStatusAction } = await import('../reportListing')
    await updateReportStatusAction('r-1', 'reviewed', 'test note')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      report_id: 'r-1',
      actor_id: AUTH_USER.id,
      old_status: 'pending',
      new_status: 'reviewed',
    }))
  })

  // Audit insert failure → CAS revert succeeds → save_failed
  it('audit insert failure → status CAS-reverted + console.error + save_failed', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const auditError = { message: 'audit insert failed', code: '42501' }
    mockInsert.mockResolvedValue({ error: auditError })
    mockUpdateSelect
      .mockResolvedValueOnce({ data: [{ id: 'r-1' }], error: null })  // forward CAS update
      .mockResolvedValueOnce({ data: [{ id: 'r-1' }], error: null })  // CAS revert succeeds
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      '[updateReportStatus] audit insert failed, status reverted',
      expect.objectContaining({ message: 'audit insert failed' }),
    )
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { status: 'reviewed' })
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { status: 'pending' })
    consoleSpy.mockRestore()
  })

  // R11: Audit insert fails AND CAS revert misses (concurrent change) → CRITICAL log
  it('audit failure + CAS revert miss (concurrent change) → CRITICAL console.error + save_failed', async () => {
    setupPermission({ 'reports.manage': true })
    selectChain.single.mockResolvedValue({ data: { status: 'pending' } })
    const auditError = { message: 'audit insert failed', code: '42501' }
    mockInsert.mockResolvedValue({ error: auditError })
    mockUpdateSelect
      .mockResolvedValueOnce({ data: [{ id: 'r-1' }], error: null })  // forward CAS update
      .mockResolvedValueOnce({ data: [], error: null })                // CAS revert misses
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateReportStatusAction } = await import('../reportListing')
    const result = await updateReportStatusAction('r-1', 'reviewed', '')

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      '[updateReportStatus] CRITICAL: audit insert failed and status NOT reverted (concurrent change or revert error)',
      expect.objectContaining({ reportId: 'r-1', oldStatus: 'pending', newStatus: 'reviewed' }),
    )
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { status: 'pending' })
    consoleSpy.mockRestore()
  })
})
