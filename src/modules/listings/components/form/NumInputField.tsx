'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'

const LABEL_KEYS: Partial<Record<ListingField, { ns: 'listing' | 'common'; key: string }>> = {
  bedrooms:  { ns: 'listing', key: 'bedrooms' },
  bathrooms: { ns: 'listing', key: 'bathrooms' },
  toilets:   { ns: 'listing', key: 'toilets' },
}

const FIELD_BOUNDS: Partial<Record<ListingField, { min: number; max: number }>> = {
  bedrooms:  { min: 0, max: 50 },
  bathrooms: { min: 0, max: 20 },
  toilets:   { min: 0, max: 20 },
}

export function NumInputField({ fieldDef, formValues, errors, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  const meta  = LABEL_KEYS[fieldDef.key]
  const label = meta ? t(meta.key) : fieldDef.key
  const bounds = FIELD_BOUNDS[fieldDef.key]
  const formKey = fieldDef.key as keyof FormValues
  const value = formValues[formKey] as number | undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldDef.key} className="text-sm">{label}</Label>
      <Input
        id={fieldDef.key}
        type="number"
        value={value ?? ''}
        min={bounds?.min}
        max={bounds?.max}
        placeholder="—"
        onChange={e => {
          const n = Number(e.target.value)
          onChange({ [fieldDef.key]: e.target.value === '' ? undefined : (isNaN(n) ? undefined : n) })
        }}
        className="h-10 rounded-xl"
      />
      {errors[formKey] && (
        <p className="text-xs text-destructive">{errors[formKey]}</p>
      )}
    </div>
  )
}
