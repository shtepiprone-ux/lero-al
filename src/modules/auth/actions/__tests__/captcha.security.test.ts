// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S41): sign-up and password reset behind the captcha.
 *  - the Turnstile token has ONE verifier, Supabase Auth (Task 923 R67 (c)): the actions only check that a token is present and hand it to Supabase. A token is single-use,
 *    so verifying it here as well made Supabase refuse every request as a replay once its own CAPTCHA protection was on;
 *  - the e-mailed link can only point to one of OUR origins (the caller chooses the address, an attacker could point the reset link at their own site);
 *  - the account's user_metadata is built from the six fields the form sends, never from whatever the browser adds (role, is_verified, status …).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

let captcha: { success: boolean; errorCodes?: string[] } = { success: true }
const verified: string[] = []
const signUps: Record<string, unknown>[] = []
const resets: { email: string; options: Record<string, unknown> }[] = []
let authError: { message: string; code?: string } | null = null
vi.mock('@/lib/captcha/verifyTurnstile', () => ({ verifyTurnstile: async (t: string) => { verified.push(t); return captcha } }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signUp: async (p: Record<string, unknown>) => { signUps.push(p); return { error: authError } },
      resetPasswordForEmail: async (email: string, options: Record<string, unknown>) => { resets.push({ email, options }); return { error: authError } },
    },
  }),
}))

import { requestPasswordResetWithCaptcha, signUpWithCaptcha } from '../captcha'
import { cleanSignupMetadata } from '../../lib/signupMetadata'
import { trustedRedirectUrl } from '@/lib/auth/trustedOrigin'

const ENV = { ...process.env }
beforeEach(() => {
  process.env = { ...ENV, NEXT_PUBLIC_SITE_URL: 'https://lero.al' }
  captcha = { success: true }
  authError = null
  verified.length = 0
  signUps.length = 0
  resets.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const signUp = { email: 'ana@example.com', password: 'Str0ng!Passw0rd', captchaToken: 'tok', emailRedirectTo: 'https://lero.al/auth/callback?next=/sq/auth/verified' }

describe('signUpWithCaptcha', () => {
  it('signs up with the token and the clean metadata, and never verifies the token itself', async () => {
    const data = { name: 'Ana', phone: '+355691234567', user_type: 'agent', location_id: 4, company_id: 'c-1', preferred_locale: 'sq' }
    expect(await signUpWithCaptcha({ ...signUp, data })).toEqual({ ok: true })
    expect(verified).toEqual([])                                   // the project's own verifier is not called: Supabase verifies
    expect(signUps[0]).toEqual({ email: 'ana@example.com', password: 'Str0ng!Passw0rd', options: { emailRedirectTo: 'https://lero.al/auth/callback?next=/sq/auth/verified', data, captchaToken: 'tok' } })
  })

  it.each([[''], [undefined], [null], [5], [{ a: 1 }], [['t']]])('a captcha token %j never reaches Supabase', async (captchaToken) => {
    expect(await signUpWithCaptcha({ ...signUp, captchaToken: captchaToken as never })).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(signUps).toEqual([])
    expect(verified).toEqual([])
  })

  it('a captcha that Supabase refuses is reported as captcha_failed, so the form can ask for a new token', async () => {
    authError = { message: 'captcha protection: request disallowed (timeout-or-duplicate)', code: 'captcha_failed' }
    expect(await signUpWithCaptcha(signUp)).toEqual({ ok: false, reason: 'captcha_failed', supabaseErrorMessage: authError.message })
    authError = { message: 'captcha verification process failed' }
    expect(((await signUpWithCaptcha(signUp)) as { reason?: string }).reason).toBe('captcha_failed')
    expect(verified).toEqual([])
  })

  it('Supabase\'s refusal is returned with its message', async () => {
    authError = { message: 'User already registered' }
    expect(await signUpWithCaptcha(signUp)).toEqual({ ok: false, reason: 'signup_failed', supabaseErrorMessage: 'User already registered' })
  })

  it.each([
    ['another site', 'https://evil.example/auth/callback?next=/x', 'https://lero.al/auth/callback?next=/x'],
    ['a look-alike host', 'https://lero.al.evil.example/auth/callback', 'https://lero.al/auth/callback'],
    ['a user-info trick', 'https://lero.al@evil.example/auth/callback', 'https://lero.al/auth/callback'],
    ['a protocol-relative address', '//evil.example/auth/callback', 'https://lero.al/'],
    ['a javascript address', 'javascript:alert(1)', 'https://lero.al/'],
    ['a data address', 'data:text/html,<script>1</script>', 'https://lero.al/'],
    ['nothing usable', '', 'https://lero.al/'],
  ])('a redirect to %s is moved to our own origin', async (_l, emailRedirectTo, expected) => {
    await signUpWithCaptcha({ ...signUp, emailRedirectTo })
    expect((signUps[0].options as { emailRedirectTo: string }).emailRedirectTo).toBe(expected)
  })

  it('metadata the browser adds is dropped', async () => {
    await signUpWithCaptcha({ ...signUp, data: { name: 'Ana', role: 'admin', is_verified: true, status: 'active', id: 'victim', user_type: 'private', admin: true } })
    expect((signUps[0].options as { data: unknown }).data).toEqual({ name: 'Ana', user_type: 'private' })
  })
})

describe('cleanSignupMetadata', () => {
  it('keeps exactly the six fields', () => {
    const all = { name: 'N', phone: '+355691234567', user_type: 'agent', location_id: 1, company_id: 'c', preferred_locale: 'it' }
    expect(cleanSignupMetadata(all)).toEqual(all)
  })

  it.each([[undefined], [null], ['text'], [5], [true]])('%j gives undefined', (v) => expect(cleanSignupMetadata(v)).toBeUndefined())

  it.each([
    ['an object value', { name: { a: 1 } }], ['an array value', { name: ['a'] }], ['a boolean', { name: true }], ['null', { name: null }], ['undefined', { location_id: undefined }],
    ['a 201-character string', { name: 'x'.repeat(201) }], ['NaN', { location_id: NaN }], ['Infinity', { location_id: Infinity }],
  ])('drops %s', (_l, data) => expect(cleanSignupMetadata(data)).toEqual({}))

  it.each([['067 123 4567'], ['355691234567'], ['+0691234567'], ['+3556912'], ['+3556912345678901'], ['+355 69 123 4567'], ['javascript:alert(1)'], ['+355691234567; DROP'], ['']])('a phone %j that is not E.164 is dropped', (phone) => {
    expect(cleanSignupMetadata({ name: 'Ana', phone })).toEqual({ name: 'Ana' })
  })

  it('a phone in E.164 is kept', () => {
    expect(cleanSignupMetadata({ phone: '+12025550123' })).toEqual({ phone: '+12025550123' })
  })

  it('keeps a 200-character string', () => {
    expect(cleanSignupMetadata({ name: 'x'.repeat(200) })).toEqual({ name: 'x'.repeat(200) })
  })

  it.each([['admin'], ['moderator'], [''], ['Agent'], [1]])('an account type %j is dropped, only private / agent stay', (user_type) => {
    expect(cleanSignupMetadata({ user_type })).toEqual({})
  })

  it('an inherited or special key is not read', () => {
    const data = Object.create({ name: 'inherited' }) as Record<string, unknown>
    expect(cleanSignupMetadata(data)).toEqual({})
    expect(cleanSignupMetadata(JSON.parse('{"__proto__":{"role":"admin"},"constructor":"x"}'))).toEqual({})
  })
})

describe('requestPasswordResetWithCaptcha', () => {
  const reset = { email: 'ana@example.com', captchaToken: 'tok', redirectTo: 'https://lero.al/auth/callback?next=/sq/auth/reset-password' }

  it('asks Supabase for the reset with the token and never verifies the token itself', async () => {
    expect(await requestPasswordResetWithCaptcha(reset)).toEqual({ ok: true })
    expect(resets).toEqual([{ email: 'ana@example.com', options: { redirectTo: reset.redirectTo, captchaToken: 'tok' } }])
    expect(verified).toEqual([])
  })

  it('the reset link cannot point to another site', async () => {
    await requestPasswordResetWithCaptcha({ ...reset, redirectTo: 'https://evil.example/auth/callback?next=/sq/auth/reset-password' })
    expect(resets[0].options.redirectTo).toBe('https://lero.al/auth/callback?next=/sq/auth/reset-password')
  })

  it.each([[''], [undefined], [7]])('a captcha token %j sends nothing', async (captchaToken) => {
    expect(await requestPasswordResetWithCaptcha({ ...reset, captchaToken: captchaToken as never })).toEqual({ ok: false, reason: 'captcha_failed' })
    expect(resets).toEqual([])
  })

  it('a captcha that Supabase refuses is reported as captcha_failed, an ordinary failure as reset_failed', async () => {
    authError = { message: 'captcha protection: request disallowed', code: 'captcha_failed' }
    expect(((await requestPasswordResetWithCaptcha(reset)) as { reason?: string }).reason).toBe('captcha_failed')
    authError = { message: 'Email rate limit exceeded' }
    expect(((await requestPasswordResetWithCaptcha(reset)) as { reason?: string }).reason).toBe('reset_failed')
    expect(verified).toEqual([])
  })

  it('Supabase\'s refusal is returned', async () => {
    authError = { message: 'rate limit' }
    expect(await requestPasswordResetWithCaptcha(reset)).toEqual({ ok: false, reason: 'reset_failed', supabaseErrorMessage: 'rate limit' })
  })
})

describe('trustedRedirectUrl', () => {
  const env = { NEXT_PUBLIC_SITE_URL: 'https://staging.lero.al', NODE_ENV: 'production' }

  it('keeps an address on the configured origin as it is', () => {
    expect(trustedRedirectUrl('https://staging.lero.al/auth/callback?next=/x', env)).toBe('https://staging.lero.al/auth/callback?next=/x')
  })

  it('keeps the production domains', () => {
    expect(trustedRedirectUrl('https://www.lero.al/a?b=1', env)).toBe('https://www.lero.al/a?b=1')
  })

  it('drops the fragment', () => {
    expect(trustedRedirectUrl('https://lero.al/a#token=1', env)).toBe('https://lero.al/a')
  })

  it('moves a foreign origin to the configured one and keeps the path', () => {
    expect(trustedRedirectUrl('https://evil.example/x/y?z=1', env)).toBe('https://staging.lero.al/x/y?z=1')
  })

  it.each([[null], [undefined], [''], ['not a url'], ['javascript:alert(1)'], ['ftp://lero.al/x'], ['mailto:a@b.cc']])('%j becomes the site root', (v) => {
    expect(trustedRedirectUrl(v as never, env)).toBe('https://staging.lero.al/')
  })

  it('localhost is accepted outside production only', () => {
    expect(trustedRedirectUrl('http://localhost:3000/auth/callback', { ...env, NODE_ENV: 'development' })).toBe('http://localhost:3000/auth/callback')
    expect(trustedRedirectUrl('http://localhost:3000/auth/callback', env)).toBe('https://staging.lero.al/auth/callback')
  })

  it('without a configured site it falls back to the production domain', () => {
    expect(trustedRedirectUrl('https://evil.example/a', { NODE_ENV: 'production' })).toBe('https://lero.al/a')
  })
})

// Task 923 R38 (cases SEC-S36-SRV-DENY, SEC-S41-SRV-DENY)
it('[SEC-S36-SRV-DENY] A Turnstile answer passes only when success is the literal true', async () => {
  const actual = await vi.importActual<typeof import('@/lib/captcha/verifyTurnstile')>('@/lib/captcha/verifyTurnstile')
  process.env.TURNSTILE_SECRET_KEY = 'test-secret'
  const answer = (success: unknown) => vi.stubGlobal('fetch', async () => ({ json: async () => ({ success }) }))
  try {
    for (const truthy of ['true', 1, 'yes', {}, []]) {
      answer(truthy)
      expect((await actual.verifyTurnstile('tok')).success, JSON.stringify(truthy)).toBe(false)
    }
    answer(true)
    expect((await actual.verifyTurnstile('tok')).success).toBe(true)                    // the control
  } finally {
    vi.unstubAllGlobals()
  }
})

it('[SEC-S41-SRV-DENY] Sign-up and reset links point only to this site and pass only six plain metadata keys', async () => {
  await signUpWithCaptcha({ ...signUp, emailRedirectTo: 'https://evil.example/auth/callback?next=/x', data: { name: 'Ana', role: 'admin', is_verified: true, user_type: 'agent' } })
  const options = signUps[0].options as { emailRedirectTo: string; data: unknown }
  expect(options.emailRedirectTo).toBe('https://lero.al/auth/callback?next=/x')
  expect(options.data).toEqual({ name: 'Ana', user_type: 'agent' })
  await requestPasswordResetWithCaptcha({ email: 'ana@example.com', captchaToken: 'tok', redirectTo: 'https://evil.example/auth/callback' })
  expect(resets[0].options.redirectTo).toBe('https://lero.al/auth/callback')
  expect(Object.keys(cleanSignupMetadata({ name: 'N', phone: '+355691234567', user_type: 'agent', location_id: 1, company_id: 'c', preferred_locale: 'it', extra: 'x' }) ?? {}).sort())
    .toEqual(['company_id', 'location_id', 'name', 'phone', 'preferred_locale', 'user_type'])
})
