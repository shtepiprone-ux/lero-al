// @vitest-environment node
/**
 * Task 923 R44 (owner decisions D25, D26, D27): who counts as a viewer, whatever the role. A blocked, suspended, deactivated, deleted or missing account of ANY
 * role (user, agent, moderator, administrator) is not a viewer, and `getBlockedError` agrees with it (a deleted account is blocked). An active account is a viewer, and its
 * role comes back from the SAME query (no second role read). The REAL `requireViewer`, `getBlockedError` and `accountHasAccess` run; only `getUser` and the database are
 * doubles, and the database double records the read.
 */
import { beforeEach, expect, it, vi } from 'vitest'

type Row = { role: string; status: string; suspended_until: string | null; deleted_at: string | null }
const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  row: null as null | Record<string, unknown>,
  readError: false,
  reads: [] as string[],
  writes: [] as string[],
}))

vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: () => {
          const answer = async () => {
            state.reads.push(`${table}:${cols}`)
            if (state.readError) throw new Error('database down')
            return { data: state.row, error: state.row ? null : { message: 'no row', code: 'PGRST116' } }
          }
          return { maybeSingle: async () => { const r = await answer(); return { data: r.data, error: r.error && r.data === null && state.row === null ? null : r.error } }, single: answer }
        },
      }),
      update: () => ({ eq: async () => { state.writes.push(`${table}:update`); return { error: null } } }),
    }),
    auth: { admin: { updateUserById: async () => { state.writes.push('auth:update'); return { data: {}, error: null } } } },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => { throw new Error('the session client must not be used') } }))

import { requireViewer } from './requireViewer'
import { getBlockedError } from './blockCheck'

const ID = '3f2b1c0e-8a4d-4e6f-9b1a-2c3d4e5f6a7b'
const future = () => new Date(Date.now() + 3_600_000).toISOString()
const past = () => new Date(Date.now() - 3_600_000).toISOString()
const ROLES = ['user', 'agent', 'moderator', 'admin'] as const
const profile = (role: string, extra: Partial<Row> = {}): Row => ({ role, status: 'active', suspended_until: null, deleted_at: null, ...extra })

beforeEach(() => {
  state.user = { id: ID }; state.row = null; state.readError = false; state.reads = []; state.writes = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

it('[SEC-D27-SRV-VIEWER-DENY] A blocked, suspended, deactivated, deleted or missing account of any role is not a viewer, and a deleted one is blocked', async () => {
  const states: [string, Partial<Row> | null, string | null][] = [
    ['deleted', { deleted_at: '2026-10-01T00:00:00Z' }, 'account_blocked'],
    ['blocked permanently', { status: 'blocked', suspended_until: null }, 'account_blocked'],
    ['blocked until a future date', { status: 'blocked', suspended_until: future() }, 'account_suspended'],
    ['inactive', { status: 'inactive' }, 'account_blocked'],
    ['no row', null, 'account_blocked'],
  ]
  for (const role of ROLES) {
    for (const [label, extra, blocked] of states) {
      state.row = extra === null ? null : profile(role, extra)
      const viewer = await requireViewer()
      expect(viewer.ok, `${role} ${label}: requireViewer`).toBe(false)
      expect(await getBlockedError(ID), `${role} ${label}: getBlockedError`).toBe(blocked)
    }
  }
  expect(state.writes, 'a refusal writes nothing (an ended suspension lifts only in the allow case)').toEqual([])
})

it('[SEC-D27-SRV-VIEWER-ALLOW] A blocked, suspended, deactivated, deleted or missing account of any role is not a viewer, and a deleted one is blocked', async () => {
  for (const role of ROLES) {
    state.reads = []
    state.row = profile(role)
    expect(await requireViewer(), role).toEqual({ ok: true, userId: ID, role })
    // the role comes back from the same single query as the status, never from a second read
    expect(state.reads, role).toEqual(['users:role, status, suspended_until, deleted_at'])
  }
  // a suspension that has ended is access again
  state.row = profile('moderator', { status: 'blocked', suspended_until: past() })
  expect(await requireViewer()).toEqual({ ok: true, userId: ID, role: 'moderator' })
})

it('a guest is unauthenticated and a failed read is lookup_failed, never a viewer', async () => {
  state.user = null
  expect(await requireViewer()).toEqual({ ok: false, reason: 'unauthenticated' })
  expect(state.reads).toEqual([])
  state.user = { id: ID }; state.readError = true
  expect(await requireViewer()).toEqual({ ok: false, reason: 'lookup_failed' })
})
