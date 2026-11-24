// @vitest-environment node
/**
 * Task 991 AC3 — `explainRefusedSignIn`: Supabase Auth refuses a banned account with `user_banned` BEFORE it checks the password, so the sign-in sheet cannot tell a
 * blocked person from a stranger (D21, Task 923). This server action tells a caller that an account is blocked only after the caller has PROVED the password:
 *  - [SEC-991-BLOCKED-EXPLAIN-ALLOW] the right password of a blocked or inactive account → `{ blocked: true }` (with the end date of a dated suspension);
 *  - [SEC-991-ENUM-DENY] a wrong password, an unknown address and an active account all answer the same `{ blocked: false }`;
 *  - [SEC-991-GUESS-DENY] a missing or refused Turnstile token, a limiter that has no room or fails, and an input of the wrong shape are refused BEFORE
 *    `auth_password_matches` is called (the action is a client-callable POST entry point: it checks token and limit itself);
 *  - no log line, no other call and no answer carries the password or the address.
 * The service-role client, the Turnstile check and the limiter are doubles with real behaviour (a credential table, a counter); the action under test is the real one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockVerifyTurnstile = vi.fn()
vi.mock('@/lib/captcha/verifyTurnstile', () => ({ verifyTurnstile: (...args: unknown[]) => mockVerifyTurnstile(...args) }))

type Account = { id: string; email: string; password: string; status: string; suspended_until: string | null }
const world = {
  accounts: [] as Account[],
  hits: [] as string[],
  limiterError: false,
  matchError: false,
  profileError: false,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
}
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      world.rpcCalls.push({ name, args })
      if (name === 'consume_rate_limit') {
        if (world.limiterError) return { data: null, error: { code: 'XX000' } }
        const key = `${args.bucket}|${args.subject}`
        if (world.hits.filter((h) => h === key).length >= Number(args.max_hits)) return { data: false, error: null }
        world.hits.push(key)
        return { data: true, error: null }
      }
      if (name === 'auth_password_matches') {
        if (world.matchError) return { data: null, error: { code: 'XX000' } }
        const account = world.accounts.find((a) => a.email.toLowerCase() === args.p_email)
        return { data: Boolean(account) && account!.password === args.p_password, error: null }
      }
      if (name === 'admin_search_users_by_email') {
        return { data: world.accounts.filter((a) => a.email.toLowerCase().includes(String(args.q))).map((a) => ({ id: a.id })), error: null }
      }
      return { data: null, error: { code: '42883' } }
    },
    auth: { admin: { getUserById: async (id: string) => {
      const account = world.accounts.find((a) => a.id === id)
      return { data: { user: account ? { id, email: account.email } : null }, error: null }
    } } },
    from: () => ({
      select: () => ({
        eq: (_column: string, id: string) => ({
          maybeSingle: async () => {
            if (world.profileError) return { data: null, error: { code: 'XX000' } }
            const account = world.accounts.find((a) => a.id === id)
            return { data: account ? { status: account.status, suspended_until: account.suspended_until, deleted_at: null } : null, error: null }
          },
        }),
      }),
    }),
  }),
}))

import { explainRefusedSignIn } from '../explainRefusedSignIn'

const PASSWORD = 'Str0ng!Passw0rd-synthetic'
const account = (over: Partial<Account> = {}): Account => ({ id: 'user-1', email: 'Ana@Example.com', password: PASSWORD, status: 'blocked', suspended_until: null, ...over })
const call = (over: Partial<{ email: unknown; password: unknown; captchaToken: unknown }> = {}) =>
  explainRefusedSignIn({ email: 'ana@example.com', password: PASSWORD, captchaToken: 'fresh-token', ...over } as never)
const passwordChecks = () => world.rpcCalls.filter((c) => c.name === 'auth_password_matches')

let logged: string[]
beforeEach(() => {
  vi.clearAllMocks()
  mockVerifyTurnstile.mockResolvedValue({ success: true })
  Object.assign(world, { accounts: [account()], hits: [], limiterError: false, matchError: false, profileError: false, rpcCalls: [] })
  logged = []
  for (const level of ['error', 'warn', 'info', 'log'] as const) vi.spyOn(console, level).mockImplementation((...args: unknown[]) => { logged.push(JSON.stringify(args)) })
})

describe('[SEC-991-BLOCKED-EXPLAIN-ALLOW] the right password of a blocked account', () => {
  it('a blocked account is told it is blocked, and the token, the limit and the password check ran in that order', async () => {
    expect(await call()).toEqual({ blocked: true })
    expect(mockVerifyTurnstile).toHaveBeenCalledTimes(1)
    expect(mockVerifyTurnstile.mock.calls[0][0]).toBe('fresh-token')
    expect(world.rpcCalls.map((c) => c.name).slice(0, 2)).toEqual(['consume_rate_limit', 'auth_password_matches'])
    expect(world.rpcCalls[0].args).toEqual({ bucket: 'blocked_signin', subject: 'ana@example.com', window_seconds: 900, max_hits: 5 })
    expect(world.rpcCalls[1].args).toEqual({ p_email: 'ana@example.com', p_password: PASSWORD })
  })

  it('a dated suspension carries its end date; an inactive account is blocked too', async () => {
    const until = new Date(Date.now() + 3 * 86_400_000).toISOString()
    world.accounts = [account({ suspended_until: until })]
    expect(await call()).toEqual({ blocked: true, until })
    world.accounts = [account({ status: 'inactive' })]
    expect(await call()).toEqual({ blocked: true })
  })

  it('a suspension that has ended carries no date', async () => {
    world.accounts = [account({ suspended_until: new Date(Date.now() - 86_400_000).toISOString() })]
    expect(await call()).toEqual({ blocked: true })
  })
})

describe('[SEC-991-ENUM-DENY] everyone who has not proved the password gets one answer', () => {
  it('a wrong password, an unknown address and an active account answer exactly the same', async () => {
    const wrongPassword = await call({ password: 'not-the-password' })
    const unknown = await call({ email: 'nobody@example.com' })
    world.accounts = [account({ status: 'active' })]
    const active = await call()
    expect(wrongPassword).toEqual({ blocked: false })
    expect(JSON.stringify([wrongPassword, unknown, active])).toBe(JSON.stringify([{ blocked: false }, { blocked: false }, { blocked: false }]))
  })

  it('a password check or a profile read that fails answers the same and tells nothing', async () => {
    world.matchError = true
    expect(await call()).toEqual({ blocked: false })
    world.matchError = false; world.profileError = true
    expect(await call()).toEqual({ blocked: false })
  })
})

describe('[SEC-991-GUESS-DENY] a guess is refused before the password is checked', () => {
  it.each([[''], [undefined], [null], [5], [{ a: 1 }], ['x'.repeat(2049)]])('a token %j is refused: no limit is spent and no password is checked', async (captchaToken) => {
    mockVerifyTurnstile.mockImplementation(async (token: unknown) => ({ success: typeof token === 'string' && token.length > 0 && token.length <= 2048 }))
    expect(await call({ captchaToken })).toEqual({ blocked: false })
    expect(passwordChecks()).toEqual([])
    expect(world.rpcCalls.filter((c) => c.name === 'consume_rate_limit')).toEqual([])
  })

  it('a token Turnstile refuses (reused, expired, forged) is refused before the limit and the password', async () => {
    mockVerifyTurnstile.mockResolvedValue({ success: false, errorCodes: ['timeout-or-duplicate'] })
    expect(await call()).toEqual({ blocked: false })
    expect(passwordChecks()).toEqual([])
    expect(world.hits).toEqual([])
  })

  it('five attempts of one address within the window are checked, the sixth is refused before the password check (the address is lower-cased)', async () => {
    world.accounts = [account()]
    for (let attempt = 1; attempt <= 5; attempt++) expect(await call({ email: attempt % 2 ? 'ANA@example.com' : 'ana@Example.com', password: 'guess-' + attempt })).toEqual({ blocked: false })
    expect(passwordChecks()).toHaveLength(5)
    expect(await call()).toEqual({ blocked: false })        // the right password, but over the limit: not told
    expect(passwordChecks()).toHaveLength(5)
    // another address has its own count
    world.accounts = [account(), account({ id: 'user-2', email: 'other@example.com' })]
    expect(await call({ email: 'other@example.com' })).toEqual({ blocked: true })
  })

  it('a limiter that fails refuses (fail closed) and logs its code only', async () => {
    world.limiterError = true
    expect(await call()).toEqual({ blocked: false })
    expect(passwordChecks()).toEqual([])
    expect(logged.join('\n')).toContain('XX000')
  })

  it.each([
    ['an address without an at sign', { email: 'ana.example.com' }],
    ['an empty address', { email: '' }],
    ['an address of 255 characters', { email: `${'a'.repeat(243)}@example.com` }],
    ['an address that is not text', { email: 42 }],
    ['an empty password', { password: '' }],
    ['a password that is not text', { password: ['x'] }],
    ['a password of 1025 characters', { password: 'p'.repeat(1025) }],
  ])('%s is refused before any token check, limit or lookup', async (_label, over) => {
    expect(await call(over)).toEqual({ blocked: false })
    expect(world.rpcCalls).toEqual([])
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })
})

describe('the password and the address stay out of every log and every other call', () => {
  it('no log line carries the password or the address, whatever fails', async () => {
    world.limiterError = true
    await call()
    world.limiterError = false; world.matchError = true
    await call()
    world.matchError = false; world.profileError = true
    await call()
    mockVerifyTurnstile.mockRejectedValue(new Error('network'))
    expect(await call(), 'a check that throws is a refusal, not an error to the caller').toEqual({ blocked: false })
    const everything = logged.join('\n')
    expect(everything).not.toContain(PASSWORD)
    expect(everything.toLowerCase()).not.toContain('ana@example.com')
  })

  it('the password is an argument of auth_password_matches only', async () => {
    await call()
    for (const rpcCall of world.rpcCalls.filter((c) => c.name !== 'auth_password_matches')) expect(JSON.stringify(rpcCall.args)).not.toContain(PASSWORD)
    expect(mockVerifyTurnstile.mock.calls.every((args) => !JSON.stringify(args).includes(PASSWORD))).toBe(true)
  })

  it('the answer holds a flag and a date, never the address, the status text or a reason', async () => {
    world.accounts = [account({ suspended_until: new Date(Date.now() + 86_400_000).toISOString() })]
    const answer = await call()
    expect(Object.keys(answer).sort()).toEqual(['blocked', 'until'])
    expect(JSON.stringify(answer).toLowerCase()).not.toContain('ana@example.com')
  })
})
