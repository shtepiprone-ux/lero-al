'use client'

import type { ReactNode } from 'react'
import { Badge, Flex, Stack, Text, Title, useMantineTheme } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'

export interface MantineDashboardHeaderProps {
  title: string
  subtitle?: string
  /** Preformatted "Updated at {time}" text (formatting and Tirane-time conversion stay with the
   * caller — this pattern never reads the clock). */
  updatedAtLabel?: string
  /** Set ONLY when the aggregate is stale (spec §17.4): renders the warning badge. */
  stale?: { label: string }
  /** Slot for `MantineDashboardPeriodControl` — pass it only where period-based blocks exist. */
  periodControl?: ReactNode
}

/**
 * Canonical dashboard page header (spec v3.3 §16.1, §17.2–§17.3; D78-5).
 *
 * Title + subtitle on the left; on the right the refresh time, a warning badge only when stale,
 * and the period-control slot. From `sm` the two sides share a row (`space-between`);
 * below `sm` they stack and the slot spans the full width. Layout is one `Flex` with responsive
 * `direction`/`align` props — the same native mechanism `MantinePageHeaderWithActions` moved to in
 * Task 785 — so no `Group`/`Stack` swap or media-query `styles` is needed.
 *
 * Sizes come from the existing theme scale (no new font token): title `Title order={1}
 * size="h4"` (24/32 — what `AdminPageHeader` renders today), subtitle `Text size="sm"
 * c="gray.5"`, updated-at `Text size="xs" c="gray.5"`. The stale badge reuses the
 * `MantineDashboardCard` stale-badge anatomy (yellow `Badge`, `AlertTriangle` at
 * `iconSize.compact`, text always present — colour is never the only carrier).
 *
 * `'use client'`: `useMantineTheme` supplies the badge icon size (`theme.other.iconSize`).
 *
 * Production consumers: 853 (`/admin`), 854 (`/{locale}/cabinet/statistics`).
 */
export function MantineDashboardHeader({
  title,
  subtitle,
  updatedAtLabel,
  stale,
  periodControl,
}: MantineDashboardHeaderProps) {
  const theme = useMantineTheme()
  const hasStatusLine = Boolean(updatedAtLabel || stale)

  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      justify="space-between"
      align={{ base: 'stretch', sm: 'flex-start' }}
      gap="md"
    >
      <Stack gap="tight">
        <Title order={1} size="h4">
          {title}
        </Title>
        {subtitle && (
          <Text size="sm" c="gray.5">
            {subtitle}
          </Text>
        )}
      </Stack>

      {(hasStatusLine || periodControl) && (
        <Flex direction="column" gap="xs" align={{ base: 'stretch', sm: 'flex-end' }}>
          {hasStatusLine && (
            <Flex gap="sm" align="center" wrap="wrap" justify={{ base: 'flex-start', sm: 'flex-end' }}>
              {updatedAtLabel && (
                <Text size="xs" c="gray.5">
                  {updatedAtLabel}
                </Text>
              )}
              {stale && (
                <Badge
                  color="yellow"
                  leftSection={<AlertTriangle size={theme.other.iconSize.compact} aria-hidden="true" />}
                >
                  {stale.label}
                </Badge>
              )}
            </Flex>
          )}
          {periodControl}
        </Flex>
      )}
    </Flex>
  )
}
