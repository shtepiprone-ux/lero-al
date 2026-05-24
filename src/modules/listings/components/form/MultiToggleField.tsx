'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PURCHASE_CONDITIONS } from '@/modules/listings/constants'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'

type EnumOption = { value: string; labelKey: string }

const FIELD_OPTIONS: Partial<Record<ListingField, readonly EnumOption[]>> = {
  purchase_conditions: PURCHASE_CONDITIONS,
}

const LABEL_KEYS: Partial<Record<ListingField, string>> = {
  purchase_conditions: 'purchase_conditions',
}

export function MultiToggleField({ fieldDef, formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  const options  = FIELD_OPTIONS[fieldDef.key] ?? []
  const labelKey = LABEL_KEYS[fieldDef.key] ?? fieldDef.key
  const formKey  = fieldDef.key as keyof FormValues
  const selected = (formValues[formKey] as string[] | undefined) ?? []

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange({ [fieldDef.key]: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t(labelKey)}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <Button
            key={o.value}
            type="button"
            variant={selected.includes(o.value) ? 'default' : 'outline'}
            size="lg"
            className="rounded-xl"
            onClick={() => toggle(o.value)}
          >
            {t(o.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  )
}
