/**
 * Task 965, AC1 — `/admin/reports` and `/admin/support` hydrate without a recoverable error.
 *
 * Measured 2026-11-12 on `next dev` (Next 16.4.3, React 19.2.4), signed in as the admin: both pages threw "Hydration failed because the server rendered HTML
 * didn't match the client" (React error 418 in a production build), preceded by "In HTML, <p> cannot be a descendant of <p>". The data shape that failed is an
 * EMPTY list (`reports=[]`, `tickets=[]`): `AdminReportsView` / `AdminSupportView` hand `AdminTable` an `emptyState` that is a Mantine `<Text>` (a `<p>`), and
 * `MantineDataTableToCards` wrapped its `emptyLabel` in another `<p>`. The browser's HTML parser closes the outer `<p>` at the inner one, so the DOM it builds from
 * the server HTML differs from the tree React renders, and React throws the server HTML away.
 *
 * The test does what the browser does: render the container to a string on the server, put the string into a container, `hydrateRoot` it and record every
 * `onRecoverableError`. jsdom parses the string with the HTML5 algorithm, so the stray `</p>` is reproduced.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { AdminReportsManager, type ReportRow } from '../AdminReportsManager'
import { AdminSupportManager, type SupportTicketRow } from '../AdminSupportManager'
import { AdminPropertyTypesManager } from '../AdminPropertyTypesManager'
import type { DBPropertyType } from '@/types/database'
import { AdminDashboardView } from '@/modules/admin/dashboard/components/AdminDashboardView'
import { adminDashboardAllOk, adminTrendsAllOk, adminCitiesAllOk } from '@/stories/fixtures/adminDashboard.fixtures'
import { activitySeriesCurrentAllOk, freshnessFresh } from '@/stories/fixtures/agentStatistics.fixtures'

vi.mock('@/modules/listings/actions/reportListing', () => ({ updateReportStatusAction: vi.fn(), deleteReportAction: vi.fn() }))
vi.mock('@/modules/admin/actions', () => ({ updateTicketStatus: vi.fn(), createSupportTicket: vi.fn(), searchUsersForPicker: vi.fn() }))
vi.mock('next/dynamic', () => ({ default: () => function ApexStub() { return <div data-testid="apex" /> } }))
vi.mock('@/design-system/mantine/patterns/useApexFluidBox', () => ({ useApexFluidBox: () => ({ ref: () => {}, boxWidth: 4000, chartWidth: 4000 }) }))
vi.mock('@/modules/admin/actions/propertyTypes', () => ({ createPropertyType: vi.fn(), updatePropertyType: vi.fn(), togglePropertyTypeActive: vi.fn(), deletePropertyType: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/page',
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} forceColorScheme="light">{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

/** Server render → HTML in a container → `hydrateRoot`; returns what React reported as recoverable and as console errors. */
async function hydrate(element: React.ReactElement, options: { afterServerRender?: () => void } = {}) {
  const html = renderToString(<Providers>{element}</Providers>)
  options.afterServerRender?.()
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)
  const recoverable: string[] = []
  const consoleErrors: string[] = []
  const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { consoleErrors.push(args.map(String).join(' ')) })
  let root: ReturnType<typeof hydrateRoot> | undefined
  await act(async () => {
    root = hydrateRoot(container, <Providers>{element}</Providers>, { onRecoverableError: error => { recoverable.push(String((error as Error).message)) } })
  })
  await act(async () => { await new Promise(resolveWait => setTimeout(resolveWait, 0)) })
  spy.mockRestore()
  await act(async () => { root?.unmount() })
  container.remove()
  return { html, recoverable, consoleErrors }
}

const REPORT: ReportRow = {
  id: 'r-1', listing_id: 'l-1', user_id: 'u-1', reason: 'spam', comment: 'seen twice', status: 'pending', created_at: '2026-11-01T10:00:00Z',
  listing: { id: 'l-1', title: 'Flat in Tirana', slug: 'flat-in-tirana', owner: { id: 'o-1', name: 'Owner One', user_type: 'agent' } },
  reporter: { id: 'u-1', name: 'Reporter One' },
}

const TICKET: SupportTicketRow = {
  id: 'tk-1', subject: 'Cannot upload a photo', status: 'open', ticket_type: 'support', complaint_type: null, reason: null, assigned_to: null,
  created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z', reporter: { id: 'u-1', name: 'Reporter One' }, reported: null, created_by_admin: null,
}

describe('Task 965 AC1 — the admin pages hydrate without a recoverable error', () => {
  it('/admin/reports with no reports (the shape that failed)', async () => {
    const { html, recoverable, consoleErrors } = await hydrate(
      <AdminReportsManager reports={[]} locale="en" canOverrideReportStatus canDeleteReports />,
    )
    expect(html).toContain(messages.admin.reports.empty)
    expect(recoverable).toEqual([])
    expect(consoleErrors.filter(line => /hydrat|cannot be a descendant|cannot contain a nested/i.test(line))).toEqual([])
  })

  it('/admin/reports with a pending report', async () => {
    const { recoverable } = await hydrate(
      <AdminReportsManager reports={[REPORT]} locale="en" canOverrideReportStatus canDeleteReports />,
    )
    expect(recoverable).toEqual([])
  })

  it('/admin/support with no tickets (the shape that failed)', async () => {
    const { html, recoverable, consoleErrors } = await hydrate(<AdminSupportManager tickets={[]} events={[]} />)
    expect(html).toContain(messages.admin.pages.support_empty)
    expect(recoverable).toEqual([])
    expect(consoleErrors.filter(line => /hydrat|cannot be a descendant|cannot contain a nested/i.test(line))).toEqual([])
  })

  it('/admin/support with an open ticket', async () => {
    const { recoverable } = await hydrate(<AdminSupportManager tickets={[TICKET]} events={[]} />)
    expect(recoverable).toEqual([])
  })

  // Found by the first walks of the production build (Task 965): a row only seconds old shows "less than a minute ago" on the server and "1 minute ago" in the browser when
  // the 30 s boundary of date-fns falls between the two renders. `RelativeTime` read the machine clock twice, so React threw the server HTML away (error 418).
  // The page hands its own `now` down (the documented `baseDate`), so both renders measure against the same instant.
  const SERVER_NOW = '2026-11-12T10:00:29.800Z'
  const CROSS_THE_BOUNDARY = () => vi.setSystemTime(new Date('2026-11-12T10:00:30.300Z'))

  it('/admin/reports: a report seconds old, a minute boundary between the server render and the browser render', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(SERVER_NOW))
    const fresh: ReportRow = { ...REPORT, created_at: '2026-11-12T10:00:00Z' }
    const { html, recoverable } = await hydrate(
      <AdminReportsManager reports={[fresh]} locale="en" canOverrideReportStatus canDeleteReports now={SERVER_NOW} />,
      { afterServerRender: CROSS_THE_BOUNDARY },
    )
    expect(html).toContain('less than a minute ago')
    expect(recoverable).toEqual([])
  })

  it('/admin: the dashboard lists with a row seconds old, a minute boundary between the server render and the browser render', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(SERVER_NOW))
    const data = adminDashboardAllOk('en')
    if (!data.adm02.ok || !data.recentListings.ok) throw new Error('fixture: the dashboard fixture has no report rows')
    data.adm02.data.rows[0] = { ...data.adm02.data.rows[0], createdAt: '2026-11-12T10:00:00Z' }
    data.recentListings.data[0] = { ...data.recentListings.data[0], createdAt: '2026-11-12T10:00:00Z' }
    const { html, recoverable } = await hydrate(
      <AdminDashboardView
        data={data}
        activity={activitySeriesCurrentAllOk(30)}
        freshness={freshnessFresh()}
        trends={adminTrendsAllOk(30)}
        cities={adminCitiesAllOk()}
        locale="en"
        now={SERVER_NOW}
        period={{ kind: '30d' }}
        periodDays={30}
      />,
      { afterServerRender: CROSS_THE_BOUNDARY },
    )
    expect(html).toContain('less than a minute ago')
    expect(recoverable).toEqual([])
  })

  it('/admin/property-types: a type created seconds ago, a minute boundary between the server render and the browser render', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(SERVER_NOW))
    const type: DBPropertyType = { id: 1, slug: 'apartment', name_sq: 'Apartament', name_en: 'Apartment', name_uk: 'Квартира', name_it: 'Appartamento', is_active: true, sort_order: 1, created_at: '2026-11-12T10:00:00Z', updated_at: '2026-11-12T10:00:00Z' }
    const { html, recoverable } = await hydrate(
      <AdminPropertyTypesManager initialTypes={[type]} searchQuery="" now={SERVER_NOW} />,
      { afterServerRender: CROSS_THE_BOUNDARY },
    )
    expect(html).toContain('less than a minute ago')
    expect(recoverable).toEqual([])
  })
})
