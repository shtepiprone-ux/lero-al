'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES, ROOMS_OPTIONS,
} from '@/modules/listings/constants'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import { YearCombobox } from '@/components/shared/YearCombobox'
import type { FormValues } from '@/modules/listings/types/form'

interface Props {
  data: FormValues
  onChange: (patch: Partial<FormValues>) => void
}

function NumInput({
  id, label, value, onChange, min, max, placeholder,
}: {
  id: string; label: string; value?: number
  onChange: (v: number | undefined) => void
  min?: number; max?: number; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        placeholder={placeholder ?? '—'}
        onChange={e => {
          const n = Number(e.target.value)
          onChange(e.target.value === '' ? undefined : (isNaN(n) ? undefined : n))
        }}
        className="h-10 rounded-xl"
      />
    </div>
  )
}

export function StepDetails({ data, onChange }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')

  const pt = data.property_type ?? ''
  const schema = getSchema(pt)

  function isVisible(key: ListingField): boolean {
    if (!pt) return true
    return schema.ui.fields.find(f => f.key === key)?.visible ?? false
  }

  return (
    <div className="flex flex-col gap-7">

      {/* Rooms */}
      {isVisible('rooms') && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{t('rooms')}</Label>
          <div className="flex gap-2 flex-wrap">
            {ROOMS_OPTIONS.map(r => (
              <Button
                key={r}
                type="button"
                variant="outline"
                onClick={() => onChange({ rooms: data.rooms === r ? undefined : r })}
                size="icon-lg"
                className={cn(
                  'rounded-xl',
                  data.rooms === r
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {r === 5 ? '5+' : r}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bedrooms + Bathrooms + Toilets — visibility driven by schema.ui.fields */}
      {(isVisible('bedrooms') || isVisible('bathrooms') || isVisible('toilets')) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {isVisible('bedrooms') && (
            <NumInput id="bedrooms" label={t('bedrooms')} value={data.bedrooms} onChange={v => onChange({ bedrooms: v })} min={0} max={50} />
          )}
          {isVisible('bathrooms') && (
            <NumInput id="bathrooms" label={t('bathrooms')} value={data.bathrooms} onChange={v => onChange({ bathrooms: v })} min={0} max={20} />
          )}
          {isVisible('toilets') && (
            <NumInput id="toilets" label={t('toilets')} value={data.toilets} onChange={v => onChange({ toilets: v })} min={0} max={20} />
          )}
        </div>
      )}

      {/* Area */}
      {isVisible('area') && (
        <div className="grid grid-cols-2 gap-4">
          <NumInput id="area_gross" label={t('area_gross_label')} value={data.area_gross} onChange={v => onChange({ area_gross: v })} min={1} placeholder="m²" />
          <NumInput id="area_net" label={t('area_net')} value={data.area_net} onChange={v => onChange({ area_net: v })} min={1} placeholder="m²" />
        </div>
      )}

      {/* Floor */}
      {isVisible('floor') && (
        <div className="grid grid-cols-2 gap-4">
          <NumInput id="floor" label={t('floor')} value={data.floor} onChange={v => onChange({ floor: v })} min={-5} max={200} />
          {isVisible('floors_total') && (
            <NumInput id="total_floors" label={tc('floors_total_range')} value={data.total_floors} onChange={v => onChange({ total_floors: v })} min={1} max={200} />
          )}
        </div>
      )}

      {/* Year built */}
      {isVisible('year_built') && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{t('year_built')}</Label>
          <YearCombobox
            value={data.year_built}
            onChange={v => onChange({ year_built: v })}
            placeholder={t('year_built_placeholder')}
            className="w-full"
          />
        </div>
      )}

      {/* Condition */}
      {isVisible('condition') && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{t('condition_label')}</Label>
          <div className="flex flex-col gap-1.5">
            {CONDITIONS.map(c => (
              <Button
                key={c.value}
                type="button"
                variant="outline"
                onClick={() => onChange({ condition: data.condition === c.value ? undefined : c.value })}
                className={cn(
                  'h-10 px-3 rounded-xl text-sm justify-start',
                  data.condition === c.value
                    ? 'bg-primary/10 text-primary border-primary/40 font-medium hover:bg-primary/10 hover:text-primary'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {t(c.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Heating */}
      {isVisible('heating') && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{t('heating_label')}</Label>
          <div className="flex flex-wrap gap-2">
            {HEATING_TYPES.map(h => (
              <Button
                key={h.value}
                type="button"
                variant={data.heating === h.value ? 'default' : 'outline'}
                size="lg"
                className="rounded-xl"
                onClick={() => onChange({ heating: data.heating === h.value ? undefined : h.value })}
              >
                {t(h.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Wall type */}
      {isVisible('wall_type') && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{t('wall_type_label')}</Label>
          <div className="flex flex-wrap gap-2">
            {WALL_TYPES.map(w => (
              <Button
                key={w.value}
                type="button"
                variant={data.wall_type === w.value ? 'default' : 'outline'}
                size="lg"
                className="rounded-xl"
                onClick={() => onChange({ wall_type: data.wall_type === w.value ? undefined : w.value })}
              >
                {t(w.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
