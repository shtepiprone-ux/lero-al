/**
 * Task 881 (Sprint 80), R9/AC8 — pins `notifications`' write-path column contract before the
 * `authenticated` grant is narrowed to `UPDATE (is_read)` (R2). If either mark-as-read action ever
 * writes a column other than `is_read`, or ever switches to the admin client, the live grant this
 * task ships would refuse the write and both actions would fail silently (they only
 * `console.error`, mutations.ts:51/62) — this test is what pins that contract in code.
 *
 * Covers:
 *   - markNotificationRead / markAllNotificationsRead: construct the user-scoped `createClient()`,
 *     never `createAdminClient()`; `.update()` payload keys are exactly `['is_read']` with value
 *     `true`; the filter chain matches the shipped predicates; an `{ error }` result logs the
 *     existing message once and resolves without throwing.
 *   - createNotification: uses the admin client and never the user-scoped one.
 *
 * Planted-violation (P1, task881 kickoff §10.4): `markNotificationRead`'s payload becomes
 * `{ is_read: true, title: 'x' }` — the payload-keys assertion below must FAIL. Reverted → PASS.
 *
 * Command: npx vitest run src/modules/notifications/lib/__tests__/mutations.smoke.test.ts
 * (also runs under `npm run test:rls-guards`)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUserFrom = vi.fn()
const mockCreateClient = vi.fn(() => ({ from: mockUserFrom }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

const mockAdminFrom = vi.fn()
const mockCreateAdminClient = vi.fn(() => ({ from: mockAdminFrom }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}))

// Task 923 R44: both mark-as-read actions first ask `requireViewer()` whether the account has access. That helper reads the caller's row with the service role, which would
// make the "never the admin client" assertions below about the helper instead of about the write; so the helper is the double, and it answers in its exact shape.
const mockRequireViewer = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: () => mockRequireViewer(),
}))
const VIEWER_OK = { ok: true, userId: 'u-1', role: 'user' } as const

const mockUpdate = vi.fn()
const mockInsert = vi.fn()

function buildUpdateChain(result: { error: unknown }) {
  const eqCalls: unknown[][] = []
  const chain = {
    eq: vi.fn((...args: unknown[]) => {
      eqCalls.push(args)
      return chain
    }),
    then: undefined as unknown,
  }
  // `.update().eq().eq()` resolves the whole chain — make the chain itself thenable
  // so `await supabase.from(...).update(...).eq(...).eq(...)` resolves to `result`.
  const thenable = Object.assign(chain, {
    then: (resolve: (v: { error: unknown }) => void) => resolve(result),
  })
  return { chain: thenable, eqCalls }
}

// ── Tests: markNotificationRead / markAllNotificationsRead ──────────────────

describe('mutations.ts — user-scoped mark-as-read (Task 881 R9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireViewer.mockResolvedValue(VIEWER_OK)
  })

  it.each([
    ['markNotificationRead', (m: typeof import('../mutations')) => m.markNotificationRead('n-1')],
    ['markAllNotificationsRead', (m: typeof import('../mutations')) => m.markAllNotificationsRead()],
  ])('%s — an account without access changes nothing: no client is created and no row is written (Task 923 R44)', async (_name, call) => {
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'unauthenticated' })
    const mutations = await import('../mutations')
    await expect(call(mutations)).resolves.toBeUndefined()
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
    expect(mockUserFrom).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('markNotificationRead — uses the user-scoped client, never the admin client', async () => {
    const { chain } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markNotificationRead } = await import('../mutations')
    await markNotificationRead('n-1')

    expect(mockCreateClient).toHaveBeenCalledOnce()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
    expect(mockUserFrom).toHaveBeenCalledWith('notifications')
  })

  it('markNotificationRead — update() payload keys are exactly [is_read]=true', async () => {
    const { chain } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markNotificationRead } = await import('../mutations')
    await markNotificationRead('n-1')

    expect(mockUpdate).toHaveBeenCalledOnce()
    const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(Object.keys(payload)).toEqual(['is_read'])
    expect(payload.is_read).toBe(true)
  })

  it('markNotificationRead — filters eq(id) and eq(is_read, false)', async () => {
    const { chain, eqCalls } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markNotificationRead } = await import('../mutations')
    await markNotificationRead('n-1')

    expect(eqCalls).toEqual([['id', 'n-1'], ['is_read', false]])
  })

  it('markNotificationRead — { error } result logs once and resolves without throwing', async () => {
    const dbError = { message: 'permission denied for table notifications', code: '42501' }
    const { chain } = buildUpdateChain({ error: dbError })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { markNotificationRead } = await import('../mutations')
    await expect(markNotificationRead('n-1')).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[notifications] markNotificationRead failed',
      expect.objectContaining({ error: dbError, id: 'n-1' }),
    )
    consoleSpy.mockRestore()
  })

  it('markAllNotificationsRead — uses the user-scoped client, never the admin client', async () => {
    const { chain } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markAllNotificationsRead } = await import('../mutations')
    await markAllNotificationsRead()

    expect(mockCreateClient).toHaveBeenCalledOnce()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
    expect(mockUserFrom).toHaveBeenCalledWith('notifications')
  })

  it('markAllNotificationsRead — update() payload keys are exactly [is_read]=true', async () => {
    const { chain } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markAllNotificationsRead } = await import('../mutations')
    await markAllNotificationsRead()

    expect(mockUpdate).toHaveBeenCalledOnce()
    const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(Object.keys(payload)).toEqual(['is_read'])
    expect(payload.is_read).toBe(true)
  })

  it('markAllNotificationsRead — filters eq(is_read, false) only', async () => {
    const { chain, eqCalls } = buildUpdateChain({ error: null })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })

    const { markAllNotificationsRead } = await import('../mutations')
    await markAllNotificationsRead()

    expect(eqCalls).toEqual([['is_read', false]])
  })

  it('markAllNotificationsRead — { error } result logs once and resolves without throwing', async () => {
    const dbError = { message: 'permission denied for table notifications', code: '42501' }
    const { chain } = buildUpdateChain({ error: dbError })
    mockUpdate.mockReturnValue(chain)
    mockUserFrom.mockReturnValue({ update: mockUpdate })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { markAllNotificationsRead } = await import('../mutations')
    await expect(markAllNotificationsRead()).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[notifications] markAllNotificationsRead failed',
      expect.objectContaining({ error: dbError }),
    )
    consoleSpy.mockRestore()
  })
})

// ── Tests: createNotification ────────────────────────────────────────────────

describe('createNotification.ts (Task 881 R9; moved out of the Server Action file by Task 923 Revision 7, S1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireViewer.mockResolvedValue(VIEWER_OK)
  })

  it('uses the admin client and never the user-scoped client', async () => {
    mockInsert.mockResolvedValue({ error: null })
    mockAdminFrom.mockReturnValue({ insert: mockInsert })

    const { createNotification } = await import('../createNotification')
    await createNotification({
      userId: 'u-1',
      type: 'marketing',
      title: 't',
      body: 'b',
    })

    expect(mockCreateAdminClient).toHaveBeenCalledOnce()
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockAdminFrom).toHaveBeenCalledWith('notifications')
  })
})
