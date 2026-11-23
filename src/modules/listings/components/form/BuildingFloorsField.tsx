'use client'

import { useTranslations } from 'next-intl'
import type { FieldRendererProps } from './fieldRegistry'
import { NumberTextInput } from './NumberTextInput'

export function BuildingFloorsField({ formValues, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <NumberTextInput
      id="total_floors"
      label={t('building_floors')}
      value={formValues.total_floors}
      min={1}
      max={200}
      placeholder="—"
      disabled={disabled}
      onChange={v => onChange({ total_floors: v })}
    />
  )
}
