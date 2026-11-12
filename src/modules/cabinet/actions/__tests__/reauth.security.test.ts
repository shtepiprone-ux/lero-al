// @vitest-environment node
/**
 * Security (Task 923 R70 (a), R80, owner decision D54): the sign-in e-mail changes and the account is deleted only after the person proves who they are.
 *  - SEC-X-SRV-REAUTH-EMAIL: `initiateEmailChange` without the current password, with a wrong one, and for a Google-only account whose Google sign-in is 11 minutes old
 *    answers `reauth_required` / `invalid_password`, stores no token, changes no profile row and sends no e-mail;
 *  - SEC-X-SRV-REAUTH-DELETE: `deleteOwnAccount` without a password and with a wrong one answers `reauth_required` / `invalid_password` and writes nothing, deletes nothing.
 * The REAL actions run. The identity, the two database clients, the verify client of the SDK and the mail are doubles; the double of Auth knows which providers the
 * account has (a password account lists `email`, a Google-only one does not) and which authentication methods the session's token carries (`amr`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: null as { id: string; email?: string } | null,
  providers: ['email'] as string[],
  authLookupFails: false,
  password: 'Right-Passw0rd!',
  signInMessage: 'Invalid login credentials',
  amr: [] as { method: string; timestamp: number }[],
  claimsFail: false,
  signIns: [] as { email: string; password: string }[],
  /** the API key each verify client was built with (Task 923 R153, R155 (e)) */
  verifyKeys: [] as string[],
  verifySignOuts: [] as unknown[],
  writes: [] as string[],
  /** the ids `deleteAccount` was asked to delete (Task 923 R141, R142: the cabinet action only calls it, after the proof) */
  authDeletes: [] as string[],
  sent: [] as unknown[],
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
      // the file's switch for an account that cannot be read now makes the password answer unreadable, as it made the providers lookup fail before
      return state.authLookupFails ? { data: null, error: { message: 'lookup failed' } } : { data: state.providers.includes('email'), error: null }
    },
    auth: {
      admin: {
        getUserById: async (id: string) => state.authLookupFails
          ? { data: { user: null }, error: { message: 'lookup failed' } }
          : { data: { user: { id, email: 'old@example.com', app_metadata: { providers: state.providers } } }, error: null },
      },
    },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getClaims: async () => (state.claimsFail ? { data: null, error: { message: 'no claims' } } : { data: { claims: { amr: state.amr } }, error: null }) },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, updateTag: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, key: string) => {
    state.verifyKeys.push(key)
    return {
      auth: {
        signInWithPassword: async (credentials: { email: string; password: string }) => {
          state.signIns.push(credentials)
          return { error: credentials.password === state.password ? null : { message: state.signInMessage } }
        },
        signOut: async (options: unknown) => { state.verifySignOuts.push(options); return { error: null } },
      },
    }
  },
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (args: unknown) => { state.sent.push(args) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: async (userId: string) => { state.authDeletes.push(userId); return { ok: true, filesNotRemoved: 0 } } }))

import { deleteOwnAccount, getReauthMethod, initiateEmailChange } from '../index'

const nowSeconds = () => Math.floor(Date.now() / 1000)
const minutesAgo = (minutes: number) => nowSeconds() - minutes * 60
const NEW_EMAIL = { newEmail: 'new@example.com', locale: 'en' }

beforeEach(() => {
  state.user = { id: 'user-1', email: 'old@example.com' }
  state.providers = ['email']
  state.authLookupFails = false
  state.signInMessage = 'Invalid login credentials'
  state.amr = []
  state.claimsFail = false
  state.signIns.length = 0
  state.verifyKeys.length = 0
  state.verifySignOuts.length = 0
  state.writes.length = 0
  state.authDeletes.length = 0
  state.sent.length = 0
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'zz-anon-key')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'zz-service-key')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs() })

const googleOnly = () => { state.providers = ['google'] }

describe('reauth', () => {
  it('[SEC-X-SRV-REAUTH-VERIFY-KEY] the password check signs in as the service role, never with the anon key', async () => {
    // Supabase's CAPTCHA protection refuses a password sign-in without a token and lets a service-role caller through (Task 923 R153): the check must not use the anon key
    expect(await initiateEmailChange({ ...NEW_EMAIL, currentPassword: state.password })).toEqual({ pendingEmail: 'new@example.com' })
    expect(await deleteOwnAccount({ password: state.password })).toEqual({})
    expect(state.verifyKeys, 'one verify client for each of the two checks').toHaveLength(2)
    for (const key of state.verifyKeys) expect(key, 'the password check signs in as the service role').toBe('zz-service-key')
    expect(state.verifyKeys, 'the password check signs in as the service role').not.toContain('zz-anon-key')
  })

  it('[SEC-X-SRV-REAUTH-EMAIL] an e-mail change needs re-authentication', async () => {
    // an account with a password: none sent, then a wrong one
    expect(await initiateEmailChange(NEW_EMAIL)).toMatchObject({ reason: 'invalid_password' })
    expect(await initiateEmailChange({ ...NEW_EMAIL, currentPassword: 'wrong-password' })).toMatchObject({ reason: 'invalid_password' })
    expect(state.signIns).toEqual([{ email: 'old@example.com', password: 'wrong-password' }])      // the check ran once, with the WRONG password only
    // a Google-only account whose Google sign-in is 11 minutes old
    googleOnly()
    state.amr = [{ method: 'oauth', timestamp: minutesAgo(11) }]
    expect(await initiateEmailChange(NEW_EMAIL)).toMatchObject({ reason: 'reauth_required' })
    // every refusal changed nothing and sent nothing; the one thing written is the wrong password itself (Task 923 R81 (b)), none of the other refusals
    expect(state.writes, 'no token row, no profile row: only the one failed attempt').toEqual(['reauth_failures.insert'])
    expect(state.sent, 'no e-mail').toEqual([])
  })

  it('the right password is accepted: one token, one pending address, one pair of e-mails; the check opened a session that is ended at once', async () => {
    const answer = await initiateEmailChange({ ...NEW_EMAIL, currentPassword: state.password })
    expect(answer).toEqual({ pendingEmail: 'new@example.com' })
    expect(state.writes).toContain('email_change_tokens.insert')
    expect(state.writes).toContain('users.update')
    expect(state.sent).toHaveLength(1)
    expect(state.verifySignOuts).toEqual([{ scope: 'local' }])
  })

  it('a Google-only account with a Google sign-in less than 10 minutes old is accepted; a password-method entry or a stale one is not', async () => {
    googleOnly()
    state.amr = [{ method: 'password', timestamp: minutesAgo(1) }, { method: 'oauth', timestamp: minutesAgo(30) }]
    expect(await initiateEmailChange(NEW_EMAIL)).toMatchObject({ reason: 'reauth_required' })
    state.amr = [{ method: 'oauth', timestamp: minutesAgo(9) }]
    expect(await initiateEmailChange(NEW_EMAIL)).toEqual({ pendingEmail: 'new@example.com' })
    expect(state.signIns, 'a Google-only account is never asked for a password').toEqual([])
  })

  it.each([
    ['an oauth entry stamped in the future', [{ method: 'oauth', timestamp: nowSeconds() + 600 }]],
    ['an oauth entry with no timestamp', [{ method: 'oauth' }]],
    ['no authentication methods at all', []],
  ])('a Google-only account with %s is refused', async (_label, amr) => {
    googleOnly()
    state.amr = amr as { method: string; timestamp: number }[]
    expect(await initiateEmailChange(NEW_EMAIL)).toMatchObject({ reason: 'reauth_required' })
    expect(state.writes).toEqual([])
  })

  it('claims that cannot be read refuse a Google-only account, an account lookup that fails refuses everyone, and nothing is written', async () => {
    googleOnly()
    state.claimsFail = true
    expect(await initiateEmailChange(NEW_EMAIL)).toMatchObject({ reason: 'reauth_required' })
    state.claimsFail = false
    state.authLookupFails = true
    const answer = await initiateEmailChange({ ...NEW_EMAIL, currentPassword: state.password })
    expect(answer.pendingEmail).toBeUndefined()
    expect(answer.error).toBeTruthy()
    expect(state.writes).toEqual([])
  })

  it('Auth\'s own sign-in limit is reported as rate limited and still writes nothing; a password longer than 256 characters never reaches Auth', async () => {
    state.signInMessage = 'Email rate limit exceeded'
    expect(await initiateEmailChange({ ...NEW_EMAIL, currentPassword: 'wrong-password' })).toMatchObject({ reason: 'rate_limited' })
    expect(state.writes).toEqual([])
    state.signIns.length = 0
    expect(await initiateEmailChange({ ...NEW_EMAIL, currentPassword: 'x'.repeat(257) })).toMatchObject({ reason: 'invalid_password' })
    expect(state.signIns).toEqual([])
  })

  it('the refusal texts exist in all four languages and differ', async () => {
    const texts = new Set<string>()
    for (const locale of ['sq', 'en', 'uk', 'it']) {
      const wrong = await initiateEmailChange({ newEmail: 'new@example.com', locale })
      googleOnly()
      state.amr = []
      const stale = await initiateEmailChange({ newEmail: 'new@example.com', locale })
      state.providers = ['email']
      expect(wrong.error, `${locale}: invalid_password`).toBeTruthy()
      expect(stale.error, `${locale}: reauth_required`).toBeTruthy()
      texts.add(wrong.error!)
      texts.add(stale.error!)
    }
    expect(texts.size, 'eight different texts: two reasons in four languages').toBe(8)
  })

  it('the form learns which proof to ask for from the own account of the caller: password, google, or nothing readable', async () => {
    expect(await getReauthMethod()).toBe('password')
    googleOnly()
    expect(await getReauthMethod()).toBe('google')
    state.authLookupFails = true
    expect(await getReauthMethod()).toBeNull()                    // unreadable: the form shows the password field and the action refuses anyone it cannot verify
    state.authLookupFails = false
    state.user = null
    expect(await getReauthMethod()).toBeNull()
    expect(state.writes).toEqual([])
  })

  it('no session is "Unauthorized", before any check', async () => {
    state.user = null
    expect(await initiateEmailChange(NEW_EMAIL)).toEqual({ error: 'Unauthorized' })
    expect(await deleteOwnAccount({ password: state.password })).toEqual({ error: 'Unauthorized' })
    expect(state.signIns).toEqual([])
  })

  it('[SEC-X-SRV-REAUTH-DELETE] deleting the own account needs re-authentication', async () => {
    // an account with a password: none sent (the old call shape), then a wrong one
    expect(await deleteOwnAccount()).toEqual({ error: 'invalid_password' })
    expect(await deleteOwnAccount({})).toEqual({ error: 'invalid_password' })
    expect(await deleteOwnAccount({ password: 'wrong-password' })).toEqual({ error: 'invalid_password' })
    // a Google-only account whose Google sign-in is 11 minutes old
    googleOnly()
    state.amr = [{ method: 'oauth', timestamp: minutesAgo(11) }]
    expect(await deleteOwnAccount()).toEqual({ error: 'reauth_required' })
    // nothing was written and nobody was deleted; the one thing written is the wrong password itself (Task 923 R81 (b))
    expect(state.writes, 'no users write, no listing archive: only the one failed attempt').toEqual(['reauth_failures.insert'])
    expect(state.authDeletes, 'deleteAccount is not called').toEqual([])
  })

  it('the right password deletes the account; a fresh Google sign-in deletes a Google-only account', async () => {
    expect(await deleteOwnAccount({ password: state.password })).toEqual({})
    expect(state.authDeletes, 'deleteAccount is asked for the caller\'s own id').toEqual(['user-1'])
    expect(state.writes, 'the action itself writes no row').toEqual([])
    state.authDeletes.length = 0
    googleOnly()
    state.amr = [{ method: 'oauth', timestamp: minutesAgo(2) }]
    expect(await deleteOwnAccount()).toEqual({})
    expect(state.authDeletes).toEqual(['user-1'])
    expect(state.writes).toEqual([])
  })

  it('Auth\'s sign-in limit and an unreadable account both refuse the deletion without writing', async () => {
    state.signInMessage = 'Too many requests'
    expect(await deleteOwnAccount({ password: 'wrong-password' })).toEqual({ error: 'rate_limited' })
    state.authLookupFails = true
    expect(await deleteOwnAccount({ password: state.password })).toEqual({ error: 'delete_failed' })
    expect(state.writes).toEqual([])
    expect(state.authDeletes).toEqual([])
  })
})
