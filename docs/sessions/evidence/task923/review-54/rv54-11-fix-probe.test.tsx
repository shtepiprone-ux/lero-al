/* eslint-disable */
// @ts-nocheck
/** Review 54 probe rv54-11: rv54-05 with the proposed R148 mount() patched in, test-only (the product file is unchanged). Was rv54-05: root StrictMode (Next dev default), an abort-honouring fetch; the bridge mounted by a client navigation
 * into an already mounted AuthProvider (F18), and the bridge mounted on a full load with a signed-in initial state (/auth/register).
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
import { AUTH_NEXT_KEY, AUTH_SESSION_LOST_KEY, AuthRedirect } from '@/modules/auth/components/AuthRedirect'
import { AUTH_SHEET_EVENT } from '@/lib/auth/authSheet'
import type { User } from '@/types/database'
import { AuthController } from '@/lib/auth/controller'
const origMount = AuthController.prototype.mount
AuthController.prototype.mount = function () { const off = origMount.call(this); if (this.state.status === 'refreshing' && this.inflight === null) this.syncFromServer(); return off }

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
  const st = useAuth().status; React.useEffect(() => { (globalThis.__ev ||= []).push('status:' + st); return () => { (globalThis.__ev ||= []).push('cleanup:' + st) } }, [st]); React.useEffect(() => { (globalThis.__ev ||= []).push('once'); return () => { (globalThis.__ev ||= []).push('once-cleanup') } }, [])
  return <output data-testid="status">{useAuth().status}</output>
}

function tree(initialUser: User | null, children: React.ReactNode) {
  return (
    <React.StrictMode><NextIntlClientProvider locale="en" messages={MESSAGES}>
      <MantineProvider theme={theme} env="test">
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </MantineProvider>
    </NextIntlClientProvider></React.StrictMode>
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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  fetchMock.mockReset()
  fetchMock.mockImplementation((url, init) => new Promise((resolve, reject) => { const sig = init && init.signal; (globalThis.__ev ||= []).push('fetch'); if (sig) sig.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; (globalThis.__ev ||= []).push('abort'); reject(e) }); setTimeout(() => { if (sig && sig.aborted) return; resolve({ ok: true, json: async () => ({ user: serverUser }) }) }, 5) }))
  vi.stubGlobal('fetch', fetchMock)
  boundary.coreSignOut.mockReset()
  boundary.coreSignOut.mockResolvedValue({ error: null })
  boundary.replace.mockReset()
  boundary.nav.pathname = HEADER_PATH
  sessionStorage.clear()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })


const ev = () => (globalThis as any).__ev as string[]
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
function shell(withBridge: boolean) { return <><Status />{withBridge ? <AuthRedirect view="login" next="/en/cabinet" sessionLost /> : null}</> }

for (const offset of [5_000, 40_000]) {
  it('client navigation into the sign-in page, ' + offset + ' ms after load, server refuses', async () => {
    ;(globalThis as any).__ev = []
    serverUser = null
    const opened = vi.fn(); window.addEventListener(AUTH_SHEET_EVENT, opened)
    const view = render(tree(ACTIVE_USER, shell(false)))
    await wait(20)
    vi.setSystemTime(T0 + offset)
    boundary.nav.pathname = '/en/auth/login'
    view.rerender(tree(ACTIVE_USER, shell(true)))
    await wait(100)
    window.removeEventListener(AUTH_SHEET_EVENT, opened)
    expect({ opened: opened.mock.calls.length, replace: boundary.replace.mock.calls.length, me: meCalls(), status: screen.getByTestId('status').textContent })
      .toEqual({ opened: 1, replace: 0, me: 1, status: 'unauthenticated' })
  })
}

it('full load of the bridge with a signed-in initial state (as /auth/register), server confirms', async () => {
  ;(globalThis as any).__ev = []
  serverUser = ACTIVE_USER
  render(tree(ACTIVE_USER, shell(true)))
  await wait(150)
  expect({ replace: boundary.replace.mock.calls, me: meCalls(), status: screen.getByTestId('status').textContent })
    .toEqual({ replace: [['/en/cabinet']], me: 2, status: 'authenticated' })
})

it('full load of the bridge with a signed-in initial state, server refuses', async () => {
  ;(globalThis as any).__ev = []
  serverUser = null
  const opened = vi.fn(); window.addEventListener(AUTH_SHEET_EVENT, opened)
  render(tree(ACTIVE_USER, shell(true)))
  await wait(150)
  window.removeEventListener(AUTH_SHEET_EVENT, opened)
  expect({ opened: opened.mock.calls.length, replace: boundary.replace.mock.calls.length, me: meCalls(), status: screen.getByTestId('status').textContent })
    .toEqual({ opened: 1, replace: 0, me: 2, status: 'unauthenticated' })
})
