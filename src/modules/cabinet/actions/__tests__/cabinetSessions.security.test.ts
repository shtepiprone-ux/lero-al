// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S55): what happens to an account's SESSIONS when its password or e-mail changes, plus the saved-search names and the
 * database failures of the cabinet actions.
 *  - changing the password ends every session of the account (Task 923 R156), and a failure of that step does not undo the change;
 *  - the e-mail change does not pretend to end sessions with a call that cannot work.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string; email?: string } | null = null
let currentPasswordOk = true
let verifyMessage = 'Invalid login credentials'
let signOutThrows = false
let profileReadThrows = false
let passwordUpdateFails = false
const signOuts: unknown[] = []
const sessionSignOuts: unknown[] = []
const adminAuthCalls: { name: string; args: unknown[] }[] = []
const passwordUpdates: Record<string, unknown>[] = []
const sentEmails: Record<string, unknown>[] = []
let revalidated = 0

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    ...db.client,
    auth: { signOut: async (opts: unknown) => { sessionSignOuts.push(opts); if (signOutThrows) throw new Error('offline'); return { error: null } } },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => { if (profileReadThrows && t === 'users') throw new Error('profile read failed'); return db.from(t) },
    rpc: async (name: string) => (name === 'account_has_password' ? { data: true, error: null } : { data: [], error: null }),
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async (...args: unknown[]) => {
      adminAuthCalls.push({ name, args })
      if (name === 'getUserById') return { data: { user: { id: args[0], email: 'old@example.com', app_metadata: { providers: ['email'] } } }, error: null }
      if (name === 'updateUserById' && (args[1] as { password?: string })?.password) {
        if (passwordUpdateFails) return { data: {}, error: { message: 'update refused' } }
        passwordUpdates.push(args[1] as Record<string, unknown>)
      }
      return { data: {}, error: null }
    } }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => { revalidated++ } }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: async () => ({ error: currentPasswordOk ? null : { message: verifyMessage } }),
      signOut: async (opts: unknown) => { signOuts.push(opts); if (signOutThrows) throw new Error('offline'); return { error: null } },
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (a: Record<string, unknown>) => { sentEmails.push(a) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import {
  changeCabinetPassword, consumeEmailChangeToken, deleteAllSavedSearches, deleteSavedSearch, initiateEmailChange as realInitiateEmailChange, saveSavedSearch, updateLastViewed,
  updateSavedSearchFrequency, updateSavedSearchNotify,
} from '../index'

// Since Task 923 R70 (a) the e-mail change needs the current password; the account of these tests has one and sends it.
const initiateEmailChange = (data: Parameters<typeof realInitiateEmailChange>[0]) => realInitiateEmailChange({ currentPassword: 'Right-Passw0rd!', ...data })

const good = { currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' }

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'user-b', name: 'B', pending_email: null }], saved_searches: [{ id: 's-b', user_id: 'user-b', name: 'old', notify_frequency: 'daily', filters_hash: 'h' }], email_change_tokens: [] })
  currentUser = { id: 'user-b', email: 'b@example.com' }
  currentPasswordOk = true
  verifyMessage = 'Invalid login credentials'
  signOutThrows = false
  profileReadThrows = false
  passwordUpdateFails = false
  signOuts.length = 0
  sessionSignOuts.length = 0
  adminAuthCalls.length = 0
  passwordUpdates.length = 0
  sentEmails.length = 0
  revalidated = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('changing the password ends every session of the account', () => {
  it('after a successful change every session is signed out, once, through the session client', async () => {
    expect(await changeCabinetPassword(good)).toEqual({ ok: true })
    expect(passwordUpdates).toEqual([{ password: good.newPassword }])
    expect(sessionSignOuts).toEqual([{ scope: 'global' }])
    expect(signOuts).toEqual([])
  })

  const refused: [string, () => void, { currentPassword: string; newPassword: string }, string][] = [
    ['a wrong current password', () => { currentPasswordOk = false }, good, 'invalid_current'],
    ['a weak new password', () => undefined, { currentPassword: good.currentPassword, newPassword: 'weak' }, 'weak_password'],
    ['the same password', () => undefined, { currentPassword: good.newPassword, newPassword: good.newPassword }, 'same_password'],
    ['no session', () => { currentUser = null }, good, 'session_expired'],
    ['a session with no e-mail address', () => { currentUser = { id: 'user-b' } }, good, 'session_expired'],
  ]
  it.each(refused)('%s signs nobody out and changes nothing', async (_l, setup, input, reason) => {
    setup()
    expect(await changeCabinetPassword(input)).toEqual({ ok: false, reason })
    expect(signOuts).toEqual([])
    expect(passwordUpdates).toEqual([])
  })

  it('a failed sign-out of the others does not undo the change, and is reported (Task 923 R70 (b))', async () => {
    signOutThrows = true
    expect(await changeCabinetPassword(good)).toEqual({ ok: false, reason: 'sessions_not_ended' })
    expect(passwordUpdates).toHaveLength(1)
  })

  it('a failed profile read for the greeting does not undo the change either', async () => {
    profileReadThrows = true
    expect(await changeCabinetPassword(good)).toEqual({ ok: true })
    expect(sessionSignOuts).toEqual([{ scope: 'global' }])
    expect(signOuts).toEqual([])
  })

  it.each([['Email rate limit exceeded'], ['Too many requests']])('"%s" is reported as rate limited', async (message) => {
    currentPasswordOk = false
    verifyMessage = message
    expect(await changeCabinetPassword(good)).toEqual({ ok: false, reason: 'rate_limited' })
    expect(passwordUpdates).toEqual([])
  })

  it('a refusal by the update itself is "server_error" and signs nobody out', async () => {
    passwordUpdateFails = true
    expect(await changeCabinetPassword(good)).toEqual({ ok: false, reason: 'server_error' })
    expect(signOuts).toEqual([])
    expect(passwordUpdates).toEqual([])
  })
})

describe('the e-mail change does not pretend to end sessions', () => {
  it('a good token changes the account\'s address, clears the pending address, is used up, and no sign-out call is made with a user id', async () => {
    await initiateEmailChange({ newEmail: 'new@example.com', locale: 'en' })
    const raw = new URL((sentEmails[0] as { verificationUrl: string }).verificationUrl).searchParams.get('token')!
    expect(await consumeEmailChangeToken(raw)).toEqual({ success: true })
    expect(adminAuthCalls.find((c) => c.name === 'updateUserById')?.args[0]).toBe('user-b')
    expect(db.tables.users.find((u) => u.id === 'user-b')?.pending_email).toBeNull()
    expect(db.tables.email_change_tokens[0].consumed_at).toBeTruthy()
    expect(adminAuthCalls.some((c) => c.name === 'signOut')).toBe(false)
  })
})

describe('saved searches: names and failures', () => {
  const failing = (op: 'insert' | 'update' | 'delete', error: { code?: string; message: string }) => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'saved_searches') {
        const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error }) : chain), apply: () => chain })
        c[op] = () => chain
      }
      return c
    }) as never
  }

  it('a name is cut at 100 characters and trimmed; a blank or non-text one becomes "Search"', async () => {
    await saveSavedSearch({ type: 'sale' }, `  ${'x'.repeat(150)}  `)
    await saveSavedSearch({ type: 'rent' }, '   ')
    await saveSavedSearch({ type: 'sale', property_type: 'house' }, { a: 1 } as never)
    await saveSavedSearch({ type: 'sale', property_type: 'land' }, undefined as never)
    expect(db.tables.saved_searches.filter((s) => s.id !== 's-b').map((s) => s.name)).toEqual(['x'.repeat(100), 'Search', 'Search', 'Search'])
  })

  it('a duplicate race is "already saved"; another failure returns a fixed code, never the database message, and refreshes nothing (Task 923 R71 (f))', async () => {
    failing('insert', { code: '23505', message: 'dup' })
    expect(await saveSavedSearch({ type: 'sale' }, 'a')).toEqual({ error: 'already_saved', code: 'already_exists' })
    failing('insert', { code: 'XX', message: 'boom' })
    expect(await saveSavedSearch({ type: 'rent' }, 'a')).toEqual({ error: 'save_failed' })
    expect(revalidated).toBe(0)
  })

  it.each([
    ['updateLastViewed', () => updateLastViewed('s-b'), 'update', 'update_failed'], ['updateSavedSearchFrequency', () => updateSavedSearchFrequency('s-b', 'daily'), 'update', 'update_failed'],
    ['updateSavedSearchNotify', () => updateSavedSearchNotify('s-b', true), 'update', 'update_failed'], ['deleteSavedSearch', () => deleteSavedSearch('s-b'), 'delete', 'delete_failed'], ['deleteAllSavedSearches', () => deleteAllSavedSearches(), 'delete', 'delete_failed'],
  ] as const)('%s returns a fixed code, never the database message, when it fails and refreshes nothing', async (_n, call, op, code) => {
    failing(op, { message: 'db says no' })
    expect(await call()).toEqual({ error: code })
    expect(revalidated).toBe(0)
  })
})

// Task 923 R38 (case SEC-S55-SRV-DENY)
it('[SEC-S55-SRV-DENY] A password change ends every session of the account, the check\'s own included', async () => {
  expect(await changeCabinetPassword(good)).toEqual({ ok: true })
  expect(passwordUpdates).toEqual([{ password: good.newPassword }])
  expect(sessionSignOuts).toEqual([{ scope: 'global' }])                // every session ends, once, the check's own included
  expect(signOuts).toEqual([])                                           // the verify client signs nobody out: its session is the check's own
  sessionSignOuts.length = 0
  signOuts.length = 0
  currentPasswordOk = false
  expect(await changeCabinetPassword(good)).toEqual({ ok: false, reason: 'invalid_current' })
  expect(sessionSignOuts).toEqual([])                                    // a refused change signs nobody out
  expect(signOuts).toEqual([])
})
