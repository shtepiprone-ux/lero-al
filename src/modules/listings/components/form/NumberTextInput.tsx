'use client'

import { useState } from 'react'
import { NumberInput } from '@mantine/core'

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
 * The one number input of the listing form (Task 957 Revision 2, R2-2; Task 905 §3.3; Revision 7, R7-1, Review 6 F42, owner decision O957-20). It is Mantine `NumberInput` with its native `label`
 * and `error`, so it has the chrome of every other field of the form, and its own up and down controls: `input-chrome.css` shows them while the pointer is over the field (only where the device
 * hovers) and while the field has focus, in every browser (the browser's own arrows differ by browser, and a touch screen has none). It keeps what `main` has: ArrowUp / ArrowDown step, typed values
 * the validation decides on (`clampBehavior="none"`: `min` and `max` bound the stepping and never change what is typed), any decimal, and a minus sign. The id, the bounds and the placeholder are
 * the field's own; an empty box is `undefined` (`parseNumberInput`).
 * The person types "-" or "85." before the number is complete, and the form holds `undefined` or 85 for them: the box keeps what was typed (`draft`) for as long as it still stands for the form's value,
 * and shows the form's value when that was changed from outside (a field cleared by another choice).
 * Mantine's `NumberInput` asks for `inputMode="decimal"`, whose phone keypad has no minus key (Review 8 F43): a field whose `min` is below 0 (the floor of a multi-storey building, the underground parking
 * floor) asks for `inputMode="text"` instead, the keyboard that has one, as `<input type="number">` of `main` did; every other field keeps Mantine's `decimal`.
 * The first step from an EMPTY box goes as `main`'s `<input type="number">` did (Review 10 F51): as from 0 by one step, then clamped to `min` and `max`, so up gives `clamp(1)` and down `clamp(-1)`.
 * Mantine gives `clamp(0)` in both directions (`startValue`), so the correction is made from the step's own direction (`onValueChange` source `increment` or `decrement`: the arrow key and the control).
 */
export function NumberTextInput({ id, label, value, onChange, min, max, placeholder, error, disabled }: Props) {
  const [draft, setDraft] = useState<number | string>(value ?? '')
  const shown = parseNumberInput(String(draft)) === value ? draft : (value ?? '')
  const emptyBox = parseNumberInput(String(shown)) === undefined
  const bounded = (n: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n))

  return (
    <NumberInput
      id={id}
      label={label}
      value={shown}
      min={min}
      max={max}
      clampBehavior="none"
      {...(min !== undefined && min < 0 ? { inputMode: 'text' as const } : {})}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      onChange={next => {
        setDraft(next)
        onChange(parseNumberInput(String(next)))
      }}
      onValueChange={(_payload, { source }) => {
        if (!emptyBox || (source !== 'increment' && source !== 'decrement')) return
        const stepped = bounded(source === 'increment' ? 1 : -1)
        setDraft(stepped)
        onChange(stepped)
      }}
    />
  )
}
