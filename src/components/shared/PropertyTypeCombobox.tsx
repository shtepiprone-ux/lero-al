'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROPERTY_TYPES } from '@/modules/listings/constants'
import { MantineCombobox } from '@/design-system/mantine/patterns'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showAllOption?: boolean
  className?: string
}

export function PropertyTypeCombobox({
  value, onChange,
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
    <div className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}>
      <MantineCombobox
        options={options}
        value={value}
        onChange={onChange}
        variant="button"
        placeholder={placeholder ?? t('all_types')}
        icon={<Home className="h-4 w-4" />}
        triggerWidth={{ base: '100%', sm: '100%' }}
        noResultsLabel={t('no_results')}
        triggerAriaLabel={t('property_type')}
        sheetTitle={t('property_type')}
      />
    </div>
  )
}
