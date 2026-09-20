'use client'

import type { ReactNode } from 'react'
import { Card, Group, Stack, Title, Text, Badge, Skeleton, Button, useMantineTheme } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'
import { MantineEmptyLoadingErrorState } from './MantineEmptyLoadingErrorState'

export type DashboardCardState = 'ready' | 'loading' | 'error' | 'stale'

export interface MantineDashboardCardProps {
  /** Section title. Kept visible in every state (spec §17.4 — error/stale never replace it). */
  title: string
  /** Scope label under the title (own line), e.g. "Now" or a formatted period ("Jun 2026"). */
  scopeLabel?: ReactNode
  /** Optional slot rendered on the header's trailing edge (e.g. a period control, a link). */
  headerAction?: ReactNode
  state: DashboardCardState
  /** `error` state message. */
  errorMessage?: string
  retryLabel?: string
  onRetry?: () => void
  /** `stale` state warning text, e.g. "Updated at". The caller supplies the already-formatted
   * time separately via `staleTime` so no string carries an interpolation placeholder. */
  staleLabel?: string
  staleTime?: ReactNode
  loadingAriaLabel?: string
  children?: ReactNode
}

/**
 * Canonical dashboard section-card shell (spec v3.3 §16.1, §17.1, §17.4).
 *
 * Wraps a Mantine `Card` (theme default: `withBorder`, radius `2xl`, padding `lg` — TailAdmin §6u).
 * Renders a header (title + optional scope label + optional header action) that stays visible in
 * every state, then a body driven by `state`:
 *   - `ready`   → `children`.
 *   - `loading` → skeleton body (no digits, no shimmer beyond the theme's own reduced-motion-aware
 *     `Skeleton` animation), `aria-busy` + `aria-label`.
 *   - `error`   → message + a Retry `Button` (never nested in a link — this pattern renders no
 *     link of its own).
 *   - `stale`   → `children` are still rendered, plus a warning `Badge` naming the last refresh
 *     time, per spec §17.4 ("stale shows the last valid value only together with a prominent
 *     'updated at …' warning").
 *
 * Every value is a Mantine prop or a `theme` key (spacing/radius/color/heading scale). No raw
 * px/rem/hex, no `className`, no `@/components/ui/*` import.
 *
 * Production consumers: 853 (`/admin`), 854 (`/{locale}/cabinet/statistics`). This task creates
 * only the pattern and its Story; no consumer is wired yet.
 */
export function MantineDashboardCard({
  title,
  scopeLabel,
  headerAction,
  state,
  errorMessage,
  retryLabel,
  onRetry,
  staleLabel,
  staleTime,
  loadingAriaLabel,
  children,
}: MantineDashboardCardProps) {
  const theme = useMantineTheme()

  const header = (
    <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
      <Stack gap="micro">
        <Title order={2} size="h5">
          {title}
        </Title>
        {scopeLabel && (
          <Text size="xs" c="gray.5">
            {scopeLabel}
          </Text>
        )}
      </Stack>
      {headerAction}
    </Group>
  )

  return (
    <Card withBorder>
      <Stack gap="md" aria-busy={state === 'loading' || undefined} aria-label={state === 'loading' ? loadingAriaLabel : undefined}>
        {header}

        {state === 'stale' && staleLabel && (
          <Badge
            color="yellow"
            leftSection={<AlertTriangle size={theme.other.iconSize.compact} aria-hidden="true" />}
          >
            {staleLabel} {staleTime}
          </Badge>
        )}

        {state === 'loading' ? (
          <Stack gap="sm">
            <Skeleton height={theme.fontSizes.md} width="70%" />
            <Skeleton height={theme.fontSizes.md} width="90%" />
            <Skeleton height={theme.fontSizes.md} width="55%" />
          </Stack>
        ) : state === 'error' ? (
          // Revision 1, F3 (GR-0 COMPOSE): title stays in `header` above (kept, per §16.2); the
          // body composes the canonical `MantineEmptyLoadingErrorState` error state instead of a
          // component-local clone of `Text`+`Button`. This pattern renders no link of its own.
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
        ) : (
          children
        )}
      </Stack>
    </Card>
  )
}
