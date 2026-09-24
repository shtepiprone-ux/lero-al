/**
 * Header.signOut — pending state end-to-end through the real Header container (Task 876, T2).
 *
 * Renders the real `Header` (container) inside the real `AuthProvider` (MOCK_USER), matching the
 * `header-hydration-id-parity.test.tsx` house pattern (NextIntlClientProvider + MantineProvider
 * env="test", F11). Only the external-I/O boundary is mocked, same convention as
 * `AuthContext.test.tsx`:
 *   - `@/lib/auth/browser` — `signOut` (coreSignOut) controlled via a deferred promise so the
 *     pending window can be observed; `onAuthStateChange` stubbed to a no-op subscription.
 *   - `next/navigation` — `useRouter`/`usePathname`, so the 872 classifier (real, unmocked) sees a
 *     public listing path and the real `push`/`refresh` calls can be asserted.
 *   - `NotificationBell`, `AuthSheet`, `@/modules/admin/actions/locale` — container-owned
 *     slots/actions with their own hooks/network/cookies, stubbed per the kickoff (§10.3 T2).
 * Everything else — HeaderView, UserMenu, HeaderActions, LocaleSwitcher, MobileNavDrawer,
 * MantineDropdownMenu — is the real production tree.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '../Header'
import type { User } from '@/types/database'

// ── External boundary mocks ────────────────────────────────────────────────────

const { mockCoreSignOut, mockUnsubscribe } = vi.hoisted(() => ({
  mockCoreSignOut: vi.fn(),
  mockUnsubscribe: vi.fn(),
}))

vi.mock('@/lib/auth/browser', () => ({
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: mockUnsubscribe } } }),
  signOut: mockCoreSignOut,
}))

const pushMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/en/listings/abc-123',
}))

vi.mock('@/modules/notifications/components/NotificationBell', () => ({
  NotificationBell: () => null,
}))
vi.mock('@/modules/auth/components/AuthSheet', () => ({
  AuthSheet: () => null,
}))
vi.mock('@/modules/admin/actions/locale', () => ({
  setAdminLocale: vi.fn(),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'header-signout-user-1',
  public_id: 1,
  name: 'Dritan Gjoka',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
  suspended_until: null,
  company_name: null,
  company_logo_url: null,
  website: null,
  is_verified: false,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'ALL' as const,
  pending_email: null,
  last_seen_at: null,
  inactivity_warning_sent_at: null,
  company_id: null,
  preferred_locale: 'sq',
  created_at: '2026-01-01T00:00:00.000Z',
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function loadMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}
const MESSAGES = loadMessages('en')

function renderHeader() {
  return render(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <MantineProvider theme={theme} env="test">
        <AuthProvider initialUser={MOCK_USER}>
          <Header />
        </AuthProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  stubMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Header sign-out pending state (Task 876)', () => {
  it('holds the header and shows loading on both controls while pending, then switches together on the public path (872)', async () => {
    let resolveCoreSignOut!: (r: { error: null }) => void
    mockCoreSignOut.mockImplementation(
      () => new Promise(resolve => { resolveCoreSignOut = resolve })
    )

    renderHeader()

    // Desktop UserMenu trigger — the button's accessible name includes the user's name text.
    const trigger = screen.getByRole('button', { name: /Dritan Gjoka/ })
    await act(async () => {
      fireEvent.click(trigger)
    })

    const logoutItem = await screen.findByText('Logout')
    await act(async () => {
      fireEvent.click(logoutItem)
    })

    // ── While coreSignOut is pending ──────────────────────────────────────────
    expect(screen.getByText('Dritan Gjoka')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dritan Gjoka/ })).toHaveAttribute('data-loading')
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('data-loading')
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument()

    // ── Resolve coreSignOut → the re-entrant transition runs navigate() → 872's
    //    classifier resolves the public listing path to `null` → router.refresh() ──
    await act(async () => {
      resolveCoreSignOut({ error: null })
      await new Promise(r => setTimeout(r, 0))
    })

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
    expect(pushMock).not.toHaveBeenCalled()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    )
    expect(screen.queryByRole('button', { name: /Dritan Gjoka/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toHaveAttribute('data-loading')
  })
})
