// @vitest-environment node
/**
 * Security (Task 923 R100, R69 (d), application side, cases SEC-X-SRV-PROFILE-BOUNDS-DENY and -ALLOW): every writer of a profile column checks the bounds of the `users`
 * CHECKs of hardening v8b BEFORE it writes: name and last name at most 100 characters after trimming (`name_too_long`), a website `http(s)://` and at most 200 characters
 * after normalisation (`invalid_website`), an avatar and a company logo on this project's Cloudinary (`update_failed` / `db_save_failed`; only a hostile request sends another
 * address), a phone and a WhatsApp number in E.164 (`invalid_phone`, as before).
 *
 * The writers are the REAL `updateUserProfile`, `updateUserProfileFull`, `createAdminUser`, `updateCabinetProfile` and the REAL avatar route, with the REAL guards
 * (`requireViewer`, the rank and permission checks) over an in-memory database (it does NOT simulate the CHECKs themselves: the point is what the CODE refuses before it
 * writes). Doubles: the identity, the Auth admin API (recorded), Cloudinary, the status/e-mail side effects. Every id and value is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  authAdminCalls: [] as { name: string; args: unknown[] }[],
  deletes: [] as string[],
  /** the address Cloudinary reports for the file the avatar route uploads */
  uploadUrl: '',
}))

let db = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: db.from,
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => { state.authAdminCalls.push({ name, args }); return { data: { user: { id: 'new-auth-user' } }, error: null } } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signInWithPassword: async () => ({ error: null }), signOut: async () => ({ error: null }) } }) }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async (id: string) => { state.deletes.push(id); return { skipped: false, dryRun: false, deleted: true } } }))
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),   // the REAL publicIdFromUrl
  uploadToCloudinary: async () => ({ url: state.uploadUrl, publicId: 'new-avatar', width: 256, height: 256 }),
  readImageSize: () => ({ width: 256, height: 256 }),
}))
vi.mock('@/lib/uploads/imageSniff', () => ({ declaredTypeMatchesBytes: () => true }))

import { createAdminUser, updateUserProfile, updateUserProfileFull } from '../index'
import { updateCabinetProfile } from '@/modules/cabinet/actions'
import { POST as uploadAvatar } from '@/app/api/upload-avatar/route'

const CLOUD = 'lero-cloud'
const ADMIN = '00000000-0000-4000-8000-0000000000a1'
const TARGET = '00000000-0000-4000-8000-0000000000d1'
const OWN = '00000000-0000-4000-8000-0000000000e1'
const trusted = (file: string) => `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${file}`

const FULL = { firstName: 'Ana', lastName: 'Hoxha', profileType: 'private' as const, phone: '+355691234567', locationId: 1, status: 'active' as const }
const AGENT = { ...FULL, profileType: 'agent' as const, companyName: 'Hoxha Real Estate' }
const NEW_ACCOUNT = { firstName: 'Ana', lastName: 'Hoxha', email: 'ana@example.com', profileType: 'private' as const, phone: '+355691234567', locationId: 1 }
const CABINET = { name: 'Ana', phone: '+355691234567', companyName: null, userType: 'private' as const, locationId: 1, preferredCurrency: 'EUR' as const }
const long = (n: number) => 'x'.repeat(n)
/** an address of exactly `n` characters once normalised (`https://example.com/` plus a path) */
const websiteOf = (n: number) => `https://example.com/${'a'.repeat(n - 'https://example.com/'.length)}`

const userWrites = () => db.log.filter((e) => e.table === 'users' && e.op !== 'select')
const storedUser = (id: string) => db.tables.users.find((u) => u.id === id)!

function arrange(actor: string) {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  db = createFakeDb({
    users: [
      { id: ADMIN, role: 'admin', user_type: 'private', name: 'Admin', status: 'active' },
      { id: TARGET, role: 'user', user_type: 'private', name: 'Target', last_name: 'Person', status: 'active', website: null, company_logo_url: null, avatar_url: null },
      { id: OWN, role: 'user', user_type: 'private', name: 'Own', status: 'active', avatar_url: null },
    ],
    currencies: [{ id: 1, code: 'EUR', is_active: true }, { id: 2, code: 'ALL', is_active: true }],
  })
  state.user = { id: actor }
  state.authAdminCalls = []
  state.deletes = []
  state.uploadUrl = trusted('new-avatar.jpg')
}

function avatarRequest(): NextRequest {
  const form = new FormData()
  form.append('avatar', new File([new Uint8Array([1, 2, 3, 4])], 'avatar.jpg', { type: 'image/jpeg' }))
  return new NextRequest('http://localhost/api/upload-avatar', { method: 'POST', body: form })
}

beforeEach(() => { arrange(ADMIN); vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'log').mockImplementation(() => {}) })

describe('profileBounds', () => {
  it('[SEC-X-SRV-PROFILE-BOUNDS-DENY] an out-of-range profile value is refused before any write', async () => {
    // the admin writers
    expect(await updateUserProfile(TARGET, { name: long(101) }), 'updateUserProfile: a 101-character name').toEqual({ error: 'name_too_long' })
    expect(await updateUserProfileFull(TARGET, { ...FULL, firstName: long(101) }), 'updateUserProfileFull: a 101-character first name').toEqual({ error: 'name_too_long' })
    expect(await updateUserProfileFull(TARGET, { ...FULL, lastName: long(101) }), 'updateUserProfileFull: a 101-character last name').toEqual({ error: 'name_too_long' })
    expect(await updateUserProfileFull(TARGET, { ...AGENT, website: websiteOf(201) }), 'updateUserProfileFull: a website of 201 characters').toEqual({ error: 'invalid_website' })
    expect(await updateUserProfileFull(TARGET, { ...AGENT, website: `example.com/${'a'.repeat(183)}` }), 'updateUserProfileFull: a bare host of 195 characters, which is 203 once https:// is added').toEqual({ error: 'invalid_website' })
    expect(await updateUserProfileFull(TARGET, { ...AGENT, companyLogoUrl: 'https://evil.example/logo.png' }), 'updateUserProfileFull: a logo on another host').toEqual({ error: 'update_failed' })
    expect(await updateUserProfileFull(TARGET, { ...AGENT, companyLogoUrl: 'https://res.cloudinary.com/another-cloud/image/upload/logo.png' }), 'updateUserProfileFull: a logo in another Cloudinary account').toEqual({ error: 'update_failed' })
    expect(await updateUserProfileFull(TARGET, { ...FULL, phone: '0691234567' }), 'updateUserProfileFull: a phone that is not E.164').toEqual({ error: 'invalid_phone' })

    // the account creation: the Auth account is not even created
    expect(await createAdminUser({ ...NEW_ACCOUNT, firstName: long(101) }), 'createAdminUser: a 101-character first name').toEqual({ error: 'name_too_long' })
    expect(await createAdminUser({ ...NEW_ACCOUNT, lastName: long(101) }), 'createAdminUser: a 101-character last name').toEqual({ error: 'name_too_long' })
    expect(await createAdminUser({ ...NEW_ACCOUNT, profileType: 'agent', website: websiteOf(201) }), 'createAdminUser: a website of 201 characters').toEqual({ error: 'invalid_website' })
    expect(state.authAdminCalls.filter((c) => c.name === 'inviteUserByEmail' || c.name === 'createUser'), 'createAdminUser: no Auth account was created').toEqual([])

    // the person's own profile
    arrange(OWN)
    expect(await updateCabinetProfile({ ...CABINET, name: long(101) }), 'updateCabinetProfile: a 101-character name').toEqual({ error: 'name_too_long' })
    expect(await updateCabinetProfile({ ...CABINET, name: `${long(50)}  ${long(51)}` }), 'updateCabinetProfile: 101 characters with spaces inside').toEqual({ error: 'name_too_long' })

    // the avatar route: an address that is not on this project's Cloudinary is never stored, and the file just uploaded is released
    arrange(ADMIN)
    for (const bad of ['https://evil.example/avatar.jpg', 'https://res.cloudinary.com/another-cloud/image/upload/v1/avatar.jpg', 'http://res.cloudinary.com/lero-cloud/image/upload/v1/avatar.jpg']) {
      state.uploadUrl = bad
      state.deletes = []
      const response = await uploadAvatar(avatarRequest())
      expect(response.status, `the avatar route: ${bad}`).toBe(500)
      expect(await response.json()).toEqual({ error: 'db_save_failed' })
      expect(state.deletes, `the avatar route: ${bad}: the uploaded file was released`).toEqual(['new-avatar'])
    }

    // nothing was written by any of the refusals
    expect(userWrites(), 'no write to users').toEqual([])
    expect(storedUser(TARGET)).toMatchObject({ name: 'Target', last_name: 'Person', website: null, company_logo_url: null, avatar_url: null })
    expect(storedUser(OWN)).toMatchObject({ name: 'Own' })
  })

  it('[SEC-X-SRV-PROFILE-BOUNDS-ALLOW] values at the bounds are written', async () => {
    // a name of exactly 100 characters, padded with spaces, is stored trimmed
    expect(await updateUserProfile(TARGET, { name: `  ${long(100)}  ` })).toEqual({})
    expect(storedUser(TARGET).name).toBe(long(100))

    expect(await updateUserProfileFull(TARGET, { ...FULL, firstName: ` ${long(100)} `, lastName: `${long(100)} ` })).toEqual({})
    expect(storedUser(TARGET)).toMatchObject({ name: long(100), last_name: long(100) })

    // a website of exactly 200 characters and a logo on this project's Cloudinary
    const website = websiteOf(200)
    const logo = trusted('logo.png')
    expect(website).toHaveLength(200)
    expect(await updateUserProfileFull(TARGET, { ...AGENT, website, companyLogoUrl: logo })).toEqual({})
    expect(storedUser(TARGET)).toMatchObject({ website, company_logo_url: logo })

    // an account is created with a name at the bound
    expect(await createAdminUser({ ...NEW_ACCOUNT, firstName: long(100), lastName: long(100) })).toEqual({ userId: 'new-auth-user' })
    expect(state.authAdminCalls.filter((c) => c.name === 'inviteUserByEmail')).toHaveLength(1)
    expect(state.authAdminCalls.filter((c) => c.name === 'createUser'), 'Task 923 R159: the account is invited, never created with a password').toEqual([])
    expect(db.tables.users.find((u) => u.id === 'new-auth-user')).toMatchObject({ name: long(100), last_name: long(100) })

    // the person's own profile
    arrange(OWN)
    expect(await updateCabinetProfile({ ...CABINET, name: ` ${long(100)} ` })).toEqual({})
    expect(storedUser(OWN).name).toBe(long(100))

    // the avatar route stores an address on this project's Cloudinary
    arrange(ADMIN)
    const response = await uploadAvatar(avatarRequest())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: trusted('new-avatar.jpg') })
    expect(storedUser(ADMIN).avatar_url).toBe(trusted('new-avatar.jpg'))
    expect(state.deletes, 'nothing was released').toEqual([])
  })
})
