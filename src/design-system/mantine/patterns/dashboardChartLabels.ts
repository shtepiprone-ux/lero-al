import { useEffect, useState } from 'react'
import { px, type MantineTheme } from '@mantine/core'

/**
 * Label layout for the ApexCharts dashboard patterns (Task 923, Revision 7, owner direction 2026-10-16: chart text must be
 * readable on a 320px screen, never cut or pushed out of its card, and follow established UX patterns).
 *
 * The patterns this implements, each from a primary source read on 2026-10-16 (`docs/sessions/evidence/task923/r8-76*.json`):
 *  - Material Design, Data visualization: "Text labels should be placed horizontally on the chart so that they are easy to read" and
 *    "Axis labels should be used as needed ... Their presence should not inhibit reading the chart" -> labels never rotate; when the
 *    axis is too narrow for every label, fewer labels are drawn (`fitLabelCount`), never rotated or overlapped.
 *  - The same page: "Chart elements can be labeled directly in simple charts. However, charts that are dense ... can display labels in a
 *    legend" -> a radar whose category names do not fit shows a number on each vertex and a numbered key below the plot.
 *  - WCAG 2.2 Reflow + the project mobile contract (`data-visualization-reflow`): required text wraps and its container grows; it is
 *    never ellipsised -> a category label wraps on its spaces (`wrapLabel`) and a single word is never cut.
 *  - Apple HIG, Charting data: "a chart needs to be large enough to comfortably display the details you need to include" -> the plot
 *    takes the width the labels leave, measured from the real text instead of a fixed reserve (`radarRadius`).
 *
 * Text is measured with a canvas 2D context in the font the page really resolved (`chartLabelFont`), so the layout follows the locale's
 * real strings (sq / en / uk / it) instead of a worst-case constant.
 */

let context: CanvasRenderingContext2D | null | undefined

/**
 * The font ApexCharts draws axis / category labels in: the theme's `xs` size in the font family the page really resolved. The theme's own
 * `fontFamily` is a `var(--font-...)` reference that a canvas does not understand (it silently keeps `10px sans-serif`, which measured
 * "Inquiries" at 38px instead of 50px, r8-79), so the family is read from the computed style of the body.
 */
export function chartLabelFont(theme: MantineTheme): string {
  const family = typeof document === 'undefined' ? theme.fontFamily : getComputedStyle(document.body).fontFamily || theme.fontFamily
  return `${Number(px(theme.fontSizes.xs))}px ${family}`
}

export function chartLabelSize(theme: MantineTheme): number {
  return Number(px(theme.fontSizes.xs))
}

/**
 * Width in px of `text` in `font`. Falls back to an average glyph width where there is no canvas (SSR, jsdom). Not cached: a web font is
 * loaded per unicode subset on first use, so a width kept from before that subset arrived would be wrong for good (`useChartLabelFont`
 * re-renders the chart once the strings' glyphs are loaded).
 */
export function textWidth(text: string, font: string): number {
  if (context === undefined) context = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  if (context) {
    context.font = font
    return context.measureText(text).width
  }
  return text.length * (Number.parseFloat(font) || 12) * 0.55
}

/**
 * `chartLabelFont`, once the glyphs of `texts` are loaded in it. The chart renders at once with the font as it is and renders again when
 * `document.fonts.load` has resolved for every string, so a label measured before its font subset arrived (Cyrillic, for the uk locale)
 * is measured again with the real one.
 */
export function useChartLabelFont(theme: MantineTheme, texts: string[]): string {
  const font = chartLabelFont(theme)
  const key = texts.join('\u0001')
  const [, bump] = useState(0)
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.load) return
    let alive = true
    Promise.all(texts.map((t) => document.fonts.load(font, t)))
      .then(() => { if (alive) bump((n) => n + 1) })
      .catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `texts`
  }, [font, key])
  return font
}

/**
 * Greedy word wrap: the lines of `text` that each fit `maxWidth`, breaking only at spaces. A word wider than `maxWidth` stays whole on
 * its own line (the label's box grows; a word is never split or cut). `maxWidth` 0 puts every word on its own line. Always at least one line.
 */
export function wrapLabel(text: string, maxWidth: number, font: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [text]
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && textWidth(candidate, font) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/** The width of the widest line of any label. */
export function widestLine(labels: string[][], font: string): number {
  let widest = 0
  for (const lines of labels) for (const line of lines) widest = Math.max(widest, textWidth(line, font))
  return widest
}

/**
 * How many axis labels fit `available` px side by side when each is `labelWidth` wide with `gap` between: at least 2 (the ends), at most
 * `total`. The chart draws that many labels, evenly spaced, all horizontal (Material: labels are placed horizontally).
 */
export function fitLabelCount(available: number, labelWidth: number, gap: number, total: number): number {
  if (total <= 2) return total
  const fit = Math.floor((available + gap) / (labelWidth + gap))
  return Math.max(2, Math.min(total, fit))
}

/**
 * The stride of a category axis: draw the label of every `stride`-th category (0, stride, 2 x stride ...). Chosen so the drawn labels, each
 * `labelWidth` wide, keep `gap` px between them inside `available` px (`fitLabelCount`). The labels are all horizontal and none overlaps
 * or touches its neighbour (Material: "Axis labels ... should not inhibit reading the chart").
 */
export function labelStride(available: number, labelWidth: number, gap: number, total: number): number {
  return Math.max(1, Math.ceil(total / fitLabelCount(available, labelWidth, gap, total)))
}

/**
 * The width of the plot of an axis chart whose box is `boxWidth` wide: the box less the value (y) labels and the room ApexCharts leaves around
 * them. Measured on the built Storybook (r8-83, a 246px box with 14px value labels leaves a 195px plot): that room is about 3.7 gaps, taken as 4.
 * An estimate that is only used to thin the category labels, so it errs on the narrow side.
 */
export function plotWidthOf(boxWidth: number, valueLabelWidth: number, gap: number): number {
  return Math.max(0, boxWidth - valueLabelWidth - 4 * gap)
}

/**
 * The largest polygon radius at which the radar's labels still fit a `width` x `height` box. The categories sit on a circle starting
 * at the top and running clockwise; the label of category i is anchored `offset` px beyond its polygon vertex (along x for a side label,
 * along y for a top / bottom one), text-anchored on the outer side (centred when it is near the top or bottom). Every label's extent
 * must stay inside the box on both axes.
 */
export function radarRadius(labels: string[][], font: string, lineHeight: number, offset: number, width: number, height: number, maxRadius: number): number {
  const n = labels.length
  let radius = maxRadius
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (360 * i) / n) * (Math.PI / 180)
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))
    const labelWidth = widestLine([labels[i]], font)
    const labelHeight = labels[i].length * lineHeight
    const sideways = cos > 0.2 ? labelWidth : labelWidth / 2
    const vertical = sin > 0.2 ? labelHeight : labelHeight / 2
    // measured on the built Storybook (r8-79): the label's anchor is the polygon vertex moved `offset` px along ONE axis (x for a side
    // label, y for a top / bottom one), not `offset` along the radius
    if (cos > 0.01) radius = Math.min(radius, (width / 2 - sideways - offset) / cos)
    if (sin > 0.01) radius = Math.min(radius, (height / 2 - vertical - offset) / sin)
  }
  return Math.max(0, Math.floor(radius))
}
