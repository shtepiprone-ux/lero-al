/**
 * Task 927: the Google Identity Services loader and the per-attempt nonce. The real `googleIdentity` module runs in jsdom; jsdom does not load a script from the
 * network, so the test fires the script element's own `load` and `error` events and installs a stand-in for `google.accounts.id` before `load`.
 */
import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import {
  createNoncePair, createState, GOOGLE_AUTHORIZATION_ENDPOINT, GOOGLE_CALLBACK_PATH, GOOGLE_IDENTITY_SCRIPT_URL, googleAuthorizationUrl, loadGoogleIdentity, type GoogleAccountsId,
} from '../googleIdentity'

const scripts = () => Array.from(document.head.querySelectorAll<HTMLScriptElement>('#google-identity-services'))
const api = (): GoogleAccountsId => ({ initialize: vi.fn(), prompt: vi.fn(), cancel: vi.fn() })
const urlFor = (locale: string) => `${GOOGLE_IDENTITY_SCRIPT_URL}?hl=${locale}`

afterEach(async () => {
  vi.useRealTimers()
  // settle a load that is still pending, so the next test starts clean
  const stale = scripts()[0]
  if (stale) {
    const locale = new URL(stale.src).searchParams.get('hl') ?? 'en'
    const settled = loadGoogleIdentity(locale).catch(() => undefined)
    stale.dispatchEvent(new Event('error'))
    await settled
  }
  stale?.remove()
  delete window.google
})

it('[SEC-927-FE-UNIT-NONCE] a nonce pair is 32 random bytes in base64 with its lowercase hex SHA-256, and two pairs differ', async () => {
  const first = await createNoncePair()
  const second = await createNoncePair()
  for (const pair of [first, second]) {
    expect(Uint8Array.from(atob(pair.nonce), char => char.charCodeAt(0)), 'the nonce decodes to 32 bytes').toHaveLength(32)
    expect(pair.nonce, 'standard base64 of 32 bytes').toMatch(/^[A-Za-z0-9+/]{43}=$/)
    expect(pair.hashedNonce).toMatch(/^[0-9a-f]{64}$/)
    expect(pair.hashedNonce, 'the hash is computed from the nonce text (UTF-8), not from its bytes').toBe(createHash('sha256').update(pair.nonce, 'utf8').digest('hex'))
    expect(pair.hashedNonce).not.toBe(pair.nonce)
  }
  expect(second.nonce).not.toBe(first.nonce)
  expect(second.hashedNonce).not.toBe(first.hashedNonce)
})

it('a state is 32 random bytes in base64url without padding, and two states differ (Task 927 D25)', () => {
  const first = createState()
  const second = createState()
  for (const state of [first, second]) {
    expect(state, 'base64url of 32 bytes, no padding').toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(state, 'base64url'), 'it decodes to 32 bytes').toHaveLength(32)
  }
  expect(second).not.toBe(first)
})

it('the address of Google\'s account chooser carries exactly the query the ID-token flow needs, and login_hint only when given (Task 927 D25)', () => {
  expect(GOOGLE_AUTHORIZATION_ENDPOINT).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  expect(GOOGLE_CALLBACK_PATH).toBe('/auth/google/callback')
  const base = { clientId: 'zz-client', redirectUri: 'https://lero.al/auth/google/callback', hashedNonce: 'a'.repeat(64), state: 'zz-state', locale: 'it' }

  const plain = new URL(googleAuthorizationUrl(base))
  expect(`${plain.origin}${plain.pathname}`).toBe(GOOGLE_AUTHORIZATION_ENDPOINT)
  expect([...plain.searchParams.entries()]).toEqual([
    ['client_id', 'zz-client'], ['redirect_uri', 'https://lero.al/auth/google/callback'], ['response_type', 'id_token'], ['scope', 'openid email profile'],
    ['nonce', 'a'.repeat(64)], ['state', 'zz-state'], ['prompt', 'select_account'], ['hl', 'it'],
  ])
  expect([...new URL(googleAuthorizationUrl({ ...base, loginHint: 'person@example.com' })).searchParams.keys()].at(-1)).toBe('login_hint')
  expect(new URL(googleAuthorizationUrl({ ...base, loginHint: 'person@example.com' })).searchParams.get('login_hint')).toBe('person@example.com')
  expect(new URL(googleAuthorizationUrl({ ...base, loginHint: '' })).searchParams.has('login_hint'), 'an empty hint is no hint').toBe(false)
})

it('[SEC-927-FE-UNIT-LOADER] concurrent loads share one script element, an error or a timeout rejects, and a later call retries with a new element', async () => {
  // two callers before load: one element, one promise, both resolve with the API after load
  const first = loadGoogleIdentity('en')
  const second = loadGoogleIdentity('en')
  expect(second).toBe(first)
  expect(scripts()).toHaveLength(1)
  expect(scripts()[0].src, 'the library URL carries the page\'s locale as hl').toBe(urlFor('en'))
  expect(scripts()[0].async).toBe(true)
  const gis = api()
  window.google = { accounts: { id: gis } }
  scripts()[0].dispatchEvent(new Event('load'))
  await expect(first).resolves.toBe(gis)
  await expect(second).resolves.toBe(gis)

  // the same locale again: the loaded library is reused, no new element
  const loadedElement = scripts()[0]
  await expect(loadGoogleIdentity('en')).resolves.toBe(gis)
  expect(scripts()).toHaveLength(1)
  expect(scripts()[0]).toBe(loadedElement)

  // another locale replaces the loaded element and window.google (a language switch without a full reload)
  const albanian = loadGoogleIdentity('sq')
  expect(scripts(), 'one element at a time').toHaveLength(1)
  expect(scripts()[0]).not.toBe(loadedElement)
  expect(scripts()[0].src).toBe(urlFor('sq'))
  expect(window.google, 'the library of the old locale is removed').toBeUndefined()
  // and while that load is still pending, a call for yet another locale rejects it instead of leaving it unsettled
  const albanianResult = albanian.then(() => 'resolved', () => 'rejected')
  const ukrainian = loadGoogleIdentity('uk')
  await expect(albanianResult).resolves.toBe('rejected')
  expect(scripts()).toHaveLength(1)
  expect(scripts()[0].src).toBe(urlFor('uk'))
  const ukApi = api()
  window.google = { accounts: { id: ukApi } }
  scripts()[0].dispatchEvent(new Event('load'))
  await expect(ukrainian).resolves.toBe(ukApi)

  // every locale of the site gets its own hl
  for (const locale of ['sq', 'en', 'uk', 'it']) {
    const switched = loadGoogleIdentity(locale).catch(() => undefined)
    expect(scripts()).toHaveLength(1)
    expect(scripts()[0].src, locale).toBe(urlFor(locale))
    scripts()[0].dispatchEvent(new Event('error'))
    await switched
    expect(scripts(), 'the failed element is removed').toHaveLength(0)
  }
  delete window.google

  // an error rejects every caller and removes the failed element
  const failedA = loadGoogleIdentity('en')
  const failedB = loadGoogleIdentity('en')
  expect(scripts()).toHaveLength(1)
  const failedElement = scripts()[0]
  failedElement.dispatchEvent(new Event('error'))
  await expect(failedA).rejects.toThrow()
  await expect(failedB).rejects.toThrow()
  expect(scripts(), 'the failed element is removed').toHaveLength(0)

  // the next call retries with a NEW element
  const retry = loadGoogleIdentity('en')
  expect(scripts()).toHaveLength(1)
  expect(scripts()[0]).not.toBe(failedElement)

  // `load` that comes without the API is a failure too, and does not leave a promise that never settles
  scripts()[0].dispatchEvent(new Event('load'))
  await expect(retry).rejects.toThrow()
  expect(scripts()).toHaveLength(0)

  // a script that never answers is rejected at the timeout (10 000 ms by default), then the next call retries
  vi.useFakeTimers()
  const slow = loadGoogleIdentity('en')
  const slowResult = slow.then(() => 'resolved', () => 'rejected')
  await vi.advanceTimersByTimeAsync(9_999)
  expect(scripts()).toHaveLength(1)
  await vi.advanceTimersByTimeAsync(1)
  await expect(slowResult).resolves.toBe('rejected')
  expect(scripts()).toHaveLength(0)
  vi.useRealTimers()
  const again = loadGoogleIdentity('en', 50).catch(() => undefined)
  expect(scripts()).toHaveLength(1)
  scripts()[0].dispatchEvent(new Event('error'))
  await again
})
