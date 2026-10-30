// @vitest-environment node
/**
 * Security (Task 923 R66 (a), R71 (h)): who may act on whose account.
 *  - SEC-X-SRV-RANK-FAILCLOSED: when the target's rank cannot be read (the read fails, or the target has no row) every staff action on the account is refused. The rank check
 *    used to ignore the read's error, so an empty answer counted as "not an administrator" and a moderator could act on an administrator.
 *  - SEC-X-SRV-SELF-DELETE: a staff member cannot delete their own account from the admin panel (the rank rule passes for an administrator's own id).
 * The permission helpers, requireViewer and the actions are the real ones; only the database is the in-memory one, with an injected read failure where a case needs one.
 * `deleteAccount` (Task 923 R141) is a recording double: its own cases are in `src/lib/account/deleteAccount.security.test.ts`; here it proves whether the action reached it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

type FakeDb = ReturnType<typeof createFakeDb>
let db = createFakeDb()
let currentUser: { id: string } | null = null
/** when set, the `users` read that names the actor and the target together (`.in('id', [...])`, the rank read) fails with this error */
let rankReadError: { message: string; code?: string } | null = null
const authAdminCalls: { name: string; args: unknown[] }[] = []
const transitions: { id: string; role: string | null }[] = []
const deletions: { userId: string; reason: string }[] = []

function adminFrom(table: string) {
  const chain = db.from(table) as Record<string, (...a: unknown[]) => unknown>
  let usedIn = false
  const proxy: Record<string, unknown> = new Proxy(chain, {
    get: (target, prop: string) => {
      const value = target[prop]
      if (typeof value !== 'function') return value
      const fails = () => rankReadError !== null && table === 'users' && usedIn
      if (prop === 'then') return (resolve: (v: unknown) => void) => (fails() ? resolve({ data: null, error: rankReadError }) : (value as (r: unknown) => unknown).call(target, resolve))
      if (prop === 'single' || prop === 'maybeSingle') return () => (fails() ? Promise.resolve({ data: null, error: rankReadError }) : (value as () => unknown).call(target))
      return (...args: unknown[]) => {
        if (prop === 'in') usedIn = true
        const result = (value as (...a: unknown[]) => unknown).apply(target, args)
        return result === target ? proxy : result
      }
    },
  })
  return proxy
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => adminFrom(t),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => { authAdminCalls.push({ name, args }); return { data: { user: { id: 'new-auth-user' } }, error: null } } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async (id: string, _s: string, actor: { role: string | null }) => { transitions.push({ id, role: actor.role }); return { ok: true } } }))
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string, options: { reason: string }) => { deletions.push({ userId, reason: options.reason }); return { ok: true, filesNotRemoved: 0 } } }))

import { deactivateUser, hardDeleteUser, reactivateUser, removeUserAvatar, toggleUserVerified, updateUserProfile, updateUserProfileFull } from '../index'

const PERMISSIONS = ['users.create', 'users.change_role', 'users.soft_delete', 'users.hard_delete', 'users.edit', 'users.verify']
const FULL = { firstName: 'Ana', profileType: 'private' as const, phone: '+355691234567', locationId: 1, status: 'active' as const }
const writes = (d: FakeDb) => d.log.filter((l) => l.op !== 'select')

beforeEach(() => {
  db = createFakeDb({
    users: [
      { id: 'adm', role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: 'adm2', role: 'admin', user_type: 'private', name: 'Admin Two', status: 'active' },
      { id: 'mod', role: 'moderator', user_type: 'private', name: 'Mod', status: 'active' },
      { id: 'tgt', role: 'user', user_type: 'private', name: 'Target', status: 'active', is_verified: false },
    ],
    // a moderator holding EVERY permission of the actions below: only the rank read stands between the moderator and the administrator account
    role_permissions: PERMISSIONS.map((permission_key) => ({ role: 'moderator', permission_key, allowed: true })),
    listings: [{ id: 'l1', user_id: 'tgt', status: 'active' }],
  })
  currentUser = { id: 'mod' }
  rankReadError = null
  authAdminCalls.length = 0
  transitions.length = 0
  deletions.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const forbidden = (answer: unknown) => String((answer as { error?: string })?.error ?? '').toLowerCase() === 'forbidden'

describe('adminActorRank', () => {
  const actions: [string, (id: string) => Promise<unknown>][] = [
    ['updateUserProfile', (id) => updateUserProfile(id, { name: 'Hijacked' })],
    ['updateUserProfileFull', (id) => updateUserProfileFull(id, { ...FULL, status: 'blocked', blockReason: 'x' })],
    ['toggleUserVerified', (id) => toggleUserVerified(id, true)],
    ['deactivateUser', (id) => deactivateUser(id, 'because')],
    ['reactivateUser', (id) => reactivateUser(id, 'because')],
    ['hardDeleteUser', (id) => hardDeleteUser(id)],
    ['removeUserAvatar', (id) => removeUserAvatar(id)],
  ]

  it('[SEC-X-SRV-RANK-FAILCLOSED] a failed or empty rank read refuses every staff action on the account', async () => {
    for (const [name, call] of actions) {
      // 1. the rank read fails: the administrator account is the target, and the moderator holds the permission of every action
      rankReadError = { message: 'connection reset', code: '57P01' }
      const failed = await call('adm2')
      expect(forbidden(failed), `${name} with a failed rank read answered ${JSON.stringify(failed)}`).toBe(true)
      // 2. the rank read returns no row for the target (the account does not exist, or its row cannot be seen)
      rankReadError = null
      const empty = await call('ghost')
      expect(forbidden(empty), `${name} with no row for the target answered ${JSON.stringify(empty)}`).toBe(true)
    }
    // nothing was written, no Auth user was touched and no listing was archived, for any of the fourteen calls
    expect(writes(db)).toEqual([])
    expect(authAdminCalls).toEqual([])
    expect(transitions).toEqual([])
    expect(deletions, 'hardDeleteUser never reached deleteAccount').toEqual([])
    expect(db.tables.users.find((u) => u.id === 'adm2')).toMatchObject({ role: 'admin', status: 'active', name: 'Admin Two' })
  })

  it('the same actions still work on an ordinary account when the rank is readable (the control)', async () => {
    expect(await updateUserProfile('tgt', { name: 'Renamed' })).toEqual({})
    expect(await toggleUserVerified('tgt', true)).toEqual({})
    expect(await deactivateUser('tgt', 'spam')).toEqual({})
    expect(await reactivateUser('tgt', 'sorted')).toEqual({})
    expect(await removeUserAvatar('tgt')).toEqual({})
    expect(db.tables.users.find((u) => u.id === 'tgt')).toMatchObject({ name: 'Renamed', is_verified: true, status: 'active' })
  })

  it('[SEC-X-SRV-SELF-DELETE] no self-deletion from the panel', async () => {
    currentUser = { id: 'adm' }
    // the administrator holds both delete permissions (an administrator always does) and the rank rule passes for their own id
    expect(await hardDeleteUser('adm')).toEqual({ error: 'forbidden' })
    expect(writes(db)).toEqual([])
    expect(authAdminCalls).toEqual([])
    expect(deletions, 'deleteAccount was not reached').toEqual([])
    expect(db.tables.users.find((u) => u.id === 'adm')).toMatchObject({ role: 'admin', status: 'active' })
    expect(db.tables.users.find((u) => u.id === 'adm')).not.toHaveProperty('deleted_at')
    // a moderator who holds the permission is refused for their own id as well
    currentUser = { id: 'mod' }
    expect(await hardDeleteUser('mod')).toEqual({ error: 'forbidden' })
    expect(writes(db)).toEqual([])
    expect(authAdminCalls).toEqual([])
    expect(deletions).toEqual([])
  })

  it('an administrator and a moderator still delete another account, nothing is archived first, and deleteAccount is asked for it as staff (the control)', async () => {
    currentUser = { id: 'adm' }
    expect(await hardDeleteUser('tgt')).toEqual({})
    expect(deletions).toEqual([{ userId: 'tgt', reason: 'staff' }])
    currentUser = { id: 'mod' }
    db.tables.users.push({ id: 'tgt2', role: 'user', user_type: 'private', name: 'Target Two', status: 'active' })
    db.tables.listings.push({ id: 'l2', user_id: 'tgt2', status: 'active' })
    expect(await hardDeleteUser('tgt2')).toEqual({})
    expect(deletions).toEqual([{ userId: 'tgt', reason: 'staff' }, { userId: 'tgt2', reason: 'staff' }])
    // the listings go with the account (deleteAccount): the action archives none
    expect(transitions).toEqual([])
  })
})
