/**
 * Guard smoke — signUpWithCaptcha server action (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle row:
 *   - Signup: valid → { ok: true }; captcha fail → typed error; dup email → typed error.
 *
 * Task 923 R67 (c) / Task 931 R6: Supabase Auth is the ONE verifier of the Turnstile token. The action only checks that a
 * token is present and hands it to `signUp`; a refusal by Supabase (code `captcha_failed`) maps to `captcha_failed`.
 * `verifyTurnstile` stays mocked so that a call to it would be seen.
 *
 * Task 991 AC1: an address that already has an account is answered with the same neutral `{ ok: true }` as a new address, and the owner of the
 * existing address gets one mail (`account_exists`, or `account_blocked` for a blocked or inactive account), sent in `after()` through the
 * `account_notice_mail` limit (one mail per address per hour; a limiter that fails sends nothing).
 *
 * Planted-violation proof:
 *   Remove the `if (!captchaToken) return { ok: false, reason: 'captcha_failed' }` guard
 *   → the empty-captcha test FAILS (proceeds to verifyTurnstile and gets captcha_failed
 *   from there, OR proceeds to Supabase with an empty token).
 *   Simpler: in the "signup failed" test, stub signUp to return success instead of error
 *   → expect(result.ok).toBe(false) FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockVerifyTurnstile = vi.fn()
vi.mock('@/lib/captcha/verifyTurnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => mockVerifyTurnstile(...args),
}))

const mockSignUp = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// Task 991: `after()` has no request to attach to in a test; the work it is given is kept and run by `flushAfter()`, so a test can see that nothing ran before the answer.
const afterQueue: (() => unknown)[] = []
vi.mock('next/server', () => ({
  after: (task: () => unknown) => { afterQueue.push(task) },
}))
async function flushAfter() {
  while (afterQueue.length) await afterQueue.shift()!()
}

// Task 991 Revision 1 (F1): the service-role client, as the action uses it: ONE exact-address lookup `account_status_by_email` (the double matches lower(email) = lower(p_email) exactly,
// as the SQL does, so `%` and `_` are ordinary characters) and the shared limiter. Any other call (the wildcard search `admin_search_users_by_email`, `auth.admin.*`, a table read) is not answered.
type Account = { id: string; email: string; status: string; suspended_until: string | null }
const world = {
  accounts: [] as Account[],
  hits: [] as string[],
  limiterError: false,
  searchError: false,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  mails: [] as { key: string; to: string; variables: Record<string, string> }[],
  mailFails: false,
}
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      world.rpcCalls.push({ name, args })
      if (name === 'account_status_by_email') {
        if (world.searchError) return { data: null, error: { code: 'XX000' } }
        const wanted = String(args.p_email).toLowerCase()
        return { data: world.accounts.filter((a) => a.email.toLowerCase() === wanted).map((a) => ({ id: a.id, email: a.email, status: a.status, suspended_until: a.suspended_until })), error: null }
      }
      if (name === 'consume_rate_limit') {
        if (world.limiterError) return { data: null, error: { code: 'XX000' } }
        const key = `${args.bucket}|${args.subject}`
        if (world.hits.filter((h) => h === key).length >= Number(args.max_hits)) return { data: false, error: null }
        world.hits.push(key)
        return { data: true, error: null }
      }
      return { data: null, error: { code: '42883' } }
    },
  }),
}))
vi.mock('@/modules/notifications/lib/sendTemplatedEmail', () => ({
  sendTemplatedEmail: async (options: { key: string; to: string; variables?: Record<string, string> }) => {
    if (world.mailFails) throw new Error('smtp down')
    world.mails.push({ key: options.key, to: options.to, variables: options.variables ?? {} })
    return {}
  },
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // The action must not call it (Supabase Auth is the one verifier); it succeeds so that a stray call would not change the result
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  // Default: Supabase signUp succeeds
  mockSignUp.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
  })
  afterQueue.length = 0
  Object.assign(world, { accounts: [], hits: [], limiterError: false, searchError: false, rpcCalls: [], mails: [], mailFails: false })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('signUpWithCaptcha — smoke tests (Task 441)', () => {
  it('[SEC-931-SRV-CAPTCHA-ALLOW] happy path: valid captcha + email/password → { ok: true }; the token goes to Supabase and verifyTurnstile is not called', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'valid-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: true })
    // Task 923 R67 (c): Supabase Auth is the ONE verifier — the action only hands the token over (a Turnstile token is single-use)
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
    expect(mockSignUp).toHaveBeenCalledTimes(1)
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      options: expect.objectContaining({ captchaToken: 'valid-turnstile-token' }),
    }))
  })

  it('captcha fail — empty token → { ok: false, reason: "captcha_failed" } without calling Supabase', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: '',               // empty
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    // Guard: Supabase must NOT be called when captcha is absent
    expect(mockSignUp).not.toHaveBeenCalled()
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })

  it('[SEC-931-SRV-CAPTCHA-DENY] captcha fail — Supabase refuses the token → { ok: false, reason: "captcha_failed" }', async () => {
    // Task 923 R67 (c): the action no longer verifies the token itself; Supabase Auth refuses an invalid or replayed one with code `captcha_failed`.
    const refusal = { code: 'captcha_failed', message: 'captcha protection: request disallowed (invalid-input-response)', status: 400 }
    mockSignUp.mockResolvedValue({ error: refusal })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'bad-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(mockSignUp).toHaveBeenCalledTimes(1)
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ captchaToken: 'bad-turnstile-token' }),
    }))
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })

  it('captcha fail — a refusal that only names the captcha in its message is also captcha_failed', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Captcha verification process failed', status: 400 } })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'new@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'replayed-turnstile-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
  })

  it('signup failed (dup email / weak pw) → { ok: false, reason: "signup_failed" } with the error key', async () => {
    const supabaseError = { message: 'User already registered', status: 422 }
    mockSignUp.mockResolvedValue({ error: supabaseError })

    const { signUpWithCaptcha } = await import('../captcha')
    const result = await signUpWithCaptcha({
      email: 'existing@example.com',
      password: 'SecureP@ss1',
      captchaToken: 'valid-token',
      emailRedirectTo: 'https://lero.al/sq/auth/verified',
    })

    // Guard: error must be typed (not raw Supabase error) so caller shows localized copy
    expect(result).toEqual({ ok: false, reason: 'signup_failed', errorKey: 'error_email_exists' })
  })
})

// ── Task 991 AC1 ──────────────────────────────────────────────────────────────

describe('signUpWithCaptcha — an address that already has an account (Task 991 AC1)', () => {
  const params = (email: string) => ({ email, password: 'SecureP@ss1', captchaToken: 'valid-token', emailRedirectTo: 'https://lero.al/sq/auth/verified' })
  /** what Supabase Auth answers for an address that already has a CONFIRMED account (measured 2026-11-19 on the real Auth: no error, a user, `identities: []`, no session) */
  const answerExisting = () => mockSignUp.mockResolvedValue({ data: { user: { id: 'obfuscated', identities: [] }, session: null }, error: null })
  const answerNew = () => mockSignUp.mockResolvedValue({ data: { user: { id: 'fresh', identities: [{ id: 'i' }] }, session: null }, error: null })
  const account = (over: Partial<Account> = {}): Account => ({ id: 'user-1', email: 'Ana@Example.com', status: 'active', suspended_until: null, ...over })

  it('an existing active address gets the neutral answer and, after it, one account_exists mail with the sign-in link', async () => {
    world.accounts = [account()]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    expect(world.mails, 'nothing is sent before the answer: the lookup and the mail run in after()').toEqual([])
    expect(afterQueue).toHaveLength(1)
    await flushAfter()
    expect(world.mails).toHaveLength(1)
    expect(world.mails[0].key).toBe('account_exists')
    expect(world.mails[0].to).toBe('Ana@Example.com')
    expect(world.mails[0].variables.signInUrl).toMatch(/^https:\/\/[^/]+\/sq\/auth\/login$/)
    expect(world.mails[0].variables).not.toHaveProperty('supportUrl')
  })

  it('a blocked address gets account_blocked with the support link, and a dated suspension names its end date', async () => {
    world.accounts = [account({ status: 'blocked' })]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails.map((m) => m.key)).toEqual(['account_blocked'])
    expect(world.mails[0].variables.supportUrl).toMatch(/^https:\/\/[^/]+\/sq\/contact$/)
    expect(world.mails[0].variables.untilText).toBe('')

    world.mails = []; world.hits = []
    const until = new Date(Date.now() + 5 * 86_400_000).toISOString()
    world.accounts = [account({ status: 'blocked', suspended_until: until })]
    await signUpWithCaptcha(params('ana@example.com'))
    await flushAfter()
    expect(world.mails[0].key).toBe('account_blocked')
    expect(world.mails[0].variables.untilText).toContain(String(new Date(until).getUTCFullYear()))
  })

  it('an inactive account gets account_blocked too', async () => {
    world.accounts = [account({ status: 'inactive' })]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    await signUpWithCaptcha(params('ana@example.com'))
    await flushAfter()
    expect(world.mails.map((m) => m.key)).toEqual(['account_blocked'])
  })

  it('a new address sends no mail and does not even look up an account', async () => {
    answerNew()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('new@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(afterQueue).toHaveLength(0)
    expect(world.mails).toEqual([])
    expect(world.rpcCalls).toEqual([])
  })

  it('a second attempt within the hour answers the same and sends no second mail; the limit is account_notice_mail, 3600 s, 1 hit, keyed by the lower-cased address', async () => {
    world.accounts = [account()]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('Ana@Example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(await signUpWithCaptcha(params('ANA@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails).toHaveLength(1)
    const limiterCalls = world.rpcCalls.filter((c) => c.name === 'consume_rate_limit')
    expect(limiterCalls).toHaveLength(2)
    for (const call of limiterCalls) expect(call.args).toEqual({ bucket: 'account_notice_mail', subject: 'ana@example.com', window_seconds: 3600, max_hits: 1 })
  })

  it('a limiter that fails sends no mail (fail closed) and the answer stays neutral', async () => {
    world.accounts = [account()]
    world.limiterError = true
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('a lookup, a limiter or a mail that fails never reaches the caller and nothing throws out of after()', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    answerExisting()
    world.accounts = [account()]
    world.searchError = true
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    await expect(flushAfter()).resolves.toBeUndefined()
    expect(world.mails).toEqual([])

    world.searchError = false; world.mailFails = true
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    await expect(flushAfter()).resolves.toBeUndefined()
    expect(world.mails).toEqual([])
  })

  it('Revision 1 (F1): the lookup is ONE account_status_by_email call with the lower-cased, trimmed address, never the wildcard search or an Auth admin call', async () => {
    world.accounts = [account()]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('  ANA@Example.COM '))).toEqual({ ok: true })
    await flushAfter()
    const lookups = world.rpcCalls.filter((c) => c.name === 'account_status_by_email')
    expect(lookups).toHaveLength(1)
    expect(lookups[0].args).toEqual({ p_email: 'ana@example.com' })
    expect(world.rpcCalls.map((c) => c.name)).not.toContain('admin_search_users_by_email')
    expect(world.rpcCalls.map((c) => c.name).sort()).toEqual(['account_status_by_email', 'consume_rate_limit'])
    expect(world.mails.map((m) => m.key)).toEqual(['account_exists'])
  })

  it.each([['%@example.com'], ['_na@example.com'], ['%na@example.com'], ['ana@%']])(
    'Revision 1 (F1): the wildcard address %j looks nothing else up: one exact call with that text, no account found, no mail',
    async (email) => {
      world.accounts = [account(), account({ id: 'user-2', email: 'bob@example.com', status: 'blocked' })]
      answerExisting()
      const { signUpWithCaptcha } = await import('../captcha')
      expect(await signUpWithCaptcha(params(email))).toEqual({ ok: true })
      await flushAfter()
      expect(world.rpcCalls.map((c) => c.name)).toEqual(['account_status_by_email'])
      expect(world.rpcCalls[0].args).toEqual({ p_email: email })
      expect(world.mails).toEqual([])
    },
  )

  it('an address that is not in the account list gets no mail', async () => {
    world.accounts = [account({ email: 'someone.else@example.com' })]
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('[SEC-991-ENUM-DENY] a new, an existing and a blocked address get exactly the same answer', async () => {
    const { signUpWithCaptcha } = await import('../captcha')
    answerNew()
    const fresh = await signUpWithCaptcha(params('new@example.com'))
    world.accounts = [account(), account({ id: 'user-2', email: 'blocked@example.com', status: 'blocked' })]
    answerExisting()
    const existing = await signUpWithCaptcha(params('ana@example.com'))
    const blocked = await signUpWithCaptcha(params('blocked@example.com'))
    expect(fresh).toEqual({ ok: true })
    expect(existing).toEqual(fresh)
    expect(blocked).toEqual(fresh)
    expect(JSON.stringify([fresh, existing, blocked])).toBe(JSON.stringify([fresh, fresh, fresh]))
    await flushAfter()
    expect(world.mails.map((m) => m.key).sort()).toEqual(['account_blocked', 'account_exists'])
  })

  it('an address whose account is not confirmed yet: Auth sends the confirmation again and answers a user with an identity, so the answer is { ok: true } with no lookup and no notice mail (measured 2026-11-24)', async () => {
    // Measured 2026-11-24 (Task 1032, "## Cause") with a deliverable address (Resend's test sink): an unconfirmed account made through the Auth admin API, then a sign-up of the same address
    // -> the sheet "Check your email", `auth.users.confirmation_sent_at` set, the confirmation mail delivered, no `account_notice_mail` row. So Auth answers no error and a user WITH an
    // identity (the confirmation is sent again by Auth); the action answers `ok` and schedules nothing. The 500 that Task 991 once pinned here came from the Auth e-mail hook refusing an
    // undeliverable synthetic address (Auth log 2026-11-24 13:03:37 UTC, `user_confirmation_requested`), not from the unconfirmed state.
    mockSignUp.mockResolvedValue({ data: { user: { id: 'pending', identities: [{ id: 'i' }] }, session: null }, error: null })
    const { signUpWithCaptcha } = await import('../captcha')
    expect(await signUpWithCaptcha(params('pending@example.com'))).toEqual({ ok: true })
    expect(afterQueue).toEqual([])
    await flushAfter()
    expect(world.mails).toEqual([])
    expect(world.rpcCalls).toEqual([])
  })

  it('no log line carries the address', async () => {
    const logged: string[] = []
    for (const level of ['error', 'warn', 'info', 'log'] as const) vi.spyOn(console, level).mockImplementation((...args: unknown[]) => { logged.push(JSON.stringify(args)) })
    world.accounts = [account()]
    world.limiterError = true
    answerExisting()
    const { signUpWithCaptcha } = await import('../captcha')
    await signUpWithCaptcha(params('ana@example.com'))
    await flushAfter()
    world.limiterError = false; world.mailFails = true
    await signUpWithCaptcha(params('ana@example.com'))
    await flushAfter()
    expect(logged.length, 'the failures are logged').toBeGreaterThan(0)
    expect(logged.join('\n').toLowerCase()).not.toContain('ana@example.com')
  })
})
