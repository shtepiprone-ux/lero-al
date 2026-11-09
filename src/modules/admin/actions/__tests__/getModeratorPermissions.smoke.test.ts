/**
 * getModeratorPermissions smoke — Task 871, brought onto the viewer contract by Task 931.
 *
 * Root cause (Task 871): the function read `role_permissions` through the user-scoped client, which has no
 * SELECT grant (Task 275) and returns a `42501` error for every caller including admin — so
 * `/admin/permissions` rendered every switch off whatever was actually stored. Fix (owner decision
 * 2026-09-23, option a): read `role_permissions` through `createAdminClient()`, the same instance
 * that already resolves actor names.
 *
 * Task 923 R44 / R75 (e): the caller's role comes from `requireViewer()`, and the switches are read by an ADMINISTRATOR
 * only — an unauthenticated visitor, a regular user and a moderator are refused before any `role_permissions` read.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PERMISSION_KEYS } from '@/lib/auth/permissionKeys'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

// The viewer boundary double: the action takes the role from here.
const mockRequireViewer = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: (...args: unknown[]) => mockRequireViewer(...args),
}))

const mockAdminFrom = vi.fn()
const mockCreateAdminClient = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_VIEWER = { ok: true, userId: 'admin-user-1', role: 'admin' }
const MODERATOR_VIEWER = { ok: true, userId: 'moderator-user-1', role: 'moderator' }
const REGULAR_VIEWER = { ok: true, userId: 'regular-user-1', role: 'user' }

/** An admin client whose `role_permissions` read WOULD succeed: a refused caller must still never reach it. */
function adminClientWithStoredRows() {
  return {
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
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateAdminClient.mockReturnValue(adminClientWithStoredRows())
})

// ══════════════════════════════════════════════════════════════════════════════

describe('getModeratorPermissions', () => {
  it('[SEC-931-SRV-MODPERM-ALLOW] admin caller → result reflects the stored rows via the admin client; every other key false; 13 keys present', async () => {
    mockRequireViewer.mockResolvedValue(ADMIN_VIEWER)

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    const result = await getModeratorPermissions()

    // every key of the registry is present (the registry holds 21 keys today; the title keeps the Task 871 wording "13 keys" fixed by the Task 931 sidecar)
    expect(Object.keys(result)).toHaveLength(PERMISSION_KEYS.length)
    expect(PERMISSION_KEYS.every(k => k in result)).toBe(true)
    expect(result['reports.delete'].allowed).toBe(true)
    expect(result['audit.clear_history'].allowed).toBe(false)
    for (const key of PERMISSION_KEYS) {
      if (key !== 'reports.delete') expect(result[key].allowed).toBe(false)
    }
    expect(mockAdminFrom).toHaveBeenCalledWith('role_permissions')
  })

  it('unauthenticated → rejects unauthenticated; admin client from(role_permissions) never called', async () => {
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'unauthenticated' })

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('unauthenticated')

    expect(mockAdminFrom).not.toHaveBeenCalledWith('role_permissions')
  })

  it('a failed viewer lookup → rejects forbidden; admin client from(role_permissions) never called', async () => {
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'lookup_failed' })

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')

    expect(mockAdminFrom).not.toHaveBeenCalledWith('role_permissions')
  })

  it('[SEC-931-SRV-MODPERM-USER-DENY] regular user → rejects forbidden; admin client from(role_permissions) never called', async () => {
    mockRequireViewer.mockResolvedValue(REGULAR_VIEWER)

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')

    expect(mockAdminFrom).not.toHaveBeenCalledWith('role_permissions')
  })

  it('[SEC-931-SRV-MODPERM-MODERATOR-DENY] moderator → rejects forbidden; admin client from(role_permissions) never called', async () => {
    mockRequireViewer.mockResolvedValue(MODERATOR_VIEWER)

    const { getModeratorPermissions } = await import('@/modules/admin/actions/permissions')
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')

    expect(mockAdminFrom).not.toHaveBeenCalledWith('role_permissions')
  })

  it('[SEC-931-SRV-MODPERM-ERROR] admin client read error → resolves to the all-false map; console.error called', async () => {
    mockRequireViewer.mockResolvedValue(ADMIN_VIEWER)
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

    expect(Object.keys(result)).toHaveLength(PERMISSION_KEYS.length)
    expect(Object.values(result).every(v => v.allowed === false)).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith('[permissions] getModeratorPermissions read failed', { code: 'XX000' })
    consoleSpy.mockRestore()
  })
})
