'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Stack, Group, Text, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// `MantineDashboardLineChart.tsx`/`MapWrapper.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface DashboardDonutSegment {
  key: string
  label: string
  count: number
  /** A theme colour reference (`'<colour>.<shade>'`) or a bare `theme.colors` name, e.g.
   * `listingStatusTone.ts`'s `LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR` values. */
  color: string
}

export interface MantineDashboardDonutProps {
  segments: DashboardDonutSegment[]
  formatCount: (n: number) => string
  ariaLabel: string
  state: DashboardChartState
  emptyText?: string
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
}

/** `listingStatusTone.ts`'s badge palette deliberately buckets several statuses onto the same
 * theme colour (`pending`/`expired` both `yellow`, `inactive`/`archived` both `gray` — spec §17.1's
 * semantic grouping, correct for a single badge shown alone). A donut renders every segment at
 * once, so two same-name-and-shade segments would be visually indistinguishable in the ring and
 * the legend — a defect no cited reference (TailAdmin, the owner's Figma kit) ever shows; every
 * segment there has a distinct swatch. Fixed by shifting a colliding segment to another shade of
 * the *same* theme colour (never a different hue, so the semantic bucket still reads as related) —
 * still a theme-scale reference, never a literal hex. */
function toColorRef(colorRef: string, defaultShade: number): string {
  return colorRef.includes('.') ? colorRef : `${colorRef}.${defaultShade}`
}

/** Resolves one stable `'<colour>.<shade>'` per segment, in the segment's own fixed array order —
 * never `visibleSegments`, so a toggle never reshuffles another segment's colour (the same class of
 * bug already fixed for the bar chart's stacking identity in Task 845 Pass 7). When a colour
 * collides with one already assigned, walks the shade scale in `shadeCollisionStep` increments
 * (then decrements, if the ceiling is hit) until a free shade of the *same* colour is found. */
function resolveDistinctSegmentColors(segments: DashboardDonutSegment[], defaultShade: number, shadeCollisionStep: number): Map<string, string> {
  const used = new Set<string>()
  const resolved = new Map<string, string>()
  for (const segment of segments) {
    const ref = toColorRef(segment.color, defaultShade)
    const [name, shadeText] = ref.split('.')
    const baseShade = Number(shadeText)
    let shade = baseShade
    let candidate = `${name}.${shade}`
    // Mantine colour tuples are always exactly 10 shades (index 0-9, `MantineColorsTuple`'s own
    // fixed type) — a structural bound of the colour-tuple API, not a measured/design visual
    // value, so these bounds stay inline literals rather than a `theme.other.dashboardChart` role.
    while (used.has(candidate) && shade + shadeCollisionStep <= 9) {
      shade += shadeCollisionStep
      candidate = `${name}.${shade}`
    }
    while (used.has(candidate) && shade - shadeCollisionStep >= 0) {
      shade -= shadeCollisionStep
      candidate = `${name}.${shade}`
    }
    used.add(candidate)
    resolved.set(segment.key, candidate)
  }
  return resolved
}

/**
 * Canonical dashboard status-distribution donut (spec v3.3 §17.2 ADM-11, and the agent portfolio
 * visibility donut, 855).
 *
 * Owner revision 2026-09-19 (Pass 9): rebuilt on ApexCharts (`react-apexcharts`) — the real library
 * TailAdmin's own reference renders with. A full ring with a bare total in the centre (a Mantine
 * `Text` absolutely positioned over the chart — kept, rather than ApexCharts' own built-in donut
 * centre label, so the total's typography stays a real Mantine heading scale, not a chart-library
 * style object). The legend sits beside the ring as the canonical `MantineDashboardChartLegend`
 * (Task 845 Revision 1, W2 — previously a hand-rolled `LegendToggle` local to this file): clicking
 * one hides that segment from the ring and mutes its swatch/label; clicking again restores it.
 * There is no click-to-navigate anywhere in this pattern — an owner-directed removal, not an
 * oversight. A segment with `count: 0` is listed muted-but-present and never drawn in the ring
 * (zero-value slices render as zero-width in ApexCharts, same as a toggled-off one — both go
 * through the identical code path below).
 *
 * Owner revision 2026-09-19 (Pass 13): restyled against ApexCharts' own "Rounded Spaced" donut
 * demo (apexcharts.com/javascript-chart-demos/pie-charts/rounded-spaced/) — `donutBorderRadius`/
 * `donutSpacing`/`donutHoleSize` are that demo's own configuration values, giving every segment
 * rounded corners and a visible gap from its neighbours, rather than the plain flush full ring
 * this pattern rendered before. Purely a `plotOptions.pie` styling change; the toggle/click/colour-
 * collision/expand-on-click behaviour above is unchanged.
 *
 * Tooltip: the library's own native ApexCharts tooltip (Task 845 Revision 2, owner decision
 * 2026-09-19). `fillSeriesColor: false` keeps the row on the neutral tooltip surface instead of the
 * segment's own pastel fill (ApexCharts defaults it to `true` for pie/donut).
 *
 * Production consumers: 853 (`/admin`), 855 (`/{locale}/cabinet/statistics`). This task creates
 * only the pattern and its Story; no consumer is wired yet.
 */
export function MantineDashboardDonut({
  segments,
  formatCount,
  ariaLabel,
  state,
  emptyText,
  errorText,
  retryLabel,
  onRetry,
  loadingAriaLabel,
}: MantineDashboardDonutProps) {
  const theme = useMantineTheme()
  const mirrorRef = useApexTooltipMirror()
  const {
    donutSize,
    donutHoleSize,
    expandOffset,
    donutBorderRadius,
    donutSpacing,
    animationSpeed,
    defaultShade,
    shadeCollisionStep,
  } = theme.other.dashboardChart
  // ApexCharts' own default `plotOptions.pie.expandOffset` (owner-requested: keep the click-to-
  // expand slide, don't disable it). The chart's own canvas needs this much extra room on every
  // side or the expanded slice clips at the edge (the original owner-reported bug); `customScale`
  // shrinks the pie back down inside that bigger canvas so the RESTING ring still renders at the
  // already-measured `donutSize` diameter.
  const canvasSize = donutSize + expandOffset * 2
  const canvasScale = donutSize / canvasSize
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())
  const distinctColors = useMemo(
    () => resolveDistinctSegmentColors(segments, defaultShade, shadeCollisionStep),
    [segments, defaultShade, shadeCollisionStep],
  )

  const toggleSegment = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleSegments = segments.filter((s) => !hiddenKeys.has(s.key))
  const total = visibleSegments.reduce((sum, s) => sum + s.count, 0)

  // Every segment stays in the arrays at a stable index (never filtered out) so ApexCharts' own
  // colour/label alignment never shifts when a segment is toggled — the same rule the bar chart
  // applies to its stacking identity. A hidden or genuinely-zero segment renders as a zero-width
  // slice, not a removed one.
  const apexSeries = segments.map((s) => (hiddenKeys.has(s.key) ? 0 : s.count))
  const apexLabels = segments.map((s) => s.label)
  const apexColors = segments.map((s) => resolveThemeColor(theme, distinctColors.get(s.key)!))

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: theme.fontFamily,
      animations: { enabled: true, speed: animationSpeed },
    },
    labels: apexLabels,
    colors: apexColors,
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    // Native ApexCharts tooltip (Task 845 Revision 2, owner decision 2026-09-19): the library's own
    // tooltip is the correct behaviour — anchored to the hovered data point and kept inside the chart —
    // so it replaces the `Tooltip.Floating` layer of Pass 15/16. Only its text comes from the caller.
    tooltip: {
      theme: 'light',
      // Defaults to `true` for pie/donut: it would paint the row with the segment's own pastel fill.
      fillSeriesColor: false,
      style: { fontFamily: theme.fontFamily },
      y: { formatter: (value: number) => formatCount(value) },
    },
    plotOptions: {
      pie: {
        customScale: canvasScale,
        borderRadius: donutBorderRadius,
        spacing: donutSpacing,
        donut: {
          size: donutHoleSize,
          labels: { show: false },
        },
      },
    },
  }

  return (
    <MantineDashboardChartStateFrame
      state={state}
      emptyDescription={emptyText}
      errorText={errorText}
      retryLabel={retryLabel}
      onRetry={onRetry}
      loadingAriaLabel={loadingAriaLabel}
    >
      {/* Owner-reported (Task 845 Pass 15): `justify="space-between"` pushes the legend column flush
          to this row's own trailing edge — the same edge the card header's `Group justify="space-
          between"` already pushes `headerAction` to — so, combined with the legend's now-matching
          `dashboardPeriodColumn` width, both trailing columns share one X. `wrap="wrap"` still lets
          the legend fall below the ring at mobile widths (Pass 12's own fix for this exact chart
          family). */}
      <Group justify="space-between" align="center" gap="xl" wrap="wrap">
        <Box ref={mirrorRef} pos="relative" w={canvasSize} h={canvasSize}>
          <ReactApexChart options={options} series={apexSeries} type="donut" height={canvasSize} width={canvasSize} aria-label={ariaLabel} />
          <Stack pos="absolute" inset={0} align="center" justify="center" gap={0} styles={{ root: { pointerEvents: 'none' } }}>
            <Text fw={700} size="xl" c="gray.8">
              {formatCount(total)}
            </Text>
          </Stack>
        </Box>

        {/* Owner revision 2026-09-19: a vertical dot+label legend column to the ring's right, not a row below it.
            TailAdmin's own "Donut Pie Chart 2" legend has no visible count or share.
            Each item is a toggle, never a link: clicking it hides/shows its segment and the ring +
            centre total recompute immediately from what is still visible.
            Owner-reported (Task 845 Pass 15): at ≥640px this column now shares
            `theme.other.boxSize.dashboardPeriodColumn` with the card header's own period
            `MantineCombobox` (`headerAction`) — both are fixed to the identical width and the outer
            `Group` above uses `justify="space-between"`, so both trailing columns start at the same
            X regardless of card width or locale, instead of the legend sitting wherever the ring's
            own width happened to leave it. Mobile (full width) is unchanged. */}
        <MantineDashboardChartLegend
          items={segments.map((s) => ({ key: s.key, label: s.label, color: distinctColors.get(s.key)!, visible: !hiddenKeys.has(s.key) }))}
          onToggle={toggleSegment}
          layout="column"
          columnWidth={theme.other.boxSize.dashboardPeriodColumn}
          ariaLabel={ariaLabel}
        />
      </Group>
    </MantineDashboardChartStateFrame>
  )
}
