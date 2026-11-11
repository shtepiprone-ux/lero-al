/**
 * Task 927: Google sign-in through Google's window and `signInWithIdToken` (Amendment 10, D25: the button is our own, Google draws none). The real `AuthSheet` login view,
 * `GoogleSignInButton`, `GoogleSignInSlot` and `googlePopup` render; the doubles are the browser auth wrapper, the router, and `window.open`, which returns a window with `closed` and
 * `close` (jsdom opens none). The test plays Google's callback page by dispatching the `message` event that page posts to its opener, carrying the state read from the address the
 * button gave `window.open`.
 * What it protects: a session comes only from the ID token of THIS attempt with THIS attempt's raw nonce (Google gets only its SHA-256 hex); the sheet then lands only on a path of this
 * site; a banned account gets the wrong-credentials text; nothing signs a visitor in without a click and no Google script is loaded; a blocked window or an unanswered one is a notice,
 * never a stuck loader, and the e-mail sign-in keeps working; no credential or nonce reaches the console, storage or the address.
 */
import { createHash } from 'node:crypto'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import en from '../../../../../messages/en.json'
import it_ from '../../../../../messages/it.json'
import sq from '../../../../../messages/sq.json'
import uk from '../../../../../messages/uk.json'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const browser = vi.hoisted(() => ({ signIn: vi.fn(), signInWithGoogleIdToken: vi.fn() }))
vi.mock('@/lib/auth/browser', () => browser)
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryRequest: vi.fn() }))
vi.mock('@/modules/auth/actions/captcha', () => ({ signUpWithCaptcha: vi.fn(), requestPasswordResetWithCaptcha: vi.fn() }))
vi.mock('@/modules/companies/actions', () => ({ createCompanyAction: vi.fn() }))
vi.mock('@/modules/companies/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: [], refetch: vi.fn() }) }))
vi.mock('@/modules/locations/hooks/useLocations', () => ({ useLocations: () => ({ locations: [] }) }))

import { AuthSheet } from '../AuthSheet'

const LOCALES = { sq, en, uk, it: it_ } as const
const NEXT_KEY = 'auth_redirect_next'
const CLIENT_ID = 'zz-synthetic-client.apps.googleusercontent.com'
const TYPE = 'lero:google-sign-in'
const onOpenChange = vi.fn()
const popup = { closed: false, close: vi.fn() }
let windowOpen: ReturnType<typeof installWindow>

interface Attempt { state: string; hashedNonce: string; url: URL }

function open(locale: keyof typeof LOCALES = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale] as never}>
      <MantineProvider theme={theme} env="test"><AuthSheet open onOpenChange={onOpenChange} initialView="login" /></MantineProvider>
    </NextIntlClientProvider>,
  )
}
const gisScript = () => document.head.querySelector<HTMLScriptElement>('#google-identity-services')
const alertText = () => screen.queryByRole('alert')?.textContent ?? null
const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const signInButton = () => document.querySelector<HTMLButtonElement>('[data-google-sign-in]')

/** `window.open` double. With `fakeTimers` it switches the timers to fake ones as the window opens: the attempt creates its timers right after, so they are the fake ones. */
function installWindow(options: { blocked?: boolean; fakeTimers?: boolean } = {}) {
  return vi.spyOn(window, 'open').mockImplementation(() => {
    if (options.fakeTimers) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    return options.blocked ? null : (popup as unknown as Window)
  })
}
/** Waits, on real macrotasks, until `check` holds (the attempt hashes its nonce before it opens the window). */
async function until(check: () => boolean) {
  for (let turn = 0; turn < 500 && !check(); turn++) await new Promise<void>(resolve => setImmediate(resolve))
  expect(check()).toBe(true)
}
/** Lets the button finish preparing its attempt: its nonce is hashed on a worker thread as soon as it mounts, and a click opens Google's window only with a prepared attempt (Amendment 11). */
const flushPreparation = () => act(async () => { for (let turn = 0; turn < 20; turn++) await new Promise<void>(resolve => setImmediate(resolve)) })
/** Clicks the Google button and waits until the attempt has called `window.open`; returns what that attempt sent to Google. */
async function startAttempt(): Promise<Attempt> {
  const before = windowOpen.mock.calls.length
  await flushPreparation()
  await act(async () => {
    fireEvent.click(signInButton()!)
    await until(() => windowOpen.mock.calls.length > before)
  })
  const url = new URL(windowOpen.mock.calls.at(-1)![0] as string)
  return { state: url.searchParams.get('state')!, hashedNonce: url.searchParams.get('nonce')!, url }
}
/** What Google's callback page does when the visitor picked an account: posts the ID token to its opener. */
async function answer(attempt: Pick<Attempt, 'state'>, credential: string | undefined, origin: string = window.location.origin) {
  await act(async () => { window.dispatchEvent(new MessageEvent('message', { origin, data: { type: TYPE, state: attempt.state, credential } })) })
}
const settleBriefly = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })

beforeEach(() => {
  setViewport(1024)
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', CLIENT_ID)
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')   // no site key: the real widget hands over `dev-noop-token` (Task 923 R155 (c))
  browser.signIn.mockReset(); browser.signInWithGoogleIdToken.mockReset()
  router.push.mockReset(); router.refresh.mockReset(); onOpenChange.mockReset()
  popup.closed = false; popup.close.mockReset()
  sessionStorage.clear(); localStorage.clear()
  browser.signIn.mockResolvedValue({ error: null })
  browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: null })
  windowOpen = installWindow()
})
// Task 971 (pending-timer guard): the Google window. An attempt that a test leaves waiting for Google keeps its 5-minute `deadline` timer (googlePopup.ts:104) until
// the window closes, far beyond the guard's wait. The person closing Google's window ends it (the attempt polls `popup.closed` every 500 ms and clears its timers), and
// the guard's wait after the test lets that poll run. Declared before the hook below that restores mocks, so it runs after it and `hasFocus` stays true for the poll.
afterEach(() => {
  popup.closed = true
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)   // jsdom has no focused element; a person who closed Google's window is back on this page
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

it('[SEC-927-FE-ALLOW] a visitor who picks a Google account in Google\'s window is signed in with that credential and the raw nonce whose SHA-256 Google got, the sheet closes and the stored same-site destination opens', async () => {
  sessionStorage.setItem(NEXT_KEY, '/en/favorites?tab=2')
  open()
  const attempt = await startAttempt()
  expect(windowOpen).toHaveBeenCalledTimes(1)
  expect(windowOpen.mock.calls[0][1]).toBe('lero-google-sign-in')
  expect(browser.signInWithGoogleIdToken, 'nothing is sent before Google answers').not.toHaveBeenCalled()
  await answer(attempt, 'zz.synthetic.idtoken')

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  expect(browser.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  const [credential, nonce] = browser.signInWithGoogleIdToken.mock.calls[0] as [string, string]
  expect(credential).toBe('zz.synthetic.idtoken')
  expect(attempt.hashedNonce, 'Google got the SHA-256 hex of the raw nonce').toBe(sha256Hex(nonce))
  expect(attempt.hashedNonce, 'Google did not get the raw nonce').not.toBe(nonce)
  expect(attempt.url.href, 'the raw nonce is nowhere in Google\'s address').not.toContain(encodeURIComponent(nonce))
  expect(nonce, 'Supabase did not get the hash').not.toBe(attempt.hashedNonce)
  expect(router.push).toHaveBeenCalledTimes(1)
  expect(router.push).toHaveBeenCalledWith('/en/favorites?tab=2')
  expect(router.refresh).not.toHaveBeenCalled()
  expect(sessionStorage.getItem(NEXT_KEY)).toBeNull()
  expect(windowOpen, 'no second window').toHaveBeenCalledTimes(1)
})

it('[SEC-927-FE-DENY-REDIRECT] after a Google sign-in a stored destination that is not a path of this site is not opened and the page refreshes instead', async () => {
  for (const stored of ['https://evil.example/steal', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
    cleanup()
    browser.signInWithGoogleIdToken.mockClear(); router.push.mockClear(); router.refresh.mockClear(); onOpenChange.mockClear()
    sessionStorage.setItem(NEXT_KEY, stored)
    open()
    const attempt = await startAttempt()
    await answer(attempt, 'zz.synthetic.idtoken')
    await waitFor(() => expect(router.refresh, stored).toHaveBeenCalledTimes(1))
    expect(browser.signInWithGoogleIdToken, stored).toHaveBeenCalledTimes(1)
    expect(router.push, stored).not.toHaveBeenCalled()
    expect(onOpenChange, stored).toHaveBeenCalledWith(false)
  }
})

it('[SEC-927-FE-DENY-BANNED] a banned Google account gets the wrong-credentials text in every locale, stays signed out and the sheet stays open', async () => {
  for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
    cleanup()
    onOpenChange.mockClear(); router.push.mockClear(); router.refresh.mockClear()
    browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: { message: 'User is banned' } })
    sessionStorage.setItem(NEXT_KEY, '/en/favorites')
    open(locale)
    const attempt = await startAttempt()
    await answer(attempt, 'zz.synthetic.idtoken')
    const wrong = LOCALES[locale].auth.error_invalid_credentials
    await waitFor(() => expect(alertText(), locale).toBe(wrong))
    expect(alertText(), locale).not.toMatch(/ban|block|bllok|блок|заблок|blocc/i)
    expect(onOpenChange, locale).not.toHaveBeenCalled()
    expect(router.push, locale).not.toHaveBeenCalled()
    expect(router.refresh, locale).not.toHaveBeenCalled()
  }
})

it('[SEC-927-FE-DENY-REPLAY] a second click or a second credential during a pending sign-in does nothing, and the next attempt uses a new state and a new nonce', async () => {
  let settle!: (value: unknown) => void
  browser.signInWithGoogleIdToken.mockReturnValueOnce(new Promise(resolveSignIn => { settle = resolveSignIn }))
  open()
  const first = await startAttempt()

  fireEvent.click(signInButton()!)   // a second click while the first attempt is pending
  await settleBriefly()
  expect(windowOpen, 'the second click opened no second window').toHaveBeenCalledTimes(1)

  await answer(first, 'zz.synthetic.first')
  await answer(first, 'zz.synthetic.second')   // a second credential for the same state
  expect(browser.signInWithGoogleIdToken, 'one Supabase call for the two credentials of one attempt').toHaveBeenCalledTimes(1)
  const firstNonce = (browser.signInWithGoogleIdToken.mock.calls[0] as [string, string])[1]
  expect(sha256Hex(firstNonce)).toBe(first.hashedNonce)

  await act(async () => { settle({ data: {}, error: { message: 'something the server invented' } }) })
  await waitFor(() => expect(alertText()).toBe(en.auth.error_generic))
  expect(signInButton()!.disabled, 'the button works again after the failed sign-in').toBe(false)

  const next = await startAttempt()
  expect(windowOpen).toHaveBeenCalledTimes(2)
  expect(next.state, 'a new state').not.toBe(first.state)
  expect(next.hashedNonce, 'the hash of a new nonce').not.toBe(first.hashedNonce)
  await answer(first, 'zz.synthetic.stale')   // the first attempt's state is spent
  expect(browser.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  await answer(next, 'zz.synthetic.third')
  await waitFor(() => expect(browser.signInWithGoogleIdToken).toHaveBeenCalledTimes(2))
  const thirdNonce = (browser.signInWithGoogleIdToken.mock.calls[1] as [string, string])[1]
  expect(thirdNonce, 'the next attempt does not reuse the first raw nonce').not.toBe(firstNonce)
  expect(sha256Hex(thirdNonce)).toBe(next.hashedNonce)
})

it('[SEC-927-FE-DENY-NOAUTO] nothing signs a visitor in automatically: no Google window, no Google script and no One Tap before a click', async () => {
  const api = { initialize: vi.fn(), prompt: vi.fn(), cancel: vi.fn() }
  window.google = { accounts: { id: api } }   // were the button to touch Google Identity Services, it would find it at once
  try {
    open()
    await settleBriefly()
    expect(signInButton()).not.toBeNull()
    expect(windowOpen, 'no Google window before a click').not.toHaveBeenCalled()
    expect(gisScript(), 'no Google Identity Services script').toBeNull()
    expect(document.head.querySelector('script[src*="accounts.google.com"]')).toBeNull()
    expect(api.prompt, 'One Tap is never prompted').not.toHaveBeenCalled()
    expect(api.initialize).not.toHaveBeenCalled()
    expect(browser.signInWithGoogleIdToken).not.toHaveBeenCalled()
    expect(browser.signIn).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  } finally {
    delete window.google
  }
})

it('[SEC-927-FE-ERR-NOCLIENT] without a client ID no Google button is shown and the slot shows the unavailable alert', async () => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', undefined)
  open()

  await waitFor(() => expect(alertText()).toBe(en.auth.google_unavailable))
  expect(signInButton(), 'no Google button').toBeNull()
  expect(windowOpen).not.toHaveBeenCalled()
  expect(gisScript()).toBeNull()
  expect(document.head.querySelector('script[src*="accounts.google.com"]')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
})

it('[SEC-927-FE-ERR-NOLEAK] a failed Google sign-in writes neither the credential nor the raw nonce to the console, storage or the address', async () => {
  const sinks = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined))
  browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: { message: 'something the server invented' } })
  open()
  const attempt = await startAttempt()
  await answer(attempt, 'zz.synthetic.idtoken.secret')

  await waitFor(() => expect(alertText()).toBe(en.auth.error_generic))
  const nonce = (browser.signInWithGoogleIdToken.mock.calls[0] as [string, string])[1]
  const everything = JSON.stringify([
    sinks.flatMap(sink => sink.mock.calls.map(call => call.map(String))),
    Object.entries({ ...sessionStorage }), Object.entries({ ...localStorage }), window.location.href, document.cookie,
  ])
  expect(everything).not.toContain('zz.synthetic.idtoken.secret')
  expect(everything).not.toContain(nonce)
  expect(window.location.href).not.toContain('idtoken')
})

it('[SEC-927-FE-ERR-POPUP] when the browser blocks Google\'s window the sheet says so, the button works again and the e-mail sign-in still works', async () => {
  installWindow({ blocked: true })
  open()
  await startAttempt()

  await waitFor(() => expect(alertText()).toBe(en.auth.google_popup_blocked))
  expect(signInButton()!.disabled, 'the button is enabled again').toBe(false)
  expect(signInButton()!.hasAttribute('data-loading'), 'and shows no loader').toBe(false)
  expect(browser.signInWithGoogleIdToken).not.toHaveBeenCalled()

  const form = document.querySelector('form')!
  fireEvent.change(form.querySelector('input[type="email"]')!, { target: { value: 'alba@example.com' } })
  fireEvent.change(form.querySelector('input[type="password"]')!, { target: { value: 'secret' } })
  fireEvent.submit(form)
  await waitFor(() => expect(browser.signIn).toHaveBeenCalledWith('alba@example.com', 'secret', 'dev-noop-token'))
})

it('[SEC-927-FE-ERR-POPUP-TIMEOUT] an attempt that Google never answers ends after 5 minutes with the failure notice and signs nobody in', async () => {
  installWindow({ fakeTimers: true })
  open()
  const attempt = await startAttempt()
  expect(signInButton()!.hasAttribute('data-loading'), 'the button loads while Google\'s window is open').toBe(true)
  expect(alertText()).toBeNull()

  await act(async () => { await vi.advanceTimersByTimeAsync(5 * 60 * 1000) })
  expect(alertText()).toBe(en.auth.google_failed)
  expect(popup.close, 'the window is closed').toHaveBeenCalled()
  expect(signInButton()!.disabled, 'the button is enabled again').toBe(false)

  await answer(attempt, 'zz.synthetic.late')   // a late message of the ended attempt
  expect(browser.signInWithGoogleIdToken).not.toHaveBeenCalled()
  expect(router.push).not.toHaveBeenCalled()
  expect(router.refresh).not.toHaveBeenCalled()
})

it('a window the person closed ends the attempt without a notice, and the button works again', async () => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)   // jsdom has no focused element, so it says the page has no focus; a person who closed the window is back on this page
  installWindow({ fakeTimers: true })
  open()
  await startAttempt()
  popup.closed = true
  await act(async () => { await vi.advanceTimersByTimeAsync(500) })

  expect(alertText(), 'closing the window is no error').toBeNull()
  expect(signInButton()!.disabled).toBe(false)
  expect(browser.signInWithGoogleIdToken).not.toHaveBeenCalled()
})

it('[SEC-927-FE-POPUP-SYNC-OPEN] a click opens Google\'s window at once, with the attempt prepared before it', async () => {
  open()
  await flushPreparation()
  expect(windowOpen, 'no window before the click').not.toHaveBeenCalled()

  fireEvent.click(signInButton()!)
  // no await since the click: a window opened after an await loses the click's permission to open it, and a browser blocks it
  expect(windowOpen, 'the click opened Google\'s window').toHaveBeenCalledTimes(1)
  expect(windowOpen.mock.calls[0][1]).toBe('lero-google-sign-in')
  const url = new URL(windowOpen.mock.calls[0][0] as string)
  expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  expect(url.searchParams.get('state'), 'the attempt was prepared before the click').toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(url.searchParams.get('nonce')).toMatch(/^[0-9a-f]{64}$/)
  await settleBriefly()
})

it('the Google window is opened on Google\'s ID-token address with the page\'s locale, this origin\'s callback and no account hint', async () => {
  for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
    cleanup()
    open(locale)
    const { url, state, hashedNonce } = await startAttempt()
    expect(`${url.origin}${url.pathname}`, locale).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect([...url.searchParams.keys()], locale).toEqual(['client_id', 'redirect_uri', 'response_type', 'scope', 'nonce', 'state', 'prompt', 'hl'])
    expect(Object.fromEntries(url.searchParams), locale).toMatchObject({
      client_id: CLIENT_ID, redirect_uri: `${window.location.origin}/auth/google/callback`, response_type: 'id_token', scope: 'openid email profile', prompt: 'select_account', hl: locale,
    })
    expect(hashedNonce, locale).toMatch(/^[0-9a-f]{64}$/)
    expect(state, locale).toMatch(/^[A-Za-z0-9_-]{43}$/)
  }
})

it('a rejected sign-in call shows the generic error and keeps the sheet open', async () => {
  browser.signInWithGoogleIdToken.mockRejectedValue(new Error('network'))
  open()
  const attempt = await startAttempt()
  await answer(attempt, 'zz.synthetic.idtoken')
  await waitFor(() => expect(alertText()).toBe(en.auth.error_generic))
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(router.push).not.toHaveBeenCalled()
  expect(router.refresh).not.toHaveBeenCalled()
})
