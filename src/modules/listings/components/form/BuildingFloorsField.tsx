'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldRendererProps } from './fieldRegistry'

export function BuildingFloorsField({ formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="total_floors" className="text-sm">{t('building_floors')}</Label>
      <Input
        id="total_floors"
        type="number"
        value={formValues.total_floors ?? ''}
        min={1}
        max={200}
        placeholder="—"
        onChange={e => {
          const n = Number(e.target.value)
          onChange({ total_floors: e.target.value === '' ? undefined : (isNaN(n) ? undefined : n) })
        }}
        className="h-10 rounded-xl"
      />
    </div>
  )
}
