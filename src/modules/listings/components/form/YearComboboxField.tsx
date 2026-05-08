'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { YearCombobox } from '@/components/shared/YearCombobox'
import type { FieldRendererProps } from './fieldRegistry'

export function YearComboboxField({ formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t('year_built')}</Label>
      <YearCombobox
        value={formValues.year_built}
        onChange={v => onChange({ year_built: v })}
        placeholder={t('year_built_placeholder')}
        className="w-full"
      />
    </div>
  )
}
