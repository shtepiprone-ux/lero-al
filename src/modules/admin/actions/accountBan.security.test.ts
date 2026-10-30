// @vitest-environment node
/**
 * Owner decision D9 (2026-10-17): a blocked account has no access. The admin actions that change an account's status save it FIRST (so the database already
 * refuses the account's writes) and then ban it in Supabase Auth. The REAL actions, the REAL permission helpers and the REAL accountAccess run; the database
 * is the in-memory one and Supabase Auth is a recording double that also records the status the row had at the moment of the call. The real-Auth control is
 * accountBan.integration.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let failUsersUpdate = false
let authFails = false
const banCalls: Array<{ id: unknown; attrs: unknown; statusAtCall: unknown }> = []

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const real = db.client.from(table)
      if (table !== 'users' || !failUsersUpdate) return real
      // the one failure this suite injects: the status write is refused
      return { select: (...a: unknown[]) => (real.select as (...x: unknown[]) => unknown)(...a), insert: (...a: unknown[]) => (real.insert as (...x: unknown[]) => unknown)(...a), update: () => ({ eq: async () => ({ error: { message: 'write refused' } }) }) }
    },
    auth: {
      admin: {
        updateUserById: async (id: unknown, attrs: unknown) => {
          banCalls.push({ id, attrs, statusAtCall: db.tables.users.find((u) => u.id === id)?.status })
          return authFails ? { data: null, error: { status: 500, message: 'auth down' } } : { data: {}, error: null }
        },
      },
    },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { deactivateUser, reactivateUser, updateUserProfileFull } from './index'

const TARGET = '3f2b1c0e-8a4d-4e6f-9b1a-2c3d4e5f6a7b'
const ADMIN2 = '7a1c9d3e-5b2f-4c8a-9e0d-1f2a3b4c5d6e'
const OTHER_ADMIN = '9d8c7b6a-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const FULL = { firstName: 'Ana', profileType: 'private' as const, phone: '+355691234567', locationId: 1 }
const row = (id: string) => db.tables.users.find((u) => u.id === id)!
const historyInserts = () => db.log.filter((l) => l.table === 'user_status_history' && l.op === 'insert')

beforeEach(() => {
  db = createFakeDb({
    users: [
      { id: 'adm', role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: ADMIN2, role: 'admin', user_type: 'private', name: 'Admin Two', status: 'active' },
      { id: OTHER_ADMIN, role: 'admin', user_type: 'private', name: 'Admin Three', status: 'active' },
      { id: 'mod', role: 'moderator', user_type: 'private', name: 'Mod', status: 'active' },
      { id: 'plain', role: 'user', user_type: 'private', name: 'Plain', status: 'active' },
      { id: TARGET, role: 'user', user_type: 'private', name: 'Target', status: 'active', phone: '+355690000000' },
    ],
    role_permissions: [{ role: 'moderator', permission_key: 'users.soft_delete', allowed: true }, { role: 'moderator', permission_key: 'users.change_role', allowed: true }],
    user_status_history: [],
    locations: [{ id: 1, name_al: 'Tirana', type: 'city', slug: 'tirana' }],
  })
  currentUser = { id: 'adm' }
  failUsersUpdate = false
  authFails = false
  banCalls.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('admin actions that change account access', () => {
  it('[SEC-D9-SRV-ADMIN-DENY] a caller without permission, or acting on a higher rank, changes nothing and bans nobody', async () => {
    const before = JSON.stringify(db.tables.users)
    const attempts: Array<[string, () => Promise<unknown>]> = []
    const asCaller = (id: string | null) => { currentUser = id ? { id } : null }

    asCaller(null)
    attempts.push(['anonymous block', async () => { asCaller(null); return updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'x' }) }])
    attempts.push(['anonymous deactivate', async () => { asCaller(null); return deactivateUser(TARGET, 'x') }])
    attempts.push(['anonymous reactivate', async () => { asCaller(null); return reactivateUser(TARGET, 'x') }])
    attempts.push(['plain user block', async () => { asCaller('plain'); return updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'x' }) }])
    attempts.push(['plain user deactivate', async () => { asCaller('plain'); return deactivateUser(TARGET, 'x') }])
    attempts.push(['moderator blocks an administrator', async () => { asCaller('mod'); return updateUserProfileFull(ADMIN2, { ...FULL, status: 'blocked', blockReason: 'x' }) }])
    attempts.push(['moderator deactivates an administrator', async () => { asCaller('mod'); return deactivateUser(ADMIN2, 'x') }])
    attempts.push(['moderator without the permission deactivates a user', async () => {
      asCaller('mod'); db.tables.role_permissions = db.tables.role_permissions.filter((p) => p.permission_key !== 'users.soft_delete'); return deactivateUser(TARGET, 'x')
    }])
    attempts.push(['an administrator blocks themselves', async () => { asCaller('adm'); return updateUserProfileFull('adm', { ...FULL, status: 'blocked', blockReason: 'x' }) }])
    attempts.push(['an administrator deactivates themselves', async () => { asCaller('adm'); return deactivateUser('adm', 'x') }])
    attempts.push(['an invalid status', async () => { asCaller('adm'); return updateUserProfileFull(TARGET, { ...FULL, status: 'banned' as never }) }])

    const answers: Record<string, unknown> = {}
    for (const [name, run] of attempts) answers[name] = await run()
    // every attempt is refused with one of the actions' documented refusals; an attempt that succeeded has no error at all and is named in the failure
    for (const [name, answer] of Object.entries(answers)) expect(['Unauthorized', 'Forbidden', 'forbidden', 'invalid_status'], `${name} -> ${JSON.stringify(answer)}`).toContain((answer as { error?: string }).error)

    expect(banCalls).toEqual([])
    expect(JSON.stringify(db.tables.users)).toBe(before)
    expect(historyInserts()).toEqual([])
  })

  it('[SEC-D9-SRV-ADMIN-ALLOW] blocking or deactivating bans the account after the status is saved, and unblocking lifts the ban', async () => {
    // permanent block by an administrator
    expect(await updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'fraud' })).toEqual({})
    expect(row(TARGET)).toMatchObject({ status: 'blocked', block_reason: 'fraud', suspended_until: null })
    expect(banCalls).toEqual([{ id: TARGET, attrs: { ban_duration: '876000h' }, statusAtCall: 'blocked' }])     // saved first, then banned

    // unblock
    banCalls.length = 0
    expect(await updateUserProfileFull(TARGET, { ...FULL, status: 'active' })).toEqual({})
    expect(row(TARGET)).toMatchObject({ status: 'active', block_reason: null, suspended_until: null })
    expect(banCalls).toEqual([{ id: TARGET, attrs: { ban_duration: 'none' }, statusAtCall: 'active' }])

    // dated suspension: the ban lasts as long as the suspension (rounded up to the minute)
    banCalls.length = 0
    const until = new Date(Date.now() + 2 * 3600_000).toISOString()
    expect(await updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'spam', suspendedUntil: until })).toEqual({})
    expect(banCalls).toHaveLength(1)
    const minutes = Number(String((banCalls[0].attrs as { ban_duration: string }).ban_duration).replace('m', ''))
    expect(minutes).toBeGreaterThanOrEqual(119)
    expect(minutes).toBeLessThanOrEqual(121)

    // deactivate / reactivate by a moderator who holds the permission
    banCalls.length = 0
    currentUser = { id: 'mod' }
    expect(await deactivateUser(TARGET, 'left the company')).toEqual({})
    expect(row(TARGET).status).toBe('inactive')
    expect(banCalls).toEqual([{ id: TARGET, attrs: { ban_duration: '876000h' }, statusAtCall: 'inactive' }])
    banCalls.length = 0
    expect(await reactivateUser(TARGET, 'came back')).toEqual({})
    expect(row(TARGET).status).toBe('active')
    expect(banCalls).toEqual([{ id: TARGET, attrs: { ban_duration: 'none' }, statusAtCall: 'active' }])
    expect(historyInserts().length).toBeGreaterThanOrEqual(3)
  })

  it('[SEC-D9-SRV-ADMIN-ERR] a failed ban is reported to the admin and a failed status write is not followed by a ban', async () => {
    // the status cannot be saved: nothing else happens
    failUsersUpdate = true
    expect(await updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'x' })).toEqual({ error: 'update_failed' })
    expect(await deactivateUser(TARGET, 'x')).toEqual({ error: 'update_failed' })
    expect(banCalls).toEqual([])
    expect(row(TARGET).status).toBe('active')
    failUsersUpdate = false

    // the status is saved but Auth refuses: the administrator is told, and the saved status is not rolled back (the database already refuses the account)
    authFails = true
    expect(await updateUserProfileFull(TARGET, { ...FULL, status: 'blocked', blockReason: 'x' })).toEqual({ error: 'access_sync_failed' })
    expect(row(TARGET).status).toBe('blocked')
    expect(banCalls).toHaveLength(1)
    banCalls.length = 0
    currentUser = { id: 'mod' }
    expect(await deactivateUser(OTHER_ADMIN, 'x')).toEqual({ error: 'forbidden' })        // rank still wins over everything
    expect(await reactivateUser(TARGET, 'x')).toEqual({ error: 'access_sync_failed' })
    expect(row(TARGET).status).toBe('active')
  })
})
