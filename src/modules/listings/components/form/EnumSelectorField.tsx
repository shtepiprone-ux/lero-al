'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@mantine/core'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
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

export function EnumSelectorField({ fieldDef, formValues, errors, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  const options = FIELD_OPTIONS[fieldDef.key] ?? []
  const labelKey = LABEL_KEYS[fieldDef.key] ?? fieldDef.key
  const formKey = fieldDef.key as keyof FormValues
  const currentValue = formValues[formKey] as string | undefined
  const error = errors[formKey] as string | undefined

  return (
    <Input.Wrapper labelElement="div" label={t(labelKey)} error={error}>
      <FilterChoiceGroup
        mode="single"
        allowDeselect
        variant="filled"
        justify="flex-start"
        orientation="vertical"
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
