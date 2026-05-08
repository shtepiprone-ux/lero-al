'use client'

import { useTranslations, useLocale } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { formatPrice } from '@/lib/formatters'
import { MapPin, BedDouble, Bath, Maximize2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FormValues } from '@/modules/listings/types/form'

interface Props {
  data: FormValues
  error?: string
}

export function StepPreview({ data, error }: Props) {
  const t = useTranslations('listing')
  const locale = useLocale()

  const cover = data.images.find(i => i.is_cover) ?? data.images[0]

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground text-center">{t('create_listing_subtitle')}</p>

      {/* Preview card */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">

        {/* Cover image — AppImage owns the aspect-[16/9] container */}
        <AppImage variant="preview" src={cover?.url} alt={data.title}>
          {!cover && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Maximize2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="text-xs">
              {data.images.length} {t('photo_count')}
            </Badge>
          </div>
        </AppImage>

        {/* Info */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {t(data.listing_type as any)}
            </Badge>
            {data.property_type && (
              <Badge variant="outline" className="text-xs">
                {t(`property_type_${data.property_type}` as any)}
              </Badge>
            )}
          </div>

          <h2 className="font-semibold text-lg leading-snug">
            {data.title || <span className="text-muted-foreground italic">{t('field_title')}</span>}
          </h2>

          {data.price ? (
            <p className="text-2xl font-bold text-primary">
              {formatPrice(data.price, data.currency, locale)}
              {data.price_old && (
                <span className="text-sm font-normal text-muted-foreground line-through ml-3">
                  {formatPrice(data.price_old, data.currency, locale)}
                </span>
              )}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground border-t pt-3">
            {data.rooms != null && (
              <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{data.rooms}</span>
            )}
            {data.bathrooms != null && (
              <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{data.bathrooms}</span>
            )}
            {data.area_gross != null && (
              <span className="flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{data.area_gross} m²</span>
            )}
            {data.floor != null && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {data.floor}{data.total_floors ? `/${data.total_floors}` : ''}
              </span>
            )}
            {data.address && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{data.address}</span>
            )}
          </div>

          {data.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 border-t pt-3">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center rounded-xl bg-destructive/5 border border-destructive/20 p-3">
          {error}
        </p>
      )}
    </div>
  )
}
