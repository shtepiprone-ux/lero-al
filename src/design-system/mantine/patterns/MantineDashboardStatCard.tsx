'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Box, Card, Flex, Group, SimpleGrid, Stack, Text, ThemeIcon, Skeleton, Button, useMantineTheme, getGradient } from '@mantine/core'
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
  /** Task 889 (D78-9, Lahomes KPI row): a sparkline (or other small chart) placed beside the
   * label/value text. Absent by default — markup is unchanged when omitted. Ignored by `loading`
   * and `error`. Review 1 (F1): the `Flex` wraps (`wrap="wrap"`), so a narrow card (measured: 1024's
   * 4-column grid gives a 236px card, 186px content box) drops the chart under the text instead of
   * overflowing the card. Rev 4 (O889-1 row 1): the chart slot itself is fluid — it grows into the
   * space beside the text (`flex: 1 1 0`) when the row layout holds, and takes the full content width
   * (with the sparkline's own 154px minimum) when it wraps or the layout is column. */
  chart?: ReactNode
  /** Task 889 (D78-9, Omah "Total Properties" / Lahomes "My Balance" hero cards): `'accent'` fills
   * the card with `theme.other.accentHeroGradient` (`brand.7` → `brand.9`, 180deg) and renders its
   * text in white. Applies to `ready`/`zero` only —
   * `loading`/`error` always keep the default chrome. Defaults to `'default'` (unchanged). */
  variant?: 'default' | 'accent'
  /** Task 891 review 3 (R18, GR-0 EXTEND): the hero card's inventory sub-stats (Lahomes "My
   * Balance"), rendered only for `variant="accent"`, as a 2-column grid under the value. With an
   * `href`, the whole sub-stat is a `next/link` whose text is the label and value; without one, it
   * is plain text. Omitted, the output is byte-identical (853/889 consumers unaffected). */
  substats?: { key: string; label: ReactNode; value: ReactNode; href?: string }[]
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
 * `chart` (Task 889, D78-9): when set, the ready/zero body places the existing label/value/caption
 * text stack beside it — `Flex direction={{ base: 'column', xs2: 'row' }} wrap="wrap"`, text first,
 * chart second — matching the Lahomes KPI row. `wrap="wrap"` (review 1, F1) drops the chart under the
 * text at any width too narrow for text + gap + the chart's own minimum width, instead of overflowing
 * the card. Rev 4 (O889-1 row 1): the chart's own slot is a `Box` with `flex: 1 1 0` on the row layout
 * (grows to fill the remaining width beside the text) and `w: 100%`/`flex: 0 0 auto` on the column
 * layout or once wrapped (fills the full content width). Omitted, the markup is byte-identical to
 * before Task 889.
 *
 * `variant="accent"` (Task 889, D78-9; rev 2, D889-2): one filled "hero" card (Omah "Total
 * Properties" / Lahomes "My Balance"), `ready`/`zero` only. The background is the brand coral
 * gradient `theme.other.accentHeroGradient` (`brand.7` → `brand.9`, 180deg — light top, dark bottom
 * under the text), read through `getGradient()` so the `Card`'s `bg` prop carries the
 * resolved `linear-gradient(...)` CSS value; `brand.8` is no longer used here. `loading`/`error` are
 * unaffected.
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
  chart,
  variant = 'default',
  substats,
}: MantineDashboardStatCardProps) {
  const theme = useMantineTheme()
  const isAccent = variant === 'accent'
  const accentBackground = getGradient(theme.other.accentHeroGradient, theme)

  const iconBadge = (
    <ThemeIcon size="hero" radius="xl" color="gray" variant="light">
      {icon}
    </ThemeIcon>
  )

  const bodyIconBadge = isAccent ? (
    <ThemeIcon size="hero" radius="xl" color="white" variant="light">
      {icon}
    </ThemeIcon>
  ) : (
    iconBadge
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

  const textStack = (
    <Stack gap={theme.spacing.xs}>
      <Text size="sm" c={isAccent ? 'white' : 'gray.5'} lineClamp={2}>
        {label}
      </Text>
      {/* GR-3c (Task 853 review 1, R12): static h3 (30px) at every width had no responsive step
          (docs/golden-rules.md GR-3c). Steps to h5 (20px) below `sm`, h4 (24px) at `sm`, and back
          to h3 (30px) from `md` up — Task 886 §4.1's own `h3` row; `lh` stays the h3 value. */}
      <Text fz={{ base: 'h5', sm: 'h4', md: 'h3' }} lh={theme.headings.sizes.h3.lineHeight} fw={700} c={isAccent ? 'white' : 'gray.8'}>
        {value}
      </Text>
      {state === 'zero' && zeroText ? (
        <Group gap="xs" wrap="nowrap">
          {/* success color reused from the shared notification-variant map
              (VARIANT_COLORS.success = 'green'), not a fresh invented color. */}
          <ThemeIcon size="sm" color={VARIANT_COLORS.success} variant="light" radius="xl">
            <Check size={theme.other.iconSize.compact} aria-hidden="true" />
          </ThemeIcon>
          <Text size="xs" c={isAccent ? 'white' : 'gray.5'} lineClamp={2}>
            {zeroText}
          </Text>
        </Group>
      ) : (
        caption && (
          <Text size="xs" c={isAccent ? 'white' : 'gray.5'} lineClamp={2}>
            {caption}
          </Text>
        )
      )}
      {secondaryLine}
      {isAccent && substats && substats.length > 0 && (
        <SimpleGrid cols={2} spacing="xs" pt={theme.spacing.xs}>
          {substats.map((s) => {
            const content = (
              <Stack gap={0}>
                <Text size="xs" c="white">
                  {s.label}
                </Text>
                <Text size="sm" fw={600} c="white">
                  {s.value}
                </Text>
              </Stack>
            )
            return s.href ? (
              <Box key={s.key} component={Link} href={s.href} td="none">
                {content}
              </Box>
            ) : (
              <Box key={s.key}>{content}</Box>
            )
          })}
        </SimpleGrid>
      )}
    </Stack>
  )

  const body = (
    <Stack gap="md" justify="space-between" mih={theme.other.boxSize.dashboardStatCardMinHeight}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        {bodyIconBadge}
        {comparison}
      </Group>
      {chart ? (
        <Flex direction={{ base: 'column', xs2: 'row' }} wrap="wrap" justify="space-between" align={{ base: 'flex-start', xs2: 'flex-end' }} gap="md">
          {textStack}
          {/* `miw` is required for `flex-basis:0` to size correctly (Task 889 rev 4 deviation,
              verified live): the default `min-width:auto` lets the ApexCharts SVG's JS-measured
              pixel width feed back into this box's content-based auto-minimum, so it never shrinks
              below whatever size the chart happened to render at first — overflowing the card at
              1024/1440. `miw={0}` alone breaks that feedback loop but also zeroes the flex-wrap
              *line-fitting* hypothetical size, so the row never wraps even when the chart's own
              154px floor cannot actually fit beside the text (still overflows at 1024). Pinning `miw`
              to the same `sparklineMinWidth` role the inner chart already floors at gives the wrap
              decision the chart's true minimum, so it wraps under at 1024 (as it must — 154 + gap +
              text exceeds that width's content box) and grows cleanly beside the text at 768/1440. */}
          <Box
            w={{ base: '100%', xs2: 'auto' }}
            flex={{ base: '0 0 auto', xs2: '1 1 0' }}
            miw={{ base: 0, xs2: theme.other.dashboardChart.sparklineMinWidth }}
          >
            {chart}
          </Box>
        </Flex>
      ) : (
        textStack
      )}
    </Stack>
  )

  if (href) {
    return (
      <Card
        component={Link}
        href={href}
        withBorder={!isAccent}
        bg={isAccent ? accentBackground : undefined}
        p={{ base: 'lg', md: 'xl' }}
        mih={theme.other.boxSize.dashboardStatCardMinHeight}
        display="block"
      >
        {body}
      </Card>
    )
  }

  return (
    <Card withBorder={!isAccent} bg={isAccent ? accentBackground : undefined} p={{ base: 'lg', md: 'xl' }} mih={theme.other.boxSize.dashboardStatCardMinHeight}>
      {body}
    </Card>
  )
}
