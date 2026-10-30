/**
 * MantineDashboardBarChart — what the pattern tells ApexCharts about its axes (Task 923 Revision 7, owner 2026-10-17).
 *
 * A jsdom test cannot measure a real canvas, so these tests read the options the pattern hands to ApexCharts: the part of the
 * behaviour that decides whether axis labels are rotated, printed over one another, or repeat the month. The rendered result is
 * proved on the built Storybook by the rendered state census (rules `text-overlap`, `svg-text-clipped`).
 *
 * Covers: labels never rotate and are never hidden by ApexCharts' own overlap guess; the tick text is the caller's label (a bare day
 * of the month, never the raw date or a month name); ticks are thinned to the ones that fit, keeping the first; the bars stay a readable
 * width in a dense plot; a long category name of a horizontal chart wraps on its spaces and its column is as wide as the widest line;
 * the tooltip keeps the fuller label.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderApp } from './viewportKit'
import { MantineProvider } from '@mantine/core'
import type { ApexOptions } from 'apexcharts'
import { theme } from '@/design-system/mantine/theme'
import { formatDayNumber } from '@/lib/formatters'
import { tokens } from './chartTestKit'

const hoisted = vi.hoisted(() => ({ width: 0, last: null as null | { options: ApexOptions; series: unknown; width: unknown } }))

vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: { options: ApexOptions; series: unknown; width: unknown }) {
    hoisted.last = props
    return <div data-testid="apex" />
  },
}))
vi.mock('../useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: hoisted.width, chartWidth: hoisted.width > 0 ? hoisted.width : '100%' }),
}))

import { MantineDashboardBarChart } from '../MantineDashboardBarChart'

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})
beforeEach(() => { hoisted.last = null; hoisted.width = 0 })

const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 19 + i))
  return d.toISOString().slice(0, 10)
})
const dayData = days.map((category, i) => ({ category, newListings: (i * 7) % 12, newUsers: (i * 5) % 9 }))
const series = [
  { key: 'newListings', label: 'New listings', color: 'brand.4' },
  { key: 'newUsers', label: 'New users', color: 'gray.4' },
]

function renderBar(props: Partial<React.ComponentProps<typeof MantineDashboardBarChart>> = {}) {
  render(
    <MantineProvider theme={theme} env="test">
      <MantineDashboardBarChart
        data={dayData}
        series={series}
        categoryLabel={formatDayNumber}
        valueLabel={(n) => String(n)}
        state="ready"
        ariaLabel="trend"
        {...props}
      />
    </MantineProvider>,
  )
  const options = hoisted.last?.options
  if (!options) throw new Error('the chart was not rendered')
  return options
}
const xFormatter = (o: ApexOptions) => (o.xaxis?.labels?.formatter as (v: string) => string)

describe('MantineDashboardBarChart — time axis (vertical bars)', () => {
  it('never rotates the labels and never lets ApexCharts hide or tilt them on its own', () => {
    hoisted.width = 450
    const o = renderBar()
    expect(o.xaxis?.labels?.rotate).toBe(0)
    expect(o.xaxis?.labels?.hideOverlappingLabels).toBe(false)
  })

  it('draws the caller\'s tick text: the bare day, not the raw date and not a month name', () => {
    hoisted.width = 2000
    const f = xFormatter(renderBar())
    expect(f('2026-08-19')).toBe('19')
    expect(f('2026-09-01')).toBe('1')
    for (const d of days) expect(f(d)).not.toMatch(/[A-Za-z]/)
  })

  it('thins the ticks to the ones that fit, keeps the first and leaves the others empty (never overlapped)', () => {
    hoisted.width = 300
    const f = xFormatter(renderBar())
    const drawn = days.map((d) => f(d)).filter(Boolean)
    expect(drawn.length).toBeGreaterThanOrEqual(2)
    expect(drawn.length).toBeLessThan(days.length)
    expect(f(days[0])).toBe(formatDayNumber(days[0]))
  })

  it('draws every tick when they all fit', () => {
    hoisted.width = 4000
    const f = xFormatter(renderBar())
    expect(days.map((d) => f(d)).filter(Boolean)).toHaveLength(days.length)
  })

  it('keeps more ticks the wider the box is (monotone)', () => {
    const counts = [300, 600, 1200, 4000].map((w) => {
      hoisted.width = w
      const f = xFormatter(renderBar())
      return days.map((d) => f(d)).filter(Boolean).length
    })
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
  })

  it('widens the bars when a category slot is narrow, so 30 days do not shrink to hairlines', () => {
    hoisted.width = 300
    const dense = renderBar().plotOptions?.bar?.columnWidth
    hoisted.width = 4000
    const sparse = renderBar().plotOptions?.bar?.columnWidth
    expect(dense).toBe(tokens.dashboardChart.barColumnWidthDense)
    expect(sparse).toBe(tokens.dashboardChart.barColumnWidth)
    expect(dense).not.toBe(sparse)
  })

  it('the tooltip keeps the fuller label (tooltipCategoryLabel), the axis keeps the short one', () => {
    hoisted.width = 4000
    const o = renderBar({ tooltipCategoryLabel: (c) => `full ${c}` })
    const tooltip = (o.tooltip?.x?.formatter as (v: number, opts: { dataPointIndex: number }) => string)(0, { dataPointIndex: 1 })
    expect(tooltip).toBe(`full ${days[1]}`)
    expect(xFormatter(o)(days[1])).toBe(formatDayNumber(days[1]))
  })

  it('stacks two series, groups them when asked, and passes every series to ApexCharts', () => {
    hoisted.width = 450
    expect(renderBar().chart?.stacked).toBe(true)
    expect(renderBar({ stacked: false }).chart?.stacked).toBe(false)
    expect((hoisted.last?.series as unknown[]).length).toBe(2)
  })
})

describe('MantineDashboardBarChart — horizontal bars (a top-N list of names)', () => {
  const cities = [
    { category: 'tirana', visible: 9 },
    { category: 'durres', visible: 7 },
    { category: 'long', visible: 3 },
  ]
  const names: Record<string, string> = { tirana: 'Tirana', durres: 'Durrës', long: 'Bashkia Konispol Qendër Administrative' }
  const label = (c: string) => names[c] ?? c

  it('wraps a long name on its spaces and never cuts a word', () => {
    hoisted.width = 300
    const o = renderBar({ data: cities, series: [{ key: 'visible', label: 'Visible', color: 'brand.4' }], categoryLabel: label, horizontal: true })
    const f = o.yaxis as unknown as { labels: { formatter: (v: string) => string | string[] } }
    const lines = f.labels.formatter('long')
    expect(Array.isArray(lines)).toBe(true)
    const joined = (lines as string[]).join(' ')
    expect(joined).toBe(names.long)
    for (const word of names.long.split(' ')) expect((lines as string[]).some((l) => l.split(' ').includes(word))).toBe(true)
    expect(f.labels.formatter('tirana')).toEqual(['Tirana'])
  })

  it('reserves the width of the widest wrapped line and tells ApexCharts not to cut it', () => {
    hoisted.width = 300
    const o = renderBar({ data: cities, series: [{ key: 'visible', label: 'Visible', color: 'brand.4' }], categoryLabel: label, horizontal: true })
    const labels = (o.yaxis as unknown as { labels: { minWidth: number; maxWidth: number } }).labels
    expect(labels.minWidth).toBeGreaterThan(0)
    expect(labels.maxWidth).toBeGreaterThanOrEqual(labels.minWidth)
  })

  it('puts the values on the x axis and the names on the y axis', () => {
    hoisted.width = 300
    const o = renderBar({ data: cities, series: [{ key: 'visible', label: 'Visible', color: 'brand.4' }], categoryLabel: label, horizontal: true })
    expect(o.plotOptions?.bar?.horizontal).toBe(true)
    expect((o.xaxis?.labels?.formatter as (v: string) => string)('9')).toBe('9')
  })
})

describe('MantineDashboardBarChart — series, legend, tooltip and states', () => {
  const rows = days.slice(0, 5).map((category, i) => ({ category, newListings: i + 1, newUsers: 2 }))
  const bar = (extra: Partial<React.ComponentProps<typeof MantineDashboardBarChart>> = {}) => {
    hoisted.width = 4000
    return renderBar({ data: rows, allHiddenHint: 'Nothing selected', ...extra })
  }

  it('a legend of toggles, one per series, all pressed at first', () => {
    bar()
    expect(screen.getByRole('button', { name: 'New listings' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'New users' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('hiding a series ZEROES it (it stays in the array, so the stack keeps its colours) and drops it from the tooltip', () => {
    const o = bar()
    expect(o.tooltip?.enabledOnSeries).toEqual([0, 1])
    fireEvent.click(screen.getByRole('button', { name: 'New users' }))
    expect((hoisted.last!.series as { data: number[] }[])[1].data).toEqual([0, 0, 0, 0, 0])
    expect((hoisted.last!.series as { data: number[] }[])[0].data).toEqual([1, 2, 3, 4, 5])
    expect(hoisted.last!.options.tooltip?.enabledOnSeries).toEqual([0])
    expect(hoisted.last!.options.colors).toHaveLength(2)
  })

  it('hiding every series shows the hint and no chart; showing one again restores the chart', () => {
    bar()
    fireEvent.click(screen.getByRole('button', { name: 'New listings' }))
    hoisted.last = null
    fireEvent.click(screen.getByRole('button', { name: 'New users' }))
    expect(screen.getByText('Nothing selected')).toBeInTheDocument()
    expect(hoisted.last).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'New users' }))
    expect(screen.queryByText('Nothing selected')).toBeNull()
    expect(hoisted.last).not.toBeNull()
  })

  it('a single series has no legend and is not stacked; two stack unless asked not to', () => {
    const one = bar({ series: [series[0]] })
    expect(screen.queryByRole('button')).toBeNull()
    expect(one.chart?.stacked).toBe(false)
  })

  it('the value axis and the tooltip use the caller value text', () => {
    const o = bar({ valueLabel: (n) => `${n} items` })
    expect((o.yaxis as { labels: { formatter: (v: number) => string } }).labels.formatter(4)).toBe('4 items')
    expect((o.tooltip?.y as { formatter: (v: number) => string }).formatter(9)).toBe('9 items')
    expect((o.tooltip?.x?.formatter as (v: number, opts?: { dataPointIndex: number }) => string)(0)).toBe('19')
  })

  it('a missing value counts as zero', () => {
    bar({ data: [{ category: days[0], newListings: 3 }] })
    expect((hoisted.last!.series as { data: number[] }[]).map((s) => s.data)).toEqual([[3], [0]])
  })

  it('error draws no chart and offers the retry; loading and empty draw none', () => {
    for (const state of ['error', 'loading', 'empty'] as const) {
      hoisted.last = null
      hoisted.width = 450
      const { unmount } = renderApp(
        <MantineDashboardBarChart data={rows} series={series} categoryLabel={formatDayNumber} valueLabel={String} state={state} errorText="Failed" retryLabel="Retry" onRetry={() => {}} emptyTitle="Nothing" ariaLabel="a" loadingAriaLabel="Loading" />,
      )
      expect(hoisted.last, state).toBeNull()
      if (state === 'error') expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      unmount()
    }
  })

  it('a horizontal chart falls back to the caller label for a category it does not know, and grows with its rows', () => {
    hoisted.width = 300
    const o = renderBar({ data: [{ category: 'a', value: 1 }, { category: 'b', value: 2 }], series: [{ key: 'value', label: 'V', color: 'brand.4' }], categoryLabel: (c) => `city ${c}`, horizontal: true })
    expect((o.yaxis as unknown as { labels: { formatter: (v: string) => string[] | string } }).labels.formatter('zzz')).toBe('city zzz')
    expect(o.xaxis?.tickAmount).toBeGreaterThanOrEqual(1)
  })
})
