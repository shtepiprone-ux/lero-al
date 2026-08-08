'use client'

import { Button } from '@mantine/core'
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
    <div {...(ariaLabel ? { role: 'group', 'aria-label': ariaLabel } : {})} className="flex gap-2 flex-wrap">
      {ROOMS_OPTIONS.map(opt => {
        const strVal = String(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant={selected.includes(strVal) ? 'filled' : 'default'}
            className="shrink-0"
            onClick={() => onToggle(strVal)}
          >
            {opt === 5 ? '5+' : opt}
          </Button>
        )
      })}
    </div>
  )
}
