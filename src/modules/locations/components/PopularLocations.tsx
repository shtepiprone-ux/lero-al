'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPopularLocations } from '@/modules/locations/lib/queries'
import type { Location } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { AppImage } from '@/components/ui/AppImage'

const CITY_GRADIENTS = [
  'from-primary to-brand-950',
  'from-badge-new to-badge-new/70',
  'from-badge-premium to-badge-premium/70',
  'from-brand-950 to-primary',
  'from-primary/80 to-brand-800',
  'from-badge-new/90 to-brand-950',
  'from-badge-premium/90 to-brand-800',
  'from-brand-800 to-brand-950',
]

function getLocalizedName(loc: Location, locale: string): string {
  if (locale === 'sq') return loc.name_al
  return loc.name_en ?? loc.name_al
}

export function PopularLocations() {
  const locale = useLocale()
  const t = useTranslations('home')
  const [locations, setLocations] = useState<(Location & { listing_count: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPopularLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (locations.length === 0) return null

  return (
    <div className="popular-locations grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {locations.map((loc, i) => {
        const name = getLocalizedName(loc, locale)
        return (
          <Link
            key={loc.id}
            href={`/${locale}/listings?location_id=${loc.id}`}
            className="relative flex flex-col justify-end h-28 rounded-xl overflow-hidden p-3 text-primary-foreground hover:opacity-90 transition-opacity"
            data-track="listing_click"
          >
            {loc.image_url ? (
              <>
                <AppImage
                  variant="listing-thumb"
                  src={loc.image_url}
                  alt={name}
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]}`} />
            )}
            <div className="relative z-10">
              <MapPin className="absolute top-0 right-0 translate-y-[-80px] h-4 w-4 opacity-70" aria-hidden />
              <span className="font-semibold text-sm leading-tight block truncate">{name}</span>
              {loc.listing_count > 0 && (
                <span className="text-xs text-primary-foreground/80">{loc.listing_count} {t('listings_in_city')}</span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
