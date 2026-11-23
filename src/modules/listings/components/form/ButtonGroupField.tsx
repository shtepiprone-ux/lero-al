'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@mantine/core'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { HEATING_TYPES, WALL_TYPES, OFFER_TYPES } from '@/modules/listings/constants'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import type { FormValues } from '@/modules/listings/types/form'
import type { FieldRendererProps } from './fieldRegistry'

type EnumOption = { value: string; labelKey: string }

const FIELD_OPTIONS: Partial<Record<ListingField, readonly EnumOption[]>> = {
  heating:    HEATING_TYPES,
  wall_type:  WALL_TYPES,
  offer_type: OFFER_TYPES,
}

const LABEL_KEYS: Partial<Record<ListingField, string>> = {
  heating:    'heating_label',
  wall_type:  'wall_type_label',
  offer_type: 'offer_type',
}

export function ButtonGroupField({ fieldDef, formValues, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  const options  = FIELD_OPTIONS[fieldDef.key] ?? []
  const labelKey = LABEL_KEYS[fieldDef.key] ?? fieldDef.key
  const formKey  = fieldDef.key as keyof FormValues
  const currentValue = formValues[formKey] as string | undefined

  return (
    <Input.Wrapper labelElement="div" label={t(labelKey)}>
      <FilterChoiceGroup
        mode="single"
        allowDeselect
        variant="filled"
        ariaLabel={t(labelKey)}
        options={options}
        getLabel={key => t(key)}
        selected={currentValue ?? ''}
        onChange={v => onChange({ [fieldDef.key]: v === '' ? undefined : v })}
        disabled={disabled}
      />
    </Input.Wrapper>
  )
}
