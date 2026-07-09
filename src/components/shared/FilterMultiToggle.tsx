'use client'

import { Button } from '@mantine/core'
import { cn } from '@/lib/utils'

interface FilterMultiToggleProps {
  options: readonly { value: string; labelKey: string }[]
  selected: string[]
  onToggle: (value: string) => void
  getLabel: (key: string) => string
  /** Wrapper className — use 'flex-col gap-1.5' for vertical layout */
  className?: string
}

export function FilterMultiToggle({
  options, selected, onToggle, getLabel, className,
}: FilterMultiToggleProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map(opt => (
        <Button
          key={opt.value}
          type="button"
          variant={selected.includes(opt.value) ? 'filled' : 'default'}
          className="justify-start text-left"
          onClick={() => onToggle(opt.value)}
        >
          {getLabel(opt.labelKey)}
        </Button>
      ))}
    </div>
  )
}
