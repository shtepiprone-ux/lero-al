import type { MantineTheme } from '@mantine/core'

/**
 * A theme colour reference (`'<colour>.<shade>'`, shade defaulting to
 * `theme.other.dashboardChart.defaultShade`) resolved to a real CSS value — ApexCharts (SVG
 * `fill`/`stroke` attributes, not React style props) and `ColorSwatch` both need an actual colour
 * string, never a theme key. Shared by every `MantineDashboard*` chart pattern (Task 845 Revision
 * 1, W2 — previously copied six times, once per pattern file).
 */
export function resolveThemeColor(theme: MantineTheme, colorRef: string): string {
  const [name, shadeText] = colorRef.split('.')
  const shade = shadeText ? Number(shadeText) : theme.other.dashboardChart.defaultShade
  return theme.colors[name]?.[shade] ?? colorRef
}
