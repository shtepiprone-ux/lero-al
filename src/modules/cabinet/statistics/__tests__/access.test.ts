/**
 * Agent statistics access gate — Task 848 (R1, AC1), brought onto the viewer contract by Task 931 (R7).
 *
 * The viewer boundary (`requireViewer`) is a double; the gate itself is real. The role comes from `requireViewer()`
 * (Task 923 R44): `admin` and `moderator` are `not_agent` (D78-3: only `agent` passes), a lookup that failed is denied
 * (`not_agent`), and a missing, blocked or deleted profile is `unauthenticated`. The module reads no role of its own.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireViewer = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: (...args: unknown[]) => mockRequireViewer(...args),
}))

// Any database read the gate made on its own would be seen here: the gate must make none (the viewer carries the role).
const ownReads = vi.hoisted(() => [] as string[])
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      ownReads.push(`server:${table}`)
      throw new Error('the access gate must not read the database itself')
    },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      ownReads.push(`admin:${table}`)
      throw new Error('the access gate must not read the database itself')
    },
  }),
}))

const { getAgentStatisticsAccess } = await import('../access')

beforeEach(() => {
  mockRequireViewer.mockReset()
  ownReads.length = 0
})

function signInAs(role: string | null) {
  mockRequireViewer.mockResolvedValue({ ok: true, userId: 'session-user-1', role })
}

describe('getAgentStatisticsAccess', () => {
  it('guest -> unauthenticated, and no role lookup is made', async () => {
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'unauthenticated' })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'unauthenticated' })
    expect(ownReads).toEqual([])
  })

  it.each(['user', 'admin', 'moderator', null])('role %s -> not_agent', async (role) => {
    signInAs(role)
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })

  it('[SEC-931-SRV-STATS-ALLOW] role agent -> ok with the session user id', async () => {
    signInAs('agent')
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'ok', ownerId: 'session-user-1' })
  })

  it('takes the role from requireViewer and makes no role read of its own', async () => {
    signInAs('agent')
    await getAgentStatisticsAccess()
    expect(mockRequireViewer).toHaveBeenCalledTimes(1)
    expect(ownReads).toEqual([])
  })

  it('[SEC-931-SRV-STATS-DENY] a role lookup error is denied (not_agent), never granted', async () => {
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'lookup_failed' })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })

  it('a missing or deleted profile is unauthenticated', async () => {
    // requireViewer answers `unauthenticated` for a missing, deleted or blocked profile (Task 923 R44)
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'unauthenticated' })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'unauthenticated' })
  })

  it('a thrown lookup is denied (not_agent)', async () => {
    // requireViewer turns a thrown session or profile lookup into `lookup_failed`; the gate maps that to a denial
    mockRequireViewer.mockResolvedValue({ ok: false, reason: 'lookup_failed' })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })
})
