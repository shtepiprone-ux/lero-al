'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { FieldRendererProps } from './fieldRegistry'

function NumInput({
  id, label, value, onChange, min, max,
}: { id: string; label: string; value?: number; onChange: (v: number | undefined) => void; min?: number; max?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        placeholder="—"
        onChange={e => {
          const n = Number(e.target.value)
          onChange(e.target.value === '' ? undefined : (isNaN(n) ? undefined : n))
        }}
        className="h-10 rounded-xl"
      />
    </div>
  )
}

export function FloorGroupField({ schema, formValues, errors, onChange }: FieldRendererProps) {
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
        <div className="flex items-center gap-3">
          <Checkbox
            id="multi_storey_building"
            checked={formValues.multi_storey_building}
            onCheckedChange={checked => {
              const on = checked === true
              onChange({
                multi_storey_building: on,
                floor: !on && formValues.floor !== undefined && formValues.floor < 0
                  ? undefined
                  : formValues.floor,
              })
            }}
          />
          <Label htmlFor="multi_storey_building" className="text-sm cursor-pointer select-none">
            {t('multi_storey_building')}
          </Label>
        </div>
      )}

      {/* Floor input — free for non-checkbox types; gated for underground types */}
      {showFloor && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-4">
            <NumInput
              id="floor"
              label={t('floor')}
              value={formValues.floor}
              onChange={v => onChange({ floor: v })}
              min={floorMin}
              max={200}
            />
            {showFloorsTotal && (
              <NumInput
                id="total_floors"
                label={tc('floors_total_range')}
                value={formValues.total_floors}
                onChange={v => onChange({ total_floors: v })}
                min={1}
                max={200}
              />
            )}
          </div>
          {errors.floor && <p className="text-xs text-destructive">{errors.floor}</p>}
        </div>
      )}
    </>
  )
}
