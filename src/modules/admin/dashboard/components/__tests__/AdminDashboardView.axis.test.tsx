/**
 * AdminDashboardView — what its time-axis charts print (Task 923 Revision 7, owner 2026-10-17): every tick of a daily axis is the bare day of
 * the month, never a month name or a full date, and the period (with its months) is stated ONCE under the card title. The real view and the real
 * chart patterns are rendered with the Story fixtures and the real `en` messages; ApexCharts is replaced by a stub that records its options.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../../messages/en.json'
import { formatDateRange } from '@/lib/formatters'
import { stubMatchMedia, type ApexProps } from '@/design-system/mantine/patterns/__tests__/chartTestKit'
import { DASHBOARD_PERIOD_NOW } from '@/stories/fixtures/dashboardPeriod.fixture'
import { adminDashboardAllOk, adminTrendsAllOk, adminCitiesAllOk } from '@/stories/fixtures/adminDashboard.fixtures'
import { activitySeriesCurrentAllOk, freshnessFresh } from '@/stories/fixtures/agentStatistics.fixtures'

const charts: ApexProps[] = []
vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { charts.push(props); return <div data-testid="apex" /> },
}))
vi.mock('@/design-system/mantine/patterns/useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: 4000, chartWidth: 4000 }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}))

import { AdminDashboardView } from '../AdminDashboardView'

beforeAll(() => {
  stubMatchMedia()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
beforeEach(() => { charts.length = 0 })

const trends = adminTrendsAllOk(30)
const activity = activitySeriesCurrentAllOk(30)

function renderView() {
  render(
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} env="test">
        <AdminDashboardView
          data={adminDashboardAllOk('en')}
          activity={activity}
          freshness={freshnessFresh()}
          trends={trends}
          cities={adminCitiesAllOk()}
          locale="en"
          now={DASHBOARD_PERIOD_NOW}
          period={{ kind: '30d' }}
          periodDays={30}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

/** The daily axes: the charts whose x categories are ISO dates. */
function dailyAxes() {
  return charts.filter((c) => {
    const cats = (c.options.xaxis?.categories ?? []) as unknown[]
    return cats.length >= 7 && cats.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v)))
  })
}

describe('AdminDashboardView — time axes', () => {
  it('has the two 30-day charts (platform activity and new listings / new users)', () => {
    renderView()
    expect(dailyAxes().length).toBeGreaterThanOrEqual(2)
  })

  it('every tick of every daily axis is the bare day of the month: digits only, no month name', () => {
    renderView()
    for (const chart of dailyAxes()) {
      const f = chart.options.xaxis?.labels?.formatter as (v: string) => string
      for (const date of chart.options.xaxis!.categories as string[]) {
        const text = f(date)
        expect(text, `tick of ${date}`).toMatch(/^\d{1,2}$/)
        expect(text).toBe(String(Number(date.slice(8, 10))))
      }
      expect(chart.options.xaxis?.labels?.rotate).toBe(0)
    }
  })

  it('states the period once under the card title, with both months, and never in a tick', () => {
    renderView()
    const dates = trends.newListings.ok ? trends.newListings.data.map((p) => p.date) : []
    expect(dates).toHaveLength(30)
    const range = formatDateRange(dates[0], dates[dates.length - 1], 'en')
    expect(range).toMatch(/[A-Za-z]{3} \d{1,2} – [A-Za-z]{3} \d{1,2}/)
    // both 30-day cards (activity, new listings / new users) carry it once under their title
    expect(screen.getAllByText(range).length).toBeGreaterThanOrEqual(2)
  })
})
