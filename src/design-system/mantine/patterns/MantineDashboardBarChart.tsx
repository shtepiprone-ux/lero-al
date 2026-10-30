'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Stack, Text, px, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexFluidBox } from './useApexFluidBox'
import { chartLabelSize, fitLabelCount, labelStride, plotWidthOf, textWidth, useChartLabelFont, widestLine, wrapLabel } from './dashboardChartLabels'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// `MantineDashboardLineChart.tsx`/`MapWrapper.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface DashboardBarChartSeries {
  key: string
  label: string
  /** A `theme.other.chartSeries` value (`'<colour>.<shade>'`) — never a hex/rgb literal. */
  color: string
}

export type DashboardBarChartDatum = { category: string } & Record<string, number | string>

export interface MantineDashboardBarChartProps {
  data: DashboardBarChartDatum[]
  series: DashboardBarChartSeries[]
  /** The caller formats the category tick text; this pattern never formats one itself. */
  categoryLabel: (category: string) => string
  /** The tooltip's own category label — may need to be fuller than the axis tick (e.g. a
   * week-period axis shows a bare weekday abbreviation while the tooltip shows the weekday plus
   * the full date). Defaults to `categoryLabel` when omitted — additive, same precedent as
   * `MantineDashboardLineChart`'s `tooltipDateLabel` (Task 845 Pass 10). */
  tooltipCategoryLabel?: (category: string) => string
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
  /** Task 889 (D78-9): defaults to today's behaviour (`series.length > 1`). `stacked={false}` draws
   * two or more series as grouped (side-by-side) columns instead, so two different event types are
   * never visually summed. */
  stacked?: boolean
  /** Task 889 (D78-9): draws a top-N list as horizontal bars (891 top listings, 890 cities).
   * Categories stay in `xaxis.categories`; the value formatter moves to the x-axis and the category
   * formatter to the y-axis, and the grid lines switch to vertical. Defaults to `false`. */
  horizontal?: boolean
}

/**
 * Canonical dashboard bar chart, built against TailAdmin's own Bar Chart 1 (single series) and
 * Bar Chart 2 (multi-series, stacked) references (demo.tailadmin.com/bar-chart).
 *
 * Owner revision 2026-09-19 (Pass 9): rebuilt on ApexCharts (`react-apexcharts`) — the real library
 * TailAdmin's own reference renders with. `plotOptions.bar.borderRadiusWhenStacked: 'last'` is the
 * library's own real feature for "round only the top of the whole visible stack, keep every
 * internal boundary flush". Two or more series stack (`chart.stacked: true`); a single series
 * renders as plain (unstacked) columns. Every hover highlight, click-to-toggle-series animation,
 * and the reflow when a stacked segment collapses to zero height is the library's own real
 * behaviour.
 *
 * The legend sits below the plot as the canonical `MantineDashboardChartLegend` (Task 845 Revision
 * 1, W2 — previously a hand-rolled `LegendToggle` local to this file). Toggling one zeroes that
 * series' values rather than removing it from the `series` array passed to the chart — keeps every
 * series' stack position and colour identity stable for the component's whole lifetime (recharts'
 * pre-ApexCharts internal stack-cache bug this pattern originally worked around; kept
 * unconditionally here since re-deriving ApexCharts' own reordering guarantee under a
 * removed-vs-zeroed array is a bigger risk to verify than keeping the already-proven-safe
 * approach).
 *
 * No consumer wired yet — created ahead of one, the same convention 843/844/845's other patterns
 * already follow.
 *
 * Tooltip: the library's own native ApexCharts tooltip (Task 845 Revision 2, owner decision
 * 2026-09-19 — it is anchored to the hovered bar and stays inside the chart). This pattern only feeds
 * it text (`tooltipCategoryLabel`/`categoryLabel`, `valueLabel`) and the theme font, and lists only the
 * visible series (`enabledOnSeries`) since a hidden one is zeroed, not removed.
 */
export function MantineDashboardBarChart({
  data,
  series,
  categoryLabel,
  tooltipCategoryLabel,
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
  stacked,
  horizontal = false,
}: MantineDashboardBarChartProps) {
  const theme = useMantineTheme()
  const { ref: chartBoxRef, boxWidth, chartWidth } = useApexFluidBox()
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  const visibleSeries = series.filter((s) => !hiddenKeys.has(s.key))

  // Task 923 Revision 7. Material: labels stay horizontal and "should not inhibit reading the chart"; WCAG Reflow + the mobile contract:
  // required text wraps, it is never cut. Vertical bars: the category labels are thinned to the ones that fit with a gap between them.
  // Horizontal bars: a category name wraps on its spaces inside a column of at most `barCategoryMaxShare` of the box, so the bars keep the
  // rest; ApexCharts is told not to cut a line (no "...").
  const categoryNames = data.map((d) => categoryLabel(d.category))
  const labelFont = useChartLabelFont(theme, categoryNames)
  const labelGap = Number(px(theme.spacing.xs))
  const categoryLines = categoryNames.map((name) => (horizontal && boxWidth > 0 ? wrapLabel(name, boxWidth * theme.other.dashboardChart.barCategoryMaxShare, labelFont) : [name]))
  // The column ApexCharts reserves for the names is its own estimate (about 160px), narrower than a long name: the name then runs past the
  // canvas edge (measured 37px at 1440, r8-83). `minWidth` reserves the real width of the widest wrapped line.
  const categoryColumn = Math.ceil(widestLine(categoryLines, labelFont))
  // A wrapped name is as tall as its lines: the chart box grows so every row of bars is at least as tall as the tallest name plus a gap, instead of
  // two names overlapping (measured: a 6-line uk name is 96px in a 69px row, r8-83). Never below the token minimum height.
  const lineHeightPx = chartLabelSize(theme) * Number(theme.lineHeights.xs)
  const minBoxHeight = Number(px(theme.other.boxSize.dashboardChartMinHeight))
  const rowHeight = Math.max(0, ...categoryLines.map((lines) => lines.length)) * lineHeightPx + labelGap
  const boxHeight = horizontal ? Math.max(minBoxHeight, Math.ceil(data.length * rowHeight + lineHeightPx + 4 * labelGap)) : minBoxHeight
  const yTop = Math.max(0, ...series.flatMap((s) => data.map((d) => Number(d[s.key] ?? 0))))
  const { barColumnWidth, barColumnWidthDense, barDenseSlotWidth } = theme.other.dashboardChart
  // Apple HIG: a chart too packed with data is hard to use. When one category slot is narrower than `barDenseSlotWidth` (30 days in a
  // 200px plot), the bars fill more of their slot instead of shrinking to hairlines.
  const dense = !horizontal && boxWidth > 0 && plotWidthOf(boxWidth, textWidth(valueLabel(yTop), labelFont), labelGap) / Math.max(1, data.length) < barDenseSlotWidth
  // The value axis of a horizontal chart runs along the width: its labels ("0 20 40 60") are thinned to the ones that fit the plot with a gap
  // between them (an axis of n labels has n - 1 intervals; ApexCharts rounds them to nice values).
  const valueAxisIntervals = horizontal && boxWidth > 0
    ? Math.max(1, fitLabelCount(Math.max(0, boxWidth - categoryColumn - 2 * labelGap), textWidth(valueLabel(yTop), labelFont), labelGap, 11) - 1)
    : undefined
  const stride = !horizontal && boxWidth > 0
    ? labelStride(plotWidthOf(boxWidth, textWidth(valueLabel(yTop), labelFont), labelGap), widestLine([categoryNames], labelFont), labelGap, data.length)
    : 1

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
  const isStacked = stacked ?? series.length > 1

  const apexSeries = series.map((s) => ({
    name: s.label,
    data: data.map((d) => (hiddenKeys.has(s.key) ? 0 : Number(d[s.key] ?? 0))),
  }))

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: isStacked,
      fontFamily: theme.fontFamily,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: theme.other.dashboardChart.animationSpeed },
    },
    colors: series.map((s) => resolveThemeColor(theme, s.color)),
    plotOptions: {
      bar: {
        columnWidth: dense ? barColumnWidthDense : barColumnWidth,
        ...(horizontal
          ? { horizontal: true, barHeight: theme.other.dashboardChart.barColumnWidth }
          : {}),
        borderRadius: theme.other.dashboardChart.barRadius,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 0,
      xaxis: { lines: { show: horizontal } },
      yaxis: { lines: { show: !horizontal } },
    },
    xaxis: {
      categories: data.map((d) => d.category),
      ...(valueAxisIntervals ? { tickAmount: valueAxisIntervals } : {}),
      labels: horizontal
        ? {
            formatter: (v: string) => valueLabel(Number(v)),
            style: { colors: axisTextColor, fontFamily: theme.fontFamily, fontSize: `${chartLabelSize(theme)}px` },
          }
        : {
            formatter: (v: string) => (data.findIndex((d) => d.category === v) % stride === 0 ? categoryLabel(v) : ''),
            style: { colors: axisTextColor, fontFamily: theme.fontFamily, fontSize: `${chartLabelSize(theme)}px` },
            rotate: 0,
            hideOverlappingLabels: false,
          },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: horizontal
        ? {
            // a multi-line label is an array of lines; the column is as wide as the widest whole line, so ApexCharts has no reason to cut one
            formatter: (v: number | string) => {
              const i = data.findIndex((d) => d.category === String(v))
              return i >= 0 ? categoryLines[i] : categoryLabel(String(v))
            },
            // never let ApexCharts cut a line itself: the lines are already wrapped to fit `barCategoryMaxShare` of the box above
            maxWidth: boxWidth > 0 ? boxWidth : 160,
            minWidth: categoryColumn,
            style: { colors: axisTextColor, fontFamily: theme.fontFamily, fontSize: `${chartLabelSize(theme)}px` },
          }
        : {
            formatter: (v: number) => valueLabel(v),
            style: { colors: axisTextColor, fontFamily: theme.fontFamily, fontSize: `${chartLabelSize(theme)}px` },
          },
    },
    // Native ApexCharts tooltip (Task 845 Revision 2, owner decision 2026-09-19): the library's own
    // tooltip is the correct behaviour — anchored to the hovered data point and kept inside the chart —
    // so it replaces the `Tooltip.Floating` layer of Pass 15/16. Only its text comes from the caller.
    // `enabledOnSeries`: a hidden series stays in the array (zeroed, to keep stack identity), so it
    // must not appear in the shared tooltip as a "0" row.
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
      enabledOnSeries: series.flatMap((s, i) => (hiddenKeys.has(s.key) ? [] : [i])),
      style: { fontFamily: theme.fontFamily },
      x: { formatter: (_value, opts) => (tooltipCategoryLabel ?? categoryLabel)(data[opts?.dataPointIndex ?? 0]?.category ?? '') },
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
      <Stack gap="md">
        <Box ref={chartBoxRef} h={boxHeight}>
          {visibleSeries.length === 0 ? (
            <Stack align="center" justify="center" h="100%" gap="xs">
              <Text size="sm" c="dimmed">
                {allHiddenHint}
              </Text>
            </Stack>
          ) : (
            <ReactApexChart options={options} series={apexSeries} type="bar" height="100%" width={chartWidth} aria-label={ariaLabel} />
          )}
        </Box>

        {series.length > 1 && (
          <MantineDashboardChartLegend
            items={series.map((s) => ({ key: s.key, label: s.label, color: s.color, visible: !hiddenKeys.has(s.key) }))}
            onToggle={toggleSeries}
            layout="row"
            ariaLabel={ariaLabel}
          />
        )}
      </Stack>
    </MantineDashboardChartStateFrame>
  )
}
