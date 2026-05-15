'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PROPERTY_TYPES } from '@/modules/listings/constants'
import type { FormValues } from '@/modules/listings/types/form'
import type { ListingType } from '@/types/database'

interface Props {
  data: FormValues
  onChange: (patch: Partial<FormValues>) => void
  errors: Partial<Record<keyof FormValues, string>>
}

export function StepBasicInfo({ data, onChange, errors }: Props) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-6">

      {/* Listing type */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{t('listing_type')}</Label>
        <div className="flex gap-3">
          {(['sale', 'rent'] as ListingType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ listing_type: type })}
              className={cn(
                'flex-1 h-11 rounded-xl border text-sm font-medium transition-all',
                data.listing_type === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary/40'
              )}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{t('property_type')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROPERTY_TYPES.map(pt => (
            <button
              key={pt.value}
              type="button"
              onClick={() => onChange({ property_type: pt.value })}
              className={cn(
                'h-10 px-3 rounded-xl border text-sm transition-all text-left',
                data.property_type === pt.value
                  ? 'bg-primary/10 text-primary border-primary/40 font-semibold'
                  : 'bg-background border-border hover:border-primary/40'
              )}
            >
              {t(pt.labelKey)}
            </button>
          ))}
        </div>
        {errors.property_type && <p className="text-xs text-destructive">{errors.property_type}</p>}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title" className="text-sm font-medium">
          {t('field_title')}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder={t('field_title_hint')}
          maxLength={150}
          className={cn('h-11 rounded-xl', errors.title && 'border-destructive')}
        />
        <div className="flex justify-between">
          {errors.title
            ? <p className="text-xs text-destructive">{errors.title}</p>
            : <p className="text-xs text-muted-foreground">{t('field_title_hint')}</p>
          }
          <p className="text-xs text-muted-foreground">{data.title.length}/150</p>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-sm font-medium">{t('field_description')}</Label>
        <Textarea
          id="description"
          value={data.description ?? ''}
          onChange={e => onChange({ description: e.target.value || undefined })}
          placeholder={t('field_description_placeholder')}
          rows={5}
          maxLength={5000}
          className="rounded-xl resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{(data.description ?? '').length}/5000</p>
      </div>

      {/* Price + currency */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          {t('field_price')}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="flex gap-3">
          {/* Currency toggle */}
          <div className="flex rounded-xl border overflow-hidden shrink-0">
            {(['ALL', 'EUR'] as const).map(cur => (
              <button
                key={cur}
                type="button"
                onClick={() => onChange({ currency: cur })}
                className={cn(
                  'px-4 h-11 text-sm font-semibold transition-colors',
                  data.currency === cur
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-muted'
                )}
              >
                {cur}
              </button>
            ))}
          </div>
          <Input
            type="number"
            value={data.price ?? ''}
            onChange={e => onChange({ price: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            min={0}
            className={cn('h-11 rounded-xl flex-1', errors.price && 'border-destructive')}
          />
        </div>
        {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
      </div>

      {/* Old price */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="price_old" className="text-sm font-medium">{t('field_price_old')}</Label>
        <Input
          id="price_old"
          type="number"
          value={data.price_old ?? ''}
          onChange={e => onChange({ price_old: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0"
          min={0}
          className="h-11 rounded-xl"
        />
      </div>
    </div>
  )
}
