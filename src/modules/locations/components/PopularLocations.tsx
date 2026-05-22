import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppImage } from '@/components/ui/AppImage'
import type { Location } from '@/types/database'

/**
 * Popular Locations — Server Component (J.2 / Task 152).
 *
 * Fetches active featured locations (is_featured=true) server-side.
 * Returns null when no active rows — the entire section disappears cleanly
 * with no empty-state heading (Sprint 1 Task 101 pattern).
 *
 * Click target links to the listings page pre-filtered by location_id.
 * J.3 (Task 153) will finalize the canonical filter param.
 */
export async function PopularLocations() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
    .eq('is_featured', true)
    .eq('type', 'city')
    .order('display_order', { ascending: true })
    .order('name_al', { ascending: true })
    .limit(8)

  if (!locations?.length) return null

  const [t, locale] = await Promise.all([
    getTranslations('home'),
    getLocale(),
  ])

  return (
    <section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]">
      <div className="container-wide">
        <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">
          {t('popular_locations')}
        </h2>

        {/*
          Mobile: 2-col grid.
          sm: 3-col.
          md: 4-col.
          2xl: 4-col (maintains bound; no new 2xl step needed here since md already gives 4 cols).
        */}
        <div className="popular-locations grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(locations as Location[]).map((loc, i) => {
            const name = locale === 'sq' ? loc.name_al : (loc.name_en ?? loc.name_al)
            return (
              <Link
                key={loc.id}
                href={`/${locale}/listings?location_id=${loc.id}`}
                className="relative flex flex-col justify-end h-28 rounded-xl overflow-hidden p-3 text-primary-foreground hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                data-track="popular_location_click"
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
                  <div className={`absolute inset-0 ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]}`} />
                )}
                <div className="relative z-10">
                  <MapPin className="h-3.5 w-3.5 opacity-70 mb-0.5" aria-hidden />
                  <span className="font-semibold text-sm leading-tight block truncate">{name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Fallback gradient when no photo is set — semantic tokens only.
const CITY_GRADIENTS = [
  'bg-gradient-to-br from-primary to-brand-950',
  'bg-gradient-to-br from-badge-new to-badge-new/70',
  'bg-gradient-to-br from-badge-premium to-badge-premium/70',
  'bg-gradient-to-br from-brand-950 to-primary',
  'bg-gradient-to-br from-primary/80 to-brand-800',
  'bg-gradient-to-br from-badge-new/90 to-brand-950',
  'bg-gradient-to-br from-badge-premium/90 to-brand-800',
  'bg-gradient-to-br from-brand-800 to-brand-950',
]
