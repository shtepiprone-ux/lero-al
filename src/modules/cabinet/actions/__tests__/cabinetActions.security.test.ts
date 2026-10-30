// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the account actions of the cabinet.
 *  - saved searches belong to their owner: B cannot read, change or delete A's, an anonymous caller cannot touch any;
 *  - the profile update writes ONLY its own whitelist of columns, for the caller's own row, whatever extra fields the browser sends, and refuses a user type outside
 *    the two a person may choose and a currency that is not in the catalogue;
 *  - e-mail change: limited to 3 per hour, the token stored is a hash (the raw token only in the e-mailed link), the confirmation goes to the NEW address, the link is
 *    single-use and expires;
 *  - password change: the current password must be right, the new one must meet the rules, and a wrong current password changes nothing.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string; email?: string } | null = null
let currentPasswordOk = true
const sentEmails: Record<string, unknown>[] = []
const adminAuthCalls: { name: string; args: unknown[] }[] = []
const passwordUpdates: Record<string, unknown>[] = []
const sessionSignOuts: unknown[] = []
const deletions: { userId: string; reason: string }[] = []

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ ...db.client, auth: { signOut: async (opts: unknown) => { sessionSignOuts.push(opts); return { error: null } } } }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: db.from,
    rpc: async (name: string, args: { q?: string }) => (name === 'account_has_password'
      ? { data: true, error: null }
      : { data: name === 'admin_search_users_by_email' && String(args?.q).includes('taken') ? [{ id: 'someone-else' }] : [], error: null }),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => {
      adminAuthCalls.push({ name, args })
      if (name === 'getUserById') return { data: { user: { id: args[0], email: args[0] === 'someone-else' ? 'taken@example.com' : 'old@example.com', app_metadata: { providers: ['email'] } } }, error: null }
      if (name === 'updateUserById' && (args[1] as { password?: string })?.password) passwordUpdates.push(args[1] as Record<string, unknown>)
      return { data: {}, error: null }
    } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signInWithPassword: async () => ({ error: currentPasswordOk ? null : { message: 'Invalid login credentials' } }), signOut: async () => ({ error: null }) } }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (a: Record<string, unknown>) => { sentEmails.push(a) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string, options: { reason: string }) => { deletions.push({ userId, reason: options.reason }); return { ok: true, filesNotRemoved: 0 } } }))

import {
  changeCabinetPassword, consumeEmailChangeToken, deleteAllSavedSearches, deleteOwnAccount as realDeleteOwnAccount, deleteSavedSearch, initiateEmailChange as realInitiateEmailChange,
  resendEmailVerification, saveSavedSearch, updateCabinetProfile, updateLastViewed, updateSavedSearchFrequency, updateSavedSearchNotify,
} from '../index'

// Since Task 923 R70 (a) the e-mail change and the deletion need the current password; the account of these tests has one and sends it (the re-authentication itself is
// proved in reauth.security.test.ts).
const initiateEmailChange = (data: Parameters<typeof realInitiateEmailChange>[0]) => realInitiateEmailChange({ currentPassword: 'Right-Passw0rd!', ...data })
const deleteOwnAccount = () => realDeleteOwnAccount({ password: 'Right-Passw0rd!' })

const A = { id: 'user-a', email: 'a@example.com' }
const B = { id: 'user-b', email: 'b@example.com' }

beforeEach(() => {
  db = createFakeDb({
    saved_searches: [{ id: 's-a', user_id: 'user-a', name: 'A search', notify_frequency: 'daily', notify_email: false, filters_hash: 'h-a' }],
    currencies: [{ code: 'EUR', is_active: true }, { code: 'ALL', is_active: true }, { code: 'XXX', is_active: false }],
    users: [{ id: 'user-a', name: 'A', role: 'user', user_type: 'private', is_verified: false, status: 'active' }, { id: 'user-b', name: 'B', role: 'user', user_type: 'private', is_verified: false, status: 'active' }],
    email_change_tokens: [],
  })
  currentUser = B
  currentPasswordOk = true
  sentEmails.length = 0
  adminAuthCalls.length = 0
  passwordUpdates.length = 0
  sessionSignOuts.length = 0
  deletions.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('saved searches', () => {
  it('B cannot update, delete or mark viewed A\'s saved search', async () => {
    await updateSavedSearchFrequency('s-a', 'instant')
    await updateSavedSearchNotify('s-a', true)
    await updateLastViewed('s-a')
    await deleteSavedSearch('s-a')
    const row = db.tables.saved_searches.find((s) => s.id === 's-a')
    expect(row).toMatchObject({ notify_frequency: 'daily', notify_email: false })
    expect(row).toBeDefined()
  })

  it('B\'s "delete all" removes only B\'s own searches', async () => {
    await deleteAllSavedSearches()
    expect(db.tables.saved_searches.some((s) => s.id === 's-a')).toBe(true)
  })

  it('a saved search is stored for the caller, never for an id of the browser\'s choosing', async () => {
    const res = await saveSavedSearch({ type: 'flat' }, 'My flats')
    expect(res.id).toBeDefined()
    const row = db.tables.saved_searches.find((s) => s.id === res.id)
    expect(row?.user_id).toBe('user-b')
  })

  it('the owner can change and delete their own', async () => {
    currentUser = A
    expect(await updateSavedSearchFrequency('s-a', 'weekly')).toEqual({})
    expect(db.tables.saved_searches[0].notify_frequency).toBe('weekly')
    expect(await deleteSavedSearch('s-a')).toEqual({})
    expect(db.tables.saved_searches).toHaveLength(0)
  })

  it('a frequency outside instant / daily / weekly is refused and nothing changes', async () => {
    currentUser = A
    const res = await updateSavedSearchFrequency('s-a', 'every-second' as never)
    expect('error' in res && !!res.error).toBe(true)
    expect(db.tables.saved_searches[0].notify_frequency).toBe('daily')
  })

  it('an anonymous caller is refused by every saved-search action and nothing is written', async () => {
    currentUser = null
    const results = await Promise.all([
      saveSavedSearch({}, 'x'), updateSavedSearchFrequency('s-a', 'daily'), updateSavedSearchNotify('s-a', true), updateLastViewed('s-a'), deleteSavedSearch('s-a'), deleteAllSavedSearches(),
    ])
    for (const r of results) expect(r.error).toBeTruthy()
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })
})

describe('updateCabinetProfile', () => {
  const base = { name: 'Alba', phone: '+355691234567', whatsapp: '', companyName: null, userType: 'private' as const, locationId: 1, preferredCurrency: 'EUR' as never }

  it('writes only the whitelist of columns, for the caller\'s own row, ignoring extra fields', async () => {
    const hostile = { ...base, role: 'admin', is_verified: true, status: 'active', id: 'user-a', block_reason: 'x', company_id: 'c1' }
    expect(await updateCabinetProfile(hostile as never)).toEqual({})
    const update = db.log.find((l) => l.table === 'users' && l.op === 'update')!
    expect(Object.keys(update.values as object).sort()).toEqual(['company_name', 'location_id', 'name', 'phone', 'preferred_currency', 'user_type', 'whatsapp'])
    expect(update.filters).toEqual([['id', 'eq', 'user-b']])
    expect(db.tables.users.find((u) => u.id === 'user-b')).toMatchObject({ role: 'user', is_verified: false })
    expect(db.tables.users.find((u) => u.id === 'user-a')?.name).toBe('A')
  })

  it.each(['admin', 'developer', 'moderator', '', 'AGENT'])('refuses the user type %j', async (userType) => {
    const res = await updateCabinetProfile({ ...base, userType } as never)
    expect(res.error).toBeTruthy()
    expect(db.log.filter((l) => l.table === 'users' && l.op === 'update')).toEqual([])
  })

  it('refuses a currency that is not an active one of the catalogue', async () => {
    expect(await updateCabinetProfile({ ...base, preferredCurrency: 'XXX' as never })).toEqual({ error: 'save_failed' })
    expect(await updateCabinetProfile({ ...base, preferredCurrency: 'DROP TABLE' as never })).toEqual({ error: 'save_failed' })
  })

  it('a business account keeps its company name, a private one drops it', async () => {
    await updateCabinetProfile({ ...base, userType: 'agent', companyName: ' Nova ' } as never)
    expect(db.log.find((l) => l.op === 'update')?.values).toMatchObject({ company_name: 'Nova', user_type: 'agent' })
    await updateCabinetProfile({ ...base, userType: 'private', companyName: 'Nova' } as never)
    expect(db.log.filter((l) => l.op === 'update').at(-1)?.values).toMatchObject({ company_name: null })
  })

  it('an anonymous caller is refused and nothing is written', async () => {
    currentUser = null
    expect(await updateCabinetProfile(base as never)).toEqual({ error: 'Unauthorized' })
    expect(db.log).toEqual([])
  })
})

describe('deleteOwnAccount', () => {
  it('an anonymous caller is refused and nothing is deleted', async () => {
    currentUser = null
    expect(await deleteOwnAccount()).toEqual({ error: 'Unauthorized' })
    expect(db.log.filter((l) => l.op === 'delete')).toEqual([])
    expect(adminAuthCalls).toEqual([])
    expect(deletions).toEqual([])
  })

  it('asks for the deletion of ONLY the caller\'s own account, as "self"', async () => {
    expect(await deleteOwnAccount()).toEqual({})
    expect(deletions).toEqual([{ userId: 'user-b', reason: 'self' }])
    expect(db.tables.users.map((u) => u.id).sort(), 'the other person\'s profile is untouched').toEqual(['user-a', 'user-b'])
  })
})

describe('e-mail change', () => {
  it('stores a HASH of the token; the raw token is only in the link that is e-mailed to the new address', async () => {
    const res = await initiateEmailChange({ newEmail: ' New@Example.com ', locale: 'en' })
    expect(res).toEqual({ pendingEmail: 'new@example.com' })
    const stored = db.tables.email_change_tokens[0]
    expect(stored.token_hash).toMatch(/^[0-9a-f]{64}$/)
    const mail = sentEmails[0] as { verificationUrl: string; newEmail: string; oldEmail: string }
    const raw = new URL(mail.verificationUrl).searchParams.get('token')!
    expect(raw).toMatch(/^[0-9a-f]{64}$/)
    expect(raw).not.toBe(stored.token_hash)
    expect(mail.newEmail).toBe('new@example.com')
    expect(mail.oldEmail).toBe('old@example.com')
    expect(stored.user_id).toBe('user-b')
    expect(Date.parse(stored.expires_at as string)).toBeGreaterThan(Date.now())
  })

  it('allows 3 requests an hour and refuses the 4th, sending nothing for it', async () => {
    for (let i = 0; i < 3; i++) expect((await initiateEmailChange({ newEmail: `n${i}@example.com`, locale: 'en' })).pendingEmail).toBeTruthy()
    const fourth = await initiateEmailChange({ newEmail: 'n4@example.com', locale: 'en' })
    expect(fourth.error).toBeTruthy()
    expect(sentEmails).toHaveLength(3)
  })

  it('refuses the current address and an address that belongs to another account', async () => {
    expect((await initiateEmailChange({ newEmail: 'OLD@example.com', locale: 'en' })).error).toBeTruthy()
    expect((await initiateEmailChange({ newEmail: 'taken@example.com', locale: 'en' })).error).toBeTruthy()
    expect(sentEmails).toEqual([])
    expect(db.tables.email_change_tokens).toEqual([])
  })

  it.each([
    [''], ['no-at-sign'], ['a@b'], ['a@b.c'], ['a b@example.com'], ['a@example.com, b@example.com'], ['a@example.com\r\nBcc: x@y.zz'], ['<script>@example.com'],
    ['Ana <ana@example.com>'], ['a@@example.com'], [`${'a'.repeat(250)}@example.com`], [undefined as unknown as string], [{ toString: () => 'a@example.com' } as unknown as string],
  ])('refuses the new address %j: no token, no e-mail', async (newEmail) => {
    const res = await initiateEmailChange({ newEmail, locale: 'en' })
    expect(res.error).toBeTruthy()
    expect(res.pendingEmail).toBeUndefined()
    expect(db.tables.email_change_tokens).toEqual([])
    expect(sentEmails).toEqual([])
  })

  it('an anonymous caller is refused', async () => {
    currentUser = null
    expect(await initiateEmailChange({ newEmail: 'n@example.com', locale: 'en' })).toEqual({ error: 'Unauthorized' })
    expect(await resendEmailVerification({ locale: 'en' })).toEqual({ error: 'Unauthorized' })
    expect(sentEmails).toEqual([])
  })

  it('resend makes a NEW token (the old link stops working) for the caller\'s own pending change only', async () => {
    await initiateEmailChange({ newEmail: 'n@example.com', locale: 'en' })
    const before = db.tables.email_change_tokens[0].token_hash
    db.tables.email_change_tokens.push({ id: 'other', user_id: 'user-a', new_email: 'x@example.com', token_hash: 'a'.repeat(64), consumed_at: null, expires_at: new Date(Date.now() + 1e6).toISOString(), created_at: new Date(Date.now() + 5).toISOString() })
    expect(await resendEmailVerification({ locale: 'en' })).toEqual({})
    // Task 923 R66 (d): a resend stores a NEW row and retires the old one (it does not re-arm the old row); another person's token is not touched
    const tokens = db.tables.email_change_tokens
    expect(tokens[0].consumed_at, 'the old link is retired').toBeTruthy()
    expect(tokens.find((t) => t.id === 'other')).toMatchObject({ token_hash: 'a'.repeat(64), consumed_at: null })
    const live = tokens.filter((t) => t.user_id === 'user-b' && !t.consumed_at)
    expect(live).toHaveLength(1)
    expect(live[0].token_hash).not.toBe(before)
  })
})

describe('consumeEmailChangeToken', () => {
  async function pending() {
    await initiateEmailChange({ newEmail: 'new@example.com', locale: 'en' })
    const raw = new URL((sentEmails[0] as { verificationUrl: string }).verificationUrl).searchParams.get('token')!
    return raw
  }

  it('a valid token changes the e-mail once and is then used up', async () => {
    const raw = await pending()
    expect(await consumeEmailChangeToken(raw)).toEqual({ success: true })
    expect(adminAuthCalls.some((c) => c.name === 'updateUserById' && (c.args[1] as { email?: string }).email === 'new@example.com')).toBe(true)
    adminAuthCalls.length = 0
    expect(await consumeEmailChangeToken(raw)).toMatchObject({ errorCode: 'consumed' })
    expect(adminAuthCalls).toEqual([])
  })

  it.each([[''], ['not-a-token'], ['0'.repeat(64)], ['a'.repeat(5000)]])('the token %j changes nothing', async (raw) => {
    expect(await consumeEmailChangeToken(raw)).toMatchObject({ errorCode: 'invalid' })
    expect(adminAuthCalls).toEqual([])
  })

  it('an expired token changes nothing', async () => {
    const raw = await pending()
    db.tables.email_change_tokens[0].expires_at = new Date(Date.now() - 1000).toISOString()
    expect(await consumeEmailChangeToken(raw)).toMatchObject({ errorCode: 'expired' })
    expect(adminAuthCalls.filter((c) => c.name === 'updateUserById')).toEqual([])
  })

  it('the HASH (what the database holds) is not a valid token: knowing the table is not enough', async () => {
    await pending()
    const hash = db.tables.email_change_tokens[0].token_hash as string
    expect(await consumeEmailChangeToken(hash)).toMatchObject({ errorCode: 'invalid' })
  })
})

describe('changeCabinetPassword', () => {
  beforeEach(() => { currentUser = { id: 'user-b', email: 'b@example.com' } })

  it('changes the password when the current one is right and the new one is strong', async () => {
    expect(await changeCabinetPassword({ currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' })).toEqual({ ok: true })
    expect(passwordUpdates).toEqual([{ password: 'NewStr0ng!Passw0rd' }])
    expect(sessionSignOuts).toEqual([{ scope: 'global' }])
  })

  it('a wrong current password changes nothing', async () => {
    currentPasswordOk = false
    expect(await changeCabinetPassword({ currentPassword: 'wrong', newPassword: 'NewStr0ng!Passw0rd' })).toEqual({ ok: false, reason: 'invalid_current' })
    expect(passwordUpdates).toEqual([])
    expect(sessionSignOuts).toEqual([])
  })

  it.each([['short'], ['alllowercase1!'], ['NoDigits!!!!!'], ['']])('a weak new password %j is refused before the current one is even tried', async (pw) => {
    expect(await changeCabinetPassword({ currentPassword: 'OldPassw0rd!', newPassword: pw })).toEqual({ ok: false, reason: 'weak_password' })
    expect(passwordUpdates).toEqual([])
  })

  it('the same password is refused', async () => {
    expect(await changeCabinetPassword({ currentPassword: 'SamePassw0rd!x', newPassword: 'SamePassw0rd!x' })).toEqual({ ok: false, reason: 'same_password' })
  })

  it('an anonymous caller is refused', async () => {
    currentUser = null
    expect(await changeCabinetPassword({ currentPassword: 'a', newPassword: 'NewStr0ng!Passw0rd' })).toEqual({ ok: false, reason: 'session_expired' })
    expect(passwordUpdates).toEqual([])
  })
})

describe('phone numbers are stored in the form the forms produce (finding S54)', () => {
  const profile = { name: 'Alba', phone: '+355691234567', whatsapp: '', companyName: null, userType: 'private' as const, locationId: 1, preferredCurrency: 'EUR' as never }
  const writes = () => db.log.filter((l) => l.table === 'users' && l.op === 'update')

  it.each([['067 123 4567'], ['355691234567'], ['+355 69 123 4567'], ['javascript:alert(1)'], ['+355691234567?text=x'], ['+0691234567'], ['+3556912'], ['<b>x</b>']])('refuses the phone %j and writes nothing', async (phone) => {
    expect(await updateCabinetProfile({ ...profile, phone })).toEqual({ error: 'invalid_phone' })
    expect(await updateCabinetProfile({ ...profile, whatsapp: phone })).toEqual({ error: 'invalid_phone' })
    expect(writes()).toEqual([])
  })

  it('saves a valid number, trimmed, and an empty one as nothing', async () => {
    expect(await updateCabinetProfile({ ...profile, phone: ' +355691234567 ', whatsapp: '+12025550123' })).toEqual({})
    expect(writes()[0].values).toMatchObject({ phone: '+355691234567', whatsapp: '+12025550123' })
    expect(await updateCabinetProfile({ ...profile, phone: '', whatsapp: '   ' })).toEqual({})
    expect(writes()[1].values).toMatchObject({ phone: null, whatsapp: null })
  })

  it('a missing phone is allowed', async () => {
    expect(await updateCabinetProfile({ ...profile, phone: undefined, whatsapp: undefined })).toEqual({})
  })
})

// Task 923 R38 (cases SEC-S29-SRV-DENY, SEC-S30-SRV-DENY, SEC-S35-SRV-DENY)
it('[SEC-S29-SRV-DENY] updateCabinetProfile accepts only the account types private and agent', async () => {
  const base = { name: 'Alba', phone: '+355691234567', whatsapp: '', companyName: null, locationId: 1, preferredCurrency: 'EUR' as never }
  for (const userType of ['admin', 'definitely-unknown']) {
    expect((await updateCabinetProfile({ ...base, userType } as never)).error, userType).toBeTruthy()
  }
  expect(db.log.filter((l) => l.table === 'users' && l.op === 'update')).toEqual([])
  expect(await updateCabinetProfile({ ...base, userType: 'agent' } as never)).toEqual({})     // the control: a permitted type is stored
})

it('[SEC-S30-SRV-DENY] updateSavedSearchFrequency accepts only the known frequencies', async () => {
  currentUser = A
  const res = await updateSavedSearchFrequency('s-a', 'every-second' as never)
  expect('error' in res && !!res.error).toBe(true)
  expect(db.tables.saved_searches[0].notify_frequency).toBe('daily')
  expect(await updateSavedSearchFrequency('s-a', 'weekly')).toEqual({})                         // the control
})

it('[SEC-S35-SRV-DENY] A new e-mail address is one plain address of at most 254 characters, escaped in the confirmation e-mail', async () => {
  for (const newEmail of ['a@example.com, b@example.com', `${'a'.repeat(250)}@example.com`, '<script>@example.com']) {
    const res = await initiateEmailChange({ newEmail, locale: 'en' })
    expect(res.error, newEmail).toBeTruthy()
    expect(res.pendingEmail).toBeUndefined()
  }
  expect(db.tables.email_change_tokens).toEqual([])
  expect(sentEmails).toEqual([])
  expect((await initiateEmailChange({ newEmail: 'fresh@example.com', locale: 'en' })).pendingEmail).toBeTruthy()   // the control
})

// Task 923 R172 (case SEC-X-SRV-PROFILE-PROTECTED-DENY, release blockers S59 and S60)
it('[SEC-X-SRV-PROFILE-PROTECTED-DENY] A session cannot change the protected profile columns role, status, verification, block, suspension, deletion or public id', async () => {
  Object.assign(db.tables.users.find((u) => u.id === 'user-b')!, { status: 'inactive' })
  const hostile = {
    name: 'Alba', phone: '+355691234567', whatsapp: '', companyName: null, userType: 'private', locationId: 1, preferredCurrency: 'EUR',
    role: 'admin', status: 'active', is_verified: true, blocked_at: null, block_reason: null, suspended_until: null, deleted_at: null, public_id: 'P-1', id: 'user-a',
  }
  expect(await updateCabinetProfile(hostile as never), 'the form fields are saved').toEqual({})
  const updates = db.log.filter((l) => l.table === 'users' && l.op === 'update')
  expect(updates, 'one users update').toHaveLength(1)
  expect(Object.keys(updates[0].values as object).sort(), 'only the form columns are written').toEqual(['company_name', 'location_id', 'name', 'phone', 'preferred_currency', 'user_type', 'whatsapp'])
  expect(updates[0].filters, 'only the caller\'s own row').toEqual([['id', 'eq', 'user-b']])
  expect(db.tables.users.find((u) => u.id === 'user-b'), 'role, status and verification are unchanged').toMatchObject({ role: 'user', status: 'inactive', is_verified: false })
})
