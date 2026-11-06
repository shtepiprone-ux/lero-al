/**
 * The client side of sign-in (Task 923 Revision 7): the captcha widget, the redirect bridge from /auth/login, and the auth context. The points that protect people:
 * the bridge must never send a person to an address that is not a path of this site (open redirect), the captcha "not configured" shortcut is a visible note and
 * not a silent pass in a configured site, and the context never claims a person is signed in when the server did not say so.
 */
import type { TurnstileProps } from '@marsidev/react-turnstile'
import React, { createRef } from 'react'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

// ── mocks ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const turnstile = vi.hoisted(() => ({ props: null as null | TurnstileProps, reset: vi.fn() }))
vi.mock('@marsidev/react-turnstile', async () => {
  const React = await import('react')
  return {
    Turnstile: React.forwardRef(function TurnstileDouble(props: TurnstileProps, ref: React.Ref<unknown>) {
      turnstile.props = props
      React.useImperativeHandle(ref, () => ({ reset: turnstile.reset }))
      return <div data-testid="turnstile" />
    }),
  }
})

let currentLocale = 'en'
vi.mock('next-intl', async (orig) => ({ ...(await orig<typeof import('next-intl')>()), useLocale: () => currentLocale }))

const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => null }))

let authStatus = 'unauthenticated'
const refreshUser = vi.fn()
vi.mock('@/modules/auth/hooks/useUser', () => ({ useUser: () => ({ status: authStatus, refreshUser }) }))

const browser = vi.hoisted(() => ({ signOut: vi.fn(), unsubscribe: vi.fn() }))
vi.mock('@/lib/auth/browser', () => ({
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: browser.unsubscribe } } }),
  signOut: browser.signOut,
}))

import { CaptchaWidget, type CaptchaWidgetHandle } from '@/components/auth/CaptchaWidget'
import { AUTH_NEXT_KEY, AUTH_SESSION_LOST_KEY, AuthRedirect } from '../AuthRedirect'
import { AUTH_SHEET_CLOSED_EVENT, AUTH_SHEET_EVENT } from '@/lib/auth/authSheet'

const wrap = (node: React.ReactElement) => render(
  <NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test">{node}</MantineProvider></NextIntlClientProvider>,
)

setViewport(1024)
const KEY = 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'
const saved = process.env[KEY]
beforeEach(() => { currentLocale = 'en'; turnstile.props = null; turnstile.reset.mockReset(); replace.mockReset(); refreshUser.mockReset(); sessionStorage.clear(); authStatus = 'unauthenticated' })
afterEach(() => { cleanup(); if (saved === undefined) delete process.env[KEY]; else process.env[KEY] = saved; vi.restoreAllMocks() })

describe('CaptchaWidget', () => {
  it('with a site key it shows the Turnstile widget with the key, invisible size, a name and the default theme', () => {
    process.env[KEY] = 'site-key-123'
    wrap(<CaptchaWidget onSuccess={vi.fn()} />)
    expect(screen.getByTestId('turnstile')).toBeInTheDocument()
    expect(turnstile.props).toMatchObject({ siteKey: 'site-key-123', 'aria-label': messages.auth.captcha_aria_label })
    expect(turnstile.props!.options).toEqual({ theme: 'auto', size: 'invisible', language: 'en' })
  })

  it.each([['en', 'en'], ['it', 'it'], ['uk', 'uk'], ['sq', 'auto'], ['xx', 'auto']])('the language %s asks Turnstile for %s', (locale, language) => {
    process.env[KEY] = 'k'
    currentLocale = locale
    wrap(<CaptchaWidget onSuccess={vi.fn()} />)
    expect(turnstile.props!.options!.language).toBe(language)
  })

  it('a chosen theme is passed on, and success, error and expiry callbacks reach the widget', () => {
    process.env[KEY] = 'k'
    const cb = { onSuccess: vi.fn(), onError: vi.fn(), onExpire: vi.fn() }
    wrap(<CaptchaWidget {...cb} theme="dark" />)
    expect(turnstile.props!.options!.theme).toBe('dark')
    turnstile.props!.onSuccess!('tok'); turnstile.props!.onError!('110100'); turnstile.props!.onExpire!('tok')
    expect(cb.onSuccess).toHaveBeenCalledWith('tok')
    expect(cb.onError).toHaveBeenCalledTimes(1)
    expect(cb.onExpire).toHaveBeenCalledTimes(1)
  })

  it('reset() from outside resets the widget', () => {
    process.env[KEY] = 'k'
    const ref = createRef<CaptchaWidgetHandle>()
    wrap(<CaptchaWidget ref={ref} onSuccess={vi.fn()} />)
    ref.current!.reset()
    expect(turnstile.reset).toHaveBeenCalledTimes(1)
  })

  it('with no site key it shows a visible note and reports the placeholder token once, and there is no widget', () => {
    delete process.env[KEY]
    const onSuccess = vi.fn()
    const { rerender } = wrap(<CaptchaWidget onSuccess={onSuccess} />)
    expect(screen.getByRole('note')).toHaveTextContent(messages.auth.captcha_not_configured)
    expect(screen.queryByTestId('turnstile')).toBeNull()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('dev-noop-token')
    rerender(<NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test"><CaptchaWidget onSuccess={onSuccess} /></MantineProvider></NextIntlClientProvider>)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('reset() without a widget does nothing', () => {
    delete process.env[KEY]
    const ref = createRef<CaptchaWidgetHandle>()
    wrap(<CaptchaWidget ref={ref} onSuccess={vi.fn()} />)
    expect(() => ref.current!.reset()).not.toThrow()
  })
})

describe('AuthRedirect', () => {
  type BridgeProps = Partial<React.ComponentProps<typeof AuthRedirect>>
  const tree = (props: BridgeProps) => (
    <NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test"><AuthRedirect view="login" {...props} /></MantineProvider></NextIntlClientProvider>
  )
  function mount(props: BridgeProps = {}) {
    const opened = vi.fn()
    window.addEventListener(AUTH_SHEET_EVENT, opened)
    const utils = wrap(<AuthRedirect view="login" {...props} />)
    /** the server's answer to the re-check of an `authenticated` status at mount (Task 923 R147): the status goes through `refreshing` to `to` */
    const answer = (to: string, again: BridgeProps = props) => {
      authStatus = 'refreshing'; utils.rerender(tree(again))
      authStatus = to; utils.rerender(tree(again))
    }
    return { ...utils, opened, answer, stop: () => window.removeEventListener(AUTH_SHEET_EVENT, opened) }
  }

  it('shows a polite loading spinner while it works', () => {
    const { stop } = mount()
    expect(screen.getByLabelText(messages.common.loading)).toBeInTheDocument()
    stop()
  })

  it.each(['initializing', 'refreshing'])('while the status is %s nothing is stored, opened or redirected', (status) => {
    authStatus = status
    const { opened, stop } = mount()
    expect(opened).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    stop()
  })

  it('an unauthenticated visitor: the destination is stored and the sheet opens once on the asked view', () => {
    const { opened, rerender, stop } = mount({ view: 'register' })
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/cabinet')
    expect(opened).toHaveBeenCalledTimes(1)
    expect(refreshUser).not.toHaveBeenCalled()
    expect((opened.mock.calls[0][0] as CustomEvent).detail).toEqual({ view: 'register' })
    rerender(<NextIntlClientProvider locale="en" messages={messages as never}><MantineProvider theme={theme} env="test"><AuthRedirect view="register" /></MantineProvider></NextIntlClientProvider>)
    expect(opened).toHaveBeenCalledTimes(1)
    expect(replace).not.toHaveBeenCalled()
    stop()
  })

  it('a guest on the sign-in view: the destination and the session-lost mark are stored, the sheet opens once, then the page is replaced by the language home', () => {
    const storedAtReplace: (string | null)[] = []
    replace.mockImplementationOnce(() => { storedAtReplace.push(sessionStorage.getItem(AUTH_NEXT_KEY), sessionStorage.getItem(AUTH_SESSION_LOST_KEY)) })
    const { opened, stop } = mount({ next: '/en/cabinet', sessionLost: true })
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/cabinet')
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBe('true')
    expect(opened).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/en')
    expect(storedAtReplace, 'the destination and the mark are stored before the replace').toEqual(['/en/cabinet', 'true'])
    expect(opened.mock.invocationCallOrder[0], 'the sheet opens before the replace').toBeLessThan(replace.mock.invocationCallOrder[0])
    stop()
  })

  it('a safe ?next= is the destination for login', () => {
    const { stop } = mount({ next: '/en/listings/create' })
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/listings/create')
    stop()
  })

  it.each([
    ['https://evil.example/x'], ['//evil.example/x'], ['/\\evil.example'], ['javascript:alert(1)'], ['data:text/html,x'], ['/en/../admin'],
    ['/en/%2e%2e/admin'], ['/a\nb'], ['evil'], [''], ['/en/x\t:y'],
  ])('an unsafe ?next=%j is dropped and the person goes to their own cabinet', (next) => {
    const { stop } = mount({ next })
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/cabinet')
    stop()
  })

  it('the cabinet fallback is under the person\'s language', () => {
    currentLocale = 'sq'
    const { stop } = mount()
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/sq/cabinet')
    stop()
  })

  it('the session-lost flag is set only when asked for', () => {
    const a = mount({ sessionLost: true })
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBe('true')
    a.stop(); cleanup(); sessionStorage.clear()
    const b = mount()
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBeNull()
    b.stop()
  })

  it('an authenticated status at mount is re-checked once and not acted on; nothing is stored, opened or redirected until the answer', () => {
    authStatus = 'authenticated'
    const { opened, stop } = mount({ next: '/en/favorites' })
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(replace).not.toHaveBeenCalled()
    expect(opened).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    stop()
  })

  it('an authenticated person is sent on to the destination and the stored one is cleared; no sheet opens', () => {
    authStatus = 'authenticated'
    sessionStorage.setItem(AUTH_NEXT_KEY, '/old')
    const { opened, answer, stop } = mount({ next: '/en/favorites' })
    answer('authenticated')
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/en/favorites')
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    expect(opened).not.toHaveBeenCalled()
    stop()
  })

  it('an authenticated person with an unsafe next goes to the cabinet, never to the address', () => {
    authStatus = 'authenticated'
    const { answer, stop } = mount({ next: 'https://evil.example' })
    answer('authenticated')
    expect(replace).toHaveBeenCalledWith('/en/cabinet')
    stop()
  })

  it('a tab whose account the server refused lands on the language home with the sheet open, never on the destination', () => {
    authStatus = 'authenticated'
    const { opened, answer, stop } = mount({ next: '/en/favorites', sessionLost: true })
    answer('unauthenticated')
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/en')
    expect(opened).toHaveBeenCalledTimes(1)
    expect(opened.mock.invocationCallOrder[0], 'the sheet opens before the replace').toBeLessThan(replace.mock.invocationCallOrder[0])
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/favorites')
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBe('true')
    stop()
  })

  it.each(['error', 'signing_out'])('any other answer than authenticated (%s) to the re-check opens the sheet and lands on the language home', (status) => {
    authStatus = 'authenticated'
    const { opened, answer, stop } = mount()
    answer(status)
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/en')
    expect(opened).toHaveBeenCalledTimes(1)
    stop()
  })

  it('a sign-in inside the sheet after the re-check still sends the person on', () => {
    authStatus = 'authenticated'
    const { answer, rerender, stop } = mount({ next: '/en/favorites' })
    answer('unauthenticated')
    authStatus = 'refreshing'; rerender(tree({ next: '/en/favorites' }))
    authStatus = 'authenticated'; rerender(tree({ next: '/en/favorites' }))
    expect(refreshUser).toHaveBeenCalledTimes(1)
    expect(replace.mock.calls).toEqual([['/en'], ['/en/favorites']])
    stop()
  })

  it('a status that is only refreshing at mount is not re-checked again: its answer is acted on as before', () => {
    authStatus = 'refreshing'
    const { answer, stop } = mount({ next: '/en/favorites' })
    answer('authenticated')
    expect(refreshUser).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/en/favorites')
    stop()
  })

  it('closing the sheet without signing in goes to the language home (never the gated cabinet) and clears the stored destination', () => {
    const { stop } = mount()
    replace.mockClear()                                                   // the mount already replaced the page by the language home (Task 923 R158): only the close is under test
    act(() => { window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT)) })
    expect(replace).toHaveBeenCalledWith('/en')
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBeNull()
    stop()
  })

  it('closing the sheet goes to the language home even with a safe ?next=', () => {
    const { stop } = mount({ next: '/en/listings' })
    replace.mockClear()                                                   // the mount already replaced the page by the language home (Task 923 R158): only the close is under test
    act(() => { window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT)) })
    expect(replace).toHaveBeenCalledWith('/en')
    expect(replace).not.toHaveBeenCalledWith('/en/listings')
    stop()
  })

  it('a close that comes after a successful sign-in is left to the status watcher (one redirect, to the login destination)', () => {
    authStatus = 'authenticated'
    const { answer, stop } = mount()
    answer('authenticated')
    expect(replace).toHaveBeenCalledTimes(1)
    replace.mockClear()
    act(() => { window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT)) })
    expect(replace).not.toHaveBeenCalled()
    stop()
  })

  it('after it is gone, a sheet-closed event does nothing', () => {
    const { unmount, stop } = mount()
    replace.mockClear()                                                   // the mount already replaced the page by the language home (Task 923 R158)
    unmount()
    act(() => { window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT)) })
    expect(replace).not.toHaveBeenCalled()
    stop()
  })
})

describe('AuthContext', () => {
  async function load() {
    vi.resetModules()
    return import('@/modules/auth/context/AuthContext')
  }
  const USER = { id: 'u1', name: 'Alba', role: 'user' } as never

  it('without a provider the defaults say "initializing" and nothing is signed in', async () => {
    const { useAuth } = await load()
    const { result } = renderHook(() => useAuth())
    expect(result.current).toMatchObject({ user: null, status: 'initializing', loading: true, isSigningOut: false })
    expect(() => result.current.signOut()).not.toThrow()
    expect(() => result.current.refreshUser()).not.toThrow()
  })

  it('the provider starts from the server\'s answer: a user is authenticated, no user is unauthenticated, neither is loading', async () => {
    const { AuthProvider, useAuth } = await load()
    const a = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider initialUser={USER}>{children}</AuthProvider> })
    expect(a.result.current).toMatchObject({ user: USER, status: 'authenticated', loading: false })
    const b = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider initialUser={null}>{children}</AuthProvider> })
    expect(b.result.current).toMatchObject({ user: null, status: 'unauthenticated', loading: false })
  })

  it('stops listening to the auth service when the provider goes away', async () => {
    const { AuthProvider, useAuth } = await load()
    browser.unsubscribe.mockClear()
    const { unmount } = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider initialUser={null}>{children}</AuthProvider> })
    unmount()
    expect(browser.unsubscribe).toHaveBeenCalled()
  })

  it('signOut signs out first and only then runs the navigation, and the flag is on while it works', async () => {
    const { AuthProvider, useAuth } = await load()
    let release!: () => void
    browser.signOut.mockImplementation(() => new Promise((r) => { release = () => r({ error: null }) }))
    const order: string[] = []
    const { result } = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider initialUser={USER}>{children}</AuthProvider> })
    act(() => { result.current.signOut(() => order.push('navigate')) })
    expect(result.current.isSigningOut).toBe(true)
    expect(order).toEqual([])
    await act(async () => { release(); await Promise.resolve(); await Promise.resolve() })
    expect(order).toEqual(['navigate'])
    expect(result.current.isSigningOut).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('signOut with no navigation callback still signs out', async () => {
    const { AuthProvider, useAuth } = await load()
    browser.signOut.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider initialUser={USER}>{children}</AuthProvider> })
    await act(async () => { result.current.signOut(); await Promise.resolve(); await Promise.resolve() })
    expect(browser.signOut).toHaveBeenCalled()
    expect(result.current.status).not.toBe('authenticated')
  })

  it('useUser is the same value as useAuth', async () => {
    const { AuthProvider } = await load()
    const { useUser } = await vi.importActual<typeof import('@/modules/auth/hooks/useUser')>('@/modules/auth/hooks/useUser')
    const { result } = renderHook(() => useUser(), { wrapper: ({ children }) => <AuthProvider initialUser={USER}>{children}</AuthProvider> })
    expect(result.current.user).toBe(USER)
  })
})
