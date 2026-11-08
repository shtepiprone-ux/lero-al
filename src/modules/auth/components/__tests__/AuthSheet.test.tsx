/**
 * The sign-in sheet (Task 923 Revision 7): login, forgot password, registration (private and agent) and the company picker. What it protects:
 * - nothing is sent to the server before the client-side rules and the captcha pass; a failed captcha is retried, not ignored;
 * - the password-reset answer is always the same neutral success, whatever the server said (it must not tell whether an e-mail is registered);
 * - the post-login destination is used only when it is a safe path of this site;
 * - what the registration sends is exactly the typed values (trimmed rules, E.164 phone, agent-only fields only for agents);
 * - a company logo is checked for type, size and dimensions before it is offered, and an upload failure never loses the company.
 */
import React from 'react'
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../../messages/en.json'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { theme } from '@/design-system/mantine/theme'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const a = messages.auth
const c = messages.common
const browser = vi.hoisted(() => ({ signIn: vi.fn(), signInWithGoogleIdToken: vi.fn() }))
vi.mock('@/lib/auth/browser', () => browser)
const recovery = vi.hoisted(() => ({ logPasswordRecoveryRequest: vi.fn() }))
vi.mock('@/modules/auth/actions/recovery', () => recovery)
const captcha = vi.hoisted(() => ({ signUpWithCaptcha: vi.fn(), requestPasswordResetWithCaptcha: vi.fn() }))
vi.mock('@/modules/auth/actions/captcha', () => captcha)
const companyActions = vi.hoisted(() => ({ createCompanyAction: vi.fn() }))
vi.mock('@/modules/companies/actions', () => companyActions)
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const refetch = vi.fn()
vi.mock('@/modules/companies/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: [{ id: 'c1', name: 'ACME' }], refetch }) }))
vi.mock('@/modules/locations/hooks/useLocations', () => ({ useLocations: () => ({ locations: [{ id: 1, name_al: 'Tirana' }, { id: 2, name_al: 'Durres' }] }) }))
vi.mock('@/components/shared/LocationCombobox', () => ({
  LocationCombobox: (p: { locations: { id: number; name_al: string }[]; value: string; onChange: (v: string | null) => void }) => (
    <select data-testid="city" value={p.value} onChange={(e) => p.onChange(e.target.value || null)}>
      <option value="">-</option>{p.locations.map((l) => <option key={l.id} value={String(l.id)}>{l.name_al}</option>)}
    </select>
  ),
}))
vi.mock('@/components/shared/PhoneField', () => ({
  PhoneField: (p: { onChange: (v: unknown) => void }) => (
    <input data-testid="phone" onChange={(e) => p.onChange({ national: e.target.value, dialCode: '+355', iso2: 'AL', e164: e.target.value ? `+355${e.target.value}` : '' })} />
  ),
}))
vi.mock('@/design-system/mantine/patterns', async (orig) => ({
  ...(await orig<typeof import('@/design-system/mantine/patterns')>()),
  MantineCombobox: (p: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <select data-testid="company-select" value={p.value} onChange={(e) => p.onChange(e.target.value)}>
      <option value="">-</option>{p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}))
const widget = vi.hoisted(() => ({ reset: vi.fn() }))
vi.mock('@/components/auth/CaptchaWidget', async () => {
  const React = await import('react')
  return {
    CaptchaWidget: React.forwardRef(function CaptchaWidgetDouble(p: { onSuccess: (t: string) => void; onError?: () => void; onExpire?: () => void }, ref: React.Ref<unknown>) {
      React.useImperativeHandle(ref, () => ({ reset: widget.reset }))
      return (
        <div>
          <button type="button" onClick={() => p.onSuccess('cap-token')}>captcha-ok</button>
          <button type="button" onClick={() => p.onError?.()}>captcha-error</button>
          <button type="button" onClick={() => p.onExpire?.()}>captcha-expire</button>
        </div>
      )
    }),
  }
})

import { AuthSheet, type AuthView } from '../AuthSheet'
import { AUTH_NEXT_KEY, AUTH_SESSION_LOST_KEY } from '../AuthRedirect'
import { SITE_URL } from '@/lib/siteUrl'

const STRONG = 'Str0ng!Passw0rd'
const onOpenChange = vi.fn()
function open(view: AuthView = 'login', isOpen = true) {
  return renderApp(<AuthSheet open={isOpen} onOpenChange={onOpenChange} initialView={view} />)
}
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement
const set = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const alertText = () => screen.queryByRole('alert')?.textContent ?? null
// Google's window (Task 927 Amendment 10): `window.open` is a double that returns a window; the test plays Google's callback page by posting the message that page sends to its opener
let googleWindow: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  setViewport(1024)
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'zz-synthetic-client.apps.googleusercontent.com')
  Object.values({ ...browser, ...recovery, ...captcha, ...companyActions, ...router, ...widget }).forEach((f) => (f as ReturnType<typeof vi.fn>).mockReset())
  refetch.mockReset(); onOpenChange.mockReset(); sessionStorage.clear()
  googleWindow = vi.spyOn(window, 'open').mockReturnValue({ closed: false, close: vi.fn() } as unknown as Window)
  browser.signIn.mockResolvedValue({ error: null })
  browser.signInWithGoogleIdToken.mockResolvedValue({ data: {}, error: null })
  captcha.signUpWithCaptcha.mockResolvedValue({ ok: true })
  captcha.requestPasswordResetWithCaptcha.mockResolvedValue({ ok: true })
  recovery.logPasswordRecoveryRequest.mockResolvedValue(undefined)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); googleWindow.mockRestore() })

describe('the sheet itself', () => {
  it('closed, it shows nothing', () => {
    open('login', false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each([
    ['login', a.login], ['register', a.register], ['register-agent', a.register_agent], ['forgot-password', a.forgot_password_title],
  ] as const)('the %s view is titled %s', (view, title) => {
    open(view)
    expect(within(screen.getByRole('dialog')).getAllByText(title).length).toBeGreaterThan(0)
  })

  it('the agent view says which kind of registration it is', () => {
    open('register-agent')
    expect(screen.getByText(`${a.register_as} ${a.agent}`)).toBeInTheDocument()
  })

  it('the views link to each other', () => {
    open('login')
    click(a.register)
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument()
    click(a.register_agent)
    expect(screen.getByRole('button', { name: new RegExp(a.register_back_to_standard) })).toBeInTheDocument()
    click(new RegExp(a.register_back_to_standard))
    click(a.login)
    click(a.forgot_password)
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeInTheDocument()
    click(new RegExp(a.forgot_password_back))
    expect(field(/^Email/)).toBeInTheDocument()
  })

  it('typed registration values survive a switch between the private and agent views', () => {
    open('register')
    set(field(/^Name/), 'Alba'); set(field(/^Email/), 'alba@example.com'); set(field(/^Password/), STRONG)
    click(a.register_agent)
    expect(field(/^Name/).value).toBe('Alba')
    expect(field(/^Email/).value).toBe('alba@example.com')
    expect(field(/^Password/).value).toBe(STRONG)
  })

  it('opening it again starts clean on the asked view', () => {
    const wrap = (node: React.ReactElement) => <NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test">{node}</MantineProvider></NextIntlClientProvider>
    const { rerender } = render(wrap(<AuthSheet open onOpenChange={onOpenChange} initialView="register" />))
    set(field(/^Name/), 'Alba')
    rerender(wrap(<AuthSheet open={false} onOpenChange={onOpenChange} initialView="register" />))
    rerender(wrap(<AuthSheet open onOpenChange={onOpenChange} initialView="login" />))
    expect(screen.queryByLabelText(/^Name/)).toBeNull()
    expect(field(/^Email/)).toBeInTheDocument()
  })

  it('the drawer\'s own close control reports the close', () => {
    open('login')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('login', () => {
  const fill = (email = 'alba@example.com', password = 'secret') => { set(field(/^Email/), email); set(field(/^Password/), password) }
  const submit = () => fireEvent.submit(field(/^Email/).closest('form')!)

  it('shows the session-recovery note once and removes the flag', () => {
    sessionStorage.setItem(AUTH_SESSION_LOST_KEY, 'true')
    open('login')
    expect(screen.getByText(a.session_recovery_message)).toBeInTheDocument()
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBeNull()
  })

  it.each([[''], ['   '], ['no-at-sign'], ['a@b'], ['a b@c.com'], ['a@b.c']])('the address %j is refused before anything is sent', async (email) => {
    open('login')
    fill(email, 'secret'); submit()
    expect(alertText()).toBe(a.error_email_invalid)
    expect(browser.signIn).not.toHaveBeenCalled()
  })

  it('an empty password is refused before anything is sent', () => {
    open('login')
    set(field(/^Email/), 'alba@example.com'); submit()
    expect(alertText()).toBe(a.error_weak_password)
    expect(browser.signIn).not.toHaveBeenCalled()
  })

  it('a good login sends exactly the typed values, closes the sheet and refreshes the page', async () => {
    open('login')
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(browser.signIn).toHaveBeenCalledWith('alba@example.com', 'secret', 'cap-token')
    expect(router.refresh).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('a safe stored destination is used once and removed', async () => {
    sessionStorage.setItem(AUTH_NEXT_KEY, '/en/favorites')
    open('login')
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/favorites'))
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it.each([['//evil.example'], ['https://evil.example'], ['/a/../admin'], ['javascript:alert(1)'], ['/\\evil']])('an unsafe stored destination %j is never visited', async (stored) => {
    sessionStorage.setItem(AUTH_NEXT_KEY, stored)
    open('login')
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    expect(router.push).not.toHaveBeenCalled()
  })

  it.each([
    ['Invalid login credentials', a.error_invalid_credentials], ['invalid credentials', a.error_invalid_credentials],
    ['User already registered', a.error_email_exists], ['Password should be at least 6 characters', a.error_weak_password],
    ['Email not confirmed', a.error_email_not_confirmed], ['email rate limit exceeded', a.error_rate_limit], ['Too many requests', a.error_rate_limit],
    ['captcha protection: request disallowed (no captcha_token found)', a.captcha_error_failed],
    ['something the server invented', a.error_generic], ['', a.error_generic],
  ])('the server message %j is shown as "%s" and does not close the sheet', async (message, shown) => {
    browser.signIn.mockResolvedValue({ error: { message } })
    open('login')
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText()).toBe(shown))
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('while the request runs the button cannot be pressed again', async () => {
    let release!: (v: unknown) => void
    browser.signIn.mockReturnValue(new Promise((r) => { release = r }))
    open('login')
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(screen.getByRole('button', { name: a.login })).toBeDisabled())
    await act(async () => { release({ error: null }); await Promise.resolve() })
  })

  // Task 927: the Google credential arrives from Google's window, through the callback page of this origin; this page is never redirected
  const pickGoogleAccount = async (credential = 'zz.synthetic.idtoken') => {
    const before = googleWindow.mock.calls.length
    // the button prepares its attempt (a nonce hashed on a worker thread) as soon as it mounts; a click opens Google's window only with a prepared attempt (Amendment 11)
    await act(async () => { for (let turn = 0; turn < 20; turn++) await new Promise<void>(resolve => setImmediate(resolve)) })
    fireEvent.click(document.querySelector('[data-google-sign-in]')!)
    await waitFor(() => expect(googleWindow).toHaveBeenCalledTimes(before + 1))
    const state = new URL(googleWindow.mock.calls.at(-1)![0] as string).searchParams.get('state')
    await act(async () => { window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: 'lero:google-sign-in', state, credential } })) })
  }

  it('Google sign-in sends the ID token with this attempt\'s nonce, closes the sheet and refreshes the page', async () => {
    open('login')
    await pickGoogleAccount()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(browser.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
    expect(browser.signInWithGoogleIdToken).toHaveBeenCalledWith('zz.synthetic.idtoken', expect.stringMatching(/^[A-Za-z0-9+/]{43}=$/))
    expect(router.refresh).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('Google sign-in opens the stored destination once, checks it, and does not keep it (Task 923 R72 (i), Task 927)', async () => {
    sessionStorage.setItem(AUTH_NEXT_KEY, '/en/favorites?tab=2')
    open('login')
    await pickGoogleAccount()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/en/favorites?tab=2'))
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    expect(router.refresh).not.toHaveBeenCalled()
    // a destination that is not a path of this site is not opened
    router.push.mockClear()
    await waitFor(() => expect(document.querySelector('[data-google-sign-in]')).not.toBeDisabled())   // the button works again; the next attempt gets a new nonce and state
    sessionStorage.setItem(AUTH_NEXT_KEY, 'https://evil.example/steal')
    await pickGoogleAccount('zz.synthetic.second')
    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('the password field is current-password, the toggle is named, and the e-mail asks for an e-mail keyboard', () => {
    open('login')
    expect(field(/^Password/)).toHaveAttribute('autocomplete', 'current-password')
    expect(field(/^Email/)).toHaveAttribute('type', 'email')
    fireEvent.mouseDown(screen.getByRole('button', { name: c.show_password }))
    expect(field(/^Password/)).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: c.hide_password })).toBeInTheDocument()
  })
})

describe('forgot password', () => {
  const submit = () => fireEvent.submit(field(/^Email/).closest('form')!)

  it('cannot be sent without the captcha, and cannot be forced either', () => {
    open('forgot-password')
    set(field(/^Email/), 'alba@example.com')
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeDisabled()
    submit()
    expect(captcha.requestPasswordResetWithCaptcha).not.toHaveBeenCalled()
  })

  it('sends the typed address, the captcha token and a reset link that returns to this site\'s reset page in the person\'s language', async () => {
    open('forgot-password')
    set(field(/^Email/), 'alba@example.com')
    click('captcha-ok')
    submit()
    await screen.findByText(a.forgot_password_success_title)
    expect(captcha.requestPasswordResetWithCaptcha).toHaveBeenCalledWith({
      email: 'alba@example.com', captchaToken: 'cap-token', redirectTo: `${SITE_URL}/auth/callback?next=/en/auth/reset-password`,
    })
    expect(recovery.logPasswordRecoveryRequest).toHaveBeenCalledWith('alba@example.com')
  })

  it.each([
    [{ ok: true }], [{ ok: false, reason: 'rate_limited' }], [{ ok: false, reason: 'unknown_email' }], [{ ok: false, reason: 'server_error' }],
  ])('the answer %j always leads to the same neutral success (the page never tells whether the address is registered)', async (answer) => {
    captcha.requestPasswordResetWithCaptcha.mockResolvedValue(answer)
    open('forgot-password')
    set(field(/^Email/), 'who@example.com'); click('captcha-ok'); submit()
    expect(await screen.findByText(a.forgot_password_success_title)).toBeInTheDocument()
    expect(screen.getByText(a.forgot_password_success_body)).toBeInTheDocument()
  })

  it('a failed captcha resets the widget, clears the token, shows the error, and needs a new token', async () => {
    captcha.requestPasswordResetWithCaptcha.mockResolvedValue({ ok: false, reason: 'captcha_failed' })
    open('forgot-password')
    set(field(/^Email/), 'alba@example.com'); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText()).toBe(a.captcha_error_failed))
    expect(widget.reset).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(a.forgot_password_success_title)).toBeNull()
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeDisabled()
  })

  it('a widget error shows the failure and takes the token away; an expiry only takes the token away; a new token recovers', () => {
    open('forgot-password')
    click('captcha-ok')
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeEnabled()
    click('captcha-expire')
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeDisabled()
    expect(alertText()).toBeNull()
    click('captcha-error')
    expect(alertText()).toBe(a.captcha_error_failed)
    click('captcha-ok')
    expect(alertText()).toBeNull()
    expect(screen.getByRole('button', { name: a.forgot_password_submit })).toBeEnabled()
  })

  it('"back to login" works from the form and from the success page', async () => {
    open('forgot-password')
    click(new RegExp(a.forgot_password_back))
    expect(screen.getByRole('button', { name: a.login })).toBeInTheDocument()
    click(a.forgot_password)
    set(field(/^Email/), 'alba@example.com'); click('captcha-ok'); submit()
    await screen.findByText(a.forgot_password_success_title)
    click(a.forgot_password_back)
    expect(field(/^Email/)).toBeInTheDocument()
  })
})

describe('registration', () => {
  const form = () => field(/^Email/).closest('form')!
  function fillValid() {
    set(field(/^Name/), 'Alba Hoxha'); set(field(/^Email/), 'alba@example.com'); set(field(/^Password/), STRONG)
  }
  const submit = () => fireEvent.submit(form())
  const regButton = () => screen.getByRole('button', { name: a.register })

  it('the register button needs a strong password AND the captcha', () => {
    open('register')
    fillValid()
    expect(regButton()).toBeDisabled()
    click('captcha-ok')
    expect(regButton()).toBeEnabled()
    set(field(/^Password/), 'weak')
    expect(regButton()).toBeDisabled()
  })

  it.each([
    ['name', () => { set(field(/^Name/), '   '); set(field(/^Email/), 'a@example.com'); set(field(/^Password/), STRONG) }, a.error_name_required],
    ['e-mail', () => { set(field(/^Name/), 'A'); set(field(/^Email/), 'nope'); set(field(/^Password/), STRONG) }, a.error_email_invalid],
    ['password', () => { set(field(/^Name/), 'A'); set(field(/^Email/), 'a@example.com'); set(field(/^Password/), 'weakpass') }, a.error_weak_password],
  ])('a bad %s is refused before anything is sent', (_what, fill, text) => {
    open('register')
    fill(); click('captcha-ok'); submit()
    expect(alertText()).toBe(text)
    expect(captcha.signUpWithCaptcha).not.toHaveBeenCalled()
  })

  it('without a captcha token a forced submit sends nothing and says nothing', () => {
    open('register')
    fillValid(); submit()
    expect(captcha.signUpWithCaptcha).not.toHaveBeenCalled()
    expect(alertText()).toBeNull()
  })

  it('a phone that fails the country rules shows that rule and sends nothing', () => {
    open('register')
    fillValid(); fireEvent.change(screen.getByTestId('phone'), { target: { value: '355691234567' } }); click('captcha-ok'); submit()
    expect(alertText()).toBe(a.error_phone_no_country_code)
    expect(captcha.signUpWithCaptcha).not.toHaveBeenCalled()
  })

  it('a private registration sends the typed values, the token and this site\'s verification return path; no agent fields', async () => {
    open('register')
    fillValid(); click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    expect(captcha.signUpWithCaptcha).toHaveBeenCalledTimes(1)
    expect(captcha.signUpWithCaptcha).toHaveBeenCalledWith({
      email: 'alba@example.com', password: STRONG, captchaToken: 'cap-token',
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/en/auth/verified`,
      data: { name: 'Alba Hoxha', phone: undefined, user_type: 'private', location_id: undefined, company_id: undefined, preferred_locale: 'en' },
    })
  })

  it('a valid phone is sent in E.164', async () => {
    open('register')
    fillValid(); fireEvent.change(screen.getByTestId('phone'), { target: { value: '691234567' } }); click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    expect(captcha.signUpWithCaptcha.mock.calls[0][0].data.phone).toBe('+355691234567')
  })

  it('an agent registration sends user_type agent with the chosen city (as a number) and company', async () => {
    open('register-agent')
    fillValid()
    fireEvent.change(screen.getByTestId('city'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('company-select'), { target: { value: 'c1' } })
    click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    expect(captcha.signUpWithCaptcha.mock.calls[0][0].data).toMatchObject({ user_type: 'agent', location_id: 2, company_id: 'c1' })
  })

  it('an agent with no city and no company sends none of them', async () => {
    open('register-agent')
    fillValid(); click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    const d = captcha.signUpWithCaptcha.mock.calls[0][0].data
    expect(d.user_type).toBe('agent')
    expect(d.location_id).toBeUndefined()
    expect(d.company_id).toBeUndefined()
  })

  it('a private registration never sends a city or company even if one was chosen before switching', async () => {
    open('register-agent')
    fireEvent.change(screen.getByTestId('city'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('company-select'), { target: { value: 'c1' } })
    click(new RegExp(a.register_back_to_standard))
    fillValid(); click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    const d = captcha.signUpWithCaptcha.mock.calls[0][0].data
    expect(d.user_type).toBe('private')
    expect(d.location_id).toBeUndefined()
    expect(d.company_id).toBeUndefined()
  })

  it('a failed captcha resets the widget, drops the token and shows the captcha error', async () => {
    captcha.signUpWithCaptcha.mockResolvedValue({ ok: false, reason: 'captcha_failed' })
    open('register')
    fillValid(); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText()).toBe(a.captcha_error_failed))
    expect(widget.reset).toHaveBeenCalledTimes(1)
    expect(regButton()).toBeDisabled()
  })

  it.each([
    ['User already registered', a.error_email_exists], ['Password should be at least 6 characters', a.error_weak_password], ['email rate limit', a.error_rate_limit],
  ])('a server message %j is shown as "%s", the widget is reset and a new token is needed', async (message, shown) => {
    captcha.signUpWithCaptcha.mockResolvedValue({ ok: false, reason: 'signup_failed', supabaseErrorMessage: message })
    open('register')
    fillValid(); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText()).toBe(shown))
    expect(widget.reset).toHaveBeenCalledTimes(1)
    expect(regButton()).toBeDisabled()
  })

  it('a failure with no message is the generic error', async () => {
    captcha.signUpWithCaptcha.mockResolvedValue({ ok: false, reason: 'signup_failed' })
    open('register')
    fillValid(); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText()).toBe(a.error_generic))
  })

  it('the success page leads home by closing the sheet', async () => {
    open('register')
    fillValid(); click('captcha-ok'); submit()
    await screen.findByText(a.register_success_title)
    click(a.register_success_go_home)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('a captcha error from the widget blocks and shows the error; the next good token clears it', () => {
    open('register')
    click('captcha-error')
    expect(alertText()).toBe(a.captcha_error_failed)
    click('captcha-ok')
    expect(alertText()).toBeNull()
  })

  it('a token that expires disables the button again', () => {
    open('register')
    fillValid(); click('captcha-ok')
    expect(regButton()).toBeEnabled()
    click('captcha-expire')
    expect(regButton()).toBeDisabled()
  })

  it('the password field asks for a NEW password', () => {
    open('register')
    expect(field(/^Password/)).toHaveAttribute('autocomplete', 'new-password')
  })
})

describe('company picker (agent registration)', () => {
  class FakeImage {
    static width = 100; static height = 100; static fail = false
    naturalWidth = FakeImage.width; naturalHeight = FakeImage.height
    onload: (() => void) | null = null; onerror: (() => void) | null = null
    set src(_v: string) { queueMicrotask(() => (FakeImage.fail ? this.onerror?.() : this.onload?.())) }
  }
  const revoke = vi.fn()
  beforeEach(() => {
    FakeImage.width = 100; FakeImage.height = 100; FakeImage.fail = false
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: revoke }))
    revoke.mockReset()
    companyActions.createCompanyAction.mockResolvedValue({ id: 'new-1' })
    refetch.mockResolvedValue(undefined)
  })
  const openAdd = () => { open('register-agent'); click(new RegExp(a.company_add_new)) }
  const nameInput = () => screen.getByPlaceholderText(a.company) as HTMLInputElement
  const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement
  const pick = (file: File) => fireEvent.change(fileInput(), { target: { files: [file] } })
  const png = (size = 1000, type = 'image/png') => new File([new Uint8Array(size)], 'logo.png', { type })

  it('lists the companies and the add panel opens and cancels', () => {
    openAdd()
    expect(screen.getByRole('button', { name: c.cancel })).toBeInTheDocument()
    click(c.cancel)
    expect(screen.getByRole('button', { name: new RegExp(a.company_add_new) })).toBeInTheDocument()
  })

  it('the add button needs a name; the name is limited to 120 characters', () => {
    openAdd()
    expect(screen.getByRole('button', { name: c.add })).toBeDisabled()
    expect(nameInput()).toHaveAttribute('maxlength', '120')
    set(nameInput(), '   ')
    expect(screen.getByRole('button', { name: c.add })).toBeDisabled()
  })

  it('creates the company with the trimmed name, selects it and closes the panel', async () => {
    openAdd()
    set(nameInput(), '  New Agency  ')
    click(c.add)
    await waitFor(() => expect(screen.queryByRole('button', { name: c.cancel })).toBeNull())
    expect(companyActions.createCompanyAction).toHaveBeenCalledWith('New Agency')
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('Enter in the name field creates it without submitting the registration form', async () => {
    openAdd()
    set(nameInput(), 'Agency')
    const ev = fireEvent.keyDown(nameInput(), { key: 'Enter' })
    expect(ev).toBe(false)
    await waitFor(() => expect(companyActions.createCompanyAction).toHaveBeenCalledWith('Agency'))
    expect(captcha.signUpWithCaptcha).not.toHaveBeenCalled()
  })

  it('an existing company is offered for selection instead of creating a second one', async () => {
    companyActions.createCompanyAction.mockResolvedValue({ id: 'old-1', duplicate: true })
    openAdd()
    set(nameInput(), 'ACME')
    click(c.add)
    expect(await screen.findByText(a.company_exists)).toBeInTheDocument()
    click(c.select)
    await waitFor(() => expect(screen.queryByText(a.company_exists)).toBeNull())
    expect(refetch).not.toHaveBeenCalled()
  })

  it('typing again withdraws the duplicate notice', async () => {
    companyActions.createCompanyAction.mockResolvedValue({ id: 'old-1', duplicate: true })
    openAdd()
    set(nameInput(), 'ACME'); click(c.add)
    await screen.findByText(a.company_exists)
    set(nameInput(), 'ACME 2')
    expect(screen.queryByText(a.company_exists)).toBeNull()
  })

  it('a refused name (no id) stops quietly and the panel stays open', async () => {
    companyActions.createCompanyAction.mockResolvedValue({ error: 'company_name_too_short' })
    openAdd()
    set(nameInput(), 'A'); click(c.add)
    await waitFor(() => expect(companyActions.createCompanyAction).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: c.cancel })).toBeInTheDocument()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('a refetch failure does not lose the new company', async () => {
    refetch.mockRejectedValue(new Error('db'))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    openAdd()
    set(nameInput(), 'Agency'); click(c.add)
    await waitFor(() => expect(screen.queryByRole('button', { name: c.cancel })).toBeNull())
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })

  it.each([
    ['a file of another type', () => png(1000, 'image/gif'), a.company_logo_invalid_type],
    ['a PDF', () => png(1000, 'application/pdf'), a.company_logo_invalid_type],
    ['a file over 2 MB', () => png(2 * 1024 * 1024 + 1), a.company_logo_too_large],
  ])('%s is refused with its message and no preview', (_l, make, text) => {
    openAdd()
    pick(make())
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByAltText('logo preview')).toBeNull()
  })

  it('a picture over 256 px is refused and its temporary address is released', async () => {
    FakeImage.width = 257
    openAdd()
    pick(png())
    expect(await screen.findByText(a.company_logo_too_big)).toBeInTheDocument()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
  })

  it('a file the browser cannot read as a picture is refused as the wrong type', async () => {
    FakeImage.fail = true
    openAdd()
    pick(png())
    expect(await screen.findByText(a.company_logo_invalid_type)).toBeInTheDocument()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
  })

  it('a good logo shows a preview, can be replaced, and cleared (releasing its address)', async () => {
    openAdd()
    pick(png())
    expect(await screen.findByAltText('logo preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: c.replace })).toBeInTheDocument()
    // the drawer's own close control has the same accessible name; the logo's clear control is the one that reads ×
    fireEvent.click(screen.getAllByRole('button', { name: c.aria_clear }).find((b) => b.textContent === '×')!)
    expect(screen.queryByAltText('logo preview')).toBeNull()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
    expect(screen.getByRole('button', { name: c.choose_file })).toBeInTheDocument()
  })

  it('exactly the three picture types are accepted by the file chooser', () => {
    openAdd()
    expect(fileInput()).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  })

  it('the logo is uploaded with the company id and its grant after the company exists; the upload is a POST of form data', async () => {
    companyActions.createCompanyAction.mockResolvedValue({ id: 'new-1', logoGrant: 'grant-xyz' })
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))
    vi.stubGlobal('fetch', fetchMock)
    openAdd()
    pick(png())
    await screen.findByAltText('logo preview')
    set(nameInput(), 'Agency'); click(c.add)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/upload-company-logo')
    expect(init.method).toBe('POST')
    const fd = init.body as FormData
    expect(fd.get('companyId')).toBe('new-1')
    expect(fd.get('grant')).toBe('grant-xyz')
    expect((fd.get('logo') as File).name).toBe('logo.png')
  })

  it('no grant means none is sent; an upload failure is ignored and the company is still selected', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', fetchMock)
    openAdd()
    pick(png())
    await screen.findByAltText('logo preview')
    set(nameInput(), 'Agency'); click(c.add)
    await waitFor(() => expect(screen.queryByRole('button', { name: c.cancel })).toBeNull())
    const fd = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData
    expect(fd.has('grant')).toBe(false)
    expect(refetch).toHaveBeenCalled()
  })

  it('no logo means no upload request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    openAdd()
    set(nameInput(), 'Agency'); click(c.add)
    await waitFor(() => expect(screen.queryByRole('button', { name: c.cancel })).toBeNull())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('choosing an existing company from the list sets it for the registration', async () => {
    open('register-agent')
    fireEvent.change(screen.getByTestId('company-select'), { target: { value: 'c1' } })
    set(field(/^Name/), 'A'); set(field(/^Email/), 'a@example.com'); set(field(/^Password/), STRONG); click('captcha-ok')
    fireEvent.submit(field(/^Email/).closest('form')!)
    await screen.findByText(a.register_success_title)
    expect(captcha.signUpWithCaptcha.mock.calls[0][0].data.company_id).toBe('c1')
  })
})

// Task 953 (set-state-in-effect): the session-recovery note is read once by whichever view opens first (Welcome back or Login), and a reopened sheet starts from the asked view.
describe('Welcome back and the reopened sheet (Task 953)', () => {
  const account = { sub: 'g-1', name: 'Arta', maskedEmail: 'ar•••••@example.com', picture: null }

  it('Welcome back shows the session-recovery note once and removes the flag', () => {
    sessionStorage.setItem(AUTH_SESSION_LOST_KEY, 'true')
    renderApp(<AuthSheet open onOpenChange={onOpenChange} initialView="login" googleAccount={account} onForgetGoogleAccount={vi.fn()} />)
    expect(screen.getByText(a.session_recovery_message)).toBeInTheDocument()
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBeNull()
  })

  it('Welcome back shows no note when the flag is absent', () => {
    renderApp(<AuthSheet open onOpenChange={onOpenChange} initialView="login" googleAccount={account} onForgetGoogleAccount={vi.fn()} />)
    expect(screen.queryByText(a.session_recovery_message)).toBeNull()
  })

  it('Login after Welcome back does not show the note a second time', () => {
    sessionStorage.setItem(AUTH_SESSION_LOST_KEY, 'true')
    renderApp(<AuthSheet open onOpenChange={onOpenChange} initialView="login" googleAccount={account} onForgetGoogleAccount={vi.fn()} />)
    click(a.welcome_back_more_options ?? /more options/i)
    expect(screen.queryByText(a.session_recovery_message)).toBeNull()
  })

  it('starts on the asked view when it is opened again after a different one was used', () => {
    const wrap = (node: React.ReactElement) => <NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test">{node}</MantineProvider></NextIntlClientProvider>
    const { rerender } = render(wrap(<AuthSheet open onOpenChange={onOpenChange} initialView="login" />))
    click(a.register)
    expect(field(/^Name/)).toBeInTheDocument()
    rerender(wrap(<AuthSheet open={false} onOpenChange={onOpenChange} initialView="login" />))
    rerender(wrap(<AuthSheet open onOpenChange={onOpenChange} initialView="login" />))
    expect(screen.queryByLabelText(/^Name/)).toBeNull()
    expect(field(/^Email/)).toBeInTheDocument()
  })
})
