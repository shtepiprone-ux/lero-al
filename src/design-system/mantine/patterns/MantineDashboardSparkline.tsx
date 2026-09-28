'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, useMantineTheme } from '@mantine/core'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// `MantineDashboardBarChart.tsx`/`MantineDashboardLineChart.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface DashboardSparklineDatum {
  date: string
  value: number
}

export interface MantineDashboardSparklineProps {
  data: DashboardSparklineDatum[]
  /** A `theme.other.chartSeries` value (`'<colour>.<shade>'`) — never a hex/rgb literal. */
  color: string
  valueLabel: (value: number) => string
  dateLabel: (date: string) => string
  ariaLabel: string
}

/**
 * Canonical KPI mini bar chart (Task 889, D78-9), built against the Lahomes Analytics KPI row
 * (techzaa.in/lahomes/admin/index.html, top four cards), measured live 2026-09-27: 7 bars at the
 * project's existing `barColumnWidth` ratio (no new ratio added). Task 889 rev 4 (O889-1 row 1): the
 * chart fills its container's width, with a floor of `theme.other.dashboardChart.sparklineMinWidth`
 * (154 px, the measured Lahomes canvas), at a fixed `sparklineHeight` (95 px) — the same fluid-width,
 * fixed-height contract as `MantineDashboardBarChart`/`MantineDashboardLineChart`.
 *
 * A sparkline has no axes or legend (INFERENCE, kickoff §5) — the native ApexCharts tooltip is the
 * textual alternative, the same tooltip decision `MantineDashboardBarChart`/`MantineDashboardLineChart`
 * already use (D845-4). This pattern only feeds it text (`dateLabel`, `valueLabel`) and the theme
 * font; it draws none of it.
 *
 * Renders `null` for `data.length === 0` — there is no chart to show and no empty-state chrome for a
 * mini chart this small (the caller's own card/section owns any empty messaging). Zero values render
 * as zero-height bars — ApexCharts' own real bar-chart behaviour — never a fake baseline.
 *
 * Consumed by `MantineDashboardStatCard`'s `chart` slot (890/891, not wired in this task).
 */
export function MantineDashboardSparkline({ data, color, valueLabel, dateLabel, ariaLabel }: MantineDashboardSparklineProps) {
  const theme = useMantineTheme()
  const mirrorRef = useApexTooltipMirror()

  if (data.length === 0) return null

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      sparkline: { enabled: true },
      fontFamily: theme.fontFamily,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: theme.other.dashboardChart.animationSpeed },
    },
    colors: [resolveThemeColor(theme, color)],
    plotOptions: {
      bar: {
        columnWidth: theme.other.dashboardChart.barColumnWidth,
        borderRadius: theme.other.dashboardChart.barRadius,
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      style: { fontFamily: theme.fontFamily },
      // Task 889 rev 2 (O889-1 row 1, R11): ApexCharts' own compact tooltip form — one tight line
      // instead of the full 156×69 card — so it fits beside the cursor instead of sliding back over
      // the hovered bar (D845-4: native tooltip only, no custom renderer/CSS).
      compact: true,
      x: { formatter: (_value, opts) => dateLabel(data[opts?.dataPointIndex ?? 0]?.date ?? '') },
      y: { formatter: (value: number) => valueLabel(value) },
    },
  }

  const series = [{ name: ariaLabel, data: data.map((d) => d.value) }]

  return (
    <Box
      ref={mirrorRef}
      w="100%"
      miw={theme.other.dashboardChart.sparklineMinWidth}
      h={theme.other.dashboardChart.sparklineHeight}
      role="img"
      aria-label={ariaLabel}
    >
      <ReactApexChart options={options} series={series} type="bar" height="100%" width="100%" />
    </Box>
  )
}
