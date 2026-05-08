'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldRendererProps } from './fieldRegistry'

function AreaInput({
  id, label, value, onChange,
}: { id: string; label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        min={1}
        placeholder="m²"
        onChange={e => {
          const n = Number(e.target.value)
          onChange(e.target.value === '' ? undefined : (isNaN(n) ? undefined : n))
        }}
        className="h-10 rounded-xl"
      />
    </div>
  )
}

export function AreaPairField({ formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <div className="grid grid-cols-2 gap-4">
      <AreaInput
        id="area_gross"
        label={t('area_gross_label')}
        value={formValues.area_gross}
        onChange={v => onChange({ area_gross: v })}
      />
      <AreaInput
        id="area_net"
        label={t('area_net')}
        value={formValues.area_net}
        onChange={v => onChange({ area_net: v })}
      />
    </div>
  )
}
