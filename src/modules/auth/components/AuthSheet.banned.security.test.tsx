/**
 * Task 923 R40 (owner decision D21, OWASP ASVS 5.0 6.3.8): the sign-in sheet answers a banned account with the wrong-credentials text. Supabase Auth
 * checks the ban before the password, so any other wording would tell a visitor that the account exists and is blocked. Only that one answer is
 * folded in: every other error keeps its own message. The real `AuthSheet` login view renders; only the browser sign-in and the router are doubles.
 *
 * Task 991 AC4 (O991-2): a banned answer is no longer the end. The sheet takes a fresh token and asks the server action `explainRefusedSignIn`, which says
 * `blocked: true` only to a caller that has proved the password. Then the sheet tells the person the account is blocked and links to support; with
 * `blocked: false`, or when the call fails, the wrong-credentials text stays (`[SEC-D9-FE-DENY]`, kept strict).
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
const explainAction = vi.hoisted(() => ({ explainRefusedSignIn: vi.fn() }))
vi.mock('@/modules/auth/actions/explainRefusedSignIn', () => explainAction)
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
  explainAction.explainRefusedSignIn.mockReset(); explainAction.explainRefusedSignIn.mockResolvedValue({ blocked: false })
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

  it('[SEC-D9-FE-DENY] a banned answer that the server does not confirm shows the wrong-credentials text, stays signed out and the sheet stays open', async () => {
    for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
      cleanup(); browser.signIn.mockReset(); onOpenChange.mockReset(); router.refresh.mockReset(); explainAction.explainRefusedSignIn.mockClear()
      sessionStorage.setItem('lero:auth-next', '/en/favorites')
      browser.signIn.mockResolvedValue({ error: { message: 'User is banned' } })
      open(locale)
      signInWith()
      const wrong = LOCALES[locale].auth.error_invalid_credentials
      await waitFor(() => expect(alertText(), locale).toBe(wrong))
      // the sheet asked the server to explain the refusal with exactly what was typed and a fresh token; the server said no
      expect(explainAction.explainRefusedSignIn, locale).toHaveBeenCalledTimes(1)
      expect(explainAction.explainRefusedSignIn, locale).toHaveBeenCalledWith({ email: 'alba@example.com', password: 'secret', captchaToken: 'dev-noop-token' })
      expect(alertText(), locale).not.toMatch(/ban|block|bllok|блок|заблок|blocc/i)
      expect(screen.queryByRole('link'), locale).toBeNull()
      expect(onOpenChange, locale).not.toHaveBeenCalled()
      expect(router.push, locale).not.toHaveBeenCalled()
      expect(router.refresh, locale).not.toHaveBeenCalled()
    }
  })

  it('[SEC-D9-FE-DENY] a failed or refused explain call keeps the wrong-credentials text', async () => {
    const wrong = en.auth.error_invalid_credentials
    for (const answer of [
      () => Promise.reject(new Error('network')),
      () => Promise.resolve({ blocked: false }),
      () => Promise.resolve(undefined),
      () => Promise.resolve({ blocked: 'yes' }),
      () => Promise.resolve(null),
    ]) {
      cleanup(); explainAction.explainRefusedSignIn.mockReset(); explainAction.explainRefusedSignIn.mockImplementation(answer)
      browser.signIn.mockResolvedValue({ error: { message: 'User is banned' } })
      open()
      signInWith()
      await waitFor(() => expect(alertText()).toBe(wrong))
      expect(explainAction.explainRefusedSignIn).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('link')).toBeNull()
      expect(onOpenChange).not.toHaveBeenCalled()
    }
  })

  it('[SEC-991-FE-BLOCKED-ALLOW] a banned answer the server confirms tells the person the account is blocked, with a link to support, in every language', async () => {
    for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
      cleanup(); browser.signIn.mockReset(); onOpenChange.mockReset(); router.refresh.mockReset(); explainAction.explainRefusedSignIn.mockReset()
      explainAction.explainRefusedSignIn.mockResolvedValue({ blocked: true })
      browser.signIn.mockResolvedValue({ error: { message: 'User is banned', code: 'user_banned', status: 400 } })
      open(locale)
      signInWith()
      const messages = LOCALES[locale].auth
      await waitFor(() => expect(alertText(), locale).toContain(messages.error_account_blocked))
      expect(alertText(), locale).not.toContain(messages.error_invalid_credentials)
      const link = screen.getByRole('link', { name: messages.error_account_blocked_contact })
      expect(link, locale).toHaveAttribute('href', `/${locale}/contact`)
      expect(screen.getByRole('alert'), locale).toContainElement(link)
      expect(onOpenChange, locale).not.toHaveBeenCalled()
      expect(router.refresh, locale).not.toHaveBeenCalled()
    }
  })

  it('[SEC-991-FE-BLOCKED-ALLOW] a dated suspension names its end date; the support link closes the sheet', async () => {
    const until = '2026-12-24T10:00:00.000Z'
    explainAction.explainRefusedSignIn.mockResolvedValue({ blocked: true, until })
    browser.signIn.mockResolvedValue({ error: { message: 'User is banned' } })
    open('en')
    signInWith()
    await waitFor(() => expect(alertText()).toContain(en.auth.error_account_blocked))
    expect(alertText()).toContain(en.auth.error_account_blocked_until.replace('{date}', new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(until))))
    fireEvent.click(screen.getByRole('link', { name: en.auth.error_account_blocked_contact }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('the explain action is asked for a banned answer only: any other error and a good sign-in never call it', async () => {
    for (const message of ['Invalid login credentials', 'email rate limit exceeded', 'something the server invented', 'Email not confirmed']) {
      cleanup(); explainAction.explainRefusedSignIn.mockClear()
      browser.signIn.mockResolvedValue({ error: { message } })
      open()
      signInWith()
      await waitFor(() => expect(alertText(), message).not.toBeNull())
      expect(explainAction.explainRefusedSignIn, message).not.toHaveBeenCalled()
    }
    cleanup(); browser.signIn.mockResolvedValue({ error: null })
    open()
    signInWith()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(explainAction.explainRefusedSignIn).not.toHaveBeenCalled()
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
