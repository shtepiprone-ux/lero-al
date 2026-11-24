/**
 * Guard smoke — requestPasswordResetWithCaptcha server action (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle row:
 *   - Recovery request: neutral success; non-enumeration assertion (unknown ≡ known email).
 *
 * Key invariant (non-enumeration): whether the email belongs to an existing user or not,
 * the response MUST be identical ({ ok: true }) so attackers cannot enumerate registered
 * emails by observing different responses. The underlying Supabase SDK preserves this:
 * `resetPasswordForEmail` returns success even for unknown emails.
 *
 * Task 991 AC2: a reset request for a BLOCKED or inactive address verifies the token itself (`verifyTurnstile`), sends the `account_blocked` mail in `after()`
 * through the `account_notice_mail` limit and never calls Auth (a reset link of a banned account cannot work); the answer is the same `{ ok: true }`.
 * Every other address goes to Auth exactly as before.
 *
 * Planted-violation proof:
 *   In the non-enumeration test, stub Supabase to return an error for the "unknown" email
 *   → the action would return { ok: false, reason: 'reset_failed' }
 *   → expect(unknownResult).toEqual({ ok: true }) FAILS.
 *   Revert → PASS. (Shows enumeration would be caught immediately.)
 *
 * Command: npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockVerifyTurnstile = vi.fn()
vi.mock('@/lib/captcha/verifyTurnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => mockVerifyTurnstile(...args),
}))

const mockResetPasswordForEmail = vi.fn()
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// Task 991: `after()` has no request to attach to in a test; the work it is given is kept and run by `flushAfter()`.
const afterQueue: (() => unknown)[] = []
vi.mock('next/server', () => ({
  after: (task: () => unknown) => { afterQueue.push(task) },
}))
async function flushAfter() {
  while (afterQueue.length) await afterQueue.shift()!()
}

// Task 991 Revision 1 (F1): the service-role client, as the action uses it: ONE exact-address lookup `account_status_by_email` (the double matches
// lower(email) = lower(p_email) exactly, as the SQL does, so `%` and `_` are ordinary characters) and the shared limiter. Any other call
// (the wildcard search `admin_search_users_by_email`, `auth.admin.*`, a table read) is not answered, so a call to it fails the lookup and is listed in `rpcCalls`.
type Account = { id: string; email: string; status: string; suspended_until: string | null }
const world = {
  accounts: [] as Account[],
  hits: [] as string[],
  limiterError: false,
  searchError: false,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  mails: [] as { key: string; to: string; variables: Record<string, string> }[],
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
    world.mails.push({ key: options.key, to: options.to, variables: options.variables ?? {} })
    return {}
  },
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  mockResetPasswordForEmail.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: { resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args) },
  })
  afterQueue.length = 0
  Object.assign(world, { accounts: [], hits: [], limiterError: false, searchError: false, rpcCalls: [], mails: [] })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('requestPasswordResetWithCaptcha — smoke tests (Task 441)', () => {
  it('happy path: valid captcha + known email → { ok: true } (neutral success)', async () => {
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'registered@example.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    expect(result).toEqual({ ok: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'registered@example.com',
      expect.objectContaining({ redirectTo: 'https://lero.al/sq/auth/reset-password' }),
    )
  })

  it('non-enumeration: unknown email → SAME { ok: true } as known email (no enumeration)', async () => {
    // Supabase SDK returns success even for unknown emails to prevent enumeration.
    // This test pins that contract: if someone changes the action to check whether
    // the email exists and return a different response, this test FAILS.
    mockResetPasswordForEmail.mockResolvedValue({ error: null }) // same as "known" email

    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const unknownResult = await requestPasswordResetWithCaptcha({
      email: 'nobody@notregistered.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    // Guard: response MUST be identical to the "known email" case — no distinguishing info
    expect(unknownResult).toEqual({ ok: true })
  })

  it('captcha fail — empty token → { ok: false, reason: "captcha_failed" } without calling Supabase', async () => {
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'any@example.com',
      captchaToken: '',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    expect(result).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('supabase error (rate limit or transient) → { ok: false, reason: "reset_failed" }', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Email rate limit exceeded', status: 429 },
    })

    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const result = await requestPasswordResetWithCaptcha({
      email: 'any@example.com',
      captchaToken: 'valid-token',
      redirectTo: 'https://lero.al/sq/auth/reset-password',
    })

    // Guard: error is typed (not raw Supabase) and carries no Supabase text
    expect(result).toEqual({ ok: false, reason: 'reset_failed' })
  })
})

// ── Task 991 AC2 ──────────────────────────────────────────────────────────────

describe('requestPasswordResetWithCaptcha — a blocked address (Task 991 AC2)', () => {
  const reset = (email: string, captchaToken = 'valid-token') => ({ email, captchaToken, redirectTo: 'https://lero.al/sq/auth/reset-password' })
  const account = (over: Partial<Account> = {}): Account => ({ id: 'user-1', email: 'Ana@Example.com', status: 'blocked', suspended_until: null, ...over })

  it('blocked → the token is verified here, account_blocked is sent after the answer, Auth is not called, the answer is ok', async () => {
    world.accounts = [account()]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    expect(mockVerifyTurnstile).toHaveBeenCalledTimes(1)
    expect(mockVerifyTurnstile.mock.calls[0][0]).toBe('valid-token')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    expect(world.mails, 'the mail runs in after()').toEqual([])
    await flushAfter()
    expect(world.mails).toHaveLength(1)
    expect(world.mails[0].key).toBe('account_blocked')
    expect(world.mails[0].to).toBe('Ana@Example.com')
    expect(world.mails[0].variables.supportUrl).toMatch(/^https:\/\/[^/]+\/sq\/contact$/)
  })

  it('inactive is treated as blocked', async () => {
    world.accounts = [account({ status: 'inactive' })]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails.map((m) => m.key)).toEqual(['account_blocked'])
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('active → Auth as today: no verifyTurnstile call by the action, no mail', async () => {
    world.accounts = [account({ status: 'active' })]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('an unknown address → Auth as today, no mail', async () => {
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('nobody@example.com'))).toEqual({ ok: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('a failed token → captcha_failed for a blocked and for an active address, with no mail and no Auth call', async () => {
    mockVerifyTurnstile.mockResolvedValue({ success: false, errorCodes: ['invalid-input-response'] })
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    world.accounts = [account()]
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: false, reason: 'captcha_failed' })
    await flushAfter()
    expect(world.mails).toEqual([])
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()

    // an active address: Auth is the verifier and refuses the token
    world.accounts = [account({ status: 'active' })]
    mockResetPasswordForEmail.mockResolvedValue({ error: { code: 'captcha_failed', message: 'captcha protection: request disallowed', status: 400 } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: false, reason: 'captcha_failed' })
  })

  it('a second blocked request within the hour answers the same and sends no second mail; the limit is account_notice_mail, 3600 s, 1 hit', async () => {
    world.accounts = [account()]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(await requestPasswordResetWithCaptcha(reset('ANA@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails).toHaveLength(1)
    const limiterCalls = world.rpcCalls.filter((c) => c.name === 'consume_rate_limit')
    for (const call of limiterCalls) expect(call.args).toEqual({ bucket: 'account_notice_mail', subject: 'ana@example.com', window_seconds: 3600, max_hits: 1 })
  })

  it('a limiter that fails sends no mail (fail closed) and the answer stays ok', async () => {
    world.accounts = [account()]
    world.limiterError = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('a lookup that fails cannot show the status: the request goes to Auth as today', async () => {
    world.accounts = [account()]
    world.searchError = true
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('ana@example.com'))).toEqual({ ok: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(world.mails).toEqual([])
  })

  it('[SEC-991-ENUM-DENY] a blocked, an active and an unknown address get exactly the same answer', async () => {
    world.accounts = [account(), account({ id: 'user-2', email: 'active@example.com', status: 'active' })]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    const blocked = await requestPasswordResetWithCaptcha(reset('ana@example.com'))
    const active = await requestPasswordResetWithCaptcha(reset('active@example.com'))
    const unknown = await requestPasswordResetWithCaptcha(reset('nobody@example.com'))
    expect(JSON.stringify([blocked, active, unknown])).toBe(JSON.stringify([{ ok: true }, { ok: true }, { ok: true }]))
  })
})

// ── Task 991 Revision 1 (F1): the lookup is one exact-address call, after a shape check, never a wildcard search ──────────────────────────────────────────────────────────

describe('requestPasswordResetWithCaptcha — the account lookup is exact and cheap (Task 991 Revision 1, F1)', () => {
  const reset = (email: unknown, captchaToken = 'valid-token') => ({ email, captchaToken, redirectTo: 'https://lero.al/sq/auth/reset-password' }) as never
  const account = (over: Partial<Account> = {}): Account => ({ id: 'user-1', email: 'Ana@Example.com', status: 'blocked', suspended_until: null, ...over })
  const lookups = () => world.rpcCalls.filter((c) => c.name === 'account_status_by_email')

  it.each([
    ['an address that is not text (a number)', 42],
    ['an address that is not text (null)', null],
    ['an address that is not text (an object)', { a: 1 }],
    ['an empty address', ''],
    ['an address of 255 characters', `${'a'.repeat(243)}@example.com`],
    ['an address without an at sign', 'ana.example.com'],
    ['the wildcard % alone', '%'],
    ['the wildcard _ alone', '_'],
  ])('%s goes to Auth as before: no service-role call at all, no mail, no token check by the action', async (_label, email) => {
    world.accounts = [account()]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset(email))).toEqual({ ok: true })
    expect(world.rpcCalls, 'no lookup and no limiter call for an address of the wrong shape').toEqual([])
    expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(mockResetPasswordForEmail.mock.calls[0][0]).toBe(email)
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
    await flushAfter()
    expect(world.mails).toEqual([])
  })

  it('an address of exactly 254 characters is still looked up (the shape check is a bound, not a stricter rule)', async () => {
    const longest = `${'a'.repeat(242)}@example.com`
    expect(longest).toHaveLength(254)
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    await requestPasswordResetWithCaptcha(reset(longest))
    expect(lookups()).toHaveLength(1)
  })

  it('the lookup is ONE account_status_by_email call with the lower-cased, trimmed address, and never the wildcard search or an Auth admin call', async () => {
    world.accounts = [account()]
    const { requestPasswordResetWithCaptcha } = await import('../captcha')
    expect(await requestPasswordResetWithCaptcha(reset('  ANA@Example.COM  '))).toEqual({ ok: true })
    expect(lookups()).toHaveLength(1)
    expect(lookups()[0].args).toEqual({ p_email: 'ana@example.com' })
    expect(world.rpcCalls.map((c) => c.name)).not.toContain('admin_search_users_by_email')
    // blocked: the token is verified here and the one mail goes out after the answer; the rest of the calls are the limiter's
    await flushAfter()
    expect(world.mails.map((m) => m.key)).toEqual(['account_blocked'])
    expect(world.rpcCalls.map((c) => c.name).sort()).toEqual(['account_status_by_email', 'consume_rate_limit'])
  })

  it.each([['%@example.com'], ['_na@example.com'], ['%na@example.com'], ['ana@%']])(
    'the wildcard address %j looks nothing else up: one exact call with that text, no account found, no mail, Auth as before',
    async (email) => {
      world.accounts = [account(), account({ id: 'user-2', email: 'bob@example.com', status: 'active' })]
      const { requestPasswordResetWithCaptcha } = await import('../captcha')
      expect(await requestPasswordResetWithCaptcha(reset(email))).toEqual({ ok: true })
      expect(lookups()).toHaveLength(1)
      expect(lookups()[0].args).toEqual({ p_email: email })
      expect(world.rpcCalls.map((c) => c.name)).toEqual(['account_status_by_email'])
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1)
      expect(mockVerifyTurnstile).not.toHaveBeenCalled()
      await flushAfter()
      expect(world.mails).toEqual([])
    },
  )
})
