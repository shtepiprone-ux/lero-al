'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@mantine/core'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { ROOMS_OPTIONS } from '@/modules/listings/constants'
import type { FieldRendererProps } from './fieldRegistry'

const ROOMS_CHOICES = ROOMS_OPTIONS.map(r => ({ value: String(r), labelKey: r === 5 ? '5+' : String(r) }))

export function RoomsSelectorField({ formValues, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <Input.Wrapper labelElement="div" label={t('rooms')}>
      <FilterChoiceGroup
        mode="single"
        allowDeselect
        variant="filled"
        ariaLabel={t('rooms')}
        options={ROOMS_CHOICES}
        getLabel={key => key}
        selected={formValues.rooms === undefined ? '' : String(formValues.rooms)}
        // the value stays a number: a click sends Number(v), a re-click clears it (Task 905 §3.2)
        onChange={v => onChange({ rooms: v === '' ? undefined : Number(v) })}
        disabled={disabled}
      />
    </Input.Wrapper>
  )
}
