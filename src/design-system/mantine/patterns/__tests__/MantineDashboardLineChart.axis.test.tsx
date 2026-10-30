/**
 * MantineDashboardLineChart — time axis (Task 923 Revision 7, owner 2026-10-17): the tick is the bare day the caller formats, never rotated,
 * never hidden by ApexCharts' own guess, thinned to the ticks that fit; the tooltip keeps the fuller date. See MantineDashboardBarChart.axis.test.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { formatDayNumber } from '@/lib/formatters'
import { fireEvent, screen } from '@testing-library/react'
import { chartState, renderChart, stubMatchMedia, type ApexProps } from './chartTestKit'
import { renderApp } from './viewportKit'

vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { chartState.last = props; return <div data-testid="apex" /> },
}))
vi.mock('../useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: chartState.width, chartWidth: chartState.width > 0 ? chartState.width : '100%' }),
}))

import { MantineDashboardLineChart } from '../MantineDashboardLineChart'

beforeAll(stubMatchMedia)
beforeEach(() => { chartState.width = 0 })

const days = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 7, 19 + i)).toISOString().slice(0, 10))
const data = days.map((date, i) => ({ date, views: (i * 7) % 12, contacts: (i * 5) % 9 }))
const series = [{ key: 'views', label: 'Views', color: 'brand.4' }, { key: 'contacts', label: 'Contacts', color: 'gray.4' }]

function line(width: number, extra: Partial<React.ComponentProps<typeof MantineDashboardLineChart>> = {}) {
  chartState.width = width
  return renderChart(
    <MantineDashboardLineChart data={data} series={series} mode="multi" dateLabel={formatDayNumber} valueLabel={String} state="ready" ariaLabel="activity" {...extra} />,
  ).options
}
const tick = (o: { xaxis?: { labels?: { formatter?: unknown } } }) => o.xaxis?.labels?.formatter as (v: string) => string

describe('MantineDashboardLineChart — time axis', () => {
  it('never rotates the labels and never lets ApexCharts hide them on its own', () => {
    const o = line(450)
    expect(o.xaxis?.labels?.rotate).toBe(0)
    expect(o.xaxis?.labels?.hideOverlappingLabels).toBe(false)
  })

  it('draws the caller text as the tick: the bare day, never the raw date or a month name', () => {
    const f = tick(line(4000))
    expect(f('2026-08-19')).toBe('19')
    for (const d of days) expect(f(d)).not.toMatch(/[A-Za-z]/)
  })

  it('thins the ticks to the ones that fit, keeping the first, and draws all of them when they fit', () => {
    const narrow = tick(line(300))
    const drawn = days.map((d) => narrow(d)).filter(Boolean)
    expect(drawn.length).toBeGreaterThanOrEqual(2)
    expect(drawn.length).toBeLessThan(days.length)
    expect(narrow(days[0])).toBe('19')
    const wide = tick(line(4000))
    expect(days.map((d) => wide(d)).filter(Boolean)).toHaveLength(days.length)
  })

  it('keeps more ticks the wider the box is (monotone)', () => {
    const counts = [300, 600, 1200, 4000].map((w) => { const f = tick(line(w)); return days.filter((d) => f(d)).length })
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
  })

  it('the tooltip uses tooltipDateLabel, the axis keeps the bare day', () => {
    const o = line(4000, { tooltipDateLabel: (d) => `full ${d}` })
    const x = (o.tooltip?.x?.formatter as (v: number, opts: { dataPointIndex: number }) => string)(0, { dataPointIndex: 2 })
    expect(x).toBe(`full ${days[2]}`)
    expect(tick(o)(days[2])).toBe('21')
  })
})

describe('MantineDashboardLineChart — series, legend, tooltip and states', () => {
  it('a multi-series chart draws every series, the first heavier than the others, with a legend of toggles', () => {
    const o = line(450)
    const stroke = o.stroke?.width as number[]
    expect(stroke).toHaveLength(2)
    expect(stroke[0]).toBeGreaterThan(stroke[1])
    expect((chartState.last!.series as { name: string }[]).map((s) => s.name)).toEqual(['Views', 'Contacts'])
    expect(screen.getByRole('button', { name: 'Views' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('hiding a series removes its line; hiding all shows the hint and no chart; showing one restores it', () => {
    line(450, { allHiddenHint: 'No series selected' })
    fireEvent.click(screen.getByRole('button', { name: 'Contacts' }))
    expect((chartState.last!.series as { name: string }[]).map((s) => s.name)).toEqual(['Views'])
    fireEvent.click(screen.getByRole('button', { name: 'Views' }))
    expect(screen.getByText('No series selected')).toBeInTheDocument()
    chartState.last = null
    fireEvent.click(screen.getByRole('button', { name: 'Contacts' }))
    expect(screen.queryByText('No series selected')).toBeNull()
    expect((chartState.last!.series as { name: string }[]).map((s) => s.name)).toEqual(['Contacts'])
  })

  it('mode="single" draws its one series with no legend', () => {
    line(450, { mode: 'single', series: [series[0]] })
    expect(screen.queryByRole('button')).toBeNull()
    expect((chartState.last!.series as unknown[]).length).toBe(1)
  })

  it('the value axis and the tooltip use the caller value text, the tooltip x falls back to the axis label', () => {
    const o = line(4000, { valueLabel: (n) => `${n} views` })
    expect((o.yaxis as { labels: { formatter: (v: number) => string } }).labels.formatter(5)).toBe('5 views')
    expect((o.tooltip?.y as { formatter: (v: number) => string }).formatter(7)).toBe('7 views')
    expect((o.tooltip?.x?.formatter as (v: number, opts?: { dataPointIndex: number }) => string)(0, { dataPointIndex: 3 })).toBe('22')
    expect((o.tooltip?.x?.formatter as (v: number, opts?: { dataPointIndex: number }) => string)(0)).toBe('19')
  })

  it('a missing value counts as zero', () => {
    chartState.width = 450
    const p = renderChart(
      <MantineDashboardLineChart data={[{ date: '2026-09-01', views: 3 }]} series={series} mode="multi" dateLabel={formatDayNumber} valueLabel={String} state="ready" ariaLabel="a" />,
    )
    expect((p.series as { data: number[] }[]).map((s) => s.data)).toEqual([[3], [0]])
  })

  it('error draws no chart and offers the retry; loading and empty draw no chart either', () => {
    for (const state of ['error', 'loading', 'empty'] as const) {
      chartState.last = null
      chartState.width = 450
      const { unmount } = renderApp(
        <MantineDashboardLineChart data={data} series={series} mode="multi" dateLabel={formatDayNumber} valueLabel={String} state={state} errorText="Failed" retryLabel="Retry" onRetry={() => {}} emptyTitle="Nothing" ariaLabel="a" loadingAriaLabel="Loading" />,
      )
      expect(chartState.last, state).toBeNull()
      if (state === 'error') expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      unmount()
    }
  })
})
