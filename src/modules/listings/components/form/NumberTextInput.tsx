'use client'

import { TextInput } from '@mantine/core'

/** What every number field of the listing form sends on a change: an empty box or a non-number is `undefined`, anything else the number (Task 905 §3.2). */
export function parseNumberInput(raw: string): number | undefined {
  if (raw === '') return undefined
  const n = Number(raw)
  return Number.isNaN(n) ? undefined : n
}

interface Props {
  id: string
  label: string
  value?: number
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  placeholder: string
  error?: string
  disabled?: boolean
}

/**
 * The one number input of the listing form (Task 957 Revision 2, R2-2; Task 905 §3.3; Revision 3, R3-1, Review 3 F16). It is Mantine `TextInput type="number"` with its native `label` and `error`,
 * so it has the chrome of every other text field of the form, and it keeps what `main` has: the browser's own step arrows, ArrowUp / ArrowDown, typed values the validation decides on (`min` and
 * `max` are the native attributes, they never change what is typed), any decimal, and a minus sign. Mantine's input CSS hides the browser's arrows (`@mantine/core/styles.css:1550-1557`);
 * `data-native-steppers` asks `input-chrome.css` to show them again for this input only. The id, the bounds and the placeholder are the field's own; the parsing is `parseNumberInput`.
 * A Mantine `NumberInput` is not used: its own step buttons and text input look different from the production field.
 */
export function NumberTextInput({ id, label, value, onChange, min, max, placeholder, error, disabled }: Props) {
  return (
    <TextInput
      id={id}
      type="number"
      data-native-steppers
      label={label}
      value={value ?? ''}
      min={min}
      max={max}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      onChange={e => onChange(parseNumberInput(e.target.value))}
    />
  )
}
