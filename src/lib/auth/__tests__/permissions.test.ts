/**
 * roleHasPermission / hasPermission / assertPermission — Task 871.
 *
 * Root cause: `authenticated` has no SELECT on `role_permissions` (Task 275 revoke); reading it
 * through the user-scoped client returns a `42501` error for every moderator, denying every
 * configurable permission since 2026-05-28. Fix (owner decision 2026-09-23, option a): read
 * `role_permissions` through `createAdminClient()`. No grant/policy change.
 *
 * Client-boundary invariant under test: `roleHasPermission`'s moderator branch queries
 * `role_permissions` on the ADMIN client only, never on the user-scoped client, and fails closed
 * (false, no throw) on any read error or a throw from `createAdminClient()` itself.
 *
 * Command: npx vitest run src/lib/auth/__tests__/permissions.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

// hasPermission / assertPermission take the role from requireViewer() (Task 923 R44, Task 931 R4): this is the viewer boundary double.
const mockRequireViewer = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: (...args: unknown[]) => mockRequireViewer(...args),
}))

// Kept for the roleHasPermission tests: they assert that no client factory is called for the roles that need no read, and that the
// user-scoped client is never used for role_permissions.
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const mockCreateAdminClient = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function adminClientReturning(data: { allowed: boolean } | null, error: { code: string } | null = null) {
  const mockFrom = vi.fn()
  const client = {
    from: (table: string) => {
      mockFrom(table)
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data, error }),
            }),
          }),
        }),
      }
    },
  }
  return { client, mockFrom }
}

// ══════════════════════════════════════════════════════════════════════════════
// roleHasPermission
// ══════════════════════════════════════════════════════════════════════════════

describe('roleHasPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin → true; neither client factory called', async () => {
    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission('admin', 'reports.delete')

    expect(result).toBe(true)
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it.each(['user', 'agent'])('role %s → false; neither client factory called', async role => {
    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission(role, 'reports.delete')

    expect(result).toBe(false)
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it('moderator, admin-client row { allowed: true } → true; queried on the admin client, never the user-scoped client', async () => {
    const { client, mockFrom } = adminClientReturning({ allowed: true })
    mockCreateAdminClient.mockReturnValue(client)

    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission('moderator', 'reports.delete')

    expect(result).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('role_permissions')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('moderator, row { allowed: false } → false', async () => {
    const { client } = adminClientReturning({ allowed: false })
    mockCreateAdminClient.mockReturnValue(client)

    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission('moderator', 'reports.delete')

    expect(result).toBe(false)
  })

  it('moderator, no row (data: null, error: null) → false; console.error not called', async () => {
    const { client } = adminClientReturning(null, null)
    mockCreateAdminClient.mockReturnValue(client)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission('moderator', 'reports.delete')

    expect(result).toBe(false)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('moderator, admin client returns { error } → false; console.error called once with role_permissions read failed', async () => {
    const { client } = adminClientReturning(null, { code: 'XX000' })
    mockCreateAdminClient.mockReturnValue(client)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { roleHasPermission } = await import('@/lib/auth/permissions')
    const result = await roleHasPermission('moderator', 'reports.delete')

    expect(result).toBe(false)
    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith('[permissions] role_permissions read failed', {
      key: 'reports.delete',
      code: 'XX000',
    })
    consoleSpy.mockRestore()
  })

  it('moderator, createAdminClient throws → false; resolves (does not reject); console.error called', async () => {
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.')
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { roleHasPermission } = await import('@/lib/auth/permissions')
    await expect(roleHasPermission('moderator', 'reports.delete')).resolves.toBe(false)

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith('[permissions] role_permissions read failed', {
      key: 'reports.delete',
      code: 'exception',
    })
    consoleSpy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// hasPermission / assertPermission — moderator end-to-end
// ══════════════════════════════════════════════════════════════════════════════

describe('hasPermission / assertPermission — moderator end-to-end', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireViewer.mockResolvedValue({ ok: true, userId: 'mod-1', role: 'moderator' })
  })

  it('[SEC-931-SRV-PERM-ALLOW] hasPermission → true for a moderator whose key is stored allowed:true (admin-client read)', async () => {
    const { client, mockFrom } = adminClientReturning({ allowed: true })
    mockCreateAdminClient.mockReturnValue(client)

    const { hasPermission } = await import('@/lib/auth/permissions')
    const result = await hasPermission('reports.delete')

    expect(result).toBe(true)
    expect(mockRequireViewer).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledWith('role_permissions')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('assertPermission rejects forbidden for the same moderator with { allowed: false }', async () => {
    const { client } = adminClientReturning({ allowed: false })
    mockCreateAdminClient.mockReturnValue(client)

    const { assertPermission } = await import('@/lib/auth/permissions')
    await expect(assertPermission('reports.delete')).rejects.toThrow('forbidden')
  })

  it('[SEC-931-SRV-PERM-DENY] a viewer refused by requireViewer has no permission and role_permissions is not read', async () => {
    const { client, mockFrom } = adminClientReturning({ allowed: true })
    mockCreateAdminClient.mockReturnValue(client)
    const { hasPermission, assertPermission } = await import('@/lib/auth/permissions')

    for (const reason of ['unauthenticated', 'lookup_failed'] as const) {
      mockRequireViewer.mockResolvedValue({ ok: false, reason })
      await expect(hasPermission('reports.delete')).resolves.toBe(false)
      await expect(assertPermission('reports.delete')).rejects.toThrow('forbidden')
    }

    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('a viewer without a role has no permission and role_permissions is not read', async () => {
    mockRequireViewer.mockResolvedValue({ ok: true, userId: 'norole-1', role: null })
    const { client, mockFrom } = adminClientReturning({ allowed: true })
    mockCreateAdminClient.mockReturnValue(client)

    const { hasPermission } = await import('@/lib/auth/permissions')
    await expect(hasPermission('reports.delete')).resolves.toBe(false)

    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })
})
