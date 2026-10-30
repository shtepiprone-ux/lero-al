/**
 * MantineDashboardDonut — canvas size (Task 923 Revision 7, the Story 059 finding at 1024px): the ring never exceeds the card it sits in. The canvas is the
 * smaller of its fixed size and the measured width of its box, and the ring keeps its proportion through `customScale`.
 */
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { chartState, renderChart, stubMatchMedia, tokens, type ApexProps } from './chartTestKit'

vi.mock('next/dynamic', () => ({
  default: () => function ApexStub(props: ApexProps) { chartState.last = props; return <div data-testid="apex" /> },
}))
vi.mock('../useApexFluidBox', () => ({
  useApexFluidBox: () => ({ ref: () => {}, boxWidth: chartState.width, chartWidth: chartState.width > 0 ? chartState.width : '100%' }),
}))

import { MantineDashboardDonut } from '../MantineDashboardDonut'

beforeAll(stubMatchMedia)
beforeEach(() => { chartState.width = 0 })

const { donutSize, expandOffset } = tokens.dashboardChart
const fixed = donutSize + expandOffset * 2
const segments = [
  { key: 'a', label: 'Active', count: 10, color: 'green' },
  { key: 'b', label: 'Pending', count: 4, color: 'yellow' },
  { key: 'c', label: 'Archived', count: 2, color: 'gray' },
]

function donut(width: number) {
  chartState.width = width
  return renderChart(<MantineDashboardDonut segments={segments} formatCount={String} ariaLabel="status" state="ready" />)
}
const scale = (p: ApexProps) => (p.options.plotOptions as { pie?: { customScale?: number } })?.pie?.customScale

describe('MantineDashboardDonut — canvas size', () => {
  it('is the fixed size before the box is measured and in a box wider than it', () => {
    expect(donut(0).width).toBe(fixed)
    expect(donut(fixed + 300).width).toBe(fixed)
    expect(donut(fixed + 300).height).toBe(fixed)
  })

  it('is never wider than its box', () => {
    for (const w of [120, 180, fixed - 1, fixed]) {
      const p = donut(w)
      expect(p.width as number).toBeLessThanOrEqual(w)
      expect(p.height as number).toBeLessThanOrEqual(w)
    }
  })

  it('keeps the ring proportion whatever the canvas size', () => {
    const expected = donutSize / fixed
    for (const w of [0, 150, fixed, fixed + 200]) expect(scale(donut(w))).toBeCloseTo(expected, 6)
  })

  it('is square', () => {
    const p = donut(200)
    expect(p.width).toBe(p.height)
  })
})
