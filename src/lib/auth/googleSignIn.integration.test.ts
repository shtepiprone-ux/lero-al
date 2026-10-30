/**
 * Real-boundary controls for Task 927 (Google sign-in through Google Identity Services and `signInWithIdToken`), on the owner-approved DEVELOPMENT project with
 * synthetic rows of one run and a verified clean-up:
 *  - SEC-927-DB-ALLOW: a new Auth account gets its `public.users` row from the database trigger, in the same insert, before any session exists. The browser
 *    controller signs a person out when `/api/auth/me` answers `user: null`, so this trigger is what keeps a first Google sign-in signed in.
 *  - SEC-927-PRV-DENY: Supabase Auth refuses an ID token that Google did not sign (here: signed by a key generated in this run), creates no session and no user.
 *  - SEC-927-DB-PASSWORD-ALLOW (Amendment 12, D28): `public.account_has_password` answers from `auth.users` for the service role: true with a password, false without one,
 *    also after the address changed (Auth then lists the `email` provider), no row for an unknown id. It exists only after the owner applies the a12 SQL.
 *  - SEC-927-DB-PASSWORD-DENY (Amendment 12, D28): a signed-in user's own session and the anonymous client cannot call that function. The error codes are retained.
 * No real Google account is used and no secret is printed. The literal provider error of the forged token is retained under docs/sessions/evidence/task927/security/.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npx vitest run --config vitest.integration.config.ts src/lib/auth/googleSignIn.integration.test.ts
 */
import { createHash, createSign, generateKeyPairSync, randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createRun, type Run } from '@/tests/integration/fixtures'

let run: Run

beforeAll(() => {
  run = createRun()
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const base64url = (value: Buffer | string) => Buffer.from(value).toString('base64url')

/** An RS256 JWT signed by a key that exists only in this run, shaped like a Google ID token. */
function forgeGoogleIdToken(claims: Record<string, unknown>): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: `zz-synth-${randomBytes(4).toString('hex')}` }))
  const payload = base64url(JSON.stringify(claims))
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey)
  return `${header}.${payload}.${base64url(signature)}`
}

it('[SEC-927-DB-ALLOW] a new Auth user with Google profile metadata gets exactly one ordinary profile row from the database trigger', async () => {
  const email = `${run.RUN}_google@example.com`
  const created = await run.admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: `${run.RUN} google`, name: `${run.RUN} google`, avatar_url: 'https://example.com/zz-synthetic.png', email_verified: true },
  })
  expect(created.error, 'the Auth admin API creates the synthetic Google-shaped user').toBeNull()
  const id = created.data.user?.id as string
  expect(typeof id).toBe('string')

  let rows: { id: string; role: string; user_type: string; is_verified: boolean }[] = []
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const read = await run.admin.from('users').select('id, role, user_type, is_verified').eq('id', id)
    expect(read.error, 'the profile read itself works').toBeNull()
    rows = read.data ?? []
    if (rows.length) break
    await new Promise(resolveWait => setTimeout(resolveWait, 250))
  }
  expect(rows, 'exactly one public.users row for the new Auth user within 10 s').toHaveLength(1)
  expect(rows[0]).toEqual({ id, role: 'user', user_type: 'private', is_verified: false })
})

it('[SEC-927-PRV-DENY] Supabase Auth refuses a forged Google ID token and creates neither a session nor a user', async () => {
  const email = `${run.RUN}_forged@example.com`
  const rawNonce = randomBytes(32).toString('base64')
  const now = Math.floor(Date.now() / 1000)
  const token = forgeGoogleIdToken({
    iss: 'https://accounts.google.com',
    aud: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? 'zz-synthetic-client.apps.googleusercontent.com',
    azp: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? 'zz-synthetic-client.apps.googleusercontent.com',
    sub: `${run.RUN}-forged-sub`,
    email,
    email_verified: true,
    name: `${run.RUN} forged`,
    nonce: createHash('sha256').update(rawNonce, 'utf8').digest('hex'),
    iat: now,
    exp: now + 3600,
  })

  const attempt = await run.anonymousClient().auth.signInWithIdToken({ provider: 'google', token, nonce: rawNonce })

  const dir = 'docs/sessions/evidence/task927/security'
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/prv-deny-literal-error.json`, JSON.stringify({ error: attempt.error ? { name: attempt.error.name, status: (attempt.error as { status?: number }).status, code: (attempt.error as { code?: string }).code, message: attempt.error.message } : null, session: attempt.data?.session ? 'PRESENT' : null }, null, 2))

  expect(attempt.error, 'Supabase Auth returns an error for the forged token').not.toBeNull()
  expect(attempt.data?.session ?? null, 'no session is returned').toBeNull()
  const text = `${attempt.error?.message ?? ''} ${(attempt.error as { code?: string } | null)?.code ?? ''}`
  expect(text, 'the refusal is about the token, not a disabled provider or a CAPTCHA').not.toMatch(/provider is not enabled|unsupported provider|provider.*disabled|captcha/i)

  const found: string[] = []
  for (let page = 1; page <= 10; page++) {
    const list = await run.admin.auth.admin.listUsers({ page, perPage: 200 })
    expect(list.error, 'the Auth user list can be read').toBeNull()
    found.push(...(list.data?.users ?? []).filter(u => u.email === email).map(u => u.id))
    if ((list.data?.users.length ?? 0) < 200) break
  }
  expect(found, 'no Auth user exists for the forged e-mail').toEqual([])
  const profile = await run.admin.from('users').select('id').like('name', `${run.RUN}%forged`)
  expect(profile.error).toBeNull()
  expect(profile.data ?? [], 'no public.users row for the forged person').toEqual([])
})

it('[SEC-927-DB-PASSWORD-ALLOW] public.account_has_password answers from auth.users, also after an address change', async () => {
  const answer = async (id: string) => {
    const { data, error } = await run.admin.rpc('account_has_password', { p_user: id })
    return { data, error }
  }

  const withPassword = await run.makeUser('pw')
  expect(await answer(withPassword.id), 'an account created with a password').toEqual({ data: true, error: null })

  // Supabase Auth stores a hash of a password it makes itself for a user that `createUser` makes without one (Review 14, rv14-09). An invited user holds none, as an account
  // made through Google holds none: Auth lists the `email` provider, `auth.users` holds no password. `generateLink` sends no e-mail.
  const created = await run.admin.auth.admin.generateLink({ type: 'invite', email: `${run.RUN}_nopw@example.com` })
  expect(created.error, 'the Auth admin API creates the synthetic account without a password').toBeNull()
  const id = created.data.user?.id as string
  expect(typeof id).toBe('string')
  const before = await run.admin.auth.admin.getUserById(id)
  expect(before.data.user?.app_metadata?.providers, 'Auth lists the email provider for it').toContain('email')
  expect(await answer(id), 'the account has no password although Auth lists the email provider').toEqual({ data: false, error: null })

  const changed = await run.admin.auth.admin.updateUserById(id, { email: `${run.RUN}_nopw2@example.com`, email_confirm: true })
  expect(changed.error, 'the Auth admin API changes the address').toBeNull()
  expect(await answer(id), 'still no password after the address changed').toEqual({ data: false, error: null })

  expect(await answer(randomUUID()), 'an id with no account gives no answer').toEqual({ data: null, error: null })
})

it('[SEC-927-DB-PASSWORD-DENY] neither a user session nor the anonymous client can call public.account_has_password', async () => {
  const person = await run.makeUser('pwdeny')
  const fromSession = await person.client.rpc('account_has_password', { p_user: person.id })
  const fromAnonymous = await run.anonymousClient().rpc('account_has_password', { p_user: person.id })

  const codes = (result: typeof fromSession) => (result.error ? { code: result.error.code, status: result.status, message: result.error.message } : null)
  const dir = 'docs/sessions/evidence/task927/security'
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/sec-927-db-password-deny.txt`, `${JSON.stringify({ userSession: codes(fromSession), anonymous: codes(fromAnonymous) }, null, 2)}\n`)

  expect(fromSession.error, 'the signed-in user\'s own session is refused').not.toBeNull()
  expect(fromSession.data, 'no boolean reaches the signed-in user').toBeNull()
  expect(fromAnonymous.error, 'the anonymous client is refused').not.toBeNull()
  expect(fromAnonymous.data, 'no boolean reaches the anonymous client').toBeNull()
})
