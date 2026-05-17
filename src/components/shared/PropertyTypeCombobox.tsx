'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROPERTY_TYPES } from '@/modules/listings/constants'
import { Combobox } from '@/components/shared/Combobox'

interface Props {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  showAllOption?: boolean
  className?: string
}

export function PropertyTypeCombobox({
  value, onChange, onKeyDown,
  placeholder, showAllOption = true, className,
}: Props) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')

  const options = useMemo(() => {
    const typeOpts = PROPERTY_TYPES.map(pt => ({
      value: pt.value,
      label: tl(pt.labelKey),
    }))
    return showAllOption
      ? [{ value: '', label: t('all_types') }, ...typeOpts]
      : typeOpts
  }, [showAllOption, t, tl])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder ?? t('all_types')}
      icon={<Home className="h-4 w-4" />}
      className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}
    />
  )
}
