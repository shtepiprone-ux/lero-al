// @vitest-environment node
/**
 * Security (Task 923 R71 (c)): a staff write never reports success when the database refused it.
 *  - SEC-X-SRV-STAFF-WRITE-RESULT: updateUserProfile and toggleUserVerified used to log a refused write and return an empty success, and the staff listing delete returned
 *    nothing on a failure; a failed write is now `update_failed` / `delete_failed`. An audit row whose insert fails is logged with the ids (a PostgREST error is returned,
 *    never thrown, so the old try / catch around the insert never saw it).
 * The permission helpers, requireViewer and the actions are the real ones; only the database is the in-memory one, with an injected write failure.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
/** `<table>:<op>` pairs whose terminal call returns this error instead of touching the in-memory table */
const failing = new Map<string, { message: string; code?: string }>()
const errorLogs: unknown[][] = []

function adminFrom(table: string) {
  const chain = db.from(table) as Record<string, (...a: unknown[]) => unknown>
  let op = 'select'
  const proxy: Record<string, unknown> = new Proxy(chain, {
    get: (target, prop: string) => {
      const value = target[prop]
      if (typeof value !== 'function') return value
      // the fake database does not report the rows a DELETE removed, and the staff listing delete now requires exactly one (R71 (g)): this answers what PostgREST does
      if (table === 'listings' && prop === 'delete') {
        return () => ({
          eq: (column: string, id: unknown) => ({
            select: async () => {
              const f = failing.get('listings:delete')
              if (f) return { data: null, error: f }
              const removed = db.tables.listings.filter((l) => l[column] === id).map((l) => ({ id: l.id }))
              db.tables.listings = db.tables.listings.filter((l) => l[column] !== id)
              return { data: removed, error: null }
            },
          }),
        })
      }
      const fault = () => failing.get(`${table}:${op}`) ?? null
      if (prop === 'then') return (resolve: (v: unknown) => void) => { const f = fault(); return f ? resolve({ data: null, error: f }) : (value as (r: unknown) => unknown).call(target, resolve) }
      if (prop === 'single' || prop === 'maybeSingle') return () => { const f = fault(); return f ? Promise.resolve({ data: null, error: f }) : (value as () => unknown).call(target) }
      return (...args: unknown[]) => {
        if (['insert', 'update', 'upsert', 'delete'].includes(prop)) op = prop
        const result = (value as (...a: unknown[]) => unknown).apply(target, args)
        return result === target ? proxy : result
      }
    },
  })
  return proxy
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => adminFrom(t), auth: { admin: {} } }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { deactivateUser, deleteListing, reactivateUser, toggleUserVerified, updateUserProfile, updateUserProfileFull } from '../index'

const user = (id: string) => db.tables.users.find((u) => u.id === id)!

beforeEach(() => {
  db = createFakeDb({
    users: [
      { id: 'adm', role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: 'tgt', role: 'user', user_type: 'private', name: 'Target', status: 'active', is_verified: false, phone: '+355690000000' },
    ],
    role_permissions: [],
    listings: [{ id: 'l1', user_id: 'tgt', slug: 'one', status: 'active' }],
  })
  currentUser = { id: 'adm' }
  failing.clear()
  errorLogs.length = 0
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { errorLogs.push(args) })
})

describe('adminResults', () => {
  it('[SEC-X-SRV-STAFF-WRITE-RESULT] a failed staff write is reported', async () => {
    failing.set('users:update', { message: 'permission denied for table users', code: '42501' })
    expect(await updateUserProfile('tgt', { name: 'New' })).toEqual({ error: 'update_failed' })
    expect(await toggleUserVerified('tgt', true)).toEqual({ error: 'update_failed' })
    expect(user('tgt')).toMatchObject({ name: 'Target', is_verified: false })
    failing.delete('users:update')
    failing.set('listings:delete', { message: 'permission denied for table listings', code: '42501' })
    expect(await deleteListing('l1')).toEqual({ error: 'delete_failed' })
    expect(db.tables.listings).toHaveLength(1)
    // the database's own message stays in the server log and never reaches the answer
    expect(JSON.stringify([await updateUserProfile('tgt', { name: 'New' }), await deleteListing('l1')])).not.toContain('permission denied')
    failing.clear()
    // the controls: the same writes succeed when the database accepts them
    expect(await updateUserProfile('tgt', { name: 'New' })).toEqual({})
    expect(await toggleUserVerified('tgt', true)).toEqual({})
    expect(await deleteListing('l1')).toEqual({})
    expect(user('tgt')).toMatchObject({ name: 'New', is_verified: true })
    expect(db.tables.listings).toHaveLength(0)
  })

  it('a failed audit insert is logged with the ids and the status change it follows still stands', async () => {
    failing.set('user_status_history:insert', { message: 'permission denied for table user_status_history', code: '42501' })
    const FULL = { firstName: 'Ana', profileType: 'private' as const, phone: '+355691234567', locationId: 1 }
    expect(await deactivateUser('tgt', 'spam')).toEqual({})
    expect(await reactivateUser('tgt', 'sorted')).toEqual({})
    expect(await updateUserProfileFull('tgt', { ...FULL, status: 'blocked', blockReason: 'x' })).toEqual({})
    expect(user('tgt').status).toBe('blocked')
    const historyLogs = errorLogs.filter((a) => /user_status_history insert failed/.test(String(a[0])))
    expect(historyLogs).toHaveLength(3)
    for (const entry of historyLogs) expect(entry[1]).toMatchObject({ userId: 'tgt', changedBy: 'adm', code: '42501' })
    expect(JSON.stringify(historyLogs)).not.toContain('permission denied for table')
    expect(db.tables.user_status_history ?? []).toEqual([])
  })

  it('a failed profile-type log insert is logged with the ids, never swallowed', async () => {
    failing.set('user_change_log:insert', { message: 'boom', code: '23505' })
    const res = await updateUserProfileFull('tgt', { firstName: 'Ana', profileType: 'agent', phone: '+355691234567', locationId: 1, status: 'active' })
    expect(res).toEqual({})
    expect(user('tgt')).toMatchObject({ role: 'agent' })
    const logs = errorLogs.filter((a) => /user_change_log insert failed/.test(String(a[0])))
    expect(logs).toHaveLength(1)
    expect(logs[0][1]).toMatchObject({ userId: 'tgt', changedBy: 'adm', code: '23505' })
  })
})
