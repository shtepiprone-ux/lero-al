/**
 * AgentStatisticsView — what its time-axis chart prints (Task 923 Revision 7, owner 2026-10-17): every tick of the 30-day activity axis is the
 * bare day of the month, never a month name; the period with its months is stated once under the card title. The real view and chart patterns are
 * rendered with the Story fixtures and the real `en` messages; ApexCharts is replaced by a stub that records its options.
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
import {
  agentStatisticsAllOk,
  activitySeriesCurrentAllOk,
  activitySeriesPreviousAllOk,
  freshnessFresh,
  topListingsAllOk,
  portfolioAllOk,
} from '@/stories/fixtures/agentStatistics.fixtures'

const charts: ApexProps[] = []
vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { charts.push(props); return <div data-testid="apex" /> },
}))
vi.mock('@/design-system/mantine/patterns/useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: 4000, chartWidth: 4000 }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/en/cabinet/statistics',
  useSearchParams: () => new URLSearchParams(),
}))

import { AgentStatisticsView } from '../AgentStatisticsView'

beforeAll(() => {
  stubMatchMedia()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
beforeEach(() => { charts.length = 0 })

const current = activitySeriesCurrentAllOk()

function renderView() {
  render(
    <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} env="test">
        <AgentStatisticsView
          data={agentStatisticsAllOk('en')}
          activitySeriesCurrent={current}
          activitySeriesPrevious={activitySeriesPreviousAllOk()}
          freshness={freshnessFresh()}
          topListings={topListingsAllOk('en')}
          portfolio={portfolioAllOk()}
          locale="en"
          now={DASHBOARD_PERIOD_NOW}
          period={{ kind: '30d' }}
          periodDays={30}
          table={{ sort: 'created_at', direction: 'desc', page: 1 }}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

const dailyAxes = () => charts.filter((c) => {
  const cats = (c.options.xaxis?.categories ?? []) as unknown[]
  return cats.length >= 7 && cats.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v)))
})

describe('AgentStatisticsView — time axis', () => {
  it('has the 30-day activity chart', () => {
    renderView()
    expect(dailyAxes().length).toBeGreaterThanOrEqual(1)
  })

  it('every tick of the daily axis is the bare day of the month: digits only, never a month name', () => {
    renderView()
    for (const chart of dailyAxes()) {
      const f = chart.options.xaxis?.labels?.formatter as (v: string) => string
      for (const date of chart.options.xaxis!.categories as string[]) {
        expect(f(date), `tick of ${date}`).toBe(String(Number(date.slice(8, 10))))
      }
      expect(chart.options.xaxis?.labels?.rotate).toBe(0)
    }
  })

  it('states the period once under the card title, with both months', () => {
    renderView()
    const dates = current.ok ? current.data.map((p) => p.date) : []
    expect(dates.length).toBeGreaterThan(1)
    const range = formatDateRange(dates[0], dates[dates.length - 1], 'en')
    expect(range).toMatch(/[A-Za-z]{3} \d{1,2} – [A-Za-z]{3} \d{1,2}/)
    expect(screen.getAllByText(range).length).toBeGreaterThanOrEqual(1)
  })
})
