// @vitest-environment node
/**
 * Security (Task 923 R66 (b), (c), R71 (b), (j)): a staff action needs the permission that names it, on every path.
 *  - SEC-X-SRV-STATUS-PERM (critical): the full profile form cannot deactivate or reactivate an account without `users.soft_delete`, as deactivateUser / reactivateUser do.
 *  - SEC-X-SRV-LOCATIONS-PERM (critical): every write to `locations` needs `locations.manage` (addLocation, both popular-location actions, the photo upload route).
 *  - SEC-X-SRV-CREATE-STAFF-ROLE: `users.create` alone cannot make a moderator or administrator account; the role change needs `users.change_role` too.
 *  - SEC-X-SRV-SUSPEND-FUTURE: a dated block is saved only with an end that parses and lies in the future.
 * The permission helpers, requireViewer and the actions are the real ones; only the database, Cloudinary and the Auth ban are doubles that record what reached them.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const authAdminCalls: { name: string; args: unknown[] }[] = []
const accessSyncs: { userId: string; status: string }[] = []
const uploads: string[] = []

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => db.client.from(t),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => { authAdminCalls.push({ name, args }); return { data: { user: { id: 'new-auth-user' } }, error: null } } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accountAccess')>()),
  syncAccountAccess: async (userId: string, status: string) => { accessSyncs.push({ userId, status }); return { ok: true } },
}))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))
vi.mock('@/lib/cloudinaryUpload', () => ({ uploadToCloudinary: async (_b: ArrayBuffer, _t: string, folder: string) => { uploads.push(folder); return { url: 'https://res.cloudinary.com/demo/image/upload/zz.png' } }, publicIdFromUrl: () => null }))

import { addLocation, createAdminUser, updateUserProfileFull } from '../index'
import { setLocationFeatured, setLocationUnfeatured } from '@/modules/locations/actions/popularLocationActions'
import { POST as uploadPopularLocationPhoto } from '@/app/api/upload-popular-location-photo/route'

// the full profile form also needs `users.edit` (Task 923 R75), so every moderator of these tests holds it: what each test takes away or adds is the key under test
const allow = (...keys: string[]) => [...keys, 'users.edit'].map((permission_key) => ({ role: 'moderator', permission_key, allowed: true }))
const FULL = { firstName: 'Ana', profileType: 'private' as const, phone: '+355691234567', locationId: 1, status: 'active' as const }
const user = (id: string) => db.tables.users.find((u) => u.id === id)!
const writes = () => db.log.filter((l) => l.op !== 'select')

beforeEach(() => {
  db = createFakeDb({
    users: [
      { id: 'adm', role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: 'mod', role: 'moderator', user_type: 'private', name: 'Mod', status: 'active' },
      { id: 'tgt', role: 'user', user_type: 'private', name: 'Target', status: 'active', phone: '+355690000000' },
      { id: 'off', role: 'user', user_type: 'private', name: 'Deactivated', status: 'inactive', phone: '+355690000001' },
      { id: 'blk', role: 'user', user_type: 'private', name: 'Blocked', status: 'blocked', phone: '+355690000002' },
    ],
    role_permissions: [],
    locations: [{ id: 1, name_al: 'Tirana', type: 'city', slug: 'tirana', is_featured: false, display_order: 0 }],
  })
  currentUser = { id: 'mod' }
  authAdminCalls.length = 0
  accessSyncs.length = 0
  uploads.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function photoRequest() {
  const form = new FormData()
  form.set('photo', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], 'p.png', { type: 'image/png' }))
  form.set('locationId', '1')
  return new NextRequest('http://localhost/api/upload-popular-location-photo', { method: 'POST', body: form })
}

describe('adminPermissions', () => {
  it('[SEC-X-SRV-STATUS-PERM] the full profile form cannot deactivate or reactivate without users.soft_delete', async () => {
    // a moderator who may change roles but not deactivate accounts
    db.tables.role_permissions = allow('users.change_role')
    expect(await updateUserProfileFull('tgt', { ...FULL, status: 'inactive' })).toEqual({ error: 'Forbidden' })
    expect(await updateUserProfileFull('off', { ...FULL, status: 'active' })).toEqual({ error: 'Forbidden' })
    expect(user('tgt').status).toBe('active')
    expect(user('off').status).toBe('inactive')
    expect(writes()).toEqual([])
    expect(accessSyncs).toEqual([])
    expect(authAdminCalls).toEqual([])
    // the permission is the only thing that was missing: with it the same two calls work and the Auth access follows
    db.tables.role_permissions = allow('users.change_role', 'users.soft_delete')
    expect(await updateUserProfileFull('tgt', { ...FULL, status: 'inactive' })).toEqual({})
    expect(await updateUserProfileFull('off', { ...FULL, status: 'active' })).toEqual({})
    expect(user('tgt').status).toBe('inactive')
    expect(user('off').status).toBe('active')
    expect(accessSyncs).toEqual([{ userId: 'tgt', status: 'inactive' }, { userId: 'off', status: 'active' }])
  })

  it('the same moderator still blocks and unblocks without users.soft_delete (blocking keeps its rule), and an administrator needs no key', async () => {
    db.tables.role_permissions = allow('users.change_role')
    expect(await updateUserProfileFull('tgt', { ...FULL, status: 'blocked', blockReason: 'spam' })).toEqual({})
    expect(user('tgt').status).toBe('blocked')
    expect(await updateUserProfileFull('blk', { ...FULL, status: 'active' })).toEqual({})
    expect(user('blk').status).toBe('active')
    currentUser = { id: 'adm' }
    expect(await updateUserProfileFull('off', { ...FULL, status: 'active' })).toEqual({})
    expect(user('off').status).toBe('active')
  })

  it('[SEC-X-SRV-LOCATIONS-PERM] every locations write path requires locations.manage', async () => {
    // a moderator with locations.manage NOT granted: every path refuses before it writes or uploads
    await expect(addLocation({ name_al: 'Durres', region_id: 1 })).rejects.toThrow('forbidden')
    expect(await setLocationFeatured(1, 3)).toEqual({ error: 'forbidden' })
    expect(await setLocationUnfeatured(1)).toEqual({ error: 'forbidden' })
    const refused = await uploadPopularLocationPhoto(photoRequest())
    expect(refused.status).toBe(403)
    expect(await refused.json()).toEqual({ error: 'forbidden' })
    expect(writes()).toEqual([])
    expect(uploads).toEqual([])
    expect(db.tables.locations).toHaveLength(1)
    expect(db.tables.locations[0]).toMatchObject({ is_featured: false, display_order: 0 })
    // a signed-in plain user and a guest are refused before the permission is even read
    currentUser = { id: 'tgt' }
    expect((await uploadPopularLocationPhoto(photoRequest())).status).toBe(403)
    expect(await setLocationFeatured(1, 3)).toEqual({ error: 'forbidden' })
    currentUser = null
    expect((await uploadPopularLocationPhoto(photoRequest())).status).toBe(403)
    expect(await setLocationFeatured(1, 3)).toEqual({ error: 'unauthenticated' })
    expect(writes()).toEqual([])
    expect(uploads).toEqual([])
    // the control: once the key is granted the same moderator may do all four
    currentUser = { id: 'mod' }
    db.tables.role_permissions = allow('locations.manage')
    expect((await addLocation({ name_al: 'Durres', region_id: 1 })).id).toBeDefined()
    expect(await setLocationFeatured(1, 3)).toEqual({})
    expect(db.tables.locations[0]).toMatchObject({ is_featured: true, display_order: 3 })
    expect(await setLocationUnfeatured(1)).toEqual({})
    expect(db.tables.locations[0]).toMatchObject({ is_featured: false })
    const ok = await uploadPopularLocationPhoto(photoRequest())
    expect(ok.status).toBe(200)
    expect(uploads).toEqual(['popular_locations/1'])
    expect(db.tables.locations[0].image_url).toBe('https://res.cloudinary.com/demo/image/upload/zz.png')
  })

  it('[SEC-X-SRV-CREATE-STAFF-ROLE] users.create alone cannot make a staff account', async () => {
    // a moderator who may create accounts but not change roles
    db.tables.role_permissions = allow('users.create')
    const input = { firstName: 'Neo', email: 'neo@example.com', phone: '+355691234567', locationId: 1 }
    expect(await createAdminUser({ ...input, profileType: 'moderator' })).toEqual({ error: 'forbidden' })
    expect(await createAdminUser({ ...input, profileType: 'admin' })).toEqual({ error: 'forbidden' })
    expect(authAdminCalls).toEqual([])
    expect(db.tables.users).toHaveLength(5)
    expect(writes()).toEqual([])
    // the other account types need no role change
    expect((await createAdminUser({ ...input, profileType: 'agent' })).userId).toBe('new-auth-user')
    expect(db.tables.users.at(-1)).toMatchObject({ role: 'agent' })
    // with users.change_role the moderator may make a moderator, but still never an administrator
    db.tables.role_permissions = allow('users.create', 'users.change_role')
    expect((await createAdminUser({ ...input, profileType: 'moderator' })).userId).toBe('new-auth-user')
    expect(db.tables.users.at(-1)).toMatchObject({ role: 'moderator' })
    expect(await createAdminUser({ ...input, profileType: 'admin' })).toEqual({ error: 'forbidden' })
    // an administrator needs no key for either
    currentUser = { id: 'adm' }
    expect((await createAdminUser({ ...input, profileType: 'admin' })).userId).toBe('new-auth-user')
  })

  it('[SEC-X-SRV-SUSPEND-FUTURE] a past or invalid suspension end is refused', async () => {
    currentUser = { id: 'adm' }
    const before = JSON.stringify(user('tgt'))
    const yesterday = new Date(Date.now() - 864e5).toISOString()
    const blocked = { ...FULL, status: 'blocked' as const, blockReason: 'spam' }
    for (const suspendedUntil of [yesterday, 'not a date', '', '2026-13-45', 12345 as unknown as string, {} as unknown as string]) {
      expect(await updateUserProfileFull('tgt', { ...blocked, suspendedUntil }), `suspendedUntil ${JSON.stringify(suspendedUntil)}`).toEqual({ error: 'invalid_suspension' })
    }
    expect(JSON.stringify(user('tgt'))).toBe(before)
    expect(writes()).toEqual([])
    expect(accessSyncs).toEqual([])
    // a future end and a permanent block (null or absent) are saved
    const tomorrow = new Date(Date.now() + 864e5).toISOString()
    expect(await updateUserProfileFull('tgt', { ...blocked, suspendedUntil: tomorrow })).toEqual({})
    expect(user('tgt')).toMatchObject({ status: 'blocked', suspended_until: tomorrow })
    expect(await updateUserProfileFull('tgt', { ...blocked, suspendedUntil: null })).toEqual({})
    expect(user('tgt')).toMatchObject({ status: 'blocked', suspended_until: null })
    expect(await updateUserProfileFull('tgt', blocked)).toEqual({})
    // a past end next to a status that is not "blocked" is not read at all (the column is cleared for such a status)
    expect(await updateUserProfileFull('tgt', { ...FULL, status: 'active', suspendedUntil: yesterday })).toEqual({})
    expect(user('tgt')).toMatchObject({ status: 'active', suspended_until: null })
  })
})
