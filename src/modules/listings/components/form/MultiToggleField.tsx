'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@mantine/core'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
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

export function MultiToggleField({ fieldDef, formValues, onChange, disabled }: FieldRendererProps) {
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
    <Input.Wrapper labelElement="div" label={t(labelKey)}>
      <FilterChoiceGroup
        mode="multiple"
        variant="filled"
        ariaLabel={t(labelKey)}
        options={options}
        getLabel={key => t(key)}
        selected={selected}
        onToggle={toggle}
        disabled={disabled}
      />
    </Input.Wrapper>
  )
}
