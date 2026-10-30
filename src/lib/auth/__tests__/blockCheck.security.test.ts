// @vitest-environment node
/**
 * Security (Task 923 R44 (d), D26 / D27, R66 (k); kickoff §44 R95): the block check decides on the status row that the SERVICE ROLE reads by the caller's id.
 *  - SEC-X-SRV-BLOCKCHECK-NO-ROW: a person whose row is missing, deleted, or blocked without an end date is refused (`account_blocked`), whatever the person's own session
 *    could read; the read goes through the service-role client by id and never through the session client.
 *  - SEC-X-SRV-BLOCKCHECK-ACTIVE (the allow control): an active person passes, and so does a person whose suspension has ended, which is lifted by the
 *    compare-and-set write through the service-role client.
 * The REAL getBlockedError and the REAL accountAccess run. The session client, the service-role client and Supabase Auth are recording doubles: every call is stored
 * with the client that made it and the filters it carried. The doubles do not claim to test Postgres; the same rule is proven on the database by accessHardening.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Row { status: string; suspended_until: string | null; deleted_at: string | null }
const state = vi.hoisted(() => ({
  row: null as null | { status: string; suspended_until: string | null; deleted_at: string | null },
  sessionClientCalls: [] as string[],
  adminReads: [] as Array<{ table: string; columns: string; filters: Array<[string, unknown]> }>,
  adminUpdates: [] as Array<{ payload: Record<string, unknown>; filters: Array<[string, unknown]> }>,
  banCalls: [] as Array<{ id: unknown; attrs: unknown }>,
}))

// The session client must never be used by the block check: a use is recorded, and it answers an error so that a regression cannot pass by reading a row.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      state.sessionClientCalls.push(`from:${table}`)
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'session client used' } }) }) }) }
    },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        const filters: Array<[string, unknown]> = []
        const chain = {
          eq: (column: string, value: unknown) => { filters.push([column, value]); return chain },
          // a missing row answers an error and no data, as `.single()` does
          single: async () => {
            state.adminReads.push({ table, columns, filters: [...filters] })
            const snapshot = state.row ? { ...state.row } : null
            return { data: snapshot, error: snapshot ? null : { message: 'no row' } }
          },
        }
        return chain
      },
      // the UPDATE applies its filters to the CURRENT row, as a database does
      update: (payload: Record<string, unknown>) => {
        const filters: Array<[string, unknown]> = []
        const chain = {
          eq: (column: string, value: unknown) => { filters.push([column, value]); return chain },
          select: async () => {
            state.adminUpdates.push({ payload, filters: [...filters] })
            const row = state.row as Record<string, unknown> | null
            const matches = !!row && filters.every(([c, v]) => c === 'id' || row[c] === v)
            if (matches) Object.assign(row!, payload)
            return { data: matches ? [{ id: filters.find(([c]) => c === 'id')?.[1] }] : [], error: null }
          },
        }
        return chain
      },
    }),
    auth: { admin: { updateUserById: async (id: unknown, attrs: unknown) => { state.banCalls.push({ id, attrs }); return { data: {}, error: null } } } },
  }),
}))

import { getBlockedError } from '../blockCheck'

const ID = '7d1e5b0a-3c2f-4a96-8e4d-0b9a6c5f1e23'
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()
const setRow = (row: Row | null) => { state.row = row }

beforeEach(() => {
  state.row = null
  state.sessionClientCalls = []
  state.adminReads = []
  state.adminUpdates = []
  state.banCalls = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('blockCheck', () => {
  it('[SEC-X-SRV-BLOCKCHECK-NO-ROW] a missing or deleted row is no access', async () => {
    const refused: Array<[string, Row | null]> = [
      ['no status row', null],
      ['a deleted row that still says active', { status: 'active', suspended_until: null, deleted_at: '2026-10-01T00:00:00.000Z' }],
      ['blocked without an end date', { status: 'blocked', suspended_until: null, deleted_at: null }],
    ]
    for (const [who, row] of refused) {
      setRow(row)
      expect(await getBlockedError(ID), who).toBe('account_blocked')
    }
    // every answer came from a read by the service role, by the caller's id, of the three status columns; none went through the session client
    expect(state.adminReads).toEqual(refused.map(() => ({ table: 'users', columns: 'status, suspended_until, deleted_at', filters: [['id', ID]] })))
    expect(state.sessionClientCalls, 'the session client is never used for this read').toEqual([])
    // a refusal writes nothing and lifts no ban
    expect(state.adminUpdates).toEqual([])
    expect(state.banCalls).toEqual([])
  })

  it('[SEC-X-SRV-BLOCKCHECK-ACTIVE] an active account keeps its access', async () => {
    // the control: an active, live person passes, and nothing is written
    setRow({ status: 'active', suspended_until: null, deleted_at: null })
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.adminUpdates).toEqual([])
    expect(state.banCalls).toEqual([])

    // a person whose suspension has ended passes too: the lift is the compare-and-set write through the service role, then the Auth ban is lifted
    const ended = inMinutes(-5)
    setRow({ status: 'blocked', suspended_until: ended, deleted_at: null })
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.adminUpdates).toEqual([
      { payload: { status: 'active', suspended_until: null, block_reason: null }, filters: [['id', ID], ['status', 'blocked'], ['suspended_until', ended]] },
    ])
    expect(state.row).toMatchObject({ status: 'active', suspended_until: null, deleted_at: null, block_reason: null })
    expect(state.banCalls).toEqual([{ id: ID, attrs: { ban_duration: 'none' } }])

    // both answers were read through the service role by id, never through the session client
    expect(state.adminReads.map(read => read.filters)).toEqual([[['id', ID]], [['id', ID]]])
    expect(state.sessionClientCalls).toEqual([])
  })
})
