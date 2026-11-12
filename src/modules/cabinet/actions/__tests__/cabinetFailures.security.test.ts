// @vitest-environment node
/**
 * The failure paths of the cabinet account actions (Task 923 Revision 7): a blocked person writes nothing, a database failure is reported by a key and does not
 * leave a half-done change, account deletion asks for the one complete deletion of the caller's own account only (Task 923 R142: nothing is archived, a failure is
 * `delete_failed`), and the error texts come in the person's language.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'
import { PUBLIC_LISTINGS_CACHE_TAG } from '@/modules/listings/lib/cacheTags'

let db = createFakeDb()
let currentUser: { id: string; email?: string } | null = null
let blocked: string | null = null
let failing: { table: string; op: string; error: { code?: string; message: string } } | null = null
let authUpdateError: { message: string } | null = null
let getUserThrows = false
let deleteAccountResult: { ok: true; filesNotRemoved: number } | { ok: false; error: 'delete_failed' } = { ok: true, filesNotRemoved: 0 }
const deletions: { userId: string; reason: string }[] = []
const transitions: { id: string; to: string; actor: Record<string, unknown> }[] = []
const authAdminCalls: { name: string; args: unknown[] }[] = []
const sentEmails: Record<string, unknown>[] = []

function fromWithFailure(t: string) {
  const c = db.client.from(t) as Record<string, unknown>
  if (failing && failing.table === t) {
    const { op, error } = failing
    const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error }) : chain), apply: () => chain })
    c[op] = () => chain
  }
  return c
}
const sessionSignOuts: unknown[] = []
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: (t: string) => fromWithFailure(t), auth: { signOut: async (opts: unknown) => { sessionSignOuts.push(opts); return { error: null } } } }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => fromWithFailure(t),
    rpc: async (name: string) => (name === 'account_has_password' ? { data: true, error: null } : { data: [], error: null }),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => {
      authAdminCalls.push({ name, args })
      if (name === 'getUserById') return { data: { user: { id: args[0], email: 'old@example.com', app_metadata: { providers: ['email'] } } }, error: null }
      if (name === 'listUsers') return { data: { users: [] }, error: null }
      if (name === 'updateUserById') return { error: authUpdateError }
      return { data: {}, error: null }
    } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => { if (getUserThrows) throw new Error('session store down'); return currentUser } }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => blocked }))
// Task 964 R1-2: a successful account deletion expires the public-listings tag, a failed or refused one does not
const expiredTags = vi.hoisted(() => [] as string[])
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, updateTag: (tag: string) => { expiredTags.push(tag) } }))
const cookieWrites: unknown[][] = []
const storedCookies = [{ name: 'sb-access', value: 'jwt' }]
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => storedCookies, set: (...a: unknown[]) => { cookieWrites.push(a) } }) }))
const verifyOptions: { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } }[] = []
vi.mock('@supabase/ssr', () => ({ createServerClient: (_u: string, _k: string, options: never) => { verifyOptions.push(options); return { auth: { signInWithPassword: async () => ({ error: null }), signOut: async () => undefined } } } }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (a: Record<string, unknown>) => { sentEmails.push(a) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async (id: string, to: string, actor: Record<string, unknown>) => { transitions.push({ id, to, actor }); return { ok: true } } }))
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string, options: { reason: string }) => { deletions.push({ userId, reason: options.reason }); return deleteAccountResult } }))

import {
  changeCabinetPassword, consumeEmailChangeToken, deleteOwnAccount as realDeleteOwnAccount, initiateEmailChange as realInitiateEmailChange, resendEmailVerification, updateCabinetProfile,
} from '../index'

// Since Task 923 R70 (a) the e-mail change and the deletion need the current password; the account of these tests has one and sends it (the re-authentication itself is
// proved in reauth.security.test.ts). Every assertion of this file is unchanged (R81 (e)).
const initiateEmailChange = (data: Parameters<typeof realInitiateEmailChange>[0]) => realInitiateEmailChange({ currentPassword: 'Right-Passw0rd!', ...data })
const deleteOwnAccount = () => realDeleteOwnAccount({ password: 'Right-Passw0rd!' })

const profile = { name: 'Alba', phone: '+355691234567', whatsapp: '', companyName: null, userType: 'private' as const, locationId: 1, preferredCurrency: 'EUR' as never }

beforeEach(() => {
  db = createFakeDb({
    users: [{ id: 'user-b', name: 'B', pending_email: null }, { id: 'user-a', name: 'A' }],
    listings: [
      { id: 'b-active', user_id: 'user-b', status: 'active' }, { id: 'b-pending', user_id: 'user-b', status: 'pending' }, { id: 'b-sold', user_id: 'user-b', status: 'sold' },
      { id: 'b-archived', user_id: 'user-b', status: 'archived' }, { id: 'a-active', user_id: 'user-a', status: 'active' },
    ],
    currencies: [{ code: 'EUR', is_active: true }],
    email_change_tokens: [],
  })
  currentUser = { id: 'user-b', email: 'b@example.com' }
  blocked = null
  failing = null
  authUpdateError = null
  getUserThrows = false
  deleteAccountResult = { ok: true, filesNotRemoved: 0 }
  deletions.length = 0
  transitions.length = 0
  authAdminCalls.length = 0
  sentEmails.length = 0
  cookieWrites.length = 0
  verifyOptions.length = 0
  sessionSignOuts.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('updateCabinetProfile', () => {
  it.each(['account_blocked', 'account_suspended'])('a person who is %s writes nothing', async (reason) => {
    blocked = reason
    expect(await updateCabinetProfile(profile)).toEqual({ error: reason })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('a database failure is "save_failed"', async () => {
    failing = { table: 'users', op: 'update', error: { message: 'x' } }
    expect(await updateCabinetProfile(profile)).toEqual({ error: 'save_failed' })
  })
})

describe('deleteOwnAccount', () => {
  it('asks for the one complete deletion of the caller\'s own account only, as "self": nothing is archived and the action writes no row', async () => {
    expiredTags.length = 0
    expect(await deleteOwnAccount()).toEqual({})
    expect(expiredTags, 'the listings went with the account: the sitemap tag expires once').toEqual([PUBLIC_LISTINGS_CACHE_TAG])
    expect(deletions).toEqual([{ userId: 'user-b', reason: 'self' }])
    expect(transitions, 'the listings are deleted with the account, never archived first').toEqual([])
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
    expect(authAdminCalls.some((c) => c.name === 'deleteUser'), 'the Auth user is removed by deleteAccount, not by the action').toBe(false)
    expect(db.tables.users.map((u) => u.id).sort()).toEqual(['user-a', 'user-b'])
  })

  it('when the deletion fails the answer is "delete_failed": there is no half-deleted answer any more', async () => {
    deleteAccountResult = { ok: false, error: 'delete_failed' }
    expiredTags.length = 0
    expect(await deleteOwnAccount()).toEqual({ error: 'delete_failed' })
    expect(deletions).toEqual([{ userId: 'user-b', reason: 'self' }])
    expect(expiredTags, 'a failed deletion expires nothing').toEqual([])
  })

  it('a file that could not be removed does not make the deletion fail', async () => {
    deleteAccountResult = { ok: true, filesNotRemoved: 2 }
    expect(await deleteOwnAccount()).toEqual({})
  })

  it('an anonymous caller deletes nothing', async () => {
    currentUser = null
    expiredTags.length = 0
    expect(await deleteOwnAccount()).toEqual({ error: 'Unauthorized' })
    expect(db.log).toEqual([])
    expect(transitions).toEqual([])
    expect(deletions).toEqual([])
    expect(expiredTags, 'a refused call expires nothing').toEqual([])
  })

  it('a person with no listings is asked for the same single deletion', async () => {
    db.tables.listings = db.tables.listings.filter((l) => l.user_id !== 'user-b')
    expect(await deleteOwnAccount()).toEqual({})
    expect(deletions).toEqual([{ userId: 'user-b', reason: 'self' }])
  })
})

describe('e-mail change failures and languages', () => {
  it('a token that cannot be stored is "failed" and nothing is mailed', async () => {
    failing = { table: 'email_change_tokens', op: 'insert', error: { message: 'x' } }
    expect(await initiateEmailChange({ newEmail: 'n@example.com', locale: 'en' })).toEqual({ error: 'Could not initiate email change. Please try again.' })
    expect(sentEmails).toEqual([])
  })

  it.each([
    ['sq', 'Ndryshimi i emailit dështoi. Provoni sërish.'], ['en', 'Could not initiate email change. Please try again.'],
    ['uk', 'Не вдалось ініціювати зміну email. Спробуйте ще раз.'], ['it', 'Impossibile avviare il cambio email. Riprova.'], ['xx', 'Could not initiate email change. Please try again.'],
  ])('the error for the language %s is in that language (English for an unknown one)', async (locale, text) => {
    expect(await initiateEmailChange({ newEmail: 'bad', locale })).toEqual({ error: text })
  })

  it('resending with nothing pending says so in the person\'s language', async () => {
    expect(await resendEmailVerification({ locale: 'uk' })).toEqual({ error: 'Немає активного запиту зміни email. Надішліть новий.' })
    expect(await resendEmailVerification({ locale: 'it' })).toEqual({ error: 'Nessuna richiesta di cambio email attiva. Inizia una nuova.' })
  })

  it('resending ignores a request that expired or was already used', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    db.tables.email_change_tokens.push({ id: 't1', user_id: 'user-b', new_email: 'x@example.com', token_hash: 'a'.repeat(64), consumed_at: null, expires_at: past, created_at: past })
    db.tables.email_change_tokens.push({ id: 't2', user_id: 'user-b', new_email: 'y@example.com', token_hash: 'b'.repeat(64), consumed_at: past, expires_at: new Date(Date.now() + 1e6).toISOString(), created_at: past })
    expect(await resendEmailVerification({ locale: 'en' })).toEqual({ error: 'No active email change request found. Please start a new request.' })
    expect(sentEmails).toEqual([])
  })
})

describe('consumeEmailChangeToken failures', () => {
  async function rawToken() {
    await initiateEmailChange({ newEmail: 'new@example.com', locale: 'en' })
    return new URL((sentEmails[0] as { verificationUrl: string }).verificationUrl).searchParams.get('token')!
  }

  it('when the token cannot be marked as used nothing is changed', async () => {
    const raw = await rawToken()
    failing = { table: 'email_change_tokens', op: 'update', error: { message: 'x' } }
    expect(await consumeEmailChangeToken(raw)).toEqual({ error: 'confirmation_failed', errorCode: 'invalid' })
    expect(authAdminCalls.some((c) => c.name === 'updateUserById')).toBe(false)
  })

  it('when the sign-in address cannot be changed the answer says so and the pending address is kept', async () => {
    const raw = await rawToken()
    db.tables.users.find((u) => u.id === 'user-b')!.pending_email = 'new@example.com'
    authUpdateError = { message: 'boom' }
    expect(await consumeEmailChangeToken(raw)).toEqual({ error: 'email_update_failed' })
    expect(db.tables.users.find((u) => u.id === 'user-b')?.pending_email).toBe('new@example.com')
  })
})

describe('changeCabinetPassword when the session store fails', () => {
  it('is "server_error", never a crash', async () => {
    getUserThrows = true
    expect(await changeCabinetPassword({ currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' })).toEqual({ ok: false, reason: 'server_error' })
  })
})

describe('the password re-check client', () => {
  it('reads the session cookies but never writes one back (a correct password must not replace the live session)', async () => {
    await changeCabinetPassword({ currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' })
    expect(verifyOptions).toHaveLength(1)
    const { getAll, setAll } = verifyOptions[0].cookies
    expect(getAll()).toEqual(storedCookies)
    setAll([{ name: 'sb-access', value: 'attacker-or-new', options: {} }])
    expect(cookieWrites).toEqual([])
  })
})
