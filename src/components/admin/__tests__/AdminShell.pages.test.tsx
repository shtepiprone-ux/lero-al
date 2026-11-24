/**
 * Task 1007 AC5 (the shell half) — `AdminShell` hands `allowedPaths` to the sidebar it renders.
 * The real shell, the real sidebar and the real header run; the presence and freshness hooks, the locale switcher and the sign-out are doubles.
 * `AdminSidebar.pages.test.tsx` renders the sidebar alone: only this test fails when the shell stops passing the list on.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { ADMIN_PAGES } from '@/lib/auth/adminPages'
import { AdminShell } from '../AdminShell'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))
vi.mock('@/hooks/usePresence', () => ({ usePresence: () => undefined }))
vi.mock('@/hooks/useAdminPageFreshness', () => ({ useAdminPageFreshness: () => undefined }))
vi.mock('@/lib/auth/browser', () => ({ signOut: async () => undefined }))
vi.mock('@/components/admin/AdminLocaleSwitcher', () => ({ AdminLocaleSwitcher: () => null }))

const t = messages.admin.sidebar
const labelOf = (labelKey: string) => t[labelKey as keyof typeof t]
const ALL_ITEMS = [...ADMIN_PAGES.map((p) => labelOf(p.labelKey)), t.item_footer, t.item_permissions]

function renderShell(allowedPaths?: readonly string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminShell siteName="Lero.al" allowedPaths={allowedPaths}>
          <p>page body</p>
        </AdminShell>
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

const itemLink = (name: string) => screen.queryByRole('link', { name })

beforeEach(() => {
  // Mantine's ScrollArea (the sidebar's scroll container) observes its size; jsdom has no ResizeObserver
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

describe('AdminShell — allowedPaths (Task 1007)', () => {
  it('the sidebar of the shell shows only the allowed item, and never Permissions or Footer', () => {
    renderShell(['/admin/listings'])
    expect(screen.getByText('page body')).toBeTruthy()
    expect(itemLink(t.item_listings)).toBeTruthy()
    for (const hidden of ALL_ITEMS.filter((label) => label !== t.item_listings)) expect(itemLink(hidden), `${hidden} is hidden`).toBeNull()
  })

  it('an empty list shows no item in the shell (a failed key read)', () => {
    renderShell([])
    for (const label of ALL_ITEMS) expect(itemLink(label), `${label} is hidden`).toBeNull()
  })

  it('a shell given no list shows every item (the Stories)', () => {
    renderShell()
    for (const label of ALL_ITEMS) expect(itemLink(label), label).toBeTruthy()
  })
})
