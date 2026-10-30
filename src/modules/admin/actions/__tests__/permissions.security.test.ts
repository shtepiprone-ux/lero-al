// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the moderator permission switches are the most sensitive admin setting — they decide what a moderator may delete or change.
 *  - only an ADMINISTRATOR can change a switch (a moderator cannot grant themselves more), and only a known permission with a true / false value;
 *  - every change leaves an audit row with the old value and the actor taken from the session;
 *  - reading is for staff only; an unreadable table shows every switch off instead of on.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'
import { PERMISSION_KEYS } from '@/lib/auth/permissionKeys'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const paths: string[] = []
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { paths.push(p) } }))
// the page of the switches (SEC-X-SRV-PERMS-ADMIN-ONLY): the real page and the real staff-page guard; Next's redirect and not-found, the cookie jar, i18n and the three view components are doubles
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') }, redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) } }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('@/components/admin/AdminPageHeader', () => ({ AdminPageHeader: () => null }))
vi.mock('@/components/admin/AdminPageFrame', () => ({ AdminPageFrame: () => null }))
vi.mock('@/components/admin/AdminPermissionsManager', () => ({ AdminPermissionsManager: () => null }))

import { getModeratorPermissions, getPermissionEvents, setModeratorPermission } from '../permissions'
import AdminPermissionsPage from '@/app/admin/permissions/page'

function failing(table: string, op: 'insert' | 'upsert' | 'select', error: { code?: string; message: string }) {
  const real = db.client.from
  db.client.from = ((t: string) => {
    const c = real(t) as Record<string, unknown>
    if (t === table) {
      const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error }) : chain), apply: () => chain })
      c[op] = () => chain
    }
    return c
  }) as never
}

beforeEach(() => {
  db = createFakeDb({
    // active accounts: `requireViewer()` / `checkStaff()` (Task 923 R44, R71 (k)) read the actor's own row and refuse an account without access
    users: [{ id: 'adm', role: 'admin', name: 'Admin A', status: 'active' }, { id: 'mod', role: 'moderator', name: 'Mod M', status: 'active' }, { id: 'usr', role: 'user', status: 'active' }],
    role_permissions: [{ id: 'p1', role: 'moderator', permission_key: 'listings.delete', allowed: true, updated_at: '2026-10-01', updated_by_user_id: 'adm' }],
    role_permission_events: [],
  })
  currentUser = { id: 'adm' }
  paths.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('setModeratorPermission', () => {
  it('an administrator switches a permission on and the change is audited with the old value and the actor', async () => {
    expect(await setModeratorPermission('users.create', true)).toEqual({})
    expect(db.tables.role_permissions.find((r) => r.permission_key === 'users.create')).toMatchObject({ role: 'moderator', allowed: true, updated_by_user_id: 'adm' })
    expect(db.tables.role_permission_events).toMatchObject([{ role: 'moderator', permission_key: 'users.create', old_allowed: null, new_allowed: true, actor_user_id: 'adm' }])
    expect(paths).toEqual(['/admin/permissions'])
  })

  it('switching an existing one off records the previous value and keeps one row for it', async () => {
    expect(await setModeratorPermission('listings.delete', false)).toEqual({})
    expect(db.tables.role_permissions.filter((r) => r.permission_key === 'listings.delete')).toHaveLength(1)
    expect(db.tables.role_permissions[0].allowed).toBe(false)
    expect(db.tables.role_permission_events[0]).toMatchObject({ old_allowed: true, new_allowed: false })
  })

  it('asking for the value it already has is a no-op: no write, no audit row, no refresh', async () => {
    expect(await setModeratorPermission('listings.delete', true)).toEqual({ noOp: true, direction: 'grant' })
    db.tables.role_permissions[0].allowed = false
    expect(await setModeratorPermission('listings.delete', false)).toEqual({ noOp: true, direction: 'revoke' })
    expect(db.tables.role_permission_events).toEqual([])
    expect(paths).toEqual([])
  })

  it.each([['a moderator', 'mod'], ['a plain user', 'usr'], ['someone with no profile', 'ghost'], ['an anonymous caller', null]])('%s cannot change anything', async (_l, id) => {
    currentUser = id ? { id } : null
    expect(await setModeratorPermission('users.hard_delete', true)).toEqual({ error: 'forbidden' })
    expect(db.tables.role_permissions).toHaveLength(1)
    expect(db.tables.role_permission_events).toEqual([])
  })

  it.each([['users.hard_delete_everything'], [''], ['__proto__'], ['listings.delete; drop'], [undefined], [5]])('the permission %j is refused and nothing is written', async (key) => {
    expect(await setModeratorPermission(key as never, true)).toEqual({ error: 'validation' })
    expect(db.tables.role_permissions).toHaveLength(1)
    expect(db.tables.role_permission_events).toEqual([])
  })

  it.each([['true'], ['false'], [1], [0], [null], [undefined], [{}]])('the value %j is not a boolean: refused', async (value) => {
    expect(await setModeratorPermission('users.create', value as never)).toEqual({ error: 'validation' })
    expect(db.tables.role_permissions).toHaveLength(1)
  })

  it('every known permission can be switched', async () => {
    for (const key of PERMISSION_KEYS) expect((await setModeratorPermission(key, true)).error).toBeUndefined()
    expect(db.tables.role_permissions.filter((r) => r.allowed === true)).toHaveLength(PERMISSION_KEYS.length)
  })

  it('a failed write is "save_failed" and leaves no audit row', async () => {
    failing('role_permissions', 'upsert', { message: 'boom' })
    expect(await setModeratorPermission('users.create', true)).toEqual({ error: 'save_failed' })
    expect(db.tables.role_permission_events).toEqual([])
  })

  it('a failed audit row does not undo the change that was made', async () => {
    failing('role_permission_events', 'insert', { message: 'boom' })
    expect(await setModeratorPermission('users.create', true)).toEqual({})
    expect(db.tables.role_permissions.find((r) => r.permission_key === 'users.create')?.allowed).toBe(true)
  })
})

describe('getModeratorPermissions', () => {
  it('returns every permission, off unless a row says on, with who changed it', async () => {
    const res = await getModeratorPermissions()
    expect(Object.keys(res).sort()).toEqual([...PERMISSION_KEYS].sort())
    expect(res['listings.delete']).toEqual({ allowed: true, updated_at: '2026-10-01', updated_by_name: 'Admin A' })
    expect(res['users.create']).toEqual({ allowed: false, updated_at: null, updated_by_name: null })
  })

  it('ignores a row whose key is not a known permission', async () => {
    db.tables.role_permissions.push({ id: 'p2', role: 'moderator', permission_key: 'made.up', allowed: true })
    expect(Object.keys(await getModeratorPermissions())).not.toContain('made.up')
  })

  it('does not take the admin\'s own switches for the moderator\'s', async () => {
    db.tables.role_permissions.push({ id: 'p3', role: 'admin', permission_key: 'users.create', allowed: true })
    expect((await getModeratorPermissions())['users.create'].allowed).toBe(false)
  })

  it('an unreadable table shows every switch OFF', async () => {
    failing('role_permissions', 'select', { code: '42501', message: 'denied' })
    const res = await getModeratorPermissions()
    expect(Object.values(res).every((p) => p.allowed === false)).toBe(true)
  })

  // Task 923 R75 (e), D55: the switches are read by an ADMINISTRATOR only. This was "a moderator may read" before R75 and is now its regression: a moderator is refused like a plain user.
  it('only an administrator reads; a moderator, a plain user and an anonymous caller may not', async () => {
    currentUser = { id: 'adm' }
    await expect(getModeratorPermissions()).resolves.toBeDefined()
    currentUser = { id: 'mod' }
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')
    currentUser = { id: 'usr' }
    await expect(getModeratorPermissions()).rejects.toThrow('forbidden')
    currentUser = null
    await expect(getModeratorPermissions()).rejects.toThrow('unauthenticated')
  })
})

describe('getPermissionEvents', () => {
  beforeEach(() => {
    db.tables.role_permission_events.push(
      { id: 'e1', role: 'moderator', permission_key: 'users.create', old_allowed: null, new_allowed: true, actor_user_id: 'adm', created_at: '2026-10-02' },
      { id: 'e2', role: 'moderator', permission_key: 'users.create', old_allowed: true, new_allowed: false, actor_user_id: null, created_at: '2026-10-03' },
    )
  })

  it('returns events with the actor\'s name; an event without an actor has none', async () => {
    const events = await getPermissionEvents()
    // newest first
    expect(events).toMatchObject([{ id: 'e2', actor_name: null, actor_user_id: null }, { id: 'e1', actor_name: 'Admin A', old_allowed: null }])
  })

  it.each([['an anonymous caller', null], ['a plain user', { id: 'usr' }]])('%s gets nothing', async (_l, who) => {
    currentUser = who
    expect(await getPermissionEvents()).toBeNull()
  })

  // Task 923 R75 (e), D55: the audit log is for the administrator only. This was "a moderator may read" before R75 and is now its regression.
  it('a moderator gets nothing; the administrator reads the events', async () => {
    currentUser = { id: 'mod' }
    expect(await getPermissionEvents()).toBeNull()
    currentUser = { id: 'adm' }
    expect(await getPermissionEvents()).toHaveLength(2)
  })

  it.each([[5, 5], [0, 1], [-3, 1], [1000, 200], [2.5, 20], [NaN, 20], ['10', 20], [undefined, 20]])('the limit %j is asked as %j', async (limit, asked) => {
    let askedLimit: unknown = 'never asked'
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'role_permission_events') { const l = c.limit as (n: number) => unknown; c.limit = (n: number) => { askedLimit = n; return l(n) } }
      return c
    }) as never
    await getPermissionEvents(limit as never)
    expect(askedLimit).toBe(asked)
  })

  it('a database error gives null', async () => {
    failing('role_permission_events', 'select', { message: 'x' })
    expect(await getPermissionEvents()).toBeNull()
  })
})

describe('permissions', () => {
  it('[SEC-X-SRV-PERMS-ADMIN-ONLY] the switches are for the administrator only', async () => {
    // deny: a moderator, a plain user, an account with no profile and a guest read nothing, write nothing and do not get the page
    const viewers = [['a moderator', 'mod', 'forbidden'], ['a plain user', 'usr', 'forbidden'], ['someone with no profile', 'ghost', 'unauthenticated'], ['an anonymous caller', null, 'unauthenticated']] as const
    for (const [label, id, readError] of viewers) {
      currentUser = id ? { id } : null
      await expect(getModeratorPermissions(), `${label}: the switches are not read`).rejects.toThrow(readError)
      expect(await getPermissionEvents(), `${label}: the audit log is not read`).toBeNull()
      expect(await setModeratorPermission('users.create', true), `${label}: no switch is set`).toEqual({ error: 'forbidden' })
      await expect(AdminPermissionsPage(), `${label}: the page`).rejects.toThrow(readError === 'forbidden' ? 'NEXT_NOT_FOUND' : /^NEXT_REDIRECT /)
    }
    expect(db.tables.role_permissions, 'no row was written').toHaveLength(1)
    expect(db.tables.role_permission_events, 'no audit row was written').toEqual([])
    expect(db.log.filter((l) => l.table !== 'users'), 'only the viewer lookup of the caller\'s own row was read; no switch or event table was touched').toEqual([])

    // allow: the administrator reads, sets, and gets the page with both lists; an unknown key is still refused and writes nothing
    currentUser = { id: 'adm' }
    expect((await getModeratorPermissions())['listings.delete'].allowed).toBe(true)
    expect(await getPermissionEvents()).toEqual([])
    expect(await setModeratorPermission('users.edit', true)).toEqual({})
    expect(db.tables.role_permissions.find((r) => r.permission_key === 'users.edit')).toMatchObject({ role: 'moderator', allowed: true, updated_by_user_id: 'adm' })
    expect(await setModeratorPermission('users.hard_delete_everything' as never, true)).toEqual({ error: 'validation' })
    expect(db.tables.role_permissions.map((r) => r.permission_key)).toEqual(['listings.delete', 'users.edit'])
    const page = (await AdminPermissionsPage()) as unknown as { props: { children: { props: { permissions: Record<string, { allowed: boolean }>; events: unknown[] } }[] } }
    const manager = page.props.children[1]
    expect(manager.props.permissions['users.edit'].allowed).toBe(true)
    expect(manager.props.events).toHaveLength(1)
  })
})
