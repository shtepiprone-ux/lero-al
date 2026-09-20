'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

// ApexCharts reads `window` at import time — never safe to render during SSR (Next.js §"client
// heavy libs", same pattern as `MapWrapper.tsx`'s Leaflet map).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

// `DashboardChartState` now lives with the shared frame (Task 845 Revision 2, X2); re-exported so
// every existing import from this file keeps compiling.
export type { DashboardChartState }

export interface DashboardLineChartSeries {
  key: string
  label: string
  /** A `theme.other.chartSeries` value (`'<colour>.<shade>'`) — never a hex/rgb literal. */
  color: string
}

export type DashboardLineChartDatum = { date: string } & Record<string, number | string>

export interface MantineDashboardLineChartProps {
  data: DashboardLineChartDatum[]
  /** `series[0]` is the primary metric (heaviest line/fill); every other entry renders thinner and
   * lighter, same relative treatment as TailAdmin's own Line Chart 1. */
  series: DashboardLineChartSeries[]
  /** `single` takes exactly one `series` entry and renders no legend row (855's per-event chart). */
  mode: 'multi' | 'single'
  /** The caller formats dates; this pattern never formats one itself. Feeds the dense X-axis
   * ticks — keep this one bare/short (the card's own `scopeLabel` states the shared month/year
   * context once; see `tooltipDateLabel` for the hover-detail label). */
  dateLabel: (date: string) => string
  /** The tooltip's own date label — a fuller, unambiguous date than the axis needs (e.g. "19
   * вересня" vs the axis's bare "19"), since a hover target has room a dense per-point tick does
   * not. Defaults to `dateLabel` when omitted (Task 845 Pass 10 — additive, backward compatible:
   * every pre-existing caller that never distinguished the two keeps its exact prior behaviour). */
  tooltipDateLabel?: (date: string) => string
  valueLabel: (value: number) => string
  state: DashboardChartState
  emptyTitle?: string
  emptyDescription?: string
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
  /** Negative flow: shown when every series is toggled off in `multi` mode (spec §17.4). */
  allHiddenHint?: string
  ariaLabel: string
}

/**
 * Canonical dashboard line/area chart (spec v3.3 §17.2 ADM-10, §17.3 AGT-03/04/05, §17.4).
 *
 * Owner revision 2026-09-19 (Pass 9): rebuilt on ApexCharts (`react-apexcharts`), the real library
 * `demo.tailadmin.com` itself renders with (confirmed live: `.apexcharts-*` DOM classes,
 * `.apexcharts-tooltip` markup, `window.ApexCharts`) — never a from-scratch approximation of its
 * behaviour on the previous recharts-based chart package. Every hover tooltip, point highlight, smooth curve, and
 * initial-draw/legend-toggle animation is the library's own real behaviour, not hand-rolled; this
 * pattern only supplies theme-derived styling (colours, font, grid, axis formatting) via
 * `ApexOptions` — no raw hex/px, every value a `theme.colors`/`theme.other` read.
 *
 * `series[0]` (the primary metric) renders as the heaviest line with the strongest gradient fill;
 * every other series is thinner with a lighter fill — matching the relative weight of TailAdmin's
 * own multi-series Line Chart 1. Y-axis ticks are ApexCharts' own default "nice" auto-scaling.
 *
 * The legend sits below the plot as the canonical `MantineDashboardChartLegend` (Task 845 Revision
 * 1, W2 — previously a hand-rolled `LegendToggle` local to this file). Toggling one removes that
 * series from the `series` array passed to the chart (never zeroed — safe for a non-stacked
 * area/line chart, unlike the bar chart's stacked-series identity constraint). Toggling every
 * series off shows `allHiddenHint` instead of rendering an empty plot.
 *
 * `single` mode (855's per-event AGT chart) takes exactly one `series` entry and renders no
 * legend row — there is nothing to toggle.
 *
 * Production consumers: 853 (`/admin`, multi), 855 (`/{locale}/cabinet/statistics`, both modes).
 * This task creates only the pattern and its Story; no consumer is wired yet.
 *
 * Tooltip: the library's own native ApexCharts tooltip (Task 845 Revision 2, owner decision
 * 2026-09-19 — it is anchored to the hovered point and stays inside the chart). This pattern only
 * feeds it text (`tooltipDateLabel`/`dateLabel`, `valueLabel`) and the theme font; it draws none of it.
 */
export function MantineDashboardLineChart({
  data,
  series,
  mode,
  dateLabel,
  tooltipDateLabel,
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
}: MantineDashboardLineChartProps) {
  const theme = useMantineTheme()
  const mirrorRef = useApexTooltipMirror()
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  const visibleSeries = mode === 'single' ? series : series.filter((s) => !hiddenKeys.has(s.key))

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
      type: 'area',
      fontFamily: theme.fontFamily,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: theme.other.dashboardChart.animationSpeed },
      sparkline: { enabled: false },
    },
    colors: visibleSeries.map((s) => resolveThemeColor(theme, s.color)),
    stroke: {
      curve: 'smooth',
      width: visibleSeries.map((_, i) => (i === 0 ? theme.other.dashboardChart.lineStrokeWidthPrimary : theme.other.dashboardChart.lineStrokeWidthSecondary)),
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: visibleSeries.map((_, i) => (i === 0 ? theme.other.dashboardChart.gradientOpacityPrimary : theme.other.dashboardChart.gradientOpacitySecondary)),
        opacityTo: 0,
        stops: theme.other.dashboardChart.lineGradientStops,
      },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: theme.other.dashboardChart.hoverMarkerSize } },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: data.map((d) => d.date),
      labels: {
        formatter: (v: string) => dateLabel(v),
        style: { colors: axisTextColor, fontFamily: theme.fontFamily },
        rotate: 0,
        hideOverlappingLabels: true,
      },
      tickPlacement: 'on',
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
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
      style: { fontFamily: theme.fontFamily },
      x: { formatter: (_value, opts) => (tooltipDateLabel ?? dateLabel)(data[opts?.dataPointIndex ?? 0]?.date ?? '') },
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
            <ReactApexChart options={options} series={apexSeries} type="area" height="100%" width="100%" aria-label={ariaLabel} />
          )}
        </Box>

        {mode === 'multi' && series.length > 1 && (
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
