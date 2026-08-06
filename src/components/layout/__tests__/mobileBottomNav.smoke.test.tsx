/**
 * MobileBottomNav Mantine migration smoke (Task 672).
 *
 * `MobileBottomNav.tsx` was split into a hook-owning container (unchanged predicates) and a
 * prop-driven `MobileBottomNavView.tsx` (shadcn `Button` → Mantine `UnstyledButton`, raw `<nav>` →
 * `Box component="nav" hiddenFrom="md"`). This covers the two highest-risk behaviors named in the
 * kickoff §3.8: (a) both guest entry points into the P0 login flow still dispatch the real
 * `lero:open-auth-sheet` window event with `detail.view === 'login'`, proven on both the View
 * (direct click spy) and the container (real `openAuthSheet` + a real window listener); and
 * (b) the container's root genuinely carries the Mantine-emitted `mantine-hidden-from-md` class,
 * not just the `hiddenFrom` prop being passed.
 *
 * Registry: docs/critical-flow-registry.md has no row for MobileBottomNav — this test is an
 * orchestrator-chosen safeguard for a P0 flow entry point being rewritten, not a claimed
 * registry-membership obligation (kickoff §3.8/§13.1).
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { MobileBottomNavView } from '@/components/layout/MobileBottomNavView'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { AUTH_SHEET_EVENT } from '@/lib/auth/authSheet'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}))

vi.mock('@/modules/auth/hooks/useUser', () => ({
  useUser: () => ({ user: null }),
}))

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

afterEach(() => {
  cleanup()
})

function withProviders(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

const ACTIVE = { home: true, listings: false, add: false, favorites: false, profile: false }

describe('MobileBottomNav — guest auth-sheet dispatch (AC10a)', () => {
  it('(a) the View: clicking Favorites then Profile fires onRequireAuth once per click', () => {
    const onRequireAuth = vi.fn()
    render(
      withProviders(
        <MobileBottomNavView
          isAuthenticated={false}
          locale="en"
          active={ACTIVE}
          onRequireAuth={onRequireAuth}
        />,
      ),
    )
    fireEvent.click(screen.getByText('Favorites').closest('button')!)
    expect(onRequireAuth).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Login').closest('button')!)
    expect(onRequireAuth).toHaveBeenCalledTimes(2)
  })

  it('(a) the container: clicking a guest control dispatches lero:open-auth-sheet with detail.view === "login"', () => {
    const handler = vi.fn()
    window.addEventListener(AUTH_SHEET_EVENT, handler)
    render(withProviders(<MobileBottomNav />))
    fireEvent.click(screen.getByText('Favorites').closest('button')!)
    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as CustomEvent<{ view: string }>
    expect(event.detail.view).toBe('login')
    window.removeEventListener(AUTH_SHEET_EVENT, handler)
  })
})

describe('MobileBottomNav — viewport hide mechanism (AC10b)', () => {
  it('(b) the container root carries the Mantine-emitted mantine-hidden-from-md class', () => {
    const { container } = render(withProviders(<MobileBottomNav />))
    const nav = container.querySelector('nav.mobile-bottom-nav')!
    expect(nav).toBeTruthy()
    expect(nav.className).toContain('mantine-hidden-from-md')
  })
})
