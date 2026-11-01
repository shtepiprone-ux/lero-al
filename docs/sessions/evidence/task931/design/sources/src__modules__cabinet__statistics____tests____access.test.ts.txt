/**
 * Agent statistics access gate — Task 848 (R1, AC1).
 *
 * The session and the role lookup are mocked; the gate itself is real. `admin` and `moderator` are
 * `not_agent` (D78-3: the gate reads `role`, and only `agent` passes).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const roleLookup = vi.hoisted(() => ({
  respond: (() => ({ data: null, error: null })) as () => { data: unknown; error: { code?: string } | null },
  seen: [] as Array<{ table: string; columns: string; eq: unknown[] }>,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        const seen = { table, columns, eq: [] as unknown[] }
        roleLookup.seen.push(seen)
        const builder = {
          eq: (...args: unknown[]) => {
            seen.eq = args
            return builder
          },
          single: async () => roleLookup.respond(),
        }
        return builder
      },
    }),
  }),
}))

const { getAgentStatisticsAccess } = await import('../access')

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  mockGetUser.mockReset()
  roleLookup.seen = []
  roleLookup.respond = () => ({ data: null, error: null })
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

function signInAs(role: string) {
  mockGetUser.mockResolvedValue({ id: 'session-user-1' })
  roleLookup.respond = () => ({ data: { role }, error: null })
}

describe('getAgentStatisticsAccess', () => {
  it('guest -> unauthenticated, and no role lookup is made', async () => {
    mockGetUser.mockResolvedValue(null)
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'unauthenticated' })
    expect(roleLookup.seen).toEqual([])
  })

  it.each(['user', 'admin', 'moderator'])('role %s -> not_agent', async (role) => {
    signInAs(role)
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })

  it('role agent -> ok with the session user id', async () => {
    signInAs('agent')
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'ok', ownerId: 'session-user-1' })
  })

  it('reads the role of the session user only', async () => {
    signInAs('agent')
    await getAgentStatisticsAccess()
    expect(roleLookup.seen).toEqual([{ table: 'users', columns: 'role', eq: ['id', 'session-user-1'] }])
  })

  it('a role lookup error is denied (not_agent), never granted', async () => {
    mockGetUser.mockResolvedValue({ id: 'session-user-1' })
    roleLookup.respond = () => ({ data: null, error: { code: 'PGRST116' } })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
    expect(errorSpy).toHaveBeenCalledWith('[AgentStatistics] access failed', { code: 'PGRST116' })
  })

  it('a missing profile row is not_agent', async () => {
    mockGetUser.mockResolvedValue({ id: 'session-user-1' })
    roleLookup.respond = () => ({ data: null, error: null })
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })

  it('a thrown lookup is denied (not_agent)', async () => {
    mockGetUser.mockResolvedValue({ id: 'session-user-1' })
    roleLookup.respond = () => {
      throw new Error('network')
    }
    expect(await getAgentStatisticsAccess()).toEqual({ kind: 'not_agent' })
  })
})
