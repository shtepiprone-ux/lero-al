'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPopularLocations } from '@/modules/locations/lib/queries'
import { Skeleton } from '@/components/ui/skeleton'

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

export function PopularLocations() {
  const locale = useLocale()
  const t = useTranslations('home')
  const [locations, setLocations] = useState<any[]>([])
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

  return (
    <div className="popular-locations grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {locations.map((loc, i) => (
        <Link
          key={loc.id}
          href={`/${locale}/listings?location_id=${loc.id}`}
          className={`relative flex flex-col justify-end h-28 rounded-xl overflow-hidden bg-gradient-to-br ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]} p-3 text-primary-foreground hover:opacity-90 transition-opacity`}
          data-track="listing_click"
        >
          <MapPin className="absolute top-3 right-3 h-4 w-4 opacity-70" />
          <span className="font-semibold text-sm leading-tight">{loc.name_al}</span>
          {loc.listing_count > 0 && (
            <span className="text-xs text-primary-foreground/80">{loc.listing_count} {t('listings_in_city')}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
