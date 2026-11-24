/**
 * Task 1007 AC5 (the sidebar half) — the sidebar and the admin layout follow the page keys.
 *  - `AdminSidebar` shows only the items whose path is in `allowedPaths`: a moderator never sees Permissions or Footer, an administrator sees every item, a list that is
 *    absent means every item (the Stories), an empty list means none (a failed key read); sign-out and "open site" stay.
 *  - the layout reads `allowedAdminPageKeys` ONCE and always passes the list: the first path of each switched-on page for a moderator, every item for an administrator,
 *    `[]` for a failed read, a user or an agent. Display only: every page and loader checks its own key (AC2, AC4).
 * The real sidebar, layout and `allowedAdminPageKeys` run; the identity, the `role_permissions` table, the locale switcher and the shell are doubles.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { ADMIN_PAGES } from '@/lib/auth/adminPages'
import { AdminSidebar } from '../AdminSidebar'

const state = vi.hoisted(() => ({
  viewer: { ok: true, userId: 'u1', role: 'moderator' } as { ok: boolean; userId?: string; role?: string; reason?: string },
  /** the `permission_key` rows the moderator's select answers, in the database's own order; `null` = the read fails */
  rows: [] as Array<{ permission_key: string }> | null,
  selects: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) },
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('next-intl/server', () => ({ setRequestLocale: () => undefined }))
vi.mock('@/lib/auth/browser', () => ({ signOut: async () => undefined }))
vi.mock('@/components/admin/AdminLocaleSwitcher', () => ({ AdminLocaleSwitcher: () => null }))
vi.mock('@/modules/admin/lib/settings', () => ({ getAllSettings: async () => ({ site_name: 'Lero.al' }) }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => state.viewer }))
vi.mock('@/components/admin/AdminShell', () => ({ AdminShell: function AdminShellDouble() { return null } }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const entry = { table, filters: [] as Array<[string, unknown]> }
      state.selects.push(entry)
      const chain: unknown = new Proxy(function () {}, {
        get: (_t, key) => {
          if (key === 'then') return (resolve: (v: unknown) => void) => resolve(state.rows === null ? { data: null, error: { code: 'XX000' } } : { data: state.rows, error: null })
          return (...args: unknown[]) => { entry.filters.push([String(key), args]); return chain }
        },
      })
      return chain
    },
  }),
}))

const t = messages.admin.sidebar
const labelOf = (labelKey: string) => t[labelKey as keyof typeof t]
const ALL_ITEMS = [...ADMIN_PAGES.map((p) => labelOf(p.labelKey)), t.item_footer, t.item_permissions]

function renderSidebar(allowedPaths?: readonly string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminSidebar allowedPaths={allowedPaths} />
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
  state.viewer = { ok: true, userId: 'u1', role: 'moderator' }
  state.rows = []
  state.selects = []
})

describe('AdminSidebar — allowedPaths (Task 1007)', () => {
  it('a moderator sees only the items of the pages switched on, and never Permissions or Footer', () => {
    renderSidebar(['/admin/listings', '/admin/users'])
    expect(itemLink(t.item_listings)).toBeTruthy()
    expect(itemLink(t.item_users)).toBeTruthy()
    for (const hidden of ALL_ITEMS.filter((l) => l !== t.item_listings && l !== t.item_users)) expect(itemLink(hidden), `${hidden} is hidden`).toBeNull()
    expect(itemLink(t.item_permissions)).toBeNull()
    expect(itemLink(t.item_footer)).toBeNull()
  })

  it('a group with no allowed item renders no heading (O1007-3); a group with one keeps its heading', () => {
    // Management has two allowed pages; Overview, Content and System have none for this moderator
    renderSidebar(['/admin/listings', '/admin/users'])
    expect(screen.queryByText(t.group_management), 'Management keeps its heading').toBeTruthy()
    for (const hidden of [t.group_overview, t.group_content, t.group_system]) expect(screen.queryByText(hidden), `${hidden} is hidden with its heading`).toBeNull()
  })

  it('every group heading is gone when no item is allowed (a failed key read); every heading shows for an administrator and for a sidebar given no list', () => {
    const empty = renderSidebar([])
    for (const heading of [t.group_overview, t.group_management, t.group_content, t.group_system]) expect(screen.queryByText(heading), `${heading} with no item`).toBeNull()
    empty.unmount()
    const admin = renderSidebar([...ADMIN_PAGES.map((p) => p.paths[0]), '/admin/footer', '/admin/permissions'])
    for (const heading of [t.group_overview, t.group_management, t.group_content, t.group_system]) expect(screen.queryByText(heading), `${heading} for an administrator`).toBeTruthy()
    admin.unmount()
    renderSidebar()
    for (const heading of [t.group_overview, t.group_management, t.group_content, t.group_system]) expect(screen.queryByText(heading), `${heading} with no list`).toBeTruthy()
  })

  it('an administrator sees every item, Permissions and Footer included; so does a sidebar given no list (the Stories)', () => {
    const first = renderSidebar([...ADMIN_PAGES.map((p) => p.paths[0]), '/admin/footer', '/admin/permissions'])
    for (const label of ALL_ITEMS) expect(itemLink(label), label).toBeTruthy()
    first.unmount()
    renderSidebar()
    for (const label of ALL_ITEMS) expect(itemLink(label), label).toBeTruthy()
  })

  it('an empty list (a failed key read) shows no item, and the sign-out and the link to the site stay', () => {
    renderSidebar([])
    for (const label of ALL_ITEMS) expect(itemLink(label), `${label} is hidden`).toBeNull()
    expect(screen.getByRole('button', { name: t.logout })).toBeTruthy()
    expect(screen.getByRole('link', { name: t.open_site })).toBeTruthy()
  })
})

describe('AdminLayout — the list it passes to the shell (Task 1007)', () => {
  async function layoutPaths(): Promise<readonly string[]> {
    const { default: AdminLayout } = await import('@/app/admin/layout')
    const tree = (await AdminLayout({ children: null })) as React.ReactElement<{ children: React.ReactElement<{ allowedPaths?: readonly string[] }> }>
    const shell = tree.props.children
    expect(shell.props.allowedPaths, 'the layout always passes a list').toBeDefined()
    return shell.props.allowedPaths as readonly string[]
  }

  it('a moderator: the first path of each switched-on page, in the sidebar order, from ONE read of role_permissions', async () => {
    state.rows = [{ permission_key: 'page.users' }, { permission_key: 'page.dashboard' }, { permission_key: 'page.inquiries_support' }]   // the database's order is not the sidebar's
    expect(await layoutPaths()).toEqual(['/admin', '/admin/users', '/admin/inquiries/support'])
    expect(state.selects.filter((s) => s.table === 'role_permissions'), 'one read').toHaveLength(1)
  })

  it('an administrator: every item, Permissions and Footer included, with no read of role_permissions', async () => {
    state.viewer = { ok: true, userId: 'u1', role: 'admin' }
    expect(await layoutPaths()).toEqual([...ADMIN_PAGES.map((p) => p.paths[0]), '/admin/footer', '/admin/permissions'])
    expect(state.selects.filter((s) => s.table === 'role_permissions')).toHaveLength(0)
  })

  it('a failed read of the keys passes an empty list: no item', async () => {
    state.rows = null
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await layoutPaths()).toEqual([])
  })

  it('a moderator with nothing switched on passes an empty list', async () => {
    state.rows = []
    expect(await layoutPaths()).toEqual([])
  })
})
