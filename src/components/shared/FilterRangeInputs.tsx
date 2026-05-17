'use client'

import { Input } from '@/components/ui/input'

interface FilterRangeInputsProps {
  minValue: string
  maxValue: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
  minPlaceholder?: string
  maxPlaceholder?: string
  min?: number
  type?: string
}

export function FilterRangeInputs({
  minValue, maxValue, onMinChange, onMaxChange,
  minPlaceholder = '', maxPlaceholder = '',
  min, type = 'number',
}: FilterRangeInputsProps) {
  return (
    <div className="flex gap-2">
      <Input
        type={type}
        min={min}
        placeholder={minPlaceholder}
        value={minValue}
        onChange={e => onMinChange(e.target.value)}
        className="h-10 rounded-xl"
      />
      <Input
        type={type}
        min={min}
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={e => onMaxChange(e.target.value)}
        className="h-10 rounded-xl"
      />
    </div>
  )
}
