// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S2): the password-recovery completion log.
 *
 * `logPasswordRecoveryCompletion(userId, email)` is a Server Action, so anyone can call it with any arguments. It sent the "your password was changed" e-mail
 * to the `email` argument and read the profile name of `userId`: a free e-mail relay from our domain to any address (phishing and spam), with no session needed.
 * It must act only for the signed-in person, take the address from the SESSION, and ignore whatever a caller passes.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sent: { to: string; name: string | null }[] = []
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({
  sendPasswordChangedEmail: vi.fn(async (a: { to: string; name: string | null }) => { sent.push(a) }),
}))

let sessionUser: { id: string; email?: string } | null = null
vi.mock('@/lib/auth/server', () => ({ getUser: async () => sessionUser }))

const profileReads: string[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: (_c: string, id: string) => ({
      single: async () => { profileReads.push(id); return { data: { name: 'Session Person' } } },
      // the signed-in person's own row, read by the real `requireViewer()` (Task 923 R44)
      maybeSingle: async () => ({ data: { role: 'user', status: 'active', suspended_until: null, deleted_at: null }, error: null }),
    }) }) }),
  }),
}))

let requestHeaders: Record<string, string> = {}
const cookieJar = new Map<string, string>()
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => requestHeaders[k.toLowerCase()] ?? null }),
  cookies: async () => ({ get: (n: string) => (cookieJar.has(n) ? { name: n, value: cookieJar.get(n) } : undefined), set: (n: string, v: string) => { cookieJar.set(n, v) } }),
}))

// the verified claims of the current session (Task 923 R70 (d)): which methods signed it in, and when
type Amr = { method: string; timestamp: number }
let claims: { session_id?: string; amr?: Amr[] } | null = null
let claimsError: { message: string } | null = null
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: claims ? { claims } : null, error: claimsError }) } }),
}))
const secondsAgo = (s: number) => Math.floor(Date.now() / 1000) - s

import { logPasswordRecoveryCompletion, logPasswordRecoveryRequest } from '../recovery'

const call = logPasswordRecoveryCompletion as unknown as (...a: unknown[]) => Promise<void>

beforeEach(() => {
  sent.length = 0
  profileReads.length = 0
  sessionUser = null
  cookieJar.clear()
  claimsError = null
  claims = { session_id: 'sess-1', amr: [{ method: 'recovery', timestamp: secondsAgo(30) }] }     // by default: a session that has just been through a recovery
  requestHeaders = { 'user-agent': 'UA', 'x-forwarded-for': '203.0.113.7' }
  // a fresh spy per test: re-spying returns the same mock, whose recorded calls would still hold the previous test's lines
  vi.restoreAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('logPasswordRecoveryCompletion', () => {
  it('sends nothing and reads nothing for a caller without a session, whatever it passes', async () => {
    await call('victim-id', 'victim@example.com')
    expect(sent).toEqual([])
    expect(profileReads).toEqual([])
  })

  it('sends the e-mail to the address of the SESSION, never to an argument', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    await call('victim-id', 'victim@example.com')
    expect(sent).toHaveLength(1)
    expect(sent[0].to).toBe('me@example.com')
    expect(profileReads).toEqual(['me'])
  })

  it('does nothing for a session that has no e-mail address', async () => {
    sessionUser = { id: 'me' }
    await call()
    expect(sent).toEqual([])
  })

  it('works with no arguments at all', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    await call()
    expect(sent.map((s) => s.to)).toEqual(['me@example.com'])
  })

  it('logs a hashed correlation id and never the raw e-mail address', async () => {
    sessionUser = { id: 'me', email: 'secret.person@example.com' }
    const info = vi.mocked(console.info)
    await call()
    const logged = JSON.stringify(info.mock.calls)
    expect(logged).not.toContain('secret.person')
    expect(logged).toMatch(/correlationId/)
  })

  it('cuts a long or line-broken user agent so a caller cannot forge log lines', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    requestHeaders['user-agent'] = `bad\n[security:recovery-complete] forged ${'x'.repeat(500)}`
    const info = vi.mocked(console.info)
    await call()
    const meta = info.mock.calls[0][1] as { ua: string }
    expect(meta.ua.length).toBeLessThanOrEqual(200)
    expect(meta.ua).not.toMatch(/[\r\n]/)
  })
})

describe('recovery', () => {
  it('[SEC-X-SRV-RECOVERY-MAIL] only a recovery sends the notice', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    // a session that signed in with a password: nothing, however often it asks
    claims = { session_id: 'sess-pw', amr: [{ method: 'password', timestamp: secondsAgo(20) }] }
    await call(); await call()
    expect(sent).toEqual([])
    // a recovery session: one notice, and none for the second call of the same session
    claims = { session_id: 'sess-r', amr: [{ method: 'recovery', timestamp: secondsAgo(20) }] }
    await call(); await call()
    expect(sent.map((s) => s.to)).toEqual(['me@example.com'])
    // a NEW recovery session sends its own
    claims = { session_id: 'sess-r2', amr: [{ method: 'otp', timestamp: secondsAgo(20) }] }
    await call(); await call()
    expect(sent).toHaveLength(2)
  })

  it('a recovery older than ten minutes, a future timestamp, no session id, no claims and a failed claims read send nothing', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    for (const c of [
      { session_id: 's', amr: [{ method: 'recovery', timestamp: secondsAgo(11 * 60) }] },
      { session_id: 's', amr: [{ method: 'otp', timestamp: secondsAgo(-600) }] },
      { amr: [{ method: 'recovery', timestamp: secondsAgo(5) }] },
      { session_id: 's' },
      { session_id: 's', amr: [{ method: 'recovery' }] },
      { session_id: 's', amr: [{ method: 'oauth', timestamp: secondsAgo(5) }, { method: 'password', timestamp: secondsAgo(5) }] },
    ] as Array<{ session_id?: string; amr?: Amr[] }>) {
      claims = c
      await call()
    }
    claims = null
    await call()
    claims = { session_id: 's', amr: [{ method: 'recovery', timestamp: secondsAgo(5) }] }
    claimsError = { message: 'down' }
    await call()
    expect(sent).toEqual([])
  })
})

describe('logPasswordRecoveryRequest (public: it only writes one hashed log line)', () => {
  it('logs the hash and no address, and sends no e-mail', async () => {
    const info = vi.mocked(console.info)
    await logPasswordRecoveryRequest('someone@example.com')
    expect(JSON.stringify(info.mock.calls)).not.toContain('someone@example.com')
    expect(sent).toEqual([])
  })
})

describe('the request metadata that is logged', () => {
  const lastLog = () => (console.info as unknown as { mock: { calls: [string, Record<string, unknown>][] } }).mock.calls.at(-1)![1]

  it('takes the first address of x-forwarded-for, then x-real-ip, then "unknown"', async () => {
    requestHeaders = { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'x-real-ip': '198.51.100.1' }
    await logPasswordRecoveryRequest('a@example.com')
    expect(lastLog().ip).toBe('203.0.113.7')
    requestHeaders = { 'x-real-ip': '198.51.100.1' }
    await logPasswordRecoveryRequest('a@example.com')
    expect(lastLog().ip).toBe('198.51.100.1')
    requestHeaders = {}
    await logPasswordRecoveryRequest('a@example.com')
    expect(lastLog()).toMatchObject({ ip: 'unknown', ua: 'unknown' })
  })

  it('a line break or other control character in a header cannot forge a log line', async () => {
    requestHeaders = { 'x-forwarded-for': '1.2.3.4\r\n[security:recovery-complete] {"userId":"admin"}', 'user-agent': 'Mozilla\n\tfake line\u0000end' }
    await logPasswordRecoveryRequest('a@example.com')
    expect(JSON.stringify(lastLog())).not.toMatch(/[\u0000-\u001f]/)
    expect(String(lastLog().ip)).toBe('1.2.3.4 [security:recovery-complete] {"userId":"admin"}')
    expect(lastLog().ua).toBe('Mozilla fake line end')
  })

  it('the address is cut at 64 characters and the browser at 200', async () => {
    requestHeaders = { 'x-forwarded-for': 'a'.repeat(500), 'user-agent': 'b'.repeat(500) }
    await logPasswordRecoveryRequest('a@example.com')
    expect(String(lastLog().ip)).toHaveLength(64)
    expect(String(lastLog().ua)).toHaveLength(200)
  })

  it('the e-mail is logged only as a short one-way hash, the same for any spelling of the address', async () => {
    await logPasswordRecoveryRequest('Ana@Example.com')
    const first = lastLog().correlationId as string
    await logPasswordRecoveryRequest('  ana@example.com ')
    expect(lastLog().correlationId).toBe(first)
    expect(first).toMatch(/^[0-9a-f]{16}$/)
    expect(JSON.stringify((console.info as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain('example.com')
  })

  it('a different address gives a different hash, and a different salt too', async () => {
    await logPasswordRecoveryRequest('a@example.com')
    const a = lastLog().correlationId
    await logPasswordRecoveryRequest('b@example.com')
    expect(lastLog().correlationId).not.toBe(a)
    process.env.LOG_CORRELATION_SALT = 'other-salt'
    await logPasswordRecoveryRequest('a@example.com')
    expect(lastLog().correlationId).not.toBe(a)
    delete process.env.LOG_CORRELATION_SALT
  })

  it('the request and the completion of one person are linked by the same hash', async () => {
    sessionUser = { id: 'me', email: 'Me@Example.com' }
    await logPasswordRecoveryRequest('me@example.com')
    const request = lastLog().correlationId
    await logPasswordRecoveryCompletion()
    expect(lastLog()).toMatchObject({ correlationId: request, userId: 'me' })
  })
})

describe('the e-mail after a completed recovery', () => {
  it('greets by the profile name of the signed-in person', async () => {
    sessionUser = { id: 'me', email: 'me@example.com' }
    await logPasswordRecoveryCompletion()
    expect(sent[0].name).toBe('Session Person')
  })
})

// Task 923 R38 (case SEC-S02-SRV-DENY)
it('[SEC-S02-SRV-DENY] logPasswordRecoveryCompletion acts only for the session user and takes no address from the caller', async () => {
  await call('victim-id', 'victim@example.com')                          // no session: nothing is sent, nothing is read
  expect(sent).toEqual([])
  expect(profileReads).toEqual([])
  sessionUser = { id: 'me', email: 'me@example.com' }
  await call('victim-id', 'victim@example.com')                          // a session: the arguments are not read
  expect(sent.map((s) => s.to)).toEqual(['me@example.com'])
  expect(profileReads).toEqual(['me'])
})
