/**
 * getModeratorPermissions smoke — Task 871.
 *
 * Root cause: the function read `role_permissions` through the user-scoped client, which has no
 * SELECT grant (Task 275) and returns a `42501` error for every caller including admin — so
 * `/admin/permissions` rendered every switch off whatever was actually stored. Fix (owner decision
 * 2026-09-23, option a): read `role_permissions` through `createAdminClient()`, the same instance
 * that already resolves actor names. The unauthenticated/forbidden checks stay on the user-scoped
 * client and still run before any `role_permissions` read.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PERMISSION_KEYS } from '@/lib/auth/permissionKeys'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

// User-scoped client — role gate only. Its own `role_permissions` query would return 42501
// (Task 275 revoke); this suite proves the function no longer reads that table on this client.
const mockUserFrom = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const mockAdminFrom = vi.fn()
const mockCreateAdminClient = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-user-1' }
const REGULAR_USER = { id: 'regular-user-1' }

function userScopedRoleClient(role: string | undefined) {
  return {
    from: (table: string) => {
      mockUserFrom(table)
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: role ? { role } : null }) }) }) }
      }
      // role_permissions must never be reached on this client (Task 275: 42501 for authenticated)
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { code: '42501', message: 'permission denied for table role_permissions' } }),
        }),
      }
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════════

describe('getModeratorPermissions', () => {
  it('admin caller → result reflects the stored rows via the admin client; every other key false; 13 keys present', async () => {
    mockGetUser.mockResolvedValue(ADMIN_USER)
    mockCreateClient.mockResolvedValue(userScopedRoleClient('admin'))

    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        mockAdminFrom(table)
        if (table === 'role_permissions') {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    { permission_key: 'reports.delete', allowed: true, updated_at: '2026-09-25T00:00:00Z', updated_by_user_id: null },
                    { permission_key: 'audit.clear_history', allowed: false, updated_at: null, updated_by_user_id: null },
                  ],
                  error: null,
                }),
            }),
          }
        }
        return { select: () => ({ in: () => Promise.resolve({ data: [] }) }) }
      },
    })

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    const result = await getModeratorPermissions()

    expect(Object.keys(result)).toHaveLength(13)
    expect(PERMISSION_KEYS.every(k => k in result)).toBe(true)
    expect(result['reports.delete'].allowed).toBe(true)
    expect(result['audit.clear_history'].allowed).toBe(false)
    for (const key of PERMISSION_KEYS) {
      if (key !== 'reports.delete') expect(result[key].allowed).toBe(false)
    }
    expect(mockAdminFrom).toHaveBeenCalledWith('role_permissions')
  })

  it('unauthenticated → rejects unauthenticated; admin client from(role_permissions) never called', async () => {
    mockGetUser.mockResolvedValue(null)

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('unauthenticated')

    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it('regular user → rejects forbidden; admin client from(role_permissions) never called', async () => {
    mockGetUser.mockResolvedValue(REGULAR_USER)
    mockCreateClient.mockResolvedValue(userScopedRoleClient('user'))

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')

    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it('admin client read error → resolves to the all-false map; console.error called', async () => {
    mockGetUser.mockResolvedValue(ADMIN_USER)
    mockCreateClient.mockResolvedValue(userScopedRoleClient('admin'))
    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        mockAdminFrom(table)
        if (table === 'role_permissions') {
          return { select: () => ({ eq: () => Promise.resolve({ data: null, error: { code: 'XX000' } }) }) }
        }
        return { select: () => ({ in: () => Promise.resolve({ data: [] }) }) }
      },
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    const result = await getModeratorPermissions()

    expect(Object.keys(result)).toHaveLength(13)
    expect(Object.values(result).every(v => v.allowed === false)).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith('[permissions] getModeratorPermissions read failed', { code: 'XX000' })
    consoleSpy.mockRestore()
  })
})
