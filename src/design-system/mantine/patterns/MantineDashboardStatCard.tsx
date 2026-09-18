'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, Group, Stack, Text, ThemeIcon, Skeleton, Button, useMantineTheme } from '@mantine/core'
import { Check } from 'lucide-react'
import { VARIANT_COLORS } from '@/design-system/mantine/notificationVariants'
import { MantineEmptyLoadingErrorState } from './MantineEmptyLoadingErrorState'

export type DashboardStatCardState = 'ready' | 'loading' | 'zero' | 'error'

export interface MantineDashboardStatCardProps {
  icon: ReactNode
  label: string
  /** Formatted by the caller (locale-aware count formatting stays with the consumer). */
  value: ReactNode
  caption?: ReactNode
  /** Optional second caption line (e.g. a breakdown). */
  secondaryLine?: ReactNode
  /** A caller-built comparison node (trend), rendered only where the caller has a correct
   * comparison to show (spec §16.1 — this pattern never computes one). */
  comparison?: ReactNode
  /** When set, the whole card is one `next/link` anchor (spec §17.1 — one drill-down target). */
  href?: string
  state: DashboardStatCardState
  /** `zero` state positive text, e.g. "Queue is empty". Rendered with a success icon instead of
   * the regular caption — never colour alone (spec §17.1 statuses). */
  zeroText?: ReactNode
  errorMessage?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
}

/**
 * Canonical dashboard top-row KPI/queue card (spec v3.3 §16.1–§17.3; TailAdmin §6u anatomy).
 *
 * TailAdmin §6u provenance (docs/tailadmin-style-reference.md, zip-cited): wrapper
 * `rounded-2xl border border-gray-200 bg-white p-5 md:p-6` → theme `Card` default (`radius:'2xl'`,
 * `padding:'lg'`, border var `gray-2`) + `p={{ base: 'lg', md: 'xl' }}`; icon badge
 * `h-12 w-12 rounded-xl bg-gray-100` → `ThemeIcon size="hero" radius="xl" color="gray"
 * variant="light"`, icon `iconSize.decorative`; label `text-sm text-gray-500` → `Text size="sm"
 * c="gray.5"`; value `text-title-sm font-bold text-gray-800` (30/38, bold) → the theme's own h3
 * heading rung (`theme.headings.sizes.h3`: 1.875rem/1.27/600) with an explicit `fw={700}` override
 * per D78-5 (TailAdmin's card value is bold; the theme's own generic `h3` heading weight is 600 —
 * `700` is not invented, it is the same weight value the theme already uses for `h1`/`h2`).
 *
 * `mih={theme.other.boxSize.dashboardStatCardMinHeight}` (132px, spec §17.2/§17.3) — a minimum,
 * never a fixed height, so a translated label can still grow the card (agent-contract 7/11).
 *
 * One link target (spec §17.1): with `href`, the `Card` itself renders `component={Link}` so the
 * whole card is a single `<a>`. The `error` state never sets `href` on the card — its Retry
 * `Button` is the only interactive element, and it is never nested inside a link.
 *
 * States: `ready`, `loading` (skeleton geometry: icon circle, label line, value block, caption
 * line — no digits), `zero` (value renders the caller's `0`, with `zeroText` replacing the normal
 * caption, shown with a success icon, never colour alone), `error` (label kept, message, Retry
 * outside any link).
 *
 * Production consumers: 853, 854 (not wired in this task).
 */
export function MantineDashboardStatCard({
  icon,
  label,
  value,
  caption,
  secondaryLine,
  comparison,
  href,
  state,
  zeroText,
  errorMessage,
  retryLabel,
  onRetry,
  loadingAriaLabel,
}: MantineDashboardStatCardProps) {
  const theme = useMantineTheme()

  const iconBadge = (
    <ThemeIcon size="hero" radius="xl" color="gray" variant="light">
      {icon}
    </ThemeIcon>
  )

  if (state === 'loading') {
    return (
      <Card withBorder p={{ base: 'lg', md: 'xl' }} mih={theme.other.boxSize.dashboardStatCardMinHeight} aria-busy="true" aria-label={loadingAriaLabel}>
        <Stack gap="md" justify="space-between" mih={theme.other.boxSize.dashboardStatCardMinHeight}>
          <Skeleton height={theme.other.iconSize.hero} width={theme.other.iconSize.hero} circle />
          <Stack gap={theme.spacing.xs}>
            <Skeleton height={theme.fontSizes.sm} width="60%" />
            <Skeleton height={theme.headings.sizes.h3.fontSize} width="40%" />
            <Skeleton height={theme.fontSizes.xs} width="75%" />
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (state === 'error') {
    // Revision 1, F3 (GR-0 COMPOSE): icon+label stay outside (kept, per §16.2), the rest composes
    // the canonical `MantineEmptyLoadingErrorState` error state instead of a component-local
    // clone of `Text`+`Button`. No `href` here, so Retry can never be nested in a link.
    return (
      <Card withBorder p={{ base: 'lg', md: 'xl' }} mih={theme.other.boxSize.dashboardStatCardMinHeight}>
        <Stack gap="sm" align="flex-start" justify="space-between" mih={theme.other.boxSize.dashboardStatCardMinHeight}>
          <Group gap="sm">
            {iconBadge}
            <Text size="sm" c="gray.5">
              {label}
            </Text>
          </Group>
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
        </Stack>
      </Card>
    )
  }

  const body = (
    <Stack gap="md" justify="space-between" mih={theme.other.boxSize.dashboardStatCardMinHeight}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        {iconBadge}
        {comparison}
      </Group>
      <Stack gap={theme.spacing.xs}>
        <Text size="sm" c="gray.5" lineClamp={2}>
          {label}
        </Text>
        <Text fz={theme.headings.sizes.h3.fontSize} lh={theme.headings.sizes.h3.lineHeight} fw={700} c="gray.8">
          {value}
        </Text>
        {state === 'zero' && zeroText ? (
          <Group gap="xs" wrap="nowrap">
            {/* success color reused from the shared notification-variant map
                (VARIANT_COLORS.success = 'green'), not a fresh invented color. */}
            <ThemeIcon size="sm" color={VARIANT_COLORS.success} variant="light" radius="xl">
              <Check size={theme.other.iconSize.compact} aria-hidden="true" />
            </ThemeIcon>
            <Text size="xs" c="gray.5" lineClamp={2}>
              {zeroText}
            </Text>
          </Group>
        ) : (
          caption && (
            <Text size="xs" c="gray.5" lineClamp={2}>
              {caption}
            </Text>
          )
        )}
        {secondaryLine}
      </Stack>
    </Stack>
  )

  if (href) {
    return (
      <Card
        component={Link}
        href={href}
        withBorder
        p={{ base: 'lg', md: 'xl' }}
        mih={theme.other.boxSize.dashboardStatCardMinHeight}
        display="block"
      >
        {body}
      </Card>
    )
  }

  return (
    <Card withBorder p={{ base: 'lg', md: 'xl' }} mih={theme.other.boxSize.dashboardStatCardMinHeight}>
      {body}
    </Card>
  )
}
