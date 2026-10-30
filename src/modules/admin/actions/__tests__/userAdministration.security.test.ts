// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S44): who may do what to whose account.
 *  - an action writes only the fields it is documented to write, whatever else the caller sends (a moderator could send `role: 'admin'` to the profile action);
 *  - an administrator account is acted on, edited, blocked, deleted or created only by an administrator, even by a moderator who holds the matching permission;
 *  - a setting outside the form's list, a link that is not a link, and an unknown page / location column are refused or dropped.
 * The permission helpers are the real ones; only the database is the in-memory one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const authAdminCalls: { name: string; args: unknown[] }[] = []
const transitions: string[] = []
const deletions: { userId: string; reason: string }[] = []
let createdUsers = 0

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => db.client.from(t),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => { authAdminCalls.push({ name, args }); return { data: { user: { id: `new-auth-user-${name === 'inviteUserByEmail' ? ++createdUsers : createdUsers}` } }, error: null } } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
// This suite is about who may act on whom; the Auth ban that follows a status change is tested in ../accountBan.security.test.ts (ids here are not UUIDs)
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async (id: string) => { transitions.push(id); return { ok: true } } }))
// the one deletion (Task 923 R141) has its own cases; here it records whether the action reached it
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string, options: { reason: string }) => { deletions.push({ userId, reason: options.reason }); return { ok: true, filesNotRemoved: 0 } } }))

import {
  createAdminUser, createLocation, createPage, deactivateUser, hardDeleteUser, reactivateUser, removeUserAvatar, saveSettings, toggleUserVerified,
  updateLocation, updatePage, updateUserProfile, updateUserProfileFull,
} from '../index'

// the keys a moderator holds in these tests, including the ones of Task 923 R75 (`users.edit`, `users.verify`)
const PERMISSIONS = ['users.create', 'users.change_role', 'users.soft_delete', 'users.hard_delete', 'locations.manage', 'settings.manage', 'legal.manage', 'users.edit', 'users.verify']
const user = (id: string) => db.tables.users.find((u) => u.id === id)!

const FULL = { firstName: 'Ana', profileType: 'private' as const, phone: '+355691234567', locationId: 1, status: 'active' as const }

beforeEach(() => {
  db = createFakeDb({
    users: [
      { id: 'adm', role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: 'adm2', role: 'admin', user_type: 'private', name: 'Admin Two', status: 'active', is_verified: false },
      { id: 'mod', role: 'moderator', user_type: 'private', name: 'Mod', status: 'active' },
      { id: 'tgt', role: 'user', user_type: 'private', name: 'Target', status: 'active', is_verified: false, phone: '+355690000000' },
    ],
    // a moderator holding EVERY permission: the rank check must still hold
    role_permissions: PERMISSIONS.map((permission_key) => ({ role: 'moderator', permission_key, allowed: true })),
    listings: [{ id: 'l1', user_id: 'tgt', status: 'active' }],
    locations: [{ id: 1, name_al: 'Tirana', type: 'city', slug: 'tirana' }],
    pages: [{ id: 1, slug: 'terms', title: 'Terms', content: { sq: { body: '<p>x</p>', title: 'Terms' } }, is_published: false }],
    site_settings: [],
  })
  currentUser = { id: 'mod' }
  authAdminCalls.length = 0
  transitions.length = 0
  deletions.length = 0
  createdUsers = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('updateUserProfile writes only name, phone and company_name', () => {
  it('drops every other column a caller sends', async () => {
    const res = await updateUserProfile('tgt', { name: 'New', role: 'admin', is_verified: true, status: 'blocked', id: 'other', deleted_at: 'x' } as never)
    expect(res).toEqual({})
    expect(user('tgt')).toMatchObject({ name: 'New', role: 'user', is_verified: false, status: 'active', id: 'tgt' })
    expect(Object.keys(db.log.find((l) => l.op === 'update')!.values as object)).toEqual(['name'])
  })

  it('a moderator cannot make themselves an administrator through it', async () => {
    expect(await updateUserProfile('mod', { role: 'admin' } as never)).toEqual({})
    expect(user('mod').role).toBe('moderator')
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
  })

  it('takes text only', async () => {
    await updateUserProfile('tgt', { name: { $set: 1 }, phone: 5, company_name: ['x'] } as never)
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
    await updateUserProfile('tgt', null as never)
    await updateUserProfile('tgt', undefined as never)
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
  })

  it('a moderator cannot edit an administrator; an administrator can', async () => {
    expect(await updateUserProfile('adm2', { name: 'Hijacked' })).toEqual({ error: 'forbidden' })
    expect(user('adm2').name).toBe('Admin Two')
    currentUser = { id: 'adm' }
    expect(await updateUserProfile('adm2', { name: 'Renamed' })).toEqual({})
    expect(user('adm2').name).toBe('Renamed')
  })

  it('a plain user cannot use it at all', async () => {
    currentUser = { id: 'tgt' }
    await expect(updateUserProfile('tgt', { name: 'x' })).rejects.toThrow('forbidden')
  })
})

describe('rank: an administrator account is out of reach for a moderator with every permission', () => {
  const attempts: [string, () => Promise<unknown>][] = [
    ['toggleUserVerified', () => toggleUserVerified('adm2', true)],
    ['removeUserAvatar', () => removeUserAvatar('adm2')],
    ['deactivateUser', () => deactivateUser('adm2', 'because')],
    ['reactivateUser', () => reactivateUser('adm2', 'because')],
    ['hardDeleteUser', () => hardDeleteUser('adm2')],
    ['updateUserProfileFull', () => updateUserProfileFull('adm2', { ...FULL, status: 'blocked', blockReason: 'x' })],
  ]

  it.each(attempts)('%s is refused and changes nothing', async (_n, call) => {
    const res = (await call()) as { error?: string }
    expect(res.error?.toLowerCase()).toBe('forbidden')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
    expect(authAdminCalls).toEqual([])
    expect(transitions).toEqual([])
    expect(deletions).toEqual([])
    expect(user('adm2')).toMatchObject({ role: 'admin', status: 'active', name: 'Admin Two' })
  })

  it.each([
    ['toggleUserVerified', () => toggleUserVerified('adm2', true)],
    ['removeUserAvatar', () => removeUserAvatar('adm2')],
    ['hardDeleteUser', () => hardDeleteUser('adm2')],
    ['deactivateUser', () => deactivateUser('adm2', 'because')],
    ['updateUserProfileFull', () => updateUserProfileFull('adm2', FULL)],
  ])('%s works when an administrator does it', async (_n, call) => {
    currentUser = { id: 'adm' }
    expect(await call()).toEqual({})
  })

  it('a moderator still works on an ordinary account', async () => {
    expect(await deactivateUser('tgt', 'spam')).toEqual({})
    expect(user('tgt').status).toBe('inactive')
    expect(await reactivateUser('tgt', 'sorted')).toEqual({})
    // the deletion is the one complete deletion (Task 923 R141, R142): nothing is archived first, and it is asked for as staff
    expect(await hardDeleteUser('tgt')).toEqual({})
    expect(deletions).toEqual([{ userId: 'tgt', reason: 'staff' }])
    expect(transitions).toEqual([])
  })

  it('a moderator can still edit themselves and another moderator', async () => {
    db.tables.users.push({ id: 'mod2', role: 'moderator', user_type: 'private', name: 'Mod Two', status: 'active' })
    expect(await updateUserProfile('mod', { name: 'Me' })).toEqual({})
    expect(await updateUserProfile('mod2', { name: 'Other' })).toEqual({})
  })
})

describe('only an administrator makes an administrator', () => {
  it('a moderator with the role permission cannot set the account type "admin" on anyone, themselves included', async () => {
    for (const target of ['tgt', 'mod']) {
      expect(await updateUserProfileFull(target, { ...FULL, profileType: 'admin' })).toEqual({ error: 'Forbidden' })
    }
    expect(user('tgt').role).toBe('user')
    expect(user('mod').role).toBe('moderator')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('the same moderator can set the other account types', async () => {
    expect(await updateUserProfileFull('tgt', { ...FULL, profileType: 'agent', companyName: 'Nova' })).toEqual({})
    expect(user('tgt')).toMatchObject({ role: 'agent', user_type: 'agent' })
  })

  it('an administrator can promote', async () => {
    currentUser = { id: 'adm' }
    expect(await updateUserProfileFull('tgt', { ...FULL, profileType: 'admin' })).toEqual({})
    expect(user('tgt').role).toBe('admin')
  })

  it('a moderator without the role permission changes nobody\'s type, and the other fields still save', async () => {
    db.tables.role_permissions = db.tables.role_permissions.filter((r) => r.permission_key !== 'users.change_role')
    expect(await updateUserProfileFull('tgt', { ...FULL, profileType: 'agent', firstName: 'Renamed' })).toEqual({})
    expect(user('tgt')).toMatchObject({ role: 'user', name: 'Renamed' })
  })

  it('creating an administrator account needs an administrator; other types do not', async () => {
    const input = { firstName: 'Neo', email: 'neo@example.com', phone: '+355691234567', locationId: 1 }
    expect(await createAdminUser({ ...input, profileType: 'admin' })).toEqual({ error: 'forbidden' })
    expect(authAdminCalls).toEqual([])
    expect((await createAdminUser({ ...input, profileType: 'agent' })).userId).toBe('new-auth-user-1')
    currentUser = { id: 'adm' }
    expect((await createAdminUser({ ...input, profileType: 'admin' })).userId).toBe('new-auth-user-2')
    expect(db.tables.users.find((u) => u.id === 'new-auth-user-1')?.role).toBe('agent')
    expect(db.tables.users.find((u) => u.id === 'new-auth-user-2')?.role).toBe('admin')
  })

  it('without the permission no account is created at all', async () => {
    db.tables.role_permissions = db.tables.role_permissions.filter((r) => r.permission_key !== 'users.create')
    await expect(createAdminUser({ firstName: 'N', email: 'n@example.com', phone: '+355691234567', locationId: 1, profileType: 'private' })).rejects.toThrow('forbidden')
    expect(authAdminCalls).toEqual([])
  })
})

describe('toggleUserVerified', () => {
  it.each([['true'], [1], [null], [undefined]])('refuses %j as the value', async (v) => {
    expect(await toggleUserVerified('tgt', v as never)).toEqual({ error: 'validation' })
    expect(user('tgt').is_verified).toBe(false)
  })
})

describe('locations and pages write only their own columns', () => {
  it('createLocation drops unknown columns', async () => {
    await createLocation({ name_al: 'Durrës', type: 'city', slug: 'durres', id: 99, created_by: 'x', region_id: 7 } as never)
    const row = db.tables.locations.at(-1)!
    expect(row).toMatchObject({ name_al: 'Durrës', slug: 'durres' })
    expect(row).not.toHaveProperty('created_by')
    expect(row).not.toHaveProperty('region_id')
    expect(row.id).not.toBe(99)
  })

  it('updateLocation cannot move the row or change its id', async () => {
    await updateLocation(1, { name_al: 'Tiranë', id: 5, parent_id: 3 } as never)
    expect(db.tables.locations[0]).toMatchObject({ id: 1, name_al: 'Tiranë' })
    expect(db.tables.locations[0]).not.toHaveProperty('parent_id')
  })

  it('updatePage drops unknown columns', async () => {
    await updatePage(1, { title: 'New', id: 9, created_at: 'x', author: 'me' } as never)
    expect(db.tables.pages[0]).toMatchObject({ id: 1, title: 'New' })
    expect(db.tables.pages[0]).not.toHaveProperty('author')
    expect(db.tables.pages[0]).not.toHaveProperty('created_at')
  })

  it('a page cannot publish with an empty Albanian body', async () => {
    db.tables.pages[0].content = { sq: { body: '', title: 'T' } }
    expect(await updatePage(1, { is_published: true })).toEqual({ error: 'sq_body_required' })
    expect(await createPage({ title: 'T', slug: 'newpage', content: { sq: { body: '<p></p>', title: 'T' } } as never, is_published: true })).toEqual({ error: 'sq_body_required' })
  })

  it('a slug that another page uses is refused', async () => {
    expect(await createPage({ title: 'T', slug: 'terms', content: { sq: { body: '<p>x</p>', title: 'T' } } as never, is_published: false })).toEqual({ error: 'slug_already_used' })
  })

  it('without the permission nothing is written', async () => {
    currentUser = { id: 'tgt' }
    await expect(updateLocation(1, { name_al: 'x' })).rejects.toThrow('forbidden')
    await expect(updatePage(1, { title: 'x' })).rejects.toThrow('forbidden')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })
})

describe('saveSettings', () => {
  it('stores the settings the form offers', async () => {
    expect(await saveSettings({ site_name: 'Lero.al', default_locale: 'it', archived_noindex_days: '30', social_facebook: 'https://facebook.com/lero', logo_url: '/logo.svg', og_image: '' })).toEqual({})
    expect(db.tables.site_settings.map((s) => s.key).sort()).toEqual(['archived_noindex_days', 'default_locale', 'logo_url', 'og_image', 'site_name', 'social_facebook'])
  })

  it.each([
    ['an unknown key', { robots_txt: 'x' }], ['a key that tries to be clever', JSON.parse('{"__proto__":"x"}')], ['a language that does not exist', { default_locale: 'xx' }],
    ['zero days', { archived_noindex_days: '0' }], ['days that are not a number', { archived_noindex_days: '30; drop' }], ['a javascript logo', { logo_url: 'javascript:alert(1)' }],
    ['a script social link', { social_facebook: 'java\tscript:alert(1)' }], ['a data image', { og_image: 'data:text/html,<script>1</script>' }], ['a value over 5000 characters', { about_al: 'x'.repeat(5001) }],
    ['a value that is not text', { site_name: 5 }], ['a value that is an object', { site_name: { a: 1 } }],
  ])('refuses %s and writes nothing', async (_l, entries) => {
    expect(await saveSettings(entries as never)).toEqual({ error: 'validation' })
    expect(db.tables.site_settings).toEqual([])
  })

  it('one bad entry stops the whole save', async () => {
    expect(await saveSettings({ site_name: 'Fine', robots_txt: 'x' } as never)).toEqual({ error: 'validation' })
    expect(db.tables.site_settings).toEqual([])
  })

  it.each([[null], [undefined], ['site_name=x'], [5]])('refuses %j as the whole payload', async (v) => {
    expect(await saveSettings(v as never)).toEqual({ error: 'validation' })
  })

  it('needs the settings permission', async () => {
    db.tables.role_permissions = db.tables.role_permissions.filter((r) => r.permission_key !== 'settings.manage')
    await expect(saveSettings({ site_name: 'x' })).rejects.toThrow('forbidden')
  })

  it('accepts exactly 5000 characters', async () => {
    expect(await saveSettings({ about_al: 'x'.repeat(5000) })).toEqual({})
  })
})

describe('phone numbers written by staff are in the stored form (finding S54)', () => {
  const BAD = ['067 123 4567', '355691234567', 'javascript:alert(1)', '+355691234567?x=1', '']

  it.each(BAD.filter(Boolean))('updateUserProfile refuses the phone %j', async (phone) => {
    expect(await updateUserProfile('tgt', { name: 'N', phone })).toEqual({ error: 'invalid_phone' })
    expect(user('tgt').name).toBe('Target')
  })

  it('updateUserProfile accepts a valid number and lets staff clear it', async () => {
    expect(await updateUserProfile('tgt', { phone: '+355691234567' })).toEqual({})
    expect(user('tgt').phone).toBe('+355691234567')
    expect(await updateUserProfile('tgt', { phone: '' })).toEqual({})
    expect(user('tgt').phone).toBe('')
  })

  it.each(BAD)('updateUserProfileFull refuses the phone %j and whatsapp %j', async (value) => {
    expect(await updateUserProfileFull('tgt', { ...FULL, phone: value })).toEqual({ error: 'invalid_phone' })
    if (value) expect(await updateUserProfileFull('tgt', { ...FULL, whatsapp: value })).toEqual({ error: 'invalid_phone' })
    expect(user('tgt').phone).toBe('+355690000000')
  })

  it('updateUserProfileFull saves valid numbers', async () => {
    expect(await updateUserProfileFull('tgt', { ...FULL, phone: '+355691234567', whatsapp: '+12025550123' })).toEqual({})
    expect(user('tgt')).toMatchObject({ phone: '+355691234567', whatsapp: '+12025550123' })
  })

  it.each(BAD)('createAdminUser refuses the phone %j: no account is made', async (phone) => {
    expect(await createAdminUser({ firstName: 'N', email: 'n@example.com', profileType: 'private', phone, locationId: 1 })).toEqual({ error: 'invalid_phone' })
    expect(authAdminCalls).toEqual([])
  })
})

// Task 923 R38 (cases SEC-S44-SRV-DENY, SEC-S45-SRV-DENY)
it('[SEC-S44-SRV-DENY] updateUserProfile writes only the three text fields, never role, status or verification', async () => {
  expect(await updateUserProfile('tgt', { name: 'New', role: 'admin', is_verified: true, status: 'blocked', id: 'other', deleted_at: 'x' } as never)).toEqual({})
  expect(user('tgt')).toMatchObject({ name: 'New', role: 'user', is_verified: false, status: 'active', id: 'tgt' })
  expect(Object.keys(db.log.find((l) => l.op === 'update')!.values as object)).toEqual(['name'])
  expect(await updateUserProfile('mod', { role: 'admin' } as never)).toEqual({})         // a moderator cannot make themselves an administrator through it
  expect(user('mod').role).toBe('moderator')
})

it('[SEC-S45-SRV-DENY] Only an administrator acts on, edits or creates an administrator account', async () => {
  expect(await updateUserProfile('adm2', { name: 'Hijacked' })).toEqual({ error: 'forbidden' })
  expect(await toggleUserVerified('adm2', true)).toMatchObject({ error: expect.stringMatching(/forbidden/i) })
  expect(await updateUserProfileFull('tgt', { ...FULL, profileType: 'admin' })).toEqual({ error: 'Forbidden' })
  expect(await createAdminUser({ firstName: 'Neo', email: 'neo@example.com', phone: '+355691234567', locationId: 1, profileType: 'admin' })).toEqual({ error: 'forbidden' })
  expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  expect(authAdminCalls).toEqual([])
  expect(user('adm2')).toMatchObject({ role: 'admin', name: 'Admin Two' })
  currentUser = { id: 'adm' }                                                           // the control: an administrator may
  expect(await updateUserProfile('adm2', { name: 'Renamed' })).toEqual({})
})
