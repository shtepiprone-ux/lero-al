// @vitest-environment node
/**
 * Security (Task 923 R81 (b), review 21 finding F2): a stolen session cannot guess the password through the deletion, the e-mail change or the password change.
 *  - SEC-X-SRV-REAUTH-LIMIT: each wrong current password stores one row for THAT PERSON in `reauth_failures`; a person with 5 rows of the last 15 minutes is refused
 *    (`rate_limited`) BEFORE Auth is called, even with the right password; the rows of another person and rows older than 15 minutes do not count; a count that cannot
 *    be read refuses; a row that cannot be stored is logged and the answer stays "wrong password"; Auth's own limit answer is not a wrong password and stores nothing.
 * The REAL actions run against the in-memory database double; Auth and its verify client, the identity and the mail are doubles.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'one@example.com' } as { id: string; email?: string } | null,
  providers: ['email'] as string[],
  password: 'Right-Passw0rd!',
  signInMessage: 'Invalid login credentials',
  signIns: [] as string[],
  countFails: false,
  insertFails: false,
  authDeletes: [] as string[],
  passwordUpdates: [] as unknown[],
}))

let db = createFakeDb()

function failing(error: { message: string; code?: string }): unknown {
  const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, count: null, error }) : chain), apply: () => chain })
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'reauth_failures' && state.countFails) return { select: () => failing({ message: 'count failed', code: 'XX000' }), insert: (v: unknown) => (db.from(table) as { insert: (x: unknown) => unknown }).insert(v) }
      if (table === 'reauth_failures' && state.insertFails) return { ...(db.from(table) as Record<string, unknown>), insert: () => failing({ message: 'insert failed', code: 'XX001' }) }
      return db.from(table)
    },
    rpc: async (name: string) => (name === 'account_has_password' ? { data: state.providers.includes('email'), error: null } : { data: [], error: null }),
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { id, email: 'one@example.com', app_metadata: { providers: state.providers } } }, error: null }),
        updateUserById: async (_id: string, attrs: unknown) => { state.passwordUpdates.push(attrs); return { data: {}, error: null } },
      },
    },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { amr: [] } }, error: null }), signOut: async () => ({ error: null }) } }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, updateTag: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: async ({ password }: { password: string }) => { state.signIns.push(password); return { error: password === state.password ? null : { message: state.signInMessage } } },
      signOut: async () => ({ error: null }),
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
// the ids `deleteAccount` was asked to delete (Task 923 R141, R142): the cabinet action only calls it, after the proof
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string) => { state.authDeletes.push(userId); return { ok: true, filesNotRemoved: 0 } } }))

import { changeCabinetPassword, deleteOwnAccount, initiateEmailChange } from '../index'

const WRONG = 'Wrong-Passw0rd!'
const NEW_PASSWORD = 'NewStr0ng!Passw0rd'
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
const rows = (userId?: string) => db.tables.reauth_failures.filter((r) => userId === undefined || r.user_id === userId)
const seed = (userId: string, count: number, createdAt: string) => { for (let i = 0; i < count; i++) db.tables.reauth_failures.push({ id: `seed-${userId}-${createdAt}-${i}`, user_id: userId, created_at: createdAt }) }

beforeEach(() => {
  db = createFakeDb({ reauth_failures: [], users: [{ id: 'user-1', pending_email: null }], email_change_tokens: [], listings: [] })
  state.user = { id: 'user-1', email: 'one@example.com' }
  state.providers = ['email']
  state.signInMessage = 'Invalid login credentials'
  state.signIns.length = 0
  state.countFails = false
  state.insertFails = false
  state.authDeletes.length = 0
  state.passwordUpdates.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('reauthLimit', () => {
  it('[SEC-X-SRV-REAUTH-LIMIT] failed re-authentications are limited per person', async () => {
    // five wrong passwords through the deletion: each reaches Auth, each stores one row for this person
    for (let i = 0; i < 5; i++) expect(await deleteOwnAccount({ password: WRONG })).toEqual({ error: 'invalid_password' })
    expect(state.signIns).toHaveLength(5)
    expect(rows('user-1')).toHaveLength(5)

    // the sixth attempt is refused BEFORE Auth is called, even with the right password; nothing is deleted
    state.signIns.length = 0
    expect(await deleteOwnAccount({ password: state.password })).toEqual({ error: 'rate_limited' })
    expect(state.signIns, 'Auth is not called').toEqual([])
    expect(state.authDeletes).toEqual([])
    expect(rows('user-1'), 'a refused attempt stores no row').toHaveLength(5)

    // the same limit stops the e-mail change and the password change of this person
    expect(await initiateEmailChange({ newEmail: 'new@example.com', locale: 'en', currentPassword: state.password })).toMatchObject({ reason: 'rate_limited' })
    expect(await changeCabinetPassword({ currentPassword: state.password, newPassword: NEW_PASSWORD })).toEqual({ ok: false, reason: 'rate_limited' })
    expect(state.signIns, 'Auth is not called by any of them').toEqual([])
    expect(state.passwordUpdates).toEqual([])
    expect(db.tables.email_change_tokens).toEqual([])

    // the rows of ANOTHER person do not count: a person with none is not blocked
    db = createFakeDb({ reauth_failures: [], users: [{ id: 'user-1', pending_email: null }], email_change_tokens: [], listings: [] })
    seed('user-2', 5, minutesAgo(1))
    expect(await deleteOwnAccount({ password: state.password })).toEqual({})
    expect(state.authDeletes).toEqual(['user-1'])
  })

  it('the window is 15 minutes: older rows do not count, four recent ones leave one attempt, the fifth wrong password closes the door', async () => {
    seed('user-1', 5, minutesAgo(16))
    expect(await deleteOwnAccount({ password: WRONG })).toEqual({ error: 'invalid_password' })      // the old rows are not in the window: this is the first
    expect(rows('user-1')).toHaveLength(6)
    db = createFakeDb({ reauth_failures: [], users: [{ id: 'user-1', pending_email: null }], email_change_tokens: [], listings: [] })
    seed('user-1', 4, minutesAgo(14))
    expect(await changeCabinetPassword({ currentPassword: WRONG, newPassword: NEW_PASSWORD })).toEqual({ ok: false, reason: 'invalid_current' })   // the 5th wrong one
    expect(rows('user-1')).toHaveLength(5)
    expect(await changeCabinetPassword({ currentPassword: state.password, newPassword: NEW_PASSWORD })).toEqual({ ok: false, reason: 'rate_limited' })
    expect(state.passwordUpdates).toEqual([])
  })

  it('a count that cannot be read refuses, for each of the three actions, and Auth is not called', async () => {
    state.countFails = true
    expect(await deleteOwnAccount({ password: state.password })).toEqual({ error: 'delete_failed' })
    const email = await initiateEmailChange({ newEmail: 'new@example.com', locale: 'en', currentPassword: state.password })
    expect(email.pendingEmail).toBeUndefined()
    expect(email.error).toBeTruthy()
    expect(await changeCabinetPassword({ currentPassword: state.password, newPassword: NEW_PASSWORD })).toEqual({ ok: false, reason: 'server_error' })
    expect(state.signIns).toEqual([])
    expect(state.authDeletes).toEqual([])
    expect(state.passwordUpdates).toEqual([])
  })

  it('a row that cannot be stored is logged, and the answer stays "wrong password"; Auth\'s own limit stores nothing; the right password stores nothing', async () => {
    state.insertFails = true
    expect(await deleteOwnAccount({ password: WRONG })).toEqual({ error: 'invalid_password' })
    expect(await changeCabinetPassword({ currentPassword: WRONG, newPassword: NEW_PASSWORD })).toEqual({ ok: false, reason: 'invalid_current' })
    expect(console.error).toHaveBeenCalledWith('reauth: storing a failed attempt failed', { code: 'XX001' })
    state.insertFails = false
    state.signInMessage = 'Email rate limit exceeded'
    expect(await deleteOwnAccount({ password: WRONG })).toEqual({ error: 'rate_limited' })
    expect(rows(), 'Auth\'s limit is not a wrong password').toEqual([])
    state.signInMessage = 'Invalid login credentials'
    expect(await changeCabinetPassword({ currentPassword: state.password, newPassword: NEW_PASSWORD })).toEqual({ ok: true })
    expect(rows(), 'a right password stores no row').toEqual([])
  })

  it('a Google-only person has no password to guess: the limit does not touch that path, and a missing password stores nothing', async () => {
    state.providers = ['google']
    seed('user-1', 5, minutesAgo(1))
    expect(await deleteOwnAccount()).toEqual({ error: 'reauth_required' })               // refused for the Google sign-in, not for the limit
    state.providers = ['email']
    db = createFakeDb({ reauth_failures: [], users: [], email_change_tokens: [], listings: [] })
    expect(await deleteOwnAccount()).toEqual({ error: 'invalid_password' })              // nothing was guessed: no row
    expect(rows()).toEqual([])
    expect(state.signIns).toEqual([])
  })
})
