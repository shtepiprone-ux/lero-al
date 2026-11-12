/**
 * Guard 1 smoke — hardDeleteUser: admin hard-delete lifecycle (Task 443, Epic RS Slice 4; Task 923 R142: one complete deletion, `deleteAccount`).
 *
 * Covers the critical-flow-registry.md row:
 *   "Hard-delete user (admin)" — happy path (the permission, the session, the rank rule, then `deleteAccount(userId, { reason: 'staff' })`) + every failure/edge path.
 *
 * Key assertions:
 *   - Happy: `deleteAccount` is called exactly once, for the target, with the reason `staff`; nothing is archived first (the account goes with its listings).
 *   - Permission denied (hasPermission false) → { error: 'forbidden' } + zero side effects.
 *   - Permission throws → still { error: 'forbidden' } + zero side effects.
 *   - No session → { error: 'Unauthorized' } + zero side effects.
 *   - Own id and a rank refusal → { error: 'forbidden' } + `deleteAccount` NOT called.
 *   - `deleteAccount` fails → { error: 'delete_failed' }: there is no partial-deletion answer any more (the Auth user and the profile go in one transaction).
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PUBLIC_LISTINGS_CACHE_TAG } from '@/modules/listings/lib/cacheTags'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

// Task 964 R1-2: the cascade removes the person's listings, so a successful deletion expires the public-listings tag (a refused or failed one does not)
const mockUpdateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: (...args: unknown[]) => mockUpdateTag(...args), unstable_cache: (fn: unknown) => fn }))

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

const mockDeleteAccount = vi.fn()
vi.mock('@/lib/account/deleteAccount', () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}))

// The rank read (Task 923 R66 (a)) is the one thing the action still asks the service-role client.
const mockAdminFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
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
vi.mock('@/modules/notifications/lib/createNotification', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_ID = 'admin-user-1'
const TARGET_USER_ID = 'target-user-1'

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockHasPermission.mockResolvedValue(true)
  mockGetUser.mockResolvedValue({ id: ADMIN_ID })
  mockDeleteAccount.mockResolvedValue({ ok: true, filesNotRemoved: 0 })
  mockApplyTransition.mockResolvedValue({ ok: true })

  mockAdminFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    // rank check (Task 923 Revision 7): the acting administrator and an ordinary target
    in: vi.fn().mockResolvedValue({ data: [{ id: ADMIN_ID, role: 'admin' }, { id: TARGET_USER_ID, role: 'user' }] }),
  }))
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('hardDeleteUser — smoke tests (Guard 1, Task 443; Task 923 R142)', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('happy path — permitted admin: deleteAccount(target, { reason: "staff" }) runs once → {}', async () => {
    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({})
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1)
    expect(mockDeleteAccount).toHaveBeenCalledWith(TARGET_USER_ID, { reason: 'staff' })
    expect(mockUpdateTag.mock.calls).toEqual([[PUBLIC_LISTINGS_CACHE_TAG]])
    // the account goes with its listings: nothing is archived first
    expect(mockApplyTransition).not.toHaveBeenCalled()
  })

  it('a file that could not be removed does not make the deletion fail: ok with filesNotRemoved is still {}', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: true, filesNotRemoved: 3 })

    const { hardDeleteUser } = await import('../index')
    expect(await hardDeleteUser(TARGET_USER_ID)).toEqual({})
  })

  // ── Permission failures ───────────────────────────────────────────────────

  it('forbidden — hasPermission returns false → { error: "forbidden" } + zero side effects', async () => {
    mockHasPermission.mockResolvedValue(false)

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  it('forbidden — hasPermission throws → { error: "forbidden" } + zero side effects', async () => {
    mockHasPermission.mockRejectedValue(new Error('permission check exploded'))

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  // ── Unauthorized ──────────────────────────────────────────────────────────

  it('unauthorized — no session → { error: "Unauthorized" } + zero side effects', async () => {
    mockGetUser.mockResolvedValue(null)

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockApplyTransition).not.toHaveBeenCalled()
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  // ── Own id and rank ───────────────────────────────────────────────────────

  it('forbidden — a staff member cannot delete their own account from the panel', async () => {
    const { hardDeleteUser } = await import('../index')
    expect(await hardDeleteUser(ADMIN_ID)).toEqual({ error: 'forbidden' })
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  it('forbidden — the rank rule refuses a moderator who targets an administrator', async () => {
    mockGetUser.mockResolvedValue({ id: 'moderator-1' })
    mockAdminFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ id: 'moderator-1', role: 'moderator' }, { id: TARGET_USER_ID, role: 'admin' }] }),
    }))

    const { hardDeleteUser } = await import('../index')
    expect(await hardDeleteUser(TARGET_USER_ID)).toEqual({ error: 'forbidden' })
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  // ── Deletion failure ──────────────────────────────────────────────────────

  it('deleteAccount fails → { error: "delete_failed" }', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: false, error: 'delete_failed' })

    const { hardDeleteUser } = await import('../index')
    const result = await hardDeleteUser(TARGET_USER_ID)

    expect(result).toEqual({ error: 'delete_failed' })
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1)
    expect(mockUpdateTag, 'a failed deletion expires nothing').not.toHaveBeenCalled()
  })
})
