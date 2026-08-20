'use client'

import { Group, TextInput } from '@mantine/core'

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
    <Group gap="xs" wrap="nowrap">
      <TextInput
        type={type}
        min={min}
        placeholder={minPlaceholder}
        value={minValue}
        onChange={e => onMinChange(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <TextInput
        type={type}
        min={min}
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={e => onMaxChange(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Group>
  )
}
