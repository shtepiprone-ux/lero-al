/**
 * Guard 1 smoke — hardDeleteUser: admin hard-delete lifecycle (Task 443, Epic RS Slice 4).
 *
 * Covers the critical-flow-registry.md row:
 *   "Hard-delete user (admin)" — happy path (listings archived → profile deleted →
 *   auth.admin.deleteUser called = email freed) + every failure/edge path.
 *
 * Key assertions:
 *   - Happy: listings archived BEFORE profile delete; profile delete BEFORE auth delete;
 *     auth.admin.deleteUser called exactly once (email-reuse guard).
 *   - Permission denied (hasPermission false) → { error: 'forbidden' } + zero side effects.
 *   - Permission throws → still { error: 'forbidden' } + zero side effects.
 *   - No session → { error: 'Unauthorized' } + zero side effects.
 *   - Profile delete error → { error: 'delete_failed' } + console.error + auth.admin.deleteUser NOT called.
 *   - Auth delete error → { error: 'profile_deleted_auth_failed' } + console.error.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts
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

const mockDeleteUserAuth = vi.fn()
const mockUsersDeleteEq = vi.fn()
const mockListingsNotChain = vi.fn()
const mockAdminFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
    auth: { admin: { deleteUser: (...args: unknown[]) => mockDeleteUserAuth(...args) } },
  })),
}))

const mockApplyTransition = vi.fn()
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: (...args: unknown[]) => mockApplyTransition(...args),
}))

// Side-effect prevention — not under test but imported by the same file
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }),
  }),
}))
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_ID = 'admin-user-1'
const TARGET_USER_ID = 'target-user-1'

const LISTINGS_TO_ARCHIVE = [{ id: 'listing-1' }, { id: 'listing-2' }]

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockHasPermission.mockResolvedValue(true)
  mockGetUser.mockResolvedValue({ id: ADMIN_ID })
  mockDeleteUserAuth.mockResolvedValue({ error: null })
  mockApplyTransition.mockResolvedValue({ ok: true })

  // Ordering tracker: records call order across seams to verify invariants
  callOrder.length = 0

  mockUsersDeleteEq.mockImplementation(() => {
    callOrder.push('users.delete')
    return Promise.resolve({ error: null })
  })

  mockListingsNotChain.mockImplementation(() => {
    callOrder.push('listings.select')
    return Promise.resolve({ data: LISTINGS_TO_ARCHIVE })
  })

  mockDeleteUserAuth.mockImplementation((...args: unknown[]) => {
    callOrder.push('auth.admin.deleteUser')
    void args
    return Promise.resolve({ error: null })
  })

  mockApplyTransition.mockImplementation((...args: unknown[]) => {
    callOrder.push('applyTransition')
    void args
    return Promise.resolve({ ok: true })
  })

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'listings') {
      return {
        select: () => ({
          eq: () => ({
            not: mockListingsNotChain,
          }),
        }),
      }
    }
    if (table === 'users') {
      return {
        delete: () => ({ eq: mockUsersDeleteEq }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
  })
})

const callOrder: string[] = []

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('hardDeleteUser — smoke tests (Guard 1, Task 443)', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('happy path — permitted admin: listings archived → profile deleted → auth.admin.deleteUser called → {}', async () => {
    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({})

    // Listings archived via transition gateway
    expect(mockApplyTransition).toHaveBeenCalledTimes(LISTINGS_TO_ARCHIVE.length)
    for (const listing of LISTINGS_TO_ARCHIVE) {
      expect(mockApplyTransition).toHaveBeenCalledWith(
        listing.id,
        'archived',
        expect.objectContaining({ role: 'admin', source: 'admin_panel' }),
      )
    }

    // Profile row deleted
    expect(mockUsersDeleteEq).toHaveBeenCalledWith('id', TARGET_USER_ID)

    // auth.admin.deleteUser called exactly once (email-reuse guard)
    expect(mockDeleteUserAuth).toHaveBeenCalledTimes(1)
    expect(mockDeleteUserAuth).toHaveBeenCalledWith(TARGET_USER_ID)

    // Ordering: listing-archive(s) BEFORE users.delete BEFORE auth.admin.deleteUser
    const transitionIndices = callOrder
      .map((c, i) => (c === 'applyTransition' ? i : -1))
      .filter(i => i >= 0)
    const deleteIndex = callOrder.indexOf('users.delete')
    const authDeleteIndex = callOrder.indexOf('auth.admin.deleteUser')

    for (const ti of transitionIndices) {
      expect(ti).toBeLessThan(deleteIndex)
    }
    expect(deleteIndex).toBeLessThan(authDeleteIndex)
  })

  // ── Permission failures ───────────────────────────────────────────────────

  it('forbidden — hasPermission returns false → { error: "forbidden" } + zero side effects', async () => {
    mockHasPermission.mockResolvedValue(false)

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockUsersDeleteEq).not.toHaveBeenCalled()
    expect(mockDeleteUserAuth).not.toHaveBeenCalled()
  })

  it('forbidden — hasPermission throws → { error: "forbidden" } + zero side effects', async () => {
    mockHasPermission.mockRejectedValue(new Error('permission check exploded'))

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockUsersDeleteEq).not.toHaveBeenCalled()
    expect(mockDeleteUserAuth).not.toHaveBeenCalled()
  })

  // ── Unauthorized ──────────────────────────────────────────────────────────

  it('unauthorized — no session → { error: "Unauthorized" } + zero side effects', async () => {
    mockGetUser.mockResolvedValue(null)

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockUsersDeleteEq).not.toHaveBeenCalled()
    expect(mockDeleteUserAuth).not.toHaveBeenCalled()
  })

  // ── Profile delete error ──────────────────────────────────────────────────

  it('profile delete error → { error: "delete_failed" } + console.error + auth.admin.deleteUser NOT called', async () => {
    const profileError = { message: 'FK constraint', code: '23503' }
    mockUsersDeleteEq.mockImplementation(() => {
      callOrder.push('users.delete')
      return Promise.resolve({ error: profileError })
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'delete_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'hardDeleteUser profile failed',
      expect.objectContaining({ error: profileError, userId: TARGET_USER_ID }),
    )
    // Critical: auth.admin.deleteUser must NOT be called when profile delete fails
    expect(mockDeleteUserAuth).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  // ── Auth delete error ─────────────────────────────────────────────────────

  it('auth delete error → { error: "profile_deleted_auth_failed" } + console.error', async () => {
    const authError = { message: 'User not found in auth', code: 'user_not_found' }
    mockDeleteUserAuth.mockImplementation(() => {
      callOrder.push('auth.admin.deleteUser')
      return Promise.resolve({ error: authError })
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'profile_deleted_auth_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'hardDeleteUser auth failed',
      expect.objectContaining({ error: authError, userId: TARGET_USER_ID }),
    )

    consoleSpy.mockRestore()
  })
})
