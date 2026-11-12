/**
 * Task 965 (AC1) — the cabinet hands the server's `now` to the two tabs that print a relative time (the listings and the saved searches), so the server render and
 * the browser's first render of a row only seconds old print the same text. The tabs are doubles here: what is read is the prop the shell gives them.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'

let tab = 'listings'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/sq/cabinet',
  useSearchParams: () => new URLSearchParams(`tab=${tab}`),
}))
vi.mock('@/hooks/usePresence', () => ({ usePresence: () => {} }))
vi.mock('@/modules/cabinet/components/ProfileTab', () => ({ ProfileTab: () => <div data-testid="profile-tab" /> }))
vi.mock('@/modules/cabinet/components/ListingsTab', () => ({ ListingsTab: (props: { now?: string }) => <div data-testid="listings-tab" data-now={props.now} /> }))
vi.mock('@/modules/cabinet/components/SavedSearchesTab', () => ({ SavedSearchesTab: (props: { now?: string }) => <div data-testid="searches-tab" data-now={props.now} /> }))

import { CabinetShell } from '../CabinetShell'

const NOW = '2026-11-12T10:00:29.800Z'

function renderShell() {
  render(
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} env="test">
        <CabinetShell
          profile={null}
          listings={[]}
          savedSearches={[]}
          initialTab="profile"
          initialFilter="ALL"
          initialPremium={false}
          locale="sq"
          cities={[]}
          regions={[]}
          userId="user-1"
          now={NOW}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  tab = 'listings'
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

afterEach(() => { vi.unstubAllGlobals() })

describe('CabinetShell — the server now', () => {
  it('the listings tab gets it', () => {
    renderShell()
    expect(screen.getByTestId('listings-tab')).toHaveAttribute('data-now', NOW)
  })

  it('the saved searches tab gets it', () => {
    tab = 'searches'
    renderShell()
    expect(screen.getByTestId('searches-tab')).toHaveAttribute('data-now', NOW)
  })
})
