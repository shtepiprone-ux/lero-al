'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/shared/Combobox'
import { MIN_PROPERTY_YEAR } from '@/modules/listings/constants'

const MAX_YEAR = new Date().getFullYear() + 5

const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_PROPERTY_YEAR + 1 },
  (_, i) => MAX_YEAR - i,
)

interface Props {
  value?: number
  onChange: (year: number | undefined) => void
  placeholder?: string
  className?: string
  /** Render dropdown via portal into document.body. Use inside overflow:hidden/auto containers. */
  portal?: boolean
}

export function YearCombobox({ value, onChange, placeholder, className, portal = false }: Props) {
  const options = useMemo(
    () => YEAR_OPTIONS.map(y => ({ value: String(y), label: String(y) })),
    [],
  )

  function handleInputChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    if (!digits) { onChange(undefined); return }
    const n = parseInt(digits, 10)
    if (!isNaN(n) && n >= MIN_PROPERTY_YEAR && n <= MAX_YEAR) onChange(n)
    else onChange(undefined)
  }

  return (
    <Combobox
      options={options}
      value={value != null ? String(value) : ''}
      onChange={v => onChange(v ? parseInt(v, 10) : undefined)}
      onInputChange={handleInputChange}
      inputMode="numeric"
      icon={<Calendar className="h-4 w-4" />}
      placeholder={placeholder}
      className={cn('year-combobox', className)}
      portal={portal}
    />
  )
}
