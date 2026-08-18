'use client'

import { Button, Group } from '@mantine/core'
import { ROOMS_OPTIONS } from '@/modules/listings/constants'

interface FilterRoomsRowProps {
  /** Selected room counts as strings (unified with URL string representation) */
  selected: string[]
  onToggle: (value: string) => void
  /** Accessible name for the toggle-chip group (e.g. the section's own visible label). */
  ariaLabel?: string
}

export function FilterRoomsRow({ selected, onToggle, ariaLabel }: FilterRoomsRowProps) {
  return (
    <Group {...(ariaLabel ? { role: 'group', 'aria-label': ariaLabel } : {})} gap="xs" wrap="wrap" data-testid="filter-chip-row">
      {ROOMS_OPTIONS.map(opt => {
        const strVal = String(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant={selected.includes(strVal) ? 'filled' : 'default'}
            style={{ flexShrink: 0 }}
            onClick={() => onToggle(strVal)}
          >
            {opt === 5 ? '5+' : opt}
          </Button>
        )
      })}
    </Group>
  )
}
