'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import {
  CONDITIONS, LAND_LEGAL_STATUS, LAND_ZONING, LAND_DEVELOPMENT_POTENTIAL,
} from '@/modules/listings/constants'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'

type EnumOption = { value: string; labelKey: string }

const FIELD_OPTIONS: Partial<Record<ListingField, readonly EnumOption[]>> = {
  condition:                  CONDITIONS,
  land_legal_status:          LAND_LEGAL_STATUS,
  land_zoning:                LAND_ZONING,
  land_development_potential: LAND_DEVELOPMENT_POTENTIAL,
}

const LABEL_KEYS: Partial<Record<ListingField, string>> = {
  condition:                  'condition_label',
  land_legal_status:          'land_legal_status',
  land_zoning:                'land_zoning',
  land_development_potential: 'land_development_potential',
}

export function EnumSelectorField({ fieldDef, formValues, errors, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  const options = FIELD_OPTIONS[fieldDef.key] ?? []
  const labelKey = LABEL_KEYS[fieldDef.key] ?? fieldDef.key
  const formKey = fieldDef.key as keyof FormValues
  const currentValue = formValues[formKey] as string | undefined
  const error = errors[formKey] as string | undefined

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t(labelKey as any)}</Label>
      <div className="flex flex-col gap-1.5">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange({ [fieldDef.key]: currentValue === o.value ? undefined : o.value })}
            className={cn(
              'h-10 px-3 rounded-xl border text-sm text-left transition-colors',
              currentValue === o.value
                ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                : 'border-border hover:border-primary/40',
            )}
          >
            {t(o.labelKey as any)}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
