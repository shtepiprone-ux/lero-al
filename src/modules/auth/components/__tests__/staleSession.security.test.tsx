/**
 * Task 923 R147 (owner decision D29, F18): an open tab whose account the server refused. The tab keeps the state it was given when the page first loaded, so after the
 * server ended the session (a deleted, banned or deactivated account) it still looked signed in: the header showed the person, and "My cabinet" sent the request to the
 * sign-in page, which sent the stale `authenticated` status straight back to the cabinet, without end. SEC-D29-FE-DENY proves only a page loaded after the session ended.
 *
 * The real `AuthProvider`, `AuthController`, `AuthRedirect` and `Header` run. Only the external I/O boundary is a double: the browser auth client, the router (with a
 * pathname the test moves), `fetch('/api/auth/me')`, and the sheet (the window event the bridge dispatches; the sheet component itself), as in `sessionEnded.security.test.tsx`.
 */
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { AuthProvider, useAuth } from '@/modules/auth/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { AUTH_NEXT_KEY, AUTH_SESSION_LOST_KEY, AuthRedirect } from '../AuthRedirect'
import { AUTH_SHEET_EVENT } from '@/lib/auth/authSheet'
import type { User } from '@/types/database'

const boundary = vi.hoisted(() => ({
  coreSignOut: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  nav: { pathname: '/en/listings/abc-123' },
}))

vi.mock('@/lib/auth/browser', () => ({
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signOut: boundary.coreSignOut,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: boundary.replace, push: boundary.push, refresh: boundary.refresh }),
  usePathname: () => boundary.nav.pathname,
}))
vi.mock('@/modules/notifications/components/NotificationBell', () => ({ NotificationBell: () => null }))
vi.mock('@/modules/auth/components/AuthSheet', () => ({ AuthSheet: () => null }))
vi.mock('@/modules/admin/actions/locale', () => ({ setAdminLocale: vi.fn() }))

const ACTIVE_USER: User = {
  id: 'stale-session-user-1', public_id: 1, name: 'Dritan Gjoka', last_name: null, phone: null, whatsapp: null, avatar_url: null, role: 'user', user_type: 'private',
  status: 'active', block_reason: null, suspended_until: null, company_name: null, company_logo_url: null, website: null, is_verified: false, social_provider: null,
  location_id: null, position: null, year_started: null, deleted_at: null, location_request: null, preferred_currency: 'ALL' as const, pending_email: null, last_seen_at: null,
  inactivity_warning_sent_at: null, company_id: null, preferred_locale: 'sq', created_at: '2026-01-01T00:00:00.000Z',
}

const MESSAGES = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>
const T0 = new Date('2026-10-24T12:00:00.000Z').getTime()
const HEADER_PATH = '/en/listings/abc-123'

/** what `/api/auth/me` answers; the server's view of the person right now */
let serverUser: User | null = null
const fetchMock = vi.fn()
const meCalls = () => fetchMock.mock.calls.filter(([url]) => url === '/api/auth/me').length

function Status() {
  return <output data-testid="status">{useAuth().status}</output>
}

function tree(initialUser: User | null, children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <MantineProvider theme={theme} env="test">
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

const bridge = <><Status /><AuthRedirect view="login" next="/en/cabinet" sessionLost /></>
const header = <Header />

/** the pathname the router double reports changes; the provider reads it on its next render */
function navigateTo(view: ReturnType<typeof render>, initialUser: User | null, children: React.ReactNode, pathname: string) {
  boundary.nav.pathname = pathname
  view.rerender(tree(initialUser, children))
}

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** a browser's fetch (C1437): an aborted request rejects with an `AbortError`, and a request resolves only if it was not aborted */
function browserFetch(_url: string, init?: RequestInit) {
  const signal = init?.signal
  const abortError = () => Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    signal?.addEventListener('abort', () => reject(abortError()), { once: true })
    setTimeout(() => {
      if (!signal?.aborted) resolve({ ok: true, json: async () => ({ user: serverUser }) })
    }, 0)
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  fetchMock.mockReset()
  fetchMock.mockImplementation(browserFetch)
  vi.stubGlobal('fetch', fetchMock)
  boundary.coreSignOut.mockReset()
  boundary.coreSignOut.mockResolvedValue({ error: null })
  boundary.replace.mockReset()
  boundary.nav.pathname = HEADER_PATH
  sessionStorage.clear()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

it('[SEC-D29-FE-STALE-DENY] An open tab whose account the server refused becomes a guest and is never sent back from the sign-in page', async () => {
  // (i) the sign-in page in a tab that was signed in: the server found no viewer, and refuses the account when asked again
  serverUser = null
  const opened = vi.fn()
  window.addEventListener(AUTH_SHEET_EVENT, opened)
  try {
    render(tree(ACTIVE_USER, bridge))
    expect(boundary.replace).not.toHaveBeenCalled()                        // the stale status at mount is never acted on
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    expect(meCalls()).toBe(1)
    expect(boundary.replace).toHaveBeenCalledTimes(1)                      // on the answer the page is replaced by the language home (Task 923 R158), once, after the sheet opened
    expect(boundary.replace).toHaveBeenCalledWith('/en')
    expect(boundary.replace).not.toHaveBeenCalledWith('/en/cabinet')       // never the destination
    expect(opened.mock.invocationCallOrder[0]).toBeLessThan(boundary.replace.mock.invocationCallOrder[0])
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBe('true')
    expect(sessionStorage.getItem(AUTH_NEXT_KEY)).toBe('/en/cabinet')
    expect(boundary.coreSignOut).toHaveBeenCalledWith('local')             // the browser's session is removed
    await settle()
    expect(opened).toHaveBeenCalledTimes(1)                                // once
    expect(boundary.replace).toHaveBeenCalledTimes(1)
    expect(boundary.replace).not.toHaveBeenCalledWith('/en/cabinet')
  } finally {
    window.removeEventListener(AUTH_SHEET_EVENT, opened)
  }
  cleanup()
  sessionStorage.clear()
  fetchMock.mockClear()

  // (ii) an open tab on a page: 30 s or more later a client navigation re-checks it, and the header is a guest's
  const view = render(tree(ACTIVE_USER, header))
  expect(screen.getAllByRole('button', { name: /Dritan Gjoka/ }).length).toBeGreaterThan(0)   // signed in as the page was loaded
  expect(meCalls()).toBe(0)                                                                    // mounting asks nothing
  vi.setSystemTime(T0 + 30_000)
  navigateTo(view, ACTIVE_USER, header, '/en/listings/xyz-9')
  await waitFor(() => expect(screen.queryByRole('button', { name: /Dritan Gjoka/ })).toBeNull())
  expect(meCalls()).toBe(1)
  expect(screen.getAllByRole('button', { name: 'Login' }).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('button', { name: 'Register' }).length).toBeGreaterThan(0)
  expect(screen.queryByRole('link', { name: /favorites/i })).toBeNull()                       // no favorites link
  expect(screen.queryByText('Logout')).toBeNull()
  expect(screen.queryByRole('menuitem')).toBeNull()
  cleanup()
  sessionStorage.clear()
  fetchMock.mockClear()
  boundary.coreSignOut.mockClear()
  boundary.replace.mockClear()                                                                  // the replace of (i) is not (iii)'s

  // (iii) a full load under React Strict Mode at the root, as Next.js runs development (C1421): every effect mounts, cleans up and mounts again, and the cleanup aborts the
  // re-check in flight; the controller starts it again (R148), so the bridge still gets its answer: the server refuses the account, the sheet opens once, nobody is sent on
  serverUser = null
  const strictOpened = vi.fn()
  window.addEventListener(AUTH_SHEET_EVENT, strictOpened)
  try {
    render(<React.StrictMode>{tree(ACTIVE_USER, bridge)}</React.StrictMode>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await waitFor(() => expect(strictOpened).toHaveBeenCalledTimes(1))
    await settle()
    expect(strictOpened).toHaveBeenCalledTimes(1)
    expect(boundary.replace).toHaveBeenCalledTimes(1)                      // the language home, once, after the sheet opened (Task 923 R158)
    expect(boundary.replace).toHaveBeenCalledWith('/en')
    expect(boundary.replace).not.toHaveBeenCalledWith('/en/cabinet')
    expect(strictOpened.mock.invocationCallOrder[0]).toBeLessThan(boundary.replace.mock.invocationCallOrder[0])
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBe('true')
    expect(boundary.coreSignOut).toHaveBeenCalledWith('local')
  } finally {
    window.removeEventListener(AUTH_SHEET_EVENT, strictOpened)
  }
})

it('[SEC-D29-FE-STALE-ALLOW] An open tab whose account the server refused becomes a guest and is never sent back from the sign-in page', async () => {
  // (i) the same tab, the server still knows an active person (signed in again in another tab): the bridge sends them on, once, and no sheet opens
  serverUser = ACTIVE_USER
  const opened = vi.fn()
  window.addEventListener(AUTH_SHEET_EVENT, opened)
  try {
    render(tree(ACTIVE_USER, bridge))
    await waitFor(() => expect(boundary.replace).toHaveBeenCalledTimes(1))
    expect(boundary.replace).toHaveBeenCalledWith('/en/cabinet')
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(meCalls()).toBe(1)
    await settle()
    expect(boundary.replace).toHaveBeenCalledTimes(1)
    expect(opened).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(AUTH_SESSION_LOST_KEY)).toBeNull()
    expect(boundary.coreSignOut).not.toHaveBeenCalled()
  } finally {
    window.removeEventListener(AUTH_SHEET_EVENT, opened)
  }
  cleanup()
  fetchMock.mockClear()

  // (ii) two navigations of an active person within 30 s ask the server once; the person stays signed in
  const view = render(tree(ACTIVE_USER, header))
  navigateTo(view, ACTIVE_USER, header, '/en/listings/xyz-9')
  await waitFor(() => expect(meCalls()).toBe(1))
  await settle()
  vi.setSystemTime(T0 + 10_000)
  navigateTo(view, ACTIVE_USER, header, '/en/listings/xyz-10')
  await settle()
  expect(meCalls()).toBe(1)
  expect(screen.getAllByRole('button', { name: /Dritan Gjoka/ }).length).toBeGreaterThan(0)
  expect(screen.queryByRole('button', { name: 'Login' })).toBeNull()
  cleanup()
  fetchMock.mockClear()

  // a guest has nothing to confirm: a navigation fetches nothing
  const guest = render(tree(null, header))
  vi.setSystemTime(T0 + 60_000)
  navigateTo(guest, null, header, '/en/listings/xyz-11')
  await settle()
  expect(meCalls()).toBe(0)
  expect(screen.getAllByRole('button', { name: 'Login' }).length).toBeGreaterThan(0)
  cleanup()
  fetchMock.mockClear()
  boundary.replace.mockClear()
  sessionStorage.clear()

  // (iii) a full load under React Strict Mode at the root, as Next.js runs development (C1421): the cleanup aborts the re-check in flight and the controller starts it
  // again (R148); the server still knows an active person, so the bridge sends them on once, the sheet does not open and the status is authenticated
  serverUser = ACTIVE_USER
  const strictOpened = vi.fn()
  window.addEventListener(AUTH_SHEET_EVENT, strictOpened)
  try {
    render(<React.StrictMode>{tree(ACTIVE_USER, bridge)}</React.StrictMode>)
    await waitFor(() => expect(boundary.replace).toHaveBeenCalledTimes(1))
    expect(boundary.replace).toHaveBeenCalledWith('/en/cabinet')
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    await settle()
    expect(boundary.replace).toHaveBeenCalledTimes(1)
    expect(strictOpened).not.toHaveBeenCalled()
    expect(boundary.coreSignOut).not.toHaveBeenCalled()
  } finally {
    window.removeEventListener(AUTH_SHEET_EVENT, strictOpened)
  }
})
