// @vitest-environment node
/**
 * Task 1007 AC5 (the landing half) — `/admin` for a moderator follows the page switches.
 *  - the first await is `requireStaffPage({ landing: true })`: the role only, so the page itself decides what a moderator without `page.dashboard` gets;
 *  - an administrator, and a moderator with `page.dashboard`, get the dashboard (its reads run);
 *  - any other moderator: NO dashboard read, a redirect to the first path of the first page switched on (the sidebar order), or, with none (a failed read included), the
 *    canonical empty state `admin.pages_access.none` inside the page frame.
 * The real page, `roleHasPermission` and `allowedAdminPageKeys` run; the guard, the dashboard reads, the view and the `role_permissions` table are doubles.
 */
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  role: 'moderator' as string,
  /** the locale `getTranslations` reads: the site default until the page sets the admin locale */
  requestLocale: 'sq',
  /** the page keys switched on for the moderator, in the database's own order */
  on: [] as string[],
  readFails: false,
  guardArgs: [] as unknown[],
  dashboardReads: [] as string[],
}))

const Frame = vi.hoisted(() => function FrameDouble() { return null })
const EmptyState = vi.hoisted(() => function EmptyStateDouble() { return null })
const View = vi.hoisted(() => function ViewDouble() { return null })

vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`NEXT_REDIRECT ${to}`) },
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
// The text follows the REQUEST locale, as next-intl does: it is the site's default (`sq`) until `getAdminLocale()` sets the admin's own (here `uk`, the cookie of the owner's report)
vi.mock('next-intl/server', () => ({ getTranslations: async (ns: string) => (key: string) => `${state.requestLocale}:${ns}.${key}` }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => { state.requestLocale = 'uk'; return 'uk' } }))
vi.mock('@/lib/auth/staff', () => ({ requireStaffPage: async (access: unknown) => { state.guardArgs.push(access); return { userId: 'u1', role: state.role } } }))
vi.mock('@/components/admin/AdminPageFrame', () => ({ AdminPageFrame: Frame }))
vi.mock('@/design-system/mantine/patterns/MantineEmptyLoadingErrorState', () => ({ MantineEmptyLoadingErrorState: EmptyState }))
vi.mock('@/modules/admin/dashboard/components/AdminDashboardView', () => ({ AdminDashboardView: View }))
vi.mock('@/modules/admin/dashboard/queries', () => ({ getAdminDashboardData: async () => { state.dashboardReads.push('data'); return {} } }))
vi.mock('@/modules/admin/dashboard/trends', () => ({
  getAdminTrends: async () => { state.dashboardReads.push('trends'); return {} },
  getVisibleListingsByCity: async () => { state.dashboardReads.push('cities'); return [] },
}))
vi.mock('@/modules/analytics/activity/read', () => ({
  getPlatformActivitySeries: async () => { state.dashboardReads.push('activity'); return {} },
  getActivityFreshness: async () => { state.dashboardReads.push('freshness'); return {} },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let key = ''
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = (column: string, value: unknown) => { if (column === 'permission_key') key = String(value); return chain }
      chain.in = () => chain
      chain.maybeSingle = async () => (state.readFails ? { data: null, error: { code: 'XX000' } } : { data: table === 'role_permissions' && state.on.includes(key) ? { allowed: true } : null, error: null })
      chain.then = (resolve: (v: unknown) => void) => resolve(state.readFails ? { data: null, error: { code: 'XX000' } } : { data: state.on.map((permission_key) => ({ permission_key })), error: null })
      return chain
    },
  }),
}))

import AdminDashboard from '@/app/[locale]/admin/page'

const props = { searchParams: Promise.resolve({}) }
type Outcome = { element?: ReactElement<{ children?: ReactElement<{ title?: string }> }>; threw?: string }
const outcome = async (): Promise<Outcome> => {
  try { return { element: (await AdminDashboard(props)) as Outcome['element'] } } catch (e) { return { threw: (e as Error).message } }
}

beforeEach(() => {
  state.role = 'moderator'
  state.requestLocale = 'sq'
  state.on = []
  state.readFails = false
  state.guardArgs = []
  state.dashboardReads = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('the /admin landing', () => {
  it('the first call is the landing guard: the role only, no page key', async () => {
    await outcome()
    expect(state.guardArgs[0]).toEqual({ landing: true })
  })

  it('an administrator gets the dashboard: its reads run, inside the page frame', async () => {
    state.role = 'admin'
    const { element } = await outcome()
    expect(state.dashboardReads.sort()).toEqual(['activity', 'cities', 'data', 'freshness', 'trends'])
    expect(element?.type).toBe(Frame)
    expect(element?.props.children?.type).toBe(View)
  })

  it('a moderator with page.dashboard gets the dashboard', async () => {
    state.on = ['page.users', 'page.dashboard']
    const { element } = await outcome()
    expect(state.dashboardReads.length, 'the dashboard reads ran').toBe(5)
    expect(element?.type).toBe(Frame)
  })

  it('a moderator without page.dashboard: no dashboard read, a redirect to the first path of the first page switched on (the sidebar order, not the database order)', async () => {
    state.on = ['page.users', 'page.listings', 'page.reports']
    expect(await outcome()).toEqual({ threw: 'NEXT_REDIRECT /uk/admin/listings' })
    expect(state.dashboardReads, 'nothing of the dashboard was read').toEqual([])
    state.on = ['page.inquiries_support']
    expect(await outcome()).toEqual({ threw: 'NEXT_REDIRECT /uk/admin/inquiries/support' })
    expect(state.dashboardReads).toEqual([])
  })

  it('a moderator with no page switched on gets the canonical empty state in the frame, and no dashboard read', async () => {
    state.on = []
    const { element } = await outcome()
    expect(state.dashboardReads).toEqual([])
    expect(element?.type).toBe(Frame)
    expect(element?.props.children?.type).toBe(EmptyState)
    // in the admin's own language, not the site default: every admin page sets the admin locale (`getAdminLocale()`) before it reads a message
    expect(element?.props.children?.props.title).toBe('uk:admin.pages_access.none')
  })

  it('a failed read of the keys is the same empty state, never the dashboard and never a redirect', async () => {
    state.on = ['page.dashboard', 'page.users']
    state.readFails = true
    const { element, threw } = await outcome()
    expect(threw).toBeUndefined()
    expect(state.dashboardReads).toEqual([])
    expect(element?.props.children?.type).toBe(EmptyState)
  })
})
