/**
 * Task 923 R150–R155 (Revision 50): Supabase Auth's CAPTCHA protection refuses a password sign-in that carries no token, so the login view of the sign-in sheet takes the same silent
 * check as the reset and registration views and hands its token to `signIn`. A token is valid once: after every refusal the widget is reset and the button waits for a new token.
 * What it protects: nothing is sent without a token (a disabled button, and a forced submit that returns early); an expired token is not sent; a CAPTCHA refusal has its own text and
 * every other refusal keeps its message (a banned account still gets the wrong-credentials text, D21); a used token is never sent again.
 * The real `AuthSheet` login view renders. The doubles are the browser sign-in, the router, the captcha and recovery actions, companies and locations, and the CAPTCHA widget (a stand-in
 * with `captcha-ok`, `captcha-error` and `captcha-expire` buttons and a `reset` spy on its handle, as in `AuthSheet.test.tsx`).
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
// the Google slot stays on its loader: this file is about the password sign-in, and a script that never answers keeps the slot out of the way of the alert queries
vi.mock('@/lib/auth/googleIdentity', async (original) => ({ ...(await original<typeof import('@/lib/auth/googleIdentity')>()), loadGoogleIdentity: () => new Promise(() => undefined) }))
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryRequest: vi.fn() }))
vi.mock('@/modules/auth/actions/captcha', () => ({ signUpWithCaptcha: vi.fn(), requestPasswordResetWithCaptcha: vi.fn() }))
vi.mock('@/modules/companies/actions', () => ({ createCompanyAction: vi.fn() }))
vi.mock('@/modules/companies/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: [], refetch: vi.fn() }) }))
vi.mock('@/modules/locations/hooks/useLocations', () => ({ useLocations: () => ({ locations: [] }) }))
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

import { AuthSheet } from '../AuthSheet'

const LOCALES = { sq, en, uk, it: it_ } as const
type LocaleCode = keyof typeof LOCALES
const onOpenChange = vi.fn()
const CAPTCHA_REFUSAL = 'captcha protection: request disallowed (invalid-input-response)'

function open(locale: LocaleCode = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale] as never}>
      <MantineProvider theme={theme} env="test"><AuthSheet open onOpenChange={onOpenChange} initialView="login" /></MantineProvider>
    </NextIntlClientProvider>,
  )
}
const form = () => document.querySelector('form')!
const loginButton = () => form().querySelector('button[type="submit"]') as HTMLButtonElement
function fill(email = 'alba@example.com', password = 'secret') {
  fireEvent.change(form().querySelector('input[type="email"]')!, { target: { value: email } })
  fireEvent.change(form().querySelector('input[type="password"]')!, { target: { value: password } })
}
const submit = () => fireEvent.submit(form())
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const alertText = () => screen.queryByRole('alert')?.textContent ?? null
/** a new sheet: the previous one is removed and every double starts clean */
function freshSheet(locale: LocaleCode, answer: unknown) {
  cleanup()
  browser.signIn.mockReset(); widget.reset.mockReset(); onOpenChange.mockReset(); router.push.mockReset(); router.refresh.mockReset()
  browser.signIn.mockResolvedValue(answer)
  open(locale)
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'zz-synthetic-client.apps.googleusercontent.com')
  setViewport(1024)
  browser.signIn.mockReset(); browser.signInWithGoogleIdToken.mockReset(); widget.reset.mockReset()
  router.push.mockReset(); router.refresh.mockReset(); onOpenChange.mockReset(); sessionStorage.clear()
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

it("[SEC-X-FE-LOGIN-CAPTCHA-ALLOW] a password sign-in sends the e-mail, the password and the check's token", async () => {
  browser.signIn.mockResolvedValue({ error: null })
  open()
  fill()
  click('captcha-ok')
  expect(loginButton()).toBeEnabled()
  submit()

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  expect(browser.signIn).toHaveBeenCalledTimes(1)
  expect(browser.signIn).toHaveBeenCalledWith('alba@example.com', 'secret', 'cap-token')
  expect(router.refresh).toHaveBeenCalledTimes(1)
  expect(router.push).not.toHaveBeenCalled()
  expect(alertText()).toBeNull()
})

it('[SEC-X-FE-LOGIN-CAPTCHA-DENY] without a valid token the login form sends nothing', () => {
  open()
  fill()
  // before any token
  expect(loginButton()).toBeDisabled()
  submit()
  expect(browser.signIn).not.toHaveBeenCalled()
  expect(alertText()).toBeNull()
  // a token that has expired is not a token
  click('captcha-ok')
  expect(loginButton()).toBeEnabled()
  click('captcha-expire')
  expect(loginButton()).toBeDisabled()
  submit()
  expect(browser.signIn).not.toHaveBeenCalled()
  expect(alertText()).toBeNull()
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(router.refresh).not.toHaveBeenCalled()
})

it('[SEC-X-FE-LOGIN-CAPTCHA-ERR] a refused sign-in resets the check and needs a new token; a CAPTCHA refusal has its own text', async () => {
  for (const locale of Object.keys(LOCALES) as LocaleCode[]) {
    const auth = LOCALES[locale].auth

    // Supabase's CAPTCHA protection refused the token: its own text, a reset check, no second sign-in with the used token
    freshSheet(locale, { error: { message: CAPTCHA_REFUSAL } })
    fill(); click('captcha-ok'); submit()
    await waitFor(() => expect(alertText(), `${locale}: captcha refusal`).toBe(auth.captcha_error_failed))
    expect(alertText(), `${locale}: not the generic text`).not.toBe(auth.error_generic)
    expect(widget.reset, `${locale}: captcha refusal resets the check`).toHaveBeenCalledTimes(1)
    expect(loginButton(), `${locale}: captcha refusal disables the button`).toBeDisabled()
    submit()
    expect(browser.signIn, `${locale}: the used token is not sent again`).toHaveBeenCalledTimes(1)
    click('captcha-ok')
    expect(alertText(), `${locale}: a new token removes the CAPTCHA alert`).toBeNull()
    expect(loginButton(), `${locale}: a new token enables the button`).toBeEnabled()

    // wrong credentials and a banned account (D21): the same wrong-credentials text, a reset check, a button that waits for a new token
    for (const message of ['Invalid login credentials', 'User is banned']) {
      freshSheet(locale, { error: { message } })
      fill(); click('captcha-ok'); submit()
      await waitFor(() => expect(alertText(), `${locale}: ${message}`).toBe(auth.error_invalid_credentials))
      expect(alertText(), `${locale}: ${message} does not name the ban`).not.toMatch(/ban|block|bllok|блок|заблок|blocc/i)
      expect(widget.reset, `${locale}: ${message} resets the check`).toHaveBeenCalledTimes(1)
      expect(loginButton(), `${locale}: ${message} disables the button`).toBeDisabled()
      submit()
      expect(browser.signIn, `${locale}: ${message}: the used token is not sent again`).toHaveBeenCalledTimes(1)
      click('captcha-ok')
      expect(loginButton(), `${locale}: ${message}: a new token enables the button`).toBeEnabled()
    }
  }
})
