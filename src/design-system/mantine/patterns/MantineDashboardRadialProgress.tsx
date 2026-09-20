'use client'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { Stack, Text, Box, useMantineTheme } from '@mantine/core'
import { MantineDashboardChartStateFrame, type DashboardChartState } from './MantineDashboardChartStateFrame'
import { resolveThemeColor } from './dashboardChartTheme'

// ApexCharts reads `window` at import time — never safe to render during SSR (same pattern as
// every other chart in this family / `MapWrapper.tsx`).
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

export interface MantineDashboardRadialProgressProps {
  /** 0–100. The pattern clamps display only; it never recomputes or validates the business value. */
  value: number
  /** Caption under the centre value, e.g. "Total". */
  label: string
  formatValue: (value: number) => string
  /** A `theme.other.chartSeries` value (`'<colour>.<shade>'`) — never a hex/rgb literal. */
  color: string
  ariaLabel: string
  state: DashboardChartState
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
}

/**
 * Canonical dashboard radial progress ring, built against TailAdmin's own "Radial Progress Chart"
 * reference (demo.tailadmin.com/radial-chart): a single value drawn as a full-circle progress arc
 * over a light track, with a centred value + caption.
 *
 * Owner revision 2026-09-19 (Pass 9 follow-up): built on ApexCharts (`react-apexcharts`,
 * `type="radialBar"`) — the real library every other chart in this family runs on. ApexCharts' own
 * `radialBar` series is a literal 0–100 percentage array, not chart-scaled data (unlike
 * the previous package's `RadialBarChart`, whose single-row-dataset auto-scaling this pattern's first
 * attempt hit and abandoned pre-ApexCharts). `plotOptions.radialBar.hollow.size` reads
 * `theme.other.dashboardChart.radialHollowSize` (TailAdmin's measured ring thickness).
 *
 * The centre value/caption stays a real Mantine `Text` absolutely positioned over the chart
 * (`dataLabels` disabled), the same choice `MantineDashboardDonut.tsx` makes, so the typography is
 * a real heading/text scale, never a chart-library label style.
 *
 * A single value has nothing to toggle, so this pattern has no legend — unlike every other chart
 * in the family, which all compare 2+ series/segments.
 *
 * No consumer wired yet — created ahead of one, the same convention 843/844/845's other patterns
 * already follow.
 */
export function MantineDashboardRadialProgress({
  value,
  label,
  formatValue,
  color,
  ariaLabel,
  state,
  errorText,
  retryLabel,
  onRetry,
  loadingAriaLabel,
}: MantineDashboardRadialProgressProps) {
  const theme = useMantineTheme()
  const { radialSize, radialHollowSize, animationSpeed } = theme.other.dashboardChart

  // `state === 'empty'` has no meaningful shape for a single progress value — the caller passes
  // `value={0}` instead, which renders correctly as an empty ring.
  const clamped = Math.max(0, Math.min(100, value))
  const trackColor = resolveThemeColor(theme, 'gray.2')

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: theme.fontFamily,
      animations: { enabled: true, speed: animationSpeed },
    },
    colors: [resolveThemeColor(theme, color)],
    plotOptions: {
      radialBar: {
        hollow: { size: radialHollowSize },
        track: { background: trackColor },
        dataLabels: { show: false },
      },
    },
    stroke: { lineCap: 'round' },
    tooltip: {
      theme: 'light',
      y: { formatter: (v: number) => formatValue(v) },
    },
  }

  return (
    <MantineDashboardChartStateFrame
      // `empty` renders the ring (see the comment above), so it maps to the frame's `ready`.
      state={state === 'empty' ? 'ready' : state}
      errorText={errorText}
      retryLabel={retryLabel}
      onRetry={onRetry}
      loadingAriaLabel={loadingAriaLabel}
    >
      <Stack align="center" justify="center" mih={theme.other.boxSize.dashboardChartMinHeight} gap={0}>
        <Box pos="relative" w={radialSize} h={radialSize}>
          <ReactApexChart options={options} series={[clamped]} type="radialBar" height={radialSize} width={radialSize} aria-label={ariaLabel} />
          <Stack pos="absolute" inset={0} align="center" justify="center" gap={0} styles={{ root: { pointerEvents: 'none' } }}>
            <Text size="xs" c="gray.5">
              {label}
            </Text>
            <Text fw={700} size="xl" c="gray.8">
              {formatValue(clamped)}
            </Text>
          </Stack>
        </Box>
      </Stack>
    </MantineDashboardChartStateFrame>
  )
}
