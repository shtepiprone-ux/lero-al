'use client'

import type { ReactNode } from 'react'
import { Group, Stack, Text, useMantineTheme } from '@mantine/core'

export interface MantineListingPriceOwnerCurrency {
  /** Already translated, e.g. "Price in the owner's currency". */
  label: string
  /** Already formatted price in the listing's own currency. */
  value: string
}

export interface MantineListingPriceProps {
  /** Current price, already formatted (in the viewer's currency when converted). */
  price: string
  /** Higher price before the owner lowered it, already formatted. Pass only when `price_old > price`. */
  priceOld?: string
  /** Rendered on the current price's row (for example the per-m² figure). */
  trailing?: ReactNode
  /** Price in the listing's own currency. Pass only when the viewer's currency differs. */
  ownerCurrency?: MantineListingPriceOwnerCurrency
  /** @default 'xl' */
  size?: 'xl'
}

/**
 * Canonical listing price block (Task 912 R11). One layout for every surface that shows a listing
 * price, top to bottom: the struck original price (only when the owner lowered the price), the
 * current price, then the price in the owner's currency (plain, only when converted).
 * Colour (D89-7, Task 912 R22): the current price is dark (`theme.other.priceColor.regular`) when not
 * reduced and the brand colour when `priceOld` is present, because `priceOld` is passed only for a reduction.
 */
export function MantineListingPrice({ price, priceOld, trailing, ownerCurrency, size = 'xl' }: MantineListingPriceProps) {
  const theme = useMantineTheme()
  return (
    <Stack gap="micro">
      {priceOld && (
        <Text size="xs" c="dimmed" td="line-through">
          {priceOld}
        </Text>
      )}
      <Group gap="sm" align="baseline" wrap="wrap">
        <Text fw={700} size={size} c={priceOld ? 'brand' : theme.other.priceColor.regular}>
          {price}
        </Text>
        {trailing}
      </Group>
      {ownerCurrency && (
        <Text size="xs" c="dimmed">
          {ownerCurrency.label}: {ownerCurrency.value}
        </Text>
      )}
    </Stack>
  )
}
