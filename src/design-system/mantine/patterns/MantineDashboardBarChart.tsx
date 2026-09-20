'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

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
}: MantineDashboardBarChartProps) {
  const theme = useMantineTheme()
  const mirrorRef = useApexTooltipMirror()
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

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
  const isStacked = series.length > 1

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
        columnWidth: theme.other.dashboardChart.barColumnWidth,
        borderRadius: theme.other.dashboardChart.barRadius,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: data.map((d) => d.category),
      labels: {
        formatter: (v: string) => categoryLabel(v),
        style: { colors: axisTextColor, fontFamily: theme.fontFamily },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (v: number) => valueLabel(v),
        style: { colors: axisTextColor, fontFamily: theme.fontFamily },
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
        <Box ref={mirrorRef} h={theme.other.boxSize.dashboardChartMinHeight}>
          {visibleSeries.length === 0 ? (
            <Stack align="center" justify="center" h="100%" gap="xs">
              <Text size="sm" c="dimmed">
                {allHiddenHint}
              </Text>
            </Stack>
          ) : (
            <ReactApexChart options={options} series={apexSeries} type="bar" height="100%" width="100%" aria-label={ariaLabel} />
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
