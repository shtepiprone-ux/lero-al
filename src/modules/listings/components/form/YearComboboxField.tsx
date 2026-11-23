'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@mantine/core'
import { YearCombobox } from '@/components/shared/YearCombobox'
import type { FieldRendererProps } from './fieldRegistry'

export function YearComboboxField({ formValues, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <Input.Wrapper labelElement="div" label={t('year_built')}>
      <YearCombobox
        value={formValues.year_built}
        onChange={v => onChange({ year_built: v })}
        placeholder={t('year_built_placeholder')}
        disabled={disabled}
      />
    </Input.Wrapper>
  )
}
