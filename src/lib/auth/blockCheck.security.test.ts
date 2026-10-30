/**
 * getBlockedError after owner decision D9 (2026-10-17): the automatic lift of an ended suspension also lifts the Auth ban, and a deactivated account counts
 * as blocked. The REAL getBlockedError and the REAL accountAccess run; the user-scoped client, the admin client and Supabase Auth are recording doubles that
 * state which client made which call.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Profile { status: string; suspended_until: string | null; deleted_at?: string | null }
const state = vi.hoisted(() => ({
  profile: null as null | { status: string; suspended_until: string | null; deleted_at?: string | null },
  userClientCalls: [] as string[],
  adminReads: [] as string[],
  adminUpdates: [] as Array<{ payload: Record<string, unknown>; id: unknown }>,
  adminUpdateError: null as null | { message: string },
  banCalls: [] as Array<{ id: unknown; attrs: unknown }>,
  order: [] as string[],
  /** the filters of each admin UPDATE, in call order (Task 923 R66 (k): the auto-lift is a compare-and-set) */
  updateFilters: [] as Array<Array<[string, unknown]>>,
  /** runs right after the profile read answered: stands for a staff write that lands between the read and the update */
  afterRead: null as null | (() => void),
}))

// The session client must never be used for this read (Task 923 R44 (d)): a use is recorded and the read answers nothing.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      state.userClientCalls.push(`from:${table}`)
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'session client used' } }) }) }) }
    },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({ eq: () => ({ single: async () => {
        state.adminReads.push(`${table}:${cols}`)
        const snapshot = state.profile ? { ...state.profile } : null      // what the caller read; a later change of the row does not change it
        state.afterRead?.()
        return { data: snapshot, error: snapshot ? null : { message: 'no row' } }
      } }) }),
      // the UPDATE applies its filters to the CURRENT row, as a database does: a row that no longer matches is not changed and is not returned
      update: (payload: Record<string, unknown>) => {
        const filters: Array<[string, unknown]> = []
        const run = (withRows: boolean) => {
          state.order.push('status')
          const id = filters.find(([c]) => c === 'id')?.[1]
          state.adminUpdates.push({ payload, id })
          state.updateFilters.push([...filters])
          if (state.adminUpdateError) return { data: null, error: state.adminUpdateError }
          const row = state.profile as Record<string, unknown> | null
          const matches = !!row && filters.every(([c, v]) => c === 'id' || row[c] === v)
          if (matches) Object.assign(row!, payload)
          return { data: withRows ? (matches ? [{ id }] : []) : null, error: null }
        }
        const chain = {
          eq: (column: string, value: unknown) => { filters.push([column, value]); return chain },
          select: async () => run(true),
          then: (resolve: (value: unknown) => unknown) => resolve(run(false)),
        }
        return chain
      },
    }),
    auth: { admin: { updateUserById: async (id: unknown, attrs: unknown) => { state.order.push('ban'); state.banCalls.push({ id, attrs }); return { data: {}, error: null } } } },
  }),
}))

import { getBlockedError } from './blockCheck'

const ID = '3f2b1c0e-8a4d-4e6f-9b1a-2c3d4e5f6a7b'
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()
const setProfile = (p: Profile | null) => { state.profile = p }

beforeEach(() => {
  state.profile = null; state.userClientCalls = []; state.adminReads = []; state.adminUpdates = []; state.banCalls = []; state.order = []; state.adminUpdateError = null
  state.updateFilters = []; state.afterRead = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('automatic lifting of an ended suspension', () => {
  it('[SEC-D9-SRV-LIFT-ALLOW] the automatic lift of an ended suspension also lifts the ban', async () => {
    setProfile({ status: 'blocked', suspended_until: inMinutes(-5) })
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.adminUpdates).toEqual([{ payload: { status: 'active', suspended_until: null, block_reason: null }, id: ID }])
    expect(state.banCalls).toEqual([{ id: ID, attrs: { ban_duration: 'none' } }])
    expect(state.order).toEqual(['status', 'ban'])         // the status is saved first, then the ban follows
  })

  it('a suspension that has not ended stays a suspension: nothing is written and nothing is lifted', async () => {
    setProfile({ status: 'blocked', suspended_until: inMinutes(30) })
    expect(await getBlockedError(ID)).toBe('account_suspended')
    expect(state.adminUpdates).toEqual([])
    expect(state.banCalls).toEqual([])
  })

  it('a permanent block and a deactivated account are blocked; an active account is not', async () => {
    setProfile({ status: 'blocked', suspended_until: null })
    expect(await getBlockedError(ID)).toBe('account_blocked')
    setProfile({ status: 'inactive', suspended_until: null })
    expect(await getBlockedError(ID)).toBe('account_blocked')
    setProfile({ status: 'inactive', suspended_until: inMinutes(-5) })
    expect(await getBlockedError(ID)).toBe('account_blocked')          // a date does not revive a deactivated account
    setProfile({ status: 'active', suspended_until: null })
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.adminUpdates).toEqual([])
    expect(state.banCalls).toEqual([])
  })

  it('when the status cannot be saved the ban is not lifted', async () => {
    setProfile({ status: 'blocked', suspended_until: inMinutes(-5) })
    state.adminUpdateError = { message: 'write refused' }
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.banCalls).toEqual([])
  })
})

// Task 923 R66 (k): the auto-lift is a compare-and-set.
describe('blockCheck', () => {
  it('[SEC-X-SRV-AUTOLIFT-CAS] a block written after the read survives the auto-lift', async () => {
    const ended = inMinutes(-5)
    // staff block the person for good between the read (an ended suspension) and the lift
    setProfile({ status: 'blocked', suspended_until: ended })
    state.afterRead = () => { state.profile = { status: 'blocked', suspended_until: null } }
    expect(await getBlockedError(ID)).toBe('account_blocked')
    expect(state.banCalls).toEqual([])                                           // no Auth unban
    expect(state.profile).toMatchObject({ status: 'blocked', suspended_until: null })   // the newer block stands: not erased, status not active
    // the write carried the compare-and-set: the id, the status that was read and the end date that was read
    expect(state.updateFilters).toEqual([[['id', ID], ['status', 'blocked'], ['suspended_until', ended]]])
    // a new, later suspension written after the read survives as well
    const later = inMinutes(60)
    state.afterRead = () => { state.profile = { status: 'blocked', suspended_until: later } }
    setProfile({ status: 'blocked', suspended_until: ended })
    expect(await getBlockedError(ID)).toBe('account_blocked')
    expect(state.profile).toMatchObject({ status: 'blocked', suspended_until: later })
    expect(state.banCalls).toEqual([])
  })

  it('an ended suspension that nobody changed is still lifted, once, with the ban (the control)', async () => {
    setProfile({ status: 'blocked', suspended_until: inMinutes(-5) })
    expect(await getBlockedError(ID)).toBeNull()
    expect(state.profile).toMatchObject({ status: 'active', suspended_until: null })
    expect(state.banCalls).toEqual([{ id: ID, attrs: { ban_duration: 'none' } }])
    expect(state.updateFilters).toHaveLength(1)
  })
})

// Task 923 R44 (d), D26 / D27: the status is read through the service role by the caller's id, and no readable row, or a deleted one, is no access.
it('[SEC-D9-SRV-MISSING-DENY] The block check reads the status through the service role, and a missing profile row means no access', async () => {
  setProfile(null)
  expect(await getBlockedError(ID)).toBe('account_blocked')
  setProfile({ status: 'active', suspended_until: null, deleted_at: new Date().toISOString() })
  expect(await getBlockedError(ID)).toBe('account_blocked')           // a deleted profile is blocked even though its status says active
  setProfile({ status: 'active', suspended_until: null, deleted_at: null })
  expect(await getBlockedError(ID)).toBeNull()                         // the control: a live, active profile still passes
  expect(state.adminReads).toEqual(['users:status, suspended_until, deleted_at', 'users:status, suspended_until, deleted_at', 'users:status, suspended_until, deleted_at'])
  expect(state.userClientCalls).toEqual([])                            // the session client is never used for this read
  expect(state.adminUpdates).toEqual([])
  expect(state.banCalls).toEqual([])
})
