'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { useMantineTheme } from '@mantine/core'
import { cn } from '@/lib/utils'
import { MantineCombobox } from '@/design-system/mantine/patterns'
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
  /**
   * Documented no-op (STOP-AND-ASK #2, Task 552): `MantineCombobox`'s dropdown/sheet always
   * renders via a portal (`Combobox.Dropdown`'s `withinPortal` defaults `true`; the mobile path is
   * a portaled bottom sheet), so it never clips inside an `overflow:hidden/auto` container
   * regardless of this flag. Kept on the public API only so every existing call site (four of the
   * six render this with `portal`) stays byte-identical.
   */
  portal?: boolean
}

export function YearCombobox({ value, onChange, placeholder, className }: Props) {
  const t = useTranslations('common')
  const theme = useMantineTheme()

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
    <div className={cn('year-combobox', className)}>
      <MantineCombobox
        options={options}
        value={value != null ? String(value) : ''}
        onChange={v => onChange(v ? parseInt(v, 10) : undefined)}
        onInputChange={handleInputChange}
        inputMode="numeric"
        icon={<Calendar size={theme.other.iconSize.standard} />}
        placeholder={placeholder}
        triggerWidth={{ base: '100%', sm: '100%' }}
        noResultsLabel={t('no_results')}
        triggerAriaLabel={placeholder}
        sheetTitle={placeholder}
      />
    </div>
  )
}
