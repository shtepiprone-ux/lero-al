'use client'

import { useTranslations } from 'next-intl'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'
import { NumberTextInput } from './NumberTextInput'

const LABEL_KEYS: Partial<Record<ListingField, { ns: 'listing' | 'common'; key: string }>> = {
  bedrooms:    { ns: 'listing', key: 'bedrooms' },
  bathrooms:   { ns: 'listing', key: 'bathrooms' },
  toilets:     { ns: 'listing', key: 'toilets' },
  floors_total: { ns: 'listing', key: 'floors_total' },
}

const FIELD_BOUNDS: Partial<Record<ListingField, { min: number; max: number }>> = {
  bedrooms:  { min: 0, max: 50 },
  bathrooms: { min: 0, max: 20 },
  toilets:   { min: 0, max: 20 },
}

export function NumInputField({ fieldDef, formValues, errors, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  const meta  = LABEL_KEYS[fieldDef.key]
  const label = meta ? t(meta.key) : fieldDef.key
  const bounds = FIELD_BOUNDS[fieldDef.key]
  const formKey = fieldDef.key as keyof FormValues
  const value = formValues[formKey] as number | undefined

  return (
    <NumberTextInput
      id={fieldDef.key}
      label={label}
      value={value}
      min={bounds?.min}
      max={bounds?.max}
      placeholder="—"
      error={errors[formKey]}
      disabled={disabled}
      onChange={v => onChange({ [fieldDef.key]: v })}
    />
  )
}
