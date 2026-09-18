'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Stack, Group, Text, Badge, Skeleton, Button, UnstyledButton, useMantineTheme } from '@mantine/core'
import { ChevronRight } from 'lucide-react'
import { MantineEmptyLoadingErrorState } from './MantineEmptyLoadingErrorState'

export type DashboardStatRowTone = 'positive' | 'warning' | 'danger' | 'neutral'

export interface DashboardStatRow {
  label: string
  /** The real numeric count — `allZeroState`'s "every row is 0" test reads this, never
   * `displayCount` (Revision 1, F1: a `ReactNode` count made that test unevaluable). */
  count: number
  /** Locale-formatted count for display, when it differs from the raw number (formatting stays
   * with the caller). Falls back to `count` when omitted. */
  displayCount?: ReactNode
  href: string
  tone?: DashboardStatRowTone
}

export interface MantineDashboardStatRowsProps {
  rows: DashboardStatRow[]
  /** Rendered instead of `rows` only when every row's `count` is `0` and the caller passes this
   * (spec §17.3 — AGT-01's three actions, ADM-09's two breakdown rows). */
  allZeroState?: { icon: ReactNode; text: ReactNode }
  state: 'ready' | 'loading' | 'error'
  /** Row count for the loading skeleton (defaults to `rows.length` when omitted). */
  loadingRowCount?: number
  errorMessage?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
}

const TONE_COLOR: Record<DashboardStatRowTone, string> = {
  positive: 'green',
  warning: 'yellow',
  danger: 'red',
  neutral: 'gray',
}

/**
 * Canonical dashboard labelled-count-row list (spec v3.3 §17.2 ADM-09, §17.3 AGT-01/AGT-02).
 *
 * Each row is its own `next/link` anchor with a minimum height of `theme.other.touchTarget`
 * (44px), a label, a count, an optional tone `Badge` (colour is never the only carrier — the
 * badge always shows text) and a trailing chevron (`iconSize.compact`).
 *
 * `allZeroState` replaces the rows only when the caller passes it AND every row's `count` is
 * actually `0` (Revision 1, F1) — this pattern evaluates that condition itself from `count`, so a
 * caller that always passes `allZeroState` can never hide a real non-zero action count.
 *
 * Production consumers: 853, 854 (not wired in this task).
 */
export function MantineDashboardStatRows({
  rows,
  allZeroState,
  state,
  loadingRowCount,
  errorMessage,
  retryLabel,
  onRetry,
  loadingAriaLabel,
}: MantineDashboardStatRowsProps) {
  const theme = useMantineTheme()

  if (state === 'loading') {
    const count = loadingRowCount ?? rows.length
    return (
      <Stack gap="sm" aria-busy="true" aria-label={loadingAriaLabel}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={theme.other.touchTarget} />
        ))}
      </Stack>
    )
  }

  if (state === 'error') {
    // Revision 1, F3 (GR-0 COMPOSE): the canonical error state is `MantineEmptyLoadingErrorState`
    // (`Alert color="red" variant="light"`, `description`, caller-built `action`) — not a
    // component-local clone of `Text`+`Button`.
    return (
      <MantineEmptyLoadingErrorState
        state="error"
        description={errorMessage}
        action={
          retryLabel ? (
            <Button variant="default" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : undefined
        }
      />
    )
  }

  if (allZeroState && rows.every((row) => row.count === 0)) {
    return (
      <Group gap="xs" py="sm">
        {allZeroState.icon}
        <Text size="sm" c="gray.5">
          {allZeroState.text}
        </Text>
      </Group>
    )
  }

  return (
    <Stack gap="xs">
      {rows.map((row) => (
        <UnstyledButton
          key={row.href}
          component={Link}
          href={row.href}
          mih={theme.other.touchTarget}
          display="block"
        >
          <Group justify="space-between" wrap="nowrap" gap="sm" mih={theme.other.touchTarget}>
            <Text size="sm" c="gray.8" lineClamp={2}>
              {row.label}
            </Text>
            <Group gap="xs" wrap="nowrap">
              {row.tone && (
                <Badge color={TONE_COLOR[row.tone]} variant="light" size="sm">
                  {row.displayCount ?? row.count}
                </Badge>
              )}
              {!row.tone && (
                <Text size="sm" fw={600} c="gray.8">
                  {row.displayCount ?? row.count}
                </Text>
              )}
              <ChevronRight size={theme.other.iconSize.compact} aria-hidden="true" />
            </Group>
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  )
}
