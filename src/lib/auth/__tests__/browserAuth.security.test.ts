// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S58; Task 956 AC15): the browser-side profile resolution.
 * `resolveProfile` reads the signed-in person's profile. It used to create one when there was none, with an upsert that OVERWROTE: when the read failed
 * for any reason (a network error, a temporary database failure) the code took "no data" for "no profile" and wrote role "user" and "not verified" over the real row,
 * so an administrator or a verified agent lost their role or badge. Since Task 956 it writes nothing at all: `users` has no permissive INSERT policy, so the upsert never wrote a row, and the
 * row is made by the sign-up trigger `handle_new_user`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Op = { op: string; values?: unknown; options?: unknown; filters: [string, unknown][] }
const ops: Op[] = []
let readResult: { data: unknown; error?: unknown } = { data: null }
const auth: Record<string, ReturnType<typeof vi.fn>> = {}
for (const m of ['signInWithPassword', 'signInWithOAuth', 'signInWithIdToken', 'signUp', 'resetPasswordForEmail', 'updateUser', 'verifyOtp', 'signOut', 'getSession', 'refreshSession', 'onAuthStateChange']) auth[m] = vi.fn(async () => ({ data: {}, error: null }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth,
    from: () => {
      const rec: Op = { op: 'select', filters: [] }
      ops.push(rec)
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = (c: string, v: unknown) => { rec.filters.push([c, v]); return chain }
      // a write is recorded, so a test that expects none fails when one is made
      chain.upsert = (values: unknown, options: unknown) => { rec.op = 'upsert'; rec.values = values; rec.options = options; return chain }
      chain.insert = (values: unknown) => { rec.op = 'insert'; rec.values = values; return chain }
      chain.update = (values: unknown) => { rec.op = 'update'; rec.values = values; return chain }
      chain.single = async () => (rec.op === 'select' ? readResult : { data: null })
      return chain
    },
  }),
}))

import * as browser from '../browser'

beforeEach(() => {
  ops.length = 0
  readResult = { data: null }
  for (const m of Object.values(auth)) m.mockClear()
})

// Task 956 AC15 (Review 4): `users` has no permissive INSERT policy (only the RESTRICTIVE `blocked_account_no_insert`), so the upsert that used to stand here never wrote a row; the profile row is made
// by public.handle_new_user() (trigger on_auth_user_created on auth.users). `resolveProfile` only reads: the profile that exists, or null. It writes nothing, so it can never overwrite a row (finding S58).
describe('resolveProfile', () => {
  it('returns the profile that exists and writes nothing', async () => {
    readResult = { data: { id: 'u1', role: 'admin', is_verified: true } }
    expect(await browser.resolveProfile('u1')).toEqual({ id: 'u1', role: 'admin', is_verified: true })
    expect(ops.map((o) => o.op)).toEqual(['select'])
    expect(ops[0].filters).toEqual([['id', 'u1']])
  })

  it('returns null when there is no profile and still writes nothing: the sign-up trigger makes the row', async () => {
    readResult = { data: null }
    expect(await browser.resolveProfile('u1')).toBeNull()
    expect(ops.map((o) => o.op)).toEqual(['select'])
  })

  it('a row that could not be read is left untouched: null, and no write of any kind', async () => {
    readResult = { data: null, error: { message: 'network' } }
    expect(await browser.resolveProfile('u1')).toBeNull()
    expect(ops.map((o) => o.op)).toEqual(['select'])
  })

  it('no insert, no upsert and no update is made whether the profile exists, is missing or could not be read', async () => {
    for (const read of [{ data: { id: 'u1', role: 'admin' } }, { data: null }, { data: null, error: { message: 'network' } }]) {
      readResult = read
      ops.length = 0
      await browser.resolveProfile('u1')
      expect(ops.filter((o) => o.op !== 'select'), JSON.stringify(read)).toEqual([])
    }
  })
})

describe('the thin wrappers pass exactly their arguments on', () => {
  it('sign in, OAuth, sign up, reset, update, verify, sign out, session', async () => {
    await browser.signIn('a@b.cc', 'pw', 'zz-captcha-token')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.cc', password: 'pw', options: { captchaToken: 'zz-captcha-token' } })
    await browser.signInWithGoogleIdToken('zz.synthetic.idtoken', 'raw-nonce')
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'zz.synthetic.idtoken', nonce: 'raw-nonce' })
    await browser.signUp('a@b.cc', 'pw', { emailRedirectTo: 'https://lero.al/x', data: { name: 'A' } })
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'a@b.cc', password: 'pw', options: { emailRedirectTo: 'https://lero.al/x', data: { name: 'A' } } })
    await browser.requestPasswordReset('a@b.cc', 'https://lero.al/r')
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.cc', { redirectTo: 'https://lero.al/r' })
    await browser.updatePassword('new')
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new' })
    await browser.verifyOtp({ token_hash: 'h', type: 'recovery' })
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'h', type: 'recovery' })
    await browser.getSession()
    await browser.refreshSession()
    expect(auth.getSession).toHaveBeenCalledOnce()
    expect(auth.refreshSession).toHaveBeenCalledOnce()
  })

  it('sign out passes its scope, or nothing at all', async () => {
    await browser.signOut('local')
    expect(auth.signOut).toHaveBeenLastCalledWith({ scope: 'local' })
    await browser.signOut('global')
    expect(auth.signOut).toHaveBeenLastCalledWith({ scope: 'global' })
    await browser.signOut()
    expect(auth.signOut).toHaveBeenLastCalledWith(undefined)
  })

  it('subscribes to auth changes with the callback it was given', () => {
    const cb = vi.fn()
    browser.onAuthStateChange(cb)
    expect(auth.onAuthStateChange).toHaveBeenCalledWith(cb)
  })
})

// Task 927 (case SEC-927-FE-WRAP)
it('[SEC-927-FE-WRAP] the Google wrapper sends exactly the provider, the ID token and the raw nonce to Supabase Auth', async () => {
  auth.signInWithIdToken.mockClear(); auth.signInWithOAuth.mockClear()
  const answer = { data: { session: { access_token: 'zz' } }, error: null }
  auth.signInWithIdToken.mockResolvedValueOnce(answer)
  await expect(browser.signInWithGoogleIdToken('zz.synthetic.idtoken', 'raw-nonce')).resolves.toBe(answer)
  expect(auth.signInWithIdToken).toHaveBeenCalledTimes(1)
  expect(auth.signInWithIdToken.mock.calls[0]).toEqual([{ provider: 'google', token: 'zz.synthetic.idtoken', nonce: 'raw-nonce' }])
  expect(auth.signInWithOAuth, 'the redirect flow is gone').not.toHaveBeenCalled()
  expect('signInWithOAuth' in browser, 'the OAuth wrapper no longer exists').toBe(false)
})

// Task 923 R38 (case SEC-S58-SRV-DENY)
it('[SEC-S58-SRV-DENY] Resolving the profile never overwrites an existing profile row: it never writes', async () => {
  readResult = { data: null, error: { message: 'network' } }      // the read failed, but the row exists
  await browser.resolveProfile('u1')
  expect(ops.map((o) => o.op), 'a failed read is followed by no write at all: nothing can overwrite the row').toEqual(['select'])
  ops.length = 0
  readResult = { data: { id: 'u1', role: 'admin', is_verified: true } }
  await browser.resolveProfile('u1')
  expect(ops.map((o) => o.op)).toEqual(['select'])                                // an existing profile is returned and nothing is written
})
