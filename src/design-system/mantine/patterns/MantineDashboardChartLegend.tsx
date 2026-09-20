'use client'

import { Group, Stack, Button, ColorSwatch, useMantineTheme } from '@mantine/core'
import { resolveThemeColor } from './dashboardChartTheme'

export interface DashboardChartLegendItem {
  key: string
  label: string
  /** A `theme.other.chartSeries`/theme-colour-reference value (`'<colour>.<shade>'`) or a bare
   * `theme.colors` name — never a hex/rgb literal. */
  color: string
  visible: boolean
}

export interface MantineDashboardChartLegendProps {
  items: DashboardChartLegendItem[]
  onToggle: (key: string) => void
  /** `row` wraps below the plot (Line/Bar); `column` sits beside it (Donut/SemiDonut/Radar). */
  layout: 'row' | 'column'
  /** `column` layout only: the `sm`+ width shared with the card header's own period control
   * (`theme.other.boxSize.dashboardPeriodColumn`). `base` stays full-width either way. */
  columnWidth?: string
  ariaLabel?: string
}

/**
 * The one canonical dot+label legend-toggle row/column shared by every `MantineDashboard*` chart
 * pattern (Task 845 Revision 1, W2 — previously a `LegendToggle` function copied six times, once
 * per pattern file, with two further divergent duplicates of the swatch/tooltip helpers). Reuses
 * the canonical `Button variant="subtle"` control (its own built-in hover fill, focus ring, active
 * state) rather than a hand-rolled `UnstyledButton` + local hover state, and stays hand-rolled
 * rather than ApexCharts' own legend, which is a bare, non-keyboard-operable `<span onclick>`, not
 * an `aria-pressed` control.
 *
 * The swatch size is `theme.other.iconSize.compact` (14px) for every consumer — the pre-Revision-1
 * Donut/SemiDonut copies used `iconSize.standard` (16px) instead, an undocumented divergence from
 * the other four patterns that also broke the tooltip marker's own "half the legend swatch"
 * relationship (`theme.other.dashboardChart.tooltipSwatchSize` = `iconSize.compact / 2`) for those
 * two charts specifically. Unifying on `compact` here fixes that inconsistency for every chart in
 * the family, not just the four that already used it.
 */
export function MantineDashboardChartLegend({ items, onToggle, layout, columnWidth, ariaLabel }: MantineDashboardChartLegendProps) {
  const theme = useMantineTheme()

  const buttons = items.map((item) => (
    <Button
      key={item.key}
      variant="subtle"
      size="compact-sm"
      aria-pressed={item.visible}
      onClick={() => onToggle(item.key)}
      leftSection={
        <ColorSwatch
          color={resolveThemeColor(theme, item.color)}
          size={theme.other.iconSize.compact}
          opacity={item.visible ? 1 : theme.other.dashboardChart.legendInactiveOpacity}
        />
      }
      c={item.visible ? 'gray.7' : 'gray.4'}
    >
      {item.label}
    </Button>
  ))

  if (layout === 'row') {
    return (
      <Group justify="flex-start" gap="xs" role="group" aria-label={ariaLabel} wrap="wrap">
        {buttons}
      </Group>
    )
  }

  return (
    <Stack gap="xs" align="flex-start" w={{ base: '100%', sm: columnWidth }} role="group" aria-label={ariaLabel}>
      {buttons}
    </Stack>
  )
}
