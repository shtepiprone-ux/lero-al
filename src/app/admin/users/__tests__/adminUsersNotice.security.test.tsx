/**
 * Security (Task 923 R139, D86): the Users list explains the redirect from a deleted user's page, and only for the one fixed value.
 *  - SEC-X-FE-ADMIN-USERS-NOTICE-SHOWN: `?notice=user_gone` shows the localized notice in one alert.
 *  - SEC-X-FE-ADMIN-USERS-NOTICE-NOT-REFLECTED: any other value (a markup payload, a near-miss) shows no alert, and the raw value is nowhere in the rendered HTML.
 *  - SEC-X-FE-ADMIN-USERS-NOTICE-ABSENT: without the parameter the list renders as before, with no alert (preservation).
 * The real `AdminUsersPage` and `AdminPageHeader` render on `MantineProvider` with the project theme and the real `en` `admin.pages` texts. The staff guard
 * (`requireStaffPage` resolves: with the real one a page-render test fails outside a request scope), the admin client, `next-intl/server`, `next/link`, `getAdminLocale`
 * and `AdminUsersTable` are doubles. The server half of this boundary (a staff-only page) is proved by staffPage.security.test.ts and adminUserGone.security.test.ts.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'
import AdminUsersPage from '../page'

const pages: Record<string, unknown> = messages.admin.pages

vi.mock('@/lib/auth/staff', () => ({ requireStaffPage: async () => ({ userId: 'u-admin', role: 'admin' }) }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
    String(pages[key] ?? key).replace('{count}', String(values?.count ?? '')),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))
vi.mock('@/components/admin/AdminUsersTable', () => ({ AdminUsersTable: () => null }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    // A narrow chainable stand-in for the list query: only the calls an unfiltered list makes are supported, anything else throws.
    const chain: Record<string, unknown> = {}
    for (const method of ['select', 'is', 'order', 'range']) chain[method] = () => chain
    chain.then = (resolve: (value: unknown) => void) => resolve({ data: [], count: 0 })
    const guarded = new Proxy(chain, {
      get: (target, key) => {
        if (typeof key === 'string' && !(key in target)) throw new Error(`unsupported admin client call users.${key}`)
        return target[key as string]
      },
    })
    return { from: () => guarded }
  },
}))

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  )
})

async function renderList(searchParams: Record<string, string | undefined>) {
  const element = await AdminUsersPage({ searchParams: Promise.resolve(searchParams) })
  return render(<MantineProvider theme={theme} env="test">{element}</MantineProvider>)
}

describe('AdminUsersPage', () => {
  it('[SEC-X-FE-ADMIN-USERS-NOTICE-SHOWN] the redirect notice is shown', async () => {
    const { container } = await renderList({ notice: 'user_gone' })
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0].textContent).toBe(messages.admin.pages.users_gone_notice)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.admin.pages.users_title)
    // the notice is in the header's own block, not somewhere else on the page
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1)
  })

  it('[SEC-X-FE-ADMIN-USERS-NOTICE-NOT-REFLECTED] an unknown notice is not shown', async () => {
    const payload = '<img src=x onerror=alert(1)>'
    for (const notice of [payload, 'deleted', 'USER_GONE', 'user_gone ', '']) {
      const { container, unmount } = await renderList({ notice })
      expect(screen.queryAllByRole('alert'), 'an unknown notice is not shown').toHaveLength(0)
      expect(container.querySelector('img')).toBeNull()
      expect(container.innerHTML).not.toContain('onerror')
      if (notice) expect(container.textContent).not.toContain(notice)
      expect(container.textContent).not.toContain(messages.admin.pages.users_gone_notice)
      unmount()
    }
  })

  it('[SEC-X-FE-ADMIN-USERS-NOTICE-ABSENT] no notice without the parameter', async () => {
    const { container } = await renderList({})
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(messages.admin.pages.users_title)
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(container.textContent).not.toContain(messages.admin.pages.users_gone_notice)
  })
})
