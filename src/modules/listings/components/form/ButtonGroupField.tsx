'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { HEATING_TYPES, WALL_TYPES } from '@/modules/listings/constants'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'

type EnumOption = { value: string; labelKey: string }

const FIELD_OPTIONS: Partial<Record<ListingField, readonly EnumOption[]>> = {
  heating:   HEATING_TYPES,
  wall_type: WALL_TYPES,
}

const LABEL_KEYS: Partial<Record<ListingField, string>> = {
  heating:   'heating_label',
  wall_type: 'wall_type_label',
}

export function ButtonGroupField({ fieldDef, formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  const options  = FIELD_OPTIONS[fieldDef.key] ?? []
  const labelKey = LABEL_KEYS[fieldDef.key] ?? fieldDef.key
  const formKey  = fieldDef.key as keyof FormValues
  const currentValue = formValues[formKey] as string | undefined

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t(labelKey as any)}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <Button
            key={o.value}
            type="button"
            variant={currentValue === o.value ? 'default' : 'outline'}
            size="sm"
            className="h-9 rounded-xl"
            onClick={() => onChange({ [fieldDef.key]: currentValue === o.value ? undefined : o.value })}
          >
            {t(o.labelKey as any)}
          </Button>
        ))}
      </div>
    </div>
  )
}
