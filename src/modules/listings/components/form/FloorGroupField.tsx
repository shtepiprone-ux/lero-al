'use client'

import { useTranslations } from 'next-intl'
import { Checkbox, SimpleGrid } from '@mantine/core'
import type { FieldRendererProps } from './fieldRegistry'
import { NumberTextInput } from './NumberTextInput'

export function FloorGroupField({ schema, formValues, errors, onChange, disabled }: FieldRendererProps) {
  const t  = useTranslations('listing')
  const tc = useTranslations('common')

  const { requiresCheckbox, allowNegative, minFloor } = schema.floor
  const showFloor = requiresCheckbox ? formValues.multi_storey_building === true : true
  const floorMin  = (allowNegative && formValues.multi_storey_building) ? minFloor : 0

  // Show companion floors_total only when schema declares it visible.
  const showFloorsTotal = schema.ui.fields.find(f => f.key === 'floors_total')?.visible ?? false

  return (
    <>
      {/* Multi-storey building checkbox — underground-capable types only */}
      {requiresCheckbox && (
        <Checkbox
          id="multi_storey_building"
          label={t('multi_storey_building')}
          checked={formValues.multi_storey_building}
          disabled={disabled}
          onChange={e => {
            const on = e.currentTarget.checked
            onChange({
              multi_storey_building: on,
              floor: !on && formValues.floor !== undefined && formValues.floor < 0
                ? undefined
                : formValues.floor,
            })
          }}
        />
      )}

      {/* Floor input — free for non-checkbox types; gated for underground types. One row per input below 640px (Task 957 Review 2 F15). */}
      {showFloor && (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <NumberTextInput
            id="floor"
            label={t('floor')}
            value={formValues.floor}
            min={floorMin}
            max={200}
            placeholder="—"
            error={errors.floor}
            disabled={disabled}
            onChange={v => onChange({ floor: v })}
          />
          {showFloorsTotal && (
            <NumberTextInput
              id="total_floors"
              label={tc('floors_total_range')}
              value={formValues.total_floors}
              min={1}
              max={200}
              placeholder="—"
              disabled={disabled}
              onChange={v => onChange({ total_floors: v })}
            />
          )}
        </SimpleGrid>
      )}
    </>
  )
}
