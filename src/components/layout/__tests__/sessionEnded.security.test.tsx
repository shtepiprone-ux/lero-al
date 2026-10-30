/**
 * Task 923 R45 (owner decision D29): what the page shows once the server has ended a session. The server removes a refused session in `refreshSession` and the locale
 * layout then resolves NO user, so the real `Header` container is mounted under the real `AuthProvider` with `initialUser = null`: a guest is offered sign-in and
 * register and no personal entry. The control mounts the same tree for an active person and shows the personal entries as today. Only the external I/O boundary is
 * a double (the browser auth client, the router, and the container-owned slots), as in `Header.signOut.test.tsx`.
 */
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '../Header'
import type { User } from '@/types/database'

vi.mock('@/lib/auth/browser', () => ({
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signOut: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/listings/abc-123',
}))
vi.mock('@/modules/notifications/components/NotificationBell', () => ({ NotificationBell: () => null }))
vi.mock('@/modules/auth/components/AuthSheet', () => ({ AuthSheet: () => null }))
vi.mock('@/modules/admin/actions/locale', () => ({ setAdminLocale: vi.fn() }))

const ACTIVE_USER: User = {
  id: 'session-ended-user-1', public_id: 1, name: 'Dritan Gjoka', last_name: null, phone: null, whatsapp: null, avatar_url: null, role: 'user', user_type: 'private',
  status: 'active', block_reason: null, suspended_until: null, company_name: null, company_logo_url: null, website: null, is_verified: false, social_provider: null,
  location_id: null, position: null, year_started: null, deleted_at: null, location_request: null, preferred_currency: 'ALL' as const, pending_email: null, last_seen_at: null,
  inactivity_warning_sent_at: null, company_id: null, preferred_locale: 'sq', created_at: '2026-01-01T00:00:00.000Z',
}

const MESSAGES = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>

function renderHeader(initialUser: User | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <MantineProvider theme={theme} env="test">
        <AuthProvider initialUser={initialUser}>
          <Header />
        </AuthProvider>
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('[SEC-D29-FE-DENY] After the server ends the session the header offers sign-in and no personal entry', () => {
  renderHeader(null)
  expect(screen.getAllByRole('button', { name: 'Login' }).length).toBeGreaterThan(0)
  expect(screen.getAllByRole('button', { name: 'Register' }).length).toBeGreaterThan(0)
  expect(screen.queryByRole('link', { name: /favorites/i })).toBeNull()                  // no favorites link
  expect(screen.queryByRole('button', { name: /Dritan Gjoka/ })).toBeNull()              // no user menu
  expect(screen.queryByText('Logout')).toBeNull()
  expect(screen.queryByRole('link', { name: /cabinet|admin/i })).toBeNull()              // no cabinet or admin entry
  expect(screen.queryByRole('menuitem')).toBeNull()
})

it('[SEC-D29-FE-ALLOW] After the server ends the session the header offers sign-in and no personal entry', () => {
  renderHeader(ACTIVE_USER)
  expect(screen.getAllByRole('button', { name: /Dritan Gjoka/ }).length).toBeGreaterThan(0)   // the user menu renders as today
  expect(screen.getAllByRole('link', { name: 'Favorites' }).length).toBeGreaterThan(0)         // and the favorites link
  expect(screen.queryByRole('button', { name: 'Login' })).toBeNull()                            // the active person is not shown as a guest
  fireEvent.click(screen.getAllByRole('button', { name: /Dritan Gjoka/ })[0])
  expect(screen.queryAllByRole('menuitem').length).toBeGreaterThan(0)
})
