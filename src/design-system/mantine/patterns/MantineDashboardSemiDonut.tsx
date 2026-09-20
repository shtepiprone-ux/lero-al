'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Box, Group, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartLegend } from './MantineDashboardChartLegend'
import { resolveThemeColor } from './dashboardChartTheme'
import { useApexTooltipMirror } from './useApexTooltipMirror'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// `MantineDashboardLineChart.tsx`/`MapWrapper.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface DashboardSemiDonutSegment {
  id: string
  label: string
  value: number
  /** A theme colour reference (`'<colour>.<shade>'`) or a bare `theme.colors` name. */
  color: string
  /** Initial visibility, default `true`. The component owns toggling after mount. */
  visible?: boolean
}

export interface MantineDashboardSemiDonutProps {
  segments: DashboardSemiDonutSegment[]
  valueLabel: (value: number) => string
  ariaLabel: string
}

/**
 * Semicircle status/category donut, built as a literal structural copy of TailAdmin's own "Semi
 * Donut Chart" (demo.tailadmin.com/pie-chart) — a distinct component from `MantineDashboardDonut`
 * (the full-ring pattern), not a variant of it, per the owner's explicit 2026-09-18 instruction.
 *
 * Owner revision 2026-09-19 (Pass 9): rebuilt on ApexCharts (`react-apexcharts`) — the real
 * library TailAdmin's own reference renders with. A top-facing 180° arc
 * (`plotOptions.pie.startAngle: -90, endAngle: 90`, ApexCharts' own "0 = top, clockwise"
 * convention) with a thin white gap between segments (`stroke.colors: [theme.white]`,
 * `stroke.width: theme.other.dashboardChart.semiDonutStrokeWidth`) and nothing drawn inside the
 * ring, matching the reference exactly. ApexCharts sizes its own plotting box to the actual swept
 * angle range, so there is no blank bottom-half box to crop and no risk of a phantom hit-test area
 * covering the legend underneath it.
 *
 * The legend below is the canonical `MantineDashboardChartLegend` (Task 845 Revision 1, W2 —
 * previously a hand-rolled `LegendToggle` local to this file): clicking one hides that segment
 * from the ring and mutes its legend item; the remaining segments' arcs reflow to fill the full
 * semicircle — no leftover gap — via ApexCharts' own real animation, never a hand-rolled one.
 *
 * No consumer wired yet. The 8 real listing statuses are not this component's data — mapping them
 * down to a small category set is a separate product decision, not one this pattern invents.
 *
 * Tooltip: the library's own native ApexCharts tooltip (Task 845 Revision 2, owner decision
 * 2026-09-19), configured the same way as `MantineDashboardDonut.tsx`.
 */
export function MantineDashboardSemiDonut({ segments, valueLabel, ariaLabel }: MantineDashboardSemiDonutProps) {
  const theme = useMantineTheme()
  const mirrorRef = useApexTooltipMirror()
  const { semiDonutSize, semiDonutHoleSize, expandOffset, semiDonutStrokeWidth, animationSpeed } = theme.other.dashboardChart
  // Same owner-requested behaviour as `MantineDashboardDonut.tsx`: keep ApexCharts' own click-to-
  // expand slide (`expandOnClick`, on by default), give its canvas the extra room that needs so the
  // expanded slice never clips at the container edge, and shrink the pie back down with
  // `customScale` so the resting arc still renders at the already-measured `semiDonutSize` diameter.
  const canvasSize = semiDonutSize + expandOffset * 2
  const canvasScale = semiDonutSize / canvasSize
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(
    () => new Set(segments.filter((s) => s.visible === false).map((s) => s.id)),
  )

  const toggleSegment = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Every segment stays in the array, in the same order, across every render, so ApexCharts'
  // colour/label alignment never shifts when a segment is toggled — the same rule
  // `MantineDashboardDonut.tsx` applies. A hidden segment is zeroed, not removed.
  const apexSeries = segments.map((s) => (hiddenIds.has(s.id) ? 0 : s.value))
  const apexLabels = segments.map((s) => s.label)
  const apexColors = segments.map((s) => resolveThemeColor(theme, s.color))

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: theme.fontFamily,
      animations: { enabled: true, speed: animationSpeed },
    },
    labels: apexLabels,
    colors: apexColors,
    stroke: { show: true, colors: [theme.white], width: semiDonutStrokeWidth },
    dataLabels: { enabled: false },
    legend: { show: false },
    // Native ApexCharts tooltip (Task 845 Revision 2, owner decision 2026-09-19): the library's own
    // tooltip is the correct behaviour — anchored to the hovered data point and kept inside the chart —
    // so it replaces the `Tooltip.Floating` layer of Pass 15/16. Only its text comes from the caller.
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
      style: { fontFamily: theme.fontFamily },
      y: { formatter: (value: number) => valueLabel(value) },
    },
    plotOptions: {
      pie: {
        customScale: canvasScale,
        startAngle: -90,
        endAngle: 90,
        donut: {
          size: semiDonutHoleSize,
          labels: { show: false },
        },
      },
    },
  }

  return (
    // Owner-reported (Task 845 Pass 15): same fix as `MantineDashboardDonut.tsx` — `justify=
    // "space-between"` plus the legend's matching `dashboardPeriodColumn` width push it to the
    // same trailing X as the card header's own period combobox.
    <Group justify="space-between" align="center" gap="xl" wrap="wrap">
      <Box ref={mirrorRef} w={canvasSize} h={canvasSize / 2}>
        <ReactApexChart options={options} series={apexSeries} type="donut" height={canvasSize} width={canvasSize} aria-label={ariaLabel} />
      </Box>

      {/* Owner revision 2026-09-19: a vertical dot+label legend column, not a row below the arc.
          Task 845 Pass 15: `sm` width matches `dashboardPeriodColumn` — see the outer `Group`'s
          own comment above. Mobile (full width) is unchanged. */}
      <MantineDashboardChartLegend
        items={segments.map((s) => ({ key: s.id, label: s.label, color: s.color, visible: !hiddenIds.has(s.id) }))}
        onToggle={toggleSegment}
        layout="column"
        columnWidth={theme.other.boxSize.dashboardPeriodColumn}
        ariaLabel={ariaLabel}
      />
    </Group>
  )
}
