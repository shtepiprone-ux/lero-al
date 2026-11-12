// @vitest-environment node
/**
 * Task 927 (Amendment 2): the server's recent-sign-in rule is satisfied by a Google `id_token` sign-in. Supabase Auth issues that session with the authentication method `oauth`
 * (the same value the redirect flow gave), so a Google-only account that confirms with Google's own button in a popup is let through for 10 minutes, and no sooner or later
 * than the rule says. The REAL `initiateEmailChange` and `deleteOwnAccount` run; the session client's `getClaims`, the two database clients, the verify client of the SDK and
 * the mailer are explicit I/O doubles, as in Task 923's reauth.security.test.ts (which this file leaves unchanged).
 */
import { beforeEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  providers: ['google'] as string[],
  /** what `public.account_has_password` answers: a boolean, or `'error'` for an answer that cannot be read */
  hasPassword: false as boolean | 'error',
  amr: [] as unknown[],
  writes: [] as string[],
  authDeletes: [] as string[],
  sent: [] as unknown[],
  verifySignIns: 0,
}))

/** a database whose reads answer "nothing" and whose every write is recorded as `table.op` */
function chainFor(table: string): unknown {
  const empty = { data: [], error: null, count: 0 }
  const chain: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === 'then') return (resolve: (v: unknown) => void) => resolve(empty)
      if (key === 'single' || key === 'maybeSingle') return async () => ({ data: null, error: null })
      if (['insert', 'update', 'delete', 'upsert'].includes(String(key))) return () => { state.writes.push(`${table}.${String(key)}`); return chain }
      return () => chain
    },
    apply: () => chain,
  })
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => chainFor(table),
    rpc: async (name: string) => {
      if (name !== 'account_has_password') return { data: [], error: null }
      return state.hasPassword === 'error' ? { data: null, error: { message: 'zz-synthetic rpc failure' } } : { data: state.hasPassword, error: null }
    },
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { id, email: 'person@example.com', app_metadata: { providers: state.providers } } }, error: null }),
      },
    },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { amr: state.amr } }, error: null }) } }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'person@example.com' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, updateTag: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { signInWithPassword: async () => { state.verifySignIns += 1; return { error: { message: 'Invalid login credentials' } } }, signOut: async () => ({ error: null }) } }),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (args: unknown) => { state.sent.push(args) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
// the ids `deleteAccount` was asked to delete (Task 923 R141, R142): the cabinet action only calls it, after the proof
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string) => { state.authDeletes.push(userId); return { ok: true, filesNotRemoved: 0 } } }))

import { deleteOwnAccount, getReauthMethod, initiateEmailChange } from '../index'

const nowSeconds = () => Math.floor(Date.now() / 1000)
const NEW_EMAIL = { newEmail: 'new@example.com', locale: 'en' }

beforeEach(() => {
  state.providers = ['google']
  state.hasPassword = false
  state.amr = []
  state.writes.length = 0
  state.authDeletes.length = 0
  state.sent.length = 0
  state.verifySignIns = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

it('[SEC-927-SRV-REAUTH-ALLOW] the server lets a Google-only account change its e-mail and delete itself right after an id_token sign-in', async () => {
  // the claims an id_token sign-in carries: Supabase writes the method `oauth` for it (models.OAuth), stamped now
  state.amr = [{ method: 'oauth', timestamp: nowSeconds() - 60 }]

  expect(await initiateEmailChange(NEW_EMAIL)).toEqual({ pendingEmail: 'new@example.com' })
  expect(state.sent, 'the mailer is called once').toHaveLength(1)
  expect(state.writes).toContain('email_change_tokens.insert')
  expect(state.verifySignIns, 'a Google-only account is never asked for a password').toBe(0)

  state.writes.length = 0
  expect(await deleteOwnAccount()).toEqual({})
  expect(state.authDeletes, 'the synthetic account is deleted once, and only that one').toEqual(['user-1'])
  expect(state.writes, 'the action itself writes no row').toEqual([])
  expect(state.verifySignIns).toBe(0)
})

it('[SEC-927-SRV-REAUTH-DENY] the server refuses a Google-only account whose last Google sign-in is older than 10 minutes or absent', async () => {
  for (const [label, amr] of [
    ['an oauth sign-in 11 minutes old', [{ method: 'oauth', timestamp: nowSeconds() - 11 * 60 }]],
    ['a password sign-in 1 minute old only', [{ method: 'password', timestamp: nowSeconds() - 60 }]],
    ['no authentication methods', []],
  ] as const) {
    state.amr = [...amr]
    state.writes.length = 0; state.authDeletes.length = 0; state.sent.length = 0
    expect(await initiateEmailChange(NEW_EMAIL), label).toMatchObject({ reason: 'reauth_required' })
    expect(await deleteOwnAccount(), label).toEqual({ error: 'reauth_required' })
    expect(state.sent, `${label}: no e-mail`).toEqual([])
    expect(state.writes, `${label}: no pending e-mail, no profile row, no deletion`).toEqual([])
    expect(state.authDeletes, `${label}: no Auth deletion`).toEqual([])
  }
})

it('[SEC-927-SRV-REAUTH-NOPASSWORD] an account without a password is asked for Google even when Auth lists the email provider, and an unreadable answer refuses', async () => {
  // as after an address change (Task 927 D28): Auth lists `email`, yet `auth.users` holds no password
  state.providers = ['google', 'email']
  state.hasPassword = false
  expect(await getReauthMethod(), 'the proof follows the real password, not the providers').toBe('google')

  state.amr = [{ method: 'oauth', timestamp: nowSeconds() - 60 }]
  expect(await deleteOwnAccount(), 'a recent Google sign-in is enough').toEqual({})
  expect(state.authDeletes, 'the synthetic account is deleted once, and only that one').toEqual(['user-1'])
  expect(state.verifySignIns, 'no password sign-in is attempted for an account without one').toBe(0)

  state.amr = []
  state.authDeletes.length = 0
  expect(await deleteOwnAccount({ password: 'zz-synthetic-guess' }), 'a password is not a proof for an account without one').toEqual({ error: 'reauth_required' })
  expect(state.verifySignIns).toBe(0)
  expect(state.authDeletes, 'nothing is deleted').toEqual([])

  // an answer that cannot be read refuses
  state.hasPassword = 'error'
  expect(await getReauthMethod()).toBeNull()
  expect(await deleteOwnAccount()).toEqual({ error: 'delete_failed' })
  expect(state.authDeletes, 'nothing is deleted on an unreadable answer').toEqual([])

  // an account with a password is asked for it, whatever Auth lists
  state.providers = ['google']
  state.hasPassword = true
  expect(await getReauthMethod()).toBe('password')
})
