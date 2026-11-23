'use client'

import { useTranslations } from 'next-intl'
import { Input, Stack } from '@mantine/core'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { PARKING_TYPES } from '@/modules/listings/constants'
import type { ParkingType } from '@/types/database'
import type { FieldRendererProps } from './fieldRegistry'
import { NumberTextInput } from './NumberTextInput'

/**
 * The parking of a listing (Task 957 Revision 3, owner decision O1001-2, 2026-11-21): the kind of parking (underground, private on the street, city) as a choice with no default, like the other
 * choice fields, and, only for an underground parking, its floor (-10 to -1: the floors below ground, the range of the underground floor of the form). Choosing another kind, or none, clears the floor.
 * The field is shown for every property type but land (`propertyTypeSchema.ts`).
 */
export function ParkingField({ formValues, errors, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')
  const underground = formValues.parking_type === 'underground'

  return (
    <Stack gap="md">
      <Input.Wrapper labelElement="div" label={t('parking_label')}>
        <FilterChoiceGroup
          mode="single"
          allowDeselect
          variant="filled"
          justify="flex-start"
          ariaLabel={t('parking_label')}
          options={PARKING_TYPES}
          getLabel={key => t(key)}
          selected={formValues.parking_type ?? ''}
          onChange={v => onChange({ parking_type: v === '' ? undefined : (v as ParkingType), ...(v === 'underground' ? {} : { parking_floor: undefined }) })}
          disabled={disabled}
        />
      </Input.Wrapper>
      {underground && (
        <NumberTextInput
          id="parking_floor"
          label={t('parking_floor')}
          value={formValues.parking_floor}
          min={-10}
          max={-1}
          placeholder="—"
          error={errors.parking_floor}
          disabled={disabled}
          onChange={v => onChange({ parking_floor: v })}
        />
      )}
    </Stack>
  )
}
