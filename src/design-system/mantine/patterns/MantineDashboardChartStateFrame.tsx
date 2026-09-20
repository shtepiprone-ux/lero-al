'use client'

import type { ReactNode } from 'react'
import { Button, Center, Flex, Skeleton, useMantineTheme } from '@mantine/core'
import { MantineEmptyLoadingErrorState } from './MantineEmptyLoadingErrorState'

export type DashboardChartState = 'ready' | 'loading' | 'empty' | 'error'

export interface MantineDashboardChartStateFrameProps {
  state: DashboardChartState
  emptyTitle?: string
  emptyDescription?: string
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
  /** Rendered only when `state === 'ready'`. */
  children?: ReactNode
}

/**
 * The one canonical loading / error / empty frame shared by every `MantineDashboard*` chart pattern
 * that takes a `state` prop (Task 845 Revision 2, X2 — previously the same three blocks were copied
 * into `MantineDashboardLineChart`/`BarChart`/`Donut`/`Radar`/`RadialProgress`, 14 render sites).
 *
 * Every state keeps the chart's own minimum block size (`theme.other.boxSize.dashboardChartMinHeight`,
 * spec v3.3 §17.2 ADM-10) so a card never collapses while its chart is not ready:
 *   - `loading` → a chart-height `Skeleton` (no axes, no digits), `aria-busy` + `aria-label`.
 *   - `error`   → the canonical `MantineEmptyLoadingErrorState` error state plus a Retry `Button`.
 *   - `empty`   → the canonical `MantineEmptyLoadingErrorState` empty state.
 *   - `ready`   → `children`.
 *
 * Composes `MantineEmptyLoadingErrorState` (Patterns/Mantine/EmptyLoadingErrorState); it never
 * re-implements that pattern's own markup.
 */
export function MantineDashboardChartStateFrame({
  state,
  emptyTitle,
  emptyDescription,
  errorText,
  retryLabel,
  onRetry,
  loadingAriaLabel,
  children,
}: MantineDashboardChartStateFrameProps) {
  const theme = useMantineTheme()

  if (state === 'loading') {
    return (
      <Flex mih={theme.other.boxSize.dashboardChartMinHeight} align="center" aria-busy="true" aria-label={loadingAriaLabel}>
        <Skeleton height={theme.other.boxSize.dashboardChartMinHeight} />
      </Flex>
    )
  }

  if (state === 'error') {
    return (
      <Center mih={theme.other.boxSize.dashboardChartMinHeight}>
        <MantineEmptyLoadingErrorState
          state="error"
          description={errorText}
          action={
            retryLabel ? (
              <Button variant="default" onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : undefined
          }
        />
      </Center>
    )
  }

  if (state === 'empty') {
    return (
      <Center mih={theme.other.boxSize.dashboardChartMinHeight}>
        <MantineEmptyLoadingErrorState state="empty" title={emptyTitle} description={emptyDescription} />
      </Center>
    )
  }

  return <>{children}</>
}
