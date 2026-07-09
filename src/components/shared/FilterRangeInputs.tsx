'use client'

import { TextInput } from '@mantine/core'

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
      <TextInput
        type={type}
        min={min}
        placeholder={minPlaceholder}
        value={minValue}
        onChange={e => onMinChange(e.currentTarget.value)}
        className="flex-1 min-w-0"
      />
      <TextInput
        type={type}
        min={min}
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={e => onMaxChange(e.currentTarget.value)}
        className="flex-1 min-w-0"
      />
    </div>
  )
}
