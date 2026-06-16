/**
 * Guard 1 smoke tests — clearHistory server action (Task 436 / Epic RS Slice 1).
 *
 * Covers the critical-flow-registry.md rows:
 *   - "Clear history (success)" — clearHistoryRow happy path + clearHistoryForEntity
 *   - "Clear history (no-op race)" — cleared_row_count = 0 path
 *
 * Planted-violation proof: remove the `mockRpc` success mock and this test FAILS.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/clearHistory.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

const mockHasPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  assertPermission: vi.fn().mockResolvedValue(undefined),
  roleHasPermission: vi.fn().mockReturnValue(false),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockRpc = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
  })),
}))

// ── Default fixtures ──────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-user-1', role: 'admin' } as const
const SOURCE = 'user_status_history' as const

// ── clearHistoryRow ───────────────────────────────────────────────────────────

describe('clearHistoryRow — smoke tests (Guard 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasPermission.mockResolvedValue(true)
    mockGetUser.mockResolvedValue(ADMIN_USER)
    mockRpc.mockResolvedValue({ data: { cleared_row_count: 1 }, error: null })
  })

  it('happy path: clears a row and returns { cleared: 1 }', async () => {
    const { clearHistoryRow } = await import('../clearHistory')
    const result = await clearHistoryRow(SOURCE, 'entity-1', 'row-1')
    expect(result).toEqual({ cleared: 1 })
    expect(mockRpc).toHaveBeenCalledWith('clear_user_history', expect.objectContaining({
      p_history_source: SOURCE,
      p_entity_id: 'entity-1',
      p_row_id: 'row-1',
      p_actor_user_id: ADMIN_USER.id,
    }))
  })

  it('no-op race: returns { cleared: 0 } when nothing to clear', async () => {
    mockRpc.mockResolvedValue({ data: { cleared_row_count: 0 }, error: null })
    const { clearHistoryRow } = await import('../clearHistory')
    const result = await clearHistoryRow(SOURCE, 'entity-1', 'row-1')
    expect(result).toEqual({ cleared: 0 })
  })

  it('forbidden: returns { error: "forbidden" } when permission is denied', async () => {
    mockHasPermission.mockResolvedValue(false)
    const { clearHistoryRow } = await import('../clearHistory')
    const result = await clearHistoryRow(SOURCE, 'entity-1', 'row-1')
    expect(result).toEqual({ error: 'forbidden' })
  })

  it('unauthorized: returns { error: "Unauthorized" } when there is no session', async () => {
    mockGetUser.mockResolvedValue(null)
    const { clearHistoryRow } = await import('../clearHistory')
    const result = await clearHistoryRow(SOURCE, 'entity-1', 'row-1')
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('rpc failure: returns { error: "clear_failed" } and logs the root cause', async () => {
    const dbError = { message: 'relation "clear_user_history" does not exist', code: '42883' }
    mockRpc.mockResolvedValue({ data: null, error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { clearHistoryRow } = await import('../clearHistory')
    const result = await clearHistoryRow(SOURCE, 'entity-1', 'row-1')

    expect(result).toEqual({ error: 'clear_failed' })
    // Guard 4 (actionable-error rule): failure must be logged, not silently swallowed
    expect(consoleSpy).toHaveBeenCalledWith(
      'clearHistory rpc failed',
      expect.objectContaining({ error: dbError }),
    )
    consoleSpy.mockRestore()
  })
})

// ── clearHistoryForEntity ─────────────────────────────────────────────────────

describe('clearHistoryForEntity — smoke tests (Guard 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasPermission.mockResolvedValue(true)
    mockGetUser.mockResolvedValue(ADMIN_USER)
    mockRpc.mockResolvedValue({ data: { cleared_row_count: 3 }, error: null })
  })

  it('happy path: clears all rows for entity and returns { cleared: 3 }', async () => {
    const { clearHistoryForEntity } = await import('../clearHistory')
    const result = await clearHistoryForEntity(SOURCE, 'entity-1')
    expect(result).toEqual({ cleared: 3 })
    // p_row_id must be null for entity-wide clear
    expect(mockRpc).toHaveBeenCalledWith('clear_user_history', expect.objectContaining({
      p_row_id: null,
    }))
  })

  it('no-op race: returns { cleared: 0 } when entity has no history', async () => {
    mockRpc.mockResolvedValue({ data: { cleared_row_count: 0 }, error: null })
    const { clearHistoryForEntity } = await import('../clearHistory')
    const result = await clearHistoryForEntity(SOURCE, 'entity-1')
    expect(result).toEqual({ cleared: 0 })
  })
})
