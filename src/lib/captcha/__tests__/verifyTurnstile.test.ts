// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the captcha check is what stands between a bot and the sign-up / contact forms.
 * It must fail CLOSED: no secret in production, an unreadable answer, a network error or a "success" that is not literally true all mean "not verified".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from '../verifyTurnstile'
import { SITE_URL } from '@/lib/siteUrl'

const ENV = { ...process.env }
const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  process.env.TURNSTILE_SECRET_KEY = 'secret-123'
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals() })

const answer = (body: unknown) => fetchMock.mockResolvedValue({ json: async () => body })

describe('with a secret configured', () => {
  it('asks Cloudflare once, with POST, the secret and the token, and never caches', async () => {
    answer({ success: true })
    await verifyTurnstile('tok-1', '203.0.113.9')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(init.method).toBe('POST')
    expect(init.cache).toBe('no-store')
    const body = init.body as URLSearchParams
    expect(body.get('secret')).toBe('secret-123')
    expect(body.get('response')).toBe('tok-1')
    expect(body.get('remoteip')).toBe('203.0.113.9')
  })

  it('sends no remote address when there is none', async () => {
    answer({ success: true })
    await verifyTurnstile('tok-1')
    expect((fetchMock.mock.calls[0][1].body as URLSearchParams).has('remoteip')).toBe(false)
  })

  it('a token is sent as a form value, so a hostile token cannot add parameters', async () => {
    answer({ success: true })
    await verifyTurnstile('x&secret=other&response=y')
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams
    expect(body.getAll('secret')).toEqual(['secret-123'])
    expect(body.get('response')).toBe('x&secret=other&response=y')
  })

  it('reports success only when Cloudflare says so', async () => {
    answer({ success: true })
    expect(await verifyTurnstile('t')).toEqual({ success: true, errorCodes: undefined })
  })

  it('reports Cloudflare\'s refusal with its error codes', async () => {
    answer({ success: false, 'error-codes': ['invalid-input-response'] })
    expect(await verifyTurnstile('t')).toEqual({ success: false, errorCodes: ['invalid-input-response'] })
  })

  it.each([[{}], [{ success: 'true' }], [{ success: 1 }], [{ success: null }], [null], [[]]])('an answer %j is NOT a success', async (body) => {
    answer(body)
    expect((await verifyTurnstile('t')).success).toBe(false)
  })

  it('a network error or an unreadable answer is "internal-error", never success', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    expect(await verifyTurnstile('t')).toEqual({ success: false, errorCodes: ['internal-error'] })
    fetchMock.mockResolvedValue({ json: async () => { throw new SyntaxError('html') } })
    expect(await verifyTurnstile('t')).toEqual({ success: false, errorCodes: ['internal-error'] })
  })

  it('the development shortcut token does NOT work when a secret is configured', async () => {
    answer({ success: false })
    expect((await verifyTurnstile('dev-noop-token')).success).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('without a secret', () => {
  beforeEach(() => { delete process.env.TURNSTILE_SECRET_KEY })

  it('production refuses everyone, including the development token, and asks nobody', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(await verifyTurnstile('dev-noop-token')).toEqual({ success: false, errorCodes: ['missing-secret'] })
    expect(await verifyTurnstile('anything')).toEqual({ success: false, errorCodes: ['missing-secret'] })
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('development accepts only the exact development token', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(await verifyTurnstile('dev-noop-token')).toEqual({ success: true })
    expect((await verifyTurnstile('Dev-Noop-Token')).success).toBe(false)
    expect((await verifyTurnstile('')).success).toBe(false)
    vi.unstubAllEnvs()
  })

  it('an empty secret counts as missing', async () => {
    process.env.TURNSTILE_SECRET_KEY = ''
    vi.stubEnv('NODE_ENV', 'production')
    expect((await verifyTurnstile('t')).success).toBe(false)
    vi.unstubAllEnvs()
  })

  it('the development token still works with an expected action: there is no answer to compare', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(await verifyTurnstile('dev-noop-token', undefined, { action: 'contact_reveal' })).toEqual({ success: true })
    vi.unstubAllEnvs()
  })
})

// Task 923 R110 (a), R86: a token is checked in shape before any request, and a gateway that names the action it expects also gets the action and the hostname compared.
const SITE_HOST = new URL(SITE_URL).hostname
const EXPECT = { action: 'contact_reveal' }
const passing = (extra: Record<string, unknown> = {}) => ({ success: true, action: 'contact_reveal', hostname: SITE_HOST, ...extra })

describe('the shape of the token (R110 (a))', () => {
  it.each([[undefined], [null], [5], [true], [{}], [['tok']], [''], ['x'.repeat(2049)]])('%j is invalid-input and Cloudflare is not asked', async (token) => {
    expect(await verifyTurnstile(token, '203.0.113.9', EXPECT)).toEqual({ success: false, errorCodes: ['invalid-input'] })
    expect(await verifyTurnstile(token)).toEqual({ success: false, errorCodes: ['invalid-input'] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a token of exactly 2048 characters is sent; one more is not', async () => {
    answer({ success: true })
    expect((await verifyTurnstile('x'.repeat(2048))).success).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((await verifyTurnstile('x'.repeat(2049))).success).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('an invalid token is refused before the secret is even read: no secret needed, no development shortcut', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    vi.stubEnv('NODE_ENV', 'development')
    expect(await verifyTurnstile(undefined)).toEqual({ success: false, errorCodes: ['invalid-input'] })
    vi.unstubAllEnvs()
  })
})

describe('without an expected action the result is exactly today\'s (sign-up and password reset)', () => {
  it('does not compare action or hostname', async () => {
    answer({ success: true, action: 'something_else', hostname: 'elsewhere.example' })
    expect(await verifyTurnstile('t')).toEqual({ success: true, errorCodes: undefined })
    answer({ success: true, metadata: { result_with_testing_key: true } })
    vi.stubEnv('NODE_ENV', 'production')
    expect((await verifyTurnstile('t')).success).toBe(true)
    vi.unstubAllEnvs()
  })
})

describe('with an expected action (R110 (a))', () => {
  it('accepts an answer for that action and this site', async () => {
    answer(passing())
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: true, errorCodes: undefined })
  })

  it('accepts this site\'s hostname in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    answer(passing())
    expect((await verifyTurnstile('t', undefined, EXPECT)).success).toBe(true)
    vi.unstubAllEnvs()
  })

  it.each([['another action', { action: 'contact_inquiry' }], ['no action', { action: undefined }], ['an empty action', { action: '' }]])('refuses %s with action-mismatch', async (_label, patch) => {
    answer(passing(patch))
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['action-mismatch'] })
  })

  it.each([['another site', 'elsewhere.example'], ['a subdomain of this site', `evil.${SITE_HOST}`], ['this site as a prefix', `${SITE_HOST}.evil.example`], ['no hostname', undefined]])('refuses %s with hostname-mismatch', async (_label, hostname) => {
    answer(passing({ hostname }))
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['hostname-mismatch'] })
  })

  it.each(['localhost', '127.0.0.1'])('accepts %s outside production only', async (hostname) => {
    answer(passing({ hostname }))
    vi.stubEnv('NODE_ENV', 'development')
    expect((await verifyTurnstile('t', undefined, EXPECT)).success).toBe(true)
    vi.stubEnv('NODE_ENV', 'production')
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['hostname-mismatch'] })
    vi.unstubAllEnvs()
  })

  it('compares the action before the hostname', async () => {
    answer(passing({ action: 'contact_inquiry', hostname: 'elsewhere.example' }))
    expect((await verifyTurnstile('t', undefined, EXPECT)).errorCodes).toEqual(['action-mismatch'])
  })

  it('keeps Cloudflare\'s refusal and its codes, with nothing compared (a replayed token)', async () => {
    answer({ success: false, 'error-codes': ['timeout-or-duplicate'], action: 'contact_reveal', hostname: SITE_HOST })
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['timeout-or-duplicate'] })
  })

  it('a success that is not the literal true is still refused', async () => {
    answer(passing({ success: 'true' }))
    expect((await verifyTurnstile('t', undefined, EXPECT)).success).toBe(false)
  })

  it('a network error is internal-error, never success', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['internal-error'] })
  })
})

describe('Cloudflare\'s testing-key answer (R110 (a) (1))', () => {
  // the published always-pass secret answers with the hostname example.com, no action and this marker
  const testingAnswer = { success: true, hostname: 'example.com', metadata: { result_with_testing_key: true } }

  it.each(['test', 'development'])('is accepted when NODE_ENV is %s, without comparing action or hostname', async (env) => {
    vi.stubEnv('NODE_ENV', env)
    answer(testingAnswer)
    expect((await verifyTurnstile('t', undefined, EXPECT)).success).toBe(true)
    vi.unstubAllEnvs()
  })

  it('is refused in production with testing-key-in-production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    answer(testingAnswer)
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['testing-key-in-production'] })
    vi.unstubAllEnvs()
  })

  it('only the literal true is the marker: the string "true" falls back to the comparison', async () => {
    answer({ ...testingAnswer, metadata: { result_with_testing_key: 'true' } })
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['action-mismatch'] })
  })

  it('a failing testing answer stays failed', async () => {
    answer({ success: false, 'error-codes': ['invalid-input-response'], metadata: { result_with_testing_key: true } })
    expect(await verifyTurnstile('t', undefined, EXPECT)).toEqual({ success: false, errorCodes: ['invalid-input-response'] })
  })
})
