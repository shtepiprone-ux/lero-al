/**
 * The smaller chart patterns (Task 923 Revision 7): Sparkline, RadialProgress, ChartLegend, ChartStateFrame. They had no unit test at all.
 * Covers: what is handed to ApexCharts (tooltip text, clamped value, fluid width), the legend as a real toggle (aria-pressed, one onToggle per press,
 * a named group), and the loading / error / empty / ready frame (never a fabricated value on failure, retry reachable).
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { chartState, renderChart, stubMatchMedia, type ApexProps } from './chartTestKit'
import { renderApp } from './viewportKit'

vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { chartState.last = props; return <div data-testid="apex" /> },
}))
vi.mock('../useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: chartState.width, chartWidth: chartState.width > 0 ? chartState.width : '100%' }),
}))

import { MantineDashboardSparkline } from '../MantineDashboardSparkline'
import { MantineDashboardRadialProgress } from '../MantineDashboardRadialProgress'
import { MantineDashboardChartLegend } from '../MantineDashboardChartLegend'
import { MantineDashboardChartStateFrame } from '../MantineDashboardChartStateFrame'

beforeAll(stubMatchMedia)
beforeEach(() => { chartState.width = 0; chartState.last = null })

describe('MantineDashboardSparkline', () => {
  const data = [{ date: '2026-09-11', value: 3 }, { date: '2026-09-12', value: 0 }, { date: '2026-09-13', value: 5 }]
  const render = (extra: Partial<React.ComponentProps<typeof MantineDashboardSparkline>> = {}) => renderChart(
    <MantineDashboardSparkline data={data} color="brand.4" valueLabel={(n) => `${n} items`} dateLabel={(d) => `day ${d.slice(8)}`} ariaLabel="Listings, last 7 days" {...extra} />,
  )

  it('draws one bar per day, zero as zero (never a fake baseline), and names itself', () => {
    const p = render()
    expect((p.series as { data: number[] }[])[0].data).toEqual([3, 0, 5])
    expect(screen.getByRole('img', { name: 'Listings, last 7 days' })).toBeInTheDocument()
  })

  it('hands the tooltip the caller text for the hovered day and its value', () => {
    const o = render().options
    expect((o.tooltip?.x?.formatter as (v: number, opts: { dataPointIndex: number }) => string)(0, { dataPointIndex: 2 })).toBe('day 13')
    expect((o.tooltip?.y as { formatter: (v: number) => string }).formatter(5)).toBe('5 items')
  })

  it('takes the measured width of its box, 100% before it is measured', () => {
    expect(render().width).toBe('100%')
    chartState.width = 187
    expect(render().width).toBe(187)
  })

  it('has no axes or legend (a sparkline) and renders nothing for no data', () => {
    expect(render().options.chart?.sparkline?.enabled).toBe(true)
    chartState.last = null
    renderApp(<MantineDashboardSparkline data={[]} color="brand.4" valueLabel={String} dateLabel={String} ariaLabel="x" />)
    expect(chartState.last).toBeNull()
  })
})

describe('MantineDashboardRadialProgress', () => {
  const render = (value: number, state: 'ready' | 'loading' | 'error' | 'empty' = 'ready') => renderChart(
    <MantineDashboardRadialProgress value={value} label="Complete" formatValue={(n) => `${n}%`} color="brand.4" ariaLabel="Profile completeness" state={state} errorText="Failed" retryLabel="Retry" />,
  )

  it('clamps a value outside 0-100 for display, in the ring and in the centre text', () => {
    expect((render(140).series as number[])[0]).toBe(100)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('clamps below zero to an empty ring', () => {
    expect((render(-5).series as number[])[0]).toBe(0)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('draws the value as given inside the range and the caption under it', () => {
    render(64)
    expect(screen.getByText('64%')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('shows the empty state as an empty ring (the caller passes 0), never an empty frame', () => {
    expect((render(0, 'empty').series as number[])[0]).toBe(0)
  })

  it('draws no ring and fabricates no value in the error state', () => {
    chartState.last = null
    renderApp(<MantineDashboardRadialProgress value={64} label="Complete" formatValue={(n) => `${n}%`} color="brand.4" ariaLabel="x" state="error" errorText="Failed" retryLabel="Retry" onRetry={() => {}} />)
    expect(chartState.last).toBeNull()
    expect(screen.queryByText('64%')).toBeNull()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('MantineDashboardChartLegend', () => {
  const items = [
    { key: 'a', label: 'New listings', color: 'brand.4', visible: true },
    { key: 'b', label: 'New users', color: 'gray.4', visible: false },
  ]

  it('is a named group of toggles whose pressed state is the visibility of the series', () => {
    renderApp(<MantineDashboardChartLegend items={items} onToggle={() => {}} layout="row" ariaLabel="Series" />)
    expect(screen.getByRole('group', { name: 'Series' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New listings' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'New users' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggle once, with the key, for each press', () => {
    const onToggle = vi.fn()
    renderApp(<MantineDashboardChartLegend items={items} onToggle={onToggle} layout="column" columnWidth="200px" />)
    fireEvent.click(screen.getByRole('button', { name: 'New users' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('b')
  })

  it('lists every item in both layouts, label whole', () => {
    for (const layout of ['row', 'column'] as const) {
      const { unmount } = renderApp(<MantineDashboardChartLegend items={items} onToggle={() => {}} layout={layout} />)
      expect(screen.getAllByRole('button')).toHaveLength(2)
      unmount()
    }
  })
})

describe('MantineDashboardChartStateFrame', () => {
  const frame = (state: 'ready' | 'loading' | 'error' | 'empty') => renderApp(
    <MantineDashboardChartStateFrame state={state} emptyTitle="Nothing yet" errorText="Could not load" retryLabel="Try again" onRetry={() => {}} loadingAriaLabel="Loading chart">
      <p>the chart</p>
    </MantineDashboardChartStateFrame>,
  )

  it('ready shows the chart only', () => {
    frame('ready')
    expect(screen.getByText('the chart')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('loading is busy and named, with no chart and no value', () => {
    frame('loading')
    expect(screen.getByLabelText('Loading chart')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('the chart')).toBeNull()
  })

  it('error names the failure, offers the retry and shows no chart', () => {
    const onRetry = vi.fn()
    renderApp(<MantineDashboardChartStateFrame state="error" errorText="Could not load" retryLabel="Try again" onRetry={onRetry}><p>the chart</p></MantineDashboardChartStateFrame>)
    expect(screen.getByText('Could not load')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('the chart')).toBeNull()
  })

  it('empty states why and shows no chart', () => {
    frame('empty')
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.queryByText('the chart')).toBeNull()
  })
})


describe('chart family — tooltip text and fallbacks', () => {
  it('RadialProgress: the tooltip formats the value with the caller text', () => {
    const p = renderChart(<MantineDashboardRadialProgress value={64} label="Complete" formatValue={(n) => `${n} percent`} color="brand.4" ariaLabel="Profile completeness" state="ready" />)
    expect((p.options.tooltip?.y as { formatter: (v: number) => string }).formatter(64)).toBe('64 percent')
    expect(p.options.chart?.type).toBe('radialBar')
  })

  it('Sparkline: the tooltip day falls back to the first day when ApexCharts gives no index', () => {
    const p = renderChart(<MantineDashboardSparkline data={[{ date: '2026-09-11', value: 3 }, { date: '2026-09-12', value: 1 }]} color="brand.4" valueLabel={String} dateLabel={(d) => `day ${d.slice(8)}`} ariaLabel="x" />)
    expect((p.options.tooltip?.x?.formatter as (v: number, opts?: { dataPointIndex: number }) => string)(0)).toBe('day 11')
    expect((p.options.tooltip?.x?.formatter as (v: number, opts?: { dataPointIndex: number }) => string)(0, { dataPointIndex: 5 })).toBe('day ')
  })

  it('StateFrame: loading without a label is still busy', () => {
    renderApp(<MantineDashboardChartStateFrame state="loading"><p>chart</p></MantineDashboardChartStateFrame>)
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('StateFrame: error without a retry handler shows the text and no button', () => {
    renderApp(<MantineDashboardChartStateFrame state="error" errorText="Could not load"><p>chart</p></MantineDashboardChartStateFrame>)
    expect(screen.getByText('Could not load')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
