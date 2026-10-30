/**
 * Task 927 Amendment 5: One Tap for a guest, the remembered Google account and the Welcome back view, through the real `Header`. The real `Header`, `HeaderView`, `AuthSheet`,
 * `GoogleWelcomeBack`, `GoogleSignInButton`, `GoogleSignInSlot`, `useGoogleOneTap`, `googleIdentity`, `rememberedGoogleAccount`, `googleSignIn`, `mapAuthError` and
 * `sanitizeReturnTo` render. The doubles are: the identity hook (`useUser`), the browser auth wrapper, the router, the toast, the notification bell, the admin-locale action, the
 * captcha / companies / locations modules the sheet imports, a GIS stand-in installed on `window.google` when the test fires the script's `load` (One Tap only: jsdom neither loads
 * a script from the network nor draws Google's prompt) and `window.open` for the sign-in button (Amendment 10, D25: the button is our own and opens Google's window; the test plays
 * Google's callback page by posting the message that page sends to its opener, with the state read from the address the button gave `window.open`).
 * What it protects: One Tap is offered only to a guest outside the sign-in sheet, once per page, and signs in only on a click with that prompt's raw nonce; the device keeps only
 * the remembered account's four fields; a hostile record is never rendered; "Forget this account" erases it and a sign-out keeps it.
 */
import { createHash } from 'node:crypto'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import en from '../../../../messages/en.json'
import it_ from '../../../../messages/it.json'
import sq from '../../../../messages/sq.json'
import uk from '../../../../messages/uk.json'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import type { GoogleIdInitializeConfig } from '@/lib/auth/googleIdentity'
import { openAuthSheet } from '@/lib/auth/authSheet'

const identity = vi.hoisted(() => ({ user: null as unknown, status: 'unauthenticated', signOut: vi.fn(), isSigningOut: false }))
vi.mock('@/modules/auth/hooks/useUser', () => ({ useUser: () => identity }))
const browser = vi.hoisted(() => ({ signIn: vi.fn(), signInWithGoogleIdToken: vi.fn() }))
vi.mock('@/lib/auth/browser', () => browser)
const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), pathname: '/en/listings' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push, refresh: nav.refresh }), usePathname: () => nav.pathname }))
const toasts = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast: toasts }))
vi.mock('@/modules/notifications/components/NotificationBell', () => ({ NotificationBell: () => null }))
vi.mock('@/modules/admin/actions/locale', () => ({ setAdminLocale: vi.fn() }))
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryRequest: vi.fn() }))
vi.mock('@/modules/auth/actions/captcha', () => ({ signUpWithCaptcha: vi.fn(), requestPasswordResetWithCaptcha: vi.fn() }))
vi.mock('@/modules/companies/actions', () => ({ createCompanyAction: vi.fn() }))
vi.mock('@/modules/companies/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: [], refetch: vi.fn() }) }))
vi.mock('@/modules/locations/hooks/useLocations', () => ({ useLocations: () => ({ locations: [] }) }))

import { Header } from '../Header'

const LOCALES = { sq, en, uk, it: it_ } as const
type LocaleName = keyof typeof LOCALES
const NEXT_KEY = 'auth_redirect_next'
const RECORD_KEY = 'lero:google-account'
const CLIENT_ID = 'zz-synthetic-client.apps.googleusercontent.com'
const SUB = '000000000000000000001'
const MASKED = 'ar•••••@example.com'
const FULL_EMAIL = 'arta.synthetic@example.com'

interface GisDouble { initialize: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; prompt: ReturnType<typeof vi.fn> }
interface Attempt { state: string; hashedNonce: string; url: URL }
const TYPE = 'lero:google-sign-in'
const popup = { closed: false, close: vi.fn() }
let windowOpen: ReturnType<typeof vi.spyOn>

const base64url = (value: unknown) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const CREDENTIAL = `${base64url({ alg: 'RS256' })}.${base64url({ sub: SUB, name: 'Arta Krasniqi', email: FULL_EMAIL, picture: 'https://lh3.googleusercontent.com/a/zz-synthetic' })}.zz-synthetic-signature`
const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

const MOCK_USER = { id: 'u1', public_id: 1, name: 'Alba', last_name: null, avatar_url: null, role: 'user', user_type: 'private', status: 'active' }

function renderHeader(locale: LocaleName = 'en') {
  // a new element for every render: React skips an identical element, and the mocked path is not reactive
  const tree = () => (
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale] as never}>
      <MantineProvider theme={theme} env="test"><Header /></MantineProvider>
    </NextIntlClientProvider>
  )
  const view = render(tree())
  return { ...view, again: () => view.rerender(tree()) }
}
const gisScript = () => document.head.querySelector<HTMLScriptElement>('#google-identity-services')
const installGis = (): GisDouble => {
  const api: GisDouble = { initialize: vi.fn(), cancel: vi.fn(), prompt: vi.fn() }
  window.google = { accounts: { id: api as never } }
  return api
}
/** Waits for the script element, installs the GIS double, fires `load`, then waits until `ready` holds for the double. */
async function loadGis(ready: (api: GisDouble) => void): Promise<GisDouble> {
  const script = await waitFor(() => { const found = gisScript(); expect(found).not.toBeNull(); return found as HTMLScriptElement })
  const api = installGis()
  script.dispatchEvent(new Event('load'))
  await waitFor(() => ready(api))
  return api
}
function resetGis() {
  gisScript()?.dispatchEvent(new Event('error'))
  document.head.querySelectorAll('#google-identity-services').forEach(element => element.remove())
  delete window.google
}
const oneTapConfigs = (api: GisDouble) => api.initialize.mock.calls.map(call => call[0] as GoogleIdInitializeConfig)
const oneTapPrompted = (api: GisDouble) => { expect(api.prompt).toHaveBeenCalled() }
async function pick(config: GoogleIdInitializeConfig, credential: string | undefined = CREDENTIAL) {
  await act(async () => { config.callback({ credential }) })
}
const signInButton = () => document.querySelector<HTMLButtonElement>('[data-google-sign-in]')
/** Waits, on real macrotasks, until `check` holds (the attempt hashes its nonce before it opens the window). */
async function until(check: () => boolean) {
  for (let turn = 0; turn < 500 && !check(); turn++) await new Promise<void>(resolve => setImmediate(resolve))
  expect(check()).toBe(true)
}
/** Lets the button finish preparing its attempt: its nonce is hashed on a worker thread as soon as it mounts, and a click opens Google's window only with a prepared attempt (Amendment 11). */
const flushPreparation = () => act(async () => { for (let turn = 0; turn < 20; turn++) await new Promise<void>(resolve => setImmediate(resolve)) })
/** Clicks the sheet's Google button and waits until the attempt has called `window.open`; returns what that attempt sent to Google. */
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
/** What Google's callback page does when the person picked an account: posts the ID token to its opener. */
async function answer(attempt: Pick<Attempt, 'state'>, credential: string = CREDENTIAL) {
  await act(async () => { window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: TYPE, state: attempt.state, credential } })) })
}
const setRecord = (record: unknown) => localStorage.setItem(RECORD_KEY, typeof record === 'string' ? record : JSON.stringify(record))
const REMEMBERED = { sub: SUB, name: 'Arta Krasniqi', maskedEmail: MASKED, picture: null }
const REMEMBERED_WITH_PICTURE = { ...REMEMBERED, picture: 'https://lh3.googleusercontent.com/a/zz-synthetic' }
const openSheet = () => act(() => openAuthSheet('login'))
async function closeSheet() {
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}
const loginFormShown = () => document.getElementById('login-email') !== null

beforeEach(() => {
  setViewport(1024)
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', CLIENT_ID)
  popup.closed = false; popup.close.mockReset()
  windowOpen = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
  identity.user = null; identity.status = 'unauthenticated'; identity.isSigningOut = false; identity.signOut.mockReset()
  nav.push.mockReset(); nav.refresh.mockReset(); nav.pathname = '/en/listings'
  toasts.error.mockReset(); toasts.success.mockReset()
  browser.signIn.mockReset(); browser.signInWithGoogleIdToken.mockReset()
  browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: null })
  sessionStorage.clear(); localStorage.clear()
})
afterEach(() => {
  cleanup()
  resetGis()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

it('[SEC-927-FE-ONETAP-ALLOW] a guest is offered Google\'s One Tap once on a page, and picking an account signs in with that prompt\'s raw nonce and opens the stored same-site destination', async () => {
  sessionStorage.setItem(NEXT_KEY, '/en/favorites?tab=2')
  const view = renderHeader()
  const api = await loadGis(oneTapPrompted)

  expect(api.prompt).toHaveBeenCalledTimes(1)
  expect(api.prompt).toHaveBeenCalledWith()
  const [config] = oneTapConfigs(api)
  expect(Object.keys(config).sort()).toEqual(['auto_select', 'callback', 'client_id', 'context', 'itp_support', 'nonce', 'ux_mode'])
  expect(config).toMatchObject({ client_id: CLIENT_ID, auto_select: false, context: 'signin', ux_mode: 'popup', itp_support: true })
  expect(browser.signInWithGoogleIdToken, 'nothing is sent before an account is picked').not.toHaveBeenCalled()

  await pick(config)
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/en/favorites?tab=2'))
  expect(browser.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  const [credential, nonce] = browser.signInWithGoogleIdToken.mock.calls[0] as [string, string]
  expect(credential).toBe(CREDENTIAL)
  expect(config.nonce, 'Google got the SHA-256 hex of the raw nonce').toBe(sha256Hex(nonce))
  expect(config.nonce, 'Google did not get the raw nonce').not.toBe(nonce)
  expect(nav.push).toHaveBeenCalledTimes(1)
  expect(nav.refresh).not.toHaveBeenCalled()
  expect(sessionStorage.getItem(NEXT_KEY)).toBeNull()
  expect(JSON.parse(localStorage.getItem(RECORD_KEY)!)).toEqual(REMEMBERED_WITH_PICTURE)

  view.again()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api.prompt, 'not a second time on the same path').toHaveBeenCalledTimes(1)
  expect(windowOpen, 'One Tap opens no window of ours').not.toHaveBeenCalled()
})

it('[SEC-927-FE-ONETAP-DENY-NOTGUEST] One Tap is never loaded or prompted unless the visitor is a guest', async () => {
  for (const status of ['initializing', 'authenticated', 'refreshing', 'signing_out', 'error']) {
    cleanup(); resetGis()
    const api = installGis()   // were the hook to run, it would find Google at once and initialize
    identity.status = status
    identity.user = status === 'authenticated' || status === 'refreshing' || status === 'signing_out' ? MOCK_USER : null
    renderHeader()
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    expect(gisScript(), status).toBeNull()
    expect(api.initialize, status).not.toHaveBeenCalled()
    expect(api.prompt, status).not.toHaveBeenCalled()
  }
})

it('[SEC-927-FE-ONETAP-DENY-SHEET] One Tap is cancelled when the sign-in sheet opens, ignores a late credential and is not raised again on a page where the sheet was open', async () => {
  // the sheet opens after One Tap was prompted
  const view = renderHeader()
  const api = await loadGis(oneTapPrompted)
  const [first] = oneTapConfigs(api)
  expect(api.prompt).toHaveBeenCalledTimes(1)
  await openSheet()
  expect(api.cancel, 'One Tap is cancelled when the sheet opens').toHaveBeenCalled()
  await pick(first)   // a credential given to the old One Tap callback
  expect(browser.signInWithGoogleIdToken, 'the late credential calls nothing').not.toHaveBeenCalled()
  await closeSheet()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api.prompt, 'closing the sheet prompts nothing on the same path').toHaveBeenCalledTimes(1)
  expect(oneTapConfigs(api), 'the sheet\'s own button configures nothing at Google').toHaveLength(1)

  // a new path: one prompt, with a new nonce
  nav.pathname = '/en/favorites'
  view.again()
  await waitFor(() => expect(api.prompt).toHaveBeenCalledTimes(2))
  const second = oneTapConfigs(api)[1]
  expect(second.nonce, 'a pair serves one prompt only').not.toBe(first.nonce)
  view.again()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api.prompt).toHaveBeenCalledTimes(2)

  // the sheet opens on a path before any prompt: closing it prompts nothing on that path
  cleanup(); resetGis()
  nav.pathname = '/en/search'
  const api2 = installGis()   // were One Tap to run on this path, it would find Google at once and initialize
  const early = renderHeader()
  await openSheet()
  await closeSheet()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api2.prompt, 'no prompt on the path the sheet was open on').not.toHaveBeenCalled()
  expect(api2.initialize).not.toHaveBeenCalled()
  early.again()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api2.prompt).not.toHaveBeenCalled()
})

it('[SEC-927-FE-ONETAP-DENY-REDIRECT] after a One Tap sign-in a hostile stored destination is never opened and the page refreshes instead', async () => {
  for (const stored of ['https://evil.example/steal', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
    cleanup(); resetGis()
    nav.push.mockClear(); nav.refresh.mockClear(); browser.signInWithGoogleIdToken.mockClear()
    sessionStorage.setItem(NEXT_KEY, stored)
    renderHeader()
    const api = await loadGis(oneTapPrompted)
    await pick(oneTapConfigs(api)[0])
    await waitFor(() => expect(nav.refresh, stored).toHaveBeenCalledTimes(1))
    expect(browser.signInWithGoogleIdToken, stored).toHaveBeenCalledTimes(1)
    expect(nav.push, stored).not.toHaveBeenCalled()
  }
})

it('[SEC-927-FE-ONETAP-ERR] a refused or failed One Tap sign-in shows its translated error and saves nothing, and a GIS load failure shows nothing', async () => {
  for (const locale of Object.keys(LOCALES) as LocaleName[]) {
    cleanup(); resetGis()
    toasts.error.mockClear(); nav.push.mockClear(); nav.refresh.mockClear()
    nav.pathname = `/${locale}/listings`
    sessionStorage.setItem(NEXT_KEY, `/${locale}/favorites`)

    browser.signInWithGoogleIdToken.mockResolvedValueOnce({ data: {}, error: { message: 'User is banned' } })
    renderHeader(locale)
    const api = await loadGis(oneTapPrompted)
    await pick(oneTapConfigs(api)[0])
    await waitFor(() => expect(toasts.error, locale).toHaveBeenCalledWith(LOCALES[locale].auth.error_invalid_credentials))
    expect(nav.push, locale).not.toHaveBeenCalled()
    expect(nav.refresh, locale).not.toHaveBeenCalled()
    expect(localStorage.getItem(RECORD_KEY), locale).toBeNull()

    cleanup(); resetGis()
    toasts.error.mockClear()
    browser.signInWithGoogleIdToken.mockRejectedValueOnce(new Error('network'))
    renderHeader(locale)
    const api2 = await loadGis(oneTapPrompted)
    await pick(oneTapConfigs(api2)[0])
    await waitFor(() => expect(toasts.error, locale).toHaveBeenCalledWith(LOCALES[locale].auth.error_generic))
    expect(nav.push, locale).not.toHaveBeenCalled()
    expect(nav.refresh, locale).not.toHaveBeenCalled()
    expect(localStorage.getItem(RECORD_KEY), locale).toBeNull()
  }

  // a script failure: no prompt, no toast, no retry on that path
  cleanup(); resetGis()
  toasts.error.mockClear()
  nav.pathname = '/en/listings'
  const view = renderHeader()
  const script = await waitFor(() => { const found = gisScript(); expect(found).not.toBeNull(); return found as HTMLScriptElement })
  const api3 = installGis()
  await act(async () => { script.dispatchEvent(new Event('error')) })
  view.again()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  expect(api3.prompt).not.toHaveBeenCalled()
  expect(toasts.error).not.toHaveBeenCalled()
  expect(gisScript(), 'the script is not requested again on that path').toBeNull()
})

it('[SEC-927-FE-REMEMBER-ALLOW] after a Google sign-in this device remembers only the account id, name, masked e-mail and Google picture, and the sheet opens on Welcome back with that account as the hint', async () => {
  const sinks = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined))
  renderHeader()
  await openSheet()
  expect(loginFormShown(), 'no record yet: the full sign-in').toBe(true)
  const attempt = await startAttempt()
  expect(attempt.url.searchParams.has('login_hint'), 'no account is known yet').toBe(false)
  await answer(attempt)
  await waitFor(() => expect(localStorage.getItem(RECORD_KEY)).not.toBeNull())
  const [, nonce] = browser.signInWithGoogleIdToken.mock.calls[0] as [string, string]

  expect(JSON.parse(localStorage.getItem(RECORD_KEY)!)).toEqual(REMEMBERED_WITH_PICTURE)
  expect(Object.keys(JSON.parse(localStorage.getItem(RECORD_KEY)!)).sort()).toEqual(['maskedEmail', 'name', 'picture', 'sub'])
  const everything = JSON.stringify([
    sinks.flatMap(sink => sink.mock.calls.map(call => call.map(String))),
    Object.entries({ ...sessionStorage }), Object.entries({ ...localStorage }), window.location.href, document.cookie,
  ])
  expect(everything).not.toContain('zz-synthetic-signature')
  expect(everything).not.toContain(CREDENTIAL)
  expect(everything).not.toContain(nonce)
  expect(everything).not.toContain(FULL_EMAIL)

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())   // the sign-in closed the sheet
  await openSheet()
  expect(await screen.findByText(en.auth.welcome_back_title)).toBeInTheDocument()
  expect(screen.getByText('Arta Krasniqi')).toBeInTheDocument()
  expect(screen.getByText(MASKED)).toBeInTheDocument()
  expect(loginFormShown()).toBe(false)
  const returning = await startAttempt()
  expect(returning.url.searchParams.get('login_hint'), 'Google\'s address got the account as the hint').toBe(SUB)
  expect(signInButton()!.textContent, 'the button says Sign in with Google').toBe(en.auth.google_sign_in)
})

it('[SEC-927-FE-REMEMBER-DENY-HOSTILE] a hostile or malformed remembered record is never rendered as markup or a foreign image and is removed', async () => {
  // a hostile name is text
  setRecord({ ...REMEMBERED, name: '<img src=x onerror=alert(1)>' })
  renderHeader()
  await openSheet()
  expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  expect(document.querySelector('img[src="x"]')).toBeNull()
  expect(document.querySelector('[onerror]')).toBeNull()

  const hostile: [string, unknown][] = [
    ['picture javascript:', { ...REMEMBERED, picture: 'javascript:alert(1)' }],
    ['picture on a foreign host', { ...REMEMBERED, picture: 'https://evil.example/p.png' }],
    ['an http picture', { ...REMEMBERED, picture: 'http://lh3.googleusercontent.com/a' }],
    ['an extra credential field', { ...REMEMBERED, credential: CREDENTIAL }],
    ['malformed JSON', 'not json at all'],
    ['a missing sub', { name: REMEMBERED.name, maskedEmail: MASKED, picture: null }],
  ]
  for (const [label, record] of hostile) {
    cleanup(); resetGis()
    setRecord(record)
    renderHeader()
    await openSheet()
    await waitFor(() => expect(loginFormShown(), label).toBe(true))
    expect(screen.queryByText(en.auth.welcome_back_title), label).toBeNull()
    expect(localStorage.getItem(RECORD_KEY), label).toBeNull()
    expect(Array.from(document.querySelectorAll('img')).some(image => image.src.includes('evil.example')), label).toBe(false)
  }
})

it('[SEC-927-FE-REMEMBER-FORGET] Forget this account erases the remembered account for good, while More sign-in options only shows the full sign-in', async () => {
  // Forget
  setRecord(REMEMBERED)
  renderHeader()
  await openSheet()
  expect(await screen.findByText(en.auth.welcome_back_title)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.auth.welcome_back_forget }))
  await waitFor(() => expect(loginFormShown()).toBe(true))
  expect(localStorage.getItem(RECORD_KEY)).toBeNull()
  await closeSheet()
  await openSheet()
  await waitFor(() => expect(loginFormShown(), 'the next opening shows the login view').toBe(true))
  expect(screen.queryByText(en.auth.welcome_back_title)).toBeNull()

  // More sign-in options
  cleanup(); resetGis()
  setRecord(REMEMBERED)
  renderHeader()
  await openSheet()
  expect(await screen.findByText(en.auth.welcome_back_title)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.auth.welcome_back_more_options }))
  await waitFor(() => expect(loginFormShown()).toBe(true))
  expect(localStorage.getItem(RECORD_KEY), 'the record is kept').toBe(JSON.stringify(REMEMBERED))
  await closeSheet()
  await openSheet()
  expect(await screen.findByText(en.auth.welcome_back_title), 'the next opening shows Welcome back').toBeInTheDocument()
})

it('[SEC-927-FE-WELCOME-DENY-BANNED] a banned account using Welcome back stays signed out with the wrong-credentials alert and the record unchanged', async () => {
  setRecord(REMEMBERED)
  const before = localStorage.getItem(RECORD_KEY)
  browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: { message: 'User is banned' } })
  renderHeader()
  await openSheet()
  expect(await screen.findByText(en.auth.welcome_back_title)).toBeInTheDocument()
  await answer(await startAttempt())

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(en.auth.error_invalid_credentials))
  expect(screen.getByRole('alert').textContent).not.toMatch(/ban|block/i)
  expect(screen.getByText(en.auth.welcome_back_title), 'the sheet stays on Welcome back').toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(localStorage.getItem(RECORD_KEY)).toBe(before)
  expect(nav.push).not.toHaveBeenCalled()
  expect(nav.refresh).not.toHaveBeenCalled()
})
