/**
 * Task 923 R40 (owner decision D21, OWASP ASVS 5.0 6.3.8): the sign-in sheet answers a banned account with the wrong-credentials text. Supabase Auth
 * checks the ban before the password, so any other wording would tell a visitor that the account exists and is blocked. Only that one answer is
 * folded in: every other error keeps its own message. The real `AuthSheet` login view renders; only the browser sign-in and the router are doubles.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../../messages/en.json'
import it_ from '../../../../messages/it.json'
import sq from '../../../../messages/sq.json'
import uk from '../../../../messages/uk.json'
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

import { AuthSheet } from './AuthSheet'

const LOCALES = { sq, en, uk, it: it_ } as const
const onOpenChange = vi.fn()

function open(locale: keyof typeof LOCALES = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale] as never}>
      <MantineProvider theme={theme} env="test"><AuthSheet open onOpenChange={onOpenChange} initialView="login" /></MantineProvider>
    </NextIntlClientProvider>,
  )
}
function signInWith(email = 'alba@example.com', password = 'secret') {
  const form = document.querySelector('form')!
  fireEvent.change(form.querySelector('input[type="email"]')!, { target: { value: email } })
  fireEvent.change(form.querySelector('input[type="password"]')!, { target: { value: password } })
  fireEvent.submit(form)
}
const alertText = () => screen.queryByRole('alert')?.textContent ?? null

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'zz-synthetic-client.apps.googleusercontent.com')
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')   // no site key: the real widget hands over `dev-noop-token` (Task 923 R155 (c))
  setViewport(1024)
  browser.signIn.mockReset(); router.push.mockReset(); router.refresh.mockReset(); onOpenChange.mockReset(); sessionStorage.clear()
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

describe('sign-in sheet and a blocked account', () => {
  it('[SEC-D9-FE-ALLOW] a person who is not blocked signs in and the sheet closes', async () => {
    browser.signIn.mockResolvedValue({ error: null })
    open()
    signInWith()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(browser.signIn).toHaveBeenCalledWith('alba@example.com', 'secret', 'dev-noop-token')
    expect(alertText()).toBeNull()
  })

  it('[SEC-D9-FE-DENY] a banned answer shows the wrong-credentials text, stays signed out and the sheet stays open', async () => {
    for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
      cleanup(); browser.signIn.mockReset(); onOpenChange.mockReset(); router.refresh.mockReset()
      sessionStorage.setItem('lero:auth-next', '/en/favorites')
      browser.signIn.mockResolvedValue({ error: { message: 'User is banned' } })
      open(locale)
      signInWith()
      const wrong = LOCALES[locale].auth.error_invalid_credentials
      await waitFor(() => expect(alertText(), locale).toBe(wrong))
      expect(alertText(), locale).not.toMatch(/ban|block|bllok|блок|заблок|blocc/i)
      expect(onOpenChange, locale).not.toHaveBeenCalled()
      expect(router.push, locale).not.toHaveBeenCalled()
      expect(router.refresh, locale).not.toHaveBeenCalled()
    }
  })

  it('[SEC-D9-FE-ERR] any other error keeps its generic or rate-limit message', async () => {
    const wrong = en.auth.error_invalid_credentials
    for (const [message, shown] of [
      ['something the server invented', en.auth.error_generic],
      ['', en.auth.error_generic],
      ['email rate limit exceeded', en.auth.error_rate_limit],
    ] as const) {
      cleanup(); browser.signIn.mockReset()
      browser.signIn.mockResolvedValue({ error: { message } })
      open()
      signInWith()
      await waitFor(() => expect(alertText(), message).toBe(shown))
      expect(alertText(), message).not.toBe(wrong)
    }
  })
})
