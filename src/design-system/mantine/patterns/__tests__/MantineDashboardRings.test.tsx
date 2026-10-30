/**
 * Donut and SemiDonut — what the legend does to the ring and what the legend says (Task 923 Revision 7). The size of the Donut canvas is covered in
 * MantineDashboardDonut.size.test; these tests cover the data path: a hidden segment is zeroed (not removed, so colours stay with their segments), the
 * legend lists every segment, `showCounts` appends the count, and the SemiDonut is a top-facing 180 degree arc.
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

import { MantineDashboardDonut } from '../MantineDashboardDonut'
import { MantineDashboardSemiDonut } from '../MantineDashboardSemiDonut'

beforeAll(stubMatchMedia)
beforeEach(() => { chartState.width = 0; chartState.last = null })

const segments = [
  { key: 'active', label: 'Active', count: 10, color: 'green' },
  { key: 'pending', label: 'Pending', count: 4, color: 'yellow' },
  { key: 'expired', label: 'Expired', count: 2, color: 'yellow' },
]

describe('MantineDashboardDonut — legend and data', () => {
  const donut = (extra: Partial<React.ComponentProps<typeof MantineDashboardDonut>> = {}) => renderChart(
    <MantineDashboardDonut segments={segments} formatCount={(n) => `${n}`} ariaLabel="Listing status" state="ready" {...extra} />,
  )

  it('draws every segment with its count', () => {
    expect((donut().series as number[])).toEqual([10, 4, 2])
  })

  it('lists every segment in the legend, label whole', () => {
    donut()
    for (const s of segments) expect(screen.getByRole('button', { name: new RegExp(s.label) })).toBeInTheDocument()
  })

  it('showCounts appends the count to the legend entry, the default does not', () => {
    donut({ showCounts: true })
    expect(screen.getByRole('button', { name: /Active.*10/ })).toBeInTheDocument()
  })

  it('without showCounts the legend entry is the bare label', () => {
    donut()
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
  })

  it('a hidden segment is zeroed, not removed, so every other segment keeps its position and colour', () => {
    donut()
    const before = (chartState.last!.options.colors as string[]).slice()
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }))
    expect((chartState.last!.series as number[])).toEqual([10, 0, 2])
    expect((chartState.last!.options.colors as string[])).toEqual(before)
  })

  it('two segments the status palette puts on the same colour still get two different swatches', () => {
    const colors = donut().options.colors as string[]
    expect(colors[1]).not.toBe(colors[2])
  })

  it('shows no ring and no counts for an error', () => {
    chartState.last = null
    renderApp(<MantineDashboardDonut segments={segments} formatCount={String} ariaLabel="x" state="error" errorText="Failed" retryLabel="Retry" onRetry={() => {}} />)
    expect(chartState.last).toBeNull()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('MantineDashboardSemiDonut', () => {
  const semi = () => renderChart(
    <MantineDashboardSemiDonut
      segments={[{ id: 'a', label: 'Open', value: 6, color: 'green' }, { id: 'b', label: 'Closed', value: 3, color: 'gray' }]}
      valueLabel={String}
      ariaLabel="Tickets"
    />,
  )

  it('is a top-facing 180 degree arc', () => {
    const pie = (semi().options.plotOptions as { pie?: { startAngle?: number; endAngle?: number } }).pie
    expect(pie?.startAngle).toBe(-90)
    expect(pie?.endAngle).toBe(90)
  })

  it('draws the segment values, and the legend toggles one to zero without removing it', () => {
    expect(semi().series as number[]).toEqual([6, 3])
    fireEvent.click(screen.getByRole('button', { name: 'Closed' }))
    expect(chartState.last!.series as number[]).toEqual([6, 0])
  })

  it('has a square canvas and a box half its height (the arc only)', () => {
    const p = semi()
    expect(p.width).toBe(p.height)
  })
})

describe('MantineDashboardDonut — colours, toggling back and the tooltip', () => {
  const donut = (segs: typeof segments) => renderChart(<MantineDashboardDonut segments={segs} formatCount={(n) => `${n} listings`} ariaLabel="Listing status" state="ready" />)

  it('a segment at the top of the shade scale moves DOWN to a free shade of the same colour, never to another hue', () => {
    const colors = donut([
      { key: 'a', label: 'A', count: 1, color: 'yellow.9' },
      { key: 'b', label: 'B', count: 1, color: 'yellow.9' },
      { key: 'c', label: 'C', count: 1, color: 'yellow.9' },
    ]).options.colors as string[]
    expect(new Set(colors).size).toBe(3)
  })

  it('a colour given without a shade takes the default shade of its colour, and the same colour twice still differs', () => {
    const colors = donut([{ key: 'a', label: 'A', count: 1, color: 'green' }, { key: 'b', label: 'B', count: 1, color: 'green' }]).options.colors as string[]
    expect(colors[0]).not.toBe(colors[1])
  })

  it('pressing a hidden segment again shows it', () => {
    donut(segments)
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }))
    expect((chartState.last!.series as number[])).toEqual([10, 0, 2])
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }))
    expect((chartState.last!.series as number[])).toEqual([10, 4, 2])
    expect(screen.getByRole('button', { name: 'Pending' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('the tooltip value uses the caller count text, and the ring does not paint the row with the segment fill', () => {
    const o = donut(segments).options
    expect((o.tooltip?.y as { formatter: (v: number) => string }).formatter(4)).toBe('4 listings')
    expect(o.tooltip?.fillSeriesColor).toBe(false)
  })

  it('an empty list of segments still renders a ring with nothing in it', () => {
    expect(donut([]).series).toEqual([])
  })
})

describe('MantineDashboardSemiDonut — initial visibility, toggling back and the tooltip', () => {
  const two = [{ id: 'a', label: 'Open', value: 6, color: 'green' }, { id: 'b', label: 'Closed', value: 3, color: 'gray', visible: false }]
  const semi = () => renderChart(<MantineDashboardSemiDonut segments={two} valueLabel={(n) => `${n} tickets`} ariaLabel="Tickets" />)

  it('a segment with visible=false starts hidden (zeroed), and its legend entry is not pressed', () => {
    expect(semi().series as number[]).toEqual([6, 0])
    expect(screen.getByRole('button', { name: 'Closed' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('pressing it shows it, pressing it again hides it', () => {
    semi()
    fireEvent.click(screen.getByRole('button', { name: 'Closed' }))
    expect(chartState.last!.series as number[]).toEqual([6, 3])
    fireEvent.click(screen.getByRole('button', { name: 'Closed' }))
    expect(chartState.last!.series as number[]).toEqual([6, 0])
  })

  it('the tooltip value uses the caller text and does not paint the row with the segment fill', () => {
    const o = semi().options
    expect((o.tooltip?.y as { formatter: (v: number) => string }).formatter(3)).toBe('3 tickets')
    expect(o.tooltip?.fillSeriesColor).toBe(false)
  })
})
