'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterToggleGroupProps {
  options: readonly { value: string; labelKey: string }[]
  value?: string | null
  onToggle: (value: string | null) => void
  getLabel: (key: string) => string
  /** When provided, renders an "All / Any" reset button before the options */
  allLabel?: string
  /** Wrapper className — use 'flex-col gap-1.5' for vertical layout */
  className?: string
}

export function FilterToggleGroup({
  options, value, onToggle, getLabel, allLabel, className,
}: FilterToggleGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {allLabel !== undefined && (
        <Button
          type="button"
          variant={!value ? 'default' : 'outline'}
          size="sm"
          className="min-h-11 h-auto px-3 py-2 text-xs rounded-xl justify-start"
          onClick={() => onToggle(null)}
        >
          {allLabel}
        </Button>
      )}
      {options.map(opt => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? 'default' : 'outline'}
          size="sm"
          className="min-h-11 h-auto px-3 py-2 text-xs rounded-xl whitespace-normal leading-snug text-left justify-start"
          onClick={() => onToggle(value === opt.value ? null : opt.value)}
        >
          {getLabel(opt.labelKey)}
        </Button>
      ))}
    </div>
  )
}
