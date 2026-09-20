'use client'

import { useCallback, useRef } from 'react'
import { px, useMantineTheme } from '@mantine/core'

/**
 * Lets ApexCharts' native tooltip slide along its own width so it is never cut off by the screen or
 * by a clipping card (Task 845 Revision 2, owner direction 2026-09-19: the tooltip must move relative
 * to the cursor along its width instead of staying pinned by a corner).
 *
 * Why it is needed: ApexCharts' axis-chart tooltip (`Position.moveTooltip`) flips from the hovered
 * point only by comparing against the chart's own grid width, so on a small or narrow chart (a radar
 * in a 250px card) it can still land past the card edge. Its pie / donut tooltip
 * (`nonAxisChartsTooltips`) centres the box above the cursor (`x = clientX − left − ttWidth / 2`)
 * with no clamp at all. Measured 2026-09-19: up to 17px past the viewport and 33px past the card for
 * the donut, 71px past the viewport for the radar at 320px.
 *
 * The tooltip stays ApexCharts' own element with its own content and chrome. After ApexCharts writes
 * `style.left`, this moves it the smallest distance that fits inside the allowed area: the viewport
 * (`documentElement.clientWidth`, i.e. without a scrollbar) intersected with every clipping ancestor
 * of the tooltip (a Mantine `Card` clips with `overflow: hidden`), inset by `theme.spacing.xs`. Where
 * ApexCharts already fits, nothing changes; if the tooltip is wider than the area it is pinned to the
 * area's leading edge.
 *
 * The target is read from `style.left` (relative to the tooltip's offset parent), NOT from
 * `getBoundingClientRect()`: ApexCharts gives the tooltip a CSS transition on `left`, so its rect is
 * an in-between position while it moves and would produce a wrong correction.
 *
 * Returns a callback ref: attach it to the element that wraps the `ReactApexChart`.
 */
export function useApexTooltipMirror() {
  const theme = useMantineTheme()
  const edge = Number(px(theme.spacing.xs))
  const cleanup = useRef<(() => void) | null>(null)

  return useCallback(
    (container: HTMLElement | null) => {
      cleanup.current?.()
      cleanup.current = null
      if (!container) return

      const observer = new MutationObserver(() => {
        const tooltip = container.querySelector<HTMLElement>('.apexcharts-tooltip.apexcharts-active')
        const wrap = tooltip?.offsetParent
        if (!tooltip || !wrap) return

        let minLeft = edge
        let maxRight = document.documentElement.clientWidth - edge
        for (let el = tooltip.parentElement; el; el = el.parentElement) {
          if (getComputedStyle(el).overflowX === 'visible') continue
          const rect = el.getBoundingClientRect()
          minLeft = Math.max(minLeft, rect.left + edge)
          maxRight = Math.min(maxRight, rect.right - edge)
        }

        const wrapLeft = wrap.getBoundingClientRect().left
        const target = wrapLeft + parseFloat(tooltip.style.left || '0')
        const fitted = Math.max(minLeft, Math.min(target, maxRight - tooltip.offsetWidth))
        if (fitted !== target) tooltip.style.left = `${fitted - wrapLeft}px`
      })
      observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] })

      cleanup.current = () => observer.disconnect()
    },
    [edge],
  )
}
