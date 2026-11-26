/**
 * Task 988 AC6 (owner decision O988-4): the admin lives under the language slug and keeps its access.
 *  1. Every admin `page.tsx` lies under `src/app/[locale]/admin`; nothing is left under `src/app/admin`.
 *  2. A scan of every production file under `src`: no navigation (`href`, `push`, `replace`, `redirect`, `revalidatePath`, `window.open`) takes an admin path without
 *     the slug, and no `'/admin…'` path literal is left outside the slug-aware helpers: `adminHref(<locale>, '/admin…')` builds an address, and the route
 *     identifiers of the access table (`adminPages.ts`), the sidebar items and the header titles are matched after the slug (`adminRouteOf`), and the dashboard's
 *     drill-down routes (`hrefs.ts`) get the slug where they are rendered.
 *  3. `adminRouteOf` gives, for every route of `ADMIN_PAGES` and `ADMIN_ONLY_PATHS` under each of the four slugs, the route `main` matched (`/uk/admin/users` →
 *     `/admin/users`, the key `page.users`); `headers.ts` puts the report-only script policy on `/uk/admin/x` and not on `/uk/listings`.
 *  4. SEC-988-ADMIN-SLUG-DENY: a moderator without `page.users` gets `notFound()` from `/uk/admin/users`, and the sidebar on `/uk/admin/users` omits Users, shows the
 *     pages switched on with their slug addresses and marks the active one; the `/uk/admin` landing sends such a moderator to `/uk/admin/<first page>`.
 * The real pages, `requireStaffPage`, the sidebar and the helpers run; the identity, the key switches and the database are doubles. Every id is synthetic.
 */
import React from 'react'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/uk.json'

const state = vi.hoisted(() => ({ keys: new Set<string>(), pathname: '/uk/admin/users', requestLocale: 'uk' }))

vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) },
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
vi.mock('next-intl/server', () => ({
  getLocale: async () => state.requestLocale,
  setRequestLocale: () => undefined,
  getTranslations: async () => (key: string) => key,
}))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'u-moderator', role: 'moderator' }) }))
vi.mock('@/lib/auth/permissions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  roleHasPermission: async (_role: string, key: string) => state.keys.has(key),
  allowedAdminPageKeys: async () => [...state.keys],
  hasPermission: async (key: string) => state.keys.has(key),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('no read may run for a moderator without the key') } }))
vi.mock('@/lib/auth/browser', () => ({ signOut: async () => undefined }))
vi.mock('@/components/admin/AdminLocaleSwitcher', () => ({ AdminLocaleSwitcher: () => null }))

import { ADMIN_ONLY_PATHS, ADMIN_PAGES, adminHref, adminRouteOf } from '@/lib/auth/adminPages'
import { carriesScriptReportOnly } from '@/lib/security/headers'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const ROOT = process.cwd()
const LOCALES = ['sq', 'en', 'uk', 'it'] as const
const relative = (file: string) => file.slice(ROOT.length + 1).split('\\').join('/')

function walk(dir: string, accept: (name: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full, accept, out) }
    else if (accept(entry.name)) out.push(full)
  }
  return out
}

/** the code of a file without its comments (a `//` comment only where it starts a line or follows a space, so `https://` in a string stays) */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')

/**
 * the files that hold admin routes without the slug: the access table, the sidebar items and the header titles (matched after the slug), the dashboard's drill-down
 * routes (`hrefs.ts`, given the slug by `adminHref` where the dashboard renders them), and the crawler rules of `robots.ts` (not an address of a page)
 */
const ROUTE_TABLES = new Set(['src/lib/auth/adminPages.ts', 'src/components/admin/AdminSidebar.tsx', 'src/components/admin/AdminHeader.tsx', 'src/modules/admin/dashboard/hrefs.ts', 'src/app/robots.ts'])
const ADMIN_LITERAL = /(['"`])\/admin(?=[/'"`?]|\$\{)/g
const UNSLUGGED_SINK = /(?:\bhref\s*=\s*\{?\s*|\bhref\s*:\s*|\.push\(\s*|\.replace\(\s*|\bredirect\(\s*|\brevalidatePath\(\s*|window\.open\(\s*)(['"`])\/admin(?=[/'"`?]|\$\{)/g
/** in a route table the items' `href:` keys are route identifiers (the sidebar renders them through `adminHref`); every other navigation is checked there too */
const UNSLUGGED_SINK_IN_TABLE = /(?:\bhref\s*=\s*\{?\s*|\.push\(\s*|\.replace\(\s*|\bredirect\(\s*|\brevalidatePath\(\s*|window\.open\(\s*)(['"`])\/admin(?=[/'"`?]|\$\{)/g
/** `adminHref(<locale expression>, '/admin…'`: the locale expression may hold one call, e.g. `await getAdminLocale()` */
const WRAPPED = /\badminHref\(\s*(?:[^,()]|\([^()]*\))+,\s*(['"`])\/admin/g
const HAND_BUILT = /\}\/admin(?=[/'"`?]|\$\{)/g

const messagesUk = messages as unknown as Record<string, unknown>

beforeEach(() => {
  state.keys = new Set()
  state.pathname = '/uk/admin/users'
  state.requestLocale = 'uk'
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

describe('adminSlug', () => {
  it('[AC6] every admin page lies under src/app/[locale]/admin, and nothing is left under src/app/admin', () => {
    const pages = walk(join(ROOT, 'src', 'app', '[locale]', 'admin'), (n) => n === 'page.tsx')
    expect(pages.length, 'the 22 admin pages').toBe(22)
    expect(walk(join(ROOT, 'src', 'app', 'admin'), () => true), 'src/app/admin is empty').toEqual([])
  })

  it('[AC6] no production file navigates to an admin path without the slug or keeps one outside the slug-aware helpers', () => {
    const files = walk(join(ROOT, 'src'), (n) => /\.(ts|tsx)$/.test(n) && !/\.(test|spec|stories)\.tsx?$/.test(n) && !n.endsWith('.d.ts'))
      .filter((f) => !/[\\/](__tests__|__mocks__|stories|tests)[\\/]/.test(f))
    expect(files.length).toBeGreaterThan(300)
    const offenders: string[] = []
    for (const file of files) {
      const rel = relative(file)
      const text = code(readFileSync(file, 'utf8'))
      for (const m of text.matchAll(ROUTE_TABLES.has(rel) ? UNSLUGGED_SINK_IN_TABLE : UNSLUGGED_SINK)) offenders.push(`${rel}: a navigation to an admin path without the slug: ${text.slice(m.index, m.index + 60)}`)
      if (rel !== 'src/lib/auth/adminPages.ts') for (const m of text.matchAll(HAND_BUILT)) offenders.push(`${rel}: an admin address built by hand: ${text.slice(Math.max(0, m.index - 30), m.index + 30)}`)
      if (ROUTE_TABLES.has(rel)) continue
      const rest = text.replace(WRAPPED, 'adminHref(locale, $1/ADMIN')
      for (const m of rest.matchAll(ADMIN_LITERAL)) offenders.push(`${rel}: an admin path literal outside the helpers: ${rest.slice(Math.max(0, m.index - 30), m.index + 40)}`)
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('[AC6] adminHref puts the slug in front of a route; headers.ts follows the moved admin', () => {
    expect(adminHref('uk', '/admin')).toBe('/uk/admin')
    expect(adminHref('it', '/admin/users/u-1?tab=x')).toBe('/it/admin/users/u-1?tab=x')
    expect(carriesScriptReportOnly('/uk/admin/x')).toBe(true)
    expect(carriesScriptReportOnly('/uk/admin')).toBe(true)
    expect(carriesScriptReportOnly('/uk/listings')).toBe(false)
    expect(carriesScriptReportOnly('/uk/administration')).toBe(false)
  })

  it('[SEC-988-ADMIN-SLUG-DENY] every route of the access table under every slug gives the route, and the key, main matched; other addresses give none', () => {
    const keyOf = (route: string | null) => ADMIN_PAGES.find((p) => (p.paths as readonly string[]).includes(route ?? ''))?.key ?? null
    for (const page of ADMIN_PAGES) {
      for (const route of page.paths) {
        const concrete = route.replace('[id]', '00000000-0000-4000-8000-0000000000aa')
        for (const locale of LOCALES) {
          const matched = adminRouteOf(`/${locale}${concrete}`)
          expect(matched, `/${locale}${concrete}`).toBe(concrete)
          expect(keyOf(matched === concrete ? route : matched), `/${locale}${route}`).toBe(page.key)
        }
      }
    }
    for (const route of ADMIN_ONLY_PATHS) for (const locale of LOCALES) expect(adminRouteOf(`/${locale}${route}`)).toBe(route)
    for (const other of ['/admin/users', '/uk/listings', '/xx/admin/users', '/UK/admin', '/uk/administration', '/uk//admin', '//uk/admin']) expect(adminRouteOf(other), other).toBeNull()
  })

  it('[SEC-988-ADMIN-SLUG-DENY] a moderator without page.users gets notFound() from /uk/admin/users before any read', async () => {
    state.keys = new Set(['page.listings'])
    const { default: UsersPage } = await import('@/app/[locale]/admin/users/page')
    await expect(UsersPage({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('[SEC-988-ADMIN-SLUG-DENY] the sidebar on /uk/admin/users omits Users, links the pages switched on under the slug and marks the active one', () => {
    const t = (messagesUk.admin as Record<string, Record<string, string>>).sidebar
    const { rerender } = render(
      <NextIntlClientProvider locale="uk" messages={messagesUk}>
        <MantineProvider theme={theme} env="test">
          <AdminSidebar allowedPaths={['/admin/listings', '/admin/reports']} />
        </MantineProvider>
      </NextIntlClientProvider>,
    )
    expect(screen.queryByRole('link', { name: t.item_users }), 'Users is not shown').toBeNull()
    expect(screen.getByRole('link', { name: t.item_listings }).getAttribute('href')).toBe('/uk/admin/listings')
    expect(screen.getByRole('link', { name: t.item_reports }).getAttribute('href')).toBe('/uk/admin/reports')
    state.pathname = '/uk/admin/reports'
    rerender(
      <NextIntlClientProvider locale="uk" messages={messagesUk}>
        <MantineProvider theme={theme} env="test">
          <AdminSidebar allowedPaths={['/admin/listings', '/admin/reports']} />
        </MantineProvider>
      </NextIntlClientProvider>,
    )
    expect(screen.getByRole('link', { name: t.item_reports }).hasAttribute('data-active'), 'the page open is marked').toBe(true)
    expect(screen.getByRole('link', { name: t.item_listings }).hasAttribute('data-active')).toBe(false)
  })

  it('[SEC-988-ADMIN-SLUG-DENY] the /uk/admin landing sends a moderator without the dashboard to the first page switched on, under the slug', async () => {
    state.keys = new Set(['page.reports'])
    const { default: Landing } = await import('@/app/[locale]/admin/page')
    await expect(Landing({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow('NEXT_REDIRECT /uk/admin/reports')
  })
})
