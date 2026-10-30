'use client'

import { useElementSize, useMergedRef } from '@mantine/hooks'
import { useApexTooltipMirror } from './useApexTooltipMirror'

/**
 * The wrapper of a fluid ApexCharts canvas: its callback ref, and the width to hand to `ReactApexChart`
 * (Task 923, Revision 7, the Story 059 finding).
 *
 * Why it is needed: with `width="100%"` ApexCharts reads its parent's width once, when it draws, and
 * afterwards redraws only when its own observer reports a parent resize. A parent that narrows between
 * that one read and the observer being attached (a stat card whose width settles after the first paint,
 * a page scrollbar that appears once the content is taller) leaves the canvas wider than its card for
 * good. Measured on the built Storybook with the CPU throttled 8x: 2 of 80 sparkline rows kept a canvas
 * 5 / 8 / 15 px wider than the card, and the same widths 3 s later (`r8-68` probe, evidence of Task 923).
 *
 * The fix is to make the container's own measurement the single source of the canvas width: Mantine's
 * `useElementSize` (a ResizeObserver) reports the wrapper's width and every change of it, and the chart
 * receives that number as its `width`; `react-apexcharts` redraws the canvas when it changes. Until the
 * first measurement the chart keeps `"100%"`, which is what it had before.
 *
 * `useApexTooltipMirror` stays merged into the same ref, so a chart wrapper still has exactly one ref.
 * `boxWidth` is 0 until first measured. The width is floored so a fractional container width (461.5) can
 * never leave a canvas past it.
 */
export function useApexFluidBox() {
  const { ref: sizeRef, width: boxWidth } = useElementSize()
  const mirrorRef = useApexTooltipMirror()
  const ref = useMergedRef(sizeRef, mirrorRef)
  const chartWidth: number | string = boxWidth > 0 ? Math.floor(boxWidth) : '100%'
  return { ref, boxWidth, chartWidth }
}
