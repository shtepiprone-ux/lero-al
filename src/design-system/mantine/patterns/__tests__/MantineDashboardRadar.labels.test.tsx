/**
 * MantineDashboardRadar — category labels (Task 923 Revision 7, owner 2026-10-16): names wrap on their spaces and are never cut; where the
 * box is narrower than the full plot the vertices carry numbers and the names sit in a numbered key (Material: dense charts label in a legend);
 * the polygon is as large as the labels leave room for and never negative.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MantineProvider, px } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { chartState, renderChart, stubMatchMedia, tokens, type ApexProps } from './chartTestKit'

vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { chartState.last = props; return <div data-testid="apex" /> },
}))
vi.mock('../useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: chartState.width, chartWidth: chartState.width > 0 ? chartState.width : '100%' }),
}))

import { MantineDashboardRadar } from '../MantineDashboardRadar'

beforeAll(stubMatchMedia)
beforeEach(() => { chartState.width = 0 })

const names: Record<string, string> = { views: 'Listing views', contacts: 'Contacts received', saves: 'Saved listings', shares: 'Shares' }
const data = Object.keys(names).map((category, i) => ({ category, value: 10 + i * 5 }))
const series = [{ key: 'value', label: 'Value', color: 'brand.4' }]
const full = Number(px(tokens.boxSize.dashboardChartMinHeight))

function radar(width: number) {
  chartState.width = width
  return renderChart(<MantineDashboardRadar data={data} series={series} categoryLabel={(c) => names[c]} valueLabel={String} state="ready" ariaLabel="radar" />)
}
const label = (o: ApexProps['options'], c: string) => (o.xaxis?.labels?.formatter as (v: string) => string | string[])(c)

describe('MantineDashboardRadar — labels', () => {
  it('on a phone-width box the vertices carry numbers and the names are in a numbered key, every name whole', () => {
    const { options } = radar(280)
    expect(label(options, 'views')).toBe('1')
    expect(label(options, 'shares')).toBe('4')
    expect(screen.getAllByRole('listitem')).toHaveLength(data.length)
    for (const c of Object.keys(names)) expect(screen.getAllByText(new RegExp(names[c])).length).toBeGreaterThan(0)
  })

  it('at the full width the names stay on the plot, wrapped on their spaces (each word whole), with no key', () => {
    const { options } = radar(full + 200)
    const lines = label(options, 'contacts') as string[]
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.join(' ')).toBe(names.contacts)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('never draws a negative polygon, and a wider box never gives a smaller one', () => {
    const radii = [200, 280, 320, full - 1, full, full + 200].map((w) => {
      const { options } = radar(w)
      return (options.plotOptions as { radar?: { size?: number } })?.radar?.size ?? 0
    })
    for (const r of radii) expect(r).toBeGreaterThanOrEqual(0)
    for (let i = 1; i < radii.length; i++) expect(radii[i]).toBeGreaterThanOrEqual(radii[i - 1] - 0.5)
  })
})

describe('MantineDashboardRadar — series, legend, tooltip and states', () => {
  const two = [{ key: 'value', label: 'Value', color: 'brand.4' }, { key: 'other', label: 'Other', color: 'gray.4' }]
  const rows = Object.keys(names).map((category, i) => ({ category, value: 10 + i * 5, other: 3 + i }))
  const render2 = (extra: Partial<React.ComponentProps<typeof MantineDashboardRadar>> = {}) => {
    chartState.width = full + 200
    return renderChart(<MantineDashboardRadar data={rows} series={two} categoryLabel={(c) => names[c]} valueLabel={(n) => `${n} pts`} state="ready" ariaLabel="radar" allHiddenHint="Nothing selected" {...extra} />)
  }

  it('draws one polygon per series and a legend of toggles when there are two or more', () => {
    const p = render2()
    expect((p.series as { name: string }[]).map((s) => s.name)).toEqual(['Value', 'Other'])
    expect(screen.getByRole('button', { name: 'Value' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Other' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a single series has no legend', () => {
    chartState.width = full + 200
    renderChart(<MantineDashboardRadar data={rows} series={[two[0]]} categoryLabel={(c) => names[c]} valueLabel={String} state="ready" ariaLabel="radar" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hiding a series removes its polygon, hiding all shows the hint and no chart, showing one again restores it', () => {
    render2()
    fireEvent.click(screen.getByRole('button', { name: 'Other' }))
    expect((chartState.last!.series as { name: string }[]).map((s) => s.name)).toEqual(['Value'])
    expect(screen.getByRole('button', { name: 'Other' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Value' }))
    expect(screen.getByText('Nothing selected')).toBeInTheDocument()
    chartState.last = null
    fireEvent.click(screen.getByRole('button', { name: 'Other' }))
    expect(screen.queryByText('Nothing selected')).toBeNull()
    expect((chartState.last!.series as { name: string }[]).map((s) => s.name)).toEqual(['Other'])
  })

  it('the tooltip names the hovered category and formats the value, and the values are the caller data', () => {
    const p = render2()
    expect((p.options.tooltip?.x?.formatter as (v: number, o: { dataPointIndex: number }) => string)(0, { dataPointIndex: 1 })).toBe('Contacts received')
    expect((p.options.tooltip?.x?.formatter as (v: number, o?: { dataPointIndex: number }) => string)(0)).toBe('Listing views')
    expect((p.options.tooltip?.y as { formatter: (v: number) => string }).formatter(7)).toBe('7 pts')
    expect((p.series as { data: number[] }[])[0].data).toEqual(rows.map((r) => r.value))
  })

  it('before the box is measured the polygon has its full size and the names stay on the plot', () => {
    chartState.width = 0
    const p = renderChart(<MantineDashboardRadar data={rows} series={two} categoryLabel={(c) => names[c]} valueLabel={String} state="ready" ariaLabel="radar" />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(Array.isArray((p.options.xaxis?.labels?.formatter as (v: string) => unknown)('views'))).toBe(true)
    expect(p.width).toBe('100%')
  })

  it('a missing value counts as zero', () => {
    chartState.width = full + 200
    const p = renderChart(<MantineDashboardRadar data={[{ category: 'views' }]} series={[two[0]]} categoryLabel={(c) => names[c]} valueLabel={String} state="ready" ariaLabel="radar" />)
    expect((p.series as { data: number[] }[])[0].data).toEqual([0])
  })

  it('error and loading draw no chart; the error keeps its retry', () => {
    chartState.last = null
    chartState.width = full + 200
    render(
      <MantineProvider theme={theme} env="test">
        <MantineDashboardRadar data={rows} series={two} categoryLabel={(c) => names[c]} valueLabel={String} state="error" errorText="Failed" retryLabel="Retry" onRetry={() => {}} ariaLabel="radar" />
      </MantineProvider>,
    )
    expect(chartState.last).toBeNull()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
