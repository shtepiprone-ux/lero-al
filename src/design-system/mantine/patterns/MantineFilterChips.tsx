'use client'

import { X } from 'lucide-react'
import { Button, Group, useMantineTheme } from '@mantine/core'

export interface MantineFilterChip {
  /** Stable key, handed back to `onRemove`. */
  key: string
  /** The visible, localized label. */
  label: string
  /** The localized accessible name, which says that the chip removes a filter. */
  ariaLabel: string
}

export interface MantineFilterChipsProps {
  chips: MantineFilterChip[]
  /** Called with the removed chip's `key`. */
  onRemove: (key: string) => void
}

/**
 * The one removable filter chip (Task 859 Revision 7, R53, extracted from the `/listings` `ActiveFilterChips`, D69-4):
 * a themed Mantine `Button` (`light`, `brand`, pill, `xs`) with a remove icon on the right. It renders the chips in a
 * wrapping row and nothing when there are none; spacing around the row belongs to its parent. `ActiveFilterChips`
 * and the admin users table render it; no other component draws a removable chip.
 */
export function MantineFilterChips({ chips, onRemove }: MantineFilterChipsProps) {
  const theme = useMantineTheme()
  if (chips.length === 0) return null
  return (
    <Group gap="xs" wrap="wrap">
      {chips.map(chip => (
        <Button
          key={chip.key}
          type="button"
          variant="light"
          color="brand"
          radius="pill"
          size="xs"
          onClick={() => onRemove(chip.key)}
          rightSection={<X size={theme.other.iconSize.badge} aria-hidden="true" />}
          aria-label={chip.ariaLabel}
        >
          {chip.label}
        </Button>
      ))}
    </Group>
  )
}
