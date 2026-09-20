'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Stack, Group, Text, px, useMantineTheme } from '@mantine/core'
import { useElementSize, useMergedRef } from '@mantine/hooks'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// `MantineDashboardLineChart.tsx`/`MapWrapper.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface DashboardRadarSeries {
  key: string
  label: string
  /** A `theme.other.chartSeries` value (`'<colour>.<shade>'`) — never a hex/rgb literal. */
  color: string
}

export type DashboardRadarDatum = { category: string } & Record<string, number | string>

export interface MantineDashboardRadarProps {
  data: DashboardRadarDatum[]
  series: DashboardRadarSeries[]
  /** The caller formats the category (axis) label; this pattern never formats one itself. */
  categoryLabel: (category: string) => string
  valueLabel: (value: number) => string
  state: DashboardChartState
  emptyTitle?: string
  emptyDescription?: string
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
  /** Negative flow: shown when every series is toggled off (multi-series). */
  allHiddenHint?: string
  ariaLabel: string
}

/**
 * Canonical dashboard radar chart, built against TailAdmin's own Radar Chart 2 (multi-series
 * comparison) reference (demo.tailadmin.com/radar-chart).
 *
 * Owner revision 2026-09-19 (Pass 9): rebuilt on ApexCharts (`react-apexcharts`) — the real
 * library TailAdmin's own reference renders with. A filled polygon per series with vertex
 * markers, no numeric radial-axis labels (`yaxis.labels.show: false`, matching the reference's
 * own bare category-only axis), a legend below the plot (the canonical
 * `MantineDashboardChartLegend`, Task 845 Revision 1 W2 — previously a hand-rolled `LegendToggle`
 * local to this file).
 *
 * Each series draws independently (no stacking dependency, unlike `MantineDashboardBarChart`), so
 * hiding one safely filters it out of the `series` array passed to the chart — there is no
 * stack-position cache for this to disturb.
 *
 * No consumer wired yet — created ahead of one, the same convention 843/844/845's other patterns
 * already follow.
 *
 * Tooltip: the library's own native ApexCharts tooltip (Task 845 Revision 2, owner decision
 * 2026-09-19 — it is anchored to the hovered vertex and stays inside the chart). This pattern only
 * feeds it text (`categoryLabel`, `valueLabel`) and the theme font.
 */
export function MantineDashboardRadar({
  data,
  series,
  categoryLabel,
  valueLabel,
  state,
  emptyTitle,
  emptyDescription,
  errorText,
  retryLabel,
  onRetry,
  loadingAriaLabel,
  allHiddenHint,
  ariaLabel,
}: MantineDashboardRadarProps) {
  const theme = useMantineTheme()
  const { radarSize, radarLabelReserve, radarStrokeWidth, radarFillOpacity, animationSpeed } =
    theme.other.dashboardChart
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())
  // The chart box is responsive (full width below `sm`, capped above it), so the polygon's radius
  // follows the box's real width: whatever is left after reserving room on both sides for the
  // category labels, never more than `radarSize`. `boxWidth` is 0 until first measured.
  const { ref: sizeRef, width: boxWidth } = useElementSize()
  const mirrorRef = useApexTooltipMirror()
  const chartBoxRef = useMergedRef(sizeRef, mirrorRef)
  const plotRadius = boxWidth > 0 ? Math.min(radarSize, (boxWidth - 2 * radarLabelReserve) / 2) : radarSize
  // The box is as tall as it is wide, up to `dashboardChartMinHeight` — a round plot in a taller box
  // is mostly blank space on a narrow screen.
  const maxBoxHeight = Number(px(theme.other.boxSize.dashboardChartMinHeight))
  const boxHeight = boxWidth > 0 ? Math.min(maxBoxHeight, boxWidth) : maxBoxHeight

  const visibleSeries = series.filter((s) => !hiddenKeys.has(s.key))

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const gridColor = resolveThemeColor(theme, 'gray.2')
  const axisTextColor = resolveThemeColor(theme, 'gray.5')

  const apexSeries = visibleSeries.map((s) => ({
    name: s.label,
    data: data.map((d) => Number(d[s.key] ?? 0)),
  }))

  const options: ApexOptions = {
    chart: {
      type: 'radar',
      fontFamily: theme.fontFamily,
      toolbar: { show: false },
      animations: { enabled: true, speed: animationSpeed },
    },
    colors: visibleSeries.map((s) => resolveThemeColor(theme, s.color)),
    stroke: { width: radarStrokeWidth },
    fill: { opacity: radarFillOpacity },
    plotOptions: {
      radar: {
        // The plot's own outer category labels were clipped by the SVG's own default UA
        // `overflow: hidden` when ApexCharts sized the radius itself (Task 845 Pass 12), so the radius
        // is explicit. Task 845 Revision 2: it is derived from the box's real width (`plotRadius`,
        // above) — the box used to be a fixed 24rem wide, which at 320px was wider than the card, so the
        // chart and its right-hand labels were cut off by the card's `overflow: hidden`.
        size: plotRadius,
        polygons: {
          strokeColors: gridColor,
          connectorColors: gridColor,
        },
      },
    },
    xaxis: {
      categories: data.map((d) => d.category),
      labels: {
        formatter: (v: string) => categoryLabel(v),
        style: { colors: axisTextColor, fontFamily: theme.fontFamily },
      },
    },
    yaxis: { show: false, labels: { show: false } },
    // Native ApexCharts tooltip (Task 845 Revision 2, owner decision 2026-09-19): the library's own
    // tooltip is the correct behaviour — anchored to the hovered vertex and kept inside the chart —
    // so it replaces the `Tooltip.Floating` layer of Pass 16. Only its text comes from the caller.
    tooltip: {
      theme: 'light',
      style: { fontFamily: theme.fontFamily },
      x: { formatter: (_value, opts) => categoryLabel(data[opts?.dataPointIndex ?? 0]?.category ?? '') },
      y: { formatter: (value: number) => valueLabel(value) },
    },
    legend: { show: false },
  }

  return (
    <MantineDashboardChartStateFrame
      state={state}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      errorText={errorText}
      retryLabel={retryLabel}
      onRetry={onRetry}
      loadingAriaLabel={loadingAriaLabel}
    >
      {/* Owner-reported (Task 845 Pass 12): `wrap="wrap"` (unlike an earlier `nowrap` attempt) lets
          the legend fall below the fixed-width chart box at narrow viewports (it carries
          a responsive `base`/`sm` width for exactly that layout). `justify="space-between"` (Task
          845 Pass 15, owner-reported): pushes the legend column to this row's own trailing edge,
          matching `MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`'s identical fix —
          combined with the legend's now-shared `dashboardPeriodColumn` width, it starts at the same X
          as the card header's own period combobox. */}
      <Group gap="xl" wrap="wrap" align="center" justify="space-between">
        <Box ref={chartBoxRef} h={boxHeight} w={{ base: '100%', sm: theme.other.boxSize.dashboardChartMinHeight }}>
          {visibleSeries.length === 0 ? (
            <Stack align="center" justify="center" h="100%" gap="xs">
              <Text size="sm" c="dimmed">
                {allHiddenHint}
              </Text>
            </Stack>
          ) : (
            <ReactApexChart options={options} series={apexSeries} type="radar" height="100%" width="100%" aria-label={ariaLabel} />
          )}
        </Box>

        {/* Owner revision 2026-09-19: a vertical legend column to the plot's right, not a row below it.
            Task 845 Pass 15: `sm` width matches `dashboardPeriodColumn` — see the outer `Group`'s own
            comment above. Mobile (full width) is unchanged. */}
        {series.length > 1 && (
          <MantineDashboardChartLegend
            items={series.map((s) => ({ key: s.key, label: s.label, color: s.color, visible: !hiddenKeys.has(s.key) }))}
            onToggle={toggleSeries}
            layout="column"
            columnWidth={theme.other.boxSize.dashboardPeriodColumn}
            ariaLabel={ariaLabel}
          />
        )}
      </Group>
    </MantineDashboardChartStateFrame>
  )
}
