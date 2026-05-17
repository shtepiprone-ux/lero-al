'use client'

import { Button } from '@/components/ui/button'
import { ROOMS_OPTIONS } from '@/modules/listings/constants'

interface FilterRoomsRowProps {
  /** Selected room counts as strings (unified with URL string representation) */
  selected: string[]
  onToggle: (value: string) => void
}

export function FilterRoomsRow({ selected, onToggle }: FilterRoomsRowProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ROOMS_OPTIONS.map(opt => {
        const strVal = String(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant={selected.includes(strVal) ? 'default' : 'outline'}
            size="icon"
            className="h-11 w-11 text-xs rounded-xl shrink-0"
            onClick={() => onToggle(strVal)}
          >
            {opt === 5 ? '5+' : opt}
          </Button>
        )
      })}
    </div>
  )
}
