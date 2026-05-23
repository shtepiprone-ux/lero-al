'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import type { FormValues } from '@/modules/listings/types/form'

interface Props {
  data: FormValues
  onChange: (patch: Partial<FormValues>) => void
}

export function StepLocation({ data, onChange }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const { locations } = useLocations()

  const cityRegions = locations.filter(l => l.type === 'city' || l.type === 'region')

  return (
    <div className="flex flex-col gap-5">

      {/* Location combobox */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{tc('location')}</Label>
        <LocationCombobox
          locations={cityRegions}
          value={data.location_id ? String(data.location_id) : ''}
          onChange={id => onChange({ location_id: id ? Number(id) : undefined })}
          placeholder={tc('location')}
        />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="address" className="text-sm font-medium">{t('field_address')}</Label>
        <Input
          id="address"
          value={data.address ?? ''}
          onChange={e => onChange({ address: e.target.value || undefined })}
          placeholder={t('field_address_placeholder')}
          maxLength={300}
          className="h-11 rounded-xl"
        />
      </div>

      {/* Coordinates */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t('field_gps_label')}
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lat" className="text-xs text-muted-foreground">{t('field_lat')}</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={data.lat ?? ''}
              onChange={e => onChange({ lat: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="41.3275"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lng" className="text-xs text-muted-foreground">{t('field_lng')}</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={data.lng ?? ''}
              onChange={e => onChange({ lng: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="19.8187"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
