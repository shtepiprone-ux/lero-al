// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S58): the browser-side profile resolution.
 * `resolveProfile` reads the signed-in person's profile and creates one when there is none. It used to create it with an upsert that OVERWRITES: when the read failed
 * for any reason (a network error, a temporary database failure) the code took "no data" for "no profile" and wrote role "user" and "not verified" over the real row,
 * so an administrator or a verified agent lost their role or badge. Creating must never touch a row that exists.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Op = { op: string; values?: unknown; options?: unknown; filters: [string, unknown][] }
const ops: Op[] = []
let readResult: { data: unknown; error?: unknown } = { data: null }
let createdRow: unknown = null
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
      chain.upsert = (values: unknown, options: unknown) => { rec.op = 'upsert'; rec.values = values; rec.options = options; return chain }
      chain.single = async () => (rec.op === 'upsert' ? { data: createdRow } : readResult)
      return chain
    },
  }),
}))

import * as browser from '../browser'

beforeEach(() => {
  ops.length = 0
  readResult = { data: null }
  createdRow = null
  for (const m of Object.values(auth)) m.mockClear()
})

describe('resolveProfile', () => {
  it('returns the profile that exists and writes nothing', async () => {
    readResult = { data: { id: 'u1', role: 'admin', is_verified: true } }
    expect(await browser.resolveProfile('u1', { name: 'X' })).toEqual({ id: 'u1', role: 'admin', is_verified: true })
    expect(ops.map((o) => o.op)).toEqual(['select'])
    expect(ops[0].filters).toEqual([['id', 'u1']])
  })

  it('creates a plain, unverified profile when there is none, and NEVER overwrites a row that already exists', async () => {
    createdRow = { id: 'u1', role: 'user' }
    expect(await browser.resolveProfile('u1', { full_name: 'Alba Hoxha' })).toEqual({ id: 'u1', role: 'user' })
    const write = ops.find((o) => o.op === 'upsert')!
    expect(write.values).toEqual({ id: 'u1', name: 'Alba Hoxha', user_type: 'private', role: 'user', is_verified: false })
    expect(write.options).toEqual({ onConflict: 'id', ignoreDuplicates: true })
  })

  it('a row that could not be read, but exists, is left untouched (the upsert ignores a duplicate and returns nothing)', async () => {
    readResult = { data: null, error: { message: 'network' } }
    createdRow = null
    expect(await browser.resolveProfile('u1', {})).toBeNull()
    expect(ops.find((o) => o.op === 'upsert')?.options).toMatchObject({ ignoreDuplicates: true })
  })

  it.each([
    [{ full_name: 'Full', name: 'Short' }, 'Full'], [{ name: 'Short' }, 'Short'], [{}, null], [undefined, null],
  ])('takes the name from %j: %j', async (meta, expected) => {
    await browser.resolveProfile('u1', meta as never)
    expect(ops.find((o) => o.op === 'upsert')?.values).toMatchObject({ name: expected })
  })

  it('what the sign-up metadata says about the role, the type or the verification is ignored', async () => {
    await browser.resolveProfile('u1', { role: 'admin', is_verified: true, user_type: 'agent', status: 'active', id: 'victim' })
    expect(ops.find((o) => o.op === 'upsert')?.values).toEqual({ id: 'u1', name: null, user_type: 'private', role: 'user', is_verified: false })
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
it('[SEC-S58-SRV-DENY] Resolving the profile never overwrites an existing profile row', async () => {
  readResult = { data: null, error: { message: 'network' } }      // the read failed, but the row exists
  createdRow = null
  await browser.resolveProfile('u1', { full_name: 'Alba' })
  const write = ops.find((o) => o.op === 'upsert')
  expect(write?.options).toEqual({ onConflict: 'id', ignoreDuplicates: true })   // the insert ignores the duplicate: the existing row is not overwritten
  expect(ops.some((o) => o.op === 'update')).toBe(false)
  ops.length = 0
  readResult = { data: { id: 'u1', role: 'admin', is_verified: true } }
  await browser.resolveProfile('u1', { full_name: 'Alba' })
  expect(ops.map((o) => o.op)).toEqual(['select'])                                // an existing profile is returned and nothing is written
})
