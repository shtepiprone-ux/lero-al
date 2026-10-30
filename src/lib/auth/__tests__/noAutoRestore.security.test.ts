// @vitest-environment node
/**
 * Security (Task 923 R77 (e), owner decision D58): a person's return does not restore a marked account.
 *  - SEC-X-SRV-NO-AUTO-RESTORE: the REAL presence route runs against a recording database. A person whose account carries the inactivity mark (deactivated and deleted by the
 *    job within the last 90 days) pings with a live session: the answer is 401, nothing is written (`deleted_at` not cleared, the status not set to active, no history row,
 *    no restore RPC). An ordinary active account still gets its `last_seen_at` refreshed and the reminder mark cleared.
 * The session source is a double; `requireViewer` is the real one. Every id is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  sessionUserId: null as string | null,
  profile: null as null | { role: string; status: string; suspended_until: string | null; deleted_at: string | null },
  lookupFails: false,
  writes: [] as Array<{ table: string; op: string; values?: unknown }>,
  rpcs: [] as string[],
}))

vi.mock('@/lib/auth/server', () => ({ getUser: async () => (state.sessionUserId ? { id: state.sessionUserId } : null) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.sessionUserId ? { id: state.sessionUserId } : null } }) } }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = () => chain
      chain.or = () => chain
      chain.single = async () => ({ data: state.profile, error: null })
      chain.maybeSingle = async () => (state.lookupFails ? { data: null, error: { message: 'down' } } : { data: state.profile, error: null })
      chain.update = (values: unknown) => { state.writes.push({ table, op: 'update', values }); return chain }
      chain.insert = async (values: unknown) => { state.writes.push({ table, op: 'insert', values }); return { error: null } }
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
      return chain
    },
    rpc: async (name: string) => { state.rpcs.push(name); return { data: null, error: null } },
  }),
}))

import { POST } from '@/app/api/presence/route'

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  state.sessionUserId = 'person-1'
  state.profile = null
  state.lookupFails = false
  state.writes = []
  state.rpcs = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('noAutoRestore', () => {
  it('[SEC-X-SRV-NO-AUTO-RESTORE] a return does not restore a marked account', async () => {
    // marked by the inactivity job two days ago: deleted, status inactive
    state.profile = { role: 'user', status: 'inactive', suspended_until: null, deleted_at: new Date(Date.now() - 2 * DAY).toISOString() }
    const res = await POST()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ ok: false })
    expect(state.writes).toEqual([])                        // deleted_at not cleared, status not set to active, no history row
    expect(state.rpcs).toEqual([])                          // no restore RPC
    // the same for a marked account outside the old 90-day window, and for one that is only deactivated
    state.profile = { role: 'user', status: 'inactive', suspended_until: null, deleted_at: new Date(Date.now() - 200 * DAY).toISOString() }
    expect((await POST()).status).toBe(401)
    state.profile = { role: 'user', status: 'inactive', suspended_until: null, deleted_at: null }
    expect((await POST()).status).toBe(401)
    expect(state.writes).toEqual([])
    expect(state.rpcs).toEqual([])
  })

  it('a guest gets 401, a failed lookup 503, and neither writes anything', async () => {
    state.sessionUserId = null
    expect((await POST()).status).toBe(401)
    state.sessionUserId = 'person-1'
    state.lookupFails = true
    expect((await POST()).status).toBe(503)
    expect(state.writes).toEqual([])
  })

  it('an ordinary active account still refreshes its last visit and clears the reminder mark (the control)', async () => {
    state.profile = { role: 'user', status: 'active', suspended_until: null, deleted_at: null }
    const res = await POST()
    expect(res.status).toBe(200)
    expect(state.writes).toHaveLength(1)
    expect(state.writes[0]).toMatchObject({ table: 'users', op: 'update', values: { inactivity_warning_sent_at: null } })
    expect(typeof (state.writes[0].values as { last_seen_at: string }).last_seen_at).toBe('string')
  })
})
